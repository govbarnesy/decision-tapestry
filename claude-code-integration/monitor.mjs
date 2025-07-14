#!/usr/bin/env node

/**
 * Claude Code Activity Monitor
 * Agent-3 (Integration) - Decision #58
 * 
 * This module monitors Claude Code tool usage and automatically detects
 * development activities, mapping them to decisions and broadcasting updates
 * to the Decision Tapestry server.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SERVER_URL = process.env.DECISION_TAPESTRY_URL || 'http://localhost:8080';
const AGENT_ID = 'claude-code';
const ACTIVITY_TRACKING_ENABLED = process.env.DISABLE_ACTIVITY_TRACKING !== 'true';

// Activity state mappings based on tool usage patterns
const TOOL_TO_STATE_MAP = {
  'Edit': 'working',
  'MultiEdit': 'working',
  'Write': 'working',
  'Read': 'reviewing',
  'NotebookEdit': 'working',
  'NotebookRead': 'reviewing',
  'Bash': 'testing',
  'Grep': 'debugging',
  'LS': 'reviewing',
  'Glob': 'reviewing',
  'WebSearch': 'reviewing',
  'WebFetch': 'reviewing',
  'TodoWrite': 'working'
};

// Pattern detection for more specific activity classification
const ACTIVITY_PATTERNS = {
  testing: [
    /npm test/i,
    /yarn test/i,
    /jest/i,
    /mocha/i,
    /vitest/i,
    /pytest/i,
    /go test/i,
    /cargo test/i
  ],
  debugging: [
    /console\.log/i,
    /debug/i,
    /fix/i,
    /error/i,
    /bug/i,
    /traceback/i,
    /exception/i
  ],
  working: [
    /implement/i,
    /create/i,
    /add/i,
    /update/i,
    /refactor/i,
    /build/i
  ]
};

class ClaudeCodeMonitor {
  constructor() {
    this.decisionsCache = null;
    this.lastActivity = null;
    this.activityDebounceTimer = null;
    this.currentDecisionId = null;
    this.fileToDecisionMap = new Map();
    
    console.log('[Agent-3] Claude Code Monitor initialized');
    console.log(`[Agent-3] Server URL: ${SERVER_URL}`);
    console.log(`[Agent-3] Activity tracking: ${ACTIVITY_TRACKING_ENABLED ? 'enabled' : 'disabled'}`);
  }

  /**
   * Load and cache decisions data
   */
  async loadDecisions() {
    try {
      const decisionsPath = path.join(process.cwd(), 'decisions.yml');
      if (!fs.existsSync(decisionsPath)) {
        console.log('[Agent-3] No decisions.yml found in current directory');
        return null;
      }
      
      const content = fs.readFileSync(decisionsPath, 'utf8');
      this.decisionsCache = yaml.load(content);
      
      // Build file-to-decision mapping
      this.buildFileToDecisionMap();
      
      return this.decisionsCache;
    } catch (error) {
      console.error('[Agent-3] Error loading decisions:', error.message);
      return null;
    }
  }

  /**
   * Build a map of file paths to decision IDs
   */
  buildFileToDecisionMap() {
    if (!this.decisionsCache?.decisions) return;
    
    this.fileToDecisionMap.clear();
    
    this.decisionsCache.decisions.forEach(decision => {
      if (decision.affected_components && Array.isArray(decision.affected_components)) {
        decision.affected_components.forEach(component => {
          // Normalize the path
          const normalizedPath = component.startsWith('/') ? component : `/${component}`;
          this.fileToDecisionMap.set(normalizedPath, decision.id);
        });
      }
    });
    
    console.log(`[Agent-3] Built file-to-decision map with ${this.fileToDecisionMap.size} entries`);
  }

  /**
   * Determine which decision a file path relates to
   */
  getDecisionForFile(filePath) {
    if (!filePath) return null;
    
    // Try exact match first
    if (this.fileToDecisionMap.has(filePath)) {
      return this.fileToDecisionMap.get(filePath);
    }
    
    // Try relative path variations
    const relativePath = filePath.replace(process.cwd(), '').replace(/^\//, '');
    if (this.fileToDecisionMap.has(relativePath)) {
      return this.fileToDecisionMap.get(relativePath);
    }
    
    // Try to match parent directories
    const pathParts = relativePath.split('/');
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const partialPath = pathParts.slice(0, i + 1).join('/');
      for (const [mapPath, decisionId] of this.fileToDecisionMap) {
        if (mapPath.includes(partialPath) || partialPath.includes(mapPath)) {
          return decisionId;
        }
      }
    }
    
    return null;
  }

  /**
   * Detect activity state based on tool and context
   */
  detectActivityState(tool, parameters) {
    // Start with basic tool mapping
    let state = TOOL_TO_STATE_MAP[tool] || 'working';
    
    // Refine based on parameters
    if (tool === 'Bash' && parameters.command) {
      const command = parameters.command.toLowerCase();
      
      // Check for testing patterns
      if (ACTIVITY_PATTERNS.testing.some(pattern => pattern.test(command))) {
        state = 'testing';
      }
      // Check for debugging patterns
      else if (ACTIVITY_PATTERNS.debugging.some(pattern => pattern.test(command))) {
        state = 'debugging';
      }
    }
    
    // Check file content for patterns
    if ((tool === 'Edit' || tool === 'MultiEdit') && parameters.new_string) {
      const content = parameters.new_string.toLowerCase();
      
      if (ACTIVITY_PATTERNS.debugging.some(pattern => pattern.test(content))) {
        state = 'debugging';
      }
    }
    
    return state;
  }

  /**
   * Extract task description from tool parameters
   */
  extractTaskDescription(tool, parameters) {
    switch (tool) {
      case 'Edit':
      case 'MultiEdit':
        return `Editing ${parameters.file_path || 'file'}`;
      
      case 'Write':
        return `Creating ${parameters.file_path || 'file'}`;
      
      case 'Read':
        return `Reading ${parameters.file_path || 'file'}`;
      
      case 'Bash':
        return parameters.description || `Running: ${parameters.command?.substring(0, 50)}...`;
      
      case 'Grep':
        return `Searching for: ${parameters.pattern}`;
      
      case 'TodoWrite':
        return 'Updating task list';
      
      default:
        return `Using ${tool} tool`;
    }
  }

  /**
   * Process a tool usage event
   */
  async processToolUsage(tool, parameters) {
    if (!ACTIVITY_TRACKING_ENABLED) return;
    
    console.log(`[Agent-3] Tool usage detected: ${tool}`);
    
    // Reload decisions if needed
    if (!this.decisionsCache) {
      await this.loadDecisions();
    }
    
    // Determine decision ID from file path if available
    let decisionId = this.currentDecisionId;
    if (parameters.file_path) {
      const fileDecisionId = this.getDecisionForFile(parameters.file_path);
      if (fileDecisionId) {
        decisionId = fileDecisionId;
        console.log(`[Agent-3] Mapped file ${parameters.file_path} to decision ${decisionId}`);
      }
    }
    
    // Detect activity state
    const state = this.detectActivityState(tool, parameters);
    const taskDescription = this.extractTaskDescription(tool, parameters);
    
    // Debounce rapid tool usage
    if (this.activityDebounceTimer) {
      clearTimeout(this.activityDebounceTimer);
    }
    
    this.activityDebounceTimer = setTimeout(() => {
      this.broadcastActivity(state, decisionId, taskDescription);
    }, 500);
  }

  /**
   * Broadcast activity to the Decision Tapestry server
   */
  async broadcastActivity(state, decisionId, taskDescription) {
    try {
      const activityData = {
        agentId: AGENT_ID,
        state,
        decisionId: decisionId || null,
        taskDescription
      };
      
      console.log(`[Agent-3] Broadcasting activity:`, activityData);
      
      const response = await fetch(`${SERVER_URL}/api/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      });
      
      if (response.ok) {
        console.log('[Agent-3] Activity broadcast successful');
        this.lastActivity = activityData;
      } else {
        console.error('[Agent-3] Activity broadcast failed:', await response.text());
      }
    } catch (error) {
      console.error('[Agent-3] Error broadcasting activity:', error.message);
    }
  }

  /**
   * Set the current decision context
   */
  setCurrentDecision(decisionId) {
    this.currentDecisionId = decisionId;
    console.log(`[Agent-3] Current decision context set to: ${decisionId}`);
  }

  /**
   * Toggle activity tracking on/off
   */
  toggleTracking(enabled) {
    console.log(`[Agent-3] Activity tracking ${enabled ? 'enabled' : 'disabled'}`);
    return enabled;
  }

  /**
   * Get current monitoring status
   */
  getStatus() {
    return {
      enabled: ACTIVITY_TRACKING_ENABLED,
      serverUrl: SERVER_URL,
      currentDecision: this.currentDecisionId,
      lastActivity: this.lastActivity,
      fileMapSize: this.fileToDecisionMap.size
    };
  }
}

// Export singleton instance
export const monitor = new ClaudeCodeMonitor();

// CLI interface for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[Agent-3] Claude Code Monitor - Test Mode');
  
  // Test commands
  const command = process.argv[2];
  
  switch (command) {
    case 'test-edit':
      await monitor.processToolUsage('Edit', {
        file_path: '/Users/barnesy/Projects/decision-tapestry/server/server.mjs',
        old_string: 'test',
        new_string: 'console.log("debugging");'
      });
      break;
      
    case 'test-bash':
      await monitor.processToolUsage('Bash', {
        command: 'npm test',
        description: 'Running tests'
      });
      break;
      
    case 'test-read':
      await monitor.processToolUsage('Read', {
        file_path: '/Users/barnesy/Projects/decision-tapestry/decisions.yml'
      });
      break;
      
    case 'status':
      console.log('Monitor status:', monitor.getStatus());
      break;
      
    default:
      console.log('Usage: node monitor.mjs [test-edit|test-bash|test-read|status]');
  }
  
  // Keep process alive for a moment to allow async operations to complete
  setTimeout(() => process.exit(0), 2000);
}