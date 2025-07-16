/**
 * Utilities for enhanced time filtering with commit-based date ranges
 * Supports both string dates and enhanced date objects
 */

/**
 * Extract the actual date from a decision's date field
 * @param {string|Object} dateField - Either a string date or enhanced date object
 * @param {string} dateType - Type of date to extract: 'decision', 'first_commit', 'last_commit'
 * @returns {Date|null} The extracted date or null if not available
 */
export function extractDate(dateField, dateType = 'decision') {
    if (!dateField) return null;
    
    // Handle string dates
    if (typeof dateField === 'string') {
        try {
            return new Date(dateField);
        } catch (e) {
            console.warn('Invalid date string:', dateField);
            return null;
        }
    }
    
    // Handle enhanced date objects
    if (typeof dateField === 'object') {
        let dateString;
        switch (dateType) {
            case 'decision':
                dateString = dateField.decision_date;
                break;
            case 'first_commit':
                dateString = dateField.first_commit_date;
                break;
            case 'last_commit':
                dateString = dateField.last_commit_date;
                break;
            default:
                dateString = dateField.decision_date; // Default to decision date
        }
        
        if (dateString) {
            try {
                return new Date(dateString);
            } catch (e) {
                console.warn('Invalid date in enhanced object:', dateString);
                return null;
            }
        }
    }
    
    return null;
}

/**
 * Get all available date types for a decision
 * @param {Object} decision - The decision object
 * @returns {Object} Object with available date types and their values
 */
export function getAvailableDates(decision) {
    const dates = {};
    
    if (!decision.date) return dates;
    
    // For string dates, only decision date is available
    if (typeof decision.date === 'string') {
        const date = extractDate(decision.date, 'decision');
        if (date) {
            dates.decision = date;
        }
    }
    // For enhanced date objects, check all types
    else if (typeof decision.date === 'object') {
        const decisionDate = extractDate(decision.date, 'decision');
        const firstCommitDate = extractDate(decision.date, 'first_commit');
        const lastCommitDate = extractDate(decision.date, 'last_commit');
        
        if (decisionDate) dates.decision = decisionDate;
        if (firstCommitDate) dates.first_commit = firstCommitDate;
        if (lastCommitDate) dates.last_commit = lastCommitDate;
    }
    
    return dates;
}

/**
 * Get the last file change date from github_metadata
 * @param {Object} decision - The decision object
 * @returns {Date|null} The most recent file change date or null
 */
export function getLastFileChangeDate(decision) {
    if (!decision.github_metadata?.commits?.length) return null;
    
    // Find the most recent commit date
    let mostRecentDate = null;
    
    for (const commit of decision.github_metadata.commits) {
        if (commit.date) {
            try {
                const commitDate = new Date(commit.date);
                if (!mostRecentDate || commitDate > mostRecentDate) {
                    mostRecentDate = commitDate;
                }
            } catch (e) {
                console.warn('Invalid commit date:', commit.date);
            }
        }
    }
    
    return mostRecentDate;
}

/**
 * Get commit count for a decision
 * @param {Object} decision - The decision object
 * @returns {number} Number of commits
 */
export function getCommitCount(decision) {
    // Check enhanced date object first
    if (typeof decision.date === 'object' && decision.date.commit_count !== undefined) {
        return decision.date.commit_count;
    }
    
    // Fall back to github_metadata.commits length
    if (decision.github_metadata?.commits?.length) {
        return decision.github_metadata.commits.length;
    }
    
    return 0;
}

/**
 * Filter decisions by date range with support for different date types
 * @param {Array} decisions - Array of decision objects
 * @param {Date} startDate - Start of date range (inclusive)
 * @param {Date} endDate - End of date range (inclusive)
 * @param {string} dateType - Type of date to filter by: 'decision', 'first_commit', 'last_commit', 'any'
 * @returns {Array} Filtered decisions
 */
export function filterByDateRange(decisions, startDate, endDate, dateType = 'decision') {
    if (!startDate && !endDate) return decisions;
    
    return decisions.filter(decision => {
        if (dateType === 'any') {
            // Check if ANY date type falls within range
            const dates = getAvailableDates(decision);
            return Object.values(dates).some(date => {
                if (startDate && date < startDate) return false;
                if (endDate && date > endDate) return false;
                return true;
            });
        } else {
            // Check specific date type
            const date = extractDate(decision.date, dateType);
            if (!date) return false;
            
            if (startDate && date < startDate) return false;
            if (endDate && date > endDate) return false;
            return true;
        }
    });
}

/**
 * Filter decisions by last file change within a certain number of days
 * @param {Array} decisions - Array of decision objects
 * @param {number} daysAgo - Number of days in the past to filter by
 * @returns {Array} Filtered decisions
 */
export function filterByRecentFileChanges(decisions, daysAgo) {
    if (!daysAgo || daysAgo <= 0) return decisions;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    return decisions.filter(decision => {
        const lastChangeDate = getLastFileChangeDate(decision);
        return lastChangeDate && lastChangeDate >= cutoffDate;
    });
}

