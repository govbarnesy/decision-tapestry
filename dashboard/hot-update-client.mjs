/**
 * Hot DOM Update Client
 * Listens for hot updates from the server and applies them without page reload
 */

class HotUpdateClient {
  constructor() {
    this.ws = null;
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket('ws://localhost:8080');
      
      this.ws.onopen = () => {
        console.log('🔥 Hot Update Client connected');
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleHotUpdate(message);
      };

      this.ws.onclose = () => {
        console.log('🔥 Hot Update Client disconnected, reconnecting...');
        setTimeout(() => this.connect(), 2000);
      };

      this.ws.onerror = (error) => {
        console.error('🔥 Hot Update Client error:', error);
      };
    } catch (error) {
      console.error('🔥 Failed to connect Hot Update Client:', error);
    }
  }

  handleHotUpdate(message) {
    if (message.type === 'hot_dom_update') {
      console.log(`🔥 Applying hot update: ${message.updateType} for ${message.selector}`);
      console.log(`   Reason: ${message.reason}`);
      
      switch (message.updateType) {
        case 'style_update':
          this.applyStyleUpdate(message.selector, message.styles);
          break;
        case 'remove_element':
          this.removeElement(message.selector);
          break;
        case 'add_element':
          this.addElement(message.selector, message.html);
          break;
        case 'update_content':
          this.updateContent(message.selector, message.content);
          break;
        default:
          console.warn('🔥 Unknown hot update type:', message.updateType);
      }
    }
  }

  applyStyleUpdate(selector, styles) {
    try {
      const elements = document.querySelectorAll(selector);
      
      if (elements.length === 0) {
        console.warn(`🔥 No elements found for selector: ${selector}`);
        return;
      }

      elements.forEach(element => {
        Object.entries(styles).forEach(([property, value]) => {
          // Convert kebab-case to camelCase for JavaScript
          const camelProperty = property.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
          element.style[camelProperty] = value;
        });
      });

      console.log(`🔥 ✅ Applied styles to ${elements.length} element(s):`, selector);
      
      // Add a subtle visual indicator that an update occurred
      elements.forEach(element => {
        element.style.transition = 'all 0.3s ease';
        element.classList.add('hot-updated');
        setTimeout(() => {
          element.classList.remove('hot-updated');
        }, 1000);
      });
      
    } catch (error) {
      console.error('🔥 Error applying style update:', error);
    }
  }

  removeElement(selector) {
    try {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        // Add fade-out animation
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0';
        
        setTimeout(() => {
          element.remove();
          console.log(`🔥 ✅ Removed element: ${selector}`);
        }, 300);
      });
      
    } catch (error) {
      console.error('🔥 Error removing element:', error);
    }
  }

  addElement(selector, html) {
    try {
      const container = document.querySelector(selector);
      if (!container) {
        console.warn(`🔥 Container not found for selector: ${selector}`);
        return;
      }

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const newElement = tempDiv.firstElementChild;
      
      // Add fade-in animation
      newElement.style.opacity = '0';
      newElement.style.transition = 'opacity 0.3s ease';
      
      container.appendChild(newElement);
      
      setTimeout(() => {
        newElement.style.opacity = '1';
        console.log(`🔥 ✅ Added element to: ${selector}`);
      }, 10);
      
    } catch (error) {
      console.error('🔥 Error adding element:', error);
    }
  }

  updateContent(selector, content) {
    try {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        // Add update animation
        element.style.transition = 'all 0.3s ease';
        element.style.transform = 'scale(0.95)';
        element.style.opacity = '0.5';
        
        setTimeout(() => {
          element.innerHTML = content;
          element.style.transform = 'scale(1)';
          element.style.opacity = '1';
          console.log(`🔥 ✅ Updated content: ${selector}`);
          
          // Add visual feedback
          element.classList.add('hot-updated');
          setTimeout(() => {
            element.classList.remove('hot-updated');
          }, 1000);
        }, 150);
      });
      
    } catch (error) {
      console.error('🔥 Error updating content:', error);
    }
  }
}

// Add CSS for hot update visual feedback
const style = document.createElement('style');
style.textContent = `
  .hot-updated {
    box-shadow: 0 0 10px rgba(0, 102, 255, 0.5) !important;
    transform: scale(1.02) !important;
  }
  
  .hot-updated::after {
    content: "🔥";
    position: absolute;
    top: -10px;
    right: -10px;
    background: #ff4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    z-index: 999999;
    animation: hotUpdatePulse 1s ease-in-out;
  }
  
  @keyframes hotUpdatePulse {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize the hot update client
const hotUpdateClient = new HotUpdateClient();

// Export for use in other modules
export default hotUpdateClient;