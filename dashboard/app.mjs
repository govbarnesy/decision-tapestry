// This file will contain the client-side application logic.
// It will fetch data from the /api/data endpoint and render the dashboard. 

let decisions = [];
let network = null;

let decisionNetwork = null;
let charterNetwork = null;
let allDecisions = []; // Cache all decisions
let allBacklogItems = []; // Cache all backlog items
let currentSelectedDecisionId = null;

async function initializeDashboard(focusNodeId = null) {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            // Try to get detailed error information from the server
            let errorInfo;
            try {
                errorInfo = await response.json();
            } catch (e) {
                errorInfo = { error: 'Unknown error', message: `Server returned ${response.status}: ${response.statusText}` };
            }
            throw new Error(`${errorInfo.error}: ${errorInfo.message}`);
        }
        const apiData = await response.json();
        const { decisions, backlog, charter } = apiData;

        allDecisions = decisions; // Cache the full list
        allBacklogItems = backlog; // Cache the full list

        renderDecisionLog(allDecisions);

        // Setup Decision Map
        const decisionMap = document.getElementById('decision-map');
        if (decisionMap) {
            const statusColorMapping = { Accepted: '#28a745', Superseded: '#6c757d' };
            const isDark = document.body.classList.contains('dark-theme');
            const fontColor = isDark ? '#fff' : '#000';
            const nodeBg = isDark ? '#000' : '#fff';
            const nodes = decisions.map(d => ({
                id: d.id,
                label: `#${d.id}:\n${d.title}`,  // Add line break for better spacing
                color: {
                    border: statusColorMapping[d.status] || '#007bff',
                    background: nodeBg,
                    highlight: {
                        border: statusColorMapping[d.status] || '#007bff',
                        background: nodeBg
                    },
                    hover: {
                        border: statusColorMapping[d.status] || '#007bff',
                        background: nodeBg
                    }
                },
                chosen: {
                    node: function(values, id, selected, hovering) {
                        // Prevent font changes on selection/hover
                        if (!values.font) values.font = {};
                        values.font.size = 12;
                        values.font.face = 'helvetica';
                        values.font.vadjust = 0;
                        values.font.multi = 'html';
                    }
                },
                font: { 
                    color: fontColor,
                    size: 12,
                    face: 'helvetica',
                    multi: 'html',
                    vadjust: 0
                }
            }));
            const relatedEdges = decisions.flatMap(d => d.related_to ? d.related_to.map(r => ({ from: r, to: d.id, dashes: [5, 5], color: '#848484' })) : []);
            const supersedesEdges = decisions.flatMap(d => d.supersedes ? [{ from: d.id, to: d.supersedes, dashes: [5, 5], color: '#dc3545', width: 2, label: 'supersedes' }] : []);
            const edges = [...relatedEdges, ...supersedesEdges];
            requestAnimationFrame(() => {
                decisionMap.nodes = nodes;
                decisionMap.edges = edges;
            });
            if (focusNodeId) {
                requestAnimationFrame(() => {
                    handleDecisionSelection(focusNodeId, true);
                });
            } else if (currentSelectedDecisionId) {
                requestAnimationFrame(() => {
                    handleDecisionSelection(currentSelectedDecisionId, false);
                });
            }
        }
        
        // After loading new data, update the decision detail panel if a decision is currently selected
        if (currentSelectedDecisionId && !focusNodeId) {
            const updatedDecision = allDecisions.find(d => d.id === currentSelectedDecisionId);
            const detailPanel = document.getElementById('decision-detail');
            
            if (detailPanel && updatedDecision) {
                // Use the forceUpdateDecision method for better reactivity
                detailPanel.forceUpdateDecision(JSON.parse(JSON.stringify(updatedDecision)));
            }
        }

        // Setup Charter Map
        const charterMap = document.getElementById('charter-map');
        if (charterMap) {
            const activeStageId = (decisions.find(d => ['Ideating', 'Propose', 'Implement', 'Refine'].includes(d.status)) || {}).status || 'Complete';
            charterMap.nodes = charter.states.map(s => ({ ...s, color: s.id === activeStageId ? '#6f42c1' : '#007bff' }));
            charterMap.edges = charter.transitions.map(t => ({ ...t, arrows: 'to' }));
        }

        renderBacklog(allBacklogItems);
        renderAnalytics(allDecisions, allBacklogItems);
        setupEventListeners();

    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        displayErrorMessage(error.message);
    }
    
    // Load current agent activities after dashboard loads
    loadCurrentActivities();
}

