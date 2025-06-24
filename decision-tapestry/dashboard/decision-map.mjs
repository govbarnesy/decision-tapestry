console.log('[decision-map] module loaded');

import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * @class DecisionMap
 * @description A LitElement component that renders a Vis.js network graph.
 * @fires node-click - Dispatched when a node is clicked, carrying the node ID in the detail.
 */
class DecisionMap extends LitElement {
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

    // No properties that trigger re-renders. We manage everything manually.
    static properties = {};

    _nodes = [];
    _edges = [];
    _networkInitialized = false;

    set nodes(newVal) {
        console.log('[decision-map] set nodes:', newVal);
        if (this._nodesDataSet) {
            // Update or add nodes
            this._nodesDataSet.update(newVal);
            // Remove nodes not present in newVal
            const newIds = new Set(newVal.map(n => n.id));
            const toRemove = this._nodesDataSet.getIds().filter(id => !newIds.has(id));
            if (toRemove.length) this._nodesDataSet.remove(toRemove);
        }
        this._nodes = newVal;
        this._maybeInitNetwork();
    }
    get nodes() { return this._nodes; }

    set edges(newVal) {
        console.log('[decision-map] set edges:', newVal);
        if (this._edgesDataSet) {
            // Update or add edges
            this._edgesDataSet.update(newVal);
            // Remove edges not present in newVal
            const newIds = new Set(newVal.map(e => e.id || `${e.from}-${e.to}`));
            const toRemove = this._edgesDataSet.getIds().filter(id => !newIds.has(id));
            if (toRemove.length) this._edgesDataSet.remove(toRemove);
        }
        this._edges = newVal;
        this._maybeInitNetwork();
    }
    get edges() { return this._edges; }

    constructor() {
        super();
        this._network = null;
        this._nodesDataSet = new vis.DataSet();
        this._edgesDataSet = new vis.DataSet();
    }

    render() {
        console.log('[decision-map] render called');
        return html`<div id="network"></div>`;
    }

    connectedCallback() {
        super.connectedCallback();
        if (this._nodesDataSet) {
            this._nodesDataSet.clear();
            this._nodesDataSet.add(this._nodes);
        }
        if (this._edgesDataSet) {
            this._edgesDataSet.clear();
            this._edgesDataSet.add(this._edges);
        }
        this._maybeInitNetwork();
    }

    firstUpdated() {
        this._maybeInitNetwork();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._network) {
            this._network.destroy();
        }
        this._networkInitialized = false;
    }

    // Debounce utility
    _debounce(fn, delay = 100) {
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(fn, delay);
    }

    selectNode(nodeId) {
        if (this._network) {
            const current = this._network.getSelectedNodes();
            if (current.length === 1 && current[0] === nodeId) return; // Already selected
            this._network.selectNodes(nodeId ? [nodeId] : []);
        }
    }

    focusOnNode(nodeId) {
        // Debounce focus to avoid rapid repeated calls
        this._debounce(() => {
            if (this._network) {
                // Only focus if not already centered on this node
                const viewPosition = this._network.getViewPosition();
                const nodePosition = this._network.getPositions([nodeId])[nodeId];
                if (nodePosition && (viewPosition.x !== nodePosition.x || viewPosition.y !== nodePosition.y)) {
                    this._network.focus(nodeId, {
                        scale: 1.2,
                        animation: { duration: 500, easingFunction: 'easeInOutQuad' }
                    });
                }
            }
        }, 100);
    }

    _maybeInitNetwork() {
        const container = this.shadowRoot && this.shadowRoot.getElementById('network');
        console.log('[decision-map] _maybeInitNetwork', {
            initialized: this._networkInitialized,
            nodes: this._nodes,
            edges: this._edges,
            isConnected: this.isConnected,
            container
        });
        if (!this._networkInitialized && this._nodes.length && this._edges.length && this.isConnected && container) {
            this._initializeNetwork();
            this._networkInitialized = true;
        }
    }

    _initializeNetwork() {
        const container = this.shadowRoot.getElementById('network');
        console.log('[decision-map] _initializeNetwork', {
            nodes: this._nodes,
            edges: this._edges,
            container
        });
        const data = {
            nodes: this._nodesDataSet,
            edges: this._edgesDataSet,
        };
        const options = {
            nodes: { shape: 'box', widthConstraint: 200 },
            physics: { forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.005, springLength: 230 } },
            interaction: {
                dragNodes: true,
                dragView: true,
                hover: true
            }
        };

        this._network = new vis.Network(container, data, options);

        // Disable physics after initial stabilization for a static layout
        this._network.once('stabilizationIterationsDone', () => {
            this._network.setOptions({ physics: false });
        });

        this._network.on('click', (params) => {
            const nodeId = params.nodes.length > 0 ? params.nodes[0] : null;
            this.dispatchEvent(new CustomEvent('node-click', {
                detail: { nodeId },
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define('decision-map', DecisionMap); 