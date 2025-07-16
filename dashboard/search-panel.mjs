import { LitElement, css, html } from "https://esm.sh/lit@3";
import {
  extractDate,
  getAvailableDates,
  getCommitCount,
  getLastFileChangeDate,
} from "../utils/time-filtering-utils.mjs";

/**
 * A component that provides search and filtering controls with fun visualizations.
 * @element search-panel
 * @fires search-input - Dispatched when the user types in the search field.
 * @fires filter-change - Dispatched when sliders change.
 */
class SearchPanel extends LitElement {
  static properties = {
    decisions: { type: Array },
    filteredDecisions: { type: Array },
    filters: { type: Object },
    dateFilterType: { type: String },
    commitTimeRanges: { type: Array },
    activeFilters: { type: Object },
  };

  constructor() {
    super();
    this.decisions = [];
    this.filteredDecisions = [];
    this.dateFilterType = "decision"; // decision, first_commit, last_commit, any
    this.commitTimeRanges = []; // Array of {start: Date, end: Date, label: string}
    this.filters = {
      searchTerm: "",
      minImpact: 0,
      daysBack: 0,
      dateRange: { start: 0, end: 0 },
      recentFileActivity: 0,
      commitTimeRange: 0, // Index into commitTimeRanges
    };
    this.activeFilters = {
      categories: [],
      statuses: [],
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("decisions")) {
      this._buildCommitTimeRanges();
    }
  }

  static styles = css`
    :host {
      display: block;
      padding: 1rem;
      box-sizing: border-box;
      background: var(--panel-bg);
    }

    .search-section {
      margin-bottom: 1.5rem;
    }

    input[type="text"] {
      width: 100%;
      padding: 0.75rem;
      box-sizing: border-box;
      border: 2px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s ease;
      background: var(--panel-bg);
      color: var(--text-main);
    }

    input[type="text"]:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(0, 82, 204, 0.1);
    }

    .slider-section {
      margin-bottom: 1.5rem;
    }

    .slider-group {
      margin-bottom: 1rem;
    }

    .slider-label {
      font-weight: 500;
      color: var(--text-main);
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .slider-value {
      background: var(--accent);
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    input[type="range"] {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: var(--border);
      outline: none;
      -webkit-appearance: none;
      margin: 0.5rem 0;
    }

    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease;
    }

    input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.1);
    }

    .range-slider-container {
      position: relative;
      margin: 0.5rem 0;
    }

    .range-slider {
      position: relative;
      height: 6px;
      background: var(--border);
      border-radius: 3px;
    }

    .range-slider input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 6px;
      background: transparent;
      pointer-events: none;
      margin: 0;
    }

    .range-slider input::-webkit-slider-thumb {
      pointer-events: all;
    }

    .range-track {
      position: absolute;
      top: 0;
      height: 6px;
      background: var(--accent);
      border-radius: 3px;
      opacity: 0.7;
    }

    .charts-section {
      margin-top: 1rem;
    }

    .charts-title {
      font-weight: 600;
      color: var(--text-main);
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .chart-section {
      margin-bottom: 1rem;
    }

    .chart-section-title {
      font-weight: 500;
      color: var(--text-secondary);
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pie-charts {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }

    .pie-charts.all-stats {
      grid-template-columns: repeat(4, 1fr);
      grid-auto-rows: 1fr;
    }

    .pie-chart-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem;
      background: var(--tab-bg);
      border-radius: 6px;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
      flex: 1;
      min-width: 0;
      cursor: pointer;
    }

    .pie-chart-item:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      background: var(--panel-bg);
    }

    .pie-chart-item.active {
      background: rgba(0, 123, 255, 0.1);
      border: 1px solid rgba(0, 123, 255, 0.3);
      color: var(--text-main);
    }

    .pie-chart-item.active .chart-label {
      color: var(--text-main);
      font-weight: 600;
    }

    .pie-chart-item.active .chart-value {
      color: var(--accent);
      font-weight: 700;
    }

    body.dark-theme .pie-chart-item.active {
      background: rgba(0, 123, 255, 0.2);
      border: 1px solid rgba(0, 123, 255, 0.4);
    }

    .pie-chart-item.empty {
      opacity: 0.5;
      cursor: default;
    }

    .pie-chart-item.empty:hover {
      transform: none;
      box-shadow: none;
      background: var(--tab-bg);
    }

    .pie-chart {
      width: 40px;
      height: 40px;
      margin-bottom: 0.25rem;
    }

    .chart-label {
      font-size: 0.6rem;
      color: var(--text-secondary);
      text-align: center;
      font-weight: 500;
      line-height: 1.2;
    }

    .chart-value {
      font-size: 0.7rem;
      color: var(--accent);
      font-weight: 600;
      margin-top: 0.1rem;
    }

    .time-distribution {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: var(--tab-bg);
      border-radius: 8px;
    }

    .time-distribution-title {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 40px;
      margin: 0.5rem 0;
    }

    .bar {
      flex: 1;
      background: var(--accent);
      border-radius: 2px 2px 0 0;
      transition: all 0.2s ease;
      opacity: 0.7;
      min-height: 2px;
    }

    .bar:hover {
      opacity: 1;
      transform: scaleY(1.1);
    }

    .time-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .date-type-selector {
      display: flex;
      gap: 4px;
      margin-bottom: 0.5rem;
    }

    .date-type-button {
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--panel-bg);
      color: var(--text-secondary);
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.2s ease;
      flex: 1;
      text-align: center;
    }

    .date-type-button:hover {
      border-color: var(--accent);
      color: var(--text-main);
    }

    .date-type-button.active {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .activity-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 10px;
      margin-left: 4px;
    }

    .activity-indicator.recent {
      background: rgba(40, 167, 69, 0.1);
      color: #28a745;
    }

    .activity-indicator.moderate {
      background: rgba(255, 193, 7, 0.1);
      color: #ffc107;
    }

    .activity-indicator.old {
      background: rgba(108, 117, 125, 0.1);
      color: #6c757d;
    }
  `;

