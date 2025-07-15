import { gitAnalyzer } from '../services/git-analyzer.mjs';
import path from 'path';

/**
 * Git utility functions for Decision Tapestry
 * Provides helper functions for Git history analysis and commit lookups
 */

/**
 * Analyze affected components and get commit time information
 * @param {Array<string>} affectedComponents - List of file paths
 * @returns {Object} Analysis results with date ranges and file status
 */
export async function analyzeAffectedComponents(affectedComponents) {
  if (!affectedComponents || affectedComponents.length === 0) {
    return {
      dateRange: null,
      fileStatus: {
        created: [],
        modified: [],
        deleted: [],
        missing: []
      }
    };
  }

  // Analyze all files
  const fileAnalysis = await gitAnalyzer.analyzeFiles(affectedComponents);
  
  // Get date range
  const dateRange = await gitAnalyzer.getDateRangeForFiles(affectedComponents);
  
  // Categorize files by status
  const fileStatus = {
    created: [],
    modified: [],
    deleted: [],
    missing: []
  };
  
  for (const [filePath, info] of fileAnalysis) {
    switch (info.status) {
      case 'existing':
        // Determine if created or modified based on commit count
        if (info.commits.length === 1) {
          fileStatus.created.push(filePath);
        } else {
          fileStatus.modified.push(filePath);
        }
        break;
      case 'deleted':
        fileStatus.deleted.push(filePath);
        break;
      case 'missing':
        fileStatus.missing.push(filePath);
        break;
    }
  }
  
  return {
    dateRange,
    fileStatus,
    fileAnalysis
  };
}

/**
 * Enhance a decision object with Git metadata
 * @param {Object} decision - The decision object
 * @returns {Object} Enhanced decision with Git metadata
 */
export async function enhanceDecisionWithGitData(decision) {
  if (!decision.affected_components || decision.affected_components.length === 0) {
    return decision;
  }

  const analysis = await analyzeAffectedComponents(decision.affected_components);
  
  // Create enhanced decision object
  const enhanced = { ...decision };
  
  // If date is a simple string and we have Git data, convert to enhanced format
  if (typeof decision.date === 'string' && analysis.dateRange.first_commit_date) {
    enhanced.date = {
      decision_date: decision.date,
      ...analysis.dateRange
    };
  }
  
  // Add GitHub metadata
  enhanced.github_metadata = enhanced.github_metadata || {};
  
  // Add file status
  enhanced.github_metadata.file_status = analysis.fileStatus;
  
  // Add key commits (first 5 from each affected file)
  const allCommits = [];
  const seenShas = new Set();
  
  for (const [filePath, info] of analysis.fileAnalysis) {
    for (const commit of info.commits) {
      if (!seenShas.has(commit.sha)) {
        seenShas.add(commit.sha);
        allCommits.push(commit);
      }
    }
  }
  
  // Sort by date and take most recent
  enhanced.github_metadata.commits = allCommits
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
  
  return enhanced;
}

/**
 * Get commit history for a specific time range
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @returns {Array} List of commits in the range
 */
export async function getCommitsInRange(startDate, endDate) {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
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
    console.error('Error getting commits in range:', error.message);
    return [];
  }
}

/**
 * Check if Git is available in the current environment
 */
export async function isGitAvailable() {
  return await gitAnalyzer.isGitRepo();
}

/**
 * Get the repository root path
 */
export async function getRepoRoot() {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync('git rev-parse --show-toplevel');
    return stdout.trim();
  } catch {
    return process.cwd();
  }
}