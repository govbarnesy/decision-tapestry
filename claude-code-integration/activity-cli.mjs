#!/usr/bin/env node

/**
 * Activity CLI for Claude Code Integration
 * Agent-3 (Integration) - Decision #58
 * 
 * Command-line interface for managing activity tracking and testing
 * the Claude Code integration.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { monitor } from './monitor.mjs';
import { 
  startSession, 
  endSession, 
  setDecisionContext,
  toggleActivityTracking,
  getMonitoringStatus 
} from './claude-code-hook.mjs';

const program = new Command();

program
  .name('activity')
  .description('Claude Code activity tracking CLI')
  .version('1.0.0');

// Start session command
program
  .command('start')
  .description('Start an activity tracking session')
  .option('-d, --decision <id>', 'Decision ID to track')
  .action((options) => {
    startSession(options.decision);
    console.log(chalk.green('✓ Activity tracking session started'));
    if (options.decision) {
      console.log(chalk.gray(`  Decision context: ${options.decision}`));
    }
  });

// End session command
program
  .command('end')
  .description('End the current activity tracking session')
  .action(() => {
    endSession();
    console.log(chalk.yellow('✓ Activity tracking session ended'));
  });

// Set decision context
program
  .command('context <decisionId>')
  .description('Set the current decision context')
  .action((decisionId) => {
    setDecisionContext(decisionId);
    console.log(chalk.blue(`✓ Decision context set to: ${decisionId}`));
  });

// Toggle tracking
program
  .command('toggle <state>')
  .description('Enable or disable activity tracking')
  .action((state) => {
    const enabled = state === 'on' || state === 'enable' || state === 'true';
    toggleActivityTracking(enabled);
    console.log(chalk.cyan(`✓ Activity tracking ${enabled ? 'enabled' : 'disabled'}`));
  });

// Status command
program
  .command('status')
  .description('Show current monitoring status')
  .action(() => {
    const status = getMonitoringStatus();
    console.log(chalk.bold('\nActivity Monitoring Status:'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`Tracking: ${status.enabled ? chalk.green('enabled') : chalk.red('disabled')}`);
    console.log(`Server: ${chalk.cyan(status.serverUrl)}`);
    console.log(`Current Decision: ${status.currentDecision ? chalk.yellow(status.currentDecision) : chalk.gray('none')}`);
    console.log(`File Mappings: ${chalk.blue(status.fileMapSize)} files mapped to decisions`);
    
    if (status.lastActivity) {
      console.log(chalk.bold('\nLast Activity:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(`State: ${chalk.magenta(status.lastActivity.state)}`);
      console.log(`Description: ${status.lastActivity.taskDescription}`);
      if (status.lastActivity.decisionId) {
        console.log(`Decision: ${chalk.yellow(status.lastActivity.decisionId)}`);
      }
    }
  });

// Simulate tool usage for testing
program
  .command('simulate <tool>')
  .description('Simulate a tool usage for testing')
  .option('-f, --file <path>', 'File path for the tool')
  .option('-c, --command <cmd>', 'Command for Bash tool')
  .option('-p, --pattern <pattern>', 'Pattern for Grep tool')
  .option('-d, --description <desc>', 'Description of the activity')
  .action(async (tool, options) => {
    console.log(chalk.gray(`Simulating ${tool} usage...`));
    
    const parameters = {};
    if (options.file) parameters.file_path = options.file;
    if (options.command) parameters.command = options.command;
    if (options.pattern) parameters.pattern = options.pattern;
    if (options.description) parameters.description = options.description;
    
    await monitor.processToolUsage(tool, parameters);
    console.log(chalk.green(`✓ ${tool} activity simulated`));
  });

// Broadcast custom activity
program
  .command('broadcast <state>')
  .description('Manually broadcast an activity state')
  .option('-d, --decision <id>', 'Decision ID')
  .option('-t, --task <description>', 'Task description')
  .action(async (state, options) => {
    const validStates = ['idle', 'working', 'debugging', 'testing', 'reviewing'];
    if (!validStates.includes(state)) {
      console.error(chalk.red(`Error: Invalid state. Must be one of: ${validStates.join(', ')}`));
      process.exit(1);
    }
    
    await monitor.broadcastActivity(
      state, 
      options.decision || null,
      options.task || `Manual ${state} activity`
    );
    console.log(chalk.green(`✓ Activity broadcast: ${state}`));
  });

// Test suite command
program
  .command('test')
  .description('Run a test sequence of activities')
  .action(async () => {
    console.log(chalk.bold('\nRunning activity test sequence...\n'));
    
    // Start session
    console.log(chalk.gray('1. Starting session for decision 58...'));
    startSession(58);
    await delay(1000);
    
    // Simulate various activities
    console.log(chalk.gray('2. Simulating file reading...'));
    await monitor.processToolUsage('Read', {
      file_path: '/Users/barnesy/Projects/decision-tapestry/decisions.yml'
    });
    await delay(1000);
    
    console.log(chalk.gray('3. Simulating code editing...'));
    await monitor.processToolUsage('Edit', {
      file_path: '/Users/barnesy/Projects/decision-tapestry/server/server.mjs',
      old_string: 'test',
      new_string: 'implementation'
    });
    await delay(1000);
    
    console.log(chalk.gray('4. Simulating test execution...'));
    await monitor.processToolUsage('Bash', {
      command: 'npm test',
      description: 'Running tests'
    });
    await delay(1000);
    
    console.log(chalk.gray('5. Simulating debugging...'));
    await monitor.processToolUsage('Grep', {
      pattern: 'error',
      path: './logs'
    });
    await delay(1000);
    
    // End session
    console.log(chalk.gray('6. Ending session...'));
    endSession();
    
    console.log(chalk.bold('\n✓ Test sequence completed!\n'));
  });

// Helper function for delays
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.help();
}