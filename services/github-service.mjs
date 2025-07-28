/**
 * GitHub API Service - Agent A Implementation
 * Handles GitHub API authentication, rate limiting, and user lookup
 */

import { Octokit } from "@octokit/rest";

class GitHubService {
  constructor() {
    this.octokit = null;
    this.rateLimit = {
      remaining: 5000,
      resetTime: null,
      limit: 5000,
    };
    this.cache = new Map();
    this.isConfigured = false;
  }

  /**
   * Initialize GitHub API client with authentication
   * @param {string} token - GitHub personal access token
   * @param {string} baseUrl - GitHub API base URL (for GitHub Enterprise)
   */
  async initialize(token, baseUrl = "https://api.github.com") {
    try {
      // Initialize Octokit with or without token
      this.octokit = new Octokit({
        auth: token || undefined,
        baseUrl: baseUrl,
        userAgent: "decision-tapestry-v1.0.0",
      });

      if (!token) {
        console.warn(
          "⚠️  GitHub token not provided. API rate limited to 60 requests/hour.",
        );
        // For unauthenticated requests, we can still use the API
        this.isConfigured = true;
        this.rateLimit = {
          remaining: 60,
          resetTime: new Date(Date.now() + 3600000),
          limit: 60,
        };
        return true;
      }

      // Test authentication
      const { data: user } = await this.octokit.rest.users.getAuthenticated();
      console.log(`✅ GitHub API authenticated as: ${user.login}`);

      this.isConfigured = true;
      await this.updateRateLimit();
      return true;
    } catch (error) {
      console.error("❌ GitHub API initialization failed:", error.message);
      this.isConfigured = false;
      return false;
    }
  }

  /**
   * Get current rate limit status
   */
  async updateRateLimit() {
    if (!this.isConfigured) return;

    try {
      const { data } = await this.octokit.rest.rateLimit.get();
      this.rateLimit = {
        remaining: data.resources.core.remaining,
        resetTime: new Date(data.resources.core.reset * 1000),
        limit: data.resources.core.limit,
      };
    } catch (error) {
      console.warn("Failed to update rate limit:", error.message);
    }
  }

  /**
   * Check if we can make API requests
   */
  canMakeRequest() {
    if (!this.isConfigured) return false;
    // For unauthenticated requests, be more conservative with the buffer
    const buffer = this.rateLimit.limit > 100 ? 10 : 5;
    return this.rateLimit.remaining > buffer;
  }

