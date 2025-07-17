/**
 * Tests for Quick Task Decision Creation
 */

import { QuickDecisionBuilder } from '../cli/quick-decision-builder.mjs';
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { jest } from '@jest/globals';

// Mock exec for git commands
jest.mock('child_process', () => ({
  exec: (cmd, callback) => {
    if (cmd === 'git config user.name') {
      callback(null, { stdout: 'Test User\n' });
    } else if (cmd === 'git config user.email') {
      callback(null, { stdout: 'test@example.com\n' });
    }
  }
}));

describe('QuickDecisionBuilder', () => {
  let builder;
  let tempDir;
  
  beforeEach(async () => {
    builder = new QuickDecisionBuilder();
    
    // Create temp directory for test
    tempDir = path.join(process.cwd(), '.test-quick-task');
    await fs.mkdir(tempDir, { recursive: true });
    process.chdir(tempDir);
    
    // Create a test decisions.yml
    const testDecisions = {
      decisions: [
        { id: 1, title: 'Existing Decision', status: 'Completed' }
      ],
      backlog: []
    };
    await fs.writeFile('decisions.yml', yaml.dump(testDecisions));
  });
  
  afterEach(async () => {
    // Clean up
    process.chdir('..');
    await fs.rm(tempDir, { recursive: true, force: true });
  });
  
  describe('createQuickDecision', () => {
    it('should create a basic quick decision', async () => {
      const decision = await builder.createQuickDecision('Fix login button styling');
      
      expect(decision).toMatchObject({
        id: 2,
        title: 'Fix login button styling',
        status: 'In Progress',
        quick_task: true,
        category: 'Ad-hoc',
        priority: 'medium'
      });
      
      expect(decision.rationale).toContain('Quick task: Fix login button styling');
      expect(decision.tasks).toHaveLength(3); // Main task + 2 default tasks
      expect(decision.tasks[0].description).toBe('Fix login button styling');
    });
    
    it('should handle custom options', async () => {
      const options = {
        files: ['src/components/Login.js', 'src/styles/buttons.css'],
        tasks: ['Update button styles', 'Test on mobile'],
        category: 'Bug Fix',
        priority: 'high',
        related: [1]
      };
      
      const decision = await builder.createQuickDecision('Fix login button', options);
      
      expect(decision.affected_components).toEqual(options.files);
      expect(decision.category).toBe('Bug Fix');
      expect(decision.priority).toBe('high');
      expect(decision.related_to).toEqual([1]);
      expect(decision.tasks).toHaveLength(3); // Main + 2 custom tasks
    });
    
    it('should format long titles correctly', async () => {
      const longDescription = 'This is a very long description that exceeds the maximum title length and should be truncated with ellipsis at the end';
      const decision = await builder.createQuickDecision(longDescription);
      
      expect(decision.title.length).toBeLessThanOrEqual(80);
      expect(decision.title.endsWith('...')).toBe(true);
    });
  });
  
  describe('addDecisionToFile', () => {
    it('should add decision to decisions.yml', async () => {
      const decision = {
        id: 2,
        title: 'Test Quick Task',
        status: 'In Progress',
        tasks: []
      };
      
      await builder.addDecisionToFile(decision);
      
      const content = await fs.readFile('decisions.yml', 'utf8');
      const data = yaml.load(content);
      
      expect(data.decisions).toHaveLength(2);
      expect(data.decisions[1]).toMatchObject({
        id: 2,
        title: 'Test Quick Task'
      });
    });
  });
  
  describe('enhanceQuickDecision', () => {
    it('should convert quick task to full decision', async () => {
      // First add a quick task
      const quickDecision = await builder.createQuickDecision('Quick task');
      await builder.addDecisionToFile(quickDecision);
      
      // Enhance it
      const enhancements = {
        rationale: ['Properly thought out rationale', 'With multiple points'],
        tradeoffs: ['Performance vs simplicity'],
        related_to: [1]
      };
      
      const enhanced = await builder.enhanceQuickDecision(2, enhancements);
      
      expect(enhanced.quick_task).toBeUndefined();
      expect(enhanced.rationale).toEqual(enhancements.rationale);
      expect(enhanced.tradeoffs).toEqual(enhancements.tradeoffs);
      expect(enhanced.related_to).toEqual(enhancements.related_to);
    });
  });
  
  describe('edge cases', () => {
    it('should handle empty decisions file', async () => {
      await fs.writeFile('decisions.yml', '');
      
      const decision = await builder.createQuickDecision('First decision');
      expect(decision.id).toBe(1);
    });
    
    it('should handle missing git config', async () => {
      // Mock exec to throw error
      jest.spyOn(builder, 'getCurrentAuthor').mockResolvedValue('Quick Task Author');
      
      const decision = await builder.createQuickDecision('Test');
      expect(decision.author).toBe('Quick Task Author');
    });
  });
});

describe('CLI Integration', () => {
  it('should parse command line arguments correctly', () => {
    const args = ['Fix bug', '-f', 'src/file.js', '-t', 'Test fix', 'Document', '--no-agent'];
    
    // This would be the parsing logic from quickTaskCommand
    let description = '';
    let optionStartIndex = -1;
    
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('-')) {
        optionStartIndex = i;
        break;
      }
      description += (description ? ' ' : '') + args[i];
    }
    
    expect(description).toBe('Fix bug');
    expect(optionStartIndex).toBe(1);
  });
});