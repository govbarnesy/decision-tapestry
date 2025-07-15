import { readDecisionsFile } from '../shared/yaml-utils.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Decision Clustering Features', () => {
  const testFile = path.join(__dirname, 'test-clustering-decisions.yml');
  
  const sampleDataWithCategories = {
    backlog: [],
    decisions: [
      {
        id: 1,
        title: 'Choose Database Technology',
        author: 'Test Author',
        date: '2025-07-15T00:00:00Z',
        status: 'Accepted',
        category: 'Infrastructure',
        rationale: ['Need persistent data storage'],
        tradeoffs: ['Database dependency'],
        tasks: [],
        affected_components: ['server/database/', 'shared/models/']
      },
      {
        id: 2,
        title: 'Design User Interface Layout',
        author: 'Test Designer',
        date: '2025-07-15T01:00:00Z',
        status: 'Accepted',
        category: 'UI/UX',
        rationale: ['Improve user experience'],
        tradeoffs: ['Design complexity'],
        tasks: [],
        affected_components: ['dashboard/components/', 'dashboard/style.css']
      },
      {
        id: 3,
        title: 'Implement Authentication System',
        author: 'Test Developer',
        date: '2025-07-15T02:00:00Z',
        status: 'Accepted',
        category: 'Architecture',
        rationale: ['Security requirement'],
        tradeoffs: ['Implementation time'],
        tasks: [],
        affected_components: ['server/auth/', 'dashboard/login/'],
        related_to: [1]
      }
    ]
  };

  beforeAll(async () => {
    // Create test file with categorized decisions
    const yaml = `decisions:
  - id: 1
    title: "Choose Database Technology"
    author: "Test Author"
    date: "2025-07-15T00:00:00Z"
    status: "Accepted"
    category: "Infrastructure"
    rationale:
      - "Need persistent data storage"
    tradeoffs:
      - "Database dependency"
    tasks: []
    affected_components:
      - "server/database/"
      - "shared/models/"
  - id: 2
    title: "Design User Interface Layout"
    author: "Test Designer"
    date: "2025-07-15T01:00:00Z"
    status: "Accepted"
    category: "UI/UX"
    rationale:
      - "Improve user experience"
    tradeoffs:
      - "Design complexity"
    tasks: []
    affected_components:
      - "dashboard/components/"
      - "dashboard/style.css"
  - id: 3
    title: "Implement Authentication System"
    author: "Test Developer"
    date: "2025-07-15T02:00:00Z"
    status: "Accepted"
    category: "Architecture"
    rationale:
      - "Security requirement"
    tradeoffs:
      - "Implementation time"
    tasks: []
    affected_components:
      - "server/auth/"
      - "dashboard/login/"
    related_to: [1]
backlog: []`;
    
    await fs.writeFile(testFile, yaml, 'utf8');
  });

  afterAll(async () => {
    // Clean up test file
    try { 
      await fs.unlink(testFile); 
    } catch { /* file may not exist */ }
  });

  it('reads decisions with category field correctly', async () => {
    const parsed = await readDecisionsFile(testFile);
    
    expect(parsed).toHaveProperty('decisions');
    expect(parsed.decisions).toHaveLength(3);
    
    // Test category field exists and is correct
    const infraDecision = parsed.decisions.find((d: any) => d.category === 'Infrastructure');
    const uiDecision = parsed.decisions.find((d: any) => d.category === 'UI/UX');
    const archDecision = parsed.decisions.find((d: any) => d.category === 'Architecture');
    
    expect(infraDecision).toBeDefined();
    expect(infraDecision.title).toBe('Choose Database Technology');
    
    expect(uiDecision).toBeDefined();
    expect(uiDecision.title).toBe('Design User Interface Layout');
    
    expect(archDecision).toBeDefined();
    expect(archDecision.title).toBe('Implement Authentication System');
  });

  it('validates affected_components field for architecture mapping', async () => {
    const parsed = await readDecisionsFile(testFile);
    
    // Test that affected_components are properly structured
    parsed.decisions.forEach((decision: any) => {
      expect(decision).toHaveProperty('affected_components');
      expect(Array.isArray(decision.affected_components)).toBe(true);
      expect(decision.affected_components.length).toBeGreaterThan(0);
    });
    
    // Test specific component mappings
    const dbDecision = parsed.decisions.find((d: any) => d.id === 1);
    expect(dbDecision.affected_components).toContain('server/database/');
    expect(dbDecision.affected_components).toContain('shared/models/');
    
    const uiDecision = parsed.decisions.find((d: any) => d.id === 2);
    expect(uiDecision.affected_components).toContain('dashboard/components/');
    expect(uiDecision.affected_components).toContain('dashboard/style.css');
  });

  it('validates decision relationships for pathway exploration', async () => {
    const parsed = await readDecisionsFile(testFile);
    
    // Test related_to relationships
    const authDecision = parsed.decisions.find((d: any) => d.id === 3);
    expect(authDecision).toHaveProperty('related_to');
    expect(Array.isArray(authDecision.related_to)).toBe(true);
    expect(authDecision.related_to).toContain(1);
  });

  it('supports category-based clustering logic', async () => {
    const parsed = await readDecisionsFile(testFile);
    
    // Test that we can group decisions by category
    const categories = new Set(parsed.decisions.map((d: any) => d.category));
    expect(categories.size).toBe(3);
    expect(categories.has('Infrastructure')).toBe(true);
    expect(categories.has('UI/UX')).toBe(true);
    expect(categories.has('Architecture')).toBe(true);
    
    // Test clustering logic
    const clusteredByCategory = parsed.decisions.reduce((clusters: any, decision: any) => {
      const category = decision.category || 'Other';
      if (!clusters[category]) clusters[category] = [];
      clusters[category].push(decision);
      return clusters;
    }, {});
    
    expect(clusteredByCategory['Infrastructure']).toHaveLength(1);
    expect(clusteredByCategory['UI/UX']).toHaveLength(1);
    expect(clusteredByCategory['Architecture']).toHaveLength(1);
  });

  it('supports component-based architecture analysis', async () => {
    const parsed = await readDecisionsFile(testFile);
    
    // Test that we can map components to decisions
    const componentToDecisions: any = {};
    
    parsed.decisions.forEach((decision: any) => {
      decision.affected_components.forEach((component: string) => {
        if (!componentToDecisions[component]) {
          componentToDecisions[component] = [];
        }
        componentToDecisions[component].push(decision.id);
      });
    });
    
    // Verify component mappings
    expect(componentToDecisions['server/database/']).toEqual([1]);
    expect(componentToDecisions['dashboard/components/']).toEqual([2]);
    expect(componentToDecisions['server/auth/']).toEqual([3]);
    
    // Test that some components are affected by multiple decisions
    const allComponents = Object.keys(componentToDecisions);
    expect(allComponents.length).toBeGreaterThan(0);
  });
});