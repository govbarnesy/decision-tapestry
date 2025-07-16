import { LitElement, css, html } from "https://esm.sh/lit@3";

/**
 * @class ActivityTimeline
 * @description A LitElement component that displays a timeline of agent activities
 */
class ActivityTimeline extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      padding: 1rem;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .timeline-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    h3 {
      margin: 0;
      color: var(--text-main);
      font-size: 1.2rem;
    }

    .controls {
      display: flex;
      gap: 0.5rem;
    }

    .filter-button {
      padding: 0.4rem 0.8rem;
      border: 1px solid var(--border);
      background: var(--panel-bg);
      color: var(--text-main);
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s ease;
    }

    .filter-button:hover {
      background: var(--tab-bg);
    }

    .filter-button.active {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .clear-button {
      padding: 0.4rem 0.8rem;
      border: 1px solid var(--status-deprecated);
      background: transparent;
      color: var(--status-deprecated);
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s ease;
    }

    .clear-button:hover {
      background: var(--status-deprecated);
      color: white;
    }

    .timeline {
      position: relative;
      padding-left: 2rem;
    }

    .timeline::before {
      content: "";
      position: absolute;
      left: 0.75rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--border);
    }

    .timeline-item {
      position: relative;
      margin-bottom: 1.5rem;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .timeline-marker {
      position: absolute;
      left: -1.5rem;
      top: 0.25rem;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--state-color, var(--border));
      border: 2px solid var(--panel-bg);
      box-shadow: 0 0 0 2px var(--state-color, var(--border));
    }

    .timeline-content {
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.75rem;
      position: relative;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .timeline-content::before {
      content: "";
      position: absolute;
      left: -8px;
      top: 0.5rem;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 8px 8px 8px 0;
      border-color: transparent var(--border) transparent transparent;
    }

    .timeline-content::after {
      content: "";
      position: absolute;
      left: -7px;
      top: 0.5rem;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 8px 8px 8px 0;
      border-color: transparent var(--panel-bg) transparent transparent;
    }

    .activity-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .agent-badge {
      background: var(--state-color, var(--accent));
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .state-emoji {
      font-size: 1rem;
    }

    .timestamp {
      font-size: 0.8rem;
      color: var(--text-secondary);
      opacity: 0.7;
      margin-left: auto;
    }

    .activity-body {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-main);
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
    }

    .no-activities {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary);
      opacity: 0.6;
    }

    /* State colors */
    .timeline-item[data-state="working"] {
      --state-color: #4caf50;
    }

    .timeline-item[data-state="debugging"] {
      --state-color: #ff9800;
    }

    .timeline-item[data-state="testing"] {
      --state-color: #2196f3;
    }

    .timeline-item[data-state="reviewing"] {
      --state-color: #9c27b0;
    }

    .timeline-item[data-state="idle"] {
      --state-color: #757575;
    }
  `;

  static properties = {
    activities: { type: Array },
    filter: { type: String },
    maxItems: { type: Number },
  };

  constructor() {
    super();
    this.activities = [];
    this.filter = "all";
    this.maxItems = 50;
  }

  render() {
    const filteredActivities = this.getFilteredActivities();

    return html`
      <div class="timeline-header">
        <h3>Activity Timeline</h3>
        <div class="controls">
          <button
            class="filter-button ${this.filter === "all" ? "active" : ""}"
            @click="${() => this.setFilter("all")}"
          >
            All
          </button>
          <button
            class="filter-button ${this.filter === "active" ? "active" : ""}"
            @click="${() => this.setFilter("active")}"
          >
            Active Only
          </button>
          <button class="clear-button" @click="${this.clearTimeline}">
            Clear
          </button>
        </div>
      </div>

      ${filteredActivities.length === 0
        ? html`
            <div class="no-activities">
              <p>No activities recorded yet</p>
              <p>Activities will appear here as agents work</p>
            </div>
          `
        : html`
            <div class="timeline">
              ${filteredActivities.map((activity) =>
                this.renderTimelineItem(activity),
              )}
            </div>
          `}
    `;
  }

  renderTimelineItem(activity) {
    const stateEmoji = this.getStateEmoji(activity.activity.state);
    const time = this.formatTime(activity.timestamp);

    return html`
      <div class="timeline-item" data-state="${activity.activity.state}">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <div class="activity-header">
            <span class="agent-badge">
              <span class="state-emoji">${stateEmoji}</span>
              ${activity.agentId}
            </span>
            <span class="timestamp">${time}</span>
          </div>

          <div class="activity-body">
            ${activity.activity.state === "idle"
              ? html` <span>Agent became idle</span> `
              : html` <span>Started ${activity.activity.state}</span> `}
            ${activity.activity.decisionId
              ? html`
                  <span>
                    on
                    <a
                      href="#"
                      class="decision-link"
                      @click="${(e) =>
                        this.handleDecisionClick(
                          e,
                          activity.activity.decisionId,
                        )}"
                    >
                      Decision #${activity.activity.decisionId}
                    </a>
                  </span>
                `
              : ""}
            ${activity.activity.taskDescription
              ? html`
                  <div class="task-description">
                    "${activity.activity.taskDescription}"
                  </div>
                `
              : ""}
          </div>
        </div>
      </div>
    `;
  }

  getFilteredActivities() {
    let filtered = this.activities;

    if (this.filter === "active") {
      filtered = filtered.filter((a) => a.activity.state !== "idle");
    }

    // Sort by timestamp (newest first)
    filtered = filtered.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    // Limit number of items
    return filtered.slice(0, this.maxItems);
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

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // If less than a minute ago
    if (diff < 60000) {
      return "just now";
    }

    // If today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Otherwise show date and time
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  addActivity(activity) {
    // Add to beginning of array
    this.activities = [activity, ...this.activities];

    // Keep only last 100 activities in memory
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(0, 100);
    }

    this.requestUpdate();
  }

  setFilter(filter) {
    this.filter = filter;
  }

  clearTimeline() {
    this.activities = [];
  }

  handleDecisionClick(event, decisionId) {
    event.preventDefault();

    // Dispatch event to focus on decision
    this.dispatchEvent(
      new CustomEvent("decision-focus", {
        detail: { decisionId },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

customElements.define("activity-timeline", ActivityTimeline);
