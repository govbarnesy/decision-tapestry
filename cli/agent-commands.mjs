/**
 * Agent CLI Commands
 * Built-in commands for agent management and coordination
 */

import { DecisionTapestryAgent } from './agent-framework.mjs';
import { AgentCoordinator } from './agent-coordinator.mjs';
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Start an agent for a specific decision
 */
export async function startAgent() {
    const args = process.argv.slice(4); // Skip 'node', 'cli.mjs', 'agent', 'start'
    const decisionId = parseInt(args[0]);
    const agentId = args[1] || `Agent-${decisionId}`;
    
    if (!decisionId) {
        console.error('❌ Please provide a decision ID:');
        console.error('   decision-tapestry agent start <decision-id> [agent-id]');
        console.error('   decision-tapestry agent start 65 Agent-A');
        return;
    }
    
    try {
        console.log(`🚀 Starting ${agentId} for Decision #${decisionId}...`);
        
        // Create and initialize agent
        const agent = new DecisionTapestryAgent(agentId, decisionId);
        await agent.initialize();
        
        // Start agent work
        const report = await agent.start();
        
        console.log('✅ Agent completed successfully!');
        console.log(`📊 Completed ${report.completedTasks}/${report.totalTasks} tasks`);
        console.log(`⏱️  Duration: ${Math.round(report.duration / 1000)}s`);
        
        if (report.errors.length > 0) {
            console.log(`⚠️  Errors: ${report.errors.length}`);
            report.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        return report;
        
    } catch (error) {
        console.error(`❌ Agent failed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Show agent status
 */
export async function showAgentStatus() {
    const args = process.argv.slice(4); // Skip 'node', 'cli.mjs', 'agent', 'status'
    const agentId = args[0];
    
    try {
        if (agentId) {
            // Show specific agent status
            const status = await getAgentStatus(agentId);
            displayAgentStatus(status);
        } else {
            // Show all active agents
            const allAgents = await getAllAgentStatus();
            displayAllAgentsStatus(allAgents);
        }
        
    } catch (error) {
        console.error(`❌ Failed to get agent status: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Coordinate multiple agents
 */
export async function coordinateAgents() {
    const args = process.argv.slice(4); // Skip 'node', 'cli.mjs', 'agent', 'coordinate'
    const decisionIds = args.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (decisionIds.length === 0) {
        console.error('❌ Please provide decision IDs to coordinate:');
        console.error('   decision-tapestry agent coordinate <decision-id1> <decision-id2> ...');
        console.error('   decision-tapestry agent coordinate 65 66 67 68');
        return;
    }
    
    try {
        console.log(`🎭 Coordinating agents for decisions: ${decisionIds.join(', ')}`);
        
        const coordinator = new AgentCoordinator();
        await coordinator.initialize();
        
        const results = await coordinator.coordinateDecisions(decisionIds);
        
        console.log('✅ Agent coordination completed!');
        console.log(`📊 Completed ${results.completed}/${results.total} decisions`);
        
        if (results.errors.length > 0) {
            console.log(`⚠️  Errors: ${results.errors.length}`);
            results.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        return results;
        
    } catch (error) {
        console.error(`❌ Agent coordination failed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Execute a specific task description
 */
export async function executeAgentTask() {
    const args = process.argv.slice(4); // Skip 'node', 'cli.mjs', 'agent', 'task'
    const taskDescription = args.join(' ');
    
    if (!taskDescription) {
        console.error('❌ Please provide a task description:');
        console.error('   decision-tapestry agent task <task-description>');
        console.error('   decision-tapestry agent task "Fix search panel bugs"');
        return;
    }
    
    try {
        // Extract agent ID from environment or generate one
        const agentId = process.env.AGENT_ID || `Agent-${Date.now()}`;
        
        // Execute the Claude agent
        const { spawn } = await import('child_process');
        const agentPath = path.resolve(__dirname, 'claude-agent.mjs');
        
        const agent = spawn('node', [agentPath, agentId, taskDescription], {
            stdio: 'inherit',
            env: { ...process.env, AGENT_ID: agentId }
        });
        
        agent.on('close', (code) => {
            if (code === 0) {
                console.log('\n✅ Agent task completed successfully!');
            } else {
                console.error(`\n❌ Agent task failed with exit code ${code}`);
                process.exit(code);
            }
        });
        
        agent.on('error', (error) => {
            console.error(`❌ Failed to start agent: ${error.message}`);
            process.exit(1);
        });
        
    } catch (error) {
        console.error(`❌ Task execution failed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Monitor all agents in real-time
 */
export async function monitorAgents() {
    console.log(`
🎭 Agent Monitor - Real-time Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Press Ctrl+C to exit
`);
    
    try {
        const response = await fetch('http://localhost:8080/api/activity?includeHistory=true');
        if (!response.ok) {
            throw new Error('Server not running. Start with: npm start');
        }
        
        const data = await response.json();
        const activeAgents = data.agents || [];
        const recentActivities = data.history?.slice(0, 10) || [];
        
        // Display active agents
        console.log('\n📊 Active Agents:');
        if (activeAgents.length === 0) {
            console.log('   No active agents');
        } else {
            activeAgents.forEach(agent => {
                const stateIcon = {
                    'working': '🟢',
                    'debugging': '🟠',
                    'testing': '🔵',
                    'reviewing': '🟣',
                    'idle': '⚪'
                }[agent.state] || '⚫';
                
                console.log(`   ${stateIcon} ${agent.agentId}: ${agent.state} - ${agent.taskDescription || 'No task'}`);
            });
        }
        
        // Display recent activities
        console.log('\n📜 Recent Activities:');
        recentActivities.forEach(activity => {
            const time = new Date(activity.timestamp).toLocaleTimeString();
            console.log(`   [${time}] ${activity.agentId}: ${activity.state} - ${activity.taskDescription}`);
        });
        
        // Refresh every 2 seconds
        setTimeout(() => {
            console.clear();
            monitorAgents();
        }, 2000);
        
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        console.log('\n💡 Make sure the Decision Tapestry server is running:');
        console.log('   npm start');
    }
}

/**
 * Run agent tests
 */
export async function runAgentTests() {
    const args = process.argv.slice(4); // Skip 'node', 'cli.mjs', 'agent', 'test'
    const testType = args[0] || 'all';
    
    try {
        console.log(`🧪 Running agent tests: ${testType}`);
        
        switch (testType) {
            case 'all':
                await runAllAgentTests();
                break;
            case 'integration':
                await runIntegrationTests();
                break;
            case 'schema':
                await runSchemaTests();
                break;
            default:
                // Run tests for specific agent
                await runSpecificAgentTests(testType);
                break;
        }
        
    } catch (error) {
        console.error(`❌ Agent tests failed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Launch multiple agents in separate terminals
 */
export async function launchAgents() {
    const args = process.argv.slice(4); // Skip 'node', 'cli.mjs', 'agent', 'launch'
    
    try {
        const { spawn } = await import('child_process');
        const os = await import('os');
        const platform = os.platform();
        
        // Launch agent in new terminal
        const launchInTerminal = (agentId, taskDesc, command) => {
            console.log(`🚀 Launching ${agentId}: ${taskDesc}`);
            
            if (platform === 'darwin') {
                // macOS - use AppleScript to open new Terminal window
                const escapedCommand = command.replace(/"/g, '\\"');
                const script = `
                    tell application "Terminal"
                        do script "${escapedCommand}"
                        activate
                    end tell
                `;
                spawn('osascript', ['-e', script], { detached: true, stdio: 'ignore' });
            } else if (platform === 'win32') {
                // Windows - use start command
                spawn('cmd', ['/c', 'start', 'cmd', '/k', command], { 
                    detached: true, 
                    shell: true 
                });
            } else if (platform === 'linux') {
                // Linux - use gnome-terminal or xterm
                spawn('gnome-terminal', ['--', 'bash', '-c', `${command}; read -p "Press enter to close"`], {
                    detached: true
                });
            }
        };
        
        // Pre-configured agents for the current task
        const agents = [
            {
                id: 'Agent-1-SearchFilter',
                task: 'Fix search/filter panels - show content, consistent tab buttons, remove analytics',
                cmd: `cd "${process.cwd()}" && AGENT_ID=Agent-1-SearchFilter node cli/cli.mjs agent task "Fix search and filter panels. The panels are not showing content. Apply consistent tab button structure and style as middle/right panels. Remove analytics panel. Look at dashboard/search-panel.mjs, dashboard/enhanced-time-filter.mjs, dashboard/author-filter.mjs"`
            },
            {
                id: 'Agent-2-VisualTest',
                task: 'Design visual test for real-time task completion',
                cmd: `cd "${process.cwd()}" && AGENT_ID=Agent-2-VisualTest node cli/cli.mjs agent task "Design and implement visual test to observe agent actions in real-time. Create mechanism to watch tasks being marked as Done. Make it triggerable via CLI. Use existing agent activity system and real-time updates."`
            },
            {
                id: 'Agent-3-Music',
                task: 'Implement strudel.cc music integration for demo mode',
                cmd: `cd "${process.cwd()}" && AGENT_ID=Agent-3-Music node cli/cli.mjs agent task "Plan and implement music integration using strudel.cc. Add delightful audio signaling for agent updates with comedic timing. Add demo mode button next to dark/light mode toggle. Ensure buttons fit tab header size."`
            },
            {
                id: 'Agent-4-Mobile',
                task: 'Mobile view strategy and resizable panels',
                cmd: `cd "${process.cwd()}" && AGENT_ID=Agent-4-Mobile node cli/cli.mjs agent task "Design and implement mobile-friendly view. Create mobile menu system for panels. Make all panels resizable on desktop. Ensure responsive design across all device sizes."`
            },
            {
                id: 'Agent-5-Architecture',
                task: 'Toggle component types in architecture view',
                cmd: `cd "${process.cwd()}" && AGENT_ID=Agent-5-Architecture node cli/cli.mjs agent task "Implement feature to toggle on/off component types in architecture view. Add UI controls to selectively show/hide different component categories. Update dashboard/decision-map.mjs architecture visualization."`
            }
        ];
        
        console.log(`
🎭 Launching ${agents.length} agents in parallel...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
        
        // Launch all agents
        agents.forEach((agent, index) => {
            setTimeout(() => {
                launchInTerminal(agent.id, agent.task, agent.cmd);
            }, index * 1000); // Small delay between launches
        });
        
        console.log(`
✅ All agents launched! 

📊 Monitor progress:
  • Dashboard: http://localhost:8080
  • Agent status: decision-tapestry agent status
  
🔄 When all agents complete:
  • Run: decision-tapestry agent launch commit
  • This will coordinate all commits
`);
        
    } catch (error) {
        console.error(`❌ Failed to launch agents: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Show agent help
 */
export async function showAgentHelp() {
    console.log(`
🤖 Decision Tapestry Agent Commands

Usage: decision-tapestry agent <command> [options]

Commands:
  start <decision-id> [agent-id]    Start an agent for a specific decision
  status [agent-id]                 Show agent status (all agents if no ID provided)
  coordinate <decision-id1> ...     Coordinate multiple agents for related decisions
  launch                            Launch multiple agents in separate terminals
  task <description>                Execute a specific task description
  monitor                           Monitor all agents in real-time
  test [type|agent-id]             Run agent tests (all, integration, schema, or specific agent)
  help                             Show this help message

Examples:
  decision-tapestry agent start 65                    # Start agent for decision 65
  decision-tapestry agent start 65 Agent-A           # Start Agent-A for decision 65
  decision-tapestry agent status                      # Show all active agents
  decision-tapestry agent status Agent-A             # Show Agent-A status
  decision-tapestry agent coordinate 65 66 67 68     # Coordinate agents for decisions 65-68
  decision-tapestry agent launch                      # Launch pre-configured agents in terminals
  decision-tapestry agent task "Fix search panel"     # Execute specific task
  decision-tapestry agent test all                    # Run all agent tests
  decision-tapestry agent test Agent-A               # Run tests for Agent-A

Real-time Updates:
  • Agent activities are displayed in the dashboard when running 'decision-tapestry start'
  • Agent status updates are broadcast automatically via WebSocket
  • All agent work is validated against decisions.schema.json
  • Tests are automatically generated and run for each agent

For more information, see: https://github.com/your-org/decision-tapestry
`);
}

/**
 * Get status of specific agent
 */
async function getAgentStatus(agentId) {
    // This would typically connect to the agent via WebSocket or check persistent storage
    // For now, we'll check if agent is running and return basic status
    
    return {
        agentId: agentId,
        status: 'unknown',
        message: 'Agent status checking not yet implemented',
        timestamp: new Date().toISOString()
    };
}

/**
 * Get status of all agents
 */
async function getAllAgentStatus() {
    // This would typically query the agent coordinator or WebSocket connections
    // For now, return empty array
    
    return [];
}

/**
 * Display agent status
 */
function displayAgentStatus(status) {
    console.log(`
🤖 Agent Status: ${status.agentId}
${'─'.repeat(40)}
Status: ${status.status}
Message: ${status.message}
Last Update: ${new Date(status.timestamp).toLocaleString()}
`);
    
    if (status.currentTask) {
        console.log(`Current Task: ${status.currentTask}`);
    }
    
    if (status.decisionId) {
        console.log(`Decision: #${status.decisionId}`);
    }
    
    if (status.completedTasks !== undefined) {
        console.log(`Progress: ${status.completedTasks}/${status.totalTasks} tasks`);
    }
    
    if (status.errors && status.errors.length > 0) {
        console.log(`\\nErrors: ${status.errors.length}`);
        status.errors.forEach(error => console.log(`  - ${error}`));
    }
}

/**
 * Display all agents status
 */
function displayAllAgentsStatus(agents) {
    if (agents.length === 0) {
        console.log('📭 No active agents found');
        console.log('Run "decision-tapestry agent start <decision-id>" to start an agent');
        return;
    }
    
    console.log(`
🤖 Active Agents (${agents.length})
${'─'.repeat(40)}`);
    
    agents.forEach(agent => {
        const status = agent.status || 'unknown';
        const task = agent.currentTask ? ` - ${agent.currentTask}` : '';
        const decision = agent.decisionId ? ` (Decision #${agent.decisionId})` : '';
        
        console.log(`  ${agent.agentId}: ${status}${task}${decision}`);
    });
    
    console.log('\\nUse "decision-tapestry agent status <agent-id>" for detailed status');
}

/**
 * Run all agent tests
 */
async function runAllAgentTests() {
    console.log('🧪 Running all agent tests...');
    
    // Find all agent test files
    const testDir = path.resolve(__dirname, '../__tests__/agents');
    
    try {
        const files = await fs.readdir(testDir);
        const testFiles = files.filter(f => f.startsWith('agent-') && f.endsWith('.test.ts'));
        
        if (testFiles.length === 0) {
            console.log('📭 No agent tests found');
            return;
        }
        
        console.log(`Found ${testFiles.length} agent test files`);
        
        // Run each test file
        for (const testFile of testFiles) {
            console.log(`\\n🧪 Running ${testFile}...`);
            await runTestFile(path.join(testDir, testFile));
        }
        
        console.log('\\n✅ All agent tests completed');
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('📭 No agent tests found (test directory does not exist)');
        } else {
            throw error;
        }
    }
}

/**
 * Run integration tests
 */
async function runIntegrationTests() {
    console.log('🧪 Running integration tests...');
    
    const testDir = path.resolve(__dirname, '../__tests__/agents');
    const integrationTestFile = path.join(testDir, 'agent-integration.test.ts');
    
    try {
        await fs.access(integrationTestFile);
        await runTestFile(integrationTestFile);
        console.log('✅ Integration tests completed');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('📭 No integration tests found');
        } else {
            throw error;
        }
    }
}

/**
 * Run schema tests
 */
async function runSchemaTests() {
    console.log('🧪 Running schema validation tests...');
    
    try {
        // Load decisions.yml
        const decisionsPath = path.resolve('decisions.yml');
        const decisionsContent = await fs.readFile(decisionsPath, 'utf8');
        const decisionsData = yaml.load(decisionsContent);
        
        // Load schema
        const schemaPath = path.resolve(__dirname, '../decisions.schema.json');
        const schemaContent = await fs.readFile(schemaPath, 'utf8');
        const schema = JSON.parse(schemaContent);
        
        // Validate
        const Ajv = (await import('ajv')).default;
        const ajv = new Ajv({ allErrors: true, strict: false });
        const validate = ajv.compile(schema);
        const valid = validate(decisionsData);
        
        if (valid) {
            console.log('✅ Schema validation passed');
        } else {
            console.log('❌ Schema validation failed:');
            validate.errors.forEach(error => {
                console.log(`  - ${error.instancePath}: ${error.message}`);
            });
            throw new Error('Schema validation failed');
        }
        
    } catch (error) {
        throw new Error(`Schema validation failed: ${error.message}`);
    }
}

/**
 * Run tests for specific agent
 */
async function runSpecificAgentTests(agentId) {
    console.log(`🧪 Running tests for ${agentId}...`);
    
    const testDir = path.resolve(__dirname, '../__tests__/agents');
    const testFile = path.join(testDir, `agent-${agentId}.test.ts`);
    
    try {
        await fs.access(testFile);
        await runTestFile(testFile);
        console.log(`✅ ${agentId} tests completed`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`📭 No tests found for ${agentId}`);
        } else {
            throw error;
        }
    }
}

/**
 * Run a specific test file
 */
async function runTestFile(testFile) {
    return new Promise((resolve, reject) => {
        import('child_process').then(({ spawn }) => {
        
        const jest = spawn('npm', ['test', '--', testFile], {
            cwd: path.resolve(__dirname, '..'),
            stdio: 'inherit'
        });
        
        jest.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Test failed with exit code ${code}`));
            }
        });
        
        jest.on('error', (error) => {
            reject(error);
        });
        });
    });
}