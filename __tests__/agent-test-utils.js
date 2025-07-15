/**
 * Agent Test Utilities
 * Common utilities for testing agent functionality
 */

import { promises as fs } from 'fs';
import path from 'path';
import Ajv from 'ajv';
import yaml from 'js-yaml';
import { readDecisionsFile } from '../shared/yaml-utils.js';

/**
 * Validate decisions.yml file against schema
 */
export async function validateDecisionsFile(filePath = 'decisions.yml') {
    try {
        // Load decisions data
        const decisionsData = await readDecisionsFile(filePath);
        
        // Load schema
        const schemaPath = path.resolve(__dirname, '../decisions.schema.json');
        const schemaContent = await fs.readFile(schemaPath, 'utf8');
        const schema = JSON.parse(schemaContent);
        
        // Validate
        const ajv = new Ajv({ allErrors: true, strict: false });
        const validate = ajv.compile(schema);
        const valid = validate(decisionsData);
        
        return {
            valid,
            errors: validate.errors || [],
            data: decisionsData
        };
        
    } catch (error) {
        return {
            valid: false,
            errors: [{ message: error.message }],
            data: null
        };
    }
}

/**
 * Get decision by ID
 */
export async function getDecisionById(decisionId, filePath = 'decisions.yml') {
    try {
        const decisionsData = await readDecisionsFile(filePath);
        return decisionsData.decisions.find(d => d.id === decisionId);
    } catch (error) {
        return null;
    }
}

/**
 * Check if decision has all required fields
 */
export function validateDecisionStructure(decision) {
    const required = ['id', 'title', 'status'];
    const missing = required.filter(field => !decision[field]);
    
    return {
        valid: missing.length === 0,
        missing: missing,
        decision: decision
    };
}

/**
 * Check if decision status is valid
 */
export function validateDecisionStatus(decision) {
    const validStatuses = ['Accepted', 'Superseded', 'Rejected', 'Proposed', 'Completed', 'Pending'];
    
    return {
        valid: validStatuses.includes(decision.status),
        status: decision.status,
        validStatuses: validStatuses
    };
}

/**
 * Check if all tasks in decision have valid statuses
 */
export function validateTaskStatuses(decision) {
    if (!decision.tasks || decision.tasks.length === 0) {
        return { valid: true, tasks: [] };
    }
    
    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Blocked'];
    const invalidTasks = decision.tasks.filter(task => 
        !validStatuses.includes(task.status)
    );
    
    return {
        valid: invalidTasks.length === 0,
        invalidTasks: invalidTasks,
        validStatuses: validStatuses
    };
}

/**
 * Check if decision has proper author format
 */
export function validateAuthorFormat(decision) {
    if (!decision.author) {
        return { valid: false, reason: 'Missing author' };
    }
    
    // String author (legacy format)
    if (typeof decision.author === 'string') {
        return { valid: true, format: 'string', author: decision.author };
    }
    
    // Object author (GitHub format)
    if (typeof decision.author === 'object') {
        const required = ['github_username', 'display_name'];
        const missing = required.filter(field => !decision.author[field]);
        
        return {
            valid: missing.length === 0,
            format: 'object',
            missing: missing,
            author: decision.author
        };
    }
    
    return { valid: false, reason: 'Invalid author format' };
}

/**
 * Check if decision has proper date format
 */
export function validateDateFormat(decision) {
    if (!decision.date) {
        return { valid: false, reason: 'Missing date' };
    }
    
    // String date (legacy format)
    if (typeof decision.date === 'string') {
        try {
            const date = new Date(decision.date);
            return { 
                valid: !isNaN(date.getTime()), 
                format: 'string', 
                date: decision.date 
            };
        } catch (error) {
            return { valid: false, reason: 'Invalid date string' };
        }
    }
    
    // Object date (enhanced format)
    if (typeof decision.date === 'object') {
        const required = ['decision_date'];
        const missing = required.filter(field => !decision.date[field]);
        
        return {
            valid: missing.length === 0,
            format: 'object',
            missing: missing,
            date: decision.date
        };
    }
    
    return { valid: false, reason: 'Invalid date format' };
}

/**
 * Check if decision has GitHub metadata
 */
export function validateGitHubMetadata(decision) {
    if (!decision.github_metadata) {
        return { valid: true, hasMetadata: false };
    }
    
    const metadata = decision.github_metadata;
    const validations = {
        repository: typeof metadata.repository === 'string',
        pull_requests: Array.isArray(metadata.pull_requests),
        issues: Array.isArray(metadata.issues),
        commits: Array.isArray(metadata.commits),
        file_status: typeof metadata.file_status === 'object'
    };
    
    const invalid = Object.entries(validations)
        .filter(([key, isValid]) => metadata[key] !== undefined && !isValid)
        .map(([key]) => key);
    
    return {
        valid: invalid.length === 0,
        hasMetadata: true,
        invalid: invalid,
        metadata: metadata
    };
}

