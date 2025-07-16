/**
 * Agent Health Monitoring System
 * Tracks agent health, performance metrics, and provides alerting
 */

import EventEmitter from 'events';
import { createCircuitBreaker } from './circuit-breaker.mjs';

export class AgentHealthMonitor extends EventEmitter {
    constructor(agentId, options = {}) {
        super();
        this.agentId = agentId;
        
        // Configuration
        this.checkInterval = options.checkInterval || 10000; // 10 seconds
        this.unhealthyThreshold = options.unhealthyThreshold || 3;
        this.degradedThreshold = options.degradedThreshold || 2;
        this.recoveryThreshold = options.recoveryThreshold || 2;
        
        // Health states
        this.HealthState = {
            HEALTHY: 'healthy',
            DEGRADED: 'degraded',
            UNHEALTHY: 'unhealthy',
            CRITICAL: 'critical'
        };
        
        // Current state
        this.state = this.HealthState.HEALTHY;
        this.consecutiveFailures = 0;
        this.consecutiveSuccesses = 0;
        
        // Metrics
        this.metrics = {
            startTime: Date.now(),
            lastCheckTime: null,
            totalChecks: 0,
            failedChecks: 0,
            successfulChecks: 0,
            averageResponseTime: 0,
            maxResponseTime: 0,
            minResponseTime: Infinity,
            errorRate: 0,
            uptime: 0,
            lastError: null,
            stateHistory: []
        };
        
        // Performance tracking
        this.performanceWindow = [];
        this.performanceWindowSize = options.performanceWindowSize || 100;
        
        // Resource tracking
        this.resourceMetrics = {
            memoryUsage: [],
            cpuUsage: [],
            messageQueueSize: [],
            activeConnections: []
        };
        this.resourceWindowSize = options.resourceWindowSize || 50;
        
        // Circuit breakers for different subsystems
        this.circuitBreakers = {
            messaging: createCircuitBreaker('standard', { name: 'Messaging' }),
            taskExecution: createCircuitBreaker('standard', { name: 'TaskExecution' }),
            coordination: createCircuitBreaker('sensitive', { name: 'Coordination' })
        };
        
        // Health check functions
        this.healthChecks = new Map();
        this.registerDefaultHealthChecks();
        
        // Alerting
        this.alerts = [];
        this.maxAlerts = options.maxAlerts || 100;
        this.alertThresholds = {
            errorRate: options.errorRateThreshold || 0.5,
            responseTime: options.responseTimeThreshold || 5000,
            memoryUsage: options.memoryUsageThreshold || 500 * 1024 * 1024, // 500MB
            queueSize: options.queueSizeThreshold || 1000
        };
        
        // Start monitoring
        this.intervalId = null;
        if (options.autoStart !== false) {
            this.start();
        }
    }

    /**
     * Register default health checks
     */
    registerDefaultHealthChecks() {
        // Basic connectivity check
        this.registerHealthCheck('connectivity', async () => {
            // This would be implemented by the agent
            return { healthy: true, message: 'Connected' };
        });
        
        // Memory usage check
        this.registerHealthCheck('memory', async () => {
            const usage = process.memoryUsage();
            const heapUsed = usage.heapUsed;
            const healthy = heapUsed < this.alertThresholds.memoryUsage;
            
            return {
                healthy,
                message: `Heap: ${Math.round(heapUsed / 1024 / 1024)}MB`,
                metric: heapUsed
            };
        });
        
        // Response time check
        this.registerHealthCheck('performance', async () => {
            const avgResponseTime = this.metrics.averageResponseTime;
            const healthy = avgResponseTime < this.alertThresholds.responseTime;
            
            return {
                healthy,
                message: `Avg response: ${Math.round(avgResponseTime)}ms`,
                metric: avgResponseTime
            };
        });
    }

    /**
     * Register a health check
     */
    registerHealthCheck(name, checkFn) {
        this.healthChecks.set(name, checkFn);
    }

    /**
     * Start health monitoring
     */
    start() {
        if (this.intervalId) return;
        
        this.intervalId = setInterval(() => {
            this.performHealthCheck();
        }, this.checkInterval);
        
        // Perform initial check
        this.performHealthCheck();
        
        this.emit('started');
    }

    /**
     * Stop health monitoring
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.emit('stopped');
    }

    /**
     * Perform health check
     */
    async performHealthCheck() {
        const checkStart = Date.now();
        const results = new Map();
        let overallHealthy = true;
        
        this.metrics.totalChecks++;
        
        // Run all health checks
        for (const [name, checkFn] of this.healthChecks) {
            try {
                const result = await this.executeHealthCheck(name, checkFn);
                results.set(name, result);
                
                if (!result.healthy) {
                    overallHealthy = false;
                }
            } catch (error) {
                results.set(name, {
                    healthy: false,
                    message: error.message,
                    error: true
                });
                overallHealthy = false;
            }
        }
        
        // Update metrics
        const checkDuration = Date.now() - checkStart;
        this.updatePerformanceMetrics(checkDuration);
        
        // Update health state
        if (overallHealthy) {
            this.handleHealthyCheck();
        } else {
            this.handleUnhealthyCheck(results);
        }
        
        this.metrics.lastCheckTime = Date.now();
        
        // Emit check results
        this.emit('health-check', {
            healthy: overallHealthy,
            state: this.state,
            results: Object.fromEntries(results),
            duration: checkDuration
        });
        
        return { healthy: overallHealthy, results };
    }

