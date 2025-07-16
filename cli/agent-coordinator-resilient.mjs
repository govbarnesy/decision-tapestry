/**
 * Enhanced Agent Coordinator with Resilient Messaging
 * This file demonstrates how to upgrade the coordinator to use resilient messaging
 */

import { AgentCoordinator } from './agent-coordinator.mjs';
import { ResilientAgentMessaging } from './agent-messaging-resilient.mjs';

export class ResilientAgentCoordinator extends AgentCoordinator {
    constructor(options = {}) {
        super();
        
        // Override with resilient messaging
        this.messaging = new ResilientAgentMessaging('coordinator', {
            maxReconnectAttempts: options.maxReconnectAttempts || 10,
            failureThreshold: options.failureThreshold || 5,
            healthCheckInterval: options.healthCheckInterval || 30000,
            ...options.messagingOptions
        });
        
        // Add health monitoring for coordinator
        this.setupHealthMonitoring();
    }
    
    /**
     * Setup health monitoring for the coordinator
     */
    setupHealthMonitoring() {
        this.messaging.on('health-update', (health) => {
            if (health.circuitBreakerState === 'open') {
                this.log('Warning: Messaging circuit breaker is open - operating in degraded mode');
            }
        });
        
        this.messaging.on('disconnected', () => {
            this.log('Coordinator disconnected from messaging - will attempt reconnection');
        });
        
        this.messaging.on('reconnected', () => {
            this.log('Coordinator reconnected to messaging');
        });
        
        this.messaging.on('max-reconnect-attempts', () => {
            this.log('Max reconnection attempts reached - coordinator operating in offline mode');
            this.handleOfflineMode();
        });
    }
    
    /**
     * Handle offline mode for coordinator
     */
    handleOfflineMode() {
        // Continue coordination locally without real-time updates
        this.log('Entering offline coordination mode - results will be cached');
        this.offlineMode = true;
    }
    
    /**
     * Enhanced coordination with fault tolerance
     */
    async coordinateAgents(agents, decisions) {
        try {
            // Store original method reference
            const originalCoordinate = super.coordinateAgents.bind(this);
            
            // Wrap in fault-tolerant execution
            return await this.executeWithResilience(
                () => originalCoordinate(agents, decisions),
                'agent-coordination'
            );
        } catch (error) {
            this.log(`Coordination failed: ${error.message}`);
            
            // Attempt graceful degradation
            if (this.offlineMode) {
                return this.coordinateOffline(agents, decisions);
            }
            
            throw error;
        }
    }
    
    /**
     * Execute operation with resilience
     */
    async executeWithResilience(operation, operationName) {
        const startTime = Date.now();
        
        try {
            const result = await operation();
            
            // Report success metrics
            const duration = Date.now() - startTime;
            this.messaging.emit('operation-success', {
                operation: operationName,
                duration
            });
            
            return result;
        } catch (error) {
            // Report failure metrics
            this.messaging.emit('operation-failure', {
                operation: operationName,
                error: error.message
            });
            
            throw error;
        }
    }
    
    /**
     * Coordinate agents in offline mode
     */
    async coordinateOffline(agents, decisions) {
        this.log('Coordinating agents in offline mode');
        
        // Cache results for later sync
        const results = {
            timestamp: new Date().toISOString(),
            mode: 'offline',
            agents: agents.length,
            decisions: decisions.length,
            completed: [],
            failed: []
        };
        
        // Run coordination without real-time updates
        try {
            // Execute tasks sequentially in offline mode
            for (const decision of decisions) {
                try {
                    const agent = agents.find(a => a.decisionId === decision.id);
                    if (agent) {
                        await agent.executeTask({
                            id: `task-${decision.id}`,
                            description: `Offline execution of decision ${decision.id}`
                        });
                        results.completed.push(decision.id);
                    }
                } catch (error) {
                    results.failed.push({
                        decisionId: decision.id,
                        error: error.message
                    });
                }
            }
            
            // Save results for later sync
            await this.saveOfflineResults(results);
            
            return results;
        } catch (error) {
            this.log(`Offline coordination failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Save offline results for later synchronization
     */
    async saveOfflineResults(results) {
        const fs = await import('fs/promises');
        const resultsPath = `.offline-coordination-${Date.now()}.json`;
        
        await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
        this.log(`Offline results saved to ${resultsPath}`);
    }
    
    /**
     * Get coordinator status including messaging health
     */
    getStatus() {
        const baseStatus = super.getStatus ? super.getStatus() : {
            agents: this.agents.size,
            decisions: this.decisions.size,
            completed: this.completedDecisions.size,
            failed: this.failedDecisions.size
        };
        
        return {
            ...baseStatus,
            messaging: this.messaging.getStatus(),
            offlineMode: this.offlineMode || false,
            health: this.messaging.getHealthMetrics()
        };
    }
    
    /**
     * Cleanup with resilient messaging
     */
    async cleanup() {
        await this.messaging.cleanup();
        
        if (super.cleanup) {
            await super.cleanup();
        }
    }
}

/**
 * Factory function to create resilient coordinator
 */
export function createResilientCoordinator(options = {}) {
    return new ResilientAgentCoordinator(options);
}

/**
 * Example usage showing migration path
 */
export const migrationExample = `
// Before (basic coordinator)
import { AgentCoordinator } from './agent-coordinator.mjs';
const coordinator = new AgentCoordinator();

// After (resilient coordinator) 
import { createResilientCoordinator } from './agent-coordinator-resilient.mjs';
const coordinator = createResilientCoordinator({
    maxReconnectAttempts: 10,
    healthCheckInterval: 30000
});

// The API remains the same
await coordinator.initialize();
await coordinator.coordinateAgents(agents, decisions);
`;