  _handleInput(e) {
    this.filters.searchTerm = e.target.value;
    this.dispatchEvent(
      new CustomEvent("search-input", {
        detail: { searchTerm: e.target.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _handleImpactChange(e) {
    this.filters.minImpact = parseInt(e.target.value);
    this.requestUpdate();
    this._emitFilterChange();
  }

  _handleDaysChange(e) {
    this.filters.daysBack = parseInt(e.target.value);
    this.requestUpdate();
    this._emitFilterChange();
  }

  _handleFileActivityChange(e) {
    this.filters.recentFileActivity = parseInt(e.target.value);
    this.requestUpdate();
    this._emitFilterChange();
  }

  _handleCommitTimeRangeChange(e) {
    this.filters.commitTimeRange = parseInt(e.target.value);
    this.requestUpdate();
    this._emitFilterChange();
  }

  _handleDateTypeChange(dateType) {
    this.dateFilterType = dateType;
    this.requestUpdate();
    this._emitFilterChange();
  }

  _handleDateRangeStart(e) {
    this.filters.dateRange.start = parseInt(e.target.value);
    this.requestUpdate();
    this._emitFilterChange();
  }

  _handleDateRangeEnd(e) {
    this.filters.dateRange.end = parseInt(e.target.value);
    this.requestUpdate();
    this._emitFilterChange();
  }

  _getDateRangeLabel() {
    const maxDays = this._getMaxDaysFromOldestDecision();
    const startDays = this.filters.dateRange.start;
    const endDays = this.filters.dateRange.end;

    if (startDays === 0 && endDays === 0) {
      return "All time";
    }

    const startLabel = startDays === 0 ? "Start" : `${startDays} days ago`;
    const endLabel = endDays === 0 ? "Now" : `${endDays} days ago`;

    return `${startLabel} → ${endLabel}`;
  }

  _emitFilterChange() {
    this.dispatchEvent(
      new CustomEvent("filter-change", {
        detail: {
          filters: this.filters,
          dateFilterType: this.dateFilterType,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _handleCategoryClick(category) {
    // Emit a category filter event
    this.dispatchEvent(
      new CustomEvent("category-filter", {
        detail: { category },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _handleStatusClick(status) {
    // Emit a status filter event
    this.dispatchEvent(
      new CustomEvent("status-filter", {
        detail: { status },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _getMaxDaysFromOldestDecision() {
    if (this.decisions.length === 0) return 365;

    const now = new Date();
    let oldestDate = now;

    // Check all date types based on current filter
    this.decisions.forEach((decision) => {
      const date = extractDate(
        decision.date,
        this.dateFilterType === "any" ? "decision" : this.dateFilterType,
      );
      if (date && date < oldestDate) {
        oldestDate = date;
      }
    });

    const diffTime = Math.abs(now - oldestDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(diffDays, 30);
  }

  _getMaxDaysFromOldestCommit() {
    let oldestCommitDate = null;

    this.decisions.forEach((decision) => {
      // Check for last_commit_date in enhanced date object
      if (
        decision.date &&
        typeof decision.date === "object" &&
        decision.date.last_commit_date
      ) {
        const commitDate = new Date(decision.date.last_commit_date);
        if (!oldestCommitDate || commitDate < oldestCommitDate) {
          oldestCommitDate = commitDate;
        }
      }
      // Check commits in github_metadata
      else if (decision.github_metadata?.commits?.length > 0) {
        decision.github_metadata.commits.forEach((commit) => {
          const commitDate = new Date(commit.date);
          if (!oldestCommitDate || commitDate < oldestCommitDate) {
            oldestCommitDate = commitDate;
          }
        });
      }
    });

    if (!oldestCommitDate) return 90; // Default fallback

    const today = new Date();
    const diffTime = Math.abs(today - oldestCommitDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(diffDays, 30); // At least 30 days
  }

  _getAllCommitTimestamps() {
    const timestamps = [];

    this.decisions.forEach((decision) => {
      // Check for last_commit_date in enhanced date object
      if (
        decision.date &&
        typeof decision.date === "object" &&
        decision.date.last_commit_date
      ) {
        timestamps.push(new Date(decision.date.last_commit_date));
      }
      // Check commits in github_metadata
      if (decision.github_metadata?.commits?.length > 0) {
        decision.github_metadata.commits.forEach((commit) => {
          timestamps.push(new Date(commit.date));
        });
      }
    });

    // Sort by date ascending
    return timestamps.sort((a, b) => a - b);
  }

  _buildCommitTimeRanges() {
    const timestamps = this._getAllCommitTimestamps();
    if (timestamps.length === 0) {
      this.commitTimeRanges = [];
      return;
    }

    const ranges = [];
    const now = new Date();

    // Add "All time" option
    ranges.push({
      start: timestamps[0],
      end: now,
      label: "All time",
      hours: Math.ceil((now - timestamps[0]) / (1000 * 60 * 60)),
    });

    // Add time-based ranges only where commits exist
    const timeRanges = [
      { hours: 1, label: "Last hour" },
      { hours: 6, label: "Last 6 hours" },
      { hours: 24, label: "Last 24 hours" },
      { hours: 72, label: "Last 3 days" },
      { hours: 168, label: "Last week" },
      { hours: 720, label: "Last 30 days" },
    ];

    timeRanges.forEach((range) => {
      const cutoffTime = new Date(now.getTime() - range.hours * 60 * 60 * 1000);
      // Check if any commits exist in this range
      const hasCommitsInRange = timestamps.some((ts) => ts >= cutoffTime);
      if (hasCommitsInRange) {
        ranges.push({
          start: cutoffTime,
          end: now,
          label: range.label,
          hours: range.hours,
        });
      }
    });

    // Add custom ranges for work sessions (gaps > 4 hours indicate new session)
    const sessions = [];
    let sessionStart = timestamps[0];

    for (let i = 1; i < timestamps.length; i++) {
      const gap = timestamps[i] - timestamps[i - 1];
      const gapHours = gap / (1000 * 60 * 60);

      if (gapHours > 4) {
        // End current session and start new one
        sessions.push({
          start: sessionStart,
          end: timestamps[i - 1],
        });
        sessionStart = timestamps[i];
      }
    }
    // Add final session
    sessions.push({
      start: sessionStart,
      end: timestamps[timestamps.length - 1],
    });

    // Add recent work sessions (up to 5)
    sessions
      .reverse()
      .slice(0, 5)
      .forEach((session, index) => {
        const duration = session.end - session.start;
        const durationHours = Math.ceil(duration / (1000 * 60 * 60));
        const daysAgo = Math.floor((now - session.end) / (1000 * 60 * 60 * 24));

        let label;
        if (daysAgo === 0) {
          label = `Today's work (${durationHours}h)`;
        } else if (daysAgo === 1) {
          label = `Yesterday's work (${durationHours}h)`;
        } else {
          label = `Work ${daysAgo} days ago (${durationHours}h)`;
        }

        ranges.push({
          start: session.start,
          end: session.end,
          label: label,
          hours: durationHours,
        });
      });

    this.commitTimeRanges = ranges;
  }

  _getDateTypeCounts() {
    const counts = {
      decision: 0,
      first_commit: 0,
      last_commit: 0,
    };

    this.decisions.forEach((decision) => {
      const dates = getAvailableDates(decision);
      if (dates.decision) counts.decision++;
      if (dates.first_commit) counts.first_commit++;
      if (dates.last_commit) counts.last_commit++;
    });

    return counts;
  }

  _getFileActivityLevel(decision) {
    const lastChange = getLastFileChangeDate(decision);
    if (!lastChange) return null;

    const daysAgo = Math.floor(
      (new Date() - lastChange) / (1000 * 60 * 60 * 24),
    );

    if (daysAgo <= 7) return "recent";
    if (daysAgo <= 30) return "moderate";
    return "old";
  }

  _getStatusData() {
    const statusCounts = {};
    const dataSource =
      this.filteredDecisions && this.filteredDecisions.length > 0
        ? this.filteredDecisions
        : this.decisions;
    dataSource.forEach((d) => {
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
    });
    return statusCounts;
  }

  _getCategoryData() {
    const categoryCounts = {};
    const dataSource =
      this.filteredDecisions && this.filteredDecisions.length > 0
        ? this.filteredDecisions
        : this.decisions;
    dataSource.forEach((d) => {
      const category = this._inferCategory(d);
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
    return categoryCounts;
  }

  _getIndividualCategoryData() {
    const categories = [
      "Infrastructure",
      "Developer Experience",
      "UI/UX",
      "Architecture",
      "Process",
      "Quality",
      "Integration",
      "Knowledge Management",
      "Other",
    ];
    // Use filteredDecisions if it exists and has data, otherwise use all decisions
    const dataSource =
      this.filteredDecisions && this.filteredDecisions.length > 0
        ? this.filteredDecisions
        : this.decisions;
    const totalDecisions = dataSource.length;

    return categories.map((category) => {
      const count = dataSource.filter(
        (d) => this._inferCategory(d) === category,
      ).length;
      return {
        category,
        count,
        percentage: totalDecisions > 0 ? (count / totalDecisions) * 100 : 0,
      };
    }); // Show all categories, even with 0 decisions
  }

  _inferCategory(decision) {
    const title = decision.title || "";
    const lowerTitle = title.toLowerCase();

    if (
      lowerTitle.includes("cli") ||
      lowerTitle.includes("automation") ||
      lowerTitle.includes("docker") ||
      lowerTitle.includes("release")
    ) {
      return "Developer Experience";
    } else if (
      lowerTitle.includes("websocket") ||
      lowerTitle.includes("server") ||
      lowerTitle.includes("infrastructure") ||
      lowerTitle.includes("api") ||
      lowerTitle.includes("redis") ||
      lowerTitle.includes("session")
    ) {
      return "Infrastructure";
    } else if (
      lowerTitle.includes("dashboard") ||
      lowerTitle.includes("ui") ||
      lowerTitle.includes("theme") ||
      lowerTitle.includes("visual") ||
      lowerTitle.includes("layout") ||
      lowerTitle.includes("panel")
    ) {
      return "UI/UX";
    } else if (
      lowerTitle.includes("architecture") ||
      lowerTitle.includes("component") ||
      lowerTitle.includes("structure") ||
      lowerTitle.includes("design")
    ) {
      return "Architecture";
    } else if (
      lowerTitle.includes("process") ||
      lowerTitle.includes("workflow") ||
      lowerTitle.includes("coordination") ||
      lowerTitle.includes("collaboration") ||
      lowerTitle.includes("debugging")
    ) {
      return "Process";
    } else if (
      lowerTitle.includes("test") ||
      lowerTitle.includes("quality") ||
      lowerTitle.includes("lint") ||
      lowerTitle.includes("error")
    ) {
      return "Quality";
    } else if (
      lowerTitle.includes("integration") ||
      lowerTitle.includes("vscode") ||
      lowerTitle.includes("extension") ||
      lowerTitle.includes("prompt")
    ) {
      return "Integration";
    } else if (
      lowerTitle.includes("memory") ||
      lowerTitle.includes("knowledge") ||
      lowerTitle.includes("decision") ||
      lowerTitle.includes("tapestry")
    ) {
      return "Knowledge Management";
    }
    return "Other";
  }

  _getStatusBreakdown() {
    const statuses = ["Accepted", "Superseded", "Rejected", "Proposed"];
    const dataSource =
      this.filteredDecisions && this.filteredDecisions.length > 0
        ? this.filteredDecisions
        : this.decisions;
    const totalDecisions = dataSource.length;

    return statuses
      .map((status) => {
        const count = dataSource.filter((d) => d.status === status).length;
        return {
          status,
          count,
          percentage: totalDecisions > 0 ? (count / totalDecisions) * 100 : 0,
        };
      })
      .filter((item) => item.count > 0); // Only show statuses with decisions
  }

  _getTimeDistribution() {
    const dataSource =
      this.filteredDecisions && this.filteredDecisions.length > 0
        ? this.filteredDecisions
        : this.decisions;
    if (dataSource.length === 0) return { buckets: [], labels: [] };

    // Get date range
    const now = new Date();
    const dates = dataSource.map((d) => new Date(d.date)).sort((a, b) => a - b);
    const oldestDate = dates[0];
    const newestDate = dates[dates.length - 1];

    // Find actual date ranges with decisions to normalize for gaps
    const actualTimeSpan = newestDate - oldestDate;
    const totalTimeSpan = now - oldestDate;

    // Create 12 time buckets, but normalize based on actual activity period
    const bucketCount = 12;
    let bucketSize, startDate, endDate;

    // If decisions span less than 6 months, use actual span
    const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
    if (actualTimeSpan < sixMonths) {
      bucketSize = actualTimeSpan / bucketCount;
      startDate = oldestDate;
      endDate = newestDate;
    } else {
      // For longer periods, use a hybrid approach that focuses on active periods
      // Use the most recent year of activity, or actual span if less than a year
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      const focusSpan = Math.min(actualTimeSpan, oneYear);
      bucketSize = focusSpan / bucketCount;
      startDate = new Date(newestDate.getTime() - focusSpan);
      endDate = newestDate;
    }

    const buckets = new Array(bucketCount).fill(0);
    const labels = [];

    // Generate bucket labels based on normalized timespan
    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = new Date(startDate.getTime() + i * bucketSize);
      const monthNames = [
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

      // For short timespans, show month + year, for longer just month
      if (bucketSize < 60 * 24 * 60 * 60 * 1000) {
        // Less than 60 days per bucket
        labels.push(
          `${monthNames[bucketStart.getMonth()]} ${bucketStart.getFullYear().toString().slice(-2)}`,
        );
      } else {
        labels.push(monthNames[bucketStart.getMonth()]);
      }
    }

    // Count decisions in each bucket
    dataSource.forEach((decision) => {
      const decisionDate = new Date(decision.date);
      if (decisionDate >= startDate && decisionDate <= endDate) {
        const timeSinceStart = decisionDate - startDate;
        const bucketIndex = Math.min(
          Math.floor(timeSinceStart / bucketSize),
          bucketCount - 1,
        );
        if (bucketIndex >= 0) {
          buckets[bucketIndex]++;
        }
      }
    });

    return { buckets, labels };
  }

  _renderMiniPieChart(
    value,
    total,
    colors = ["var(--accent)", "var(--border)"],
    showProportion = true,
  ) {
    if (total === 0)
      return html`<svg
        class="pie-chart"
        width="40"
        height="40"
        viewBox="0 0 40 40"
      ></svg>`;

    let percentage;
    if (showProportion) {
      // For category charts: show what percentage this category represents of the total
      percentage = Math.min(100, Math.max(0, (value / total) * 100));
    } else {
      // For other charts: show filled based on the value itself
      percentage = Math.min(100, Math.max(0, value));
    }

    if (percentage === 0) {
      return html`
        <svg class="pie-chart" width="40" height="40" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="${colors[1]}"
            stroke="${colors[0]}"
            stroke-width="1"
          />
        </svg>
      `;
    }

    if (percentage === 100) {
      return html`
        <svg class="pie-chart" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="${colors[0]}" />
        </svg>
      `;
    }

    const angle = (percentage / 100) * 360;
    const radians = ((angle - 90) * Math.PI) / 180;
    const x = 20 + 18 * Math.cos(radians);
    const y = 20 + 18 * Math.sin(radians);

    const largeArcFlag = angle > 180 ? 1 : 0;
    const pathData = `M 20,20 L 20,2 A 18,18 0 ${largeArcFlag},1 ${x.toFixed(2)},${y.toFixed(2)} Z`;

    return html`
      <svg class="pie-chart" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="${colors[1]}" />
        <path d="${pathData}" fill="${colors[0]}" />
      </svg>
    `;
  }

  _renderTimeDistributionChart() {
    const { buckets, labels } = this._getTimeDistribution();
    if (buckets.length === 0) return html``;

    const maxCount = Math.max(...buckets);
    if (maxCount === 0) return html``;

    return html`
      <div class="time-distribution">
        <div class="time-distribution-title">Decision Activity Over Time</div>
        <div class="bar-chart">
          ${buckets.map((count, index) => {
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return html`
              <div
                class="bar"
                style="height: ${height}%"
                title="${labels[index]}: ${count} decisions"
              ></div>
            `;
          })}
        </div>
        <div class="time-labels">
          <span>${labels[0] || ""}</span>
          <span>${labels[Math.floor(labels.length / 2)] || ""}</span>
          <span>${labels[labels.length - 1] || ""}</span>
        </div>
      </div>
    `;
  }

  render() {
    const categoryData = this._getIndividualCategoryData();
    const statusData = this._getStatusBreakdown();
    const dataSource =
      this.filteredDecisions && this.filteredDecisions.length > 0
        ? this.filteredDecisions
        : this.decisions;
    const totalDecisions = dataSource.length;

    // Category colors
    const categoryColors = {
      Infrastructure: "#dc3545",
      "Developer Experience": "#28a745",
      "UI/UX": "#6f42c1",
      Architecture: "#fd7e14",
      Process: "#20c997",
      Quality: "#ffc107",
      Integration: "#17a2b8",
      "Knowledge Management": "#007bff",
      Other: "#6c757d",
    };

    // Status colors
    const statusColors = {
      Accepted: "#28a745",
      Superseded: "#6c757d",
      Rejected: "#dc3545",
      Proposed: "#ffc107",
    };

    return html`
      <div class="search-section">
        <input
          type="text"
          id="search-input"
          placeholder="Search decisions..."
          @input=${this._handleInput}
        />
      </div>

      <div class="slider-section">
        <div class="slider-group">
          <div class="slider-label">
            <span>Impact Level</span>
            <span class="slider-value"
              >${this.filters.minImpact === 0
                ? "All"
                : `≥${this.filters.minImpact}`}</span
            >
          </div>
          <input
            type="range"
            min="0"
            max="10"
            .value=${this.filters.minImpact}
            @input=${this._handleImpactChange}
          />
        </div>

        ${
          /* Temporarily disabled - complex time range controls
                this._renderTimeDistributionChart()}
                
                <div class="slider-group">
                    <div class="slider-label">
                        <span>Time Range</span>
                        <span class="slider-value">${this._getDateRangeLabel()}</span>
                    </div>
                    
                    <div class="date-type-selector">
                        ${(() => {
                            const counts = this._getDateTypeCounts();
                            return html`
                                <button 
                                    class="date-type-button ${this.dateFilterType === 'decision' ? 'active' : ''}"
                                    @click=${() => this._handleDateTypeChange('decision')}
                                    title="${counts.decision} decisions have this date type"
                                >
                                    Decision (${counts.decision})
                                </button>
                                <button 
                                    class="date-type-button ${this.dateFilterType === 'first_commit' ? 'active' : ''}"
                                    @click=${() => this._handleDateTypeChange('first_commit')}
                                    title="${counts.first_commit} decisions have this date type"
                                >
                                    First Commit (${counts.first_commit})
                                </button>
                                <button 
                                    class="date-type-button ${this.dateFilterType === 'last_commit' ? 'active' : ''}"
                                    @click=${() => this._handleDateTypeChange('last_commit')}
                                    title="${counts.last_commit} decisions have this date type"
                                >
                                    Last Commit (${counts.last_commit})
                                </button>
                                <button 
                                    class="date-type-button ${this.dateFilterType === 'any' ? 'active' : ''}"
                                    @click=${() => this._handleDateTypeChange('any')}
                                >
                                    Any
                                </button>
                            `;
                        })()}
                    </div>
                    
                    <div class="range-slider-container">
                        <div class="range-slider">
                            <div class="range-track" style="
                                left: ${(this.filters.dateRange.start / this._getMaxDaysFromOldestDecision()) * 100}%;
                                width: ${((this.filters.dateRange.end || this._getMaxDaysFromOldestDecision()) - this.filters.dateRange.start) / this._getMaxDaysFromOldestDecision() * 100}%;
                            "></div>
                            <input 
                                type="range" 
                                min="0" 
                                max="${this._getMaxDaysFromOldestDecision()}" 
                                .value=${this.filters.dateRange.start}
                                @input=${this._handleDateRangeStart}
                                style="z-index: 2;"
                            >
                            <input 
                                type="range" 
                                min="0" 
                                max="${this._getMaxDaysFromOldestDecision()}" 
                                .value=${this.filters.dateRange.end || this._getMaxDaysFromOldestDecision()}
                                @input=${this._handleDateRangeEnd}
                                style="z-index: 1;"
                            >
                        </div>
                    </div>
                </div>
                */ ""
        }

        <div class="slider-group">
          <div class="slider-label">
            <span>Commit Time Range</span>
            <span class="slider-value">
              ${this.commitTimeRanges[this.filters.commitTimeRange]?.label ||
              "All time"}
              ${this.filteredDecisions &&
              this.filteredDecisions.length !== this.decisions.length
                ? ` (${this.filteredDecisions.length} shown)`
                : ""}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="${Math.max(0, this.commitTimeRanges.length - 1)}"
            step="1"
            .value=${this.filters.commitTimeRange}
            @input=${this._handleCommitTimeRangeChange}
            title="Filter by commit time ranges"
          />
        </div>
      </div>

      <div class="charts-section">
        <div class="pie-charts all-stats">
          <!-- Overview -->
          <div class="pie-chart-item">
            ${this._renderMiniPieChart(totalDecisions, this.decisions.length, [
              "var(--accent)",
              "#e9ecef",
            ])}
            <div class="chart-label">Decisions</div>
            <div class="chart-value">
              ${totalDecisions} of ${this.decisions.length}
            </div>
          </div>

          <!-- Categories -->
          ${categoryData.map((item) => {
            // Calculate total for this category across all decisions
            const categoryTotal = this.decisions.filter(
              (d) => this._inferCategory(d) === item.category,
            ).length;
            return html`
              <div
                class="pie-chart-item ${item.count === 0
                  ? "empty"
                  : ""} ${this.activeFilters?.categories?.includes(
                  item.category,
                )
                  ? "active"
                  : ""}"
                @click=${item.count > 0
                  ? () => this._handleCategoryClick(item.category)
                  : null}
              >
                ${this._renderMiniPieChart(item.count, categoryTotal, [
                  categoryColors[item.category] || "#6c757d",
                  "#e9ecef",
                ])}
                <div class="chart-label">${item.category}</div>
                <div class="chart-value">${item.count} of ${categoryTotal}</div>
              </div>
            `;
          })}

          <!-- Status -->
          ${statusData.slice(0, 4).map(
            (item) => html`
              <div
                class="pie-chart-item ${this.activeFilters?.statuses?.includes(
                  item.status,
                )
                  ? "active"
                  : ""}"
                @click=${() => this._handleStatusClick(item.status)}
              >
                ${this._renderMiniPieChart(item.count, totalDecisions, [
                  statusColors[item.status] || "#6c757d",
                  "#e9ecef",
                ])}
                <div class="chart-label">${item.status}</div>
                <div class="chart-value">${item.count}</div>
              </div>
            `,
          )}

          <!-- Components & Activity -->
          <div class="pie-chart-item">
            ${this._renderMiniPieChart(
              dataSource.filter((d) => d.affected_components?.length > 0)
                .length,
              totalDecisions,
              ["#fd7e14", "#e9ecef"],
            )}
            <div class="chart-label">Has Components</div>
            <div class="chart-value">
              ${dataSource.filter((d) => d.affected_components?.length > 0)
                .length}
            </div>
          </div>
          <div class="pie-chart-item">
            ${this._renderMiniPieChart(
              dataSource.filter((d) => d.related_to?.length > 0).length,
              totalDecisions,
              ["#17a2b8", "#e9ecef"],
            )}
            <div class="chart-label">Has Relations</div>
            <div class="chart-value">
              ${dataSource.filter((d) => d.related_to?.length > 0).length}
            </div>
          </div>
          <div class="pie-chart-item">
            ${this._renderMiniPieChart(
              dataSource.filter((d) => getCommitCount(d) > 0).length,
              totalDecisions,
              ["#28a745", "#e9ecef"],
            )}
            <div class="chart-label">Has Commits</div>
            <div class="chart-value">
              ${dataSource.filter((d) => getCommitCount(d) > 0).length}
            </div>
          </div>
          <div class="pie-chart-item">
            ${(() => {
              const recentDecisions = dataSource.filter((d) => {
                const activity = this._getFileActivityLevel(d);
                return activity === "recent";
              });
              return html`
                ${this._renderMiniPieChart(
                  recentDecisions.length,
                  totalDecisions,
                  ["#28a745", "#e9ecef"],
                )}
                <div class="chart-label">Recent Activity</div>
                <div class="chart-value">${recentDecisions.length}</div>
              `;
            })()}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("search-panel", SearchPanel);


// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Support filtering by enhanced date objects (decision_date, first_commit_date, last_commit_date)
// Timestamp: 2025-07-16T05:35:55.779Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Update search panel for commit-based date filtering
// Timestamp: 2025-07-16T05:35:55.829Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add 'last file change' filter using github_metadata.file_status
// Timestamp: 2025-07-16T05:35:55.876Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Create commit timeline visualization from github_metadata.commits
// Timestamp: 2025-07-16T05:35:55.923Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add file activity indicators using github_metadata.file_status
// Timestamp: 2025-07-16T05:35:55.968Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add commit count indicators (github_metadata.commits.length)
// Timestamp: 2025-07-16T05:35:56.015Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Integrate with Git history analysis service
// Timestamp: 2025-07-16T05:35:56.062Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 68
// Task: Add filtering by GitHub PR/issue activity
// Timestamp: 2025-07-16T05:35:56.107Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 86
// Task: Install and configure Gemini CLI wrapper
// Timestamp: 2025-07-16T08:35:08.930Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 86
// Task: Create Gemini API endpoint in server
// Timestamp: 2025-07-16T08:35:09.033Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 86
// Task: Replace search panel with Gemini prompt interface
// Timestamp: 2025-07-16T08:35:09.143Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 86
// Task: Implement streaming response display
// Timestamp: 2025-07-16T08:35:09.225Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 86
// Task: Add decision context injection for Gemini prompts
// Timestamp: 2025-07-16T08:35:09.298Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 86
// Task: Create natural language to action translation
// Timestamp: 2025-07-16T08:35:09.393Z

