/**
 * DOM Editor Content Script
 * Handles visual element selection and CSS editing
 */

// State management
let isSelecting = false;
let selectedElement = null;
let originalStyles = new Map();
let hoveredElement = null;
let wsConnection = null;
let selectionFrozen = false;

// Visual feedback elements
let highlightOverlay = null;
let selectedOverlay = null;
let selectionInfo = null;
let floatingPanel = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// DOM Change Detection System variables
let domObserver = null;
let changeQueue = [];
let debounceTimer = null;
let changeHistory = [];
let elementStyleCache = new WeakMap();
let styleCheckInterval = null;
let lastUserActivity = 0;
let isDevToolsActive = false;

// Initialize the content script
function initialize() {
  console.log('📋 Initializing DOM Editor content script v9.0 - DevTools selection tracking');
  createOverlayElements();
  createFloatingPanel();
  connectToServer();
  setupMessageListeners();
  setupDOMChangeDetection();
  console.log('📋 DOM Editor initialization complete with DOM change detection');
}

// Create visual overlay elements
function createOverlayElements() {
  // Highlight overlay (for hovering)
  highlightOverlay = document.createElement('div');
  highlightOverlay.id = 'dt-highlight-overlay';
  highlightOverlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 999999;
    outline: 2px solid #0066ff;
    background: rgba(0, 102, 255, 0.1);
    transition: none;
    display: none;
    box-sizing: border-box;
    border-radius: 2px;
  `;
  document.body.appendChild(highlightOverlay);

  // Selected element overlay (light green)
  selectedOverlay = document.createElement('div');
  selectedOverlay.id = 'dt-selected-overlay';
  selectedOverlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 999998;
    outline: 2px solid #28a745;
    background: rgba(40, 167, 69, 0.1);
    transition: none;
    display: none;
    box-sizing: border-box;
    border-radius: 2px;
  `;
  document.body.appendChild(selectedOverlay);

  // Selection info tooltip
  selectionInfo = document.createElement('div');
  selectionInfo.id = 'dt-selection-info';
  selectionInfo.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 999999;
    background: #0066ff;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
    display: none;
    white-space: nowrap;
  `;
  document.body.appendChild(selectionInfo);
}

// Connect to Decision Tapestry server
function connectToServer() {
  try {
    wsConnection = new WebSocket('ws://localhost:8080');
    
    wsConnection.onopen = () => {
      console.log('Connected to Decision Tapestry server');
      updateConnectionStatus('ws', 'connected', 'Connected to localhost:8080');
      updateConnectionStatus('server', 'processing', 'Authenticating...');
      
      wsConnection.send(JSON.stringify({
        type: 'dom_editor_connect',
        url: window.location.href
      }));
    };

    wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      updateConnectionStatus('server', 'connected', 'Receiving messages');
      handleServerMessage(data);
    };

    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
      console.log('Connection state:', wsConnection.readyState);
      console.log('Server URL: ws://localhost:8080');
      updateConnectionStatus('ws', 'error', 'Connection failed');
      updateConnectionStatus('server', 'error', 'Unreachable');
    };

    wsConnection.onclose = () => {
      console.log('Disconnected from server');
      updateConnectionStatus('ws', 'error', 'Disconnected');
      updateConnectionStatus('server', 'error', 'Connection lost');
      updateConnectionStatus('claude', 'warning', 'Connection lost');
      
      // Attempt reconnection after 5 seconds
      setTimeout(() => {
        updateConnectionStatus('ws', 'processing', 'Reconnecting...');
        connectToServer();
      }, 5000);
    };
  } catch (error) {
    console.error('Failed to connect:', error);
  }
}

// Handle messages from the extension popup and DevTools
function setupMessageListeners() {
  console.log('📋 Setting up message listeners');
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📋 Received message:', request);
    switch (request.action) {
      case 'togglePanel':
        toggleFloatingPanel();
        sendResponse({ success: true });
        break;
      case 'startSelection':
        startSelection();
        sendResponse({ success: true });
        break;
      case 'stopSelection':
        stopSelection();
        sendResponse({ success: true });
        break;
      case 'getSelectedElement':
        sendResponse({ 
          element: selectedElement ? getElementInfo(selectedElement) : null 
        });
        break;
      case 'devtools_element_selected':
        // Handle element selection from DevTools
        console.log('📋 DevTools element selected:', request.element);
        updateSelectedElementDisplay(request.element);
        sendResponse({ success: true });
        break;
      case 'updateStyles':
        updateElementStyles(request.styles);
        sendResponse({ success: true });
        break;
      case 'removeElement':
        removeSelectedElement();
        sendResponse({ success: true });
        break;
      case 'undoChanges':
        undoAllChanges();
        sendResponse({ success: true });
        break;
      case 'devtools_element_selected':
        handleDevToolsSelection(request.element);
        sendResponse({ success: true });
        break;
    }
    return true;
  });
}

// Start visual selection mode
function startSelection() {
  isSelecting = true;
  selectionFrozen = false;
  
  // Use simpler mouse tracking
  document.addEventListener('mousemove', handleMouseMove, { capture: true });
  document.addEventListener('keydown', handleKeyDown, { capture: true });
  
  document.body.style.cursor = 'crosshair';
  
  // Update button state
  const toggleBtn = floatingPanel?.querySelector('#dt-toggle-select');
  if (toggleBtn) {
    toggleBtn.classList.add('active');
  }
  
  // Show keyboard help
  const keyboardHelp = document.getElementById('dt-keyboard-help');
  if (keyboardHelp) {
    keyboardHelp.style.display = 'block';
  }
  
  console.log('📋 Element selection mode activated');
  console.log('🎮 Controls: S = select, ←→ = parent/child, ↑↓ = siblings');
}

// Stop selection mode
function stopSelection() {
  isSelecting = false;
  selectionFrozen = false;
  hoveredElement = null;
  
  document.removeEventListener('mousemove', handleMouseMove, { capture: true });
  document.removeEventListener('keydown', handleKeyDown, { capture: true });
  
  document.body.style.cursor = '';
  hideHighlight();
  
  // Hide overlays
  if (highlightOverlay) highlightOverlay.style.display = 'none';
  if (selectionInfo) selectionInfo.style.display = 'none';
  if (selectedOverlay) selectedOverlay.style.display = 'none';
  
  // Update button state
  const toggleBtn = floatingPanel?.querySelector('#dt-toggle-select');
  if (toggleBtn) {
    toggleBtn.classList.remove('active');
  }
  
  // Hide keyboard help
  const keyboardHelp = document.getElementById('dt-keyboard-help');
  if (keyboardHelp) {
    keyboardHelp.style.display = 'none';
  }
  
  console.log('📋 Element selection mode deactivated');
}

// Handle mouse move during selection
function handleMouseMove(event) {
  if (!isSelecting || selectionFrozen) return;
  
  // Get element at mouse position
  const element = getElementAtPoint(event.clientX, event.clientY);
  
  // Skip our own overlay elements
  if (!element || (element.id && element.id.startsWith('dt-'))) return;
  
  if (element !== hoveredElement) {
    hoveredElement = element;
    showHighlight(element);
  }
}

// Handle keyboard navigation
function handleKeyDown(event) {
  if (!isSelecting) return;
  
  switch(event.key.toLowerCase()) {
    case 's':
      // Select current element (always allow new selection)
      event.preventDefault();
      if (hoveredElement) {
        // Clear any existing selection
        if (selectedOverlay) {
          selectedOverlay.style.display = 'none';
        }
        
        // Make new selection
        selectElement(hoveredElement);
        selectionFrozen = true;
        showSelectedHighlight(hoveredElement);
      }
      break;
      
    case 'escape':
      // Exit selection mode
      event.preventDefault();
      stopSelection();
      break;
      
    case 'delete':
    case 'backspace':
      // Clear selection
      event.preventDefault();
      if (selectedElement || selectionFrozen) {
        // Clear selection
        selectedElement = null;
        selectionFrozen = false;
        
        // Hide selected overlay
        if (selectedOverlay) selectedOverlay.style.display = 'none';
        
        // Clear the selected element display
        const tagElement = floatingPanel?.querySelector('#dt-element-tag');
        const idElement = floatingPanel?.querySelector('#dt-element-id');
        if (tagElement) tagElement.textContent = 'None';
        if (idElement) idElement.style.display = 'none';
        
        console.log('✅ Selection cleared');
      }
      break;
      
    case 'arrowleft':
      // Navigate to parent
      event.preventDefault();
      navigateToParent();
      break;
      
    case 'arrowright':
      // Navigate to first child
      event.preventDefault();
      navigateToChild();
      break;
      
    case 'arrowup':
      // Navigate to previous sibling
      event.preventDefault();
      navigateToSibling(-1);
      break;
      
    case 'arrowdown':
      // Navigate to next sibling
      event.preventDefault();
      navigateToSibling(1);
      break;
  }
}

// Navigate to parent element
function navigateToParent() {
  if (!hoveredElement) return;
  
  let parent = hoveredElement.parentElement;
  
  // Skip our own elements
  while (parent && parent.id && parent.id.startsWith('dt-')) {
    parent = parent.parentElement;
  }
  
  if (parent && parent !== document.body) {
    hoveredElement = parent;
    showHighlight(parent);
  }
}

// Navigate to first child
function navigateToChild() {
  if (!hoveredElement || !hoveredElement.children.length) return;
  
  // Find first non-dt child
  for (let child of hoveredElement.children) {
    if (!child.id || !child.id.startsWith('dt-')) {
      hoveredElement = child;
      showHighlight(child);
      break;
    }
  }
}

// Navigate to sibling
function navigateToSibling(direction) {
  if (!hoveredElement || !hoveredElement.parentElement) return;
  
  const siblings = Array.from(hoveredElement.parentElement.children);
  const currentIndex = siblings.indexOf(hoveredElement);
  
  if (currentIndex === -1) return;
  
  let newIndex = currentIndex + direction;
  
  // Wrap around
  if (newIndex < 0) newIndex = siblings.length - 1;
  if (newIndex >= siblings.length) newIndex = 0;
  
  // Skip dt- elements
  let attempts = 0;
  while (attempts < siblings.length) {
    const sibling = siblings[newIndex];
    if (!sibling.id || !sibling.id.startsWith('dt-')) {
      hoveredElement = sibling;
      showHighlight(sibling);
      break;
    }
    newIndex = (newIndex + direction + siblings.length) % siblings.length;
    attempts++;
  }
}

// Select an element
function selectElement(element) {
  selectedElement = element;
  
  // Store original styles
  if (!originalStyles.has(element)) {
    originalStyles.set(element, {
      cssText: element.style.cssText,
      computedStyle: window.getComputedStyle(element).cssText
    });
  }
  
  // Get enhanced element info including Lit metadata
  const elementInfo = getElementInfo(element);
  
  // Add Lit-specific information
  if (element._isLitElement) {
    elementInfo.isLitElement = true;
  }
  if (element._shadowHost) {
    elementInfo.shadowHost = {
      tagName: element._shadowHost.tagName.toLowerCase(),
      id: element._shadowHost.id || '',
      className: element._shadowHost.className || ''
    };
  }
  
  // Enable the Remove Element button
  const removeBtn = floatingPanel?.querySelector('#dt-remove-element-btn');
  if (removeBtn) {
    removeBtn.disabled = false;
  }
  
  // Send selection to server
  sendToServer({
    type: 'element_selected',
    element: elementInfo
  });
  
  // Update floating panel with enhanced display
  updateSelectedElementDisplay(elementInfo);
  
  // Notify popup
  chrome.runtime.sendMessage({
    action: 'elementSelected',
    element: elementInfo
  });
}

// Handle element selection from DevTools
function handleDevToolsSelection(elementInfo) {
  console.log('📋 DevTools element selected:', elementInfo);
  console.log('📋 Floating panel exists:', !!floatingPanel);
  console.log('📋 Floating panel display:', floatingPanel ? floatingPanel.style.display : 'N/A');
  
  // Find the actual DOM element using the selector
  try {
    const element = document.querySelector(elementInfo.selector);
    if (element) {
      selectedElement = element;
      
      // Store original styles
      if (!originalStyles.has(element)) {
        originalStyles.set(element, {
          cssText: element.style.cssText,
          computedStyle: window.getComputedStyle(element).cssText
        });
      }
      
      // Send enhanced selection to server with DevTools context
      sendToServer({
        type: 'element_selected',
        source: 'devtools',
        element: elementInfo,
        timestamp: new Date().toISOString()
      });
      
      // Update floating panel if it's visible
      if (floatingPanel && floatingPanel.style.display !== 'none') {
        updateFloatingPanel(elementInfo);
      }
      
      // Show visual highlight briefly
      showDevToolsHighlight(element);
      
      console.log('📋 Element successfully selected from DevTools:', elementInfo.selector);
    } else {
      console.warn('📋 Could not find element with selector:', elementInfo.selector);
    }
  } catch (error) {
    console.error('📋 Error selecting element from DevTools:', error);
  }
}

// Show a brief highlight for DevTools selection
function showDevToolsHighlight(element) {
  const rect = element.getBoundingClientRect();
  
  // Create temporary highlight with different colors for different selection methods
  const devToolsHighlight = document.createElement('div');
  devToolsHighlight.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    pointer-events: none;
    z-index: 999999;
    outline: 3px solid #00ff88;
    background: rgba(0, 255, 136, 0.2);
    border-radius: 4px;
    /* animation: devtools-pulse 1.5s ease-out; REMOVED */
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.6);
  `;
  
  // Add animation keyframes
  if (!document.getElementById('devtools-highlight-styles')) {
    const style = document.createElement('style');
    style.id = 'devtools-highlight-styles';
    style.textContent = `
      /* REMOVED devtools-pulse animation
      @keyframes devtools-pulse {
        0% { 
          transform: scale(1.08);
          opacity: 1;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
        }
        25% {
          transform: scale(1.05);
          opacity: 0.9;
          box-shadow: 0 0 15px rgba(0, 255, 136, 0.6);
        } */
        50% {
          transform: scale(1.03);
          opacity: 0.7;
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.4);
        }
        75% {
          transform: scale(1.01);
          opacity: 0.4;
          box-shadow: 0 0 5px rgba(0, 255, 136, 0.2);
        }
        100% { 
          transform: scale(1);
          opacity: 0;
          box-shadow: 0 0 0px rgba(0, 255, 136, 0);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(devToolsHighlight);
  
  // Remove after animation
  setTimeout(() => {
    if (devToolsHighlight.parentNode) {
      devToolsHighlight.parentNode.removeChild(devToolsHighlight);
    }
  }, 1500);
}

// Get element information
function getElementInfo(element) {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  
  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id,
    className: element.className,
    selector: generateSelector(element),
    position: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    },
    styles: {
      display: computedStyle.display,
      position: computedStyle.position,
      margin: computedStyle.margin,
      padding: computedStyle.padding,
      border: computedStyle.border,
      background: computedStyle.background,
      color: computedStyle.color,
      fontSize: computedStyle.fontSize,
      fontFamily: computedStyle.fontFamily,
      width: computedStyle.width,
      height: computedStyle.height
    },
    text: element.textContent.substring(0, 100)
  };
}

// Generate CSS selector for element
function generateSelector(element) {
  // Check if element is in Shadow DOM
  if (element.getRootNode() !== document) {
    return generateShadowSelector(element);
  }
  
  const path = [];
  let current = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector = '#' + current.id;
      path.unshift(selector);
      break;
    } else if (current.className) {
      // Handle both string and SVGAnimatedString
      const classes = typeof current.className === 'string' 
        ? current.className 
        : current.className.baseVal || '';
      if (classes.trim()) {
        selector += '.' + classes.split(' ').filter(c => c).join('.');
      }
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
}

// Show highlight overlay
function showHighlight(element) {
  const rect = element.getBoundingClientRect();
  
  highlightOverlay.style.top = rect.top + window.scrollY + 'px';
  highlightOverlay.style.left = rect.left + window.scrollX + 'px';
  highlightOverlay.style.width = rect.width + 'px';
  highlightOverlay.style.height = rect.height + 'px';
  highlightOverlay.style.display = 'block';
  
  // Change highlight color for Lit elements
  if (element._isLitElement) {
    highlightOverlay.style.outline = '2px solid #ff6b6b';
    highlightOverlay.style.background = 'rgba(255, 107, 107, 0.1)';
  } else {
    highlightOverlay.style.outline = '2px solid #0066ff';
    highlightOverlay.style.background = 'rgba(0, 102, 255, 0.1)';
  }
  
  // Show element info with enhanced display
  let displayText = element.tagName.toLowerCase();
  if (element.id) {
    displayText += `#${element.id}`;
  } else if (element.className && typeof element.className === 'string') {
    const firstClass = element.className.split(' ')[0];
    if (firstClass) displayText += `.${firstClass}`;
  }
  
  // Add Lit indicator
  if (element._isLitElement) {
    displayText += ' 🔥';
  }
  
  // Add shadow host info
  if (element._shadowHost) {
    displayText += ` (in ${element._shadowHost.tagName.toLowerCase()})`;
  }
  
  // Add keyboard hint if not selected
  if (!selectionFrozen) {
    displayText += ' (Press S to select)';
  }
  
  selectionInfo.textContent = displayText;
  selectionInfo.style.top = (rect.top + window.scrollY - 30) + 'px';
  selectionInfo.style.left = rect.left + window.scrollX + 'px';
  selectionInfo.style.display = 'block';
}

