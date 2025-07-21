#!/usr/bin/env node

import canvas from './claude-code-integration/ai-canvas-helper.mjs';

// Show onboarding visualization
const onboardingHTML = `
<div style="font-family: Arial; padding: 20px; max-width: 800px; margin: 0 auto;">
  <h2>🚀 Decision Tapestry Onboarding Flow</h2>
  
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;">
    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border: 2px solid #2196f3;">
      <h3>1. Quick Start</h3>
      <ul style="list-style: none; padding: 0;">
        <li>✓ Interactive onboard command</li>
        <li>✓ Checks Node.js 20+</li>
        <li>✓ Creates decisions.yml</li>
        <li>✓ Starts dashboard</li>
      </ul>
    </div>
    
    <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; border: 2px solid #9c27b0;">
      <h3>2. Guided Tour</h3>
      <ul style="list-style: none; padding: 0;">
        <li>✓ Dashboard walkthrough</li>
        <li>✓ Feature highlights</li>
        <li>✓ Sample decisions</li>
        <li>✓ Interactive tooltips</li>
      </ul>
    </div>
    
    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border: 2px solid #4caf50;">
      <h3>3. AI Integration</h3>
      <ul style="list-style: none; padding: 0;">
        <li>✓ Connect AI tools</li>
        <li>✓ Activity tracking setup</li>
        <li>✓ Real-time visualization</li>
        <li>✓ Canvas demo</li>
      </ul>
    </div>
  </div>
  
  <div style="margin-top: 30px; text-align: center;">
    <p style="color: #666;">This AI Canvas lets me communicate visually with you during our development sessions!</p>
    <p style="margin-top: 20px;">
      <strong>Try it:</strong> Click between tabs to see how I can create different visualizations to help explain concepts.
    </p>
  </div>
</div>
`;

canvas.showHTML(onboardingHTML)
  .then(() => console.log('✅ Onboarding visualization sent to AI Canvas!'))
  .catch(err => console.error('❌ Error:', err));