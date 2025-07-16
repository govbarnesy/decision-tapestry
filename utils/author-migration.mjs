/**
 * Author Migration Utility
 * Handles progressive enhancement of string authors to GitHub user objects
 * Maintains backward compatibility while enabling gradual migration
 */

import { promises as fs } from 'fs';
import yaml from 'js-yaml';
import { authorService } from '../services/author-service.mjs';

class AuthorMigration {
  constructor() {
    this.stats = {
      total: 0,
      enhanced: 0,
      failed: 0,
      skipped: 0
    };
  }
  
  /**
   * Migrates authors in a decisions.yml file
   * @param {string} filePath - Path to decisions.yml file
   * @param {Object} options - Migration options
   * @returns {Promise<Object>} Migration results
   */
  async migrateFile(filePath, options = {}) {
    const {
      dryRun = false,
      backupFirst = true,
      enhanceOnly = [],
      skipAuthors = [],
      interactive = false
    } = options;
    
    try {
      // Read the YAML file
      const content = await fs.readFile(filePath, 'utf8');
      const data = yaml.load(content);
      
      if (!data) {
        throw new Error('Invalid YAML file');
      }
      
      // Backup if requested
      if (backupFirst && !dryRun) {
        const backupPath = `${filePath}.backup-${Date.now()}`;
        await fs.writeFile(backupPath, content);
        console.log(`Created backup: ${backupPath}`);
      }
      
      // Process decisions
      if (data.decisions && Array.isArray(data.decisions)) {
        await this.processDecisions(data.decisions, {
          enhanceOnly,
          skipAuthors,
          interactive
        });
      }
      
      // Process backlog items
      if (data.backlog && Array.isArray(data.backlog)) {
        await this.processBacklog(data.backlog, {
          enhanceOnly,
          skipAuthors,
          interactive
        });
      }
      
      // Write back if not dry run
      if (!dryRun) {
        const updatedContent = yaml.dump(data, {
          lineWidth: -1,
          quotingType: '"',
          forceQuotes: false,
          noRefs: true
        });
        
        await fs.writeFile(filePath, updatedContent);
        console.log('Migration completed successfully');
      }
      
      return {
        ...this.stats,
        dryRun
      };
      
    } catch (error) {
      console.error('Migration failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Processes decisions array for author migration
   * @param {Array} decisions - Array of decision objects
   * @param {Object} options - Processing options
   */
  async processDecisions(decisions, options) {
    for (const decision of decisions) {
      if (decision.author) {
        const enhanced = await this.enhanceAuthor(decision.author, options);
        if (enhanced !== decision.author) {
          decision.author = enhanced;
        }
      }
    }
  }
  
  /**
   * Processes backlog array for author migration
   * @param {Array} backlog - Array of backlog items
   * @param {Object} options - Processing options
   */
  async processBacklog(backlog, options) {
    for (const item of backlog) {
      if (item.author) {
        const enhanced = await this.enhanceAuthor(item.author, options);
        if (enhanced !== item.author) {
          item.author = enhanced;
        }
      }
    }
  }
  
  /**
   * Enhances a single author
   * @param {string|Object} author - Author to enhance
   * @param {Object} options - Enhancement options
   * @returns {Promise<string|Object>} Enhanced author or original
   */
  async enhanceAuthor(author, options) {
    this.stats.total++;
    
    // Skip if already enhanced
    if (typeof author === 'object' && author.github_username) {
      this.stats.skipped++;
      return author;
    }
    
    // Check skip list
    if (options.skipAuthors.includes(author)) {
      this.stats.skipped++;
      return author;
    }
    
    // Check enhance only list
    if (options.enhanceOnly.length > 0 && !options.enhanceOnly.includes(author)) {
      this.stats.skipped++;
      return author;
    }
    
    // Interactive mode - ask for confirmation
    if (options.interactive) {
      console.log(`\nEnhance author "${author}"?`);
      const response = await this.prompt('(y/n/s[kip all]): ');
      
      if (response.toLowerCase() === 's') {
        options.interactive = false;
        this.stats.skipped++;
        return author;
      }
      
      if (response.toLowerCase() !== 'y') {
        this.stats.skipped++;
        return author;
      }
    }
    
    try {
      const enhanced = await authorService.getAuthorInfo(author);
      
      // Check if enhancement was successful
      if (typeof enhanced === 'object' && enhanced.github_username) {
        this.stats.enhanced++;
        console.log(`✓ Enhanced: ${author} → ${enhanced.github_username} (${enhanced.display_name})`);
        return enhanced;
      } else {
        this.stats.failed++;
        console.log(`✗ Could not enhance: ${author}`);
        return author;
      }
      
    } catch (error) {
      this.stats.failed++;
      console.error(`✗ Error enhancing ${author}:`, error.message);
      return author;
    }
  }
  
  /**
   * Simple prompt helper for interactive mode
   * @param {string} question - Question to ask
   * @returns {Promise<string>} User input
   */
  async prompt(question) {
    return new Promise((resolve) => {
      process.stdout.write(question);
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
  }
  
  /**
   * Validates that the author schema is properly handled
   * @param {Object} data - Decisions data
   * @returns {Array<Object>} Validation issues found
   */
  validateAuthors(data) {
    const issues = [];
    
    // Check decisions
    if (data.decisions && Array.isArray(data.decisions)) {
      data.decisions.forEach((decision, index) => {
        if (!authorService.isValidAuthor(decision.author)) {
          issues.push({
            type: 'decision',
            index,
            id: decision.id,
            issue: 'Invalid author format'
          });
        }
      });
    }
    
    // Check backlog
    if (data.backlog && Array.isArray(data.backlog)) {
      data.backlog.forEach((item, index) => {
        if (item.author && !authorService.isValidAuthor(item.author)) {
          issues.push({
            type: 'backlog',
            index,
            id: item.id,
            issue: 'Invalid author format'
          });
        }
      });
    }
    
    return issues;
  }
  
  /**
   * Generates a migration report
   * @param {Object} data - Decisions data
   * @returns {Object} Migration report
   */
  async generateReport(data) {
    const report = {
      stringAuthors: [],
      enhancedAuthors: [],
      potentialGitHubUsers: [],
      nonGitHubUsers: []
    };
    
    const allAuthors = new Set();
    
    // Collect all authors
    if (data.decisions) {
      data.decisions.forEach(d => d.author && allAuthors.add(d.author));
    }
    if (data.backlog) {
      data.backlog.forEach(b => b.author && allAuthors.add(b.author));
    }
    
    // Analyze each unique author
    for (const author of allAuthors) {
      if (typeof author === 'string') {
        report.stringAuthors.push(author);
        
        const username = authorService.extractGitHubUsername(author);
        if (username) {
          report.potentialGitHubUsers.push({
            original: author,
            username
          });
        } else {
          report.nonGitHubUsers.push(author);
        }
      } else if (typeof author === 'object' && author.github_username) {
        report.enhancedAuthors.push(author);
      }
    }
    
    return report;
  }
}

// Export singleton instance
export const authorMigration = new AuthorMigration();

// Also export the class for testing
export { AuthorMigration };

// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 65
// Task: Create GitHub API client with authentication and rate limiting
// Timestamp: 2025-07-16T05:15:22.023Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 65
// Task: Implement GitHub user lookup service with caching
// Timestamp: 2025-07-16T05:15:22.062Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 65
// Task: Support oneOf author schema (string | GitHub user object)
// Timestamp: 2025-07-16T05:15:22.089Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 65
// Task: Create progressive author enhancement (string → GitHub object)
// Timestamp: 2025-07-16T05:15:22.115Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 65
// Task: Add graceful fallback for non-GitHub users
// Timestamp: 2025-07-16T05:15:22.140Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 65
// Task: Implement author caching to prevent rate limiting
// Timestamp: 2025-07-16T05:15:22.165Z

