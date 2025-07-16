import { LitElement, css, html } from "https://esm.sh/lit@3";

/**
 * @class TabControl
 * @description A component to manage tab navigation.
 * It maintains which tab is active and fires an event when a tab is clicked.
 * @fires tab-change - Dispatched when a tab is clicked, carrying the target tab's ID in the detail.
 */
class TabControl extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .tabs-header {
      padding: 0.5rem 1rem;
      border-bottom: 1px solid var(--border);
      background: var(--tab-bg);
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
    }

    .tab-button {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px 4px 0 0;
      font-size: 0.9rem;
      color: var(--text-secondary);
      transition: all 0.2s ease;
    }

    .tab-button:hover {
      background: var(--tab-active-bg);
      color: var(--text-main);
    }

    .tab-button.active {
      background: var(--accent);
      color: white;
    }
  `;

  static properties = {
    tabs: { type: Array },
    activeTab: { type: String },
  };

  constructor() {
    super();
    this.tabs = [
      { id: "decision-detail", label: "Decision Details" },
      { id: "product-backlog", label: "Product Backlog" },
      { id: "analytics", label: "Analytics" },
    ];
    this.activeTab = "decision-detail";
  }

  render() {
    return html`
      <div class="tabs-header">
        <div class="tabs" @click="${this._handleTabClick}">
          ${this.tabs.map(
            (tab) => html`
              <button
                class="tab-button ${this.activeTab === tab.id ? "active" : ""}"
                data-tab="${tab.id}"
              >
                ${tab.label}
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }

  _handleTabClick(e) {
    const tabId = e.target.dataset.tab;
    if (tabId && tabId !== this.activeTab) {
      this.activeTab = tabId;
      this.dispatchEvent(
        new CustomEvent("tab-change", {
          detail: { tabId },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
}

customElements.define("tab-control", TabControl);
