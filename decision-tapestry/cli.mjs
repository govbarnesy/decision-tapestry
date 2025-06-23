#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const commands = {
    init: {
        description: "Initialize a new project with a decisions.yml and PRODUCT-BACKLOG.md file.",
        action: initializeProject
    },
    start: {
        description: "Start the Decision Tapestry server and open the dashboard.",
        action: startServer
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
    console.log("Initializing Decision Tapestry project...");

    const decisionBoilerplate = `# decisions.yml
# This is an example of a decision log.
# For more information on the schema, see the documentation.

- id: 1
  title: "Adopt Decision Tapestry for ADRs"
  date: "2024-01-15T10:00:00Z"
  author: "Clyde"
  status: "Accepted"
  project: "Component Library"
  rationale:
    - "To improve our process for recording and communicating architectural decisions."
    - "To create a living document that can be easily updated and referenced."
  tradeoffs:
    - "Requires a small time investment to learn and adopt the tool."
  related_to: []
  supersedes: null
  superseded_by: null
`;

    const backlogBoilerplate = `# Product Backlog

This file contains ideas, tasks, and potential features that are not yet formal decisions.
Promote items from this backlog into the decision log when you are ready to formally consider them.

### Feature: Add Search Functionality

- It should be possible to search decisions by title, author, or content.
`;

    try {
        await fs.writeFile('decisions.yml', decisionBoilerplate);
        await fs.writeFile('PRODUCT-BACKLOG.md', backlogBoilerplate);
        console.log("Project initialized successfully.");
        console.log("Created 'decisions.yml' and 'PRODUCT-BACKLOG.md'.");
        console.log("Run 'decision-tapestry start' to see your dashboard.");
    } catch (error) {
        console.error("Error initializing project:", error);
    }
}

function startServer() {
    console.log("Starting Decision Tapestry server...");
    // We need to find the server.mjs file relative to *this* script's location
    const serverPath = path.resolve(path.dirname(import.meta.url.slice(7)), 'server.mjs');

    const nodemon = spawn('nodemon', [serverPath], {
        stdio: 'inherit' // This will pipe the output of the server to the current console
    });

    nodemon.on('close', (code) => {
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
} 