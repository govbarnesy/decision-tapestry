import { gitAnalyzer } from "./git-analyzer.mjs";
import { fileTracker } from "./file-tracker.mjs";
import { commitMatcher } from "../utils/commit-matcher.mjs";
import { enhanceDecisionWithGitData } from "../utils/git-utils.mjs";
import githubService from "./github-service.mjs";

/**
 * Decision Enhancer Service
 * Enhances decision objects with Git history metadata including:
 * - Enhanced date objects with commit dates
 * - GitHub metadata with commits array
 * - File status tracking
 */
export class DecisionEnhancer {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Enhance a single decision with Git metadata
   * @param {Object} decision - The decision object
   * @param {Object} options - Enhancement options
   * @returns {Object} Enhanced decision
   */
  async enhanceDecision(decision, options = {}) {
    const {
      includeCommits = true,
      includeFileStatus = true,
      includeGitHubData = true,
      maxCommits = 10,
      useCache = true,
    } = options;

    // Check cache
    const cacheKey = `${decision.id}:${JSON.stringify(options)}`;
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Start with basic Git data enhancement
    let enhanced = await enhanceDecisionWithGitData(decision);

    // Add matched commits to github_metadata
    if (includeCommits && enhanced.affected_components?.length > 0) {
      const matcher = commitMatcher;
      const matchedCommits = await matcher.matchCommitsToDecision(enhanced);

      // Ensure github_metadata exists
      enhanced.github_metadata = enhanced.github_metadata || {};

      // Add commits array with proper formatting
      enhanced.github_metadata.commits = await Promise.all(
        matchedCommits.slice(0, maxCommits).map(async (commit) => ({
          sha: commit.sha,
          message: commit.message,
          url: commit.url || (await gitAnalyzer.getCommitUrl(commit.sha)),
          date: commit.date,
          author: commit.author,
        })),
      );
    }

    // Add file status tracking
    if (includeFileStatus && enhanced.affected_components?.length > 0) {
      const tracker = fileTracker;
      const fileStatus = await tracker.trackFiles(enhanced.affected_components);

      // Ensure github_metadata exists
      enhanced.github_metadata = enhanced.github_metadata || {};
      enhanced.github_metadata.file_status = fileStatus;
    }

    // Add GitHub API data
    if (includeGitHubData && githubService.getStatus().configured) {
      await this.enhanceWithGitHubData(enhanced);
    }

    // Cache the result
    if (useCache) {
      this.cache.set(cacheKey, enhanced);
    }

    return enhanced;
  }

  /**
   * Enhance multiple decisions in batch
   * @param {Array<Object>} decisions - Array of decision objects
   * @param {Object} options - Enhancement options
   * @returns {Array<Object>} Enhanced decisions
   */
  async enhanceDecisions(decisions, options = {}) {
    const enhanced = [];

    // Process in parallel for better performance
    const promises = decisions.map((decision) =>
      this.enhanceDecision(decision, options),
    );

    const results = await Promise.all(promises);
    return results;
  }

  /**
   * Generate a Git activity summary for a decision
   * @param {Object} decision - The decision object
   * @returns {Object} Activity summary
   */
  async generateActivitySummary(decision) {
    const enhanced = await this.enhanceDecision(decision);

    const summary = {
      decisionId: decision.id,
      title: decision.title,
      gitActivity: {
        hasGitData: false,
        dateRange: null,
        commitCount: 0,
        authors: new Set(),
        fileStats: {
          total: 0,
          created: 0,
          modified: 0,
          deleted: 0,
          missing: 0,
        },
      },
    };

    // Extract date range
    if (enhanced.date && typeof enhanced.date === "object") {
      summary.gitActivity.hasGitData = true;
      summary.gitActivity.dateRange = {
        first: enhanced.date.first_commit_date,
        last: enhanced.date.last_commit_date,
      };
      summary.gitActivity.commitCount = enhanced.date.commit_count || 0;
    }

    // Extract commit authors
    if (enhanced.github_metadata?.commits) {
      enhanced.github_metadata.commits.forEach((commit) => {
        summary.gitActivity.authors.add(commit.author);
      });
    }

    // Extract file statistics
    if (enhanced.github_metadata?.file_status) {
      const status = enhanced.github_metadata.file_status;
      summary.gitActivity.fileStats = {
        total: enhanced.affected_components?.length || 0,
        created: status.created?.length || 0,
        modified: status.modified?.length || 0,
        deleted: status.deleted?.length || 0,
        missing: status.missing?.length || 0,
      };
    }

    // Convert Set to Array for JSON serialization
    summary.gitActivity.authors = Array.from(summary.gitActivity.authors);

    return summary;
  }

