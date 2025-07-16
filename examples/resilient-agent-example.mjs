#!/usr/bin/env node

/**
 * Example: Using the Resilient Agent Framework
 * Demonstrates fault-tolerant agent coordination with health monitoring
 */

import { createResilientAgent, createResilientAgentTeam } from '../cli/agent-framework-resilient.mjs';
import { AgentCoordinator } from '../cli/agent-coordinator.mjs';

async function demonstrateResilientAgent() {
    console.log('🤖 Resilient Agent Framework Demo\n');
    
    // Create a single resilient agent
    const agent = createResilientAgent(123, {
        name: 'ResilientAgent-123',
        healthCheckInterval: 5000,
        maxReconnectAttempts: 5
    });
    
    // Monitor agent health
    agent.healthMonitor.on('state-change', ({ from, to }) => {
        console.log(`💊 Health state changed: ${from} → ${to}`);
    });
    
    agent.healthMonitor.on('alert', (alert) => {
        console.log(`🚨 Alert: ${alert.type} - ${alert.message}`);
    });
    
    // Monitor circuit breakers
    Object.entries(agent.circuitBreakers).forEach(([name, cb]) => {
        cb.on('state-change', ({ from, to }) => {
            console.log(`⚡ Circuit breaker ${name}: ${from} → ${to}`);
        });
    });
    
    // Initialize the agent
    await agent.initialize();
    
    // Simulate various operations
    console.log('\n📋 Running resilient operations...\n');
    
    // 1. Normal file operation
    try {
        await agent.writeFile('test-resilient.txt', 'Testing resilient file operations');
        console.log('✅ File write successful');
    } catch (error) {
        console.log('❌ File write failed:', error.message);
    }
    
    // 2. Simulate failures to trigger circuit breaker
    console.log('\n🔨 Simulating failures...\n');
    
    // Force file system failures
    agent.circuitBreakers.fileOps.errorFilter = () => true; // Count all errors
    
    for (let i = 0; i < 6; i++) {
        try {
            // This will fail and increment circuit breaker
            await agent.readFile('/invalid/path/that/does/not/exist.txt');
        } catch (error) {
            console.log(`❌ Attempt ${i + 1} failed: ${error.message}`);
        }
    }
    
    // Circuit breaker should now be open
    console.log('\n⚡ Circuit breaker should now be OPEN');
    
    // Try another operation - should use fallback
    try {
        const result = await agent.readFile('any-file.txt');
        console.log('📦 Got result from fallback:', result);
    } catch (error) {
        console.log('❌ Operation rejected:', error.message);
    }
    
    // 3. Test health monitoring
    console.log('\n🏥 Testing health monitoring...\n');
    
    // Trigger memory alert
    agent.healthMonitor.alertThresholds.memoryUsage = 1; // 1 byte - will trigger alert
    await agent.healthMonitor.performHealthCheck();
    
    // Get comprehensive status
    console.log('\n📊 Agent Status Report:\n');
    const status = agent.getStatus();
    console.log(JSON.stringify(status, null, 2));
    
    // 4. Test recovery mechanisms
    console.log('\n🔧 Testing recovery...\n');
    
    // Wait for circuit breaker to enter half-open state
    setTimeout(async () => {
        console.log('⏰ Attempting recovery after timeout...');
        
        // Reset error filter
        agent.circuitBreakers.fileOps.errorFilter = (error) => error.code === 'ENOENT';
        
        // Try a valid operation
        try {
            await agent.writeFile('recovery-test.txt', 'Recovery successful!');
            console.log('✅ Recovery successful - circuit breaker should close');
        } catch (error) {
            console.log('❌ Recovery failed:', error.message);
        }
        
        // Final status
        console.log('\n📊 Final Status:\n');
        const finalStatus = agent.getStatus();
        console.log(`Health: ${finalStatus.health.state}`);
        console.log(`Mode: ${finalStatus.health.mode}`);
        console.log('Circuit Breakers:');
        Object.entries(finalStatus.health.circuitBreakers).forEach(([name, cb]) => {
            console.log(`  ${name}: ${cb.state}`);
        });
        
        // Cleanup
        await agent.cleanup();
        console.log('\n✅ Demo completed');
        process.exit(0);
    }, 5000);
}

async function demonstrateResilientTeam() {
    console.log('\n👥 Resilient Agent Team Demo\n');
    
    // Sample decisions for team
    const decisions = [
        { id: 1, title: 'Implement caching', dependencies: [] },
        { id: 2, title: 'Add monitoring', dependencies: [1] },
        { id: 3, title: 'Performance optimization', dependencies: [1, 2] }
    ];
    
    // Create resilient agent team
    const team = createResilientAgentTeam(decisions, {
        healthCheckInterval: 10000,
        failureThreshold: 3
    });
    
    // Create coordinator with health awareness
    const coordinator = new AgentCoordinator();
    
    // Monitor team health
    team.forEach(agent => {
        agent.healthMonitor.on('state-change', ({ from, to }) => {
            console.log(`💊 Agent ${agent.agentId} health: ${from} → ${to}`);
            
            // Notify coordinator of unhealthy agents
            if (to === 'unhealthy' || to === 'critical') {
                coordinator.handleAgentFailure(agent.agentId);
            }
        });
    });
    
    // Initialize all agents
    await Promise.all(team.map(agent => agent.initialize()));
    
    console.log(`✅ Team of ${team.length} resilient agents ready`);
    
    // Coordinate work with fault tolerance
    try {
        await coordinator.coordinateAgents(team, decisions);
        console.log('✅ Team coordination completed successfully');
    } catch (error) {
        console.log('❌ Team coordination failed:', error.message);
    }
    
    // Cleanup team
    await Promise.all(team.map(agent => agent.cleanup()));
}

// Run demos
if (process.argv[2] === '--team') {
    demonstrateResilientTeam().catch(console.error);
} else {
    demonstrateResilientAgent().catch(console.error);
}

// Usage instructions
console.log(`
Usage:
  node resilient-agent-example.mjs          # Single agent demo
  node resilient-agent-example.mjs --team   # Team coordination demo
`);