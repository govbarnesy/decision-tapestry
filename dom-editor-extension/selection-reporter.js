/**
 * Selection Reporter for DOM Editor
 * Primary purpose: Report element selection to AI assistant
 */

class SelectionReporter {
  constructor() {
    this.selectedElement = null;
    this.ws = null;
    this.overlay = null;
    this.infoPanel = null;
    
    this.init();
  }

  init() {
    this.createOverlay();
    this.createInfoPanel();
    this.setupEventListeners();
    this.connectToServer();
    console.log('🎯 Selection Reporter initialized');
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'dt-selection-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      border: 2px solid #2196f3;
      background: rgba(33, 150, 243, 0.1);
      z-index: 999999;
      display: none;
      transition: all 0.2s ease;
    `;
    document.body.appendChild(this.overlay);
  }

  createInfoPanel() {
    this.infoPanel = document.createElement('div');
    this.infoPanel.id = 'dt-info-panel';
    this.infoPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 999999;
      max-width: 300px;
      display: none;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(this.infoPanel);
  }

  setupEventListeners() {
    // Click to select
    document.addEventListener('click', (e) => {
      if (e.altKey) { // Alt+Click to select
        e.preventDefault();
        e.stopPropagation();
        this.selectElement(e.target);
      }
    });

    // Hover preview (with Alt key)
    document.addEventListener('mousemove', (e) => {
      if (e.altKey && e.target !== this.selectedElement) {
        this.previewElement(e.target);
      } else if (!e.altKey && !this.selectedElement) {
        this.hideOverlay();
      }
    });

    // Listen for DevTools element selection
    this.listenForDevToolsSelection();
  }

  listenForDevToolsSelection() {
    // Inject a script that can access the DevTools API
    const script = document.createElement('script');
    script.textContent = `
      // Listen for element inspection
      if (window.chrome && chrome.devtools) {
        chrome.devtools.inspectedWindow.eval(
          "setInterval(() => { if ($0) { window.postMessage({ type: 'devtools-selection', element: $0.outerHTML.substring(0, 200) }, '*'); } }, 1000)"
        );
      }
    `;
    document.head.appendChild(script);

    // Listen for messages from the injected script
    window.addEventListener('message', (event) => {
      if (event.data.type === 'devtools-selection') {
        console.log('DevTools selection detected:', event.data.element);
      }
    });
  }

  selectElement(element) {
    this.selectedElement = element;
    this.showOverlay(element);
    this.updateInfoPanel(element);
    this.reportSelection(element);
  }

  previewElement(element) {
    this.showOverlay(element, true);
  }

  showOverlay(element, isPreview = false) {
    const rect = element.getBoundingClientRect();
    this.overlay.style.left = rect.left + 'px';
    this.overlay.style.top = rect.top + 'px';
    this.overlay.style.width = rect.width + 'px';
    this.overlay.style.height = rect.height + 'px';
    this.overlay.style.borderColor = isPreview ? '#ff9800' : '#2196f3';
    this.overlay.style.borderStyle = isPreview ? 'dashed' : 'solid';
    this.overlay.style.display = 'block';
  }

  hideOverlay() {
    this.overlay.style.display = 'none';
  }

  updateInfoPanel(element) {
    const info = this.getElementInfo(element);
    this.infoPanel.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #2196f3;">
        🎯 Selected Element
      </div>
      <div style="margin-bottom: 4px;">
        <span style="color: #ff9800;">Tag:</span> ${info.tag}
      </div>
      ${info.id ? `<div style="margin-bottom: 4px;"><span style="color: #ff9800;">ID:</span> ${info.id}</div>` : ''}
      ${info.classes ? `<div style="margin-bottom: 4px;"><span style="color: #ff9800;">Classes:</span> ${info.classes}</div>` : ''}
      <div style="margin-bottom: 4px;">
        <span style="color: #ff9800;">Text:</span> ${info.text}
      </div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">
        <span style="color: #4caf50;">Selector:</span><br/>
        <code style="font-size: 11px;">${info.selector}</code>
      </div>
    `;
    this.infoPanel.style.display = 'block';
  }

  getElementInfo(element) {
    const tag = element.tagName.toLowerCase();
    const id = element.id;
    const classes = Array.from(element.classList).join(' ');
    const text = element.textContent.trim().substring(0, 50) + (element.textContent.length > 50 ? '...' : '');
    
    // Build a unique selector
    let selector = tag;
    if (id) selector += `#${id}`;
    else if (classes) selector += `.${Array.from(element.classList).join('.')}`;
    
    // Get computed styles
    const styles = window.getComputedStyle(element);
    const position = element.getBoundingClientRect();
    
    return {
      tag,
      id,
      classes,
      text,
      selector,
      position: {
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height
      },
      styles: {
        display: styles.display,
        position: styles.position,
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily
      }
    };
  }

  reportSelection(element) {
    const info = this.getElementInfo(element);
    const report = {
      type: 'element-selected',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      element: info,
      html: element.outerHTML.substring(0, 500), // First 500 chars
      path: this.getElementPath(element)
    };
    
    // Send via WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(report));
      console.log('📡 Selection reported to AI:', report);
    }
    
    // Also log to console for debugging
    console.log('🎯 Element selected:', report);
    
    // Visual feedback
    this.showNotification('Selection reported to AI assistant');
  }

  getElementPath(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        selector += `.${current.className.split(' ')[0]}`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  connectToServer() {
    try {
      this.ws = new WebSocket('ws://localhost:8080');
      
      this.ws.onopen = () => {
        console.log('🔌 Connected to Decision Tapestry server');
        this.ws.send(JSON.stringify({
          type: 'dom-editor-connected',
          url: window.location.href
        }));
      };
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'request-selection') {
          // AI is asking what's currently selected
          if (this.selectedElement) {
            this.reportSelection(this.selectedElement);
          }
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting in 5s...');
        setTimeout(() => this.connectToServer(), 5000);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 999999;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize on load
const selectionReporter = new SelectionReporter();

// Expose to extension
window.dtSelectionReporter = selectionReporter;