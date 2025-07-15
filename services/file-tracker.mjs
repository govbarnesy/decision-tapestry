import fs from 'fs/promises';
import path from 'path';
import { gitAnalyzer } from './git-analyzer.mjs';

/**
 * File Tracker Service
 * Tracks file status (created, modified, deleted, missing) across decisions
 * and maintains a comprehensive view of repository file state changes.
 */
export class FileTracker {
  constructor(repoPath = process.cwd()) {
    this.repoPath = repoPath;
    this.fileStatusCache = new Map();
  }

  /**
   * Track the status of files for a decision
   * @param {Array<string>} filePaths - List of file paths to track
   * @returns {Object} File status categorization
   */
  async trackFiles(filePaths) {
    const status = {
      created: [],
      modified: [],
      deleted: [],
      missing: []
    };

    if (!filePaths || filePaths.length === 0) {
      return status;
    }

    for (const filePath of filePaths) {
      const fileStatus = await this.getFileStatus(filePath);
      status[fileStatus].push(filePath);
    }

    return status;
  }

  /**
   * Determine the status of a single file
   * @param {string} filePath - Path to the file
   * @returns {string} Status: 'created', 'modified', 'deleted', or 'missing'
   */
  async getFileStatus(filePath) {
    // Check cache first
    if (this.fileStatusCache.has(filePath)) {
      return this.fileStatusCache.get(filePath);
    }

    const absolutePath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(this.repoPath, filePath);

    // Check if file currently exists
    const exists = await this.fileExists(absolutePath);
    
    // Check Git history
    const hasHistory = await gitAnalyzer.hasGitHistory(filePath);
    
    if (!hasHistory) {
      // No Git history - file is missing (never existed in repo)
      this.fileStatusCache.set(filePath, 'missing');
      return 'missing';
    }

    if (!exists) {
      // Has Git history but doesn't exist - file was deleted
      this.fileStatusCache.set(filePath, 'deleted');
      return 'deleted';
    }

    // File exists and has history - check if created or modified
    const commits = await gitAnalyzer.getFileCommits(filePath, 100);
    
    if (commits.length === 1) {
      // Only one commit - file was created
      this.fileStatusCache.set(filePath, 'created');
      return 'created';
    } else {
      // Multiple commits - file was modified
      this.fileStatusCache.set(filePath, 'modified');
      return 'modified';
    }
  }

  /**
   * Check if a file exists
   * @param {string} filePath - Path to check
   * @returns {boolean} True if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get detailed file information including Git metadata
   * @param {string} filePath - Path to the file
   * @returns {Object} Detailed file information
   */
  async getFileDetails(filePath) {
    const status = await this.getFileStatus(filePath);
    const absolutePath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(this.repoPath, filePath);

    const details = {
      path: filePath,
      status,
      exists: await this.fileExists(absolutePath),
      gitHistory: false,
      creationDate: null,
      lastModifiedDate: null,
      commitCount: 0,
      firstCommit: null,
      lastCommit: null
    };

    if (await gitAnalyzer.hasGitHistory(filePath)) {
      details.gitHistory = true;
      details.creationDate = await gitAnalyzer.getFileCreationDate(filePath);
      details.lastModifiedDate = await gitAnalyzer.getFileLastModifiedDate(filePath);
      
      const commits = await gitAnalyzer.getFileCommits(filePath, 100);
      details.commitCount = commits.length;
      
      if (commits.length > 0) {
        details.firstCommit = commits[commits.length - 1]; // Oldest
        details.lastCommit = commits[0]; // Newest
      }
    }

    return details;
  }

  /**
   * Track status changes between two sets of files
   * @param {Array<string>} oldFiles - Previous file list
   * @param {Array<string>} newFiles - Current file list
   * @returns {Object} Changes between the two sets
   */
  async trackChanges(oldFiles, newFiles) {
    const oldSet = new Set(oldFiles);
    const newSet = new Set(newFiles);

    const changes = {
      added: [],
      removed: [],
      unchanged: []
    };

    // Find added files
    for (const file of newFiles) {
      if (!oldSet.has(file)) {
        changes.added.push(file);
      } else {
        changes.unchanged.push(file);
      }
    }

    // Find removed files
    for (const file of oldFiles) {
      if (!newSet.has(file)) {
        changes.removed.push(file);
      }
    }

    return changes;
  }

  /**
   * Generate a summary report for multiple decisions
   * @param {Array<Object>} decisions - Array of decision objects
   * @returns {Object} Summary statistics
   */
  async generateSummaryReport(decisions) {
    const summary = {
      totalFiles: new Set(),
      byStatus: {
        created: new Set(),
        modified: new Set(),
        deleted: new Set(),
        missing: new Set()
      },
      byDecision: new Map()
    };

    for (const decision of decisions) {
      if (!decision.affected_components) continue;

      const fileStatus = await this.trackFiles(decision.affected_components);
      summary.byDecision.set(decision.id, fileStatus);

      // Aggregate files
      for (const [status, files] of Object.entries(fileStatus)) {
        for (const file of files) {
          summary.totalFiles.add(file);
          summary.byStatus[status].add(file);
        }
      }
    }

    // Convert sets to arrays and counts
    return {
      totalFiles: summary.totalFiles.size,
      byStatus: {
        created: Array.from(summary.byStatus.created),
        modified: Array.from(summary.byStatus.modified),
        deleted: Array.from(summary.byStatus.deleted),
        missing: Array.from(summary.byStatus.missing)
      },
      byDecision: Object.fromEntries(summary.byDecision)
    };
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.fileStatusCache.clear();
  }
}

// Export singleton instance
export const fileTracker = new FileTracker();