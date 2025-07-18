/**
 * AI Canvas - Rapid Visual Communication Interface
 * A lightweight canvas for AI to create visual aids during conversations
 */

class AICanvas extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentContent = null;
    this.visualHistory = [];
    this.currentIndex = -1;
    this.setupWebSocket();
    this.setupKeyboardListeners();
  }

  connectedCallback() {
    this.render();
  }

  setupWebSocket() {
    // Prevent duplicate listeners
    if (this._wsListenerAttached) return;
    this._wsListenerAttached = true;
    
    // Listen for canvas updates via WebSocket
    this._canvasUpdateHandler = (event) => {
      // Prevent duplicate processing
      const data = event.detail;
      const now = Date.now();
      const isDuplicate = this.visualHistory.some(v => 
        v.type === data.type && 
        v.content === data.content && 
        Math.abs(v.id - now) < 1000 // Within 1 second (using ID which is timestamp-based)
      );
      
      if (!isDuplicate) {
        this.addToHistory(data);
        this.showContent(data, false); // false = don't add to history again
      }
    };
    
    window.addEventListener('canvas-update', this._canvasUpdateHandler);
  }

  setupKeyboardListeners() {
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Only handle if AI Canvas is visible
      if (!this.classList.contains('active')) return;
      
      // Don't handle if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.navigatePrevious();
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.navigateNext();
          }
          break;
        case 'ArrowUp':
        case 'Home':
          e.preventDefault();
          this.navigateFirst();
          break;
        case 'ArrowDown':
        case 'End':
          e.preventDefault();
          this.navigateLast();
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.toggleFullscreen();
          }
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          this.toggleGridView();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          this.clear();
          break;
        case 'h':
        case 'H':
        case '?':
          e.preventDefault();
          this.showKeyboardHelp();
          break;
        case 'Escape':
          if (this.shadowRoot.querySelector('.fullscreen')) {
            e.preventDefault();
            this.toggleFullscreen();
          }
          if (this.shadowRoot.querySelector('.keyboard-help')) {
            e.preventDefault();
            this.hideKeyboardHelp();
          }
          break;
        // Number keys for quick navigation
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            const index = parseInt(e.key) - 1;
            if (index < this.visualHistory.length) {
              this.navigateToIndex(index);
            }
          }
          break;
      }
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          width: 100%;
          height: 100%;
          overflow: auto;
          background: var(--panel-bg, #fff);
          position: relative;
        }

        :host(.active) {
          display: block;
        }

        .canvas-container {
          width: 100%;
          height: 100%;
          padding: 20px;
          box-sizing: border-box;
          position: relative;
        }

        .canvas-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border, #eee);
        }

        .canvas-title {
          font-size: 1.2em;
          font-weight: 600;
          color: var(--text-main, #000);
        }

        .canvas-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .slide-counter {
          padding: 0 15px;
          font-size: 0.9em;
          color: var(--text-secondary, #666);
          margin-right: 20px;
        }

        .visual-timeline {
          display: flex;
          gap: 5px;
          padding: 10px;
          background: var(--panel-bg, #fff);
          border-top: 1px solid var(--border, #eee);
          overflow-x: auto;
          min-height: 80px;
        }

        .timeline-item {
          min-width: 100px;
          height: 60px;
          border: 2px solid var(--border, #eee);
          border-radius: 4px;
          cursor: pointer;
          overflow: hidden;
          position: relative;
          background: #f5f5f5;
          transition: all 0.2s;
        }

        .timeline-item:hover {
          border-color: var(--accent, #0052cc);
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .timeline-item.active {
          border-color: var(--accent, #0052cc);
          border-width: 3px;
        }

        .timeline-item-type {
          position: absolute;
          top: 2px;
          right: 2px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          text-transform: uppercase;
        }

        .timeline-item-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          font-size: 8px;
          padding: 5px;
          overflow: hidden;
        }

        .presentation-modes {
          display: flex;
          gap: 5px;
        }

        .mode-button {
          padding: 4px 8px;
          background: transparent;
          border: 1px solid var(--border, #eee);
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8em;
          transition: all 0.2s;
        }

        .mode-button:hover {
          background: var(--accent, #0052cc);
          color: white;
          border-color: var(--accent, #0052cc);
        }

        .mode-button.active {
          background: var(--accent, #0052cc);
          color: white;
          border-color: var(--accent, #0052cc);
        }

        .grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          padding: 20px;
          overflow-y: auto;
        }

        .grid-item {
          border: 1px solid var(--border, #eee);
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }

        .grid-item:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .grid-item-header {
          background: var(--panel-bg, #fff);
          padding: 10px;
          border-bottom: 1px solid var(--border, #eee);
          font-size: 0.9em;
        }

        .grid-item-content {
          padding: 10px;
          max-height: 300px;
          overflow: hidden;
        }

        .keyboard-hint {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 10px 15px;
          border-radius: 4px;
          font-size: 0.8em;
          display: none;
        }

        .keyboard-hint.show {
          display: block;
        }

        /* Keyboard help overlay */
        .keyboard-help {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease;
        }

        .keyboard-help-content {
          background: var(--panel-bg, #fff);
          padding: 40px;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .keyboard-help h3 {
          margin: 0 0 20px 0;
          color: var(--text-main, #000);
          font-size: 1.5em;
          text-align: center;
        }

        .keyboard-help h4 {
          margin: 0 0 10px 0;
          color: var(--accent, #0052cc);
          font-size: 1.1em;
        }

        .keyboard-help-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 30px;
          margin-bottom: 20px;
        }

        .help-section {
          border-left: 3px solid var(--accent, #0052cc);
          padding-left: 15px;
        }

        .help-item {
          margin: 8px 0;
          color: var(--text-secondary, #333);
          font-size: 0.9em;
        }

        .help-item kbd {
          background: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 3px;
          padding: 2px 6px;
          font-family: monospace;
          font-size: 0.9em;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          margin-right: 5px;
        }

        .help-footer {
          text-align: center;
          color: var(--text-secondary, #666);
          font-size: 0.9em;
          margin-top: 20px;
          font-style: italic;
        }

        .canvas-button {
          padding: 6px 12px;
          background: var(--accent, #0052cc);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9em;
          transition: opacity 0.2s;
        }

        .canvas-button:hover {
          opacity: 0.8;
        }

        .canvas-button.secondary {
          background: transparent;
          color: var(--text-main, #000);
          border: 1px solid var(--border, #eee);
        }

        .content-area {
          width: 100%;
          min-height: 400px;
          background: var(--panel-bg, #fff);
          border-radius: 4px;
          padding: 20px;
          box-sizing: border-box;
        }

        /* Code display styles */
        .code-block {
          background: #f4f4f4;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 16px;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          line-height: 1.5;
        }

        .dark-theme .code-block {
          background: #2d2d2d;
          border-color: #444;
          color: #f8f8f2;
        }

        /* Diagram styles */
        .diagram-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }

        /* Wireframe styles */
        .wireframe {
          border: 2px dashed #999;
          border-radius: 4px;
          padding: 20px;
          background: #fafafa;
        }

        .dark-theme .wireframe {
          background: #2a2a2a;
          border-color: #666;
        }

        /* Progress styles */
        .progress-container {
          max-width: 600px;
          margin: 0 auto;
        }

        .progress-step {
          display: flex;
          align-items: center;
          margin: 10px 0;
          padding: 10px;
          border-radius: 4px;
          background: #f0f0f0;
        }

        .dark-theme .progress-step {
          background: #333;
        }

        .progress-step.active {
          background: #e3f2fd;
          border: 1px solid #2196f3;
        }

        .dark-theme .progress-step.active {
          background: #1e3a5f;
          border-color: #2196f3;
        }

        .progress-step.completed {
          background: #e8f5e9;
          border: 1px solid #4caf50;
        }

        .dark-theme .progress-step.completed {
          background: #1b3d1f;
          border-color: #4caf50;
        }

        /* Comparison styles */
        .comparison-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }

        .comparison-side {
          padding: 20px;
          border: 1px solid var(--border, #eee);
          border-radius: 4px;
        }

        .comparison-label {
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--text-secondary, #666);
        }

        /* Data visualization styles */
        .data-viz {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-secondary, #666);
        }

        .empty-state h3 {
          margin-bottom: 10px;
          color: var(--text-main, #000);
        }

        /* Animation for new content */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .content-area > * {
          animation: fadeIn 0.3s ease-out;
        }
      </style>

      <div class="canvas-container">
        <div class="canvas-header">
          <div class="canvas-title">AI Visual Communication</div>
          <div class="canvas-actions">
            <span class="slide-counter" id="slideCounter">0 / 0</span>
            <div class="presentation-modes">
              <button class="mode-button active" id="focusMode" title="Focus Mode">🎯</button>
              <button class="mode-button" id="gridMode" title="Grid View (G)">📊</button>
              <button class="mode-button" id="fullscreenMode" title="Fullscreen (F)">🎬</button>
            </div>
            <button class="canvas-button secondary" id="saveBtn">💾 Save</button>
            <label style="margin-left: 10px; font-size: 0.9em;">
              <input type="checkbox" id="publicToggle" style="margin-right: 5px;">
              Public
            </label>
            <button class="canvas-button secondary" id="clearBtn">Clear All</button>
          </div>
        </div>
        <div class="content-area" id="contentArea">
          <div class="empty-state">
            <h3>AI Canvas Ready</h3>
            <p>Visual content will appear here as we communicate</p>
            <div style="margin-top: 20px; font-size: 0.9em; color: #666;">
              <p><strong>Keyboard Shortcuts:</strong></p>
              <p>G: Grid View | F: Fullscreen</p>
            </div>
          </div>
        </div>
        <div class="visual-timeline" id="visualTimeline" style="display: none;">
          <!-- Timeline items will be added here -->
        </div>
        <div class="keyboard-hint" id="keyboardHint">
          ← → Navigate | G: Gallery | F: Fullscreen | H: Help
        </div>
      </div>
    `;

    // Add event listeners
    this.shadowRoot.getElementById('saveBtn').addEventListener('click', () => this.saveCurrentVisual());
    this.shadowRoot.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
    
    // Mode buttons
    this.shadowRoot.getElementById('focusMode').addEventListener('click', () => this.setMode('focus'));
    this.shadowRoot.getElementById('gridMode').addEventListener('click', () => this.toggleGridView());
    this.shadowRoot.getElementById('fullscreenMode').addEventListener('click', () => this.toggleFullscreen());
    
    // Show keyboard hint on hover
    this.addEventListener('mouseenter', () => this.showKeyboardHint());
    this.addEventListener('mouseleave', () => this.hideKeyboardHint());
  }

  addToHistory(data) {
    // Add to visual history
    const visual = {
      ...data,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };
    
    this.visualHistory.push(visual);
    this.currentIndex = this.visualHistory.length - 1;
    
    // Update timeline
    this.updateTimeline();
    this.updateNavigationState();
    
    // Show timeline if we have content
    if (this.visualHistory.length > 0) {
      this.shadowRoot.getElementById('visualTimeline').style.display = 'flex';
    }
  }

  showContent(data, updateHistory = true) {
    const { type, content, options = {} } = data;
    const contentArea = this.shadowRoot.getElementById('contentArea');
    
    // Show alert on tab
    this.showAlert();
    
    switch(type) {
      case 'code':
        contentArea.innerHTML = this.renderCode(content, options.language);
        break;
      case 'diagram':
        contentArea.innerHTML = this.renderDiagram(content, options);
        break;
      case 'wireframe':
        contentArea.innerHTML = this.renderWireframe(content);
        break;
      case 'comparison':
        contentArea.innerHTML = this.renderComparison(content.before, content.after, options);
        break;
      case 'progress':
        contentArea.innerHTML = this.renderProgress(content.steps, content.current);
        break;
      case 'data':
        contentArea.innerHTML = this.renderData(content, options.visualization);
        break;
      case 'html':
        contentArea.innerHTML = content;
        break;
      default:
        contentArea.innerHTML = `<div class="empty-state"><p>${content}</p></div>`;
    }
    
    this.currentContent = { type, content, options };
    
    if (updateHistory && !this.visualHistory.some(v => v.id === data.id)) {
      this.addToHistory(data);
    }
  }

  renderCode(code, language = 'javascript') {
    // For now, just display the code. In future, we could add syntax highlighting
    return `
      <div class="code-block">
        <pre><code>${this.escapeHtml(code)}</code></pre>
      </div>
    `;
  }

  renderDiagram(content, options) {
    // Simple SVG diagram rendering
    return `
      <div class="diagram-container">
        ${content}
      </div>
    `;
  }

  renderWireframe(description) {
    // Simple wireframe representation
    return `
      <div class="wireframe">
        ${description}
      </div>
    `;
  }

  renderComparison(before, after, options = {}) {
    return `
      <div class="comparison-container">
        <div class="comparison-side">
          <div class="comparison-label">${options.beforeLabel || 'Before'}</div>
          <div>${before}</div>
        </div>
        <div class="comparison-side">
          <div class="comparison-label">${options.afterLabel || 'After'}</div>
          <div>${after}</div>
        </div>
      </div>
    `;
  }

  renderProgress(steps, current) {
    return `
      <div class="progress-container">
        ${steps.map((step, index) => `
          <div class="progress-step ${index < current ? 'completed' : index === current ? 'active' : ''}">
            <span>${index + 1}. ${step}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderData(data, visualization) {
    // Simple data display - could be enhanced with actual charts
    return `
      <div class="data-viz">
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </div>
    `;
  }

  // Navigation methods
  navigateFirst() {
    if (this.visualHistory.length > 0) {
      this.currentIndex = 0;
      this.showContent(this.visualHistory[0], false);
      this.updateNavigationState();
    }
  }

  navigatePrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.showContent(this.visualHistory[this.currentIndex], false);
      this.updateNavigationState();
    }
  }

  navigateNext() {
    if (this.currentIndex < this.visualHistory.length - 1) {
      this.currentIndex++;
      this.showContent(this.visualHistory[this.currentIndex], false);
      this.updateNavigationState();
    }
  }

  navigateLast() {
    if (this.visualHistory.length > 0) {
      this.currentIndex = this.visualHistory.length - 1;
      this.showContent(this.visualHistory[this.currentIndex], false);
      this.updateNavigationState();
    }
  }

  navigateToIndex(index) {
    if (index >= 0 && index < this.visualHistory.length) {
      this.currentIndex = index;
      this.showContent(this.visualHistory[index], false);
      this.updateNavigationState();
    }
  }


  updateNavigationState() {
    const counter = this.shadowRoot.getElementById('slideCounter');
    
    // Update counter
    if (counter) {
      counter.textContent = `${this.currentIndex + 1} / ${this.visualHistory.length}`;
    }
    
    // Update timeline
    this.updateTimelineHighlight();
  }

  updateTimeline() {
    const timeline = this.shadowRoot.getElementById('visualTimeline');
    timeline.innerHTML = '';
    
    this.visualHistory.forEach((visual, index) => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      if (index === this.currentIndex) {
        item.classList.add('active');
      }
      
      // Add type indicator
      const typeLabel = document.createElement('div');
      typeLabel.className = 'timeline-item-type';
      typeLabel.textContent = visual.type;
      item.appendChild(typeLabel);
      
      // Add preview (simplified for now)
      const preview = document.createElement('div');
      preview.className = 'timeline-item-preview';
      preview.textContent = this.getPreviewText(visual);
      item.appendChild(preview);
      
      // Click to navigate
      item.addEventListener('click', () => this.navigateToIndex(index));
      
      timeline.appendChild(item);
    });
  }

  updateTimelineHighlight() {
    const items = this.shadowRoot.querySelectorAll('.timeline-item');
    items.forEach((item, index) => {
      if (index === this.currentIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  getPreviewText(visual) {
    switch(visual.type) {
      case 'code':
        return 'Code snippet';
      case 'diagram':
        return 'Diagram';
      case 'wireframe':
        return 'UI Wireframe';
      case 'comparison':
        return 'Comparison';
      case 'progress':
        return 'Progress';
      case 'data':
        return 'Data viz';
      case 'html':
        return 'Custom';
      default:
        return visual.type;
    }
  }

  clearAll() {
    this.visualHistory = [];
    this.currentIndex = -1;
    this.clear();
    this.updateNavigationState();
    this.shadowRoot.getElementById('visualTimeline').style.display = 'none';
  }

  clear() {
    const contentArea = this.shadowRoot.getElementById('contentArea');
    contentArea.innerHTML = `
      <div class="empty-state">
        <h3>AI Canvas Ready</h3>
        <p>Visual content will appear here as we communicate</p>
        <div style="margin-top: 20px; font-size: 0.9em; color: #666;">
          <p><strong>Keyboard Shortcuts:</strong></p>
          <p>G: Grid View | F: Fullscreen</p>
        </div>
      </div>
    `;
    this.currentContent = null;
  }


  showAlert() {
    const alertBadge = document.getElementById('canvas-alert');
    if (alertBadge) {
      alertBadge.style.display = 'inline-block';
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        alertBadge.style.display = 'none';
      }, 5000);
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Save current visual
  async saveCurrentVisual() {
    if (!this.currentContent) {
      alert('No visual to save!');
      return;
    }
    
    const isPublic = this.shadowRoot.getElementById('publicToggle').checked;
    const timestamp = new Date().toISOString();
    const filename = `ai-canvas-${timestamp.replace(/[:.]/g, '-')}.html`;
    
    // Create full HTML document
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <title>AI Canvas Visual - ${timestamp}</title>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .canvas-saved {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .metadata {
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .metadata h1 {
      margin: 0 0 10px 0;
      color: #333;
    }
    .metadata p {
      margin: 5px 0;
      color: #666;
    }
    .content {
      line-height: 1.6;
    }
    ${this.getContentStyles()}
  </style>
</head>
<body>
  <div class="canvas-saved">
    <div class="metadata">
      <h1>AI Canvas Visual</h1>
      <p><strong>Type:</strong> ${this.currentContent.type}</p>
      <p><strong>Saved:</strong> ${new Date().toLocaleString()}</p>
      ${this.currentContent.options?.title ? `<p><strong>Title:</strong> ${this.currentContent.options.title}</p>` : ''}
    </div>
    <div class="content">
      ${this.shadowRoot.getElementById('contentArea').innerHTML}
    </div>
  </div>
</body>
</html>`;
    
    // Save to server instead of downloading
    try {
      const response = await fetch('/api/canvas/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: fullHTML,
          type: this.currentContent.type,
          isPublic: isPublic
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save visual');
      }
      
      const result = await response.json();
      console.log('Visual saved:', result);
      
      // Visual feedback
      this.showSaveConfirmation(isPublic);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save visual: ' + error.message);
    }
  }
  
  getContentStyles() {
    // Extract relevant styles based on content type
    return `
      .code-block { background: #f4f4f4; border: 1px solid #ddd; border-radius: 4px; padding: 16px; overflow-x: auto; font-family: monospace; }
      .diagram-container { display: flex; justify-content: center; align-items: center; min-height: 300px; }
      .wireframe { border: 2px dashed #999; border-radius: 8px; padding: 20px; background: #fafafa; }
      .comparison-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
      .comparison-side { padding: 20px; border: 1px solid #eee; border-radius: 8px; }
      .progress-container { max-width: 600px; margin: 0 auto; }
      .progress-step { display: flex; align-items: center; margin: 10px 0; padding: 10px; border-radius: 4px; background: #f0f0f0; }
      .progress-step.active { background: #e3f2fd; border: 1px solid #2196f3; }
      .progress-step.completed { background: #e8f5e9; border: 1px solid #4caf50; }
    `;
  }
  
  showSaveConfirmation(isPublic) {
    const contentArea = this.shadowRoot.getElementById('contentArea');
    const originalContent = contentArea.innerHTML;
    
    contentArea.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 5em; margin-bottom: 20px;">${isPublic ? '🌍' : '🔒'}</div>
        <h2 style="color: #4caf50; margin-bottom: 10px;">Visual Saved!</h2>
        <p style="color: #666;">Saved to ${isPublic ? 'public' : 'private'} gallery</p>
        <p style="color: #999; font-size: 0.9em; margin-top: 10px;">
          ${isPublic ? 'This visual will be committed to the repository' : 'This visual will remain private'}
        </p>
      </div>
    `;
    
    // Restore original content after 2 seconds
    setTimeout(() => {
      contentArea.innerHTML = originalContent;
    }, 2000);
  }

  // Grid view methods
  toggleGridView() {
    const contentArea = this.shadowRoot.getElementById('contentArea');
    const focusBtn = this.shadowRoot.getElementById('focusMode');
    const gridBtn = this.shadowRoot.getElementById('gridMode');
    
    if (gridBtn.classList.contains('active')) {
      // Switch back to focus mode
      this.setMode('focus');
    } else {
      // Switch to grid mode
      focusBtn.classList.remove('active');
      gridBtn.classList.add('active');
      
      // Show grid view
      contentArea.innerHTML = '<div class="grid-view" id="gridView"></div>';
      const gridView = this.shadowRoot.getElementById('gridView');
      
      this.visualHistory.forEach((visual, index) => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.innerHTML = `
          <div class="grid-item-header">
            ${index + 1}. ${this.getPreviewText(visual)}
          </div>
          <div class="grid-item-content">
            ${this.getGridPreview(visual)}
          </div>
        `;
        
        gridItem.addEventListener('click', () => {
          this.setMode('focus');
          this.navigateToIndex(index);
        });
        
        gridView.appendChild(gridItem);
      });
    }
  }

  setMode(mode) {
    const focusBtn = this.shadowRoot.getElementById('focusMode');
    const gridBtn = this.shadowRoot.getElementById('gridMode');
    
    if (mode === 'focus') {
      focusBtn.classList.add('active');
      gridBtn.classList.remove('active');
      
      // Show current visual
      if (this.visualHistory.length > 0 && this.currentIndex >= 0) {
        this.showContent(this.visualHistory[this.currentIndex], false);
      } else {
        this.clear();
      }
    }
  }

  getGridPreview(visual) {
    // Return a simplified version for grid view
    switch(visual.type) {
      case 'code':
        return '<pre style="font-size: 10px; max-height: 200px; overflow: hidden;">Code preview...</pre>';
      case 'html':
        return '<div style="transform: scale(0.5); transform-origin: top left; width: 200%; height: 200%;">' + visual.content + '</div>';
      default:
        return '<div style="padding: 20px; text-align: center; color: #999;">Preview</div>';
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  showKeyboardHint() {
    const hint = this.shadowRoot.getElementById('keyboardHint');
    if (hint) {
      hint.classList.add('show');
    }
  }

  hideKeyboardHint() {
    const hint = this.shadowRoot.getElementById('keyboardHint');
    if (hint) {
      hint.classList.remove('show');
    }
  }

  showKeyboardHelp() {
    const helpOverlay = document.createElement('div');
    helpOverlay.className = 'keyboard-help';
    helpOverlay.innerHTML = `
      <div class="keyboard-help-content">
        <h3>⌨️ Keyboard Shortcuts</h3>
        <div class="keyboard-help-grid">
          <div class="help-section">
            <h4>Navigation</h4>
            <div class="help-item"><kbd>←</kbd> / <kbd>A</kbd> Previous visual</div>
            <div class="help-item"><kbd>→</kbd> / <kbd>D</kbd> Next visual</div>
            <div class="help-item"><kbd>↑</kbd> / <kbd>Home</kbd> First visual</div>
            <div class="help-item"><kbd>↓</kbd> / <kbd>End</kbd> Last visual</div>
            <div class="help-item"><kbd>1</kbd>-<kbd>9</kbd> Jump to visual N</div>
          </div>
          <div class="help-section">
            <h4>View Options</h4>
            <div class="help-item"><kbd>G</kbd> Toggle gallery view</div>
            <div class="help-item"><kbd>F</kbd> Toggle fullscreen</div>
            <div class="help-item"><kbd>C</kbd> Clear all visuals</div>
          </div>
          <div class="help-section">
            <h4>Other</h4>
            <div class="help-item"><kbd>H</kbd> / <kbd>?</kbd> Show this help</div>
            <div class="help-item"><kbd>Esc</kbd> Exit fullscreen/help</div>
          </div>
        </div>
        <p class="help-footer">Press any key to close</p>
      </div>
    `;
    
    this.shadowRoot.appendChild(helpOverlay);
    
    // Close on any key press
    const closeHelp = (e) => {
      e.preventDefault();
      this.hideKeyboardHelp();
      document.removeEventListener('keydown', closeHelp);
    };
    
    // Add slight delay to prevent immediate close from the 'h' key
    setTimeout(() => {
      document.addEventListener('keydown', closeHelp);
    }, 100);
  }

  hideKeyboardHelp() {
    const helpOverlay = this.shadowRoot.querySelector('.keyboard-help');
    if (helpOverlay) {
      helpOverlay.remove();
    }
  }
}

// Register the custom element
customElements.define('ai-canvas', AICanvas);

// Export for use in other modules
export default AICanvas;