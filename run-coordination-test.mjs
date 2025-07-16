#!/usr/bin/env node

/**
 * Test script for real agent coordination
 */

import { AgentCoordinator } from './cli/agent-coordinator.mjs';

async function runCoordinationTest() {
    console.log('🚀 Starting Real Agent Coordination Test');
    console.log('📊 Dashboard should be open at http://localhost:8080');
    console.log('👀 Watch the "Agents" tab for real-time coordination!');
    console.log('');

    const coordinator = new AgentCoordinator();
    
    try {
        // Initialize coordinator
        console.log('Initializing coordinator...');
        await coordinator.initialize();
        
        // Test peer review system with pending decision
        const decisions = [68]; // Try decision 68 for peer review testing
        console.log(`Coordinating decisions: ${decisions.join(', ')}`);
        
        // Set max concurrent agents
        coordinator.maxConcurrentAgents = 3;
        
        // Start coordination
        await coordinator.coordinateDecisions(decisions);
        
        // Show final status
        const status = coordinator.getStatus();
        console.log('\n🎯 Coordination Results:');
        console.log(`   Total: ${status.total}`);
        console.log(`   Completed: ${status.completed}`);
        console.log(`   Failed: ${status.failed}`);
        console.log(`   Errors: ${status.errors.length}`);
        
        if (status.errors.length > 0) {
            console.log('\n❌ Errors:');
            status.errors.forEach(error => console.log(`   - ${error}`));
        }
        
    } catch (error) {
        console.error('❌ Coordination failed:', error.message);
        process.exit(1);
    } finally {
        // Cleanup
        await coordinator.cleanup();
        console.log('\n✅ Coordination test completed');
        process.exit(0);
    }
}

// Run the test
runCoordinationTest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});