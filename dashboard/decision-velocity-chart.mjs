/* global Chart */
import { LitElement, css, html } from "https://esm.sh/lit@3";

/**
 * @class DecisionVelocityChart
 * @description A LitElement component that displays a chart of decision velocity over time.
 * It allows grouping the data by day, week, or month.
 */
class DecisionVelocityChart extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
    }
    h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.2rem;
    }
    #analytics-controls {
      margin-bottom: 0.5rem;
    }
    #analytics-controls button {
      padding: 0.25rem 0.5rem;
      border: 1px solid #ccc;
      background-color: #f0f0f0;
      cursor: pointer;
    }
    #analytics-controls button.active {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
    }
    .chart-wrapper {
      position: relative;
      flex-grow: 1;
    }
    canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  `;

  static properties = {
    decisions: { type: Array },
  };

  constructor() {
    super();
    this.decisions = [];
    this.chart = null;
    this.activePeriod = "week";
  }

  render() {
    return html`
      <h2>Decision Velocity</h2>
      <div id="analytics-controls" @click="${this.handlePeriodChange}">
        <button
          data-period="day"
          class="${this.activePeriod === "day" ? "active" : ""}"
        >
          Day
        </button>
        <button
          data-period="week"
          class="${this.activePeriod === "week" ? "active" : ""}"
        >
          Week
        </button>
        <button
          data-period="month"
          class="${this.activePeriod === "month" ? "active" : ""}"
        >
          Month
        </button>
      </div>
      <div class="chart-wrapper">
        <canvas id="decision-velocity-chart"></canvas>
      </div>
    `;
  }

  firstUpdated() {
    this.createChart();
  }

  updated(changedProperties) {
    if (changedProperties.has("decisions") && this.decisions.length > 0) {
      this.updateChart();
    }
  }

  handlePeriodChange(e) {
    if (e.target.tagName === "BUTTON") {
      this.activePeriod = e.target.dataset.period;
      this.updateChart();
    }
  }

  groupDecisionsByTime(period) {
    const groups = {};
    this.decisions.forEach((decision) => {
      // Handle different date formats and validate
      let dateValue = decision.date;
      
      // If date is an object with git-derived dates, use the decision_date or last_commit_date
      if (typeof dateValue === 'object' && dateValue !== null) {
        dateValue = dateValue.decision_date || dateValue.last_commit_date || dateValue.first_commit_date;
      }
      
      // Skip if no valid date value
      if (!dateValue) {
        console.warn(`Decision ${decision.id} has no valid date, skipping from velocity chart`);
        return;
      }
      
      const date = new Date(dateValue);
      
      // Validate the date is valid
      if (isNaN(date.getTime())) {
        console.warn(`Decision ${decision.id} has invalid date format: ${dateValue}, skipping from velocity chart`);
        return;
      }
      
      let key;
      if (period === "day") {
        key = date.toISOString().split("T")[0];
      } else if (period === "week") {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(date.getTime()); // Create a new Date to avoid modifying original
        weekStart.setDate(weekStart.getDate() - day + (day === 0 ? -6 : 1));
        key = weekStart.toISOString().split("T")[0];
      } else {
        // month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!groups[key]) {
        groups[key] = 0;
      }
      groups[key]++;
    });

    return Object.entries(groups)
      .sort(([keyA], [keyB]) => new Date(keyA) - new Date(keyB))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }

  updateChart() {
    if (!this.chart) {
      this.createChart();
    }
    if (this.chart && this.decisions.length > 0) {
      const groupedData = this.groupDecisionsByTime(this.activePeriod);
      this.chart.data.labels = Object.keys(groupedData);
      this.chart.data.datasets[0].data = Object.values(groupedData);
      this.chart.update();
    }
  }

  createChart() {
    const canvas = this.shadowRoot.querySelector("#decision-velocity-chart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Number of Decisions",
            data: [],
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            fill: true,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });
    if (this.decisions.length > 0) {
      this.updateChart();
    }
  }
}

customElements.define("decision-velocity-chart", DecisionVelocityChart);
