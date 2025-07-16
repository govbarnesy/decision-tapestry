/**
 * Enhanced Agent Framework with Resilience
 * Integrates circuit breakers, health monitoring, and resilient messaging
 */

import { AgentBase } from './agent-framework.mjs';
import { ResilientAgentMessaging } from './agent-messaging-resilient.mjs';
import { AgentHealthMonitor } from './agent-health-monitor.mjs';
import { CircuitBreaker, createCircuitBreaker } from './circuit-breaker.mjs';
import EventEmitter from 'events';

export class ResilientAgent extends AgentBase {
    constructor(agentId, decisionId, options = {}) {
        // Support both old and new constructor signatures
        if (typeof agentId === 'number' && !decisionId) {
            // Old signature: constructor(decisionId, options)
            super(agentId, options);
            this.agentId = `Agent-${agentId}`;
            options = decisionId || {};
        } else {
            // New signature: constructor(agentId, decisionId, options)
            super(agentId, decisionId);
            this.agentId = agentId;
            options = options || {};
        }
        
        // Context configuration
        this.enrichedContext = options.context || null;
        this.contextValidationEnabled = options.contextValidationEnabled !== false;
        this.minContextCompleteness = options.minContextCompleteness || 50; // Minimum 50% context completeness
        
        // Initialize resilient components
        this.messaging = new ResilientAgentMessaging(this.agentId, {
            decisionId: this.decisionId, // Pass decisionId to messaging
            serverUrl: options.serverUrl,
            maxReconnectAttempts: options.maxReconnectAttempts || 10,
            failureThreshold: options.failureThreshold || 5
        });
        
        this.healthMonitor = new AgentHealthMonitor(this.agentId, {
            checkInterval: options.healthCheckInterval || 10000,
            autoStart: false
        });
        
        // Circuit breakers for different operations
        this.circuitBreakers = {
            fileOps: createCircuitBreaker('standard', { name: 'FileOperations' }),
            gitOps: createCircuitBreaker('standard', { name: 'GitOperations' }),
            apiCalls: createCircuitBreaker('sensitive', { name: 'APICalls' }),
            taskExecution: createCircuitBreaker('resilient', { name: 'TaskExecution' })
        };
        
        // Enhanced state management
        this.state = {
            ...this.state,
            health: 'initializing',
            circuitBreakerStates: {},
            lastHealthCheck: null,
            recoveryAttempts: 0
        };
        
        // Setup required methods for health checks
        this.setupRequiredMethods();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Register health checks
        this.registerHealthChecks();
    }

    /**
     * Setup required methods for health checks
     */
    setupRequiredMethods() {
        // Set up fs for file system operations
        this.fs = {
            writeFile: async (path, data) => {
                const fs = await import('fs/promises');
                return fs.writeFile(path, data);
            },
            unlink: async (path) => {
                const fs = await import('fs/promises');
                return fs.unlink(path);
            }
        };
        
        // Set up exec for git operations
        this.exec = async (command, options = {}) => {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            return execAsync(command, { cwd: process.cwd(), ...options });
        };
    }
    
    /**
     * Setup event handlers for resilient components
     */
    setupEventHandlers() {
        // Messaging events
        this.messaging.on('connected', () => {
            this.log('Messaging connected');
            this.state.health = 'healthy';
        });
        
        this.messaging.on('disconnected', ({ code, reason }) => {
            this.log(`Messaging disconnected: ${code} - ${reason}`);
            this.state.health = 'degraded';
        });
        
        this.messaging.on('circuit-breaker-open', () => {
            this.log('Messaging circuit breaker opened - entering offline mode');
            this.handleOfflineMode();
        });
        
        this.messaging.on('max-reconnect-attempts', () => {
            this.log('Max reconnection attempts reached - agent will continue in offline mode');
            this.state.health = 'unhealthy';
        });
        
        // Health monitor events
        this.healthMonitor.on('state-change', ({ from, to }) => {
            this.log(`Health state changed: ${from} -> ${to}`);
            this.state.health = to;
            
            if (to === 'critical') {
                this.handleCriticalState();
            }
        });
        
        this.healthMonitor.on('alert', (alert) => {
            this.log(`Health alert: ${alert.type} - ${alert.message}`);
            this.handleHealthAlert(alert);
        });
        
        // Circuit breaker events
        Object.entries(this.circuitBreakers).forEach(([name, cb]) => {
            cb.on('state-change', ({ from, to }) => {
                this.log(`Circuit breaker ${name} changed: ${from} -> ${to}`);
                this.state.circuitBreakerStates[name] = to;
            });
            
            cb.on('rejected', () => {
                this.log(`Operation rejected by ${name} circuit breaker`);
            });
        });
    }