// Hide highlight overlay
function hideHighlight() {
  highlightOverlay.style.display = 'none';
  selectionInfo.style.display = 'none';
}

// Show selected element highlight (light green)
function showSelectedHighlight(element) {
  if (!selectedOverlay) return;
  
  const rect = element.getBoundingClientRect();
  
  selectedOverlay.style.top = rect.top + window.scrollY + 'px';
  selectedOverlay.style.left = rect.left + window.scrollX + 'px';
  selectedOverlay.style.width = rect.width + 'px';
  selectedOverlay.style.height = rect.height + 'px';
  selectedOverlay.style.display = 'block';
}

// Request code removal through server
function requestCodeRemoval(element) {
  if (!element) return;
  
  const removeBtn = floatingPanel?.querySelector('#dt-remove-element-btn');
  if (removeBtn) {
    removeBtn.disabled = true;
    removeBtn.textContent = 'Removing...';
  }
  
  // Get comprehensive element information
  const elementInfo = getElementInfo(element);
  
  // Add additional context for code identification
  elementInfo.context = {
    // Get parent chain for better identification
    parentChain: getParentChain(element),
    // Get surrounding HTML context
    siblingContext: getSiblingContext(element),
    // Get file path if available from any data attributes
    filePath: findSourceFile(element)
  };
  
  console.log('🔍 Requesting code removal for:', elementInfo);
  
  // Send to server with code removal request
  sendToServer({
    type: 'request_code_removal',
    element: elementInfo,
    url: window.location.href
  });
  
  // Visual feedback
  element.style.opacity = '0.3';
  element.style.outline = '2px dashed red';
}

