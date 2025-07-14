import { unsafeHTML } from 'https://esm.sh/lit/directives/unsafe-html.js';
import { LitElement, css, html } from 'https://esm.sh/lit@3';

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
        .placeholder {
            color: #888;
        }
        .status-accepted { background-color: #28a745; color: white; padding: 2px 6px; border-radius: 4px; }
        .status-superseded { background-color: #6c757d; color: white; padding: 2px 6px; border-radius: 4px; }
        .status-deprecated { background-color: #dc3545; color: white; padding: 2px 6px; border-radius: 4px; }
        .task-list { list-style-type: none; padding-left: 0; }
        .task-item span { display: inline-flex; align-items: center; gap: 8px; }
        .task-status-done { color: #28a745; }
        .task-status-todo { color: #6c757d; }
        
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
        .activity-badge.working { background-color: #4CAF50; }
        .activity-badge.debugging { background-color: #FF9800; }
        .activity-badge.testing { background-color: #2196F3; }
        .activity-badge.reviewing { background-color: #9C27B0; }
        .activity-badge.idle { background-color: #757575; }
        
        @keyframes activityPulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
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
        this.requestUpdate('decision', oldVal);
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
        if (activityState === 'idle') {
            this.currentActivity = null;
        } else {
            this.currentActivity = {
                agentId,
                state: activityState,
                taskDescription,
                timestamp: new Date().toISOString()
            };
        }
        this.requestUpdate();
    }
    
    forceUpdateDecision(newDecision) {
        // Use the property setter which handles version increment
        this.decision = newDecision;
    }
    
    getActivityEmoji(state) {
        const emojis = {
            'working': '🔧',
            'debugging': '🐛', 
            'testing': '🧪',
            'reviewing': '👁️',
            'idle': '💤'
        };
        return emojis[state] || '⚙️';
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

        const { id, title, status, date, rationale, tradeoffs, tasks, affected_components } = this.decision;
        const statusClass = 'status-' + (status?.toLowerCase().replace(' ', '-') || '');
        
        // Activity badge HTML
        const activityHtml = this.currentActivity ? html`
            <div style="margin: 8px 0; background: #fffbf0; border: 2px solid #ff9800; padding: 8px; border-radius: 4px;">
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
        ` : '';

        const rationaleHtml = Array.isArray(rationale)
            ? rationale.filter(r => typeof r === 'string').map(r => html`<li>${unsafeHTML(r)}</li>`)
            : '';
        const tradeoffsHtml = Array.isArray(tradeoffs)
            ? tradeoffs.filter(t => typeof t === 'string').map(t => html`<li>${unsafeHTML(t)}</li>`)
            : '';

        const tasksHtml = tasks?.length > 0 ? html`
            <h3>Tasks</h3>
            <ul class="task-list">
                ${tasks.map(task => {
            const taskStatusClass = `task-status-${task.status.toLowerCase()}`;
            const icon = task.status === 'Done' ? '✅' : '⚪';
            return html`<li class="task-item"><span class="${taskStatusClass}">${icon} ${task.description}</span></li>`;
        })}
            </ul>
        ` : '';

        const affectedComponentsHtml = affected_components?.length > 0 ? html`
            <h3>Affected Components</h3>
            <ul>
                ${affected_components.map(c => html`<li>${c}</li>`)}
            </ul>
        ` : '';

        return html`
            <h2>Decision #${id}: ${title}</h2>
            <p><strong>Status:</strong> <span class="${statusClass}">${status}</span></p>
            ${activityHtml}
            <p><strong>Date:</strong> ${new Date(date.replace(' ', 'T')).toLocaleString()}</p>
            <h3>Rationale</h3>
            <ul>${rationaleHtml}</ul>
            <h3>Tradeoffs</h3>
            <ul>${tradeoffsHtml}</ul>
            ${tasksHtml}
            ${affectedComponentsHtml}
        `;
    }
}

customElements.define('decision-detail-panel', DecisionDetailPanel); 