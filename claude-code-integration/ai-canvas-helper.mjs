/**
 * AI Canvas Helper - Quick methods for AI tools to create visual content
 * 
 * This provides simple functions for AI to communicate visually through the canvas
 */

import fetch from 'node-fetch';

const CANVAS_API_URL = 'http://localhost:8080/api/canvas/show';

/**
 * Show code with syntax highlighting
 */
export async function showCode(code, language = 'javascript') {
  return sendToCanvas('code', code, { language });
}

/**
 * Show a simple diagram using HTML/SVG
 */
export async function showDiagram(svgContent, title = '') {
  return sendToCanvas('diagram', svgContent, { title });
}

/**
 * Show a wireframe mockup
 */
export async function showWireframe(htmlContent) {
  return sendToCanvas('wireframe', htmlContent);
}

/**
 * Show a before/after comparison
 */
export async function showComparison(before, after, options = {}) {
  return sendToCanvas('comparison', { before, after }, options);
}

/**
 * Show progress through steps
 */
export async function showProgress(steps, currentStep) {
  return sendToCanvas('progress', { steps, current: currentStep });
}

/**
 * Show data visualization
 */
export async function showData(data, visualizationType = 'json') {
  return sendToCanvas('data', data, { visualization: visualizationType });
}

/**
 * Show raw HTML content
 */
export async function showHTML(htmlContent) {
  return sendToCanvas('html', htmlContent);
}

/**
 * Generic send function
 */
async function sendToCanvas(type, content, options = {}) {
  try {
    const response = await fetch(CANVAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, content, options }),
    });

    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send to canvas:', error);
    throw error;
  }
}

// Quick diagram builders
export const diagrams = {
  /**
   * Create a simple flowchart
   */
  flowchart(nodes, connections) {
    const svg = `
      <svg width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
           refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
          </marker>
        </defs>
        ${nodes.map(node => `
          <rect x="${node.x}" y="${node.y}" width="120" height="40" 
                rx="5" fill="#e3f2fd" stroke="#2196f3" stroke-width="2"/>
          <text x="${node.x + 60}" y="${node.y + 25}" 
                text-anchor="middle" font-family="Arial" font-size="14">
            ${node.label}
          </text>
        `).join('')}
        ${connections.map(conn => `
          <line x1="${conn.x1}" y1="${conn.y1}" 
                x2="${conn.x2}" y2="${conn.y2}" 
                stroke="#333" stroke-width="2" 
                marker-end="url(#arrowhead)"/>
        `).join('')}
      </svg>
    `;
    return showDiagram(svg);
  },

  /**
   * Create a simple architecture diagram
   */
  architecture(components) {
    const svg = `
      <svg width="800" height="600" viewBox="0 0 800 600">
        ${components.map(comp => `
          <g>
            <rect x="${comp.x}" y="${comp.y}" width="${comp.width || 150}" height="${comp.height || 80}" 
                  rx="8" fill="${comp.color || '#f0f0f0'}" stroke="${comp.stroke || '#999'}" stroke-width="2"/>
            <text x="${comp.x + (comp.width || 150) / 2}" y="${comp.y + (comp.height || 80) / 2}" 
                  text-anchor="middle" dominant-baseline="middle" 
                  font-family="Arial" font-size="16" font-weight="bold">
              ${comp.name}
            </text>
            ${comp.subtitle ? `
              <text x="${comp.x + (comp.width || 150) / 2}" y="${comp.y + (comp.height || 80) / 2 + 20}" 
                    text-anchor="middle" dominant-baseline="middle" 
                    font-family="Arial" font-size="12" fill="#666">
                ${comp.subtitle}
              </text>
            ` : ''}
          </g>
        `).join('')}
      </svg>
    `;
    return showDiagram(svg);
  }
};

// Quick wireframe builders
export const wireframes = {
  /**
   * Create a login form wireframe
   */
  loginForm() {
    const html = `
      <div style="max-width: 400px; margin: 0 auto; padding: 20px; font-family: Arial;">
        <h2 style="text-align: center; color: #333;">Login</h2>
        <div style="margin: 20px 0;">
          <div style="background: #f0f0f0; height: 40px; border-radius: 4px; margin-bottom: 15px; padding: 10px; color: #999;">
            Email address
          </div>
          <div style="background: #f0f0f0; height: 40px; border-radius: 4px; margin-bottom: 20px; padding: 10px; color: #999;">
            Password
          </div>
          <div style="background: #2196f3; color: white; height: 40px; border-radius: 4px; text-align: center; line-height: 40px; cursor: pointer;">
            Sign In
          </div>
          <div style="text-align: center; margin-top: 15px; color: #666; font-size: 14px;">
            <a style="color: #2196f3;">Forgot password?</a>
          </div>
        </div>
      </div>
    `;
    return showWireframe(html);
  },

  /**
   * Create a dashboard wireframe
   */
  dashboard(sections = ['Header', 'Sidebar', 'Main Content', 'Footer']) {
    const html = `
      <div style="display: grid; grid-template-areas: 'header header' 'sidebar main' 'footer footer'; 
                  grid-template-columns: 200px 1fr; grid-template-rows: 60px 1fr 40px; 
                  height: 500px; gap: 10px; font-family: Arial;">
        <div style="grid-area: header; background: #f0f0f0; padding: 20px; text-align: center; border: 2px dashed #999;">
          ${sections[0]}
        </div>
        <div style="grid-area: sidebar; background: #f0f0f0; padding: 20px; border: 2px dashed #999;">
          ${sections[1]}
        </div>
        <div style="grid-area: main; background: #f0f0f0; padding: 20px; border: 2px dashed #999;">
          ${sections[2]}
        </div>
        <div style="grid-area: footer; background: #f0f0f0; padding: 10px; text-align: center; border: 2px dashed #999;">
          ${sections[3]}
        </div>
      </div>
    `;
    return showWireframe(html);
  }
};

// Export everything
export default {
  showCode,
  showDiagram,
  showWireframe,
  showComparison,
  showProgress,
  showData,
  showHTML,
  diagrams,
  wireframes
};