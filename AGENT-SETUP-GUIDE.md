# Agent System Setup Guide

This guide helps you set up the Decision Tapestry agent system for full functionality.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Git** repository initialized
3. **Decision Tapestry** dashboard running

## Setup Steps

### 1. Environment Configuration

Create a `.env` file in your project root:

```bash
# GitHub Integration (Optional but recommended)
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repo_name

# Agent Configuration
AGENT_SERVER_URL=ws://localhost:8080
AGENT_HEALTH_CHECK_INTERVAL=10000
AGENT_MAX_RETRIES=5

# Context Enrichment
ENABLE_GIT_ANALYSIS=true
ENABLE_GITHUB_ENRICHMENT=true
MIN_CONTEXT_COMPLETENESS=50

# Quality Monitoring
CONTEXT_QUALITY_REPORTING=true
QUALITY_REPORT_INTERVAL=60000
```

### 2. GitHub Token Setup (Optional but Recommended)

To enable full context enrichment with GitHub data:

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Generate a new token with these scopes:
   - `repo` (full control of private repositories)
   - `read:project` (read project boards)
3. Add the token to your `.env` file

### 3. Start the Dashboard Server

The agent system requires the dashboard server for WebSocket communication:

```bash
# Start the dashboard (required for agents)
npm start

# Dashboard will be available at http://localhost:8080
```

### 4. Initialize Git Repository

Agents use Git for context enrichment:

```bash
# If not already initialized
git init

# Make sure you have some commits
git add .
git commit -m "Initial commit"
```

### 5. Install Dependencies

Ensure all required dependencies are installed:

```bash
npm install ws js-yaml
```

## Running Agents

### Basic Agent Test

```bash
# Run a single agent on a decision
node -e "
import { DecisionTapestryAgent } from './cli/agent-framework.mjs';

const agent = new DecisionTapestryAgent('TestAgent', 90);
await agent.initialize();
const report = await agent.start();
console.log('Agent completed:', report);
"
```

### Resilient Agent with Context

```bash
# Run the example script
node examples/run-resilient-agent.mjs --decision 90
```

### Multiple Agents with Coordinator

```bash
# Coordinate multiple decisions
node examples/coordinate-agents.mjs --decisions 88,89,90
```

## Troubleshooting

### "Cannot read properties of undefined" Errors

This typically means the agent base class is missing required methods. Ensure:

1. You're using the correct import:

```javascript
import { ResilientAgent } from "./cli/agent-framework-resilient.mjs";
// NOT just 'Agent' or 'AgentBase'
```

2. The agent is properly initialized:

```javascript
await agent.initialize(); // Don't skip this!
```

### "Connection refused" Errors

1. **GitHub API**: Set up your GitHub token in `.env`
2. **WebSocket**: Ensure dashboard server is running (`npm start`)
3. **Network**: Check firewall settings

### "Circuit breaker open" Messages

This is the resilience system protecting against cascading failures. It's normal behavior when:

- External services are unavailable
- Too many errors occur in succession
- The system is under stress

The agent will continue operating in degraded mode.

### Low Context Quality Warnings

These indicate the agent has limited information. To improve:

1. Ensure Git repository has history
2. Add GitHub token for API access
3. Create peer reviews for decisions
4. Link decisions to actual code files

## Configuration Options

### Agent Options

```javascript
const agent = new ResilientAgent("Agent-1", decisionId, {
  // Context options
  contextValidationEnabled: true, // Validate context quality
  minContextCompleteness: 50, // Minimum required context %

  // Resilience options
  maxRetries: 3, // Retry failed operations
  baseRetryDelay: 1000, // Initial retry delay (ms)

  // Health monitoring
  enableHealthMonitoring: true, // Track agent health
  healthCheckInterval: 10000, // Check interval (ms)

  // Messaging
  serverUrl: "ws://localhost:8080", // Dashboard WebSocket URL
  maxReconnectAttempts: 10, // WebSocket reconnect attempts
});
```

### Coordinator Options

```javascript
const coordinator = new ResilientAgentCoordinator({
  enableContextEnrichment: true, // Fetch context for agents
  enableHealthMonitoring: true, // Monitor all agents
  maxConcurrentAgents: 5, // Parallel agent limit
  agentTimeout: 300000, // 5 minute timeout
});
```

## Monitoring Agent Activity

### 1. Dashboard Visualization

Open http://localhost:8080 and navigate to:

- **Agents Tab**: Real-time agent status
- **Decision Map**: Visual activity indicators
- **Activity Timeline**: Historical view

### 2. Context Quality Metrics

```javascript
import { contextQualityMonitor } from "./cli/context-quality-monitor.mjs";

// Get quality report
const report = contextQualityMonitor.getQualityReport();
console.log("Average Quality:", report.summary.averageQuality + "%");
console.log("Recommendations:", report.recommendations);
```

### 3. Health Monitoring

```javascript
// Monitor agent health
agent.healthMonitor.on("alert", (alert) => {
  console.log(`Health Alert: ${alert.type} - ${alert.message}`);
});

// Get health status
const health = await agent.getHealthStatus();
console.log("Agent Health:", health);
```

## Best Practices

1. **Always Start the Dashboard First**
   - Agents need WebSocket connection
   - Dashboard provides visualization

2. **Use Decisions with Affected Components**
   - Agents work best with concrete file references
   - Link decisions to actual code changes

3. **Monitor Context Quality**
   - Aim for >70% context completeness
   - Address warnings promptly

4. **Handle Degraded Mode**
   - Agents continue working offline
   - Results are queued for later sync

5. **Regular Health Checks**
   - Monitor circuit breaker states
   - Check message queue sizes
   - Review error rates

## Example: Complete Setup Script

```bash
#!/bin/bash

# 1. Create .env file
cat > .env << EOL
GITHUB_TOKEN=${GITHUB_TOKEN:-"your_token_here"}
AGENT_SERVER_URL=ws://localhost:8080
ENABLE_GIT_ANALYSIS=true
MIN_CONTEXT_COMPLETENESS=50
EOL

# 2. Install dependencies
npm install

# 3. Start dashboard
npm start &
DASHBOARD_PID=$!

# 4. Wait for dashboard to start
sleep 5

# 5. Run agent test
node examples/test-resilient-agent.mjs

# 6. Cleanup
kill $DASHBOARD_PID
```

## Next Steps

1. Set up GitHub integration for richer context
2. Create peer reviews for your decisions
3. Monitor context quality metrics
4. Experiment with different agent configurations
5. Build custom agents for your workflow

For more details, see:

- [Migration Guide](MIGRATION-GUIDE-RESILIENT-AGENTS.md)
- [Agent Architecture](docs/resilient-agent-architecture.md)
- [API Reference](docs/agent-api-reference.md)