// Get parent chain for element identification
function getParentChain(element) {
  const chain = [];
  let current = element.parentElement;
  let depth = 0;
  
  while (current && depth < 5 && current !== document.body) {
    chain.push({
      tagName: current.tagName.toLowerCase(),
      id: current.id || undefined,
      className: current.className || undefined,
      attributes: getRelevantAttributes(current)
    });
    current = current.parentElement;
    depth++;
  }
  
  return chain;
}

// Get sibling context
function getSiblingContext(element) {
  const parent = element.parentElement;
  if (!parent) return null;
  
  const siblings = Array.from(parent.children);
  const index = siblings.indexOf(element);
  
  return {
    index: index,
    totalSiblings: siblings.length,
    prevSibling: index > 0 ? getElementSignature(siblings[index - 1]) : null,
    nextSibling: index < siblings.length - 1 ? getElementSignature(siblings[index + 1]) : null
  };
}

// Get element signature for comparison
function getElementSignature(element) {
  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || undefined,
    className: element.className || undefined,
    textContent: element.textContent.substring(0, 50).trim()
  };
}

// Try to find source file from data attributes or comments
function findSourceFile(element) {
  // Check for React/Vue dev tools attributes
  const reactFiber = element._reactFiber || element.__reactInternalFiber;
  if (reactFiber && reactFiber._debugSource) {
    return reactFiber._debugSource.fileName;
  }
  
  // Check for source map comments in scripts
  const scripts = document.getElementsByTagName('script');
  for (let script of scripts) {
    if (script.textContent && script.textContent.includes('sourceMappingURL')) {
      // Extract source map info if relevant
    }
  }
  
  // Check for data attributes that might indicate source
  return element.dataset.source || element.dataset.component || null;
}

// Get relevant attributes for identification
function getRelevantAttributes(element) {
  const relevant = {};
  const importantAttrs = ['data-testid', 'data-id', 'data-component', 'aria-label', 'name', 'type', 'role'];
  
  for (let attr of importantAttrs) {
    if (element.hasAttribute(attr)) {
      relevant[attr] = element.getAttribute(attr);
    }
  }
  
  return relevant;
}

// Update element styles
function updateElementStyles(styles) {
  if (!selectedElement) return;
  
  Object.assign(selectedElement.style, styles);
  
  // Track changes in history
  const elementInfo = getElementInfo(selectedElement);
  const styleChanges = Object.entries(styles).map(([prop, value]) => `${prop}: ${value}`).join(', ');
  addToHistory('style_changed', `Updated ${elementInfo.tagName}${elementInfo.id ? '#' + elementInfo.id : ''} - ${styleChanges}`);
  
  // Send style changes to server
  sendToServer({
    type: 'styles_updated',
    element: elementInfo,
    styles: styles
  });
}