function displayErrorMessage(message) {
    document.body.innerHTML = `
        <div style="padding: 20px; max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #d32f2f; margin-bottom: 20px;">⚠️ Error Loading Dashboard</h2>
            <div style="background: #ffebee; border: 1px solid #f44336; border-radius: 4px; padding: 16px; margin-bottom: 20px;">
                <p style="margin: 0; color: #d32f2f;"><strong>Error:</strong> ${message}</p>
            </div>
            <div style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 4px; padding: 16px;">
                <h3 style="margin: 0 0 10px 0; color: #1976d2;">💡 Troubleshooting Tips:</h3>
                <ul style="margin: 0; color: #1976d2;">
                    <li>If you see "decisions.yml not found", run <code>decision-tapestry init</code> to create a new file</li>
                    <li>If you see "Invalid YAML syntax", check your YAML file for formatting errors</li>
                    <li>If you see "must be an array", ensure your decisions and backlog are formatted as arrays</li>
                    <li>Check the browser console and server logs for more details</li>
                </ul>
            </div>
            <div style="margin-top: 20px;">
                <button onclick="window.location.reload()" style="background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                    🔄 Retry
                </button>
                <button onclick="window.open('/api/health', '_blank')" style="background: #2196f3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                    🔍 Health Check
                </button>
            </div>
        </div>
    `;
}

function renderDecisionLog(decisions) {
    const logPanel = document.getElementById('decision-log-content');
    if (logPanel) {
        logPanel.decisions = decisions;
    }
}

function renderBacklog(backlogItems) {
    const backlogPanel = document.querySelector('product-backlog-panel');
    if (backlogPanel) {
        backlogPanel.backlogItems = backlogItems;
    }
}

function renderAnalytics(decisions, backlog) {
    const healthMetrics = calculateHealthMetrics(decisions);
    const healthMetricsPanel = document.getElementById('health-metrics-stats');
    if (healthMetricsPanel) {
        healthMetricsPanel.totalDecisions = healthMetrics.totalDecisions;
        healthMetricsPanel.averageLifetime = healthMetrics.averageLifetime;
        healthMetricsPanel.supersededCount = healthMetrics.supersededCount;
        healthMetricsPanel.backlogSize = backlog.length;
    }

    const healthChartPanel = document.querySelector('decision-health-chart');
    if (healthChartPanel) {
        healthChartPanel.metrics = healthMetrics;
    }

    const velocityChartPanel = document.querySelector('decision-velocity-chart');
    if (velocityChartPanel) {
        velocityChartPanel.decisions = decisions;
    }
}

function calculateHealthMetrics(decisions) {
    const statusCounts = decisions.reduce((acc, decision) => {
        if (!acc[decision.status]) {
            acc[decision.status] = 0;
        }
        acc[decision.status]++;
        return acc;
    }, {});

    const totalDecisions = decisions.length;
    const totalLifetime = decisions.map(decision => {
        const now = new Date();
        const lifetime = (now - new Date(decision.date)) / (1000 * 60 * 60 * 24); // in days
        return lifetime;
    }).reduce((a, b) => a + b, 0);

    const avgLifetimeDays = totalDecisions > 0 ? (totalLifetime / totalDecisions).toFixed(1) : 0;

    return {
        totalDecisions,
        supersededCount: statusCounts['Superseded'] || 0,
        averageLifetime: `${avgLifetimeDays} days`,
        statusDistribution: {
            accepted: (statusCounts['Accepted'] || 0),
            superseded: (statusCounts['Superseded'] || 0),
            deprecated: (statusCounts['Deprecated'] || 0),
        }
    };
}

