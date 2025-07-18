import { LitElement, css, html } from "https://esm.sh/lit@3";
import {
  extractDate,
  getAvailableDates,
  groupByTimePeriod,
  calculateTimeStatistics,
} from "../utils/time-filtering-utils.mjs";

/**
 * Commit timeline visualization component
 * @element commit-timeline-viz
 * @property {Array} decisions - Array of decision objects to visualize
 * @property {string} groupBy - Grouping period: 'day', 'week', 'month', 'quarter', 'year'
 * @property {string} dateType - Type of date to visualize
 * @fires timeline-item-click - Fired when a timeline item is clicked
 */
class CommitTimelineViz extends LitElement {
  static properties = {
    decisions: { type: Array },
    groupBy: { type: String },
    dateType: { type: String },
    selectedPeriod: { type: String },
  };

  constructor() {
    super();
    this.decisions = [];
    this.groupBy = "month";
    this.dateType = "decision";
    this.selectedPeriod = null;
  }

  static styles = css`
    :host {
      display: block;
      background: var(--panel-bg);
      border-radius: 4px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .timeline-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .timeline-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .timeline-icon {
      width: 20px;
      height: 20px;
      opacity: 0.7;
    }

    .timeline-controls {
      display: flex;
      gap: 8px;
    }

    .control-button {
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--panel-bg);
      color: var(--text-main);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .control-button:hover {
      border-color: var(--accent);
      background: rgba(0, 82, 204, 0.05);
    }

    .control-button.active {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .timeline-container {
      position: relative;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 20px 0;
    }

    .timeline-track {
      position: relative;
      min-height: 200px;
      display: flex;
      align-items: flex-end;
      gap: 4px;
      padding: 0 20px;
    }

    .timeline-period {
      flex: 1;
      min-width: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .timeline-bar {
      width: 100%;
      background: var(--accent);
      border-radius: 4px 4px 0 0;
      position: relative;
      transition: all 0.3s ease;
      min-height: 4px;
    }

    .timeline-period:hover .timeline-bar {
      background: var(--accent);
      opacity: 0.8;
    }

    .timeline-period.selected .timeline-bar {
      background: var(--accent);
      box-shadow: 0 0 0 2px var(--accent);
    }

    .timeline-label {
      margin-top: 8px;
      font-size: 11px;
      color: var(--text-secondary);
      text-align: center;
      white-space: nowrap;
      transform: rotate(-45deg);
      transform-origin: center;
      margin-bottom: -10px;
    }

    .timeline-count {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      font-weight: 600;
      color: var(--text-main);
      background: var(--panel-bg);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border);
      white-space: nowrap;
    }

    .commit-dots {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      padding: 4px 2px;
      margin-bottom: 4px;
    }

    .commit-dot {
      width: 6px;
      height: 6px;
      background: var(--accent);
      border-radius: 50%;
      opacity: 0.6;
    }

    .timeline-legend {
      display: flex;
      gap: 16px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      font-size: 12px;
      color: var(--text-secondary);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
    }

    .timeline-summary {
      margin-top: 16px;
      padding: 12px;
      background: rgba(0, 82, 204, 0.05);
      border-radius: 4px;
      border: 1px solid rgba(0, 82, 204, 0.2);
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
    }

    .summary-stat {
      text-align: center;
    }

    .summary-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-main);
    }

    .summary-label {
      font-size: 11px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
      font-style: italic;
    }

    .tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(-8px);
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 8px 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      white-space: nowrap;
      font-size: 12px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 10;
    }

    .timeline-period:hover .tooltip {
      opacity: 1;
    }

    @media (max-width: 768px) {
      .timeline-controls {
        flex-wrap: wrap;
      }

      .timeline-container {
        overflow-x: scroll;
        -webkit-overflow-scrolling: touch;
      }
    }
  `;

  _getTimelineData() {
    if (!this.decisions || this.decisions.length === 0) {
      return { groups: {}, maxCount: 0, totalCommits: 0 };
    }

    // Filter decisions that have the selected date type
    const decisionsWithDate = this.decisions.filter((decision) => {
      const date = extractDate(decision.date, this.dateType);
      return date !== null;
    });

    // Group by time period
    const groups = groupByTimePeriod(
      decisionsWithDate,
      this.groupBy,
      this.dateType,
    );

    // Calculate max count for scaling
    let maxCount = 0;
    let totalCommits = 0;

    Object.values(groups).forEach((decisions) => {
      if (decisions.length > maxCount) {
        maxCount = decisions.length;
      }

      decisions.forEach((decision) => {
        if (decision.github_metadata?.commits) {
          totalCommits += decision.github_metadata.commits.length;
        }
      });
    });

    return { groups, maxCount, totalCommits };
  }

  _formatPeriodLabel(period) {
    if (this.groupBy === "week") {
      return period.replace("W", "Week ");
    } else if (this.groupBy === "quarter") {
      return period.replace("-Q", " Q");
    }
    return period;
  }

  _calculateBarHeight(count, maxCount) {
    if (maxCount === 0) return 20;
    return Math.max(20, (count / maxCount) * 150);
  }

