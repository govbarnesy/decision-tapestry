import canvas from './claude-code-integration/ai-canvas-helper.mjs';

console.log('🎨 Starting AI Canvas Test Suite...\n');

// Test 1: Colorful Architecture Diagram
console.log('1️⃣ Creating architecture diagram...');
await canvas.showHTML(`
  <div style="padding: 20px; font-family: Arial, sans-serif;">
    <h2 style="color: #333; margin-bottom: 20px;">Decision Tapestry Architecture</h2>
    <svg width="700" height="450" viewBox="0 0 700 450">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <\!-- Frontend Layer -->
      <rect x="50" y="50" width="180" height="80" rx="10" fill="url(#grad1)" />
      <text x="140" y="90" text-anchor="middle" fill="white" font-size="18" font-weight="bold">Frontend</text>
      <text x="140" y="110" text-anchor="middle" fill="white" font-size="14">React + Lit</text>
      
      <\!-- AI Canvas -->
      <rect x="260" y="50" width="180" height="80" rx="10" fill="url(#grad2)" />
      <text x="350" y="90" text-anchor="middle" fill="white" font-size="18" font-weight="bold">AI Canvas</text>
      <text x="350" y="110" text-anchor="middle" fill="white" font-size="14">Visual Layer</text>
      
      <\!-- Dashboard -->
      <rect x="470" y="50" width="180" height="80" rx="10" fill="url(#grad3)" />
      <text x="560" y="90" text-anchor="middle" fill="white" font-size="18" font-weight="bold">Dashboard</text>
      <text x="560" y="110" text-anchor="middle" fill="white" font-size="14">Control Center</text>
      
      <\!-- Connections -->
      <line x1="230" y1="90" x2="260" y2="90" stroke="#ccc" stroke-width="2" stroke-dasharray="5,5" />
      <line x1="440" y1="90" x2="470" y2="90" stroke="#ccc" stroke-width="2" stroke-dasharray="5,5" />
      
      <\!-- Server Layer -->
      <rect x="150" y="200" width="180" height="80" rx="10" fill="#ff6b6b" opacity="0.8" />
      <text x="240" y="240" text-anchor="middle" fill="white" font-size="18" font-weight="bold">Server</text>
      <text x="240" y="260" text-anchor="middle" fill="white" font-size="14">Express.js</text>
      
      <\!-- WebSocket -->
      <rect x="370" y="200" width="180" height="80" rx="10" fill="#4ecdc4" opacity="0.8" />
      <text x="460" y="240" text-anchor="middle" fill="white" font-size="18" font-weight="bold">WebSocket</text>
      <text x="460" y="260" text-anchor="middle" fill="white" font-size="14">Real-time</text>
      
      <\!-- Decision Engine -->
      <rect x="260" y="350" width="180" height="80" rx="10" fill="#95e1d3" />
      <text x="350" y="385" text-anchor="middle" fill="#333" font-size="18" font-weight="bold">Decision Engine</text>
      <text x="350" y="405" text-anchor="middle" fill="#333" font-size="14">Core Logic</text>
      
      <\!-- Vertical connections -->
      <line x1="140" y1="130" x2="240" y2="200" stroke="#ccc" stroke-width="2" />
      <line x1="350" y1="130" x2="350" y2="350" stroke="#ccc" stroke-width="2" />
      <line x1="560" y1="130" x2="460" y2="200" stroke="#ccc" stroke-width="2" />
    </svg>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 3000));

// Test 2: Code Comparison with Syntax Highlighting
console.log('2️⃣ Creating code comparison...');
await canvas.showHTML(`
  <div style="padding: 20px; font-family: 'Monaco', 'Courier New', monospace;">
    <h2 style="color: #333; margin-bottom: 20px;">Code Evolution: Data Processing</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <h3 style="color: #e74c3c; margin-bottom: 10px;">❌ Old Implementation</h3>
        <pre style="background: #f8f8f8; padding: 15px; border-radius: 4px; border-left: 4px solid #e74c3c; overflow-x: auto;">
<code style="color: #333;"><span style="color: #a71d5d;">function</span> <span style="color: #795da3;">processData</span>(<span style="color: #ed6a43;">data</span>) {
  <span style="color: #a71d5d;">let</span> result = [];
  <span style="color: #a71d5d;">for</span> (<span style="color: #a71d5d;">let</span> i = <span style="color: #0086b3;">0</span>; i < data.length; i++) {
    <span style="color: #a71d5d;">if</span> (data[i].active) {
      result.<span style="color: #795da3;">push</span>(data[i]);
    }
  }
  <span style="color: #a71d5d;">return</span> result;
}</code></pre>
      </div>
      <div>
        <h3 style="color: #27ae60; margin-bottom: 10px;">✅ New Implementation</h3>
        <pre style="background: #f8f8f8; padding: 15px; border-radius: 4px; border-left: 4px solid #27ae60; overflow-x: auto;">
<code style="color: #333;"><span style="color: #a71d5d;">const</span> <span style="color: #795da3;">processData</span> = (<span style="color: #ed6a43;">data</span>) => 
  data.<span style="color: #795da3;">filter</span>(<span style="color: #ed6a43;">item</span> => item.active);
  
<span style="color: #969896;">// 🚀 80% fewer lines</span>
<span style="color: #969896;">// ✨ More readable</span>
<span style="color: #969896;">// ⚡ Better performance</span></code></pre>
      </div>
    </div>
    <div style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 4px;">
      <strong>Benefits:</strong> Functional approach, immutable, chainable, ES6+ syntax
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 3000));

