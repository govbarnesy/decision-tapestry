# Git History Integration Guide

Decision Tapestry now includes powerful Git history analysis features that automatically enhance your decisions with commit metadata, file tracking, and timeline information.

## Overview

The Git history integration provides:

1. **Enhanced Date Objects** - Automatic detection of first and last commit dates
2. **Commit Tracking** - Key commits associated with each decision
3. **File Status Tracking** - Track whether files were created, modified, deleted, or are missing
4. **Performance Optimization** - Efficient handling of large repositories

## Schema Support

The `decisions.schema.json` already supports oneOf schemas for both author and date fields:

### Enhanced Date Schema

```yaml
# Simple string date (legacy)
date: "2025-07-15T22:16:00Z"

# Enhanced date object with Git metadata
date:
  decision_date: "2025-07-15T22:16:00Z"
  first_commit_date: "2025-07-15T22:30:00Z"
  last_commit_date: "2025-07-15T23:45:00Z"
  commit_count: 12
  git_derived: true
```

### GitHub Metadata

Decisions can include detailed GitHub metadata:

```yaml
github_metadata:
  commits:
    - sha: "abc1234"
      message: "feat: implement git analyzer"
      url: "https://github.com/owner/repo/commit/abc1234"
      date: "2025-07-15T22:30:00Z"
      author: "Agent B"
  file_status:
    created:
      - "services/git-analyzer.mjs"
      - "services/file-tracker.mjs"
    modified:
      - "decisions.yml"
    deleted: []
    missing: []
```

## Usage

### Using the Git Analyzer

```javascript
import { gitAnalyzer } from './services/git-analyzer.mjs';

// Get file creation date
const creationDate = await gitAnalyzer.getFileCreationDate('README.md');

// Get file commits
const commits = await gitAnalyzer.getFileCommits('README.md', 10);

// Analyze multiple files
const analysis = await gitAnalyzer.analyzeFiles(['file1.js', 'file2.js']);
```

### Using the File Tracker

```javascript
import { fileTracker } from './services/file-tracker.mjs';

// Track file status
const status = await fileTracker.trackFiles([
  'services/git-analyzer.mjs',
  'deleted-file.js',
  'missing-file.txt'
]);

console.log(status);
// {
//   created: ['services/git-analyzer.mjs'],
//   modified: [],
//   deleted: ['deleted-file.js'],
//   missing: ['missing-file.txt']
// }
```

### Using the Decision Enhancer

```javascript
import { decisionEnhancer } from './services/decision-enhancer.mjs';

// Enhance a single decision
const enhanced = await decisionEnhancer.enhanceDecision(decision, {
  includeCommits: true,
  includeFileStatus: true,
  maxCommits: 10
});

// Enhance multiple decisions
const enhancedDecisions = await decisionEnhancer.enhanceDecisions(decisions);

// Generate activity summary
const summary = await decisionEnhancer.generateActivitySummary(decision);
```

### Using the Commit Matcher

```javascript
import { commitMatcher } from './utils/commit-matcher.mjs';

// Match commits to a decision
const commits = await commitMatcher.matchCommitsToDecision(decision);

// Find related decisions
const related = await commitMatcher.findRelatedDecisions(decisions);

// Analyze commit patterns
const analysis = await commitMatcher.analyzeCommitPatterns(decisions);
```

## Performance Optimization

For large repositories, use the performance optimization service:

```javascript
import { gitPerformance } from './services/git-performance.mjs';

// Get repository statistics
const stats = await gitPerformance.getRepoStats();

// Batch process files
const histories = await gitPerformance.batchGetFileHistories(filePaths);

// Optimize decision enhancement
const enhanced = await gitPerformance.optimizeDecisionEnhancement(decision);
```

## Integration with CLI

The Git history features can be integrated with the CLI to automatically enhance decisions:

```bash
# Analyze Git history for existing decisions
decision-tapestry analyze

# Enhance a specific decision
decision-tapestry enhance 66

# Show Git metadata for a decision
decision-tapestry show 66 --git-metadata
```

## Best Practices

1. **Cache Management** - Clear caches periodically for fresh data:
   ```javascript
   gitAnalyzer.clearCache();
   fileTracker.clearCache();
   decisionEnhancer.clearCache();
   ```

2. **Performance** - For large repositories:
   - Use batch operations when analyzing multiple files
   - Limit commit history depth
   - Enable caching for repeated operations

3. **Error Handling** - Always handle cases where Git history might not be available:
   ```javascript
   const isGitRepo = await gitAnalyzer.isGitRepo();
   if (!isGitRepo) {
     console.warn('Not in a Git repository');
     return;
   }
   ```

4. **Progressive Enhancement** - The system gracefully handles both simple string dates and enhanced date objects, allowing gradual migration.

## Testing

Run the test script to verify the Git history integration:

```bash
node test-git-history.mjs
```

This will test:
- File history analysis
- File status tracking
- Decision enhancement
- Related decision detection

## Future Enhancements

- Automatic decision creation from Git commits
- Integration with GitHub API for PR/issue linking
- Visualization of commit timelines in the UI
- Real-time Git activity monitoring