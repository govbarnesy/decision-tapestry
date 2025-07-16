/**
 * Context Aggregator Service
 * Provides comprehensive context for agents by combining static, dynamic, and collaborative sources
 * Implements the three-layer context model for optimal agent decision-making
 */

import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { decisionEnhancer } from '../services/decision-enhancer.mjs';
import { gitAnalyzer } from '../services/git-analyzer.mjs';
import githubService from '../services/github-service.mjs';
import { createCircuitBreaker } from './circuit-breaker.mjs';
import { contextQualityMonitor } from './context-quality-monitor.mjs';

export class ContextAggregator {
    constructor(options = {}) {
        // Configuration
        this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes
        this.maxCacheSize = options.maxCacheSize || 100;
        this.enableGitHub = options.enableGitHub !== false;
        this.enableGitAnalysis = options.enableGitAnalysis !== false;
        this.initialized = false;
        
        // Caches for different context layers
        this.staticCache = new Map(); // Layer 1: decisions.yml data
        this.dynamicCache = new Map(); // Layer 2: Git/GitHub data
        this.collaborativeCache = new Map(); // Layer 3: Multi-agent data
        
        // Circuit breakers for external services
        this.circuitBreakers = {
            github: createCircuitBreaker('sensitive', { 
                name: 'GitHub API',
                failureThreshold: 3,
                resetTimeout: 60000 // 1 minute
            }),
            git: createCircuitBreaker('standard', { 
                name: 'Git Analysis',
                failureThreshold: 5,
                resetTimeout: 30000 // 30 seconds
            })
        };
        
        // Metrics for context quality monitoring
        this.metrics = {
            contextRequests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            enrichmentFailures: 0,
            layerUsage: {
                static: 0,
                dynamic: 0,
                collaborative: 0
            }
        };
        
        // Context validation rules
        this.validationRules = new Map([
            ['decision', this.validateDecisionContext.bind(this)],
            ['task', this.validateTaskContext.bind(this)],
            ['collaboration', this.validateCollaborationContext.bind(this)]
        ]);
        
        // Initialize GitHub service
        this.initializeServices();
    }

    /**
     * Initialize external services
     */
    async initializeServices() {
        if (this.initialized) return;
        
        try {
            // Initialize GitHub service if enabled
            if (this.enableGitHub) {
                await githubService.initialize();
                this.log('GitHub service initialized for context enrichment');
            }
            
            this.initialized = true;
        } catch (error) {
            this.log(`Failed to initialize services: ${error.message}`, 'warn');
            // Continue without GitHub enrichment
        }
    }
    
    /**
     * Get comprehensive context for a decision
     * @param {number} decisionId - The decision ID
     * @param {Object} options - Context options
     * @returns {Object} Aggregated context from all layers
     */
    async getDecisionContext(decisionId, options = {}) {
        // Ensure services are initialized
        await this.initializeServices();
        
        this.metrics.contextRequests++;
        
        const cacheKey = `decision-${decisionId}`;
        const cached = this.getCachedContext(cacheKey);
        if (cached && !options.forceRefresh) {
            this.metrics.cacheHits++;
            return cached;
        }
        
        this.metrics.cacheMisses++;
        
        try {
            // Layer 1: Static Context
            const staticContext = await this.getStaticContext(decisionId);
            
            // Layer 2: Dynamic Context (with circuit breaker protection)
            const dynamicContext = await this.getDynamicContext(decisionId, staticContext);
            
            // Layer 3: Collaborative Context
            const collaborativeContext = await this.getCollaborativeContext(decisionId);
            
            // Aggregate all layers
            const aggregatedContext = this.aggregateContext({
                static: staticContext,
                dynamic: dynamicContext,
                collaborative: collaborativeContext
            });
            
            // Validate the aggregated context
            const validation = await this.validateContext(aggregatedContext, 'decision');
            
            // Cache the result
            this.cacheContext(cacheKey, aggregatedContext, validation);
            
            // Record quality metrics
            const enrichmentEndTime = Date.now();
            contextQualityMonitor.recordContextQuality(
                'context-aggregator',
                decisionId,
                validation.completeness,
                {
                    sources: this.getContextSources(aggregatedContext),
                    warnings: validation.warnings,
                    missingElements: validation.missingElements,
                    enrichmentTime: enrichmentEndTime - this.metrics.contextRequests
                }
            );
            
            return {
                ...aggregatedContext,
                _metadata: {
                    timestamp: new Date().toISOString(),
                    validation,
                    sources: this.getContextSources(aggregatedContext)
                }
            };
            
        } catch (error) {
            this.log(`Failed to get context for decision ${decisionId}: ${error.message}`, 'error');
            this.metrics.enrichmentFailures++;
            
            // Record validation failure
            contextQualityMonitor.recordValidationFailure(
                'context-aggregator',
                decisionId,
                error,
                { quality: 0 }
            );
            
            // Return minimal context on failure
            return this.getMinimalContext(decisionId);
        }
    }

