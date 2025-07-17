#!/usr/bin/env node

/**
 * Test script for AI Canvas functionality
 * Demonstrates how AI can use the canvas to communicate visually
 */

import canvas from './claude-code-integration/ai-canvas-helper.mjs';

console.log('🎨 Testing AI Canvas functionality...\n');

async function runTests() {
  try {
    // Test 1: Show code example
    console.log('1. Showing code example...');
    await canvas.showCode(`
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome to Decision Tapestry\`;
}

greet('User');
    `, 'javascript');
    await sleep(2000);

    // Test 2: Show progress
    console.log('2. Showing progress tracker...');
    const steps = [
      'Initialize project',
      'Set up database',
      'Create API endpoints',
      'Build UI components',
      'Add authentication',
      'Deploy to production'
    ];
    await canvas.showProgress(steps, 2); // Currently on step 3
    await sleep(2000);

    // Test 3: Show wireframe
    console.log('3. Showing login wireframe...');
    await canvas.wireframes.loginForm();
    await sleep(2000);

    // Test 4: Show comparison
    console.log('4. Showing before/after comparison...');
    await canvas.showComparison(
      '<div style="padding: 20px; background: #fee;">Old Design<br>• Complex UI<br>• Many buttons<br>• Confusing layout</div>',
      '<div style="padding: 20px; background: #efe;">New Design<br>• Clean interface<br>• Minimal buttons<br>• Intuitive layout</div>',
      { beforeLabel: 'Current Design', afterLabel: 'Proposed Design' }
    );
    await sleep(2000);

    // Test 5: Show architecture diagram
    console.log('5. Showing architecture diagram...');
    await canvas.diagrams.architecture([
      { x: 50, y: 50, name: 'Frontend', subtitle: 'React + TypeScript', color: '#e3f2fd', stroke: '#2196f3' },
      { x: 250, y: 50, name: 'API Server', subtitle: 'Node.js + Express', color: '#f3e5f5', stroke: '#9c27b0' },
      { x: 450, y: 50, name: 'Database', subtitle: 'PostgreSQL', color: '#e8f5e9', stroke: '#4caf50' },
      { x: 150, y: 200, name: 'WebSocket', subtitle: 'Real-time updates', color: '#fff3e0', stroke: '#ff9800' },
      { x: 350, y: 200, name: 'AI Canvas', subtitle: 'Visual Communication', color: '#fce4ec', stroke: '#e91e63' }
    ]);
    await sleep(2000);

    // Test 6: Show flowchart
    console.log('6. Showing decision flowchart...');
    await canvas.diagrams.flowchart(
      [
        { x: 250, y: 50, label: 'Start' },
        { x: 250, y: 150, label: 'Analyze' },
        { x: 150, y: 250, label: 'Option A' },
        { x: 350, y: 250, label: 'Option B' },
        { x: 250, y: 350, label: 'Decision' }
      ],
      [
        { x1: 310, y1: 90, x2: 310, y2: 150 },
        { x1: 280, y1: 190, x2: 210, y2: 250 },
        { x1: 340, y1: 190, x2: 410, y2: 250 },
        { x1: 210, y1: 290, x2: 280, y2: 350 },
        { x1: 410, y1: 290, x2: 340, y2: 350 }
      ]
    );
    await sleep(2000);

    // Test 7: Show data visualization
    console.log('7. Showing data structure...');
    await canvas.showData({
      project: 'Decision Tapestry',
      version: '1.7.0',
      features: {
        'AI Canvas': 'Visual communication layer',
        'Real-time': 'WebSocket updates',
        'Dashboard': 'Interactive visualizations'
      },
      stats: {
        decisions: 89,
        components: 12,
        activeAgents: 3
      }
    }, 'json');

    console.log('\n✅ All tests completed! Check the AI Canvas tab in the dashboard.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Make sure server is running
console.log('Make sure the Decision Tapestry server is running at http://localhost:8080');
console.log('Open the dashboard and click on the "AI Canvas" tab to see the visualizations.\n');

// Run tests
runTests();