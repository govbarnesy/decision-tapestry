/**
 * Resilient Agent Messaging System
 * Enhanced version with circuit breaker, exponential backoff, and health monitoring
 */

import WebSocket from 'ws';
import EventEmitter from 'events';

// Circuit breaker states
const CircuitState = {
    CLOSED: 'closed',  // Normal operation
    OPEN: 'open',      // Failing, rejecting requests
    HALF_OPEN: 'half_open' // Testing if service recovered
};

export class ResilientAgentMessaging extends EventEmitter {
    constructor(agentId, options = {}) {
        super();
        this.agentId = agentId;
        this.decisionId = options.decisionId; // Store decisionId for registration
        this.ws = null;
        this.serverUrl = options.serverUrl || 'ws://localhost:8080';
        this.connected = false;
        this.messageQueue = [];
        this.heartbeatInterval = null;
        
        // Resilience configuration
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        this.reconnectAttempts = 0;
        this.baseReconnectDelay = options.baseReconnectDelay || 1000; // 1 second
        this.maxReconnectDelay = options.maxReconnectDelay || 60000; // 1 minute
        this.messageTimeout = options.messageTimeout || 5000; // 5 seconds
        this.maxQueueSize = options.maxQueueSize || 1000;
        
        // Circuit breaker configuration
        this.circuitBreaker = {
            state: CircuitState.CLOSED,
            failureCount: 0,
            failureThreshold: options.failureThreshold || 5,
            resetTimeout: options.resetTimeout || 30000, // 30 seconds
            lastFailureTime: null,
            halfOpenRequests: 0,
            maxHalfOpenRequests: 1
        };
        
        // Health monitoring
        this.health = {
            lastSuccessfulConnection: null,
            lastSuccessfulMessage: null,
            totalMessagesSent: 0,
            totalMessagesFailed: 0,
            connectionUptime: 0,
            startTime: Date.now()
        };
        
        // Message deduplication
        this.sentMessages = new Map(); // messageId -> timestamp
        this.messageDeduplicationWindow = 60000; // 1 minute
    }

    /**
     * Initialize messaging connection with resilience
     */
    async initialize() {
        try {
            await this.connectWithCircuitBreaker();
            await this.registerAgent();
            this.startHeartbeat();
            this.startHealthMonitoring();
            this.log('Messaging initialized with resilience features');
            this.emit('initialized');
        } catch (error) {
            this.log(`Failed to initialize messaging: ${error.message}`);
            this.emit('initialization-failed', error);
            // Schedule retry with backoff
            this.scheduleReconnect();
        }
    }

    /**
     * Connect with circuit breaker pattern
     */
    async connectWithCircuitBreaker() {
        // Check circuit breaker state
        if (this.circuitBreaker.state === CircuitState.OPEN) {
            const now = Date.now();
            const timeSinceLastFailure = now - this.circuitBreaker.lastFailureTime;
            
            if (timeSinceLastFailure > this.circuitBreaker.resetTimeout) {
                // Try half-open state
                this.circuitBreaker.state = CircuitState.HALF_OPEN;
                this.circuitBreaker.halfOpenRequests = 0;
                this.log('Circuit breaker entering half-open state');
            } else {
                throw new Error('Circuit breaker is OPEN - connection rejected');
            }
        }
        
        if (this.circuitBreaker.state === CircuitState.HALF_OPEN) {
            if (this.circuitBreaker.halfOpenRequests >= this.circuitBreaker.maxHalfOpenRequests) {
                throw new Error('Circuit breaker half-open request limit reached');
            }
            this.circuitBreaker.halfOpenRequests++;
        }
        
        try {
            await this.connectToServer();
            // Success - reset circuit breaker
            this.circuitBreaker.state = CircuitState.CLOSED;
            this.circuitBreaker.failureCount = 0;
            this.circuitBreaker.lastFailureTime = null;
            this.health.lastSuccessfulConnection = Date.now();
            this.reconnectAttempts = 0;
            this.log('Connection successful - circuit breaker closed');
        } catch (error) {
            this.handleConnectionFailure(error);
            throw error;
        }
    }

    /**
     * Handle connection failure with circuit breaker
     */
    handleConnectionFailure(error) {
        this.circuitBreaker.failureCount++;
        this.circuitBreaker.lastFailureTime = Date.now();
        
        if (this.circuitBreaker.failureCount >= this.circuitBreaker.failureThreshold) {
            this.circuitBreaker.state = CircuitState.OPEN;
            this.log(`Circuit breaker OPEN after ${this.circuitBreaker.failureCount} failures`);
            this.emit('circuit-breaker-open');
        }
        
        this.log(`Connection failure ${this.circuitBreaker.failureCount}/${this.circuitBreaker.failureThreshold}: ${error.message}`);
    }

