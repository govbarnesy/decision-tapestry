import canvas from './claude-code-integration/ai-canvas-helper.mjs';

console.log('🔬 Testing multiple visuals for duplicate prevention...\n');

// Test 1: Unique visual with emoji art
console.log('1️⃣ Sending emoji art visual...');
await canvas.showHTML(`
  <div style="padding: 40px; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); border-radius: 12px; text-align: center; font-family: Arial;">
    <h2 style="color: #333; margin-bottom: 20px;">✨ Emoji Art Gallery ✨</h2>
    <div style="font-size: 48px; line-height: 1.5;">
      🎨🖼️🎭<br>
      🌈🦄🌟<br>
      🚀🌙⭐
    </div>
    <p style="color: #666; margin-top: 20px;">Each visual should appear only ONCE</p>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 1500));

// Test 2: Code snippet with line numbers
console.log('2️⃣ Sending code visual...');
await canvas.showHTML(`
  <div style="padding: 20px; background: #282c34; color: #abb2bf; border-radius: 8px; font-family: 'Consolas', monospace;">
    <h3 style="color: #61dafb; margin-bottom: 15px;">📄 No Duplicates Code</h3>
    <pre style="margin: 0; line-height: 1.5;">
<span style="color: #666;">1</span>  <span style="color: #c678dd;">const</span> <span style="color: #e06c75;">preventDuplicates</span> = (<span style="color: #e5c07b;">messages</span>) => {
<span style="color: #666;">2</span>    <span style="color: #c678dd;">const</span> <span style="color: #e06c75;">seen</span> = <span style="color: #c678dd;">new</span> <span style="color: #61dafb;">Set</span>();
<span style="color: #666;">3</span>    <span style="color: #c678dd;">return</span> messages.<span style="color: #61dafb;">filter</span>(<span style="color: #e5c07b;">msg</span> => {
<span style="color: #666;">4</span>      <span style="color: #c678dd;">const</span> <span style="color: #e06c75;">key</span> = <span style="color: #98c379;">\`\${msg.type}-\${msg.content}\`</span>;
<span style="color: #666;">5</span>      <span style="color: #c678dd;">if</span> (seen.<span style="color: #61dafb;">has</span>(key)) <span style="color: #c678dd;">return</span> <span style="color: #d19a66;">false</span>;
<span style="color: #666;">6</span>      seen.<span style="color: #61dafb;">add</span>(key);
<span style="color: #666;">7</span>      <span style="color: #c678dd;">return</span> <span style="color: #d19a66;">true</span>;
<span style="color: #666;">8</span>    });
<span style="color: #666;">9</span>  };
    </pre>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 1500));

// Test 3: Status dashboard
console.log('3️⃣ Sending status visual...');
await canvas.showHTML(`
  <div style="padding: 30px; background: #f8f9fa; border-radius: 8px; font-family: Arial;">
    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🎯 Duplicate Prevention Status</h2>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
      <div style="background: #d4edda; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="font-size: 36px;">✅</div>
        <h3 style="color: #155724; margin: 10px 0;">Fixed</h3>
        <p style="color: #155724; margin: 0;">WebSocket Handler</p>
      </div>
      <div style="background: #d4edda; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="font-size: 36px;">✅</div>
        <h3 style="color: #155724; margin: 10px 0;">Fixed</h3>
        <p style="color: #155724; margin: 0;">History Addition</p>
      </div>
      <div style="background: #cce5ff; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="font-size: 36px;">🔍</div>
        <h3 style="color: #004085; margin: 10px 0;">Testing</h3>
        <p style="color: #004085; margin: 0;">Gallery View</p>
      </div>
      <div style="background: #cce5ff; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="font-size: 36px;">📊</div>
        <h3 style="color: #004085; margin: 10px 0;">Monitoring</h3>
        <p style="color: #004085; margin: 0;">Visual Count</p>
      </div>
    </div>
    <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 4px; text-align: center;">
      <strong>Test Time:</strong> ${new Date().toLocaleTimeString()}
    </div>
  </div>
`);

console.log('\n✅ Test complete! You should see:');
console.log('   - 3 unique visuals in the AI Canvas');
console.log('   - No duplicates in the gallery view (press G)');
console.log('   - Each visual appearing only once');