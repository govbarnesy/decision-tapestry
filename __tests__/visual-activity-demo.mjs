#!/usr/bin/env node

import fetch from 'node-fetch';
import { setTimeout as delay } from 'timers/promises';

const BASE_URL = 'http://localhost:8080';

// Demo configuration
const DEMO_SCENARIOS = [
  {
    name: 'Multi-Agent Coordination',
    activities: [
      { agentId: 'agent-1', state: 'working', decisionId: 56, taskDescription: 'Building WebSocket infrastructure', delay: 0 },
      { agentId: 'agent-2', state: 'debugging', decisionId: 57, taskDescription: 'Fixing animation timing issues', delay: 2000 },
      { agentId: 'agent-3', state: 'testing', decisionId: 58, taskDescription: 'Testing Claude Code integration', delay: 4000 },
      { agentId: 'agent-4', state: 'reviewing', decisionId: 59, taskDescription: 'Reviewing system integration', delay: 6000 },
    ]
  },
  {
    name: 'Agent State Transitions',
    activities: [
      { agentId: 'agent-1', state: 'idle', decisionId: 56, taskDescription: 'Completed infrastructure', delay: 10000 },
      { agentId: 'agent-2', state: 'working', decisionId: 57, taskDescription: 'Implementing new feature', delay: 12000 },
      { agentId: 'agent-3', state: 'debugging', decisionId: 58, taskDescription: 'Found integration issue', delay: 14000 },
      { agentId: 'agent-4', state: 'working', decisionId: 59, taskDescription: 'Writing test scenarios', delay: 16000 },
    ]
  },
  {
    name: 'Dependency Resolution',
    activities: [
      { agentId: 'agent-1', state: 'working', decisionId: 56, taskDescription: 'Completing dependency for Agent-2', delay: 20000 },
      { agentId: 'agent-2', state: 'idle', decisionId: 57, taskDescription: 'Waiting for Agent-1', delay: 20500 },
      { agentId: 'agent-1', state: 'idle', decisionId: 56, taskDescription: 'Infrastructure complete', delay: 24000 },
      { agentId: 'agent-2', state: 'working', decisionId: 57, taskDescription: 'Now working with completed dependency', delay: 24500 },
    ]
  },
  {
    name: 'Intensive Testing Phase',
    activities: [
      { agentId: 'agent-4', state: 'testing', decisionId: 59, taskDescription: 'Running end-to-end tests', delay: 30000 },
      { agentId: 'agent-4', state: 'debugging', decisionId: 59, taskDescription: 'Found issue in test case', delay: 32000 },
      { agentId: 'agent-3', state: 'working', decisionId: 58, taskDescription: 'Fixing identified issue', delay: 34000 },
      { agentId: 'agent-4', state: 'testing', decisionId: 59, taskDescription: 'Re-running tests', delay: 36000 },
      { agentId: 'agent-4', state: 'idle', decisionId: 59, taskDescription: 'All tests passing', delay: 38000 },
    ]
  },
  {
    name: 'Final Review',
    activities: [
      { agentId: 'agent-1', state: 'reviewing', decisionId: 56, taskDescription: 'Final infrastructure review', delay: 42000 },
      { agentId: 'agent-2', state: 'reviewing', decisionId: 57, taskDescription: 'UI/UX final check', delay: 42500 },
      { agentId: 'agent-3', state: 'reviewing', decisionId: 58, taskDescription: 'Integration review', delay: 43000 },
      { agentId: 'agent-4', state: 'reviewing', decisionId: 59, taskDescription: 'Test coverage review', delay: 43500 },
    ]
  },
  {
    name: 'Project Complete',
    activities: [
      { agentId: 'agent-1', state: 'idle', decisionId: 56, taskDescription: 'Infrastructure complete', delay: 48000 },
      { agentId: 'agent-2', state: 'idle', decisionId: 57, taskDescription: 'Frontend complete', delay: 48500 },
      { agentId: 'agent-3', state: 'idle', decisionId: 58, taskDescription: 'Integration complete', delay: 49000 },
      { agentId: 'agent-4', state: 'idle', decisionId: 59, taskDescription: 'Testing complete', delay: 49500 },
    ]
  }
];

async function sendActivity(activity) {
  try {
    const response = await fetch(`${BASE_URL}/api/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: activity.agentId,
        state: activity.state,
        decisionId: activity.decisionId,
        taskDescription: activity.taskDescription
      })
    });
    
    if (response.ok) {
      const emoji = {
        idle: '😴',
        working: '🔨',
        debugging: '🐛',
        testing: '🧪',
        reviewing: '👀'
      }[activity.state];
      
      console.log(`${emoji} ${activity.agentId}: ${activity.state} on Decision #${activity.decisionId} - ${activity.taskDescription}`);
    } else {
      console.error(`Failed to send activity: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending activity:', error.message);
  }
}

async function runDemo() {
  console.log('🎬 Starting Visual Activity Demo');
  console.log('📺 Open http://localhost:8080 in your browser to see the visual updates\n');
  
  for (const scenario of DEMO_SCENARIOS) {
    console.log(`\n🎯 ${scenario.name}`);
    console.log('─'.repeat(50));
    
    for (const activity of scenario.activities) {
      if (activity.delay > 0) {
        await delay(activity.delay - (scenario.activities[scenario.activities.indexOf(activity) - 1]?.delay || 0));
      }
      await sendActivity(activity);
    }
  }
  
  console.log('\n✅ Demo complete!');
  console.log('📊 Check the dashboard to see:');
  console.log('   - Real-time node color changes');
  console.log('   - Activity labels on decisions');
  console.log('   - Agent status indicators');
  console.log('   - Activity timeline');
}

// Add signal handling for graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Demo interrupted. Setting all agents to idle...');
  
  for (const agent of ['agent-1', 'agent-2', 'agent-3', 'agent-4']) {
    await sendActivity({
      agentId: agent,
      state: 'idle',
      decisionId: null,
      taskDescription: 'Demo ended'
    });
  }
  
  process.exit(0);
});

// Run the demo
runDemo().catch(console.error);