    /**
     * Register health checks
     */
    registerHealthChecks() {
        // File system health check
        this.healthMonitor.registerHealthCheck('filesystem', async () => {
            try {
                const testFile = `.agent-health-check-${this.agentId}.tmp`;
                await this.fs.writeFile(testFile, 'test');
                await this.fs.unlink(testFile);
                return { healthy: true, message: 'File system accessible' };
            } catch (error) {
                return { healthy: false, message: `File system error: ${error.message}` };
            }
        });
        
        // Git health check
        this.healthMonitor.registerHealthCheck('git', async () => {
            try {
                const { stdout } = await this.exec('git status --porcelain');
                return { healthy: true, message: 'Git repository accessible' };
            } catch (error) {
                return { healthy: false, message: `Git error: ${error.message}` };
            }
        });
        
        // Messaging health check
        this.healthMonitor.registerHealthCheck('messaging', async () => {
            const status = this.messaging.getStatus();
            const healthy = status.connected && status.circuitBreaker.state === 'closed';
            return {
                healthy,
                message: healthy ? 'Messaging connected' : 'Messaging issues detected',
                details: status
            };
        });
        
        // Memory health check (inherited from base)
        // Performance health check (inherited from base)
    }

    /**
     * Initialize agent with resilience
     */
    async initialize() {
        try {
            // Initialize messaging first
            await this.messaging.initialize();
            
            // Start health monitoring
            this.healthMonitor.start();
            
            // Call parent initialize
            await super.initialize();
            
            // Validate context if provided
            if (this.enrichedContext && this.contextValidationEnabled) {
                await this.validateContext();
            }
            
            // Update health metrics
            this.healthMonitor.updateResourceMetrics({
                memoryUsage: process.memoryUsage().heapUsed,
                queueSize: this.messaging.messageQueue.length
            });
            
            this.state.health = 'healthy';
            this.log('Agent initialized with resilience features');
        } catch (error) {
            this.log(`Initialization error: ${error.message}`);
            this.state.health = 'degraded';
            
            // Continue in degraded mode
            this.handleDegradedMode();
        }
    }

    /**
     * Validate enriched context
     */
    async validateContext() {
        if (!this.enrichedContext) {
            this.log('No enriched context to validate');
            return;
        }
        
        const validation = this.enrichedContext._metadata?.validation;
        if (!validation) {
            this.log('Context missing validation metadata', 'warn');
            return;
        }
        
        // Check completeness
        if (validation.completeness < this.minContextCompleteness) {
            this.log(`Context completeness (${validation.completeness}%) below minimum (${this.minContextCompleteness}%)`, 'warn');
            
            // Log specific warnings
            if (validation.warnings && validation.warnings.length > 0) {
                validation.warnings.forEach(warning => {
                    this.log(`Context warning: ${warning}`, 'warn');
                });
            }
            
            // Decide whether to proceed
            if (!validation.isValid) {
                throw new Error('Invalid context: ' + validation.missingElements.join(', '));
            }
        }
        
        this.log(`Context validated: ${validation.completeness}% complete`);
    }
    
    /**
     * Get context for task execution
     */
    getTaskContext(task) {
        // Merge enriched context with task-specific context
        const baseContext = {};
        
        if (!this.enrichedContext) {
            return baseContext;
        }
        
        return {
            ...baseContext,
            enriched: {
                metadata: this.enrichedContext.metadata,
                related: this.enrichedContext.related,
                collaboration: this.enrichedContext.collaboration,
                executionHints: this.enrichedContext.executionHints
            },
            contextQuality: this.enrichedContext._metadata?.validation?.completeness || 0
        };
    }

    /**
     * Execute task with circuit breaker protection
     */
    async executeTask(task) {
        const circuitBreaker = this.circuitBreakers.taskExecution;
        
        try {
            return await circuitBreaker.execute(
                async () => {
                    // Update activity
                    await this.updateActivity('working', task.description);
                    
                    // Get enriched context for task
                    const taskContext = this.getTaskContext(task);
                    
                    // Log context quality if available
                    if (taskContext.contextQuality !== undefined) {
                        this.log(`Executing with ${taskContext.contextQuality}% context completeness`);
                    }
                    
                    // Execute the actual task
                    const result = await super.executeTask(task);
                    
                    // Update health metrics
                    this.healthMonitor.updateResourceMetrics({
                        memoryUsage: process.memoryUsage().heapUsed,
                        queueSize: this.messaging.messageQueue.length
                    });
                    
                    return result;
                },
                async () => {
                    // Fallback for circuit breaker open
                    this.log(`Task execution circuit breaker open - queueing task: ${task.id}`);
                    await this.queueTaskForRetry(task);
                    return { success: false, reason: 'circuit_breaker_open' };
                }
            );
        } catch (error) {
            this.log(`Task execution failed: ${error.message}`);
            await this.handleTaskFailure(task, error);
            throw error;
        }
    }