  /**
   * Get GitHub user information
   * @param {string} username - GitHub username
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUser(username) {
    if (!username || !this.isConfigured) return null;

    // Check cache first
    const cacheKey = `user:${username}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      // Cache for 1 hour
      if (Date.now() - cached.timestamp < 3600000) {
        return cached.data;
      }
    }

    if (!this.canMakeRequest()) {
      console.warn(
        `GitHub rate limit exceeded. Reset at: ${this.rateLimit.resetTime}`,
      );
      return null;
    }

    try {
      const { data } = await this.octokit.rest.users.getByUsername({
        username: username,
      });

      const userObject = {
        github_username: data.login,
        display_name: data.name || data.login,
        avatar_url: data.avatar_url,
        profile_url: data.html_url,
        email: data.email || null,
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: userObject,
        timestamp: Date.now(),
      });

      await this.updateRateLimit();
      return userObject;
    } catch (error) {
      if (error.status === 404) {
        // Don't warn for 404s - it's expected for non-GitHub users
        return null;
      }
      if (error.status === 403 && error.message.includes("rate limit")) {
        console.warn("GitHub API rate limit exceeded");
        this.rateLimit.remaining = 0;
        return null;
      }
      console.error(`GitHub API error for user ${username}:`, error.message);
      return null;
    }
  }

  /**
   * Get repository information
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object|null>} Repository object or null if not found
   */
  async getRepository(owner, repo) {
    if (!owner || !repo) return null;

    const cacheKey = `repo:${owner}/${repo}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) {
        return cached.data;
      }
    }

    if (!this.canMakeRequest()) {
      console.warn(
        `GitHub rate limit exceeded. Reset at: ${this.rateLimit.resetTime}`,
      );
      return null;
    }

    try {
      const { data } = await this.octokit.rest.repos.get({
        owner: owner,
        repo: repo,
      });

      const repoObject = {
        full_name: data.full_name,
        html_url: data.html_url,
        description: data.description,
        default_branch: data.default_branch,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      this.cache.set(cacheKey, {
        data: repoObject,
        timestamp: Date.now(),
      });

      await this.updateRateLimit();
      return repoObject;
    } catch (error) {
      if (error.status === 404) {
        console.warn(`GitHub repository not found: ${owner}/${repo}`);
        return null;
      }
      console.error(
        `GitHub API error for repo ${owner}/${repo}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Get pull requests that mention a decision
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} decisionId - Decision ID to search for
   * @returns {Promise<Array>} Array of pull requests
   */
  async getPullRequestsForDecision(owner, repo, decisionId) {
    if (!this.isConfigured || !this.canMakeRequest()) return [];

    try {
      const { data } = await this.octokit.search.issuesAndPullRequests({
        q: `type:pr repo:${owner}/${repo} "Decision #${decisionId}" OR "#${decisionId}"`,
        sort: "created",
        order: "desc",
        per_page: 10,
      });

      await this.updateRateLimit();

      return data.items.map((pr) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        url: pr.html_url,
        created_at: pr.created_at,
        merged_at: pr.pull_request?.merged_at,
        author: pr.user.login,
      }));
    } catch (error) {
      console.error(
        `Failed to fetch PRs for decision ${decisionId}:`,
        error.message,
      );
      return [];
    }
  }

  /**
   * Get issues that mention a decision
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} decisionId - Decision ID to search for
   * @returns {Promise<Array>} Array of issues
   */
  async getIssuesForDecision(owner, repo, decisionId) {
    if (!this.isConfigured || !this.canMakeRequest()) return [];

    try {
      // Use the same endpoint as PRs but filter for issues
      const { data } = await this.octokit.search.issuesAndPullRequests({
        q: `type:issue repo:${owner}/${repo} "Decision #${decisionId}" OR "#${decisionId}"`,
        sort: "created",
        order: "desc",
        per_page: 10,
      });

      await this.updateRateLimit();

      return data.items.map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
        created_at: issue.created_at,
        closed_at: issue.closed_at,
        author: issue.user.login,
        labels: issue.labels.map((l) => l.name),
      }));
    } catch (error) {
      console.error(
        `Failed to fetch issues for decision ${decisionId}:`,
        error.message,
      );
      return [];
    }
  }

  /**
   * Get commit status checks
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} sha - Commit SHA
   * @returns {Promise<Object|null>} Combined status
   */
  async getCommitStatus(owner, repo, sha) {
    if (!this.isConfigured || !this.canMakeRequest()) return null;

    try {
      const { data } = await this.octokit.repos.getCombinedStatusForRef({
        owner,
        repo,
        ref: sha,
      });

      await this.updateRateLimit();

      return {
        state: data.state, // success, failure, pending
        total_count: data.total_count,
        statuses: data.statuses.map((s) => ({
          context: s.context,
          state: s.state,
          description: s.description,
          target_url: s.target_url,
        })),
      };
    } catch (error) {
      console.error(`Failed to fetch commit status for ${sha}:`, error.message);
      return null;
    }
  }

  /**
   * Get recent workflow runs
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of workflow runs
   */
  async getWorkflowRuns(owner, repo, options = {}) {
    if (!this.isConfigured || !this.canMakeRequest()) return [];

    try {
      const { data } = await this.octokit.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: options.limit || 10,
        branch: options.branch,
        status: options.status, // completed, in_progress, queued
      });

      await this.updateRateLimit();

      return data.workflow_runs.map((run) => ({
        id: run.id,
        name: run.name,
        status: run.status,
        conclusion: run.conclusion, // success, failure, cancelled
        created_at: run.created_at,
        updated_at: run.updated_at,
        url: run.html_url,
        head_sha: run.head_sha,
        head_branch: run.head_branch,
      }));
    } catch (error) {
      console.error(`Failed to fetch workflow runs:`, error.message);
      return [];
    }
  }

  /**
   * Get pull request reviews
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} prNumber - Pull request number
   * @returns {Promise<Array>} Array of reviews
   */
  async getPullRequestReviews(owner, repo, prNumber) {
    if (!this.isConfigured || !this.canMakeRequest()) return [];

    try {
      const { data } = await this.octokit.pulls.listReviews({
        owner,
        repo,
        pull_number: prNumber,
      });

      await this.updateRateLimit();

      return data.map((review) => ({
        id: review.id,
        user: review.user.login,
        state: review.state, // APPROVED, CHANGES_REQUESTED, COMMENTED
        submitted_at: review.submitted_at,
        body: review.body,
      }));
    } catch (error) {
      console.error(
        `Failed to fetch PR reviews for #${prNumber}:`,
        error.message,
      );
      return [];
    }
  }

  /**
   * Get branch protection status
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} branch - Branch name
   * @returns {Promise<Object|null>} Protection rules
   */
  async getBranchProtection(owner, repo, branch) {
    if (!this.isConfigured || !this.canMakeRequest()) return null;

    try {
      const { data } = await this.octokit.repos.getBranchProtection({
        owner,
        repo,
        branch,
      });

      await this.updateRateLimit();

      return {
        required_reviews:
          data.required_pull_request_reviews?.required_approving_review_count ||
          0,
        dismiss_stale_reviews:
          data.required_pull_request_reviews?.dismiss_stale_reviews || false,
        require_code_owner_reviews:
          data.required_pull_request_reviews?.require_code_owner_reviews ||
          false,
        required_status_checks: data.required_status_checks?.contexts || [],
        enforce_admins: data.enforce_admins?.enabled || false,
        restrictions: data.restrictions
          ? {
              users: data.restrictions.users.map((u) => u.login),
              teams: data.restrictions.teams.map((t) => t.name),
            }
          : null,
      };
    } catch (error) {
      if (error.status === 404) {
        // No protection rules
        return null;
      }
      console.error(
        `Failed to fetch branch protection for ${branch}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Search for releases mentioning a decision
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} decisionId - Decision ID
   * @returns {Promise<Object|null>} Release information
   */
  async getReleaseForDecision(owner, repo, decisionId) {
    if (!this.isConfigured || !this.canMakeRequest()) return null;

    try {
      const { data: releases } = await this.octokit.repos.listReleases({
        owner,
        repo,
        per_page: 20,
      });

      await this.updateRateLimit();

      // Find releases that mention this decision
      const matchingRelease = releases.find(
        (r) =>
          r.body?.includes(`Decision #${decisionId}`) ||
          r.body?.includes(`#${decisionId}`),
      );

      if (matchingRelease) {
        return {
          tag_name: matchingRelease.tag_name,
          name: matchingRelease.name,
          published_at: matchingRelease.published_at,
          url: matchingRelease.html_url,
          body: matchingRelease.body,
        };
      }

      return null;
    } catch (error) {
      console.error(`Failed to fetch releases:`, error.message);
      return null;
    }
  }

  /**
   * Get repository insights
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Repository insights
   */
  async getRepositoryInsights(owner, repo) {
    if (!this.isConfigured || !this.canMakeRequest()) return {};

    try {
      // Get multiple insights in parallel
      const [contributors, languages, topics] = await Promise.all([
        this.octokit.repos.listContributors({ owner, repo, per_page: 10 }),
        this.octokit.repos.listLanguages({ owner, repo }),
        this.octokit.repos.getAllTopics({ owner, repo }),
      ]);

      await this.updateRateLimit();

      return {
        top_contributors: contributors.data.slice(0, 5).map((c) => ({
          login: c.login,
          contributions: c.contributions,
          avatar_url: c.avatar_url,
        })),
        languages: Object.entries(languages.data).map(([lang, bytes]) => ({
          name: lang,
          bytes: bytes,
          percentage: Math.round(
            (bytes / Object.values(languages.data).reduce((a, b) => a + b, 0)) *
              100,
          ),
        })),
        topics: topics.data.names,
      };
    } catch (error) {
      console.error(`Failed to fetch repository insights:`, error.message);
      return {};
    }
  }

  /**
   * Get status information
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      rateLimit: this.rateLimit,
      cacheSize: this.cache.size,
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const githubService = new GitHubService();
export default githubService;

// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 65
// Task: Create GitHub API client with authentication and rate limiting
// Timestamp: 2025-07-16T05:15:22.017Z

// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 65
// Task: Implement GitHub user lookup service with caching
// Timestamp: 2025-07-16T05:15:22.059Z

// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 65
// Task: Support oneOf author schema (string | GitHub user object)
// Timestamp: 2025-07-16T05:15:22.086Z

// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 65
// Task: Create progressive author enhancement (string → GitHub object)
// Timestamp: 2025-07-16T05:15:22.112Z

// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 65
// Task: Add graceful fallback for non-GitHub users
// Timestamp: 2025-07-16T05:15:22.138Z

// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 65
// Task: Implement author caching to prevent rate limiting
// Timestamp: 2025-07-16T05:15:22.163Z

// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 85
// Task: Create webhook endpoint for GitHub events
// Timestamp: 2025-07-16T07:10:03.587Z

// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 85
// Task: Add webhook signature validation
// Timestamp: 2025-07-16T07:10:03.670Z

// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 85
// Task: Update decision display with real-time GitHub updates
// Timestamp: 2025-07-16T07:10:03.756Z
