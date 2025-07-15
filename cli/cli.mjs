#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import Ajv from 'ajv';
import { 
    startAgent, 
    showAgentStatus, 
    coordinateAgents, 
    runAgentTests, 
    showAgentHelp,
    launchAgents,
    executeAgentTask,
    monitorAgents
} from './agent-commands.mjs';

const commands = {
    init: {
        description: "Initialize a new project with a decisions.yml file.",
        action: initializeProject
    },
    analyze: {
        description: "Analyze existing codebase and generate historical decisions.",
        action: analyzeProject
    },
    capture: {
        description: "Quickly capture a new decision during development.",
        action: captureDecision
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
    activity: {
        description: "Manage Claude Code activity tracking (start, end, status).",
        action: manageActivity
    },
    agent: {
        description: "Manage AI agents for decision implementation (start, status, coordinate, test).",
        action: manageAgent
    },
    help: {
        description: "Show this help message.",
        action: showHelp
    }
};

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

if (majorVersion < 20) {
    console.error(`❌ Node.js ${nodeVersion} is not supported.`);
    console.error(`📋 Decision Tapestry requires Node.js 20.0.0 or higher.`);
    console.error(`💡 Please upgrade your Node.js version:`);
    console.error(`   • Download from: https://nodejs.org/`);
    console.error(`   • Or use a version manager like nvm: https://github.com/nvm-sh/nvm`);
    process.exit(1);
}

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
    
    // Check if decisions.yml already exists
    try {
        await fs.access('decisions.yml');
        console.log("⚠️  decisions.yml already exists in this directory.");
        console.log("To view your decisions: decision-tapestry start");
        console.log("To validate format: decision-tapestry validate");
        return;
    } catch {
        // File doesn't exist, continue with initialization
    }

    // Detect project type
    const isExistingProject = await detectExistingProject();
    
    console.log("Initializing Decision Tapestry project...\n");

    const decisionBoilerplate = `# decisions.yml
# Decision Tapestry - Simple decision tracking for your project
#
# This file tracks architectural and project decisions.
# For the full template with examples, see decisions.template.yml
# For schema validation, run: decision-tapestry validate

# Decisions array - the main content
decisions:
  - id: 1
    title: "Adopt Decision Tapestry for decision tracking"
    status: Accepted

# Optional backlog for future decisions
backlog: []

# Tip: Only 'id', 'title', and 'status' are required.
# Add other fields like 'author', 'date', 'rationale', 'tradeoffs' as needed.
# Run 'decision-tapestry start' to view your decisions in the dashboard.
`;

    try {
        await fs.writeFile('decisions.yml', decisionBoilerplate);
        console.log("✅ Project initialized successfully!");
        console.log("📄 Created 'decisions.yml'");
        
        if (isExistingProject) {
            console.log("\n🔍 Next steps for existing project:");
            console.log("   1. decision-tapestry analyze    # Auto-generate historical decisions");
            console.log("   2. decision-tapestry start      # Launch dashboard");
        } else {
            console.log("\n🚀 Next steps for new project:");
            console.log("   1. decision-tapestry plan       # Get AI-powered planning help");
            console.log("   2. decision-tapestry start      # Launch dashboard");
        }
    } catch (error) {
        console.error("❌ Error initializing project:", error);
    }
}

