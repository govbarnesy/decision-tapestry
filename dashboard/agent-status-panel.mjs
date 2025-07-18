import { LitElement, css, html } from "https://esm.sh/lit@3";

/**
 * @class AgentStatusPanel
 * @description A LitElement component that displays all active agents and their current activities
 * @fires agent-click - Dispatched when an agent card is clicked
 */
class AgentStatusPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      padding: 1rem;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .coordination-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark, #0056b3) 100%);
      border-radius: 4px;
      color: white;
    }

    .coordination-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: bold;
    }

    .coordination-stats {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
    }

    .stat-number {
      font-size: 1.2rem;
      font-weight: bold;
    }

    .stat-label {
      font-size: 0.7rem;
      opacity: 0.9;
      text-transform: uppercase;
    }

    .coordination-timeline {
      margin-bottom: 1rem;
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 1rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .timeline-header {
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .timeline-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3rem 0;
      border-bottom: 1px solid var(--border-light, #f0f0f0);
      animation: slideIn 0.3s ease;
    }

    .timeline-item:last-child {
      border-bottom: none;
    }

    .timeline-time {
      font-size: 0.7rem;
      color: var(--text-secondary);
      min-width: 60px;
    }

    .timeline-agent {
      font-weight: bold;
      color: var(--accent);
      min-width: 80px;
    }

    .timeline-action {
      flex: 1;
      font-size: 0.8rem;
      color: var(--text-main);
    }

    .agents-coordination {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    .dependency-graph {
      margin-bottom: 1rem;
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 1rem;
    }

    .graph-header {
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .dependency-chain {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.5rem 0;
      padding: 0.5rem;
      background: var(--bg-secondary, #f8f9fa);
      border-radius: 4px;
    }

    .dependency-arrow {
      color: var(--accent);
      font-weight: bold;
    }

    .dependency-decision {
      background: var(--accent);
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: bold;
    }

    .agent-communication {
      margin-bottom: 1rem;
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 1rem;
      max-height: 150px;
      overflow-y: auto;
    }

    .comm-header {
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .comm-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3rem 0;
      font-size: 0.8rem;
      animation: slideIn 0.3s ease;
    }

    .comm-from, .comm-to {
      background: var(--accent);
      color: white;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: bold;
    }

    .comm-arrow {
      color: var(--accent);
    }

    .comm-message {
      flex: 1;
      color: var(--text-main);
    }

    .agent-card {
      background: var(--panel-bg);
      border: 2px solid var(--border);
      border-radius: 4px;
      padding: 1rem;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .agent-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      cursor: pointer;
    }
    
    .agent-card[data-has-decision="true"]:hover {
      border-color: var(--accent);
    }

    .agent-card.active {
      border-color: var(--state-color, var(--accent));
      box-shadow: 0 0 20px var(--state-color-alpha, rgba(0, 82, 204, 0.2));
    }

    .agent-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: var(--state-color, transparent);
      transition: height 0.3s ease;
    }

    .agent-card.active::before {
      height: 100%;
      opacity: 0.1;
    }

    .agent-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .agent-icon {
      font-size: 1.5rem;
    }

    .agent-name {
      font-weight: bold;
      color: var(--text-main);
      flex: 1;
    }

    .state-badge {
      background: var(--state-color, #757575);
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: bold;
      animation: fadeIn 0.3s ease;
    }

    .activity-details {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .decision-link {
      color: var(--accent);
      text-decoration: none;
      font-weight: 500;
    }

    .decision-link:hover {
      text-decoration: underline;
    }

    .task-description {
      margin-top: 0.25rem;
      font-style: italic;
      opacity: 0.8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .timestamp {
      margin-top: 0.5rem;
      font-size: 0.8rem;
      opacity: 0.6;
    }

    .no-agents {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary);
      opacity: 0.6;
    }

    /* Activity state colors */
    .agent-card[data-state="working"] {
      --state-color: #4caf50;
      --state-color-alpha: rgba(76, 175, 80, 0.2);
    }

    .agent-card[data-state="debugging"] {
      --state-color: #ff9800;
      --state-color-alpha: rgba(255, 152, 0, 0.2);
    }

    .agent-card[data-state="testing"] {
      --state-color: #2196f3;
      --state-color-alpha: rgba(33, 150, 243, 0.2);
    }

    .agent-card[data-state="reviewing"] {
      --state-color: #ff5722;
      --state-color-alpha: rgba(255, 87, 34, 0.2);
    }

    /* Review status indicators */
    .review-status {
      margin-top: 0.5rem;
      padding: 0.3rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .review-status.approved {
      background: #e8f5e8;
      color: #2e7d32;
      border-left: 3px solid #4caf50;
    }

    .review-status.needs-revision {
      background: #fff3e0;
      color: #f57c00;
      border-left: 3px solid #ff9800;
    }

    .review-status.pending-review {
      background: #f3e5f5;
      color: #7b1fa2;
      border-left: 3px solid #9c27b0;
    }

    .review-feedback {
      margin-top: 0.3rem;
      font-size: 0.7rem;
      opacity: 0.8;
    }

    .agent-card[data-state="idle"] {
      --state-color: #757575;
      --state-color-alpha: rgba(117, 117, 117, 0.2);
      opacity: 0.7;
    }

    /* Pulse animation for active agents */
    @keyframes pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.02);
      }
      100% {
        transform: scale(1);
      }
    }

    .agent-card.active:not([data-state="idle"]) {
      animation: pulse 2s infinite;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Progress bar styles */
    .progress-bar {
      background: var(--bg-secondary, #f5f5f5);
      border-radius: 4px;
      height: 8px;
      margin: 0.5rem 0;
      overflow: hidden;
      position: relative;
    }

    .progress-fill {
      background: var(--state-color, var(--accent));
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-text {
      position: absolute;
      top: -20px;
      right: 0;
      font-size: 0.7rem;
      color: var(--text-secondary);
    }

    /* Current file display */
    .current-file {
      background: var(--bg-secondary, #f8f9fa);
      border-radius: 4px;
      padding: 0.3rem 0.5rem;
      margin: 0.5rem 0;
      font-size: 0.8rem;
      color: var(--text-main);
      border-left: 3px solid var(--state-color, var(--accent));
    }

    /* Agent dependencies */
    .agent-dependencies {
      background: var(--bg-secondary, #f8f9fa);
      border-radius: 4px;
      padding: 0.3rem 0.5rem;
      margin: 0.5rem 0;
      font-size: 0.8rem;
      color: var(--text-main);
      border-left: 3px solid var(--warning, #ff9800);
    }
  `;

  static properties = {
    agents: { type: Object }, // Map of agentId -> activity info
    coordinationHistory: { type: Array },
    dependencies: { type: Array },
    communications: { type: Array },
    coordinationStats: { type: Object },
  };

  constructor() {
    super();
    this.agents = new Map();
    this.coordinationHistory = [];
    this.dependencies = [];
    this.communications = [];
    this.coordinationStats = {
      activeAgents: 0,
      completedTasks: 0,
      pendingTasks: 0,
      blockedTasks: 0
    };
    this.webSocket = null;
    this.setupWebSocket();
  }

  /**
   * Setup WebSocket connection for real-time updates
   */
  setupWebSocket() {
    if (typeof window === 'undefined') return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    this.webSocket = new WebSocket(wsUrl);
    
    this.webSocket.onopen = () => {
      console.log('[Agent Status Panel] WebSocket connected');
    };
    
    this.webSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      } catch (error) {
        console.error('[Agent Status Panel] Invalid WebSocket message:', error);
      }
    };
    
    this.webSocket.onclose = () => {
      console.log('[Agent Status Panel] WebSocket disconnected, attempting reconnect...');
      setTimeout(() => this.setupWebSocket(), 3000);
    };
    
    this.webSocket.onerror = (error) => {
      console.error('[Agent Status Panel] WebSocket error:', error);
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleWebSocketMessage(message) {
    const { type } = message;
    
    switch (type) {
      case 'agent_register':
        this.handleAgentRegistration(message);
        this.addCoordinationEvent(message.agentId, `Registered for Decision #${message.decisionId}`);
        break;
        
      case 'agent_status':
        this.handleAgentStatusMessage(message);
        this.addCoordinationEvent(message.agentId, message.message || `Status: ${message.status}`);
        break;
        
      case 'task_completion':
        this.handleTaskCompletion(message);
        this.addCoordinationEvent(message.agentId, `Completed: ${message.taskDescription}`);
        break;
        
      case 'agent_error':
        this.handleAgentError(message);
        this.addCoordinationEvent(message.agentId, `Error: ${message.message}`);
        break;
        
      case 'agent_disconnected':
        this.handleAgentDisconnection(message);
        this.addCoordinationEvent(message.agentId, 'Disconnected');
        break;
        
      case 'decision_update':
        this.addCoordinationEvent(message.agentId, `Updated Decision #${message.decisionId}: ${message.message}`);
        break;
        
      case 'activity':
        this.handleActivityMessage(message);
        break;
        
      case 'activity-reset':
        this.clearAllAgents();
        break;
        
      default:
        console.log('[Agent Status Panel] Unknown message type:', type, message);
    }
    
    this.updateCoordinationStats();
  }

  /**
   * Handle activity messages from the activity tracking system
   */
  handleActivityMessage(message) {
    const { agentId, activity } = message;
    
    this.updateAgentActivity(agentId, {
      state: activity.state,
      taskDescription: activity.taskDescription,
      decisionId: activity.decisionId
    });
    
    this.addCoordinationEvent(agentId, `Activity: ${activity.state} ${activity.taskDescription ? '- ' + activity.taskDescription : ''}`);
  }

  /**
   * Handle agent disconnection
   */
  handleAgentDisconnection(message) {
    const { agentId } = message;
    
    if (this.agents.has(agentId)) {
      this.agents.delete(agentId);
      this.requestUpdate();
    }
  }

  /**
   * Handle task completion from agents
   */
  handleTaskCompletion(message) {
    const { agentId, taskDescription, decisionId } = message;
    
    const agent = this.agents.get(agentId);
    if (agent) {
      this.updateAgentActivity(agentId, {
        ...agent,
        state: 'completed',
        taskDescription: `Completed: ${taskDescription}`,
        decisionId: decisionId
      });
    }
  }

  render() {
    const activeAgents = Array.from(this.agents.entries()).filter(
      ([_, activity]) => activity.state !== "idle",
    );

    this.coordinationStats.activeAgents = activeAgents.length;

    return html`
      <div class="coordination-header">
        <h3 class="coordination-title">🤖 Agent Coordination Center</h3>
        <div class="coordination-stats">
          <div class="stat-item">
            <div class="stat-number">${this.coordinationStats.activeAgents}</div>
            <div class="stat-label">Active</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${this.coordinationStats.completedTasks}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${this.coordinationStats.pendingTasks}</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${this.coordinationStats.blockedTasks}</div>
            <div class="stat-label">Blocked</div>
          </div>
        </div>
      </div>

      ${this.renderCoordinationTimeline()}
      ${this.renderDependencyGraph()}
      ${this.renderAgentCommunication()}

      ${this.agents.size === 0
        ? html`
            <div class="no-agents">
              <p>🎯 No agents currently active</p>
              <p>Agents will appear here when coordination begins</p>
              <p><small>Use agent coordination commands or the test simulation to see activity</small></p>
            </div>
          `
        : html`
            <div class="agents-coordination">
              ${Array.from(this.agents.entries()).map(([agentId, activity]) =>
                this.renderAgentCard(agentId, activity),
              )}
            </div>
          `}
    `;
  }

  renderCoordinationTimeline() {
    if (this.coordinationHistory.length === 0) return '';
    
    return html`
      <div class="coordination-timeline">
        <div class="timeline-header">
          📋 Coordination Timeline
          <span style="font-size: 0.8rem; opacity: 0.7;">(${this.coordinationHistory.length} events)</span>
        </div>
        ${this.coordinationHistory.slice(-10).reverse().map(item => html`
          <div class="timeline-item">
            <div class="timeline-time">${this.formatTime(item.timestamp)}</div>
            <div class="timeline-agent">${item.agentId}</div>
            <div class="timeline-action">${item.action}</div>
          </div>
        `)}
      </div>
    `;
  }

  renderDependencyGraph() {
    if (this.dependencies.length === 0) return '';
    
    return html`
      <div class="dependency-graph">
        <div class="graph-header">
          🔗 Decision Dependencies
          <span style="font-size: 0.8rem; opacity: 0.7;">(${this.dependencies.length} chains)</span>
        </div>
        ${this.dependencies.map(dep => html`
          <div class="dependency-chain">
            <div class="dependency-decision">D${dep.from}</div>
            <div class="dependency-arrow">→</div>
            <div class="dependency-decision">D${dep.to}</div>
            <span style="font-size: 0.7rem; margin-left: 0.5rem; opacity: 0.7;">
              ${dep.relationship}
            </span>
          </div>
        `)}
      </div>
    `;
  }

  renderAgentCommunication() {
    if (this.communications.length === 0) return '';
    
    return html`
      <div class="agent-communication">
        <div class="comm-header">
          💬 Agent Communications
          <span style="font-size: 0.8rem; opacity: 0.7;">(${this.communications.length} messages)</span>
        </div>
        ${this.communications.slice(-5).reverse().map(comm => html`
          <div class="comm-item">
            <div class="comm-from">${comm.from}</div>
            <div class="comm-arrow">→</div>
            <div class="comm-to">${comm.to}</div>
            <div class="comm-message">${comm.message}</div>
          </div>
        `)}
      </div>
    `;
  }

  renderAgentCard(agentId, activity) {
    const isActive = activity.state !== "idle";
    const stateEmoji = this.getStateEmoji(activity.state);
    const timeSince = this.getTimeSince(activity.timestamp);
    const progress = activity.progress || 0;

    return html`
      <div
        class="agent-card ${isActive ? "active" : ""}"
        data-state="${activity.state}"
        data-has-decision="${activity.decisionId ? 'true' : 'false'}"
        @click="${() => this.handleAgentClick(agentId, activity)}"
        title="${activity.decisionId ? `Click to view Decision #${activity.decisionId}` : 'No related decision'}"
      >
        <div class="agent-header">
          <span class="agent-icon">🤖</span>
          <span class="agent-name">${agentId}</span>
          <span class="state-badge">${stateEmoji} ${activity.state}</span>
        </div>

        <div class="activity-details">
          ${activity.decisionId
            ? html`
                <div>
                  Working on:
                  <a
                    href="#"
                    class="decision-link"
                    @click="${(e) =>
                      this.handleDecisionClick(e, activity.decisionId)}"
                  >
                    Decision #${activity.decisionId}
                  </a>
                </div>
              `
            : ""}
          
          ${activity.taskDescription
            ? html`
                <div class="task-description" title="${activity.taskDescription}">
                  ${activity.taskDescription}
                </div>
              `
            : ""}

          ${isActive && progress > 0
            ? html`
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${progress}%"></div>
                  <span class="progress-text">${progress}% complete</span>
                </div>
              `
            : ""}

          ${activity.currentFile
            ? html`
                <div class="current-file">
                  📄 ${activity.currentFile}
                </div>
              `
            : ""}

          ${activity.dependencies && activity.dependencies.length > 0
            ? html`
                <div class="agent-dependencies">
                  🔗 Depends on: ${activity.dependencies.join(', ')}
                </div>
              `
            : ""}

          ${this.renderReviewStatus(activity)}

          <div class="timestamp">
            ${isActive ? `Active for ${timeSince}` : `Idle since ${timeSince}`}
          </div>
        </div>
      </div>
    `;
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  addCoordinationEvent(agentId, action) {
    this.coordinationHistory.push({
      timestamp: new Date().toISOString(),
      agentId,
      action
    });
    
    // Keep only last 50 events
    if (this.coordinationHistory.length > 50) {
      this.coordinationHistory = this.coordinationHistory.slice(-50);
    }
    
    this.requestUpdate();
  }

  addDependency(from, to, relationship = 'requires') {
    const existing = this.dependencies.find(d => d.from === from && d.to === to);
    if (!existing) {
      this.dependencies.push({ from, to, relationship });
      this.requestUpdate();
    }
  }

  addCommunication(from, to, message) {
    this.communications.push({
      timestamp: new Date().toISOString(),
      from,
      to,
      message
    });
    
    // Keep only last 20 communications
    if (this.communications.length > 20) {
      this.communications = this.communications.slice(-20);
    }
    
    this.requestUpdate();
  }

  updateCoordinationStats() {
    const agents = Array.from(this.agents.values());
    this.coordinationStats = {
      activeAgents: agents.filter(a => a.state !== 'idle').length,
      completedTasks: agents.filter(a => a.state === 'completed').length,
      pendingTasks: agents.filter(a => a.state === 'pending').length,
      blockedTasks: agents.filter(a => a.state === 'blocked').length
    };
    this.requestUpdate();
  }

  getStateEmoji(state) {
    const emojis = {
      working: "🔨",
      debugging: "🐛",
      testing: "🧪",
      reviewing: "👀",
      idle: "💤",
    };
    return emojis[state] || "❓";
  }

  renderReviewStatus(activity) {
    // Show review status if agent is in review mode or has review target
    if (activity.reviewMode || activity.reviewTarget) {
      const reviewIcon = activity.state === 'reviewing' ? '🔍' : '👀';
      return html`
        <div class="review-status pending-review">
          ${reviewIcon} Reviewing ${activity.reviewTarget?.agentId || 'unknown'} 
          ${activity.reviewTarget?.decisionId ? `(Decision #${activity.reviewTarget.decisionId})` : ''}
        </div>
      `;
    }

    // Show review feedback count if available
    if (activity.reviewFeedback && activity.reviewFeedback > 0) {
      return html`
        <div class="review-feedback">
          📝 ${activity.reviewFeedback} review comments provided
        </div>
      `;
    }

    return '';
  }

  getTimeSince(timestamp) {
    if (!timestamp) return "unknown";

    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  updateAgentActivity(agentId, activity) {
    // Update or add agent activity
    this.agents.set(agentId, {
      ...activity,
      timestamp: new Date().toISOString(),
    });

    // Trigger re-render
    this.requestUpdate();

    // Log activity for debugging
    console.log(
      `[Agent Status] ${agentId}: ${activity.message || activity.status}`,
    );
  }

  /**
   * Handle agent status message from WebSocket
   */
  handleAgentStatusMessage(message) {
    const {
      agentId,
      status,
      message: statusMessage,
      currentTask,
      decisionId,
      currentFile,
      progress,
      dependencies
    } = message;

    this.updateAgentActivity(agentId, {
      state: status,
      message: statusMessage,
      taskDescription: currentTask,
      decisionId: decisionId,
      currentFile: currentFile,
      progress: progress,
      dependencies: dependencies
    });
    
    // Add inter-agent communication if there are dependencies
    if (dependencies && dependencies.length > 0) {
      dependencies.forEach(depAgentId => {
        this.addCommunication(agentId, depAgentId, `Depends on ${depAgentId}`);
        this.addDependency(depAgentId, agentId, 'blocking');
      });
    }
  }

  /**
   * Handle agent registration
   */
  handleAgentRegistration(message) {
    const { agentId, decisionId } = message;

    this.updateAgentActivity(agentId, {
      state: "initializing",
      message: "Agent registered",
      decisionId: decisionId,
      progress: 0
    });
  }

  /**
   * Handle agent completion
   */
  handleAgentCompletion(message) {
    const { agentId, decisionId, completedTasks, totalTasks } = message;

    this.updateAgentActivity(agentId, {
      state: "completed",
      message: `Completed ${completedTasks}/${totalTasks} tasks`,
      decisionId: decisionId,
    });
  }

  /**
   * Handle agent error
   */
  handleAgentError(message) {
    const { agentId, decisionId, message: errorMessage } = message;

    this.updateAgentActivity(agentId, {
      state: "error",
      message: errorMessage,
      decisionId: decisionId,
    });
  }

  handleAgentClick(agentId, activity) {
    // If agent has a related decision, navigate to it
    if (activity.decisionId) {
      this.handleDecisionClick(new Event('click'), activity.decisionId);
    }
    
    // Also dispatch the original agent-click event for any other listeners
    this.dispatchEvent(
      new CustomEvent("agent-click", {
        detail: { agentId, activity },
        bubbles: true,
        composed: true,
      }),
    );
  }

  handleDecisionClick(event, decisionId) {
    event.preventDefault();
    event.stopPropagation();

    // Dispatch event to focus on decision
    this.dispatchEvent(
      new CustomEvent("decision-focus", {
        detail: { decisionId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Clear all agents from the panel
   */
  clearAllAgents() {
    this.agents.clear();
    this.coordinationHistory = [];
    this.dependencies = [];
    this.communications = [];
    this.coordinationStats = {
      activeAgents: 0,
      completedTasks: 0,
      pendingTasks: 0,
      blockedTasks: 0
    };
    this.requestUpdate();
    console.log("[Agent Status] All agents and coordination data cleared");
  }

  /**
   * Disconnect WebSocket when component is removed
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.webSocket) {
      this.webSocket.close();
    }
  }
}

customElements.define("agent-status-panel", AgentStatusPanel);
