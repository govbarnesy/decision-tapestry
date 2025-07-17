/**
 * AI Visual Coordinator
 * Intelligent system for detecting visual communication opportunities
 * and automatically generating helpful visualizations
 */

import canvas from './ai-canvas-helper.mjs';

// Pattern detection for visual opportunities
const VISUAL_TRIGGERS = {
  codeExplanation: {
    pattern: /explain|how does|what does|understand|implement|create|build/i,
    visualType: 'code',
    priority: 'high'
  },
  architecture: {
    pattern: /architecture|system|design|structure|component|module|service/i,
    visualType: 'diagram',
    priority: 'high'
  },
  comparison: {
    pattern: /compare|difference|before.*after|vs\.|versus|option|alternative/i,
    visualType: 'comparison',
    priority: 'medium'
  },
  process: {
    pattern: /step|process|flow|sequence|order|workflow|procedure/i,
    visualType: 'flowchart',
    priority: 'high'
  },
  debugging: {
    pattern: /error|bug|issue|problem|fix|debug|troubleshoot/i,
    visualType: 'diagnostic',
    priority: 'high'
  },
  dataStructure: {
    pattern: /data|structure|schema|model|database|entity|relationship/i,
    visualType: 'data',
    priority: 'medium'
  },
  uiDesign: {
    pattern: /ui|interface|screen|layout|wireframe|mockup|design/i,
    visualType: 'wireframe',
    priority: 'high'
  },
  progress: {
    pattern: /progress|status|complete|done|todo|task|milestone/i,
    visualType: 'progress',
    priority: 'medium'
  },
  testing: {
    pattern: /test|testing|coverage|unit|integration|e2e/i,
    visualType: 'testResults',
    priority: 'medium'
  },
  performance: {
    pattern: /performance|speed|optimization|latency|throughput/i,
    visualType: 'metrics',
    priority: 'medium'
  }
};

// Context tracking for smarter visual generation
class ConversationContext {
  constructor() {
    this.history = [];
    this.currentTopic = null;
    this.visualHistory = [];
    this.lastVisualTime = null;
    this.codeContext = [];
    this.decisionContext = null;
  }

  addMessage(message, role = 'user') {
    this.history.push({ message, role, timestamp: new Date() });
    this.updateTopic(message);
  }

  updateTopic(message) {
    // Simple topic detection - can be enhanced with NLP
    for (const [topic, trigger] of Object.entries(VISUAL_TRIGGERS)) {
      if (trigger.pattern.test(message)) {
        this.currentTopic = topic;
        break;
      }
    }
  }

  addVisual(type, content) {
    this.visualHistory.push({
      type,
      content,
      timestamp: new Date(),
      topic: this.currentTopic
    });
    this.lastVisualTime = new Date();
  }

  shouldGenerateVisual() {
    // Avoid visual spam - wait at least 30 seconds between visuals
    if (this.lastVisualTime) {
      const timeSinceLastVisual = Date.now() - this.lastVisualTime.getTime();
      if (timeSinceLastVisual < 30000) return false;
    }
    return true;
  }

  getRecentContext(lines = 5) {
    return this.history.slice(-lines);
  }
}

// Main Visual Coordinator
export class VisualCoordinator {
  constructor() {
    this.context = new ConversationContext();
    this.preferences = {
      autoGenerate: true,
      visualDensity: 'medium', // low, medium, high
      preferredTypes: ['diagrams', 'code', 'progress', 'wireframes'],
      alertOnNewVisual: true,
      clearCanvasOnTopicChange: false,
      minConfidence: 0.7
    };
  }

