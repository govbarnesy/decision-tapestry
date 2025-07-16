/**
 * Agent Coordinator
 * Manages multi-agent scenarios, dependencies, and coordination
 */

import { DecisionTapestryAgent } from './agent-framework.mjs';
import { AgentMessaging } from './agent-messaging.mjs';
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export class AgentCoordinator {
    constructor() {
        this.agents = new Map();
        this.decisions = new Map();
        this.dependencyGraph = new Map();
        this.completedDecisions = new Set();
        this.failedDecisions = new Set();
        this.messaging = new AgentMessaging('coordinator');
        this.coordinationResults = {
            total: 0,
            completed: 0,
            failed: 0,
            errors: []
        };
    }

    /**
     * Initialize the coordinator
     */
    async initialize() {
        try {
            // Initialize messaging
            await this.messaging.initialize();
            
            // Load decisions data
            await this.loadDecisionsData();
            
            this.log('Coordinator initialized');
            
        } catch (error) {
            throw new Error(`Failed to initialize coordinator: ${error.message}`);
        }
    }

    /**
     * Load decisions data
     */
    async loadDecisionsData() {
        try {
            const decisionsPath = path.resolve('decisions.yml');
            const decisionsContent = await fs.readFile(decisionsPath, 'utf8');
            const decisionsData = yaml.load(decisionsContent);
            
            // Index decisions by ID
            decisionsData.decisions.forEach(decision => {
                this.decisions.set(decision.id, decision);
            });
            
            this.log(`Loaded ${this.decisions.size} decisions`);
            
        } catch (error) {
            throw new Error(`Failed to load decisions: ${error.message}`);
        }
    }

    /**
     * Coordinate multiple decisions
     */
    async coordinateDecisions(decisionIds) {
        try {
            this.log(`Starting coordination for decisions: ${decisionIds.join(', ')}`);
            
            // Validate decisions exist
            await this.validateDecisions(decisionIds);
            
            // Build dependency graph
            await this.buildDependencyGraph(decisionIds);
            
            // Execute coordination plan
            await this.executeCoordinationPlan();
            
            // Generate results
            const results = this.generateResults();
            
            this.log('Coordination completed');
            return results;
            
        } catch (error) {
            this.coordinationResults.errors.push(error.message);
            throw error;
        }
    }

    /**
     * Validate that all decisions exist and are ready
     */
    async validateDecisions(decisionIds) {
        this.log('Validating decisions...');
        
        for (const decisionId of decisionIds) {
            const decision = this.decisions.get(decisionId);
            
            if (!decision) {
                throw new Error(`Decision #${decisionId} not found`);
            }
            
            if (decision.status === 'Completed') {
                this.log(`Decision #${decisionId} already completed`);
                this.completedDecisions.add(decisionId);
                continue;
            }
            
            if (!decision.tasks || decision.tasks.length === 0) {
                throw new Error(`Decision #${decisionId} has no tasks defined`);
            }
            
            this.log(`Decision #${decisionId} validated: ${decision.title}`);
        }
        
        this.coordinationResults.total = decisionIds.length;
        this.coordinationResults.completed = this.completedDecisions.size;
    }

    /**
     * Build dependency graph for decisions
     */
    async buildDependencyGraph(decisionIds) {
        this.log('Building dependency graph...');
        
        // Initialize graph
        decisionIds.forEach(id => {
            this.dependencyGraph.set(id, {
                dependencies: [],
                dependents: [],
                ready: false,
                started: false,
                completed: this.completedDecisions.has(id)
            });
        });
        
        // Analyze dependencies
        for (const decisionId of decisionIds) {
            const decision = this.decisions.get(decisionId);
            const node = this.dependencyGraph.get(decisionId);
            
            if (decision.related_to) {
                for (const relatedId of decision.related_to) {
                    if (decisionIds.includes(relatedId)) {
                        // This decision depends on the related decision
                        node.dependencies.push(relatedId);
                        
                        // Update dependent's list
                        const relatedNode = this.dependencyGraph.get(relatedId);
                        if (relatedNode) {
                            relatedNode.dependents.push(decisionId);
                        }
                    }
                }
            }
        }
        
        // Mark ready decisions (no dependencies or all dependencies completed)
        this.updateReadyStatus();
        
        this.log('Dependency graph built');
        this.logDependencyGraph();
    }

    /**
     * Update ready status for all decisions
     */
    updateReadyStatus() {
        for (const [decisionId, node] of this.dependencyGraph) {
            if (node.completed) {
                node.ready = true;
                continue;
            }
            
            // Check if all dependencies are completed
            node.ready = node.dependencies.every(depId => {
                const depNode = this.dependencyGraph.get(depId);
                return depNode && depNode.completed;
            });
        }
    }

    /**
     * Execute coordination plan
     */
    async executeCoordinationPlan() {
        this.log('Executing coordination plan...');
        
        // Keep processing until all decisions are completed or failed
        while (this.hasReadyDecisions()) {
            // Get next batch of ready decisions
            const readyDecisions = this.getReadyDecisions();
            
            // Start agents for ready decisions in parallel
            const agentPromises = readyDecisions.map(decisionId => 
                this.startAgentForDecision(decisionId)
            );
            
            // Wait for all agents in this batch to complete
            const results = await Promise.allSettled(agentPromises);
            
            // Process results
            results.forEach((result, index) => {
                const decisionId = readyDecisions[index];
                
                if (result.status === 'fulfilled') {
                    this.markDecisionCompleted(decisionId);
                } else {
                    this.markDecisionFailed(decisionId, result.reason);
                }
            });
            
            // Update ready status for next iteration
            this.updateReadyStatus();
        }
        
        this.log('Coordination plan execution completed');
    }

    /**
     * Check if there are ready decisions to process
     */
    hasReadyDecisions() {
        for (const [decisionId, node] of this.dependencyGraph) {
            if (node.ready && !node.started && !node.completed) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get list of ready decisions
     */
    getReadyDecisions() {
        const ready = [];
        
        for (const [decisionId, node] of this.dependencyGraph) {
            if (node.ready && !node.started && !node.completed) {
                ready.push(decisionId);
            }
        }
        
        return ready;
    }

    /**
     * Start agent for specific decision
     */
    async startAgentForDecision(decisionId) {
        const agentId = `Agent-${decisionId}`;
        const node = this.dependencyGraph.get(decisionId);
        
        try {
            this.log(`Starting ${agentId} for Decision #${decisionId}`);
            
            // Mark as started
            node.started = true;
            
            // Create and initialize agent
            const agent = new DecisionTapestryAgent(agentId, decisionId);
            this.agents.set(agentId, agent);
            
            await agent.initialize();
            
            // Broadcast coordination update
            await this.messaging.broadcastStatus({
                type: 'agent_started',
                agentId: agentId,
                decisionId: decisionId,
                message: `${agentId} started for Decision #${decisionId}`
            });
            
            // Start agent work
            const report = await agent.start();
            
            this.log(`${agentId} completed work, initiating peer review...`);
            
            // Initiate peer review process
            await this.initiateReviewProcess(agentId, decisionId, report);
            
            this.log(`${agentId} completed successfully`);
            return report;
            
        } catch (error) {
            this.log(`${agentId} failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Mark decision as completed
     */
    markDecisionCompleted(decisionId) {
        const node = this.dependencyGraph.get(decisionId);
        node.completed = true;
        
        this.completedDecisions.add(decisionId);
        this.coordinationResults.completed++;
        
        this.log(`Decision #${decisionId} completed`);
        
        // Broadcast completion
        this.messaging.broadcastStatus({
            type: 'decision_completed',
            decisionId: decisionId,
            message: `Decision #${decisionId} completed`
        });
    }

    /**
     * Mark decision as failed
     */
    markDecisionFailed(decisionId, error) {
        const node = this.dependencyGraph.get(decisionId);
        node.failed = true;
        
        this.failedDecisions.add(decisionId);
        this.coordinationResults.failed++;
        this.coordinationResults.errors.push(`Decision #${decisionId}: ${error.message}`);
        
        this.log(`Decision #${decisionId} failed: ${error.message}`);
        
        // Broadcast failure
        this.messaging.broadcastStatus({
            type: 'decision_failed',
            decisionId: decisionId,
            message: `Decision #${decisionId} failed: ${error.message}`
        });
    }

    /**
     * Generate coordination results
     */
    generateResults() {
        const results = {
            ...this.coordinationResults,
            agents: Array.from(this.agents.keys()),
            completedDecisions: Array.from(this.completedDecisions),
            failedDecisions: Array.from(this.failedDecisions),
            dependencyGraph: this.serializeDependencyGraph()
        };
        
        return results;
    }

    /**
     * Serialize dependency graph for results
     */
    serializeDependencyGraph() {
        const serialized = {};
        
        for (const [decisionId, node] of this.dependencyGraph) {
            serialized[decisionId] = {
                dependencies: node.dependencies,
                dependents: node.dependents,
                ready: node.ready,
                started: node.started,
                completed: node.completed,
                failed: node.failed || false
            };
        }
        
        return serialized;
    }

    /**
     * Log dependency graph
     */
    logDependencyGraph() {
        this.log('Dependency Graph:');
        
        for (const [decisionId, node] of this.dependencyGraph) {
            const status = node.completed ? 'COMPLETED' : 
                          node.ready ? 'READY' : 'WAITING';
            
            this.log(`  Decision #${decisionId}: ${status}`);
            
            if (node.dependencies.length > 0) {
                this.log(`    Dependencies: ${node.dependencies.join(', ')}`);
            }
            
            if (node.dependents.length > 0) {
                this.log(`    Dependents: ${node.dependents.join(', ')}`);
            }
        }
    }

    /**
     * Get coordination status
     */
    getStatus() {
        return {
            total: this.coordinationResults.total,
            completed: this.coordinationResults.completed,
            failed: this.coordinationResults.failed,
            activeAgents: this.agents.size,
            readyDecisions: this.getReadyDecisions().length,
            completedDecisions: Array.from(this.completedDecisions),
            failedDecisions: Array.from(this.failedDecisions),
            errors: this.coordinationResults.errors
        };
    }

    /**
     * Cleanup coordinator
     */
    async cleanup() {
        // Cleanup all agents
        for (const agent of this.agents.values()) {
            if (agent.cleanup) {
                await agent.cleanup();
            }
        }
        
        // Cleanup messaging
        if (this.messaging) {
            this.messaging.cleanup();
        }
        
        this.log('Coordinator cleanup completed');
    }

    /**
     * Initiate peer review process
     */
    async initiateReviewProcess(originalAgentId, decisionId, workProduct) {
        try {
            // Find a suitable reviewer (another available agent or create a new one)
            const reviewerAgentId = await this.assignReviewer(originalAgentId, decisionId);
            
            if (!reviewerAgentId) {
                this.log(`No available reviewer for Decision #${decisionId}, skipping review`);
                return;
            }
            
            this.log(`Assigning ${reviewerAgentId} to review ${originalAgentId}'s work on Decision #${decisionId}`);
            
            // Get or create reviewer agent
            let reviewerAgent = this.agents.get(reviewerAgentId);
            if (!reviewerAgent) {
                reviewerAgent = new DecisionTapestryAgent(reviewerAgentId, null); // No specific decision for reviewer
                await reviewerAgent.initialize();
                this.agents.set(reviewerAgentId, reviewerAgent);
            }
            
            // Start the review process
            const reviewResults = await reviewerAgent.startPeerReview(originalAgentId, decisionId, workProduct);
            
            this.log(`Review completed: ${reviewResults.summary} (Quality Score: ${reviewResults.qualityScore}%)`);
            
            // Handle review results
            if (!reviewResults.approved) {
                this.log(`Review found issues that need addressing in Decision #${decisionId}`);
                // Could potentially assign back to original agent for fixes, but for now just log
            }
            
            return reviewResults;
            
        } catch (error) {
            this.log(`Review process failed: ${error.message}`);
            // Don't fail the main coordination if review fails
            return null;
        }
    }
    
    /**
     * Assign a reviewer agent
     */
    async assignReviewer(originalAgentId, decisionId) {
        // Simple strategy: create a dedicated reviewer agent
        const reviewerAgentId = `Reviewer-${decisionId}`;
        
        // Check if this reviewer already exists
        if (this.agents.has(reviewerAgentId)) {
            return reviewerAgentId;
        }
        
        // For now, always create a new reviewer
        // In future, could implement more sophisticated assignment:
        // - Round-robin assignment
        // - Skill-based matching 
        // - Workload balancing
        return reviewerAgentId;
    }
    
    /**
     * Get review status for all decisions
     */
    getReviewStatus() {
        const reviewStatus = {};
        
        // Check each decision for review status
        for (const [decisionId, node] of this.dependencyGraph) {
            const decision = this.decisions.get(decisionId);
            if (decision && decision.reviews) {
                reviewStatus[decisionId] = {
                    status: decision.review_status || 'pending_review',
                    reviews: decision.reviews.length,
                    approved: decision.reviews.filter(r => r.approved).length,
                    latest_review: decision.reviews[decision.reviews.length - 1]
                };
            } else {
                reviewStatus[decisionId] = {
                    status: 'no_review',
                    reviews: 0,
                    approved: 0,
                    latest_review: null
                };
            }
        }
        
        return reviewStatus;
    }

    /**
     * Log message
     */
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [Coordinator] ${message}`);
    }
}