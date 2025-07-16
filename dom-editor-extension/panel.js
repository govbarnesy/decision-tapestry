/**
 * DevTools Panel Script
 * Handles the UI for the Decision Tapestry DevTools panel
 */

console.log('📋 DevTools panel script loaded');

// Listen for messages from the devtools script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📋 Panel received message:', message);
  
  if (message.action === 'element_selected_from_devtools') {
    displaySelectedElement(message.element);
  }
});

// Display selected element information
function displaySelectedElement(elementInfo) {
  console.log('📋 Displaying element info:', elementInfo);
  
  const selectedElementDiv = document.getElementById('selectedElement');
  const elementTag = document.getElementById('elementTag');
  const elementId = document.getElementById('elementId');
  const elementClasses = document.getElementById('elementClasses');
  const elementSelector = document.getElementById('elementSelector');
  const elementPosition = document.getElementById('elementPosition');
  const elementText = document.getElementById('elementText');
  
  // Update element details
  elementTag.textContent = elementInfo.tagName;
  elementId.textContent = elementInfo.id || '(none)';
  elementClasses.textContent = elementInfo.className || '(none)';
  elementSelector.textContent = elementInfo.selector;
  elementPosition.textContent = `${Math.round(elementInfo.position.left)}, ${Math.round(elementInfo.position.top)} (${Math.round(elementInfo.position.width)}×${Math.round(elementInfo.position.height)})`;
  elementText.textContent = elementInfo.text ? elementInfo.text.substring(0, 50) + (elementInfo.text.length > 50 ? '...' : '') : '(no text)';
  
  // Show the selected element section
  selectedElementDiv.classList.add('visible');
  
  // Add a subtle animation
  selectedElementDiv.style.transform = 'scale(0.95)';
  selectedElementDiv.style.opacity = '0.5';
  
  setTimeout(() => {
    selectedElementDiv.style.transition = 'all 0.2s ease';
    selectedElementDiv.style.transform = 'scale(1)';
    selectedElementDiv.style.opacity = '1';
  }, 10);
  
  setTimeout(() => {
    selectedElementDiv.style.transition = '';
  }, 220);
}

// Initialize panel
document.addEventListener('DOMContentLoaded', () => {
  console.log('📋 DevTools panel initialized');
});