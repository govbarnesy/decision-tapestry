/**
 * Error Monitor - Lightweight error detection for Decision Tapestry
 * Only reports significant errors that need attention
 */

export class ErrorMonitor {
  constructor() {
    this.errorPatterns = {
      // Critical errors that need immediate attention
      critical: [
        /Failed to load resource.*\/api\//,  // API endpoint failures
        /WebSocket.*failed/i,
        /TypeError.*null.*undefined/,
        /Failed to save visual/,
        /CORS/,
        /500.*Internal Server Error/,  // Server errors
        /POST.*\/api\/.*500/  // API POST failures
      ],
      // Known issues we can ignore
      ignore: [
        /content-script\.js/,  // Browser extension noise
        /DevTools/,            // DevTools messages
        /🔍 Checked/,         // Extension status messages
      ]
    };
    
    this.recentErrors = [];
    this.maxErrors = 10;
    this.errorCallback = null;
  }

  init(callback) {
    this.errorCallback = callback;
    
    // Monitor console errors
    const originalError = console.error;
    console.error = (...args) => {
      originalError(...args);
      this.checkError('console', args.join(' '));
    };
    
    // Monitor global errors
    window.addEventListener('error', (event) => {
      this.checkError('global', `${event.message} at ${event.filename}:${event.lineno}`);
    });
    
    // Monitor promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.checkError('promise', event.reason?.toString() || 'Unhandled promise rejection');
    });
    
    // Monitor network errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && args[0].includes('/api/')) {
          this.checkError('network', `API ${args[0]} returned ${response.status}`);
        }
        return response;
      } catch (error) {
        this.checkError('network', `Fetch failed: ${args[0]}`);
        throw error;
      }
    };
  }

  checkError(source, message) {
    // Skip if it matches ignore patterns
    if (this.errorPatterns.ignore.some(pattern => pattern.test(message))) {
      return;
    }
    
    // Check if it's a critical error
    const isCritical = this.errorPatterns.critical.some(pattern => pattern.test(message));
    
    if (isCritical) {
      const error = {
        source,
        message,
        timestamp: new Date().toISOString(),
        critical: true
      };
      
      this.recentErrors.push(error);
      if (this.recentErrors.length > this.maxErrors) {
        this.recentErrors.shift();
      }
      
      // Alert about critical error
      if (this.errorCallback) {
        this.errorCallback(error);
      }
      
      // Show in-page notification
      this.showErrorNotification(error);
    }
  }

  showErrorNotification(error) {
    // Create or update error badge
    let badge = document.getElementById('error-monitor-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'error-monitor-badge';
      badge.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      `;
      badge.onclick = () => this.showErrorDetails();
      document.body.appendChild(badge);
    }
    
    badge.textContent = `⚠️ ${this.recentErrors.length} Error${this.recentErrors.length > 1 ? 's' : ''}`;
    badge.style.display = 'block';
    
    // Auto-hide after 10 seconds if no new errors
    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => {
      badge.style.display = 'none';
    }, 10000);
  }

  showErrorDetails() {
    const errors = this.recentErrors.map(e => 
      `[${e.source}] ${e.message}`
    ).join('\\n\\n');
    
    alert(`Recent Critical Errors:\\n\\n${errors}`);
  }

  getStatus() {
    return {
      monitoring: true,
      recentErrors: this.recentErrors,
      criticalCount: this.recentErrors.filter(e => e.critical).length
    };
  }
}

// Create and auto-initialize
export const errorMonitor = new ErrorMonitor();

// Only activate on localhost
if (window.location.hostname === 'localhost') {
  errorMonitor.init((error) => {
    console.warn('[Error Monitor] Critical error detected:', error);
  });
}