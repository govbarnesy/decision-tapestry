import canvas from './claude-code-integration/ai-canvas-helper.mjs';

console.log('🎹 Testing Keyboard Navigation Features...\n');

// Create a series of visuals to navigate through
const visuals = [
  {
    title: '1️⃣ First Visual',
    content: `
      <div style="padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; border-radius: 12px;">
        <h1>Visual #1</h1>
        <p style="font-size: 24px; margin: 20px 0;">Use arrow keys to navigate!</p>
        <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p><strong>Try these shortcuts:</strong></p>
          <p>→ or D = Next | ← or A = Previous</p>
          <p>↑ = First | ↓ = Last</p>
          <p>1-9 = Jump to visual N</p>
        </div>
      </div>
    `
  },
  {
    title: '2️⃣ Second Visual',
    content: `
      <div style="padding: 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-align: center; border-radius: 12px;">
        <h1>Visual #2</h1>
        <p style="font-size: 24px; margin: 20px 0;">Gallery & Fullscreen</p>
        <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p>Press <strong>G</strong> to see all visuals in a grid</p>
          <p>Press <strong>F</strong> for fullscreen mode</p>
          <p>Press <strong>ESC</strong> to exit fullscreen</p>
        </div>
      </div>
    `
  },
  {
    title: '3️⃣ Third Visual',
    content: `
      <div style="padding: 40px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; text-align: center; border-radius: 12px;">
        <h1>Visual #3</h1>
        <p style="font-size: 24px; margin: 20px 0;">Quick Help</p>
        <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p>Press <strong>H</strong> or <strong>?</strong> to see all keyboard shortcuts</p>
          <p>Press <strong>C</strong> to clear all visuals</p>
          <p>The keyboard hint appears when you hover!</p>
        </div>
      </div>
    `
  },
  {
    title: '4️⃣ Fourth Visual',
    content: `
      <div style="padding: 40px; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: #333; text-align: center; border-radius: 12px;">
        <h1>Visual #4</h1>
        <p style="font-size: 24px; margin: 20px 0;">Number Navigation</p>
        <div style="background: rgba(0,0,0,0.1); padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p>Press number keys <strong>1</strong> through <strong>4</strong> to jump directly!</p>
          <p>For example: Press <strong>1</strong> to go back to the first visual</p>
          <p>This works with up to 9 visuals</p>
        </div>
      </div>
    `
  }
];

// Send all visuals
for (const [index, visual] of visuals.entries()) {
  console.log(`Creating visual ${index + 1}...`);
  await canvas.showHTML(visual.content);
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log('\n✅ Keyboard navigation test ready!');
console.log('\n📌 Quick Reference:');
console.log('   Navigation: ← → ↑ ↓ or A D Home End');
console.log('   Jump to: 1-4 (number keys)');
console.log('   Views: G (gallery), F (fullscreen)');
console.log('   Help: H or ?');
console.log('   Clear: C');
console.log('\nSwitch to the AI Canvas tab and try the shortcuts!');