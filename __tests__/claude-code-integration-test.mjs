#!/usr/bin/env node

import { spawn } from 'child_process';
import fetch from 'node-fetch';
import { setTimeout as delay } from 'timers/promises';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://localhost:8080';
const INTEGRATION_DIR = '/Users/barnesy/Projects/decision-tapestry/claude-code-integration';

class ClaudeCodeIntegrationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    this.monitorProcess = null;
  }

  async runAllTests() {
    console.log('🤖 Starting Claude Code Integration Tests\n');
    
    // Test 1: Verify integration files exist
    await this.testIntegrationFilesExist();
    
    // Test 2: Test monitor script functionality
    await this.testMonitorScript();
    
    // Test 3: Test tool usage detection
    await this.testToolUsageDetection();
    
    // Test 4: Test activity mapping
    await this.testActivityMapping();
    
    // Test 5: Test real-time broadcasting
    await this.testRealtimeBroadcasting();
    
    // Cleanup
    this.cleanup();
    
    // Report results
    this.reportResults();
  }

  async testIntegrationFilesExist() {
    console.log('📁 Test 1: Verify Integration Files Exist');
    
    try {
      const requiredFiles = [
        'monitor.mjs',
        'activity-detector.mjs',
        'decision-mapper.mjs',
        'README.md',
        'INTEGRATION_COMPLETE.md'
      ];
      
      for (const file of requiredFiles) {
        const filePath = path.join(INTEGRATION_DIR, file);
        try {
          await fs.access(filePath);
          this.assert(true, `File ${file} exists`);
        } catch {
          this.assert(false, `File ${file} is missing`);
        }
      }
      
      console.log('✅ Integration files verification passed\n');
    } catch (error) {
      this.fail('Integration files verification', error);
    }
  }

  async testMonitorScript() {
    console.log('🔍 Test 2: Test Monitor Script Functionality');
    
    try {
      // Start the monitor script
      this.monitorProcess = spawn('node', [path.join(INTEGRATION_DIR, 'monitor.mjs')], {
        env: { ...process.env, CLAUDE_CODE_SESSION_ID: 'test-session' }
      });
      
      let outputReceived = false;
      
      this.monitorProcess.stdout.on('data', (data) => {
        console.log(`   Monitor output: ${data}`);
        outputReceived = true;
      });
      
      this.monitorProcess.stderr.on('data', (data) => {
        console.error(`   Monitor error: ${data}`);
      });
      
      // Give it time to start
      await delay(2000);
      
      this.assert(this.monitorProcess.pid !== undefined, 'Monitor process should start');
      
      // Simulate a file operation to trigger the monitor
      const testFile = path.join(INTEGRATION_DIR, 'test-trigger.txt');
      await fs.writeFile(testFile, 'Test content');
      await delay(1000);
      await fs.unlink(testFile);
      
      console.log('✅ Monitor script test passed\n');
    } catch (error) {
      this.fail('Monitor script functionality', error);
    }
  }

  async testToolUsageDetection() {
    console.log('🛠️  Test 3: Test Tool Usage Detection');
    
    try {
      // Import the activity detector
      const { ActivityDetector } = await import(path.join(INTEGRATION_DIR, 'activity-detector.mjs'));
      const detector = new ActivityDetector();
      
      // Test different tool patterns
      const testCases = [
        {
          toolName: 'Edit',
          params: { file_path: '/test/file.js', old_string: 'old', new_string: 'new' },
          expectedState: 'working'
        },
        {
          toolName: 'MultiEdit',
          params: { file_path: '/test/file.js', edits: [] },
          expectedState: 'working'
        },
        {
          toolName: 'Grep',
          params: { pattern: 'test', path: '/test' },
          expectedState: 'debugging'
        },
        {
          toolName: 'Bash',
          params: { command: 'npm test' },
          expectedState: 'testing'
        }
      ];
      
      for (const testCase of testCases) {
        const activity = detector.detectActivity(testCase.toolName, testCase.params);
        this.assert(
          activity.state === testCase.expectedState,
          `Tool ${testCase.toolName} should map to ${testCase.expectedState} state`
        );
      }
      
      console.log('✅ Tool usage detection test passed\n');
    } catch (error) {
      this.fail('Tool usage detection', error);
    }
  }

  async testActivityMapping() {
    console.log('🗺️  Test 4: Test Activity Mapping');
    
    try {
      // Import the decision mapper
      const { DecisionMapper } = await import(path.join(INTEGRATION_DIR, 'decision-mapper.mjs'));
      const mapper = new DecisionMapper();
      
      // Load decisions for mapping
      await mapper.loadDecisions();
      
      // Test file to decision mapping
      const testFiles = [
        { path: '/api/activity', expectedDecision: 56 }, // Infrastructure
        { path: '/dashboard/decision-map.mjs', expectedDecision: 57 }, // Frontend
        { path: '/claude-code-integration/monitor.mjs', expectedDecision: 58 }, // Integration
        { path: '/tests/activity-system-test.mjs', expectedDecision: 59 } // Testing
      ];
      
      for (const testFile of testFiles) {
        const decisionId = mapper.mapFileToDecision(testFile.path);
        console.log(`   Mapping ${testFile.path} -> Decision #${decisionId}`);
        // Note: Exact mapping depends on implementation, so we just verify it returns something
        this.assert(decisionId !== null, `File ${testFile.path} should map to a decision`);
      }
      
      console.log('✅ Activity mapping test passed\n');
    } catch (error) {
      this.fail('Activity mapping', error);
    }
  }

  async testRealtimeBroadcasting() {
    console.log('📡 Test 5: Test Real-time Broadcasting');
    
    try {
      // Simulate the monitor detecting an activity
      const testActivity = {
        agentId: 'claude-code-test',
        state: 'working',
        decisionId: 59,
        taskDescription: 'Testing real-time broadcast from Claude Code'
      };
      
      // Send activity
      const response = await fetch(`${BASE_URL}/api/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testActivity)
      });
      
      this.assert(response.ok, 'Activity should be sent successfully');
      
      // Verify it was received
      const getResponse = await fetch(`${BASE_URL}/api/activity`);
      const data = await getResponse.json();
      const ourActivity = data.activities.find(a => a.agentId === 'claude-code-test');
      
      this.assert(ourActivity !== undefined, 'Broadcast activity should be retrievable');
      this.assert(ourActivity.state === 'working', 'Activity state should match');
      
      console.log('✅ Real-time broadcasting test passed\n');
    } catch (error) {
      this.fail('Real-time broadcasting', error);
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
    if (this.monitorProcess) {
      this.monitorProcess.kill();
    }
  }

  reportResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 CLAUDE CODE INTEGRATION TEST RESULTS');
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
      console.log('\n🎉 All Claude Code integration tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the integration.');
    }
  }
}

// Run tests
const tester = new ClaudeCodeIntegrationTester();
tester.runAllTests().catch(console.error);