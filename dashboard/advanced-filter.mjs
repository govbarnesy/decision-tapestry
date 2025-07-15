import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * @class AdvancedFilter
 * @description A comprehensive filtering system for decisions with mobile-first design
 * @fires filter-change - Dispatched when filters are updated
 */
class AdvancedFilter extends LitElement {
    static styles = css`
        :host {
            display: block;
            background: var(--panel-bg);
            border-radius: var(--panel-radius);
            box-shadow: var(--panel-shadow);
        }
        
        .filter-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid var(--border);
            background: var(--tab-bg);
            border-radius: var(--panel-radius) var(--panel-radius) 0 0;
        }
        
        .filter-title {
            font-weight: 600;
            color: var(--text-main);
            margin: 0;
        }
        
        .filter-toggle {
            padding: 0.25rem 0.5rem;
            border: 1px solid var(--border);
            border-radius: 3px;
            background: var(--panel-bg);
            color: var(--text-main);
            cursor: pointer;
            font-size: 0.8rem;
        }
        
        .filter-content {
            padding: 1rem;
            height: calc(100vh - 300px);
            overflow-y: auto;
        }
        
        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        
        .filter-group:last-child {
            margin-bottom: 0;
        }
        
        .filter-group-title {
            font-weight: 500;
            color: var(--text-main);
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
            padding-bottom: 0.25rem;
            border-bottom: 1px solid var(--border);
        }
        
        .filter-input {
            padding: 0.5rem;
            border: 1px solid var(--border);
            border-radius: 3px;
            background: var(--panel-bg);
            color: var(--text-main);
            font-size: 0.85rem;
            width: 100%;
            box-sizing: border-box;
        }
        
        .filter-select {
            padding: 0.5rem;
            border: 1px solid var(--border);
            border-radius: 3px;
            background: var(--panel-bg);
            color: var(--text-main);
            font-size: 0.85rem;
            width: 100%;
            box-sizing: border-box;
        }
        
        .filter-checkbox-group {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            max-height: 120px;
            overflow-y: auto;
        }
        
        .filter-checkbox {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .filter-checkbox:hover {
            background: var(--tab-active-bg);
        }
        
        .filter-checkbox input {
            margin: 0;
        }
        
        .filter-checkbox label {
            font-size: 0.8rem;
            color: var(--text-main);
            cursor: pointer;
            flex: 1;
        }
        
        .filter-date-range {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .filter-date-range input {
            width: 100%;
        }
        
        .filter-date-separator {
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.8rem;
            padding: 0.25rem 0;
        }
        
        .filter-actions {
            padding: 1rem;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
        }
        
        .filter-button {
            padding: 0.5rem 1rem;
            border: 1px solid var(--border);
            border-radius: 3px;
            background: var(--panel-bg);
            color: var(--text-main);
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s ease;
        }
        
        .filter-button:hover {
            border-color: var(--accent);
            color: var(--accent);
        }
        
        .filter-button.primary {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }
        
        .filter-button.primary:hover {
            background: var(--accent);
            opacity: 0.9;
        }
        
        .filter-tag {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            background: var(--accent);
            color: white;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 500;
        }
        
        .filter-tag-remove {
            cursor: pointer;
            font-weight: bold;
            padding: 0 0.25rem;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
        }
        
        .active-filters {
            padding: 0.5rem 1rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .filter-count {
            color: var(--text-secondary);
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .impact-slider {
            width: 100%;
            margin: 0.5rem 0;
        }
        
        .slider-labels {
            display: flex;
            justify-content: space-between;
            font-size: 0.7rem;
            color: var(--text-secondary);
            margin-top: 0.25rem;
        }
        
        .days-slider {
            width: 100%;
            margin: 0.5rem 0;
        }
        
        .toggle-button {
            padding: 0.5rem 1rem;
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--panel-bg);
            color: var(--text-main);
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s ease;
        }
        
        .toggle-button.active {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }
        
        .toggle-button:hover {
            border-color: var(--accent);
        }
        
        .filter-result-summary {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8rem;
            color: var(--text-main);
            margin-bottom: 0.5rem;
        }
        
        .mini-pie-chart {
            width: 40px;
            height: 40px;
        }
    `;

