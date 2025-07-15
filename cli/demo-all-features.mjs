#!/usr/bin/env node

/**
 * Demo All Features - Comprehensive demonstration of Decision Tapestry
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function clearActivities() {
    try {
        // Send idle state for all possible agents to clear them
        const agents = ['Agent-1', 'Agent-2', 'Agent-3', 'Agent-4', 'Agent-5',
                       'Test-Agent-1', 'Test-Agent-2', 'Test-Agent-3', 'Test-Agent-4', 'Test-Agent-5'];
        
        for (const agentId of agents) {
            await fetch('http://localhost:8080/api/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId,
                    state: 'idle',
                    taskDescription: 'Cleared'
                })
            });
        }
    } catch (error) {
        // Ignore errors
    }
}

function showMenu() {
    console.clear();
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                 DECISION TAPESTRY - DEMO MODE                      ║
╚════════════════════════════════════════════════════════════════════╝

🎯 DEMONSTRATIONS:

  1. 🧪 Test UI Updates - Watch agents update in real-time
  2. 🚀 Launch 5 AI Agents - Open agents in separate terminals
  3. 📊 Monitor Agents - Real-time terminal monitoring
  4. 🎭 Simulate Activity - Quick activity simulation
  5. 🧹 Clear All Activities - Reset all agent states
  6. 📈 Performance Test - Stress test with many agents
  
  0. Exit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Make sure dashboard is open at http://localhost:8080
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

async function testUIUpdates() {
    console.log('\n🧪 Starting UI Update Test...\n');
    
    const proc = spawn('node', ['cli/test-ui-updates.mjs'], {
        stdio: 'inherit'
    });
    
    await new Promise(resolve => proc.on('close', resolve));
}

async function launchAgents() {
    console.log('\n🚀 Launching AI Agents...\n');
    
    const proc = spawn('bash', ['cli/launch-agents-fixed.sh'], {
        stdio: 'inherit'
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
}

async function monitorAgents() {
    console.log('\n📊 Starting Agent Monitor...\n');
    console.log('Press Ctrl+C to return to menu\n');
    
    const proc = spawn('node', ['cli/cli.mjs', 'agent', 'monitor'], {
        stdio: 'inherit'
    });
    
    // Wait for Ctrl+C
    process.on('SIGINT', () => {
        proc.kill();
        showMenu();
    });
    
    await new Promise(resolve => proc.on('close', resolve));
}

async function simulateActivity() {
    console.log('\n🎭 Simulating Agent Activity...\n');
    
    const agents = [
        { id: 'Demo-Agent-1', task: 'Building new feature' },
        { id: 'Demo-Agent-2', task: 'Fixing critical bug' },
        { id: 'Demo-Agent-3', task: 'Running test suite' }
    ];
    
    const states = ['working', 'debugging', 'testing', 'reviewing'];
    
    for (let i = 0; i < 5; i++) {
        for (const agent of agents) {
            const state = states[Math.floor(Math.random() * states.length)];
            
            try {
                await fetch('http://localhost:8080/api/activity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agentId: agent.id,
                        state,
                        taskDescription: `${agent.task} (step ${i + 1})`
                    })
                });
                
                console.log(`✅ ${agent.id}: ${state} - ${agent.task}`);
            } catch (error) {
                console.error(`❌ Failed: ${error.message}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ Simulation complete!');
    await new Promise(resolve => setTimeout(resolve, 2000));
}

async function clearAllActivities() {
    console.log('\n🧹 Clearing all activities...\n');
    await clearActivities();
    console.log('✅ All activities cleared!');
    await new Promise(resolve => setTimeout(resolve, 2000));
}

async function performanceTest() {
    console.log('\n📈 Starting Performance Test...\n');
    console.log('Creating 20 agents with rapid updates...\n');
    
    const agents = [];
    for (let i = 1; i <= 20; i++) {
        agents.push({
            id: `Perf-Agent-${i}`,
            task: `Performance test task ${i}`
        });
    }
    
    const states = ['working', 'debugging', 'testing', 'reviewing'];
    
    // Rapid fire updates
    for (let round = 0; round < 10; round++) {
        console.log(`Round ${round + 1}/10...`);
        
        const promises = agents.map(async (agent) => {
            const state = states[Math.floor(Math.random() * states.length)];
            
            try {
                await fetch('http://localhost:8080/api/activity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agentId: agent.id,
                        state,
                        taskDescription: `${agent.task} - Round ${round + 1}`
                    })
                });
            } catch (error) {
                // Ignore errors in performance test
            }
        });
        
        await Promise.all(promises);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n✅ Performance test complete!');
    console.log('Check dashboard for visualization of 20 concurrent agents');
    await new Promise(resolve => setTimeout(resolve, 3000));
}

async function runDemo() {
    let running = true;
    
    while (running) {
        showMenu();
        
        const choice = await new Promise(resolve => {
            rl.question('Enter your choice (0-6): ', resolve);
        });
        
        switch (choice) {
            case '1':
                await testUIUpdates();
                break;
            case '2':
                await launchAgents();
                break;
            case '3':
                await monitorAgents();
                break;
            case '4':
                await simulateActivity();
                break;
            case '5':
                await clearAllActivities();
                break;
            case '6':
                await performanceTest();
                break;
            case '0':
                running = false;
                console.log('\n👋 Thanks for using Decision Tapestry!\n');
                break;
            default:
                console.log('\n❌ Invalid choice. Please try again.');
                await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    rl.close();
    process.exit(0);
}

// Check if server is running
async function checkServer() {
    try {
        const response = await fetch('http://localhost:8080/api/activity');
        if (!response.ok) throw new Error('Server not responding');
        return true;
    } catch (error) {
        console.error(`
❌ Decision Tapestry server is not running!

Please start the server first:
  npm start

Then run this demo again.
`);
        process.exit(1);
    }
}

// Main
(async () => {
    await checkServer();
    await runDemo();
})();