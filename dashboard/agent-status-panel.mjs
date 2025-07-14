import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * @class AgentStatusPanel
 * @description A LitElement component that displays all active agents and their current activities
 * @fires agent-click - Dispatched when an agent card is clicked
 */
class AgentStatusPanel extends LitElement {
    static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            padding: 1rem;
            box-sizing: border-box;
            overflow-y: auto;
        }
        
        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
        }
        
        h3 {
            margin: 0;
            color: var(--text-main);
            font-size: 1.2rem;
        }
        
        .active-count {
            background: var(--accent);
            color: white;
            padding: 0.2rem 0.6rem;
            border-radius: 12px;
            font-size: 0.9rem;
            font-weight: bold;
        }
        
        .agents-grid {
            display: grid;
            gap: 1rem;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        }
        
        .agent-card {
            background: var(--panel-bg);
            border: 2px solid var(--border);
            border-radius: 8px;
            padding: 1rem;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        
        .agent-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .agent-card.active {
            border-color: var(--state-color, var(--accent));
            box-shadow: 0 0 20px var(--state-color-alpha, rgba(0, 82, 204, 0.2));
        }
        
        .agent-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: var(--state-color, transparent);
            transition: height 0.3s ease;
        }
        
        .agent-card.active::before {
            height: 100%;
            opacity: 0.1;
        }
        
        .agent-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .agent-icon {
            font-size: 1.5rem;
        }
        
        .agent-name {
            font-weight: bold;
            color: var(--text-main);
            flex: 1;
        }
        
        .state-badge {
            background: var(--state-color, #757575);
            color: white;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            text-transform: uppercase;
            font-weight: bold;
            animation: fadeIn 0.3s ease;
        }
        
        .activity-details {
            margin-top: 0.5rem;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        
        .decision-link {
            color: var(--accent);
            text-decoration: none;
            font-weight: 500;
        }
        
        .decision-link:hover {
            text-decoration: underline;
        }
        
        .task-description {
            margin-top: 0.25rem;
            font-style: italic;
            opacity: 0.8;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .timestamp {
            margin-top: 0.5rem;
            font-size: 0.8rem;
            opacity: 0.6;
        }
        
        .no-agents {
            text-align: center;
            padding: 2rem;
            color: var(--text-secondary);
            opacity: 0.6;
        }
        
        /* Activity state colors */
        .agent-card[data-state="working"] {
            --state-color: #4CAF50;
            --state-color-alpha: rgba(76, 175, 80, 0.2);
        }
        
        .agent-card[data-state="debugging"] {
            --state-color: #FF9800;
            --state-color-alpha: rgba(255, 152, 0, 0.2);
        }
        
        .agent-card[data-state="testing"] {
            --state-color: #2196F3;
            --state-color-alpha: rgba(33, 150, 243, 0.2);
        }
        
        .agent-card[data-state="reviewing"] {
            --state-color: #9C27B0;
            --state-color-alpha: rgba(156, 39, 176, 0.2);
        }
        
        .agent-card[data-state="idle"] {
            --state-color: #757575;
            --state-color-alpha: rgba(117, 117, 117, 0.2);
            opacity: 0.7;
        }
        
        /* Pulse animation for active agents */
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
        
        .agent-card.active:not([data-state="idle"]) {
            animation: pulse 2s infinite;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    
    static properties = {
        agents: { type: Object }  // Map of agentId -> activity info
    };
    
    constructor() {
        super();
        this.agents = new Map();
    }
    
    render() {
        const activeAgents = Array.from(this.agents.entries())
            .filter(([_, activity]) => activity.state !== 'idle');
        
        return html`
            <div class="panel-header">
                <h3>Agent Activity Monitor</h3>
                <span class="active-count">${activeAgents.length} Active</span>
            </div>
            
            ${this.agents.size === 0 ? html`
                <div class="no-agents">
                    <p>No agents currently active</p>
                    <p>Agents will appear here when they start working</p>
                </div>
            ` : html`
                <div class="agents-grid">
                    ${Array.from(this.agents.entries()).map(([agentId, activity]) => this.renderAgentCard(agentId, activity))}
                </div>
            `}
        `;
    }
    
    renderAgentCard(agentId, activity) {
        const isActive = activity.state !== 'idle';
        const stateEmoji = this.getStateEmoji(activity.state);
        const timeSince = this.getTimeSince(activity.timestamp);
        
        return html`
            <div class="agent-card ${isActive ? 'active' : ''}" 
                 data-state="${activity.state}"
                 @click="${() => this.handleAgentClick(agentId, activity)}">
                <div class="agent-header">
                    <span class="agent-icon">🤖</span>
                    <span class="agent-name">${agentId}</span>
                    <span class="state-badge">${stateEmoji} ${activity.state}</span>
                </div>
                
                <div class="activity-details">
                    ${activity.decisionId ? html`
                        <div>
                            Working on: 
                            <a href="#" class="decision-link" 
                               @click="${(e) => this.handleDecisionClick(e, activity.decisionId)}">
                                Decision #${activity.decisionId}
                            </a>
                        </div>
                    ` : ''}
                    
                    ${activity.taskDescription ? html`
                        <div class="task-description" title="${activity.taskDescription}">
                            ${activity.taskDescription}
                        </div>
                    ` : ''}
                    
                    <div class="timestamp">
                        ${isActive ? `Active for ${timeSince}` : `Idle since ${timeSince}`}
                    </div>
                </div>
            </div>
        `;
    }
    
    getStateEmoji(state) {
        const emojis = {
            'working': '🔨',
            'debugging': '🐛',
            'testing': '🧪',
            'reviewing': '👀',
            'idle': '💤'
        };
        return emojis[state] || '❓';
    }
    
    getTimeSince(timestamp) {
        if (!timestamp) return 'unknown';
        
        const now = new Date();
        const then = new Date(timestamp);
        const seconds = Math.floor((now - then) / 1000);
        
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    }
    
    updateAgentActivity(agentId, activity) {
        // Update or add agent activity
        this.agents.set(agentId, {
            ...activity,
            timestamp: new Date().toISOString()
        });
        
        // Trigger re-render
        this.requestUpdate();
    }
    
    handleAgentClick(agentId, activity) {
        this.dispatchEvent(new CustomEvent('agent-click', {
            detail: { agentId, activity },
            bubbles: true,
            composed: true
        }));
    }
    
    handleDecisionClick(event, decisionId) {
        event.preventDefault();
        event.stopPropagation();
        
        // Dispatch event to focus on decision
        this.dispatchEvent(new CustomEvent('decision-focus', {
            detail: { decisionId },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('agent-status-panel', AgentStatusPanel);