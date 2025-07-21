import canvas from './claude-code-integration/ai-canvas-helper.mjs';

console.log('🏛️ Creating OpenGov AI Integration Presentation...\n');

// Slide 1: Title Slide with OpenGov Context
console.log('Creating slide 1/10: Title...');
await canvas.showHTML(`
  <div style="padding: 60px; background: linear-gradient(135deg, #003366 0%, #0066cc 100%); color: white; border-radius: 12px; font-family: Arial; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center;">
    <h1 style="font-size: 42px; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
      Decision Tapestry for OpenGov
    </h1>
    <h2 style="font-size: 26px; font-weight: 300; margin-bottom: 30px; opacity: 0.9;">
      Accelerating Your AI-Powered Government Platform Development
    </h2>
    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; margin: 20px auto; max-width: 600px;">
      <p style="font-size: 18px; margin: 0;">
        Empowering 2,000+ government entities with coordinated AI development
      </p>
    </div>
    <div style="font-size: 16px; opacity: 0.7; margin-top: 20px;">
      Prepared for OpenGov Chief Product Officer
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 2: Understanding OpenGov's Challenge
console.log('Creating slide 2/10: OpenGov Challenge...');
await canvas.showHTML(`
  <div style="padding: 40px; background: #f8f9fa; border-radius: 12px; font-family: Arial;">
    <h2 style="color: #003366; margin-bottom: 30px; text-align: center;">The OpenGov AI Integration Challenge</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
      <div>
        <h3 style="color: #0066cc; margin-bottom: 20px;">Your Current Reality</h3>
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <ul style="color: #333; line-height: 1.8;">
            <li><strong>5 Major Product Suites</strong> requiring AI integration</li>
            <li><strong>1,900 Government Clients</strong> with unique workflows</li>
            <li><strong>$1.8B Valuation</strong> with Cox backing for AI investment</li>
            <li><strong>10 Acquisitions</strong> needing technical integration</li>
            <li><strong>Legacy Systems</strong> requiring modernization</li>
          </ul>
        </div>
      </div>
      
      <div>
        <h3 style="color: #0066cc; margin-bottom: 20px;">Development Complexity</h3>
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <p style="color: #333; margin-bottom: 15px;">
            <strong>Key Challenge:</strong> How do you coordinate AI development across multiple teams, products, and acquisitions while maintaining government-grade security and compliance?
          </p>
          <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 15px;">
            <div style="color: #666; font-size: 14px;">AI Features Needed:</div>
            <ul style="margin: 10px 0 0 20px; color: #333; font-size: 14px;">
              <li>Intelligent workflow automation</li>
              <li>Predictive analytics for budgeting</li>
              <li>Smart document processing</li>
              <li>AI-powered citizen services</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 3: Decision Tapestry Solution Overview
console.log('Creating slide 3/10: Solution Overview...');
await canvas.showHTML(`
  <div style="padding: 40px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; border-radius: 12px; font-family: Arial;">
    <h2 style="text-align: center; color: #00d9ff; margin-bottom: 30px;">How Decision Tapestry Transforms OpenGov Development</h2>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
      <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 8px; text-align: center; backdrop-filter: blur(10px);">
        <div style="font-size: 36px; margin-bottom: 15px;">🎯</div>
        <h3 style="color: #00d9ff; margin-bottom: 10px;">Unified Decision Tracking</h3>
        <p style="font-size: 14px; opacity: 0.9;">Track AI feature decisions across all 5 product suites in one visual map</p>
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 8px; text-align: center; backdrop-filter: blur(10px);">
        <div style="font-size: 36px; margin-bottom: 15px;">🤖</div>
        <h3 style="color: #00d9ff; margin-bottom: 10px;">AI Development Coordination</h3>
        <p style="font-size: 14px; opacity: 0.9;">Orchestrate multiple AI agents working on different products simultaneously</p>
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 8px; text-align: center; backdrop-filter: blur(10px);">
        <div style="font-size: 36px; margin-bottom: 15px;">🔒</div>
        <h3 style="color: #00d9ff; margin-bottom: 10px;">Compliance-First Design</h3>
        <p style="font-size: 14px; opacity: 0.9;">Built-in tracking for security, privacy, and government compliance requirements</p>
      </div>
    </div>
    
    <div style="background: rgba(0,217,255,0.1); padding: 20px; border-radius: 8px; border: 1px solid rgba(0,217,255,0.3);">
      <p style="text-align: center; font-size: 18px; margin: 0;">
        "Decision Tapestry becomes your AI development command center, ensuring every feature aligns with OpenGov's mission to modernize government"
      </p>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 4: OpenGov Product Suite Integration
console.log('Creating slide 4/10: Product Integration...');
await canvas.showHTML(`
  <div style="padding: 40px; background: #fff; border-radius: 12px; font-family: Arial;">
    <h2 style="color: #003366; text-align: center; margin-bottom: 30px;">Integrating AI Across OpenGov's Product Suite</h2>
    
    <div style="position: relative; background: #f8f9fa; padding: 40px; border-radius: 8px;">
      <svg width="100%" height="400" viewBox="0 0 800 400">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.2"/>
          </filter>
        </defs>
        
        <!-- Central Decision Tapestry Hub -->
        <circle cx="400" cy="200" r="60" fill="#0066cc" filter="url(#shadow)"/>
        <text x="400" y="205" text-anchor="middle" fill="white" font-size="14" font-weight="bold">Decision</text>
        <text x="400" y="220" text-anchor="middle" fill="white" font-size="14" font-weight="bold">Tapestry</text>
        
        <!-- Product Nodes -->
        <!-- Financial Management -->
        <rect x="100" y="50" width="120" height="60" rx="8" fill="#4CAF50" filter="url(#shadow)"/>
        <text x="160" y="75" text-anchor="middle" fill="white" font-size="12" font-weight="bold">Financial</text>
        <text x="160" y="90" text-anchor="middle" fill="white" font-size="12">Management</text>
        <text x="160" y="105" text-anchor="middle" fill="white" font-size="10">(ERP)</text>
        
        <!-- Asset Management -->
        <rect x="580" y="50" width="120" height="60" rx="8" fill="#FF9800" filter="url(#shadow)"/>
        <text x="640" y="75" text-anchor="middle" fill="white" font-size="12" font-weight="bold">Asset</text>
        <text x="640" y="90" text-anchor="middle" fill="white" font-size="12">Management</text>
        <text x="640" y="105" text-anchor="middle" fill="white" font-size="10">(Cartegraph)</text>
        
        <!-- Permitting -->
        <rect x="100" y="290" width="120" height="60" rx="8" fill="#9C27B0" filter="url(#shadow)"/>
        <text x="160" y="315" text-anchor="middle" fill="white" font-size="12" font-weight="bold">Permitting &</text>
        <text x="160" y="330" text-anchor="middle" fill="white" font-size="12">Licensing</text>
        
        <!-- Tax & Revenue -->
        <rect x="580" y="290" width="120" height="60" rx="8" fill="#F44336" filter="url(#shadow)"/>
        <text x="640" y="315" text-anchor="middle" fill="white" font-size="12" font-weight="bold">Tax &</text>
        <text x="640" y="330" text-anchor="middle" fill="white" font-size="12">Revenue</text>
        
        <!-- Budgeting -->
        <rect x="340" y="20" width="120" height="60" rx="8" fill="#2196F3" filter="url(#shadow)"/>
        <text x="400" y="45" text-anchor="middle" fill="white" font-size="12" font-weight="bold">Budgeting &</text>
        <text x="400" y="60" text-anchor="middle" fill="white" font-size="12">Planning</text>
        
        <!-- Connections -->
        <line x1="220" y1="100" x2="360" y2="170" stroke="#ddd" stroke-width="2"/>
        <line x1="580" y1="100" x2="440" y2="170" stroke="#ddd" stroke-width="2"/>
        <line x1="220" y1="300" x2="360" y2="230" stroke="#ddd" stroke-width="2"/>
        <line x1="580" y1="300" x2="440" y2="230" stroke="#ddd" stroke-width="2"/>
        <line x1="400" y1="80" x2="400" y2="140" stroke="#ddd" stroke-width="2"/>
        
        <!-- AI Features -->
        <text x="250" y="130" text-anchor="middle" fill="#666" font-size="10">AI Budget</text>
        <text x="250" y="142" text-anchor="middle" fill="#666" font-size="10">Forecasting</text>
        
        <text x="550" y="130" text-anchor="middle" fill="#666" font-size="10">Predictive</text>
        <text x="550" y="142" text-anchor="middle" fill="#666" font-size="10">Maintenance</text>
        
        <text x="250" y="260" text-anchor="middle" fill="#666" font-size="10">Smart</text>
        <text x="250" y="272" text-anchor="middle" fill="#666" font-size="10">Workflows</text>
        
        <text x="550" y="260" text-anchor="middle" fill="#666" font-size="10">Revenue</text>
        <text x="550" y="272" text-anchor="middle" fill="#666" font-size="10">Optimization</text>
      </svg>
    </div>
    
    <div style="margin-top: 20px; background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
      <p style="color: #1976d2; margin: 0;">
        Decision Tapestry tracks and coordinates AI development decisions across all product lines, ensuring consistent implementation and shared learnings
      </p>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 5: Real Use Case - Budgeting AI
console.log('Creating slide 5/10: Budgeting AI Use Case...');
await canvas.showHTML(`
  <div style="padding: 40px; background: linear-gradient(135deg, #2196F3 0%, #1976d2 100%); color: white; border-radius: 12px; font-family: Arial;">
    <h2 style="text-align: center; margin-bottom: 30px;">Real Use Case: AI-Powered Budget Forecasting</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
      <div>
        <h3 style="margin-bottom: 20px;">The Challenge</h3>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
          <p style="line-height: 1.6; margin-bottom: 15px;">
            OpenGov's Budgeting & Planning suite needs AI to help governments:
          </p>
          <ul style="line-height: 1.8;">
            <li>Predict revenue shortfalls</li>
            <li>Optimize department allocations</li>
            <li>Identify spending anomalies</li>
            <li>Generate budget narratives</li>
          </ul>
        </div>
      </div>
      
      <div>
        <h3 style="margin-bottom: 20px;">Decision Tapestry in Action</h3>
        <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px;">
          <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 4px; margin-bottom: 10px;">
            <strong>Decision #127:</strong> Implement ML Revenue Forecasting
            <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">
              Status: In Progress | Team: AI Core + Budgeting
            </div>
          </div>
          <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 4px; margin-bottom: 10px;">
            <strong>Decision #128:</strong> Privacy-Preserving Analytics
            <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">
              Status: Planning | Compliance: Required
            </div>
          </div>
          <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 4px;">
            <strong>Decision #129:</strong> Multi-Tenant AI Architecture
            <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">
              Status: Approved | Impact: All Products
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 30px; text-align: center;">
      <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; display: inline-block;">
        <h4 style="margin-bottom: 10px;">Live Development Progress</h4>
        <div style="display: flex; gap: 20px; justify-content: center;">
          <div>
            <div style="font-size: 24px; font-weight: bold;">3</div>
            <div style="font-size: 12px; opacity: 0.8;">AI Agents Active</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold;">47</div>
            <div style="font-size: 12px; opacity: 0.8;">Files Modified</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold;">12</div>
            <div style="font-size: 12px; opacity: 0.8;">Tests Passing</div>
          </div>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 6: Multi-Agent Development for OpenGov
console.log('Creating slide 6/10: Multi-Agent Development...');
await canvas.showHTML(`
  <div style="padding: 40px; background: #1a1a1a; color: white; border-radius: 12px; font-family: Arial;">
    <h2 style="text-align: center; color: #00d9ff; margin-bottom: 30px;">Multi-Agent AI Development at Scale</h2>
    
    <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #ffd700; margin-bottom: 20px; text-align: center;">Parallel Development Across Products</h3>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
        <div style="background: rgba(76,175,80,0.2); padding: 20px; border-radius: 8px; border: 1px solid #4CAF50;">
          <h4 style="color: #4CAF50; margin-bottom: 10px;">Agent: FinanceAI-1</h4>
          <div style="font-size: 14px; line-height: 1.6;">
            <div style="margin-bottom: 8px;">📍 Working on: GL Anomaly Detection</div>
            <div style="margin-bottom: 8px;">📂 Files: /src/finance/ml/anomaly.py</div>
            <div style="margin-bottom: 8px;">✅ Status: Training model</div>
            <div style="color: #888;">⏱️ ETA: 2 hours</div>
          </div>
        </div>
        
        <div style="background: rgba(255,152,0,0.2); padding: 20px; border-radius: 8px; border: 1px solid #FF9800;">
          <h4 style="color: #FF9800; margin-bottom: 10px;">Agent: AssetAI-2</h4>
          <div style="font-size: 14px; line-height: 1.6;">
            <div style="margin-bottom: 8px;">📍 Working on: Predictive Maintenance</div>
            <div style="margin-bottom: 8px;">📂 Files: /src/assets/predict/*</div>
            <div style="margin-bottom: 8px;">🔧 Status: Integrating APIs</div>
            <div style="color: #888;">⏱️ ETA: 45 minutes</div>
          </div>
        </div>
        
        <div style="background: rgba(156,39,176,0.2); padding: 20px; border-radius: 8px; border: 1px solid #9C27B0;">
          <h4 style="color: #9C27B0; margin-bottom: 10px;">Agent: PermitAI-3</h4>
          <div style="font-size: 14px; line-height: 1.6;">
            <div style="margin-bottom: 8px;">📍 Working on: Document Classification</div>
            <div style="margin-bottom: 8px;">📂 Files: /src/permits/nlp/*</div>
            <div style="margin-bottom: 8px;">📝 Status: Writing tests</div>
            <div style="color: #888;">⏱️ ETA: 1 hour</div>
          </div>
        </div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px;">
        <h4 style="color: #00d9ff; margin-bottom: 15px;">Benefits for OpenGov</h4>
        <ul style="line-height: 1.8; font-size: 14px;">
          <li>🚀 3-5x faster AI feature development</li>
          <li>🔄 No conflicts between product teams</li>
          <li>📊 Real-time progress visibility</li>
          <li>🧪 Automated testing & validation</li>
          <li>📝 Compliance documentation generated</li>
        </ul>
      </div>
      
      <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px;">
        <h4 style="color: #00d9ff; margin-bottom: 15px;">Coordination Features</h4>
        <ul style="line-height: 1.8; font-size: 14px;">
          <li>🎯 Dependency-aware task assignment</li>
          <li>🔒 Mutex locks for shared resources</li>
          <li>💬 Inter-agent communication</li>
          <li>🔍 Conflict detection & resolution</li>
          <li>📈 Performance optimization</li>
        </ul>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 7: Government Compliance & Security
console.log('Creating slide 7/10: Compliance & Security...');
await canvas.showHTML(`
  <div style="padding: 40px; background: #f8f9fa; border-radius: 12px; font-family: Arial;">
    <h2 style="color: #003366; text-align: center; margin-bottom: 30px;">🔒 Government-Grade Compliance Tracking</h2>
    
    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4caf50;">
      <h3 style="color: #2e7d32; margin-bottom: 15px;">Built for Government Requirements</h3>
      <p style="color: #333; line-height: 1.6;">
        Decision Tapestry automatically tracks and documents all AI development decisions with government compliance in mind, 
        ensuring OpenGov maintains the highest standards for its 1,900+ government clients.
      </p>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h4 style="color: #1976d2; margin-bottom: 15px;">🛡️ Security Compliance</h4>
        <ul style="color: #666; font-size: 14px; line-height: 1.8;">
          <li>✓ FedRAMP tracking</li>
          <li>✓ SOC 2 documentation</li>
          <li>✓ StateRAMP alignment</li>
          <li>✓ NIST framework</li>
        </ul>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h4 style="color: #388e3c; margin-bottom: 15px;">📋 AI Governance</h4>
        <ul style="color: #666; font-size: 14px; line-height: 1.8;">
          <li>✓ Model bias testing</li>
          <li>✓ Explainability logs</li>
          <li>✓ Data lineage tracking</li>
          <li>✓ Algorithm audits</li>
        </ul>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h4 style="color: #d32f2f; margin-bottom: 15px;">🔐 Privacy Protection</h4>
        <ul style="color: #666; font-size: 14px; line-height: 1.8;">
          <li>✓ PII handling logs</li>
          <li>✓ Data retention policies</li>
          <li>✓ Access control matrix</li>
          <li>✓ Encryption standards</li>
        </ul>
      </div>
    </div>
    
    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #f57c00;">
      <h4 style="color: #e65100; margin-bottom: 10px;">Automated Compliance Documentation</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Every AI decision automatically generates:
          </p>
          <ul style="color: #666; font-size: 14px; margin-top: 10px;">
            <li>• Impact assessment reports</li>
            <li>• Security review documentation</li>
            <li>• Compliance checkpoints</li>
          </ul>
        </div>
        <div style="background: white; padding: 15px; border-radius: 4px;">
          <div style="font-family: monospace; font-size: 12px; color: #333;">
            <div style="color: #666;">// Auto-generated for Decision #145</div>
            <div>{</div>
            <div style="margin-left: 20px;">"compliance": "FedRAMP",</div>
            <div style="margin-left: 20px;">"risk_level": "moderate",</div>
            <div style="margin-left: 20px;">"pii_handling": "encrypted",</div>
            <div style="margin-left: 20px;">"audit_trail": "complete"</div>
            <div>}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 8: Integration Timeline & ROI
console.log('Creating slide 8/10: Timeline & ROI...');
await canvas.showHTML(`
  <div style="padding: 40px; background: linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%); color: white; border-radius: 12px; font-family: Arial;">
    <h2 style="text-align: center; margin-bottom: 30px;">Implementation Timeline & Expected ROI</h2>
    
    <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
      <h3 style="color: #ffd700; text-align: center; margin-bottom: 25px;">90-Day Integration Plan</h3>
      
      <div style="position: relative;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div style="text-align: center; flex: 1;">
            <div style="width: 60px; height: 60px; background: #4CAF50; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px; font-weight: bold;">1</div>
            <h4 style="margin-bottom: 5px;">Days 1-30</h4>
            <p style="font-size: 14px; opacity: 0.9;">Setup & Integration</p>
            <ul style="font-size: 12px; text-align: left; margin-top: 10px; opacity: 0.8;">
              <li>Install Decision Tapestry</li>
              <li>Map existing decisions</li>
              <li>Team onboarding</li>
            </ul>
          </div>
          
          <div style="text-align: center; flex: 1;">
            <div style="width: 60px; height: 60px; background: #FF9800; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px; font-weight: bold;">2</div>
            <h4 style="margin-bottom: 5px;">Days 31-60</h4>
            <p style="font-size: 14px; opacity: 0.9;">Pilot Implementation</p>
            <ul style="font-size: 12px; text-align: left; margin-top: 10px; opacity: 0.8;">
              <li>Budget AI pilot</li>
              <li>3 AI agents deployed</li>
              <li>First features shipped</li>
            </ul>
          </div>
          
          <div style="text-align: center; flex: 1;">
            <div style="width: 60px; height: 60px; background: #2196F3; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px; font-weight: bold;">3</div>
            <h4 style="margin-bottom: 5px;">Days 61-90</h4>
            <p style="font-size: 14px; opacity: 0.9;">Full Deployment</p>
            <ul style="font-size: 12px; text-align: left; margin-top: 10px; opacity: 0.8;">
              <li>All products integrated</li>
              <li>10+ AI agents active</li>
              <li>Measurable results</li>
            </ul>
          </div>
        </div>
        
        <div style="position: absolute; top: 30px; left: 15%; right: 15%; height: 2px; background: rgba(255,255,255,0.3); z-index: -1;"></div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 8px;">
        <h3 style="color: #00ff00; margin-bottom: 15px;">📈 Expected Benefits</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Development Velocity</span>
            <span style="color: #00ff00; font-weight: bold;">+300%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Time to Market</span>
            <span style="color: #00ff00; font-weight: bold;">-65%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Integration Conflicts</span>
            <span style="color: #00ff00; font-weight: bold;">-90%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Compliance Documentation</span>
            <span style="color: #00ff00; font-weight: bold;">100%</span>
          </div>
        </div>
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 8px;">
        <h3 style="color: #ffd700; margin-bottom: 15px;">💰 ROI Calculation</h3>
        <div style="font-size: 14px; line-height: 1.8;">
          <div style="margin-bottom: 10px;">
            <strong>Investment:</strong> $250K (licenses + setup)
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Savings Year 1:</strong> $2.8M
            <ul style="font-size: 12px; margin-top: 5px; opacity: 0.8;">
              <li>• Reduced dev time: $1.5M</li>
              <li>• Faster delivery: $800K</li>
              <li>• Fewer defects: $500K</li>
            </ul>
          </div>
          <div style="background: #ffd700; color: #000; padding: 10px; border-radius: 4px; text-align: center; font-weight: bold;">
            ROI: 1,020% in Year 1
          </div>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 9: Success with Cox Partnership
console.log('Creating slide 9/10: Cox Partnership Success...');
await canvas.showHTML(`
  <div style="padding: 40px; background: #ffffff; border-radius: 12px; font-family: Arial;">
    <h2 style="color: #003366; text-align: center; margin-bottom: 30px;">Accelerating Cox's AI Vision for OpenGov</h2>
    
    <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
      <p style="color: #0d47a1; font-size: 18px; text-align: center; margin: 0;">
        <em>"OpenGov is at the forefront of cloud and AI transformation within governments"</em>
        <br>
        <span style="font-size: 14px; opacity: 0.8;">- Dallas Clement, President and CFO of Cox</span>
      </p>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
      <div>
        <h3 style="color: #0066cc; margin-bottom: 20px;">Cox's Strategic Goals</h3>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <ul style="color: #333; line-height: 2;">
            <li>✓ Long-term AI investment strategy</li>
            <li>✓ Accelerate product development</li>
            <li>✓ Enable strategic acquisitions</li>
            <li>✓ Modernize government services</li>
            <li>✓ Expand market leadership</li>
          </ul>
        </div>
      </div>
      
      <div>
        <h3 style="color: #0066cc; margin-bottom: 20px;">Decision Tapestry Enables</h3>
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px;">
          <ul style="color: #333; line-height: 2;">
            <li>🚀 Rapid AI feature deployment</li>
            <li>🔄 Seamless acquisition integration</li>
            <li>📊 Clear development visibility</li>
            <li>🤝 Multi-team coordination</li>
            <li>📈 Measurable AI ROI</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 30px;">
      <h3 style="color: #003366; text-align: center; margin-bottom: 20px;">The Path to 3,000+ Government Clients</h3>
      <div style="display: flex; gap: 20px; align-items: center;">
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 36px; color: #0066cc; font-weight: bold;">1,900</div>
          <div style="color: #666;">Current Clients</div>
        </div>
        
        <div style="flex: 2; position: relative;">
          <div style="background: #e0e0e0; height: 40px; border-radius: 20px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #4CAF50, #8BC34A); width: 63%; height: 100%; position: relative;">
              <div style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: white; font-weight: bold;">
                With AI: 2025
              </div>
            </div>
          </div>
          <div style="position: absolute; top: -25px; left: 63%; transform: translateX(-50%); color: #4CAF50; font-weight: bold;">
            ↓
          </div>
        </div>
        
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 36px; color: #4CAF50; font-weight: bold;">3,000+</div>
          <div style="color: #666;">2025 Target</div>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 10: Next Steps & Call to Action
console.log('Creating slide 10/10: Next Steps...');
await canvas.showHTML(`
  <div style="padding: 60px; background: linear-gradient(135deg, #003366 0%, #0066cc 100%); color: white; border-radius: 12px; font-family: Arial;">
    <h2 style="font-size: 36px; text-align: center; margin-bottom: 40px;">Let's Build the Future of GovTech Together</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
      <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 8px; backdrop-filter: blur(10px);">
        <h3 style="color: #ffd700; margin-bottom: 20px;">🎯 Immediate Next Steps</h3>
        <ol style="line-height: 2; font-size: 16px;">
          <li>Schedule technical deep-dive (next week)</li>
          <li>Identify pilot project (Budget AI recommended)</li>
          <li>Map current AI initiatives to Decision Tapestry</li>
          <li>Define success metrics & KPIs</li>
          <li>Begin 30-day proof of concept</li>
        </ol>
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 8px; backdrop-filter: blur(10px);">
        <h3 style="color: #00ff00; margin-bottom: 20px;">✅ What We'll Deliver</h3>
        <ul style="line-height: 2; font-size: 16px;">
          <li>• Full platform setup in 48 hours</li>
          <li>• Dedicated success team</li>
          <li>• Custom AI agent configuration</li>
          <li>• OpenGov-specific workflows</li>
          <li>• Weekly progress reports</li>
        </ul>
      </div>
    </div>
    
    <div style="background: rgba(255,255,255,0.2); padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
      <h3 style="font-size: 24px; margin-bottom: 20px;">Ready to Accelerate OpenGov's AI Journey?</h3>
      <div style="display: flex; gap: 20px; justify-content: center;">
        <div style="background: #ffd700; color: #003366; padding: 15px 40px; border-radius: 4px; font-weight: bold; font-size: 18px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
          Start Pilot Program
        </div>
        <div style="background: transparent; border: 2px solid #ffd700; padding: 15px 40px; border-radius: 4px; font-weight: bold; font-size: 18px; cursor: pointer;">
          Schedule Demo
        </div>
      </div>
    </div>
    
    <div style="text-align: center;">
      <p style="font-size: 18px; margin-bottom: 20px;">
        Join the future of AI-powered government services
      </p>
      <div style="display: flex; gap: 30px; justify-content: center; opacity: 0.8;">
        <div>
          <div style="font-size: 24px; font-weight: bold;">2,000+</div>
          <div style="font-size: 14px;">Governments Ready</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: bold;">$1.8B</div>
          <div style="font-size: 14px;">Platform Value</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: bold;">100M+</div>
          <div style="font-size: 14px;">Citizens Served</div>
        </div>
      </div>
    </div>
  </div>
`);

console.log('\n✨ OpenGov CPO presentation complete!');
console.log('\n📊 Presentation Summary:');
console.log('   • 10 slides tailored for OpenGov\'s AI integration needs');
console.log('   • Focuses on multi-product coordination and compliance');
console.log('   • Demonstrates clear ROI and implementation timeline');
console.log('   • Aligns with Cox Enterprises\' strategic vision');
console.log('\n🎮 Navigation:');
console.log('   • Arrow keys or A/D to navigate');
console.log('   • Numbers 1-9, 0 for slide 10');
console.log('   • F for fullscreen presentation');
console.log('   • G for gallery overview');
console.log('\nGood luck with the meeting!');