/**
 * Test script to demonstrate activity visualization
 * 
 * This script simulates agent activities for testing the visual components.
 * To use: 
 * 1. Add <script type="module" src="./test-activity.mjs"></script> to index.html
 * 2. Open the dashboard and watch the activity visualizations
 */

// Wait for dashboard to initialize
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('Starting activity simulation...');
        simulateAgentActivities();
    }, 2000);
});

function simulateAgentActivities() {
    const agents = [
        { id: 'Agent-1', name: 'Infrastructure Builder' },
        { id: 'Agent-2', name: 'Frontend Developer' },
        { id: 'Agent-3', name: 'Integration Specialist' }
    ];
    
    const activities = [
        { state: 'working', taskDescription: 'Building WebSocket infrastructure for real-time updates' },
        { state: 'debugging', taskDescription: 'Fixing edge case in activity state transitions' },
        { state: 'testing', taskDescription: 'Running integration tests for activity API' },
        { state: 'reviewing', taskDescription: 'Code review for decision visualization updates' },
        { state: 'working', taskDescription: 'Implementing pulsing animations for active nodes' },
        { state: 'debugging', taskDescription: 'Troubleshooting CSS animation performance' },
        { state: 'testing', taskDescription: 'Testing real-time update latency' },
        { state: 'working', taskDescription: 'Creating agent status panel component' }
    ];
    
    const decisions = [55, 56, 57, 58]; // Related decision IDs
    
    let activityIndex = 0;
    
    // Simulate initial activities
    agents.forEach((agent, index) => {
        setTimeout(() => {
            const activity = activities[activityIndex % activities.length];
            const decisionId = decisions[index % decisions.length];
            
            sendActivityUpdate(agent.id, {
                ...activity,
                decisionId
            });
            
            activityIndex++;
        }, index * 1000);
    });
    
    // Continue simulating random activities
    setInterval(() => {
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const shouldGoIdle = Math.random() > 0.8;
        
        if (shouldGoIdle) {
            sendActivityUpdate(agent.id, {
                state: 'idle',
                decisionId: null,
                taskDescription: null
            });
        } else {
            const activity = activities[Math.floor(Math.random() * activities.length)];
            const decisionId = decisions[Math.floor(Math.random() * decisions.length)];
            
            sendActivityUpdate(agent.id, {
                ...activity,
                decisionId
            });
        }
    }, 5000);
}

function sendActivityUpdate(agentId, activity) {
    // Create activity message in the same format as the WebSocket would send
    const message = {
        type: 'activity',
        agentId: agentId,
        activity: activity,
        timestamp: new Date().toISOString()
    };
    
    console.log('Simulating activity:', message);
    
    // Call the handleActivityUpdate function directly
    if (window.handleActivityUpdate) {
        window.handleActivityUpdate(message);
    }
    
    // Also dispatch a custom event for any listeners
    window.dispatchEvent(new CustomEvent('activity-update', {
        detail: message,
        bubbles: true
    }));
}

// Expose function globally for manual testing
window.sendTestActivity = (agentId, state, decisionId, taskDescription) => {
    sendActivityUpdate(agentId, {
        state: state || 'working',
        decisionId: decisionId || 57,
        taskDescription: taskDescription || 'Manual test activity'
    });
};

console.log('Activity test module loaded. Use window.sendTestActivity() for manual testing.');