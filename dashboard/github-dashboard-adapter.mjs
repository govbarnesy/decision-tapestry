/**
 * GitHub Dashboard Adapter
 * 
 * This adapter allows the existing Decision Tapestry dashboard to work
 * with GitHub Issues as the backend instead of local decisions.yml files.
 */

import { GitHubDecisionsAPI } from '../services/github-decisions-api.mjs';
import { graphql } from '@octokit/graphql';
import { projectQueries, buildDecisionSearchQuery } from '../services/github-project-queries.mjs';

export class GitHubDashboardAdapter {
  constructor(token, owner, repo) {
    this.api = new GitHubDecisionsAPI(token, owner, repo);
    this.owner = owner;
    this.repo = repo;
    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
    });
    this.cache = new Map();
    this.webhookHandlers = new Map();
  }

  /**
   * Get all decisions formatted for the dashboard
   */
  async getDecisions(options = {}) {
    const cacheKey = JSON.stringify(options);
    
    // Check cache (5 minute TTL)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) {
        return cached.data;
      }
    }

    try {
      let decisions;
      
      if (options.projectNumber) {
        // Get decisions from a specific project
        decisions = await this.api.getProjectDecisions(options.projectNumber);
      } else if (options.search) {
        // Search for decisions
        decisions = await this.searchDecisions(options.search);
      } else {
        // Get all decisions
        decisions = await this.api.getAllDecisions();
      }

      // Apply filters
      if (options.status) {
        decisions = decisions.filter(d => d.status === options.status);
      }
      
      if (options.author) {
        decisions = decisions.filter(d => d.author === options.author);
      }
      
      if (options.labels) {
        decisions = decisions.filter(d => 
          options.labels.every(label => d.labels.includes(label))
        );
      }

      // Sort decisions
      decisions.sort((a, b) => {
        switch (options.sortBy) {
          case 'updated':
            return new Date(b.date.last_updated) - new Date(a.date.last_updated);
          case 'created':
            return new Date(b.date.decision_date) - new Date(a.date.decision_date);
          case 'id':
            return b.id - a.id;
          default:
            return 0;
        }
      });

      // Cache the results
      this.cache.set(cacheKey, {
        data: decisions,
        timestamp: Date.now()
      });

      return decisions;
    } catch (error) {
      console.error('Failed to get decisions:', error);
      throw error;
    }
  }

  /**
   * Search for decisions using GitHub search
   */
  async searchDecisions(query) {
    const searchQuery = buildDecisionSearchQuery({
      repo: `${this.owner}/${this.repo}`,
      text: query
    });

    const result = await this.graphqlClient(projectQueries.searchDecisions, {
      query: searchQuery
    });

    return result.search.nodes
      .filter(issue => issue.repository.owner.login === this.owner && 
                       issue.repository.name === this.repo)
      .map(issue => this.api.issueToDecision(issue));
  }

  /**
   * Get decision details with full timeline
   */
  async getDecisionDetails(decisionId) {
    const [decision, activity, prs] = await Promise.all([
      this.api.getDecision(decisionId),
      this.getDecisionActivity(decisionId),
      this.api.getDecisionPRs(decisionId)
    ]);

    return {
      ...decision,
      activity,
      implementation_prs: prs
    };
  }

  /**
   * Get decision activity timeline
   */
  async getDecisionActivity(decisionId) {
    const result = await this.graphqlClient(projectQueries.getDecisionActivity, {
      owner: this.owner,
      repo: this.repo,
      issueNumber: decisionId
    });

    const timeline = result.repository.issue.timelineItems.nodes;
    
    return timeline.map(item => {
      switch (item.__typename) {
        case 'IssueComment':
          return {
            type: 'comment',
            author: item.author.login,
            body: item.body,
            timestamp: item.createdAt
          };
          
        case 'CrossReferencedEvent':
          if (item.source?.__typename === 'PullRequest') {
            return {
              type: 'pr_reference',
              pr: {
                number: item.source.number,
                title: item.source.title,
                state: item.source.state,
                url: item.source.url,
                files: item.source.files?.nodes || []
              },
              timestamp: item.createdAt
            };
          }
          break;
          
        case 'LabeledEvent':
          return {
            type: 'labeled',
            label: item.label.name,
            actor: item.actor.login,
            timestamp: item.createdAt
          };
          
        case 'ClosedEvent':
          return {
            type: 'closed',
            actor: item.actor.login,
            reason: item.stateReason,
            timestamp: item.createdAt
          };
          
        case 'AssignedEvent':
          return {
            type: 'assigned',
            assignee: item.assignee.login,
            actor: item.actor.login,
            timestamp: item.createdAt
          };
      }
      
      return null;
    }).filter(Boolean);
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats() {
    const result = await this.graphqlClient(projectQueries.getRepositoryInsights, {
      owner: this.owner,
      repo: this.repo
    });

    const repo = result.repository;
    
    return {
      total_decisions: repo.issues.totalCount,
      total_commits: repo.defaultBranchRef.target.history.totalCount,
      total_prs: repo.pullRequests.totalCount,
      collaborators: repo.collaborators.totalCount,
      languages: repo.languages.edges.map(edge => ({
        name: edge.node.name,
        color: edge.node.color,
        percentage: (edge.size / repo.diskUsage) * 100
      })),
      stars: repo.stargazerCount,
      forks: repo.forkCount
    };
  }

  /**
   * Get available projects
   */
  async getProjects() {
    const result = await this.graphqlClient(projectQueries.listRepositoryProjects, {
      owner: this.owner,
      repo: this.repo
    });

    return result.repository.projectsV2.nodes;
  }

  /**
   * Set up webhook handling for real-time updates
   */
  setupWebhookHandler(eventType, handler) {
    if (!this.webhookHandlers.has(eventType)) {
      this.webhookHandlers.set(eventType, []);
    }
    this.webhookHandlers.get(eventType).push(handler);
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(event, payload) {
    // Invalidate relevant caches
    if (event === 'issues' || event === 'issue_comment') {
      this.cache.clear();
    }

    // Call registered handlers
    const handlers = this.webhookHandlers.get(event) || [];
    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`Webhook handler error for ${event}:`, error);
      }
    }
  }

  /**
   * Convert dashboard API calls to GitHub API calls
   */
  async handleDashboardRequest(endpoint, params) {
    switch (endpoint) {
      case '/api/decisions':
        return await this.getDecisions(params);
        
      case '/api/decision/:id':
        return await this.getDecisionDetails(params.id);
        
      case '/api/stats':
        return await this.getRepositoryStats();
        
      case '/api/projects':
        return await this.getProjects();
        
      case '/api/search':
        return await this.searchDecisions(params.query);
        
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }
  }

  /**
   * Export decisions for backup or migration
   */
  async exportDecisions(format = 'json') {
    const decisions = await this.getDecisions();
    
    if (format === 'yaml') {
      // Convert to YAML format compatible with old decisions.yml
      const yaml = {
        decisions: decisions.map(d => ({
          id: d.id,
          title: d.title,
          author: d.author,
          date: d.date.decision_date,
          status: d.status,
          rationale: d.rationale,
          tradeoffs: d.tradeoffs,
          affected_components: d.affected_components,
          tasks: d.tasks
        }))
      };
      
      const yamlLib = await import('js-yaml');
      return yamlLib.dump(yaml);
    }
    
    return JSON.stringify(decisions, null, 2);
  }
}