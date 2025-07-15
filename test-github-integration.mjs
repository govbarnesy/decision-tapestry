#!/usr/bin/env node

/**
 * Test script for GitHub integration
 * Verifies that the GitHub API client and author service are working correctly
 */

import { githubService } from './services/github-service.mjs';
import { authorService } from './services/author-service.mjs';
import { authorMigration } from './utils/author-migration.mjs';

async function testGitHubAPI() {
  console.log('=== Testing GitHub API Integration ===\n');
  
  // Initialize GitHub service (will work without token but with limited rate limits)
  console.log('1. Initializing GitHub service...');
  const initialized = await githubService.initialize(process.env.GITHUB_TOKEN);
  console.log(`   Initialized: ${initialized ? 'Yes' : 'No (limited functionality)'}`);
  
  // Check rate limit
  console.log('\n2. Checking GitHub API rate limit...');
  const status = githubService.getStatus();
  console.log(`   Rate limit: ${status.rateLimit.remaining}/${status.rateLimit.limit}`);
  console.log(`   Resets at: ${status.rateLimit.resetTime || 'Unknown'}\n`);
  
  // Test user lookup
  console.log('3. Testing GitHub user lookup...');
  const testUsers = ['govbarnesy', 'octocat', 'invalid-user-12345'];
  
  for (const username of testUsers) {
    const user = await githubService.getUser(username);
    if (user) {
      console.log(`   ✓ Found ${username}: ${user.display_name || 'No name'} (${user.profile_url})`);
    } else {
      console.log(`   ✗ User ${username} not found`);
    }
  }
  
  console.log('\n4. Testing repository lookup...');
  const repo = await githubService.getRepository('govbarnesy', 'decision-tapestry');
  if (repo) {
    console.log(`   ✓ Found repository: ${repo.full_name}`);
    console.log(`     Description: ${repo.description || 'No description'}`);
    console.log(`     URL: ${repo.html_url}`);
  } else {
    console.log('   ✗ Repository not found');
  }
}

async function testAuthorService() {
  console.log('\n\n=== Testing Author Service ===\n');
  
  const testAuthors = [
    'govbarnesy',                    // Direct GitHub username
    'Chris Barnes',                  // Plain name
    'octocat',                      // Known GitHub user
    'John Doe (johndoe)',           // Name with username in parentheses
    'user@github.com',              // GitHub email format
    'Agent A',                      // Non-GitHub user
    'Claude & AI Assistant',        // Complex non-GitHub format
  ];
  
  console.log('Testing author enhancement...');
  for (const author of testAuthors) {
    const enhanced = await authorService.getAuthorInfo(author);
    
    if (typeof enhanced === 'object' && enhanced.github_username) {
      console.log(`\n✓ Enhanced: "${author}"`);
      console.log(`  Username: ${enhanced.github_username}`);
      console.log(`  Display: ${enhanced.display_name}`);
      console.log(`  Avatar: ${enhanced.avatar_url}`);
      console.log(`  Profile: ${enhanced.profile_url}`);
    } else {
      console.log(`\n✗ Not enhanced: "${author}" → "${enhanced}"`);
    }
  }
  
  // Show cache statistics
  console.log('\n\nCache Statistics:');
  const stats = authorService.getCacheStats();
  console.log(`  Hits: ${stats.hits}`);
  console.log(`  Misses: ${stats.misses}`);
  console.log(`  Errors: ${stats.errors}`);
  console.log(`  Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
  console.log(`  Cache Size: ${stats.size}`);
}

async function testMigration() {
  console.log('\n\n=== Testing Author Migration ===\n');
  
  // Create a test YAML structure
  const testData = {
    decisions: [
      { id: 1, title: 'Test Decision 1', author: 'govbarnesy' },
      { id: 2, title: 'Test Decision 2', author: 'Chris Barnes' },
      { id: 3, title: 'Test Decision 3', author: { github_username: 'octocat', display_name: 'The Octocat' } }
    ]
  };
  
  console.log('Generating migration report...');
  const report = await authorMigration.generateReport(testData);
  
  console.log('\nMigration Report:');
  console.log(`  String authors: ${report.stringAuthors.length}`);
  report.stringAuthors.forEach(a => console.log(`    - ${a}`));
  
  console.log(`\n  Already enhanced: ${report.enhancedAuthors.length}`);
  report.enhancedAuthors.forEach(a => console.log(`    - ${a.github_username} (${a.display_name})`));
  
  console.log(`\n  Potential GitHub users: ${report.potentialGitHubUsers.length}`);
  report.potentialGitHubUsers.forEach(p => console.log(`    - "${p.original}" → @${p.username}`));
  
  console.log(`\n  Non-GitHub users: ${report.nonGitHubUsers.length}`);
  report.nonGitHubUsers.forEach(a => console.log(`    - ${a}`));
}

// Run all tests
async function runTests() {
  try {
    await testGitHubAPI();
    await testAuthorService();
    await testMigration();
    
    console.log('\n\n=== All tests completed ===');
    
  } catch (error) {
    console.error('\n\nError during testing:', error.message);
    process.exit(1);
  }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}