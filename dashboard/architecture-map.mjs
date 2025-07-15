/* global vis */
import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * @class ArchitectureMap
 * @description A component that visualizes the system architecture and how decisions impact components
 * @fires component-click - Dispatched when an architecture component is clicked
 */
class ArchitectureMap extends LitElement {
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
        .legend {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 4px;
            font-size: 0.8rem;
            z-index: 1000;
        }
        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
        }
        .legend-color {
            width: 12px;
            height: 12px;
            margin-right: 6px;
            border-radius: 2px;
        }
    `;

    static properties = {
        decisions: { type: Array },
        selectedDecisionId: { type: Number }
    };

    constructor() {
        super();
        this.decisions = [];
        this.selectedDecisionId = null;
        this._network = null;
        this._nodesDataSet = new vis.DataSet();
        this._edgesDataSet = new vis.DataSet();
        this._networkInitialized = false;
        
        // Component type colors and shapes
        this._componentTypes = {
            'frontend': { color: '#3498db', shape: 'box', label: 'Frontend' },
            'backend': { color: '#e74c3c', shape: 'ellipse', label: 'Backend' },
            'cli': { color: '#f39c12', shape: 'diamond', label: 'CLI' },
            'docs': { color: '#2ecc71', shape: 'text', label: 'Docs' },
            'config': { color: '#9b59b6', shape: 'triangle', label: 'Config' },
            'shared': { color: '#1abc9c', shape: 'hexagon', label: 'Shared' },
            'other': { color: '#95a5a6', shape: 'dot', label: 'Other' }
        };
    }

    set decisions(newVal) {
        this._decisions = newVal;
        this._generateArchitectureGraph();
    }

    get decisions() {
        return this._decisions;
    }

    render() {
        return html`
            <div id="network"></div>
            <div class="legend">
                <div style="font-weight: bold; margin-bottom: 8px;">Component Types</div>
                ${Object.entries(this._componentTypes).map(([type, config]) => html`
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: ${config.color}"></div>
                        <span>${config.label}</span>
                    </div>
                `)}
            </div>
        `;
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

    _generateArchitectureGraph() {
        if (!this._decisions) return;

        // Extract all unique components from affected_components
        const componentMap = new Map();
        const decisionImpacts = new Map(); // component -> [decisions that affect it]

        this._decisions.forEach(decision => {
            if (decision.affected_components) {
                decision.affected_components.forEach(component => {
                    if (!componentMap.has(component)) {
                        componentMap.set(component, {
                            id: component,
                            path: component,
                            type: this._inferComponentType(component),
                            decisions: []
                        });
                    }
                    componentMap.get(component).decisions.push(decision);

                    // Track decision impacts
                    if (!decisionImpacts.has(component)) {
                        decisionImpacts.set(component, []);
                    }
                    decisionImpacts.get(component).push(decision);
                });
            }
        });

        // Generate nodes for components
        const nodes = Array.from(componentMap.values()).map(component => {
            const typeConfig = this._componentTypes[component.type];
            const impactCount = component.decisions.length;
            
            return {
                id: component.id,
                label: this._formatComponentLabel(component.path, impactCount),
                shape: typeConfig.shape,
                color: {
                    background: typeConfig.color,
                    border: this._darkenColor(typeConfig.color, 0.2),
                    highlight: {
                        background: this._lightenColor(typeConfig.color, 0.3),
                        border: typeConfig.color
                    }
                },
                font: {
                    color: this._getContrastColor(typeConfig.color),
                    size: 10 + Math.min(impactCount * 2, 10), // Size based on impact
                    face: 'monospace'
                },
                size: 20 + Math.min(impactCount * 5, 30), // Size based on decision impact
                borderWidth: 2,
                scaling: {
                    min: 10,
                    max: 50
                }
            };
        });

        // Generate edges for component relationships (based on shared decisions)
        const edges = [];
        const components = Array.from(componentMap.values());
        
        for (let i = 0; i < components.length; i++) {
            for (let j = i + 1; j < components.length; j++) {
                const comp1 = components[i];
                const comp2 = components[j];
                
                // Find shared decisions
                const sharedDecisions = comp1.decisions.filter(d1 =>
                    comp2.decisions.some(d2 => d1.id === d2.id)
                );
                
                if (sharedDecisions.length > 0) {
                    edges.push({
                        from: comp1.id,
                        to: comp2.id,
                        label: `${sharedDecisions.length} shared`,
                        color: '#95a5a6',
                        width: Math.min(sharedDecisions.length, 5),
                        dashes: [5, 5],
                        font: { size: 8, color: '#666' }
                    });
                }
            }
        }

        // Update the vis.js datasets
        if (this._nodesDataSet) {
            this._nodesDataSet.clear();
            this._nodesDataSet.add(nodes);
        }
        
        if (this._edgesDataSet) {
            this._edgesDataSet.clear();
            this._edgesDataSet.add(edges);
        }
    }

    _inferComponentType(componentPath) {
        const path = componentPath.toLowerCase();
        
        if (path.includes('dashboard/') || path.includes('frontend/') || path.includes('.html') || path.includes('.css')) {
            return 'frontend';
        } else if (path.includes('server/') || path.includes('backend/') || path.includes('api/')) {
            return 'backend';
        } else if (path.includes('cli/') || path.includes('cli.')) {
            return 'cli';
        } else if (path.includes('docs/') || path.includes('.md') || path.includes('readme')) {
            return 'docs';
        } else if (path.includes('config') || path.includes('.json') || path.includes('.yml') || path.includes('.yaml')) {
            return 'config';
        } else if (path.includes('shared/') || path.includes('utils/') || path.includes('common/')) {
            return 'shared';
        }
        return 'other';
    }

    _formatComponentLabel(path, impactCount) {
        // Extract filename from path
        const filename = path.split('/').pop() || path;
        return `${filename}\\n(${impactCount} impacts)`;
    }

    _darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent * 100);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    _lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent * 100);
        const R = Math.min((num >> 16) + amt, 255);
        const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
        const B = Math.min((num & 0x0000FF) + amt, 255);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    _getContrastColor(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    _initializeNetwork() {
        const container = this.shadowRoot?.getElementById('network');
        if (!container) return;

        const data = {
            nodes: this._nodesDataSet,
            edges: this._edgesDataSet
        };

        const options = {
            nodes: {
                borderWidth: 2,
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.3)',
                    size: 5,
                    x: 2,
                    y: 2
                }
            },
            edges: {
                smooth: {
                    enabled: true,
                    type: 'continuous'
                }
            },
            physics: {
                enabled: true,
                forceAtlas2Based: {
                    gravitationalConstant: -80,
                    centralGravity: 0.01,
                    springLength: 200,
                    springConstant: 0.08
                },
                maxVelocity: 50,
                solver: 'forceAtlas2Based',
                timestep: 0.35,
                stabilization: {
                    enabled: true,
                    iterations: 150,
                    updateInterval: 25
                }
            },
            interaction: {
                dragNodes: true,
                dragView: true,
                hover: true,
                selectConnectedEdges: true
            }
        };

        this._network = new vis.Network(container, data, options);
        this._networkInitialized = true;

        // Add event listeners
        this._network.on('click', (params) => {
            const componentId = params.nodes.length > 0 ? params.nodes[0] : null;
            if (componentId) {
                this.dispatchEvent(new CustomEvent('component-click', {
                    detail: { componentId },
                    bubbles: true,
                    composed: true
                }));
            }
        });

        // Disable physics after stabilization for better performance
        this._network.once('stabilizationIterationsDone', () => {
            this._network.setOptions({ physics: { enabled: false } });
        });
    }

    // Highlight components affected by a specific decision
    highlightDecisionImpact(decisionId) {
        if (!this._decisions || !this._network) return;

        const decision = this._decisions.find(d => d.id === decisionId);
        if (!decision || !decision.affected_components) return;

        // Reset all nodes to normal state first
        const allNodes = this._nodesDataSet.get();
        allNodes.forEach(node => {
            this._nodesDataSet.update({
                id: node.id,
                borderWidth: 2,
                shadow: { enabled: true, size: 5 }
            });
        });

        // Highlight affected components
        decision.affected_components.forEach(componentPath => {
            try {
                this._nodesDataSet.update({
                    id: componentPath,
                    borderWidth: 4,
                    shadow: { 
                        enabled: true, 
                        color: '#ff4757', 
                        size: 10,
                        x: 0,
                        y: 0
                    }
                });
            } catch (e) {
                // Component might not exist in current view
                console.log('Component not found:', componentPath);
            }
        });

        this.selectedDecisionId = decisionId;
    }

    // Clear all highlights
    clearHighlights() {
        if (!this._network) return;

        const allNodes = this._nodesDataSet.get();
        allNodes.forEach(node => {
            this._nodesDataSet.update({
                id: node.id,
                borderWidth: 2,
                shadow: { enabled: true, size: 5, color: 'rgba(0,0,0,0.3)' }
            });
        });

        this.selectedDecisionId = null;
    }
}

customElements.define('architecture-map', ArchitectureMap);