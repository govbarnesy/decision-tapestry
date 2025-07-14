import express from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import http from 'http';
import yaml from 'js-yaml';
import path from 'path';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { readDecisionsFile, writeDecisionsFile } from '../shared/yaml-utils.js';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

const port = process.env.PORT || 8080;
// Use the mounted volume if it exists (in Docker), otherwise use the current working directory.
const userDataPath = '/app/user_data';
const CWD = fs.existsSync(userDataPath) ? userDataPath : process.cwd();

// Serve the static frontend from the dashboard directory
app.use(express.static(path.join(__dirname, '../dashboard')));
app.use(express.json());

// Serve CSS files with the correct MIME type
app.get('/*.css', (req, res) => {
  res.type('text/css');
  res.sendFile(path.join(__dirname, '../dashboard', req.originalUrl));
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard', 'index.html'));
});

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

function broadcast(data) {
  console.log('Broadcasting to clients:', data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // WebSocket.OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// Activity state tracking for real-time development visualization
const activeAgents = new Map();
const activityHistory = [];
const activityStates = ['idle', 'working', 'debugging', 'testing', 'reviewing'];
const MAX_HISTORY_ENTRIES = 1000;

function broadcastActivity(agentId, activity) {
  const activityData = {
    type: 'activity',
    agentId,
    activity,
    timestamp: new Date().toISOString(),
    decisionId: activity.decisionId || null
  };
  
  // Persist activity to history
  persistActivity(agentId, activity);
  
  console.log(`[Agent-1] Broadcasting activity: ${agentId} is ${activity.state}`);
  broadcast(activityData);
}

function persistActivity(agentId, activity) {
  const historyEntry = {
    id: `${agentId}-${Date.now()}`,
    agentId,
    state: activity.state,
    decisionId: activity.decisionId,
    taskDescription: activity.taskDescription,
    timestamp: new Date().toISOString()
  };
  
  activityHistory.push(historyEntry);
  
  // Maintain history size limit
  if (activityHistory.length > MAX_HISTORY_ENTRIES) {
    activityHistory.shift();
  }
  
  console.log(`[Agent-1] Persisted activity: ${agentId} -> ${activity.state} (history: ${activityHistory.length} entries)`);
}

async function getData() {
  const decisionsPath = path.join(CWD, 'decisions.yml');
  return await readDecisionsFile(decisionsPath);
}

async function updateData(newData) {
  const decisionsPath = path.join(CWD, 'decisions.yml');
  await writeDecisionsFile(decisionsPath, newData);
}

// Endpoint for the CLI to trigger a UI update - DEPRECATED
// app.post('/api/notify-update', (req, res) => {
//     const { decisionId } = req.body;
//     if (!decisionId) {
//         return res.status(400).send({ message: 'decisionId is required' });
//     }
//     console.log(`Notifying clients to refresh for decision: ${decisionId}`);
//     broadcast({ type: 'update', decisionId });
//     res.status(200).send({ message: 'Notification sent' });
// });

app.get('/api/data', async (req, res) => {
  try {
    const data = await getData();
    const backlog = data.backlog || [];
    const decisions = data.decisions || [];

    // This is a simplified way to extract the charter data
    const charter = {
      states: [
        { id: 'Huddle', label: "1. Frame the 'Why'" },
        { id: 'Whiteboard', label: "2. Design the 'What'" },
        { id: 'Build', label: '3. Build & Iterate' },
        { id: 'Validate', label: '4. Validate & Refine' }
      ],
      transitions: [
        { from: 'Huddle', to: 'Whiteboard' },
        { from: 'Whiteboard', to: 'Build' },
        { from: 'Build', to: 'Validate' },
        { from: 'Validate', to: 'Huddle' },
        { from: 'Validate', to: 'Whiteboard' }
      ]
    };

    res.json({ decisions, backlog, charter });
  } catch (error) {
    console.error('Error fetching API data:', error);
    
    // Send more specific error messages to the client
    if (error.message.includes('Could not find decisions.yml')) {
      res.status(404).json({ 
        error: 'decisions.yml not found',
        message: error.message,
        suggestion: 'Run "decision-tapestry init" to create a new decisions.yml file'
      });
    } else if (error.message.includes('Invalid YAML syntax')) {
      res.status(400).json({ 
        error: 'Invalid YAML format',
        message: error.message,
        suggestion: 'Check the YAML syntax in your decisions.yml file'
      });
    } else if (error.message.includes('must be an array')) {
      res.status(400).json({ 
        error: 'Invalid file structure',
        message: error.message,
        suggestion: 'Ensure decisions and backlog are arrays in your YAML file'
      });
    } else {
      res.status(500).json({ 
        error: 'Server error',
        message: 'An unexpected error occurred while loading your decisions',
        suggestion: 'Check the server logs for more details'
      });
    }
  }
});

app.post('/api/decisions/promote', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).send({ message: 'Backlog item ID is required' });
    }

    const data = await getData();
    const backlogItemIndex = data.backlog.findIndex((item) => item.id === id);

    if (backlogItemIndex === -1) {
      return res.status(404).send({ message: 'Backlog item not found' });
    }

    const [backlogItem] = data.backlog.splice(backlogItemIndex, 1);

    const newDecisionId = data.decisions.length > 0 ? Math.max(...data.decisions.map((d) => d.id)) + 1 : 1;

    const newDecision = {
      ...backlogItem,
      id: newDecisionId,
      status: 'Accepted',
      date: new Date().toISOString()
    };

    // Remove backlog-specific fields if they exist
    delete newDecision.goal;
    delete newDecision.implementation;
    delete newDecision.key_features;

    data.decisions.push(newDecision);
    await updateData(data);
    broadcast({ type: 'update' });

    res.status(201).json(newDecision);
  } catch (error) {
    console.error('Error promoting backlog item:', error);
    
    if (error.message.includes('Permission denied')) {
      res.status(403).json({ 
        error: 'Permission denied',
        message: error.message,
        suggestion: 'Check file permissions for decisions.yml'
      });
    } else if (error.message.includes('Directory does not exist')) {
      res.status(400).json({ 
        error: 'Directory error',
        message: error.message,
        suggestion: 'Ensure the directory containing decisions.yml exists'
      });
    } else {
      res.status(500).json({ 
        error: 'Promotion failed',
        message: 'Failed to promote backlog item to decision',
        suggestion: 'Check the server logs for more details'
      });
    }
  }
});