/**
 * Test that a file was created by an agent
 */
export async function testFileCreated(filePath) {
    try {
        await fs.access(filePath);
        return { exists: true, path: filePath };
    } catch (error) {
        return { exists: false, path: filePath, error: error.message };
    }
}

/**
 * Test that a file has expected content
 */
export async function testFileContent(filePath, expectedContent) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const hasContent = expectedContent ? content.includes(expectedContent) : true;
        
        return {
            exists: true,
            hasExpectedContent: hasContent,
            content: content,
            expectedContent: expectedContent
        };
    } catch (error) {
        return {
            exists: false,
            hasExpectedContent: false,
            error: error.message
        };
    }
}

/**
 * Test that decisions are properly linked
 */
export function testDecisionLinks(decision, allDecisions) {
    const results = {
        valid: true,
        issues: []
    };
    
    // Check related_to links
    if (decision.related_to) {
        decision.related_to.forEach(relatedId => {
            const related = allDecisions.find(d => d.id === relatedId);
            if (!related) {
                results.valid = false;
                results.issues.push(`Related decision #${relatedId} not found`);
            }
        });
    }
    
    // Check supersedes link
    if (decision.supersedes) {
        const superseded = allDecisions.find(d => d.id === decision.supersedes);
        if (!superseded) {
            results.valid = false;
            results.issues.push(`Superseded decision #${decision.supersedes} not found`);
        }
    }
    
    // Check superseded_by link
    if (decision.superseded_by) {
        const superseder = allDecisions.find(d => d.id === decision.superseded_by);
        if (!superseder) {
            results.valid = false;
            results.issues.push(`Superseding decision #${decision.superseded_by} not found`);
        }
    }
    
    return results;
}

/**
 * Test agent completion report
 */
export function testAgentCompletionReport(report) {
    const required = ['agentId', 'decisionId', 'startTime', 'endTime', 'duration', 'status'];
    const missing = required.filter(field => report[field] === undefined);
    
    return {
        valid: missing.length === 0,
        missing: missing,
        report: report
    };
}

/**
 * Test agent messaging connectivity
 */
export async function testAgentMessaging(agentId, timeout = 5000) {
    // This would test WebSocket connectivity
    // For now, return mock result
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                connected: true,
                agentId: agentId,
                serverUrl: 'ws://localhost:3000'
            });
        }, 100);
    });
}

/**
 * Test agent coordination
 */
export function testAgentCoordination(agents, dependencies) {
    const results = {
        valid: true,
        issues: []
    };
    
    // Check that all dependencies are satisfied
    dependencies.forEach(dep => {
        const { agentId, dependsOn } = dep;
        
        dependsOn.forEach(requiredAgent => {
            const required = agents.find(a => a.agentId === requiredAgent);
            if (!required) {
                results.valid = false;
                results.issues.push(`Agent ${agentId} depends on ${requiredAgent} which is not running`);
            } else if (required.status !== 'completed') {
                results.valid = false;
                results.issues.push(`Agent ${agentId} depends on ${requiredAgent} which is not completed`);
            }
        });
    });
    
    return results;
}

/**
 * Generate test data for agents
 */
export function generateTestDecision(id, overrides = {}) {
    return {
        id: id,
        title: `Test Decision ${id}`,
        author: 'Test Agent',
        date: new Date().toISOString(),
        status: 'Pending',
        project: 'Test Project',
        rationale: ['Test rationale'],
        tradeoffs: ['Test tradeoff'],
        tasks: [
            {
                description: 'Test task 1',
                status: 'Pending'
            },
            {
                description: 'Test task 2',
                status: 'Pending'
            }
        ],
        affected_components: ['test-component.js'],
        ...overrides
    };
}

/**
 * Generate test agent activity
 */
export function generateTestAgentActivity(agentId, overrides = {}) {
    return {
        agentId: agentId,
        decisionId: 1,
        status: 'working',
        message: 'Test agent activity',
        currentTask: 'Test task',
        timestamp: new Date().toISOString(),
        ...overrides
    };
}

/**
 * Mock WebSocket for testing
 */
export class MockWebSocket {
    constructor() {
        this.messages = [];
        this.listeners = {};
        this.connected = false;
    }
    
    on(event, listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }
    
    send(message) {
        this.messages.push(JSON.parse(message));
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(data));
        }
    }
    
    connect() {
        this.connected = true;
        this.emit('open');
    }
    
    disconnect() {
        this.connected = false;
        this.emit('close');
    }
    
    simulateMessage(message) {
        this.emit('message', JSON.stringify(message));
    }
}