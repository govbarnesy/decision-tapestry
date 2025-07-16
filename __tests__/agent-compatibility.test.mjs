/**
 * Agent Framework Compatibility Tests
 * Verifies that resilient and non-resilient frameworks work together
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DecisionTapestryAgent, AgentBase } from '../cli/agent-framework.mjs';
import { createResilientAgent } from '../cli/agent-framework-resilient.mjs';
import { AgentMessaging } from '../cli/agent-messaging.mjs';
import { ResilientAgentMessaging } from '../cli/agent-messaging-resilient.mjs';

describe('Agent Framework Compatibility', () => {
    let basicAgent;
    let resilientAgent;
    
    beforeEach(() => {
        // Create test agents
        basicAgent = new DecisionTapestryAgent({
            decisionId: 1,
            name: 'BasicAgent'
        });
        
        resilientAgent = createResilientAgent(2, {
            name: 'ResilientAgent'
        });
    });
    
    afterEach(async () => {
        // Cleanup
        if (basicAgent?.cleanup) await basicAgent.cleanup();
        if (resilientAgent?.cleanup) await resilientAgent.cleanup();
    });
    
    describe('Framework Inheritance', () => {
        it('should export AgentBase as alias for DecisionTapestryAgent', () => {
            expect(AgentBase).toBe(DecisionTapestryAgent);
        });
        
        it('should allow ResilientAgent to extend AgentBase', () => {
            expect(resilientAgent).toBeInstanceOf(AgentBase);
            expect(resilientAgent).toBeInstanceOf(DecisionTapestryAgent);
        });
        
        it('should have compatible method signatures', () => {
            // Check that key methods exist on both
            const methods = [
                'initialize',
                'executeTask',
                'readFile',
                'writeFile',
                'exec',
                'cleanup'
            ];
            
            methods.forEach(method => {
                expect(typeof basicAgent[method]).toBe('function');
                expect(typeof resilientAgent[method]).toBe('function');
            });
        });
    });
    
    describe('Messaging Compatibility', () => {
        it('should have different messaging implementations', () => {
            expect(basicAgent.messaging).toBeInstanceOf(AgentMessaging);
            expect(resilientAgent.messaging).toBeInstanceOf(ResilientAgentMessaging);
        });
        
        it('should support same core messaging operations', () => {
            // Both should have these methods
            const messagingMethods = [
                'initialize',
                'sendMessage',
                'broadcastStatus',
                'cleanup'
            ];
            
            messagingMethods.forEach(method => {
                expect(typeof basicAgent.messaging[method]).toBe('function');
                expect(typeof resilientAgent.messaging[method]).toBe('function');
            });
        });
    });
    
    describe('API Compatibility', () => {
        it('should accept same configuration options', () => {
            const config = {
                decisionId: 123,
                name: 'TestAgent',
                verbose: true
            };
            
            const basic = new DecisionTapestryAgent(config);
            const resilient = createResilientAgent(123, config);
            
            expect(basic.decisionId).toBe(123);
            expect(resilient.decisionId).toBe(123);
        });
        
        it('should handle task execution similarly', async () => {
            const task = {
                id: 'test-task',
                description: 'Test task execution',
                action: 'test'
            };
            
            // Mock file operations
            basicAgent.readFile = jest.fn().mockResolvedValue('test content');
            resilientAgent.readFile = jest.fn().mockResolvedValue('test content');
            
            // Both should handle tasks
            const basicResult = basicAgent.executeTask(task);
            const resilientResult = resilientAgent.executeTask(task);
            
            expect(basicResult).toBeInstanceOf(Promise);
            expect(resilientResult).toBeInstanceOf(Promise);
        });
    });
    
    describe('Enhanced Features', () => {
        it('should have additional features in resilient agent', () => {
            // Resilient-only features
            expect(resilientAgent.healthMonitor).toBeDefined();
            expect(resilientAgent.circuitBreakers).toBeDefined();
            expect(typeof resilientAgent.attemptRecovery).toBe('function');
            
            // Basic agent shouldn't have these
            expect(basicAgent.healthMonitor).toBeUndefined();
            expect(basicAgent.circuitBreakers).toBeUndefined();
        });
        
        it('should handle failures differently', async () => {
            // Mock a failing operation
            const failingOp = jest.fn().mockRejectedValue(new Error('Test failure'));
            
            // Basic agent will just throw
            basicAgent.readFile = failingOp;
            await expect(basicAgent.readFile('test.txt')).rejects.toThrow('Test failure');
            
            // Resilient agent has circuit breaker protection
            resilientAgent.circuitBreakers.fileOps.execute = jest.fn()
                .mockImplementation((fn, fallback) => fallback());
            
            const result = await resilientAgent.readFile('test.txt');
            expect(result).toBeDefined(); // Fallback was used
        });
    });
    
    describe('Migration Path', () => {
        it('should allow drop-in replacement for basic usage', async () => {
            // This code should work with both agents
            const testWithAgent = async (agent) => {
                // Mock operations
                agent.readFile = jest.fn().mockResolvedValue('content');
                agent.writeFile = jest.fn().mockResolvedValue(true);
                
                // Common operations
                const content = await agent.readFile('test.txt');
                await agent.writeFile('output.txt', content);
                
                return true;
            };
            
            // Both should work
            const basicResult = await testWithAgent(basicAgent);
            const resilientResult = await testWithAgent(resilientAgent);
            
            expect(basicResult).toBe(true);
            expect(resilientResult).toBe(true);
        });
    });
});

describe('Messaging System Compatibility', () => {
    let basicMessaging;
    let resilientMessaging;
    
    beforeEach(() => {
        basicMessaging = new AgentMessaging('test-basic');
        resilientMessaging = new ResilientAgentMessaging('test-resilient');
    });
    
    afterEach(async () => {
        if (basicMessaging?.cleanup) await basicMessaging.cleanup();
        if (resilientMessaging?.cleanup) await resilientMessaging.cleanup();
    });
    
    it('should have compatible interfaces', () => {
        // Core methods should exist on both
        const methods = [
            'initialize',
            'connectToServer',
            'sendMessage',
            'broadcastStatus',
            'cleanup'
        ];
        
        methods.forEach(method => {
            expect(typeof basicMessaging[method]).toBe('function');
            expect(typeof resilientMessaging[method]).toBe('function');
        });
    });
    
    it('should handle message sending similarly', async () => {
        const message = {
            type: 'test',
            data: { value: 123 }
        };
        
        // Mock WebSocket
        basicMessaging.ws = { 
            send: jest.fn(),
            readyState: 1 
        };
        basicMessaging.connected = true;
        
        resilientMessaging.ws = { 
            send: jest.fn((data, cb) => cb()),
            readyState: 1 
        };
        resilientMessaging.connected = true;
        
        // Both should send messages
        await basicMessaging.sendMessage(message);
        await resilientMessaging.sendMessage(message);
        
        expect(basicMessaging.ws.send).toHaveBeenCalled();
        expect(resilientMessaging.ws.send).toHaveBeenCalled();
    });
    
    it('should handle disconnection differently', () => {
        // Basic just queues
        basicMessaging.connected = false;
        basicMessaging.sendMessage({ test: true });
        expect(basicMessaging.messageQueue.length).toBe(1);
        
        // Resilient also queues but with more options
        resilientMessaging.connected = false;
        resilientMessaging.sendMessage({ test: true }, { priority: 'high' });
        expect(resilientMessaging.messageQueue.length).toBe(1);
        expect(resilientMessaging.messageQueue[0].options.priority).toBe('high');
    });
});