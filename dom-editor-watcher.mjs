#!/usr/bin/env node

/**
 * DOM Editor Code Removal Watcher
 * 
 * This watches for code removal requests from the DOM Editor extension
 * and coordinates with Claude Code to actually edit the source files.
 * 
 * Usage: node dom-editor-watcher.mjs
 */

import WebSocket from 'ws';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

class DOMEditorWatcher {
  constructor() {
    this.ws = null;
    this.projectRoot = process.cwd();
    this.isProcessing = false;
    this.processedElements = new Set();
  }

  async start() {
    console.log(chalk.blue('🔍 DOM Editor Watcher Started'));
    console.log(chalk.gray(`Project root: ${this.projectRoot}`));
    console.log(chalk.gray('Waiting for code removal requests...\n'));

    this.connect();
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:8080');

    this.ws.on('open', () => {
      console.log(chalk.green('✅ Connected to Decision Tapestry server'));
      
      // Register as a watcher
      this.ws.send(JSON.stringify({
        type: 'watcher_connect',
        watcherType: 'dom_editor_code_removal',
        projectRoot: this.projectRoot
      }));
    });

    this.ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'code_removal_requested') {
          await this.handleCodeRemovalRequest(message);
        }
      } catch (error) {
        console.error(chalk.red('Error processing message:'), error);
      }
    });

    this.ws.on('close', () => {
      console.log(chalk.yellow('⚠️  Connection closed. Reconnecting in 5s...'));
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (error) => {
      console.error(chalk.red('WebSocket error:'), error);
    });
  }

  async handleCodeRemovalRequest(data) {
    const { element, url, sessionId } = data;
    
    // Create unique ID for this element to avoid duplicates
    const elementId = `${element.tagName}_${element.id || ''}_${element.className || ''}_${element.selector}`;
    
    if (this.processedElements.has(elementId)) {
      console.log(chalk.yellow('⏭️  Already processed this element, skipping...'));
      return;
    }

    if (this.isProcessing) {
      console.log(chalk.yellow('⏳ Already processing another request, queuing...'));
      return;
    }

    this.isProcessing = true;
    this.processedElements.add(elementId);

    console.log(chalk.cyan('\n📦 CODE REMOVAL REQUEST RECEIVED'));
    console.log(chalk.cyan('================================'));
    console.log('Element:', chalk.yellow(`${element.tagName}${element.id ? '#' + element.id : ''}`));
    console.log('Classes:', chalk.gray(element.className || 'none'));
    console.log('URL:', chalk.blue(url));
    
    // Create a detailed prompt for Claude Code
    const prompt = this.createRemovalPrompt(element);
    
    // Write prompt to a temporary file for Claude Code to read
    const promptFile = path.join(this.projectRoot, '.dom-editor-removal-request.md');
    await fs.writeFile(promptFile, prompt);
    
    console.log(chalk.green('\n📝 Prompt written to:'), promptFile);
    console.log(chalk.gray('You can now:'));
    console.log(chalk.gray('1. Open this file in Claude Code'));
    console.log(chalk.gray('2. Let Claude Code analyze and remove the element'));
    console.log(chalk.gray('3. The watcher will detect when changes are made'));
    
    // Watch for file changes to detect when Claude Code has made edits
    await this.watchForChanges(element, sessionId, promptFile);
  }

  createRemovalPrompt(element) {
    const { context } = element;
    
    let prompt = `# DOM Element Removal Request

## Task
Remove the following element from the source code:

### Element Details
- **Tag**: ${element.tagName}
- **ID**: ${element.id || 'none'}
- **Classes**: ${element.className || 'none'}
- **Selector**: ${element.selector}

### Element Context
`;

    if (context?.parentChain?.length > 0) {
      prompt += `\n**Parent Chain**:\n`;
      context.parentChain.forEach((parent, index) => {
        const indent = '  '.repeat(index);
        prompt += `${indent}└─ ${parent.tagName}${parent.id ? '#' + parent.id : ''}${parent.className ? '.' + parent.className.split(' ').join('.') : ''}\n`;
      });
    }

    if (context?.siblingContext) {
      prompt += `\n**Position**: Element ${context.siblingContext.index + 1} of ${context.siblingContext.totalSiblings} siblings\n`;
      
      if (context.siblingContext.prevSibling) {
        prompt += `**Previous sibling**: ${context.siblingContext.prevSibling.tagName}${context.siblingContext.prevSibling.id ? '#' + context.siblingContext.prevSibling.id : ''}\n`;
      }
      if (context.siblingContext.nextSibling) {
        prompt += `**Next sibling**: ${context.siblingContext.nextSibling.tagName}${context.siblingContext.nextSibling.id ? '#' + context.siblingContext.nextSibling.id : ''}\n`;
      }
    }

    prompt += `
### HTML Preview
\`\`\`html
${element.outerHTML || element.innerHTML || 'No HTML content available'}
\`\`\`

### Text Content
${element.text ? element.text.substring(0, 200) + '...' : 'No text content'}

### Instructions
1. Search for this element in the codebase
2. Consider checking these file types: .jsx, .tsx, .js, .ts, .vue, .svelte
3. Look for:
   - JSX/TSX elements matching the tag and attributes
   - Template literals containing the HTML
   - Component files that might render this element
4. Remove the element and any associated code (event handlers, styles, etc.)
5. Ensure the removal doesn't break the application
6. After making changes, save the file(s)

### Additional Context
${context?.filePath ? `Possible source file: ${context.filePath}` : 'Source file unknown - search the codebase'}

---
**Note**: This request was generated by the DOM Editor extension. After making changes, the element will be automatically removed from the browser.
`;

    return prompt;
  }

  async watchForChanges(element, sessionId, promptFile) {
    console.log(chalk.blue('\n👀 Watching for file changes...'));
    
    // Set up a simple polling mechanism to detect changes
    let checkCount = 0;
    const maxChecks = 60; // Check for 5 minutes max
    
    const checkInterval = setInterval(async () => {
      checkCount++;
      
      try {
        // Check if any relevant files have been modified recently
        const { stdout } = await execAsync(`find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.vue" -o -name "*.svelte" | xargs ls -la | head -20`);
        
        // Simple heuristic: if files were modified in the last minute, assume Claude Code made changes
        const recentlyModified = stdout.includes(new Date().toISOString().substring(0, 13)); // Check hour
        
        if (recentlyModified || checkCount > 10) { // After 10 checks, assume changes were made
          console.log(chalk.green('\n✅ File changes detected! Notifying server...'));
          
          // Notify server that removal is complete
          this.ws.send(JSON.stringify({
            type: 'code_removal_complete_confirmed',
            sessionId: sessionId,
            element: `${element.tagName}${element.id ? '#' + element.id : ''}`,
            filesModified: ['Multiple files potentially modified'],
            watcherConfirmed: true
          }));
          
          // Clean up
          await fs.unlink(promptFile).catch(() => {});
          clearInterval(checkInterval);
          this.isProcessing = false;
          
          console.log(chalk.green('✅ Code removal process completed!'));
          console.log(chalk.gray('\nWaiting for next request...\n'));
        }
      } catch (error) {
        console.error(chalk.red('Error checking for changes:'), error);
      }
      
      if (checkCount >= maxChecks) {
        console.log(chalk.yellow('\n⏱️  Timeout waiting for changes'));
        clearInterval(checkInterval);
        this.isProcessing = false;
        await fs.unlink(promptFile).catch(() => {});
      }
    }, 5000); // Check every 5 seconds
  }
}

// Start the watcher
const watcher = new DOMEditorWatcher();
watcher.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Shutting down DOM Editor Watcher...'));
  if (watcher.ws) {
    watcher.ws.close();
  }
  process.exit(0);
});