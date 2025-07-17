/**
 * Quick Decision Builder
 * Creates streamlined decisions for immediate agent execution
 */

import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class QuickDecisionBuilder {
  constructor() {
    this.decisionsPath = path.resolve('decisions.yml');
  }

  /**
   * Create a quick decision from a task description
   */
  async createQuickDecision(description, options = {}) {
    // Load existing decisions to get next ID
    const decisionsData = await this.loadDecisions();
    const nextId = this.getNextDecisionId(decisionsData.decisions);
    
    // Get current author
    const author = await this.getCurrentAuthor();
    
    // Build the decision
    const decision = {
      id: nextId,
      title: this.formatTitle(description),
      author: author,
      date: new Date().toISOString(),
      status: "In Progress",
      rationale: [
        `Quick task: ${description}`,
        "Created via quick-task command for immediate execution"
      ],
      tradeoffs: [
        "Less planning upfront may require refactoring later",
        "Quick execution prioritized over comprehensive design"
      ],
      tasks: this.generateTasks(description, options.tasks),
      affected_components: options.files || [],
      category: options.category || "Ad-hoc",
      quick_task: true,
      priority: options.priority || "medium"
    };
    
    // Add related decisions if specified
    if (options.related) {
      decision.related_to = Array.isArray(options.related) ? options.related : [options.related];
    }
    
    return decision;
  }
  
  /**
   * Load existing decisions
   */
  async loadDecisions() {
    try {
      const content = await fs.readFile(this.decisionsPath, 'utf8');
      return yaml.load(content);
    } catch (error) {
      console.error('Error loading decisions:', error);
      return { decisions: [], backlog: [] };
    }
  }
  
  /**
   * Get the next available decision ID
   */
  getNextDecisionId(decisions) {
    if (!decisions || decisions.length === 0) return 1;
    
    const maxId = Math.max(...decisions.map(d => d.id || 0));
    return maxId + 1;
  }
  
  /**
   * Get current author from git config
   */
  async getCurrentAuthor() {
    try {
      const { stdout: name } = await execAsync('git config user.name');
      const { stdout: email } = await execAsync('git config user.email');
      return `${name.trim()} <${email.trim()}>`;
    } catch {
      return 'Quick Task Author';
    }
  }
  
  /**
   * Format the title from description
   */
  formatTitle(description) {
    // Capitalize first letter and ensure it's not too long
    const formatted = description.charAt(0).toUpperCase() + description.slice(1);
    
    // If it's too long, truncate and add ellipsis
    if (formatted.length > 80) {
      return formatted.substring(0, 77) + '...';
    }
    
    return formatted;
  }
  
  /**
   * Generate tasks from description and additional tasks
   */
  generateTasks(description, additionalTasks = []) {
    const tasks = [];
    
    // Always include the main task
    tasks.push({
      description: description,
      status: "Pending"
    });
    
    // Add any additional tasks provided
    if (additionalTasks && additionalTasks.length > 0) {
      additionalTasks.forEach(task => {
        tasks.push({
          description: task,
          status: "Pending"
        });
      });
    } else {
      // Add default completion tasks if none specified
      tasks.push({
        description: "Test implementation",
        status: "Pending"
      });
      tasks.push({
        description: "Update documentation if needed",
        status: "Pending"
      });
    }
    
    return tasks;
  }
  
  /**
   * Add decision to decisions.yml
   */
  async addDecisionToFile(decision) {
    const decisionsData = await this.loadDecisions();
    
    // Add the new decision
    decisionsData.decisions.push(decision);
    
    // Save back to file
    const yamlContent = yaml.dump(decisionsData, {
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
    
    await fs.writeFile(this.decisionsPath, yamlContent, 'utf8');
    
    return decision;
  }
  
  /**
   * Convert quick task to full decision
   * (for future enhancement)
   */
  async enhanceQuickDecision(decisionId, enhancements) {
    const decisionsData = await this.loadDecisions();
    const decisionIndex = decisionsData.decisions.findIndex(d => d.id === decisionId);
    
    if (decisionIndex === -1) {
      throw new Error(`Decision #${decisionId} not found`);
    }
    
    const decision = decisionsData.decisions[decisionIndex];
    
    // Remove quick_task flag
    delete decision.quick_task;
    
    // Apply enhancements
    if (enhancements.rationale) {
      decision.rationale = enhancements.rationale;
    }
    if (enhancements.tradeoffs) {
      decision.tradeoffs = enhancements.tradeoffs;
    }
    if (enhancements.related_to) {
      decision.related_to = enhancements.related_to;
    }
    if (enhancements.github_metadata) {
      decision.github_metadata = enhancements.github_metadata;
    }
    
    // Save updated decision
    const yamlContent = yaml.dump(decisionsData, {
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
    
    await fs.writeFile(this.decisionsPath, yamlContent, 'utf8');
    
    return decision;
  }
}

/**
 * Singleton instance
 */
export const quickDecisionBuilder = new QuickDecisionBuilder();