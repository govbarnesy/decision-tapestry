/**
 * DOM Editor Extension Popup Script
 */

// DOM elements
let elements = {};
let currentElement = null;
let isConnected = false;

// Initialize popup
document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
  // Get DOM elements
  elements = {
    connectionStatus: document.getElementById('connectionStatus'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    selectBtn: document.getElementById('selectBtn'),
    elementInfo: document.getElementById('elementInfo'),
    elementPreview: document.getElementById('elementPreview'),
    tagName: document.getElementById('tagName'),
    elementId: document.getElementById('elementId'),
    className: document.getElementById('className'),
    selector: document.getElementById('selector'),
    styleEditor: document.getElementById('styleEditor'),
    styleInputs: document.querySelectorAll('.style-input'),
    exportBtn: document.getElementById('exportBtn'),
    undoBtn: document.getElementById('undoBtn'),
    removeBtn: document.getElementById('removeBtn'),
    exportSection: document.getElementById('exportSection'),
    exportOutput: document.getElementById('exportOutput'),
    copyBtn: document.getElementById('copyBtn')
  };

  // Set up event listeners
  setupEventListeners();
  
  // Check connection status
  checkConnectionStatus();
  
  // Load any existing selected element
  loadSelectedElement();
}

function setupEventListeners() {
  // Selection button
  elements.selectBtn.addEventListener('click', toggleSelection);
  
  // Style inputs
  elements.styleInputs.forEach(input => {
    input.addEventListener('input', handleStyleChange);
    input.addEventListener('change', handleStyleChange);
  });
  
  // Action buttons
  elements.exportBtn.addEventListener('click', exportCSS);
  elements.undoBtn.addEventListener('click', undoChanges);
  elements.removeBtn.addEventListener('click', removeElement);
  elements.copyBtn.addEventListener('click', copyToClipboard);
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleMessage);
}

function checkConnectionStatus() {
  // Check if content script is active
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          updateConnectionStatus('disconnected');
        } else {
          updateConnectionStatus('connected');
        }
      });
    }
  });
}

function updateConnectionStatus(status) {
  isConnected = status === 'connected';
  
  elements.statusIndicator.className = `status-indicator ${status}`;
  
  switch (status) {
    case 'connected':
      elements.statusText.textContent = 'Connected';
      break;
    case 'connecting':
      elements.statusText.textContent = 'Connecting...';
      break;
    case 'disconnected':
      elements.statusText.textContent = 'Disconnected';
      break;
  }
  
  // Update UI based on connection status
  elements.selectBtn.disabled = !isConnected;
  if (!isConnected) {
    elements.selectBtn.textContent = 'Not Connected';
  } else {
    elements.selectBtn.textContent = 'Start Selection';
  }
}

function toggleSelection() {
  if (!isConnected) return;
  
  const isSelecting = elements.selectBtn.textContent === 'Stop Selection';
  
  if (isSelecting) {
    stopSelection();
  } else {
    startSelection();
  }
}

function startSelection() {
  elements.selectBtn.textContent = 'Stop Selection';
  elements.selectBtn.classList.add('btn-warning');
  elements.selectBtn.classList.remove('btn-primary');
  
  // Send message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'startSelection' });
    }
  });
}

function stopSelection() {
  elements.selectBtn.textContent = 'Start Selection';
  elements.selectBtn.classList.add('btn-primary');
  elements.selectBtn.classList.remove('btn-warning');
  
  // Send message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'stopSelection' });
    }
  });
}

function loadSelectedElement() {
  // Get current selection from background script
  chrome.runtime.sendMessage({ action: 'getSelectedElement' }, (response) => {
    if (response && response.element) {
      displayElement(response.element);
    }
  });
}

