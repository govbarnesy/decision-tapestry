/**
 * GitHub Configuration Module
 * Manages GitHub API authentication and configuration settings
 * 
 * Environment Variables:
 * - GITHUB_TOKEN: Personal access token for GitHub API authentication
 * - GITHUB_API_URL: Custom GitHub API URL (defaults to api.github.com)
 * - GITHUB_RATE_LIMIT_BUFFER: Buffer for rate limit (defaults to 100)
 */

export const githubConfig = {
  // Authentication token from environment variable
  token: process.env.GITHUB_TOKEN || '',
  
  // API configuration
  apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
  
  // Repository information
  repository: {
    owner: 'govbarnesy',
    repo: 'decision-tapestry'
  },
  
  // Rate limiting configuration
  rateLimiting: {
    // Number of requests to keep in reserve
    buffer: parseInt(process.env.GITHUB_RATE_LIMIT_BUFFER || '100', 10),
    
    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    
    // Whether to wait when rate limited
    waitOnRateLimit: true
  },
  
  // Cache configuration
  cache: {
    // TTL for user data cache (1 hour)
    userTTL: 60 * 60 * 1000,
    
    // TTL for repository data cache (5 minutes)
    repoTTL: 5 * 60 * 1000,
    
    // Maximum cache size
    maxSize: 1000
  },
  
  // Request configuration
  request: {
    // Timeout for API requests (30 seconds)
    timeout: 30000,
    
    // User agent for API requests
    userAgent: 'Decision-Tapestry/1.0'
  }
};

/**
 * Validates the GitHub configuration
 * @returns {boolean} True if configuration is valid
 */
export function validateConfig() {
  if (!githubConfig.token) {
    console.warn('WARNING: No GitHub token configured. Set GITHUB_TOKEN environment variable for authenticated requests.');
    console.warn('Without authentication, you are limited to 60 requests per hour.');
    return false;
  }
  
  // Validate token format (basic check)
  if (!githubConfig.token.match(/^(ghp_|github_pat_|gho_|ghu_|ghs_|ghr_)/)) {
    console.warn('WARNING: GitHub token format appears invalid. Tokens should start with ghp_, github_pat_, etc.');
    return false;
  }
  
  return true;
}

/**
 * Gets the repository full name in owner/repo format
 * @returns {string} The repository full name
 */
export function getRepositoryFullName() {
  return `${githubConfig.repository.owner}/${githubConfig.repository.repo}`;
}

/**
 * Creates headers for GitHub API requests
 * @returns {Object} Headers object for fetch requests
 */
export function createHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': githubConfig.request.userAgent
  };
  
  if (githubConfig.token) {
    headers['Authorization'] = `Bearer ${githubConfig.token}`;
  }
  
  return headers;
}