// Remove selected element
function removeSelectedElement() {
  if (!selectedElement) return;
  
  // Show loading state in selection info
  if (selectionInfo && selectionInfo.style.display !== 'none') {
    const originalContent = selectionInfo.textContent;
    selectionInfo.innerHTML = `<span style="display: inline-flex; align-items: center;">${originalContent.replace(' (Press S to select)', '')} <span class="dt-loader" style="margin-left: 8px;"></span></span>`;
    
    // Add loader animation if not already in styles
    if (!document.getElementById('dt-loader-styles')) {
      const style = document.createElement('style');
      style.id = 'dt-loader-styles';
      style.textContent = `
        @keyframes dt-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .dt-loader {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: dt-spin 0.8s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  const elementInfo = getElementInfo(selectedElement);
  const elementToRemove = selectedElement;
  
  // Track in history
  addToHistory('element_removed', `Removed ${elementInfo.tagName}${elementInfo.id ? '#' + elementInfo.id : ''}`);
  
  sendToServer({
    type: 'element_removed',
    element: elementInfo
  });
  
  // Simulate processing time then remove element
  setTimeout(() => {
    // Actually remove the element from DOM
    elementToRemove.remove();
    
    // Clear selection
    selectedElement = null;
    selectionFrozen = false;
    
    // Hide overlays
    if (selectedOverlay) selectedOverlay.style.display = 'none';
    if (selectionInfo) selectionInfo.style.display = 'none';
    
    // Clear the selected element display
    const tagElement = floatingPanel?.querySelector('#dt-element-tag');
    const idElement = floatingPanel?.querySelector('#dt-element-id');
    if (tagElement) tagElement.textContent = 'None';
    if (idElement) idElement.style.display = 'none';
    
    console.log('✅ Element removed:', elementInfo.tagName);
  }, 500); // Small delay to show the loader
}

// Undo all changes
function undoAllChanges() {
  const changedElements = originalStyles.size;
  
  originalStyles.forEach((original, element) => {
    element.style.cssText = original.cssText;
  });
  originalStyles.clear();
  
  // Track in history
  addToHistory('changes_reset', `Undid all changes (${changedElements} elements restored)`);
  
  sendToServer({
    type: 'changes_reset'
  });
}

// Send data to server
function sendToServer(data) {
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    wsConnection.send(JSON.stringify({
      ...data,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }));
  }
}

// Handle server messages
function handleServerMessage(data) {
  switch (data.type) {
    case 'apply_styles':
      if (data.selector && data.styles) {
        const elements = document.querySelectorAll(data.selector);
        elements.forEach(el => Object.assign(el.style, data.styles));
      }
      break;
    case 'request_snapshot':
      sendPageSnapshot();
      break;
    case 'code_removal_complete':
      handleCodeRemovalComplete(data);
      break;
    case 'code_removal_failed':
      handleCodeRemovalFailed(data);
      break;
  }
}

// Send page snapshot
function sendPageSnapshot() {
  const snapshot = {
    type: 'page_snapshot',
    url: window.location.href,
    title: document.title,
    styles: Array.from(document.styleSheets).map(sheet => {
      try {
        return {
          href: sheet.href,
          rules: Array.from(sheet.cssRules).map(rule => rule.cssText)
        };
      } catch (e) {
        return { href: sheet.href, error: 'Cross-origin' };
      }
    }),
    elements: Array.from(originalStyles.entries()).map(([element, original]) => ({
      selector: generateSelector(element),
      original: original.cssText,
      current: element.style.cssText
    }))
  };
  
  sendToServer(snapshot);
}

// Create floating panel
function createFloatingPanel() {
  console.log('📋 Creating floating panel');
  floatingPanel = document.createElement('div');
  floatingPanel.id = 'dt-floating-panel';
  floatingPanel.innerHTML = `
    <div class="dt-panel-header">
      <span class="dt-panel-title">🎨 DOM Editor</span>
      <div class="dt-panel-controls">
        <button class="dt-btn dt-btn-minimize" title="Minimize">−</button>
        <button class="dt-btn dt-btn-close" title="Close">×</button>
      </div>
    </div>
    <div class="dt-panel-content">
      <!-- Connection status hidden
      <div class="dt-connection-status">
        <span class="dt-status-indicator" id="dt-status-indicator"></span>
        <span id="dt-status-text">Connecting...</span>
      </div>
      -->
      
      <!-- DOM Change Detection section hidden -->
      
      <div class="dt-section">
        <div class="dt-section-header">
          <span>Selected Element</span>
          <button class="dt-toggle-select" id="dt-toggle-select" title="Toggle selection mode">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 2l10 6-10 6V2z" transform="rotate(45 8 8)"/>
              <circle cx="8" cy="8" r="1.5"/>
            </svg>
          </button>
        </div>
        <div class="dt-element-info">
          <div class="dt-element-display">
            <span class="dt-element-tag" id="dt-element-tag">None</span>
            <span class="dt-element-id" id="dt-element-id"></span>
          </div>
          <div class="dt-element-details" id="dt-element-details" style="display: none;">
            <div class="dt-element-path" id="dt-element-path"></div>
          </div>
          <div class="dt-keyboard-help" style="font-size: 11px; color: #6c757d; margin-top: 8px; display: none;" id="dt-keyboard-help">
            🎮 <strong>S</strong>: Select | <strong>←→</strong>: Parent/Child | <strong>↑↓</strong>: Siblings | <strong>DEL</strong>: Clear | <strong>ESC</strong>: Exit
          </div>
        </div>
      </div>
      
      
      <!-- Change History section hidden for now
      <div class="dt-section">
        <div class="dt-section-header">
          <span>Change History</span>
        </div>
        <div class="dt-history-list" id="dt-history-list">
          <div class="dt-no-history">No changes yet</div>
        </div>
        <div class="dt-approve-section">
          <div class="dt-approve-controls">
            <button class="dt-select-all-btn" id="dt-select-all">Select All</button>
            <button class="dt-approve-btn" id="dt-approve-selected">✓ Approve</button>
            <button class="dt-reject-btn" id="dt-reject-selected">✗ Reject</button>
          </div>
          <div style="font-size: 10px; color: #6c757d;">
            <span id="dt-selection-count">0 selected</span> • <span id="dt-approved-count">0 approved</span>
          </div>
        </div>
      </div>
      -->
      
      <div class="dt-section">
        <div class="dt-section-header">
          <span>Actions</span>
        </div>
        <div class="dt-action-buttons">
          <button class="dt-btn dt-btn-danger" id="dt-remove-element-btn" disabled>Remove Element</button>
          <button class="dt-btn dt-btn-secondary" id="dt-clear-history-btn">Clear History</button>
          <button class="dt-btn dt-btn-primary" id="dt-test-changes-btn">Test Changes</button>
        </div>
      </div>
    </div>
  `;
  
  // Add comprehensive styles
  floatingPanel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 350px;
    max-height: 80vh;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: #333;
    display: block;
    overflow: hidden;
  `;
  
  // Add internal styles
  const style = document.createElement('style');
  style.textContent = `
    .dt-panel-header {
      background: #0066ff;
      color: white;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      user-select: none;
    }
    .dt-panel-title {
      font-weight: 600;
      font-size: 16px;
    }
    .dt-panel-controls {
      display: flex;
      gap: 8px;
    }
    .dt-btn {
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .dt-btn-minimize, .dt-btn-close {
      background: rgba(255,255,255,0.2);
      color: white;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border-radius: 50%;
    }
    .dt-btn-minimize:hover, .dt-btn-close:hover {
      background: rgba(255,255,255,0.3);
    }
    .dt-btn-primary {
      background: #0066ff;
      color: white;
    }
    .dt-btn-primary:hover {
      background: #0052cc;
    }
    .dt-btn-secondary {
      background: #6c757d;
      color: white;
    }
    .dt-btn-secondary:hover {
      background: #5a6268;
    }
    .dt-btn-warning {
      background: #ffc107;
      color: #212529;
    }
    .dt-btn-warning:hover {
      background: #e0a800;
    }
    .dt-btn-danger {
      background: #dc3545;
      color: white;
    }
    .dt-btn-danger:hover:not(:disabled) {
      background: #c82333;
    }
    .dt-btn-danger:disabled {
      background: #6c757d;
      opacity: 0.6;
      cursor: not-allowed;
    }
    .dt-btn-danger:hover {
      background: #c82333;
    }
    .dt-panel-content {
      padding: 16px;
      max-height: calc(80vh - 60px);
      overflow-y: auto;
    }
    .dt-connection-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 12px;
    }
    .dt-status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ff4444;
      /* animation: dt-pulse 2s infinite; REMOVED */
    }
    .dt-status-indicator.connected {
      background: #00cc44;
      /* animation: none; REMOVED */
    }
    .dt-status-indicator.connecting {
      background: #ffaa00;
    }
    /* REMOVED dt-pulse animation
    @keyframes dt-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    } */
    .dt-section {
      margin-bottom: 24px;
      border-bottom: 1px solid #e9ecef;
      padding-bottom: 20px;
    }
    .dt-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    .dt-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      font-weight: 600;
      color: #495057;
    }
    .dt-element-info {
      margin-top: 8px;
    }
    .dt-element-display {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .dt-element-path {
      font-size: 11px;
      color: #6c757d;
      margin-top: 8px;
      font-family: monospace;
      word-break: break-all;
    }
    .dt-toggle-select {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      transition: all 0.2s;
      color: #6c757d;
    }
    .dt-toggle-select:hover {
      background: #e9ecef;
      border-color: #ced4da;
    }
    .dt-toggle-select.active {
      background: #0066ff;
      border-color: #0066ff;
      color: white;
    }
    .dt-toggle-select svg {
      width: 16px;
      height: 16px;
      vertical-align: middle;
    }
    .dt-element-preview {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 12px;
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6c757d;
      font-size: 12px;
    }
    .dt-element-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .dt-detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .dt-label {
      font-weight: 500;
      color: #495057;
      min-width: 60px;
    }
    .dt-value {
      color: #6c757d;
      font-size: 12px;
      text-align: right;
      flex: 1;
      margin-left: 8px;
    }
    .dt-value.dt-code {
      font-family: monospace;
      background: #f8f9fa;
      padding: 2px 4px;
      border-radius: 2px;
      font-size: 11px;
      word-break: break-all;
    }
    .dt-style-groups {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .dt-style-group h4 {
      font-size: 12px;
      font-weight: 600;
      color: #495057;
      margin: 0 0 8px 0;
      padding-bottom: 4px;
      border-bottom: 1px solid #e9ecef;
    }
    .dt-style-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .dt-style-row label {
      font-size: 12px;
      color: #495057;
      min-width: 70px;
      font-weight: 500;
    }
    .dt-style-input {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 12px;
      transition: border-color 0.2s;
    }
    .dt-style-input:focus {
      outline: none;
      border-color: #0066ff;
      box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.2);
    }
    .dt-action-buttons {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .dt-action-buttons .dt-btn {
      width: 100%;
      padding: 8px;
      font-size: 12px;
    }
    .dt-panel-content::-webkit-scrollbar {
      width: 6px;
    }
    .dt-panel-content::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    .dt-panel-content::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    .dt-panel-content::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
    .dt-element-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #dee2e6;
    }
    .dt-element-tag {
      background: #0066ff;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      font-family: monospace;
    }
    .dt-element-id {
      background: #28a745;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      font-family: monospace;
    }
    .dt-element-id:empty::after {
      content: "(no id)";
      background: #6c757d;
      opacity: 0.7;
    }
    .dt-no-selection {
      text-align: center;
      padding: 20px;
      color: #6c757d;
      font-style: italic;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px dashed #dee2e6;
    }
    .dt-history-list {
      max-height: 200px;
      overflow-y: auto;
    }
    .dt-no-history {
      text-align: center;
      padding: 16px;
      color: #6c757d;
      font-style: italic;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px dashed #dee2e6;
    }
    .dt-history-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid #e9ecef;
      font-size: 13px;
    }
    .dt-history-item.approved {
      background: #d4edda;
      border-left: 3px solid #28a745;
    }
    .dt-history-item.rejected {
      background: #f8d7da;
      border-left: 3px solid #dc3545;
      opacity: 0.7;
    }
    .dt-history-checkbox {
      margin-right: 4px;
    }
    .dt-history-item:last-child {
      border-bottom: none;
    }
    .dt-history-time {
      color: #6c757d;
      min-width: 50px;
    }
    .dt-history-action {
      flex: 1;
      color: #495057;
    }
    .dt-history-element {
      color: #0066ff;
      font-family: monospace;
      font-weight: 600;
    }
    .dt-detection-status {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #dee2e6;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .dt-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #28a745;
      /* animation: pulse 2s infinite; REMOVED */
    }
    .dt-status-dot.inactive {
      background: #dc3545;
      /* animation: none; REMOVED */
    }
    .dt-approve-section {
      padding: 12px;
      border-top: 1px solid #dee2e6;
      background: #f8f9fa;
    }
    .dt-approve-controls {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }
    .dt-approve-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .dt-approve-btn:hover {
      background: #218838;
    }
    .dt-approve-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
    .dt-reject-btn {
      background: #dc3545;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .dt-reject-btn:hover {
      background: #c82333;
    }
    .dt-select-all-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      cursor: pointer;
    }
    .dt-select-all-btn:hover {
      background: #0056b3;
    }
    .dt-connection-status {
      display: flex;
      justify-content: space-around;
      padding: 10px 8px;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #dee2e6;
      margin: 0 0 16px 0;
      gap: 4px;
    }
    .dt-status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      flex: 1;
      justify-content: center;
    }
    .dt-status-light {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6c757d;
      transition: all 0.3s ease;
      box-shadow: 0 0 4px rgba(0,0,0,0.2);
    }
    .dt-status-light.connected {
      background: #28a745;
      box-shadow: 0 0 8px rgba(40, 167, 69, 0.5);
      /* animation: pulse-green 2s infinite; REMOVED */
    }
    .dt-status-light.error {
      background: #dc3545;
      box-shadow: 0 0 8px rgba(220, 53, 69, 0.5);
      /* animation: pulse-red 1s infinite; REMOVED */
    }
    .dt-status-light.warning {
      background: #ffc107;
      box-shadow: 0 0 8px rgba(255, 193, 7, 0.5);
    }
    .dt-status-light.processing {
      background: #007bff;
      box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
      /* animation: pulse-blue 1.5s infinite; REMOVED */
    }
    .dt-status-label {
      font-size: 11px;
      font-weight: 500;
      color: #495057;
      letter-spacing: 0.5px;
    }
    /* ALL ANIMATIONS REMOVED
    @keyframes pulse-green {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    @keyframes pulse-red {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @keyframes pulse-blue {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    */
  `;
  
  floatingPanel.appendChild(style);
  document.body.appendChild(floatingPanel);
  console.log('📋 Floating panel added to DOM');
  
  // Set up panel interactions
  setupPanelInteractions();
  
  // Initialize status lights
  initializeStatusLights();
  
  console.log('📋 Panel interactions set up');
}

// Toggle floating panel visibility
function toggleFloatingPanel() {
  if (floatingPanel.style.display === 'none' || floatingPanel.style.display === '') {
    floatingPanel.style.display = 'block';
  } else {
    floatingPanel.style.display = 'none';
  }
}


// Set up panel interactions
function setupPanelInteractions() {
  const header = floatingPanel.querySelector('.dt-panel-header');
  const minimizeBtn = floatingPanel.querySelector('.dt-btn-minimize');
  const closeBtn = floatingPanel.querySelector('.dt-btn-close');
  const content = floatingPanel.querySelector('.dt-panel-content');
  
  // Dragging functionality
  header.addEventListener('mousedown', (e) => {
    if (e.target === minimizeBtn || e.target === closeBtn) return;
    
    isDragging = true;
    const rect = floatingPanel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    
    e.preventDefault();
  });
  
  function handleDrag(e) {
    if (!isDragging) return;
    
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    // Keep panel within viewport
    const maxX = window.innerWidth - floatingPanel.offsetWidth;
    const maxY = window.innerHeight - floatingPanel.offsetHeight;
    
    floatingPanel.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    floatingPanel.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    floatingPanel.style.right = 'auto';
  }
  
  function handleDragEnd() {
    isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
  }
  
  // Minimize functionality
  minimizeBtn.addEventListener('click', () => {
    if (content.style.display === 'none') {
      content.style.display = 'block';
      minimizeBtn.textContent = '−';
      minimizeBtn.title = 'Minimize';
    } else {
      content.style.display = 'none';
      minimizeBtn.textContent = '+';
      minimizeBtn.title = 'Expand';
    }
  });
  
  // Close functionality
  closeBtn.addEventListener('click', () => {
    floatingPanel.style.display = 'none';
  });
  
  
  // Style inputs
  const styleInputs = floatingPanel.querySelectorAll('.dt-style-input');
  styleInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      if (!selectedElement) return;
      
      const property = e.target.dataset.property;
      const value = e.target.value;
      const styles = { [property]: value };
      
      updateElementStyles(styles);
    });
  });
  
  // Action buttons
  floatingPanel.querySelector('#dt-clear-history-btn').addEventListener('click', () => {
    changeHistory = [];
    updateHistoryDisplay();
    addToHistory('history_cleared', 'Change history cleared manually');
  });
  
  floatingPanel.querySelector('#dt-test-changes-btn').addEventListener('click', () => {
    debugDOMEditor.testDOMChange();
    addToHistory('test_triggered', 'Manual DOM change test triggered');
  });
  
  // Remove Element button functionality
  const removeElementBtn = floatingPanel.querySelector('#dt-remove-element-btn');
  if (removeElementBtn) {
    removeElementBtn.addEventListener('click', () => {
      if (selectedElement) {
        requestCodeRemoval(selectedElement);
      }
    });
  }
  
  // Approval system functionality - commented out since change history is hidden
  // setupApprovalSystem();
  
  // Selection toggle functionality
  const toggleSelectBtn = floatingPanel.querySelector('#dt-toggle-select');
  if (toggleSelectBtn) {
    toggleSelectBtn.addEventListener('click', () => {
      if (isSelecting) {
        stopSelection();
      } else {
        startSelection();
      }
    });
  }
}

