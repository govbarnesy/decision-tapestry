# Migration Guide: Upgrading to Resilient Agent Framework

This guide explains how to migrate from the basic agent framework to the resilient agent framework with enhanced context support.

## Overview

The resilient agent framework provides:

- **Fault tolerance** with circuit breakers and retry logic
- **Health monitoring** for proactive issue detection
- **Context enrichment** with three-layer context model
- **Graceful degradation** during service outages
- **Quality monitoring** for context completeness

## Migration Steps

### 1. Update Agent Imports

```javascript
// Before
import { DecisionTapestryAgent } from "./cli/agent-framework.mjs";
import { AgentMessaging } from "./cli/agent-messaging.mjs";

// After
import { ResilientAgent } from "./cli/agent-framework-resilient.mjs";
import { ResilientAgentMessaging } from "./cli/agent-messaging-resilient.mjs";
```

### 2. Update Agent Instantiation

```javascript
// Before
const agent = new DecisionTapestryAgent("Agent-1", decisionId);
await agent.initialize();

// After
const agent = new ResilientAgent("Agent-1", decisionId, {
  maxRetries: 5,
  baseRetryDelay: 2000,
  enableHealthMonitoring: true,
  minContextCompleteness: 50, // Minimum 50% context required
});
await agent.initialize();
```

### 3. Update Coordinator Usage

```javascript
// Before
import { AgentCoordinator } from "./cli/agent-coordinator.mjs";
const coordinator = new AgentCoordinator();

// After
import { ResilientAgentCoordinator } from "./cli/agent-coordinator-resilient.mjs";
const coordinator = new ResilientAgentCoordinator({
  enableContextEnrichment: true,
  enableHealthMonitoring: true,
  maxConcurrentAgents: 5,
});
```

### 4. Enable Context Enrichment

```javascript
// Get enriched context for agent
import { contextAggregator } from "./cli/context-aggregator.mjs";

const enrichedContext = await contextAggregator.getDecisionContext(decisionId);
const agent = new ResilientAgent("Agent-1", decisionId, {
  context: enrichedContext,
  contextValidationEnabled: true,
  minContextCompleteness: 70, // Require 70% context completeness
});
```

### 5. Monitor Context Quality

```javascript
// Enable context quality monitoring
import { contextQualityMonitor } from "./cli/context-quality-monitor.mjs";

// Start periodic reporting
contextQualityMonitor.startReporting();

// Get quality report
const report = contextQualityMonitor.getQualityReport();
console.log(`Average context quality: ${report.summary.averageQuality}%`);
```

## Example: Complete Migration

### Before (Basic Agent)

```javascript
// cli/run-agent.mjs
import { DecisionTapestryAgent } from "./agent-framework.mjs";
import { AgentCoordinator } from "./agent-coordinator.mjs";

async function runAgent(decisionId) {
  const agent = new DecisionTapestryAgent(`Agent-${decisionId}`, decisionId);

  try {
    await agent.initialize();
    const report = await agent.start();
    console.log("Agent completed:", report);
  } catch (error) {
    console.error("Agent failed:", error);
  }
}

// Run multiple agents
async function runMultipleAgents(decisionIds) {
  const coordinator = new AgentCoordinator();
  await coordinator.initialize();

  const results = await coordinator.coordinateDecisions(decisionIds);
  console.log("Coordination results:", results);
}
```

### After (Resilient Agent)

```javascript
// cli/run-resilient-agent.mjs
import { ResilientAgent } from "./agent-framework-resilient.mjs";
import { ResilientAgentCoordinator } from "./agent-coordinator-resilient.mjs";
import { contextAggregator } from "./context-aggregator.mjs";
import { contextQualityMonitor } from "./context-quality-monitor.mjs";

async function runResilientAgent(decisionId) {
  // Get enriched context
  const context = await contextAggregator.getDecisionContext(decisionId, {
    forceRefresh: true, // Get fresh context
  });

  const agent = new ResilientAgent(`Agent-${decisionId}`, decisionId, {
    context: context,
    contextValidationEnabled: true,
    minContextCompleteness: 60,
    maxRetries: 5,
    enableHealthMonitoring: true,
  });

  try {
    await agent.initialize();

    // Monitor agent health
    agent.healthMonitor.on("alert", (alert) => {
      console.warn(`Health alert: ${alert.message}`);
    });

    const report = await agent.start();
    console.log(
      "Agent completed with context quality:",
      context._metadata?.validation?.completeness || 0,
      "%",
    );

    return report;
  } catch (error) {
    console.error("Agent failed:", error);

    // Get health status for debugging
    const health = agent.getStatus();
    console.log("Agent health:", health);

    throw error;
  }
}

// Run multiple agents with resilience
async function runResilientAgents(decisionIds) {
  const coordinator = new ResilientAgentCoordinator({
    enableContextEnrichment: true,
    enableHealthMonitoring: true,
    maxConcurrentAgents: 3,
    agentTimeout: 300000, // 5 minutes
  });

  // Enable quality monitoring
  contextQualityMonitor.startReporting();

  try {
    await coordinator.initialize();

    // Monitor coordinator health
    coordinator.healthMonitor.on("state-change", ({ from, to }) => {
      console.log(`Coordinator health: ${from} -> ${to}`);
    });

    const results = await coordinator.coordinateDecisions(decisionIds);

    // Get quality report
    const qualityReport = contextQualityMonitor.getQualityReport();
    console.log("Context quality summary:", qualityReport.summary);
    console.log("Agent performance:", qualityReport.agentPerformance);

    return results;
  } finally {
    contextQualityMonitor.stopReporting();
    await coordinator.cleanup();
  }
}
```

