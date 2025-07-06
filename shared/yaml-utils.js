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
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const parsedData = yaml.load(content);
    
    // Validate the parsed data structure
    if (!parsedData) {
      throw new Error('Empty or invalid YAML file');
    }
    
    // Ensure decisions is an array
    if (parsedData.decisions && !Array.isArray(parsedData.decisions)) {
      throw new Error('Invalid decisions.yml format - "decisions" must be an array');
    }
    
    // Ensure backlog is an array if it exists
    if (parsedData.backlog && !Array.isArray(parsedData.backlog)) {
      throw new Error('Invalid decisions.yml format - "backlog" must be an array');
    }
    
    // Provide default structure if missing
    return {
      decisions: parsedData.decisions || [],
      backlog: parsedData.backlog || [],
      ...parsedData
    };
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Could not find decisions.yml at ${filePath}. Run 'decision-tapestry init' to create one.`);
    }
    if (error.name === 'YAMLException') {
      throw new Error(`Invalid YAML syntax in decisions.yml: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Writes the given data to decisions.yml at the given path.
 * @param {string} filePath - Path to decisions.yml
 * @param {any} data - Data to serialize and write
 * @returns {Promise<void>}
 */
export async function writeDecisionsFile(filePath, data) {
  try {
    const yamlString = yaml.dump(data);
    await fs.writeFile(filePath, yamlString, 'utf8');
  } catch (error) {
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied writing to ${filePath}. Check file permissions.`);
    }
    if (error.code === 'ENOENT') {
      throw new Error(`Directory does not exist for ${filePath}. Create the directory first.`);
    }
    throw new Error(`Failed to write decisions.yml: ${error.message}`);
  }
} 