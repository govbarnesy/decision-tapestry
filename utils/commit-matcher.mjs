import { gitAnalyzer } from '../services/git-analyzer.mjs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Commit Matcher Utility
 * Matches Git commits to decisions based on various criteria including
 * affected files, commit messages, and time ranges.
 */
export class CommitMatcher {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Match commits to a decision based on multiple criteria
   * @param {Object} decision - The decision object
   * @returns {Array} Matched commits
   */
  async matchCommitsToDecision(decision) {
    const cacheKey = `decision:${decision.id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const matchedCommits = new Set();
    
    // 1. Match by affected components
    if (decision.affected_components && decision.affected_components.length > 0) {
      for (const component of decision.affected_components) {
        const commits = await gitAnalyzer.getFileCommits(component, 50);
        commits.forEach(commit => {
          matchedCommits.add(JSON.stringify(commit));
        });
      }
    }

    // 2. Match by keywords in commit messages
    const keywords = this.extractKeywords(decision);
    if (keywords.length > 0) {
      const keywordCommits = await this.searchCommitsByKeywords(keywords, decision.date);
      keywordCommits.forEach(commit => {
        matchedCommits.add(JSON.stringify(commit));
      });
    }

    // 3. Match by time range (if enhanced date object)
    if (decision.date && typeof decision.date === 'object') {
      const rangeCommits = await this.getCommitsInDateRange(
        decision.date.first_commit_date,
        decision.date.last_commit_date
      );
      rangeCommits.forEach(commit => {
        matchedCommits.add(JSON.stringify(commit));
      });
    }

    // Convert back from JSON strings to objects and deduplicate
    const commits = Array.from(matchedCommits)
      .map(str => JSON.parse(str))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    this.cache.set(cacheKey, commits);
    return commits;
  }

  /**
   * Extract keywords from a decision for commit matching
   * @param {Object} decision - The decision object
   * @returns {Array<string>} Keywords
   */
  extractKeywords(decision) {
    const keywords = [];
    
    // Extract from title
    if (decision.title) {
      // Remove common words and extract meaningful terms
      const titleWords = decision.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !this.isCommonWord(word));
      keywords.push(...titleWords);
    }

    // Add decision ID as a keyword
    keywords.push(`#${decision.id}`);
    keywords.push(`decision-${decision.id}`);
    keywords.push(`decision #${decision.id}`);

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Check if a word is too common to be useful as a keyword
   * @param {string} word - The word to check
   * @returns {boolean} True if common
   */
  isCommonWord(word) {
    const commonWords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'from',
      'have', 'been', 'will', 'into', 'over', 'under',
      'implement', 'update', 'create', 'add', 'remove', 'fix'
    ]);
    return commonWords.has(word);
  }

  /**
   * Search commits by keywords
   * @param {Array<string>} keywords - Keywords to search
   * @param {string} afterDate - Only search commits after this date
   * @returns {Array} Matching commits
   */
  async searchCommitsByKeywords(keywords, afterDate) {
    const commits = [];
    
    for (const keyword of keywords) {
      try {
        const dateFilter = afterDate ? `--since="${afterDate}"` : '';
        const { stdout } = await execAsync(
          `git log --format='%H|%aI|%an|%s' ${dateFilter} --grep="${keyword}" -i`,
          { cwd: process.cwd() }
        );
        
        const keywordCommits = stdout.trim().split('\n')
          .filter(line => line)
          .map(line => {
            const [sha, date, author, message] = line.split('|');
            return {
              sha: sha.substring(0, 7),
              date,
              author,
              message,
              matchedKeyword: keyword
            };
          });
        
        commits.push(...keywordCommits);
      } catch (error) {
        // Ignore errors for individual keyword searches
      }
    }
    
    return commits;
  }

  /**
   * Get commits within a date range
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @returns {Array} Commits in range
   */
  async getCommitsInDateRange(startDate, endDate) {
    if (!startDate || !endDate) return [];
    
    try {
      const { stdout } = await execAsync(
        `git log --format='%H|%aI|%an|%s' --since="${startDate}" --until="${endDate}"`,
        { cwd: process.cwd() }
      );
      
      return stdout.trim().split('\n')
        .filter(line => line)
        .map(line => {
          const [sha, date, author, message] = line.split('|');
          return {
            sha: sha.substring(0, 7),
            date,
            author,
            message
          };
        });
    } catch (error) {
      console.error('Error getting commits in date range:', error.message);
      return [];
    }
  }

  /**
   * Analyze commit patterns across multiple decisions
   * @param {Array<Object>} decisions - Array of decision objects
   * @returns {Object} Analysis results
   */
  async analyzeCommitPatterns(decisions) {
    const analysis = {
      totalCommits: 0,
      commitsByDecision: new Map(),
      authorContributions: new Map(),
      timeline: []
    };

    for (const decision of decisions) {
      const commits = await this.matchCommitsToDecision(decision);
      analysis.commitsByDecision.set(decision.id, commits);
      analysis.totalCommits += commits.length;

      // Track author contributions
      for (const commit of commits) {
        const count = analysis.authorContributions.get(commit.author) || 0;
        analysis.authorContributions.set(commit.author, count + 1);
      }
    }

    // Create timeline
    const allCommits = [];
    for (const [decisionId, commits] of analysis.commitsByDecision) {
      for (const commit of commits) {
        allCommits.push({
          ...commit,
          decisionId
        });
      }
    }
    
    analysis.timeline = allCommits
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return analysis;
  }

  /**
   * Find decisions that might be related based on commit overlap
   * @param {Array<Object>} decisions - Array of decision objects
   * @returns {Array} Related decision pairs
   */
  async findRelatedDecisions(decisions) {
    const commitToDecisions = new Map();
    
    // Build a map of commits to decisions
    for (const decision of decisions) {
      const commits = await this.matchCommitsToDecision(decision);
      for (const commit of commits) {
        if (!commitToDecisions.has(commit.sha)) {
          commitToDecisions.set(commit.sha, []);
        }
        commitToDecisions.get(commit.sha).push(decision.id);
      }
    }

    // Find decisions that share commits
    const related = [];
    for (const [sha, decisionIds] of commitToDecisions) {
      if (decisionIds.length > 1) {
        // Create pairs of related decisions
        for (let i = 0; i < decisionIds.length - 1; i++) {
          for (let j = i + 1; j < decisionIds.length; j++) {
            related.push({
              decision1: decisionIds[i],
              decision2: decisionIds[j],
              sharedCommit: sha
            });
          }
        }
      }
    }

    return related;
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const commitMatcher = new CommitMatcher();