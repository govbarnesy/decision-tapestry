import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

/**
 * Git History Analyzer Service
 * Analyzes Git repository history to extract file creation dates,
 * modification history, and commit metadata for decisions.
 */
export class GitAnalyzer {
  constructor(repoPath = process.cwd()) {
    this.repoPath = repoPath;
    this.cache = new Map();
  }

  /**
   * Check if the current directory is a Git repository
   */
  async isGitRepo() {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: this.repoPath });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the first commit date for a file (creation date)
   */
  async getFileCreationDate(filePath) {
    const cacheKey = `creation:${filePath}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Get the first commit that added this file
      const { stdout } = await execAsync(
        `git log --format='%aI' --reverse --follow -- "${filePath}" | head -1`,
        { cwd: this.repoPath }
      );
      
      const date = stdout.trim();
      if (date) {
        this.cache.set(cacheKey, date);
        return date;
      }
      return null;
    } catch (error) {
      console.error(`Error getting creation date for ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Get the last commit date for a file (last modification)
   */
  async getFileLastModifiedDate(filePath) {
    const cacheKey = `lastmod:${filePath}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { stdout } = await execAsync(
        `git log -1 --format='%aI' -- "${filePath}"`,
        { cwd: this.repoPath }
      );
      
      const date = stdout.trim();
      if (date) {
        this.cache.set(cacheKey, date);
        return date;
      }
      return null;
    } catch (error) {
      console.error(`Error getting last modified date for ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Get all commits that affected a file
   */
  async getFileCommits(filePath, limit = 10) {
    const cacheKey = `commits:${filePath}:${limit}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { stdout } = await execAsync(
        `git log --format='%H|%aI|%an|%s' -n ${limit} -- "${filePath}"`,
        { cwd: this.repoPath }
      );
      
      const commits = stdout.trim().split('\n')
        .filter(line => line)
        .map(line => {
          const [sha, date, author, message] = line.split('|');
          return {
            sha: sha.substring(0, 7), // Short SHA
            date,
            author,
            message,
            url: this.getCommitUrl(sha)
          };
        });
      
      this.cache.set(cacheKey, commits);
      return commits;
    } catch (error) {
      console.error(`Error getting commits for ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Get commit URL (GitHub format by default)
   */
  async getCommitUrl(sha) {
    try {
      const { stdout: remoteUrl } = await execAsync(
        'git config --get remote.origin.url',
        { cwd: this.repoPath }
      );
      
      const url = remoteUrl.trim();
      if (url.includes('github.com')) {
        // Convert SSH to HTTPS format
        const httpsUrl = url
          .replace('git@github.com:', 'https://github.com/')
          .replace('.git', '');
        return `${httpsUrl}/commit/${sha}`;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Analyze multiple files and get their Git history
   */
  async analyzeFiles(filePaths) {
    const results = new Map();
    
    for (const filePath of filePaths) {
      const absolutePath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(this.repoPath, filePath);
      
      // Check if file exists
      const exists = fs.existsSync(absolutePath);
      
      const fileInfo = {
        path: filePath,
        exists,
        status: exists ? 'existing' : 'missing',
        creationDate: null,
        lastModifiedDate: null,
        commits: []
      };

      if (exists || await this.hasGitHistory(filePath)) {
        fileInfo.creationDate = await this.getFileCreationDate(filePath);
        fileInfo.lastModifiedDate = await this.getFileLastModifiedDate(filePath);
        fileInfo.commits = await this.getFileCommits(filePath, 5);
        
        // Determine if file was deleted
        if (!exists && fileInfo.commits.length > 0) {
          fileInfo.status = 'deleted';
        }
      }
      
      results.set(filePath, fileInfo);
    }
    
    return results;
  }

  /**
   * Check if a file has Git history (even if deleted)
   */
  async hasGitHistory(filePath) {
    try {
      const { stdout } = await execAsync(
        `git log --oneline -1 -- "${filePath}"`,
        { cwd: this.repoPath }
      );
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get commit date range for a set of files
   */
  async getDateRangeForFiles(filePaths) {
    let firstDate = null;
    let lastDate = null;
    let totalCommits = 0;
    
    for (const filePath of filePaths) {
      const creationDate = await this.getFileCreationDate(filePath);
      const lastModDate = await this.getFileLastModifiedDate(filePath);
      const commits = await this.getFileCommits(filePath, 100);
      
      totalCommits += commits.length;
      
      if (creationDate && (!firstDate || new Date(creationDate) < new Date(firstDate))) {
        firstDate = creationDate;
      }
      
      if (lastModDate && (!lastDate || new Date(lastModDate) > new Date(lastDate))) {
        lastDate = lastModDate;
      }
    }
    
    return {
      first_commit_date: firstDate,
      last_commit_date: lastDate,
      commit_count: totalCommits,
      git_derived: true
    };
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const gitAnalyzer = new GitAnalyzer();