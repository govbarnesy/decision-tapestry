/**
 * Visual Templates Library
 * Pre-built visual templates for common communication scenarios
 */

import canvas from './ai-canvas-helper.mjs';

export const templates = {
  /**
   * Code Templates
   */
  code: {
    /**
     * Function explanation with annotations
     */
    functionExplanation(funcName, params, description, steps) {
      const html = `
        <div style="font-family: Arial; padding: 20px; max-width: 800px;">
          <h3>📝 Function: ${funcName}</h3>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <code style="font-size: 16px; color: #1976d2;">
              ${funcName}(${params.join(', ')})
            </code>
          </div>
          <p style="color: #666;">${description}</p>
          <h4>How it works:</h4>
          <ol style="line-height: 1.8;">
            ${steps.map(step => `<li>${step}</li>`).join('')}
          </ol>
        </div>
      `;
      return canvas.showHTML(html);
    },

    /**
     * API endpoint documentation
     */
    apiEndpoint(method, path, params, response) {
      const html = `
        <div style="font-family: Arial; padding: 20px;">
          <h3>API Endpoint</h3>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
            <span style="background: ${method === 'GET' ? '#4caf50' : '#2196f3'}; color: white; padding: 5px 10px; border-radius: 4px; font-weight: bold;">
              ${method}
            </span>
            <code style="font-size: 16px;">${path}</code>
          </div>
          ${params ? `
            <div style="margin-bottom: 20px;">
              <h4>Parameters:</h4>
              <table style="width: 100%; border-collapse: collapse;">
                ${Object.entries(params).map(([key, desc]) => `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px; font-family: monospace;">${key}</td>
                    <td style="padding: 8px; color: #666;">${desc}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          ` : ''}
          <div>
            <h4>Response:</h4>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </div>
      `;
      return canvas.showHTML(html);
    },

    /**
     * Error stack trace visualization
     */
    errorTrace(error, stack, solution) {
      const html = `
        <div style="font-family: Arial; padding: 20px;">
          <h3 style="color: #d32f2f;">❌ Error Analysis</h3>
          <div style="background: #ffebee; padding: 15px; border-radius: 8px; border-left: 4px solid #d32f2f; margin-bottom: 20px;">
            <strong>${error}</strong>
          </div>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4>Stack Trace:</h4>
            <pre style="font-size: 12px; overflow-x: auto;">${stack}</pre>
          </div>
          ${solution ? `
            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
              <h4>💡 Solution:</h4>
              <p>${solution}</p>
            </div>
          ` : ''}
        </div>
      `;
      return canvas.showHTML(html);
    }
  },

  /**
   * Architecture Templates
   */
  architecture: {
    /**
     * Microservices architecture
     */
    microservices(services) {
      const positions = [
        { x: 250, y: 50 },   // Top center
        { x: 100, y: 150 },  // Left
        { x: 400, y: 150 },  // Right
        { x: 250, y: 250 },  // Bottom center
        { x: 100, y: 350 },  // Bottom left
        { x: 400, y: 350 }   // Bottom right
      ];

      const components = services.map((service, i) => ({
        x: positions[i % positions.length].x,
        y: positions[i % positions.length].y + Math.floor(i / positions.length) * 100,
        name: service.name,
        subtitle: service.description,
        width: 140,
        height: 80,
        color: service.color || '#e3f2fd',
        stroke: service.stroke || '#2196f3'
      }));

      return canvas.diagrams.architecture(components);
    },

    /**
     * Layered architecture
     */
    layers(layerData) {
      const html = `
        <div style="font-family: Arial; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h3>Layered Architecture</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${layerData.map((layer, i) => `
              <div style="
                background: ${layer.color || '#e3f2fd'};
                border: 2px solid ${layer.stroke || '#2196f3'};
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                position: relative;
              ">
                <h4 style="margin: 0 0 10px 0;">${layer.name}</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">${layer.description}</p>
                ${i < layerData.length - 1 ? `
                  <div style="
                    position: absolute;
                    bottom: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 10px solid transparent;
                    border-right: 10px solid transparent;
                    border-top: 15px solid ${layer.stroke || '#2196f3'};
                  "></div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
      return canvas.showHTML(html);
    },

    /**
     * Component interaction diagram
     */
    componentFlow(components, flows) {
      const svg = `
        <svg width="800" height="400" viewBox="0 0 800 400">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
             refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
            </marker>
          </defs>
          
          <!-- Components -->
          ${components.map(comp => `
            <g>
              <rect x="${comp.x}" y="${comp.y}" width="120" height="60" 
                    rx="8" fill="${comp.color || '#fff'}" 
                    stroke="${comp.stroke || '#666'}" stroke-width="2"/>
              <text x="${comp.x + 60}" y="${comp.y + 35}" 
                    text-anchor="middle" font-family="Arial" font-size="14">
                ${comp.name}
              </text>
            </g>
          `).join('')}
          
          <!-- Flows -->
          ${flows.map(flow => `
            <g>
              <line x1="${flow.from.x}" y1="${flow.from.y}" 
                    x2="${flow.to.x}" y2="${flow.to.y}" 
                    stroke="#666" stroke-width="2" 
                    marker-end="url(#arrowhead)"/>
              ${flow.label ? `
                <text x="${(flow.from.x + flow.to.x) / 2}" 
                      y="${(flow.from.y + flow.to.y) / 2 - 5}" 
                      text-anchor="middle" font-family="Arial" 
                      font-size="12" fill="#666">
                  ${flow.label}
                </text>
              ` : ''}
            </g>
          `).join('')}
        </svg>
      `;
      return canvas.showDiagram(svg);
    }
  },

  /**
   * UI/UX Templates
   */
  ui: {
    /**
     * Mobile app screen
     */
    mobileScreen(title, elements) {
      const html = `
        <div style="display: flex; justify-content: center; padding: 20px;">
          <div style="width: 320px; height: 568px; border: 20px solid #333; border-radius: 30px; background: #fff; overflow: hidden;">
            <div style="background: #f0f0f0; padding: 15px; text-align: center; border-bottom: 1px solid #ddd;">
              <h4 style="margin: 0;">${title}</h4>
            </div>
            <div style="padding: 20px;">
              ${elements.map(el => this.renderUIElement(el)).join('')}
            </div>
          </div>
        </div>
      `;
      return canvas.showHTML(html);
    },

    /**
     * Form layout
     */
    formLayout(title, fields, buttons) {
      const html = `
        <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h3>${title}</h3>
          <form style="display: flex; flex-direction: column; gap: 15px;">
            ${fields.map(field => `
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">
                  ${field.label}${field.required ? ' *' : ''}
                </label>
                ${this.renderFormField(field)}
              </div>
            `).join('')}
            <div style="display: flex; gap: 10px; margin-top: 20px;">
              ${buttons.map(btn => `
                <button style="
                  padding: 10px 20px;
                  background: ${btn.primary ? '#2196f3' : '#f0f0f0'};
                  color: ${btn.primary ? 'white' : '#333'};
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 16px;
                ">${btn.text}</button>
              `).join('')}
            </div>
          </form>
        </div>
      `;
      return canvas.showHTML(html);
    },

    /**
     * Dashboard layout
     */
    dashboardLayout(sections) {
      const html = `
        <div style="font-family: Arial; padding: 20px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            ${sections.map(section => `
              <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
                <h4 style="margin: 0 0 15px 0; color: #333;">${section.title}</h4>
                ${section.type === 'metric' ? this.renderMetric(section) : ''}
                ${section.type === 'chart' ? this.renderChart(section) : ''}
                ${section.type === 'list' ? this.renderList(section) : ''}
                ${section.type === 'content' ? `<div>${section.content}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
      return canvas.showHTML(html);
    },

    // Helper methods
    renderUIElement(element) {
      switch (element.type) {
        case 'button':
          return `<button style="width: 100%; padding: 12px; background: ${element.primary ? '#2196f3' : '#f0f0f0'}; color: ${element.primary ? 'white' : '#333'}; border: none; border-radius: 4px; margin-bottom: 10px;">${element.text}</button>`;
        case 'input':
          return `<input type="${element.inputType || 'text'}" placeholder="${element.placeholder}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">`;
        case 'text':
          return `<p style="margin-bottom: 10px; color: #666;">${element.content}</p>`;
        default:
          return '';
      }
    },

    renderFormField(field) {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'password':
          return `<input type="${field.type}" placeholder="${field.placeholder || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">`;
        case 'textarea':
          return `<textarea placeholder="${field.placeholder || ''}" rows="4" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>`;
        case 'select':
          return `
            <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
              ${field.options.map(opt => `<option>${opt}</option>`).join('')}
            </select>
          `;
        default:
          return '';
      }
    },

    renderMetric(section) {
      return `
        <div style="text-align: center;">
          <div style="font-size: 36px; font-weight: bold; color: ${section.color || '#2196f3'};">
            ${section.value}
          </div>
          <div style="color: #999; font-size: 14px;">${section.label}</div>
        </div>
      `;
    },

    renderChart(section) {
      // Simple bar chart visualization
      return `
        <div style="display: flex; align-items: flex-end; height: 150px; gap: 10px;">
          ${section.data.map(item => `
            <div style="flex: 1; background: #2196f3; height: ${item.value}%; position: relative;">
              <div style="position: absolute; bottom: -20px; width: 100%; text-align: center; font-size: 12px;">
                ${item.label}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    },

    renderList(section) {
      return `
        <ul style="list-style: none; padding: 0;">
          ${section.items.map(item => `
            <li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
              ${item}
            </li>
          `).join('')}
        </ul>
      `;
    }
  },

  /**
   * Process Templates
   */
  process: {
    /**
     * Step-by-step workflow
     */
    workflow(title, steps, currentStep = 0) {
      const html = `
        <div style="font-family: Arial; padding: 20px; max-width: 800px;">
          <h3>${title}</h3>
          <div style="display: flex; align-items: center; margin: 30px 0;">
            ${steps.map((step, i) => `
              <div style="flex: 1; display: flex; align-items: center;">
                <div style="
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  background: ${i < currentStep ? '#4caf50' : i === currentStep ? '#2196f3' : '#e0e0e0'};
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                ">
                  ${i < currentStep ? '✓' : i + 1}
                </div>
                ${i < steps.length - 1 ? `
                  <div style="
                    flex: 1;
                    height: 2px;
                    background: ${i < currentStep ? '#4caf50' : '#e0e0e0'};
                    margin: 0 10px;
                  "></div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          <div style="display: flex; justify-content: space-between;">
            ${steps.map((step, i) => `
              <div style="flex: 1; text-align: center; padding: 0 10px;">
                <div style="font-weight: ${i === currentStep ? 'bold' : 'normal'}; color: ${i <= currentStep ? '#333' : '#999'};">
                  ${step}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      return canvas.showHTML(html);
    },

    /**
     * Decision tree
     */
    decisionTree(question, options) {
      const html = `
        <div style="font-family: Arial; padding: 20px; text-align: center;">
          <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin: 0;">${question}</h3>
          </div>
          <div style="display: flex; justify-content: center; gap: 20px;">
            ${options.map(option => `
              <div style="flex: 1; max-width: 200px;">
                <div style="width: 2px; height: 30px; background: #666; margin: 0 auto;"></div>
                <div style="
                  background: ${option.recommended ? '#e8f5e9' : '#fff'};
                  border: 2px solid ${option.recommended ? '#4caf50' : '#666'};
                  padding: 20px;
                  border-radius: 8px;
                ">
                  <h4 style="margin: 0 0 10px 0;">${option.label}</h4>
                  <p style="margin: 0; font-size: 14px; color: #666;">
                    ${option.description}
                  </p>
                  ${option.pros ? `
                    <div style="margin-top: 10px; text-align: left;">
                      <strong style="color: #4caf50;">Pros:</strong>
                      <ul style="margin: 5px 0; padding-left: 20px;">
                        ${option.pros.map(pro => `<li style="font-size: 12px;">${pro}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                  ${option.cons ? `
                    <div style="margin-top: 10px; text-align: left;">
                      <strong style="color: #f44336;">Cons:</strong>
                      <ul style="margin: 5px 0; padding-left: 20px;">
                        ${option.cons.map(con => `<li style="font-size: 12px;">${con}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      return canvas.showHTML(html);
    }
  },

  /**
   * Data Templates
   */
  data: {
    /**
     * Table visualization
     */
    table(headers, rows) {
      const html = `
        <div style="font-family: Arial; padding: 20px; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background: white;">
            <thead>
              <tr style="background: #f5f5f5;">
                ${headers.map(header => `
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">
                    ${header}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, i) => `
                <tr style="background: ${i % 2 === 0 ? '#fff' : '#f9f9f9'};">
                  ${row.map(cell => `
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">
                      ${cell}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      return canvas.showHTML(html);
    },

    /**
     * Key-value pairs visualization
     */
    keyValue(title, data) {
      const html = `
        <div style="font-family: Arial; padding: 20px; max-width: 600px;">
          <h3>${title}</h3>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            ${Object.entries(data).map(([key, value]) => `
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                <strong>${key}:</strong>
                <span style="color: #666;">${value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      return canvas.showHTML(html);
    },

    /**
     * Progress metrics
     */
    progressMetrics(metrics) {
      const html = `
        <div style="font-family: Arial; padding: 20px;">
          <h3>Progress Overview</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            ${metrics.map(metric => `
              <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #333;">${metric.name}</h4>
                <div style="margin-bottom: 10px;">
                  <div style="background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden;">
                    <div style="
                      background: ${metric.color || '#2196f3'};
                      height: 100%;
                      width: ${metric.percentage}%;
                      transition: width 0.3s ease;
                    "></div>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 14px;">
                  <span>${metric.current} / ${metric.total}</span>
                  <span style="font-weight: bold;">${metric.percentage}%</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      return canvas.showHTML(html);
    }
  }
};

// Export convenience functions
export function showTemplate(category, templateName, ...args) {
  const template = templates[category]?.[templateName];
  if (!template) {
    console.error(`Template not found: ${category}.${templateName}`);
    return null;
  }
  return template(...args);
}

export default templates;