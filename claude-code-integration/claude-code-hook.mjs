#!/usr/bin/env node

/**
 * Claude Code Hook System
 * Agent-3 (Integration) - Decision #58
 * 
 * This module provides a hook system that can be integrated with Claude Code
 * to automatically detect and broadcast tool usage activities.
 * 
 * Enhanced with Visual Communication Integration
 */

import { monitor } from './monitor.mjs';
import { visualCoordinator } from './ai-visual-coordinator.mjs';
import canvas from './ai-canvas-helper.mjs';

/**
 * Tool hook interceptor
 * This function should be called whenever Claude Code uses a tool
 */
export async function onToolUse(toolName, parameters) {
  // Process the tool usage through our monitor
  await monitor.processToolUsage(toolName, parameters);
  
  // Check if this tool usage should trigger a visual
  await checkVisualOpportunity(toolName, parameters);
}

/**
 * Check if tool usage presents a visual opportunity
 */
async function checkVisualOpportunity(toolName, parameters) {
  try {
    // Specific visual triggers based on tool usage
    switch (toolName) {
      case 'Edit':
      case 'MultiEdit':
        // Show code changes visually
        if (parameters.old_string && parameters.new_string) {
          const comparison = await canvas.showComparison(
            `<pre style="background: #ffebee; padding: 10px;">${escapeHtml(parameters.old_string)}</pre>`,
            `<pre style="background: #e8f5e9; padding: 10px;">${escapeHtml(parameters.new_string)}</pre>`,
            { beforeLabel: 'Before', afterLabel: 'After' }
          );
        }
        break;
        
      case 'Write':
        // Show new file creation
        if (parameters.file_path && parameters.content) {
          const language = getLanguageFromPath(parameters.file_path);
          if (isCodeFile(parameters.file_path)) {
            await canvas.showCode(parameters.content.slice(0, 500), language);
          }
        }
        break;
        
      case 'Bash':
        // Visualize test results or build processes
        if (parameters.command && isTestCommand(parameters.command)) {
          await visualizeTestExecution(parameters.command);
        }
        break;
        
      case 'TodoWrite':
        // Show progress visualization
        if (parameters.todos && Array.isArray(parameters.todos)) {
          const steps = parameters.todos.map(t => t.content);
          const currentIndex = parameters.todos.findIndex(t => t.status === 'in_progress');
          await canvas.showProgress(steps, currentIndex >= 0 ? currentIndex : 0);
        }
        break;
    }
  } catch (error) {
    console.error('[Visual Hook] Error generating visual:', error);
  }
}

/**
 * Helper functions for visual generation
 */
