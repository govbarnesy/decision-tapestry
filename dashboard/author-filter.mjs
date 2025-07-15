import { LitElement, css, html } from 'https://esm.sh/lit@3';
import './avatar-display.mjs';

/**
 * Visual author filtering component with avatar-based selection
 * @element author-filter
 * @property {Array} authors - Array of unique authors (can be strings or GitHub user objects)
 * @property {Array} selectedAuthors - Currently selected authors for filtering
 * @fires author-filter-change - Dispatched when author selection changes
 */
class AuthorFilter extends LitElement {
    static properties = {
        authors: { type: Array },
        selectedAuthors: { type: Array }
    };

    static styles = css`
        :host {
            display: block;
        }

        .filter-container {
            padding: 16px;
        }

        .filter-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .filter-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-main);
        }

        .clear-button {
            background: none;
            border: 1px solid var(--border);
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .clear-button:hover {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }

        .author-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;
            max-height: 400px;
            overflow-y: auto;
            padding: 4px;
        }

        .author-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: var(--panel-bg);
            border: 2px solid var(--border);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }

        .author-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .author-item.selected {
            border-color: var(--accent);
            background: rgba(0, 82, 204, 0.05);
        }

        .author-item.selected::after {
            content: '✓';
            position: absolute;
            top: 4px;
            right: 8px;
            width: 20px;
            height: 20px;
            background: var(--accent);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        }

        .author-details {
            flex: 1;
            min-width: 0;
        }

        .author-name {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-main);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .author-username {
            font-size: 12px;
            color: var(--text-secondary);
            opacity: 0.8;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .decision-count {
            font-size: 12px;
            color: var(--text-secondary);
            opacity: 0.8;
        }

        .search-box {
            margin-bottom: 12px;
        }

        .search-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--border);
            border-radius: 4px;
            font-size: 14px;
            background: var(--panel-bg);
            color: var(--text-main);
            transition: border-color 0.2s ease;
        }

        .search-input:focus {
            outline: none;
            border-color: var(--accent);
        }

        .search-input::placeholder {
            color: var(--text-secondary);
            opacity: 0.6;
        }

        .selected-count {
            font-size: 12px;
            color: var(--accent);
            font-weight: 600;
        }

        .mobile-view {
            display: none;
        }

        @media (max-width: 768px) {
            .author-grid {
                display: none;
            }

            .mobile-view {
                display: block;
            }

            .author-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-height: 300px;
                overflow-y: auto;
            }

            .author-item {
                padding: 10px;
            }
        }

        /* Loading skeleton */
        .loading {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;
        }

        .skeleton-item {
            height: 64px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            border-radius: 8px;
        }

        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    `;

    constructor() {
        super();
        this.authors = [];
        this.selectedAuthors = [];
        this._searchTerm = '';
    }

    _isGitHubUser(author) {
        return author && typeof author === 'object' && 'github_username' in author;
    }

    _getDisplayName(author) {
        if (this._isGitHubUser(author)) {
            return author.display_name || author.github_username;
        }
        return author || 'Unknown';
    }

    _getAuthorKey(author) {
        if (this._isGitHubUser(author)) {
            return author.github_username;
        }
        return author;
    }

    _isSelected(author) {
        const key = this._getAuthorKey(author);
        return this.selectedAuthors.some(selected => 
            this._getAuthorKey(selected) === key
        );
    }

    _toggleAuthor(author) {
        const key = this._getAuthorKey(author);
        const isCurrentlySelected = this._isSelected(author);
        
        let newSelection;
        if (isCurrentlySelected) {
            newSelection = this.selectedAuthors.filter(selected => 
                this._getAuthorKey(selected) !== key
            );
        } else {
            newSelection = [...this.selectedAuthors, author];
        }

        this.selectedAuthors = newSelection;
        this._dispatchFilterChange();
    }

    _clearSelection() {
        this.selectedAuthors = [];
        this._dispatchFilterChange();
    }

    _dispatchFilterChange() {
        this.dispatchEvent(new CustomEvent('author-filter-change', {
            detail: { selectedAuthors: this.selectedAuthors },
            bubbles: true,
            composed: true
        }));
    }

    _handleSearch(e) {
        this._searchTerm = e.target.value.toLowerCase();
        this.requestUpdate();
    }

    _filterAuthors(authors) {
        if (!this._searchTerm) return authors;
        
        return authors.filter(author => {
            const displayName = this._getDisplayName(author).toLowerCase();
            const username = this._isGitHubUser(author) ? 
                (author.github_username || '').toLowerCase() : '';
            
            return displayName.includes(this._searchTerm) || 
                   username.includes(this._searchTerm);
        });
    }

    _renderAuthorItem(author, decisionCount) {
        const isGitHubUser = this._isGitHubUser(author);
        const displayName = this._getDisplayName(author);
        const isSelected = this._isSelected(author);

        return html`
            <div 
                class="author-item ${isSelected ? 'selected' : ''}"
                @click="${() => this._toggleAuthor(author)}"
            >
                <github-avatar 
                    .author="${author}" 
                    size="medium"
                ></github-avatar>
                <div class="author-details">
                    <div class="author-name" title="${displayName}">${displayName}</div>
                    ${isGitHubUser && author.github_username ? html`
                        <div class="author-username">@${author.github_username}</div>
                    ` : html`
                        <div class="decision-count">${decisionCount} decision${decisionCount !== 1 ? 's' : ''}</div>
                    `}
                </div>
            </div>
        `;
    }

    render() {
        const filteredAuthors = this._filterAuthors(this.authors);
        const selectedCount = this.selectedAuthors.length;

        // Group decision counts by author (would normally come from parent)
        const decisionCounts = new Map();
        filteredAuthors.forEach(author => {
            const key = this._getAuthorKey(author);
            decisionCounts.set(key, decisionCounts.get(key) || 0);
        });

        return html`
            <div class="filter-container">
                <div class="filter-header">
                    <div class="filter-title">
                        Filter by Author
                        ${selectedCount > 0 ? html`
                            <span class="selected-count">(${selectedCount} selected)</span>
                        ` : ''}
                    </div>
                    ${selectedCount > 0 ? html`
                        <button class="clear-button" @click="${this._clearSelection}">
                            Clear All
                        </button>
                    ` : ''}
                </div>

                <div class="search-box">
                    <input 
                        type="text" 
                        class="search-input"
                        placeholder="Search authors..."
                        @input="${this._handleSearch}"
                    />
                </div>

                <div class="author-grid">
                    ${filteredAuthors.map(author => 
                        this._renderAuthorItem(author, decisionCounts.get(this._getAuthorKey(author)) || 0)
                    )}
                </div>

                <!-- Mobile view -->
                <div class="mobile-view">
                    <div class="author-list">
                        ${filteredAuthors.map(author => 
                            this._renderAuthorItem(author, decisionCounts.get(this._getAuthorKey(author)) || 0)
                        )}
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('author-filter', AuthorFilter);

export { AuthorFilter };