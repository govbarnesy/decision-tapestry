/**
 * Hot DOM Update System
 * Gracefully updates the DOM based on DOM editor changes without page reloads
 */

import fetch from 'node-fetch';
import { WebSocket } from 'ws';

const SERVER_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080';

console.log('🔥 Hot DOM Update System Starting...\n');

// Connect to WebSocket to listen for DOM changes
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Connected to Decision Tapestry WebSocket');
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  handleDOMUpdate(message);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

async function handleDOMUpdate(message) {
  switch (message.type) {
    case 'dom_element_selected':
      console.log(`🎯 Element selected: ${message.element.selector}`);
      await suggestDOMUpdates(message.element);
      break;
      
    case 'dom_styles_updated':
      console.log(`🎨 Styles updated: ${message.element.selector}`);
      await applyStyleUpdates(message.element, message.styles);
      break;
      
    case 'dom_element_removed':
      console.log(`🗑️ Element removed: ${message.element.selector}`);
      await handleElementRemoval(message.element);
      break;
      
    case 'dom_changes_reset':
      console.log(`↩️ Changes reset for: ${message.url}`);
      break;
  }
}

async function suggestDOMUpdates(element) {
  console.log('\n💡 Suggested DOM Updates:');
  
  // Analyze the selected element and suggest updates
  if (element.selector === '#advanced-filter') {
    console.log('🔍 Advanced Filter Panel Selected');
    console.log('   → This is the Filters tab content');
    console.log('   → Currently active and visible');
    console.log('   → Consider updating tab styles to match removal of Gemini tab');
    
    // Send hot update to make tab spacing more even
    await sendHotUpdate({
      type: 'style_update',
      selector: '.controls-tabs',
      styles: {
        'gap': '0px',
        'justify-content': 'space-between'
      },
      reason: 'Adjust tab spacing after Gemini tab removal'
    });
    
    // Update tab button widths to be more evenly distributed
    await sendHotUpdate({
      type: 'style_update',
      selector: '.controls-tab',
      styles: {
        'flex': '1',
        'min-width': '80px'
      },
      reason: 'Make tabs evenly distributed'
    });
    
  } else if (element.selector.includes('controls-tab')) {
    console.log('📑 Controls Tab Selected');
    console.log('   → Tab button in controls panel');
    console.log('   → Part of navigation system');
    
  } else if (element.selector.includes('controls-panel')) {
    console.log('🎛️ Controls Panel Selected');
    console.log('   → Main controls container');
    console.log('   → Consider responsive adjustments');
  }
}

async function applyStyleUpdates(element, styles) {
  console.log('\n🎨 Applying Style Updates:');
  console.log(`   Element: ${element.selector}`);
  console.log(`   Styles: ${JSON.stringify(styles, null, 2)}`);
  
  // Send the style update to the server to broadcast to all clients
  await sendHotUpdate({
    type: 'style_update',
    selector: element.selector,
    styles: styles,
    reason: 'User DOM editor change'
  });
}

async function handleElementRemoval(element) {
  console.log('\n🗑️ Handling Element Removal:');
  console.log(`   Removed: ${element.selector}`);
  
  if (element.text === 'Gemini AI') {
    console.log('   → Gemini AI tab was removed');
    console.log('   → Updating related DOM elements...');
    
    // Update the controls tabs to reflow properly
    await sendHotUpdate({
      type: 'remove_element',
      selector: '[data-tab="gemini"]',
      reason: 'Clean up Gemini tab references'
    });
    
    // Update tab container styles
    await sendHotUpdate({
      type: 'style_update',
      selector: '.controls-tabs',
      styles: {
        'grid-template-columns': 'repeat(4, 1fr)'
      },
      reason: 'Adjust for 4 tabs instead of 5'
    });
    
    console.log('   ✅ DOM cleanup complete');
  }
}

async function sendHotUpdate(update) {
  console.log(`\n🔄 Sending Hot Update: ${update.type}`);
  console.log(`   Selector: ${update.selector}`);
  console.log(`   Reason: ${update.reason}`);
  
  try {
    const response = await fetch(`${SERVER_URL}/api/dom-editor/hot-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
    
    if (response.ok) {
      console.log('   ✅ Hot update sent successfully');
    } else {
      console.log('   ❌ Hot update failed:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Error sending hot update:', error.message);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Hot DOM Update System...');
  ws.close();
  process.exit(0);
});

// Keep the process alive
console.log('🎧 Listening for DOM changes...');
console.log('Press Ctrl+C to stop\n');