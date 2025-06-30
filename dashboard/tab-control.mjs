import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * @class TabControl
 * @description A component to manage tab navigation.
 * It maintains which tab is active and fires an event when a tab is clicked.
 * @fires tab-change - Dispatched when a tab is clicked, carrying the target tab's ID in the detail.
 */
class TabControl extends LitElement {
    static styles = css`
        .tabs {
            display: flex;
            border-bottom: 1px solid #ccc;
            background-color: #f8f9fa;
        }
        .tab-button {
            padding: 10px 15px;
            cursor: pointer;
            border: none;
            background-color: transparent;
            font-size: 1rem;
            color: #495057;
            border-bottom: 2px solid transparent;
        }
        .tab-button:hover {
            background-color: #e9ecef;
        }
        .tab-button.active {
            border-bottom: 2px solid #007bff;
            color: #007bff;
            font-weight: bold;
        }
    `;

    static properties = {
        tabs: { type: Array },
        activeTab: { type: String },
    };

    constructor() {
        super();
        this.tabs = [
            { id: 'decision-detail', label: 'Decision Details' },
            { id: 'product-backlog', label: 'Product Backlog' },
            { id: 'analytics', label: 'Analytics' },
        ];
        this.activeTab = 'decision-detail';
    }

    render() {
        return html`
            <div class="tabs" @click="${this._handleTabClick}">
                ${this.tabs.map(tab => html`
                    <button
                        class="tab-button ${this.activeTab === tab.id ? 'active' : ''}"
                        data-tab="${tab.id}"
                    >
                        ${tab.label}
                    </button>
                `)}
            </div>
        `;
    }

    _handleTabClick(e) {
        const tabId = e.target.dataset.tab;
        if (tabId && tabId !== this.activeTab) {
            this.activeTab = tabId;
            this.dispatchEvent(new CustomEvent('tab-change', {
                detail: { tabId },
                bubbles: true,
                composed: true
            }));
        }
    }
}

customElements.define('tab-control', TabControl); 