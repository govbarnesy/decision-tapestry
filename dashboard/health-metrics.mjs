import { LitElement, css, html } from "https://esm.sh/lit@3";

/**
 * A component to display health metrics for the decision-making process.
 * @element health-metrics-panel
 * @cssprop [--health-metrics-text-color=#333] - The color of the text.
 * @cssprop [--health-metrics-value-color=#0052cc] - The color of the metric values.
 */
class HealthMetricsPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: sans-serif;
      color: var(--health-metrics-text-color, #333);
    }
    .metric {
      margin-bottom: 0.5rem;
    }
    .metric-label {
      font-weight: bold;
    }
    .metric-value {
      color: var(--health-metrics-value-color, #0052cc);
      font-size: 1.2em;
    }
  `;

  static properties = {
    totalDecisions: { type: Number },
    averageLifetime: { type: String },
    supersededCount: { type: Number },
    backlogSize: { type: Number },
  };

  constructor() {
    super();
    this.totalDecisions = 0;
    this.averageLifetime = "N/A";
    this.supersededCount = 0;
    this.backlogSize = 0;
  }

  render() {
    return html`
      <div class="metric">
        <span class="metric-label">Total Decisions:</span>
        <span class="metric-value">${this.totalDecisions}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Avg. Decision Lifetime:</span>
        <span class="metric-value">${this.averageLifetime}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Superseded:</span>
        <span class="metric-value">${this.supersededCount}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Backlog Size:</span>
        <span class="metric-value">${this.backlogSize}</span>
      </div>
    `;
  }
}

customElements.define("health-metrics-panel", HealthMetricsPanel);
