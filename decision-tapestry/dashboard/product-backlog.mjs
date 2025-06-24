import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * A component to display the product backlog.
 * @element product-backlog-panel
 * @fires promote-click - Dispatched when a user clicks the promote button.
 */
class ProductBacklogPanel extends LitElement {
    static styles = css`
        .backlog-item {
            padding: 1rem;
            border-bottom: 1px solid #eee;
        }
        .backlog-item h3 {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .promote-btn {
            padding: 0.3rem 0.8rem;
            font-size: 0.8em;
            cursor: pointer;
            border: 1px solid #0052cc;
            background-color: #0052cc;
            color: white;
            border-radius: 4px;
        }
        .promote-btn:disabled {
            background-color: #6c757d;
            border-color: #6c757d;
        }
        .backlog-item p {
            font-size: 0.9em;
        }
        ul {
            padding-left: 1.5rem;
            font-size: 0.9em;
        }
    `;

    static properties = {
        backlogItems: { type: Array },
    };

    constructor() {
        super();
        this.backlogItems = [];
    }

    _handlePromoteClick(itemId, button) {
        button.disabled = true;
        button.textContent = 'Promoting...';

        this.dispatchEvent(new CustomEvent('promote-click', {
            detail: { backlogId: itemId },
            bubbles: true,
            composed: true,
        }));
    }

    render() {
        if (!this.backlogItems || this.backlogItems.length === 0) {
            return html`<p>No items in the backlog.</p>`;
        }

        return html`
            ${this.backlogItems.map(item => {
            // Rationale as bullet list
            const rationaleHtml = item.rationale && item.rationale.length
                ? html`<div><strong>Rationale:</strong><ul>${item.rationale.map(r => html`<li>${r}</li>`)}</ul></div>`
                : '';
            // Tradeoffs as bullet list
            const tradeoffsHtml = item.tradeoffs && item.tradeoffs.length
                ? html`<div><strong>Tradeoffs:</strong><ul>${item.tradeoffs.map(t => html`<li>${t}</li>`)}</ul></div>`
                : '';
            // Tasks as checklist
            const tasksHtml = item.tasks && item.tasks.length
                ? html`<div><strong>Tasks:</strong><ul>${item.tasks.map(task => html`<li><input type="checkbox" disabled .checked=${task.status === 'Done'} /> ${task.description} <em>(${task.status})</em></li>`)}</ul></div>`
                : '';
            // Notes
            const notesHtml = item.notes
                ? html`<div><strong>Notes:</strong><div style="white-space: pre-line;">${item.notes}</div></div>`
                : '';

            return html`
                    <div class="backlog-item" data-backlog-id=${item.id}>
                        <h3>
                            ${item.title}
                            <button
                                class="promote-btn"
                                @click=${(e) => this._handlePromoteClick(item.id, e.target)}
                            >
                                Promote
                            </button>
                        </h3>
                        ${rationaleHtml}
                        ${tradeoffsHtml}
                        ${tasksHtml}
                        ${notesHtml}
                    </div>
                `;
        })}
        `;
    }
}

customElements.define('product-backlog-panel', ProductBacklogPanel); 