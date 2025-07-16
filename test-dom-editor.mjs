/**
 * Test DOM Editor Integration
 * This script demonstrates how the DOM editor extension integrates with Claude
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:8080';

console.log('🧪 Testing DOM Editor Integration...\n');

// Test 1: Get DOM editor context
console.log('1. Testing DOM editor context endpoint...');
try {
  const contextResponse = await fetch(`${SERVER_URL}/api/dom-editor/context`);
  const contextData = await contextResponse.json();
  console.log('✅ Context API working:', JSON.stringify(contextData, null, 2));
} catch (error) {
  console.log('❌ Context API error:', error.message);
}

// Test 2: Get DOM editor activity
console.log('\n2. Testing DOM editor activity endpoint...');
try {
  const activityResponse = await fetch(`${SERVER_URL}/api/dom-editor/activity`);
  const activityData = await activityResponse.json();
  console.log('✅ Activity API working:', JSON.stringify(activityData, null, 2));
} catch (error) {
  console.log('❌ Activity API error:', error.message);
}

// Test 3: Simulate DOM editor context for Claude
console.log('\n3. How Claude would get DOM editor context:');
try {
  const contextResponse = await fetch(`${SERVER_URL}/api/dom-editor/context`);
  const contextData = await contextResponse.json();
  
  console.log('🤖 Claude Context:');
  console.log('- Active sessions:', contextData.activeSessions.length);
  console.log('- Recent changes:', contextData.recentChanges.length);
  console.log('- Total changes:', contextData.totalChanges);
  
  if (contextData.activeSessions.length > 0) {
    console.log('\n📝 Active Sessions:');
    contextData.activeSessions.forEach((session, index) => {
      console.log(`  ${index + 1}. ${session.url}`);
      console.log(`     Selected: ${session.selectedElement ? session.selectedElement.selector : 'None'}`);
      console.log(`     Changes: ${session.changesCount}`);
    });
  }
  
  if (contextData.recentChanges.length > 0) {
    console.log('\n📝 Recent Changes:');
    contextData.recentChanges.forEach((change, index) => {
      console.log(`  ${index + 1}. ${change.type} on ${change.url}`);
      if (change.element) {
        console.log(`     Element: ${change.element.selector}`);
      }
    });
  }
} catch (error) {
  console.log('❌ Claude context error:', error.message);
}

console.log('\n🎉 DOM Editor Integration Test Complete!');
console.log('\n📋 What Claude can now do:');
console.log('- Access real-time DOM editing context via /api/dom-editor/context');
console.log('- Get detailed activity history via /api/dom-editor/activity');
console.log('- Send commands to DOM editor via /api/dom-editor/message');
console.log('- Coordinate with user DOM changes for better assistance');

console.log('\n🔧 Chrome Extension Files Created:');
console.log('- manifest.json (Chrome extension configuration)');
console.log('- content-script.js (DOM manipulation and WebSocket connection)');
console.log('- background.js (Service worker for message passing)');
console.log('- popup/index.html (Extension popup interface)');
console.log('- popup/styles.css (Extension popup styling)');
console.log('- popup/popup.js (Extension popup functionality)');

console.log('\n💡 Next Steps:');
console.log('1. Load the extension in Chrome Developer mode');
console.log('2. Navigate to any webpage');
console.log('3. Click the extension icon to open the popup');
console.log('4. Use "Start Selection" to select elements');
console.log('5. Edit styles in real-time');
console.log('6. All changes are automatically sent to Claude for context');