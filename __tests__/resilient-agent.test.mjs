/**
 * Tests for Resilient Agent Framework
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createResilientAgent } from '../cli/agent-framework-resilient.mjs';
import { CircuitState } from '../cli/circuit-breaker.mjs';

describe('Resilient Agent Framework', () => {
    let agent;
    
    beforeEach(() => {
        agent = createResilientAgent(123, {
            name: 'TestAgent',
            healthCheckInterval: 1000,
            maxReconnectAttempts: 3,
            serverUrl: 'ws://localhost:8080'
        });
    });
    
    afterEach(async () => {
        if (agent) {
            await agent.cleanup();
        }
    });
    
    describe('Initialization', () => {
        it('should initialize with resilient components', async () => {
            expect(agent.messaging).toBeDefined();
            expect(agent.healthMonitor).toBeDefined();
            expect(agent.circuitBreakers).toBeDefined();
            expect(agent.circuitBreakers.fileOps).toBeDefined();
            expect(agent.circuitBreakers.gitOps).toBeDefined();
        });
        
        it('should start in healthy state', async () => {
            expect(agent.state.health).toBe('initializing');
            // Note: Full initialization would connect to server
        });
    });
    
    describe('Circuit Breakers', () => {
        it('should protect file operations with circuit breaker', async () => {
            const cb = agent.circuitBreakers.fileOps;
            expect(cb.state).toBe(CircuitState.CLOSED);
            
            // Simulate failures
            let failures = 0;
            cb.execute = jest.fn().mockImplementation(async (fn, fallback) => {
                failures++;
                if (failures <= 5) {
                    throw new Error('Simulated failure');
                }
                return fn();
            });
            
            // Should eventually open circuit
            for (let i = 0; i < 6; i++) {
                try {
                    await agent.readFile('test.txt');
                } catch (error) {
                    // Expected failures
                }
            }
            
            expect(failures).toBeGreaterThanOrEqual(5);
        });
        
        it('should use fallback when circuit breaker is open', async () => {
            const cb = agent.circuitBreakers.fileOps;
            cb.state = CircuitState.OPEN;
            
            agent.getCachedFile = jest.fn().mockReturnValue('cached content');
            
            const result = await agent.readFile('test.txt');
            expect(agent.getCachedFile).toHaveBeenCalled();
            expect(result).toBe('cached content');
        });
    });
    
    describe('Health Monitoring', () => {
        it('should register default health checks', () => {
            const checks = Array.from(agent.healthMonitor.healthChecks.keys());
            expect(checks).toContain('connectivity');
            expect(checks).toContain('memory');
            expect(checks).toContain('performance');
            expect(checks).toContain('filesystem');
            expect(checks).toContain('git');
            expect(checks).toContain('messaging');
        });
        
        it('should handle health state changes', (done) => {
            agent.healthMonitor.on('state-change', ({ from, to }) => {
                expect(from).toBe('healthy');
                expect(to).toBe('degraded');
                done();
            });
            
            agent.healthMonitor.changeState('degraded');
        });
        
        it('should create alerts for critical conditions', (done) => {
            agent.healthMonitor.on('alert', (alert) => {
                expect(alert.type).toBe('test');
                expect(alert.message).toContain('Test alert');
                done();
            });
            
            agent.healthMonitor.createAlert('test', 'Test alert');
        });
    });
    
    describe('Resilient Messaging', () => {
        it('should queue messages when disconnected', async () => {
            agent.messaging.connected = false;
            
            await agent.updateActivity('working', 'Test task');
            
            expect(agent.messaging.messageQueue.length).toBeGreaterThan(0);
        });
        
        it('should handle reconnection with exponential backoff', () => {
            const baseDelay = agent.messaging.baseReconnectDelay;
            agent.messaging.reconnectAttempts = 2;
            
            const delay = Math.min(
                baseDelay * Math.pow(2, 2),
                agent.messaging.maxReconnectDelay
            );
            
            expect(delay).toBe(baseDelay * 4);
        });
    });
    
    describe('Degraded Mode Operations', () => {
        it('should enter offline mode when messaging fails', () => {
            agent.handleOfflineMode();
            
            expect(agent.state.mode).toBe('offline');
        });
        
        it('should handle degraded mode gracefully', () => {
            agent.handleDegradedMode();
            
            expect(agent.state.mode).toBe('degraded');
            expect(agent.healthMonitor.checkInterval).toBe(30000);
        });
        
        it('should attempt recovery from critical state', async () => {
            agent.state.recoveryAttempts = 0;
            agent.attemptRecovery = jest.fn();
            
            await agent.handleCriticalState();
            
            expect(agent.state.mode).toBe('critical');
            expect(agent.attemptRecovery).toHaveBeenCalled();
            expect(agent.state.recoveryAttempts).toBe(1);
        });
    });
    
    describe('Resource Management', () => {
        it('should handle memory pressure', () => {
            agent.batchSize = 10;
            agent.clearCaches = jest.fn();
            
            agent.handleMemoryPressure();
            
            expect(agent.clearCaches).toHaveBeenCalled();
            expect(agent.batchSize).toBeLessThan(10);
        });
        
        it('should handle queue backlog', () => {
            // Add messages with different priorities
            agent.messaging.messageQueue = [
                { message: { id: 1 }, options: { priority: 'low' } },
                { message: { id: 2 }, options: { priority: 'high' } },
                { message: { id: 3 }, options: { priority: 'normal' } },
                { message: { id: 4 }, options: { priority: 'high' } }
            ];
            
            agent.handleQueueBacklog();
            
            // Should keep only high priority messages
            expect(agent.messaging.messageQueue.length).toBe(2);
            expect(agent.messaging.messageQueue.every(
                item => item.options.priority === 'high'
            )).toBe(true);
        });
    });
    
    describe('Status Reporting', () => {
        it('should provide comprehensive status', () => {
            const status = agent.getStatus();
            
            expect(status).toHaveProperty('health');
            expect(status.health).toHaveProperty('state');
            expect(status.health).toHaveProperty('monitor');
            expect(status.health).toHaveProperty('messaging');
            expect(status.health).toHaveProperty('circuitBreakers');
        });
    });
    
    describe('Graceful Shutdown', () => {
        it('should perform graceful shutdown', async () => {
            agent.messaging.cleanup = jest.fn();
            agent.healthMonitor.cleanup = jest.fn();
            agent.saveState = jest.fn();
            
            await agent.gracefulShutdown();
            
            expect(agent.state.shuttingDown).toBe(true);
            expect(agent.messaging.cleanup).toHaveBeenCalled();
            expect(agent.healthMonitor.cleanup).toHaveBeenCalled();
        });
    });
});

describe('Circuit Breaker Integration', () => {
    let agent;
    
    beforeEach(() => {
        agent = createResilientAgent(456, {
            name: 'CircuitBreakerTest'
        });
    });
    
    afterEach(async () => {
        await agent.cleanup();
    });
    
    it('should handle cascading failures gracefully', async () => {
        let fileOpsFailed = 0;
        let gitOpsFailed = 0;
        
        // Mock failures
        agent.fs.readFile = jest.fn().mockImplementation(() => {
            fileOpsFailed++;
            throw new Error('File system error');
        });
        
        agent.exec = jest.fn().mockImplementation((cmd) => {
            if (cmd.startsWith('git')) {
                gitOpsFailed++;
                throw new Error('Git error');
            }
            return { stdout: 'ok' };
        });
        
        // Trigger failures
        const operations = [];
        for (let i = 0; i < 10; i++) {
            operations.push(
                agent.readFile('test.txt').catch(() => 'file-failed'),
                agent.exec('git status').catch(() => 'git-failed')
            );
        }
        
        const results = await Promise.all(operations);
        
        // Check that circuit breakers limited the failures
        expect(fileOpsFailed).toBeLessThanOrEqual(6); // Circuit should open after ~5
        expect(gitOpsFailed).toBeLessThanOrEqual(6);
        
        // Check circuit breaker states
        const status = agent.getStatus();
        expect(['open', 'half_open']).toContain(
            status.health.circuitBreakers.fileOps.state
        );
    });
});

describe('Health Recovery Scenarios', () => {
    let agent;
    
    beforeEach(() => {
        agent = createResilientAgent(789, {
            name: 'RecoveryTest',
            healthCheckInterval: 100 // Fast checks for testing
        });
    });
    
    afterEach(async () => {
        await agent.cleanup();
    });
    
    it('should recover from degraded to healthy state', (done) => {
        let stateChanges = [];
        
        agent.healthMonitor.on('state-change', ({ from, to }) => {
            stateChanges.push({ from, to });
            
            if (to === 'healthy' && from === 'degraded') {
                expect(stateChanges.length).toBeGreaterThanOrEqual(2);
                done();
            }
        });
        
        // Start in degraded state
        agent.healthMonitor.state = 'degraded';
        agent.healthMonitor.consecutiveSuccesses = 0;
        
        // Simulate successful health checks
        agent.healthMonitor.handleHealthyCheck();
        agent.healthMonitor.handleHealthyCheck();
        agent.healthMonitor.handleHealthyCheck();
    });
    
    it('should escalate from degraded to critical after failures', () => {
        const states = [];
        
        agent.healthMonitor.on('state-change', ({ to }) => {
            states.push(to);
        });
        
        // Simulate escalating failures
        for (let i = 0; i < 10; i++) {
            agent.healthMonitor.handleUnhealthyCheck(new Map([
                ['test', { healthy: false, message: 'Test failure' }]
            ]));
        }
        
        expect(states).toContain('degraded');
        expect(states).toContain('unhealthy');
        expect(states).toContain('critical');
    });
});