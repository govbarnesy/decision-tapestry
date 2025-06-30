/* global vis */
import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * @class CharterMap
 * @description A LitElement component that renders the Vis.js charter map graph.
 */
class CharterMap extends LitElement {
    static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }
        #network {
            width: 100%;
            height: 100%;
        }
    `;

    static properties = {
        nodes: { type: Array },
        edges: { type: Array },
    };

    constructor() {
        super();
        this.nodes = [];
        this.edges = [];
        this._network = null;
        this._nodesDataSet = new vis.DataSet();
        this._edgesDataSet = new vis.DataSet();
    }

    render() {
        return html`<div id="network"></div>`;
    }

    firstUpdated() {
        this._initializeNetwork();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._network) {
            this._network.destroy();
        }
    }

    updated(changedProperties) {
        if (changedProperties.has('nodes')) {
            this._nodesDataSet.clear();
            this._nodesDataSet.add(this.nodes);
        }
        if (changedProperties.has('edges')) {
            this._edgesDataSet.clear();
            this._edgesDataSet.add(this.edges);
        }
    }

    _initializeNetwork() {
        const container = this.shadowRoot.getElementById('network');
        const data = {
            nodes: this._nodesDataSet,
            edges: this._edgesDataSet,
        };
        const options = {
            nodes: { shape: 'box', widthConstraint: 150 },
            physics: { forceAtlas2Based: { gravitationalConstant: -100, centralGravity: 0.01 } }
        };

        this._network = new vis.Network(container, data, options);
    }
}

customElements.define('charter-map', CharterMap); 