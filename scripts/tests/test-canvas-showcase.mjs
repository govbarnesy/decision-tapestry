import canvas from './claude-code-integration/ai-canvas-helper.mjs';

console.log('🎨 Creating AI Canvas Showcase...\n');

// Test 1: Interactive Dashboard
console.log('1️⃣ Creating interactive dashboard...');
await canvas.showHTML(`
  <div style="padding: 30px; background: #1a1a2e; color: #eee; border-radius: 12px; font-family: Arial;">
    <h2 style="text-align: center; color: #f39c12; margin-bottom: 30px;">📊 Decision Tapestry Analytics</h2>
    
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
      <div style="background: #16213e; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #0f3460;">
        <div style="font-size: 36px; font-weight: bold; color: #e94560;">152</div>
        <div style="color: #888; margin-top: 5px;">Active Decisions</div>
      </div>
      <div style="background: #16213e; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #0f3460;">
        <div style="font-size: 36px; font-weight: bold; color: #0f3460;">89%</div>
        <div style="color: #888; margin-top: 5px;">Completion Rate</div>
      </div>
      <div style="background: #16213e; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #0f3460;">
        <div style="font-size: 36px; font-weight: bold; color: #f39c12;">23</div>
        <div style="color: #888; margin-top: 5px;">Active Agents</div>
      </div>
      <div style="background: #16213e; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #0f3460;">
        <div style="font-size: 36px; font-weight: bold; color: #00d9ff;">1.2k</div>
        <div style="color: #888; margin-top: 5px;">Git Commits</div>
      </div>
    </div>
    
    <div style="background: #16213e; padding: 20px; border-radius: 8px; border: 2px solid #0f3460;">
      <h3 style="color: #f39c12; margin-bottom: 15px;">🔥 Hot Decisions This Week</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #0f3460; border-radius: 4px;">
          <span>🚀 Implement AI Canvas</span>
          <span style="color: #00d9ff;">+42 commits</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #0f3460; border-radius: 4px;">
          <span>🔧 Refactor Agent System</span>
          <span style="color: #00d9ff;">+38 commits</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #0f3460; border-radius: 4px;">
          <span>📊 Add Analytics Dashboard</span>
          <span style="color: #00d9ff;">+27 commits</span>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 2000));

// Test 2: Visual Git Diff
console.log('2️⃣ Creating visual git diff...');
await canvas.showHTML(`
  <div style="padding: 20px; background: #fafbfc; border-radius: 8px; font-family: 'Monaco', monospace;">
    <h3 style="color: #24292e; margin-bottom: 20px; font-family: Arial;">
      📝 Changes in ai-canvas.mjs
    </h3>
    
    <div style="background: #f6f8fa; padding: 10px; border: 1px solid #d1d5da; border-radius: 4px; margin-bottom: 10px;">
      <span style="color: #6a737d;">@@ -46,7 +46,45 @@ setupKeyboardListeners() {</span>
    </div>
    
    <div style="font-size: 13px; line-height: 1.5;">
      <div style="background: #ffeef0; padding: 2px 10px; margin: 2px 0;">
        <span style="color: #cb2431;">-    // Add keyboard navigation</span>
      </div>
      <div style="background: #e6ffed; padding: 2px 10px; margin: 2px 0;">
        <span style="color: #22863a;">+    // Add comprehensive keyboard navigation</span>
      </div>
      <div style="padding: 2px 10px; margin: 2px 0;">
        <span style="color: #24292e;">     document.addEventListener('keydown', (e) => {</span>
      </div>
      <div style="background: #e6ffed; padding: 2px 10px; margin: 2px 0;">
        <span style="color: #22863a;">+      // Only handle if AI Canvas is visible</span>
      </div>
      <div style="background: #e6ffed; padding: 2px 10px; margin: 2px 0;">
        <span style="color: #22863a;">+      if (!this.classList.contains('active')) return;</span>
      </div>
      <div style="background: #e6ffed; padding: 2px 10px; margin: 2px 0;">
        <span style="color: #22863a;">+      </span>
      </div>
      <div style="background: #e6ffed; padding: 2px 10px; margin: 2px 0;">
        <span style="color: #22863a;">+      switch(e.key) {</span>
      </div>
      <div style="background: #e6ffed; padding: 2px 10px; margin: 2px 0;">
        <span style="color: #22863a;">+        case 'ArrowLeft':</span>
      </div>
      <div style="background: #e6ffed; padding: 2px 10px; margin: 2px 0;">
        <span style="color: #22863a;">+        case 'a':</span>
      </div>
      <div style="background: #e6ffed; padding: 2px 10px; margin: 2px 0;">
        <span style="color: #22863a;">+          this.navigatePrevious();</span>
      </div>
      <div style="background: #e6ffed; padding: 2px 10px; margin: 2px 0;">
        <span style="color: #22863a;">+          break;</span>
      </div>
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background: #f1f8ff; border: 1px solid #c8e1ff; border-radius: 4px;">
      <strong style="color: #0366d6;">Summary:</strong> Added 39 lines of keyboard navigation code
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 2000));

// Test 3: System Architecture Flow
console.log('3️⃣ Creating system flow diagram...');
await canvas.showHTML(`
  <div style="padding: 30px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); border-radius: 12px;">
    <h2 style="text-align: center; color: white; margin-bottom: 30px;">🏗️ Decision Tapestry Architecture</h2>
    
    <svg width="100%" height="400" viewBox="0 0 800 400" style="background: rgba(255,255,255,0.05); border-radius: 8px;">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#00d9ff" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- User Layer -->
      <rect x="50" y="50" width="150" height="60" rx="8" fill="#3498db" filter="url(#glow)" />
      <text x="125" y="85" text-anchor="middle" fill="white" font-size="16" font-weight="bold">User</text>
      
      <!-- Dashboard -->
      <rect x="300" y="50" width="150" height="60" rx="8" fill="#e74c3c" filter="url(#glow)" />
      <text x="375" y="85" text-anchor="middle" fill="white" font-size="16" font-weight="bold">Dashboard</text>
      
      <!-- AI Canvas -->
      <rect x="550" y="50" width="150" height="60" rx="8" fill="#f39c12" filter="url(#glow)" />
      <text x="625" y="85" text-anchor="middle" fill="white" font-size="16" font-weight="bold">AI Canvas</text>
      
      <!-- Server -->
      <rect x="300" y="180" width="150" height="60" rx="8" fill="#9b59b6" filter="url(#glow)" />
      <text x="375" y="215" text-anchor="middle" fill="white" font-size="16" font-weight="bold">Server</text>
      
      <!-- Decision Engine -->
      <rect x="175" y="310" width="150" height="60" rx="8" fill="#1abc9c" filter="url(#glow)" />
      <text x="250" y="345" text-anchor="middle" fill="white" font-size="16" font-weight="bold">Decision Engine</text>
      
      <!-- Git Integration -->
      <rect x="425" y="310" width="150" height="60" rx="8" fill="#34495e" filter="url(#glow)" />
      <text x="500" y="345" text-anchor="middle" fill="white" font-size="16" font-weight="bold">Git Integration</text>
      
      <!-- Arrows -->
      <line x1="200" y1="80" x2="300" y2="80" stroke="#00d9ff" stroke-width="2" marker-end="url(#arrowhead)" />
      <line x1="450" y1="80" x2="550" y2="80" stroke="#00d9ff" stroke-width="2" marker-end="url(#arrowhead)" />
      <line x1="375" y1="110" x2="375" y2="180" stroke="#00d9ff" stroke-width="2" marker-end="url(#arrowhead)" />
      <line x1="325" y1="240" x2="275" y2="310" stroke="#00d9ff" stroke-width="2" marker-end="url(#arrowhead)" />
      <line x1="425" y1="240" x2="475" y2="310" stroke="#00d9ff" stroke-width="2" marker-end="url(#arrowhead)" />
      
      <!-- Labels -->
      <text x="250" y="70" text-anchor="middle" fill="#00d9ff" font-size="12">HTTP</text>
      <text x="500" y="70" text-anchor="middle" fill="#00d9ff" font-size="12">WebSocket</text>
      <text x="390" y="150" text-anchor="middle" fill="#00d9ff" font-size="12">API</text>
    </svg>
    
    <div style="margin-top: 20px; text-align: center; color: #00d9ff; font-style: italic;">
      Real-time visual communication powered by WebSockets
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 2000));

// Test 4: Code Performance Comparison
console.log('4️⃣ Creating performance comparison...');
await canvas.showHTML(`
  <div style="padding: 30px; background: #2d2d2d; color: #fff; border-radius: 12px; font-family: Arial;">
    <h2 style="text-align: center; color: #61dafb; margin-bottom: 30px;">⚡ Performance Optimization Results</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
      <div>
        <h3 style="color: #ff6b6b; margin-bottom: 15px;">❌ Before Optimization</h3>
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b6b;">
          <div style="margin-bottom: 15px;">
            <div style="color: #888; font-size: 14px;">Render Time</div>
            <div style="font-size: 24px; color: #ff6b6b;">450ms</div>
          </div>
          <div style="margin-bottom: 15px;">
            <div style="color: #888; font-size: 14px;">Memory Usage</div>
            <div style="font-size: 24px; color: #ff6b6b;">128MB</div>
          </div>
          <div>
            <div style="color: #888; font-size: 14px;">Bundle Size</div>
            <div style="font-size: 24px; color: #ff6b6b;">2.4MB</div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 style="color: #51cf66; margin-bottom: 15px;">✅ After Optimization</h3>
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border-left: 4px solid #51cf66;">
          <div style="margin-bottom: 15px;">
            <div style="color: #888; font-size: 14px;">Render Time</div>
            <div style="font-size: 24px; color: #51cf66;">120ms <span style="font-size: 14px; color: #888;">(-73%)</span></div>
          </div>
          <div style="margin-bottom: 15px;">
            <div style="color: #888; font-size: 14px;">Memory Usage</div>
            <div style="font-size: 24px; color: #51cf66;">45MB <span style="font-size: 14px; color: #888;">(-65%)</span></div>
          </div>
          <div>
            <div style="color: #888; font-size: 14px;">Bundle Size</div>
            <div style="font-size: 24px; color: #51cf66;">890KB <span style="font-size: 14px; color: #888;">(-63%)</span></div>
          </div>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 30px;">
      <h4 style="color: #61dafb; margin-bottom: 10px;">📈 Performance Timeline</h4>
      <div style="background: #1a1a1a; padding: 15px; border-radius: 8px;">
        <div style="display: flex; gap: 10px; align-items: flex-end; height: 100px;">
          <div style="flex: 1; background: #ff6b6b; height: 100%; border-radius: 4px 4px 0 0;"></div>
          <div style="flex: 1; background: #ff8c42; height: 85%; border-radius: 4px 4px 0 0;"></div>
          <div style="flex: 1; background: #ffd166; height: 60%; border-radius: 4px 4px 0 0;"></div>
          <div style="flex: 1; background: #06ffa5; height: 40%; border-radius: 4px 4px 0 0;"></div>
          <div style="flex: 1; background: #51cf66; height: 27%; border-radius: 4px 4px 0 0;"></div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 5px; font-size: 12px; color: #666;">
          <div style="flex: 1; text-align: center;">v1.0</div>
          <div style="flex: 1; text-align: center;">v1.1</div>
          <div style="flex: 1; text-align: center;">v1.2</div>
          <div style="flex: 1; text-align: center;">v1.3</div>
          <div style="flex: 1; text-align: center;">v1.4</div>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 2000));

// Test 5: Task Management Board
console.log('5️⃣ Creating task board...');
await canvas.showHTML(`
  <div style="padding: 20px; background: #f5f5f5; border-radius: 12px; font-family: Arial;">
    <h2 style="text-align: center; color: #333; margin-bottom: 30px;">📋 Current Sprint Tasks</h2>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
      <div style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color: #e74c3c; margin-bottom: 15px; font-size: 16px;">🔴 To Do</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="background: #fff3cd; padding: 10px; border-radius: 4px; border-left: 3px solid #ffc107;">
            <div style="font-weight: bold; margin-bottom: 5px;">Add Export Feature</div>
            <div style="font-size: 12px; color: #666;">Export canvas visuals as images</div>
            <div style="margin-top: 5px;">
              <span style="background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 3px; font-size: 11px;">enhancement</span>
            </div>
          </div>
          <div style="background: #fff3cd; padding: 10px; border-radius: 4px; border-left: 3px solid #ffc107;">
            <div style="font-weight: bold; margin-bottom: 5px;">Mobile Responsive</div>
            <div style="font-size: 12px; color: #666;">Optimize for mobile devices</div>
            <div style="margin-top: 5px;">
              <span style="background: #f3e5f5; color: #7b1fa2; padding: 2px 6px; border-radius: 3px; font-size: 11px;">ui/ux</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color: #f39c12; margin-bottom: 15px; font-size: 16px;">🟡 In Progress</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="background: #cfe2ff; padding: 10px; border-radius: 4px; border-left: 3px solid #0d6efd;">
            <div style="font-weight: bold; margin-bottom: 5px;">Keyboard Navigation</div>
            <div style="font-size: 12px; color: #666;">Add comprehensive shortcuts</div>
            <div style="margin-top: 5px;">
              <span style="background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 3px; font-size: 11px;">feature</span>
              <span style="background: #f8d7da; color: #721c24; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 4px;">priority</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color: #27ae60; margin-bottom: 15px; font-size: 16px;">🟢 Done</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="background: #d4edda; padding: 10px; border-radius: 4px; border-left: 3px solid #28a745; opacity: 0.8;">
            <div style="font-weight: bold; margin-bottom: 5px; text-decoration: line-through;">Fix Duplicates</div>
            <div style="font-size: 12px; color: #666;">Prevent duplicate messages</div>
            <div style="margin-top: 5px;">
              <span style="background: #f8d7da; color: #721c24; padding: 2px 6px; border-radius: 3px; font-size: 11px;">bug</span>
            </div>
          </div>
          <div style="background: #d4edda; padding: 10px; border-radius: 4px; border-left: 3px solid #28a745; opacity: 0.8;">
            <div style="font-weight: bold; margin-bottom: 5px; text-decoration: line-through;">Create AI Canvas</div>
            <div style="font-size: 12px; color: #666;">Visual communication system</div>
            <div style="margin-top: 5px;">
              <span style="background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 3px; font-size: 11px;">feature</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 20px; text-align: center; color: #666; font-size: 14px;">
      Sprint Progress: 40% Complete | 3 days remaining
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 2000));

// Test 6: Error Debugging Helper
console.log('6️⃣ Creating error debugging visual...');
await canvas.showHTML(`
  <div style="padding: 30px; background: #fee; border: 2px solid #fcc; border-radius: 12px; font-family: 'Consolas', monospace;">
    <h2 style="color: #c00; margin-bottom: 20px; font-family: Arial;">🐛 Debugging Assistant</h2>
    
    <div style="background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #fcc;">
      <h3 style="color: #c00; margin-bottom: 10px; font-size: 16px;">Error Details:</h3>
      <pre style="margin: 0; color: #333; font-size: 13px;">TypeError: Cannot read property 'classList' of null
  at AICanvas.setupKeyboardListeners (ai-canvas.mjs:50:18)
  at AICanvas.connectedCallback (ai-canvas.mjs:18:10)</pre>
    </div>
    
    <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #b0d4ff;">
      <h3 style="color: #0066cc; margin-bottom: 10px; font-size: 16px;">💡 Possible Causes:</h3>
      <ol style="margin: 0; padding-left: 20px; color: #333;">
        <li>Element not yet rendered when listener attached</li>
        <li>Incorrect selector or element ID</li>
        <li>Shadow DOM scoping issue</li>
      </ol>
    </div>
    
    <div style="background: #f0fff0; padding: 15px; border-radius: 8px; border: 1px solid #90ee90;">
      <h3 style="color: #008000; margin-bottom: 10px; font-size: 16px;">✅ Suggested Fix:</h3>
      <pre style="margin: 0; color: #333; font-size: 13px; background: #fff; padding: 10px; border-radius: 4px;">// Check if element exists before accessing
if (!this.classList?.contains('active')) return;

// Or use optional chaining
const isActive = this.classList?.contains('active') ?? false;</pre>
    </div>
  </div>
`);

console.log('\n✨ All test visuals created!');
console.log('\n📌 Navigation Tips:');
console.log('   • Use arrow keys or A/D to navigate between visuals');
console.log('   • Press G to see all visuals in gallery view');
console.log('   • Press numbers 1-6 to jump directly to any visual');
console.log('   • Press H for complete keyboard shortcuts help');
console.log('\nEnjoy exploring the AI Canvas!');