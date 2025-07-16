/**
 * Author Service Module
 * Manages author data with GitHub integration and caching
 * Supports both string authors and enhanced GitHub user objects
 */

import { githubService } from "./github-service.mjs";
import { githubConfig } from "../config/github-config.mjs";

class AuthorService {
  constructor() {
    // In-memory cache for author data
    this.cache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      errors: 0,
    };

    // Track GitHub username extraction patterns
    this.githubPatterns = [
      // Direct GitHub username (alphanumeric, hyphens, single hyphen not at start/end)
      /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/,

      // Email-like format with potential GitHub username
      /^([a-zA-Z0-9-]+)@github\.com$/i,

      // "Name (username)" format
      /^.*\(([a-zA-Z0-9-]+)\)$/,

      // "username@domain" format - extract username part
      /^([a-zA-Z0-9-]+)@/,
    ];
  }

  /**
   * Gets author information, attempting GitHub enhancement if possible
   * @param {string|Object} author - Author string or existing author object
   * @returns {Promise<Object>} Enhanced author object or fallback format
   */
  async getAuthorInfo(author) {
    // If already an object with GitHub data, return as-is
    if (typeof author === "object" && author.github_username) {
      return author;
    }

    // Extract display name from various formats
    const displayName =
      typeof author === "object" ? author.display_name : author;

    if (!displayName) {
      return this.createFallbackAuthor("Unknown Author");
    }

    // Check cache first
    const cached = this.getCached(displayName);
    if (cached) {
      this.cacheStats.hits++;
      return cached;
    }

    this.cacheStats.misses++;

    // Try to extract GitHub username and enhance
    const username = this.extractGitHubUsername(displayName);
    if (username) {
      const enhanced = await this.enhanceWithGitHub(username, displayName);
      if (enhanced) {
        this.setCache(displayName, enhanced);
        return enhanced;
      }
    }

    // Return fallback format for non-GitHub users
    const fallback = this.createFallbackAuthor(displayName);
    this.setCache(displayName, fallback);
    return fallback;
  }

  /**
   * Extracts potential GitHub username from author string
   * @param {string} authorString - Author string to parse
   * @returns {string|null} Extracted username or null
   */
  extractGitHubUsername(authorString) {
    if (!authorString || typeof authorString !== "string") {
      return null;
    }

    const trimmed = authorString.trim();

    // Try each pattern
    for (const pattern of this.githubPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        // Return the captured group if exists, otherwise the full match
        const username = match[1] || match[0];

        // Validate it's a valid GitHub username (1-39 chars, alphanumeric + hyphens)
        if (/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username)) {
          return username;
        }
      }
    }

    // Special handling for known patterns
    // "FirstName LastName" -> try "FirstnameLastname" as username
    if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(trimmed)) {
      const username = trimmed.replace(/\s+/g, "").toLowerCase();
      return username;
    }

    return null;
  }

  /**
   * Enhances author with GitHub user data
   * @param {string} username - GitHub username
   * @param {string} displayName - Original display name
   * @returns {Promise<Object|null>} Enhanced author object or null
   */
  async enhanceWithGitHub(username, displayName) {
    try {
      const githubUser = await githubService.getUser(username);

      if (!githubUser) {
        return null;
      }

      // Create enhanced author object matching schema
      return {
        github_username: githubUser.github_username,
        display_name: githubUser.display_name || displayName,
        avatar_url: githubUser.avatar_url,
        profile_url: githubUser.profile_url,
        email: githubUser.email || undefined, // Only include if available
      };
    } catch (error) {
      console.error(`Failed to enhance author ${username}:`, error.message);
      this.cacheStats.errors++;
      return null;
    }
  }

  /**
   * Creates a fallback author object for non-GitHub users
   * @param {string} displayName - Display name for the author
   * @returns {Object} Fallback author object
   */
  createFallbackAuthor(displayName) {
    // Return a simple string to maintain backward compatibility
    // This will be stored as a string in the YAML
    return displayName;
  }

  /**
   * Gets cached author data
   * @param {string} key - Cache key (usually display name)
   * @returns {Object|null} Cached data or null
   */
  getCached(key) {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    const age = Date.now() - cached.timestamp;
    if (age > githubConfig.cache.userTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Sets cached author data
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  setCache(key, data) {
    // Enforce cache size limit
    if (this.cache.size >= githubConfig.cache.maxSize) {
      // Remove oldest entry (FIFO)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clears the author cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      errors: 0,
    };
  }

  /**
   * Gets cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      ...this.cacheStats,
      size: this.cache.size,
      hitRate:
        this.cacheStats.hits /
          (this.cacheStats.hits + this.cacheStats.misses) || 0,
    };
  }

  /**
   * Validates an author object against the schema
   * @param {string|Object} author - Author to validate
   * @returns {boolean} True if valid
   */
  isValidAuthor(author) {
    // String authors are always valid (backward compatibility)
    if (typeof author === "string") {
      return true;
    }

    // Object authors must have required fields
    if (typeof author === "object" && author !== null) {
      return (
        typeof author.github_username === "string" &&
        typeof author.display_name === "string"
      );
    }

    return false;
  }

  /**
   * Batch processes multiple authors
   * @param {Array<string|Object>} authors - Array of authors to process
   * @returns {Promise<Array<Object>>} Array of processed authors
   */
  async processAuthors(authors) {
    if (!Array.isArray(authors)) {
      return [];
    }

    // Process in parallel but with concurrency limit to avoid rate limits
    const BATCH_SIZE = 10;
    const results = [];

    for (let i = 0; i < authors.length; i += BATCH_SIZE) {
      const batch = authors.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((author) => this.getAuthorInfo(author)),
      );
      results.push(...batchResults);
    }

    return results;
  }
}

// Export singleton instance
export const authorService = new AuthorService();

// Also export the class for testing
export { AuthorService };
