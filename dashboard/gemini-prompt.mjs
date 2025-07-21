import { LitElement, css, html } from "https://esm.sh/lit@3";

/**
 * Gemini Prompt Component
 * Provides AI-powered decision management with Google OAuth login
 */
class GeminiPrompt extends LitElement {
  static properties = {
    isAuthenticated: { type: Boolean },
    isLoading: { type: Boolean },
    userInfo: { type: Object },
    prompt: { type: String },
    response: { type: String },
    isStreaming: { type: Boolean },
    decisions: { type: Array }
  };

  constructor() {
    super();
    this.isAuthenticated = false;
    this.isLoading = false;
    this.userInfo = null;
    this.prompt = '';
    this.response = '';
    this.isStreaming = false;
    this.decisions = [];
    this.checkAuthStatus();
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      padding: 1rem;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .container {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Login Section */
    .login-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 2rem;
    }

    .login-header {
      text-align: center;
    }

    .login-header h2 {
      margin: 0 0 0.5rem;
      color: var(--text-main);
      font-size: 1.5rem;
    }

    .login-header p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .google-login-button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      background: white;
      border: 1px solid #dadce0;
      border-radius: 4px;
      font-size: 1rem;
      color: #3c4043;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .google-login-button:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      background: #f8f9fa;
    }

    .google-icon {
      width: 20px;
      height: 20px;
    }

    /* Authenticated Section */
    .prompt-section {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      background: var(--tab-bg);
      border-radius: 4px;
      font-size: 0.85rem;
    }

    .user-details {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
    }