// Activity tracking endpoints - Agent-1 Infrastructure work
app.post('/api/activity', express.json(), (req, res) => {
  const { agentId, state, decisionId, taskDescription } = req.body;
  
  if (!agentId || !state) {
    return res.status(400).json({ error: 'agentId and state are required' });
  }
  
  if (!activityStates.includes(state)) {
    return res.status(400).json({ error: 'Invalid activity state' });
  }
  
  // Update agent activity
  activeAgents.set(agentId, {
    state,
    decisionId,
    taskDescription,
    lastUpdate: new Date().toISOString()
  });
  
  // Broadcast to all connected clients
  broadcastActivity(agentId, { state, decisionId, taskDescription });
  
  console.log(`[Agent-1] Activity update: ${agentId} -> ${state} on decision ${decisionId}`);
  res.status(200).json({ message: 'Activity updated successfully' });
});

app.get('/api/activity', (req, res) => {
  const { includeHistory = false, agentId, limit = 50 } = req.query;
  
  const currentActivities = Array.from(activeAgents.entries()).map(([agentId, activity]) => ({
    agentId,
    ...activity
  }));
  
  const response = { activities: currentActivities };
  
  if (includeHistory === 'true') {
    let history = activityHistory;
    
    // Filter by agent if requested
    if (agentId) {
      history = history.filter(entry => entry.agentId === agentId);
    }
    
    // Apply limit
    const limitNum = parseInt(limit);
    if (limitNum && limitNum > 0) {
      history = history.slice(-limitNum);
    }
    
    response.history = history;
  }
  
  res.json(response);
});

