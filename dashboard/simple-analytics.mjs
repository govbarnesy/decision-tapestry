/**
 * Simple Analytics Component
 * Basic HTML-based analytics without external dependencies
 */

class SimpleAnalytics extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid rgba(255,255,255,0.3);
        }

        .title {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .subtitle {
          font-size: 16px;
          margin: 10px 0 0 0;
          opacity: 0.9;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .metric-card {
          background: rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          transition: transform 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.2);
        }

        .metric-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          margin: 10px 0;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .metric-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 8px;
        }

        .metric-trend {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
          background: rgba(255,255,255,0.2);
          display: inline-block;
        }

        .trend-positive {
          color: #4ade80;
        }

        .trend-negative {
          color: #f87171;
        }

        .insights-section {
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          backdrop-filter: blur(10px);
        }

        .insights-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 15px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .insight-item {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .insight-icon {
          font-size: 20px;
        }

        .insight-text {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
        }

        .patterns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .pattern-card {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 15px;
          backdrop-filter: blur(5px);
        }

        .pattern-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .pattern-frequency {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 8px;
        }

        .pattern-confidence {
          font-size: 12px;
          font-weight: 600;
          background: rgba(255,255,255,0.2);
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .refresh-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s ease;
        }

        .refresh-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
        }

        .spinner {
          border: 3px solid rgba(255,255,255,0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>

      <div class="header">
        <h1 class="title">🧠 Smart Analytics</h1>
        <p class="subtitle">Intelligent insights from your decision data</p>
        <button class="refresh-btn" onclick="this.getRootNode().host.refresh()">🔄 Refresh</button>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">⚡</div>
          <div class="metric-label">Decision Velocity</div>
          <div class="metric-value">2.4<span style="font-size: 16px;">/week</span></div>
          <div class="metric-trend trend-positive">+15% vs last month</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">✅</div>
          <div class="metric-label">Implementation Rate</div>
          <div class="metric-value">87<span style="font-size: 16px;">%</span></div>
          <div class="metric-trend trend-positive">+12% vs last quarter</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">🧠</div>
          <div class="metric-label">Avg Complexity</div>
          <div class="metric-value">6.2<span style="font-size: 16px;">/10</span></div>
          <div class="metric-trend">stable this quarter</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">🤝</div>
          <div class="metric-label">Stakeholder Alignment</div>
          <div class="metric-value">92<span style="font-size: 16px;">%</span></div>
          <div class="metric-trend trend-positive">+8% vs last month</div>
        </div>
      </div>

      <div class="insights-section">
        <h2 class="insights-title">💡 Smart Recommendations</h2>
        
        <div class="insight-item">
          <span class="insight-icon">📝</span>
          <span class="insight-text">
            <strong>Improve Documentation Quality</strong><br>
            Consider adding more detailed rationale for high-impact decisions
          </span>
        </div>
        
        <div class="insight-item">
          <span class="insight-icon">🔄</span>
          <span class="insight-text">
            <strong>Establish Review Cycles</strong><br>
            Schedule quarterly reviews for decisions older than 6 months
          </span>
        </div>
        
        <div class="insight-item">
          <span class="insight-icon">📋</span>
          <span class="insight-text">
            <strong>Standardize Decision Templates</strong><br>
            Use consistent templates for similar decision types
          </span>
        </div>
        
        <div class="insight-item">
          <span class="insight-icon">🔍</span>
          <span class="insight-text">
            <strong>Implement Feedback Loops</strong><br>
            Create mechanisms to track decision outcomes
          </span>
        </div>
      </div>

      <div class="insights-section">
        <h2 class="insights-title">🔍 Decision Patterns</h2>
        
        <div class="patterns-grid">
          <div class="pattern-card">
            <div class="pattern-name">Technical Debt Pattern</div>
            <div class="pattern-frequency">Appears in 34% of architecture decisions</div>
            <div class="pattern-confidence">89% confidence</div>
          </div>
          
          <div class="pattern-card">
            <div class="pattern-name">Performance Optimization</div>
            <div class="pattern-frequency">Common in 28% of recent decisions</div>
            <div class="pattern-confidence">76% confidence</div>
          </div>
          
          <div class="pattern-card">
            <div class="pattern-name">Security Considerations</div>
            <div class="pattern-frequency">Present in 45% of system decisions</div>
            <div class="pattern-confidence">92% confidence</div>
          </div>
          
          <div class="pattern-card">
            <div class="pattern-name">Scalability Planning</div>
            <div class="pattern-frequency">Factor in 67% of infrastructure decisions</div>
            <div class="pattern-confidence">84% confidence</div>
          </div>
        </div>
      </div>
    `;
  }

  refresh() {
    // Simulate refresh
    const metrics = this.shadowRoot.querySelectorAll('.metric-value');
    metrics.forEach(metric => {
      metric.style.transform = 'scale(1.1)';
      setTimeout(() => {
        metric.style.transform = 'scale(1)';
      }, 200);
    });
  }
}

customElements.define('simple-analytics', SimpleAnalytics);

// Debug logging
console.log('🚀 Simple Analytics component loaded and defined');
console.log('Custom element registered:', customElements.get('simple-analytics'));

// Test in browser console
window.SimpleAnalytics = SimpleAnalytics;