    static properties = {
        decisions: { type: Array },
        filters: { type: Object }
    };

    constructor() {
        super();
        this.decisions = [];
        this.filters = this._getDefaultFilters();
    }

    render() {
        const filteredCount = this._getFilteredDecisions().length;
        const activeFilterCount = this._getActiveFilterCount();
        
        return html`
            <div class="filter-header">
                <h3 class="filter-title">Advanced Filters</h3>
                ${activeFilterCount > 0 ? html`<span class="filter-count">(${activeFilterCount})</span>` : ''}
            </div>
            
            ${activeFilterCount > 0 ? html`
                <div class="active-filters">
                    ${this._renderActiveFilters()}
                </div>
            ` : ''}
            
            <div class="filter-content expanded">
                <!-- Date Range -->
                <div class="filter-group">
                    <div class="filter-group-title">Date Range</div>
                    <div>
                        <label>Custom Date Range:</label>
                        <div class="filter-date-range">
                            <input 
                                type="date" 
                                class="filter-input"
                                .value=${this.filters.dateFrom}
                                @change=${(e) => this._updateFilter('dateFrom', e.target.value)}
                            >
                            <span class="filter-date-separator">to</span>
                            <input 
                                type="date" 
                                class="filter-input"
                                .value=${this.filters.dateTo}
                                @change=${(e) => this._updateFilter('dateTo', e.target.value)}
                            >
                        </div>
                    </div>
                </div>
                
                <!-- Status -->
                <div class="filter-group">
                    <div class="filter-group-title">Status</div>
                    <div>
                        <div class="filter-checkbox-group">
                            ${this._getUniqueStatuses().map(status => html`
                                <div class="filter-checkbox">
                                    <input 
                                        type="checkbox" 
                                        id="status-${status}"
                                        .checked=${this.filters.statuses.includes(status)}
                                        @change=${() => this._toggleStatus(status)}
                                    >
                                    <label for="status-${status}">${status}</label>
                                </div>
                            `)}
                        </div>
                    </div>
                </div>
                
                <!-- Authors -->
                <div class="filter-group">
                    <div class="filter-group-title">Authors</div>
                    <div>
                        <div class="filter-checkbox-group">
                            ${this._getUniqueAuthors().map(author => html`
                                <div class="filter-checkbox">
                                    <input 
                                        type="checkbox" 
                                        id="author-${author}"
                                        .checked=${this.filters.authors.includes(author)}
                                        @change=${() => this._toggleAuthor(author)}
                                    >
                                    <label for="author-${author}">${author}</label>
                                </div>
                            `)}
                        </div>
                    </div>
                </div>
                
                <!-- Categories -->
                <div class="filter-group">
                    <div class="filter-group-title">Categories</div>
                    <div>
                        <div class="filter-checkbox-group">
                            ${this._getUniqueCategories().map(category => html`
                                <div class="filter-checkbox">
                                    <input 
                                        type="checkbox" 
                                        id="category-${category}"
                                        .checked=${this.filters.categories.includes(category)}
                                        @change=${() => this._toggleCategory(category)}
                                    >
                                    <label for="category-${category}">${category}</label>
                                </div>
                            `)}
                        </div>
                    </div>
                </div>
                
                <!-- Has Components Toggle -->
                <div class="filter-group">
                    <div class="filter-group-title">Has Components</div>
                    <div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button 
                                class="toggle-button ${this.filters.hasComponents === null ? 'active' : ''}"
                                @click=${() => this._updateFilter('hasComponents', null)}
                            >
                                All
                            </button>
                            <button 
                                class="toggle-button ${this.filters.hasComponents === true ? 'active' : ''}"
                                @click=${() => this._updateFilter('hasComponents', true)}
                            >
                                Yes
                            </button>
                            <button 
                                class="toggle-button ${this.filters.hasComponents === false ? 'active' : ''}"
                                @click=${() => this._updateFilter('hasComponents', false)}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Results Summary with Mini Pie Chart -->
                <div class="filter-actions">
                    <div class="filter-result-summary">
                        ${this._renderMiniPieChart(filteredCount, this.decisions.length)}
                        <span>${filteredCount} of ${this.decisions.length} Decisions</span>
                    </div>
                    <button 
                        class="filter-button"
                        @click=${this._clearFilters}
                    >
                        Clear
                    </button>
                </div>
            </div>
        `;
    }

