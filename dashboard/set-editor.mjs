/**
 * Set Editor Component
 * Modal for creating and editing presentation sets with drag-and-drop reordering
 */

import { LitElement, css, html } from "https://esm.sh/lit@3";
import './slide-thumbnail-component.mjs';

export class SetEditor extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2000;
      pointer-events: none;
    }

    .modal-overlay {
      position: absolute;
      inset: 0;
      background: var(--modal-overlay);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    :host([open]) .modal-overlay {
      opacity: 1;
      pointer-events: auto;
    }

    .modal {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: var(--panel-bg);
      border-radius: 16px;
      box-shadow: var(--shadow-xl);
      max-width: 1200px;
      width: 90vw;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      opacity: 0;
      transition: all 0.3s ease;
      pointer-events: none;
    }

    :host([open]) .modal {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
      pointer-events: auto;
    }

    /* Modal Header */
    .modal-header {
      padding: 30px;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-title {
      font-size: 1.8em;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .modal-subtitle {
      color: var(--text-secondary);
      font-size: 1em;
    }

    /* Modal Body */
    .modal-body {
      flex: 1;
      padding: 30px;
      overflow-y: auto;
      display: flex;
      gap: 30px;
    }

    /* Left Panel - Form */
    .form-panel {
      flex: 0 0 350px;
    }

    .form-group {
      margin-bottom: 25px;
    }

    .form-label {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
      font-size: 0.95em;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      font-size: 1em;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-light);
    }

    .form-textarea {
      min-height: 100px;
      resize: vertical;
    }

    .icon-picker {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .icon-option {
      width: 40px;
      height: 40px;
      border: 2px solid transparent;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3em;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .icon-option:hover {
      background: var(--hover-bg);
    }

    .icon-option.selected {
      border-color: var(--color-primary);
      background: var(--color-primary-light);
    }

    /* Right Panel - Slides */
    .slides-panel {
      flex: 1;
      min-width: 0;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .panel-title {
      font-size: 1.2em;
      font-weight: 600;
      color: var(--text-primary);
    }

    .slide-count {
      color: var(--text-secondary);
      font-size: 0.9em;
    }

    /* Slide Sources */
    .slide-sources {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--border, #e0e0e0);
    }

    .source-tab {
      padding: 8px 16px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-weight: 600;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .source-tab:hover {
      background: var(--hover-bg);
    }

    .source-tab.active {
      background: var(--color-primary);
      color: white;
    }

    /* Available Slides Grid */
    .available-slides {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
      max-height: 300px;
      overflow-y: auto;
      padding: 15px;
      background: var(--background-secondary);
      border-radius: 12px;
      margin-bottom: 30px;
    }

    /* Selected Slides - Sortable */
    .selected-slides-header {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .clear-button {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 0.9em;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .clear-button:hover {
      background: var(--hover-bg);
      color: var(--text-primary);
    }

    .selected-slides {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      min-height: 200px;
      padding: 20px;
      background: var(--background-secondary);
      border: 2px dashed var(--border-color);
      border-radius: 12px;
      position: relative;
    }

    .selected-slides.drag-over {
      border-color: var(--color-primary);
      background: var(--color-primary-light);
    }

    .selected-slides-empty {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary, #999);
      font-size: 1.1em;
      pointer-events: none;
    }

    /* Slide Card */
    .slide-card {
      background: var(--panel-bg);
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .slide-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .slide-card.selected {
      border: 3px solid var(--accent, #2196f3);
    }

    .slide-card.dragging {
      opacity: 0.5;
      cursor: grabbing;
      transform: rotate(2deg);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    
    .slide-card {
      cursor: grab;
      transition: all 0.2s ease;
    }
    
    .slide-card:active {
      cursor: grabbing;
    }

    .slide-card.drag-placeholder {
      background: var(--color-primary-light);
      border: 2px dashed var(--accent, #2196f3);
      box-shadow: none;
    }

    .slide-thumbnail {
      height: 200px;
      background: #ffffff;
      position: relative;
      overflow: hidden;
      border: 1px solid var(--border-color);
      border-radius: 8px 8px 0 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    body.dark-theme .slide-thumbnail {
      background: #1a1a1a;
    }

    .slide-thumbnail iframe {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 1600px;
      height: 900px;
      transform: translate(-50%, -50%) scale(0.125);
      border: none;
      pointer-events: none;
      background: white;
      border-radius: 4px;
    }

    .slide-number {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75em;
      font-weight: 600;
      backdrop-filter: blur(4px);
      z-index: 2;
    }
    
    .slide-metadata {
      position: absolute;
      bottom: 8px;
      left: 8px;
      right: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      z-index: 2;
    }
    
    .slide-type {
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.7em;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      backdrop-filter: blur(4px);
    }
    
    .slide-time {
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.7em;
      font-weight: 500;
      backdrop-filter: blur(4px);
    }
    
    .slide-status {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;
      min-height: 30px;
    }
    
    .selected-indicator {
      color: var(--color-success);
      font-weight: 700;
      font-size: 1.2em;
    }
    
    .private-indicator {
      font-size: 1em;
    }

    .slide-actions {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 4px;
    }

    .slide-action {
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.75em;
      transition: all 0.2s ease;
    }

    .slide-action:hover {
      background: rgba(0, 0, 0, 0.9);
    }

    .slide-info {
      padding: 10px;
      background: var(--panel-bg);
    }

    .slide-title {
      font-size: 0.85em;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Modal Footer */
    .modal-footer {
      padding: 20px 30px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-info {
      color: var(--text-secondary);
      font-size: 0.9em;
    }

    .footer-actions {
      display: flex;
      gap: 12px;
    }

    .button {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1em;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .button.primary {
      background: var(--color-primary);
      color: white;
    }

    .button.primary:hover {
      background: var(--color-primary-hover);
      transform: translateY(-1px);
    }

    .button.secondary {
      background: var(--background-secondary);
      color: var(--text-primary);
    }

    .button.secondary:hover {
      background: var(--hover-bg);
    }

    /* Loading State */
    .loading-overlay {
      position: absolute;
      inset: 0;
      background: var(--panel-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border, #e0e0e0);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  static properties = {
    open: { type: Boolean, reflect: true },
    mode: { type: String }, // 'create' or 'edit'
    editingSet: { type: Object },
    visuals: { type: Array },
    selectedSlides: { type: Array },
    sourceTab: { type: String },
    selectedIcon: { type: String },
    loading: { type: Boolean },
    draggedSlide: { type: Object }
  };

  constructor() {
    super();
    this.open = false;
    this.mode = 'create';
    this.editingSet = null;
    this.visuals = [];
    this.selectedSlides = [];
    this.sourceTab = 'all';
    this.selectedIcon = '📊';
    this.loading = false;
    this.draggedSlide = null;
    
    this.icons = ['📊', '📈', '📉', '💼', '🎯', '🚀', '💡', '📚', '🎨', '🔬', '🏆', '🌟'];
  }

  async connectedCallback() {
    super.connectedCallback();
    this.setupEventListeners();
    await this.loadVisuals();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('open-set-editor', this.handleOpenEditor.bind(this));
  }

  removeEventListeners() {
    window.removeEventListener('open-set-editor', this.handleOpenEditor.bind(this));
  }

  async loadVisuals() {
    try {
      const [privateRes, publicRes] = await Promise.all([
        fetch('/api/gallery/private'),
        fetch('/api/gallery/public')
      ]);

      const privateData = privateRes.ok ? await privateRes.json() : { visuals: [] };
      const publicData = publicRes.ok ? await publicRes.json() : { visuals: [] };

      this.visuals = [
        ...privateData.visuals.map(v => ({ ...v, isPrivate: true })),
        ...publicData.visuals.map(v => ({ ...v, isPrivate: false }))
      ];
    } catch (error) {
      console.error('Error loading visuals:', error);
      this.visuals = [];
    }
  }

  handleOpenEditor(event) {
    const { mode, set } = event.detail;
    this.mode = mode;
    this.editingSet = set || null;
    
    if (mode === 'edit' && set) {
      this.selectedIcon = set.icon || '📊';
      this.selectedSlides = [...(set.slideIds || [])];
      
      // Populate form
      setTimeout(() => {
        const form = this.shadowRoot.querySelector('form');
        if (form) {
          form.name.value = set.name || '';
          form.description.value = set.description || '';
        }
      }, 100);
    } else {
      this.selectedIcon = '📊';
      this.selectedSlides = [];
    }
    
    this.open = true;
  }

  render() {
    if (!this.open) return '';

    return html`
      <div class="modal-overlay" @click=${this.close}></div>
      <div class="modal" @click=${(e) => e.stopPropagation()}>
        ${this.renderHeader()}
        ${this.renderBody()}
        ${this.renderFooter()}
        ${this.loading ? html`<div class="loading-overlay"><div class="spinner"></div></div>` : ''}
      </div>
    `;
  }

  renderHeader() {
    return html`
      <div class="modal-header">
        <h2 class="modal-title">
          ${this.mode === 'create' ? 'Create New Presentation Set' : 'Edit Presentation Set'}
        </h2>
        <p class="modal-subtitle">
          Organize your AI Canvas visuals into a professional presentation
        </p>
      </div>
    `;
  }

  renderBody() {
    return html`
      <div class="modal-body">
        <div class="form-panel">
          <form id="set-form" @submit=${this.handleSubmit}>
            <div class="form-group">
              <label class="form-label">Set Name</label>
              <input 
                class="form-input" 
                type="text" 
                name="name" 
                placeholder="e.g., Q4 2024 Roadmap"
                required
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Icon</label>
              <div class="icon-picker">
                ${this.icons.map(icon => html`
                  <button 
                    type="button"
                    class="icon-option ${this.selectedIcon === icon ? 'selected' : ''}"
                    @click=${() => this.selectedIcon = icon}
                  >
                    ${icon}
                  </button>
                `)}
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Description (optional)</label>
              <textarea 
                class="form-textarea" 
                name="description" 
                placeholder="Brief description of this presentation..."
              ></textarea>
            </div>
          </form>
        </div>
        
        <div class="slides-panel">
          ${this.renderSlideSelector()}
        </div>
      </div>
    `;
  }

  renderSlideSelector() {
    const filteredVisuals = this.filterVisuals();

    return html`
      <div class="panel-header">
        <h3 class="panel-title">Select and Order Slides</h3>
        <span class="slide-count">${this.selectedSlides.length} slides selected</span>
      </div>
      
      <div class="slide-sources">
        <button 
          class="source-tab ${this.sourceTab === 'all' ? 'active' : ''}"
          @click=${() => this.sourceTab = 'all'}
        >
          All Visuals
        </button>
        <button 
          class="source-tab ${this.sourceTab === 'public' ? 'active' : ''}"
          @click=${() => this.sourceTab = 'public'}
        >
          Public Only
        </button>
        <button 
          class="source-tab ${this.sourceTab === 'private' ? 'active' : ''}"
          @click=${() => this.sourceTab = 'private'}
        >
          Private Only
        </button>
      </div>
      
      <div class="available-slides">
        ${filteredVisuals.map(visual => this.renderAvailableSlide(visual))}
      </div>
      
      <div class="selected-slides-header">
        Selected Slides (drag to reorder)
        ${this.selectedSlides.length > 0 ? html`
          <button class="clear-button" @click=${() => this.selectedSlides = []}>
            Clear all
          </button>
        ` : ''}
      </div>
      
      <div 
        class="selected-slides"
        @dragover=${this.handleDragOver}
        @drop=${this.handleDrop}
        @dragenter=${this.handleDragEnter}
        @dragleave=${this.handleDragLeave}
      >
        ${this.selectedSlides.length === 0 ? html`
          <div class="selected-slides-empty">
            Click visuals above to add them to your presentation
          </div>
        ` : ''}
        ${this.selectedSlides.map((slideId, index) => {
          const visual = this.visuals.find(v => v.filename === slideId);
          return visual ? this.renderSelectedSlide(visual, index) : '';
        })}
      </div>
    `;
  }

  renderAvailableSlide(visual) {
    const isSelected = this.selectedSlides.includes(visual.filename);
    const { type, timeInfo } = this.extractVisualInfo(visual.filename);
    
    return html`
      <div 
        class="slide-card ${isSelected ? 'selected' : ''}"
        @click=${() => this.toggleSlideSelection(visual.filename)}
        title="Click to ${isSelected ? 'remove' : 'add'}"
      >
        <div class="slide-thumbnail">
          <iframe 
            src=${visual.path} 
            sandbox="allow-same-origin allow-scripts"
            loading="lazy"
            @load=${() => this.handleThumbnailLoad(visual.filename)}
          ></iframe>
          <div class="slide-metadata">
            <span class="slide-type">${type}</span>
            ${timeInfo ? html`<span class="slide-time">${timeInfo}</span>` : ''}
          </div>
        </div>
        <div class="slide-info">
          <div class="slide-status">
            ${isSelected ? html`<span class="selected-indicator">✓</span>` : ''}
            ${visual.isPrivate ? html`<span class="private-indicator">🔒</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderSelectedSlide(visual, index) {
    const { type, timeInfo } = this.extractVisualInfo(visual.filename);
    
    return html`
      <div 
        class="slide-card"
        draggable="true"
        data-slide-id=${visual.filename}
        data-index=${index}
        @dragstart=${this.handleDragStart}
        @dragend=${this.handleDragEnd}
        title="Drag to reorder"
      >
        <div class="slide-thumbnail">
          <iframe 
            src=${visual.path} 
            sandbox="allow-same-origin allow-scripts"
            loading="lazy"
            @load=${() => this.handleThumbnailLoad(visual.filename)}
          ></iframe>
          <div class="slide-number">${index + 1}</div>
          <div class="slide-metadata">
            <span class="slide-type">${type}</span>
            ${timeInfo ? html`<span class="slide-time">${timeInfo}</span>` : ''}
          </div>
          <div class="slide-actions">
            <button 
              class="slide-action"
              @click=${(e) => this.removeSlide(e, visual.filename)}
              title="Remove from set"
              aria-label="Remove slide ${index + 1}"
            >
              ✕
            </button>
          </div>
        </div>
        <div class="slide-info">
          <div class="slide-status">
            ${visual.isPrivate ? html`<span class="private-indicator">🔒</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderFooter() {
    return html`
      <div class="modal-footer">
        <div class="footer-info">
          ${this.selectedSlides.length} slide${this.selectedSlides.length !== 1 ? 's' : ''} selected
        </div>
        <div class="footer-actions">
          <button class="button secondary" @click=${this.close}>
            Cancel
          </button>
          <button class="button primary" @click=${this.save}>
            ${this.mode === 'create' ? 'Create Set' : 'Update Set'}
          </button>
        </div>
      </div>
    `;
  }

  // Event Handlers
  toggleSlideSelection(filename) {
    const index = this.selectedSlides.indexOf(filename);
    if (index >= 0) {
      this.selectedSlides.splice(index, 1);
    } else {
      this.selectedSlides.push(filename);
    }
    this.requestUpdate();
  }

  removeSlide(e, filename) {
    e.stopPropagation();
    const index = this.selectedSlides.indexOf(filename);
    if (index >= 0) {
      this.selectedSlides.splice(index, 1);
      this.requestUpdate();
    }
  }

  // Drag and Drop
  handleDragStart(e) {
    const slideCard = e.target.closest('.slide-card');
    if (!slideCard) return;
    
    const slideId = slideCard.dataset.slideId;
    const index = parseInt(slideCard.dataset.index);
    this.draggedSlide = { slideId, index };
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slideId);
    
    slideCard.classList.add('dragging');
    slideCard.style.opacity = '0.5';
    
    // Create drag image
    const dragImage = slideCard.cloneNode(true);
    dragImage.style.transform = 'rotate(2deg)';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, e.offsetX, e.offsetY);
    setTimeout(() => dragImage.remove(), 0);
  }

  handleDragEnd(e) {
    const slideCard = e.target.closest('.slide-card');
    if (slideCard) {
      slideCard.classList.remove('dragging');
      slideCard.style.opacity = '';
    }
    
    // Clean up any drag placeholders
    const placeholders = this.shadowRoot.querySelectorAll('.drag-placeholder');
    placeholders.forEach(p => p.remove());
    
    this.draggedSlide = null;
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const container = e.currentTarget;
    const afterElement = this.getDragAfterElement(container, e.clientX, e.clientY);
    
    // Remove existing placeholder
    const existingPlaceholder = container.querySelector('.drag-placeholder');
    if (existingPlaceholder) {
      existingPlaceholder.remove();
    }
    
    // Create placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';
    placeholder.style.cssText = `
      width: 200px;
      height: 250px;
      border: 2px dashed var(--color-primary);
      border-radius: 8px;
      background: var(--color-primary-light);
      opacity: 0.5;
    `;
    
    if (afterElement == null) {
      container.appendChild(placeholder);
    } else {
      container.insertBefore(placeholder, afterElement);
    }
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!this.draggedSlide) return;
    
    const { slideId, index: oldIndex } = this.draggedSlide;
    const container = e.currentTarget;
    const placeholder = container.querySelector('.drag-placeholder');
    
    if (!placeholder) return;
    
    // Calculate new index based on placeholder position
    const allElements = [...container.children].filter(el => 
      !el.classList.contains('drag-placeholder') && 
      !el.classList.contains('selected-slides-empty')
    );
    
    let newIndex = allElements.length;
    for (let i = 0; i < allElements.length; i++) {
      if (placeholder.compareDocumentPosition(allElements[i]) & Node.DOCUMENT_POSITION_FOLLOWING) {
        newIndex = i;
        break;
      }
    }
    
    // Adjust for the item being moved
    if (oldIndex < newIndex) {
      newIndex--;
    }
    
    if (oldIndex !== newIndex) {
      const slides = [...this.selectedSlides];
      const [removed] = slides.splice(oldIndex, 1);
      slides.splice(newIndex, 0, removed);
      this.selectedSlides = slides;
      this.requestUpdate();
    }
    
    // Clean up
    placeholder.remove();
  }

  handleDragEnter(e) {
    e.preventDefault();
    const container = e.currentTarget;
    container.classList.add('drag-over');
  }

  handleDragLeave(e) {
    e.preventDefault();
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    // Only remove class if we're actually leaving the container
    if (e.clientX < rect.left || e.clientX > rect.right || 
        e.clientY < rect.top || e.clientY > rect.bottom) {
      container.classList.remove('drag-over');
    }
  }

  getDragAfterElement(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.slide-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // Form Handling
  async save() {
    const form = this.shadowRoot.querySelector('#set-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    if (this.selectedSlides.length === 0) {
      this.showNotification('Please select at least one slide', 'warning');
      return;
    }
    
    this.loading = true;
    
    try {
      const formData = new FormData(form);
      const setData = {
        id: this.editingSet?.id || Date.now().toString(),
        name: formData.get('name'),
        icon: this.selectedIcon,
        description: formData.get('description'),
        slideIds: this.selectedSlides,
        created: this.editingSet?.created || new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      // Save to storage (will be replaced with server API)
      const existingSets = JSON.parse(localStorage.getItem('canvas-gallery-sets') || '[]');
      
      if (this.mode === 'edit') {
        const index = existingSets.findIndex(s => s.id === setData.id);
        if (index >= 0) {
          existingSets[index] = setData;
        }
        
        // Dispatch update event
        window.dispatchEvent(new CustomEvent('gallery-set-updated', {
          detail: setData
        }));
      } else {
        existingSets.push(setData);
        
        // Dispatch create event
        window.dispatchEvent(new CustomEvent('gallery-set-created', {
          detail: setData
        }));
      }
      
      localStorage.setItem('canvas-gallery-sets', JSON.stringify(existingSets));
      
      this.showNotification(
        this.mode === 'create' ? 'Set created successfully' : 'Set updated successfully',
        'success'
      );
      
      this.close();
    } catch (error) {
      console.error('Error saving set:', error);
      this.showNotification('Failed to save set', 'error');
    } finally {
      this.loading = false;
    }
  }

  close() {
    this.open = false;
    this.mode = 'create';
    this.editingSet = null;
    this.selectedSlides = [];
    this.selectedIcon = '📊';
    
    // Clear form
    const form = this.shadowRoot.querySelector('#set-form');
    if (form) form.reset();
  }

  // Utility Methods
  filterVisuals() {
    if (this.sourceTab === 'all') return this.visuals;
    if (this.sourceTab === 'public') return this.visuals.filter(v => !v.isPrivate);
    if (this.sourceTab === 'private') return this.visuals.filter(v => v.isPrivate);
    return [];
  }

  extractTitle(filename) {
    const match = filename.match(/canvas-([^-]+)-/);
    if (match) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1);
    }
    return filename.replace('.html', '');
  }
  
  extractVisualInfo(filename) {
    // Extract type from filename (e.g., canvas-html-2025...)
    const typeMatch = filename.match(/canvas-([^-]+)-/);
    const type = typeMatch ? typeMatch[1].toUpperCase() : 'VISUAL';
    
    // Extract timestamp
    const timestampMatch = filename.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
    let timeInfo = '';
    
    if (timestampMatch) {
      const timestamp = timestampMatch[1].replace(/-/g, ':').replace('T', ' ');
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 60) {
        timeInfo = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeInfo = `${diffHours}h ago`;
      } else {
        timeInfo = `${diffDays}d ago`;
      }
    }
    
    return { type, timeInfo };
  }

  handleThumbnailLoad(filename) {
    // Log successful load for debugging
    console.log(`Thumbnail loaded: ${filename}`);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#4CAF50'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }
}

customElements.define('set-editor', SetEditor);