import { LitElement, css, html } from "https://esm.sh/lit@3";
import "./agent-status-panel.mjs";

/**
 * @class AgentTestPanel
 * @description A panel that combines agent status display with test simulation controls
 */
class AgentTestPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .test-controls {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      background: var(--tab-bg);
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .control-button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      background: var(--accent);
      color: white;
    }

    .control-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .control-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .control-button.stop {
      background: #dc3545;
    }

    .control-button.reset {
      background: #6c757d;
    }

    .status-message {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-left: 0;
    }

    .agent-status-container {
      flex: 1;
      overflow-y: auto;
    }

    .simulation-info {
      padding: 0.5rem 1rem;
      background: rgba(33, 150, 243, 0.1);
      border-left: 4px solid #2196f3;
      margin: 1rem;
      border-radius: 4px;
      font-size: 0.85rem;
      color: var(--text-main);
    }
  `;

  static properties = {
    isRunning: { type: Boolean },
    simulationInterval: { type: Number },
    testAgents: { type: Array },
  };

  constructor() {
    super();
    this.isRunning = false;
    this.simulationInterval = null;
    this.testAgents = [];
    this.decisions = [];
  }

  async connectedCallback() {
    super.connectedCallback();
    // Load decisions for simulation
    try {
      const response = await fetch("/api/data");
      if (response.ok) {
        const data = await response.json();
        this.decisions = data.decisions;
      }
    } catch (error) {
      console.error("Failed to load decisions:", error);
    }
  }

  render() {
    return html`
      <div class="test-controls">
        <button
          class="control-button"
          @click=${this.startSimulation}
          ?disabled=${this.isRunning}
        >
          Start
        </button>
        <button
          class="control-button stop"
          @click=${this.stopSimulation}
          ?disabled=${!this.isRunning}
        >
          Stop
        </button>
        <button class="control-button reset" @click=${this.resetSimulation}>
          Clear
        </button>
        <span class="status-message">
          ${this.isRunning ? "Simulation running..." : "Simulation stopped"}
        </span>
      </div>

      ${this.testAgents.length === 0 && !this.isRunning
        ? html`
            <div class="simulation-info">
              <strong>Agent Simulation Test</strong><br />
              Click "Start Simulation" to create test agents and watch them work
              on decisions in real-time. The simulation will randomly assign
              tasks and states to demonstrate the activity tracking system.
            </div>
          `
        : ""}

      <div class="agent-status-container">
        <agent-status-panel id="agent-status"></agent-status-panel>
      </div>
    `;
  }

  async startSimulation() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.testAgents = [
      { id: "Agent-Alpha", color: "#4CAF50" },
      { id: "Agent-Beta", color: "#FF9800" },
      { id: "Agent-Gamma", color: "#2196F3" },
      { id: "Agent-Delta", color: "#9C27B0" },
      { id: "Agent-Epsilon", color: "#00BCD4" },
    ];

    // Start all agents
    for (const agent of this.testAgents) {
      await this.sendActivity(
        agent.id,
        "working",
        "Initializing...",
        this.getRandomDecisionId(),
      );
    }

    // Run simulation updates
    let cycle = 0;
    this.simulationInterval = setInterval(async () => {
      cycle++;
      const states = ["working", "debugging", "testing", "reviewing"];

      for (const agent of this.testAgents) {
        // 20% chance to go idle, 80% chance to change state
        if (Math.random() > 0.8) {
          await this.sendActivity(agent.id, "idle", "Task completed");
        } else {
          const newState = states[Math.floor(Math.random() * states.length)];
          const tasks = [
            "Implementing feature",
            "Fixing bug",
            "Running tests",
            "Code review",
            "Refactoring",
            "Writing documentation",
            "Performance optimization",
            "Security audit",
          ];
          const task = tasks[Math.floor(Math.random() * tasks.length)];
          const decisionId =
            Math.random() > 0.3 ? this.getRandomDecisionId() : null;

          await this.sendActivity(
            agent.id,
            newState,
            `${task} (cycle ${cycle})`,
            decisionId,
          );
        }

        // Small delay between agent updates
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }, 3000); // Update every 3 seconds
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isRunning = false;
  }

  async resetSimulation() {
    this.stopSimulation();

    // Set all agents to idle
    for (const agent of this.testAgents) {
      await this.sendActivity(agent.id, "idle", "Reset");
    }

    // Clear all agent activities on the server and across all panels
    try {
      const response = await fetch("/api/activity/all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error(`Failed to clear all activities: ${response.status}`);
      } else {
        console.log("All agent activities cleared successfully");
      }
    } catch (error) {
      console.error("Error clearing activities:", error);
    }

    // Clear the local agent status panel
    const agentStatus = this.shadowRoot.getElementById("agent-status");
    if (agentStatus) {
      agentStatus.agents.clear();
      agentStatus.requestUpdate();
    }

    this.testAgents = [];
  }

  async sendActivity(agentId, state, description, decisionId = null) {
    try {
      const response = await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          state,
          taskDescription: description,
          decisionId,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to send activity: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending activity:", error);
    }
  }

  getRandomDecisionId() {
    if (this.decisions.length === 0) return null;
    const decision =
      this.decisions[Math.floor(Math.random() * this.decisions.length)];
    return decision.id;
  }
}

customElements.define("agent-test-panel", AgentTestPanel);