## Configuration Options

### ResilientAgent Options

```javascript
{
    // Context options
    context: Object,                    // Pre-fetched enriched context
    contextValidationEnabled: true,     // Enable context validation
    minContextCompleteness: 50,         // Minimum required context completeness (%)

    // Resilience options
    maxRetries: 3,                      // Max retry attempts
    baseRetryDelay: 1000,               // Base delay between retries (ms)
    maxRetryDelay: 30000,               // Max delay between retries (ms)

    // Health monitoring
    enableHealthMonitoring: true,       // Enable health checks
    healthCheckInterval: 10000,         // Health check interval (ms)

    // Messaging options
    maxReconnectAttempts: 10,          // WebSocket reconnection attempts
    failureThreshold: 5                 // Circuit breaker failure threshold
}
```

### ResilientAgentCoordinator Options

```javascript
{
    // Context enrichment
    enableContextEnrichment: true,      // Enable context aggregation

    // Health monitoring
    enableHealthMonitoring: true,       // Enable health monitoring

    // Coordination options
    maxConcurrentAgents: 5,            // Max agents running in parallel
    agentTimeout: 300000,              // Agent execution timeout (ms)

    // Messaging options
    messaging: {
        maxReconnectAttempts: 20,
        baseReconnectDelay: 2000,
        failureThreshold: 10,
        maxQueueSize: 2000
    },

    // Health monitor options
    health: {
        checkInterval: 15000,
        unhealthyThreshold: 3
    }
}
```

## Best Practices

### 1. Always Use Context Enrichment

```javascript
// Good: Pre-fetch and validate context
const context = await contextAggregator.getDecisionContext(decisionId);
if (context._metadata.validation.completeness < 50) {
  console.warn("Low context quality, agent may have limited information");
}

const agent = new ResilientAgent(agentId, decisionId, { context });
```

### 2. Monitor Health Proactively

```javascript
// Set up health monitoring
agent.healthMonitor.on("state-change", ({ to }) => {
  if (to === "degraded" || to === "unhealthy") {
    // Take corrective action
    notifyOperations(`Agent ${agentId} health: ${to}`);
  }
});
```

### 3. Handle Circuit Breaker Events

```javascript
// Monitor circuit breakers
agent.on("circuit-breaker-open", (name) => {
  console.warn(
    `Circuit breaker ${name} opened - agent operating in degraded mode`,
  );
  // Consider reducing load or switching to backup services
});
```

### 4. Use Quality Thresholds

```javascript
// Set appropriate quality thresholds based on task criticality
const criticalAgent = new ResilientAgent(agentId, decisionId, {
  minContextCompleteness: 80, // High threshold for critical tasks
  contextValidationEnabled: true,
});

const routineAgent = new ResilientAgent(agentId, decisionId, {
  minContextCompleteness: 30, // Lower threshold for routine tasks
  contextValidationEnabled: true,
});
```

### 5. Implement Graceful Degradation

```javascript
// Handle offline mode gracefully
coordinator.on("offline-mode", () => {
  console.log("Coordinator entering offline mode - results will be cached");
  // Adjust expectations for real-time updates
});
```

## Troubleshooting

### Context Quality Issues

If agents are failing due to low context quality:

1. Check context sources are available:

   ```javascript
   const metrics = contextAggregator.getMetrics();
   console.log("Circuit breakers:", metrics.circuitBreakerStatus);
   ```

2. Review quality report:

   ```javascript
   const report = contextQualityMonitor.getQualityReport();
   console.log("Top issues:", report.topIssues);
   console.log("Recommendations:", report.recommendations);
   ```

3. Lower context requirements temporarily:
   ```javascript
   agent.minContextCompleteness = 30; // Temporarily lower threshold
   ```

### Health Monitoring Issues

If health checks are failing:

1. Check individual health components:

   ```javascript
   const status = agent.getStatus();
   console.log("Health details:", status.health);
   ```

2. Review circuit breaker states:

   ```javascript
   console.log("Circuit breakers:", status.health.circuitBreakers);
   ```

3. Check messaging health:
   ```javascript
   console.log("Messaging:", status.health.messaging);
   ```

## Rollback Plan

If you need to rollback to the basic framework:

1. The resilient framework is backward compatible
2. Simply reduce the options to minimum:

   ```javascript
   // Minimal resilient agent (behaves like basic agent)
   const agent = new ResilientAgent(agentId, decisionId, {
     enableHealthMonitoring: false,
     contextValidationEnabled: false,
   });
   ```

3. Or use the migration example in agent-coordinator-resilient.mjs:
   ```javascript
   // The ResilientAgentCoordinator extends AgentCoordinator
   // So the basic API remains the same
   ```

## Summary

The resilient agent framework provides production-ready features while maintaining backward compatibility. Start with basic migration and gradually enable advanced features as needed. Monitor context quality and health metrics to ensure optimal agent performance.