  /**
   * Find decisions without Git metadata that could be enhanced
   * @param {Array<Object>} decisions - Array of decision objects
   * @returns {Array<Object>} Decisions that can be enhanced
   */
  async findEnhanceable(decisions) {
    const enhanceable = [];

    for (const decision of decisions) {
      // Check if decision has affected components but no Git metadata
      if (decision.affected_components?.length > 0) {
        const hasEnhancedDate =
          decision.date && typeof decision.date === "object";
        const hasGitMetadata =
          decision.github_metadata?.commits ||
          decision.github_metadata?.file_status;

        if (!hasEnhancedDate || !hasGitMetadata) {
          enhanceable.push({
            id: decision.id,
            title: decision.title,
            componentsCount: decision.affected_components.length,
            missingEnhancements: {
              enhancedDate: !hasEnhancedDate,
              commits: !decision.github_metadata?.commits,
              fileStatus: !decision.github_metadata?.file_status,
            },
          });
        }
      }
    }

    return enhanceable;
  }

  /**
   * Enhance decision with GitHub API data
   * @param {Object} decision - The decision object to enhance
   * @returns {Promise<void>}
   */
  async enhanceWithGitHubData(decision) {
    try {
      // Get repository info from git
      const repoUrl = await gitAnalyzer.getRemoteUrl();
      if (!repoUrl) return;

      // Parse owner and repo from URL
      const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^.]+)/);
      if (!match) return;

      const [, owner, repo] = match;

      // Ensure github_metadata exists
      decision.github_metadata = decision.github_metadata || {};

      // Fetch GitHub data in parallel
      const [pullRequests, issues, release] = await Promise.all([
        githubService.getPullRequestsForDecision(owner, repo, decision.id),
        githubService.getIssuesForDecision(owner, repo, decision.id),
        githubService.getReleaseForDecision(owner, repo, decision.id)
      ]);

      // Add pull requests if found
      if (pullRequests.length > 0) {
        decision.github_metadata.pull_requests = pullRequests;
      }

      // Add issues if found
      if (issues.length > 0) {
        decision.github_metadata.issues = issues;
      }

      // Add release info if found
      if (release) {
        decision.github_metadata.release = release;
      }

      // Add commit status checks for recent commits
      if (decision.github_metadata.commits?.length > 0) {
        // Check status for the most recent commit
        const recentCommit = decision.github_metadata.commits[0];
        if (recentCommit.sha) {
          const status = await githubService.getCommitStatus(owner, repo, recentCommit.sha);
          if (status) {
            decision.github_metadata.commit_status = status;
          }
        }
      }

      // Add workflow runs for the branch
      if (decision.github_metadata.commits?.length > 0) {
        const workflowRuns = await githubService.getWorkflowRuns(owner, repo, {
          limit: 5
        });
        
        if (workflowRuns.length > 0) {
          // Find runs related to our commits
          const commitShas = decision.github_metadata.commits.map(c => c.sha);
          const relatedRuns = workflowRuns.filter(run => 
            commitShas.includes(run.head_sha)
          );
          
          if (relatedRuns.length > 0) {
            decision.github_metadata.workflow_runs = relatedRuns;
          }
        }
      }

    } catch (error) {
      console.error(`Failed to enhance decision ${decision.id} with GitHub data:`, error.message);
      // Continue without GitHub enhancement
    }
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const decisionEnhancer = new DecisionEnhancer();


// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 76
// Task: Create git-truth-resolver.mjs for data hierarchy management
// Timestamp: 2025-07-16T04:36:43.476Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 76
// Task: Implement conflict detection between git and manual data
// Timestamp: 2025-07-16T04:36:43.499Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 76
// Task: Add intelligent conflict resolution strategies
// Timestamp: 2025-07-16T04:36:43.521Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 76
// Task: Update decision-enhancer.mjs to use git-first hierarchy
// Timestamp: 2025-07-16T04:36:43.543Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 76
// Task: Add validation for affected_components vs actual git files
// Timestamp: 2025-07-16T04:36:43.566Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 66
// Task: Support oneOf date schema (string | enhanced date object)
// Timestamp: 2025-07-16T05:22:40.080Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 66
// Task: Create Git history analyzer for file creation dates
// Timestamp: 2025-07-16T05:22:40.131Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 66
// Task: Implement commit time lookup for affected_components
// Timestamp: 2025-07-16T05:22:40.179Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 66
// Task: Add file status tracking (created, modified, deleted, missing)
// Timestamp: 2025-07-16T05:22:40.225Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 66
// Task: Create commit-to-decision matching service
// Timestamp: 2025-07-16T05:22:40.275Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 66
// Task: Generate github_metadata.commits array with key commits
// Timestamp: 2025-07-16T05:22:40.323Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 66
// Task: Add github_metadata.file_status for component tracking
// Timestamp: 2025-07-16T05:22:40.370Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 66
// Task: Add performance optimization for large repositories
// Timestamp: 2025-07-16T05:22:40.418Z