function setupApprovalSystem() {
  const selectAllBtn = floatingPanel.querySelector('#dt-select-all');
  const approveBtn = floatingPanel.querySelector('#dt-approve-selected');
  const rejectBtn = floatingPanel.querySelector('#dt-reject-selected');
  const selectionCount = floatingPanel.querySelector('#dt-selection-count');
  const approvedCount = floatingPanel.querySelector('#dt-approved-count');
  
  function updateSelectionCounts() {
    const checkboxes = floatingPanel.querySelectorAll('.dt-history-checkbox');
    const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const totalApproved = changeHistory.filter(item => item.status === 'approved').length;
    
    selectionCount.textContent = `${selectedCount} selected`;
    approvedCount.textContent = `${totalApproved} approved`;
    
    approveBtn.disabled = selectedCount === 0;
    rejectBtn.disabled = selectedCount === 0;
  }
  
  // Select all functionality
  selectAllBtn.addEventListener('click', () => {
    const checkboxes = floatingPanel.querySelectorAll('.dt-history-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
      cb.checked = !allChecked;
    });
    updateSelectionCounts();
  });
  
  // Approve selected changes
  approveBtn.addEventListener('click', () => {
    const checkboxes = floatingPanel.querySelectorAll('.dt-history-checkbox:checked');
    checkboxes.forEach(cb => {
      const index = parseInt(cb.closest('.dt-history-item').dataset.index);
      if (changeHistory[index]) {
        changeHistory[index].status = 'approved';
        cb.checked = false;
      }
    });
    
    updateHistoryDisplay();
    updateSelectionCounts();
    
    // Send approved changes to server
    const approvedChanges = changeHistory.filter(item => item.status === 'approved');
    updateConnectionStatus('claude', 'processing', 'Processing approvals...');
    sendToServer({
      type: 'dom_changes_approved',
      approvedChanges: approvedChanges,
      url: window.location.href
    });
    
    // Update Claude status after processing
    setTimeout(() => {
      updateConnectionStatus('claude', 'connected', 'Approvals processed');
    }, 1000);
    
    console.log('📋 Approved', checkboxes.length, 'changes');
  });
  
  // Reject selected changes
  rejectBtn.addEventListener('click', () => {
    const checkboxes = floatingPanel.querySelectorAll('.dt-history-checkbox:checked');
    checkboxes.forEach(cb => {
      const index = parseInt(cb.closest('.dt-history-item').dataset.index);
      if (changeHistory[index]) {
        changeHistory[index].status = 'rejected';
        cb.checked = false;
      }
    });
    
    updateHistoryDisplay();
    updateSelectionCounts();
    console.log('📋 Rejected', checkboxes.length, 'changes');
  });
  
  // Handle individual checkbox changes
  floatingPanel.addEventListener('change', (e) => {
    if (e.target.classList.contains('dt-history-checkbox')) {
      updateSelectionCounts();
    }
  });
  
  // Initial count update
  updateSelectionCounts();
}

// Start smart style tracking that only captures user-initiated changes
function startSmartStyleTracking() {
  // Listen for DevTools activity indicators
  detectDevToolsActivity();
  
  // Check for style changes every second
  styleCheckInterval = setInterval(() => {
    checkForStyleChanges();
  }, 1000); // Check every second
}

// Detect when user is likely using DevTools
function detectDevToolsActivity() {
  // Method 1: Listen for focus changes that suggest DevTools interaction
  document.addEventListener('focusin', () => {
    lastUserActivity = Date.now();
  });
  
  // Method 2: Listen for specific keyboard shortcuts used in DevTools
  document.addEventListener('keydown', (e) => {
    // Common DevTools shortcuts
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
      lastUserActivity = Date.now();
    }
  });
  
  // Method 3: Detect inline style attribute changes (usually from DevTools)
  const inlineStyleObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && 
          mutation.attributeName === 'style' &&
          mutation.target && 
          shouldTrackElement(mutation.target)) {
        console.log('🎯 DevTools style change detected on:', getElementIdentifier(mutation.target));
        lastUserActivity = Date.now();
        isDevToolsActive = true;
        
        // Keep active for 5 seconds after a style change
        setTimeout(() => {
          console.log('🎯 DevTools activity timeout - deactivating');
          isDevToolsActive = false;
        }, 5000);
      }
    });
  });
  
  inlineStyleObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['style'],
    subtree: true
  });
}

// Check for style changes (only when DevTools is active)
function checkForStyleChanges() {
  // Removed DevTools active check - always check for changes
  
  const elements = document.querySelectorAll('*:not(script):not(style):not(link):not(meta)');
  let checkedCount = 0;
  let skippedCount = 0;
  
  elements.forEach(element => {
    if (!shouldTrackElement(element)) {
      skippedCount++;
      return;
    }
    
    // Skip if element is not visible
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      skippedCount++;
      return;
    }
    
    checkedCount++;
    
    const computedStyle = window.getComputedStyle(element);
    const currentStyles = {};
    
    // Only track key properties that users typically edit
    const userEditableProperties = [
      'color', 'backgroundColor', 'fontSize', 'fontWeight',
      'margin', 'padding', 'width', 'height', 'display',
      'position', 'top', 'left', 'right', 'bottom',
      'border', 'opacity', 'transform'
    ];
    
    userEditableProperties.forEach(prop => {
      currentStyles[prop] = computedStyle[prop];
    });
    
    if (elementStyleCache.has(element)) {
      const cachedStyles = elementStyleCache.get(element);
      const changes = [];
      
      for (const prop in currentStyles) {
        if (cachedStyles[prop] !== currentStyles[prop]) {
          // DISABLED - Track all opacity changes
          // if (prop === 'opacity') {
          //   const oldVal = parseFloat(cachedStyles[prop]);
          //   const newVal = parseFloat(currentStyles[prop]);
          //   if (Math.abs(oldVal - newVal) < 0.1 && oldVal > 0 && newVal > 0) {
          //     continue;
          //   }
          // }
          
          changes.push({
            property: prop,
            oldValue: cachedStyles[prop],
            newValue: currentStyles[prop]
          });
        }
      }
      
      if (changes.length > 0) {
        console.log('💡 Found style changes:', changes.length, 'on', getElementIdentifier(element));
        
        // Always track changes during inline style mutations OR when DevTools is active
        changeQueue.push({
          type: 'devtools_style_changed',
          element: getElementIdentifier(element),
          changes: changes,
          timestamp: new Date()
        });
        
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processChangeQueue, 100);
      }
    }
    
    elementStyleCache.set(element, currentStyles);
  });
  
  if (checkedCount > 0) {
    console.log(`🔍 Checked ${checkedCount} elements, skipped ${skippedCount}`);
  }
}

