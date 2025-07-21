import { LitElement, css, html } from "https://esm.sh/lit@3";
import { getLastFileChangeDate } from "../utils/time-filtering-utils.mjs";

/**
 * Commit activity heatmap component
 * @element commit-activity-heatmap
 * @property {Array} decisions - Array of decision objects
 * @property {number} weeks - Number of weeks to display (default: 52)
 * @fires heatmap-day-click - Fired when a day is clicked
 */
class CommitActivityHeatmap extends LitElement {
  static properties = {
    decisions: { type: Array },
    weeks: { type: Number },
    selectedDate: { type: String },
  };

  constructor() {
    super();
    this.decisions = [];
    this.weeks = 52; // Show one year by default
    this.selectedDate = null;
  }

  static styles = css`
    :host {
      display: block;
      background: var(--panel-bg);
      border-radius: 4px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .heatmap-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .heatmap-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .heatmap-icon {
      width: 20px;
      height: 20px;
      opacity: 0.7;
    }

    .heatmap-controls {
      display: flex;
      gap: 8px;
    }

    .weeks-selector {
      padding: 4px 8px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--panel-bg);
      color: var(--text-primary);
      font-size: 12px;
      cursor: pointer;
    }

    .heatmap-container {
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 8px;
    }

    .heatmap-grid {
      display: inline-grid;
      grid-template-rows: repeat(7, 12px);
      grid-auto-flow: column;
      gap: 3px;
      padding-left: 30px;
      position: relative;
    }

    .day-labels {
      position: absolute;
      left: 0;
      top: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .day-label {
      height: 12px;
      font-size: 10px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      padding-right: 8px;
    }

    .month-labels {
      display: flex;
      gap: 3px;
      margin-bottom: 8px;
      padding-left: 30px;
    }

    .month-label {
      font-size: 11px;
      color: var(--text-secondary);
      flex: 0 0 auto;
    }

    .day-cell {
      width: 12px;
      height: 12px;
      background: var(--border-color);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .day-cell[data-count="0"] {
      background: var(--border-color);
      opacity: 0.5;
    }

    .day-cell[data-level="1"] {
      background: var(--color-primary-light);
    }

    .day-cell[data-level="2"] {
      background: color-mix(in srgb, var(--color-primary) 50%, transparent);
    }

    .day-cell[data-level="3"] {
      background: color-mix(in srgb, var(--color-primary) 75%, transparent);
    }

    .day-cell[data-level="4"] {
      background: var(--color-primary);
    }

    .day-cell:hover {
      transform: scale(1.2);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .day-cell.selected {
      box-shadow: 0 0 0 2px var(--accent);
    }

    .day-cell.future {
      opacity: 0.2;
      cursor: default;
    }

    .day-cell.future:hover {
      transform: none;
      box-shadow: none;
    }

    .tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(-4px);
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 11px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 10;
    }

    .day-cell:hover .tooltip {
      opacity: 1;
    }

    .legend {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      font-size: 11px;
      color: var(--text-secondary);
    }

    .legend-label {
      margin-right: 8px;
    }

    .legend-item {
      width: 12px;
      height: 12px;
      border-radius: 4px;
    }

    .summary {
      margin-top: 16px;
      padding: 12px;
      background: var(--color-primary-light);
      border-radius: 4px;
      border: 1px solid var(--color-primary);
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
    }

    .summary-stat {
      text-align: center;
    }

    .summary-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .summary-label {
      font-size: 11px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .current-streak {
      color: var(--color-primary);
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
      font-style: italic;
    }

    @media (max-width: 768px) {
      .heatmap-container {
        overflow-x: scroll;
        -webkit-overflow-scrolling: touch;
      }
    }
  `;

  _generateHeatmapData() {
    const today = new Date();
    const endDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - this.weeks * 7 + 1);

    // Initialize data structure
    const commitsByDate = {};
    const decisionsByDate = {};

