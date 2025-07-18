/**
 * Console Stream - Streams browser console to server for debugging
 * Helps AI assistants see what's happening in the browser
 */

export class ConsoleStream {
  constructor() {
    this.ws = null;
    this.buffer = [];
    this.maxBufferSize = 100;
    this.enabled = false;
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(`ws://${window.location.host}`);
      
      this.ws.onopen = () => {
        console.info('[Console Stream] Connected to server');
        this.flushBuffer();
      };

      this.ws.onerror = (error) => {
        this.originalConsole.error('[Console Stream] WebSocket error:', error);
      };

      this.ws.onclose = () => {
        this.originalConsole.info('[Console Stream] Disconnected');
        setTimeout(() => this.connect(), 5000); // Reconnect after 5s
      };
    } catch (error) {
      this.originalConsole.error('[Console Stream] Failed to connect:', error);
    }
  }

  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    this.connect();
    
    // Intercept console methods
    ['log', 'error', 'warn', 'info'].forEach(method => {
      console[method] = (...args) => {
        // Call original method
        this.originalConsole[method](...args);
        
        // Stream to server
        this.stream(method, args);
      };
    });
    
    // Also capture unhandled errors
    window.addEventListener('error', (event) => {
      this.stream('error', [{
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      }]);
    });
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.stream('error', [{
        type: 'unhandledrejection',
        reason: event.reason,
        promise: event.promise
      }]);
    });
    
    this.originalConsole.info('[Console Stream] Enabled - streaming to server');
  }

  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    
    // Restore original console methods
    ['log', 'error', 'warn', 'info'].forEach(method => {
      console[method] = this.originalConsole[method];
    });
    
    if (this.ws) {
      this.ws.close();
    }
    
    this.originalConsole.info('[Console Stream] Disabled');
  }

  stream(level, args) {
    if (!this.enabled) return;
    
    const entry = {
      type: 'console-stream',
      level,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      // Convert args to serializable format
      message: args.map(arg => {
        try {
          if (typeof arg === 'object') {
            return JSON.stringify(arg, null, 2);
          }
          return String(arg);
        } catch (e) {
          return '[Unserializable object]';
        }
      }).join(' ')
    };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(entry));
    } else {
      // Buffer if not connected
      this.buffer.push(entry);
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer.shift();
      }
    }
  }

  flushBuffer() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.buffer.length > 0) {
      this.buffer.forEach(entry => {
        this.ws.send(JSON.stringify(entry));
      });
      this.buffer = [];
    }
  }

  // Get streaming status
  getStatus() {
    return {
      enabled: this.enabled,
      connected: this.ws && this.ws.readyState === WebSocket.OPEN,
      bufferedMessages: this.buffer.length
    };
  }
}

// Create singleton instance
export const consoleStream = new ConsoleStream();

// Auto-enable in development mode or if flag is set
if (window.location.hostname === 'localhost' || 
    localStorage.getItem('enableConsoleStream') === 'true') {
  // Wait for page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => consoleStream.enable());
  } else {
    consoleStream.enable();
  }
}