// Original function for reference (keeping for compatibility)
function startComputedStyleTracking() {
  if (styleCheckInterval) {
    clearInterval(styleCheckInterval);
  }
  
  // Track important CSS properties
  const trackedProperties = [
    'display', 'position', 'width', 'height', 'margin', 'padding',
    'background', 'backgroundColor', 'backgroundImage', 'border',
    'color', 'fontSize', 'fontWeight', 'opacity', 'transform',
    'top', 'left', 'right', 'bottom', 'zIndex', 'visibility',
    'flex', 'flexDirection', 'justifyContent', 'alignItems',
    'gridTemplateColumns', 'gridTemplateRows', 'gap'
  ];
  
  // Check for style changes every 1 second
  styleCheckInterval = setInterval(() => {
    // Only check visible elements to improve performance
    const elements = document.querySelectorAll('*:not(script):not(style):not(link):not(meta)');
    
    elements.forEach(element => {
      if (!shouldTrackElement(element)) return;
      
      // Skip if element is not visible
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      
      const computedStyle = window.getComputedStyle(element);
      const currentStyles = {};
      
      // Get current computed styles
      trackedProperties.forEach(prop => {
        currentStyles[prop] = computedStyle[prop];
      });
      
      // Check if we have cached styles
      if (elementStyleCache.has(element)) {
        const cachedStyles = elementStyleCache.get(element);
        const changes = [];
        
        // Compare styles
        for (const prop in currentStyles) {
          if (cachedStyles[prop] !== currentStyles[prop]) {
            changes.push({
              property: prop,
              oldValue: cachedStyles[prop],
              newValue: currentStyles[prop]
            });
          }
        }
        
        // If there are changes, add to queue
        if (changes.length > 0) {
          // Filter out animation-only changes (just opacity changing)
          const isOnlyOpacityChange = changes.length === 1 && changes[0].property === 'opacity';
          const isLikelyAnimation = isOnlyOpacityChange && 
            parseFloat(changes[0].oldValue) > 0 && 
            parseFloat(changes[0].newValue) > 0;
          
          // Filter out transform changes (often animations)
          const isOnlyTransformChange = changes.length === 1 && changes[0].property === 'transform';
          
          // Filter out any changes to dt- prefixed elements
          const isDtElement = element.id?.startsWith('dt-') || 
                             element.className?.includes('dt-') ||
                             element.closest('#dt-floating-panel');
          
          if (!isLikelyAnimation && !isOnlyTransformChange && !isDtElement) {
            // Debug log to see what's getting through
            console.log('Style change detected:', {
              element: getElementIdentifier(element),
              changes: changes.map(c => `${c.property}: ${c.oldValue} → ${c.newValue}`)
            });
            
            changeQueue.push({
              type: 'computed_style_changed',
              element: getElementIdentifier(element),
              changes: changes,
              timestamp: new Date()
            });
            
            // Trigger processing
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(processChangeQueue, 100);
          }
        }
      }
      
      // Update cache
      elementStyleCache.set(element, currentStyles);
    });
  }, 1000);
}

// Update connection status lights
function updateConnectionStatus(component, status, message = '') {
  const statusLight = floatingPanel?.querySelector(`#dt-${component}-status`);
  if (!statusLight) return;
  
  // Remove all status classes
  statusLight.className = 'dt-status-light';
  
  // Add appropriate status class
  switch (status) {
    case 'connected':
      statusLight.classList.add('connected');
      statusLight.title = `${component} connected${message ? ': ' + message : ''}`;
      break;
    case 'error':
      statusLight.classList.add('error');
      statusLight.title = `${component} error${message ? ': ' + message : ''}`;
      break;
    case 'warning':
      statusLight.classList.add('warning');
      statusLight.title = `${component} warning${message ? ': ' + message : ''}`;
      break;
    case 'processing':
      statusLight.classList.add('processing');
      statusLight.title = `${component} processing${message ? ': ' + message : ''}`;
      break;
    default:
      statusLight.title = `${component} disconnected`;
  }
}

// Initialize status lights
function initializeStatusLights() {
  updateConnectionStatus('ws', 'error', 'Not connected');
  updateConnectionStatus('server', 'error', 'Unknown');
  updateConnectionStatus('claude', 'warning', 'Waiting for activity');
}

// Stop computed style tracking
function stopComputedStyleTracking() {
  if (styleCheckInterval) {
    clearInterval(styleCheckInterval);
    styleCheckInterval = null;
  }
}

// Monitor stylesheet changes (DevTools edits)
function startStylesheetMonitoring() {
  console.log('📋 Starting stylesheet monitoring for DevTools edits');
  
  // Store initial stylesheet rules
  const stylesheetCache = new Map();
  
  function cacheStylesheetRules() {
    try {
      // Cache all stylesheet rules
      Array.from(document.styleSheets).forEach((sheet, sheetIndex) => {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            Array.from(rules).forEach((rule, ruleIndex) => {
              if (rule.type === CSSRule.STYLE_RULE) {
                const key = `${sheetIndex}-${ruleIndex}`;
                stylesheetCache.set(key, {
                  selector: rule.selectorText,
                  cssText: rule.style.cssText
                });
              }
            });
          }
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      });
    } catch (e) {
      console.error('Error caching stylesheets:', e);
    }
  }
  
  function checkForStylesheetChanges() {
    try {
      const changes = [];
      
      Array.from(document.styleSheets).forEach((sheet, sheetIndex) => {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            Array.from(rules).forEach((rule, ruleIndex) => {
              if (rule.type === CSSRule.STYLE_RULE) {
                const key = `${sheetIndex}-${ruleIndex}`;
                const cached = stylesheetCache.get(key);
                
                if (cached && cached.cssText !== rule.style.cssText) {
                  console.log('🎨 Stylesheet rule changed:', rule.selectorText);
                  
                  // Find affected elements
                  const affectedElements = document.querySelectorAll(rule.selectorText);
                  affectedElements.forEach(element => {
                    if (shouldTrackElement(element)) {
                      changes.push({
                        type: 'stylesheet_changed',
                        element: getElementIdentifier(element),
                        selector: rule.selectorText,
                        oldCss: cached.cssText,
                        newCss: rule.style.cssText,
                        timestamp: new Date()
                      });
                    }
                  });
                  
                  // Update cache
                  stylesheetCache.set(key, {
                    selector: rule.selectorText,
                    cssText: rule.style.cssText
                  });
                }
              }
            });
          }
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      });
      
      // Process changes
      if (changes.length > 0) {
        changes.forEach(change => {
          changeQueue.push(change);
        });
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processChangeQueue, 100);
      }
    } catch (e) {
      console.error('Error checking stylesheet changes:', e);
    }
  }
  
  // Initial cache
  cacheStylesheetRules();
  
  // Check for changes every second
  setInterval(() => {
    checkForStylesheetChanges();
  }, 1000);
}

// Update detection status
function updateDetectionStatus(isActive, message) {
  const dot = floatingPanel?.querySelector('#dt-detection-dot');
  const text = floatingPanel?.querySelector('#dt-detection-text');
  
  if (dot && text) {
    dot.className = isActive ? 'dt-status-dot' : 'dt-status-dot inactive';
    text.textContent = message;
  }
}

// Update selected element display from DevTools
function updateSelectedElementDisplay(elementInfo) {
  if (!floatingPanel || !elementInfo) return;
  
  const tagElement = floatingPanel.querySelector('#dt-element-tag');
  const idElement = floatingPanel.querySelector('#dt-element-id');
  const detailsElement = floatingPanel.querySelector('#dt-element-details');
  const pathElement = floatingPanel.querySelector('#dt-element-path');
  
  if (tagElement) {
    let tagText = elementInfo.tagName || 'unknown';
    
    // Add Lit indicator
    if (elementInfo.isLitElement) {
      tagText += ' 🔥';
    }
    
    // Add shadow DOM indicator
    if (elementInfo.shadowHost) {
      tagText += ` (in ${elementInfo.shadowHost.tagName})`;
    }
    
    tagElement.textContent = tagText;
  }
  
  if (idElement) {
    if (elementInfo.id) {
      idElement.textContent = `#${elementInfo.id}`;
      idElement.style.display = 'inline-block';
    } else if (elementInfo.className) {
      // Show first class if no ID
      const firstClass = elementInfo.className.split(' ')[0];
      idElement.textContent = `.${firstClass}`;
      idElement.style.display = 'inline-block';
      idElement.style.background = '#17a2b8'; // Different color for class
    } else {
      idElement.style.display = 'none';
    }
  }
  
  if (pathElement && elementInfo.selector) {
    pathElement.textContent = elementInfo.selector;
    if (detailsElement) {
      detailsElement.style.display = 'block';
    }
  }
  
  // Store reference to actual DOM element, not just the info
  if (selectedElement && selectedElement.nodeType) {
    // selectedElement is already the actual element, don't overwrite
  } else {
    // selectedElement was set to elementInfo, need to find actual element
    try {
      const actualElement = document.querySelector(elementInfo.selector);
      if (actualElement) {
        selectedElement = actualElement;
      }
    } catch (e) {
      console.warn('Could not find element with selector:', elementInfo.selector);
    }
  }
}

// Add to change history
function addToHistory(action, description) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  changeHistory.unshift({
    time: timeStr,
    action: action,
    description: description,
    timestamp: now
  });
  
  // Keep only last 50 changes
  if (changeHistory.length > 50) {
    changeHistory = changeHistory.slice(0, 50);
  }
  
  updateHistoryDisplay();
}

// Update history display
function updateHistoryDisplay() {
  const historyList = floatingPanel.querySelector('#dt-history-list');
  
  if (changeHistory.length === 0) {
    historyList.innerHTML = '<div class="dt-no-history">No changes yet</div>';
    return;
  }
  
  historyList.innerHTML = changeHistory.map((item, index) => `
    <div class="dt-history-item ${item.status || ''}" data-index="${index}">
      <input type="checkbox" class="dt-history-checkbox" id="dt-check-${index}" ${item.selected ? 'checked' : ''}>
      <span class="dt-history-action">${item.description}</span>
    </div>
  `).join('');
}

