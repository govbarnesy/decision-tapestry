/**
 * Resilient Agent Coordinator
 * Enhanced version using ResilientAgentMessaging and ResilientAgent framework
 * Manages multi-agent scenarios with improved fault tolerance and context enrichment
 */

import { AgentCoordinator } from './agent-coordinator.mjs';
import { ResilientAgent } from './agent-framework-resilient.mjs';
import { ResilientAgentMessaging } from './agent-messaging-resilient.mjs';
import { contextAggregator } from './context-aggregator.mjs';
import { AgentHealthMonitor } from './agent-health-monitor.mjs';
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export class ResilientAgentCoordinator extends AgentCoordinator {
    constructor(options = {}) {
        super();
        
        // Use resilient messaging with enhanced options
        this.messaging = new ResilientAgentMessaging('coordinator', {
            maxReconnectAttempts: 20,
            baseReconnectDelay: 2000,
            failureThreshold: 10,
            maxQueueSize: 2000,
            ...options.messaging
        });
        
        // Health monitoring for the coordinator itself
        this.healthMonitor = new AgentHealthMonitor('coordinator', {
            checkInterval: 15000,
            ...options.health
        });
        
        // Context aggregator for enriched agent context
        this.contextAggregator = contextAggregator;
        
        // Enhanced coordination results
        this.coordinationResults = {
            total: 0,
            completed: 0,
            failed: 0,
            errors: [],
            contextQuality: {},
            healthMetrics: {}
        };
        
        // Configuration
        this.config = {
            enableContextEnrichment: options.enableContextEnrichment !== false,
            enableHealthMonitoring: options.enableHealthMonitoring !== false,
            maxConcurrentAgents: options.maxConcurrentAgents || 5,
            agentTimeout: options.agentTimeout || 300000, // 5 minutes
            ...options
        };
        
        // Track coordination start time
        this.coordinationStartTime = null;
        
        // Setup enhanced health monitoring
        this.setupHealthMonitoring();
    }
    
    /**
     * Setup enhanced health monitoring
     */
    setupHealthMonitoring() {
        // Messaging health events
        this.messaging.on('health-update', (health) => {
            if (health.circuitBreakerState === 'open') {
                this.log('Warning: Messaging circuit breaker is open - operating in degraded mode');
                this.coordinationResults.healthMetrics.messagingDegraded = true;
            }
        });
        
        this.messaging.on('circuit-breaker-open', () => {
            this.log('Messaging circuit breaker opened - entering degraded mode', 'warn');
            this.coordinationResults.healthMetrics.messagingDegraded = true;
        });
        
        this.messaging.on('disconnected', () => {
            this.log('Coordinator disconnected from messaging - will attempt reconnection');
        });
        
        this.messaging.on('reconnected', () => {
            this.log('Coordinator reconnected to messaging');
            this.coordinationResults.healthMetrics.messagingDegraded = false;
        });
        
        this.messaging.on('max-reconnect-attempts', () => {
            this.log('Max reconnection attempts reached - coordinator operating in offline mode');
            this.handleOfflineMode();
        });
        
        // Start health monitoring if enabled
        if (this.config.enableHealthMonitoring) {
            this.startAdvancedHealthMonitoring();
        }
    }
    
    /**
     * Start advanced health monitoring
     */
    async startAdvancedHealthMonitoring() {
        // Register health checks
        this.healthMonitor.registerHealthCheck('agent-health', async () => {
            const unhealthyAgents = [];
            
            for (const [agentId, agent] of this.agents) {
                if (agent.getHealthStatus) {
                    const health = await agent.getHealthStatus();
                    if (!health.healthy) {
                        unhealthyAgents.push(agentId);
                    }
                }
            }
            
            return {
                healthy: unhealthyAgents.length === 0,
                message: unhealthyAgents.length > 0 ? 
                    `${unhealthyAgents.length} unhealthy agents: ${unhealthyAgents.join(', ')}` :
                    'All agents healthy',
                metric: unhealthyAgents.length
            };
        });
        
        this.healthMonitor.registerHealthCheck('decision-progress', async () => {
            const progressRate = this.coordinationResults.total > 0 ?
                this.coordinationResults.completed / this.coordinationResults.total : 0;
            
            return {
                healthy: progressRate >= 0.5 || this.coordinationResults.total === 0,
                message: `Progress: ${this.coordinationResults.completed}/${this.coordinationResults.total}`,
                metric: progressRate
            };
        });
        
        this.healthMonitor.start();
        
        // React to health state changes
        this.healthMonitor.on('state-change', (change) => {
            this.log(`Health state changed from ${change.from} to ${change.to}`, 'warn');
            
            if (change.to === 'critical') {
                this.handleCriticalState();
            }
        });
    }
    
    /**
     * Handle critical health state
     */
    async handleCriticalState() {
        this.log('Entering critical state - initiating emergency procedures', 'error');
        
        // Pause all non-critical agents
        for (const [agentId, agent] of this.agents) {
            const node = this.dependencyGraph.get(agent.decisionId);
            if (node && !node.critical) {
                await this.pauseAgent(agentId);
            }
        }
        
        // Attempt to save state
        await this.saveCoordinationState();
        
        // Alert via messaging if possible
        await this.messaging.broadcastStatus({
            type: 'critical_state',
            message: 'Coordinator in critical state',
            timestamp: new Date().toISOString()
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
     * Override coordinateDecisions with enhanced resilience and context
     */
    async coordinateDecisions(decisionIds, options = {}) {
        try {
            this.coordinationStartTime = Date.now();
            this.log(`Starting resilient coordination for decisions: ${decisionIds.join(', ')}`);
            
            // Validate decisions exist
            await this.validateDecisions(decisionIds);
            
            // Build dependency graph with criticality analysis
            await this.buildEnhancedDependencyGraph(decisionIds);
            
            // Pre-fetch context for all decisions if enabled
            if (this.config.enableContextEnrichment) {
                await this.prefetchDecisionContexts(decisionIds);
            }
            
            // Execute coordination plan with resilience
            await this.executeResilientCoordinationPlan();
            
            // Generate comprehensive results
            const results = await this.generateEnhancedResults();
            
            this.log('Resilient coordination completed');
            return results;
            
        } catch (error) {
            this.coordinationResults.errors.push(error.message);
            this.log(`Coordination failed: ${error.message}`, 'error');
            
            // Attempt graceful degradation
            if (this.offlineMode) {
                return this.coordinateOffline(decisionIds);
            }
            
            // Attempt graceful shutdown
            await this.gracefulShutdown();
            throw error;
        }
    }
    
    /**
     * Build enhanced dependency graph with criticality analysis
     */
    async buildEnhancedDependencyGraph(decisionIds) {
        await this.buildDependencyGraph(decisionIds);
        
        // Enhance with criticality and context quality
        for (const [decisionId, node] of this.dependencyGraph) {
            const decision = this.decisions.get(decisionId);
            
            // Determine criticality based on various factors
            node.critical = this.isDecisionCritical(decision);
            
            // Assess context quality if enrichment is enabled
            if (this.config.enableContextEnrichment) {
                const context = await this.contextAggregator.getDecisionContext(decisionId);
                node.contextQuality = context._metadata?.validation?.completeness || 0;
                this.coordinationResults.contextQuality[decisionId] = node.contextQuality;
            }
        }
        
        this.log('Enhanced dependency graph built with criticality analysis');
    }
    
    /**
     * Determine if a decision is critical
     */
    isDecisionCritical(decision) {
        // Critical if:
        // - Has many dependents
        // - Is marked as high priority
        // - Has failed before
        // - Affects critical components
        
        const dependentCount = Array.from(this.dependencyGraph.values())
            .filter(node => node.dependencies.includes(decision.id)).length;
        
        return (
            dependentCount > 3 ||
            decision.priority === 'high' ||
            this.failedDecisions.has(decision.id) ||
            decision.affected_components?.some(c => c.includes('core') || c.includes('critical'))
        );
    }
    
    /**
     * Pre-fetch decision contexts for better performance
     */
    async prefetchDecisionContexts(decisionIds) {
        this.log('Pre-fetching decision contexts...');
        
        const contextPromises = decisionIds.map(id => 
            this.contextAggregator.getDecisionContext(id)
                .catch(error => {
                    this.log(`Failed to fetch context for decision ${id}: ${error.message}`, 'warn');
                    return null;
                })
        );
        
        await Promise.all(contextPromises);
        this.log('Context pre-fetching completed');
    }
    
    /**
     * Execute coordination plan with resilience features
     */
    async executeResilientCoordinationPlan() {
        this.log('Executing resilient coordination plan...');
        
        const activeAgents = new Map();
        const agentTimeouts = new Map();
        
        // Keep processing until all decisions are completed or failed
        while (this.hasReadyDecisions()) {
            // Respect max concurrent agents limit
            const availableSlots = this.config.maxConcurrentAgents - activeAgents.size;
            if (availableSlots <= 0) {
                // Wait for an agent to complete
                await this.waitForAgentCompletion(activeAgents);
                continue;
            }
            
            // Get next batch of ready decisions
            const readyDecisions = this.getReadyDecisions()
                .slice(0, availableSlots);
            
            // Start agents for ready decisions
            for (const decisionId of readyDecisions) {
                const agentPromise = this.startResilientAgentForDecision(decisionId);
                activeAgents.set(decisionId, agentPromise);
                
                // Set timeout for agent
                const timeout = setTimeout(async () => {
                    this.log(`Agent for decision ${decisionId} timed out`, 'warn');
                    await this.handleAgentTimeout(decisionId);
                }, this.config.agentTimeout);
                
                agentTimeouts.set(decisionId, timeout);
                
                // Handle agent completion
                agentPromise.then(() => {
                    clearTimeout(agentTimeouts.get(decisionId));
                    agentTimeouts.delete(decisionId);
                    activeAgents.delete(decisionId);
                    this.markDecisionCompleted(decisionId);
                }).catch((error) => {
                    clearTimeout(agentTimeouts.get(decisionId));
                    agentTimeouts.delete(decisionId);
                    activeAgents.delete(decisionId);
                    this.markDecisionFailed(decisionId, error);
                });
            }
            
            // Update ready status for next iteration
            this.updateReadyStatus();
            
            // Brief pause to prevent CPU spinning
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Wait for all remaining agents to complete
        if (activeAgents.size > 0) {
            await Promise.allSettled(Array.from(activeAgents.values()));
        }
        
        this.log('Resilient coordination plan execution completed');
    }
    
    /**
     * Start resilient agent for specific decision
     */
    async startResilientAgentForDecision(decisionId) {
        const agentId = `Agent-${decisionId}`;
        const node = this.dependencyGraph.get(decisionId);
        
        try {
            this.log(`Starting resilient ${agentId} for Decision #${decisionId}`);
            
            // Mark as started
            node.started = true;
            
            // Get enriched context for the agent
            let enrichedContext = null;
            if (this.config.enableContextEnrichment) {
                enrichedContext = await this.contextAggregator.getDecisionContext(decisionId);
            }
            
            // Create and initialize resilient agent
            const agent = new ResilientAgent(agentId, decisionId, {
                maxRetries: 5,
                baseRetryDelay: 2000,
                enableHealthMonitoring: this.config.enableHealthMonitoring,
                context: enrichedContext
            });
            
            this.agents.set(agentId, agent);
            
            await agent.initialize();
            
            // Monitor agent health if enabled
            if (this.config.enableHealthMonitoring) {
                this.monitorAgentHealth(agentId, agent);
            }
            
            // Broadcast coordination update
            await this.messaging.broadcastStatus({
                type: 'agent_started',
                agentId: agentId,
                decisionId: decisionId,
                contextQuality: enrichedContext?._metadata?.validation?.completeness || 0,
                message: `${agentId} started with ${enrichedContext ? 'enriched' : 'basic'} context`
            });
            
            // Start agent work
            const report = await agent.start();
            
            this.log(`${agentId} completed work, initiating peer review...`);
            
            // Initiate peer review process with context
            await this.initiateEnhancedReviewProcess(agentId, decisionId, report, enrichedContext);
            
            this.log(`${agentId} completed successfully`);
            return report;
            
        } catch (error) {
            this.log(`${agentId} failed: ${error.message}`, 'error');
            
            // Record health metrics
            this.coordinationResults.healthMetrics[agentId] = {
                failed: true,
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            throw error;
        }
    }
    
    /**
     * Generate enhanced results with health and context metrics
     */
    async generateEnhancedResults() {
        const baseResults = this.generateResults();
        
        // Add health metrics
        const healthReport = await this.getHealthStatus();
        
        // Add context quality summary
        const contextQualityAvg = Object.values(this.coordinationResults.contextQuality).length > 0 ?
            Object.values(this.coordinationResults.contextQuality).reduce((a, b) => a + b, 0) / 
            Object.values(this.coordinationResults.contextQuality).length : 0;
        
        return {
            ...baseResults,
            health: healthReport,
            contextQuality: {
                average: contextQualityAvg,
                byDecision: this.coordinationResults.contextQuality
            },
            resilience: {
                messagingHealth: this.messaging.getHealthMetrics(),
                circuitBreakerStatus: this.messaging.circuitBreakers,
                agentHealthMetrics: this.coordinationResults.healthMetrics
            },
            performance: {
                totalDuration: Date.now() - this.coordinationStartTime,
                avgAgentDuration: this.calculateAverageAgentDuration()
            }
        };
    }
    
    /**
     * Get comprehensive health status
     */
    async getHealthStatus() {
        const coordinatorHealth = this.healthMonitor.getStatus();
        const messagingHealth = this.messaging.getHealthMetrics();
        
        const agentHealthSummary = {
            total: this.agents.size,
            healthy: 0,
            degraded: 0,
            unhealthy: 0
        };
        
        for (const agent of this.agents.values()) {
            if (agent.getHealthStatus) {
                const health = await agent.getHealthStatus();
                if (health.healthy) {
                    agentHealthSummary.healthy++;
                } else if (health.state === 'degraded') {
                    agentHealthSummary.degraded++;
                } else {
                    agentHealthSummary.unhealthy++;
                }
            }
        }
        
        return {
            coordinator: coordinatorHealth,
            messaging: messagingHealth,
            agents: agentHealthSummary,
            overall: {
                healthy: coordinatorHealth.healthy && 
                        messagingHealth.connected && 
                        agentHealthSummary.unhealthy === 0,
                message: this.getHealthMessage(coordinatorHealth, messagingHealth, agentHealthSummary)
            }
        };
    }
    
    /**
     * Helper methods
     */
    
    waitForAgentCompletion(activeAgents) {
        if (activeAgents.size === 0) return Promise.resolve();
        return Promise.race(Array.from(activeAgents.values()));
    }
    
    async handleAgentTimeout(decisionId) {
        const agentId = `Agent-${decisionId}`;
        const agent = this.agents.get(agentId);
        
        if (agent && agent.stop) {
            await agent.stop();
        }
        
        this.markDecisionFailed(decisionId, new Error('Agent timeout'));
    }
    
    monitorAgentHealth(agentId, agent) {
        if (!agent.healthMonitor) return;
        
        agent.healthMonitor.on('alert', (alert) => {
            this.log(`Health alert from ${agentId}: ${alert.message}`, 'warn');
            
            this.messaging.broadcastStatus({
                type: 'agent_health_alert',
                agentId,
                alert
            });
        });
        
        agent.healthMonitor.on('state-change', (change) => {
            this.coordinationResults.healthMetrics[agentId] = {
                state: change.to,
                timestamp: new Date().toISOString()
            };
        });
    }
    
    async initiateEnhancedReviewProcess(originalAgentId, decisionId, workProduct, context) {
        try {
            const reviewerAgentId = await this.assignReviewer(originalAgentId, decisionId);
            
            if (!reviewerAgentId) {
                this.log(`No available reviewer for Decision #${decisionId}, skipping review`);
                return;
            }
            
            this.log(`Assigning ${reviewerAgentId} to review ${originalAgentId}'s work`);
            
            // Create reviewer with enriched context
            const reviewerAgent = new ResilientAgent(reviewerAgentId, null, {
                context: context,
                role: 'reviewer'
            });
            
            await reviewerAgent.initialize();
            this.agents.set(reviewerAgentId, reviewerAgent);
            
            // Start the review process with context
            const reviewResults = await reviewerAgent.startPeerReview(
                originalAgentId, 
                decisionId, 
                workProduct,
                { context }
            );
            
            this.log(`Review completed: ${reviewResults.summary} (Quality Score: ${reviewResults.qualityScore}%)`);
            
            // Store review results with context quality metrics
            reviewResults.contextQuality = context?._metadata?.validation?.completeness || 0;
            
            return reviewResults;
            
        } catch (error) {
            this.log(`Review process failed: ${error.message}`, 'error');
            return null;
        }
    }
    
    getHealthMessage(coordinator, messaging, agents) {
        if (!coordinator.healthy) {
            return 'Coordinator is unhealthy';
        }
        if (!messaging.connected) {
            return 'Messaging system is disconnected';
        }
        if (agents.unhealthy > 0) {
            return `${agents.unhealthy} agents are unhealthy`;
        }
        if (agents.degraded > 0) {
            return `${agents.degraded} agents are degraded`;
        }
        return 'All systems operational';
    }
    
    calculateAverageAgentDuration() {
        // This would track actual agent execution times
        return 0; // Placeholder
    }
    
    async pauseAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (agent && agent.pause) {
            await agent.pause();
            this.log(`Paused agent ${agentId}`);
        }
    }
    
    async saveCoordinationState() {
        const state = {
            timestamp: new Date().toISOString(),
            decisions: Object.fromEntries(this.decisions),
            dependencyGraph: this.serializeDependencyGraph(),
            completedDecisions: Array.from(this.completedDecisions),
            failedDecisions: Array.from(this.failedDecisions),
            coordinationResults: this.coordinationResults
        };
        
        const statePath = path.resolve('.coordinator-state.json');
        await fs.writeFile(statePath, JSON.stringify(state, null, 2));
        this.log('Coordination state saved');
    }
    
    async gracefulShutdown() {
        this.log('Initiating graceful shutdown...');
        
        // Stop all agents
        for (const [agentId, agent] of this.agents) {
            if (agent.stop) {
                await agent.stop();
            }
        }
        
        // Save final state
        await this.saveCoordinationState();
        
        // Cleanup
        await this.cleanup();
        
        this.log('Graceful shutdown completed');
    }
    
    async coordinateOffline(decisionIds) {
        this.log('Coordinating decisions in offline mode');
        
        const results = {
            timestamp: new Date().toISOString(),
            mode: 'offline',
            decisions: decisionIds,
            completed: [],
            failed: [],
            message: 'Coordination completed in offline mode'
        };
        
        // Save results for later sync
        const resultsPath = `.offline-coordination-${Date.now()}.json`;
        await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
        this.log(`Offline results saved to ${resultsPath}`);
        
        return results;
    }
    
    /**
     * Enhanced cleanup
     */
    async cleanup() {
        // Stop health monitoring
        if (this.healthMonitor) {
            this.healthMonitor.cleanup();
        }
        
        // Cleanup all agents
        for (const agent of this.agents.values()) {
            if (agent.cleanup) {
                await agent.cleanup();
            }
        }
        
        // Cleanup messaging
        if (this.messaging) {
            await this.messaging.cleanup();
        }
        
        // Call parent cleanup
        if (super.cleanup) {
            await super.cleanup();
        }
        
        this.log('Resilient coordinator cleanup completed');
    }
    
    /**
     * Enhanced logging
     */
    log(message, level = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [ResilientCoordinator] [${level.toUpperCase()}] ${message}`);
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