function escapeHtml(str) {
  const div = document.createElement ? document.createElement('div') : { textContent: '' };
  div.textContent = str;
  return div.innerHTML || str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

function getLanguageFromPath(filePath) {
  const ext = filePath.split('.').pop();
  const langMap = {
    js: 'javascript', mjs: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python', rb: 'ruby', go: 'go',
    java: 'java', cpp: 'cpp', c: 'c',
    html: 'html', css: 'css', scss: 'scss',
    json: 'json', yaml: 'yaml', yml: 'yaml',
    md: 'markdown', sh: 'bash', bash: 'bash'
  };
  return langMap[ext] || 'text';
}

function isCodeFile(filePath) {
  const codeExtensions = ['.js', '.mjs', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go', '.java', '.cpp', '.c', '.h'];
  return codeExtensions.some(ext => filePath.endsWith(ext));
}

function isTestCommand(command) {
  return /test|spec|jest|mocha|vitest|pytest/.test(command);
}

async function visualizeTestExecution(command) {
  const html = `
    <div style="font-family: Arial; padding: 20px;">
      <h3>🧪 Test Execution</h3>
      <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace;">
        $ ${command}
      </div>
      <div style="margin-top: 15px;">
        <div style="display: flex; align-items: center;">
          <div style="width: 20px; height: 20px; background: #4caf50; border-radius: 50%; margin-right: 10px;"></div>
          <span>Running tests...</span>
        </div>
      </div>
    </div>
  `;
  await canvas.showHTML(html);
}

/**
 * Decision context setter
 * Call this when working on a specific decision
 */
export function setDecisionContext(decisionId) {
  monitor.setCurrentDecision(decisionId);
}

/**
 * Activity tracking toggle
 */
export function toggleActivityTracking(enabled) {
  return monitor.toggleTracking(enabled);
}

/**
 * Get monitoring status
 */
export function getMonitoringStatus() {
  return monitor.getStatus();
}

/**
 * Claude Code Integration Proxy
 * This class wraps Claude Code tool functions to add monitoring
 */
export class ClaudeCodeProxy {
  constructor() {
    this.hooks = new Map();
    this.originalTools = new Map();
  }

  /**
   * Register a tool for monitoring
   */
  registerTool(toolName, toolFunction) {
    // Store the original function
    this.originalTools.set(toolName, toolFunction);
    
    // Create a wrapped version that includes monitoring
    const wrappedTool = async (...args) => {
      // Extract parameters (assumes first arg is parameters object)
      const parameters = args[0] || {};
      
      // Call the hook before executing the tool
      await onToolUse(toolName, parameters);
      
      // Execute the original tool
      const result = await toolFunction(...args);
      
      return result;
    };
    
    this.hooks.set(toolName, wrappedTool);
    return wrappedTool;
  }

  /**
   * Get a wrapped tool function
   */
  getWrappedTool(toolName) {
    return this.hooks.get(toolName);
  }

  /**
   * Get all wrapped tools
   */
  getAllWrappedTools() {
    return Object.fromEntries(this.hooks);
  }
}

// Example integration code for Claude Code
export function integrateWithClaudeCode(claudeCodeTools) {
  const proxy = new ClaudeCodeProxy();
  const wrappedTools = {};
  
  // Wrap each tool with monitoring
  for (const [toolName, toolFunction] of Object.entries(claudeCodeTools)) {
    wrappedTools[toolName] = proxy.registerTool(toolName, toolFunction);
  }
  
  return wrappedTools;
}

// Session management utilities
let sessionActive = false;
let sessionStartTime = null;

/**
 * Start an activity tracking session
 */
export function startSession(decisionId = null) {
  sessionActive = true;
  sessionStartTime = new Date();
  
  if (decisionId) {
    setDecisionContext(decisionId);
  }
  
  console.log(`[Agent-3] Activity session started${decisionId ? ` for decision ${decisionId}` : ''}`);
  
  // Broadcast idle state to indicate session start
  monitor.broadcastActivity('idle', decisionId, 'Session started');
}

/**
 * End the activity tracking session
 */
export function endSession() {
  if (!sessionActive) return;
  
  sessionActive = false;
  const duration = sessionStartTime ? (Date.now() - sessionStartTime) / 1000 : 0;
  
  console.log(`[Agent-3] Activity session ended (duration: ${duration}s)`);
  
  // Broadcast idle state to indicate session end
  monitor.broadcastActivity('idle', null, 'Session ended');
}

/**
 * Check if a session is active
 */
export function isSessionActive() {
  return sessionActive;
}

// Auto-detection utilities for common Claude Code patterns
export const Patterns = {
  /**
   * Detect if working on tests
   */
  isTestingActivity: (toolName, parameters) => {
    if (toolName === 'Bash' && parameters.command) {
      return /test|spec|jest|mocha|vitest|pytest/.test(parameters.command);
    }
    if (toolName === 'Edit' || toolName === 'Read') {
      return /test|spec/.test(parameters.file_path || '');
    }
    return false;
  },

  /**
   * Detect if debugging
   */
  isDebuggingActivity: (toolName, parameters) => {
    if (toolName === 'Grep') return true;
    if (toolName === 'Edit' && parameters.new_string) {
      return /console\.log|debug|error|fix|bug/.test(parameters.new_string);
    }
    return false;
  },

  /**
   * Detect documentation work
   */
  isDocumentationActivity: (toolName, parameters) => {
    const path = parameters.file_path || '';
    return /\.md$|README|CHANGELOG|docs\//.test(path);
  }
};

/**
 * Visual Enhancement Proxy
 * Wraps responses to automatically generate visuals
 */
export class VisualEnhancementProxy {
  constructor() {
    this.lastVisualTime = null;
    this.visualThreshold = 30000; // 30 seconds between visuals
  }

  /**
   * Enhance a response with automatic visuals
   */
  async enhanceResponse(responseText) {
    // Check if enough time has passed since last visual
    const now = Date.now();
    if (this.lastVisualTime && (now - this.lastVisualTime) < this.visualThreshold) {
      return responseText;
    }

    // Analyze response for visual opportunities
    const enhanced = await visualCoordinator.processResponse(responseText);
    
    if (enhanced.visuals && enhanced.visuals.length > 0) {
      this.lastVisualTime = now;
      console.log(`[Visual Enhancement] Generated ${enhanced.visuals.length} visual(s)`);
    }

    return responseText;
  }

  /**
   * Set visual generation preferences
   */
  setPreferences(preferences) {
    visualCoordinator.updatePreferences(preferences);
  }
}

// Create singleton instance
export const visualEnhancer = new VisualEnhancementProxy();

// Export everything for flexible integration
export default {
  onToolUse,
  setDecisionContext,
  toggleActivityTracking,
  getMonitoringStatus,
  ClaudeCodeProxy,
  integrateWithClaudeCode,
  startSession,
  endSession,
  isSessionActive,
  Patterns,
  monitor,
  visualCoordinator,
  visualEnhancer,
  canvas
};