/**
 * Filter decisions by commit count
 * @param {Array} decisions - Array of decision objects
 * @param {number} minCommits - Minimum number of commits
 * @param {number} maxCommits - Maximum number of commits (optional)
 * @returns {Array} Filtered decisions
 */
export function filterByCommitCount(decisions, minCommits = 0, maxCommits = null) {
    return decisions.filter(decision => {
        const count = getCommitCount(decision);
        if (count < minCommits) return false;
        if (maxCommits !== null && count > maxCommits) return false;
        return true;
    });
}

/**
 * Group decisions by time period
 * @param {Array} decisions - Array of decision objects
 * @param {string} period - Grouping period: 'day', 'week', 'month', 'quarter', 'year'
 * @param {string} dateType - Type of date to group by
 * @returns {Object} Grouped decisions
 */
export function groupByTimePeriod(decisions, period = 'month', dateType = 'decision') {
    const groups = {};
    
    decisions.forEach(decision => {
        const date = extractDate(decision.date, dateType);
        if (!date) return;
        
        let key;
        const year = date.getFullYear();
        const month = date.getMonth();
        const quarter = Math.floor(month / 3);
        
        switch (period) {
            case 'day':
                key = date.toISOString().split('T')[0];
                break;
            case 'week': {
                // Get week number
                const firstDay = new Date(year, 0, 1);
                const weekNumber = Math.ceil(((date - firstDay) / 86400000 + firstDay.getDay() + 1) / 7);
                key = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
                break;
            }
            case 'month':
                key = `${year}-${(month + 1).toString().padStart(2, '0')}`;
                break;
            case 'quarter':
                key = `${year}-Q${quarter + 1}`;
                break;
            case 'year':
                key = year.toString();
                break;
            default:
                key = `${year}-${(month + 1).toString().padStart(2, '0')}`;
        }
        
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(decision);
    });
    
    return groups;
}

/**
 * Calculate time-based statistics for decisions
 * @param {Array} decisions - Array of decision objects
 * @returns {Object} Statistics object
 */
export function calculateTimeStatistics(decisions) {
    const stats = {
        totalDecisions: decisions.length,
        decisionsWithCommits: 0,
        decisionsWithEnhancedDates: 0,
        averageCommitsPerDecision: 0,
        dateRange: {
            earliest: null,
            latest: null,
            span: null
        },
        commitActivity: {
            totalCommits: 0,
            earliestCommit: null,
            latestCommit: null
        }
    };
    
    let totalCommits = 0;
    let earliestDate = null;
    let latestDate = null;
    let earliestCommit = null;
    let latestCommit = null;
    
    decisions.forEach(decision => {
        // Check for enhanced dates
        if (typeof decision.date === 'object') {
            stats.decisionsWithEnhancedDates++;
        }
        
        // Get all available dates
        const dates = getAvailableDates(decision);
        Object.values(dates).forEach(date => {
            if (!earliestDate || date < earliestDate) earliestDate = date;
            if (!latestDate || date > latestDate) latestDate = date;
        });
        
        // Count commits
        const commitCount = getCommitCount(decision);
        if (commitCount > 0) {
            stats.decisionsWithCommits++;
            totalCommits += commitCount;
        }
        
        // Check commit dates
        if (decision.github_metadata?.commits) {
            decision.github_metadata.commits.forEach(commit => {
                if (commit.date) {
                    const commitDate = new Date(commit.date);
                    if (!earliestCommit || commitDate < earliestCommit) earliestCommit = commitDate;
                    if (!latestCommit || commitDate > latestCommit) latestCommit = commitDate;
                }
            });
        }
    });
    
    // Calculate averages and ranges
    if (stats.decisionsWithCommits > 0) {
        stats.averageCommitsPerDecision = totalCommits / stats.decisionsWithCommits;
    }
    
    stats.dateRange.earliest = earliestDate;
    stats.dateRange.latest = latestDate;
    if (earliestDate && latestDate) {
        stats.dateRange.span = Math.floor((latestDate - earliestDate) / (1000 * 60 * 60 * 24)); // Days
    }
    
    stats.commitActivity.totalCommits = totalCommits;
    stats.commitActivity.earliestCommit = earliestCommit;
    stats.commitActivity.latestCommit = latestCommit;
    
    return stats;
}

// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Support filtering by enhanced date objects (decision_date, first_commit_date, last_commit_date)
// Timestamp: 2025-07-16T05:35:55.777Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Update search panel for commit-based date filtering
// Timestamp: 2025-07-16T05:35:55.827Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add 'last file change' filter using github_metadata.file_status
// Timestamp: 2025-07-16T05:35:55.875Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Create commit timeline visualization from github_metadata.commits
// Timestamp: 2025-07-16T05:35:55.922Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add file activity indicators using github_metadata.file_status
// Timestamp: 2025-07-16T05:35:55.967Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add commit count indicators (github_metadata.commits.length)
// Timestamp: 2025-07-16T05:35:56.014Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Integrate with Git history analysis service
// Timestamp: 2025-07-16T05:35:56.061Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add filtering by GitHub PR/issue activity
// Timestamp: 2025-07-16T05:35:56.107Z

