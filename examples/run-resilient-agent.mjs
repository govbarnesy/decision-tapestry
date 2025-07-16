#!/usr/bin/env node

/**
 * Example: Running a Resilient Agent with Context Enrichment
 * This shows how to properly set up and run an agent with all features
 */

import { ResilientAgent } from '../cli/agent-framework-resilient.mjs';
import { contextAggregator } from '../cli/context-aggregator.mjs';
import { contextQualityMonitor } from '../cli/context-quality-monitor.mjs';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const decisionId = parseInt(args.find(arg => arg.startsWith('--decision='))?.split('=')[1] || '90');

console.log(`\n🚀 Running Resilient Agent for Decision #${decisionId}\n`);

async function setupEnvironment() {
    console.log('📋 Checking environment setup...\n');
    
    // Check if dashboard is running
    try {
        const response = await fetch('http://localhost:8080/api/decisions');
        if (!response.ok) {
            console.warn('⚠️  Dashboard server not responding properly');
        } else {
            console.log('✅ Dashboard server is running');
        }
    } catch (error) {
        console.error('❌ Dashboard server is not running!');
        console.log('   Please start it with: npm start\n');
        return false;
    }
    
    // Check Git repository
    try {
        await fs.access('.git');
        console.log('✅ Git repository found');
    } catch {
        console.warn('⚠️  No Git repository found - Git analysis will be limited');
    }
    
    // Check decisions.yml
    try {
        await fs.access('decisions.yml');
        console.log('✅ decisions.yml found');
    } catch {
        console.error('❌ decisions.yml not found!');
        return false;
    }
    
    return true;
}

async function runAgent() {
    try {
        // Step 1: Fetch enriched context
        console.log('\n📊 Fetching enriched context...');
        const startTime = Date.now();
        
        const context = await contextAggregator.getDecisionContext(decisionId, {
            forceRefresh: true
        });
        
        const enrichmentTime = Date.now() - startTime;
        console.log(`✅ Context loaded in ${enrichmentTime}ms`);
        console.log(`   Completeness: ${context._metadata.validation.completeness}%`);
        console.log(`   Sources: ${context._metadata.sources.map(s => s.source).join(', ')}`);
        
        // Display warnings if any
        if (context._metadata.validation.warnings?.length > 0) {
            console.log('\n⚠️  Context Warnings:');
            context._metadata.validation.warnings.forEach(w => 
                console.log(`   - ${w}`)
            );
        }
        
        // Step 2: Create agent with proper dependencies injected
        console.log('\n🤖 Creating resilient agent...');
        
        // Inject required dependencies that might be missing
        const agent = new ResilientAgent(`Agent-${decisionId}`, decisionId, {
            context: context,
            contextValidationEnabled: true,
            minContextCompleteness: 30, // Lower threshold for testing
            maxRetries: 3,
            enableHealthMonitoring: true
        });
        
        // Patch missing fs and exec if needed
        if (!agent.fs) {
            agent.fs = fs;
        }
        if (!agent.exec) {
            agent.exec = async (cmd) => {
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                return promisify(exec)(cmd);
            };
        }
        
        // Step 3: Set up monitoring
        console.log('📡 Setting up monitoring...');
        
        let healthAlerts = [];
        agent.healthMonitor.on('alert', (alert) => {
            healthAlerts.push(alert);
            if (alert.type !== 'health-check-failed') {
                console.log(`   🚨 ${alert.type}: ${alert.message}`);
            }
        });
        
        agent.healthMonitor.on('state-change', ({ from, to }) => {
            console.log(`   🔄 Health: ${from} → ${to}`);
        });
        
        // Record context quality
        contextQualityMonitor.recordContextQuality(
            agent.agentId,
            decisionId,
            context._metadata.validation.completeness,
            {
                sources: context._metadata.sources,
                warnings: context._metadata.validation.warnings,
                enrichmentTime: enrichmentTime
            }
        );
        
        // Step 4: Initialize agent
        console.log('\n🔧 Initializing agent...');
        await agent.initialize();
        
        const status = agent.getStatus();
        console.log('✅ Agent initialized successfully');
        console.log(`   Health State: ${status.health.state}`);
        console.log(`   Context Quality: ${status.context.contextQuality}%`);
        console.log(`   Messaging: ${status.health.messaging.connected ? 'Connected' : 'Disconnected'}`);
        
        // Step 5: Display decision details
        console.log('\n📋 Decision Details:');
        console.log(`   ID: ${context.decision.id}`);
        console.log(`   Title: ${context.decision.title}`);
        console.log(`   Status: ${context.decision.status}`);
        console.log(`   Tasks: ${context.decision.tasks?.length || 0}`);
        console.log(`   Components: ${context.decision.affected_components?.length || 0}`);
        
        // Step 6: Execute some tasks (if any)
        if (context.decision.tasks?.length > 0) {
            console.log('\n💼 Executing tasks...');
            const task = context.decision.tasks[0];
            console.log(`   Task: ${task.description}`);
            console.log(`   Status: ${task.status}`);
            
            // Simulate task execution
            try {
                await agent.updateActivity('working', task.description);
                console.log('   ✅ Activity updated');
            } catch (error) {
                console.log('   ⚠️  Activity update failed (normal if offline)');
            }
        }
        
        // Step 7: Generate quality report
        console.log('\n📈 Context Quality Report:');
        const qualityReport = contextQualityMonitor.getQualityReport();
        
        console.log(`   Total Requests: ${qualityReport.summary.totalRequests}`);
        console.log(`   Average Quality: ${qualityReport.summary.averageQuality}%`);
        console.log(`   Health Status: ${qualityReport.summary.healthStatus}`);
        
        if (qualityReport.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            qualityReport.recommendations.slice(0, 3).forEach(rec => {
                console.log(`   [${rec.priority}] ${rec.message}`);
                console.log(`     → ${rec.action}`);
            });
        }
        
        // Step 8: Show execution hints
        if (context.executionHints) {
            console.log('\n🎯 Execution Hints:');
            console.log(`   Priority: ${context.executionHints.priority}`);
            console.log(`   Complexity: ${context.executionHints.estimatedComplexity}`);
            if (context.executionHints.suggestedApproach.length > 0) {
                console.log('   Suggested Approach:');
                context.executionHints.suggestedApproach.forEach(hint =>
                    console.log(`     - ${hint}`)
                );
            }
        }
        
        // Cleanup
        await agent.cleanup();
        console.log('\n✅ Agent execution completed successfully!\n');
        
    } catch (error) {
        console.error('\n❌ Agent execution failed:', error.message);
        console.error('\nTroubleshooting tips:');
        console.error('1. Ensure dashboard is running: npm start');
        console.error('2. Check decisions.yml exists and is valid');
        console.error('3. Verify Git repository is initialized');
        console.error('4. See AGENT-SETUP-GUIDE.md for full setup instructions\n');
    }
}

// Main execution
async function main() {
    const setupOk = await setupEnvironment();
    if (!setupOk) {
        console.error('\n❌ Environment setup incomplete. Please fix the issues above.\n');
        process.exit(1);
    }
    
    await runAgent();
}

main().catch(console.error);