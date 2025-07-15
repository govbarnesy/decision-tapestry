/* global vis */
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
        
        /* Activity state animations */
        @keyframes pulse-working {
            0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
            100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
        
        @keyframes pulse-debugging {
            0% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(255, 152, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0); }
        }
        
        @keyframes pulse-testing {
            0% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(33, 150, 243, 0); }
            100% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); }
        }
        
        @keyframes pulse-reviewing {
            0% { box-shadow: 0 0 0 0 rgba(156, 39, 176, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(156, 39, 176, 0); }
            100% { box-shadow: 0 0 0 0 rgba(156, 39, 176, 0); }
        }
    `;

    // Properties for clustering control
    static properties = {
        clusteringEnabled: { type: Boolean },
        clusterByCategory: { type: Boolean }
    };
    
    // Track agent activities on nodes
    _nodeActivities = new Map(); // nodeId -> { agentId, state, timestamp }

    _nodes = [];
    _edges = [];
    _networkInitialized = false;
    _clusteredNodes = new Map(); // Track which nodes are clustered

    set nodes(newVal) {
        console.log('[decision-map] set nodes:', newVal);
        this._originalNodes = newVal; // Store original nodes for restoration
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
        this.clusteringEnabled = false;
        this.clusterByCategory = true;
        
        // Category colors for clustering
        this._categoryColors = {
            'Infrastructure': '#FF6B35',
            'Developer Experience': '#4ECDC4', 
            'UI/UX': '#45B7D1',
            'Architecture': '#96CEB4',
            'Process': '#FFEAA7',
            'Quality': '#DDA0DD',
            'Integration': '#98D8C8',
            'Knowledge Management': '#74B9FF',
            'Other': '#95A5A6'
        };
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
    
    // Update node with activity state
    updateNodeActivity(nodeId, agentId, activityState) {
        if (!this._nodesDataSet) return;
        
        const activityColors = {
            'working': '#4CAF50',
            'debugging': '#FF9800',
            'testing': '#2196F3',
            'reviewing': '#9C27B0',
            'idle': '#757575'
        };
        
        const activityEmojis = {
            'working': '🔨',
            'debugging': '🐛',
            'testing': '🧪',
            'reviewing': '👀',
            'idle': '💤'
        };
        
        // Store activity info
        if (activityState !== 'idle') {
            this._nodeActivities.set(nodeId, {
                agentId,
                state: activityState,
                timestamp: new Date()
            });
        } else {
            this._nodeActivities.delete(nodeId);
        }
        
        // Find the original node
        const originalNode = this._originalNodes?.find(n => n.id === nodeId);
        if (!originalNode) return;
        
        // Create updated node with activity visualization
        const updatedNode = {
            ...originalNode,
            borderWidth: activityState !== 'idle' ? 4 : 2,
            borderWidthSelected: activityState !== 'idle' ? 5 : 3,
            shapeProperties: {
                ...(originalNode.shapeProperties || {}),
                ...(activityState !== 'idle' ? {} : { borderDashes: originalNode.shapeProperties?.borderDashes })
            },
            color: {
                ...originalNode.color,
                border: activityState !== 'idle' ? activityColors[activityState] : originalNode.color.border,
                background: activityState !== 'idle' ? 
                    this._hexToRgba(activityColors[activityState], 0.8) : 
                    originalNode.color.background,
                highlight: {
                    ...originalNode.color.highlight,
                    border: activityState !== 'idle' ? activityColors[activityState] : originalNode.color.highlight?.border,
                    background: activityState !== 'idle' ? 
                        this._hexToRgba(activityColors[activityState], 0.8) : 
                        originalNode.color.highlight?.background
                },
                hover: {
                    ...originalNode.color.hover,
                    border: activityState !== 'idle' ? activityColors[activityState] : originalNode.color.hover?.border,
                    background: activityState !== 'idle' ? 
                        this._hexToRgba(activityColors[activityState], 0.8) : 
                        originalNode.color.hover?.background
                }
            },
            shadow: activityState !== 'idle' ? {
                enabled: true,
                color: activityColors[activityState],
                size: 10,
                x: 0,
                y: 0
            } : false
        };
        
        // Update label with activity info using visual separators
        if (activityState !== 'idle') {
            // Parse the original label to get decision number and title
            const originalLabel = originalNode.label;
            const labelParts = originalLabel.split(':');
            const decisionNumber = labelParts[0]; // e.g., "#55"
            const decisionTitle = labelParts.slice(1).join(':').replace(/^\n/, ''); // Remove leading newline
            
            const emoji = activityEmojis[activityState];
            const agentName = agentId.toUpperCase();
            const stateName = activityState.toUpperCase();
            
            // Create enhanced label with bigger decision number and better spacing
            const enhancedDecisionNumber = `<b>${decisionNumber}</b>`;
            const separator = '\n\n';  // Double line break for spacing
            const badge = `<code>${emoji} ${agentName}: ${stateName}</code>`;
            updatedNode.label = `${enhancedDecisionNumber}:\n\n${decisionTitle}${separator}${badge}`;
            updatedNode.font = {
                size: 12,
                face: 'helvetica',
                multi: 'html',
                vadjust: 0,
                color: '#FFFFFF',  // Make all text white for active nodes
                bold: {
                    size: 14,  // Larger size for decision number
                    color: '#FFFFFF'
                },
                mono: {
                    size: 10,
                    face: 'monospace',
                    color: '#FFFFFF',
                    strokeWidth: 2,
                    strokeColor: activityColors[activityState],
                    vadjust: 2
                }
            };
        } else {
            // Reset to original label when idle
            updatedNode.label = originalNode.label.split('\\n')[0];
            updatedNode.font = {
                size: 12,
                face: 'helvetica',
                multi: 'html',
                vadjust: 0
            };
        }
        
        // Update the node in the dataset
        this._nodesDataSet.update(updatedNode);
        
        // Enhanced visual effects for better visibility
        if (activityState !== 'idle') {
            updatedNode.borderWidth = 6;
            updatedNode.borderWidthSelected = 8;
            updatedNode.size = 40; // Larger for active nodes
            
            // Add stronger shadow for active nodes
            updatedNode.shadow = {
                enabled: true,
                color: activityColors[activityState],
                size: 15,
                x: 0,
                y: 0
            };
            
            // Keep consistent font styling
        } else {
            // Reset to original state when idle
            updatedNode.size = originalNode.size || 25;
            updatedNode.shadow = false;
        }
    }
    
    // Add visual pulsing effect to active nodes
    // Helper function to convert hex color to rgba with opacity
    _hexToRgba(hex, opacity) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    _addPulsingEffect(nodeId, activityState) {
        if (!this._network) return;
        
        const pulseInterval = 2000; // 2 seconds
        const pulseKey = `pulse-${nodeId}`;
        
        // Clear existing pulse for this node
        if (this[pulseKey]) {
            clearInterval(this[pulseKey]);
        }
        
        // Create pulsing effect by periodically updating node size
        let scale = 1;
        let growing = true;
        
        this[pulseKey] = setInterval(() => {
            if (!this._nodeActivities.has(nodeId)) {
                clearInterval(this[pulseKey]);
                delete this[pulseKey];
                return;
            }
            
            // Update scale
            if (growing) {
                scale += 0.02;
                if (scale >= 1.1) growing = false;
            } else {
                scale -= 0.02;
                if (scale <= 1) growing = true;
            }
            
            // Apply scale to node (visual effect only)
            const node = this._nodesDataSet.get(nodeId);
            if (node) {
                this._nodesDataSet.update({
                    id: nodeId,
                    scaling: {
                        label: {
                            enabled: true,
                            min: 14 * scale,
                            max: 14 * scale
                        }
                    }
                });
            }
        }, 50);
    }
    
    // Clear all activity states
    clearAllActivities() {
        // Clear all pulse effects
        Object.keys(this).forEach(key => {
            if (key.startsWith('pulse-')) {
                clearInterval(this[key]);
                delete this[key];
            }
        });
        
        // Reset all nodes to original state
        this._nodeActivities.clear();
        if (this._originalNodes && this._nodesDataSet) {
            this._nodesDataSet.update(this._originalNodes);
        }
    }

    // Category clustering methods
    enableCategoryClustering() {
        if (!this._network) return;
        
        const categories = this._getCategoriesFromNodes();
        categories.forEach(category => {
            this._clusterByCategory(category);
        });
        
        this.clusteringEnabled = true;
    }
    
    disableClustering() {
        if (!this._network) return;
        
        // Uncluster all clusters
        const clusterIds = this._clusteredNodes.keys();
        for (const clusterId of clusterIds) {
            if (this._network.isCluster(clusterId)) {
                this._network.openCluster(clusterId);
            }
        }
        
        this._clusteredNodes.clear();
        this.clusteringEnabled = false;
    }
    
    _getCategoriesFromNodes() {
        const categories = new Set();
        this._nodes.forEach(node => {
            // For now, we'll use a simple categorization based on title/content
            // This will be enhanced when we add category data to decisions
            const category = this._inferCategory(node);
            categories.add(category);
        });
        return Array.from(categories);
    }
    
    _inferCategory(node) {
        const title = node.title || node.label || '';
        const lowerTitle = title.toLowerCase();
        
        if (lowerTitle.includes('cli') || lowerTitle.includes('automation') || lowerTitle.includes('docker') || lowerTitle.includes('release')) {
            return 'Developer Experience';
        } else if (lowerTitle.includes('websocket') || lowerTitle.includes('server') || lowerTitle.includes('infrastructure') || lowerTitle.includes('api')) {
            return 'Infrastructure';
        } else if (lowerTitle.includes('dashboard') || lowerTitle.includes('ui') || lowerTitle.includes('theme') || lowerTitle.includes('visual')) {
            return 'UI/UX';
        } else if (lowerTitle.includes('architecture') || lowerTitle.includes('component') || lowerTitle.includes('structure')) {
            return 'Architecture';
        } else if (lowerTitle.includes('process') || lowerTitle.includes('workflow') || lowerTitle.includes('coordination')) {
            return 'Process';
        } else if (lowerTitle.includes('test') || lowerTitle.includes('quality') || lowerTitle.includes('lint')) {
            return 'Quality';
        } else if (lowerTitle.includes('integration') || lowerTitle.includes('vscode') || lowerTitle.includes('extension')) {
            return 'Integration';
        }
        return 'Other';
    }
    
    _clusterByCategory(category) {
        const categoryNodes = this._nodes.filter(node => this._inferCategory(node) === category);
        if (categoryNodes.length <= 1) return; // Don't cluster single nodes
        
        const nodeIds = categoryNodes.map(node => node.id);
        const clusterOptions = {
            joinCondition: (childOptions) => nodeIds.includes(childOptions.id),
            clusterNodeProperties: {
                id: `cluster-${category}`,
                label: `${category}\n(${nodeIds.length} decisions)`,
                shape: 'box',
                color: {
                    background: this._categoryColors[category] || '#95A5A6',
                    border: this._categoryColors[category] || '#95A5A6',
                    highlight: {
                        background: this._lightenColor(this._categoryColors[category] || '#95A5A6', 0.3),
                        border: this._categoryColors[category] || '#95A5A6'
                    }
                },
                font: {
                    size: 16,
                    color: '#FFFFFF',
                    face: 'helvetica'
                },
                borderWidth: 3,
                shadow: {
                    enabled: true,
                    color: this._categoryColors[category] || '#95A5A6',
                    size: 10,
                    x: 2,
                    y: 2
                },
                scaling: {
                    min: 50,
                    max: 100
                }
            }
        };
        
        this._network.cluster(clusterOptions);
        this._clusteredNodes.set(`cluster-${category}`, {
            category,
            nodeIds,
            nodeCount: nodeIds.length
        });
    }
    
    _lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
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
            nodes: { 
                shape: 'box', 
                widthConstraint: { maximum: 200, minimum: 100 },
                heightConstraint: { minimum: 60, valign: 'middle' },
                margin: {
                    top: 15,
                    bottom: 15,
                    left: 12,
                    right: 12
                },
                font: {
                    size: 12,
                    face: 'helvetica',
                    multi: 'html',
                    vadjust: 0,
                    mono: {
                        size: 10,
                        face: 'monospace'
                    }
                }
            },
            physics: { 
                forceAtlas2Based: { 
                    gravitationalConstant: -80, 
                    centralGravity: 0.003, 
                    springLength: 350,
                    springConstant: 0.2,
                    damping: 0.4,
                    avoidOverlap: 0.5
                } 
            },
            interaction: {
                dragNodes: true,
                dragView: true,
                hover: true,
                zoomView: true
            }
        };

        this._network = new vis.Network(container, data, options);

        // Disable physics after initial stabilization for a static layout
        this._network.once('stabilizationIterationsDone', () => {
            this._network.setOptions({ physics: true });
        });

        this._network.on('click', (params) => {
            // Only handle node clicks, ignore background clicks
            const nodeId = params.nodes.length > 0 ? params.nodes[0] : null;
            
            if (!nodeId) {
                return; // Clicked on background, ignore
            }
            
            // Handle cluster clicks
            if (String(nodeId).startsWith('cluster-')) {
                if (this._network.isCluster(nodeId)) {
                    this._network.openCluster(nodeId);
                    // Remove from clustered nodes tracking
                    this._clusteredNodes.delete(nodeId);
                    return; // Don't dispatch node-click for clusters
                }
            }
            
            // Dispatch the node click event
            this.dispatchEvent(new CustomEvent('node-click', {
                detail: { nodeId },
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define('decision-map', DecisionMap); 