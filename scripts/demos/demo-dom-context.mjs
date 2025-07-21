/**
 * Demo: Show Claude's DOM Editor Context
 * This demonstrates what Claude sees when you use the extension
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:8080';

async function showClaudeContext() {
  console.log('🤖 Claude\'s View of Your DOM Editing Session:\n');
  
  try {
    // Get current context
    const response = await fetch(`${SERVER_URL}/api/dom-editor/context`);
    const context = await response.json();
    
    console.log('📊 Session Summary:');
    console.log(`- Active sessions: ${context.activeSessions.length}`);
    console.log(`- Recent changes: ${context.recentChanges.length}`);
    console.log(`- Total changes: ${context.totalChanges}`);
    
    if (context.activeSessions.length > 0) {
      console.log('\n🌐 Active Sessions:');
      context.activeSessions.forEach((session, i) => {
        console.log(`  ${i + 1}. Session: ${session.sessionId.slice(-8)}`);
        console.log(`     URL: ${session.url}`);
        console.log(`     Selected: ${session.selectedElement?.selector || 'None'}`);
        console.log(`     Changes: ${session.changesCount}`);
        console.log(`     Last activity: ${session.lastActivity || 'None'}`);
      });
    }
    
    if (context.recentChanges.length > 0) {
      console.log('\n📝 Recent Changes:');
      context.recentChanges.forEach((change, i) => {
        console.log(`  ${i + 1}. ${change.type} (${change.timestamp})`);
        console.log(`     URL: ${change.url}`);
        if (change.element) {
          console.log(`     Element: ${change.element.selector}`);
          console.log(`     Tag: ${change.element.tagName}`);
          if (change.element.text) {
            console.log(`     Text: "${change.element.text.slice(0, 50)}..."`);
          }
        }
        if (change.styles) {
          console.log(`     Styles: ${JSON.stringify(change.styles, null, 8)}`);
        }
      });
    }
    
    // Get detailed activity
    const activityResponse = await fetch(`${SERVER_URL}/api/dom-editor/activity?limit=5`);
    const activity = await activityResponse.json();
    
    if (activity.changes.length > 0) {
      console.log('\n🔍 Detailed Activity:');
      activity.changes.forEach((change, i) => {
        console.log(`  ${i + 1}. ${change.type} at ${new Date(change.timestamp).toLocaleTimeString()}`);
        if (change.element) {
          console.log(`     Element: ${change.element.selector}`);
          console.log(`     Position: ${change.element.position?.width}x${change.element.position?.height}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the demo
showClaudeContext();

console.log('\n💡 How to Use:');
console.log('1. Open the DOM editor extension on any webpage');
console.log('2. Select elements and make style changes');
console.log('3. Ask Claude: "What DOM changes have I made?"');
console.log('4. Claude will see all your edits and provide targeted help');
console.log('5. Try: "Help me improve the element I just selected"');
console.log('6. Or: "Generate CSS for all my changes"');