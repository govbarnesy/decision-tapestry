import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * A component to display a scrollable log of all decisions.
 * @element decision-log-panel
 * @fires log-item-click - Dispatched when a decision in the log is clicked.
 */
class DecisionLogPanel extends LitElement {
    static styles = css`
        :host {
            display: block;
            overflow-y: auto;
            height: 100%;
        }
        .log-item {
            padding: 0.75rem;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .log-item:hover {
            background-color: #f8f9fa;
        }
        .log-item.selected-log-item {
            background-color: #e9ecef;
            border-left: 3px solid #0052cc;
        }
        .log-item h4 {
            margin: 0 0 0.25rem;
            font-size: 1em;
        }
        .log-item p {
            margin: 0;
            font-size: 0.85em;
            color: #6c757d;
        }
        .status-accepted { color: #28a745; font-weight: bold; }
        .status-superseded { color: #6c757d; font-weight: bold; }
        .status-deprecated { color: #dc3545; font-weight: bold; }
    `;

    static properties = {
        decisions: { type: Array },
        selectedId: { type: Number },
    };

    constructor() {
        super();
        this.decisions = [];
        this.selectedId = null;
    }

    _handleItemClick(decisionId) {
        this.dispatchEvent(new CustomEvent('log-item-click', {
            detail: { decisionId },
            bubbles: true,
            composed: true,
        }));
    }

    updated(changedProps) {
        super.updated && super.updated(changedProps);
        if (changedProps.has('selectedId')) {
            // Wait for render, then scroll selected item into view
            this.updateComplete.then(() => {
                const selected = this.renderRoot.querySelector('.selected-log-item');
                if (selected) {
                    selected.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
    }

    render() {
        const sortedDecisions = [...this.decisions].sort((a, b) => new Date(b.date) - new Date(a.date));

        return html`
            ${sortedDecisions.map(decision => {
            const decisionDate = new Date(decision.date.replace(' ', 'T'));
            const formattedDate = decisionDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const statusClass = `status-${decision.status.toLowerCase().replace(' ', '-')}`;
            const isSelected = this.selectedId === decision.id;

            return html`
                    <div
                        class="log-item ${isSelected ? 'selected-log-item' : ''}"
                        data-decision-id=${decision.id}
                        @click=${() => this._handleItemClick(decision.id)}
                    >
                        <h4>Decision #${decision.id}: ${decision.title}</h4>
                        <p>${formattedDate} | Status: <span class=${statusClass}>${decision.status}</span></p>
                    </div>
                `;
        })}
        `;
    }
}

customElements.define('decision-log-panel', DecisionLogPanel); 