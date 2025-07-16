import { LitElement, css, html } from "https://esm.sh/lit@3";
import {
  extractDate,
  getAvailableDates,
  getLastFileChangeDate,
  filterByDateRange,
  filterByRecentFileChanges,
  calculateTimeStatistics,
} from "../utils/time-filtering-utils.mjs";

/**
 * Enhanced time filter component with commit date awareness
 * @element enhanced-time-filter
 * @fires time-filter-change - Dispatched when time filters change
 */
class EnhancedTimeFilter extends LitElement {
  static properties = {
    decisions: { type: Array },
    selectedDateType: { type: String },
    dateRangeStart: { type: String },
    dateRangeEnd: { type: String },
    recentActivityDays: { type: Number },
    showStats: { type: Boolean },
  };

  constructor() {
    super();
    this.decisions = [];
    this.selectedDateType = "decision"; // decision, first_commit, last_commit, any
    this.dateRangeStart = "";
    this.dateRangeEnd = "";
    this.recentActivityDays = 0;
    this.showStats = false;
  }

  static styles = css`
    :host {
      display: block;
      background: var(--panel-bg);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .filter-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .filter-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-icon {
      width: 20px;
      height: 20px;
      opacity: 0.7;
    }

    .filter-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .filter-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .date-type-selector {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .date-type-button {
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--panel-bg);
      color: var(--text-main);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .date-type-button:hover {
      border-color: var(--accent);
      background: rgba(0, 82, 204, 0.05);
    }

    .date-type-button.active {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .date-type-button .count {
      font-size: 11px;
      opacity: 0.8;
      margin-left: 4px;
    }

    .date-range-inputs {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 8px;
      align-items: center;
    }

    .date-input {
      padding: 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--panel-bg);
      color: var(--text-main);
      font-size: 13px;
      width: 100%;
    }

    .date-input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(0, 82, 204, 0.1);
    }

    .date-separator {
      color: var(--text-secondary);
      font-size: 12px;
    }

    .activity-slider {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .slider-value {
      font-size: 12px;
      color: var(--accent);
      font-weight: 500;
      padding: 2px 8px;
      background: rgba(0, 82, 204, 0.1);
      border-radius: 12px;
    }

    input[type="range"] {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: var(--border);
      outline: none;
      -webkit-appearance: none;
    }

    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .quick-filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .quick-filter-button {
      padding: 6px 12px;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: var(--panel-bg);
      color: var(--text-main);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .quick-filter-button:hover {
      border-color: var(--accent);
      background: rgba(0, 82, 204, 0.05);
    }

    .quick-filter-button.active {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .stats-toggle {
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--panel-bg);
      color: var(--text-secondary);
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .stats-toggle:hover {
      border-color: var(--accent);
      color: var(--accent);
    }

    .stats-panel {
      margin-top: 16px;
      padding: 12px;
      background: rgba(0, 82, 204, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(0, 82, 204, 0.2);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-label {
      font-size: 11px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-main);
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .action-button {
      flex: 1;
      padding: 8px 16px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--panel-bg);
      color: var(--text-main);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-button:hover {
      border-color: var(--accent);
    }

    .action-button.primary {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .action-button.primary:hover {
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      .date-type-selector {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  _getDateTypeCounts() {
    const counts = {
      decision: 0,
      first_commit: 0,
      last_commit: 0,
      any: this.decisions.length,
    };

    this.decisions.forEach((decision) => {
      const dates = getAvailableDates(decision);
      if (dates.decision) counts.decision++;
      if (dates.first_commit) counts.first_commit++;
      if (dates.last_commit) counts.last_commit++;
    });

    return counts;
  }

  _handleDateTypeChange(type) {
    this.selectedDateType = type;
    this._emitFilterChange();
  }

  _handleDateRangeChange() {
    this._emitFilterChange();
  }

  _handleActivitySliderChange(e) {
    this.recentActivityDays = parseInt(e.target.value);
    this._emitFilterChange();
  }

  _applyQuickFilter(filterType) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filterType) {
      case "today":
        this.dateRangeStart = today.toISOString().split("T")[0];
        this.dateRangeEnd = today.toISOString().split("T")[0];
        break;
      case "week": {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        this.dateRangeStart = weekAgo.toISOString().split("T")[0];
        this.dateRangeEnd = today.toISOString().split("T")[0];
        break;
      }
      case "month": {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        this.dateRangeStart = monthAgo.toISOString().split("T")[0];
        this.dateRangeEnd = today.toISOString().split("T")[0];
        break;
      }
      case "quarter": {
        const quarterAgo = new Date(today);
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        this.dateRangeStart = quarterAgo.toISOString().split("T")[0];
        this.dateRangeEnd = today.toISOString().split("T")[0];
        break;
      }
      case "year": {
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        this.dateRangeStart = yearAgo.toISOString().split("T")[0];
        this.dateRangeEnd = today.toISOString().split("T")[0];
        break;
      }
    }

    this._emitFilterChange();
  }

  _clearFilters() {
    this.selectedDateType = "decision";
    this.dateRangeStart = "";
    this.dateRangeEnd = "";
    this.recentActivityDays = 0;
    this._emitFilterChange();
  }

  _emitFilterChange() {
    let filteredDecisions = [...this.decisions];

    // Apply date range filter
    if (this.dateRangeStart || this.dateRangeEnd) {
      const startDate = this.dateRangeStart
        ? new Date(this.dateRangeStart)
        : null;
      const endDate = this.dateRangeEnd ? new Date(this.dateRangeEnd) : null;

      filteredDecisions = filterByDateRange(
        filteredDecisions,
        startDate,
        endDate,
        this.selectedDateType,
      );
    }

    // Apply recent activity filter
    if (this.recentActivityDays > 0) {
      filteredDecisions = filterByRecentFileChanges(
        filteredDecisions,
        this.recentActivityDays,
      );
    }

    this.dispatchEvent(
      new CustomEvent("time-filter-change", {
        detail: {
          filteredDecisions,
          filters: {
            dateType: this.selectedDateType,
            dateRangeStart: this.dateRangeStart,
            dateRangeEnd: this.dateRangeEnd,
            recentActivityDays: this.recentActivityDays,
          },
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _renderStats() {
    const stats = calculateTimeStatistics(this.decisions);

    return html`
      <div class="stats-panel">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Total Decisions</span>
            <span class="stat-value">${stats.totalDecisions}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">With Commits</span>
            <span class="stat-value">${stats.decisionsWithCommits}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Enhanced Dates</span>
            <span class="stat-value">${stats.decisionsWithEnhancedDates}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Avg. Commits</span>
            <span class="stat-value"
              >${stats.averageCommitsPerDecision.toFixed(1)}</span
            >
          </div>
          ${stats.dateRange.span
            ? html`
                <div class="stat-item">
                  <span class="stat-label">Time Span</span>
                  <span class="stat-value">${stats.dateRange.span} days</span>
                </div>
              `
            : ""}
          ${stats.commitActivity.totalCommits > 0
            ? html`
                <div class="stat-item">
                  <span class="stat-label">Total Commits</span>
                  <span class="stat-value"
                    >${stats.commitActivity.totalCommits}</span
                  >
                </div>
              `
            : ""}
        </div>
      </div>
    `;
  }

  render() {
    const counts = this._getDateTypeCounts();

    return html`
      <div class="filter-header">
        <h3 class="filter-title">
          <svg
            class="filter-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Enhanced Time Filter
        </h3>
        <button
          class="stats-toggle"
          @click=${() => (this.showStats = !this.showStats)}
        >
          ${this.showStats ? "Hide" : "Show"} Stats
        </button>
      </div>

