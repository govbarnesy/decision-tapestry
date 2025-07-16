import { LitElement, css, html } from "https://esm.sh/lit@3";

/**
 * @class AgentActivityFeed
 * @description A LitElement component that displays real-time agent activity feed
 * @fires activity-click - Dispatched when an activity item is clicked
 */
class AgentActivityFeed extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      padding: 1rem;
      box-sizing: border-box;
      overflow-y: auto;
      background: var(--panel-bg);
    }

    .feed-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }

    h3 {
      margin: 0;
      color: var(--text-main);
      font-size: 1.2rem;
    }

    .activity-count {
      background: var(--accent);
      color: white;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: bold;
    }

    .clear-button {
      background: none;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s ease;
    }

    .clear-button:hover {
      background: var(--hover-bg);
      color: var(--text-main);
    }

    .activity-feed {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .activity-item {
      background: var(--bg-main);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .activity-item:hover {
      background: var(--hover-bg);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .activity-item.recent {
      border-left: 4px solid var(--accent);
      background: var(--accent-bg);
    }

    .activity-item.error {
      border-left: 4px solid #f44336;
      background: rgba(244, 67, 54, 0.1);
    }

    .activity-item.completed {
      border-left: 4px solid #4caf50;
      background: rgba(76, 175, 80, 0.1);
    }

    .activity-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .agent-icon {
      font-size: 1.2rem;
    }

    .agent-name {
      font-weight: 600;
      color: var(--text-main);
      font-size: 0.9rem;
    }

    .activity-type {
      background: var(--type-bg, var(--accent));
      color: white;
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: bold;
    }

    .activity-timestamp {
      margin-left: auto;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .activity-message {
      color: var(--text-main);
      font-size: 0.9rem;
      line-height: 1.4;
      margin-bottom: 0.3rem;
    }

    .activity-details {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.8rem;
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

    .task-info {
      background: var(--bg-secondary);
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-style: italic;
    }

    .no-activities {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-secondary);
      opacity: 0.6;
    }

    .no-activities-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    /* Activity type colors */
    .activity-item[data-type="agent_register"] .activity-type {
      --type-bg: #2196f3;
    }

    .activity-item[data-type="agent_status"] .activity-type {
      --type-bg: #ff9800;
    }

    .activity-item[data-type="task_completion"] .activity-type {
      --type-bg: #4caf50;
    }

    .activity-item[data-type="decision_update"] .activity-type {
      --type-bg: #9c27b0;
    }

    .activity-item[data-type="agent_error"] .activity-type {
      --type-bg: #f44336;
    }

    /* Animation for new activities */
    @keyframes slideIn {
      from {
        transform: translateX(-100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .activity-item.new {
      animation: slideIn 0.3s ease-out;
    }

    /* Scroll indicator */
    .scroll-indicator {
      position: sticky;
      top: 0;
      text-align: center;
      padding: 0.5rem;
      background: var(--accent);
      color: white;
      font-size: 0.85rem;
      cursor: pointer;
      z-index: 10;
    }

    .scroll-indicator:hover {
      background: var(--accent-dark);
    }
  `;

  static properties = {
    activities: { type: Array },
    maxActivities: { type: Number },
    autoScroll: { type: Boolean },
  };

  constructor() {
    super();
    this.activities = [];
    this.maxActivities = 100;
    this.autoScroll = true;
    this.lastActivityTime = null;
  }

  render() {
    return html`
      <div class="feed-header">
        <h3>Agent Activity Feed</h3>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span class="activity-count">${this.activities.length}</span>
          <button class="clear-button" @click="${this.clearActivities}">
            Clear
          </button>
        </div>
      </div>

      ${this.activities.length === 0
        ? html`
            <div class="no-activities">
              <div class="no-activities-icon">🤖</div>
              <p>No agent activities yet</p>
              <p>Agent activities will appear here when agents start working</p>
            </div>
          `
        : html`
            ${this.hasNewActivities()
              ? html`
                  <div class="scroll-indicator" @click="${this.scrollToTop}">
                    ↑ New activities available
                  </div>
                `
              : ""}

            <div class="activity-feed">
              ${this.activities.map((activity) =>
                this.renderActivity(activity),
              )}
            </div>
          `}
    `;
  }

  renderActivity(activity) {
    const isRecent = this.isRecentActivity(activity);
    const isError = activity.type === "agent_error";
    const isCompleted =
      activity.type === "task_completion" ||
      activity.message?.includes("completed");

    return html`
      <div
        class="activity-item ${isRecent ? "recent" : ""} ${isError
          ? "error"
          : ""} ${isCompleted ? "completed" : ""}"
        data-type="${activity.type}"
        @click="${() => this.handleActivityClick(activity)}"
      >
        <div class="activity-header">
          <span class="agent-icon">🤖</span>
          <span class="agent-name">${activity.agentId}</span>
          <span class="activity-type"
            >${this.getActivityTypeLabel(activity.type)}</span
          >
          <span class="activity-timestamp"
            >${this.formatTimestamp(activity.timestamp)}</span
          >
        </div>

        <div class="activity-message">
          ${activity.message || activity.status || "Activity update"}
        </div>

        <div class="activity-details">
          ${activity.decisionId
            ? html`
                <a
                  href="#"
                  class="decision-link"
                  @click="${(e) =>
                    this.handleDecisionClick(e, activity.decisionId)}"
                >
                  Decision #${activity.decisionId}
                </a>
              `
            : ""}
          ${activity.currentTask
            ? html`
                <span class="task-info">Task: ${activity.currentTask}</span>
              `
            : ""}
          ${activity.completedTasks !== undefined
            ? html`
                <span class="task-info"
                  >Progress:
                  ${activity.completedTasks}/${activity.totalTasks || "?"}</span
                >
              `
            : ""}
        </div>
      </div>
    `;
  }

  /**
   * Add new activity to the feed
   */
  addActivity(activity) {
    const newActivity = {
      id: this.generateActivityId(),
      timestamp: new Date().toISOString(),
      ...activity,
    };

    // Add to beginning of array (most recent first)
    this.activities = [newActivity, ...this.activities];

    // Limit activities to max count
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }

    // Update last activity time
    this.lastActivityTime = new Date(newActivity.timestamp);

    // Scroll to top if auto-scroll is enabled
    if (this.autoScroll) {
      this.scrollToTop();
    }

    this.requestUpdate();
  }

  /**
   * Clear all activities
   */
  clearActivities() {
    this.activities = [];
    this.lastActivityTime = null;
    this.requestUpdate();
  }

  /**
   * Check if activity is recent (within last 30 seconds)
   */
  isRecentActivity(activity) {
    const activityTime = new Date(activity.timestamp);
    const now = new Date();
    return now - activityTime < 30000; // 30 seconds
  }

  /**
   * Check if there are new activities since last scroll
   */
  hasNewActivities() {
    if (!this.lastActivityTime) return false;

    const recentActivities = this.activities.filter(
      (activity) => new Date(activity.timestamp) > this.lastActivityTime,
    );

    return recentActivities.length > 0;
  }

  /**
   * Get human-readable activity type label
   */
  getActivityTypeLabel(type) {
    const labels = {
      agent_register: "Register",
      agent_status: "Status",
      task_completion: "Task Done",
      decision_update: "Decision",
      agent_error: "Error",
      agent_heartbeat: "Heartbeat",
    };

    return labels[type] || type;
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      // Less than 1 minute
      return "Just now";
    } else if (diff < 3600000) {
      // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    }
  }

  /**
   * Generate unique activity ID
   */
  generateActivityId() {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Scroll to top of feed
   */
  scrollToTop() {
    const feed = this.shadowRoot.querySelector(".activity-feed");
    if (feed) {
      feed.scrollTop = 0;
    }
  }

  /**
   * Handle activity click
   */
  handleActivityClick(activity) {
    this.dispatchEvent(
      new CustomEvent("activity-click", {
        detail: { activity },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Handle decision link click
   */
  handleDecisionClick(event, decisionId) {
    event.preventDefault();
    event.stopPropagation();

    this.dispatchEvent(
      new CustomEvent("decision-focus", {
        detail: { decisionId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(message) {
    switch (message.type) {
      case "agent_register":
        this.addActivity({
          type: "agent_register",
          agentId: message.agentId,
          message: "Agent registered",
          decisionId: message.decisionId,
        });
        break;

      case "agent_status":
        this.addActivity({
          type: "agent_status",
          agentId: message.agentId,
          message: message.message,
          status: message.status,
          currentTask: message.currentTask,
          decisionId: message.decisionId,
        });
        break;

      case "task_completion":
        this.addActivity({
          type: "task_completion",
          agentId: message.agentId,
          message: `Task completed: ${message.taskDescription}`,
          decisionId: message.decisionId,
        });
        break;

      case "decision_update":
        this.addActivity({
          type: "decision_update",
          agentId: message.agentId,
          message: message.message,
          decisionId: message.decisionId,
        });
        break;

      case "agent_error":
        this.addActivity({
          type: "agent_error",
          agentId: message.agentId,
          message: message.message,
          decisionId: message.decisionId,
        });
        break;
    }
  }

  /**
   * Get activity feed status
   */
  getStatus() {
    return {
      totalActivities: this.activities.length,
      recentActivities: this.activities.filter((a) => this.isRecentActivity(a))
        .length,
      lastActivityTime: this.lastActivityTime,
      autoScroll: this.autoScroll,
    };
  }
}

customElements.define("agent-activity-feed", AgentActivityFeed);