function displayElement(element) {
  currentElement = element;
  
  // Show element info
  elements.elementInfo.style.display = 'block';
  elements.styleEditor.style.display = 'block';
  
  // Update element details
  elements.tagName.textContent = element.tagName;
  elements.elementId.textContent = element.id || '(none)';
  elements.className.textContent = element.className || '(none)';
  elements.selector.textContent = element.selector;
  
  // Update element preview
  elements.elementPreview.innerHTML = `
    <div style="font-size: 11px; color: #666;">
      <strong>${element.tagName}</strong>${element.id ? `#${element.id}` : ''}${element.className ? `.${element.className.split(' ').join('.')}` : ''}
      <br>
      <span style="color: #999;">${element.text.substring(0, 50)}${element.text.length > 50 ? '...' : ''}</span>
    </div>
  `;
  
  // Load current styles into inputs
  if (element.styles) {
    elements.styleInputs.forEach(input => {
      const property = input.dataset.property;
      if (element.styles[property]) {
        input.value = element.styles[property];
      }
    });
  }
  
  // Add fade-in animation
  elements.elementInfo.classList.add('fade-in');
  elements.styleEditor.classList.add('fade-in');
}

function handleStyleChange(event) {
  if (!currentElement) return;
  
  const input = event.target;
  const property = input.dataset.property;
  const value = input.value;
  
  // Apply style immediately
  const styles = { [property]: value };
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateStyles',
        styles: styles
      });
    }
  });
}

function exportCSS() {
  if (!currentElement) return;
  
  // Generate CSS from current style inputs
  const css = generateCSS();
  
  // Show export section
  elements.exportSection.style.display = 'block';
  elements.exportOutput.value = css;
  
  // Add fade-in animation
  elements.exportSection.classList.add('fade-in');
  
  // Scroll to export section
  elements.exportSection.scrollIntoView({ behavior: 'smooth' });
}

function generateCSS() {
  if (!currentElement) return '';
  
  let css = `/* Generated CSS for ${currentElement.selector} */\n`;
  css += `${currentElement.selector} {\n`;
  
  elements.styleInputs.forEach(input => {
    const property = input.dataset.property;
    const value = input.value.trim();
    
    if (value) {
      // Convert camelCase to kebab-case
      const kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      css += `  ${kebabProperty}: ${value};\n`;
    }
  });
  
  css += '}\n';
  
  return css;
}

function undoChanges() {
  if (!currentElement) return;
  
  // Send undo message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'undoChanges' });
    }
  });
  
  // Clear style inputs
  elements.styleInputs.forEach(input => {
    input.value = '';
  });
  
  // Hide export section
  elements.exportSection.style.display = 'none';
  
  showMessage('Changes undone', 'success');
}

function removeElement() {
  if (!currentElement) return;
  
  // Confirm removal
  if (!confirm(`Remove element "${currentElement.selector}"?`)) {
    return;
  }
  
  // Send remove message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'removeElement' });
    }
  });
  
  // Clear current element
  currentElement = null;
  elements.elementInfo.style.display = 'none';
  elements.styleEditor.style.display = 'none';
  elements.exportSection.style.display = 'none';
  
  showMessage('Element removed', 'warning');
}

function copyToClipboard() {
  elements.exportOutput.select();
  document.execCommand('copy');
  showMessage('CSS copied to clipboard', 'success');
}

function showMessage(text, type = 'info') {
  // Remove existing messages
  document.querySelectorAll('.message').forEach(msg => msg.remove());
  
  // Create message element
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;
  
  // Insert at top of main content
  elements.elementInfo.parentNode.insertBefore(message, elements.elementInfo);
  
  // Remove after 3 seconds
  setTimeout(() => {
    message.remove();
  }, 3000);
}

function handleMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'elementUpdated':
      displayElement(request.element);
      break;
    case 'connectionStatusChanged':
      updateConnectionStatus(request.status);
      break;
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'e':
        event.preventDefault();
        exportCSS();
        break;
      case 'z':
        event.preventDefault();
        undoChanges();
        break;
      case 'c':
        if (elements.exportOutput === document.activeElement) {
          // Let default copy behavior work
          return;
        }
        event.preventDefault();
        copyToClipboard();
        break;
    }
  }
  
  if (event.key === 'Escape') {
    if (elements.selectBtn.textContent === 'Stop Selection') {
      stopSelection();
    }
  }
});

// Auto-refresh connection status
setInterval(checkConnectionStatus, 5000);