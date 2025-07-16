/* global Chart */
import { LitElement, css, html } from "https://esm.sh/lit@3";

/**
 * @class DecisionHealthChart
 * @description A LitElement component that displays a doughnut chart for decision health metrics.
 */
class DecisionHealthChart extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `;

  static properties = {
    metrics: { type: Object },
  };

  constructor() {
    super();
    this.metrics = null;
    this.chart = null;
  }

  render() {
    return html`<canvas id="decision-health-chart"></canvas>`;
  }

  updated(changedProperties) {
    if (changedProperties.has("metrics") && this.metrics) {
      this.createOrUpdateChart();
    }
  }

  createOrUpdateChart() {
    const canvas = this.shadowRoot.querySelector("#decision-health-chart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const { accepted, superseded, deprecated } =
      this.metrics.statusDistribution;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Accepted", "Superseded", "Deprecated"],
        datasets: [
          {
            data: [accepted, superseded, deprecated],
            backgroundColor: ["#28a745", "#ffc107", "#dc3545"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
          title: {
            display: false,
          },
        },
      },
    });
  }
}

customElements.define("decision-health-chart", DecisionHealthChart);
