#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import Ajv from 'ajv';

const commands = {
    init: {
        description: "Initialize a new project with a decisions.yml file.",
        action: initializeProject
    },
    start: {
        description: "Start the Decision Tapestry server and open the dashboard.",
        action: startServer
    },
    plan: {
        description: "Generate a Cursor onboarding prompt based on your project context.",
        action: generateCursorPrompt
    },
    validate: {
        description: "Validate decisions.yml against the schema.",
        action: validateDecisionsFile
    },
    help: {
        description: "Show this help message.",
        action: showHelp
    }
};

const args = process.argv.slice(2);
const command = args[0] || 'help';

if (commands[command]) {
    commands[command].action();
} else {
    console.log(`Unknown command: ${command}`);
    showHelp();
}

async function initializeProject() {
    const asciiArt = `
╔════════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ██████╗ ███████╗ ██████╗ ██╗ ██████╗ ██╗███████╗███╗   ██╗     ║
║   ██╔══██╗██╔════╝██╔════╝ ██║██╔═══██╗██║██╔════╝████╗  ██║     ║
║   ██████╔╝█████╗  ██║  ███╗██║██║   ██║██║█████╗  ██╔██╗ ██║     ║
║   ██╔═══╝ ██╔══╝  ██║   ██║██║██║   ██║██║██╔══╝  ██║╚██╗██║     ║
║   ██║     ███████╗╚██████╔╝██║╚██████╔╝██║███████╗██║ ╚████║     ║
║   ╚═╝     ╚══════╝ ╚═════╝ ╚═╝ ╚═════╝ ╚═╝╚══════╝╚═╝  ╚═══╝     ║
║                                                                  ║
║   Decision Tapestry — Durable Decisions, Clear Backlogs           ║
║                                                                  ║
╚════════════════════════════════════════════════════════════════════╝
`;
    console.log(asciiArt);
    console.log("Initializing Decision Tapestry project...\n");

    const decisionBoilerplate = `# decisions.yml
# This is an example of a decision log.
# For more information on the schema, see the documentation.

- id: 1
  title: \"Adopt Decision Tapestry for ADRs\"
  date: \"2024-01-15T10:00:00Z\"
  author: \"Clyde\"
  status: \"Accepted\"
  project: \"Component Library\"
  rationale:
    - \"To improve our process for recording and communicating architectural decisions.\"
    - \"To create a living document that can be easily updated and referenced.\"
  tradeoffs:
    - \"Requires a small time investment to learn and adopt the tool.\"
  related_to: []
  supersedes: null
  superseded_by: null
`;

    try {
        await fs.writeFile('decisions.yml', decisionBoilerplate);
        console.log("Project initialized successfully.");
        console.log("Created 'decisions.yml'.");
        console.log("Run 'decision-tapestry start' to see your dashboard.");
    } catch (error) {
        console.error("Error initializing project:", error);
    }
}

function startServer() {
    console.log("Starting Decision Tapestry server...");
    // We need to find the server.mjs file relative to *this* script's location
    const serverPath = path.resolve(path.dirname(import.meta.url.slice(7)), '../server/server.mjs');

    const node = spawn('node', [serverPath], {
        stdio: 'inherit' // This will pipe the output of the server to the current console
    });

    node.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
    });
}

function showHelp() {
    console.log("\nDecision Tapestry CLI");
    console.log("Usage: decision-tapestry <command>\n");
    console.log("Available commands:");
    for (const cmd in commands) {
        console.log(`  ${cmd.padEnd(10)} ${commands[cmd].description}`);
    }
    console.log("");
    console.log("For new projects, see 'decisions.template.yml' for a ready-to-use template.");
}

async function generateCursorPrompt() {
    console.log("Analyzing your project for context...\n");
    let projectName = null;
    let projectDescription = null;
    // Try to read package.json
    try {
        const pkgRaw = await fs.readFile('package.json', 'utf8');
        const pkg = JSON.parse(pkgRaw);
        projectName = pkg.name || null;
        projectDescription = pkg.description || null;
    } catch {}
    // Try to read README.md if description is missing
    if (!projectDescription) {
        try {
            const readme = await fs.readFile('README.md', 'utf8');
            // Use first non-empty line after a heading as a fallback description
            const lines = readme.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].toLowerCase().includes('description')) {
                    projectDescription = lines[i+1] ? lines[i+1].trim() : null;
                    break;
                }
            }
        } catch {}
    }
    // Output what was found
    if (projectName) console.log(`- Project name: ${projectName}`);
    if (projectDescription) console.log(`- Description: ${projectDescription}`);
    console.log("\n---\n");
    // Load schema example from decisions.template.yml
    let schemaExample = '';
    try {
        schemaExample = await fs.readFile('decisions.template.yml', 'utf8');
    } catch {
        schemaExample = '# (Could not load decisions.template.yml)';
    }
    // Generate the prompt
    let prompt = 'Copy and paste the following into Cursor chat to start your planning phase:\n\n---\n';
    prompt += `I am working on a project${projectName ? ` called \"${projectName}\"` : ''}.\n`;
    if (projectDescription) prompt += `Description: ${projectDescription}\n\n`;
    prompt += `I want to use Decision Tapestry to help me plan and track key decisions.\n\nPlease help me:\n1. Identify the main goals and outcomes for this project.\n2. List the major decisions or milestones I should consider.\n3. Create a backlog of decisions in YAML format (for use with Decision Tapestry).\n4. Guide me to implement my first decision.\n\n---\n`;
    prompt += `For reference, here is the canonical schema and example for Decision Tapestry (@decisions.template.yml):\n\n`;
    prompt += '```yaml\n' + schemaExample.trim() + '\n```\n';
    prompt += '\nAny future updates to the schema and allowed status values will be reflected in @decisions.template.yml.\n';
    prompt += 'Please refer to the comments in the template for the correct status values for tasks, backlog items, and decisions.';
    console.log(prompt);
    // Also write to file
    try {
        await fs.writeFile('decision-tapestry-cursor-prompt.txt', prompt, 'utf8');
        console.log("\n(Onboarding prompt also written to decision-tapestry-cursor-prompt.txt)");
    } catch (err) {
        console.warn("Could not write onboarding prompt to file:", err);
    }
}

async function validateDecisionsFile() {
    console.log("Validating decisions.yml against decisions.schema.json...\n");
    let yamlData, schema;
    try {
        const yamlRaw = await fs.readFile('decisions.yml', 'utf8');
        const yaml = (await import('js-yaml')).default;
        yamlData = yaml.load(yamlRaw);
    } catch (err) {
        console.error("Could not read or parse decisions.yml:", err.message);
        return;
    }
    try {
        const schemaRaw = await fs.readFile('decisions.schema.json', 'utf8');
        schema = JSON.parse(schemaRaw);
    } catch (err) {
        console.error("Could not read or parse decisions.schema.json:", err.message);
        return;
    }
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    const valid = validate(yamlData);
    if (valid) {
        console.log("✅ decisions.yml is valid!");
    } else {
        console.error("❌ decisions.yml is INVALID. Errors:");
        for (const error of validate.errors) {
            console.error(`- ${error.instancePath}: ${error.message}`);
        }
        process.exitCode = 1;
    }
} 