    .logout-button {
      padding: 0.25rem 0.75rem;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 0.8rem;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .logout-button:hover {
      border-color: var(--accent);
      color: var(--accent);
    }

    .prompt-input-area {
      display: flex;
      gap: 0.5rem;
    }

    .prompt-input {
      flex: 1;
      padding: 0.75rem;
      border: 2px solid var(--border);
      border-radius: 4px;
      font-size: 1rem;
      font-family: inherit;
      background: var(--panel-bg);
      color: var(--text-main);
      resize: none;
      min-height: 80px;
      transition: border-color 0.2s ease;
    }

    .prompt-input:focus {
      outline: none;
      border-color: var(--accent);
    }

    .prompt-input::placeholder {
      color: var(--text-secondary);
      opacity: 0.7;
    }

    .send-button {
      padding: 0.75rem 1.5rem;
      background: var(--accent);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      align-self: flex-end;
    }

    .send-button:hover:not(:disabled) {
      background: var(--color-primary);
      transform: translateY(-1px);
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .response-area {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background: var(--tab-bg);
      border-radius: 4px;
      border: 1px solid var(--border);
    }

    .response-content {
      white-space: pre-wrap;
      line-height: 1.6;
      color: var(--text-main);
      font-size: 0.9rem;
    }

    .streaming-indicator {
      display: inline-block;
      margin-left: 0.5rem;
    }

    .streaming-indicator::after {
      content: '...';
      animation: streaming 1.5s infinite;
    }

    @keyframes streaming {
      0% { content: '.'; }
      33% { content: '..'; }
      66% { content: '...'; }
    }

    .suggestions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }

    .suggestion-chip {
      padding: 0.25rem 0.75rem;
      background: var(--tab-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 0.8rem;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .suggestion-chip:hover {
      border-color: var(--accent);
      color: var(--accent);
      transform: translateY(-1px);
    }

    .loading {
      text-align: center;
      color: var(--text-secondary);
      padding: 2rem;
    }
  `;

  async checkAuthStatus() {
    try {
      const response = await fetch('/api/gemini/auth/status');
      const data = await response.json();
      
      this.isAuthenticated = data.authenticated;
      this.userInfo = data.user;
    } catch (error) {
      console.error('Failed to check auth status:', error);
    }
  }

  async handleGoogleLogin() {
    this.isLoading = true;
    
    // Open Google OAuth popup
    const width = 500;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    
    const authWindow = window.open(
      '/api/gemini/auth/google',
      'google-auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    // Listen for auth completion
    const checkAuth = setInterval(async () => {
      if (authWindow.closed) {
        clearInterval(checkAuth);
        await this.checkAuthStatus();
        this.isLoading = false;
      }
    }, 1000);
  }

  async handleLogout() {
    try {
      await fetch('/api/gemini/auth/logout', { method: 'POST' });
      this.isAuthenticated = false;
      this.userInfo = null;
      this.response = '';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  async handleSendPrompt() {
    if (!this.prompt.trim() || this.isStreaming) return;
    
    this.isStreaming = true;
    this.response = '';
    
    try {
      const response = await fetch('/api/gemini/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: this.prompt,
          context: {
            decisions: this.decisions.slice(0, 10), // Send recent decisions for context
            currentView: window.location.pathname
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to get response');
      
      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (done) break;
        const value = result.value;
        
        const chunk = decoder.decode(value);
        this.response += chunk;
        this.requestUpdate();
      }
    } catch (error) {
      console.error('Prompt failed:', error);
      this.response = 'Error: Failed to get response from Gemini';
    } finally {
      this.isStreaming = false;
    }
  }

  handleSuggestionClick(suggestion) {
    this.prompt = suggestion;
    this.shadowRoot.querySelector('.prompt-input').focus();
  }

  renderLogin() {
    return html`
      <div class="login-section">
        <div class="login-header">
          <h2>🤖 Gemini AI Assistant</h2>
          <p>Sign in with Google to enable AI-powered decision management</p>
          <p>Ask questions, create decisions, and explore relationships using natural language</p>
        </div>
        
        ${this.isLoading ? html`
          <div class="loading">Authenticating...</div>
        ` : html`
          <button class="google-login-button" @click=${this.handleGoogleLogin}>
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        `}
      </div>
    `;
  }

  renderPrompt() {
    return html`
      <div class="prompt-section">
        <div class="user-info">
          <div class="user-details">
            <div class="user-avatar">${this.userInfo?.email?.[0]?.toUpperCase() || 'U'}</div>
            <span>${this.userInfo?.email || 'User'}</span>
          </div>
          <button class="logout-button" @click=${this.handleLogout}>Sign out</button>
        </div>
        
        <div class="prompt-input-area">
          <textarea
            class="prompt-input"
            placeholder="Ask Gemini about decisions, create new ones, or explore relationships..."
            .value=${this.prompt}
            @input=${(e) => this.prompt = e.target.value}
            @keydown=${(e) => e.key === 'Enter' && e.ctrlKey && this.handleSendPrompt()}
          ></textarea>
          <button 
            class="send-button" 
            @click=${this.handleSendPrompt}
            ?disabled=${!this.prompt.trim() || this.isStreaming}
          >
            ${this.isStreaming ? 'Thinking...' : 'Send'}
          </button>
        </div>
        
        <div class="suggestions">
          <div class="suggestion-chip" @click=${() => this.handleSuggestionClick("What decisions are related to authentication?")}>
            Related to authentication
          </div>
          <div class="suggestion-chip" @click=${() => this.handleSuggestionClick("Create a new decision for implementing user notifications")}>
            Create decision
          </div>
          <div class="suggestion-chip" @click=${() => this.handleSuggestionClick("Show me recent UI/UX decisions")}>
            Recent UI/UX
          </div>
          <div class="suggestion-chip" @click=${() => this.handleSuggestionClick("What are the pending tasks?")}>
            Pending tasks
          </div>
        </div>
        
        <div class="response-area">
          <div class="response-content">
            ${this.response || 'Ask me anything about your decisions...'}
            ${this.isStreaming ? html`<span class="streaming-indicator"></span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="container">
        ${this.isAuthenticated ? this.renderPrompt() : this.renderLogin()}
      </div>
    `;
  }
}

customElements.define('gemini-prompt', GeminiPrompt);