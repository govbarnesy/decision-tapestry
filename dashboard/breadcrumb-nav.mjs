import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * @class BreadcrumbNav
 * @description A navigation component that tracks the user's exploration path through decisions
 * @fires breadcrumb-navigate - Dispatched when a breadcrumb is clicked
 */
class BreadcrumbNav extends LitElement {
    static styles = css`
        :host {
            display: block;
            padding: 0.5rem 1rem;
            background: var(--panel-bg);
            border-bottom: 1px solid var(--border);
        }
        
        .breadcrumb-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            overflow-x: auto;
            padding: 0.25rem 0;
        }
        
        .breadcrumb-item {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            border-radius: 3px;
            font-size: 0.8rem;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
            flex-shrink: 0;
        }
        
        .breadcrumb-item:hover {
            background: var(--tab-active-bg);
            color: var(--text-main);
        }
        
        .breadcrumb-item.current {
            background: var(--accent);
            color: white;
            font-weight: 500;
        }
        
        .breadcrumb-separator {
            color: var(--text-secondary);
            font-size: 0.7rem;
            flex-shrink: 0;
        }
        
        .breadcrumb-home {
            color: var(--accent);
            font-weight: 500;
        }
        
        .breadcrumb-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-left: auto;
            flex-shrink: 0;
        }
        
        .breadcrumb-action {
            padding: 0.25rem;
            border: 1px solid var(--border);
            border-radius: 3px;
            background: var(--panel-bg);
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 0.7rem;
            transition: all 0.2s ease;
        }
        
        .breadcrumb-action:hover {
            border-color: var(--accent);
            color: var(--accent);
        }
        
        .breadcrumb-action:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .breadcrumb-path-info {
            font-size: 0.7rem;
            color: var(--text-secondary);
            margin-left: 0.5rem;
        }
        
        .exploration-stats {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-left: 1rem;
            padding-left: 1rem;
            border-left: 1px solid var(--border);
            font-size: 0.7rem;
            color: var(--text-secondary);
        }
        
        .exploration-stat {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }
    `;

    static properties = {
        decisions: { type: Array },
        currentPath: { type: Array },
        currentDecisionId: { type: Number },
        explorationMode: { type: String }
    };

    constructor() {
        super();
        this.decisions = [];
        this.currentPath = [{ type: 'home', label: 'Dashboard', id: null }];
        this.currentDecisionId = null;
        this.explorationMode = 'browse'; // 'browse', 'pathway', 'cluster'
        this._pathHistory = []; // For back/forward navigation
        this._historyIndex = -1;
    }

    render() {
        const pathStats = this._calculatePathStats();
        
        return html`
            <div class="breadcrumb-container">
                ${this.currentPath.map((item, index) => html`
                    ${index > 0 ? html`<span class="breadcrumb-separator">›</span>` : ''}
                    <div 
                        class="breadcrumb-item ${index === this.currentPath.length - 1 ? 'current' : ''} ${item.type === 'home' ? 'breadcrumb-home' : ''}"
                        @click=${() => this._navigateTo(item, index)}
                        title="${item.description || item.label}"
                    >
                        ${this._getItemIcon(item.type)}
                        <span>${item.label}</span>
                    </div>
                `)}
                
                <div class="breadcrumb-actions">
                    <button 
                        class="breadcrumb-action"
                        @click=${this._goBack}
                        ?disabled=${this._historyIndex <= 0}
                        title="Go back"
                    >
                        ⬅
                    </button>
                    <button 
                        class="breadcrumb-action"
                        @click=${this._goForward}
                        ?disabled=${this._historyIndex >= this._pathHistory.length - 1}
                        title="Go forward"
                    >
                        ➡
                    </button>
                    <button 
                        class="breadcrumb-action"
                        @click=${this._clearPath}
                        ?disabled=${this.currentPath.length <= 1}
                        title="Clear exploration path"
                    >
                        🏠
                    </button>
                </div>
                
                <div class="exploration-stats">
                    <div class="exploration-stat">
                        <span>📍</span>
                        <span>${pathStats.depth} deep</span>
                    </div>
                    <div class="exploration-stat">
                        <span>🔍</span>
                        <span>${pathStats.explored} explored</span>
                    </div>
                    <div class="exploration-stat">
                        <span>⭐</span>
                        <span>${pathStats.score} score</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Public method to add a new item to the path
    addToPath(item) {
        // Avoid duplicate consecutive items
        const lastItem = this.currentPath[this.currentPath.length - 1];
        if (lastItem && lastItem.id === item.id && lastItem.type === item.type) {
            return;
        }
        
        // Save current state to history
        this._saveToHistory();
        
        // Add new item to path
        this.currentPath = [...this.currentPath, item];
        this.requestUpdate();
    }

    // Public method to navigate to a decision
    navigateToDecision(decisionId, context = {}) {
        const decision = this.decisions.find(d => d.id === decisionId);
        if (!decision) return;
        
        const item = {
            type: 'decision',
            id: decisionId,
            label: `#${decisionId}: ${this._truncateTitle(decision.title)}`,
            description: decision.title,
            context
        };
        
