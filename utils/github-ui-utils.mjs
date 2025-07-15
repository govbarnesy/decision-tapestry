/**
 * GitHub UI utility functions for handling author data and formatting
 */

/**
 * Check if an author is a GitHub user object
 * @param {Object|String} author - Author data
 * @returns {Boolean}
 */
export function isGitHubUser(author) {
    return author && typeof author === 'object' && 'github_username' in author;
}

/**
 * Get display name for an author (handles both string and GitHub user object)
 * @param {Object|String} author - Author data
 * @returns {String}
 */
export function getAuthorDisplayName(author) {
    if (isGitHubUser(author)) {
        return author.display_name || author.github_username || 'Unknown';
    }
    return author || 'Unknown';
}

/**
 * Get unique key for an author (for comparison and deduplication)
 * @param {Object|String} author - Author data
 * @returns {String}
 */
export function getAuthorKey(author) {
    if (isGitHubUser(author)) {
        return `github:${author.github_username}`;
    }
    return `string:${author}`;
}

/**
 * Extract unique authors from decisions array
 * @param {Array} decisions - Array of decision objects
 * @returns {Array} Unique authors (preserving GitHub user objects)
 */
export function extractUniqueAuthors(decisions) {
    const authorMap = new Map();
    
    decisions.forEach(decision => {
        if (decision.author) {
            const key = getAuthorKey(decision.author);
            if (!authorMap.has(key)) {
                authorMap.set(key, decision.author);
            }
        }
    });
    
    return Array.from(authorMap.values());
}

/**
 * Group decisions by author
 * @param {Array} decisions - Array of decision objects
 * @returns {Map} Map of author key to array of decisions
 */
export function groupDecisionsByAuthor(decisions) {
    const groups = new Map();
    
    decisions.forEach(decision => {
        if (decision.author) {
            const key = getAuthorKey(decision.author);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(decision);
        }
    });
    
    return groups;
}

/**
 * Format GitHub metadata for display
 * @param {Object} githubMetadata - GitHub metadata object from decision
 * @returns {Object} Formatted metadata
 */
export function formatGitHubMetadata(githubMetadata) {
    if (!githubMetadata) return null;
    
    return {
        pullRequests: (githubMetadata.pull_requests || []).map(pr => ({
            ...pr,
            statusColor: pr.status === 'merged' ? '#6f42c1' : 
                        pr.status === 'open' ? '#28a745' : '#dc3545',
            statusIcon: pr.status === 'merged' ? '🔀' : 
                       pr.status === 'open' ? '🟢' : '🔴'
        })),
        issues: (githubMetadata.issues || []).map(issue => ({
            ...issue,
            statusColor: issue.status === 'open' ? '#28a745' : '#dc3545',
            statusIcon: issue.status === 'open' ? '🟢' : '🔴'
        })),
        commits: (githubMetadata.commits || []).map(commit => ({
            ...commit,
            shortSha: commit.sha.substring(0, 7),
            formattedDate: new Date(commit.date).toLocaleDateString()
        })),
        fileStatus: githubMetadata.file_status || {
            created: [],
            modified: [],
            deleted: [],
            missing: []
        }
    };
}

/**
 * Sort authors by various criteria
 * @param {Array} authors - Array of authors
 * @param {String} sortBy - Sort criteria: 'name', 'username', 'decisions'
 * @param {Map} decisionCounts - Map of author key to decision count
 * @returns {Array} Sorted authors
 */
export function sortAuthors(authors, sortBy = 'name', decisionCounts = new Map()) {
    return [...authors].sort((a, b) => {
        switch (sortBy) {
            case 'username': {
                const usernameA = isGitHubUser(a) ? a.github_username : '';
                const usernameB = isGitHubUser(b) ? b.github_username : '';
                return usernameA.localeCompare(usernameB);
            }
            
            case 'decisions': {
                const countA = decisionCounts.get(getAuthorKey(a)) || 0;
                const countB = decisionCounts.get(getAuthorKey(b)) || 0;
                return countB - countA; // Descending order
            }
            
            case 'name':
            default:
                return getAuthorDisplayName(a).localeCompare(getAuthorDisplayName(b));
        }
    });
}

/**
 * Generate avatar URL or fallback initials
 * @param {Object|String} author - Author data
 * @param {Number} size - Avatar size in pixels
 * @returns {Object} Avatar data { url, initials, isGitHub }
 */
export function getAvatarData(author, size = 40) {
    const displayName = getAuthorDisplayName(author);
    const initials = getInitials(displayName);
    
    if (isGitHubUser(author) && author.avatar_url) {
        // Append size parameter to GitHub avatar URL
        const url = new URL(author.avatar_url);
        url.searchParams.set('s', size);
        return {
            url: url.toString(),
            initials,
            isGitHub: true
        };
    }
    
    return {
        url: null,
        initials,
        isGitHub: false
    };
}

/**
 * Get initials from a name
 * @param {String} name - Full name
 * @returns {String} Initials (max 2 characters)
 */
function getInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Filter decisions by selected authors
 * @param {Array} decisions - Array of decisions
 * @param {Array} selectedAuthors - Array of selected authors
 * @returns {Array} Filtered decisions
 */
export function filterDecisionsByAuthors(decisions, selectedAuthors) {
    if (!selectedAuthors || selectedAuthors.length === 0) {
        return decisions;
    }
    
    const selectedKeys = new Set(selectedAuthors.map(author => getAuthorKey(author)));
    
    return decisions.filter(decision => {
        if (!decision.author) return false;
        const key = getAuthorKey(decision.author);
        return selectedKeys.has(key);
    });
}

/**
 * Create tooltip content for author
 * @param {Object|String} author - Author data
 * @param {Number} decisionCount - Number of decisions by this author
 * @returns {String} HTML tooltip content
 */
export function createAuthorTooltip(author, decisionCount = 0) {
    const displayName = getAuthorDisplayName(author);
    const lines = [`<strong>${displayName}</strong>`];
    
    if (isGitHubUser(author)) {
        if (author.github_username) {
            lines.push(`GitHub: @${author.github_username}`);
        }
        if (author.email) {
            lines.push(`Email: ${author.email}`);
        }
    }
    
    lines.push(`Decisions: ${decisionCount}`);
    
    return lines.join('<br>');
}