    /**
     * Get static context from decisions.yml (Layer 1)
     */
    async getStaticContext(decisionId) {
        this.metrics.layerUsage.static++;
        
        try {
            // Check static cache first
            const cached = this.staticCache.get(decisionId);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 2) {
                return cached.data;
            }
            
            // Load decisions data
            const decisionsPath = path.resolve('decisions.yml');
            const decisionsContent = await fs.readFile(decisionsPath, 'utf8');
            const decisionsData = yaml.load(decisionsContent);
            
            // Find the specific decision
            const decision = decisionsData.decisions.find(d => d.id === decisionId);
            if (!decision) {
                throw new Error(`Decision ${decisionId} not found`);
            }
            
            // Find related decisions
            const relatedDecisions = decision.related_to ? 
                decisionsData.decisions.filter(d => decision.related_to.includes(d.id)) : [];
            
            // Build static context
            const staticContext = {
                decision,
                relatedDecisions,
                metadata: {
                    totalDecisions: decisionsData.decisions.length,
                    decisionStatus: decision.status,
                    hasGitHubMetadata: !!decision.github_metadata,
                    taskCount: decision.tasks?.length || 0
                }
            };
            
            // Cache the result
            this.staticCache.set(decisionId, {
                data: staticContext,
                timestamp: Date.now()
            });
            
            return staticContext;
            
        } catch (error) {
            this.log(`Failed to load static context: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get dynamic context from Git and GitHub (Layer 2)
     */
    async getDynamicContext(decisionId, staticContext) {
        this.metrics.layerUsage.dynamic++;
        
        const dynamicContext = {
            git: null,
            github: null,
            fileAnalysis: null
        };
        
        // Git analysis with circuit breaker
        if (this.enableGitAnalysis && staticContext.decision.affected_components?.length > 0) {
            dynamicContext.git = await this.circuitBreakers.git.execute(
                async () => {
                    const enhanced = await decisionEnhancer.enhanceDecision(staticContext.decision, {
                        includeCommits: true,
                        includeFileStatus: true,
                        includeGitHubData: false, // We'll handle GitHub separately
                        maxCommits: 20
                    });
                    
                    return {
                        dateRange: enhanced.date,
                        commits: enhanced.github_metadata?.commits || [],
                        fileStatus: enhanced.github_metadata?.file_status || {},
                        commitCount: enhanced.date?.commit_count || 0
                    };
                },
                () => {
                    this.log(`Git analysis circuit breaker open for decision ${decisionId}`);
                    return null;
                }
            );
        }
        
        // GitHub API data with circuit breaker
        if (this.enableGitHub && githubService.getStatus().configured) {
            dynamicContext.github = await this.circuitBreakers.github.execute(
                async () => {
                    const repoUrl = await gitAnalyzer.getRemoteUrl();
                    if (!repoUrl) return null;
                    
                    const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^.]+)/);
                    if (!match) return null;
                    
                    const [, owner, repo] = match;
                    
                    // Fetch GitHub data in parallel
                    const [prs, issues, workflows] = await Promise.all([
                        githubService.getPullRequestsForDecision(owner, repo, decisionId),
                        githubService.getIssuesForDecision(owner, repo, decisionId),
                        githubService.getWorkflowRuns(owner, repo, { limit: 5 })
                    ]);
                    
                    return {
                        pullRequests: prs,
                        issues: issues,
                        workflowRuns: workflows,
                        repository: { owner, repo }
                    };
                },
                () => {
                    this.log(`GitHub API circuit breaker open for decision ${decisionId}`);
                    return null;
                }
            );
        }
        
        // File analysis for affected components
        if (staticContext.decision.affected_components?.length > 0) {
            dynamicContext.fileAnalysis = await this.analyzeAffectedFiles(
                staticContext.decision.affected_components
            );
        }
        
        return dynamicContext;
    }

    /**
     * Get collaborative context from multi-agent activities (Layer 3)
     */
    async getCollaborativeContext(decisionId) {
        this.metrics.layerUsage.collaborative++;
        
        try {
            // Check collaborative cache
            const cached = this.collaborativeCache.get(decisionId);
            if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
                return cached.data;
            }
            
            const collaborativeContext = {
                reviews: [],
                agentActivities: [],
                dependencies: [],
                sharedKnowledge: {}
            };
            
            // Load any existing review data
            const reviewsPath = path.resolve(`reviews/decision-${decisionId}`);
            try {
                const reviewFiles = await fs.readdir(reviewsPath);
                for (const file of reviewFiles) {
                    if (file.endsWith('.json')) {
                        const content = await fs.readFile(path.join(reviewsPath, file), 'utf8');
                        collaborativeContext.reviews.push(JSON.parse(content));
                    }
                }
            } catch (error) {
                // Reviews directory might not exist
            }
            
            // Get recent agent activities for this decision
            try {
                const response = await fetch(`http://localhost:8080/api/activity?decisionId=${decisionId}`);
                if (response.ok) {
                    const activities = await response.json();
                    collaborativeContext.agentActivities = activities.activities || [];
                }
            } catch (error) {
                // Activity API might not be available
            }
            
            // Analyze agent collaboration patterns
            if (collaborativeContext.agentActivities.length > 0) {
                collaborativeContext.sharedKnowledge = this.analyzeCollaborationPatterns(
                    collaborativeContext.agentActivities
                );
            }
            
            // Cache the result
            this.collaborativeCache.set(decisionId, {
                data: collaborativeContext,
                timestamp: Date.now()
            });
            
            return collaborativeContext;
            
        } catch (error) {
            this.log(`Failed to load collaborative context: ${error.message}`, 'error');
            return {
                reviews: [],
                agentActivities: [],
                dependencies: [],
                sharedKnowledge: {}
            };
        }
    }

    /**
     * Aggregate context from all layers
     */
    aggregateContext(layers) {
        const { static: staticLayer, dynamic: dynamicLayer, collaborative: collaborativeLayer } = layers;
        
        return {
            // Core decision data
            decision: staticLayer.decision,
            
            // Enhanced metadata
            metadata: {
                ...staticLayer.metadata,
                gitAnalysis: dynamicLayer.git,
                githubIntegration: dynamicLayer.github,
                fileAnalysis: dynamicLayer.fileAnalysis,
                collaborationStats: {
                    reviewCount: collaborativeLayer.reviews.length,
                    activeAgents: new Set(collaborativeLayer.agentActivities.map(a => a.agentId)).size,
                    lastActivity: collaborativeLayer.agentActivities[0]?.timestamp
                }
            },
            
            // Related context
            related: {
                decisions: staticLayer.relatedDecisions,
                pullRequests: dynamicLayer.github?.pullRequests || [],
                issues: dynamicLayer.github?.issues || [],
                commits: dynamicLayer.git?.commits || []
            },
            
            // Collaboration insights
            collaboration: {
                reviews: collaborativeLayer.reviews,
                recentActivities: collaborativeLayer.agentActivities.slice(0, 10),
                sharedKnowledge: collaborativeLayer.sharedKnowledge
            },
            
            // Task execution hints
            executionHints: this.generateExecutionHints(staticLayer, dynamicLayer, collaborativeLayer)
        };
    }

    /**
     * Analyze affected files for additional context
     */
    async analyzeAffectedFiles(components) {
        const analysis = {
            totalFiles: components.length,
            existingFiles: 0,
            missingFiles: 0,
            fileTypes: {},
            directories: new Set()
        };
        
        for (const component of components) {
            try {
                const stats = await fs.stat(component);
                if (stats.isFile()) {
                    analysis.existingFiles++;
                    
                    // Track file types
                    const ext = path.extname(component);
                    analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
                    
                    // Track directories
                    analysis.directories.add(path.dirname(component));
                }
            } catch (error) {
                analysis.missingFiles++;
            }
        }
        
        analysis.directories = Array.from(analysis.directories);
        return analysis;
    }

    /**
     * Analyze collaboration patterns from agent activities
     */
    analyzeCollaborationPatterns(activities) {
        const patterns = {
            agentRoles: {},
            taskDistribution: {},
            timelineAnalysis: {
                firstActivity: null,
                lastActivity: null,
                totalDuration: 0
            },
            stateTransitions: []
        };
        
        if (activities.length === 0) return patterns;
        
        // Sort activities by timestamp
        const sorted = [...activities].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        patterns.timelineAnalysis.firstActivity = sorted[0].timestamp;
        patterns.timelineAnalysis.lastActivity = sorted[sorted.length - 1].timestamp;
        patterns.timelineAnalysis.totalDuration = 
            new Date(patterns.timelineAnalysis.lastActivity) - 
            new Date(patterns.timelineAnalysis.firstActivity);
        
        // Analyze agent roles and task distribution
        for (const activity of activities) {
            // Track agent roles
            if (!patterns.agentRoles[activity.agentId]) {
                patterns.agentRoles[activity.agentId] = {
                    states: {},
                    taskCount: 0
                };
            }
            
            patterns.agentRoles[activity.agentId].states[activity.state] = 
                (patterns.agentRoles[activity.agentId].states[activity.state] || 0) + 1;
            
            if (activity.taskDescription) {
                patterns.agentRoles[activity.agentId].taskCount++;
                patterns.taskDistribution[activity.taskDescription] = activity.agentId;
            }
        }
        
        // Track state transitions
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].agentId === sorted[i-1].agentId && 
                sorted[i].state !== sorted[i-1].state) {
                patterns.stateTransitions.push({
                    agent: sorted[i].agentId,
                    from: sorted[i-1].state,
                    to: sorted[i].state,
                    timestamp: sorted[i].timestamp
                });
            }
        }
        
        return patterns;
    }

    /**
     * Generate execution hints based on context
     */
    generateExecutionHints(staticLayer, dynamicLayer, collaborativeLayer) {
        const hints = {
            priority: 'normal',
            estimatedComplexity: 'medium',
            suggestedApproach: [],
            potentialBlockers: [],
            recommendedTools: []
        };
        
        // Determine priority based on status and dependencies
        if (staticLayer.decision.status === 'In Progress') {
            hints.priority = 'high';
        } else if (staticLayer.relatedDecisions.some(d => d.status === 'Blocked')) {
            hints.priority = 'low';
            hints.potentialBlockers.push('Related decisions are blocked');
        }
        
        // Estimate complexity based on various factors
        const taskCount = staticLayer.decision.tasks?.length || 0;
        const fileCount = staticLayer.decision.affected_components?.length || 0;
        const commitCount = dynamicLayer.git?.commitCount || 0;
        
        if (taskCount > 10 || fileCount > 20 || commitCount > 50) {
            hints.estimatedComplexity = 'high';
        } else if (taskCount < 3 && fileCount < 5) {
            hints.estimatedComplexity = 'low';
        }
        
        // Suggest approach based on context
        if (collaborativeLayer.reviews.length > 0) {
            hints.suggestedApproach.push('Review previous agent feedback before starting');
        }
        
        if (dynamicLayer.git?.fileStatus?.missing?.length > 0) {
            hints.suggestedApproach.push('Create missing files identified in file analysis');
            hints.potentialBlockers.push(`${dynamicLayer.git.fileStatus.missing.length} files are missing`);
        }
        
        if (dynamicLayer.github?.pullRequests?.length > 0) {
            hints.suggestedApproach.push('Check related PRs for implementation patterns');
        }
        
        // Recommend tools based on task patterns
        if (staticLayer.decision.tasks?.some(t => t.description.toLowerCase().includes('test'))) {
            hints.recommendedTools.push('testing-framework');
        }
        
        if (fileCount > 10) {
            hints.recommendedTools.push('batch-file-processor');
        }
        
        return hints;
    }

    /**
     * Validate decision context
     */
    async validateDecisionContext(context) {
        const validation = {
            isValid: true,
            completeness: 0,
            missingElements: [],
            warnings: []
        };
        
        // Check required elements
        const requiredElements = [
            { path: 'decision.id', name: 'Decision ID' },
            { path: 'decision.title', name: 'Decision Title' },
            { path: 'decision.status', name: 'Decision Status' }
        ];
        
        let presentElements = 0;
        for (const element of requiredElements) {
            if (this.getNestedValue(context, element.path)) {
                presentElements++;
            } else {
                validation.missingElements.push(element.name);
                validation.isValid = false;
            }
        }
        
        // Calculate completeness score
        const totalElements = requiredElements.length + 5; // Additional optional elements
        validation.completeness = (presentElements / totalElements) * 100;
        
        // Add warnings for missing optional elements
        if (!context.metadata?.gitAnalysis) {
            validation.warnings.push('Git analysis data not available');
        }
        
        if (!context.metadata?.githubIntegration) {
            validation.warnings.push('GitHub integration data not available');
        }
        
        if (!context.collaboration?.reviews?.length) {
            validation.warnings.push('No peer reviews found for this decision');
        }
        
        return validation;
    }

    /**
     * Validate task context
     */
    async validateTaskContext(context) {
        // Similar validation for task-specific context
        return {
            isValid: true,
            completeness: 100,
            missingElements: [],
            warnings: []
        };
    }

    /**
     * Validate collaboration context
     */
    async validateCollaborationContext(context) {
        // Validation for collaboration data
        return {
            isValid: true,
            completeness: 100,
            missingElements: [],
            warnings: []
        };
    }

    /**
     * Validate context based on type
     */
    async validateContext(context, type = 'decision') {
        const validator = this.validationRules.get(type);
        if (!validator) {
            throw new Error(`Unknown context type: ${type}`);
        }
        
        return await validator(context);
    }

    /**
     * Get minimal context when enrichment fails
     */
    async getMinimalContext(decisionId) {
        try {
            const staticContext = await this.getStaticContext(decisionId);
            return {
                decision: staticContext.decision,
                metadata: {
                    ...staticContext.metadata,
                    enrichmentFailed: true,
                    fallbackMode: true
                },
                _metadata: {
                    timestamp: new Date().toISOString(),
                    validation: {
                        isValid: true,
                        completeness: 30,
                        warnings: ['Running in fallback mode due to enrichment failure']
                    }
                }
            };
        } catch (error) {
            // Return absolute minimal context
            return {
                decision: { id: decisionId },
                metadata: { error: error.message },
                _metadata: {
                    timestamp: new Date().toISOString(),
                    validation: { isValid: false, completeness: 0 }
                }
            };
        }
    }

    /**
     * Cache context with metadata
     */
    cacheContext(key, context, validation) {
        const cacheEntry = {
            context,
            validation,
            timestamp: Date.now(),
            hits: 0
        };
        
        // Determine which cache to use based on key
        if (key.startsWith('decision-')) {
            this.dynamicCache.set(key, cacheEntry);
        } else {
            this.collaborativeCache.set(key, cacheEntry);
        }
        
        // Enforce cache size limits
        this.enforceCacheLimits();
    }

    /**
     * Get cached context
     */
    getCachedContext(key) {
        let cached = this.dynamicCache.get(key) || this.collaborativeCache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            cached.hits++;
            return cached.context;
        }
        
        return null;
    }

    /**
     * Enforce cache size limits
     */
    enforceCacheLimits() {
        const enforceLimit = (cache) => {
            if (cache.size > this.maxCacheSize) {
                // Remove least recently used entries
                const entries = Array.from(cache.entries())
                    .sort((a, b) => b[1].timestamp - a[1].timestamp)
                    .slice(this.maxCacheSize);
                
                for (const [key] of entries) {
                    cache.delete(key);
                }
            }
        };
        
        enforceLimit(this.dynamicCache);
        enforceLimit(this.collaborativeCache);
    }

    /**
     * Get context sources for transparency
     */
    getContextSources(context) {
        const sources = [];
        
        if (context.decision) {
            sources.push({ type: 'static', source: 'decisions.yml' });
        }
        
        if (context.metadata?.gitAnalysis) {
            sources.push({ type: 'dynamic', source: 'git-analyzer' });
        }
        
        if (context.metadata?.githubIntegration) {
            sources.push({ type: 'dynamic', source: 'github-api' });
        }
        
        if (context.collaboration?.reviews?.length > 0) {
            sources.push({ type: 'collaborative', source: 'peer-reviews' });
        }
        
        if (context.collaboration?.recentActivities?.length > 0) {
            sources.push({ type: 'collaborative', source: 'agent-activities' });
        }
        
        return sources;
    }

    /**
     * Get nested value from object
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, part) => current?.[part], obj);
    }

    /**
     * Get context quality metrics
     */
    getMetrics() {
        const hitRate = this.metrics.cacheHits / 
            (this.metrics.cacheHits + this.metrics.cacheMisses) || 0;
        
        // Get quality report from monitor
        const qualityReport = contextQualityMonitor.getQualityReport();
        
        return {
            ...this.metrics,
            cacheHitRate: hitRate,
            enrichmentSuccessRate: 1 - (this.metrics.enrichmentFailures / this.metrics.contextRequests),
            circuitBreakerStatus: {
                github: this.circuitBreakers.github.getStatus(),
                git: this.circuitBreakers.git.getStatus()
            },
            contextQuality: qualityReport.summary
        };
    }

    /**
     * Clear all caches
     */
    clearCaches() {
        this.staticCache.clear();
        this.dynamicCache.clear();
        this.collaborativeCache.clear();
        this.log('All caches cleared');
    }

    /**
     * Log with context
     */
    log(message, level = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [ContextAggregator] [${level.toUpperCase()}] ${message}`);
    }
}

// Export singleton instance
export const contextAggregator = new ContextAggregator();
export default contextAggregator;