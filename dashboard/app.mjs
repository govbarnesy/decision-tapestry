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
            throw new Error(`Failed to fetch data: ${response.statusText}`);
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
            // Detect dark mode
            const isDark = document.body.classList.contains('dark-theme');
            const fontColor = isDark ? '#fff' : '#000';
            const nodes = decisions.map(d => ({
                id: d.id,
                label: `#${d.id}: ${d.title}`,
                color: statusColorMapping[d.status] || '#007bff',
                font: { color: fontColor }
            }));
            const relatedEdges = decisions.flatMap(d => d.related_to ? d.related_to.map(r => ({ from: r, to: d.id, dashes: true, color: '#848484' })) : []);
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
        document.body.innerHTML = '<p>Error loading dashboard. Please check the console.</p>';
    }
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
            throw new Error(`Failed to promote: ${response.statusText}`);
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
    }
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
                const nodes = filteredDecisions.map(d => ({
                    id: d.id,
                    label: `#${d.id}: ${d.title}`,
                    color: statusColorMapping[d.status] || '#007bff'
                }));
                const relatedEdges = filteredDecisions.flatMap(d => d.related_to ? d.related_to.map(r => ({ from: r, to: d.id, dashes: true, color: '#848484' })) : []);
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
            console.log('WebSocket message received:', event.data);
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'update') {
                    console.log('File change detected, refreshing dashboard...');
                    initializeDashboard(message.decisionId); // focus on the updated node if available
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
        if (btn) btn.textContent = '☀️ Light Mode';
    } else {
        document.body.classList.remove('dark-theme');
        const btn = document.getElementById('theme-toggle-btn');
        if (btn) btn.textContent = '🌙 Dark Mode';
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