    // Count commits and decisions by date
    this.decisions.forEach((decision) => {
      // Count decisions by their date
      const decisionDate = decision.date ? new Date(decision.date) : null;
      if (decisionDate) {
        const dateKey = decisionDate.toISOString().split("T")[0];
        decisionsByDate[dateKey] = (decisionsByDate[dateKey] || 0) + 1;
      }

      // Count commits by their dates
      if (decision.github_metadata?.commits) {
        decision.github_metadata.commits.forEach((commit) => {
          if (commit.date) {
            const commitDate = new Date(commit.date);
            const dateKey = commitDate.toISOString().split("T")[0];
            commitsByDate[dateKey] = (commitsByDate[dateKey] || 0) + 1;
          }
        });
      }
    });

    // Generate grid data
    const days = [];
    const monthStarts = [];
    let currentDate = new Date(startDate);
    let lastMonth = -1;
    let maxCount = 0;

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split("T")[0];
      const commitCount = commitsByDate[dateKey] || 0;
      const decisionCount = decisionsByDate[dateKey] || 0;
      const totalCount = commitCount + decisionCount;

      if (totalCount > maxCount) maxCount = totalCount;

      // Track month starts
      if (currentDate.getMonth() !== lastMonth) {
        monthStarts.push({
          month: currentDate.getMonth(),
          year: currentDate.getFullYear(),
          index: days.length,
        });
        lastMonth = currentDate.getMonth();
      }

