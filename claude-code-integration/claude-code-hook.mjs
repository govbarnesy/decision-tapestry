#!/usr/bin/env node

/**
 * Claude Code Hook System
 * Agent-3 (Integration) - Decision #58
 * 
 * This module provides a hook system that can be integrated with Claude Code
 * to automatically detect and broadcast tool usage activities.
 */

import { monitor } from './monitor.mjs';

/**
 * Tool hook interceptor
 * This function should be called whenever Claude Code uses a tool
 */
export async function onToolUse(toolName, parameters) {
  // Process the tool usage through our monitor
  await monitor.processToolUsage(toolName, parameters);
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
  monitor
};