        this.currentDecisionId = decisionId;
        this.addToPath(item);
    }

    // Public method to navigate to a pathway
    navigateToPathway(pathway) {
        const item = {
            type: 'pathway',
            id: pathway.id,
            label: pathway.title,
            description: pathway.summary,
            context: { pathway }
        };
        
        this.explorationMode = 'pathway';
        this.addToPath(item);
    }

    // Public method to navigate to a cluster
    navigateToCluster(category, decisions) {
        const item = {
            type: 'cluster',
            id: category,
            label: `${category} (${decisions.length})`,
            description: `Cluster of ${decisions.length} decisions in ${category} category`,
            context: { category, decisions }
        };
        
        this.explorationMode = 'cluster';
        this.addToPath(item);
    }

    // Public method to navigate to architecture view
    navigateToArchitecture(component = null) {
        const item = {
            type: 'architecture',
            id: component || 'overview',
            label: component ? `Architecture: ${component.split('/').pop()}` : 'Architecture Overview',
            description: component ? `Component: ${component}` : 'System architecture view',
            context: { component }
        };
        
        this.explorationMode = 'architecture';
        this.addToPath(item);
    }

    _getItemIcon(type) {
        const icons = {
            'home': '🏠',
            'decision': '💡',
            'pathway': '🛤️',
            'cluster': '📦',
            'architecture': '🏗️',
            'search': '🔍'
        };
        return icons[type] || '📄';
    }

    _truncateTitle(title, maxLength = 25) {
        if (title.length <= maxLength) return title;
        return title.substring(0, maxLength - 3) + '...';
    }

    _navigateTo(item, index) {
        // Truncate path to clicked item
        this.currentPath = this.currentPath.slice(0, index + 1);
        
        // Update current state
        if (item.type === 'decision') {
            this.currentDecisionId = item.id;
        } else if (item.type === 'home') {
            this.currentDecisionId = null;
            this.explorationMode = 'browse';
        }
        
        // Dispatch navigation event
        this.dispatchEvent(new CustomEvent('breadcrumb-navigate', {
            detail: { item, index },
            bubbles: true,
            composed: true
        }));
        
        this.requestUpdate();
    }

    _goBack() {
        if (this._historyIndex > 0) {
            this._historyIndex--;
            this._restoreFromHistory();
        }
    }

    _goForward() {
        if (this._historyIndex < this._pathHistory.length - 1) {
            this._historyIndex++;
            this._restoreFromHistory();
        }
    }

    _clearPath() {
        this.currentPath = [{ type: 'home', label: 'Dashboard', id: null }];
        this.currentDecisionId = null;
        this.explorationMode = 'browse';
        
        this.dispatchEvent(new CustomEvent('breadcrumb-navigate', {
            detail: { item: this.currentPath[0], index: 0 },
            bubbles: true,
            composed: true
        }));
        
        this.requestUpdate();
    }

    _saveToHistory() {
        // Remove any forward history when adding new path
        this._pathHistory = this._pathHistory.slice(0, this._historyIndex + 1);
        
        // Save current state
        this._pathHistory.push({
            path: [...this.currentPath],
            decisionId: this.currentDecisionId,
            mode: this.explorationMode
        });
        
        this._historyIndex = this._pathHistory.length - 1;
        
        // Limit history size
        if (this._pathHistory.length > 50) {
            this._pathHistory = this._pathHistory.slice(-50);
            this._historyIndex = this._pathHistory.length - 1;
        }
    }

    _restoreFromHistory() {
        const state = this._pathHistory[this._historyIndex];
        if (state) {
            this.currentPath = [...state.path];
            this.currentDecisionId = state.decisionId;
            this.explorationMode = state.mode;
            
            const lastItem = this.currentPath[this.currentPath.length - 1];
            this.dispatchEvent(new CustomEvent('breadcrumb-navigate', {
                detail: { item: lastItem, index: this.currentPath.length - 1, fromHistory: true },
                bubbles: true,
                composed: true
            }));
            
            this.requestUpdate();
        }
    }

    _calculatePathStats() {
        const depth = this.currentPath.length - 1; // Exclude home
        const explored = new Set(
            this.currentPath
                .filter(item => item.type === 'decision')
                .map(item => item.id)
        ).size;
        
        // Calculate exploration score based on diversity of path
        const types = new Set(this.currentPath.map(item => item.type));
        const score = depth * 10 + explored * 5 + types.size * 15;
        
        return { depth, explored, score };
    }
}

customElements.define('breadcrumb-nav', BreadcrumbNav);