    _renderMiniPieChart(filtered, total) {
        if (total === 0) return html`<div class="mini-pie-chart"></div>`;
        
        // Pie chart shows proportion of shown decisions (filtered / total)
        const percentage = Math.min(100, Math.max(0, (filtered / total) * 100));
        
        // Handle edge cases
        if (percentage === 0) {
            return html`
                <svg class="mini-pie-chart" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="var(--border)" stroke="var(--accent)" stroke-width="1" />
                </svg>
            `;
        }
        
        if (percentage === 100) {
            return html`
                <svg class="mini-pie-chart" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="var(--accent)" />
                </svg>
            `;
        }
        
        // Calculate the end point of the arc (starting from top, going clockwise)
        const angle = (percentage / 100) * 360;
        const radians = (angle - 90) * Math.PI / 180;
        const x = 20 + 18 * Math.cos(radians);
        const y = 20 + 18 * Math.sin(radians);
        
        // Large arc flag for angles > 180 degrees
        const largeArcFlag = angle > 180 ? 1 : 0;
        
        // Create path: Move to center, Line to top, Arc to end point, Close path
        const pathData = `M 20,20 L 20,2 A 18,18 0 ${largeArcFlag},1 ${x.toFixed(2)},${y.toFixed(2)} Z`;
        
        return html`
            <svg class="mini-pie-chart" width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="var(--border)" />
                <path d="${pathData}" fill="var(--accent)" />
            </svg>
        `;
    }

    _renderActiveFilters() {
        const tags = [];
        
        if (this.filters.statuses.length > 0) {
            tags.push(html`
                <span class="filter-tag">
                    Status: ${this.filters.statuses.join(', ')}
                    <span class="filter-tag-remove" @click=${() => this._removeFilter('statuses')}>×</span>
                </span>
            `);
        }
        
        if (this.filters.authors.length > 0) {
            tags.push(html`
                <span class="filter-tag">
                    Author: ${this.filters.authors.join(', ')}
                    <span class="filter-tag-remove" @click=${() => this._removeFilter('authors')}>×</span>
                </span>
            `);
        }
        
        if (this.filters.categories.length > 0) {
            tags.push(html`
                <span class="filter-tag">
                    Category: ${this.filters.categories.join(', ')}
                    <span class="filter-tag-remove" @click=${() => this._removeFilter('categories')}>×</span>
                </span>
            `);
        }
        
        if (this.filters.daysBack > 0) {
            tags.push(html`
                <span class="filter-tag">
                    Last ${this.filters.daysBack} days
                    <span class="filter-tag-remove" @click=${() => this._removeFilter('daysBack')}>×</span>
                </span>
            `);
        }
        
        if (this.filters.dateFrom || this.filters.dateTo) {
            const dateText = this.filters.dateFrom && this.filters.dateTo 
                ? `${this.filters.dateFrom} to ${this.filters.dateTo}`
                : this.filters.dateFrom 
                    ? `After ${this.filters.dateFrom}`
                    : `Before ${this.filters.dateTo}`;
            tags.push(html`
                <span class="filter-tag">
                    Date: ${dateText}
                    <span class="filter-tag-remove" @click=${() => this._removeFilter('date')}>×</span>
                </span>
            `);
        }
        
        if (this.filters.minImpact > 0) {
            tags.push(html`
                <span class="filter-tag">
                    Impact: ≥${this.filters.minImpact}
                    <span class="filter-tag-remove" @click=${() => this._removeFilter('minImpact')}>×</span>
                </span>
            `);
        }
        
        if (this.filters.hasComponents !== null) {
            tags.push(html`
                <span class="filter-tag">
                    Components: ${this.filters.hasComponents ? 'Yes' : 'No'}
                    <span class="filter-tag-remove" @click=${() => this._removeFilter('hasComponents')}>×</span>
                </span>
            `);
        }
        
        return tags;
    }

