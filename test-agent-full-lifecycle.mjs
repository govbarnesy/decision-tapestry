#!/usr/bin/env node

/**
 * Full Agent Lifecycle Test
 * Tests the complete agent system from initialization to cleanup
 */

import { ResilientAgent } from './cli/agent-framework-resilient.mjs';
import { contextAggregator } from './cli/context-aggregator.mjs';
import { contextQualityMonitor } from './cli/context-quality-monitor.mjs';

console.log('🧪 Full Agent Lifecycle Test\n');

// Test configuration
const TEST_DECISION_ID = 90;
const TEST_TIMEOUT = 30000; // 30 seconds max

class AgentLifecycleTest {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.agent = null;
        this.startTime = Date.now();
    }

    async assert(condition, message) {
        if (condition) {
            console.log(`✅ ${message}`);
            this.passed++;
        } else {
            console.log(`❌ ${message}`);
            this.failed++;
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async testEnvironmentSetup() {
        console.log('📋 Phase 1: Environment Setup');
        
        // Check dashboard connection
        try {
            const response = await fetch('http://localhost:8080/api/activity');
            await this.assert(response.ok, 'Dashboard server is accessible');
        } catch (error) {
            await this.assert(false, `Dashboard server check failed: ${error.message}`);
        }

        // Check context aggregator initialization
        try {
            const context = await contextAggregator.getDecisionContext(TEST_DECISION_ID);
            await this.assert(context && context.decision, 'Context aggregator loads decision data');
            await this.assert(context._metadata && context._metadata.validation, 'Context validation metadata present');
        } catch (error) {
            await this.assert(false, `Context aggregator failed: ${error.message}`);
        }

        console.log('');
    }

    async testAgentCreation() {
        console.log('🤖 Phase 2: Agent Creation');

        try {
            // Get enriched context first
            const context = await contextAggregator.getDecisionContext(TEST_DECISION_ID);
            
            // Create agent
            this.agent = new ResilientAgent(`TestAgent-${Date.now()}`, TEST_DECISION_ID, {
                context: context,
                contextValidationEnabled: true,
                minContextCompleteness: 30,
                maxRetries: 3,
                enableHealthMonitoring: true,
                serverUrl: 'ws://localhost:8080'
            });

            await this.assert(this.agent !== null, 'Agent instance created');
            await this.assert(this.agent.agentId && this.agent.agentId.includes('TestAgent'), 'Agent ID properly set');
            await this.assert(this.agent.decisionId === TEST_DECISION_ID, 'Decision ID properly set');
            await this.assert(this.agent.enrichedContext !== null, 'Enriched context attached');
        } catch (error) {
            await this.assert(false, `Agent creation failed: ${error.message}`);
        }

        console.log('');
    }

    async testAgentInitialization() {
        console.log('🔧 Phase 3: Agent Initialization');

        if (!this.agent) {
            await this.assert(false, 'No agent to initialize');
            return;
        }

        try {
            // Initialize with timeout
            const initPromise = this.agent.initialize();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Initialization timeout')), 10000)
            );

            await Promise.race([initPromise, timeoutPromise]);

            await this.assert(true, 'Agent initialized successfully');

            // Check agent status
            const status = this.agent.getStatus();
            await this.assert(status.health && status.health.state, 'Agent health state available');
            await this.assert(status.context && typeof status.context.contextQuality === 'number', 'Context quality metrics available');
            await this.assert(status.health.messaging, 'Messaging status available');

            console.log(`   Health: ${status.health.state}`);
            console.log(`   Context Quality: ${status.context.contextQuality}%`);
            console.log(`   Messaging: ${status.health.messaging.connected ? 'Connected' : 'Disconnected'}`);

        } catch (error) {
            await this.assert(false, `Agent initialization failed: ${error.message}`);
        }

        console.log('');
    }

    async testActivityTracking() {
        console.log('💼 Phase 4: Activity Tracking');

        if (!this.agent) {
            await this.assert(false, 'No agent to test activity tracking');
            return;
        }

        try {
            // Test activity update
            await this.agent.updateActivity('working', 'Test task execution');
            await this.assert(true, 'Activity update sent successfully');

            // Wait a moment for activity to propagate
            await this.sleep(500);

            // Check activity server
            const response = await fetch('http://localhost:8080/api/activity');
            const activityData = await response.json();
            
            const agentActivity = activityData.activities.find(a => a.agentId === this.agent.agentId);
            await this.assert(agentActivity !== undefined, 'Agent activity found in server');
            
            if (agentActivity) {
                await this.assert(agentActivity.state === 'working', 'Activity state correctly set to working');
                await this.assert(agentActivity.decisionId === TEST_DECISION_ID, 'Activity linked to correct decision');
                await this.assert(agentActivity.taskDescription === 'Test task execution', 'Task description correctly set');
            }

        } catch (error) {
            await this.assert(false, `Activity tracking failed: ${error.message}`);
        }

        console.log('');
    }

    async testHealthMonitoring() {
        console.log('🏥 Phase 5: Health Monitoring');

        if (!this.agent) {
            await this.assert(false, 'No agent to test health monitoring');
            return;
        }

        try {
            const healthStatus = await this.agent.getHealthStatus();
            await this.assert(healthStatus && typeof healthStatus.healthy === 'boolean', 'Health status available');
            await this.assert(healthStatus.state !== undefined, 'Health state available');
            await this.assert(healthStatus.details !== undefined, 'Health details available');

            console.log(`   Healthy: ${healthStatus.healthy}`);
            console.log(`   State: ${healthStatus.state}`);

            // Test circuit breaker status
            const status = this.agent.getStatus();
            await this.assert(status.health.circuitBreakers !== undefined, 'Circuit breaker status available');
            
            const cbStates = Object.values(status.health.circuitBreakers);
            await this.assert(cbStates.length > 0, 'Circuit breakers configured');

        } catch (error) {
            await this.assert(false, `Health monitoring failed: ${error.message}`);
        }

        console.log('');
    }

    async testContextQuality() {
        console.log('📊 Phase 6: Context Quality');

        try {
            const report = contextQualityMonitor.getQualityReport();
            await this.assert(report && report.summary, 'Quality report available');
            await this.assert(typeof report.summary.averageQuality === 'number', 'Average quality metric available');
            await this.assert(report.summary.totalRequests > 0, 'Quality requests recorded');

            console.log(`   Average Quality: ${report.summary.averageQuality}%`);
            console.log(`   Total Requests: ${report.summary.totalRequests}`);
            console.log(`   Health Status: ${report.summary.healthStatus}`);

        } catch (error) {
            await this.assert(false, `Context quality monitoring failed: ${error.message}`);
        }

        console.log('');
    }

    async testAgentCleanup() {
        console.log('🧹 Phase 7: Agent Cleanup');

        if (!this.agent) {
            await this.assert(false, 'No agent to cleanup');
            return;
        }

        try {
            // Record agent ID for verification
            const agentId = this.agent.agentId;

            // Test graceful shutdown
            await this.agent.gracefulShutdown();
            await this.assert(true, 'Agent graceful shutdown completed');

            // Wait for cleanup to propagate
            await this.sleep(1000);

            // Check that agent is no longer in activity server
            const response = await fetch('http://localhost:8080/api/activity');
            const activityData = await response.json();
            
            const agentActivity = activityData.activities.find(a => a.agentId === agentId);
            if (agentActivity) {
                await this.assert(agentActivity.state === 'idle', 'Agent state set to idle during cleanup');
            } else {
                await this.assert(true, 'Agent completely removed from activity server');
            }

        } catch (error) {
            await this.assert(false, `Agent cleanup failed: ${error.message}`);
        }

        console.log('');
    }

    async testSystemMetrics() {
        console.log('📈 Phase 8: System Metrics');

        try {
            const metrics = contextAggregator.getMetrics();
            await this.assert(metrics && typeof metrics.contextRequests === 'number', 'Context request metrics available');
            await this.assert(typeof metrics.cacheHitRate === 'number', 'Cache hit rate available');
            await this.assert(metrics.circuitBreakerStatus !== undefined, 'Circuit breaker status available');

            console.log(`   Context Requests: ${metrics.contextRequests}`);
            console.log(`   Cache Hit Rate: ${Math.round(metrics.cacheHitRate * 100)}%`);
            console.log(`   Enrichment Success Rate: ${Math.round(metrics.enrichmentSuccessRate * 100)}%`);

        } catch (error) {
            await this.assert(false, `System metrics failed: ${error.message}`);
        }

        console.log('');
    }

    async runFullTest() {
        console.log(`Starting full agent lifecycle test for Decision #${TEST_DECISION_ID}`);
        console.log(`Timeout: ${TEST_TIMEOUT}ms\n`);

        try {
            // Run all test phases
            await this.testEnvironmentSetup();
            await this.testAgentCreation();
            await this.testAgentInitialization();
            await this.testActivityTracking();
            await this.testHealthMonitoring();
            await this.testContextQuality();
            await this.testAgentCleanup();
            await this.testSystemMetrics();

            // Final results
            const duration = Date.now() - this.startTime;
            const total = this.passed + this.failed;
            const successRate = Math.round((this.passed / total) * 100);

            console.log('📊 Test Results:');
            console.log(`   Duration: ${duration}ms`);
            console.log(`   Total Tests: ${total}`);
            console.log(`   Passed: ${this.passed}`);
            console.log(`   Failed: ${this.failed}`);
            console.log(`   Success Rate: ${successRate}%`);

            if (this.failed === 0) {
                console.log('\n🎉 ALL TESTS PASSED! The resilient agent system is fully operational.');
                process.exit(0);
            } else {
                console.log('\n❌ Some tests failed. Review the issues above.');
                process.exit(1);
            }

        } catch (error) {
            console.error('\n💥 Test suite crashed:', error.message);
            process.exit(1);
        }
    }
}

// Run the test with timeout
const test = new AgentLifecycleTest();
const testPromise = test.runFullTest();
const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Test suite timeout')), TEST_TIMEOUT)
);

Promise.race([testPromise, timeoutPromise]).catch(error => {
    console.error('\n⏰ Test suite timed out or crashed:', error.message);
    process.exit(1);
});