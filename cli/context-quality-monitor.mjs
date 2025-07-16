/**
 * Context Quality Monitor
 * Tracks and reports on context quality metrics across agents
 */

import EventEmitter from 'events';
import { promises as fs } from 'fs';
import path from 'path';

export class ContextQualityMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Configuration
        this.metricsWindow = options.metricsWindow || 1000; // Keep last 1000 metrics
        this.reportingInterval = options.reportingInterval || 60000; // Report every minute
        this.qualityThresholds = {
            excellent: options.excellentThreshold || 90,
            good: options.goodThreshold || 70,
            acceptable: options.acceptableThreshold || 50,
            poor: options.poorThreshold || 30
        };
        
        // Metrics storage
        this.metrics = {
            contextRequests: [],
            qualityScores: [],
            validationFailures: [],
            contextSources: new Map(),
            agentMetrics: new Map(),
            decisionMetrics: new Map()
        };
        
        // Aggregated stats
        this.stats = {
            totalRequests: 0,
            averageQuality: 0,
            qualityDistribution: {
                excellent: 0,
                good: 0,
                acceptable: 0,
                poor: 0,
                failing: 0
            },
            topIssues: [],
            recommendations: []
        };
        
        // Start periodic reporting if enabled
        if (options.autoReport) {
            this.startReporting();
        }
    }
    
    /**
     * Record context quality metric
     */
    recordContextQuality(agentId, decisionId, quality, metadata = {}) {
        const metric = {
            timestamp: Date.now(),
            agentId,
            decisionId,
            quality,
            qualityBand: this.getQualityBand(quality),
            sources: metadata.sources || [],
            warnings: metadata.warnings || [],
            missingElements: metadata.missingElements || [],
            enrichmentTime: metadata.enrichmentTime || 0
        };
        
        // Add to metrics arrays
        this.metrics.contextRequests.push(metric);
        this.metrics.qualityScores.push(quality);
        
        // Update agent-specific metrics
        if (!this.metrics.agentMetrics.has(agentId)) {
            this.metrics.agentMetrics.set(agentId, {
                requests: 0,
                totalQuality: 0,
                failures: 0,
                warnings: []
            });
        }
        
        const agentMetrics = this.metrics.agentMetrics.get(agentId);
        agentMetrics.requests++;
        agentMetrics.totalQuality += quality;
        
        if (metadata.warnings?.length > 0) {
            agentMetrics.warnings.push(...metadata.warnings);
        }
        
        // Update decision-specific metrics
        if (!this.metrics.decisionMetrics.has(decisionId)) {
            this.metrics.decisionMetrics.set(decisionId, {
                requests: 0,
                totalQuality: 0,
                lowestQuality: 100,
                highestQuality: 0
            });
        }
        
        const decisionMetrics = this.metrics.decisionMetrics.get(decisionId);
        decisionMetrics.requests++;
        decisionMetrics.totalQuality += quality;
        decisionMetrics.lowestQuality = Math.min(decisionMetrics.lowestQuality, quality);
        decisionMetrics.highestQuality = Math.max(decisionMetrics.highestQuality, quality);
        
        // Track source usage
        metadata.sources?.forEach(source => {
            const count = this.metrics.contextSources.get(source.type) || 0;
            this.metrics.contextSources.set(source.type, count + 1);
        });
        
        // Maintain window size
        this.pruneMetrics();
        
        // Update stats
        this.updateStats();
        
        // Emit events for monitoring
        this.emit('quality-recorded', metric);
        
        if (quality < this.qualityThresholds.poor) {
            this.emit('low-quality-alert', {
                agentId,
                decisionId,
                quality,
                warnings: metadata.warnings
            });
        }
        
        return metric;
    }
    
    /**
     * Record validation failure
     */
    recordValidationFailure(agentId, decisionId, error, context = {}) {
        const failure = {
            timestamp: Date.now(),
            agentId,
            decisionId,
            error: error.message,
            missingElements: context.missingElements || [],
            contextQuality: context.quality || 0
        };
        
        this.metrics.validationFailures.push(failure);
        
        // Update agent failure count
        const agentMetrics = this.metrics.agentMetrics.get(agentId);
        if (agentMetrics) {
            agentMetrics.failures++;
        }
        
        // Emit alert
        this.emit('validation-failure', failure);
        
        // Update stats
        this.updateStats();
        
        return failure;
    }
    
    /**
     * Get quality band for a score
     */
    getQualityBand(quality) {
        if (quality >= this.qualityThresholds.excellent) return 'excellent';
        if (quality >= this.qualityThresholds.good) return 'good';
        if (quality >= this.qualityThresholds.acceptable) return 'acceptable';
        if (quality >= this.qualityThresholds.poor) return 'poor';
        return 'failing';
    }
    
    /**
     * Update aggregated statistics
     */
    updateStats() {
        const scores = this.metrics.qualityScores;
        if (scores.length === 0) return;
        
        // Calculate average
        this.stats.totalRequests = scores.length;
        this.stats.averageQuality = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        // Calculate distribution
        this.stats.qualityDistribution = {
            excellent: 0,
            good: 0,
            acceptable: 0,
            poor: 0,
            failing: 0
        };
        
        scores.forEach(score => {
            const band = this.getQualityBand(score);
            this.stats.qualityDistribution[band]++;
        });
        
        // Identify top issues
        const issueFrequency = new Map();
        this.metrics.contextRequests.forEach(metric => {
            metric.warnings.forEach(warning => {
                issueFrequency.set(warning, (issueFrequency.get(warning) || 0) + 1);
            });
            metric.missingElements.forEach(element => {
                const issue = `Missing: ${element}`;
                issueFrequency.set(issue, (issueFrequency.get(issue) || 0) + 1);
            });
        });
        
        this.stats.topIssues = Array.from(issueFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([issue, count]) => ({ issue, count }));
        
        // Generate recommendations
        this.stats.recommendations = this.generateRecommendations();
    }
    
    /**
     * Generate recommendations based on metrics
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Check overall quality
        if (this.stats.averageQuality < this.qualityThresholds.acceptable) {
            recommendations.push({
                priority: 'high',
                message: 'Average context quality is below acceptable threshold',
                action: 'Review data sources and ensure all required metadata is available'
            });
        }
        
        // Check failure rate
        const failureRate = this.metrics.validationFailures.length / this.stats.totalRequests;
        if (failureRate > 0.1) {
            recommendations.push({
                priority: 'high',
                message: `High validation failure rate: ${(failureRate * 100).toFixed(1)}%`,
                action: 'Review validation requirements and ensure minimum context is available'
            });
        }
        
        // Check for consistently low-quality agents
        this.metrics.agentMetrics.forEach((metrics, agentId) => {
            const avgQuality = metrics.totalQuality / metrics.requests;
            if (avgQuality < this.qualityThresholds.poor) {
                recommendations.push({
                    priority: 'medium',
                    message: `Agent ${agentId} has consistently low context quality`,
                    action: `Review context sources for agent ${agentId}`
                });
            }
        });
        
        // Check for missing sources
        const sourceTypes = ['static', 'dynamic', 'collaborative'];
        sourceTypes.forEach(type => {
            const usage = this.metrics.contextSources.get(type) || 0;
            const usageRate = usage / this.stats.totalRequests;
            if (usageRate < 0.5) {
                recommendations.push({
                    priority: 'medium',
                    message: `Low usage of ${type} context sources (${(usageRate * 100).toFixed(1)}%)`,
                    action: `Ensure ${type} context sources are properly configured and accessible`
                });
            }
        });
        
        // Check for common issues
        this.stats.topIssues.slice(0, 3).forEach(({ issue, count }) => {
            const issueRate = count / this.stats.totalRequests;
            if (issueRate > 0.2) {
                recommendations.push({
                    priority: 'medium',
                    message: `Frequent issue: ${issue} (${(issueRate * 100).toFixed(1)}% of requests)`,
                    action: `Address root cause of: ${issue}`
                });
            }
        });
        
        return recommendations;
    }
    
    /**
     * Get quality report
     */
    getQualityReport() {
        return {
            summary: {
                totalRequests: this.stats.totalRequests,
                averageQuality: Math.round(this.stats.averageQuality),
                qualityTrend: this.calculateQualityTrend(),
                healthStatus: this.getHealthStatus()
            },
            distribution: this.stats.qualityDistribution,
            topIssues: this.stats.topIssues,
            recommendations: this.stats.recommendations,
            agentPerformance: this.getAgentPerformance(),
            decisionAnalysis: this.getDecisionAnalysis(),
            sourceUtilization: this.getSourceUtilization()
        };
    }
    
    /**
     * Calculate quality trend
     */
    calculateQualityTrend() {
        if (this.metrics.qualityScores.length < 10) {
            return 'insufficient_data';
        }
        
        const recentScores = this.metrics.qualityScores.slice(-10);
        const olderScores = this.metrics.qualityScores.slice(-20, -10);
        
        const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
        
        const difference = recentAvg - olderAvg;
        
        if (Math.abs(difference) < 5) return 'stable';
        return difference > 0 ? 'improving' : 'declining';
    }
    
    /**
     * Get overall health status
     */
    getHealthStatus() {
        if (this.stats.averageQuality >= this.qualityThresholds.good) {
            return 'healthy';
        } else if (this.stats.averageQuality >= this.qualityThresholds.acceptable) {
            return 'acceptable';
        } else if (this.stats.averageQuality >= this.qualityThresholds.poor) {
            return 'degraded';
        }
        return 'critical';
    }
    
    /**
     * Get agent performance metrics
     */
    getAgentPerformance() {
        const performance = [];
        
        this.metrics.agentMetrics.forEach((metrics, agentId) => {
            const avgQuality = metrics.requests > 0 ? 
                metrics.totalQuality / metrics.requests : 0;
            
            performance.push({
                agentId,
                requests: metrics.requests,
                averageQuality: Math.round(avgQuality),
                failures: metrics.failures,
                failureRate: metrics.requests > 0 ? 
                    (metrics.failures / metrics.requests * 100).toFixed(1) + '%' : '0%',
                status: this.getQualityBand(avgQuality)
            });
        });
        
        return performance.sort((a, b) => b.averageQuality - a.averageQuality);
    }
    
    /**
     * Get decision analysis
     */
    getDecisionAnalysis() {
        const analysis = [];
        
        this.metrics.decisionMetrics.forEach((metrics, decisionId) => {
            const avgQuality = metrics.requests > 0 ? 
                metrics.totalQuality / metrics.requests : 0;
            
            analysis.push({
                decisionId,
                requests: metrics.requests,
                averageQuality: Math.round(avgQuality),
                qualityRange: {
                    min: metrics.lowestQuality,
                    max: metrics.highestQuality
                },
                consistency: metrics.highestQuality - metrics.lowestQuality < 20 ? 
                    'consistent' : 'variable'
            });
        });
        
        return analysis.sort((a, b) => a.averageQuality - b.averageQuality).slice(0, 10);
    }
    
    /**
     * Get source utilization
     */
    getSourceUtilization() {
        const utilization = [];
        const total = this.stats.totalRequests || 1;
        
        this.metrics.contextSources.forEach((count, source) => {
            utilization.push({
                source,
                count,
                percentage: ((count / total) * 100).toFixed(1) + '%'
            });
        });
        
        return utilization.sort((a, b) => b.count - a.count);
    }
    
    /**
     * Prune old metrics to maintain window size
     */
    pruneMetrics() {
        if (this.metrics.contextRequests.length > this.metricsWindow) {
            this.metrics.contextRequests = this.metrics.contextRequests.slice(-this.metricsWindow);
        }
        
        if (this.metrics.qualityScores.length > this.metricsWindow) {
            this.metrics.qualityScores = this.metrics.qualityScores.slice(-this.metricsWindow);
        }
        
        if (this.metrics.validationFailures.length > this.metricsWindow) {
            this.metrics.validationFailures = this.metrics.validationFailures.slice(-this.metricsWindow);
        }
    }
    
    /**
     * Start periodic reporting
     */
    startReporting() {
        this.reportingInterval = setInterval(() => {
            const report = this.getQualityReport();
            this.emit('quality-report', report);
            
            // Log summary
            this.log(`Context Quality Report: Avg ${report.summary.averageQuality}% (${report.summary.healthStatus})`);
            
            // Save report if path configured
            if (this.reportPath) {
                this.saveReport(report);
            }
        }, this.reportingInterval);
    }
    
    /**
     * Stop periodic reporting
     */
    stopReporting() {
        if (this.reportingInterval) {
            clearInterval(this.reportingInterval);
            this.reportingInterval = null;
        }
    }
    
    /**
     * Save report to file
     */
    async saveReport(report) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `context-quality-report-${timestamp}.json`;
            const filepath = path.join(this.reportPath, filename);
            
            await fs.writeFile(filepath, JSON.stringify(report, null, 2));
            this.log(`Report saved to ${filepath}`);
        } catch (error) {
            this.log(`Failed to save report: ${error.message}`, 'error');
        }
    }
    
    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.metrics = {
            contextRequests: [],
            qualityScores: [],
            validationFailures: [],
            contextSources: new Map(),
            agentMetrics: new Map(),
            decisionMetrics: new Map()
        };
        
        this.stats = {
            totalRequests: 0,
            averageQuality: 0,
            qualityDistribution: {
                excellent: 0,
                good: 0,
                acceptable: 0,
                poor: 0,
                failing: 0
            },
            topIssues: [],
            recommendations: []
        };
        
        this.emit('metrics-cleared');
    }
    
    /**
     * Log message
     */
    log(message, level = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [ContextQualityMonitor] [${level.toUpperCase()}] ${message}`);
    }
}

// Export singleton instance
export const contextQualityMonitor = new ContextQualityMonitor({
    autoReport: false // Enable manually when needed
});

export default contextQualityMonitor;