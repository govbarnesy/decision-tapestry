import fs from 'fs/promises';
import yaml from 'js-yaml';
import path from 'path';

// @ts-check
// Type definitions for yaml-utils.mjs
/**
 * @typedef {Object} DecisionsData
 * @property {Array<any>} backlog
 * @property {Array<any>} decisions
 */

/**
 * Reads and parses the decisions.yml file at the given path.
 * @param {string} filePath - Path to decisions.yml
 * @returns {Promise<any>} Parsed YAML object
 */
export async function readDecisionsFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return yaml.load(content);
}

/**
 * Writes the given data to decisions.yml at the given path.
 * @param {string} filePath - Path to decisions.yml
 * @param {any} data - Data to serialize and write
 * @returns {Promise<void>}
 */
export async function writeDecisionsFile(filePath, data) {
  const yamlString = yaml.dump(data);
  await fs.writeFile(filePath, yamlString, 'utf8');
} 