      days.push({
        date: new Date(currentDate),
        dateKey,
        commitCount,
        decisionCount,
        totalCount,
        dayOfWeek: currentDate.getDay(),
        isFuture: currentDate > today,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate activity levels (0-4)
    days.forEach((day) => {
      if (day.totalCount === 0) {
        day.level = 0;
      } else if (day.totalCount === 1) {
        day.level = 1;
      } else if (day.totalCount <= 3) {
        day.level = 2;
      } else if (day.totalCount <= 5) {
        day.level = 3;
      } else {
        day.level = 4;
      }
    });

    return { days, monthStarts, maxCount };
  }

  _calculateStats(days) {
    const stats = {
      totalDays: days.length,
      activeDays: 0,
      totalCommits: 0,
      totalDecisions: 0,
      currentStreak: 0,
      longestStreak: 0,
    };

    let currentStreak = 0;
    const today = new Date().toISOString().split("T")[0];
    let countingCurrent = true;

    // Process days in reverse order for streak calculation
    for (let i = days.length - 1; i >= 0; i--) {
      const day = days[i];

      if (day.isFuture) continue;

      if (day.totalCount > 0) {
        stats.activeDays++;
        stats.totalCommits += day.commitCount;
        stats.totalDecisions += day.decisionCount;

        currentStreak++;
        if (currentStreak > stats.longestStreak) {
          stats.longestStreak = currentStreak;
        }

        if (countingCurrent) {
          stats.currentStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
        if (countingCurrent && day.dateKey <= today) {
          countingCurrent = false;
        }
      }
    }

    return stats;
  }

  _formatMonth(month, year) {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months[month];
  }

  _handleDayClick(day) {
    if (day.isFuture) return;

    this.selectedDate = this.selectedDate === day.dateKey ? null : day.dateKey;

    this.dispatchEvent(
      new CustomEvent("heatmap-day-click", {
        detail: {
          date: day.dateKey,
          commitCount: day.commitCount,
          decisionCount: day.decisionCount,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _renderDay(day) {
    const tooltip = day.isFuture
      ? "Future date"
      : `${day.dateKey}: ${day.commitCount} commits, ${day.decisionCount} decisions`;

    return html`
      <div
        class="day-cell ${day.isFuture ? "future" : ""} ${this.selectedDate ===
        day.dateKey
          ? "selected"
          : ""}"
        data-count="${day.totalCount}"
        data-level="${day.level}"
        @click=${() => this._handleDayClick(day)}
      >
        <div class="tooltip">${tooltip}</div>
      </div>
    `;
  }

  _renderHeatmap() {
    const { days, monthStarts, maxCount } = this._generateHeatmapData();

    if (days.length === 0) {
      return html` <div class="empty-state">No activity data available.</div> `;
    }

    // Group days by week column
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    // Calculate month label positions
    const monthLabels = monthStarts.map((start, index) => {
      const nextStart = monthStarts[index + 1];
      const weeks = nextStart
        ? Math.floor((nextStart.index - start.index) / 7)
        : Math.floor((days.length - start.index) / 7);

      return {
        ...start,
        width: weeks * 15, // 12px cell + 3px gap
      };
    });

    const stats = this._calculateStats(days);

    return html`
      <div class="month-labels">
        ${monthLabels.map(
          (label) => html`
            <div class="month-label" style="width: ${label.width}px">
              ${this._formatMonth(label.month, label.year)}
            </div>
          `,
        )}
      </div>

      <div class="heatmap-container">
        <div class="heatmap-grid">
          <div class="day-labels">
            <div class="day-label">Sun</div>
            <div class="day-label">Mon</div>
            <div class="day-label">Tue</div>
            <div class="day-label">Wed</div>
            <div class="day-label">Thu</div>
            <div class="day-label">Fri</div>
            <div class="day-label">Sat</div>
          </div>
          ${days.map((day) => this._renderDay(day))}
        </div>
      </div>

      <div class="legend">
        <span class="legend-label">Less</span>
        <div
          class="legend-item"
          style="background: var(--border-color); opacity: 0.5;"
        ></div>
        <div
          class="legend-item"
          style="background: var(--color-primary-light);"
        ></div>
        <div
          class="legend-item"
          style="background: color-mix(in srgb, var(--color-primary) 50%, transparent);"
        ></div>
        <div
          class="legend-item"
          style="background: color-mix(in srgb, var(--color-primary) 75%, transparent);"
        ></div>
        <div class="legend-item" style="background: var(--color-primary);"></div>
        <span class="legend-label">More</span>
      </div>

      <div class="summary">
        <div class="summary-stats">
          <div class="summary-stat">
            <div class="summary-value">${stats.activeDays}</div>
            <div class="summary-label">Active Days</div>
          </div>
          <div class="summary-stat">
            <div class="summary-value">${stats.totalCommits}</div>
            <div class="summary-label">Total Commits</div>
          </div>
          <div class="summary-stat">
            <div class="summary-value">${stats.totalDecisions}</div>
            <div class="summary-label">Total Decisions</div>
          </div>
          <div class="summary-stat">
            <div class="summary-value current-streak">
              ${stats.currentStreak}
            </div>
            <div class="summary-label">Current Streak</div>
          </div>
          <div class="summary-stat">
            <div class="summary-value">${stats.longestStreak}</div>
            <div class="summary-label">Longest Streak</div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="heatmap-header">
        <h3 class="heatmap-title">
          <svg
            class="heatmap-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 7V4a2 2 0 012-2h2M4 17v3a2 2 0 002 2h2m10-18h2a2 2 0 012 2v3m-6 14h2a2 2 0 002-2v-3M12 12h.01M8 12h.01M16 12h.01M12 8h.01M8 16h.01M16 8h.01M12 16h.01M16 16h.01M8 8h.01"
            />
          </svg>
          Commit Activity
        </h3>
        <div class="heatmap-controls">
          <select
            class="weeks-selector"
            @change=${(e) => (this.weeks = parseInt(e.target.value))}
          >
            <option value="13" ?selected=${this.weeks === 13}>
              Last 3 months
            </option>
            <option value="26" ?selected=${this.weeks === 26}>
              Last 6 months
            </option>
            <option value="52" ?selected=${this.weeks === 52}>Last year</option>
          </select>
        </div>
      </div>

      ${this._renderHeatmap()}
    `;
  }
}

customElements.define("commit-activity-heatmap", CommitActivityHeatmap);

export { CommitActivityHeatmap };


// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Support filtering by enhanced date objects (decision_date, first_commit_date, last_commit_date)
// Timestamp: 2025-07-16T05:35:55.777Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Update search panel for commit-based date filtering
// Timestamp: 2025-07-16T05:35:55.826Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add 'last file change' filter using github_metadata.file_status
// Timestamp: 2025-07-16T05:35:55.875Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Create commit timeline visualization from github_metadata.commits
// Timestamp: 2025-07-16T05:35:55.921Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add file activity indicators using github_metadata.file_status
// Timestamp: 2025-07-16T05:35:55.967Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add commit count indicators (github_metadata.commits.length)
// Timestamp: 2025-07-16T05:35:56.014Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Integrate with Git history analysis service
// Timestamp: 2025-07-16T05:35:56.060Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add filtering by GitHub PR/issue activity
// Timestamp: 2025-07-16T05:35:56.106Z