    /**
     * Execute individual health check with circuit breaker
     */
    async executeHealthCheck(name, checkFn) {
        const circuitBreaker = this.circuitBreakers.messaging; // Use appropriate circuit breaker
        
        try {
            return await circuitBreaker.execute(
                () => checkFn(),
                () => ({ healthy: false, message: 'Circuit breaker open' })
            );
        } catch (error) {
            return {
                healthy: false,
                message: error.message,
                error: true
            };
        }
    }

    /**
     * Handle healthy check result
     */
    handleHealthyCheck() {
        this.consecutiveFailures = 0;
        this.consecutiveSuccesses++;
        this.metrics.successfulChecks++;
        
        // Check for recovery
        if (this.state !== this.HealthState.HEALTHY) {
            if (this.consecutiveSuccesses >= this.recoveryThreshold) {
                this.changeState(this.HealthState.HEALTHY);
                this.createAlert('recovery', 'Agent recovered to healthy state');
            }
        }
    }

    /**
     * Handle unhealthy check result
     */
    handleUnhealthyCheck(results) {
        this.consecutiveSuccesses = 0;
        this.consecutiveFailures++;
        this.metrics.failedChecks++;
        this.metrics.lastError = new Date().toISOString();
        
        // Determine new state based on consecutive failures
        if (this.consecutiveFailures >= this.unhealthyThreshold * 2) {
            this.changeState(this.HealthState.CRITICAL);
        } else if (this.consecutiveFailures >= this.unhealthyThreshold) {
            this.changeState(this.HealthState.UNHEALTHY);
        } else if (this.consecutiveFailures >= this.degradedThreshold) {
            this.changeState(this.HealthState.DEGRADED);
        }
        
        // Create alerts for specific failures
        for (const [check, result] of results) {
            if (!result.healthy) {
                this.createAlert('health-check-failed', `${check}: ${result.message}`, {
                    check,
                    result
                });
            }
        }
    }

    /**
     * Change health state
     */
    changeState(newState) {
        if (this.state === newState) return;
        
        const oldState = this.state;
        this.state = newState;
        
        const stateChange = {
            from: oldState,
            to: newState,
            timestamp: Date.now()
        };
        
        this.metrics.stateHistory.push(stateChange);
        
        // Keep only last 100 state changes
        if (this.metrics.stateHistory.length > 100) {
            this.metrics.stateHistory = this.metrics.stateHistory.slice(-100);
        }
        
        this.emit('state-change', stateChange);
        
        // Create alert for state change
        if (newState !== this.HealthState.HEALTHY) {
            this.createAlert('state-change', `Health state changed to ${newState}`, {
                oldState,
                newState
            });
        }
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(duration) {
        this.performanceWindow.push({
            timestamp: Date.now(),
            duration
        });
        
        // Maintain window size
        if (this.performanceWindow.length > this.performanceWindowSize) {
            this.performanceWindow.shift();
        }
        
        // Calculate metrics
        const durations = this.performanceWindow.map(p => p.duration);
        this.metrics.averageResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
        this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, duration);
        this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, duration);
        
        // Calculate error rate
        this.metrics.errorRate = this.metrics.failedChecks / this.metrics.totalChecks;
        