    /**
     * Read file with circuit breaker
     */
    async readFile(filePath) {
        return this.circuitBreakers.fileOps.execute(
            () => super.readFile(filePath),
            () => {
                this.log(`File read circuit breaker open - using cache if available`);
                return this.getCachedFile(filePath) || '';
            }
        );
    }

    /**
     * Write file with circuit breaker
     */
    async writeFile(filePath, content) {
        return this.circuitBreakers.fileOps.execute(
            () => super.writeFile(filePath, content),
            () => {
                this.log(`File write circuit breaker open - queueing write operation`);
                this.queueFileWrite(filePath, content);
                return { queued: true };
            }
        );
    }

    /**
     * Execute command with circuit breaker
     */
    async exec(command, options = {}) {
        const isGitCommand = command.startsWith('git ');
        const circuitBreaker = isGitCommand ? this.circuitBreakers.gitOps : this.circuitBreakers.fileOps;
        
        return circuitBreaker.execute(
            () => super.exec(command, options),
            () => {
                this.log(`Command execution circuit breaker open: ${command}`);
                return { stdout: '', stderr: 'Circuit breaker open', failed: true };
            }
        );
    }

    /**
     * Update activity with resilient messaging
     */
    async updateActivity(state, description) {
        try {
            // Update local state
            this.state.currentActivity = { state, description };
            
            // Send via resilient messaging
            await this.messaging.sendActivityUpdate(state, this.decisionId, description);
            
            // Also send via WebSocket for redundancy
            await this.messaging.broadcastStatus({
                status: state,
                currentTask: description,
                decisionId: this.decisionId,
                health: this.healthMonitor.getStatus()
            });
        } catch (error) {
            this.log(`Failed to update activity: ${error.message}`);
            // Continue operation even if activity update fails
        }
    }

    /**
     * Handle offline mode
     */
    handleOfflineMode() {
        this.log('Entering offline mode - will queue operations and work locally');
        this.state.mode = 'offline';
        
        // Enable local caching
        this.enableLocalCache();
        
        // Queue operations for later sync
        this.enableOperationQueue();
    }

    /**
     * Handle degraded mode
     */
    handleDegradedMode() {
        this.log('Operating in degraded mode - some features may be limited');
        this.state.mode = 'degraded';
        
        // Reduce health check frequency
        this.healthMonitor.checkInterval = 30000; // 30 seconds
        
        // Enable graceful degradation
        this.enableGracefulDegradation();
    }

    /**
     * Handle critical state
     */
    async handleCriticalState() {
        this.log('Agent in critical state - attempting recovery');
        this.state.mode = 'critical';
        
        // Attempt recovery
        this.state.recoveryAttempts++;
        
        if (this.state.recoveryAttempts <= 3) {
            await this.attemptRecovery();
        } else {
            this.log('Max recovery attempts reached - shutting down gracefully');
            await this.gracefulShutdown();
        }
    }

    /**
     * Handle health alert
     */
    handleHealthAlert(alert) {
        // Log alert
        this.log(`Health alert: ${alert.type} - ${alert.message}`, 'warning');
        
        // Take action based on alert type
        switch (alert.type) {
            case 'memory':
                this.handleMemoryPressure();
                break;
            case 'queue':
                this.handleQueueBacklog();
                break;
            case 'performance':
                this.handlePerformanceIssue();
                break;
            case 'circuit-breaker':
                this.handleCircuitBreakerAlert(alert);
                break;
        }
    }