// Get element at point, drilling through Shadow DOM
function getElementAtPoint(x, y) {
  let element = document.elementFromPoint(x, y);
  
  // Skip our own elements
  if (element?.id?.startsWith('dt-') || element?.closest('#dt-floating-panel')) {
    // Try to find element behind our overlay
    const ourElements = document.querySelectorAll('[id^="dt-"], #dt-floating-panel');
    ourElements.forEach(el => el.style.pointerEvents = 'none');
    element = document.elementFromPoint(x, y);
    ourElements.forEach(el => el.style.pointerEvents = '');
  }
  
  // Enhanced Shadow DOM drilling for Lit Components
  const drillIntoShadowDOM = (el, depth = 0) => {
    if (!el || depth > 10) return el; // Prevent infinite recursion
    
    // Check multiple shadow root properties (Lit uses different ones)
    let shadowRoot = el.shadowRoot || el._shadowRoot || el.renderRoot;
    
    // Only try attachInternals on custom elements (elements with hyphen in tag name)
    if (!shadowRoot && el.attachInternals && el.tagName.includes('-')) {
      try {
        shadowRoot = el.attachInternals().shadowRoot;
      } catch (e) {
        // Ignore error for non-custom elements
      }
    }
    
    if (shadowRoot) {
      const shadowEl = shadowRoot.elementFromPoint(x, y);
      if (shadowEl && shadowEl !== el) {
        // Store the shadow host for reference
        shadowEl._shadowHost = el;
        return drillIntoShadowDOM(shadowEl, depth + 1);
      }
    }
    
    // Check for Lit's special properties
    if (el._$litElement$ || el._$litType$ || el.updateComplete) {
      // This is likely a Lit element
      el._isLitElement = true;
    }
    
    return el;
  };
  
  element = drillIntoShadowDOM(element) || element;
  
  return element;
}

// Find element in Shadow DOM at coordinates (backup method)
function findElementInShadowDOM(shadowRoot, x, y) {
  if (!shadowRoot) return null;
  
  // Try elementFromPoint first (more accurate)
  const element = shadowRoot.elementFromPoint(x, y);
  if (element) return element;
  
  // Fallback to bounding rect method
  const allElements = shadowRoot.querySelectorAll('*');
  
  for (let element of allElements) {
    const rect = element.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      // Check if this element also has shadow DOM
      if (element.shadowRoot) {
        const nestedElement = findElementInShadowDOM(element.shadowRoot, x, y);
        if (nestedElement) return nestedElement;
      }
      return element;
    }
  }
  
  return null;
}

// Enhanced element path generation for Shadow DOM
function generateShadowSelector(element) {
  const path = [];
  let current = element;
  
  while (current && current !== document) {
    let selector = current.tagName ? current.tagName.toLowerCase() : '';
    
    if (current.id) {
      selector = '#' + current.id;
      path.unshift(selector);
      break;
    } else if (current.className) {
      // Handle both string and SVGAnimatedString
      const classes = typeof current.className === 'string' 
        ? current.className 
        : current.className.baseVal || '';
      if (classes.trim()) {
        selector += '.' + classes.split(' ').filter(c => c).join('.');
      }
    }
    
    // Check if we're crossing a shadow boundary
    const host = current.getRootNode().host;
    if (host) {
      // We're in a shadow DOM, add the host element
      path.unshift(selector);
      path.unshift('::shadow');
      current = host;
    } else {
      path.unshift(selector);
      current = current.parentElement;
    }
  }
  
  return path.join(' > ');
}

// Handle successful code removal
function handleCodeRemovalComplete(data) {
  console.log('✅ Code removal complete:', data);
  
  const removeBtn = floatingPanel?.querySelector('#dt-remove-element-btn');
  if (removeBtn) {
    removeBtn.textContent = 'Removed!';
    removeBtn.style.background = '#28a745';
    
    // Reset after delay
    setTimeout(() => {
      removeBtn.textContent = 'Remove Element';
      removeBtn.style.background = '';
      removeBtn.disabled = true;
    }, 2000);
  }
  
  // Remove the element from DOM
  if (selectedElement) {
    selectedElement.remove();
    selectedElement = null;
    selectionFrozen = false;
    
    // Hide overlays
    if (selectedOverlay) selectedOverlay.style.display = 'none';
    
    // Clear display
    const tagElement = floatingPanel?.querySelector('#dt-element-tag');
    const idElement = floatingPanel?.querySelector('#dt-element-id');
    if (tagElement) tagElement.textContent = 'None';
    if (idElement) idElement.style.display = 'none';
  }
}

// Handle failed code removal
function handleCodeRemovalFailed(data) {
  console.error('❌ Code removal failed:', data.error);
  
  const removeBtn = floatingPanel?.querySelector('#dt-remove-element-btn');
  if (removeBtn) {
    removeBtn.textContent = 'Failed';
    removeBtn.style.background = '#ffc107';
    
    // Reset after delay
    setTimeout(() => {
      removeBtn.textContent = 'Remove Element';
      removeBtn.style.background = '';
      removeBtn.disabled = false;
    }, 2000);
  }
  
  // Reset element appearance
  if (selectedElement) {
    selectedElement.style.opacity = '';
    selectedElement.style.outline = '';
  }
}

// Initialize when DOM is ready
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
} catch (error) {
  console.error('📋 Failed to initialize DOM Editor:', error);
}


function setupDOMChangeDetection() {
  console.log('📋 Setting up DOM change detection');
  
  // Create a MutationObserver to watch for DOM changes
  domObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      processMutation(mutation);
    });
    
    // Debounce processing to avoid spam
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processChangeQueue, 500);
  });
  
  // Start observing the document
  domObserver.observe(document.body, {
    childList: true,        // Watch for removed elements
    attributes: true,       // Watch for attribute changes
    attributeOldValue: true,
    attributeFilter: ['style'], // ONLY watch style attributes
    subtree: true          // Watch all descendants
  });
  
  // Start smart computed style checking
  startSmartStyleTracking();
  
  // Start stylesheet monitoring for DevTools edits
  startStylesheetMonitoring();
  
  console.log('📋 DOM change detection active');
  
  // Update status in panel
  setTimeout(() => {
    updateDetectionStatus(true, 'Actively monitoring DOM changes');
  }, 100);
}

function processMutation(mutation) {
  const now = new Date();
  
  // Skip our own DOM editor elements
  if (mutation.target && mutation.target.id && mutation.target.id.startsWith('dt-')) {
    return;
  }
  
  switch (mutation.type) {
    case 'childList':
      // ONLY track removed elements (not added)
      mutation.removedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && shouldTrackElement(node)) {
          changeQueue.push({
            type: 'element_removed',
            element: getElementIdentifier(node),
            timestamp: now
          });
        }
      });
      break;
      
    case 'attributes':
      // ONLY track inline style attribute changes (often from DevTools)
      if (mutation.target) {
        if (mutation.attributeName === 'style') {
          console.log('🎨 Inline style change detected!', {
            element: getElementIdentifier(mutation.target),
            old: mutation.oldValue,
            new: mutation.target.getAttribute('style')
          });
          
          changeQueue.push({
            type: 'style_changed',
            element: getElementIdentifier(mutation.target),
            attribute: mutation.attributeName,
            oldValue: mutation.oldValue,
            newValue: mutation.target.getAttribute(mutation.attributeName),
            timestamp: now
          });
        }
        // Skip class changes - we don't track those anymore
      }
      break;
      
    case 'characterData':
      // Skip text content changes - not needed
      break;
  }
}

function processChangeQueue() {
  if (changeQueue.length === 0) return;
  
  // Group similar changes
  const groupedChanges = groupSimilarChanges(changeQueue);
  
  // Add to history
  groupedChanges.forEach(change => {
    addToHistory(change.type, formatChangeDescription(change));
  });
  
  // Send to server
  updateConnectionStatus('claude', 'processing', 'Analyzing changes...');
  sendToServer({
    type: 'dom_changes_detected',
    changes: groupedChanges,
    changeHistory: changeHistory, // Include the full history
    url: window.location.href
  });
  
  // Update Claude status after a brief delay (simulating processing)
  setTimeout(() => {
    updateConnectionStatus('claude', 'connected', 'Ready for questions');
  }, 1500);
  
  console.log(`📋 Processed ${changeQueue.length} DOM changes`);
  changeQueue = [];
}

function shouldTrackElement(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }
  
  // Filter out our own DOM editor elements - ALWAYS!
  if (element.id?.startsWith('dt-')) {
    return false;
  }
  
  // Skip if element is inside our floating panel
  if (element.closest('#dt-floating-panel')) {
    return false;
  }
  
  // Skip if element has dt- prefixed classes (our UI elements)
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ');
    if (classes.some(c => c.startsWith('dt-'))) {
      return false;
    }
  }
  
  // Track everything else
  return true;
  
  /* OLD FILTERING CODE - DISABLED
  // Skip our own DOM editor elements
  if (element.id?.startsWith('dt-')) {
    return false;
  }
  
  // Skip if element is inside our floating panel
  if (element.closest('#dt-floating-panel')) {
    return false;
  }
  
  // Skip if element has dt- prefixed classes (our UI elements)
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ');
    if (classes.some(c => c.startsWith('dt-'))) {
      return false;
    }
  }
  
  // Filter out debugging/development elements
  const debuggingPatterns = [
    'dashBreakpointsHook',
    'react-refresh',
    '__next',
    '__dev',
    '_hot',
    'webpack',
    'vite',
    'parcel'
  ];
  
  // Check ID
  if (element.id) {
    for (const pattern of debuggingPatterns) {
      if (element.id.includes(pattern)) {
        return false;
      }
    }
  }
  
  // Check classes
  if (element.className && typeof element.className === 'string') {
    for (const pattern of debuggingPatterns) {
      if (element.className.includes(pattern)) {
        return false;
      }
    }
  }
  
  // Check data attributes for common debugging markers
  if (element.hasAttribute('data-react-refresh') || 
      element.hasAttribute('data-dev') ||
      element.hasAttribute('data-debug')) {
    return false;
  }
  
  // Skip script and style tags that are likely injected by dev tools
  if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
    const src = element.getAttribute('src') || element.textContent || '';
    for (const pattern of debuggingPatterns) {
      if (src.includes(pattern)) {
        return false;
      }
    }
  }
  
  return true;
  */
}