        // Check performance thresholds
        if (this.metrics.averageResponseTime > this.alertThresholds.responseTime) {
            this.createAlert('performance', `High average response time: ${Math.round(this.metrics.averageResponseTime)}ms`);
        }
    }

    /**
     * Update resource metrics
     */
    updateResourceMetrics(resources) {
        const timestamp = Date.now();
        
        // Memory usage
        if (resources.memoryUsage !== undefined) {
            this.resourceMetrics.memoryUsage.push({
                timestamp,
                value: resources.memoryUsage
            });
            
            if (resources.memoryUsage > this.alertThresholds.memoryUsage) {
                this.createAlert('resource', `High memory usage: ${Math.round(resources.memoryUsage / 1024 / 1024)}MB`);
            }
        }
        
        // CPU usage
        if (resources.cpuUsage !== undefined) {
            this.resourceMetrics.cpuUsage.push({
                timestamp,
                value: resources.cpuUsage
            });
        }
        
        // Message queue size
        if (resources.queueSize !== undefined) {
            this.resourceMetrics.messageQueueSize.push({
                timestamp,
                value: resources.queueSize
            });
            
            if (resources.queueSize > this.alertThresholds.queueSize) {
                this.createAlert('queue', `High message queue size: ${resources.queueSize}`);
            }
        }
        
        // Maintain window sizes
        for (const metric of Object.values(this.resourceMetrics)) {
            if (metric.length > this.resourceWindowSize) {
                metric.shift();
            }
        }
    }

    /**
     * Create alert
     */
    createAlert(type, message, details = {}) {
        const alert = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type,
            message,
            agentId: this.agentId,
            state: this.state,
            details
        };
        
        this.alerts.push(alert);
        
        // Maintain alert limit
        if (this.alerts.length > this.maxAlerts) {
            this.alerts = this.alerts.slice(-this.maxAlerts);
        }
        
        this.emit('alert', alert);
        
        // Log critical alerts
        if (this.state === this.HealthState.CRITICAL || type === 'critical') {
            console.error(`[CRITICAL ALERT] [${this.agentId}] ${message}`);
        }
    }

    /**
     * Get current health status
     */
    getStatus() {
        const now = Date.now();
        const uptime = now - this.metrics.startTime;
        
        return {
            agentId: this.agentId,
            state: this.state,
            healthy: this.state === this.HealthState.HEALTHY,
            consecutiveFailures: this.consecutiveFailures,
            consecutiveSuccesses: this.consecutiveSuccesses,
            metrics: {
                ...this.metrics,
                uptime,
                uptimePercentage: this.metrics.successfulChecks / this.metrics.totalChecks * 100
            },
            circuitBreakers: Object.entries(this.circuitBreakers).reduce((acc, [name, cb]) => {
                acc[name] = cb.getStatus();
                return acc;
            }, {}),
            recentAlerts: this.alerts.slice(-10),
            resourceMetrics: this.getResourceSummary()
        };
    }

    /**
     * Get resource usage summary
     */
    getResourceSummary() {
        const summary = {};
        
        for (const [name, metrics] of Object.entries(this.resourceMetrics)) {
            if (metrics.length === 0) continue;
            
            const values = metrics.map(m => m.value);
            summary[name] = {
                current: values[values.length - 1],
                average: values.reduce((a, b) => a + b, 0) / values.length,
                max: Math.max(...values),
                min: Math.min(...values)
            };
        }
        
        return summary;
    }

    /**
     * Get health report
     */
    async getHealthReport() {
        const checkResults = await this.performHealthCheck();
        const status = this.getStatus();
        
        return {
            summary: {
                healthy: checkResults.healthy,
                state: this.state,
                message: this.getHealthMessage()
            },
            status,
            checks: checkResults.results,
            recommendations: this.getRecommendations()
        };
    }

    /**
     * Get health message
     */
    getHealthMessage() {
        switch (this.state) {
            case this.HealthState.HEALTHY:
                return 'Agent is operating normally';
            case this.HealthState.DEGRADED:
                return 'Agent is experiencing minor issues';
            case this.HealthState.UNHEALTHY:
                return 'Agent is experiencing significant issues';
            case this.HealthState.CRITICAL:
                return 'Agent is in critical condition and may fail';
            default:
                return 'Unknown health state';
        }
    }

    /**
     * Get recommendations based on current state
     */
    getRecommendations() {
        const recommendations = [];
        
        if (this.metrics.errorRate > 0.3) {
            recommendations.push('High error rate detected - check logs for recurring issues');
        }
        
        if (this.metrics.averageResponseTime > this.alertThresholds.responseTime * 0.8) {
            recommendations.push('Response times approaching threshold - consider scaling or optimization');
        }
        
        const memoryUsage = this.getResourceSummary().memoryUsage;
        if (memoryUsage && memoryUsage.average > this.alertThresholds.memoryUsage * 0.8) {
            recommendations.push('High memory usage - check for memory leaks');
        }
        
        // Check circuit breakers
        for (const [name, cb] of Object.entries(this.circuitBreakers)) {
            const status = cb.getStatus();
            if (status.state !== 'closed') {
                recommendations.push(`${name} circuit breaker is ${status.state} - investigate failures`);
            }
        }
        
        return recommendations;
    }

    /**
     * Reset health monitor
     */
    reset() {
        this.state = this.HealthState.HEALTHY;
        this.consecutiveFailures = 0;
        this.consecutiveSuccesses = 0;
        this.metrics = {
            startTime: Date.now(),
            lastCheckTime: null,
            totalChecks: 0,
            failedChecks: 0,
            successfulChecks: 0,
            averageResponseTime: 0,
            maxResponseTime: 0,
            minResponseTime: Infinity,
            errorRate: 0,
            uptime: 0,
            lastError: null,
            stateHistory: []
        };
        this.performanceWindow = [];
        this.resourceMetrics = {
            memoryUsage: [],
            cpuUsage: [],
            messageQueueSize: [],
            activeConnections: []
        };
        this.alerts = [];
        
        // Reset circuit breakers
        for (const cb of Object.values(this.circuitBreakers)) {
            cb.reset();
        }
        
        this.emit('reset');
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.stop();
        this.removeAllListeners();
    }
}