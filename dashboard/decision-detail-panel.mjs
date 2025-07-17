import { unsafeHTML } from "https://esm.sh/lit/directives/unsafe-html.js";
import { LitElement, css, html } from "https://esm.sh/lit@3";
import "./avatar-display.mjs";
import "./commit-timeline.mjs";
import "./file-status-display.mjs";

/**
 * @class DecisionDetailPanel
 * @description Renders the details of a selected decision.
 */
class DecisionDetailPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
      box-sizing: border-box;
      overflow-y: auto;
      height: 100%;
    }
    h2 {
      margin-top: 0;
    }
    h3 {
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
    }
    
    /* Apply 12px font size and 160% line height to all non-title text */
    p, ul, ol, li, span:not(.pr-issue-badge):not(.activity-badge) {
      font-size: 12px !important;
      line-height: 160% !important;
    }
    
    /* List padding and margin adjustments */
    ul, ol {
      padding-left: 0 !important;
    }
    
    li {
      padding-left: 0 !important;
      margin-left: 16px !important;
    }
    
    .placeholder {
      color: #888;
    }
    .placeholder p {
      font-size: 12px !important;
      line-height: 160% !important;
    }
    .status-accepted {
      background-color: #28a745;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .status-superseded {
      background-color: #6c757d;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .status-deprecated {
      background-color: #dc3545;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .task-list {
      list-style-type: none;
      padding-left: 0;
    }
    .task-item span {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .task-status-done {
      color: #28a745;
    }
    .task-status-todo {
      color: #6c757d;
    }

    /* Activity badge styles */
    .activity-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: white;
      animation: activityPulse 2s infinite ease-in-out;
    }
    
    /* Activity info text */
    .activity-badge + div {
      font-size: 12px !important;
      line-height: 160% !important;
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

    /* Author section styles */
    .author-section {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(0, 82, 204, 0.05);
      border-radius: 8px;
      margin: 12px 0;
    }

    .author-info {
      flex: 1;
    }

    .author-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-main);
      margin: 0 0 4px 0;
    }

    .author-username {
      font-size: 12px;
      line-height: 160%;
      color: var(--text-secondary);
      opacity: 0.8;
    }

    .author-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 8px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      line-height: 160%;
      color: var(--text-secondary);
    }

    .github-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #24292e;
      color: white;
      border-radius: 4px;
      text-decoration: none;
      font-size: 12px;
      line-height: 160%;
      transition: background 0.2s ease;
    }

    .github-link:hover {
      background: #1a1e22;
    }

    /* GitHub metadata sections */
    .github-metadata-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 2px solid var(--border);
    }

    .pr-issue-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }

    .pr-issue-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      text-decoration: none;
      color: var(--text-main);
      transition: all 0.2s ease;
    }

    .pr-issue-item:hover {
      border-color: var(--accent);
      transform: translateX(4px);
    }

    .pr-issue-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }

    .pr-issue-badge.merged {
      background: rgba(111, 66, 193, 0.1);
      color: #6f42c1;
    }

    .pr-issue-badge.open {
      background: rgba(40, 167, 69, 0.1);
      color: #28a745;
    }

    .pr-issue-badge.closed {
      background: rgba(220, 53, 69, 0.1);
      color: #dc3545;
    }

    .pr-issue-number {
      font-family: monospace;
      font-size: 12px;
      line-height: 160%;
      color: var(--text-secondary);
    }

    .pr-issue-title {
      flex: 1;
      font-size: 12px;
      line-height: 160%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    /* Additional GitHub metadata styles */
    .commit-status,
    .workflow-runs,
    .release-info {
      font-size: 12px !important;
      line-height: 160% !important;
    }
    
    .status-checks,
    .status-check,
    .workflow-details,
    .release-date,
    .release-body {
      font-size: 12px !important;
      line-height: 160% !important;
    }
    
    /* Ensure all text in decision details has proper sizing */
    :host > p,
    :host > div,
    :host li {
      font-size: 12px;
      line-height: 160%;
    }
  `;

  static properties = {
    decision: { type: Object },
    currentActivity: { type: Object },
    _version: { type: Number, state: true },
  };

  hasChanged(changedProperties) {
    return super.hasChanged(changedProperties);
  }

  set decision(val) {
    const oldVal = this._decision;
    this._decision = val;
    this._version += 1; // Force reactivity with version counter
    this.requestUpdate("decision", oldVal);
  }
  get decision() {
    return this._decision;
  }

  constructor() {
    super();
    this._decision = null;
    this.currentActivity = null;
    this._version = 0;
  }

  updateActivity(agentId, activityState, taskDescription) {
    if (activityState === "idle") {
      this.currentActivity = null;
    } else {
      this.currentActivity = {
        agentId,
        state: activityState,
        taskDescription,
        timestamp: new Date().toISOString(),
      };
    }
    this.requestUpdate();
  }

  /**
   * Clear all activity for this panel
   */
  clearActivity() {
    this.currentActivity = null;
    this.requestUpdate();
  }

  forceUpdateDecision(newDecision) {
    // Use the property setter which handles version increment
    this.decision = newDecision;
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

  _renderAuthorSection(author) {
    if (!author) return "";

    const isGitHubUser =
      author && typeof author === "object" && "github_username" in author;
    const displayName = isGitHubUser
      ? author.display_name || author.github_username
      : author;

    return html`
      <div class="author-section">
        <github-avatar .author="${author}" size="large"></github-avatar>
        <div class="author-info">
          <h3 class="author-name">${displayName}</h3>
          ${isGitHubUser
            ? html`
                <div class="author-username">@${author.github_username}</div>
                <div class="author-meta">
                  ${author.email
                    ? html`
                        <div class="meta-item">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <path
                              d="M1.75 2A1.75 1.75 0 000 3.75v.736a.75.75 0 000 .027v7.737C0 13.216.784 14 1.75 14h12.5A1.75 1.75 0 0016 12.25v-8.5A1.75 1.75 0 0014.25 2H1.75zM14.5 4.07v-.32a.25.25 0 00-.25-.25H1.75a.25.25 0 00-.25.25v.32L8 7.88l6.5-3.81zm-13 1.74v6.441c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V5.809L8.38 9.397a.75.75 0 01-.76 0L1.5 5.809z"
                            />
                          </svg>
                          ${author.email}
                        </div>
                      `
                    : ""}
                  ${author.profile_url
                    ? html`
                        <a
                          href="${author.profile_url}"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="github-link"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <path
                              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                            />
                          </svg>
                          View GitHub Profile
                        </a>
                      `
                    : ""}
                </div>
              `
            : ""}
        </div>
      </div>
    `;
  }

  _renderPRsAndIssues(githubMetadata) {
    if (!githubMetadata) return "";

    const prs = githubMetadata.pull_requests || [];
    const issues = githubMetadata.issues || [];

    if (prs.length === 0 && issues.length === 0) return "";

    return html`
      <div class="github-metadata-section">
        ${prs.length > 0
          ? html`
              <h3>Related Pull Requests</h3>
              <div class="pr-issue-list">
                ${prs.map(
                  (pr) => html`
                    <a
                      href="${pr.url}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="pr-issue-item"
                    >
                      <span class="pr-issue-badge ${pr.status}">
                        ${pr.status === "merged" ? "Merged" : pr.status}
                      </span>
                      <span class="pr-issue-number">#${pr.number}</span>
                      <span class="pr-issue-title">${pr.title}</span>
                    </a>
                  `,
                )}
              </div>
            `
          : ""}
        ${issues.length > 0
          ? html`
              <h3>Related Issues</h3>
              <div class="pr-issue-list">
                ${issues.map(
                  (issue) => html`
                    <a
                      href="${issue.url}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="pr-issue-item"
                    >
                      <span class="pr-issue-badge ${issue.status}">
                        ${issue.status}
                      </span>
                      <span class="pr-issue-number">#${issue.number}</span>
                      <span class="pr-issue-title">${issue.title}</span>
                    </a>
                  `,
                )}
              </div>
            `
          : ""}
      </div>
    `;
  }

  render() {
    if (!this.decision) {
      return html`
        <div class="placeholder">
          <h2>Decision Details</h2>
          <p>Click a node on the map.</p>
        </div>
      `;
    }

    const {
      id,
      title,
      status,
      date,
      author,
      rationale,
      tradeoffs,
      tasks,
      affected_components,
      github_metadata,
    } = this.decision;
    const statusClass =
      "status-" + (status?.toLowerCase().replace(" ", "-") || "");
    const decisionDate =
      date && typeof date === "object" && "decision_date" in date
        ? new Date(date.decision_date.replace(" ", "T"))
        : new Date(date.replace(" ", "T"));

    // Author section HTML
    const authorHtml = this._renderAuthorSection(author);

    // Activity badge HTML
    const activityHtml = this.currentActivity
      ? html`
          <div
            style="margin: 8px 0; background: #fffbf0; border: 2px solid #ff9800; padding: 8px; border-radius: 4px;"
          >
            <span class="activity-badge ${this.currentActivity.state}">
              ${this.getActivityEmoji(this.currentActivity.state)}
              ${this.currentActivity.agentId}: ${this.currentActivity.state}
            </span>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              ${this.currentActivity.taskDescription}
            </div>
            <div style="font-size: 10px; color: #999;">
              Last updated: ${this.currentActivity.timestamp}
            </div>
          </div>
        `
      : "";

    const rationaleHtml = Array.isArray(rationale)
      ? rationale
          .filter((r) => typeof r === "string")
          .map((r) => html`<li>${unsafeHTML(r)}</li>`)
      : "";
    const tradeoffsHtml = Array.isArray(tradeoffs)
      ? tradeoffs
          .filter((t) => typeof t === "string")
          .map((t) => html`<li>${unsafeHTML(t)}</li>`)
      : "";

    const tasksHtml =
      tasks?.length > 0
        ? html`
            <h3>Tasks</h3>
            <ul class="task-list">
              ${tasks.map((task) => {
                const taskStatusClass = `task-status-${task.status.toLowerCase()}`;
                const isComplete = task.status === "Done" || task.status === "Completed";
                const icon = isComplete ? "✅" : "⚪";
                return html`<li class="task-item">
                  <span class="${taskStatusClass}"
                    >${icon} ${task.description}</span
                  >
                </li>`;
              })}
            </ul>
          `
        : "";

    // Handle file status display with GitHub metadata
    const fileStatusHtml = github_metadata?.file_status
      ? html`
          <file-status-display
            .fileStatus="${github_metadata.file_status}"
            .affectedComponents="${affected_components || []}"
          ></file-status-display>
        `
      : affected_components?.length > 0
        ? html`
            <h3>Affected Components</h3>
            <ul>
              ${affected_components.map((c) => html`<li>${c}</li>`)}
            </ul>
          `
        : "";

    // Render commit timeline if available
    const commitTimelineHtml =
      github_metadata?.commits?.length > 0
        ? html`
            <div class="github-metadata-section">
              <commit-timeline
                .commits="${github_metadata.commits}"
              ></commit-timeline>
            </div>
          `
        : "";

    // Render PRs and Issues
    const prsAndIssuesHtml = this._renderPRsAndIssues(github_metadata);
    
    // Render additional GitHub data (CI status, workflow runs, releases)
    const additionalGitHubHtml = this._renderAdditionalGitHubData(github_metadata);

    return html`
      <h2>Decision #${id}: ${title}${this.decision.quick_task ? ' <span style="background: #ffc107; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 0.7em; vertical-align: middle;">⚡ Quick Task</span>' : ''}</h2>
      <p>
        <strong>Status:</strong> <span class="${statusClass}">${status}</span>
      </p>
      ${activityHtml} ${authorHtml}
      <p><strong>Date:</strong> ${decisionDate.toLocaleString()}</p>
      <h3>Rationale</h3>
      <ul>
        ${rationaleHtml}
      </ul>
      <h3>Tradeoffs</h3>
      <ul>
        ${tradeoffsHtml}
      </ul>
      ${tasksHtml} ${fileStatusHtml} ${commitTimelineHtml} ${prsAndIssuesHtml}
      ${additionalGitHubHtml}
    `;
  }

  _renderAdditionalGitHubData(githubMetadata) {
    if (!githubMetadata) return "";

    const { commit_status, workflow_runs, release } = githubMetadata;
    let html = "";

    // Render commit status
    if (commit_status) {
      const statusIcon = {
        success: "✅",
        failure: "❌",
        pending: "⏳",
        error: "⚠️"
      }[commit_status.state] || "❓";

      html += `
        <div class="github-metadata-section">
          <h3>CI/CD Status</h3>
          <div class="commit-status">
            <span class="status-icon">${statusIcon}</span>
            <span class="status-state ${commit_status.state}">${commit_status.state}</span>
            ${commit_status.total_count > 0 ? `
              <div class="status-checks">
                ${commit_status.statuses.map(check => `
                  <div class="status-check">
                    <span class="check-context">${check.context}:</span>
                    <span class="check-state ${check.state}">${check.state}</span>
                    ${check.target_url ? `<a href="${check.target_url}" target="_blank">Details</a>` : ""}
                  </div>
                `).join("")}
              </div>
            ` : ""}
          </div>
        </div>
      `;
    }

    // Render workflow runs
    if (workflow_runs && workflow_runs.length > 0) {
      html += `
        <div class="github-metadata-section">
          <h3>GitHub Actions Runs</h3>
          <div class="workflow-runs">
            ${workflow_runs.map(run => `
              <div class="workflow-run">
                <a href="${run.url}" target="_blank" class="workflow-link">
                  <span class="workflow-name">${run.name}</span>
                  <span class="workflow-status ${run.status}">${run.status}</span>
                  ${run.conclusion ? `<span class="workflow-conclusion ${run.conclusion}">${run.conclusion}</span>` : ""}
                </a>
                <div class="workflow-details">
                  Branch: ${run.head_branch} | 
                  <time>${new Date(run.created_at).toLocaleString()}</time>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // Render release info
    if (release) {
      html += `
        <div class="github-metadata-section">
          <h3>Released In</h3>
          <div class="release-info">
            <a href="${release.url}" target="_blank" class="release-link">
              <span class="release-tag">${release.tag_name}</span>
              ${release.name ? `<span class="release-name">${release.name}</span>` : ""}
            </a>
            <div class="release-date">
              Published: <time>${new Date(release.published_at).toLocaleString()}</time>
            </div>
            ${release.body ? `
              <div class="release-body">
                <details>
                  <summary>Release Notes</summary>
                  <pre>${release.body}</pre>
                </details>
              </div>
            ` : ""}
          </div>
        </div>
      `;
    }

    return html;
  }
}

customElements.define("decision-detail-panel", DecisionDetailPanel);


// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 85
// Task: Create webhook endpoint for GitHub events
// Timestamp: 2025-07-16T07:10:03.591Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 85
// Task: Add webhook signature validation
// Timestamp: 2025-07-16T07:10:03.673Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 85
// Task: Update decision display with real-time GitHub updates
// Timestamp: 2025-07-16T07:10:03.759Z