// New endpoint for activity history analytics
app.get('/api/activity/analytics', (req, res) => {
  const { timeRange = '1h' } = req.query;
  
  // Calculate time cutoff
  const now = new Date();
  let cutoffTime;
  switch (timeRange) {
    case '15m': cutoffTime = new Date(now - 15 * 60 * 1000); break;
    case '1h': cutoffTime = new Date(now - 60 * 60 * 1000); break;
    case '6h': cutoffTime = new Date(now - 6 * 60 * 60 * 1000); break;
    case '24h': cutoffTime = new Date(now - 24 * 60 * 60 * 1000); break;
    default: cutoffTime = new Date(now - 60 * 60 * 1000);
  }
  
  // Filter activity history by time range
  const recentActivity = activityHistory.filter(entry => 
    new Date(entry.timestamp) >= cutoffTime
  );
  
  // Calculate analytics
  const agentActivityCounts = {};
  const stateDistribution = {};
  const decisionActivityCounts = {};
  
  recentActivity.forEach(entry => {
    // Agent activity counts
    agentActivityCounts[entry.agentId] = (agentActivityCounts[entry.agentId] || 0) + 1;
    
    // State distribution
    stateDistribution[entry.state] = (stateDistribution[entry.state] || 0) + 1;
    
    // Decision activity counts
    if (entry.decisionId) {
      decisionActivityCounts[entry.decisionId] = (decisionActivityCounts[entry.decisionId] || 0) + 1;
    }
  });
  
  res.json({
    timeRange,
    totalActivities: recentActivity.length,
    agentActivityCounts,
    stateDistribution,
    decisionActivityCounts,
    mostActiveAgent: Object.keys(agentActivityCounts).reduce((a, b) => 
      agentActivityCounts[a] > agentActivityCounts[b] ? a : b, null),
    mostActiveDecision: Object.keys(decisionActivityCounts).reduce((a, b) => 
      decisionActivityCounts[a] > decisionActivityCounts[b] ? a : b, null)
  });
});

// Manual refresh endpoint for backup
app.post('/api/refresh', (req, res) => {
  console.log('[Manual] Forcing dashboard refresh via API call');
  broadcast({ type: 'update' });
  res.json({ message: 'Refresh broadcast sent to all clients' });
});

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Check if decisions.yml exists and is readable
  const decisionsPath = path.join(CWD, 'decisions.yml');
  try {
    await getData();
    health.checks.decisionsFile = { 
      status: 'ok', 
      message: 'decisions.yml found and readable',
      path: decisionsPath 
    };
  } catch (error) {
    health.status = 'error';
    health.checks.decisionsFile = { 
      status: 'error', 
      message: error.message,
      path: decisionsPath 
    };
  }

  // Check working directory
  try {
    await fsp.access(CWD);
    health.checks.workingDirectory = { 
      status: 'ok', 
      message: 'Working directory accessible',
      path: CWD 
    };
  } catch (error) {
    health.status = 'error';
    health.checks.workingDirectory = { 
      status: 'error', 
      message: 'Working directory not accessible',
      path: CWD 
    };
  }

  res.json(health);
});

// --- File Watcher for Real-Time Updates ---
const decisionsPath = path.join(CWD, 'decisions.yml');
let debounceTimer = null;

// Use chokidar for more reliable file watching
const watcher = chokidar.watch(decisionsPath, {
  persistent: true,
  usePolling: false,
  interval: 100,
  binaryInterval: 300,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 100,
    pollInterval: 50
  }
});

watcher
  .on('change', (path, stats) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`[Chokidar] Detected change in decisions.yml, broadcasting update.`);
      broadcast({ type: 'update' });
    }, 150);
  })
  .on('error', error => {
    console.error(`[Chokidar] Watcher error:`, error);
    // Fallback to polling if watching fails
    console.log(`[Chokidar] Falling back to polling mode...`);
    watcher.close();
    startPollingFallback();
  })
  .on('ready', () => {
    console.log(`[Chokidar] Watching for changes in: ${decisionsPath}`);
  });

// Polling fallback for extreme cases
function startPollingFallback() {
  let lastModified = null;
  
  const pollFile = async () => {
    try {
      const stats = await fsp.stat(decisionsPath);
      const currentModified = stats.mtime.getTime();
      
      if (lastModified !== null && currentModified !== lastModified) {
        console.log(`[Polling] Detected change in decisions.yml, broadcasting update.`);
        broadcast({ type: 'update' });
      }
      
      lastModified = currentModified;
    } catch (error) {
      console.error(`[Polling] Error checking file:`, error);
    }
  };
  
  // Poll every 1 second as fallback
  setInterval(pollFile, 1000);
  console.log(`[Polling] Started polling fallback for: ${decisionsPath}`);
}

server.listen(port, () => {
  console.log(`Decision Tapestry server listening at http://localhost:${port}`);
  console.log(`Watching for changes in: ${CWD}`);
});

const gracefulShutdown = () => {
  console.log('Attempting graceful shutdown...');
  
  // Close file watcher
  if (watcher) {
    watcher.close();
    console.log('File watcher closed.');
  }
  
  server.close(() => {
    console.log('Server successfully closed.');
    process.exit(0);
  });

  // Force close after 5 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
};

// Listen for nodemon's restart signal
process.once('SIGUSR2', gracefulShutdown);

// Listen for standard interrupt signal
process.on('SIGINT', gracefulShutdown);

// Listen for standard termination signal
process.on('SIGTERM', gracefulShutdown);
