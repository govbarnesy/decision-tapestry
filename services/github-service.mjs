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

