#!/usr/bin/env node

/**
 * Test script for Git history analysis features
 * Demonstrates how to use the Git analyzer, file tracker, and decision enhancer
 */

import { gitAnalyzer } from './services/git-analyzer.mjs';
import { fileTracker } from './services/file-tracker.mjs';
import { decisionEnhancer } from './services/decision-enhancer.mjs';
import { commitMatcher } from './utils/commit-matcher.mjs';
import fs from 'fs/promises';
import yaml from 'js-yaml';

async function testGitHistoryAnalysis() {
  console.log('🔍 Testing Git History Analysis Features\n');

  // Check if we're in a Git repository
  const isGitRepo = await gitAnalyzer.isGitRepo();
  if (!isGitRepo) {
    console.error('❌ Not in a Git repository. Please run this from a Git repo.');
    process.exit(1);
  }

  // Test 1: Analyze a specific file
  console.log('📄 Test 1: Analyzing Git history for a specific file');
  const testFile = 'README.md';
  
  const creationDate = await gitAnalyzer.getFileCreationDate(testFile);
  const lastModDate = await gitAnalyzer.getFileLastModifiedDate(testFile);
  const commits = await gitAnalyzer.getFileCommits(testFile, 5);
  
  console.log(`File: ${testFile}`);
  console.log(`  Created: ${creationDate || 'Unknown'}`);
  console.log(`  Last Modified: ${lastModDate || 'Unknown'}`);
  console.log(`  Recent Commits: ${commits.length}`);
  commits.forEach(commit => {
    console.log(`    - ${commit.sha} ${commit.message} (${commit.author})`);
  });
  console.log();

  // Test 2: Track file status
  console.log('📊 Test 2: Tracking file status');
  const filesToTrack = [
    'README.md',
    'package.json',
    'non-existent-file.txt',
    'services/git-analyzer.mjs'
  ];
  
  const fileStatus = await fileTracker.trackFiles(filesToTrack);
  console.log('File Status Summary:');
  console.log(`  Created: ${fileStatus.created.length} files`);
  console.log(`  Modified: ${fileStatus.modified.length} files`);
  console.log(`  Deleted: ${fileStatus.deleted.length} files`);
  console.log(`  Missing: ${fileStatus.missing.length} files`);
  
  for (const [status, files] of Object.entries(fileStatus)) {
    if (files.length > 0) {
      console.log(`\n  ${status.toUpperCase()}:`);
      files.forEach(file => console.log(`    - ${file}`));
    }
  }
  console.log();

  // Test 3: Enhance a decision with Git metadata
  console.log('🚀 Test 3: Enhancing a decision with Git metadata');
  
  // Load current decisions
  let decisions;
  try {
    const decisionsYml = await fs.readFile('decisions.yml', 'utf-8');
    const data = yaml.load(decisionsYml);
    decisions = data.decisions || [];
  } catch (error) {
    console.error('Could not load decisions.yml:', error.message);
    decisions = [];
  }

  // Find Decision #66 (the one we just implemented)
  const decision66 = decisions.find(d => d.id === 66);
  if (decision66) {
    console.log(`\nEnhancing Decision #${decision66.id}: ${decision66.title}`);
    
    const enhanced = await decisionEnhancer.enhanceDecision(decision66, {
      includeCommits: true,
      includeFileStatus: true,
      maxCommits: 5
    });
    
    console.log('\nEnhanced Decision:');
    
    // Show enhanced date
    if (enhanced.date && typeof enhanced.date === 'object') {
      console.log('\n  Enhanced Date Object:');
      console.log(`    Decision Date: ${enhanced.date.decision_date}`);
      console.log(`    First Commit: ${enhanced.date.first_commit_date || 'N/A'}`);
      console.log(`    Last Commit: ${enhanced.date.last_commit_date || 'N/A'}`);
      console.log(`    Total Commits: ${enhanced.date.commit_count || 0}`);
    }
    
    // Show GitHub metadata
    if (enhanced.github_metadata) {
      if (enhanced.github_metadata.commits) {
        console.log('\n  Key Commits:');
        enhanced.github_metadata.commits.forEach(commit => {
          console.log(`    - ${commit.sha} ${commit.message}`);
        });
      }
      
      if (enhanced.github_metadata.file_status) {
        console.log('\n  File Status:');
        const status = enhanced.github_metadata.file_status;
        console.log(`    Created: ${status.created.length} files`);
        console.log(`    Modified: ${status.modified.length} files`);
        console.log(`    Deleted: ${status.deleted.length} files`);
        console.log(`    Missing: ${status.missing.length} files`);
      }
    }
  } else {
    console.log('Decision #66 not found in decisions.yml');
  }

  // Test 4: Find related decisions by commit overlap
  console.log('\n\n🔗 Test 4: Finding related decisions by commit overlap');
  const recentDecisions = decisions.slice(-5); // Last 5 decisions
  const relatedPairs = await commitMatcher.findRelatedDecisions(recentDecisions);
  
  if (relatedPairs.length > 0) {
    console.log('Found related decisions:');
    relatedPairs.forEach(pair => {
      console.log(`  - Decision #${pair.decision1} ↔ Decision #${pair.decision2} (shared commit: ${pair.sharedCommit})`);
    });
  } else {
    console.log('No related decisions found based on commit overlap.');
  }

  console.log('\n✅ Git history analysis testing complete!');
}

// Run the tests
testGitHistoryAnalysis().catch(console.error);