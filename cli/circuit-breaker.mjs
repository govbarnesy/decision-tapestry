/**
 * Circuit Breaker Pattern Implementation
 * Provides fault tolerance for distributed agent operations
 */

import EventEmitter from 'events';

export const CircuitState = {
    CLOSED: 'closed',      // Normal operation, requests allowed
    OPEN: 'open',          // Failure threshold exceeded, requests blocked
    HALF_OPEN: 'half_open' // Testing recovery, limited requests allowed
};

export class CircuitBreaker extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Configuration
        this.name = options.name || 'CircuitBreaker';
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 60000; // 60 seconds
        this.successThreshold = options.successThreshold || 2;
        this.timeout = options.timeout || 10000; // 10 seconds per request
        this.volumeThreshold = options.volumeThreshold || 10; // Min requests before opening
        this.errorFilter = options.errorFilter || (() => true); // Which errors count as failures
        
        // State
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.lastFailureTime = null;
        this.halfOpenRequests = 0;
        this.resetTimer = null;
        
        // Metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rejectedRequests: 0,
            timeouts: 0,
            lastStateChange: Date.now(),
            stateChanges: []
        };
        
        // Rolling window for error rate calculation
        this.requestWindow = [];
        this.windowSize = options.windowSize || 60000; // 1 minute window
    }

    /**
     * Execute function with circuit breaker protection
     */
    async execute(fn, fallback) {
        this.metrics.totalRequests++;
        
        // Check if circuit is open
        if (this.state === CircuitState.OPEN) {
            const canTryHalfOpen = this.shouldTryHalfOpen();
            if (!canTryHalfOpen) {
                this.metrics.rejectedRequests++;
                this.emit('rejected', { state: this.state });
                
                if (fallback) {
                    return fallback();
                }
                throw new Error(`Circuit breaker is OPEN for ${this.name}`);
            }
        }

        // Record request start
        const requestStart = Date.now();
        this.addRequestToWindow(requestStart, null);

        try {
            // Execute with timeout
            const result = await this.executeWithTimeout(fn);
            
            // Record success
            this.onSuccess();
            this.updateRequestInWindow(requestStart, true);
            
            return result;
        } catch (error) {
            // Check if error should trigger circuit breaker
            if (this.errorFilter(error)) {
                this.onFailure();
                this.updateRequestInWindow(requestStart, false);
            }
            
            // Try fallback if available
            if (fallback && this.state === CircuitState.OPEN) {
                return fallback();
            }
            
            throw error;
        }
    }

    /**
     * Execute function with timeout
     */
    async executeWithTimeout(fn) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.metrics.timeouts++;
                reject(new Error(`Operation timed out after ${this.timeout}ms`));
            }, this.timeout);

            fn().then(result => {
                clearTimeout(timer);
                resolve(result);
            }).catch(error => {
                clearTimeout(timer);
                reject(error);
            });
        });
    }

    /**
     * Handle successful execution
     */
    onSuccess() {
        this.metrics.successfulRequests++;
        
        switch (this.state) {
            case CircuitState.HALF_OPEN:
                this.successes++;
                if (this.successes >= this.successThreshold) {
                    this.close();
                }
                break;
                
            case CircuitState.CLOSED:
                this.failures = 0;
                break;
        }
        
        this.emit('success', { state: this.state });
    }

    /**
     * Handle failed execution
     */
    onFailure() {
        this.metrics.failedRequests++;
        this.failures++;
        this.lastFailureTime = Date.now();
        
        switch (this.state) {
            case CircuitState.HALF_OPEN:
                this.open();
                break;
                
            case CircuitState.CLOSED:
                if (this.shouldOpen()) {
                    this.open();
                }
                break;
        }
        
        this.emit('failure', { state: this.state, failures: this.failures });
    }

    /**
     * Check if circuit should open
     */
    shouldOpen() {
        // Check volume threshold
        const recentRequests = this.getRecentRequests();
        if (recentRequests.length < this.volumeThreshold) {
            return false;
        }
        
        // Check failure threshold
        if (this.failures >= this.failureThreshold) {
            // Calculate error rate
            const errorRate = this.calculateErrorRate();
            return errorRate > 0.5; // Open if more than 50% errors
        }
        
        return false;
    }

    /**
     * Check if should try half-open state
     */
    shouldTryHalfOpen() {
        const now = Date.now();
        const timeSinceLastFailure = now - this.lastFailureTime;
        
        if (timeSinceLastFailure >= this.resetTimeout) {
            this.halfOpen();
            return true;
        }
        
        return false;
    }

    /**
     * Open the circuit
     */
    open() {
        if (this.state === CircuitState.OPEN) return;
        
        this.changeState(CircuitState.OPEN);
        this.successes = 0;
        
        // Set timer to try half-open
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
        }
        
        this.resetTimer = setTimeout(() => {
            this.halfOpen();
        }, this.resetTimeout);
        
        this.emit('open', {
            failures: this.failures,
            lastFailureTime: this.lastFailureTime
        });
    }

    /**
     * Move to half-open state
     */
    halfOpen() {
        if (this.state === CircuitState.HALF_OPEN) return;
        
        this.changeState(CircuitState.HALF_OPEN);
        this.failures = 0;
        this.successes = 0;
        this.halfOpenRequests = 0;
        
        this.emit('half-open');
    }

    /**
     * Close the circuit
     */
    close() {
        if (this.state === CircuitState.CLOSED) return;
        
        this.changeState(CircuitState.CLOSED);
        this.failures = 0;
        this.successes = 0;
        
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
            this.resetTimer = null;
        }
        
        this.emit('close');
    }

    /**
     * Change state and record metrics
     */
    changeState(newState) {
        const oldState = this.state;
        this.state = newState;
        
        const stateChange = {
            from: oldState,
            to: newState,
            timestamp: Date.now()
        };
        
        this.metrics.lastStateChange = stateChange.timestamp;
        this.metrics.stateChanges.push(stateChange);
        
        // Keep only last 100 state changes
        if (this.metrics.stateChanges.length > 100) {
            this.metrics.stateChanges = this.metrics.stateChanges.slice(-100);
        }
        
        this.emit('state-change', stateChange);
    }

    /**
     * Add request to rolling window
     */
    addRequestToWindow(timestamp, success) {
        this.requestWindow.push({ timestamp, success });
        this.cleanupRequestWindow();
    }

    /**
     * Update request in window
     */
    updateRequestInWindow(timestamp, success) {
        const request = this.requestWindow.find(r => r.timestamp === timestamp);
        if (request) {
            request.success = success;
        }
    }

    /**
     * Get recent requests within window
     */
    getRecentRequests() {
        this.cleanupRequestWindow();
        return this.requestWindow;
    }

    /**
     * Clean up old requests from window
     */
    cleanupRequestWindow() {
        const cutoff = Date.now() - this.windowSize;
        this.requestWindow = this.requestWindow.filter(r => r.timestamp > cutoff);
    }

    /**
     * Calculate error rate in current window
     */
    calculateErrorRate() {
        const requests = this.getRecentRequests();
        if (requests.length === 0) return 0;
        
        const failures = requests.filter(r => r.success === false).length;
        return failures / requests.length;
    }

    /**
     * Force circuit to specific state (for testing/manual intervention)
     */
    forceState(state) {
        if (!Object.values(CircuitState).includes(state)) {
            throw new Error(`Invalid state: ${state}`);
        }
        
        this.changeState(state);
        this.failures = 0;
        this.successes = 0;
        
        this.emit('forced-state-change', { state });
    }

    /**
     * Reset circuit breaker
     */
    reset() {
        this.close();
        this.failures = 0;
        this.successes = 0;
        this.lastFailureTime = null;
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rejectedRequests: 0,
            timeouts: 0,
            lastStateChange: Date.now(),
            stateChanges: []
        };
        this.requestWindow = [];
        
        this.emit('reset');
    }

    /**
     * Get circuit breaker status
     */
    getStatus() {
        return {
            name: this.name,
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            lastFailureTime: this.lastFailureTime,
            metrics: {
                ...this.metrics,
                errorRate: this.calculateErrorRate(),
                recentRequests: this.getRecentRequests().length
            },
            config: {
                failureThreshold: this.failureThreshold,
                resetTimeout: this.resetTimeout,
                successThreshold: this.successThreshold,
                timeout: this.timeout,
                volumeThreshold: this.volumeThreshold
            }
        };
    }

    /**
     * Get health status
     */
    getHealth() {
        const status = this.getStatus();
        const errorRate = status.metrics.errorRate;
        
        return {
            healthy: this.state === CircuitState.CLOSED && errorRate < 0.1,
            status: this.state,
            errorRate: errorRate,
            recentFailures: this.failures,
            uptime: Date.now() - this.metrics.stateChanges[0]?.timestamp || 0
        };
    }
}

/**
 * Factory function to create circuit breaker with common presets
 */
export function createCircuitBreaker(type, customOptions = {}) {
    const presets = {
        standard: {
            failureThreshold: 5,
            resetTimeout: 60000,
            successThreshold: 2,
            timeout: 10000
        },
        sensitive: {
            failureThreshold: 3,
            resetTimeout: 30000,
            successThreshold: 1,
            timeout: 5000
        },
        resilient: {
            failureThreshold: 10,
            resetTimeout: 120000,
            successThreshold: 5,
            timeout: 30000
        },
        fast: {
            failureThreshold: 3,
            resetTimeout: 10000,
            successThreshold: 1,
            timeout: 3000
        }
    };
    
    const preset = presets[type] || presets.standard;
    return new CircuitBreaker({ ...preset, ...customOptions });
}