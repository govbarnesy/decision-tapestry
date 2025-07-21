/**
 * Canvas Gallery - Browse and manage saved AI Canvas visuals
 */

import { LitElement, css, html } from "https://esm.sh/lit@3";

export class CanvasGallery extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: auto;
      background: var(--panel-bg);
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
      border-bottom: 1px solid var(--border-color);
    }

    .gallery-title {
      font-size: 1.5em;
      font-weight: 600;
      color: var(--text-primary);
    }

    .gallery-tabs {
      display: flex;
      gap: 10px;
    }

    .tab-button {
      padding: 8px 16px;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9em;
      transition: all 0.2s;
    }

    .tab-button:hover {
      background: var(--hover-bg);
    }

    .tab-button.active {
      background: var(--color-primary);
      color: var(--text-inverse);
      border-color: var(--color-primary);
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .gallery-sets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    
    .gallery-set-card {
      background: var(--background-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
      transition: all 0.2s ease;
    }
    
    .gallery-set-card:hover {
      border-color: var(--color-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .set-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .set-icon {
      font-size: 32px;
    }
    
    .set-name {
      flex: 1;
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .delete-button {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
      padding: 5px;
    }
    
    .delete-button:hover {
      opacity: 1;
      background: rgba(255, 0, 0, 0.1);
      border-radius: 4px;
    }
    
    .set-description {
      color: var(--text-secondary);
      margin: 0 0 15px 0;
      font-size: 14px;
    }
    
    .set-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .slide-count {
      font-weight: 600;
      color: var(--color-primary);
    }
    
    .set-actions {
      display: flex;
      gap: 10px;
    }
    
    .action-button {
      flex: 1;
      padding: 8px 16px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      background: transparent;
    }
    
    .action-button.primary {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }
    
    .action-button.primary:hover {
      background: var(--color-primary-dark);
    }
    
    .action-button.secondary:hover {
      background: var(--hover-bg);
    }

    .visual-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .visual-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .visual-thumbnail {
      width: 100%;
      height: 200px;
      overflow: hidden;
      position: relative;
      background: var(--hover-bg);
    }

    .visual-thumbnail iframe {
      width: 100%;
      height: 100%;
      border: none;
      transform: scale(0.5);
      transform-origin: top left;
      width: 200%;
      height: 200%;
      pointer-events: none;
    }

    .visual-info {
      padding: 15px;
    }

    .visual-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .visual-meta {
      font-size: 0.85em;
      color: var(--text-secondary);
    }

    .visual-actions {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 5px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .visual-card:hover .visual-actions {
      opacity: 1;
    }

    .action-button {
      background: var(--modal-overlay);
      color: var(--text-inverse);
      border: none;
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8em;
    }

    .action-button:hover {
      background: rgba(0, 0, 0, 0.9);
    }

    .gallery-empty {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-secondary);
    }

    .gallery-empty h3 {
      margin-bottom: 10px;
      color: var(--text-primary);
    }

    .presentation-group {
      background: var(--card-bg);
      border: 2px solid var(--color-primary);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }

    .presentation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .presentation-title {
      font-size: 1.2em;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .slide-count {
      background: var(--color-primary);
      color: var(--text-inverse);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
    }

    .launch-slideshow {
      background: var(--color-primary);
      color: var(--text-inverse);
      border: none;
      padding: 8px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .launch-slideshow:hover {
      background: var(--color-primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .presentation-slides {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
    }

    .slide-thumbnail {
      background: var(--hover-bg);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 10px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .slide-thumbnail:hover {
      background: var(--hover-bg, #f0f0f0);
      border-color: var(--color-primary);
    }

    .slide-number {
      font-size: 0.9em;
      color: var(--text-secondary);
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
    }

    .privacy-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: var(--modal-overlay);
      color: var(--text-inverse);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75em;
    }

    .privacy-badge.private {
      background: rgba(244, 67, 54, 0.9);
    }

    .privacy-badge.public {
      background: rgba(76, 175, 80, 0.9);
    }
  `;

  static properties = {
    activeTab: { type: String },
    privateVisuals: { type: Array },
    publicVisuals: { type: Array },
    loading: { type: Boolean },
    gallerySets: { type: Array }
  };

  constructor() {
    super();
    this.activeTab = 'sets';  // Default to sets view
    this.privateVisuals = [];
    this.publicVisuals = [];
    this.loading = true;
    this.gallerySets = [];
    this.thumbnailCache = new Map();
    this.presentations = new Map();
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadGallerySets();
    await this.loadVisuals();
    this.detectPresentations();
    
    // Listen for gallery set updates
    window.addEventListener('gallery-set-updated', () => this.loadGallerySets());
    window.addEventListener('gallery-set-created', () => this.loadGallerySets());
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('gallery-set-updated', () => this.loadGallerySets());
    window.removeEventListener('gallery-set-created', () => this.loadGallerySets());
  }
  
  async loadGallerySets() {
    try {
      const response = await fetch('/api/gallery/sets');
      if (response.ok) {
        this.gallerySets = await response.json();
      }
    } catch (error) {
      console.error('Failed to load gallery sets:', error);
    }
  }

  async loadVisuals() {
    this.loading = true;
    
    try {
      // Load private gallery
      const privateResponse = await fetch('/api/gallery/private');
      if (privateResponse.ok) {
        const privateData = await privateResponse.json();
        this.privateVisuals = privateData.visuals || [];
      }
      
      // Load public gallery
      const publicResponse = await fetch('/api/gallery/public');
      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        this.publicVisuals = publicData.visuals || [];
      }
    } catch (error) {
      console.error('Failed to load gallery:', error);
    }
    
    this.loading = false;
  }

  render() {
    return html`
      <div class="gallery-container">
        <div class="gallery-header">
          <h2 class="gallery-title">🎨 Canvas Gallery</h2>
          <div class="gallery-tabs">
            <button 
              class="tab-button ${this.activeTab === 'sets' ? 'active' : ''}"
              @click=${() => this.activeTab = 'sets'}>
              📁 Gallery Sets
            </button>
            <button 
              class="tab-button ${this.activeTab === 'all' ? 'active' : ''}"
              @click=${() => this.activeTab = 'all'}>
              All Files
            </button>
            <button 
              class="tab-button ${this.activeTab === 'private' ? 'active' : ''}"
              @click=${() => this.activeTab = 'private'}>
              🔒 Private
            </button>
            <button 
              class="tab-button ${this.activeTab === 'public' ? 'active' : ''}"
              @click=${() => this.activeTab = 'public'}>
              🌍 Public
            </button>
          </div>
        </div>
        
        ${this.loading ? html`
          <div class="loading">Loading gallery...</div>
        ` : this.renderGallery()}
      </div>
    `;
  }

  renderGallery() {
    // Handle gallery sets tab
    if (this.activeTab === 'sets') {
      return this.renderGallerySets();
    }
    
    // Handle visual files tabs
    let visuals = [];
    
    if (this.activeTab === 'all') {
      visuals = [...this.privateVisuals, ...this.publicVisuals];
    } else if (this.activeTab === 'private') {
      visuals = this.privateVisuals;
    } else {
      visuals = this.publicVisuals;
    }
    
    if (visuals.length === 0) {
      return html`
        <div class="gallery-empty">
          <h3>No visuals yet</h3>
          <p>Save some AI Canvas creations to see them here!</p>
        </div>
      `;
    }
    
    // Render presentations first, then individual visuals
    const presentationVisuals = new Set();
    const presentationsHtml = [];
    
    // Render presentation groups
    this.presentations.forEach((slides, presentationName) => {
      slides.forEach(slide => presentationVisuals.add(slide.filename));
      
      // Only show presentations that match current tab
      const isPrivate = slides[0].path.includes('/private/');
      if ((this.activeTab === 'private' && !isPrivate) || 
          (this.activeTab === 'public' && isPrivate) ||
          (this.activeTab !== 'all' && this.activeTab !== (isPrivate ? 'private' : 'public'))) {
        return;
      }
      
      presentationsHtml.push(this.renderPresentationGroup(presentationName, slides));
    });
    
    // Filter out visuals that are part of presentations
    const standaloneVisuals = visuals.filter(v => !presentationVisuals.has(v.filename));
    
    return html`
      ${presentationsHtml}
      <div class="gallery-grid">
        ${standaloneVisuals.map(visual => this.renderVisualCard(visual))}
      </div>
    `;
  }

  renderVisualCard(visual) {
    const created = new Date(visual.created);
    const isPrivate = visual.type === 'private';
    
    return html`
      <div class="visual-card" @click=${() => this.openVisual(visual)}>
        <div class="privacy-badge ${isPrivate ? 'private' : 'public'}">
          ${isPrivate ? '🔒 Private' : '🌍 Public'}
        </div>
        
        <div class="visual-thumbnail">
          <iframe 
            src=${visual.path} 
            @load=${(e) => this.thumbnailLoaded(e, visual)}
            sandbox="allow-same-origin">
          </iframe>
        </div>
        
        <div class="visual-info">
          <div class="visual-title">${this.extractTitle(visual.filename)}</div>
          <div class="visual-meta">
            ${created.toLocaleDateString()} ${created.toLocaleTimeString()}
          </div>
          <div class="visual-meta">
            ${this.formatFileSize(visual.size)}
          </div>
        </div>
        
        <div class="visual-actions">
          <button class="action-button" @click=${(e) => this.deleteVisual(e, visual)}>
            🗑️
          </button>
          <button class="action-button" @click=${(e) => this.downloadVisual(e, visual)}>
            ⬇️
          </button>
        </div>
      </div>
    `;
  }

  extractTitle(filename) {
    // Extract type from filename like "canvas-html-2025-..."
    const match = filename.match(/canvas-([^-]+)-/);
    if (match) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1) + ' Visual';
    }
    return 'Canvas Visual';
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  thumbnailLoaded(event, visual) {
    // Store iframe reference for potential thumbnail generation
    this.thumbnailCache.set(visual.filename, event.target);
  }

  openVisual(visual) {
    window.open(visual.path, '_blank');
  }
  
  renderGallerySets() {
    if (this.gallerySets.length === 0) {
      return html`
        <div class="gallery-empty">
          <h3>No gallery sets yet</h3>
          <p>Save some AI Canvas slides as a gallery to see them here!</p>
        </div>
      `;
    }
    
    return html`
      <div class="gallery-sets-grid">
        ${this.gallerySets.map(set => this.renderGallerySet(set))}
      </div>
    `;
  }
  
  renderGallerySet(set) {
    return html`
      <div class="gallery-set-card">
        <div class="set-header">
          <span class="set-icon">${set.icon}</span>
          <h3 class="set-name">${set.name}</h3>
          <button 
            class="delete-button" 
            @click=${(e) => this.deleteGallerySet(e, set)}
            title="Delete gallery set">
            🗑️
          </button>
        </div>
        <p class="set-description">${set.description || 'No description'}</p>
        <div class="set-info">
          <span class="slide-count">${set.slideIds.length} slides</span>
          <span class="set-date">${new Date(set.created).toLocaleDateString()}</span>
        </div>
        <div class="set-actions">
          <button 
            class="action-button primary"
            @click=${() => this.launchPresentation(set)}>
            🎬 Present
          </button>
          <button 
            class="action-button secondary"
            @click=${() => this.editSet(set)}>
            ✏️ Edit
          </button>
        </div>
      </div>
    `;
  }
  
  async deleteGallerySet(event, set) {
    event.stopPropagation();
    
    if (!confirm(`Delete gallery set "${set.name}"? This will only remove the set, not the individual slides.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/gallery/sets/${set.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete gallery set');
      }
      
      // Reload gallery sets
      await this.loadGallerySets();
      
      // Show success feedback
      this.showNotification('Gallery set deleted successfully');
    } catch (error) {
      console.error('Failed to delete gallery set:', error);
      alert('Failed to delete gallery set: ' + error.message);
    }
  }
  
  launchPresentation(set) {
    // Emit event to launch presentation
    window.dispatchEvent(new CustomEvent('launch-presentation', {
      detail: { set, slides: set.slideIds.map(id => ({ path: `/ai-canvas-gallery/public/${id}` })) }
    }));
  }
  
  editSet(set) {
    // Dispatch event to open the set editor in edit mode
    window.dispatchEvent(new CustomEvent('open-set-editor', {
      detail: {
        mode: 'edit',
        set: set
      }
    }));
  }
  
  showNotification(message) {
    // Simple notification (could be improved with a toast component)
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  async deleteVisual(event, visual) {
    event.stopPropagation();
    
    if (!confirm(`Delete this ${visual.type} visual?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/gallery/${visual.type}/${visual.filename}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await this.loadVisuals();
      } else {
        const error = await response.text();
        console.error('Delete failed:', response.status, error);
        alert(`Failed to delete visual: ${error}`);
      }
    } catch (error) {
      console.error('Failed to delete visual:', error);
    }
  }

  downloadVisual(event, visual) {
    event.stopPropagation();
    
    const a = document.createElement('a');
    a.href = visual.path;
    a.download = visual.filename;
    a.click();
  }

  detectPresentations() {
    // Group visuals that were created close together (within 5 minutes)
    const allVisuals = [...this.privateVisuals, ...this.publicVisuals];
    const timeGroups = new Map();
    
    allVisuals.forEach(visual => {
      // Parse timestamp from filename (e.g., "canvas-html-2025-07-18T00-45-49-322Z.html")
      const match = visual.filename.match(/canvas-html-(\d{4}-\d{2}-\d{2}T\d{2})-/);
      if (!match) return;
      
      const timeKey = match[1];
      if (!timeGroups.has(timeKey)) {
        timeGroups.set(timeKey, []);
      }
      timeGroups.get(timeKey).push(visual);
    });
    
    // Look for groups with 8+ visuals (likely presentations)
    this.presentations.clear();
    timeGroups.forEach((visuals, timeKey) => {
      if (visuals.length >= 8) {
        // Sort by filename to maintain order
        visuals.sort((a, b) => a.filename.localeCompare(b.filename));
        
        // Try to extract presentation name from content
        const presentationName = this.extractPresentationName(visuals) || `Presentation ${timeKey}`;
        this.presentations.set(presentationName, visuals);
      }
    });
    
    this.requestUpdate();
  }

  extractPresentationName(visuals) {
    // Look for common presentation patterns in the first visual
    // This is a simple heuristic - could be improved with actual content analysis
    if (visuals.length > 0) {
      const firstVisual = visuals[0];
      // Check timestamp patterns to identify presentations
      const timestamp = firstVisual.filename.match(/canvas-html-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2})/)?.[1];
      
      if (timestamp) {
        // Map known presentation timestamps to names
        // You can expand this based on your presentation creation times
        if (timestamp.includes('T01-5') || timestamp.includes('T02-0')) {
          return 'Decision Tapestry Features';
        } else if (timestamp.includes('T02-1') || timestamp.includes('T02-2')) {
          return 'OpenGov CPO Presentation';
        } else if (timestamp.includes('T02-3') || timestamp.includes('T02-4')) {
          return 'AI Software Future';
        }
      }
    }
    return null;
  }

  renderPresentationGroup(name, slides) {
    return html`
      <div class="presentation-group">
        <div class="presentation-header">
          <div class="presentation-title">
            <span>📊 ${name}</span>
            <span class="slide-count">${slides.length} slides</span>
          </div>
          <button class="launch-slideshow" @click=${() => this.launchSlideshow(slides)}>
            <span>🎥</span>
            <span>Launch Slideshow</span>
          </button>
        </div>
        <div class="presentation-slides">
          ${slides.slice(0, 6).map((slide, index) => html`
            <div class="slide-thumbnail" @click=${() => this.openVisual(slide)}>
              <div class="slide-number">Slide ${index + 1}</div>
            </div>
          `)}
          ${slides.length > 6 ? html`
            <div class="slide-thumbnail" style="opacity: 0.6;">
              <div class="slide-number">+${slides.length - 6} more</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  async launchSlideshow(slides) {
    // Send slides to AI Canvas and switch to it
    const canvasTab = document.querySelector('[data-view="ai-canvas"]');
    const aiCanvas = document.getElementById('ai-canvas');
    
    if (canvasTab && aiCanvas) {
      // Clear current canvas and load presentation
      aiCanvas.visualHistory = [];
      aiCanvas.currentIndex = -1;
      
      // Load all slides
      for (const slide of slides) {
        const response = await fetch(slide.path);
        const content = await response.text();
        
        // Extract body content from HTML
        const match = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const bodyContent = match ? match[1] : content;
        
        aiCanvas.addToHistory({
          type: 'html',
          content: bodyContent,
          options: {},
          id: Date.now(),
          timestamp: new Date().toISOString()
        });
        
        // Small delay to ensure proper ordering
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Navigate to first slide
      aiCanvas.navigateFirst();
      
      // Switch to AI Canvas tab
      canvasTab.click();
      
      // Show notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: var(--text-inverse);
        padding: 15px 25px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: Arial;
      `;
      notification.textContent = `Slideshow loaded! Use arrow keys to navigate.`;
      document.body.appendChild(notification);
      
      setTimeout(() => notification.remove(), 3000);
    }
  }
}

customElements.define('canvas-gallery', CanvasGallery);