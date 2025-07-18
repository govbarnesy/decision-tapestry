/**
 * Gallery Sets Management Page
 * A dedicated interface for creating, organizing, and launching presentation sets
 */

import { LitElement, css, html } from "https://esm.sh/lit@3";

export class GallerySets extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: auto;
      background: var(--background);
      font-family: var(--font-family);
    }

    .sets-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 30px;
    }

    /* Header Section */
    .page-header {
      margin-bottom: 40px;
    }

    .page-title {
      font-size: 2.5em;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .page-subtitle {
      font-size: 1.1em;
      color: var(--text-secondary);
      margin-bottom: 30px;
    }

    .header-actions {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    /* Primary Actions */
    .primary-button {
      background: var(--color-primary);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 1em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: var(--shadow-md);
    }

    .primary-button:hover {
      background: var(--color-primary-hover);
      transform: translateY(-1px);
      box-shadow: var(--shadow-lg);
    }

    .secondary-button {
      background: white;
      color: var(--text-primary);
      border: 2px solid var(--border-color);
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.95em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .secondary-button:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background: var(--color-primary-light);
    }

    /* Search and Filter Bar */
    .controls-bar {
      display: flex;
      gap: 15px;
      margin-bottom: 30px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 300px;
      padding: 12px 20px;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      font-size: 1em;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-light);
    }

    .view-toggle {
      display: flex;
      background: white;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
    }

    .view-option {
      padding: 8px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .view-option.active {
      background: var(--color-primary);
      color: white;
    }

    /* Sets Grid */
    .sets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 25px;
      margin-bottom: 40px;
    }

    /* Set Card */
    .set-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    }

    .set-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .set-card.selected {
      border: 3px solid var(--accent, #2196f3);
    }

    .set-thumbnail {
      height: 200px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow: hidden;
    }

    .set-thumbnail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 2px;
      height: 100%;
      padding: 20px;
    }

    .thumbnail-slide {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2em;
      font-weight: 700;
    }

    .set-icon-large {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 4em;
      opacity: 0.3;
    }

    .set-slide-count {
      position: absolute;
      top: 15px;
      right: 15px;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
      backdrop-filter: blur(10px);
    }

    .set-content {
      padding: 20px;
    }

    .set-header {
      margin-bottom: 12px;
    }

    .set-name {
      font-size: 1.3em;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .set-description {
      color: var(--text-secondary);
      font-size: 0.95em;
      line-height: 1.5;
      margin-bottom: 15px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .set-meta {
      display: flex;
      gap: 20px;
      font-size: 0.85em;
      color: var(--text-secondary);
      margin-bottom: 15px;
    }

    .set-actions {
      display: flex;
      gap: 10px;
      padding-top: 15px;
      border-top: 1px solid var(--border, #f0f0f0);
    }

    .set-action-button {
      flex: 1;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 0.9em;
    }

    .set-action-button.launch {
      background: var(--color-primary);
      color: white;
    }

    .set-action-button.launch:hover {
      background: var(--color-primary-hover);
    }

    .set-action-button.edit {
      background: var(--background-secondary);
      color: var(--text-primary);
    }

    .set-action-button.edit:hover {
      background: var(--hover-bg);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 5em;
      opacity: 0.3;
      margin-bottom: 20px;
    }

    .empty-title {
      font-size: 1.8em;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 10px;
    }

    .empty-description {
      font-size: 1.1em;
      margin-bottom: 30px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    /* List View */
    .sets-list {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .list-header {
      display: grid;
      grid-template-columns: 50px 1fr 150px 150px 200px;
      padding: 15px 20px;
      background: var(--background-secondary);
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .list-item {
      display: grid;
      grid-template-columns: 50px 1fr 150px 150px 200px;
      padding: 20px;
      border-bottom: 1px solid var(--border-light);
      align-items: center;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .list-item:hover {
      background: var(--hover-bg);
    }

    .list-icon {
      font-size: 1.5em;
    }

    .list-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .list-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .list-description {
      font-size: 0.85em;
      color: var(--text-secondary);
    }

    .list-meta {
      color: var(--text-secondary);
      font-size: 0.9em;
    }

    .list-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    /* Loading State */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--text-secondary);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  static properties = {
    sets: { type: Array },
    visuals: { type: Array },
    viewMode: { type: String },
    searchQuery: { type: String },
    selectedSets: { type: Set },
    loading: { type: Boolean }
  };

  constructor() {
    super();
    this.sets = [];
    this.visuals = [];
    this.viewMode = 'grid';
    this.searchQuery = '';
    this.selectedSets = new Set();
    this.loading = true;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadData();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListeners();
  }

  setupEventListeners() {
    // Listen for set updates
    window.addEventListener('gallery-set-updated', this.handleSetUpdate.bind(this));
    window.addEventListener('gallery-set-created', this.handleSetCreated.bind(this));
  }

  removeEventListeners() {
    window.removeEventListener('gallery-set-updated', this.handleSetUpdate.bind(this));
    window.removeEventListener('gallery-set-created', this.handleSetCreated.bind(this));
  }

  async loadData() {
    this.loading = true;
    try {
      // Load sets from localStorage (will be replaced with server API)
      this.sets = this.loadSetsFromStorage();
      
      // Load available visuals
      await this.loadVisuals();
      
      this.loading = false;
    } catch (error) {
      console.error('Error loading data:', error);
      this.loading = false;
    }
  }

  loadSetsFromStorage() {
    const stored = localStorage.getItem('canvas-gallery-sets');
    return stored ? JSON.parse(stored) : [];
  }

  saveSetsToStorage() {
    localStorage.setItem('canvas-gallery-sets', JSON.stringify(this.sets));
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

  render() {
    return html`
      <div class="sets-container">
        ${this.renderHeader()}
        ${this.renderControls()}
        ${this.loading ? this.renderLoading() : this.renderContent()}
      </div>
    `;
  }

  renderHeader() {
    return html`
      <div class="page-header">
        <h1 class="page-title">
          <span>📚</span>
          <span>Presentation Sets</span>
        </h1>
        <p class="page-subtitle">
          Organize your AI Canvas visuals into professional presentations
        </p>
        <div class="header-actions">
          <button class="primary-button" @click=${this.createNewSet}>
            <span>➕</span>
            <span>Create New Set</span>
          </button>
          <button class="secondary-button" @click=${this.importSet}>
            <span>📥</span>
            <span>Import</span>
          </button>
          <button class="secondary-button" @click=${this.exportSets}>
            <span>📤</span>
            <span>Export</span>
          </button>
        </div>
      </div>
    `;
  }

  renderControls() {
    return html`
      <div class="controls-bar">
        <input 
          class="search-input" 
          type="text" 
          placeholder="Search presentation sets..."
          .value=${this.searchQuery}
          @input=${this.handleSearch}
        />
        <div class="view-toggle">
          <button 
            class="view-option ${this.viewMode === 'grid' ? 'active' : ''}"
            @click=${() => this.viewMode = 'grid'}
          >
            <span>⊞</span>
            <span>Grid</span>
          </button>
          <button 
            class="view-option ${this.viewMode === 'list' ? 'active' : ''}"
            @click=${() => this.viewMode = 'list'}
          >
            <span>☰</span>
            <span>List</span>
          </button>
        </div>
      </div>
    `;
  }

  renderContent() {
    const filteredSets = this.filterSets();
    
    if (filteredSets.length === 0) {
      return this.renderEmptyState();
    }

    return this.viewMode === 'grid' 
      ? this.renderGridView(filteredSets)
      : this.renderListView(filteredSets);
  }

  renderGridView(sets) {
    return html`
      <div class="sets-grid">
        ${sets.map(set => this.renderSetCard(set))}
      </div>
    `;
  }

  renderSetCard(set) {
    const slides = this.getSetSlides(set);
    const isSelected = this.selectedSets.has(set.id);

    return html`
      <div class="set-card ${isSelected ? 'selected' : ''}"
           @click=${(e) => this.handleSetClick(e, set)}>
        <div class="set-thumbnail">
          <div class="set-icon-large">${set.icon || '📊'}</div>
          <div class="set-thumbnail-grid">
            ${[0, 1, 2, 3].map(i => html`
              <div class="thumbnail-slide">${i + 1}</div>
            `)}
          </div>
          <div class="set-slide-count">${slides.length} slides</div>
        </div>
        <div class="set-content">
          <div class="set-header">
            <h3 class="set-name">
              <span>${set.icon || '📊'}</span>
              <span>${set.name}</span>
            </h3>
            ${set.description ? html`
              <p class="set-description">${set.description}</p>
            ` : ''}
          </div>
          <div class="set-meta">
            <span>Created ${this.formatDate(set.created)}</span>
            ${set.lastModified ? html`
              <span>• Updated ${this.formatDate(set.lastModified)}</span>
            ` : ''}
          </div>
          <div class="set-actions">
            <button class="set-action-button launch" 
                    @click=${(e) => this.launchPresentation(e, set)}>
              <span>🎥</span>
              <span>Launch</span>
            </button>
            <button class="set-action-button edit"
                    @click=${(e) => this.editSet(e, set)}>
              <span>✏️</span>
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderListView(sets) {
    return html`
      <div class="sets-list">
        <div class="list-header">
          <div></div>
          <div>Name</div>
          <div>Slides</div>
          <div>Modified</div>
          <div>Actions</div>
        </div>
        ${sets.map(set => this.renderListItem(set))}
      </div>
    `;
  }

  renderListItem(set) {
    const slides = this.getSetSlides(set);

    return html`
      <div class="list-item" @click=${(e) => this.handleSetClick(e, set)}>
        <div class="list-icon">${set.icon || '📊'}</div>
        <div class="list-info">
          <div class="list-name">${set.name}</div>
          ${set.description ? html`
            <div class="list-description">${set.description}</div>
          ` : ''}
        </div>
        <div class="list-meta">${slides.length} slides</div>
        <div class="list-meta">${this.formatDate(set.lastModified || set.created)}</div>
        <div class="list-actions">
          <button class="set-action-button launch" 
                  @click=${(e) => this.launchPresentation(e, set)}>
            <span>🎥</span>
          </button>
          <button class="set-action-button edit"
                  @click=${(e) => this.editSet(e, set)}>
            <span>✏️</span>
          </button>
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    return html`
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <h2 class="empty-title">No presentation sets yet</h2>
        <p class="empty-description">
          Create your first presentation set to organize your AI Canvas visuals 
          into professional, shareable presentations.
        </p>
        <button class="primary-button" @click=${this.createNewSet}>
          <span>➕</span>
          <span>Create Your First Set</span>
        </button>
      </div>
    `;
  }

  renderLoading() {
    return html`
      <div class="loading">
        <div class="spinner"></div>
      </div>
    `;
  }

  // Event Handlers
  handleSearch(e) {
    this.searchQuery = e.target.value.toLowerCase();
  }

  handleSetClick(e, set) {
    // Don't select if clicking on action buttons
    if (e.target.closest('button')) return;
    
    if (e.ctrlKey || e.metaKey) {
      // Multi-select
      if (this.selectedSets.has(set.id)) {
        this.selectedSets.delete(set.id);
      } else {
        this.selectedSets.add(set.id);
      }
      this.requestUpdate();
    }
  }

  async createNewSet() {
    // Dispatch event to open set editor
    const event = new CustomEvent('open-set-editor', {
      detail: { mode: 'create' },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  async editSet(e, set) {
    e.stopPropagation();
    
    // Dispatch event to open set editor
    const event = new CustomEvent('open-set-editor', {
      detail: { mode: 'edit', set },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  async launchPresentation(e, set) {
    e.stopPropagation();
    
    const slides = this.getSetSlides(set);
    if (slides.length === 0) {
      this.showNotification('No slides found in this set', 'warning');
      return;
    }

    // Dispatch event to launch presentation
    const event = new CustomEvent('launch-presentation', {
      detail: { set, slides },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);

    this.showNotification(`Launching "${set.name}"...`, 'success');
  }

  async importSet() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        
        // Validate structure
        if (!imported.name || !imported.slideIds) {
          throw new Error('Invalid set format');
        }
        
        // Add to sets with new ID
        const newSet = {
          ...imported,
          id: Date.now().toString(),
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };
        
        this.sets.push(newSet);
        this.saveSetsToStorage();
        this.requestUpdate();
        
        this.showNotification(`Imported "${newSet.name}" successfully`, 'success');
      } catch (error) {
        console.error('Import error:', error);
        this.showNotification('Failed to import set', 'error');
      }
    };
    
    input.click();
  }

  async exportSets() {
    if (this.selectedSets.size === 0) {
      // Export all sets
      this.downloadJSON(this.sets, 'presentation-sets.json');
    } else {
      // Export selected sets
      const selected = this.sets.filter(set => this.selectedSets.has(set.id));
      this.downloadJSON(selected, `selected-sets-${Date.now()}.json`);
    }
    
    this.showNotification('Sets exported successfully', 'success');
  }

  // Utility Methods
  filterSets() {
    if (!this.searchQuery) return this.sets;
    
    return this.sets.filter(set => {
      const searchStr = `${set.name} ${set.description || ''}`.toLowerCase();
      return searchStr.includes(this.searchQuery);
    });
  }

  getSetSlides(set) {
    return set.slideIds
      .map(id => this.visuals.find(v => v.filename === id))
      .filter(Boolean);
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) return 'Just now';
    
    // Less than an hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Default to date
    return date.toLocaleDateString();
  }

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
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
      font-family: var(--font-family);
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }

  // Event handlers for external updates
  handleSetUpdate(event) {
    const updatedSet = event.detail;
    this.sets = this.sets.map(set => 
      set.id === updatedSet.id ? updatedSet : set
    );
    this.saveSetsToStorage();
    this.requestUpdate();
  }

  handleSetCreated(event) {
    const newSet = event.detail;
    this.sets.push(newSet);
    this.saveSetsToStorage();
    this.requestUpdate();
  }
}

customElements.define('gallery-sets', GallerySets);