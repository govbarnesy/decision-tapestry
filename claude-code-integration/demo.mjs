#!/usr/bin/env node

/**
 * Claude Code Integration Demo
 * Agent-3 (Integration) - Decision #58
 * 
 * This demo shows how Claude Code activities are automatically tracked
 * and broadcast to the Decision Tapestry dashboard.
 */

import { monitor } from './monitor.mjs';
import { startSession, endSession } from './claude-code-hook.mjs';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🚀 Claude Code Integration Demo\n'));

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
  // Start a session for decision 58
  console.log(chalk.yellow('1. Starting activity session for Decision #58...'));
  startSession(58);
  await delay(2000);
  
  // Simulate reading the decisions file
  console.log(chalk.blue('\n2. Simulating file read (reviewing state)...'));
  await monitor.processToolUsage('Read', {
    file_path: '/Users/barnesy/Projects/decision-tapestry/decisions.yml'
  });
  await delay(2000);
  
  // Simulate editing a file
  console.log(chalk.green('\n3. Simulating code edit (working state)...'));
  await monitor.processToolUsage('Edit', {
    file_path: '/Users/barnesy/Projects/decision-tapestry/server/server.mjs',
    old_string: 'console.log("test")',
    new_string: 'console.log("implementing new feature")'
  });
  await delay(2000);
  
  // Simulate running tests
  console.log(chalk.magenta('\n4. Simulating test execution (testing state)...'));
  await monitor.processToolUsage('Bash', {
    command: 'npm test',
    description: 'Running unit tests'
  });
  await delay(2000);
  
  // Simulate debugging
  console.log(chalk.red('\n5. Simulating error search (debugging state)...'));
  await monitor.processToolUsage('Grep', {
    pattern: 'error|bug|fix',
    path: './server'
  });
  await delay(2000);
  
  // End session
  console.log(chalk.yellow('\n6. Ending activity session...'));
  endSession();
  
  console.log(chalk.bold.green('\n✅ Demo completed!'));
  console.log(chalk.gray('\nCheck the Decision Tapestry dashboard to see the activity updates.'));
  console.log(chalk.gray('The activities should appear in real-time on the decision map.\n'));
}

// Run the demo
runDemo().catch(error => {
  console.error(chalk.red('Demo error:'), error);
  process.exit(1);
});