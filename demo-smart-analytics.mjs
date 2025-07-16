/**
 * Demo: Smart Analytics Hot Updates
 * Shows how the hot DOM update system works with smart analytics
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:8080';

console.log('🧠 Smart Analytics Hot Update Demo\n');

async function hotUpdate(type, selector, data, reason) {
  console.log(`🔥 Applying: ${type} to ${selector}`);
  console.log(`   Reason: ${reason}`);
  
  const response = await fetch(`${SERVER_URL}/api/dom-editor/hot-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      selector,
      ...data,
      reason
    })
  });
  
  if (response.ok) {
    console.log('   ✅ Hot update applied\n');
  } else {
    console.log('   ❌ Hot update failed\n');
  }
  
  // Wait a bit between updates
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function demonstrateSmartAnalytics() {
  console.log('🎯 Demonstrating Smart Analytics Hot Updates...\n');
  
  // 1. Replace basic analytics with smart analytics
  await hotUpdate('update_content', '#analytics', {
    content: '<smart-analytics></smart-analytics>'
  }, 'Replace basic panel with intelligent analytics dashboard');
  
  // 2. Style the analytics panel with modern design
  await hotUpdate('style_update', '#analytics', {
    styles: {
      'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'border-radius': '16px',
      'padding': '0',
      'box-shadow': '0 10px 30px rgba(0,0,0,0.2)',
      'overflow': 'hidden'
    }
  }, 'Apply modern gradient background and styling');
  
  // 3. Add subtle animation to the panel
  await hotUpdate('style_update', '#analytics', {
    styles: {
      'animation': 'pulse 3s ease-in-out infinite',
      'transform': 'scale(1.02)'
    }
  }, 'Add subtle pulse animation to draw attention');
  
  // 4. Create the pulse animation
  await hotUpdate('style_update', 'body', {
    styles: {
      'animation': 'none' // Reset, this is just to inject CSS
    }
  }, 'Add pulse keyframe animation');
  
  // 5. Add CSS for the pulse animation
  const style = `
    @keyframes pulse {
      0% { transform: scale(1.02); }
      50% { transform: scale(1.04); }
      100% { transform: scale(1.02); }
    }
  `;
  
  await hotUpdate('add_element', 'head', {
    html: `<style>${style}</style>`
  }, 'Add pulse animation CSS');
  
  console.log('🎉 Smart Analytics Demo Complete!\n');
  console.log('🔍 What just happened:');
  console.log('  → Replaced basic analytics with smart insights');
  console.log('  → Applied modern gradient styling');
  console.log('  → Added subtle animations');
  console.log('  → All without page refresh!\n');
  
  console.log('💡 The Smart Analytics now shows:');
  console.log('  📊 Decision Velocity (2.4/week, +15% trend)');
  console.log('  ✅ Implementation Rate (87%, +12% trend)');
  console.log('  🧠 Average Complexity (6.2/10, stable)');
  console.log('  🤝 Stakeholder Alignment (92%, +8% trend)');
  console.log('  💡 4 Smart Recommendations');
  console.log('  🔍 4 Decision Patterns with confidence scores');
  console.log('  🔄 Auto-refresh every 30 seconds');
  console.log('  🎨 Modern gradient design with animations\n');
  
  console.log('🚀 This demonstrates the power of hot DOM updates:');
  console.log('  → Real-time content replacement');
  console.log('  → Instant styling changes');
  console.log('  → Dynamic animations');
  console.log('  → No page reloads required');
  console.log('  → Seamless user experience\n');
}

// Run the demo
demonstrateSmartAnalytics().catch(console.error);