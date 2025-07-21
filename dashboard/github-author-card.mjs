import { LitElement, css, html } from "https://esm.sh/lit@3";
import "./avatar-display.mjs";

/**
 * Component to display detailed GitHub author information in a card format
 * @element github-author-card
 * @property {Object|String} author - Either a GitHub user object or string author name
 * @property {Array} decisions - Array of decisions by this author
 * @property {Boolean} expanded - Whether to show expanded details
 */
class GitHubAuthorCard extends LitElement {
  static properties = {
    author: { type: Object },
    decisions: { type: Array },
    expanded: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
    }

    .author-card {
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .author-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .author-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .author-info {
      flex: 1;
    }

    .author-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-main);
      margin: 0 0 4px 0;
    }

    .author-username {
      font-size: 14px;
      color: var(--text-secondary);
      opacity: 0.8;
    }

    .author-stats {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--accent);
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
      opacity: 0.8;
      text-transform: uppercase;
    }

    .author-meta {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .meta-icon {
      width: 16px;
      height: 16px;
      opacity: 0.6;
    }

    .recent-decisions {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .recent-decisions-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-main);
    }

    .decision-item {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .decision-id {
      background: var(--accent);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .github-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 8px 16px;
      background: var(--panel-bg);
      color: var(--text-primary);
      border-radius: 6px;
      text-decoration: none;
      font-size: 14px;
      transition: background 0.2s ease;
    }

    .github-link:hover {
      background: var(--hover-bg);
    }

    .github-icon {
      width: 16px;
      height: 16px;
    }

    .expand-icon {
      transition: transform 0.3s ease;
    }

    .author-card.expanded .expand-icon {
      transform: rotate(180deg);
    }

    .loading-skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 4px;
      height: 16px;
      margin-bottom: 8px;
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `;

  constructor() {
    super();
    this.decisions = [];
    this.expanded = false;
  }

  _isGitHubUser(author) {
    return author && typeof author === "object" && "github_username" in author;
  }

  _getDisplayName(author) {
    if (this._isGitHubUser(author)) {
      return author.display_name || author.github_username;
    }
    return author || "Unknown";
  }

  _toggleExpanded() {
    this.expanded = !this.expanded;
  }

  _renderGitHubMeta() {
    if (!this._isGitHubUser(this.author)) return "";

    return html`
      <div class="author-meta">
        ${this.author.email
          ? html`
              <div class="meta-item">
                <svg class="meta-icon" viewBox="0 0 16 16" fill="currentColor">
                  <path
                    d="M1.75 2A1.75 1.75 0 000 3.75v.736a.75.75 0 000 .027v7.737C0 13.216.784 14 1.75 14h12.5A1.75 1.75 0 0016 12.25v-8.5A1.75 1.75 0 0014.25 2H1.75zM14.5 4.07v-.32a.25.25 0 00-.25-.25H1.75a.25.25 0 00-.25.25v.32L8 7.88l6.5-3.81zm-13 1.74v6.441c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V5.809L8.38 9.397a.75.75 0 01-.76 0L1.5 5.809z"
                  />
                </svg>
                ${this.author.email}
              </div>
            `
          : ""}
        ${this.author.profile_url
          ? html`
              <a
                href="${this.author.profile_url}"
                target="_blank"
                rel="noopener noreferrer"
                class="github-link"
              >
                <svg
                  class="github-icon"
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
    `;
  }

  _renderRecentDecisions() {
    if (!this.expanded || this.decisions.length === 0) return "";

    const recentDecisions = this.decisions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return html`
      <div class="recent-decisions">
        <div class="recent-decisions-title">Recent Decisions</div>
        ${recentDecisions.map(
          (decision) => html`
            <div class="decision-item">
              <span class="decision-id">#${decision.id}</span>
              <span>${decision.title}</span>
            </div>
          `,
        )}
      </div>
    `;
  }

  render() {
    const displayName = this._getDisplayName(this.author);
    const isGitHubUser = this._isGitHubUser(this.author);
    const decisionCount = this.decisions.length;

    // Calculate additional stats for GitHub users
    const acceptedCount = this.decisions.filter(
      (d) => d.status === "Accepted",
    ).length;
    const recentCount = this.decisions.filter((d) => {
      const date = new Date(d.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date > thirtyDaysAgo;
    }).length;

    return html`
      <div
        class="author-card ${this.expanded ? "expanded" : ""}"
        @click="${this._toggleExpanded}"
      >
        <div class="author-header">
          <github-avatar .author="${this.author}" size="large"></github-avatar>
          <div class="author-info">
            <h3 class="author-name">${displayName}</h3>
            ${isGitHubUser && this.author.github_username
              ? html`
                  <div class="author-username">
                    @${this.author.github_username}
                  </div>
                `
              : ""}
          </div>
          <svg
            class="expand-icon"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            />
          </svg>
        </div>

        <div class="author-stats">
          <div class="stat">
            <div class="stat-value">${decisionCount}</div>
            <div class="stat-label">Decisions</div>
          </div>
          <div class="stat">
            <div class="stat-value">${acceptedCount}</div>
            <div class="stat-label">Accepted</div>
          </div>
          <div class="stat">
            <div class="stat-value">${recentCount}</div>
            <div class="stat-label">Last 30d</div>
          </div>
        </div>

        ${this.expanded
          ? html` ${this._renderGitHubMeta()} ${this._renderRecentDecisions()} `
          : ""}
      </div>
    `;
  }
}

customElements.define("github-author-card", GitHubAuthorCard);

export { GitHubAuthorCard };