  /**
   * Analyze text for visual opportunities
   */
  async analyzeForVisuals(text, role = 'assistant') {
    if (!this.preferences.autoGenerate) return [];
    
    this.context.addMessage(text, role);
    const opportunities = [];

    // Check each trigger pattern
    for (const [triggerName, trigger] of Object.entries(VISUAL_TRIGGERS)) {
      if (trigger.pattern.test(text)) {
        const confidence = this.calculateConfidence(text, trigger);
        
        if (confidence >= this.preferences.minConfidence) {
          opportunities.push({
            type: trigger.visualType,
            trigger: triggerName,
            confidence,
            priority: trigger.priority,
            context: this.extractRelevantContext(text, trigger)
          });
        }
      }
    }

    // Sort by priority and confidence
    opportunities.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.confidence - a.confidence;
    });

    return opportunities;
  }

  /**
   * Calculate confidence score for visual generation
   */
  calculateConfidence(text, trigger) {
    let confidence = 0.5; // Base confidence

    // Strong match gives higher confidence
    const matches = text.match(trigger.pattern);
    if (matches && matches.length > 1) confidence += 0.2;

    // Context alignment
    if (this.context.currentTopic === trigger.visualType) confidence += 0.2;

    // Recent related visuals reduce confidence (avoid repetition)
    const recentVisuals = this.context.visualHistory.slice(-3);
    if (recentVisuals.some(v => v.type === trigger.visualType)) confidence -= 0.3;

    // Preferred visual types get boost
    if (this.preferences.preferredTypes.includes(trigger.visualType)) confidence += 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Extract relevant context for visual generation
   */
  extractRelevantContext(text, trigger) {
    // Extract key information based on trigger type
    const context = {
      fullText: text,
      keyPhrases: [],
      codeSnippets: [],
      data: {}
    };

    // Extract code blocks if present
    const codeBlocks = text.match(/```[\s\S]*?```/g);
    if (codeBlocks) {
      context.codeSnippets = codeBlocks.map(block => 
        block.replace(/```\w*\n?/, '').replace(/```$/, '').trim()
      );
    }

    // Extract lists
    const lists = text.match(/(?:^|\n)(?:[-*•]|\d+\.) .+/gm);
    if (lists) {
      context.keyPhrases.push(...lists.map(item => item.trim()));
    }

    // Specific extraction based on visual type
    switch (trigger.visualType) {
      case 'architecture': {
        // Extract component names
        const components = text.match(/\b[A-Z][a-zA-Z]*(?:Service|Component|Module|Layer|System)\b/g);
        if (components) context.data.components = [...new Set(components)];
        break;
      }

      case 'process': {
        // Extract numbered steps
        const steps = text.match(/(?:^|\n)\d+\. .+/gm);
        if (steps) context.data.steps = steps.map(s => s.replace(/^\d+\.\s*/, ''));
        break;
      }

      case 'comparison': {
        // Look for comparison indicators
        const comparisons = text.split(/vs\.|versus|compared to|instead of/i);
        if (comparisons.length > 1) {
          context.data.before = comparisons[0].trim();
          context.data.after = comparisons[1].trim();
        }
        break;
      }
    }

    return context;
  }

  /**
   * Generate visual based on opportunity
   */
  async generateVisual(opportunity) {
    if (!this.context.shouldGenerateVisual()) return null;

    try {
      const visual = await this.createVisual(opportunity);
      if (visual) {
        this.context.addVisual(opportunity.type, visual);
        return visual;
      }
    } catch (error) {
      console.error('Error generating visual:', error);
    }
    return null;
  }

  /**
   * Create specific visual based on type and context
   */
  async createVisual(opportunity) {
    const { type, context } = opportunity;

    switch (type) {
      case 'code':
        return this.generateCodeVisual(context);
      
      case 'diagram':
        return this.generateArchitectureDiagram(context);
      
      case 'flowchart':
        return this.generateFlowchart(context);
      
      case 'comparison':
        return this.generateComparison(context);
      
      case 'progress':
        return this.generateProgressTracker(context);
      
      case 'wireframe':
        return this.generateWireframe(context);
      
      case 'diagnostic':
        return this.generateDiagnosticDiagram(context);
      
      case 'data':
        return this.generateDataVisualization(context);
      
      default:
        return null;
    }
  }

  /**
   * Visual generation methods
   */
  async generateCodeVisual(context) {
    if (context.codeSnippets.length > 0) {
      // Use the first code snippet found
      await canvas.showCode(context.codeSnippets[0], 'javascript');
      return { type: 'code', displayed: true };
    }
    return null;
  }

  async generateArchitectureDiagram(context) {
    if (context.data.components && context.data.components.length > 0) {
      const components = context.data.components.map((name, i) => ({
        x: 100 + (i % 3) * 250,
        y: 100 + Math.floor(i / 3) * 150,
        name,
        color: ['#e3f2fd', '#f3e5f5', '#e8f5e9'][i % 3],
        stroke: ['#2196f3', '#9c27b0', '#4caf50'][i % 3]
      }));

      await canvas.diagrams.architecture(components);
      return { type: 'architecture', displayed: true };
    }
    return null;
  }

  async generateFlowchart(context) {
    if (context.data.steps && context.data.steps.length > 0) {
      await canvas.showProgress(context.data.steps, 0);
      return { type: 'flowchart', displayed: true };
    }
    return null;
  }

  async generateComparison(context) {
    if (context.data.before && context.data.after) {
      await canvas.showComparison(
        `<div style="padding: 20px;">${context.data.before}</div>`,
        `<div style="padding: 20px;">${context.data.after}</div>`
      );
      return { type: 'comparison', displayed: true };
    }
    return null;
  }

  async generateProgressTracker(context) {
    // Extract TODO/DONE items from context
    const items = context.keyPhrases.filter(phrase => 
      /todo|done|complete|in progress/i.test(phrase)
    );
    
    if (items.length > 0) {
      await canvas.showProgress(items, Math.floor(items.length / 2));
      return { type: 'progress', displayed: true };
    }
    return null;
  }

  async generateWireframe(context) {
    // Generate a simple wireframe based on UI keywords
    const uiElements = context.fullText.match(/button|form|input|menu|header|footer|sidebar/gi);
    if (uiElements && uiElements.length > 0) {
      await canvas.wireframes.dashboard([...new Set(uiElements)].slice(0, 4));
      return { type: 'wireframe', displayed: true };
    }
    return null;
  }

  async generateDiagnosticDiagram(context) {
    // Create error flow visualization
    const errorInfo = context.fullText.match(/error:?\s*(.+)/i);
    if (errorInfo) {
      const html = `
        <div style="font-family: Arial; padding: 20px;">
          <h3 style="color: #d32f2f;">🔍 Error Diagnostic</h3>
          <div style="background: #ffebee; padding: 15px; border-radius: 8px; border-left: 4px solid #d32f2f;">
            <strong>Error:</strong> ${errorInfo[1] || 'Unknown error'}
          </div>
          <div style="margin-top: 20px;">
            <h4>Debugging Steps:</h4>
            <ol>
              <li>Check error location</li>
              <li>Verify input data</li>
              <li>Review recent changes</li>
              <li>Test with minimal case</li>
            </ol>
          </div>
        </div>
      `;
      await canvas.showHTML(html);
      return { type: 'diagnostic', displayed: true };
    }
    return null;
  }

  async generateDataVisualization(context) {
    // Simple data structure visualization
    const dataKeywords = context.fullText.match(/\{[^}]+\}|\[[^\]]+\]/g);
    if (dataKeywords) {
      try {
        const data = JSON.parse(dataKeywords[0]);
        await canvas.showData(data, 'json');
        return { type: 'data', displayed: true };
      } catch {
        // If not valid JSON, show as text
        await canvas.showHTML(`<pre>${dataKeywords[0]}</pre>`);
        return { type: 'data', displayed: true };
      }
    }
    return null;
  }

  /**
   * Process a response and generate appropriate visuals
   */
  async processResponse(responseText) {
    const opportunities = await this.analyzeForVisuals(responseText);
    const visuals = [];

    // Generate visuals for high-priority opportunities
    for (const opportunity of opportunities) {
      if (opportunity.priority === 'high' || 
          (opportunity.priority === 'medium' && this.preferences.visualDensity !== 'low')) {
        const visual = await this.generateVisual(opportunity);
        if (visual) {
          visuals.push(visual);
          // Only generate one visual per response in low density mode
          if (this.preferences.visualDensity === 'low') break;
        }
      }
    }

    return visuals;
  }

  /**
   * Update user preferences
   */
  updatePreferences(newPreferences) {
    this.preferences = { ...this.preferences, ...newPreferences };
  }

  /**
   * Get current context summary
   */
  getContextSummary() {
    return {
      currentTopic: this.context.currentTopic,
      recentVisuals: this.context.visualHistory.slice(-5),
      messageCount: this.context.history.length,
      preferences: this.preferences
    };
  }
}

// Singleton instance
export const visualCoordinator = new VisualCoordinator();

// Middleware function for easy integration
export async function enhanceWithVisuals(responseText) {
  const visuals = await visualCoordinator.processResponse(responseText);
  return {
    text: responseText,
    visuals,
    enhanced: visuals.length > 0
  };
}

// Export for use in other modules
export default {
  VisualCoordinator,
  visualCoordinator,
  enhanceWithVisuals,
  VISUAL_TRIGGERS
};