// Test 3: Interactive Progress Tracker
console.log('3️⃣ Creating progress tracker...');
await canvas.showHTML(`
  <div style="padding: 20px; font-family: Arial, sans-serif;">
    <h2 style="color: #333; margin-bottom: 20px;">🚀 Project Implementation Progress</h2>
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
      <style>
        .progress-item {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          padding: 10px;
          background: white;
          border-radius: 4px;
          transition: all 0.3s;
        }
        .progress-item:hover {
          transform: translateX(5px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .progress-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-weight: bold;
          color: white;
        }
        .completed { background: #27ae60; }
        .current { background: #3498db; animation: pulse 2s infinite; }
        .pending { background: #bdc3c7; }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
      
      <div class="progress-item">
        <div class="progress-icon completed">✓</div>
        <div>
          <strong>Initialize Project</strong>
          <div style="color: #666; font-size: 14px;">Repository setup and dependencies installed</div>
        </div>
      </div>
      
      <div class="progress-item">
        <div class="progress-icon completed">✓</div>
        <div>
          <strong>Setup AI Canvas</strong>
          <div style="color: #666; font-size: 14px;">Visual communication layer configured</div>
        </div>
      </div>
      
      <div class="progress-item">
        <div class="progress-icon current">→</div>
        <div>
          <strong>Create Visual Components</strong>
          <div style="color: #666; font-size: 14px;">Building interactive visualizations...</div>
        </div>
      </div>
      
      <div class="progress-item">
        <div class="progress-icon pending">4</div>
        <div>
          <strong>Test Integration</strong>
          <div style="color: #666; font-size: 14px;">Pending</div>
        </div>
      </div>
      
      <div class="progress-item">
        <div class="progress-icon pending">5</div>
        <div>
          <strong>Deploy to Production</strong>
          <div style="color: #666; font-size: 14px;">Pending</div>
        </div>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span><strong>Overall Progress:</strong> 60% Complete</span>
          <div style="width: 200px; height: 20px; background: #ddd; border-radius: 10px; overflow: hidden;">
            <div style="width: 60%; height: 100%; background: linear-gradient(90deg, #3498db, #2ecc71); transition: width 0.3s;"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 3000));

// Test 4: Dashboard Wireframe
console.log('4️⃣ Creating wireframe mockup...');
await canvas.showHTML(`
  <div style="padding: 20px; font-family: Arial, sans-serif;">
    <h2 style="color: #333; margin-bottom: 20px;">📱 Dashboard Wireframe</h2>
    <div style="border: 2px solid #ddd; border-radius: 8px; overflow: hidden; background: white;">
      <div style="background: #34495e; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0;">Decision Tapestry</h3>
        <div style="display: flex; gap: 15px;">
          <span style="cursor: pointer;">Home</span>
          <span style="cursor: pointer;">Decisions</span>
          <span style="cursor: pointer; background: #2c3e50; padding: 5px 10px; border-radius: 4px;">AI Canvas</span>
          <span style="cursor: pointer;">Settings</span>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 200px 1fr; height: 400px;">
        <div style="background: #ecf0f1; padding: 20px; border-right: 1px solid #ddd;">
          <h4 style="color: #7f8c8d; margin-bottom: 15px;">Navigation</h4>
          <div style="background: #3498db; color: white; padding: 10px; border-radius: 4px; margin-bottom: 10px;">Dashboard</div>
          <div style="padding: 10px; color: #7f8c8d; cursor: pointer;">Decisions</div>
          <div style="padding: 10px; color: #7f8c8d; cursor: pointer;">Activity</div>
          <div style="padding: 10px; color: #7f8c8d; cursor: pointer;">Analytics</div>
          <div style="padding: 10px; color: #7f8c8d; cursor: pointer;">Team</div>
        </div>
        
        <div style="padding: 30px;">
          <h3 style="color: #2c3e50; margin-bottom: 20px;">AI Canvas Display Area</h3>
          <div style="border: 2px dashed #bdc3c7; border-radius: 8px; height: 250px; display: flex; align-items: center; justify-content: center; background: #f8f9fa;">
            <div style="text-align: center; color: #7f8c8d;">
              <div style="font-size: 48px; margin-bottom: 10px;">🎨</div>
              <p>Visual content appears here</p>
              <p style="font-size: 14px;">Press 'G' for gallery view</p>
            </div>
          </div>
        </div>
      </div>
      
      <div style="background: #34495e; color: white; padding: 10px; text-align: center; font-size: 14px;">
        Status: Connected | Agent: Active | Last Update: Just now
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 3000));