    /**
     * Attempt recovery from critical state
     */
    async attemptRecovery() {
        this.log('Attempting recovery...');
        
        try {
            // Reset circuit breakers
            Object.values(this.circuitBreakers).forEach(cb => {
                if (cb.state === 'open') {
                    cb.forceState('half_open');
                }
            });
            
            // Reconnect messaging
            await this.messaging.reconnect();
            
            // Clear queues if too large
            if (this.messaging.messageQueue.length > 500) {
                this.log('Clearing message queue due to size');
                this.messaging.messageQueue = [];
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            // Reset health monitor
            this.healthMonitor.reset();
            
            this.log('Recovery attempt completed');
            this.state.health = 'degraded';
            this.state.mode = 'normal';
        } catch (error) {
            this.log(`Recovery failed: ${error.message}`);
        }
    }

    /**
     * Handle memory pressure
     */
    handleMemoryPressure() {
        this.log('Handling memory pressure');
        
        // Clear caches
        this.clearCaches();
        
        // Reduce operation batch sizes
        this.batchSize = Math.max(1, Math.floor(this.batchSize / 2));
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
    }

    /**
     * Handle queue backlog
     */
    handleQueueBacklog() {
        this.log('Handling queue backlog');
        
        // Process high-priority messages only
        const highPriorityQueue = this.messaging.messageQueue.filter(
            item => item.options.priority === 'high'
        );
        
        if (highPriorityQueue.length < this.messaging.messageQueue.length) {
            this.log(`Dropping ${this.messaging.messageQueue.length - highPriorityQueue.length} low-priority messages`);
            this.messaging.messageQueue = highPriorityQueue;
        }
    }

    /**
     * Handle performance issue
     */
    handlePerformanceIssue() {
        this.log('Handling performance issue');
        
        // Reduce concurrent operations
        this.maxConcurrent = Math.max(1, Math.floor(this.maxConcurrent / 2));
        
        // Increase timeouts
        Object.values(this.circuitBreakers).forEach(cb => {
            cb.timeout = cb.timeout * 1.5;
        });
    }

    /**
     * Handle circuit breaker alert
     */
    handleCircuitBreakerAlert(alert) {
        const { details } = alert;
        this.log(`Circuit breaker alert: ${details.name} - ${details.state}`);
        
        // Adjust circuit breaker settings if needed
        if (details.failureRate > 0.8) {
            this.log('Very high failure rate - increasing reset timeout');
            details.circuitBreaker.resetTimeout = details.circuitBreaker.resetTimeout * 2;
        }
    }

    /**
     * Get comprehensive status including health
     */
    getStatus() {
        const baseStatus = super.getStatus ? super.getStatus() : {};
        const healthStatus = this.healthMonitor.getStatus();
        const messagingStatus = this.messaging.getStatus();
        
        return {
            ...baseStatus,
            health: {
                state: this.state.health,
                mode: this.state.mode || 'normal',
                monitor: healthStatus,
                messaging: messagingStatus,
                circuitBreakers: Object.entries(this.circuitBreakers).reduce((acc, [name, cb]) => {
                    acc[name] = cb.getStatus();
                    return acc;
                }, {}),
                recoveryAttempts: this.state.recoveryAttempts
            },
            context: {
                hasEnrichedContext: !!this.enrichedContext,
                contextQuality: this.enrichedContext?._metadata?.validation?.completeness || 0,
                validationEnabled: this.contextValidationEnabled
            }
        };
    }
    
    /**
     * Get health status for coordinator
     */
    async getHealthStatus() {
        const status = this.getStatus();
        return {
            healthy: status.health.state === 'healthy',
            state: status.health.state,
            details: status
        };
    }

    /**
     * Wait for current task to complete
     */
    async waitForCurrentTask(timeout = 5000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (this.state.currentActivity?.state !== 'working' || 
                    Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    /**
     * Save state for recovery
     */
    async saveState() {
        // Implementation for state saving if needed
        // For now, just log that we're saving state
        this.log('State saved for recovery');
    }

    /**
     * Graceful shutdown with cleanup
     */
    async gracefulShutdown() {
        this.log('Starting graceful shutdown');
        
        try {
            // Stop accepting new tasks
            this.state.shuttingDown = true;
            
            // Send idle state to clean up activity tracking
            await this.updateActivity('idle', 'Agent shutting down');
            
            // Complete current task if any
            if (this.state.currentActivity?.state === 'working') {
                this.log('Waiting for current task to complete...');
                await this.waitForCurrentTask();
            }
            
            // Flush message queue
            await this.messaging.cleanup();
            
            // Save state for recovery
            await this.saveState();
            
            // Stop health monitor
            this.healthMonitor.cleanup();
            
            // Call parent cleanup if it exists
            if (super.cleanup) {
                await super.cleanup();
            }
            
            this.log('Graceful shutdown completed');
        } catch (error) {
            this.log(`Error during shutdown: ${error.message}`);
        }
    }

    /**
     * Enhanced cleanup
     */
    async cleanup() {
        await this.gracefulShutdown();
    }
}

/**
 * Factory function to create resilient agents
 */
export function createResilientAgent(decisionId, options = {}) {
    return new ResilientAgent(decisionId, options);
}

/**
 * Create a team of resilient agents
 */
export function createResilientAgentTeam(decisions, options = {}) {
    return decisions.map(decision => createResilientAgent(decision.id, {
        ...options,
        teamMode: true,
        teamSize: decisions.length
    }));
}