    _getDefaultFilters() {
        return {
            statuses: [],
            authors: [],
            categories: [],
            dateFrom: '',
            dateTo: '',
            daysBack: 0, // 0 = all time
            minImpact: 0,
            hasComponents: null, // null = all, true = yes, false = no
            searchTerm: ''
        };
    }

    _getUniqueStatuses() {
        return [...new Set(this.decisions.map(d => d.status))].filter(Boolean).sort();
    }

    _getUniqueAuthors() {
        return [...new Set(this.decisions.map(d => d.author))].filter(Boolean).sort();
    }

    _getUniqueCategories() {
        // Use inferred categories since the category field is not populated in decisions
        const categories = new Set();
        this.decisions.forEach(decision => {
            const category = this._inferCategory(decision);
            if (category) {
                categories.add(category);
            }
        });
        return Array.from(categories).sort();
    }
    
    _inferCategory(decision) {
        const title = decision.title || '';
        const lowerTitle = title.toLowerCase();
        
        if (lowerTitle.includes('cli') || lowerTitle.includes('automation') || lowerTitle.includes('docker') || lowerTitle.includes('release')) {
            return 'Developer Experience';
        } else if (lowerTitle.includes('websocket') || lowerTitle.includes('server') || lowerTitle.includes('infrastructure') || lowerTitle.includes('api') || lowerTitle.includes('redis') || lowerTitle.includes('session')) {
            return 'Infrastructure';
        } else if (lowerTitle.includes('dashboard') || lowerTitle.includes('ui') || lowerTitle.includes('theme') || lowerTitle.includes('visual') || lowerTitle.includes('layout') || lowerTitle.includes('panel')) {
            return 'UI/UX';
        } else if (lowerTitle.includes('architecture') || lowerTitle.includes('component') || lowerTitle.includes('structure') || lowerTitle.includes('design')) {
            return 'Architecture';
        } else if (lowerTitle.includes('process') || lowerTitle.includes('workflow') || lowerTitle.includes('coordination') || lowerTitle.includes('collaboration') || lowerTitle.includes('debugging')) {
            return 'Process';
        } else if (lowerTitle.includes('test') || lowerTitle.includes('quality') || lowerTitle.includes('lint') || lowerTitle.includes('error')) {
            return 'Quality';
        } else if (lowerTitle.includes('integration') || lowerTitle.includes('vscode') || lowerTitle.includes('extension') || lowerTitle.includes('prompt')) {
            return 'Integration';
        } else if (lowerTitle.includes('memory') || lowerTitle.includes('knowledge') || lowerTitle.includes('decision') || lowerTitle.includes('tapestry')) {
            return 'Knowledge Management';
        }
        return 'Other';
    }

