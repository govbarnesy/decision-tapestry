#!/usr/bin/env node

/**
 * Demo Agent - Shows real-time agent activity
 */

import fetch from 'node-fetch';

const agentId = process.argv[2] || 'Demo-Agent';
const taskDescription = process.argv.slice(3).join(' ') || 'Demonstrating agent capabilities';

console.log(`🤖 ${agentId} starting...`);
console.log(`📋 Task: ${taskDescription}`);
console.log('━'.repeat(50));

// Send activity update
async function sendActivity(state, description) {
    try {
        await fetch('http://localhost:8080/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentId,
                state,
                taskDescription: description
            })
        });
        console.log(`📡 Status: ${state} - ${description}`);
    } catch (error) {
        console.error('❌ Failed to send activity:', error.message);
    }
}

// Simulate agent work
async function performWork() {
    const tasks = [
        { state: 'working', desc: 'Analyzing codebase...', duration: 3000 },
        { state: 'working', desc: 'Implementing changes...', duration: 4000 },
        { state: 'debugging', desc: 'Fixing compilation errors...', duration: 3000 },
        { state: 'testing', desc: 'Running unit tests...', duration: 5000 },
        { state: 'reviewing', desc: 'Code review and cleanup...', duration: 2000 },
        { state: 'idle', desc: 'Task completed successfully!', duration: 1000 }
    ];
    
    for (const task of tasks) {
        await sendActivity(task.state, task.desc);
        await new Promise(resolve => setTimeout(resolve, task.duration));
    }
    
    console.log('\n✅ Agent work completed!');
    process.exit(0);
}

// Start work
performWork().catch(error => {
    console.error('❌ Agent failed:', error);
    process.exit(1);
});