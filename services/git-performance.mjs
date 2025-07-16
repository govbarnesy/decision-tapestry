import { exec } from "child_process";
import { promisify } from "util";
import { gitAnalyzer } from "./git-analyzer.mjs";

const execAsync = promisify(exec);

/**
 * Git Performance Optimization Service
 * Provides performance optimizations for Git operations in large repositories
 */
export class GitPerformance {
  constructor() {
    this.batchCache = new Map();
    this.repoStats = null;
  }

  /**
   * Get repository statistics for optimization decisions
   */
  async getRepoStats() {
    if (this.repoStats) {
      return this.repoStats;
    }

    try {
      // Get total number of commits
      const { stdout: commitCount } = await execAsync(
        "git rev-list --count HEAD",
        { cwd: process.cwd() },
      );

      // Get number of files
      const { stdout: fileList } = await execAsync("git ls-files | wc -l", {
        cwd: process.cwd(),
      });

      // Get repository size
      const { stdout: repoSize } = await execAsync("du -sh .git | cut -f1", {
        cwd: process.cwd(),
      });

      this.repoStats = {
        totalCommits: parseInt(commitCount.trim()),
        totalFiles: parseInt(fileList.trim()),
        repoSize: repoSize.trim(),
        isLarge:
          parseInt(commitCount.trim()) > 10000 ||
          parseInt(fileList.trim()) > 5000,
      };

      return this.repoStats;
    } catch (error) {
      console.error("Error getting repo stats:", error.message);
      return {
        totalCommits: 0,
        totalFiles: 0,
        repoSize: "unknown",
        isLarge: false,
      };
    }
  }

  /**
   * Batch process multiple file histories for better performance
   * @param {Array<string>} filePaths - List of file paths
   * @returns {Map} File path to history mapping
   */
  async batchGetFileHistories(filePaths) {
    const cacheKey = filePaths.sort().join("|");
    if (this.batchCache.has(cacheKey)) {
      return this.batchCache.get(cacheKey);
    }

    const results = new Map();
    const stats = await this.getRepoStats();

    // For large repos, use more efficient batch processing
    if (stats.isLarge && filePaths.length > 5) {
      // Process in chunks to avoid command line length limits
      const chunkSize = 10;
      for (let i = 0; i < filePaths.length; i += chunkSize) {
        const chunk = filePaths.slice(i, i + chunkSize);
        await this.processFileChunk(chunk, results);
      }
    } else {
      // For smaller repos or few files, process normally
      for (const filePath of filePaths) {
        const history = await this.getOptimizedFileHistory(filePath);
        results.set(filePath, history);
      }
    }

    this.batchCache.set(cacheKey, results);
    return results;
  }

  /**
   * Process a chunk of files efficiently
   */
  async processFileChunk(filePaths, results) {
    try {
      // Use a single git command to get history for multiple files
      const fileArgs = filePaths.map((f) => `"${f}"`).join(" ");
      const { stdout } = await execAsync(
        `git log --name-only --format='COMMIT:%H|%aI|%an|%s' -- ${fileArgs}`,
        { cwd: process.cwd() },
      );

      // Parse the output
      let currentCommit = null;
      const lines = stdout.trim().split("\n");

      for (const line of lines) {
        if (line.startsWith("COMMIT:")) {
          const [, sha, date, author, message] = line.split("|");
          currentCommit = { sha: sha.substring(0, 7), date, author, message };
        } else if (line && currentCommit) {
          // This is a file path
          if (!results.has(line)) {
            results.set(line, {
              commits: [],
              firstCommit: null,
              lastCommit: null,
            });
          }

          const fileHistory = results.get(line);
          fileHistory.commits.push(currentCommit);

          // Update first/last commits
          if (!fileHistory.lastCommit) {
            fileHistory.lastCommit = currentCommit;
          }
          fileHistory.firstCommit = currentCommit;
        }
      }
    } catch (error) {
      console.error("Error processing file chunk:", error.message);
    }
  }

  /**
   * Get optimized file history with caching and limited depth
   */
  async getOptimizedFileHistory(filePath) {
    const stats = await this.getRepoStats();

    // For large repos, limit the depth of history search
    const maxDepth = stats.isLarge ? 50 : 100;

    try {
      const { stdout } = await execAsync(
        `git log --format='%H|%aI|%an|%s' -n ${maxDepth} --follow -- "${filePath}"`,
        { cwd: process.cwd() },
      );

      const commits = stdout
        .trim()
        .split("\n")
        .filter((line) => line)
        .map((line) => {
          const [sha, date, author, message] = line.split("|");
          return { sha: sha.substring(0, 7), date, author, message };
        });

      return {
        commits,
        firstCommit: commits[commits.length - 1] || null,
        lastCommit: commits[0] || null,
      };
    } catch (error) {
      return {
        commits: [],
        firstCommit: null,
        lastCommit: null,
      };
    }
  }