  _getCommitCount(decisions) {
    let count = 0;
    decisions.forEach((decision) => {
      if (decision.github_metadata?.commits) {
        count += decision.github_metadata.commits.length;
      }
    });
    return count;
  }

  _handlePeriodClick(period, decisions) {
    this.selectedPeriod = this.selectedPeriod === period ? null : period;

    this.dispatchEvent(
      new CustomEvent("timeline-item-click", {
        detail: { period, decisions },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _renderTimeline() {
    const { groups, maxCount, totalCommits } = this._getTimelineData();
    const sortedPeriods = Object.keys(groups).sort();

    if (sortedPeriods.length === 0) {
      return html`
        <div class="empty-state">
          No decisions found with ${this.dateType.replace("_", " ")} dates.
        </div>
      `;
    }

    return html`
      <div class="timeline-container">
        <div class="timeline-track">
          ${sortedPeriods.map((period) => {
            const decisions = groups[period];
            const commitCount = this._getCommitCount(decisions);
            const barHeight = this._calculateBarHeight(
              decisions.length,
              maxCount,
            );

            return html`
              <div
                class="timeline-period ${this.selectedPeriod === period
                  ? "selected"
                  : ""}"
                @click=${() => this._handlePeriodClick(period, decisions)}
              >
                <div class="timeline-bar" style="height: ${barHeight}px">
                  <span class="timeline-count">${decisions.length}</span>
                  ${commitCount > 0
                    ? html`
                        <div class="commit-dots">
                          ${Array(Math.min(commitCount, 10))
                            .fill(0)
                            .map(() => html` <div class="commit-dot"></div> `)}
                          ${commitCount > 10
                            ? html`<span
                                style="font-size: 10px; color: var(--text-secondary);"
                                >+${commitCount - 10}</span
                              >`
                            : ""}
                        </div>
                      `
                    : ""}
                  <div class="tooltip">
                    ${decisions.length}
                    decision${decisions.length !== 1 ? "s" : ""}
                    ${commitCount > 0
                      ? html`<br />${commitCount}
                          commit${commitCount !== 1 ? "s" : ""}`
                      : ""}
                  </div>
                </div>
                <span class="timeline-label"
                  >${this._formatPeriodLabel(period)}</span
                >
              </div>
            `;
          })}
        </div>
      </div>

      <div class="timeline-legend">
        <div class="legend-item">
          <div class="legend-dot"></div>
          <span>Decisions</span>
        </div>
        <div class="legend-item">
          <div
            class="legend-dot"
            style="width: 6px; height: 6px; opacity: 0.6;"
          ></div>
          <span>Commits (max 10 shown)</span>
        </div>
      </div>

      <div class="timeline-summary">
        <div class="summary-stats">
          <div class="summary-stat">
            <div class="summary-value">${sortedPeriods.length}</div>
            <div class="summary-label">Time Periods</div>
          </div>
          <div class="summary-stat">
            <div class="summary-value">
              ${Object.values(groups).reduce(
                (sum, decisions) => sum + decisions.length,
                0,
              )}
            </div>
            <div class="summary-label">Total Decisions</div>
          </div>
          <div class="summary-stat">
            <div class="summary-value">${totalCommits}</div>
            <div class="summary-label">Total Commits</div>
          </div>
          <div class="summary-stat">
            <div class="summary-value">
              ${(
                totalCommits /
                Object.values(groups).reduce(
                  (sum, decisions) => sum + decisions.length,
                  0,
                )
              ).toFixed(1)}
            </div>
            <div class="summary-label">Avg Commits/Decision</div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="timeline-header">
        <h3 class="timeline-title">
          <svg
            class="timeline-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Commit Timeline
        </h3>
        <div class="timeline-controls">
          ${["day", "week", "month", "quarter", "year"].map(
            (period) => html`
              <button
                class="control-button ${this.groupBy === period
                  ? "active"
                  : ""}"
                @click=${() => (this.groupBy = period)}
              >
                ${period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            `,
          )}
        </div>
      </div>

      ${this._renderTimeline()}
    `;
  }
}

customElements.define("commit-timeline-viz", CommitTimelineViz);

export { CommitTimelineViz };


// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Support filtering by enhanced date objects (decision_date, first_commit_date, last_commit_date)
// Timestamp: 2025-07-16T05:35:55.774Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Update search panel for commit-based date filtering
// Timestamp: 2025-07-16T05:35:55.825Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add 'last file change' filter using github_metadata.file_status
// Timestamp: 2025-07-16T05:35:55.874Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Create commit timeline visualization from github_metadata.commits
// Timestamp: 2025-07-16T05:35:55.920Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add file activity indicators using github_metadata.file_status
// Timestamp: 2025-07-16T05:35:55.966Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add commit count indicators (github_metadata.commits.length)
// Timestamp: 2025-07-16T05:35:56.012Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Integrate with Git history analysis service
// Timestamp: 2025-07-16T05:35:56.060Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add filtering by GitHub PR/issue activity
// Timestamp: 2025-07-16T05:35:56.105Z

