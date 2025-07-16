# Resilient Agent Quick Start Guide

## 🚀 Getting Started

### Basic Usage

```bash
# Run a single resilient agent
decision-tapestry agent run 123 --resilient

# Run with custom health check interval
decision-tapestry agent run 123 --resilient --health-interval 5000

# Run team with resilience
decision-tapestry agent team --resilient --decisions 1,2,3
```

### JavaScript API

```javascript
import { createResilientAgent } from "./cli/agent-framework-resilient.mjs";

// Create agent
const agent = createResilientAgent(123);

// Initialize
await agent.initialize();

// Execute with protection
await agent.executeTask(task);
```

## 🏥 Health Monitoring

### Health States

- **🟢 Healthy**: Operating normally
- **🟡 Degraded**: Minor issues, reduced functionality
- **🟠 Unhealthy**: Significant issues, may fail
- **🔴 Critical**: Severe issues, attempting recovery

### Monitoring Health

```javascript
agent.healthMonitor.on("state-change", ({ from, to }) => {
  console.log(`Health: ${from} → ${to}`);
});

agent.healthMonitor.on("alert", (alert) => {
  console.log(`Alert: ${alert.type} - ${alert.message}`);
});
```

## ⚡ Circuit Breakers

### Protected Operations

- **File Operations**: Read/write with fallback
- **Git Operations**: Commands with queuing
- **API Calls**: External requests with retry
- **Task Execution**: Main work with recovery

### Circuit States

- **Closed**: Normal operation ✅
- **Open**: Blocking requests 🚫
- **Half-Open**: Testing recovery 🔄

### Monitoring Circuits

```javascript
Object.entries(agent.circuitBreakers).forEach(([name, cb]) => {
  cb.on("state-change", ({ from, to }) => {
    console.log(`${name}: ${from} → ${to}`);
  });
});
```

## 📡 Resilient Messaging

### Features

- **Auto-reconnect**: With exponential backoff
- **Message Queue**: Priority-based with overflow protection
- **Deduplication**: Prevents duplicate sends
- **Offline Mode**: Queues for later delivery

### Connection Events

```javascript
agent.messaging.on("connected", () => console.log("Connected"));
agent.messaging.on("disconnected", () => console.log("Disconnected"));
agent.messaging.on("reconnected", () => console.log("Reconnected"));
```

## 🛡️ Failure Handling

### Automatic Recovery

1. **Circuit breaker opens** → Use fallback
2. **Connection lost** → Queue messages
3. **Health degrades** → Reduce operations
4. **Critical state** → Attempt recovery

### Manual Recovery

```javascript
// Force recovery attempt
await agent.attemptRecovery();

// Reset specific circuit breaker
agent.circuitBreakers.fileOps.reset();

// Clear message queue
agent.messaging.messageQueue = [];
```

## 📊 Status and Metrics

### Get Full Status

```javascript
const status = agent.getStatus();
console.log(JSON.stringify(status, null, 2));
```

### Key Metrics

- **Error Rate**: `status.health.monitor.metrics.errorRate`
- **Queue Size**: `status.health.messaging.queueSize`
- **Circuit States**: `status.health.circuitBreakers`
- **Uptime**: `status.health.monitor.metrics.uptime`

## ⚙️ Configuration

### Quick Config

```javascript
const agent = createResilientAgent(123, {
  // Health monitoring
  healthCheckInterval: 10000, // 10 seconds

  // Circuit breaker
  failureThreshold: 5, // Open after 5 failures
  resetTimeout: 30000, // Try recovery after 30s

  // Messaging
  maxReconnectAttempts: 10, // Max reconnect tries
  maxQueueSize: 1000, // Max queued messages

  // Timeouts
  messageTimeout: 5000, // 5 second timeout
  timeout: 10000, // 10 second operation timeout
});
```

## 🚨 Common Issues

### Circuit Breaker Open

```javascript
// Check state
if (agent.circuitBreakers.fileOps.state === "open") {
  // Wait for reset or force it
  agent.circuitBreakers.fileOps.forceState("half_open");
}
```

### Message Queue Full

```javascript
// Check queue
if (agent.messaging.messageQueue.length > 900) {
  // Clear low priority
  agent.handleQueueBacklog();
}
```

### Memory Pressure

```javascript
// Handle alert
agent.healthMonitor.on("alert", (alert) => {
  if (alert.type === "memory") {
    agent.handleMemoryPressure();
  }
});
```

## 🧪 Testing Resilience

### Simulate Failures

```javascript
// Force circuit breaker failure
agent.circuitBreakers.fileOps.onFailure();
agent.circuitBreakers.fileOps.onFailure();
agent.circuitBreakers.fileOps.onFailure();

// Disconnect messaging
agent.messaging.ws?.close();

// Trigger health degradation
agent.healthMonitor.handleUnhealthyCheck(
  new Map([["test", { healthy: false }]]),
);
```

### Run Example

```bash
# Single agent demo
node examples/resilient-agent-example.mjs

# Team coordination demo
node examples/resilient-agent-example.mjs --team
```

## 📝 Logs

### Enable Debug Logging

```javascript
agent.log = (message, level = "info") => {
  console.log(`[${level}] ${message}`);
};
```

### Key Log Messages

- `"Circuit breaker X opened"` - Protection activated
- `"Entering offline mode"` - No connectivity
- `"Health state changed: X → Y"` - Health transition
- `"Recovery attempt completed"` - Recovery tried

## 🎯 Best Practices

1. **Monitor health state changes**
2. **React to circuit breaker events**
3. **Handle message queue warnings**
4. **Implement fallback strategies**
5. **Test failure scenarios**
6. **Configure appropriate thresholds**
7. **Log important events**
8. **Plan for offline operation**
