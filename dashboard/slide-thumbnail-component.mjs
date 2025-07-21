/**
 * Slide Thumbnail Component
 * Renders AI Canvas slides with proper visibility
 */

import { LitElement, css, html } from "https://esm.sh/lit@3";

export class SlideThumbnail extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
    }

    .thumbnail-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      background: var(--background-secondary);
      border-radius: 8px 8px 0 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :host([dark-mode]) .thumbnail-container {
      background: var(--background-secondary);
    }

    .thumbnail-frame {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .thumbnail-iframe {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 1200px;
      height: 800px;
      transform: translate(-50%, -50%) scale(0.16);
      transform-origin: center center;
      border: none;
      pointer-events: none;
      background: var(--panel-bg);
      border-radius: 4px;
    }

    .thumbnail-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: var(--text-inverse);
      font-size: 1.2em;
      font-weight: 600;
      text-align: center;
      padding: 20px;
      opacity: 1;
      transition: opacity 0.3s ease;
    }

    :host([dark-mode]) .thumbnail-placeholder {
      background: linear-gradient(135deg, #434190 0%, #5a3780 100%);
    }

    .thumbnail-placeholder.loaded {
      opacity: 0;
      pointer-events: none;
    }

    .thumbnail-error {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-error-light, #fee);
      color: var(--color-error);
      font-size: 0.9em;
      padding: 10px;
      text-align: center;
    }

    :host([dark-mode]) .thumbnail-error {
      background: var(--color-error-dark, #3a1f1f);
      color: var(--color-error);
    }

    .thumbnail-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
    }

    .spinner {
      width: 100%;
      height: 100%;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: var(--text-inverse);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Zoom on hover for better preview */
    :host(:hover) .thumbnail-iframe {
      transform: translate(-50%, -50%) scale(0.18);
      transition: transform 0.3s ease;
    }
  `;

  static properties = {
    src: { type: String },
    title: { type: String },
    darkMode: { type: Boolean, attribute: 'dark-mode', reflect: true },
    loaded: { type: Boolean },
    error: { type: Boolean }
  };

  constructor() {
    super();
    this.src = '';
    this.title = 'AI Canvas';
    this.darkMode = false;
    this.loaded = false;
    this.error = false;
  }

  connectedCallback() {
    super.connectedCallback();
    // Check for dark mode
    this.darkMode = document.body.classList.contains('dark-theme');
    
    // Listen for theme changes
    this.themeObserver = new MutationObserver(() => {
      this.darkMode = document.body.classList.contains('dark-theme');
    });
    this.themeObserver.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
  }

  render() {
    return html`
      <div class="thumbnail-container">
        <div class="thumbnail-frame">
          ${this.error ? this.renderError() : this.renderIframe()}
        </div>
        ${!this.loaded && !this.error ? this.renderPlaceholder() : ''}
      </div>
    `;
  }

  renderIframe() {
    return html`
      <iframe
        class="thumbnail-iframe"
        src=${this.src}
        sandbox="allow-same-origin allow-scripts"
        loading="lazy"
        @load=${this.handleLoad}
        @error=${this.handleError}
        title=${this.title}
      ></iframe>
    `;
  }

  renderPlaceholder() {
    return html`
      <div class="thumbnail-placeholder ${this.loaded ? 'loaded' : ''}">
        <div>${this.title}</div>
        <div class="thumbnail-loading">
          <div class="spinner"></div>
        </div>
      </div>
    `;
  }

  renderError() {
    return html`
      <div class="thumbnail-error">
        <div>
          <div>Failed to load</div>
          <div style="font-size: 0.8em; opacity: 0.8; margin-top: 4px;">
            ${this.title}
          </div>
        </div>
      </div>
    `;
  }

  handleLoad() {
    this.loaded = true;
    this.error = false;
    
    // Try to adjust iframe content for better visibility
    const iframe = this.shadowRoot.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      try {
        // Inject styles to ensure content is visible
        const style = iframe.contentDocument.createElement('style');
        style.textContent = `
          body {
            margin: 0;
            padding: 20px;
            transform-origin: top left;
            background: var(--panel-bg) !important;
          }
          * {
            max-width: 100% !important;
          }
        `;
        iframe.contentDocument.head.appendChild(style);
      } catch (e) {
        // Cross-origin restriction, that's okay
      }
    }
  }

  handleError() {
    this.error = true;
    this.loaded = false;
  }
}

customElements.define('slide-thumbnail', SlideThumbnail);