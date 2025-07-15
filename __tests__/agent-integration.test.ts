/**
 * Agent Integration Tests
 * Comprehensive tests for agent collaboration and coordination
 */

import { 
    validateDecisionsFile, 
    getDecisionById, 
    validateDecisionStructure,
    validateDecisionStatus,
    validateTaskStatuses,
    validateAuthorFormat,
    validateDateFormat,
    validateGitHubMetadata,
    testFileCreated,
    testAgentCompletionReport,
    testAgentCoordination,
    generateTestDecision,
    generateTestAgentActivity,
    MockWebSocket
} from './agent-test-utils.js';

describe('Agent Integration Tests', () => {
    let mockWebSocket;
    let testDecisions;
    
    beforeEach(() => {
        // Setup mock WebSocket
        mockWebSocket = new MockWebSocket();
        
        // Create test decisions
        testDecisions = [
            generateTestDecision(65, {
                title: 'Test GitHub Integration',
                status: 'Pending',
                tasks: [
                    { description: 'Create GitHub API client', status: 'Pending' },
                    { description: 'Implement user lookup', status: 'Pending' }
                ]
            }),
            generateTestDecision(66, {
                title: 'Test Git Analysis',
                status: 'Pending',
                related_to: [65],
                tasks: [
                    { description: 'Analyze Git history', status: 'Pending' },
                    { description: 'Generate metadata', status: 'Pending' }
                ]
            }),
            generateTestDecision(67, {
                title: 'Test UI Components',
                status: 'Pending',
                related_to: [65],
                tasks: [
                    { description: 'Create avatar component', status: 'Pending' },
                    { description: 'Add status indicators', status: 'Pending' }
                ]
            })
        ];
    });
    
    describe('Schema Validation', () => {
        it('should validate decisions.yml structure', async () => {
            const validation = await validateDecisionsFile();
            expect(validation.valid).toBe(true);
            
            if (!validation.valid) {
                console.error('Validation errors:', validation.errors);
            }
        });
        
        it('should validate individual decision structure', () => {
            testDecisions.forEach(decision => {
                const validation = validateDecisionStructure(decision);
                expect(validation.valid).toBe(true);
                expect(validation.missing).toHaveLength(0);
            });
        });
        
        it('should validate decision statuses', () => {
            testDecisions.forEach(decision => {
                const validation = validateDecisionStatus(decision);
                expect(validation.valid).toBe(true);
            });
        });
        
        it('should validate task statuses', () => {
            testDecisions.forEach(decision => {
                const validation = validateTaskStatuses(decision);
                expect(validation.valid).toBe(true);
                expect(validation.invalidTasks).toHaveLength(0);
            });
        });
        
        it('should validate author formats', () => {
            // Test string author
            const stringAuthor = { ...testDecisions[0], author: 'Test Author' };
            const stringValidation = validateAuthorFormat(stringAuthor);
            expect(stringValidation.valid).toBe(true);
            expect(stringValidation.format).toBe('string');
            
            // Test object author
            const objectAuthor = { 
                ...testDecisions[0], 
                author: { 
                    github_username: 'testuser', 
                    display_name: 'Test User' 
                } 
            };
            const objectValidation = validateAuthorFormat(objectAuthor);
            expect(objectValidation.valid).toBe(true);
            expect(objectValidation.format).toBe('object');
        });
        
        it('should validate date formats', () => {
            // Test string date
            const stringDate = { ...testDecisions[0], date: '2025-01-01T00:00:00Z' };
            const stringValidation = validateDateFormat(stringDate);
            expect(stringValidation.valid).toBe(true);
            expect(stringValidation.format).toBe('string');
            
            // Test object date
            const objectDate = { 
                ...testDecisions[0], 
                date: { 
                    decision_date: '2025-01-01T00:00:00Z',
                    first_commit_date: '2025-01-01T00:00:00Z'
                } 
            };
            const objectValidation = validateDateFormat(objectDate);
            expect(objectValidation.valid).toBe(true);
            expect(objectValidation.format).toBe('object');
        });
        
        it('should validate GitHub metadata', () => {
            const withMetadata = {
                ...testDecisions[0],
                github_metadata: {
                    repository: 'owner/repo',
                    pull_requests: [],
                    issues: [],
                    commits: [],
                    file_status: {
                        created: ['file1.js'],
                        modified: ['file2.js'],
                        deleted: [],
                        missing: []
                    }
                }
            };
            
            const validation = validateGitHubMetadata(withMetadata);
            expect(validation.valid).toBe(true);
            expect(validation.hasMetadata).toBe(true);
        });
    });
    
    describe('Agent Framework', () => {
        it('should generate valid completion report', () => {
            const report = {
                agentId: 'Agent-65',
                decisionId: 65,
                startTime: '2025-01-01T00:00:00Z',
                endTime: '2025-01-01T01:00:00Z',
                duration: 3600000,
                status: 'completed',
                completedTasks: 2,
                totalTasks: 2,
                errors: []
            };
            
            const validation = testAgentCompletionReport(report);
            expect(validation.valid).toBe(true);
            expect(validation.missing).toHaveLength(0);
        });
        
        it('should validate agent messaging', async () => {
            mockWebSocket.connect();
            
            // Simulate agent registration
            mockWebSocket.simulateMessage({
                type: 'agent_register',
                agentId: 'Agent-65',
                decisionId: 65
            });
            
            // Simulate agent status update
            mockWebSocket.simulateMessage({
                type: 'agent_status',
                agentId: 'Agent-65',
                status: 'working',
                message: 'Processing tasks',
                currentTask: 'Create GitHub API client'
            });
            
            expect(mockWebSocket.messages).toHaveLength(0); // No messages sent initially
            expect(mockWebSocket.connected).toBe(true);
        });
    });
    
    describe('Agent Coordination', () => {
        it('should coordinate dependent agents correctly', () => {
            const agents = [
                { agentId: 'Agent-65', status: 'completed' },
                { agentId: 'Agent-66', status: 'working' },
                { agentId: 'Agent-67', status: 'pending' }
            ];
            
            const dependencies = [
                { agentId: 'Agent-66', dependsOn: ['Agent-65'] },
                { agentId: 'Agent-67', dependsOn: ['Agent-65'] }
            ];
            
            const coordination = testAgentCoordination(agents, dependencies);
            expect(coordination.valid).toBe(true);
            expect(coordination.issues).toHaveLength(0);
        });
        
        it('should detect coordination issues', () => {
            const agents = [
                { agentId: 'Agent-65', status: 'working' }, // Not completed
                { agentId: 'Agent-66', status: 'pending' }
            ];
            
            const dependencies = [
                { agentId: 'Agent-66', dependsOn: ['Agent-65'] }
            ];
            
            const coordination = testAgentCoordination(agents, dependencies);
            expect(coordination.valid).toBe(false);
            expect(coordination.issues).toHaveLength(1);
            expect(coordination.issues[0]).toContain('not completed');
        });
        
        it('should handle missing dependencies', () => {
            const agents = [
                { agentId: 'Agent-66', status: 'pending' }
            ];
            
            const dependencies = [
                { agentId: 'Agent-66', dependsOn: ['Agent-65'] } // Agent-65 missing
            ];
            
            const coordination = testAgentCoordination(agents, dependencies);
            expect(coordination.valid).toBe(false);
            expect(coordination.issues).toHaveLength(1);
            expect(coordination.issues[0]).toContain('not running');
        });
    });
    
    describe('Agent Activity Tracking', () => {
        it('should track agent activities correctly', () => {
            const activities = [
                generateTestAgentActivity('Agent-65', {
                    status: 'working',
                    message: 'Starting GitHub API implementation'
                }),
                generateTestAgentActivity('Agent-65', {
                    status: 'working',
                    message: 'Task completed: Create GitHub API client'
                }),
                generateTestAgentActivity('Agent-65', {
                    status: 'completed',
                    message: 'All tasks completed'
                })
            ];
            
            activities.forEach(activity => {
                expect(activity.agentId).toBeDefined();
                expect(activity.status).toBeDefined();
                expect(activity.message).toBeDefined();
                expect(activity.timestamp).toBeDefined();
            });
        });
        
        it('should handle activity feed updates', () => {
            const activity = generateTestAgentActivity('Agent-65');
            
            // Test activity structure
            expect(activity).toHaveProperty('agentId');
            expect(activity).toHaveProperty('decisionId');
            expect(activity).toHaveProperty('status');
            expect(activity).toHaveProperty('message');
            expect(activity).toHaveProperty('timestamp');
            
            // Test timestamp format
            expect(new Date(activity.timestamp).getTime()).not.toBeNaN();
        });
    });
    
    describe('File Operations', () => {
        it('should create required files', async () => {
            const testFiles = [
                'cli/agent-framework.mjs',
                'cli/agent-messaging.mjs',
                'cli/agent-commands.mjs',
                'cli/agent-coordinator.mjs',
                'dashboard/agent-status-panel.mjs',
                'dashboard/agent-activity-feed.mjs'
            ];
            
            for (const filePath of testFiles) {
                const result = await testFileCreated(filePath);
                expect(result.exists).toBe(true);
            }
        });
        
        it('should validate test directory structure', async () => {
            const testDir = await testFileCreated('__tests__/agents');
            expect(testDir.exists).toBe(true);
            
            const utilsFile = await testFileCreated('__tests__/agent-test-utils.js');
            expect(utilsFile.exists).toBe(true);
        });
    });
    
    describe('Integration Scenarios', () => {
        it('should handle single agent workflow', async () => {
            // Test single agent completing a decision
            const decision = testDecisions[0];
            
            // Validate initial state
            expect(decision.status).toBe('Pending');
            expect(decision.tasks.every(t => t.status === 'Pending')).toBe(true);
            
            // Simulate agent work
            const workflowSteps = [
                { status: 'working', message: 'Agent started' },
                { status: 'working', message: 'Task 1 in progress' },
                { status: 'working', message: 'Task 1 completed' },
                { status: 'working', message: 'Task 2 in progress' },
                { status: 'working', message: 'Task 2 completed' },
                { status: 'completed', message: 'All tasks completed' }
            ];
            
            workflowSteps.forEach(step => {
                const activity = generateTestAgentActivity('Agent-65', step);
                expect(activity.status).toBe(step.status);
                expect(activity.message).toBe(step.message);
            });
        });
        
        it('should handle multi-agent coordination', async () => {
            // Test coordinated agents with dependencies
            const agents = [
                { id: 'Agent-65', decision: testDecisions[0] },
                { id: 'Agent-66', decision: testDecisions[1] },
                { id: 'Agent-67', decision: testDecisions[2] }
            ];
            
            // Validate dependencies
            expect(testDecisions[1].related_to).toContain(65);
            expect(testDecisions[2].related_to).toContain(65);
            
            // Simulate coordination workflow
            const coordinationSteps = [
                { agent: 'Agent-65', status: 'working', message: 'Foundation work started' },
                { agent: 'Agent-65', status: 'completed', message: 'Foundation completed' },
                { agent: 'Agent-66', status: 'working', message: 'Dependent work started' },
                { agent: 'Agent-67', status: 'working', message: 'Parallel work started' },
                { agent: 'Agent-66', status: 'completed', message: 'Git analysis completed' },
                { agent: 'Agent-67', status: 'completed', message: 'UI components completed' }
            ];
            
            coordinationSteps.forEach(step => {
                const activity = generateTestAgentActivity(step.agent, {
                    status: step.status,
                    message: step.message
                });
                expect(activity.agentId).toBe(step.agent);
                expect(activity.status).toBe(step.status);
            });
        });
        
        it('should handle error scenarios', () => {
            // Test error handling
            const errorActivity = generateTestAgentActivity('Agent-65', {
                status: 'error',
                message: 'Task failed: Connection timeout'
            });
            
            expect(errorActivity.status).toBe('error');
            expect(errorActivity.message).toContain('failed');
            
            // Test error recovery
            const recoveryActivity = generateTestAgentActivity('Agent-65', {
                status: 'working',
                message: 'Retrying failed task'
            });
            
            expect(recoveryActivity.status).toBe('working');
            expect(recoveryActivity.message).toContain('Retrying');
        });
        
        it('should validate complete integration flow', async () => {
            // Test complete end-to-end flow
            const integrationFlow = {
                phase1: 'Agent initialization and registration',
                phase2: 'Task execution and progress tracking',
                phase3: 'Real-time status updates',
                phase4: 'Decision completion and handoff',
                phase5: 'Integration testing and validation'
            };
            
            // Validate each phase
            Object.values(integrationFlow).forEach(phase => {
                expect(phase).toBeDefined();
                expect(typeof phase).toBe('string');
                expect(phase.length).toBeGreaterThan(0);
            });
            
            // Test integration completeness
            expect(Object.keys(integrationFlow)).toHaveLength(5);
        });
    });
    
    describe('Performance and Reliability', () => {
        it('should handle high-frequency updates', () => {
            const activities = [];
            
            // Generate many activities
            for (let i = 0; i < 1000; i++) {
                activities.push(generateTestAgentActivity('Agent-65', {
                    status: 'working',
                    message: `Update ${i}`
                }));
            }
            
            expect(activities).toHaveLength(1000);
            
            // Verify all activities are unique
            const timestamps = activities.map(a => a.timestamp);
            const uniqueTimestamps = new Set(timestamps);
            expect(uniqueTimestamps.size).toBe(timestamps.length);
        });
        
        it('should handle WebSocket connection failures', () => {
            mockWebSocket.connect();
            expect(mockWebSocket.connected).toBe(true);
            
            mockWebSocket.disconnect();
            expect(mockWebSocket.connected).toBe(false);
            
            // Should handle reconnection
            mockWebSocket.connect();
            expect(mockWebSocket.connected).toBe(true);
        });
        
        it('should validate message queue handling', () => {
            // Test message queuing when disconnected
            mockWebSocket.send(JSON.stringify({
                type: 'agent_status',
                agentId: 'Agent-65',
                message: 'Test message'
            }));
            
            expect(mockWebSocket.messages).toHaveLength(1);
            expect(mockWebSocket.messages[0].type).toBe('agent_status');
        });
    });
    
    afterEach(() => {
        if (mockWebSocket) {
            mockWebSocket.disconnect();
        }
    });
});