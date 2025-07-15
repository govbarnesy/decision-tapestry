import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * @class PathwayExplorer
 * @description A component that shows decision pathways and evolution chains
 * @fires pathway-click - Dispatched when a pathway is selected
 */
class PathwayExplorer extends LitElement {
    static styles = css`
        :host {
            display: block;
            padding: 1rem;
            background: var(--panel-bg);
            border-radius: var(--panel-radius);
            box-shadow: var(--panel-shadow);
        }
        
        .pathway-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--border);
        }
        
        .pathway-controls {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }
        
        .pathway-filter {
            padding: 0.25rem 0.5rem;
            border: 1px solid var(--border);
            border-radius: 3px;
            background: var(--panel-bg);
            color: var(--text-main);
            font-size: 0.8rem;
        }
        
        .pathway-list {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .pathway-item {
            margin-bottom: 1rem;
            padding: 0.75rem;
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--panel-bg);
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .pathway-item:hover {
            border-color: var(--accent);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .pathway-header-text {
            font-weight: 600;
            color: var(--text-main);
            margin-bottom: 0.5rem;
        }
        
        .pathway-chain {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .pathway-decision {
            padding: 0.25rem 0.5rem;
            border-radius: 3px;
            font-size: 0.8rem;
            font-weight: 500;
            color: white;
            background: var(--accent);
            cursor: pointer;
        }
        
        .pathway-decision.superseded {
            background: var(--status-superseded);
            text-decoration: line-through;
        }
        
        .pathway-arrow {
            color: var(--text-secondary);
            font-size: 0.8rem;
        }
        
        .pathway-summary {
            font-size: 0.8rem;
            color: var(--text-secondary);
            line-height: 1.4;
        }
        
        .pathway-metrics {
            display: flex;
            gap: 1rem;
            margin-top: 0.5rem;
            font-size: 0.7rem;
            color: var(--text-secondary);
        }
        
        .pathway-metric {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }
        
        .pathway-metric-icon {
            font-size: 0.8rem;
        }
        
        .no-pathways {
            text-align: center;
            color: var(--text-secondary);
            padding: 2rem;
            font-style: italic;
        }
        
        .pathway-type-evolution {
            border-left: 4px solid #e74c3c;
        }
        
        .pathway-type-related {
            border-left: 4px solid #3498db;
        }
        
        .pathway-type-architectural {
            border-left: 4px solid #2ecc71;
        }
    `;

    static properties = {
        decisions: { type: Array },
        selectedDecisionId: { type: Number },
        pathwayType: { type: String }
    };

    constructor() {
        super();
        this.decisions = [];
        this.selectedDecisionId = null;
        this.pathwayType = 'all'; // 'all', 'evolution', 'related', 'architectural'
    }

    render() {
        const pathways = this._generatePathways();
        
        return html`
            <div class="pathway-header">
                <h3 style="margin: 0; color: var(--text-main);">Decision Pathways</h3>
                <div class="pathway-controls">
                    <select 
                        class="pathway-filter" 
                        .value=${this.pathwayType}
                        @change=${this._handleFilterChange}
                    >
                        <option value="all">All Pathways</option>
                        <option value="evolution">Evolution Chains</option>
                        <option value="related">Related Clusters</option>
                        <option value="architectural">Architecture Impact</option>
                    </select>
                </div>
            </div>
            
            <div class="pathway-list">
                ${pathways.length > 0 
                    ? pathways.map(pathway => this._renderPathway(pathway))
                    : html`<div class="no-pathways">No decision pathways found</div>`
                }
            </div>
        `;
    }

    _generatePathways() {
        if (!this.decisions || this.decisions.length === 0) return [];
        
        const pathways = [];
        
        // Generate evolution pathways (supersedes chains)
        if (this.pathwayType === 'all' || this.pathwayType === 'evolution') {
            pathways.push(...this._generateEvolutionPathways());
        }
        
        // Generate related decision clusters
        if (this.pathwayType === 'all' || this.pathwayType === 'related') {
            pathways.push(...this._generateRelatedPathways());
        }
        
        // Generate architectural impact pathways
        if (this.pathwayType === 'all' || this.pathwayType === 'architectural') {
            pathways.push(...this._generateArchitecturalPathways());
        }
        
        return pathways.sort((a, b) => b.score - a.score);
    }

    _generateEvolutionPathways() {
        const pathways = [];
        const visited = new Set();
        
        this.decisions.forEach(decision => {
            if (visited.has(decision.id)) return;
            
            const chain = this._buildSupersessionChain(decision);
            if (chain.length > 1) {
                const pathway = {
                    id: `evolution-${chain[0].id}`,
                    type: 'evolution',
                    title: `Decision Evolution: ${chain[chain.length - 1].title}`,
                    decisions: chain,
                    score: chain.length * 10 + (chain.filter(d => d.status === 'Done').length * 5),
                    summary: `Evolution of ${chain.length} decisions over ${this._getTimeSpan(chain)}`
                };
                pathways.push(pathway);
                chain.forEach(d => visited.add(d.id));
            }
        });
        
        return pathways;
    }