async function promoteToDecision(backlogId) {
    try {
        const response = await fetch('/api/decisions/promote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: backlogId }),
        });

        if (!response.ok) {
            // Try to get detailed error information from the server
            let errorInfo;
            try {
                errorInfo = await response.json();
            } catch (e) {
                errorInfo = { error: 'Unknown error', message: `Server returned ${response.status}: ${response.statusText}` };
            }
            throw new Error(`${errorInfo.error}: ${errorInfo.message}`);
        }

        // The websocket will trigger a full refresh, so no need to manually update the UI here.
        console.log('Promotion successful, waiting for refresh...');

    } catch (error) {
        console.error('Error promoting backlog item:', error);
        // Re-enable the button on error
        const button = document.querySelector(`.backlog-item[data-backlog-id="${backlogId}"] .promote-btn`);
        if (button) {
            button.disabled = false;
            button.textContent = 'Promote';
        }
        
        // Show user-friendly error message
        showErrorToast(error.message);
    }
}

function showErrorToast(message) {
    // Remove any existing toast
    const existingToast = document.getElementById('error-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.id = 'error-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 400px;
        font-family: Arial, sans-serif;
        animation: slideIn 0.3s ease-out;
    `;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>⚠️</span>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; margin-left: auto;">×</button>
        </div>
    `;
    
    // Add CSS animation
    if (!document.querySelector('#toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function handleDecisionSelection(decisionId, animate = false) {
    currentSelectedDecisionId = decisionId;
    const decisionMap = document.getElementById('decision-map');
    const detailPanel = document.getElementById('decision-detail');
    const logPanel = document.getElementById('decision-log-content');

    const decision = allDecisions.find(d => d.id === decisionId);

    // Update the state of all relevant components
    if (detailPanel) detailPanel.decision = decision ? JSON.parse(JSON.stringify(decision)) : null;
    if (logPanel) logPanel.selectedId = decisionId;
    if (decisionMap) decisionMap.selectNode(decisionId);

    // If triggered from an interaction that requires camera movement,
    // fire the animation on the next frame.
    if (animate && decisionMap) {
        requestAnimationFrame(() => {
            decisionMap.focusOnNode(decisionId);
        });
    }
}

function setupEventListeners() {
    const decisionMap = document.getElementById('decision-map');
    const detailPanel = document.getElementById('decision-detail');
    const logPanel = document.getElementById('decision-log-content');

    // Link Map clicks to Detail and Log panels
    if (decisionMap) {
        decisionMap.addEventListener('node-click', (e) => {
            handleDecisionSelection(e.detail.nodeId, true);
        });
    }

    // Link Log clicks to Detail and Map panels
    if (logPanel) {
        logPanel.addEventListener('log-item-click', (e) => {
            handleDecisionSelection(e.detail.decisionId, true); // Animate
        });
    }

    // Add event listener for tab changes
    const leftPanel = document.getElementById('left-panel');
    if (leftPanel) {
        leftPanel.addEventListener('tab-change', (e) => {
            const tabContents = leftPanel.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                if (content.id === e.detail.tabId) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    }

    // Add event listener for backlog promotion
    const backlogContainer = document.querySelector('product-backlog-panel');
    if (backlogContainer) {
        backlogContainer.addEventListener('promote-click', (e) => {
            promoteToDecision(e.detail.backlogId);
        });
    }

    // Add event listener for search
    const searchPanel = document.getElementById('controls-panel');
    if (searchPanel) {
        searchPanel.addEventListener('search-input', (e) => {
            const searchTerm = e.detail.searchTerm.toLowerCase();
            const filteredDecisions = allDecisions.filter(d =>
                d.title.toLowerCase().includes(searchTerm) ||
                d.id.toString().includes(searchTerm) ||
                (d.author && d.author.toLowerCase().includes(searchTerm))
            );
            // Update the log
            renderDecisionLog(filteredDecisions);
            // Update the map
            const decisionMap = document.getElementById('decision-map');
            if (decisionMap) {
                const statusColorMapping = { Accepted: '#28a745', Superseded: '#6c757d' };
                const isDark = document.body.classList.contains('dark-theme');
                const fontColor = isDark ? '#fff' : '#000';
                const nodeBg = isDark ? '#000' : '#fff';
                const nodes = filteredDecisions.map(d => ({
                    id: d.id,
                    label: `#${d.id}:\n${d.title}`,  // Add line break for better spacing
                    color: {
                        border: statusColorMapping[d.status] || '#007bff',
                        background: nodeBg,
                        highlight: {
                            border: statusColorMapping[d.status] || '#007bff',
                            background: nodeBg
                        },
                        hover: {
                            border: statusColorMapping[d.status] || '#007bff',
                            background: nodeBg
                        }
                    },
                    chosen: {
                        node: function(values, id, selected, hovering) {
                            // Prevent font changes on selection/hover
                            if (!values.font) values.font = {};
                            values.font.size = 12;
                            values.font.face = 'helvetica';
                            values.font.vadjust = 0;
                            values.font.multi = 'html';
                        }
                    },
                    font: { 
                        color: fontColor,
                        size: 12,
                        face: 'helvetica',
                        multi: 'html',
                        vadjust: 0
                    }
                }));
                const relatedEdges = filteredDecisions.flatMap(d => d.related_to ? d.related_to.map(r => ({ from: r, to: d.id, dashes: [5, 5], color: '#848484' })) : []);
                const supersedesEdges = filteredDecisions.flatMap(d => d.supersedes ? [{ from: d.id, to: d.supersedes, dashes: [5, 5], color: '#dc3545', width: 2, label: 'supersedes' }] : []);
                const edges = [...relatedEdges, ...supersedesEdges];
                requestAnimationFrame(() => {
                    decisionMap.nodes = nodes;
                    decisionMap.edges = edges;
                });
            }
            // If a single decision is matched, select it everywhere
            if (filteredDecisions.length === 1) {
                handleDecisionSelection(filteredDecisions[0].id, true); // Animate
            }
        });
    }
    
    // Add event listeners for activity component events
    document.addEventListener('decision-focus', (e) => {
        const decisionId = e.detail.decisionId;
        if (decisionId) {
            handleDecisionSelection(decisionId, true); // Animate to decision
        }
    });
    
    document.addEventListener('agent-click', (e) => {
        console.log('Agent clicked:', e.detail);
        // Could be extended to show agent details or filter by agent
    });
}

async function loadCurrentActivities() {
    try {
        const response = await fetch('/api/activity');
        const data = await response.json();
        
        console.log('Loading current activities:', data.activities);
        
        // Restore visual states for all active agents
        data.activities.forEach(activity => {
            if (activity.state !== 'idle' && activity.decisionId) {
                // Check if the decision exists before restoring activity
                const decision = allDecisions.find(d => d.id === activity.decisionId);
                if (decision) {
                    handleActivityUpdate({
                        agentId: activity.agentId,
                        activity: {
                            state: activity.state,
                            decisionId: activity.decisionId,
                            taskDescription: activity.taskDescription
                        },
                        timestamp: activity.lastUpdate
                    });
                } else {
                    console.warn(`[Activity] Skipping restore for decision ${activity.decisionId} - not found in current decisions`);
                }
            }
        });
    } catch (error) {
        console.warn('Could not load current activities:', error);
    }
}

function handleActivityUpdate(message) {
    console.log(`[Activity] ${message.agentId} -> ${message.activity.state} on decision ${message.activity.decisionId}`);
    
    // Update decision map with activity indicators if the activity is linked to a decision
    if (message.activity.decisionId) {
        const decisionMap = document.getElementById('decision-map');
        if (decisionMap && decisionMap.updateNodeActivity) {
            // Use the new updateNodeActivity method
            decisionMap.updateNodeActivity(
                message.activity.decisionId,
                message.agentId,
                message.activity.state
            );
        }
        
        // Auto-select and focus on the node when activity starts (not for idle state)
        if (message.activity.state !== 'idle') {
            // Check if the decision exists before trying to select it
            const decision = allDecisions.find(d => d.id === message.activity.decisionId);
            if (decision) {
                console.log(`[Activity] Auto-selecting decision ${message.activity.decisionId} for ${message.agentId}`);
                handleDecisionSelection(message.activity.decisionId, true); // true = animate focus
            } else {
                console.warn(`[Activity] Decision ${message.activity.decisionId} not found in current decisions, skipping auto-selection`);
            }
        }
        
        // Update decision details panel if this decision is currently selected
        const detailPanel = document.getElementById('decision-detail');
        if (detailPanel && detailPanel.decision && detailPanel.decision.id === message.activity.decisionId) {
            detailPanel.updateActivity(
                message.agentId,
                message.activity.state,
                message.activity.taskDescription
            );
        }
        
        // Update decision log with activity badge
        const logPanel = document.getElementById('decision-log-content');
        if (logPanel && logPanel.updateDecisionActivity) {
            logPanel.updateDecisionActivity(
                message.activity.decisionId,
                message.agentId,
                message.activity.state,
                message.activity.taskDescription
            );
        }
    }
    
    // Update agent status panel if it exists
    const agentStatusPanel = document.querySelector('agent-status-panel');
    if (agentStatusPanel && agentStatusPanel.updateAgentActivity) {
        agentStatusPanel.updateAgentActivity(message.agentId, message.activity);
    }
    
    // Update activity timeline if it exists
    const activityTimeline = document.querySelector('activity-timeline');
    if (activityTimeline && activityTimeline.addActivity) {
        activityTimeline.addActivity({
            agentId: message.agentId,
            activity: message.activity,
            timestamp: message.timestamp || new Date().toISOString()
        });
    }
}

function initializeWebSocket() {
    let socket;
    let reconnectTimeout;

    function connect() {
        socket = new WebSocket(`ws://${window.location.host}`);

        socket.onopen = () => {
            console.log('WebSocket connection established');
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
            initializeDashboard(); // Always refresh data on (re)connect
        };
        socket.onclose = () => {
            console.log('WebSocket connection closed, retrying in 1s...');
            reconnectTimeout = setTimeout(connect, 1000);
        };
        socket.onerror = (error) => console.error('WebSocket error:', error);

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'update') {
                    console.log('File change detected, refreshing dashboard...');
                    initializeDashboard(message.decisionId); // focus on the updated node if available
                } else if (message.type === 'activity') {
                    handleActivityUpdate(message);
                } else {
                    console.log('Unknown WebSocket message type:', message.type);
                }
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        };
    }

    connect();
}

// --- THEME TOGGLE LOGIC ---
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        const btn = document.getElementById('theme-toggle-btn');
        if (btn) btn.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-theme');
        const btn = document.getElementById('theme-toggle-btn');
        if (btn) btn.textContent = '🌙';
    }
}

function getPreferredTheme() {
    const saved = localStorage.getItem('dt-theme');
    if (saved) return saved;
    // Fallback to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setupThemeToggle() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    let currentTheme = getPreferredTheme();
    applyTheme(currentTheme);
    btn.addEventListener('click', () => {
        currentTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        localStorage.setItem('dt-theme', currentTheme);
        applyTheme(currentTheme);
    });
}

// --- END THEME TOGGLE LOGIC ---

window.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
    initializeDashboard();
    setupEventListeners();
    initializeWebSocket();
    // Re-render nodes on theme change
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            // Re-run initializeDashboard to update node font color
            initializeDashboard();
        });
    }
});

// Expose handleActivityUpdate globally for testing
window.handleActivityUpdate = handleActivityUpdate;