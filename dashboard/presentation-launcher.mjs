/**
 * Presentation Launcher Component
 * Fullscreen presentation mode with professional transitions and controls
 */

import { LitElement, css, html } from "https://esm.sh/lit@3";

export class PresentationLauncher extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: var(--background-presentation, #000000);
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    :host([active]) {
      opacity: 1;
      pointer-events: auto;
    }

    .presentation-container {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--background-presentation, #000000);
    }

    /* Slide Container */
    .slide-viewport {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--slide-bg, #ffffff);
    }

    .slide.active {
      opacity: 1;
      transform: translateX(0);
    }

    .slide.prev {
      transform: translateX(-100%);
    }

    .slide iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: var(--slide-bg, #ffffff);
    }

    /* Controls */
    .controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 15px 30px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 50px;
      backdrop-filter: blur(10px);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    :host(:hover) .controls,
    .controls:hover {
      opacity: 1;
    }

    .control-button {
      background: transparent;
      border: none;
      color: var(--text-inverse);
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
    }

    .control-button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .control-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .slide-indicator {
      display: flex;
      gap: 8px;
      align-items: center;
      color: var(--text-inverse);
      font-size: 14px;
      font-family: var(--font-family);
      user-select: none;
    }

    .slide-dots {
      display: flex;
      gap: 6px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .dot.active {
      background: var(--slide-bg, #ffffff);
      transform: scale(1.2);
    }

    .dot:hover {
      background: rgba(255, 255, 255, 0.6);
    }

    /* Side Navigation */
    .nav-button {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.5);
      border: none;
      color: var(--text-inverse);
      padding: 20px 15px;
      cursor: pointer;
      font-size: 24px;
      transition: all 0.3s ease;
      opacity: 0;
    }

    :host(:hover) .nav-button {
      opacity: 1;
    }

    .nav-button:hover {
      background: rgba(0, 0, 0, 0.8);
    }

    .nav-button.prev {
      left: 20px;
    }

    .nav-button.next {
      right: 20px;
    }

    /* Header */
    .presentation-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 20px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    :host(:hover) .presentation-header {
      opacity: 1;
    }

    .presentation-title {
      color: var(--text-inverse);
      font-size: 18px;
      font-weight: 600;
      font-family: var(--font-family);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .exit-button {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: var(--text-inverse);
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
    }

    .exit-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Progress Bar */
    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.1);
    }

    .progress-fill {
      height: 100%;
      background: var(--accent, #2196f3);
      transition: width 0.3s ease;
    }

    /* Loading State */
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: var(--text-inverse);
      font-size: 18px;
      font-family: var(--font-family);
    }

    /* Thumbnail Grid */
    .thumbnail-grid {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      display: none;
      padding: 80px 40px 40px;
      overflow-y: auto;
      z-index: 10;
    }

    :host([show-grid]) .thumbnail-grid {
      display: block;
    }

    .grid-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 20px 40px;
      background: rgba(0, 0, 0, 0.9);
      z-index: 11;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .grid-title {
      color: var(--text-inverse);
      font-size: 20px;
      font-weight: 600;
    }

    .close-grid {
      background: transparent;
      border: none;
      color: var(--text-inverse);
      font-size: 24px;
      cursor: pointer;
      padding: 8px;
    }

    .thumbnails {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .thumbnail-item {
      background: var(--background-secondary);
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .thumbnail-item:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }

    .thumbnail-item.active {
      outline: 3px solid var(--accent, #2196f3);
    }

    .thumbnail-content {
      height: 150px;
      position: relative;
      overflow: hidden;
    }

    .thumbnail-content iframe {
      width: 100%;
      height: 300px;
      transform: scale(0.5);
      transform-origin: top left;
      pointer-events: none;
    }

    .thumbnail-number {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: var(--text-inverse);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    /* Presenter Notes */
    .presenter-notes {
      position: absolute;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 800px;
      padding: 20px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      color: var(--text-inverse);
      font-size: 16px;
      line-height: 1.5;
      display: none;
    }

    :host([show-notes]) .presenter-notes {
      display: block;
    }

    /* Keyboard Shortcuts Help */
    .shortcuts-help {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      padding: 30px;
      border-radius: 12px;
      color: var(--text-inverse);
      display: none;
      z-index: 20;
    }

    :host([show-help]) .shortcuts-help {
      display: block;
    }

    .shortcuts-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .shortcut-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .shortcut-key {
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
    }
  `;

  static properties = {
    active: { type: Boolean, reflect: true },
    slides: { type: Array },
    currentIndex: { type: Number },
    setData: { type: Object },
    showGrid: { type: Boolean, attribute: 'show-grid', reflect: true },
    showNotes: { type: Boolean, attribute: 'show-notes', reflect: true },
    showHelp: { type: Boolean, attribute: 'show-help', reflect: true },
    loading: { type: Boolean }
  };

  constructor() {
    super();
    this.active = false;
    this.slides = [];
    this.currentIndex = 0;
    this.setData = null;
    this.showGrid = false;
    this.showNotes = false;
    this.showHelp = false;
    this.loading = false;
    
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('launch-presentation', this.handleLaunchPresentation.bind(this));
    document.addEventListener('keydown', this.handleKeydown);
  }

  removeEventListeners() {
    window.removeEventListener('launch-presentation', this.handleLaunchPresentation.bind(this));
    document.removeEventListener('keydown', this.handleKeydown);
  }

  async handleLaunchPresentation(event) {
    const { set, slides } = event.detail;
    this.setData = set;
    this.slides = slides;
    this.currentIndex = 0;
    this.active = true;
    
    // Enter fullscreen
    if (document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.log('Fullscreen request failed:', error);
      }
    }
  }

  render() {
    if (!this.active) return '';

    return html`
      <div class="presentation-container">
        ${this.renderHeader()}
        ${this.renderSlides()}
        ${this.renderControls()}
        ${this.renderSideNavigation()}
        ${this.renderProgressBar()}
        ${this.renderThumbnailGrid()}
        ${this.renderPresenterNotes()}
        ${this.renderKeyboardHelp()}
      </div>
    `;
  }

  renderHeader() {
    return html`
      <div class="presentation-header">
        <div class="presentation-title">
          <span>${this.setData?.icon || '📊'}</span>
          <span>${this.setData?.name || 'Presentation'}</span>
        </div>
        <button class="exit-button" @click=${() => this.exit()}>
          Exit Presentation
        </button>
      </div>
    `;
  }

  renderSlides() {
    if (this.loading) {
      return html`<div class="loading">Loading slides...</div>`;
    }

    return html`
      <div class="slide-viewport">
        ${this.slides.map((slide, index) => html`
          <div class="slide ${index === this.currentIndex ? 'active' : index < this.currentIndex ? 'prev' : ''}">
            <iframe src=${slide.path} sandbox="allow-same-origin allow-scripts"></iframe>
          </div>
        `)}
      </div>
    `;
  }

  renderControls() {
    return html`
      <div class="controls">
        <button 
          class="control-button" 
          @click=${this.firstSlide}
          ?disabled=${this.currentIndex === 0}
          title="First slide (Home)"
        >
          ⏮
        </button>
        <button 
          class="control-button" 
          @click=${this.previousSlide}
          ?disabled=${this.currentIndex === 0}
          title="Previous slide (←)"
        >
          ◀
        </button>
        
        <div class="slide-indicator">
          <span>${this.currentIndex + 1} / ${this.slides.length}</span>
          <div class="slide-dots">
            ${this.slides.slice(0, 10).map((_, index) => html`
              <div 
                class="dot ${index === this.currentIndex ? 'active' : ''}"
                @click=${() => this.goToSlide(index)}
              ></div>
            `)}
            ${this.slides.length > 10 ? html`<span style="color: white;">...</span>` : ''}
          </div>
        </div>
        
        <button 
          class="control-button" 
          @click=${this.nextSlide}
          ?disabled=${this.currentIndex === this.slides.length - 1}
          title="Next slide (→)"
        >
          ▶
        </button>
        <button 
          class="control-button" 
          @click=${this.lastSlide}
          ?disabled=${this.currentIndex === this.slides.length - 1}
          title="Last slide (End)"
        >
          ⏭
        </button>
        
        <button 
          class="control-button" 
          @click=${this.toggleGrid}
          title="Slide grid (G)"
        >
          ⊞
        </button>
        
        <button 
          class="control-button" 
          @click=${this.toggleFullscreen}
          title="Toggle fullscreen (F)"
        >
          ⛶
        </button>
      </div>
    `;
  }

  renderSideNavigation() {
    return html`
      <button 
        class="nav-button prev" 
        @click=${this.previousSlide}
        ?disabled=${this.currentIndex === 0}
      >
        ‹
      </button>
      <button 
        class="nav-button next" 
        @click=${this.nextSlide}
        ?disabled=${this.currentIndex === this.slides.length - 1}
      >
        ›
      </button>
    `;
  }

  renderProgressBar() {
    const progress = ((this.currentIndex + 1) / this.slides.length) * 100;
    
    return html`
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
    `;
  }

  renderThumbnailGrid() {
    return html`
      <div class="thumbnail-grid">
        <div class="grid-header">
          <div class="grid-title">All Slides</div>
          <button class="close-grid" @click=${this.toggleGrid}>✕</button>
        </div>
        <div class="thumbnails">
          ${this.slides.map((slide, index) => html`
            <div 
              class="thumbnail-item ${index === this.currentIndex ? 'active' : ''}"
              @click=${() => this.goToSlide(index)}
            >
              <div class="thumbnail-content">
                <iframe src=${slide.path} sandbox="allow-same-origin"></iframe>
                <div class="thumbnail-number">Slide ${index + 1}</div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  renderPresenterNotes() {
    const notes = this.slides[this.currentIndex]?.notes || '';
    if (!notes) return '';
    
    return html`
      <div class="presenter-notes">
        ${notes}
      </div>
    `;
  }

  renderKeyboardHelp() {
    return html`
      <div class="shortcuts-help">
        <h3 class="shortcuts-title">Keyboard Shortcuts</h3>
        <div class="shortcut-item">
          <span>Next slide</span>
          <span><span class="shortcut-key">→</span> or <span class="shortcut-key">Space</span></span>
        </div>
        <div class="shortcut-item">
          <span>Previous slide</span>
          <span><span class="shortcut-key">←</span></span>
        </div>
        <div class="shortcut-item">
          <span>First slide</span>
          <span><span class="shortcut-key">Home</span></span>
        </div>
        <div class="shortcut-item">
          <span>Last slide</span>
          <span><span class="shortcut-key">End</span></span>
        </div>
        <div class="shortcut-item">
          <span>Go to slide</span>
          <span><span class="shortcut-key">1-9</span></span>
        </div>
        <div class="shortcut-item">
          <span>Toggle grid</span>
          <span><span class="shortcut-key">G</span></span>
        </div>
        <div class="shortcut-item">
          <span>Toggle fullscreen</span>
          <span><span class="shortcut-key">F</span></span>
        </div>
        <div class="shortcut-item">
          <span>Toggle notes</span>
          <span><span class="shortcut-key">N</span></span>
        </div>
        <div class="shortcut-item">
          <span>Show this help</span>
          <span><span class="shortcut-key">?</span></span>
        </div>
        <div class="shortcut-item">
          <span>Exit presentation</span>
          <span><span class="shortcut-key">Esc</span></span>
        </div>
      </div>
    `;
  }

  // Navigation Methods
  nextSlide() {
    if (this.currentIndex < this.slides.length - 1) {
      this.currentIndex++;
    }
  }

  previousSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  firstSlide() {
    this.currentIndex = 0;
  }

  lastSlide() {
    this.currentIndex = this.slides.length - 1;
  }

  goToSlide(index) {
    if (index >= 0 && index < this.slides.length) {
      this.currentIndex = index;
      this.showGrid = false;
    }
  }

  // Toggle Methods
  toggleGrid() {
    this.showGrid = !this.showGrid;
  }

  toggleNotes() {
    this.showNotes = !this.showNotes;
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  // Keyboard Navigation
  handleKeydown(e) {
    if (!this.active) return;
    
    // Don't handle if help is shown and key is not Escape or ?
    if (this.showHelp && e.key !== 'Escape' && e.key !== '?') {
      return;
    }
    
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        this.nextSlide();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.previousSlide();
        break;
      case 'Home':
        e.preventDefault();
        this.firstSlide();
        break;
      case 'End':
        e.preventDefault();
        this.lastSlide();
        break;
      case 'g':
      case 'G':
        e.preventDefault();
        this.toggleGrid();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        this.toggleFullscreen();
        break;
      case 'n':
      case 'N':
        e.preventDefault();
        this.toggleNotes();
        break;
      case '?':
        e.preventDefault();
        this.showHelp = !this.showHelp;
        break;
      case 'Escape':
        e.preventDefault();
        if (this.showHelp) {
          this.showHelp = false;
        } else if (this.showGrid) {
          this.showGrid = false;
        } else {
          this.exit();
        }
        break;
      default:
        // Number keys for direct slide navigation
        if (e.key >= '1' && e.key <= '9') {
          e.preventDefault();
          const slideIndex = parseInt(e.key) - 1;
          this.goToSlide(slideIndex);
        }
    }
  }

  // Exit Presentation
  async exit() {
    // Exit fullscreen first if active
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (e) {
        console.log('Failed to exit fullscreen:', e);
      }
    }
    
    // Reset all state
    this.active = false;
    this.slides = [];
    this.currentIndex = 0;
    this.setData = null;
    this.showGrid = false;
    this.showNotes = false;
    this.showHelp = false;
    
    // Force update to ensure component hides
    this.requestUpdate();
    
    // Dispatch event to notify parent
    this.dispatchEvent(new CustomEvent('presentation-closed', {
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('presentation-launcher', PresentationLauncher);