    _generateRelatedPathways() {
        const pathways = [];
        const clusters = new Map();
        
        // Group decisions by related_to relationships
        this.decisions.forEach(decision => {
            if (decision.related_to && decision.related_to.length > 0) {
                decision.related_to.forEach(relatedId => {
                    const key = [decision.id, relatedId].sort().join('-');
                    if (!clusters.has(key)) {
                        clusters.set(key, []);
                    }
                    clusters.get(key).push(decision);
                });
            }
        });
        
        // Convert clusters to pathways
        clusters.forEach((decisions, key) => {
            if (decisions.length > 0) {
                const relatedDecisions = decisions.concat(
                    decisions.flatMap(d => 
                        d.related_to ? 
                        d.related_to.map(id => this.decisions.find(dec => dec.id === id)).filter(Boolean) : 
                        []
                    )
                );
                
                // Remove duplicates
                const unique = relatedDecisions.filter((d, i, arr) => 
                    arr.findIndex(item => item.id === d.id) === i
                );
                
                if (unique.length > 1) {
                    pathways.push({
                        id: `related-${key}`,
                        type: 'related',
                        title: `Related Decisions: ${unique[0].title}`,
                        decisions: unique.sort((a, b) => new Date(a.date) - new Date(b.date)),
                        score: unique.length * 8,
                        summary: `${unique.length} related decisions sharing common concerns`
                    });
                }
            }
        });
        
        return pathways;
    }

    _generateArchitecturalPathways() {
        const pathways = [];
        const componentMap = new Map();
        
        // Group decisions by affected components
        this.decisions.forEach(decision => {
            if (decision.affected_components) {
                decision.affected_components.forEach(component => {
                    if (!componentMap.has(component)) {
                        componentMap.set(component, []);
                    }
                    componentMap.get(component).push(decision);
                });
            }
        });
        
        // Create pathways for components with multiple affecting decisions
        componentMap.forEach((decisions, component) => {
            if (decisions.length > 1) {
                pathways.push({
                    id: `arch-${component}`,
                    type: 'architectural',
                    title: `Architecture Impact: ${component.split('/').pop()}`,
                    decisions: decisions.sort((a, b) => new Date(a.date) - new Date(b.date)),
                    score: decisions.length * 6,
                    summary: `${decisions.length} decisions affecting ${component}`
                });
            }
        });
        
        return pathways;
    }

    _buildSupersessionChain(startDecision) {
        const chain = [];
        let current = startDecision;
        
        // Walk backwards to find the root
        while (current && current.supersedes) {
            const parent = this.decisions.find(d => d.id === current.supersedes);
            if (parent && !chain.find(d => d.id === parent.id)) {
                chain.unshift(parent);
                current = parent;
            } else {
                break;
            }
        }
        
        // Add the current decision
        if (!chain.find(d => d.id === startDecision.id)) {
            chain.push(startDecision);
        }
        
        // Walk forwards to find superseding decisions
        current = startDecision;
        while (current) {
            const child = this.decisions.find(d => d.supersedes === current.id);
            if (child && !chain.find(d => d.id === child.id)) {
                chain.push(child);
                current = child;
            } else {
                break;
            }
        }
        
        return chain;
    }

    _getTimeSpan(decisions) {
        if (decisions.length < 2) return 'single decision';
        
        const dates = decisions.map(d => new Date(d.date)).sort((a, b) => a - b);
        const daysDiff = Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) return 'same day';
        if (daysDiff === 1) return '1 day';
        if (daysDiff < 7) return `${daysDiff} days`;
        if (daysDiff < 30) return `${Math.ceil(daysDiff / 7)} weeks`;
        return `${Math.ceil(daysDiff / 30)} months`;
    }

    _renderPathway(pathway) {
        return html`
            <div 
                class="pathway-item pathway-type-${pathway.type}"
                @click=${() => this._selectPathway(pathway)}
            >
                <div class="pathway-header-text">${pathway.title}</div>
                <div class="pathway-chain">
                    ${pathway.decisions.map((decision, index) => html`
                        ${index > 0 ? html`<span class="pathway-arrow">→</span>` : ''}
                        <span 
                            class="pathway-decision ${decision.status === 'Superseded' ? 'superseded' : ''}"
                            @click=${(e) => this._selectDecision(e, decision.id)}
                        >
                            #${decision.id}
                        </span>
                    `)}
                </div>
                <div class="pathway-summary">${pathway.summary}</div>
                <div class="pathway-metrics">
                    <div class="pathway-metric">
                        <span class="pathway-metric-icon">📊</span>
                        <span>Score: ${pathway.score}</span>
                    </div>
                    <div class="pathway-metric">
                        <span class="pathway-metric-icon">🔗</span>
                        <span>${pathway.decisions.length} decisions</span>
                    </div>
                    <div class="pathway-metric">
                        <span class="pathway-metric-icon">⏱️</span>
                        <span>${this._getTimeSpan(pathway.decisions)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    _handleFilterChange(e) {
        this.pathwayType = e.target.value;
    }

    _selectPathway(pathway) {
        this.dispatchEvent(new CustomEvent('pathway-click', {
            detail: { pathway },
            bubbles: true,
            composed: true
        }));
    }

    _selectDecision(e, decisionId) {
        e.stopPropagation(); // Prevent pathway selection
        this.dispatchEvent(new CustomEvent('decision-select', {
            detail: { decisionId },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('pathway-explorer', PathwayExplorer);