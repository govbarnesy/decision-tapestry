import canvas from './claude-code-integration/ai-canvas-helper.mjs';

console.log('🚨 Creating AI Software Future Presentation...\n');

// Slide 1: Title - The Existential Threat
console.log('Creating slide 1/10: Title...');
await canvas.showHTML(`
  <div style="padding: 80px; background: linear-gradient(135deg, rgb(75, 63, 255) 0%, rgb(50, 42, 170) 100%); color: white; border-radius: 5px; font-family: 'Arial', sans-serif; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center;">
    <h1 style="font-size: 64px; font-weight: 800; margin-bottom: 30px; line-height: 1.1;">
      THE FUTURE IS ALREADY HERE
    </h1>
    <h2 style="font-size: 36px; font-weight: 300; margin-bottom: 40px; opacity: 0.9; line-height: 1.3;">
      All Software Will Be AI-Generated.<br>
      The Question Is: Who Will Control It?
    </h2>
    <div style="background: rgba(248, 106, 11, 0.9); padding: 20px 40px; border-radius: 5px; display: inline-block; margin: 0 auto;">
      <p style="font-size: 24px; font-weight: 700; margin: 0; text-transform: uppercase;">
        We Must Act Now
      </p>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 2: The Paradigm Shift
console.log('Creating slide 2/10: Paradigm Shift...');
await canvas.showHTML(`
  <div style="padding: 60px; background: #ffffff; border-radius: 5px; font-family: 'Arial', sans-serif;">
    <h2 style="color: rgb(75, 63, 255); font-size: 36px; font-weight: 700; text-align: center; margin-bottom: 50px;">The Paradigm Shift Is Happening NOW</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px;">
      <div style="text-align: center;">
        <h3 style="color: rgb(75, 63, 255); font-size: 48px; font-weight: 800; margin-bottom: 10px;">2023</h3>
        <div style="background: #f5f5f5; padding: 30px; border-radius: 5px; min-height: 150px;">
          <p style="color: #333; font-size: 18px; line-height: 1.5; margin: 0;">
            <strong>Copilot Era</strong><br>
            AI assists developers<br>
            10-30% productivity gain
          </p>
        </div>
      </div>
      
      <div style="text-align: center;">
        <h3 style="color: rgb(248, 106, 11); font-size: 48px; font-weight: 800; margin-bottom: 10px;">2024</h3>
        <div style="background: rgb(248, 106, 11); color: white; padding: 30px; border-radius: 5px; min-height: 150px; transform: scale(1.05); box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <p style="font-size: 18px; line-height: 1.5; margin: 0;">
            <strong>AI Agents Era</strong><br>
            AI builds autonomously<br>
            300-500% productivity gain
          </p>
        </div>
      </div>
      
      <div style="text-align: center;">
        <h3 style="color: #999; font-size: 48px; font-weight: 800; margin-bottom: 10px;">2025</h3>
        <div style="background: #f5f5f5; padding: 30px; border-radius: 5px; min-height: 150px; border: 2px dashed #ccc;">
          <p style="color: #666; font-size: 18px; line-height: 1.5; margin: 0;">
            <strong>Full Automation</strong><br>
            Human architects only<br>
            1000%+ productivity gain
          </p>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 50px; text-align: center;">
      <p style="color: rgb(75, 63, 255); font-size: 24px; font-weight: 700;">
        The companies that master this NOW will dominate their markets
      </p>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 3: The Evidence
console.log('Creating slide 3/10: Evidence...');
await canvas.showHTML(`
  <div style="padding: 60px; background: #f8f8f8; border-radius: 5px; font-family: 'Arial', sans-serif;">
    <h2 style="color: rgb(75, 63, 255); font-size: 36px; font-weight: 700; text-align: center; margin-bottom: 50px;">The Evidence Is Overwhelming</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
      <div>
        <h3 style="color: rgb(248, 106, 11); font-size: 24px; font-weight: 700; margin-bottom: 20px;">What's Happening Right Now:</h3>
        <ul style="color: #333; font-size: 18px; line-height: 2;">
          <li><strong>Cognition's Devin:</strong> Completes real Upwork jobs autonomously</li>
          <li><strong>Replit Agent:</strong> Builds entire apps from prompts</li>
          <li><strong>Claude Code:</strong> Professional developers using AI for 80%+ of code</li>
          <li><strong>GitHub Copilot:</strong> 46% of code written by AI</li>
          <li><strong>Cursor:</strong> $60M funding, replacing traditional IDEs</li>
        </ul>
      </div>
      
      <div>
        <div style="background: rgb(75, 63, 255); color: white; padding: 30px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 15px;">The Acceleration Curve</h3>
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 5px;">
            <div style="font-size: 36px; font-weight: 800; margin-bottom: 10px;">18 months</div>
            <p style="font-size: 16px; opacity: 0.9;">From "AI can't code" to "AI builds production systems"</p>
          </div>
        </div>
        
        <div style="background: #fff; padding: 20px; border-radius: 5px; border: 2px solid rgb(248, 106, 11);">
          <p style="color: rgb(248, 106, 11); font-size: 20px; font-weight: 700; margin: 0;">
            ⚠️ WARNING: Traditional software companies have 12-24 months to adapt or become obsolete
          </p>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 4: Our Strategic Advantage
console.log('Creating slide 4/10: Strategic Advantage...');
await canvas.showHTML(`
  <div style="padding: 60px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; border-radius: 5px; font-family: 'Arial', sans-serif;">
    <h2 style="color: rgb(248, 106, 11); font-size: 36px; font-weight: 700; text-align: center; margin-bottom: 50px;">Our Strategic Advantage: The Perfect Trinity</h2>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-bottom: 40px;">
      <div style="background: rgba(75, 63, 255, 0.2); padding: 30px; border-radius: 5px; border: 2px solid rgb(75, 63, 255); text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">🧠</div>
        <h3 style="color: rgb(75, 63, 255); font-size: 24px; font-weight: 700; margin-bottom: 15px;">GROK 4 HEAVY</h3>
        <p style="font-size: 16px; line-height: 1.5;">
          <strong>Architecture & Planning</strong><br>
          System design at scale<br>
          Complex reasoning<br>
          Strategic decisions
        </p>
      </div>
      
      <div style="background: rgba(248, 106, 11, 0.2); padding: 30px; border-radius: 5px; border: 2px solid rgb(248, 106, 11); text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">⚡</div>
        <h3 style="color: rgb(248, 106, 11); font-size: 24px; font-weight: 700; margin-bottom: 15px;">CLAUDE CODE</h3>
        <p style="font-size: 16px; line-height: 1.5;">
          <strong>Implementation & Execution</strong><br>
          Rapid development<br>
          Code generation<br>
          Testing & debugging
        </p>
      </div>
      
      <div style="background: rgba(76, 175, 80, 0.2); padding: 30px; border-radius: 5px; border: 2px solid #4CAF50; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">👤</div>
        <h3 style="color: #4CAF50; font-size: 24px; font-weight: 700; margin-bottom: 15px;">HUMAN ARCHITECT</h3>
        <p style="font-size: 16px; line-height: 1.5;">
          <strong>Vision & Decision Making</strong><br>
          Business strategy<br>
          User experience<br>
          Quality control
        </p>
      </div>
    </div>
    
    <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 5px; text-align: center;">
      <p style="font-size: 24px; font-weight: 700; margin: 0;">
        This combination is 10-20x more powerful than any single AI system
      </p>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 5: How It Works
console.log('Creating slide 5/10: How It Works...');
await canvas.showHTML(`
  <div style="padding: 60px; background: #ffffff; border-radius: 5px; font-family: 'Arial', sans-serif;">
    <h2 style="color: rgb(75, 63, 255); font-size: 36px; font-weight: 700; text-align: center; margin-bottom: 50px;">The AI Development Pipeline</h2>
    
    <div style="position: relative; padding: 40px 0;">
      <svg width="100%" height="300" viewBox="0 0 800 300">
        <!-- Pipeline flow -->
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgb(75, 63, 255)" />
          </marker>
        </defs>
        
        <!-- Stage 1 -->
        <rect x="50" y="100" width="150" height="100" rx="5" fill="rgb(75, 63, 255)" />
        <text x="125" y="140" text-anchor="middle" fill="white" font-size="16" font-weight="bold">HUMAN</text>
        <text x="125" y="160" text-anchor="middle" fill="white" font-size="14">Defines Vision</text>
        <text x="125" y="180" text-anchor="middle" fill="white" font-size="12">& Requirements</text>
        
        <!-- Arrow 1 -->
        <line x1="200" y1="150" x2="250" y2="150" stroke="rgb(75, 63, 255)" stroke-width="3" marker-end="url(#arrowhead)" />
        
        <!-- Stage 2 -->
        <rect x="250" y="100" width="150" height="100" rx="5" fill="rgb(248, 106, 11)" />
        <text x="325" y="140" text-anchor="middle" fill="white" font-size="16" font-weight="bold">GROK 4</text>
        <text x="325" y="160" text-anchor="middle" fill="white" font-size="14">Architects</text>
        <text x="325" y="180" text-anchor="middle" fill="white" font-size="12">System Design</text>
        
        <!-- Arrow 2 -->
        <line x1="400" y1="150" x2="450" y2="150" stroke="rgb(75, 63, 255)" stroke-width="3" marker-end="url(#arrowhead)" />
        
        <!-- Stage 3 -->
        <rect x="450" y="100" width="150" height="100" rx="5" fill="#4CAF50" />
        <text x="525" y="140" text-anchor="middle" fill="white" font-size="16" font-weight="bold">CLAUDE</text>
        <text x="525" y="160" text-anchor="middle" fill="white" font-size="14">Implements</text>
        <text x="525" y="180" text-anchor="middle" fill="white" font-size="12">& Tests Code</text>
        
        <!-- Arrow 3 -->
        <line x1="600" y1="150" x2="650" y2="150" stroke="rgb(75, 63, 255)" stroke-width="3" marker-end="url(#arrowhead)" />
        
        <!-- Output -->
        <rect x="650" y="100" width="100" height="100" rx="5" fill="#FFD700" />
        <text x="700" y="140" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">SHIP</text>
        <text x="700" y="160" text-anchor="middle" fill="#333" font-size="14">Production</text>
        <text x="700" y="180" text-anchor="middle" fill="#333" font-size="12">Software</text>
        
        <!-- Feedback loop -->
        <path d="M 700 200 Q 400 260 125 200" stroke="rgb(75, 63, 255)" stroke-width="2" fill="none" stroke-dasharray="5,5" />
        <text x="400" y="250" text-anchor="middle" fill="rgb(75, 63, 255)" font-size="14">Continuous Improvement Loop</text>
      </svg>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px;">
      <div style="background: #f8f8f8; padding: 20px; border-radius: 5px;">
        <h4 style="color: rgb(75, 63, 255); margin-bottom: 10px;">Phase 1: Vision (1 hour)</h4>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">Define goals, user stories, and success criteria</p>
      </div>
      <div style="background: #f8f8f8; padding: 20px; border-radius: 5px;">
        <h4 style="color: rgb(248, 106, 11); margin-bottom: 10px;">Phase 2: Architecture (2 hours)</h4>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">System design, data models, API structure</p>
      </div>
      <div style="background: #f8f8f8; padding: 20px; border-radius: 5px;">
        <h4 style="color: #4CAF50; margin-bottom: 10px;">Phase 3: Build (4-8 hours)</h4>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">Implementation, testing, deployment</p>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 6: Real Results
console.log('Creating slide 6/10: Real Results...');
await canvas.showHTML(`
  <div style="padding: 60px; background: rgb(75, 63, 255); color: white; border-radius: 5px; font-family: 'Arial', sans-serif;">
    <h2 style="font-size: 36px; font-weight: 700; text-align: center; margin-bottom: 50px;">Real Results: What We've Already Built</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
      <div>
        <h3 style="color: rgb(248, 106, 11); font-size: 24px; font-weight: 700; margin-bottom: 30px;">Decision Tapestry Platform</h3>
        <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 5px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <span style="font-size: 18px;">Development Time:</span>
            <span style="font-size: 24px; font-weight: 700; color: rgb(248, 106, 11);">3 weeks</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <span style="font-size: 18px;">Traditional Estimate:</span>
            <span style="font-size: 24px; font-weight: 700;">6 months</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 18px;">Speed Increase:</span>
            <span style="font-size: 24px; font-weight: 700; color: #4CAF50;">8.7x faster</span>
          </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 5px;">
          <h4 style="margin-bottom: 15px;">Features Built:</h4>
          <ul style="font-size: 16px; line-height: 1.8;">
            <li>Real-time collaboration system</li>
            <li>AI visual communication (AI Canvas)</li>
            <li>Git integration & analytics</li>
            <li>Multi-agent coordination</li>
            <li>Complete dashboard UI</li>
          </ul>
        </div>
      </div>
      
      <div>
        <h3 style="color: #4CAF50; font-size: 24px; font-weight: 700; margin-bottom: 30px;">The Numbers Don't Lie</h3>
        <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
          <div style="font-size: 64px; font-weight: 800; color: rgb(248, 106, 11);">47,000+</div>
          <p style="font-size: 20px; margin-top: 10px;">Lines of production code</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 5px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700;">95%</div>
            <p style="font-size: 14px; margin-top: 5px;">AI-generated</p>
          </div>
          <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 5px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700;">$180K</div>
            <p style="font-size: 14px; margin-top: 5px;">Dev cost saved</p>
          </div>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 7: The Competition
console.log('Creating slide 7/10: Competition...');
await canvas.showHTML(`
  <div style="padding: 60px; background: #f8f8f8; border-radius: 5px; font-family: 'Arial', sans-serif;">
    <h2 style="color: rgb(75, 63, 255); font-size: 36px; font-weight: 700; text-align: center; margin-bottom: 50px;">The Race Has Already Started</h2>
    
    <div style="background: white; padding: 40px; border-radius: 5px; margin-bottom: 30px;">
      <h3 style="color: rgb(248, 106, 11); font-size: 24px; font-weight: 700; margin-bottom: 20px;">Who's Moving Fast:</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
        <div>
          <h4 style="color: #333; margin-bottom: 15px;">Tech Giants</h4>
          <ul style="color: #666; font-size: 16px; line-height: 1.8;">
            <li><strong>Microsoft:</strong> GitHub Copilot Workspace - full app generation</li>
            <li><strong>Google:</strong> Project IDX with Gemini integration</li>
            <li><strong>Amazon:</strong> CodeWhisperer evolving rapidly</li>
            <li><strong>Meta:</strong> Internal AI coding systems</li>
          </ul>
        </div>
        <div>
          <h4 style="color: #333; margin-bottom: 15px;">Startups</h4>
          <ul style="color: #666; font-size: 16px; line-height: 1.8;">
            <li><strong>Cognition:</strong> $175M for Devin AI developer</li>
            <li><strong>Magic:</strong> $117M for autonomous coding</li>
            <li><strong>Poolside:</strong> $126M for AI coding</li>
            <li><strong>Cursor:</strong> Replacing VS Code globally</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div style="background: #fff3cd; padding: 30px; border-radius: 5px; border-left: 5px solid #ffc107;">
        <h4 style="color: #856404; font-size: 20px; font-weight: 700; margin-bottom: 15px;">⚠️ The Window Is Closing</h4>
        <p style="color: #856404; font-size: 16px; line-height: 1.5;">
          Every month we wait, competitors gain ground. The first movers in each industry will establish insurmountable advantages.
        </p>
      </div>
      <div style="background: #d4edda; padding: 30px; border-radius: 5px; border-left: 5px solid #28a745;">
        <h4 style="color: #155724; font-size: 20px; font-weight: 700; margin-bottom: 15px;">✅ Our Opportunity</h4>
        <p style="color: #155724; font-size: 16px; line-height: 1.5;">
          With Grok 4 + Claude Code, we can move faster than any competitor. But only if we start NOW.
        </p>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 8: Investment Justification
console.log('Creating slide 8/10: ROI...');
await canvas.showHTML(`
  <div style="padding: 60px; background: #ffffff; border-radius: 5px; font-family: 'Arial', sans-serif;">
    <h2 style="color: rgb(75, 63, 255); font-size: 36px; font-weight: 700; text-align: center; margin-bottom: 50px;">The Investment That Pays for Itself</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
      <div style="background: rgb(75, 63, 255); color: white; padding: 30px; border-radius: 5px;">
        <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 25px;">Claude Code Max</h3>
        <div style="font-size: 36px; font-weight: 800; margin-bottom: 20px;">$60/month</div>
        <ul style="font-size: 16px; line-height: 2;">
          <li>✓ 20+ hour coding sessions</li>
          <li>✓ Priority processing</li>
          <li>✓ Advanced code understanding</li>
          <li>✓ Multi-file operations</li>
        </ul>
        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 5px; margin-top: 20px;">
          <p style="font-size: 14px; margin: 0;">Replaces: 2-3 junior developers<br>
          Value: $15,000+/month</p>
        </div>
      </div>
      
      <div style="background: rgb(248, 106, 11); color: white; padding: 30px; border-radius: 5px;">
        <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 25px;">Grok 4 Heavy</h3>
        <div style="font-size: 36px; font-weight: 800; margin-bottom: 20px;">$200/month*</div>
        <ul style="font-size: 16px; line-height: 2;">
          <li>✓ Complex reasoning</li>
          <li>✓ System architecture</li>
          <li>✓ Strategic planning</li>
          <li>✓ Advanced problem solving</li>
        </ul>
        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 5px; margin-top: 20px;">
          <p style="font-size: 14px; margin: 0;">Replaces: Senior architect<br>
          Value: $20,000+/month</p>
        </div>
        <p style="font-size: 12px; margin-top: 10px; opacity: 0.8;">*Estimated based on compute requirements</p>
      </div>
    </div>
    
    <div style="background: #e8f5e9; padding: 40px; border-radius: 5px; text-align: center;">
      <h3 style="color: #2e7d32; font-size: 28px; font-weight: 700; margin-bottom: 20px;">Total Monthly Investment: $260</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 30px;">
        <div>
          <div style="font-size: 32px; font-weight: 800; color: #2e7d32;">125x</div>
          <p style="color: #666; font-size: 16px;">ROI in Month 1</p>
        </div>
        <div>
          <div style="font-size: 32px; font-weight: 800; color: #2e7d32;">$35K+</div>
          <p style="color: #666; font-size: 16px;">Monthly Value Created</p>
        </div>
        <div>
          <div style="font-size: 32px; font-weight: 800; color: #2e7d32;">2 days</div>
          <p style="color: #666; font-size: 16px;">To Pay for Itself</p>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 9: The Future State
console.log('Creating slide 9/10: Future State...');
await canvas.showHTML(`
  <div style="padding: 60px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; border-radius: 5px; font-family: 'Arial', sans-serif;">
    <h2 style="color: rgb(248, 106, 11); font-size: 36px; font-weight: 700; text-align: center; margin-bottom: 50px;">The Future We're Building</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
      <div>
        <h3 style="color: rgb(75, 63, 255); font-size: 24px; font-weight: 700; margin-bottom: 20px;">In 6 Months:</h3>
        <ul style="font-size: 18px; line-height: 2; color: #ccc;">
          <li>✓ 10x current development speed</li>
          <li>✓ 90% of code AI-generated</li>
          <li>✓ Ship features in hours, not weeks</li>
          <li>✓ Outpace any competitor</li>
          <li>✓ Market leadership position</li>
        </ul>
      </div>
      <div>
        <h3 style="color: #4CAF50; font-size: 24px; font-weight: 700; margin-bottom: 20px;">In 12 Months:</h3>
        <ul style="font-size: 18px; line-height: 2; color: #ccc;">
          <li>✓ Fully autonomous development</li>
          <li>✓ Ideas to production in days</li>
          <li>✓ Exponential feature velocity</li>
          <li>✓ Unassailable market position</li>
          <li>✓ Define industry standards</li>
        </ul>
      </div>
    </div>
    
    <div style="background: rgba(248, 106, 11, 0.2); padding: 40px; border-radius: 5px; border: 2px solid rgb(248, 106, 11); text-align: center;">
      <h3 style="font-size: 28px; font-weight: 700; margin-bottom: 20px;">The Choice Is Binary</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px;">
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 5px;">
          <h4 style="color: #ff4444; margin-bottom: 10px;">Option 1: Wait</h4>
          <p style="font-size: 16px; line-height: 1.5;">Watch competitors build the future while we debate</p>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 5px;">
          <h4 style="color: #4CAF50; margin-bottom: 10px;">Option 2: Lead</h4>
          <p style="font-size: 16px; line-height: 1.5;">Be the company that defines how software is built</p>
        </div>
      </div>
    </div>
  </div>
`);

await new Promise(resolve => setTimeout(resolve, 500));

// Slide 10: Call to Action
console.log('Creating slide 10/10: Call to Action...');
await canvas.showHTML(`
  <div style="padding: 80px; background: linear-gradient(135deg, rgb(75, 63, 255) 0%, rgb(50, 42, 170) 100%); color: white; border-radius: 5px; font-family: 'Arial', sans-serif; text-align: center;">
    <h1 style="font-size: 48px; font-weight: 800; margin-bottom: 40px; line-height: 1.2;">
      THE FUTURE BELONGS TO THOSE<br>WHO BUILD IT
    </h1>
    
    <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 5px; margin-bottom: 40px;">
      <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 30px;">Let's Start Today</h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: left; max-width: 800px; margin: 0 auto;">
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 5px;">
          <h3 style="color: rgb(248, 106, 11); font-size: 20px; margin-bottom: 10px;">Step 1</h3>
          <p style="font-size: 16px;">Approve Claude Code Max + Grok 4 licenses</p>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 5px;">
          <h3 style="color: rgb(248, 106, 11); font-size: 20px; margin-bottom: 10px;">Step 2</h3>
          <p style="font-size: 16px;">Choose pilot project (recommend: critical feature)</p>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 5px;">
          <h3 style="color: rgb(248, 106, 11); font-size: 20px; margin-bottom: 10px;">Step 3</h3>
          <p style="font-size: 16px;">Watch us deliver in days what used to take months</p>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 40px;">
      <div style="background: rgb(248, 106, 11); padding: 25px 50px; border-radius: 5px; display: inline-block; cursor: pointer; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
        Approve Investment Now
      </div>
    </div>
    
    <p style="font-size: 20px; opacity: 0.9; line-height: 1.5;">
      Every day we wait, someone else is building faster.<br>
      <strong>The question isn't IF we should do this.<br>
      It's whether we'll be first or last.</strong>
    </p>
  </div>
`);

console.log('\n🚀 AI Software Future presentation complete!');
console.log('\n💡 Key Messages:');
console.log('   • Software development is being revolutionized RIGHT NOW');
console.log('   • We have the perfect combination: Grok 4 + Claude Code + Human');
console.log('   • $260/month investment returns 125x value');
console.log('   • First movers will dominate their markets');
console.log('   • The window of opportunity is closing fast');
console.log('\n📊 Presentation designed with OpenGov brand guidelines');
console.log('\nTime to build the future! 🔥');