      <div class="filter-body">
        <!-- Date Type Selection -->
        <div class="filter-section">
          <label class="filter-label">Filter by Date Type</label>
          <div class="date-type-selector">
            <button
              class="date-type-button ${this.selectedDateType === "decision"
                ? "active"
                : ""}"
              @click=${() => this._handleDateTypeChange("decision")}
            >
              Decision Date
              <span class="count">(${counts.decision})</span>
            </button>
            <button
              class="date-type-button ${this.selectedDateType === "first_commit"
                ? "active"
                : ""}"
              @click=${() => this._handleDateTypeChange("first_commit")}
            >
              First Commit
              <span class="count">(${counts.first_commit})</span>
            </button>
            <button
              class="date-type-button ${this.selectedDateType === "last_commit"
                ? "active"
                : ""}"
              @click=${() => this._handleDateTypeChange("last_commit")}
            >
              Last Commit
              <span class="count">(${counts.last_commit})</span>
            </button>
            <button
              class="date-type-button ${this.selectedDateType === "any"
                ? "active"
                : ""}"
              @click=${() => this._handleDateTypeChange("any")}
            >
              Any Date
              <span class="count">(${counts.any})</span>
            </button>
          </div>
        </div>

        <!-- Date Range -->
        <div class="filter-section">
          <label class="filter-label">Date Range</label>
          <div class="date-range-inputs">
            <input
              type="date"
              class="date-input"
              .value=${this.dateRangeStart}
              @change=${(e) => {
                this.dateRangeStart = e.target.value;
                this._handleDateRangeChange();
              }}
            />
            <span class="date-separator">to</span>
            <input
              type="date"
              class="date-input"
              .value=${this.dateRangeEnd}
              @change=${(e) => {
                this.dateRangeEnd = e.target.value;
                this._handleDateRangeChange();
              }}
            />
          </div>
        </div>

        <!-- Quick Filters -->
        <div class="filter-section">
          <label class="filter-label">Quick Filters</label>
          <div class="quick-filters">
            <button
              class="quick-filter-button"
              @click=${() => this._applyQuickFilter("today")}
            >
              Today
            </button>
            <button
              class="quick-filter-button"
              @click=${() => this._applyQuickFilter("week")}
            >
              Last 7 Days
            </button>
            <button
              class="quick-filter-button"
              @click=${() => this._applyQuickFilter("month")}
            >
              Last Month
            </button>
            <button
              class="quick-filter-button"
              @click=${() => this._applyQuickFilter("quarter")}
            >
              Last Quarter
            </button>
            <button
              class="quick-filter-button"
              @click=${() => this._applyQuickFilter("year")}
            >
              Last Year
            </button>
          </div>
        </div>

        <!-- Recent Activity Slider -->
        <div class="filter-section">
          <div class="activity-slider">
            <div class="slider-header">
              <label class="filter-label">Recent File Activity</label>
              <span class="slider-value">
                ${this.recentActivityDays === 0
                  ? "Off"
                  : `${this.recentActivityDays} days`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="1"
              .value=${this.recentActivityDays}
              @input=${this._handleActivitySliderChange}
            />
          </div>
        </div>

        <!-- Stats Panel -->
        ${this.showStats ? this._renderStats() : ""}

        <!-- Actions -->
        <div class="filter-actions">
          <button class="action-button" @click=${this._clearFilters}>
            Clear All
          </button>
          <button
            class="action-button primary"
            @click=${this._emitFilterChange}
          >
            Apply Filters
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define("enhanced-time-filter", EnhancedTimeFilter);

export { EnhancedTimeFilter };


// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Support filtering by enhanced date objects (decision_date, first_commit_date, last_commit_date)
// Timestamp: 2025-07-16T05:35:55.773Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Update search panel for commit-based date filtering
// Timestamp: 2025-07-16T05:35:55.824Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add 'last file change' filter using github_metadata.file_status
// Timestamp: 2025-07-16T05:35:55.873Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Create commit timeline visualization from github_metadata.commits
// Timestamp: 2025-07-16T05:35:55.919Z



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
// Timestamp: 2025-07-16T05:35:56.059Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add filtering by GitHub PR/issue activity
// Timestamp: 2025-07-16T05:35:56.105Z

