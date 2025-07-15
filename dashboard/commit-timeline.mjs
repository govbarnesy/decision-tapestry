import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * Component to display a timeline of commits related to a decision
 * @element commit-timeline
 * @property {Array} commits - Array of commit objects from github_metadata
 */
class CommitTimeline extends LitElement {
    static properties = {
        commits: { type: Array }
    };

    static styles = css`
        :host {
            display: block;
        }

        .timeline-container {
            position: relative;
            padding-left: 30px;
        }

        .timeline-line {
            position: absolute;
            left: 8px;
            top: 24px;
            bottom: 0;
            width: 2px;
            background: var(--border);
        }

        .commit-item {
            position: relative;
            margin-bottom: 20px;
            padding-left: 16px;
        }

        .commit-item:last-child {
            margin-bottom: 0;
        }

        .commit-dot {
            position: absolute;
            left: -24px;
            top: 8px;
            width: 16px;
            height: 16px;
            background: var(--panel-bg);
            border: 2px solid var(--accent);
            border-radius: 50%;
        }

        .commit-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }

        .commit-sha {
            font-family: monospace;
            font-size: 12px;
            padding: 2px 6px;
            background: rgba(0, 82, 204, 0.1);
            border-radius: 4px;
            color: var(--accent);
            text-decoration: none;
            transition: background 0.2s ease;
        }

        .commit-sha:hover {
            background: rgba(0, 82, 204, 0.2);
        }

        .commit-date {
            font-size: 12px;
            color: var(--text-secondary);
        }

        .commit-author {
            font-size: 12px;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .commit-message {
            font-size: 14px;
            color: var(--text-main);
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .timeline-empty {
            padding: 20px;
            text-align: center;
            color: var(--text-secondary);
            font-style: italic;
        }

        .timeline-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }

        .timeline-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-main);
        }

        .commit-count {
            font-size: 12px;
            padding: 2px 8px;
            background: rgba(0, 82, 204, 0.1);
            border-radius: 12px;
            color: var(--accent);
            font-weight: 500;
        }

        /* Loading skeleton */
        .loading-skeleton {
            height: 60px;
            margin-bottom: 20px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            border-radius: 4px;
        }

        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        /* Responsive design */
        @media (max-width: 768px) {
            .commit-header {
                flex-wrap: wrap;
            }

            .commit-author {
                width: 100%;
                margin-top: 4px;
            }
        }
    `;

    constructor() {
        super();
        this.commits = [];
    }

    _formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    _truncateSha(sha) {
        return sha ? sha.substring(0, 7) : '';
    }

    _renderCommitItem(commit) {
        return html`
            <div class="commit-item">
                <div class="commit-dot"></div>
                <div class="commit-header">
                    <a href="${commit.url}" target="_blank" rel="noopener noreferrer" class="commit-sha">
                        ${this._truncateSha(commit.sha)}
                    </a>
                    <span class="commit-date">${this._formatDate(commit.date)}</span>
                    ${commit.author ? html`
                        <span class="commit-author">by ${commit.author}</span>
                    ` : ''}
                </div>
                <div class="commit-message">${commit.message}</div>
            </div>
        `;
    }

    render() {
        if (!this.commits || this.commits.length === 0) {
            return html`
                <div class="timeline-empty">
                    No commits associated with this decision yet.
                </div>
            `;
        }

        // Sort commits by date (newest first)
        const sortedCommits = [...this.commits].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        return html`
            <div class="timeline-header">
                <h3 class="timeline-title">Commit Timeline</h3>
                <span class="commit-count">${this.commits.length} commit${this.commits.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="timeline-container">
                <div class="timeline-line"></div>
                ${sortedCommits.map(commit => this._renderCommitItem(commit))}
            </div>
        `;
    }
}

customElements.define('commit-timeline', CommitTimeline);

export { CommitTimeline };