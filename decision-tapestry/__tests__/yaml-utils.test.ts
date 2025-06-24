import { readDecisionsFile, writeDecisionsFile } from '../shared/yaml-utils.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('yaml-utils', () => {
  const testFile = path.join(__dirname, 'test-decisions.yml');
  const sampleData = {
    backlog: [
      { id: 1, title: 'Test Backlog', status: 'Open', rationale: ['Test rationale'], tradeoffs: [], tasks: [] }
    ],
    decisions: [
      { id: 2, title: 'Test Decision', status: 'Accepted', rationale: ['Test rationale'], tradeoffs: [], tasks: [] }
    ]
  };

  afterAll(async () => {
    // Clean up test file
    try { await fs.unlink(testFile); } catch {}
  });

  it('writes and reads decisions.yml correctly', async () => {
    await writeDecisionsFile(testFile, sampleData);
    const parsed = await readDecisionsFile(testFile);
    expect(parsed).toHaveProperty('backlog');
    expect(parsed).toHaveProperty('decisions');
    expect(parsed.backlog[0].title).toBe('Test Backlog');
    expect(parsed.decisions[0].title).toBe('Test Decision');
  });
}); 