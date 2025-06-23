import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * A component that provides a search input field.
 * @element search-panel
 * @fires search-input - Dispatched when the user types in the search field.
 */
class SearchPanel extends LitElement {
    static styles = css`
        :host {
            display: block;
            padding: 1rem;
        }
        h2 {
            margin: 0 0 0.5rem 0;
            color: #333;
        }
        input[type="text"] {
            width: 100%;
            padding: 0.5rem;
            box-sizing: border-box;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
    `;

    _handleInput(e) {
        this.dispatchEvent(new CustomEvent('search-input', {
            detail: { searchTerm: e.target.value },
            bubbles: true,
            composed: true,
        }));
    }

    render() {
        return html`
            <h2>Controls</h2>
            <input 
                type="text" 
                id="search-input" 
                placeholder="Search decisions..."
                @input=${this._handleInput}
            >
        `;
    }
}

customElements.define('search-panel', SearchPanel); 