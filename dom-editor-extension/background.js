/**
 * Background Service Worker for DOM Editor Extension
 * Handles communication between content script and popup
 */

// Store selected element data
let selectedElementData = null;
let domEditorConnections = new Map();

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'elementSelected':
      // Store the selected element data
      selectedElementData = request.element;
      
      // Notify all popup windows
      chrome.runtime.sendMessage({
        action: 'elementUpdated',
        element: request.element
      }).catch(() => {
        // Ignore errors if popup is not open
      });
      
      sendResponse({ success: true });
      break;
      
    case 'getSelectedElement':
      sendResponse({ element: selectedElementData });
      break;
      
    case 'clearSelection':
      selectedElementData = null;
      sendResponse({ success: true });
      break;
      
    case 'forwardToContent':
      // Forward message to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, request.message, (response) => {
            sendResponse(response);
          });
        }
      });
      return true; // Will respond asynchronously
      
    default:
      console.warn('Unknown action:', request.action);
  }
  
  return true; // Keep message channel open for async responses
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Send message to content script to toggle panel
  chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' }, (response) => {
    if (chrome.runtime.lastError) {
      // Content script not injected yet, inject it
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js']
      }).then(() => {
        // Try again after injection
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
        }, 100);
      }).catch(() => {
        console.error('Failed to inject content script');
      });
    }
  });
});

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('DOM Editor Extension installed');
});

// Handle connection from Decision Tapestry server
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'dom-editor') {
    console.log('Decision Tapestry server connected');
    
    port.onMessage.addListener((message) => {
      console.log('Received from server:', message);
      
      // Forward server messages to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'serverMessage',
            data: message
          });
        }
      });
    });
    
    port.onDisconnect.addListener(() => {
      console.log('Decision Tapestry server disconnected');
    });
  }
});

// Clean up on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (domEditorConnections.has(tabId)) {
    domEditorConnections.delete(tabId);
  }
});

// Clean up on tab navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    // Clear selection when navigating to new page
    selectedElementData = null;
  }
});