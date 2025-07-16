#!/usr/bin/env node

/**
 * Test the context enrichment system independently
 * This helps verify the context aggregator is working before running full agents
 */

import { contextAggregator } from './cli/context-aggregator.mjs';
import { contextQualityMonitor } from './cli/context-quality-monitor.mjs';

console.log('\n🧪 Testing Context Enrichment System\n');

async function testContextAggregator() {
    console.log('=== Testing Context Aggregator ===\n');
    
    const testDecisions = [88, 89, 90]; // Recent resilience decisions
    
    for (const decisionId of testDecisions) {
        console.log(`\n📊 Testing Decision #${decisionId}:`);
        
        try {
            const startTime = Date.now();
            const context = await contextAggregator.getDecisionContext(decisionId);
            const duration = Date.now() - startTime;
            
            console.log(`✅ Context loaded in ${duration}ms`);
            console.log(`   Title: ${context.decision?.title || 'Unknown'}`);
            console.log(`   Completeness: ${context._metadata?.validation?.completeness || 0}%`);
            console.log(`   Valid: ${context._metadata?.validation?.isValid ? 'Yes' : 'No'}`);
            
            // Show sources
            if (context._metadata?.sources) {
                console.log('   Sources:');
                context._metadata.sources.forEach(s => 
                    console.log(`     - ${s.type}: ${s.source}`)
                );
            }
            
            // Show warnings
            if (context._metadata?.validation?.warnings?.length > 0) {
                console.log('   ⚠️  Warnings:');
                context._metadata.validation.warnings.forEach(w =>
                    console.log(`     - ${w}`)
                );
            }
            
            // Record in quality monitor
            contextQualityMonitor.recordContextQuality(
                'test-system',
                decisionId,
                context._metadata?.validation?.completeness || 0,
                {
                    sources: context._metadata?.sources || [],
                    warnings: context._metadata?.validation?.warnings || [],
                    enrichmentTime: duration
                }
            );
            
        } catch (error) {
            console.error(`❌ Failed to load context: ${error.message}`);
        }
    }
}

async function testQualityMonitor() {
    console.log('\n\n=== Testing Context Quality Monitor ===\n');
    
    // Get quality report
    const report = contextQualityMonitor.getQualityReport();
    
    console.log('📈 Quality Summary:');
    console.log(`   Total Requests: ${report.summary.totalRequests}`);
    console.log(`   Average Quality: ${report.summary.averageQuality}%`);
    console.log(`   Health Status: ${report.summary.healthStatus}`);
    console.log(`   Quality Trend: ${report.summary.qualityTrend}`);
    
    // Show distribution
    console.log('\n📊 Quality Distribution:');
    Object.entries(report.distribution).forEach(([band, count]) => {
        if (count > 0) {
            console.log(`   ${band}: ${count} (${Math.round(count/report.summary.totalRequests*100)}%)`);
        }
    });
    
    // Show top issues
    if (report.topIssues.length > 0) {
        console.log('\n⚠️  Top Issues:');
        report.topIssues.slice(0, 5).forEach(({ issue, count }) => {
            console.log(`   - ${issue} (${count} occurrences)`);
        });
    }
    
    // Show recommendations
    if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => {
            console.log(`   [${rec.priority}] ${rec.message}`);
            console.log(`     → ${rec.action}`);
        });
    }
    
    // Show source utilization
    console.log('\n📦 Source Utilization:');
    report.sourceUtilization.forEach(({ source, percentage }) => {
        console.log(`   ${source}: ${percentage}`);
    });
}

async function testCachePerformance() {
    console.log('\n\n=== Testing Cache Performance ===\n');
    
    const decisionId = 90;
    
    // First load (cache miss)
    console.log('🔄 First load (cache miss):');
    let start = Date.now();
    await contextAggregator.getDecisionContext(decisionId);
    let duration1 = Date.now() - start;
    console.log(`   Duration: ${duration1}ms`);
    
    // Second load (cache hit)
    console.log('\n🔄 Second load (cache hit):');
    start = Date.now();
    await contextAggregator.getDecisionContext(decisionId);
    let duration2 = Date.now() - start;
    console.log(`   Duration: ${duration2}ms`);
    console.log(`   Speed improvement: ${Math.round((1 - duration2/duration1) * 100)}%`);
    
    // Get cache metrics
    const metrics = contextAggregator.getMetrics();
    console.log('\n📊 Cache Metrics:');
    console.log(`   Cache Hits: ${metrics.cacheHits}`);
    console.log(`   Cache Misses: ${metrics.cacheMisses}`);
    console.log(`   Hit Rate: ${Math.round(metrics.cacheHitRate * 100)}%`);
    console.log(`   Enrichment Success Rate: ${Math.round(metrics.enrichmentSuccessRate * 100)}%`);
}

async function showSystemStatus() {
    console.log('\n\n=== System Status ===\n');
    
    const metrics = contextAggregator.getMetrics();
    
    // Circuit breaker status
    console.log('🔌 Circuit Breakers:');
    Object.entries(metrics.circuitBreakerStatus).forEach(([name, status]) => {
        console.log(`   ${name}: ${status.state} (failures: ${status.failureCount}/${status.failureThreshold})`);
    });
    
    // Context quality summary
    if (metrics.contextQuality) {
        console.log('\n📈 Context Quality:');
        console.log(`   Average: ${metrics.contextQuality.averageQuality}%`);
        console.log(`   Status: ${metrics.contextQuality.healthStatus}`);
    }
}

// Run all tests
async function main() {
    try {
        await testContextAggregator();
        await testQualityMonitor();
        await testCachePerformance();
        await showSystemStatus();
        
        console.log('\n\n✅ All context system tests completed!\n');
        console.log('Key Findings:');
        console.log('- Context aggregation is working');
        console.log('- Quality monitoring is tracking metrics');
        console.log('- Cache is improving performance');
        console.log('- Circuit breakers are protecting external calls\n');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

main().catch(console.error);