// Test 5: Data Visualization
console.log('5️⃣ Creating data visualization...');
await canvas.showHTML(`
  <div style="padding: 20px; font-family: Arial, sans-serif;">
    <h2 style="color: #333; margin-bottom: 20px;">📊 AI Canvas Usage Analytics</h2>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="font-size: 36px; color: #3498db; font-weight: bold;">47</div>
          <div style="color: #7f8c8d;">Visuals Created</div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="font-size: 36px; color: #27ae60; font-weight: bold;">230ms</div>
          <div style="color: #7f8c8d;">Avg Response Time</div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="font-size: 36px; color: #e74c3c; font-weight: bold;">98%</div>
          <div style="color: #7f8c8d;">User Satisfaction</div>
        </div>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color: #2c3e50; margin-bottom: 15px;">Visual Types Distribution</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center;">
            <span style="width: 100px;">Diagrams</span>
            <div style="flex: 1; height: 30px; background: #ecf0f1; border-radius: 4px; overflow: hidden;">
              <div style="width: 32%; height: 100%; background: #3498db;"></div>
            </div>
            <span style="margin-left: 10px; color: #7f8c8d;">15</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="width: 100px;">Code</span>
            <div style="flex: 1; height: 30px; background: #ecf0f1; border-radius: 4px; overflow: hidden;">
              <div style="width: 26%; height: 100%; background: #27ae60;"></div>
            </div>
            <span style="margin-left: 10px; color: #7f8c8d;">12</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="width: 100px;">Wireframes</span>
            <div style="flex: 1; height: 30px; background: #ecf0f1; border-radius: 4px; overflow: hidden;">
              <div style="width: 17%; height: 100%; background: #e74c3c;"></div>
            </div>
            <span style="margin-left: 10px; color: #7f8c8d;">8</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="width: 100px;">Comparisons</span>
            <div style="flex: 1; height: 30px; background: #ecf0f1; border-radius: 4px; overflow: hidden;">
              <div style="width: 15%; height: 100%; background: #f39c12;"></div>
            </div>
            <span style="margin-left: 10px; color: #7f8c8d;">7</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="width: 100px;">Data</span>
            <div style="flex: 1; height: 30px; background: #ecf0f1; border-radius: 4px; overflow: hidden;">
              <div style="width: 11%; height: 100%; background: #9b59b6;"></div>
            </div>
            <span style="margin-left: 10px; color: #7f8c8d;">5</span>
          </div>
        </div>
      </div>
    </div>
  </div>
`);

console.log('\n✅ All test visuals created\! Check the AI Canvas tab in the dashboard.');
console.log('💡 Tip: Press "G" while viewing the canvas to see the gallery view.');