function getElementIdentifier(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return 'unknown';
  }
  
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const className = element.className ? `.${element.className.split(' ')[0]}` : '';
  
  // Get text content (first 50 chars)
  let textContent = '';
  if (element.textContent && element.textContent.trim()) {
    textContent = element.textContent.trim().substring(0, 50);
    if (element.textContent.trim().length > 50) {
      textContent += '...';
    }
  }
  
  // Get specific attributes that help identify purpose
  const role = element.getAttribute('role');
  const ariaLabel = element.getAttribute('aria-label');
  const placeholder = element.getAttribute('placeholder');
  const title = element.getAttribute('title');
  const type = element.getAttribute('type');
  
  // Build a more descriptive identifier
  let identifier = `${tagName}${id}${className}`;
  
  // Add meaningful context
  const contextParts = [];
  
  if (textContent) {
    contextParts.push(`"${textContent}"`);
  }
  
  if (role) {
    contextParts.push(`role="${role}"`);
  }
  
  if (ariaLabel) {
    contextParts.push(`aria-label="${ariaLabel}"`);
  }
  
  if (placeholder) {
    contextParts.push(`placeholder="${placeholder}"`);
  }
  
  if (title) {
    contextParts.push(`title="${title}"`);
  }
  
  if (type && ['button', 'submit', 'text', 'email', 'password'].includes(type)) {
    contextParts.push(`type="${type}"`);
  }
  
  // Special handling for common UI elements
  if (tagName === 'button' || (tagName === 'input' && type === 'button')) {
    if (!textContent && !ariaLabel && !title) {
      contextParts.push('(button)');
    }
  }
  
  if (tagName === 'img') {
    const alt = element.getAttribute('alt');
    const src = element.getAttribute('src');
    if (alt) {
      contextParts.push(`alt="${alt}"`);
    } else if (src) {
      const filename = src.split('/').pop();
      contextParts.push(`src="${filename}"`);
    }
  }
  
  if (tagName === 'a') {
    const href = element.getAttribute('href');
    if (href && !textContent) {
      contextParts.push(`href="${href}"`);
    }
  }
  
  // Add parent context for better identification
  const parent = element.parentElement;
  if (parent && parent !== document.body) {
    const parentClass = parent.className ? parent.className.split(' ')[0] : '';
    const parentId = parent.id;
    if (parentClass || parentId) {
      contextParts.push(`in ${parent.tagName.toLowerCase()}${parentId ? '#' + parentId : ''}${parentClass ? '.' + parentClass : ''}`);
    }
  }
  
  if (contextParts.length > 0) {
    identifier += ` (${contextParts.join(', ')})`;
  }
  
  return identifier;
}

function groupSimilarChanges(changes) {
  const groups = {};
  
  changes.forEach(change => {
    const key = `${change.type}_${change.element}`;
    if (!groups[key]) {
      groups[key] = {
        type: change.type,
        element: change.element,
        count: 0,
        changes: []
      };
    }
    groups[key].count++;
    groups[key].changes.push(change);
  });
  
  return Object.values(groups);
}

function formatChangeDescription(changeGroup) {
  const { type, element, count, changes } = changeGroup;
  
  switch (type) {
    case 'element_removed':
      return count > 1 
        ? `Removed ${count} ${element} elements`
        : `Removed ${element}`;
        
    case 'style_changed':
      const styleChange = changes[0];
      const oldStyles = parseStyleString(styleChange.oldValue || '');
      const newStyles = parseStyleString(styleChange.newValue || '');
      const changedProps = getChangedStyleProperties(oldStyles, newStyles);
      
      if (changedProps.length > 0) {
        return `Changed ${changedProps.join(', ')} on ${element}`;
      } else {
        return `Styled ${element}`;
      }
      
    case 'computed_style_changed':
    case 'devtools_style_changed':
      const computedChanges = changes || [];
      const changedProperties = computedChanges.map(c => c.property);
      const significantProps = changedProperties.filter(p => 
        ['display', 'position', 'background', 'color', 'width', 'height', 'opacity'].includes(p)
      );
      
      const prefix = type === 'devtools_style_changed' ? '🛠️ DevTools' : 'CSS';
      
      if (significantProps.length > 0) {
        return `${prefix}: ${significantProps.slice(0, 3).join(', ')}${significantProps.length > 3 ? '...' : ''} on ${element}`;
      } else if (changedProperties.length > 0) {
        return `${prefix}: ${changedProperties.slice(0, 3).join(', ')}${changedProperties.length > 3 ? '...' : ''} on ${element}`;
      } else {
        return `${prefix} changed on ${element}`;
      }
      
    case 'stylesheet_changed':
      const sheetChange = changes[0];
      if (sheetChange && sheetChange.selector) {
        // Extract changed properties from CSS text
        const oldProps = parseStyleString(sheetChange.oldCss);
        const newProps = parseStyleString(sheetChange.newCss);
        const changedStyleProps = getChangedStyleProperties(oldProps, newProps);
        
        if (changedStyleProps.length > 0) {
          return `🎨 DevTools: ${changedStyleProps.slice(0, 3).join(', ')} on ${element}`;
        } else {
          return `🎨 DevTools: styles on ${element}`;
        }
      }
      return `🎨 DevTools: styles on ${element}`;
      
    default:
      return `Modified ${element}`;
  }
}

function parseStyleString(styleStr) {
  const styles = {};
  if (!styleStr) return styles;
  
  styleStr.split(';').forEach(rule => {
    const [prop, value] = rule.split(':').map(s => s.trim());
    if (prop && value) {
      styles[prop] = value;
    }
  });
  
  return styles;
}

function getChangedStyleProperties(oldStyles, newStyles) {
  const changed = [];
  const allProps = new Set([...Object.keys(oldStyles), ...Object.keys(newStyles)]);
  
  allProps.forEach(prop => {
    if (oldStyles[prop] !== newStyles[prop]) {
      changed.push(prop);
    }
  });
  
  return changed.slice(0, 3); // Limit to first 3 properties to keep descriptions short
}

// Debug function - expose for manual testing
try {
  window.debugDOMEditor = {
    showPanel: () => {
      if (floatingPanel) {
        floatingPanel.style.display = 'block';
        console.log('📋 Panel shown manually');
      } else {
        console.log('📋 Panel not available');
      }
    },
    getPanel: () => floatingPanel,
    isInitialized: () => !!floatingPanel,
    getChangeHistory: () => changeHistory || [],
    clearHistory: () => {
      if (typeof changeHistory !== 'undefined') {
        changeHistory = [];
        if (typeof updateHistoryDisplay === 'function') {
          updateHistoryDisplay();
        }
        console.log('📋 Change history cleared');
      }
    },
    testDOMChange: () => {
      try {
        // Create a test element to trigger change detection
        const testDiv = document.createElement('div');
        testDiv.id = 'test-change-' + Date.now();
        testDiv.textContent = 'Test DOM change';
        testDiv.style.background = 'yellow';
        testDiv.style.padding = '10px';
        testDiv.style.margin = '10px';
        testDiv.style.border = '2px solid red';
        
        document.body.appendChild(testDiv);
        console.log('📋 Test element added to DOM');
        
        // Remove it after 2 seconds
        setTimeout(() => {
          if (testDiv.parentNode) {
            testDiv.parentNode.removeChild(testDiv);
            console.log('📋 Test element removed from DOM');
          }
        }, 2000);
      } catch (error) {
        console.error('📋 Test DOM change failed:', error);
      }
    },
    testStyleChange: () => {
      try {
        // Find the first div on the page and change its style
        const firstDiv = document.querySelector('div:not([id^="dt-"])');
        if (firstDiv) {
          firstDiv.style.border = '3px solid blue';
          firstDiv.style.background = 'lightblue';
          console.log('📋 Test style change applied to:', firstDiv);
        } else {
          console.log('📋 No suitable div found for style testing');
        }
      } catch (error) {
        console.error('📋 Test style change failed:', error);
      }
    },
    observerStatus: () => ({
      active: !!domObserver,
      queueLength: changeQueue ? changeQueue.length : 0,
      historyLength: changeHistory ? changeHistory.length : 0,
      initialized: !!floatingPanel
    }),
    // Force initialization if needed
    forceInit: () => {
      try {
        console.log('📋 Force initializing...');
        initialize();
      } catch (error) {
        console.error('📋 Force init failed:', error);
      }
    }
  };
  console.log('📋 debugDOMEditor object created successfully');
} catch (error) {
  console.error('📋 Failed to create debugDOMEditor:', error);
}