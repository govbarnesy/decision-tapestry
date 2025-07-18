/**
 * Enhanced Canvas Gallery - Advanced presentation management
 */

import { LitElement, css, html } from "https://esm.sh/lit@3";

export class CanvasGalleryEnhanced extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: auto;
      background: var(--panel-bg, #fff);
    }

    .gallery-container {
      padding: 20px;
    }

    .gallery-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border, #eee);
    }

    .gallery-title {
      font-size: 1.5em;
      font-weight: 600;
      color: var(--text-main, #000);
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .create-set-button {
      background: var(--accent, #2196f3);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .create-set-button:hover {
      background: var(--accent-hover, #1976d2);
    }

    /* Gallery Sets */
    .gallery-sets {
      margin-bottom: 40px;
    }

    .set-card {
      background: var(--card-bg, #fff);
      border: 2px solid var(--border, #eee);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      transition: all 0.2s;
    }

    .set-card:hover {
      border-color: var(--accent, #2196f3);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .set-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }

    .set-info {
      flex: 1;
    }

    .set-title {
      font-size: 1.3em;
      font-weight: 600;
      color: var(--text-main, #000);
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .set-description {
      color: var(--text-secondary, #666);
      font-size: 0.9em;
      margin-bottom: 10px;
    }

    .set-meta {
      display: flex;
      gap: 20px;
      font-size: 0.85em;
      color: var(--text-secondary, #666);
    }

    .set-actions {
      display: flex;
      gap: 10px;
    }

    .set-button {
      background: var(--accent, #2196f3);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .set-button:hover {
      background: var(--accent-hover, #1976d2);
      transform: translateY(-1px);
    }

    .set-button.secondary {
      background: transparent;
      color: var(--text-main, #000);
      border: 1px solid var(--border, #ddd);
    }

    .set-button.secondary:hover {
      background: var(--hover-bg, #f5f5f5);
    }

    /* Slide Grid */
    .slides-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
    }

    .slide-card {
      background: var(--card-bg, #fff);
      border: 1px solid var(--border, #eee);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
      transition: all 0.2s;
      cursor: pointer;
    }

    .slide-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .slide-card.selected {
      border: 2px solid var(--accent, #2196f3);
    }

    .slide-thumbnail {
      width: 100%;
      height: 150px;
      background: #f5f5f5;
      position: relative;
      overflow: hidden;
    }

    .slide-thumbnail iframe {
      width: 200%;
      height: 200%;
      transform: scale(0.5);
      transform-origin: top left;
      border: none;
      pointer-events: none;
    }

    .slide-number {
      position: absolute;
      top: 5px;
      left: 5px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8em;
      font-weight: 600;
    }

    .slide-flags {
      position: absolute;
      top: 5px;
      right: 5px;
      display: flex;
      gap: 5px;
    }

    .flag-button {
      background: rgba(0,0,0,0.7);
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.75em;
      transition: all 0.2s;
    }

    .flag-button:hover {
      background: rgba(0,0,0,0.9);
    }

    .flag-button.active {
      background: var(--accent, #2196f3);
    }

    .flag-button.edit {
      background: #ff9800;
    }

    .flag-button.private {
      background: #f44336;
    }

    .slide-info {
      padding: 10px;
    }

    .slide-title {
      font-size: 0.9em;
      font-weight: 600;
      color: var(--text-main, #000);
      margin-bottom: 5px;
    }

    /* Set Editor Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: var(--panel-bg, #fff);
      border-radius: 8px;
      padding: 30px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-header {
      margin-bottom: 20px;
    }

    .modal-title {
      font-size: 1.5em;
      font-weight: 600;
      color: var(--text-main, #000);
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: var(--text-main, #000);
    }

    .form-input {
      width: 100%;
      padding: 10px;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      font-size: 1em;
    }

    .form-textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      font-size: 1em;
      min-height: 100px;
      resize: vertical;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 30px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-secondary, #666);
    }

    .empty-state h3 {
      margin-bottom: 10px;
      color: var(--text-main, #000);
    }

    /* Slide selector in modal */
    .slide-selector {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
      margin-top: 10px;
      max-height: 300px;
      overflow-y: auto;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .slide-selector-item {
      background: white;
      border: 2px solid transparent;
      border-radius: 4px;
      padding: 10px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .slide-selector-item:hover {
      border-color: var(--accent, #2196f3);
    }

    .slide-selector-item.selected {
      border-color: var(--accent, #2196f3);
      background: var(--accent-light, #e3f2fd);
    }
  `;

  static properties = {
    sets: { type: Array },
    allVisuals: { type: Array },
    showSetEditor: { type: Boolean },
    editingSet: { type: Object },
    selectedSlides: { type: Set }
  };

  constructor() {
    super();
    this.sets = this.loadSets();
    this.allVisuals = [];
    this.showSetEditor = false;
    this.editingSet = null;
    this.selectedSlides = new Set();
    this.slideFlags = new Map(); // Store flags for each slide
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadVisuals();
  }

  loadSets() {
    // Load saved sets from localStorage
    const saved = localStorage.getItem('canvas-gallery-sets');
    return saved ? JSON.parse(saved) : [];
  }

  saveSets() {
    localStorage.setItem('canvas-gallery-sets', JSON.stringify(this.sets));
  }

  async loadVisuals() {
    try {
      // Load all visuals
      const [privateResponse, publicResponse] = await Promise.all([
        fetch('/api/gallery/private'),
        fetch('/api/gallery/public')
      ]);

      const privateVisuals = privateResponse.ok ? await privateResponse.json() : [];
      const publicVisuals = publicResponse.ok ? await publicResponse.json() : [];

      this.allVisuals = [
        ...privateVisuals.map(v => ({ ...v, isPrivate: true })),
        ...publicVisuals.map(v => ({ ...v, isPrivate: false }))
      ];

      // Load flags from localStorage
      const savedFlags = localStorage.getItem('canvas-slide-flags');
      if (savedFlags) {
        this.slideFlags = new Map(JSON.parse(savedFlags));
      }

      this.requestUpdate();
    } catch (error) {
      console.error('Failed to load visuals:', error);
    }
  }

  render() {
    return html`
      <div class="gallery-container">
        <div class="gallery-header">
          <h2 class="gallery-title">🎨 Canvas Gallery Sets</h2>
          <div class="header-actions">
            <button class="create-set-button" @click=${this.createNewSet}>
              + Create Set
            </button>
          </div>
        </div>

        ${this.sets.length === 0 ? this.renderEmptyState() : this.renderSets()}
        
        ${this.showSetEditor ? this.renderSetEditor() : ''}
      </div>
    `;
  }

  renderEmptyState() {
    return html`
      <div class="empty-state">
        <h3>No presentation sets yet</h3>
        <p>Create a set to organize your slides for presentations</p>
        <button class="set-button" @click=${this.createNewSet}>
          Create Your First Set
        </button>
      </div>
    `;
  }

  renderSets() {
    return html`
      <div class="gallery-sets">
        ${this.sets.map(set => this.renderSet(set))}
      </div>
    `;
  }

  renderSet(set) {
    const slides = set.slideIds.map(id => 
      this.allVisuals.find(v => v.filename === id)
    ).filter(Boolean);

    return html`
      <div class="set-card">
        <div class="set-header">
          <div class="set-info">
            <h3 class="set-title">
              ${set.icon || '📊'} ${set.name}
            </h3>
            ${set.description ? html`
              <p class="set-description">${set.description}</p>
            ` : ''}
            <div class="set-meta">
              <span>${slides.length} slides</span>
              <span>Created ${new Date(set.created).toLocaleDateString()}</span>
              ${set.lastModified ? html`
                <span>Modified ${new Date(set.lastModified).toLocaleDateString()}</span>
              ` : ''}
            </div>
          </div>
          <div class="set-actions">
            <button class="set-button" @click=${() => this.launchSlideshow(set)}>
              🎥 Launch Slideshow
            </button>
            <button class="set-button secondary" @click=${() => this.editSet(set)}>
              ✏️ Edit
            </button>
            <button class="set-button secondary" @click=${() => this.deleteSet(set)}>
              🗑️
            </button>
          </div>
        </div>
        
        <div class="slides-grid">
          ${slides.slice(0, 6).map((slide, index) => 
            this.renderSlideCard(slide, index, set)
          )}
          ${slides.length > 6 ? html`
            <div class="slide-card" style="display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
              <span style="color: #666;">+${slides.length - 6} more</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderSlideCard(visual, index, set) {
    if (!visual) return '';
    
    const flags = this.slideFlags.get(visual.filename) || {};
    
    return html`
      <div class="slide-card ${this.selectedSlides.has(visual.filename) ? 'selected' : ''}"
           @click=${(e) => this.handleSlideClick(e, visual)}>
        <div class="slide-thumbnail">
          <iframe src=${visual.path} sandbox="allow-same-origin"></iframe>
          <div class="slide-number">${index + 1}</div>
          <div class="slide-flags">
            ${flags.needsEdit ? html`
              <button class="flag-button edit" @click=${(e) => this.toggleEditFlag(e, visual)}>
                ✏️ Edit
              </button>
            ` : ''}
            ${visual.isPrivate ? html`
              <button class="flag-button private" @click=${(e) => this.togglePrivacy(e, visual)}>
                🔒
              </button>
            ` : ''}
          </div>
        </div>
        <div class="slide-info">
          <div class="slide-title">Slide ${index + 1}</div>
        </div>
      </div>
    `;
  }

  renderSetEditor() {
    return html`
      <div class="modal-overlay" @click=${this.closeSetEditor}>
        <div class="modal" @click=${(e) => e.stopPropagation()}>
          <div class="modal-header">
            <h2 class="modal-title">
              ${this.editingSet ? 'Edit Set' : 'Create New Set'}
            </h2>
          </div>
          
          <form @submit=${this.saveSet}>
            <div class="form-group">
              <label class="form-label">Set Name</label>
              <input class="form-input" 
                     type="text" 
                     name="name" 
                     .value=${this.editingSet?.name || ''}
                     placeholder="e.g., OpenGov Presentation"
                     required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Icon (optional)</label>
              <input class="form-input" 
                     type="text" 
                     name="icon" 
                     .value=${this.editingSet?.icon || '📊'}
                     placeholder="📊">
            </div>
            
            <div class="form-group">
              <label class="form-label">Description (optional)</label>
              <textarea class="form-textarea" 
                        name="description"
                        .value=${this.editingSet?.description || ''}
                        placeholder="Brief description of this presentation set"></textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label">Select Slides</label>
              <div class="slide-selector">
                ${this.allVisuals.map(visual => html`
                  <div class="slide-selector-item ${this.selectedSlides.has(visual.filename) ? 'selected' : ''}"
                       @click=${() => this.toggleSlideSelection(visual.filename)}>
                    <div style="font-size: 12px;">${this.extractTitle(visual.filename)}</div>
                  </div>
                `)}
              </div>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="set-button secondary" @click=${this.closeSetEditor}>
                Cancel
              </button>
              <button type="submit" class="set-button">
                ${this.editingSet ? 'Update Set' : 'Create Set'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  createNewSet() {
    this.editingSet = null;
    this.selectedSlides = new Set();
    this.showSetEditor = true;
  }

  editSet(set) {
    this.editingSet = set;
    this.selectedSlides = new Set(set.slideIds);
    this.showSetEditor = true;
  }

  deleteSet(set) {
    if (confirm(`Delete set "${set.name}"?`)) {
      this.sets = this.sets.filter(s => s.id !== set.id);
      this.saveSets();
      this.requestUpdate();
    }
  }

  saveSet(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const setData = {
      id: this.editingSet?.id || Date.now().toString(),
      name: formData.get('name'),
      icon: formData.get('icon') || '📊',
      description: formData.get('description'),
      slideIds: Array.from(this.selectedSlides),
      created: this.editingSet?.created || new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    if (this.editingSet) {
      // Update existing set
      this.sets = this.sets.map(s => s.id === setData.id ? setData : s);
    } else {
      // Create new set
      this.sets.push(setData);
    }

    this.saveSets();
    this.closeSetEditor();
  }

  closeSetEditor() {
    this.showSetEditor = false;
    this.editingSet = null;
    this.selectedSlides = new Set();
  }

  toggleSlideSelection(filename) {
    if (this.selectedSlides.has(filename)) {
      this.selectedSlides.delete(filename);
    } else {
      this.selectedSlides.add(filename);
    }
    this.requestUpdate();
  }

  handleSlideClick(e, visual) {
    // Don't select if clicking on a button
    if (e.target.tagName === 'BUTTON') return;
    
    // Open the visual
    window.open(visual.path, '_blank');
  }

  async toggleEditFlag(e, visual) {
    e.stopPropagation();
    
    const flags = this.slideFlags.get(visual.filename) || {};
    flags.needsEdit = !flags.needsEdit;
    this.slideFlags.set(visual.filename, flags);
    
    // Save flags
    localStorage.setItem('canvas-slide-flags', 
      JSON.stringify(Array.from(this.slideFlags.entries()))
    );
    
    if (flags.needsEdit) {
      // Show notification
      this.showNotification(`Flagged for editing with Claude`);
    }
    
    this.requestUpdate();
  }

  async togglePrivacy(e, visual) {
    e.stopPropagation();
    
    const newPrivacy = !visual.isPrivate;
    const targetDir = newPrivacy ? 'private' : 'public';
    const sourceDir = newPrivacy ? 'public' : 'private';
    
    try {
      // Move file between private/public
      const response = await fetch(`/api/gallery/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: visual.filename,
          from: sourceDir,
          to: targetDir
        })
      });
      
      if (response.ok) {
        await this.loadVisuals();
        this.showNotification(`Moved to ${targetDir}`);
      }
    } catch (error) {
      console.error('Failed to toggle privacy:', error);
    }
  }

  async launchSlideshow(set) {
    const slides = set.slideIds.map(id => 
      this.allVisuals.find(v => v.filename === id)
    ).filter(Boolean);
    
    if (slides.length === 0) {
      this.showNotification('No slides found in this set');
      return;
    }

    // Send to AI Canvas
    const canvasTab = document.querySelector('[data-view="ai-canvas"]');
    const aiCanvas = document.getElementById('ai-canvas');
    
    if (canvasTab && aiCanvas) {
      // Clear and load slides
      aiCanvas.visualHistory = [];
      aiCanvas.currentIndex = -1;
      
      for (const slide of slides) {
        const response = await fetch(slide.path);
        const content = await response.text();
        const match = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const bodyContent = match ? match[1] : content;
        
        aiCanvas.addToHistory({
          type: 'html',
          content: bodyContent,
          options: {},
          id: Date.now(),
          timestamp: new Date().toISOString()
        });
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      aiCanvas.navigateFirst();
      canvasTab.click();
      
      this.showNotification(`Launched "${set.name}" slideshow!`);
    }
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 25px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: Arial;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }

  extractTitle(filename) {
    const match = filename.match(/canvas-([^-]+)-/);
    if (match) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1);
    }
    return 'Visual';
  }
}

customElements.define('canvas-gallery-enhanced', CanvasGalleryEnhanced);