  /**
   * Use Git's built-in file status detection for better performance
   */
  async getFileStatusBatch(filePaths) {
    const statusMap = new Map();

    try {
      // Get current status of all files at once
      const { stdout } = await execAsync(
        "git ls-files --others --deleted --modified",
        { cwd: process.cwd() },
      );

      const gitStatus = new Set(stdout.trim().split("\n").filter(Boolean));

      // Check each file
      for (const filePath of filePaths) {
        if (gitStatus.has(filePath)) {
          statusMap.set(filePath, "modified");
        } else {
          // Use git log to check if file exists in history
          const { stdout: logOutput } = await execAsync(
            `git log --oneline -1 -- "${filePath}"`,
            { cwd: process.cwd() },
          );

          if (logOutput.trim()) {
            // File has history
            const { stdout: catOutput } = await execAsync(
              `git cat-file -e HEAD:"${filePath}" 2>/dev/null && echo "exists" || echo "deleted"`,
              { cwd: process.cwd(), shell: true },
            );

            statusMap.set(
              filePath,
              catOutput.trim() === "exists" ? "existing" : "deleted",
            );
          } else {
            statusMap.set(filePath, "missing");
          }
        }
      }
    } catch (error) {
      console.error("Error in batch file status:", error.message);
    }

    return statusMap;
  }

  /**
   * Optimize decision enhancement for large repositories
   */
  async optimizeDecisionEnhancement(decision) {
    if (
      !decision.affected_components ||
      decision.affected_components.length === 0
    ) {
      return decision;
    }

    const stats = await this.getRepoStats();

    // For large repos, use more aggressive caching and batching
    if (stats.isLarge) {
      // Batch process all files at once
      const histories = await this.batchGetFileHistories(
        decision.affected_components,
      );
      const statuses = await this.getFileStatusBatch(
        decision.affected_components,
      );

      // Build enhanced decision with batched data
      const enhanced = { ...decision };

      // Add date range
      let firstDate = null;
      let lastDate = null;
      let totalCommits = 0;

      for (const [filePath, history] of histories) {
        if (
          history.firstCommit &&
          (!firstDate ||
            new Date(history.firstCommit.date) < new Date(firstDate))
        ) {
          firstDate = history.firstCommit.date;
        }
        if (
          history.lastCommit &&
          (!lastDate || new Date(history.lastCommit.date) > new Date(lastDate))
        ) {
          lastDate = history.lastCommit.date;
        }
        totalCommits += history.commits.length;
      }

      if (typeof enhanced.date === "string" && firstDate) {
        enhanced.date = {
          decision_date: enhanced.date,
          first_commit_date: firstDate,
          last_commit_date: lastDate,
          commit_count: totalCommits,
          git_derived: true,
        };
      }

      // Add file status
      enhanced.github_metadata = enhanced.github_metadata || {};
      enhanced.github_metadata.file_status = {
        created: [],
        modified: [],
        deleted: [],
        missing: [],
      };

      for (const [filePath, status] of statuses) {
        switch (status) {
          case "existing": {
            const history = histories.get(filePath);
            if (history && history.commits.length === 1) {
              enhanced.github_metadata.file_status.created.push(filePath);
            } else {
              enhanced.github_metadata.file_status.modified.push(filePath);
            }
            break;
          }
          case "deleted":
            enhanced.github_metadata.file_status.deleted.push(filePath);
            break;
          case "missing":
            enhanced.github_metadata.file_status.missing.push(filePath);
            break;
        }
      }

      // Add top commits
      const allCommits = [];
      const seenShas = new Set();

      for (const [, history] of histories) {
        for (const commit of history.commits.slice(0, 3)) {
          // Limit commits per file
          if (!seenShas.has(commit.sha)) {
            seenShas.add(commit.sha);
            allCommits.push(commit);
          }
        }
      }

      enhanced.github_metadata.commits = allCommits
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

      return enhanced;
    } else {
      // For smaller repos, use standard enhancement
      return decision;
    }
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.batchCache.clear();
    this.repoStats = null;
    gitAnalyzer.clearCache();
  }
}

// Export singleton instance
export const gitPerformance = new GitPerformance();


// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 74
// Task: Analyze current git performance bottlenecks and identify optimization opportunities
// Timestamp: 2025-07-16T04:34:14.181Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 74
// Task: Create git-batch-processor.mjs with parallel command execution
// Timestamp: 2025-07-16T04:34:14.208Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 74
// Task: Implement git command pooling to reuse processes
// Timestamp: 2025-07-16T04:34:14.232Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 74
// Task: Replace individual git calls with batch operations in git-analyzer.mjs
// Timestamp: 2025-07-16T04:34:14.255Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 74
// Task: Add performance benchmarking for before/after comparison
// Timestamp: 2025-07-16T04:34:14.277Z



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
// Timestamp: 2025-07-16T05:22:40.180Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 66
// Task: Add file status tracking (created, modified, deleted, missing)
// Timestamp: 2025-07-16T05:22:40.226Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 66
// Task: Create commit-to-decision matching service
// Timestamp: 2025-07-16T05:22:40.275Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 66
// Task: Generate github_metadata.commits array with key commits
// Timestamp: 2025-07-16T05:22:40.324Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 66
// Task: Add github_metadata.file_status for component tracking
// Timestamp: 2025-07-16T05:22:40.371Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 66
// Task: Add performance optimization for large repositories
// Timestamp: 2025-07-16T05:22:40.418Z

