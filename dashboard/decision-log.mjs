import { LitElement, css, html } from "https://esm.sh/lit@3";
import "./avatar-display.mjs";

/**
 * A component to display a scrollable log of all decisions.
 * @element decision-log-panel
 * @fires log-item-click - Dispatched when a decision in the log is clicked.
 */
class DecisionLogPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      overflow-y: auto;
      height: 100%;
    }
    .log-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 0.75rem;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .log-item:hover {
      background-color: #f8f9fa;
    }
    .log-item.selected-log-item {
      background-color: #e9ecef;
      border-left: 3px solid #0052cc;
    }
    .log-item-content {
      flex: 1;
      min-width: 0;
    }
    .log-item h4 {
      margin: 0 0 0.25rem;
      font-size: 12px;
      line-height: 160%;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .log-item p {
      margin: 0;
      font-size: 12px;
      line-height: 160%;
      color: #6c757d;
    }
    .author-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      line-height: 160%;
      color: #6c757d;
      margin-top: 4px;
    }
    .date-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      background: rgba(0, 82, 204, 0.1);
      border-radius: 4px;
      font-size: 12px;
      line-height: 160%;
      color: var(--accent);
    }
    .status-accepted {
      color: #28a745;
      font-weight: bold;
    }
    .status-superseded {
      color: #6c757d;
      font-weight: bold;
    }
    .status-deprecated {
      color: #dc3545;
      font-weight: bold;
    }

    /* Activity badge styles */
    .activity-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 2px 6px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 160%;
      font-weight: 600;
      text-transform: uppercase;
      color: white;
      animation: activityPulse 1.5s infinite ease-in-out;
    }
    .activity-badge.working {
      background-color: #4caf50;
    }
    .activity-badge.debugging {
      background-color: #ff9800;
    }
    .activity-badge.testing {
      background-color: #2196f3;
    }
    .activity-badge.reviewing {
      background-color: #9c27b0;
    }
    .activity-badge.idle {
      background-color: #757575;
    }

    @keyframes activityPulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.8;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
  `;

  static properties = {
    decisions: { type: Array },
    selectedId: { type: Number },
    decisionActivities: { type: Map },
  };

  constructor() {
    super();
    this.decisions = [];
    this.selectedId = null;
    this.decisionActivities = new Map();
  }

  updateDecisionActivity(decisionId, agentId, activityState, taskDescription) {
    console.log("[DecisionLogPanel] updateDecisionActivity called:", {
      decisionId,
      agentId,
      activityState,
      taskDescription,
    });
    if (activityState === "idle") {
      this.decisionActivities.delete(decisionId);
    } else {
      this.decisionActivities.set(decisionId, {
        agentId,
        state: activityState,
        taskDescription,
      });
    }
    console.log(
      "[DecisionLogPanel] decisionActivities updated:",
      this.decisionActivities,
    );
    this.requestUpdate();
    console.log("[DecisionLogPanel] requestUpdate called");
  }

  /**
   * Clear all decision activities
   */
  clearAllActivities() {
    this.decisionActivities.clear();
    this.requestUpdate();
    console.log("[DecisionLogPanel] All activities cleared");
  }

  getActivityEmoji(state) {
    const emojis = {
      working: "🔧",
      debugging: "🐛",
      testing: "🧪",
      reviewing: "👁️",
      idle: "💤",
    };
    return emojis[state] || "⚙️";
  }

  _handleItemClick(decisionId) {
    this.dispatchEvent(
      new CustomEvent("log-item-click", {
        detail: { decisionId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  updated(changedProps) {
    super.updated && super.updated(changedProps);
    if (changedProps.has("selectedId")) {
      // Wait for render, then scroll selected item into view
      this.updateComplete.then(() => {
        const selected = this.renderRoot.querySelector(".selected-log-item");
        if (selected) {
          selected.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
  }

  _getDecisionDate(date) {
    // Handle enhanced date objects
    if (date && typeof date === "object" && "decision_date" in date) {
      return new Date(date.decision_date.replace(" ", "T"));
    }
    // Handle string dates
    return new Date(date.replace(" ", "T"));
  }

  _formatDate(date) {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  _getAuthorDisplayName(author) {
    if (author && typeof author === "object" && "display_name" in author) {
      return author.display_name || author.github_username;
    }
    return author || "Unknown";
  }

  render() {
    const sortedDecisions = [...this.decisions].sort((a, b) => {
      const dateA = this._getDecisionDate(a.date);
      const dateB = this._getDecisionDate(b.date);
      return dateB - dateA;
    });

    return html`
      ${sortedDecisions.map((decision) => {
        const decisionDate = this._getDecisionDate(decision.date);
        const formattedDate = this._formatDate(decisionDate);
        const statusClass = `status-${decision.status.toLowerCase().replace(" ", "-")}`;
        const isSelected = this.selectedId === decision.id;
        const activity = this.decisionActivities.get(decision.id);
        const authorName = this._getAuthorDisplayName(decision.author);

        // Check if we have enhanced date metadata
        const hasGitDates = decision.date && typeof decision.date === "object";
        const commitCount = hasGitDates ? decision.date.commit_count : null;

        const activityBadge = activity
          ? html`
              <span
                class="activity-badge ${activity.state}"
                style="margin-left: 8px; font-size: 10px;"
              >
                ${this.getActivityEmoji(activity.state)} ${activity.agentId}
              </span>
            `
          : "";

        return html`
          <div
            class="log-item ${isSelected ? "selected-log-item" : ""}"
            data-decision-id=${decision.id}
            @click=${() => this._handleItemClick(decision.id)}
          >
            <github-avatar
              .author="${decision.author}"
              size="small"
            ></github-avatar>
            <div class="log-item-content">
              <h4>
                Decision #${decision.id}: ${decision.title} ${activityBadge}
              </h4>
              <p>
                ${formattedDate} | Status:
                <span class=${statusClass}>${decision.status}</span>
              </p>
              <div class="author-info">
                <span>by ${authorName}</span>
                ${commitCount
                  ? html`
                      <span class="date-badge">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path
                            d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"
                          />
                        </svg>
                        ${commitCount} commit${commitCount !== 1 ? "s" : ""}
                      </span>
                    `
                  : ""}
              </div>
            </div>
          </div>
        `;
      })}
    `;
  }
}

customElements.define("decision-log-panel", DecisionLogPanel);