    /**
     * Connect to Decision Tapestry server with timeout
     */
    async connectToServer() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (this.ws) {
                    this.ws.terminate();
                }
                reject(new Error('Connection timeout'));
            }, this.messageTimeout);
            
            try {
                this.ws = new WebSocket(this.serverUrl);
                
                this.ws.on('open', () => {
                    clearTimeout(timeout);
                    this.connected = true;
                    this.log('Connected to server');
                    this.emit('connected');
                    
                    // Process queued messages
                    this.processMessageQueue();
                    
                    resolve();
                });
                
                this.ws.on('close', (code, reason) => {
                    clearTimeout(timeout);
                    this.connected = false;
                    this.log(`Connection closed: ${code} - ${reason}`);
                    this.emit('disconnected', { code, reason });
                    
                    // Schedule reconnect with exponential backoff
                    this.scheduleReconnect();
                });
                
                this.ws.on('error', (error) => {
                    clearTimeout(timeout);
                    this.connected = false;
                    this.log(`WebSocket error: ${error.message}`);
                    this.emit('error', error);
                    reject(error);
                });
                
                this.ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data);
                        this.handleMessage(message);
                        this.health.lastSuccessfulMessage = Date.now();
                    } catch (error) {
                        this.log(`Failed to parse message: ${error.message}`);
                        this.emit('message-parse-error', error);
                    }
                });
                
                // WebSocket ping/pong for connection health
                this.ws.on('ping', () => {
                    this.ws.pong();
                });
                
            } catch (err) {
                clearTimeout(timeout);
                reject(err);
            }
        });
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.log(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
            this.emit('max-reconnect-attempts');
            return;
        }
        
        // Calculate exponential backoff delay
        const delay = Math.min(
            this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
            this.maxReconnectDelay
        );
        
        this.reconnectAttempts++;
        this.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => this.reconnect(), delay);
    }

    /**
     * Reconnect to server
     */
    async reconnect() {
        if (this.connected) return;
        
        try {
            await this.connectWithCircuitBreaker();
            await this.registerAgent();
            this.emit('reconnected');
        } catch (error) {
            this.log(`Reconnection failed: ${error.message}`);
            // scheduleReconnect will be called by connection close handler
        }
    }

    /**
     * Register agent with server
     */
    async registerAgent() {
        const message = {
            type: 'agent_register',
            agentId: this.agentId,
            decisionId: this.decisionId, // Include decisionId in registration
            timestamp: new Date().toISOString(),
            messageId: this.generateMessageId()
        };
        
        await this.sendMessage(message, { priority: 'high' });
    }

    /**
     * Start heartbeat with adaptive interval
     */
    startHeartbeat() {
        let missedHeartbeats = 0;
        const maxMissedHeartbeats = 3;
        
        this.heartbeatInterval = setInterval(async () => {
            if (this.connected) {
                try {
                    await this.sendMessage({
                        type: 'agent_heartbeat',
                        agentId: this.agentId,
                        timestamp: new Date().toISOString(),
                        health: this.getHealthMetrics(),
                        messageId: this.generateMessageId()
                    }, { timeout: 5000 });
                    
                    missedHeartbeats = 0;
                } catch (error) {
                    missedHeartbeats++;
                    this.log(`Heartbeat failed (${missedHeartbeats}/${maxMissedHeartbeats})`);
                    
                    if (missedHeartbeats >= maxMissedHeartbeats) {
                        this.log('Too many missed heartbeats - forcing reconnection');
                        this.ws?.terminate();
                        missedHeartbeats = 0;
                    }
                }
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        setInterval(() => {
            const health = this.getHealthMetrics();
            this.emit('health-update', health);
            
            // Check message queue health
            if (this.messageQueue.length > this.maxQueueSize * 0.8) {
                this.log(`Warning: Message queue at ${this.messageQueue.length}/${this.maxQueueSize}`);
                this.emit('queue-warning', { size: this.messageQueue.length });
            }
            
            // Clean up old deduplication entries
            this.cleanupDeduplicationMap();
        }, 10000); // Every 10 seconds
    }

    /**
     * Send message with retry and timeout
     */
    async sendMessage(message, options = {}) {
        const messageWithId = {
            ...message,
            messageId: message.messageId || this.generateMessageId()
        };
        
        // Check for duplicate message
        if (this.isDuplicateMessage(messageWithId.messageId)) {
            this.log(`Duplicate message detected: ${messageWithId.messageId}`);
            return;
        }
        
        // Queue message if not connected or circuit breaker is open
        if (!this.connected || this.circuitBreaker.state === CircuitState.OPEN) {
            this.queueMessage(messageWithId, options);
            return;
        }
        
        // Try to send with timeout
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.health.totalMessagesFailed++;
                reject(new Error('Message send timeout'));
            }, options.timeout || this.messageTimeout);
            
            try {
                this.ws.send(JSON.stringify(messageWithId), (error) => {
                    clearTimeout(timeout);
                    
                    if (error) {
                        this.health.totalMessagesFailed++;
                        this.handleMessageFailure(messageWithId, options, error);
                        reject(error);
                    } else {
                        this.health.totalMessagesSent++;
                        this.sentMessages.set(messageWithId.messageId, Date.now());
                        resolve();
                    }
                });
            } catch (error) {
                clearTimeout(timeout);
                this.health.totalMessagesFailed++;
                this.handleMessageFailure(messageWithId, options, error);
                reject(error);
            }
        });
    }

    /**
     * Handle message send failure
     */
    handleMessageFailure(message, options, error) {
        this.log(`Failed to send message: ${error.message}`);
        
        // Increment circuit breaker failure count for critical messages
        if (options.priority === 'high') {
            this.circuitBreaker.failureCount++;
            if (this.circuitBreaker.failureCount >= this.circuitBreaker.failureThreshold) {
                this.circuitBreaker.state = CircuitState.OPEN;
                this.circuitBreaker.lastFailureTime = Date.now();
            }
        }
        
        // Queue message for retry
        this.queueMessage(message, options);
    }

    /**
     * Queue message with priority
     */
    queueMessage(message, options = {}) {
        // Check queue size limit
        if (this.messageQueue.length >= this.maxQueueSize) {
            // Remove oldest low-priority message
            const lowPriorityIndex = this.messageQueue.findIndex(
                item => item.options.priority !== 'high'
            );
            if (lowPriorityIndex !== -1) {
                this.messageQueue.splice(lowPriorityIndex, 1);
                this.log('Dropped low-priority message due to queue size limit');
            } else {
                this.log('Warning: Message queue full, dropping new message');
                return;
            }
        }
        
        this.messageQueue.push({ message, options, timestamp: Date.now() });
        
        // Sort by priority
        this.messageQueue.sort((a, b) => {
            const priorityWeight = { high: 2, normal: 1, low: 0 };
            const aPriority = priorityWeight[a.options.priority || 'normal'];
            const bPriority = priorityWeight[b.options.priority || 'normal'];
            return bPriority - aPriority;
        });
    }

    /**
     * Process queued messages with rate limiting
     */
    async processMessageQueue() {
        const maxBatchSize = 10;
        const batchDelay = 100; // ms between batches
        
        while (this.messageQueue.length > 0 && this.connected) {
            const batch = this.messageQueue.splice(0, maxBatchSize);
            
            for (const { message, options } of batch) {
                try {
                    await this.sendMessage(message, options);
                } catch (error) {
                    // Message will be re-queued by sendMessage
                    this.log(`Failed to send queued message: ${error.message}`);
                }
            }
            
            // Rate limiting between batches
            if (this.messageQueue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, batchDelay));
            }
        }
    }

    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `${this.agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check if message is duplicate
     */
    isDuplicateMessage(messageId) {
        return this.sentMessages.has(messageId);
    }

    /**
     * Clean up old entries from deduplication map
     */
    cleanupDeduplicationMap() {
        const now = Date.now();
        const cutoff = now - this.messageDeduplicationWindow;
        
        for (const [messageId, timestamp] of this.sentMessages) {
            if (timestamp < cutoff) {
                this.sentMessages.delete(messageId);
            }
        }
    }

    /**
     * Get health metrics
     */
    getHealthMetrics() {
        const now = Date.now();
        const uptime = now - this.health.startTime;
        const successRate = this.health.totalMessagesSent > 0
            ? (this.health.totalMessagesSent / (this.health.totalMessagesSent + this.health.totalMessagesFailed))
            : 0;
        
        return {
            connected: this.connected,
            uptime: uptime,
            circuitBreakerState: this.circuitBreaker.state,
            queueSize: this.messageQueue.length,
            totalMessagesSent: this.health.totalMessagesSent,
            totalMessagesFailed: this.health.totalMessagesFailed,
            successRate: successRate,
            lastSuccessfulConnection: this.health.lastSuccessfulConnection,
            lastSuccessfulMessage: this.health.lastSuccessfulMessage,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    /**
     * Broadcast status with resilience info
     */
    async broadcastStatus(statusData) {
        const message = {
            type: 'agent_status',
            agentId: this.agentId,
            ...statusData,
            health: this.getHealthMetrics(),
            timestamp: new Date().toISOString()
        };
        
        await this.sendMessage(message, { priority: 'normal' });
        this.logStatus(statusData);
    }

    /**
     * Send activity update with retry
     */
    async sendActivityUpdate(state, decisionId, taskDescription) {
        const maxRetries = 3;
        let retries = 0;
        
        while (retries < maxRetries) {
            try {
                const response = await fetch('http://localhost:8080/api/activity', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        agentId: this.agentId,
                        state: state,
                        decisionId: decisionId,
                        taskDescription: taskDescription
                    }),
                    signal: AbortSignal.timeout(5000) // 5 second timeout
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                this.log(`Activity sent: ${state} - ${taskDescription}`);
                return;
            } catch (error) {
                retries++;
                this.log(`Failed to send activity update (attempt ${retries}/${maxRetries}): ${error.message}`);
                
                if (retries < maxRetries) {
                    // Wait before retry with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
                }
            }
        }
        
        // Failed after all retries - emit event
        this.emit('activity-update-failed', { state, decisionId, taskDescription });
    }

    /**
     * Handle incoming messages
     */
    handleMessage(message) {
        switch (message.type) {
            case 'agent_command':
                this.handleAgentCommand(message);
                break;
            case 'coordinator_update':
                this.handleCoordinatorUpdate(message);
                break;
            case 'server_notification':
                this.handleServerNotification(message);
                break;
            case 'health_check':
                this.handleHealthCheck(message);
                break;
            default:
                this.log(`Unknown message type: ${message.type}`);
        }
    }

    /**
     * Handle health check request
     */
    async handleHealthCheck(message) {
        const health = this.getHealthMetrics();
        await this.sendMessage({
            type: 'health_response',
            agentId: this.agentId,
            requestId: message.requestId,
            health: health,
            timestamp: new Date().toISOString()
        }, { priority: 'high' });
    }

    /**
     * Handle agent command from coordinator
     */
    handleAgentCommand(message) {
        this.log(`Received command: ${message.command}`);
        this.emit('command', message);
        
        switch (message.command) {
            case 'pause':
                this.log('Agent paused by coordinator');
                this.emit('paused');
                break;
            case 'resume':
                this.log('Agent resumed by coordinator');
                this.emit('resumed');
                break;
            case 'stop':
                this.log('Agent stopped by coordinator');
                this.cleanup();
                process.exit(0);
                break;
            case 'health_check':
                this.handleHealthCheck(message);
                break;
            default:
                this.log(`Unknown command: ${message.command}`);
        }
    }

    /**
     * Handle coordinator update
     */
    handleCoordinatorUpdate(message) {
        this.log(`Coordinator update: ${message.message}`);
        this.emit('coordinator-update', message);
    }

    /**
     * Handle server notification
     */
    handleServerNotification(message) {
        this.log(`Server notification: ${message.message}`);
        this.emit('server-notification', message);
    }

    /**
     * Log status in CLI-friendly format
     */
    logStatus(statusData) {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [Agent-${this.agentId}]`;
        
        console.log(`${prefix} ${statusData.message}`);
        
        if (statusData.currentTask) {
            console.log(`${prefix} Current Task: ${statusData.currentTask}`);
        }
        
        if (statusData.status) {
            console.log(`${prefix} Status: ${statusData.status}`);
        }
    }

    /**
     * Log message with severity
     */
    log(message, severity = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [Agent-${this.agentId}] [${severity.toUpperCase()}]`;
        console.log(`${prefix} ${message}`);
        
        // Emit log event for external monitoring
        this.emit('log', { message, severity, timestamp });
    }

    /**
     * Cleanup messaging with graceful shutdown
     */
    async cleanup() {
        this.log('Starting graceful shutdown');
        
        // Stop accepting new messages
        this.connected = false;
        
        // Try to flush remaining messages
        if (this.messageQueue.length > 0) {
            this.log(`Attempting to flush ${this.messageQueue.length} queued messages`);
            try {
                await this.processMessageQueue();
            } catch (error) {
                this.log(`Failed to flush message queue: ${error.message}`);
            }
        }
        
        // Clear intervals
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        // Close WebSocket
        if (this.ws) {
            this.ws.close(1000, 'Agent shutdown');
        }
        
        this.log('Messaging cleanup completed');
        this.emit('cleanup-complete');
    }

    /**
     * Get messaging status
     */
    getStatus() {
        return {
            connected: this.connected,
            serverUrl: this.serverUrl,
            queuedMessages: this.messageQueue.length,
            agentId: this.agentId,
            health: this.getHealthMetrics(),
            circuitBreaker: {
                state: this.circuitBreaker.state,
                failureCount: this.circuitBreaker.failureCount,
                lastFailureTime: this.circuitBreaker.lastFailureTime
            }
        };
    }
}