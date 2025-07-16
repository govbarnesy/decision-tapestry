/**
 * DevTools Integration for Decision Tapestry DOM Editor
 * Listens to element selection in the DevTools Elements panel
 */

console.log('📋 DevTools extension loaded');

// Check if chrome.devtools is available
if (!chrome.devtools) {
  console.error('📋 chrome.devtools not available');
} else {
  console.log('📋 chrome.devtools available, creating panel...');
}

// Create a devtools panel
chrome.devtools.panels.create(
  'Decision Tapestry',
  null, // No icon for now
  'panel.html',
  function(panel) {
    console.log('📋 Decision Tapestry DevTools panel created');
    
    // Listen for when the panel is shown
    panel.onShown.addListener(function(panelWindow) {
      console.log('📋 Decision Tapestry panel shown');
      setupElementSelectionListener(panelWindow);
    });
    
    panel.onHidden.addListener(function() {
      console.log('📋 Decision Tapestry panel hidden');
    });
  }
);

// Set up the element selection listener
function setupElementSelectionListener(panelWindow) {
  console.log('📋 Setting up DevTools element selection listeners');
  
  // Function to handle element selection
  function handleElementSelection() {
    console.log('📋 Element selection changed in DevTools');
    
    // Get the currently selected element
    chrome.devtools.inspectedWindow.eval(
      `
      (function() {
        // Get the currently inspected element
        const element = $0; // $0 is the currently selected element in DevTools
        
        if (!element) {
          return null;
        }
        
        // Generate element information
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        // Generate CSS selector
        function generateSelector(el) {
          const path = [];
          let current = el;
          
          while (current && current.nodeType === Node.ELEMENT_NODE) {
            let selector = current.tagName.toLowerCase();
            
            if (current.id) {
              selector = '#' + current.id;
              path.unshift(selector);
              break;
            } else if (current.className) {
              const classes = current.className.split(' ').filter(c => c.trim());
              if (classes.length > 0) {
                selector += '.' + classes.join('.');
              }
            }
            
            // Add nth-child if needed for uniqueness
            const parent = current.parentElement;
            if (parent) {
              const siblings = Array.from(parent.children).filter(child => 
                child.tagName === current.tagName
              );
              if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                selector += ':nth-child(' + index + ')';
              }
            }
            
            path.unshift(selector);
            current = current.parentElement;
          }
          
          return path.join(' > ');
        }
        
        return {
          tagName: element.tagName.toLowerCase(),
          id: element.id || '',
          className: element.className || '',
          selector: generateSelector(element),
          position: {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
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
            height: computedStyle.height,
            zIndex: computedStyle.zIndex,
            opacity: computedStyle.opacity,
            transform: computedStyle.transform
          },
          text: element.textContent ? element.textContent.substring(0, 100) : '',
          attributes: Array.from(element.attributes).reduce((attrs, attr) => {
            attrs[attr.name] = attr.value;
            return attrs;
          }, {}),
          innerHTML: element.innerHTML.substring(0, 200),
          outerHTML: element.outerHTML.substring(0, 300)
        };
      })();
      `,
      function(result, isException) {
        if (isException) {
          console.error('📋 Error getting element info:', isException);
          return;
        }
        
        if (result) {
          console.log('📋 Selected element from DevTools:', result);
          
          // Send the selection to the content script
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
              console.log('📋 Sending message to tab:', tabs[0].id);
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'devtools_element_selected',
                element: result
              }, function(response) {
                console.log('📋 Message response:', response);
                if (chrome.runtime.lastError) {
                  console.error('📋 Message error:', chrome.runtime.lastError);
                }
              });
            } else {
              console.error('📋 No active tab found');
            }
          });
        } else {
          console.warn('📋 No element result from DevTools eval');
        }
      }
    );
  }
  
  // Listen for element selection changes in the Elements panel (clicking in tree)
  chrome.devtools.panels.elements.onSelectionChanged.addListener(handleElementSelection);
  
  // Also set up a periodic check to catch selector tool usage
  let lastSelectedElement = null;
  let lastSelectedSelector = null;
  
  function checkForSelectorToolUsage() {
    chrome.devtools.inspectedWindow.eval(
      `
      (function() {
        const element = $0;
        if (!element) return null;
        
        // Generate a quick identifier for the element
        const selector = element.id ? '#' + element.id : 
          element.className ? element.tagName.toLowerCase() + '.' + element.className.split(' ').filter(c => c.trim())[0] :
          element.tagName.toLowerCase();
        
        return {
          selector: selector,
          tagName: element.tagName,
          id: element.id,
          className: element.className,
          timestamp: Date.now()
        };
      })();
      `,
      function(result, isException) {
        if (!isException && result && result.selector !== lastSelectedSelector) {
          lastSelectedSelector = result.selector;
          // Trigger full element selection handling
          setTimeout(handleElementSelection, 100);
        }
      }
    );
  }
  
  // Check for selector tool usage every 500ms
  setInterval(checkForSelectorToolUsage, 500);
  
  // Additional method: Monitor for DevTools inspect mode
  let isInspectModeActive = false;
  
  // Detect when inspect mode is activated/deactivated
  function monitorInspectMode() {
    chrome.devtools.inspectedWindow.eval(
      `
      (function() {
        // Check if DevTools is in inspect mode by looking for the inspector overlay
        const inspectorOverlay = document.querySelector('[class*="inspector-overlay"]') || 
                                 document.querySelector('[class*="highlight"]') ||
                                 document.querySelector('[id*="inspector"]');
        
        return {
          hasOverlay: !!inspectorOverlay,
          bodyClasses: document.body.className,
          timestamp: Date.now()
        };
      })();
      `,
      function(result, isException) {
        if (!isException && result) {
          // If we detect inspect mode activity, increase checking frequency
          if (result.hasOverlay && !isInspectModeActive) {
            isInspectModeActive = true;
            console.log('📋 DevTools inspect mode detected - increasing check frequency');
            
            // Start more frequent checking during inspect mode
            const fastCheck = setInterval(() => {
              checkForSelectorToolUsage();
              
              // Check if inspect mode is still active
              if (!isInspectModeActive) {
                clearInterval(fastCheck);
              }
            }, 100);
            
            // Reset inspect mode flag after a delay
            setTimeout(() => {
              isInspectModeActive = false;
            }, 5000);
          }
        }
      }
    );
  }
  
  // Monitor inspect mode every 1 second
  setInterval(monitorInspectMode, 1000);
  
  console.log('📋 DevTools element selection listeners configured with selector tool detection');
}