async function detectExistingProject() {
    try {
        // Check for common project indicators
        const indicators = [
            'package.json', 'Cargo.toml', 'go.mod', 'pom.xml', 'requirements.txt',
            'Gemfile', 'composer.json', 'CMakeLists.txt', 'Makefile'
        ];
        
        for (const indicator of indicators) {
            try {
                await fs.access(indicator);
                return true; // Found at least one project file
            } catch {
                // File doesn't exist, continue checking
            }
        }
        
        // Check for source directories
        const sourceDirs = ['src', 'lib', 'app', 'source', 'code'];
        for (const dir of sourceDirs) {
            try {
                const stat = await fs.stat(dir);
                if (stat.isDirectory()) return true;
            } catch {
                // Directory doesn't exist, continue checking
            }
        }
        
        return false; // No project indicators found
    } catch {
        return false;
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
    console.log("📚 Documentation and Examples:");
    console.log("  • decisions.template.yml - Comprehensive template with all available fields");
    console.log("  • decisions.example.yml  - Real-world examples showing common patterns");
    console.log("  • decisions.schema.json  - JSON schema for validation");
    console.log("");
    console.log("💡 Quick start:");
    console.log("  1. decision-tapestry init      # Create a new decisions.yml");
    console.log("  2. decision-tapestry validate  # Check your file is valid");
    console.log("  3. decision-tapestry start     # Open the dashboard");
    console.log("");
    console.log("🤖 Agent Commands:");
    console.log("  • decision-tapestry agent start <decision-id>    # Start an agent");
    console.log("  • decision-tapestry agent status                 # Show agent status");
    console.log("  • decision-tapestry agent coordinate <id1> <id2> # Coordinate agents");
    console.log("  • decision-tapestry agent test                   # Run agent tests");
    console.log("  • decision-tapestry agent help                   # Agent help");
}

async function analyzeProject() {
    console.log("🔍 Analyzing project to generate historical decisions...\n");
    
    // Check if decisions.yml exists
    try {
        await fs.access('decisions.yml');
        console.log("📄 Found existing decisions.yml");
    } catch {
        console.log("⚠️  No decisions.yml found. Run 'decision-tapestry init' first.");
        return;
    }
    
    const analysis = await performProjectAnalysis();
    
    if (analysis.decisions.length === 0) {
        console.log("💡 No obvious architectural decisions detected in this project.");
        console.log("   Consider manually adding decisions about:");
        console.log("   • Framework/library choices");
        console.log("   • Architecture patterns");
        console.log("   • Database decisions");
        console.log("   • Infrastructure choices");
        return;
    }
    
    console.log(`📋 Found ${analysis.decisions.length} potential historical decisions:`);
    analysis.decisions.forEach((decision, i) => {
        console.log(`   ${i + 1}. ${decision.title}`);
    });
    
    console.log("\n🤖 This is a preview. Full implementation coming soon!");
    console.log("   For now, consider adding these decisions manually to decisions.yml");
}

async function performProjectAnalysis() {
    const decisions = [];
    
    try {
        // Analyze package.json for framework decisions
        const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
        
        // React detection
        if (pkg.dependencies?.react) {
            decisions.push({
                title: "Adopt React for frontend development",
                rationale: "Framework choice for building user interfaces"
            });
        }
        
        // Express detection
        if (pkg.dependencies?.express) {
            decisions.push({
                title: "Use Express.js for backend API",
                rationale: "Web framework choice for Node.js backend"
            });
        }
        
        // TypeScript detection
        if (pkg.devDependencies?.typescript || pkg.dependencies?.typescript) {
            decisions.push({
                title: "Adopt TypeScript for type safety",
                rationale: "Add static typing to improve code quality and developer experience"
            });
        }
        
        // Database decisions
        if (pkg.dependencies?.mongoose || pkg.dependencies?.mongodb) {
            decisions.push({
                title: "Choose MongoDB for data storage",
                rationale: "Database selection for document-based data model"
            });
        }
        
        if (pkg.dependencies?.sequelize || pkg.dependencies?.pg) {
            decisions.push({
                title: "Choose PostgreSQL for data storage",
                rationale: "Database selection for relational data model"
            });
        }
        
    } catch {
        // package.json not found or invalid, skip analysis
    }
    
    return { decisions };
}

async function captureDecision() {
    const args = process.argv.slice(3); // Get arguments after 'capture'
    const title = args[0];
    
    if (!title) {
        console.log("❌ Please provide a decision title:");
        console.log("   decision-tapestry capture \"Your decision title\"");
        console.log("   decision-tapestry capture \"Use Redis for caching\"");
        return;
    }
    
    try {
        // Check if decisions.yml exists
        let decisionsData;
        try {
            const rawData = await fs.readFile('decisions.yml', 'utf8');
            decisionsData = rawData;
        } catch {
            console.log("⚠️  No decisions.yml found. Run 'decision-tapestry init' first.");
            return;
        }
        
        // Find the highest existing ID
        const idMatches = decisionsData.match(/id:\s*(\d+)/g);
        let nextId = 1;
        if (idMatches) {
            const ids = idMatches.map(match => parseInt(match.split(':')[1].trim()));
            nextId = Math.max(...ids) + 1;
        }
        
        const newDecision = `  - id: ${nextId}
    title: "${title}"
    author: "Quick Capture"
    date: "${new Date().toISOString()}"
    status: Proposed
    rationale:
      - "Captured during development workflow"
    tradeoffs:
      - "TODO: Add trade-offs analysis"
    tasks:
      - description: "Review and complete this decision"
        status: Pending`;
        
        // Insert the new decision after the decisions: line
        const updatedData = decisionsData.replace(
            /decisions:\s*\n/,
            `decisions:\n${newDecision}\n`
        );
        
        await fs.writeFile('decisions.yml', updatedData);
        console.log(`✅ Captured decision #${nextId}: "${title}"`);
        console.log("📝 Added to decisions.yml with 'Proposed' status");
        console.log("💡 Edit the file to add rationale, trade-offs, and mark as Accepted");
        
    } catch (error) {
        console.error("❌ Error capturing decision:", error.message);
    }
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
    console.log("🔍 Validating decisions.yml against schema...\n");
    
    let yamlData, schema;
    try {
        const yamlRaw = await fs.readFile('decisions.yml', 'utf8');
        const yaml = (await import('js-yaml')).default;
        yamlData = yaml.load(yamlRaw);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error("❌ decisions.yml not found in current directory.");
            console.log("💡 Run 'decision-tapestry init' to create a new decisions.yml file.");
            return;
        }
        console.error("❌ Could not parse decisions.yml:", err.message);
        if (err.name === 'YAMLException') {
            console.log("💡 Check your YAML syntax. Common issues:");
            console.log("   - Incorrect indentation (use spaces, not tabs)");
            console.log("   - Missing quotes around strings with special characters");
            console.log("   - Mismatched brackets or array syntax");
        }
        return;
    }
    
    // Check basic structure first
    if (!yamlData) {
        console.error("❌ decisions.yml is empty or invalid");
        console.log("💡 See decisions.template.yml for examples");
        return;
    }
    
    if (!yamlData.decisions) {
        console.error("❌ Missing 'decisions' array in decisions.yml");
        console.log("💡 Your file should have a top-level 'decisions' array:");
        console.log("   decisions:");
        console.log("     - id: 1");
        console.log("       title: \"Your first decision\"");
        console.log("       status: Accepted");
        return;
    }
    
    if (!Array.isArray(yamlData.decisions)) {
        console.error("❌ 'decisions' must be an array, not an object");
        console.log("💡 Use this structure:");
        console.log("   decisions:");
        console.log("     - id: 1       # Array item");
        console.log("   NOT:");
        console.log("   decisions:");
        console.log("     backlog: []   # Object properties");
        return;
    }
    
    try {
        const schemaPath = path.resolve(path.dirname(import.meta.url.slice(7)), '../decisions.schema.json');
        const schemaRaw = await fs.readFile(schemaPath, 'utf8');
        schema = JSON.parse(schemaRaw);
    } catch (err) {
        console.error("❌ Could not load schema file:", err.message);
        console.log("💡 This might be a package installation issue.");
        return;
    }
    
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    const valid = validate(yamlData);
    
    if (valid) {
        console.log("✅ decisions.yml is valid!");
        console.log(`📊 Found ${yamlData.decisions.length} decision(s)`);
        if (yamlData.backlog && yamlData.backlog.length > 0) {
            console.log(`📋 Found ${yamlData.backlog.length} backlog item(s)`);
        }
    } else {
        console.error("❌ decisions.yml has validation errors:\n");
        
        // Group errors by type for better readability
        const errorsByType = {};
        for (const error of validate.errors) {
            const errorType = error.keyword;
            if (!errorsByType[errorType]) {
                errorsByType[errorType] = [];
            }
            errorsByType[errorType].push(error);
        }
        
        // Show missing required fields
        if (errorsByType.required) {
            console.log("📝 Missing required fields:");
            for (const error of errorsByType.required) {
                const itemPath = error.instancePath || "root";
                console.log(`   ${itemPath}: missing '${error.params.missingProperty}'`);
            }
            console.log("   💡 Required fields: id, title, status\n");
        }
        
        // Show enum violations (invalid status values)
        if (errorsByType.enum) {
            console.log("🏷️  Invalid status values:");
            for (const error of errorsByType.enum) {
                console.log(`   ${error.instancePath}: '${error.data}' is not valid`);
                console.log(`      Allowed values: ${error.params.allowedValues.join(', ')}`);
            }
            console.log();
        }
        
        // Show other errors
        const otherErrors = validate.errors.filter(e => !['required', 'enum'].includes(e.keyword));
        if (otherErrors.length > 0) {
            console.log("🔧 Other validation errors:");
            for (const error of otherErrors) {
                console.log(`   ${error.instancePath || 'root'}: ${error.message}`);
            }
            console.log();
        }
        
        console.log("💡 For examples and documentation, see decisions.template.yml");
        console.log("💡 Run 'decision-tapestry init' to start with a minimal valid file");
        process.exitCode = 1;
    }
}

