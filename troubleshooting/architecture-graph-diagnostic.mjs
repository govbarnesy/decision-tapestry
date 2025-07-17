#!/usr/bin/env node

/**
 * Diagnostic tool for troubleshooting Architecture graph issues
 * Run this in your project directory to diagnose why the Architecture graph might not be showing
 */

import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';

async function runDiagnostics() {
  console.log(chalk.blue('\n🔍 Decision Tapestry Architecture Graph Diagnostic\n'));
  
  let issues = [];
  let warnings = [];
  let info = [];
  
  // 1. Check if decisions.yml exists
  const decisionsPath = path.resolve('decisions.yml');
  try {
    await fs.access(decisionsPath);
    console.log(chalk.green('✓ decisions.yml found'));
  } catch {
    issues.push('decisions.yml not found in current directory');
    console.log(chalk.red('✗ decisions.yml not found'));
    return reportResults(issues, warnings, info);
  }
  
  // 2. Load and parse decisions.yml
  let decisionsData;
  try {
    const content = await fs.readFile(decisionsPath, 'utf8');
    decisionsData = yaml.load(content);
    console.log(chalk.green('✓ decisions.yml parsed successfully'));
  } catch (error) {
    issues.push(`Failed to parse decisions.yml: ${error.message}`);
    console.log(chalk.red('✗ Failed to parse decisions.yml'));
    return reportResults(issues, warnings, info);
  }
  
  // 3. Check if decisions exist
  const decisions = decisionsData.decisions || [];
  console.log(chalk.gray(`  Found ${decisions.length} decisions`));
  
  if (decisions.length === 0) {
    warnings.push('No decisions found in decisions.yml');
    console.log(chalk.yellow('⚠ No decisions found'));
  }
  
  // 4. Check for affected_components
  let componentsFound = 0;
  let decisionsWithComponents = 0;
  const componentMap = new Map();
  
  decisions.forEach((decision) => {
    if (decision.affected_components && Array.isArray(decision.affected_components)) {
      if (decision.affected_components.length > 0) {
        decisionsWithComponents++;
        decision.affected_components.forEach(comp => {
          componentsFound++;
          componentMap.set(comp, (componentMap.get(comp) || 0) + 1);
        });
      }
    }
  });
  
  console.log(chalk.gray(`  ${decisionsWithComponents} decisions have affected_components`));
  console.log(chalk.gray(`  ${componentsFound} total component references`));
  console.log(chalk.gray(`  ${componentMap.size} unique components`));
  
  if (decisionsWithComponents === 0) {
    issues.push('No decisions have affected_components defined');
    console.log(chalk.red('✗ No affected_components found in any decision'));
    info.push('The Architecture graph requires at least one decision with affected_components');
  } else {
    console.log(chalk.green(`✓ Found ${componentMap.size} unique components across ${decisionsWithComponents} decisions`));
  }
  
  // 5. Show sample affected_components if none found
  if (decisionsWithComponents === 0 && decisions.length > 0) {
    console.log(chalk.cyan('\n📝 Example of adding affected_components to a decision:'));
    console.log(chalk.gray(`
  - id: ${decisions[0].id}
    title: ${decisions[0].title}
    # ... other fields ...
    affected_components:
      - src/components/UserAuth.js
      - server/api/auth.mjs
      - docs/authentication.md
`));
  }
  
  // 6. Check for common patterns in existing components
  if (componentMap.size > 0) {
    console.log(chalk.cyan('\n📊 Component Statistics:'));
    const sortedComponents = Array.from(componentMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    sortedComponents.forEach(([comp, count]) => {
      console.log(chalk.gray(`  ${comp}: ${count} decision${count > 1 ? 's' : ''}`));
    });
  }
  
  // 7. Check server accessibility
  try {
    const response = await fetch('http://localhost:8080/api/health');
    if (response.ok) {
      console.log(chalk.green('✓ Server is accessible at localhost:8080'));
    } else {
      warnings.push(`Server returned status ${response.status}`);
      console.log(chalk.yellow(`⚠ Server returned status ${response.status}`));
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      warnings.push('Server not running on localhost:8080');
      console.log(chalk.yellow('⚠ Server not running (run: decision-tapestry start)'));
    } else {
      warnings.push(`Cannot connect to server: ${error.message}`);
      console.log(chalk.yellow('⚠ Cannot connect to server'));
    }
  }
  
  reportResults(issues, warnings, info);
}

function reportResults(issues, warnings, info) {
  console.log(chalk.blue('\n📋 Diagnostic Summary:\n'));
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log(chalk.green('✅ No issues found! The Architecture graph should be working.'));
    console.log(chalk.gray('\nIf you still don\'t see the graph:'));
    console.log(chalk.gray('1. Make sure you\'re on the Architecture tab'));
    console.log(chalk.gray('2. Check browser console for errors'));
    console.log(chalk.gray('3. Try refreshing the page (Ctrl/Cmd + R)'));
    console.log(chalk.gray('4. Verify decisions have affected_components defined'));
  } else {
    if (issues.length > 0) {
      console.log(chalk.red('❌ Issues found:'));
      issues.forEach(issue => console.log(chalk.red(`   • ${issue}`)));
    }
    
    if (warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      warnings.forEach(warning => console.log(chalk.yellow(`   • ${warning}`)));
    }
  }
  
  if (info.length > 0) {
    console.log(chalk.cyan('\nℹ️  Additional Information:'));
    info.forEach(i => console.log(chalk.cyan(`   • ${i}`)));
  }
  
  console.log(chalk.gray('\n💡 Quick fixes:'));
  console.log(chalk.gray('1. Add affected_components to your decisions'));
  console.log(chalk.gray('2. Run: decision-tapestry validate'));
  console.log(chalk.gray('3. Run: decision-tapestry start'));
  console.log(chalk.gray('4. Navigate to http://localhost:8080'));
  console.log(chalk.gray('5. Click on the Architecture tab'));
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error(chalk.red('\n❌ Diagnostic tool error:'), error);
  process.exit(1);
});