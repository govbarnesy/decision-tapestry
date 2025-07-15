#!/usr/bin/env node

/**
 * Test UI Updates - Verify real-time activity updates are working
 */

import fetch from 'node-fetch';

async function sendActivity(agentId, state, description) {
    try {
        const response = await fetch('http://localhost:8080/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentId,
                state,
                taskDescription: description
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log(`✅ Sent: ${agentId} - ${state} - ${description}`);
    } catch (error) {
        console.error(`❌ Failed to send activity: ${error.message}`);
    }
}

async function runTest() {
    console.log('🧪 Testing UI Updates...');
    console.log('📊 Watch the dashboard at http://localhost:8080');
    console.log('━'.repeat(50));
    
    const agents = [
        { id: 'Test-Agent-1', color: 'working' },
        { id: 'Test-Agent-2', color: 'debugging' },
        { id: 'Test-Agent-3', color: 'testing' },
        { id: 'Test-Agent-4', color: 'reviewing' },
        { id: 'Test-Agent-5', color: 'working' }
    ];
    
    // Send initial activities
    for (const agent of agents) {
        await sendActivity(agent.id, agent.color, `Starting ${agent.color} task`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Cycle through different states
    const states = ['working', 'debugging', 'testing', 'reviewing'];
    
    for (let i = 0; i < 10; i++) {
        console.log(`\n🔄 Update cycle ${i + 1}/10`);
        
        for (const agent of agents) {
            const newState = states[Math.floor(Math.random() * states.length)];
            await sendActivity(agent.id, newState, `Task update ${i + 1}`);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Set all to idle
    console.log('\n🏁 Completing all agents...');
    for (const agent of agents) {
        await sendActivity(agent.id, 'idle', 'Task completed');
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('\n✅ Test complete! Check the dashboard for activity updates.');
}

runTest().catch(console.error);