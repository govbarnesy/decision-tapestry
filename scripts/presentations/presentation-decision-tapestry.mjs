import canvas from './claude-code-integration/ai-canvas-helper.mjs';

console.log('🎯 Creating Decision Tapestry Feature Presentation...\n');

// Slide 1: Title Slide
console.log('Creating slide 1/10: Title...');
await canvas.showHTML(`
  <div style="padding: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; font-family: Arial; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center;">
    <h1 style="font-size: 48px; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
      🎯 Decision Tapestry
    </h1>
    <h2 style="font-size: 28px; font-weight: 300; margin-bottom: 40px; opacity: 0.9;">
      Visual Decision Management for Modern Development
    </h2>
    <div style="font-size: 18px; opacity: 0.8;">
      Navigate with arrow keys • Press G for gallery view • Press H for help
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 2: What is Decision Tapestry?
console.log('Creating slide 2/10: Overview...');
await canvas.showHTML(`
  <div style="padding: 40px; background: #f8f9fa; border-radius: 12px; font-family: Arial;">
    <h2 style="color: #333; margin-bottom: 30px; text-align: center;">What is Decision Tapestry?</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center;">
      <div>
        <p style="font-size: 18px; line-height: 1.8; color: #555; margin-bottom: 20px;">
          Decision Tapestry is a <strong>visual decision tracking system</strong> that integrates with your development workflow to:
        </p>
        <ul style="font-size: 16px; line-height: 2; color: #666;">
          <li>📊 Track architectural decisions visually</li>
          <li>🔄 Connect decisions to code changes</li>
          <li>👥 Coordinate team activities in real-time</li>
          <li>📈 Analyze development patterns</li>
          <li>🤖 Enable AI-assisted development</li>
        </ul>
      </div>
      <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 30px; border-radius: 8px; text-align: center;">
        <div style="font-size: 72px; margin-bottom: 20px;">🧩</div>
        <p style="font-size: 18px; color: #1976d2; font-weight: bold;">
          "Every decision is a thread in your project's tapestry"
        </p>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 3: Core Features - Decision Map
console.log('Creating slide 3/10: Decision Map...');
await canvas.showHTML(`
  <div style="padding: 40px; background: #1a1a2e; color: white; border-radius: 12px; font-family: Arial;">
    <h2 style="text-align: center; color: #f39c12; margin-bottom: 30px;">🗺️ Interactive Decision Map</h2>
    
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 30px;">
      <div>
        <svg width="100%" height="300" viewBox="0 0 500 300">
          <!-- Decision nodes -->
          <circle cx="100" cy="100" r="30" fill="#e74c3c" opacity="0.8"/>
          <text x="100" y="105" text-anchor="middle" fill="white" font-size="12">Auth</text>
          
          <circle cx="250" cy="100" r="30" fill="#3498db" opacity="0.8"/>
          <text x="250" y="105" text-anchor="middle" fill="white" font-size="12">API</text>
          
          <circle cx="400" cy="100" r="30" fill="#2ecc71" opacity="0.8"/>
          <text x="400" y="105" text-anchor="middle" fill="white" font-size="12">UI</text>
          
          <circle cx="175" cy="200" r="30" fill="#f39c12" opacity="0.8"/>
          <text x="175" y="205" text-anchor="middle" fill="white" font-size="12">DB</text>
          
          <circle cx="325" cy="200" r="30" fill="#9b59b6" opacity="0.8"/>
          <text x="325" y="205" text-anchor="middle" fill="white" font-size="12">Cache</text>
          
          <!-- Connections -->
          <line x1="130" y1="100" x2="220" y2="100" stroke="#666" stroke-width="2"/>
          <line x1="280" y1="100" x2="370" y2="100" stroke="#666" stroke-width="2"/>
          <line x1="115" y1="125" x2="160" y2="175" stroke="#666" stroke-width="2"/>
          <line x1="250" y1="130" x2="250" y2="170" stroke="#666" stroke-width="2" stroke-dasharray="5,5"/>
          <line x1="265" y1="125" x2="310" y2="175" stroke="#666" stroke-width="2"/>
          
          <!-- Active indicator -->
          <circle cx="250" cy="100" r="35" fill="none" stroke="#00ff00" stroke-width="3" opacity="0.6">
            <animate attributeName="r" values="35;40;35" dur="2s" repeatCount="indefinite"/>
          </circle>
        </svg>
      </div>
      
      <div style="background: #0f1419; padding: 20px; border-radius: 8px;">
        <h3 style="color: #f39c12; margin-bottom: 15px;">Key Features:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">✓ Visual decision hierarchy</li>
          <li style="margin-bottom: 10px;">✓ Real-time activity indicators</li>
          <li style="margin-bottom: 10px;">✓ Dependency tracking</li>
          <li style="margin-bottom: 10px;">✓ Status visualization</li>
          <li style="margin-bottom: 10px;">✓ Quick navigation</li>
        </ul>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 4: Git Integration
console.log('Creating slide 4/10: Git Integration...');
await canvas.showHTML(`
  <div style="padding: 40px; background: linear-gradient(135deg, #24292e 0%, #40474f 100%); color: white; border-radius: 12px; font-family: Arial;">
    <h2 style="text-align: center; margin-bottom: 30px;">🔗 Deep Git Integration</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
        <h3 style="color: #58a6ff; margin-bottom: 15px;">📊 Commit Tracking</h3>
        <div style="background: #161b22; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 14px;">
          <div style="color: #7ee83f;">+ decision: implement-oauth</div>
          <div style="color: #7ee83f;">+ files: 12 changed</div>
          <div style="color: #7ee83f;">+ insertions: 342</div>
          <div style="color: #ffa657;">~ author: john.doe</div>
          <div style="color: #a5d6ff;">→ linked to decision #42</div>
        </div>
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
        <h3 style="color: #58a6ff; margin-bottom: 15px;">🔄 Branch Analysis</h3>
        <div style="background: #161b22; padding: 15px; border-radius: 4px;">
          <div style="margin-bottom: 10px;">
            <span style="color: #7ee83f;">● main</span>
            <span style="color: #666; margin-left: 10px;">stable</span>
          </div>
          <div style="margin-bottom: 10px;">
            <span style="color: #ffa657;">● feature/auth</span>
            <span style="color: #666; margin-left: 10px;">+45 commits</span>
          </div>
          <div>
            <span style="color: #f85149;">● hotfix/security</span>
            <span style="color: #666; margin-left: 10px;">urgent</span>
          </div>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 20px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; text-align: center;">
      <p style="font-size: 18px; margin: 0;">
        Automatically links commits to decisions • Tracks file changes • Analyzes development patterns
      </p>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 5: Real-time Activity Tracking
console.log('Creating slide 5/10: Activity Tracking...');
await canvas.showHTML(`
  <div style="padding: 40px; background: #fff; border-radius: 12px; font-family: Arial;">
    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">⚡ Real-time Activity Tracking</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
      <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <div style="width: 12px; height: 12px; background: #4caf50; border-radius: 50%; margin-right: 10px; animation: pulse 2s infinite;"></div>
          <strong>Sarah Chen</strong>
        </div>
        <div style="color: #666;">Working on: Authentication Module</div>
        <div style="color: #999; font-size: 14px; margin-top: 5px;">src/auth/oauth-provider.js</div>
      </div>
      
      <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <div style="width: 12px; height: 12px; background: #ff9800; border-radius: 50%; margin-right: 10px; animation: pulse 2s infinite;"></div>
          <strong>Mike Johnson</strong>
        </div>
        <div style="color: #666;">Debugging: API Response Handler</div>
        <div style="color: #999; font-size: 14px; margin-top: 5px;">server/api/handlers.js</div>
      </div>
      
      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <div style="width: 12px; height: 12px; background: #2196f3; border-radius: 50%; margin-right: 10px; animation: pulse 2s infinite;"></div>
          <strong>AI Agent</strong>
        </div>
        <div style="color: #666;">Testing: Unit Test Suite</div>
        <div style="color: #999; font-size: 14px; margin-top: 5px;">__tests__/auth.test.js</div>
      </div>
      
      <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #9c27b0;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <div style="width: 12px; height: 12px; background: #9c27b0; border-radius: 50%; margin-right: 10px; animation: pulse 2s infinite;"></div>
          <strong>Lisa Wang</strong>
        </div>
        <div style="color: #666;">Reviewing: Pull Request #234</div>
        <div style="color: #999; font-size: 14px; margin-top: 5px;">feature/oauth-integration</div>
      </div>
    </div>
    
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center;">
      <h3 style="color: #666; margin-bottom: 10px;">Activity Timeline</h3>
      <div style="display: flex; gap: 5px; justify-content: center;">
        ${Array(24).fill(0).map((_, i) => {
          const height = Math.random() * 40 + 10;
          const color = height > 35 ? '#4caf50' : height > 25 ? '#2196f3' : '#e0e0e0';
          return `<div style="width: 20px; height: ${height}px; background: ${color}; border-radius: 2px;"></div>`;
        }).join('')}
      </div>
      <div style="color: #999; font-size: 14px; margin-top: 10px;">Last 24 hours</div>
    </div>
    
    <style>
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
      }
    </style>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 6: AI-Powered Features
console.log('Creating slide 6/10: AI Features...');
await canvas.showHTML(`
  <div style="padding: 40px; background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%); color: white; border-radius: 12px; font-family: Arial;">
    <h2 style="text-align: center; margin-bottom: 30px;">🤖 AI-Powered Development</h2>
    
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
      <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 8px; backdrop-filter: blur(10px);">
        <h3 style="color: #00d9ff; margin-bottom: 15px;">🎨 AI Canvas</h3>
        <p style="line-height: 1.6;">Visual communication system for AI agents to create diagrams, charts, and explanations in real-time.</p>
        <div style="margin-top: 15px; padding: 10px; background: rgba(0,217,255,0.2); border-radius: 4px; font-size: 14px;">
          <code>→ Architecture diagrams<br>→ Code comparisons<br>→ Progress tracking</code>
        </div>
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 8px; backdrop-filter: blur(10px);">
        <h3 style="color: #ff6b6b; margin-bottom: 15px;">🧠 Smart Analytics</h3>
        <p style="line-height: 1.6;">AI-driven insights that identify patterns, suggest optimizations, and predict project bottlenecks.</p>
        <div style="margin-top: 15px; padding: 10px; background: rgba(255,107,107,0.2); border-radius: 4px; font-size: 14px;">
          <code>→ Pattern detection<br>→ Risk analysis<br>→ Performance insights</code>
        </div>
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 8px; backdrop-filter: blur(10px);">
        <h3 style="color: #feca57; margin-bottom: 15px;">🔮 Decision Inference</h3>
        <p style="line-height: 1.6;">Automatically suggests and links decisions based on code changes and development patterns.</p>
        <div style="margin-top: 15px; padding: 10px; background: rgba(254,202,87,0.2); border-radius: 4px; font-size: 14px;">
          <code>→ Auto-linking commits<br>→ Decision suggestions<br>→ Impact analysis</code>
        </div>
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 8px; backdrop-filter: blur(10px);">
        <h3 style="color: #48dbfb; margin-bottom: 15px;">👥 Multi-Agent Coordination</h3>
        <p style="line-height: 1.6;">Orchestrate multiple AI agents working on different aspects of your project simultaneously.</p>
        <div style="margin-top: 15px; padding: 10px; background: rgba(72,219,251,0.2); border-radius: 4px; font-size: 14px;">
          <code>→ Parallel development<br>→ Task distribution<br>→ Conflict resolution</code>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 7: Analytics Dashboard
console.log('Creating slide 7/10: Analytics...');
await canvas.showHTML(`
  <div style="padding: 40px; background: #f8f9fa; border-radius: 12px; font-family: Arial;">
    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">📊 Comprehensive Analytics</h2>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
      <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="font-size: 32px; font-weight: bold; color: #3498db;">1,247</div>
        <div style="color: #666; margin-top: 5px;">Total Decisions</div>
        <div style="color: #27ae60; font-size: 14px; margin-top: 5px;">↑ 12% this month</div>
      </div>
      <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="font-size: 32px; font-weight: bold; color: #e74c3c;">3.2</div>
        <div style="color: #666; margin-top: 5px;">Avg Days to Complete</div>
        <div style="color: #27ae60; font-size: 14px; margin-top: 5px;">↓ 18% improvement</div>
      </div>
      <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="font-size: 32px; font-weight: bold; color: #f39c12;">94%</div>
        <div style="color: #666; margin-top: 5px;">Decision Success Rate</div>
        <div style="color: #666; font-size: 14px; margin-top: 5px;">→ Stable</div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color: #333; margin-bottom: 15px;">Decision Velocity Over Time</h3>
        <div style="height: 200px; display: flex; align-items: flex-end; gap: 5px;">
          ${[65, 72, 68, 85, 92, 78, 95, 88, 102, 98, 110, 105].map(height => 
            `<div style="flex: 1; background: linear-gradient(to top, #3498db, #5dade2); height: ${height}%; border-radius: 4px 4px 0 0;"></div>`
          ).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; color: #666;">
          <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
          <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
        </div>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color: #333; margin-bottom: 15px;">Top Contributors</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>👤 Sarah Chen</span>
            <span style="color: #3498db; font-weight: bold;">234</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>👤 Mike Johnson</span>
            <span style="color: #3498db; font-weight: bold;">189</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>🤖 AI Agent-1</span>
            <span style="color: #3498db; font-weight: bold;">156</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>👤 Lisa Wang</span>
            <span style="color: #3498db; font-weight: bold;">142</span>
          </div>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 8: Team Collaboration
console.log('Creating slide 8/10: Collaboration...');
await canvas.showHTML(`
  <div style="padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; font-family: Arial;">
    <h2 style="text-align: center; margin-bottom: 30px;">👥 Enhanced Team Collaboration</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
      <div>
        <h3 style="margin-bottom: 20px;">🔄 Real-time Synchronization</h3>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
          <div style="margin-bottom: 15px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div style="width: 8px; height: 8px; background: #00ff00; border-radius: 50%;"></div>
              <strong>Live Updates</strong>
            </div>
            <p style="font-size: 14px; opacity: 0.9; margin-left: 18px;">See team changes instantly via WebSocket</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div style="width: 8px; height: 8px; background: #00ff00; border-radius: 50%;"></div>
              <strong>Conflict Prevention</strong>
            </div>
            <p style="font-size: 14px; opacity: 0.9; margin-left: 18px;">Visual indicators show who's working where</p>
          </div>
          
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div style="width: 8px; height: 8px; background: #00ff00; border-radius: 50%;"></div>
              <strong>Activity Timeline</strong>
            </div>
            <p style="font-size: 14px; opacity: 0.9; margin-left: 18px;">Track all team actions chronologically</p>
          </div>
        </div>
      </div>
      
      <div>
        <h3 style="margin-bottom: 20px;">💬 Communication Features</h3>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 4px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>📝 Decision Comments</span>
              <span style="background: #00ff00; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 12px;">Active</span>
            </div>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 4px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>🔔 Smart Notifications</span>
              <span style="background: #00ff00; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 12px;">Active</span>
            </div>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>🎯 @Mentions</span>
              <span style="background: #ffd700; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 12px;">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 30px; text-align: center; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
      <p style="font-size: 18px; margin: 0;">
        "Decision Tapestry reduced our coordination overhead by 60%" - Tech Lead, Fortune 500
      </p>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 9: Getting Started
console.log('Creating slide 9/10: Getting Started...');
await canvas.showHTML(`
  <div style="padding: 40px; background: #2d3436; color: white; border-radius: 12px; font-family: Arial;">
    <h2 style="text-align: center; color: #00d9ff; margin-bottom: 30px;">🚀 Getting Started</h2>
    
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border-left: 4px solid #00d9ff;">
        <h3 style="color: #00d9ff; margin-bottom: 10px;">1. Installation</h3>
        <pre style="background: #000; padding: 15px; border-radius: 4px; font-family: monospace; overflow-x: auto;">
<span style="color: #7ee83f;">git clone</span> https://github.com/your-org/decision-tapestry
<span style="color: #7ee83f;">cd</span> decision-tapestry
<span style="color: #7ee83f;">npm install</span>
<span style="color: #7ee83f;">npm start</span></pre>
      </div>
      
      <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border-left: 4px solid #ffd700;">
        <h3 style="color: #ffd700; margin-bottom: 10px;">2. Create Your First Decision</h3>
        <pre style="background: #000; padding: 15px; border-radius: 4px; font-family: monospace;">
<span style="color: #7ee83f;">decision-tapestry add</span> <span style="color: #a5d6ff;">"Implement user authentication"</span> \\
  <span style="color: #ffa657;">--components</span> src/auth \\
  <span style="color: #ffa657;">--status</span> proposed</pre>
      </div>
      
      <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b6b;">
        <h3 style="color: #ff6b6b; margin-bottom: 10px;">3. Enable Activity Tracking</h3>
        <pre style="background: #000; padding: 15px; border-radius: 4px; font-family: monospace;">
<span style="color: #7ee83f;">decision-tapestry activity start</span> <span style="color: #a5d6ff;">"Working on auth module"</span>
<span style="color: #969896;"># Your activities now appear in real-time on the dashboard!</span></pre>
      </div>
      
      <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border-left: 4px solid #48dbfb;">
        <h3 style="color: #48dbfb; margin-bottom: 10px;">4. View the Dashboard</h3>
        <p style="margin: 0;">Open <code style="background: #000; padding: 2px 6px; border-radius: 3px;">http://localhost:8080</code> to see your decision map, activity timeline, and analytics!</p>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 10: Summary & Call to Action
console.log('Creating slide 10/10: Summary...');
await canvas.showHTML(`
  <div style="padding: 60px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; border-radius: 12px; font-family: Arial; text-align: center;">
    <h2 style="font-size: 36px; margin-bottom: 30px;">Transform Your Development Workflow</h2>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px;">
      <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 8px; backdrop-filter: blur(10px);">
        <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
        <h3 style="margin-bottom: 10px;">Visualize</h3>
        <p style="font-size: 14px; opacity: 0.9;">See your entire project's decision landscape at a glance</p>
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 8px; backdrop-filter: blur(10px);">
        <div style="font-size: 48px; margin-bottom: 15px;">🤝</div>
        <h3 style="margin-bottom: 10px;">Collaborate</h3>
        <p style="font-size: 14px; opacity: 0.9;">Work seamlessly with your team in real-time</p>
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 8px; backdrop-filter: blur(10px);">
        <div style="font-size: 48px; margin-bottom: 15px;">🚀</div>
        <h3 style="margin-bottom: 10px;">Accelerate</h3>
        <p style="font-size: 14px; opacity: 0.9;">Ship faster with AI-powered development insights</p>
      </div>
    </div>
    
    <div style="background: rgba(255,255,255,0.2); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
      <h3 style="font-size: 24px; margin-bottom: 20px;">Ready to Get Started?</h3>
      <div style="display: flex; gap: 20px; justify-content: center;">
        <div style="background: #00d9ff; color: #000; padding: 15px 30px; border-radius: 4px; font-weight: bold; cursor: pointer;">
          Try Demo
        </div>
        <div style="background: transparent; border: 2px solid #00d9ff; padding: 15px 30px; border-radius: 4px; font-weight: bold; cursor: pointer;">
          View Docs
        </div>
      </div>
    </div>
    
    <p style="font-size: 18px; opacity: 0.8;">
      Join hundreds of teams already using Decision Tapestry
    </p>
  </div>
`);

console.log('\n✨ Decision Tapestry presentation complete!');
console.log('\n📚 Navigation Guide:');
console.log('   • Use ← → to navigate slides');
console.log('   • Press numbers 1-9 or 0 for slide 10');
console.log('   • Press G to see all slides in gallery view');
console.log('   • Press F for fullscreen presentation mode');
console.log('   • Press H for keyboard shortcuts help');
console.log('\nEnjoy the presentation!');