#!/usr/bin/env node

import { WebSocket } from 'ws';
import fetch from 'node-fetch';
import { setTimeout as delay } from 'timers/promises';

const BASE_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080';

// Test configuration
const TEST_AGENTS = ['agent-1', 'agent-2', 'agent-3', 'agent-4'];
const TEST_STATES = ['idle', 'working', 'debugging', 'testing', 'reviewing'];
const TEST_DECISIONS = [59, 60, 61, 62];

class ActivitySystemTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    this.wsConnections = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive Activity System Tests\n');
    
    // Test 1: Basic Activity Submission
    await this.testBasicActivitySubmission();
    
    // Test 2: WebSocket Real-time Updates
    await this.testWebSocketUpdates();
    
    // Test 3: Activity State Transitions
    await this.testActivityStateTransitions();
    
    // Test 4: Multi-Agent Coordination
    await this.testMultiAgentCoordination();
    
    // Test 5: Activity History and Persistence
    await this.testActivityHistory();
    
    // Test 6: Performance Under Load
    await this.testPerformanceUnderLoad();
    
    // Test 7: Error Handling
    await this.testErrorHandling();
    
    // Test 8: Analytics Endpoints
    await this.testAnalyticsEndpoints();
    
    // Cleanup
    this.cleanup();
    
    // Report results
    this.reportResults();
  }

  async testBasicActivitySubmission() {
    console.log('📝 Test 1: Basic Activity Submission');
    
    try {
      const response = await fetch(`${BASE_URL}/api/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'agent-4',
          state: 'working',
          decisionId: 59,
          taskDescription: 'Testing basic activity submission'
        })
      });
      
      const data = await response.json();
      this.assert(response.status === 200, 'Activity submission should return 200');
      this.assert(data.message === 'Activity updated successfully', 'Should return success message');
      
      // Verify activity was stored
      const getResponse = await fetch(`${BASE_URL}/api/activity`);
      const activities = await getResponse.json();
      const ourActivity = activities.activities.find(a => a.agentId === 'agent-4');
      
      this.assert(ourActivity !== undefined, 'Activity should be retrievable');
      this.assert(ourActivity.state === 'working', 'Activity state should match');
      this.assert(ourActivity.decisionId === 59, 'Decision ID should match');
      
      console.log('✅ Basic activity submission test passed\n');
    } catch (error) {
      this.fail('Basic activity submission', error);
    }
  }

  async testWebSocketUpdates() {
    console.log('🔌 Test 2: WebSocket Real-time Updates');
    
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(WS_URL);
        this.wsConnections.push(ws);
        
        let messageReceived = false;
        
        ws.on('open', async () => {
          console.log('   WebSocket connected');
          
          ws.on('message', (data) => {
            const message = JSON.parse(data);
            if (message.type === 'activity' && message.agentId === 'agent-4-ws-test') {
              messageReceived = true;
              this.assert(message.activity.state === 'debugging', 'WebSocket should broadcast correct state');
              this.assert(message.activity.decisionId === 60, 'WebSocket should broadcast correct decision ID');
              console.log('   Received WebSocket update:', message);
            }
          });
          
          // Wait for connection to stabilize
          await delay(100);
          
          // Send activity that should trigger WebSocket broadcast
          await fetch(`${BASE_URL}/api/activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentId: 'agent-4-ws-test',
              state: 'debugging',
              decisionId: 60,
              taskDescription: 'Testing WebSocket broadcasting'
            })
          });
          
          // Wait for message
          await delay(500);
          
          this.assert(messageReceived, 'Should receive WebSocket broadcast');
          console.log('✅ WebSocket real-time updates test passed\n');
          resolve();
        });
        
        ws.on('error', (error) => {
          this.fail('WebSocket connection', error);
          resolve();
        });
      } catch (error) {
        this.fail('WebSocket updates', error);
        resolve();
      }
    });
  }

  async testActivityStateTransitions() {
    console.log('🔄 Test 3: Activity State Transitions');
    
    try {
      const agentId = 'agent-4-transitions';
      
      // Cycle through all states
      for (const state of TEST_STATES) {
        await fetch(`${BASE_URL}/api/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId,
            state,
            decisionId: 59,
            taskDescription: `Testing state transition to ${state}`
          })
        });
        
        await delay(100); // Small delay between transitions
      }
      
      // Verify history captured all transitions
      const response = await fetch(`${BASE_URL}/api/activity?includeHistory=true&agentId=${agentId}`);
      const data = await response.json();
      
      this.assert(data.history !== undefined, 'History should be included');
      const agentHistory = data.history.filter(h => h.agentId === agentId);
      this.assert(agentHistory.length >= TEST_STATES.length, 'All state transitions should be recorded');
      
      console.log(`   Recorded ${agentHistory.length} state transitions`);
      console.log('✅ Activity state transitions test passed\n');
    } catch (error) {
      this.fail('Activity state transitions', error);
    }
  }

  async testMultiAgentCoordination() {
    console.log('👥 Test 4: Multi-Agent Coordination');
    
    try {
      // Simulate multiple agents working on different decisions
      const activities = [
        { agentId: 'agent-1', state: 'working', decisionId: 59, taskDescription: 'Building WebSocket infrastructure' },
        { agentId: 'agent-2', state: 'debugging', decisionId: 60, taskDescription: 'Fixing UI animations' },
        { agentId: 'agent-3', state: 'testing', decisionId: 61, taskDescription: 'Testing Claude Code hooks' },
        { agentId: 'agent-4', state: 'reviewing', decisionId: 62, taskDescription: 'Reviewing integration' }
      ];
      
      // Send all activities in parallel
      await Promise.all(activities.map(activity =>
        fetch(`${BASE_URL}/api/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activity)
        })
      ));
      
      // Verify all agents are active
      const response = await fetch(`${BASE_URL}/api/activity`);
      const data = await response.json();
      
      for (const activity of activities) {
        const agentActivity = data.activities.find(a => a.agentId === activity.agentId);
        this.assert(agentActivity !== undefined, `Agent ${activity.agentId} should be active`);
        this.assert(agentActivity.state === activity.state, `Agent ${activity.agentId} state should match`);
      }
      
      console.log(`   All ${activities.length} agents are active simultaneously`);
      console.log('✅ Multi-agent coordination test passed\n');
    } catch (error) {
      this.fail('Multi-agent coordination', error);
    }
  }

  async testActivityHistory() {
    console.log('📚 Test 5: Activity History and Persistence');
    
    try {
      const agentId = 'agent-4-history';
      const activities = [];
      
      // Generate some history
      for (let i = 0; i < 10; i++) {
        const activity = {
          agentId,
          state: TEST_STATES[i % TEST_STATES.length],
          decisionId: TEST_DECISIONS[i % TEST_DECISIONS.length],
          taskDescription: `History test activity ${i}`
        };
        
        await fetch(`${BASE_URL}/api/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activity)
        });
        
        activities.push(activity);
        await delay(50);
      }
      
      // Test history retrieval with limit
      const limitedResponse = await fetch(`${BASE_URL}/api/activity?includeHistory=true&agentId=${agentId}&limit=5`);
      const limitedData = await limitedResponse.json();
      
      this.assert(limitedData.history.length <= 5, 'History limit should be respected');
      
      // Test full history
      const fullResponse = await fetch(`${BASE_URL}/api/activity?includeHistory=true&agentId=${agentId}`);
      const fullData = await fullResponse.json();
      
      this.assert(fullData.history.length >= 10, 'Full history should be available');
      
      console.log(`   Stored and retrieved ${fullData.history.length} history entries`);
      console.log('✅ Activity history test passed\n');
    } catch (error) {
      this.fail('Activity history', error);
    }
  }

  async testPerformanceUnderLoad() {
    console.log('⚡ Test 6: Performance Under Load');
    
    try {
      const startTime = Date.now();
      const numRequests = 100;
      const requests = [];
      
      // Send many requests rapidly
      for (let i = 0; i < numRequests; i++) {
        requests.push(
          fetch(`${BASE_URL}/api/activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentId: `agent-perf-${i % 4}`,
              state: TEST_STATES[i % TEST_STATES.length],
              decisionId: TEST_DECISIONS[i % TEST_DECISIONS.length],
              taskDescription: `Performance test ${i}`
            })
          })
        );
      }
      
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const successCount = responses.filter(r => r.status === 200).length;
      this.assert(successCount === numRequests, `All ${numRequests} requests should succeed`);
      
      const requestsPerSecond = (numRequests / duration) * 1000;
      console.log(`   Processed ${numRequests} requests in ${duration}ms (${requestsPerSecond.toFixed(2)} req/s)`);
      this.assert(requestsPerSecond > 50, 'Should handle at least 50 requests per second');
      
      console.log('✅ Performance test passed\n');
    } catch (error) {
      this.fail('Performance under load', error);
    }
  }

  async testErrorHandling() {
    console.log('⚠️  Test 7: Error Handling');
    
    try {
      // Test missing required fields
      const missingFieldsResponse = await fetch(`${BASE_URL}/api/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: 'working'
          // Missing agentId
        })
      });
      
      this.assert(missingFieldsResponse.status === 400, 'Should return 400 for missing fields');
      const missingFieldsData = await missingFieldsResponse.json();
      this.assert(missingFieldsData.error.includes('required'), 'Should indicate required fields');
      
      // Test invalid state
      const invalidStateResponse = await fetch(`${BASE_URL}/api/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'agent-4',
          state: 'invalid-state',
          decisionId: 59
        })
      });
      
      this.assert(invalidStateResponse.status === 400, 'Should return 400 for invalid state');
      const invalidStateData = await invalidStateResponse.json();
      this.assert(invalidStateData.error.includes('Invalid activity state'), 'Should indicate invalid state');
      
      console.log('✅ Error handling test passed\n');
    } catch (error) {
      this.fail('Error handling', error);
    }
  }

  async testAnalyticsEndpoints() {
    console.log('📊 Test 8: Analytics Endpoints');
    
    try {
      // Generate some activity for analytics
      const testAgentId = 'agent-4-analytics';
      for (let i = 0; i < 20; i++) {
        await fetch(`${BASE_URL}/api/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: testAgentId,
            state: TEST_STATES[i % TEST_STATES.length],
            decisionId: TEST_DECISIONS[i % TEST_DECISIONS.length],
            taskDescription: `Analytics test ${i}`
          })
        });
      }
      
      // Test analytics endpoint
      const analyticsResponse = await fetch(`${BASE_URL}/api/activity/analytics?timeRange=1h`);
      const analytics = await analyticsResponse.json();
      
      this.assert(analytics.totalActivities > 0, 'Should have activity data');
      this.assert(analytics.agentActivityCounts !== undefined, 'Should include agent counts');
      this.assert(analytics.stateDistribution !== undefined, 'Should include state distribution');
      this.assert(analytics.decisionActivityCounts !== undefined, 'Should include decision counts');
      
      console.log('   Analytics summary:');
      console.log(`   - Total activities: ${analytics.totalActivities}`);
      console.log(`   - Most active agent: ${analytics.mostActiveAgent}`);
      console.log(`   - Most active decision: ${analytics.mostActiveDecision}`);
      
      console.log('✅ Analytics endpoints test passed\n');
    } catch (error) {
      this.fail('Analytics endpoints', error);
    }
  }

  assert(condition, message) {
    if (condition) {
      this.results.passed++;
      this.results.tests.push({ passed: true, message });
    } else {
      this.results.failed++;
      this.results.tests.push({ passed: false, message });
      console.error(`   ❌ Assertion failed: ${message}`);
    }
  }

  fail(testName, error) {
    this.results.failed++;
    this.results.tests.push({ 
      passed: false, 
      message: `${testName} failed with error: ${error.message}` 
    });
    console.error(`❌ ${testName} test failed:`, error.message);
  }

  cleanup() {
    // Close all WebSocket connections
    this.wsConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
  }

  reportResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total:  ${this.results.passed + this.results.failed}`);
    console.log('='.repeat(60));
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(t => !t.passed)
        .forEach(t => console.log(`   - ${t.message}`));
    }
    
    const successRate = (this.results.passed / (this.results.passed + this.results.failed) * 100).toFixed(2);
    console.log(`\n🎯 Success Rate: ${successRate}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed! The activity tracking system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix the issues.');
    }
  }
}

// Run tests
const tester = new ActivitySystemTester();
tester.runAllTests().catch(console.error);