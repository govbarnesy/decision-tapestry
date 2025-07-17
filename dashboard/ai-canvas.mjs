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
    // Listen for canvas updates via WebSocket
    window.addEventListener('canvas-update', (event) => {
      this.addToHistory(event.detail);
      this.showContent(event.detail);
    });
  }

  setupKeyboardListeners() {
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Only handle if AI Canvas is visible
      if (!this.classList.contains('active')) return;
      
      switch(e.key) {
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
          border-radius: 8px;
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
          border-radius: 8px;
          font-size: 0.8em;
          display: none;
        }

        .keyboard-hint.show {
          display: block;
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
          border-radius: 8px;
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
          border-radius: 8px;
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
          border-radius: 8px;
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
          G: Grid View | F: Fullscreen
        </div>
      </div>
    `;

    // Add event listeners
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
}

// Register the custom element
customElements.define('ai-canvas', AICanvas);

// Export for use in other modules
export default AICanvas;