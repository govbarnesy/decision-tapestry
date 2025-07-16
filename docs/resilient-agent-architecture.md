# Resilient Agent Architecture

## Overview

The Decision Tapestry agent framework has been enhanced with comprehensive resilience features to ensure reliable operation in distributed environments. This architecture provides automatic failure recovery, health monitoring, and graceful degradation capabilities.

## Core Components

### 1. ResilientAgentMessaging

Enhanced WebSocket messaging with:

- **Circuit Breaker Pattern**: Prevents cascading failures
- **Exponential Backoff**: Smart reconnection strategy
- **Message Queuing**: Priority-based queue with overflow protection
- **Message Deduplication**: Prevents duplicate operations
- **Adaptive Timeouts**: Adjusts based on network conditions

### 2. CircuitBreaker

Fault tolerance mechanism with three states:

- **CLOSED**: Normal operation
- **OPEN**: Failing, requests blocked
- **HALF_OPEN**: Testing recovery

Features:

- Configurable failure thresholds
- Automatic state transitions
- Fallback support
- Metrics tracking

### 3. AgentHealthMonitor

Comprehensive health tracking:

- **Health States**: healthy, degraded, unhealthy, critical
- **Resource Monitoring**: Memory, CPU, queue sizes
- **Performance Metrics**: Response times, error rates
- **Alert System**: Proactive issue detection
- **Recovery Recommendations**: Actionable insights

### 4. ResilientAgent

Extended agent with integrated resilience:

- **Protected Operations**: File I/O, Git, API calls
- **Degraded Mode Support**: Continues with limited features
- **Offline Mode**: Queues operations for later sync
- **Automatic Recovery**: Self-healing capabilities
- **Graceful Shutdown**: Clean termination

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      ResilientAgent                         │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Health Monitor │  │   Messaging  │  │ Circuit Breakers│  │
│  │               │  │              │  │                 │  │
│  │ • Checks      │  │ • WebSocket  │  │ • File Ops     │  │
│  │ • Alerts      │  │ • Queue      │  │ • Git Ops      │  │
│  │ • Metrics     │  │ • Retry      │  │ • API Calls    │  │
│  └───────────────┘  └──────────────┘  └────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  Core Operations                     │  │
│  │  • Task Execution  • File Management  • Git Ops     │  │
│  │  • Coordination    • Status Updates   • Recovery    │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Usage Examples

### Creating a Resilient Agent

```javascript
import { createResilientAgent } from "./cli/agent-framework-resilient.mjs";

const agent = createResilientAgent(decisionId, {
  healthCheckInterval: 10000,
  maxReconnectAttempts: 10,
  failureThreshold: 5,
});

// Monitor health
agent.healthMonitor.on("state-change", ({ from, to }) => {
  console.log(`Health: ${from} → ${to}`);
});

// Initialize and run
await agent.initialize();
await agent.executeTask(task);
```

### Team Coordination

```javascript
import { createResilientAgentTeam } from "./cli/agent-framework-resilient.mjs";

const team = createResilientAgentTeam(decisions, {
  teamMode: true,
  healthCheckInterval: 15000,
});

// Coordinate with fault tolerance
await coordinator.coordinateAgents(team, decisions);
```

## Resilience Patterns

### 1. Graceful Degradation

When services become unavailable:

- Switches to cached data
- Queues operations for later
- Reduces feature set
- Maintains core functionality

### 2. Self-Healing

Automatic recovery mechanisms:

- Circuit breaker reset after cooldown
- Exponential backoff reconnection
- Resource cleanup on pressure
- State recovery after crashes

### 3. Bulkheading

Isolation of failures:

- Separate circuit breakers per service
- Independent health checks
- Isolated message queues
- Per-operation timeouts

## Configuration

### Circuit Breaker Settings

```javascript
{
    failureThreshold: 5,      // Failures before opening
    resetTimeout: 60000,      // Time before trying half-open
    successThreshold: 2,      // Successes to close
    timeout: 10000           // Operation timeout
}
```

### Health Monitor Settings

```javascript
{
    checkInterval: 10000,     // Health check frequency
    unhealthyThreshold: 3,    // Failures before unhealthy
    degradedThreshold: 2,     // Failures before degraded
    recoveryThreshold: 2      // Successes to recover
}
```

### Messaging Settings

```javascript
{
    maxReconnectAttempts: 10, // Max reconnection tries
    baseReconnectDelay: 1000, // Initial retry delay
    maxReconnectDelay: 60000, // Max retry delay
    messageTimeout: 5000,     // Message send timeout
    maxQueueSize: 1000       // Max queued messages
}
```

## Monitoring and Observability

### Health Metrics

- **State**: Current health status
- **Uptime**: Percentage and duration
- **Error Rate**: Failure percentage
- **Response Time**: Average, min, max
- **Resource Usage**: Memory, CPU, queues

### Alerts

- **Type**: health-check-failed, state-change, resource, queue
- **Severity**: info, warning, error, critical
- **Details**: Contextual information
- **Timestamp**: When occurred

### Status Reporting

```javascript
const status = agent.getStatus();
// Returns comprehensive status including:
// - Health state and metrics
// - Circuit breaker states
// - Message queue status
// - Resource utilization
// - Recent alerts
```

## Best Practices

1. **Configure Appropriately**
   - Set thresholds based on expected load
   - Adjust timeouts for network conditions
   - Size queues for burst capacity

2. **Monitor Actively**
   - Watch health state changes
   - React to alerts promptly
   - Track metrics trends

3. **Test Failure Scenarios**
   - Simulate network outages
   - Test circuit breaker behavior
   - Verify recovery mechanisms

4. **Plan for Degradation**
   - Define essential features
   - Implement fallback strategies
   - Cache critical data

## Future Enhancements

- **Distributed Tracing**: Track operations across agents
- **Metric Aggregation**: Centralized monitoring dashboard
- **Adaptive Thresholds**: ML-based threshold adjustment
- **Chaos Engineering**: Built-in failure injection
- **State Persistence**: Durable queue storage
