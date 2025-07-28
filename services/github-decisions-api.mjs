/**
 * GitHub Decisions API
 *
 * This module provides a simplified interface to use GitHub Issues and Projects
 * as the backend for architectural decisions, replacing the local decisions.yml
 */

import { Octokit } from "@octokit/rest";
import { graphql } from "@octokit/graphql";

export class GitHubDecisionsAPI {
  constructor(token, owner, repo) {
    this.owner = owner;
    this.repo = repo;
    this.octokit = new Octokit({ auth: token });
    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
    });
  }

  /**
   * Convert a GitHub issue to a decision object
   */
  issueToDecision(issue) {
    // Parse the issue body to extract decision fields
    const body = issue.body || "";
    const sections = this.parseIssueSections(body);

    // Extract tasks from the body
    const tasks = this.extractTasks(
      sections.tasks || sections["implementation tasks"] || "",
    );

    // Get related PRs from the issue
    const relatedPRs = this.extractReferences(
      sections["implementation prs"] || "",
    );
    const relatedDecisions = this.extractReferences(
      sections["related decisions"] || "",
    );

    return {
      id: issue.number,
      title: issue.title.replace(/^\[Decision\]\s*/i, ""),
      author: issue.user.login,
      date: {
        decision_date: issue.created_at,
        last_updated: issue.updated_at,
        closed_date: issue.closed_at,
      },
      status: this.mapIssueStateToStatus(issue.state, issue.labels),
      context: sections.context || "",
      decision: sections.decision || "",
      rationale: this.parseList(sections.rationale || ""),
      tradeoffs: this.parseList(sections.tradeoffs || ""),
      alternatives: this.parseList(sections["alternatives considered"] || ""),
      consequences: this.parseList(sections.consequences || ""),
      affected_components: this.parseList(
        sections["affected components"] || "",
      ),
      tasks: tasks,
      related_decisions: relatedDecisions,
      implementation_prs: relatedPRs,
      labels: issue.labels.map((l) => l.name),
      url: issue.html_url,
      // GitHub metadata
      github_metadata: {
        issue_number: issue.number,
        milestone: issue.milestone?.title,
        assignees: issue.assignees.map((a) => a.login),
        comments_count: issue.comments,
        reactions: {
          total: issue.reactions.total_count,
          "+1": issue.reactions["+1"],
          "-1": issue.reactions["-1"],
        },
      },
    };
  }

  /**
   * Parse issue body sections
   */
  parseIssueSections(body) {
    const sections = {};
    const lines = body.split("\n");
    let currentSection = null;
    let sectionContent = [];

    for (const line of lines) {
      // Check if this is a section header
      const headerMatch = line.match(/^#+\s+(.+)|^(.+):\s*$/);
      if (headerMatch) {
        // Save previous section
        if (currentSection) {
          sections[currentSection.toLowerCase()] = sectionContent
            .join("\n")
            .trim();
        }
        // Start new section
        currentSection = (headerMatch[1] || headerMatch[2]).trim();
        sectionContent = [];
      } else if (currentSection) {
        sectionContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      sections[currentSection.toLowerCase()] = sectionContent.join("\n").trim();
    }

    return sections;
  }

  /**
   * Extract tasks with their completion status
   */
  extractTasks(tasksText) {
    const tasks = [];
    const lines = tasksText.split("\n");

    for (const line of lines) {
      const taskMatch = line.match(/^[-*]\s*\[([ x])\]\s*(.+)/i);
      if (taskMatch) {
        tasks.push({
          description: taskMatch[2].trim(),
          status: taskMatch[1].toLowerCase() === "x" ? "Completed" : "Pending",
        });
      }
    }

    return tasks;
  }

  /**
   * Extract issue/PR references
   */
  extractReferences(text) {
    const references = [];
    const matches = text.matchAll(/#(\d+)/g);

    for (const match of matches) {
      references.push(parseInt(match[1]));
    }

    return references;
  }

  /**
   * Parse a text list into an array
   */
  parseList(text) {
    const items = [];
    const lines = text.split("\n");

    for (const line of lines) {
      const cleaned = line.replace(/^[-*]\s*/, "").trim();
      if (cleaned) {
        items.push(cleaned);
      }
    }

    return items;
  }

  /**
   * Map GitHub issue state and labels to decision status
   */
  mapIssueStateToStatus(state, labels) {
    const labelNames = labels.map((l) => l.name.toLowerCase());

    if (labelNames.includes("superseded")) return "Superseded";
    if (labelNames.includes("rejected")) return "Rejected";
    if (labelNames.includes("accepted")) return "Accepted";
    if (labelNames.includes("in-progress")) return "In Progress";
    if (state === "closed") return "Completed";

    return "Proposed";
  }

  /**
   * Get all decisions (issues with 'decision' label)
   */
  async getAllDecisions() {
    try {
      const issues = await this.octokit.paginate(
        this.octokit.issues.listForRepo,
        {
          owner: this.owner,
          repo: this.repo,
          labels: "decision",
          state: "all",
          per_page: 100,
        },
      );

      return issues.map((issue) => this.issueToDecision(issue));
    } catch (error) {
      console.error("Failed to fetch decisions:", error);
      throw error;
    }
  }

  /**
   * Get a single decision by ID
   */
  async getDecision(decisionId) {
    try {
      const { data: issue } = await this.octokit.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: decisionId,
      });

      return this.issueToDecision(issue);
    } catch (error) {
      console.error(`Failed to fetch decision #${decisionId}:`, error);
      throw error;
    }
  }

  /**
   * Get related pull requests for a decision
   */
  async getDecisionPRs(decisionId) {
    try {
      // Search for PRs that reference this decision
      const { data } = await this.octokit.search.issuesAndPullRequests({
        q: `type:pr repo:${this.owner}/${this.repo} "#${decisionId}" in:body`,
      });

      return data.items.map((pr) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        url: pr.html_url,
        author: pr.user.login,
        created_at: pr.created_at,
        merged_at: pr.pull_request?.merged_at,
        files_changed: pr.pull_request?.changed_files,
      }));
    } catch (error) {
      console.error(`Failed to fetch PRs for decision #${decisionId}:`, error);
      return [];
    }
  }

  /**
   * Create a new decision issue
   */
  async createDecision(decision) {
    const body = this.formatDecisionBody(decision);

    try {
      const { data: issue } = await this.octokit.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: `[Decision] ${decision.title}`,
        body: body,
        labels: ["decision", "architecture", decision.status?.toLowerCase()],
      });

      return this.issueToDecision(issue);
    } catch (error) {
      console.error("Failed to create decision:", error);
      throw error;
    }
  }

  /**
   * Format decision object into issue body
   */
  formatDecisionBody(decision) {
    const sections = [];

    if (decision.context) {
      sections.push(`## Context\n${decision.context}`);
    }

    if (decision.decision) {
      sections.push(`## Decision\n${decision.decision}`);
    }

    if (decision.rationale?.length) {
      sections.push(
        `## Rationale\n${decision.rationale.map((r) => `- ${r}`).join("\n")}`,
      );
    }

    if (decision.tradeoffs?.length) {
      sections.push(
        `## Tradeoffs\n${decision.tradeoffs.map((t) => `- ${t}`).join("\n")}`,
      );
    }

    if (decision.alternatives?.length) {
      sections.push(
        `## Alternatives Considered\n${decision.alternatives.map((a) => `- ${a}`).join("\n")}`,
      );
    }

    if (decision.consequences?.length) {
      sections.push(
        `## Consequences\n${decision.consequences.map((c) => `- ${c}`).join("\n")}`,
      );
    }

    if (decision.affected_components?.length) {
      sections.push(
        `## Affected Components\n${decision.affected_components.map((c) => `- ${c}`).join("\n")}`,
      );
    }

    if (decision.tasks?.length) {
      sections.push(
        `## Implementation Tasks\n${decision.tasks
          .map(
            (t) =>
              `- [${t.status === "Completed" ? "x" : " "}] ${t.description}`,
          )
          .join("\n")}`,
      );
    }

    if (decision.related_decisions?.length) {
      sections.push(
        `## Related Decisions\n${decision.related_decisions.map((id) => `#${id}`).join(", ")}`,
      );
    }

    if (decision.implementation_prs?.length) {
      sections.push(
        `## Implementation PRs\n${decision.implementation_prs.map((id) => `#${id}`).join(", ")}`,
      );
    }

    return sections.join("\n\n");
  }

  /**
   * Use GitHub Projects v2 to organize decisions
   */
  async getProjectDecisions(projectNumber) {
    const query = `
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          projectV2(number: $number) {
            title
            items(first: 100) {
              nodes {
                id
                content {
                  ... on Issue {
                    number
                    title
                    body
                    state
                    labels(first: 10) {
                      nodes {
                        name
                      }
                    }
                    author {
                      login
                    }
                    createdAt
                    updatedAt
                    closedAt
                  }
                }
                fieldValues(first: 20) {
                  nodes {
                    ... on ProjectV2ItemFieldTextValue {
                      text
                      field {
                        ... on ProjectV2Field {
                          name
                        }
                      }
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      field {
                        ... on ProjectV2SingleSelectField {
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const result = await this.graphqlClient(query, {
        owner: this.owner,
        repo: this.repo,
        number: projectNumber,
      });

      return result.repository.projectV2.items.nodes
        .filter(
          (item) =>
            item.content &&
            item.content.labels.nodes.some((l) => l.name === "decision"),
        )
        .map((item) => {
          const decision = this.issueToDecision(item.content);

          // Add custom field values from the project
          decision.project_fields = {};
          item.fieldValues.nodes.forEach((field) => {
            if (field.field?.name) {
              decision.project_fields[field.field.name] =
                field.text || field.name;
            }
          });

          return decision;
        });
    } catch (error) {
      console.error("Failed to fetch project decisions:", error);
      throw error;
    }
  }
}
