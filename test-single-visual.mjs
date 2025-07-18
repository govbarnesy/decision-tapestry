import canvas from './claude-code-integration/ai-canvas-helper.mjs';

console.log('Testing single visual to check for duplicates...\n');

// Create a unique visual with timestamp
const timestamp = new Date().toISOString();
await canvas.showHTML(`
  <div style="padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; font-family: Arial;">
    <h2 style="margin: 0 0 10px 0;">🧪 Duplicate Test Visual</h2>
    <p>Created at: ${timestamp}</p>
    <p>If you see this message only ONCE in the gallery, the duplicate issue is fixed!</p>
  </div>
`);

console.log('✅ Visual sent. Check the AI Canvas and gallery for duplicates.');