async function manageActivity() {
    const activityArgs = process.argv.slice(3);
    const subcommand = activityArgs[0] || 'help';
    
    // Dynamic import for activity module
    let activityModule;
    try {
        activityModule = await import('../claude-code-integration/claude-code-hook.mjs');
    } catch (err) {
        console.error("❌ Activity tracking module not available");
        console.error("💡 This feature requires the Claude Code integration to be installed");
        return;
    }
    
    const { 
        startSession, 
        endSession, 
        setDecisionContext, 
        getMonitoringStatus,
        toggleActivityTracking 
    } = activityModule;
    
    switch (subcommand) {
        case 'start': {
            const decisionId = activityArgs[1];
            startSession(decisionId ? parseInt(decisionId) : null);
            console.log("✅ Activity tracking session started");
            if (decisionId) {
                console.log(`📌 Tracking activities for decision #${decisionId}`);
            }
            break;
        }
            
        case 'end':
            endSession();
            console.log("⏹️  Activity tracking session ended");
            break;
            
        case 'context': {
            const contextId = activityArgs[1];
            if (!contextId) {
                console.error("❌ Please provide a decision ID");
                console.log("💡 Usage: decision-tapestry activity context <decision-id>");
                return;
            }
            setDecisionContext(parseInt(contextId));
            console.log(`📌 Activity context set to decision #${contextId}`);
            break;
        }
            
        case 'status': {
            const status = getMonitoringStatus();
            console.log("\n🔍 Activity Monitoring Status:");
            console.log("─".repeat(40));
            console.log(`Tracking: ${status.enabled ? '✅ enabled' : '❌ disabled'}`);
            console.log(`Server: ${status.serverUrl}`);
            console.log(`Current Decision: ${status.currentDecision ? `#${status.currentDecision}` : 'none'}`);
            console.log(`File Mappings: ${status.fileMapSize} files mapped`);
            
            if (status.lastActivity) {
                console.log("\n📊 Last Activity:");
                console.log("─".repeat(40));
                console.log(`State: ${status.lastActivity.state}`);
                console.log(`Description: ${status.lastActivity.taskDescription}`);
                if (status.lastActivity.decisionId) {
                    console.log(`Decision: #${status.lastActivity.decisionId}`);
                }
            }
            break;
        }
            
        case 'toggle': {
            const state = activityArgs[1];
            if (!state || !['on', 'off'].includes(state)) {
                console.error("❌ Please specify 'on' or 'off'");
                console.log("💡 Usage: decision-tapestry activity toggle [on|off]");
                return;
            }
            toggleActivityTracking(state === 'on');
            console.log(`✅ Activity tracking ${state === 'on' ? 'enabled' : 'disabled'}`);
            break;
        }
            
        case 'help':
        default:
            console.log("\n📊 Activity Tracking Commands:");
            console.log("─".repeat(40));
            console.log("  start [decision-id]  Start tracking session");
            console.log("  end                  End tracking session");
            console.log("  context <id>         Set decision context");
            console.log("  status               Show current status");
            console.log("  toggle [on|off]      Enable/disable tracking");
            console.log("\nExamples:");
            console.log("  decision-tapestry activity start 58");
            console.log("  decision-tapestry activity status");
            console.log("  decision-tapestry activity end");
            break;
    }
}

async function manageAgent() {
    const agentArgs = process.argv.slice(3);
    const subcommand = agentArgs[0] || 'help';
    
    switch (subcommand) {
        case 'start':
            await startAgent();
            break;
            
        case 'status':
            await showAgentStatus();
            break;
            
        case 'coordinate':
            await coordinateAgents();
            break;
            
        case 'launch':
            await launchAgents();
            break;
            
        case 'task':
            await executeAgentTask();
            break;
            
        case 'monitor':
            await monitorAgents();
            break;
            
        case 'test':
            await runAgentTests();
            break;
            
        case 'help':
        default:
            await showAgentHelp();
            break;
    }
}