    _getMaxDaysFromOldestDecision() {
        if (this.decisions.length === 0) return 365; // Default fallback
        
        const now = new Date();
        const oldestDate = this.decisions.reduce((oldest, decision) => {
            const decisionDate = new Date(decision.date);
            return decisionDate < oldest ? decisionDate : oldest;
        }, now);
        
        const diffTime = Math.abs(now - oldestDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(diffDays, 30); // Minimum of 30 days for usability
    }

    _toggleStatus(status) {
        if (this.filters.statuses.includes(status)) {
            this.filters.statuses = this.filters.statuses.filter(s => s !== status);
        } else {
            this.filters.statuses = [...this.filters.statuses, status];
        }
        this.requestUpdate();
        this._emitFilterChange();
    }

    _toggleAuthor(author) {
        if (this.filters.authors.includes(author)) {
            this.filters.authors = this.filters.authors.filter(a => a !== author);
        } else {
            this.filters.authors = [...this.filters.authors, author];
        }
        this.requestUpdate();
        this._emitFilterChange();
    }

    _toggleCategory(category) {
        if (this.filters.categories.includes(category)) {
            this.filters.categories = this.filters.categories.filter(c => c !== category);
        } else {
            this.filters.categories = [...this.filters.categories, category];
        }
        this.requestUpdate();
        this._emitFilterChange();
    }

    _updateFilter(key, value) {
        this.filters[key] = value;
        this.requestUpdate();
        this._emitFilterChange();
    }

    _removeFilter(type) {
        switch (type) {
            case 'statuses':
                this.filters.statuses = [];
                break;
            case 'authors':
                this.filters.authors = [];
                break;
            case 'categories':
                this.filters.categories = [];
                break;
            case 'date':
                this.filters.dateFrom = '';
                this.filters.dateTo = '';
                break;
            case 'daysBack':
                this.filters.daysBack = 0;
                break;
            case 'minImpact':
                this.filters.minImpact = 0;
                break;
            case 'hasComponents':
                this.filters.hasComponents = null;
                break;
        }
        this.requestUpdate();
        this._emitFilterChange();
    }

    _clearFilters() {
        this.filters = this._getDefaultFilters();
        this.requestUpdate();
        this._emitFilterChange();
    }


    _getFilteredDecisions() {
        return this.decisions.filter(decision => {
            // Status filter
            if (this.filters.statuses.length > 0 && !this.filters.statuses.includes(decision.status)) {
                return false;
            }
            
            // Author filter
            if (this.filters.authors.length > 0 && !this.filters.authors.includes(decision.author)) {
                return false;
            }
            
            // Category filter - use inferred category
            if (this.filters.categories.length > 0) {
                const inferredCategory = this._inferCategory(decision);
                if (!this.filters.categories.includes(inferredCategory)) {
                    return false;
                }
            }
            
            // Days back filter
            if (this.filters.daysBack > 0) {
                const decisionDate = new Date(decision.date);
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - this.filters.daysBack);
                if (decisionDate < cutoffDate) {
                    return false;
                }
            }
            
            // Date range filter
            if (this.filters.dateFrom) {
                const decisionDate = new Date(decision.date);
                const fromDate = new Date(this.filters.dateFrom);
                if (decisionDate < fromDate) {
                    return false;
                }
            }
            
            if (this.filters.dateTo) {
                const decisionDate = new Date(decision.date);
                const toDate = new Date(this.filters.dateTo);
                if (decisionDate > toDate) {
                    return false;
                }
            }
            
            // Impact filter (placeholder - would need actual impact scoring)
            if (this.filters.minImpact > 0) {
                const impactScore = this._calculateImpactScore(decision);
                if (impactScore < this.filters.minImpact) {
                    return false;
                }
            }
            
            // Has components filter
            if (this.filters.hasComponents !== null) {
                const hasComponents = decision.affected_components && decision.affected_components.length > 0;
                if (this.filters.hasComponents !== hasComponents) {
                    return false;
                }
            }
            
            return true;
        });
    }

    _calculateImpactScore(decision) {
        // Simple impact scoring based on available data
        let score = 0;
        
        if (decision.affected_components && decision.affected_components.length > 0) {
            score += decision.affected_components.length;
        }
        
        if (decision.related_to && decision.related_to.length > 0) {
            score += decision.related_to.length;
        }
        
        if (decision.supersedes) {
            score += 2;
        }
        
        return Math.min(score, 10); // Cap at 10
    }

    _getActiveFilterCount() {
        let count = 0;
        
        if (this.filters.statuses.length > 0) count++;
        if (this.filters.authors.length > 0) count++;
        if (this.filters.categories.length > 0) count++;
        if (this.filters.dateFrom || this.filters.dateTo) count++;
        if (this.filters.daysBack > 0) count++;
        if (this.filters.minImpact > 0) count++;
        if (this.filters.hasComponents !== null) count++;
        
        return count;
    }

    _emitFilterChange() {
        const filteredDecisions = this._getFilteredDecisions();
        this.dispatchEvent(new CustomEvent('filter-change', {
            detail: { filteredDecisions, filters: this.filters },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('advanced-filter', AdvancedFilter);