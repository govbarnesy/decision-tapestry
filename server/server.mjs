import express from "express";
import fs from "fs";
import fsp from "fs/promises";
import http from "http";
import path from "path";
import chokidar from "chokidar";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import { readDecisionsFile, writeDecisionsFile } from "../shared/yaml-utils.js";
import { initializeGeminiRoutes } from "./gemini-api.mjs";
import { galleryRouter } from "./gallery-server.mjs";

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

const port = process.env.PORT || 8080;
// Use the mounted volume if it exists (in Docker), otherwise use the current working directory.
const userDataPath = "/app/user_data";
const CWD = fs.existsSync(userDataPath) ? userDataPath : process.cwd();

// Serve the static frontend from the dashboard directory
app.use(express.static(path.join(__dirname, "../dashboard")));
// Serve utils directory
app.use("/utils", express.static(path.join(__dirname, "../utils")));
// Serve styles directory
app.use("/styles", express.static(path.join(__dirname, "../styles")));
app.use(express.json());

// Initialize Gemini API routes
initializeGeminiRoutes(app);

// Gallery routes
app.use(galleryRouter);

// Serve CSS files with the correct MIME type
app.get("/*.css", (req, res) => {
  res.type("text/css");
  res.sendFile(path.join(__dirname, "../dashboard", req.originalUrl));
});

// Serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../dashboard", "index.html"));
});

// Track connected clients and agents
const connectedClients = new Set();
const connectedAgents = new Map();

// Track DOM editor connections and state
const domEditorConnections = new Map();
const domEditorState = {
  sessions: new Map(), // sessionId -> { url, selectedElement, changes }
  recentChanges: []    // Recent DOM changes for context
};

wss.on("connection", (ws) => {
  console.log("Client connected");
  connectedClients.add(ws);

  // Send initial agent status to new client
  const agentStatuses = Array.from(connectedAgents.values());
  if (agentStatuses.length > 0) {
    ws.send(
      JSON.stringify({
        type: "agent_status_list",
        agents: agentStatuses,
      }),
    );
  }

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(ws, data);
    } catch (error) {
      console.error("Invalid WebSocket message:", error.message);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    connectedClients.delete(ws);

    // Remove agent if it was an agent connection
    for (const [agentId, agentData] of connectedAgents) {
      if (agentData.ws === ws) {
        connectedAgents.delete(agentId);
        console.log(`Agent ${agentId} disconnected`);

        // Broadcast agent disconnection
        broadcast({
          type: "agent_disconnected",
          agentId: agentId,
          timestamp: new Date().toISOString(),
        });
        break;
      }
    }

    // Remove DOM editor connection if it was a DOM editor connection
    for (const [sessionId, sessionData] of domEditorConnections) {
      if (sessionData.ws === ws) {
        domEditorConnections.delete(sessionId);
        domEditorState.sessions.delete(sessionId);
        console.log(`DOM Editor session ${sessionId} disconnected`);

        // Broadcast DOM editor disconnection
        broadcast({
          type: "dom_editor_disconnected",
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
        });
        break;
      }
    }
  });
});

/**
 * Handle WebSocket messages from agents and clients
 */
function handleWebSocketMessage(ws, data) {
  const { type } = data;

  switch (type) {
    case "agent_register":
      handleAgentRegistration(ws, data);
      break;

    case "agent_status":
      handleAgentStatus(ws, data);
      break;

    case "agent_heartbeat":
      handleAgentHeartbeat(ws, data);
      break;

    case "task_completion":
      handleTaskCompletion(ws, data);
      break;

    case "decision_update":
      handleDecisionUpdate(ws, data);
      break;

    case "agent_error":
      handleAgentError(ws, data);
      break;

    case "get_agent_status":
      handleGetAgentStatus(ws, data);
      break;

    case "dom_editor_connect":
      handleDOMEditorConnect(ws, data);
      break;

    case "element_selected":
      handleElementSelected(ws, data);
      break;

    case "styles_updated":
      handleStylesUpdated(ws, data);
      break;

    case "element_removed":
      handleElementRemoved(ws, data);
      break;

    case "changes_reset":
      handleChangesReset(ws, data);
      break;

    case "page_snapshot":
      handlePageSnapshot(ws, data);
      break;

    case "dom_changes_detected":
      handleDOMChanges(ws, data);
      break;

    case "request_code_removal":
      handleCodeRemovalRequest(ws, data);
      break;

    case "integration_connect":
      handleIntegrationConnect(ws, data);
      break;

    case "code_removal_complete":
      handleCodeRemovalComplete(ws, data);
      break;

    default:
      console.warn(`Unknown message type: ${type}`);
  }
}

/**
 * Handle agent registration
 */
function handleAgentRegistration(ws, data) {
  const { agentId, decisionId } = data;

  // Store agent connection
  connectedAgents.set(agentId, {
    ws: ws,
    agentId: agentId,
    decisionId: decisionId,
    status: "initializing",
    registeredAt: new Date().toISOString(),
    lastHeartbeat: new Date().toISOString(),
  });

  if (decisionId) {
    console.log(`Agent ${agentId} registered for decision ${decisionId}`);
  } else {
    console.log(`${agentId} registered (coordinator mode)`);
  }

  // Broadcast agent registration to all clients
  broadcast({
    type: "agent_register",
    agentId: agentId,
    decisionId: decisionId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle agent status updates
 */
function handleAgentStatus(ws, data) {
  const { agentId } = data;

  if (connectedAgents.has(agentId)) {
    const agentData = connectedAgents.get(agentId);

    // Update agent status
    connectedAgents.set(agentId, {
      ...agentData,
      status: data.status,
      message: data.message,
      currentTask: data.currentTask,
      lastUpdate: new Date().toISOString(),
    });

    // Broadcast status update to all clients
    broadcast({
      type: "agent_status",
      ...data,
    });
  }
}

/**
 * Handle agent heartbeat
 */
function handleAgentHeartbeat(ws, data) {
  const { agentId } = data;

  if (connectedAgents.has(agentId)) {
    const agentData = connectedAgents.get(agentId);

    // Update last heartbeat
    connectedAgents.set(agentId, {
      ...agentData,
      lastHeartbeat: new Date().toISOString(),
    });
  }
}

/**
 * Handle task completion
 */
function handleTaskCompletion(ws, data) {
  const { agentId, taskDescription, decisionId } = data;

  console.log(`Agent ${agentId} completed task: ${taskDescription}`);

  // Broadcast task completion
  broadcast({
    type: "task_completion",
    agentId: agentId,
    taskDescription: taskDescription,
    decisionId: decisionId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle decision update
 */
function handleDecisionUpdate(ws, data) {
  const { agentId, decisionId, message } = data;

  console.log(`Agent ${agentId} updated decision ${decisionId}: ${message}`);

  // Broadcast decision update
  broadcast({
    type: "decision_update",
    agentId: agentId,
    decisionId: decisionId,
    message: message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle agent error
 */
function handleAgentError(ws, data) {
  const { agentId, decisionId, message } = data;

  console.error(`Agent ${agentId} error: ${message}`);

  // Update agent status
  if (connectedAgents.has(agentId)) {
    const agentData = connectedAgents.get(agentId);
    connectedAgents.set(agentId, {
      ...agentData,
      status: "error",
      lastError: message,
      lastUpdate: new Date().toISOString(),
    });
  }

  // Broadcast error
  broadcast({
    type: "agent_error",
    agentId: agentId,
    decisionId: decisionId,
    message: message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle get agent status request
 */
function handleGetAgentStatus(ws, data) {
  const { agentId } = data;

  if (agentId) {
    // Send specific agent status
    const agentData = connectedAgents.get(agentId);
    ws.send(
      JSON.stringify({
        type: "agent_status_response",
        agentId: agentId,
        status: agentData || null,
      }),
    );
  } else {
    // Send all agent statuses
    const allAgents = Array.from(connectedAgents.values());
    ws.send(
      JSON.stringify({
        type: "agent_status_list",
        agents: allAgents,
      }),
    );
  }
}

function broadcast(data) {
  console.log("Broadcasting to clients:", data);
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
const activityStates = ["idle", "working", "debugging", "testing", "reviewing"];
const MAX_HISTORY_ENTRIES = 1000;

// Console stream storage for debugging
const consoleStreamHistory = [];
const MAX_CONSOLE_ENTRIES = 500;

function broadcastActivity(agentId, activity) {
  const activityData = {
    type: "activity",
    agentId,
    activity,
    timestamp: new Date().toISOString(),
    decisionId: activity.decisionId || null,
  };

  // Persist activity to history
  persistActivity(agentId, activity);

  console.log(
    `[Agent-1] Broadcasting activity: ${agentId} is ${activity.state}`,
  );
  broadcast(activityData);
}

function persistActivity(agentId, activity) {
  const historyEntry = {
    id: `${agentId}-${Date.now()}`,
    agentId,
    state: activity.state,
    decisionId: activity.decisionId,
    taskDescription: activity.taskDescription,
    timestamp: new Date().toISOString(),
  };

  activityHistory.push(historyEntry);

  // Maintain history size limit
  if (activityHistory.length > MAX_HISTORY_ENTRIES) {
    activityHistory.shift();
  }

  console.log(
    `[Agent-1] Persisted activity: ${agentId} -> ${activity.state} (history: ${activityHistory.length} entries)`,
  );
}

async function getData() {
  const decisionsPath = path.join(CWD, "decisions.yml");
  return await readDecisionsFile(decisionsPath);
}

async function updateData(newData) {
  const decisionsPath = path.join(CWD, "decisions.yml");
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

app.get("/api/data", async (req, res) => {
  try {
    const data = await getData();
    const backlog = data.backlog || [];
    const decisions = data.decisions || [];

    // This is a simplified way to extract the charter data
    const charter = {
      states: [
        { id: "Huddle", label: "1. Frame the 'Why'" },
        { id: "Whiteboard", label: "2. Design the 'What'" },
        { id: "Build", label: "3. Build & Iterate" },
        { id: "Validate", label: "4. Validate & Refine" },
      ],
      transitions: [
        { from: "Huddle", to: "Whiteboard" },
        { from: "Whiteboard", to: "Build" },
        { from: "Build", to: "Validate" },
        { from: "Validate", to: "Huddle" },
        { from: "Validate", to: "Whiteboard" },
      ],
    };

    res.json({ decisions, backlog, charter });
  } catch (error) {
    console.error("Error fetching API data:", error);

    // Send more specific error messages to the client
    if (error.message.includes("Could not find decisions.yml")) {
      res.status(404).json({
        error: "decisions.yml not found",
        message: error.message,
        suggestion:
          'Run "decision-tapestry init" to create a new decisions.yml file',
      });
    } else if (error.message.includes("Invalid YAML syntax")) {
      res.status(400).json({
        error: "Invalid YAML format",
        message: error.message,
        suggestion: "Check the YAML syntax in your decisions.yml file",
      });
    } else if (error.message.includes("must be an array")) {
      res.status(400).json({
        error: "Invalid file structure",
        message: error.message,
        suggestion: "Ensure decisions and backlog are arrays in your YAML file",
      });
    } else {
      res.status(500).json({
        error: "Server error",
        message: "An unexpected error occurred while loading your decisions",
        suggestion: "Check the server logs for more details",
      });
    }
  }
});

app.post("/api/decisions/promote", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).send({ message: "Backlog item ID is required" });
    }

    const data = await getData();
    const backlogItemIndex = data.backlog.findIndex((item) => item.id === id);

    if (backlogItemIndex === -1) {
      return res.status(404).send({ message: "Backlog item not found" });
    }

    const [backlogItem] = data.backlog.splice(backlogItemIndex, 1);

    const newDecisionId =
      data.decisions.length > 0
        ? Math.max(...data.decisions.map((d) => d.id)) + 1
        : 1;

    const newDecision = {
      ...backlogItem,
      id: newDecisionId,
      status: "Accepted",
      date: new Date().toISOString(),
    };

    // Remove backlog-specific fields if they exist
    delete newDecision.goal;
    delete newDecision.implementation;
    delete newDecision.key_features;

    data.decisions.push(newDecision);
    await updateData(data);
    broadcast({ type: "update" });

    res.status(201).json(newDecision);
  } catch (error) {
    console.error("Error promoting backlog item:", error);

    if (error.message.includes("Permission denied")) {
      res.status(403).json({
        error: "Permission denied",
        message: error.message,
        suggestion: "Check file permissions for decisions.yml",
      });
    } else if (error.message.includes("Directory does not exist")) {
      res.status(400).json({
        error: "Directory error",
        message: error.message,
        suggestion: "Ensure the directory containing decisions.yml exists",
      });
    } else {
      res.status(500).json({
        error: "Promotion failed",
        message: "Failed to promote backlog item to decision",
        suggestion: "Check the server logs for more details",
      });
    }
  }
});

// Activity tracking endpoints - Agent-1 Infrastructure work
app.post("/api/activity", express.json(), (req, res) => {
  const { agentId, state, decisionId, taskDescription } = req.body;

  if (!agentId || !state) {
    return res.status(400).json({ error: "agentId and state are required" });
  }

  if (!activityStates.includes(state)) {
    return res.status(400).json({ error: "Invalid activity state" });
  }

  // Update agent activity
  activeAgents.set(agentId, {
    state,
    decisionId,
    taskDescription,
    lastUpdate: new Date().toISOString(),
  });

  // Broadcast to all connected clients
  broadcastActivity(agentId, { state, decisionId, taskDescription });

  console.log(
    `[Agent-1] Activity update: ${agentId} -> ${state} on decision ${decisionId}`,
  );
  res.status(200).json({ message: "Activity updated successfully" });
});

app.get("/api/activity", (req, res) => {
  const { includeHistory = false, agentId, limit = 50 } = req.query;

  const currentActivities = Array.from(activeAgents.entries()).map(
    ([agentId, activity]) => ({
      agentId,
      ...activity,
    }),
  );

  const response = { activities: currentActivities };

  if (includeHistory === "true") {
    let history = activityHistory;

    // Filter by agent if requested
    if (agentId) {
      history = history.filter((entry) => entry.agentId === agentId);
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

// AI Canvas endpoint for visual communication
app.post("/api/canvas/show", express.json(), (req, res) => {
  const { type, content, options = {} } = req.body;

  if (!type || !content) {
    return res.status(400).json({ error: "type and content are required" });
  }

  // Broadcast canvas update to all connected clients
  const canvasData = {
    type: "canvas-update",
    data: { type, content, options },
    timestamp: new Date().toISOString(),
  };

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(canvasData));
    }
  });

  console.log(`[AI Canvas] New content: ${type}`);
  res.status(200).json({ message: "Canvas updated successfully" });
});

// AI Canvas save endpoint
app.post("/api/canvas/save", express.json({ limit: '10mb' }), async (req, res) => {
  const { html, type, isPublic = false } = req.body;
  
  if (!html) {
    return res.status(400).json({ error: "html content is required" });
  }
  
  try {
    // Determine folder based on privacy setting
    const folder = isPublic ? 'ai-canvas-gallery/public' : 'ai-canvas-gallery/private';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `canvas-${type || 'visual'}-${timestamp}.html`;
    const filepath = path.join(CWD, folder, filename);
    
    // Ensure directory exists
    await fsp.mkdir(path.join(CWD, folder), { recursive: true });
    
    // Save the file
    await fsp.writeFile(filepath, html, 'utf8');
    
    console.log(`[AI Canvas] Saved ${isPublic ? 'public' : 'private'} visual: ${filename}`);
    res.status(200).json({ 
      message: "Visual saved successfully",
      filename,
      isPublic,
      path: `${folder}/${filename}`
    });
  } catch (error) {
    console.error('[AI Canvas] Save error:', error.message, error.stack);
    res.status(500).json({ 
      error: "Failed to save visual",
      details: error.message 
    });
  }
});

// Gallery Sets API endpoints
app.get("/api/gallery/sets", async (req, res) => {
  try {
    const setsFile = path.join(CWD, 'settings', 'gallery-sets.json');
    const setsData = await fsp.readFile(setsFile, 'utf8').catch(() => '[]');
    const sets = JSON.parse(setsData);
    res.json(sets);
  } catch (error) {
    console.error('[Gallery] Error loading sets:', error);
    res.status(500).json({ error: 'Failed to load gallery sets' });
  }
});

app.post("/api/gallery/sets", express.json(), async (req, res) => {
  try {
    const { name, icon, description, slideIds = [] } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Set name is required' });
    }
    
    const setsFile = path.join(CWD, 'settings', 'gallery-sets.json');
    const setsData = await fsp.readFile(setsFile, 'utf8').catch(() => '[]');
    const sets = JSON.parse(setsData);
    
    const newSet = {
      id: Date.now().toString(),
      name,
      icon: icon || '📊',
      description: description || '',
      slideIds,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    sets.push(newSet);
    await fsp.writeFile(setsFile, JSON.stringify(sets, null, 2));
    
    console.log(`[Gallery] Created new set: ${name}`);
    res.json(newSet);
  } catch (error) {
    console.error('[Gallery] Error creating set:', error);
    res.status(500).json({ error: 'Failed to create gallery set' });
  }
});

// Add slide to gallery set
app.post("/api/gallery/sets/:setId/slides", express.json(), async (req, res) => {
  try {
    const { setId } = req.params;
    const { slideId } = req.body;
    
    if (!slideId) {
      return res.status(400).json({ error: 'slideId is required' });
    }
    
    const setsFile = path.join(CWD, 'settings', 'gallery-sets.json');
    const setsData = await fsp.readFile(setsFile, 'utf8').catch(() => '[]');
    const sets = JSON.parse(setsData);
    
    const set = sets.find(s => s.id === setId);
    if (!set) {
      return res.status(404).json({ error: 'Gallery set not found' });
    }
    
    // Add slide if not already present
    if (!set.slideIds.includes(slideId)) {
      set.slideIds.push(slideId);
      set.lastModified = new Date().toISOString();
      
      await fsp.writeFile(setsFile, JSON.stringify(sets, null, 2));
      console.log(`[Gallery] Added slide ${slideId} to set ${set.name}`);
    }
    
    res.json({ message: 'Slide added to set', set });
  } catch (error) {
    console.error('[Gallery] Error adding slide to set:', error);
    res.status(500).json({ error: 'Failed to add slide to set' });
  }
});

// Delete gallery set
app.delete("/api/gallery/sets/:setId", async (req, res) => {
  try {
    const { setId } = req.params;
    
    const setsFile = path.join(CWD, 'settings', 'gallery-sets.json');
    const setsData = await fsp.readFile(setsFile, 'utf8').catch(() => '[]');
    const sets = JSON.parse(setsData);
    
    const setIndex = sets.findIndex(s => s.id === setId);
    if (setIndex === -1) {
      return res.status(404).json({ error: 'Gallery set not found' });
    }
    
    const deletedSet = sets[setIndex];
    sets.splice(setIndex, 1);
    
    await fsp.writeFile(setsFile, JSON.stringify(sets, null, 2));
    console.log(`[Gallery] Deleted set: ${deletedSet.name}`);
    
    res.json({ message: 'Gallery set deleted successfully', deletedSet });
  } catch (error) {
    console.error('[Gallery] Error deleting set:', error);
    res.status(500).json({ error: 'Failed to delete gallery set' });
  }
});

// New endpoint for activity history analytics
app.get("/api/activity/analytics", (req, res) => {
  const { timeRange = "1h" } = req.query;

  // Calculate time cutoff
  const now = new Date();
  let cutoffTime;
  switch (timeRange) {
    case "15m":
      cutoffTime = new Date(now - 15 * 60 * 1000);
      break;
    case "1h":
      cutoffTime = new Date(now - 60 * 60 * 1000);
      break;
    case "6h":
      cutoffTime = new Date(now - 6 * 60 * 60 * 1000);
      break;
    case "24h":
      cutoffTime = new Date(now - 24 * 60 * 60 * 1000);
      break;
    default:
      cutoffTime = new Date(now - 60 * 60 * 1000);
  }

  // Filter activity history by time range
  const recentActivity = activityHistory.filter(
    (entry) => new Date(entry.timestamp) >= cutoffTime,
  );

  // Calculate analytics
  const agentActivityCounts = {};
  const stateDistribution = {};
  const decisionActivityCounts = {};

  recentActivity.forEach((entry) => {
    // Agent activity counts
    agentActivityCounts[entry.agentId] =
      (agentActivityCounts[entry.agentId] || 0) + 1;

    // State distribution
    stateDistribution[entry.state] = (stateDistribution[entry.state] || 0) + 1;

    // Decision activity counts
    if (entry.decisionId) {
      decisionActivityCounts[entry.decisionId] =
        (decisionActivityCounts[entry.decisionId] || 0) + 1;
    }
  });

  res.json({
    timeRange,
    totalActivities: recentActivity.length,
    agentActivityCounts,
    stateDistribution,
    decisionActivityCounts,
    mostActiveAgent: Object.keys(agentActivityCounts).reduce(
      (a, b) => (agentActivityCounts[a] > agentActivityCounts[b] ? a : b),
      null,
    ),
    mostActiveDecision: Object.keys(decisionActivityCounts).reduce(
      (a, b) => (decisionActivityCounts[a] > decisionActivityCounts[b] ? a : b),
      null,
    ),
  });
});

// Clear all agent activities endpoint
app.delete("/api/activity/all", (req, res) => {
  console.log("[Activity] Clearing all agent activities");
  console.log("[Activity] Active agents before clear:", activeAgents.size);

  // Clear server state
  activeAgents.clear();

  console.log("[Activity] Active agents after clear:", activeAgents.size);

  // Broadcast reset event to all clients
  const resetMessage = {
    type: "activity-reset",
    timestamp: new Date().toISOString(),
  };
  console.log("[Activity] Broadcasting reset message:", resetMessage);
  broadcast(resetMessage);

  res.json({
    message: "All agent activities cleared",
    clearedAgents: activeAgents.size,
  });
});

// Manual refresh endpoint for backup
app.post("/api/refresh", (req, res) => {
  console.log("[Manual] Forcing dashboard refresh via API call");
  broadcast({ type: "update" });
  res.json({ message: "Refresh broadcast sent to all clients" });
});

// Health check endpoint
app.get("/api/health", async (_req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Check if decisions.yml exists and is readable
  const decisionsPath = path.join(CWD, "decisions.yml");
  try {
    await getData();
    health.checks.decisionsFile = {
      status: "ok",
      message: "decisions.yml found and readable",
      path: decisionsPath,
    };
  } catch (error) {
    health.status = "error";
    health.checks.decisionsFile = {
      status: "error",
      message: error.message,
      path: decisionsPath,
    };
  }

  // Check working directory
  try {
    await fsp.access(CWD);
    health.checks.workingDirectory = {
      status: "ok",
      message: "Working directory accessible",
      path: CWD,
    };
  } catch (error) {
    health.status = "error";
    health.checks.workingDirectory = {
      status: "error",
      message: "Working directory not accessible",
      path: CWD,
    };
  }

  res.json(health);
});

// --- File Watcher for Real-Time Updates ---
const decisionsPath = path.join(CWD, "decisions.yml");
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
    pollInterval: 50,
  },
});

watcher
  .on("change", () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(
        `[Chokidar] Detected change in decisions.yml, broadcasting update.`,
      );
      broadcast({ type: "update" });
    }, 150);
  })
  .on("error", (error) => {
    console.error(`[Chokidar] Watcher error:`, error);
    // Fallback to polling if watching fails
    console.log(`[Chokidar] Falling back to polling mode...`);
    watcher.close();
    startPollingFallback();
  })
  .on("ready", () => {
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
        console.log(
          `[Polling] Detected change in decisions.yml, broadcasting update.`,
        );
        broadcast({ type: "update" });
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

/**
 * DOM Editor Message Handlers
 */

/**
 * Handle DOM editor connection
 */
function handleDOMEditorConnect(ws, data) {
  const { url } = data;
  const sessionId = `dom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store DOM editor connection
  domEditorConnections.set(sessionId, {
    ws: ws,
    url: url,
    sessionId: sessionId,
    connectedAt: new Date().toISOString()
  });
  
  // Initialize session state
  domEditorState.sessions.set(sessionId, {
    url: url,
    selectedElement: null,
    changes: []
  });
  
  console.log(`DOM Editor connected for ${url} (session: ${sessionId})`);
  
  // Auto-start Claude Code integration if not already running
  startClaudeCodeIntegration();
  
  // Send session info back to client
  ws.send(JSON.stringify({
    type: 'dom_editor_session',
    sessionId: sessionId,
    url: url
  }));
  
  // Broadcast to dashboard
  broadcast({
    type: 'dom_editor_connected',
    sessionId: sessionId,
    url: url,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle element selection
 */
function handleElementSelected(ws, data) {
  const { element, url } = data;
  
  // Find session for this connection
  const session = findSessionByWebSocket(ws);
  if (!session) {
    console.warn('DOM Editor: No session found for element selection');
    return;
  }
  
  // Update session state
  const sessionData = domEditorState.sessions.get(session.sessionId);
  if (sessionData) {
    sessionData.selectedElement = element;
    domEditorState.sessions.set(session.sessionId, sessionData);
  }
  
  console.log(`Element selected: ${element.selector} on ${url}`);
  
  // Add to recent changes for context
  const changeRecord = {
    type: 'element_selected',
    element: element,
    url: url,
    timestamp: new Date().toISOString(),
    sessionId: session.sessionId
  };
  
  domEditorState.recentChanges.push(changeRecord);
  
  // Keep only last 50 changes
  if (domEditorState.recentChanges.length > 50) {
    domEditorState.recentChanges.shift();
  }
  
  // Broadcast to dashboard and other clients
  broadcast({
    type: 'dom_element_selected',
    element: element,
    url: url,
    sessionId: session.sessionId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle style updates
 */
function handleStylesUpdated(ws, data) {
  const { element, styles, url } = data;
  
  const session = findSessionByWebSocket(ws);
  if (!session) {
    console.warn('DOM Editor: No session found for style update');
    return;
  }
  
  // Update session state
  const sessionData = domEditorState.sessions.get(session.sessionId);
  if (sessionData) {
    sessionData.changes.push({
      type: 'styles_updated',
      element: element,
      styles: styles,
      timestamp: new Date().toISOString()
    });
    domEditorState.sessions.set(session.sessionId, sessionData);
  }
  
  console.log(`Styles updated for ${element.selector}: ${JSON.stringify(styles)}`);
  
  // Add to recent changes for context
  const changeRecord = {
    type: 'styles_updated',
    element: element,
    styles: styles,
    url: url,
    timestamp: new Date().toISOString(),
    sessionId: session.sessionId
  };
  
  domEditorState.recentChanges.push(changeRecord);
  
  if (domEditorState.recentChanges.length > 50) {
    domEditorState.recentChanges.shift();
  }
  
  // Broadcast to dashboard
  broadcast({
    type: 'dom_styles_updated',
    element: element,
    styles: styles,
    url: url,
    sessionId: session.sessionId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle element removal
 */
function handleElementRemoved(ws, data) {
  const { element, url } = data;
  
  const session = findSessionByWebSocket(ws);
  if (!session) {
    console.warn('DOM Editor: No session found for element removal');
    return;
  }
  
  // Update session state
  const sessionData = domEditorState.sessions.get(session.sessionId);
  if (sessionData) {
    sessionData.changes.push({
      type: 'element_removed',
      element: element,
      timestamp: new Date().toISOString()
    });
    domEditorState.sessions.set(session.sessionId, sessionData);
  }
  
  console.log(`Element removed: ${element.selector} on ${url}`);
  
  // Add to recent changes for context
  const changeRecord = {
    type: 'element_removed',
    element: element,
    url: url,
    timestamp: new Date().toISOString(),
    sessionId: session.sessionId
  };
  
  domEditorState.recentChanges.push(changeRecord);
  
  if (domEditorState.recentChanges.length > 50) {
    domEditorState.recentChanges.shift();
  }
  
  // Broadcast to dashboard
  broadcast({
    type: 'dom_element_removed',
    element: element,
    url: url,
    sessionId: session.sessionId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle changes reset
 */
function handleChangesReset(ws, data) {
  const { url } = data;
  
  const session = findSessionByWebSocket(ws);
  if (!session) {
    console.warn('DOM Editor: No session found for changes reset');
    return;
  }
  
  // Update session state
  const sessionData = domEditorState.sessions.get(session.sessionId);
  if (sessionData) {
    sessionData.changes = [];
    sessionData.selectedElement = null;
    domEditorState.sessions.set(session.sessionId, sessionData);
  }
  
  console.log(`Changes reset for ${url}`);
  
  // Add to recent changes for context
  const changeRecord = {
    type: 'changes_reset',
    url: url,
    timestamp: new Date().toISOString(),
    sessionId: session.sessionId
  };
  
  domEditorState.recentChanges.push(changeRecord);
  
  if (domEditorState.recentChanges.length > 50) {
    domEditorState.recentChanges.shift();
  }
  
  // Broadcast to dashboard
  broadcast({
    type: 'dom_changes_reset',
    url: url,
    sessionId: session.sessionId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle page snapshot
 */
function handlePageSnapshot(ws, data) {
  const { url, title, styles, elements } = data;
  
  const session = findSessionByWebSocket(ws);
  if (!session) {
    console.warn('DOM Editor: No session found for page snapshot');
    return;
  }
  
  console.log(`Page snapshot received for ${url}`);
  
  // Store comprehensive page state
  const snapshot = {
    type: 'page_snapshot',
    url: url,
    title: title,
    styles: styles,
    elements: elements,
    timestamp: new Date().toISOString(),
    sessionId: session.sessionId
  };
  
  // Add to recent changes for context
  domEditorState.recentChanges.push(snapshot);
  
  if (domEditorState.recentChanges.length > 50) {
    domEditorState.recentChanges.shift();
  }
  
  // Broadcast to dashboard
  broadcast({
    type: 'dom_page_snapshot',
    ...snapshot
  });
}

/**
 * Handle DOM changes detected by the extension
 */
function handleDOMChanges(ws, data) {
  const { changeHistory } = data;
  
  const session = findSessionByWebSocket(ws);
  if (!session) {
    console.warn('DOM Editor: No session found for DOM changes');
    return;
  }
  
  console.log('🔍 DOM Changes Detected:');
  console.log('Session:', session.sessionId);
  console.log('Number of changes:', changeHistory ? changeHistory.length : 0);
  
  if (changeHistory && changeHistory.length > 0) {
    changeHistory.forEach((change, index) => {
      console.log(`  ${index + 1}. ${change.description} (${change.timestamp})`);
      if (change.type === 'element_removed') {
        console.log(`     🗑️  REMOVED: ${change.element || 'unknown element'}`);
      } else if (change.type === 'style_changed') {
        console.log(`     🎨 STYLED: ${change.element || 'unknown element'}`);
      }
    });
    
    // Store the most recent change for easy access
    const latestChange = changeHistory[changeHistory.length - 1];
    if (latestChange.type === 'element_removed') {
      console.log(`\n🎯 MOST RECENT REMOVAL: ${latestChange.element || 'unknown element'}`);
    }
  } else {
    console.log('  No changes in history');
  }
  
  // Store changes in session data
  if (!session.domChanges) {
    session.domChanges = [];
  }
  if (changeHistory) {
    session.domChanges.push(...changeHistory);
  }
  
  // Broadcast to dashboard
  broadcast({
    type: 'dom_changes_detected',
    sessionId: session.sessionId,
    changeHistory: changeHistory,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle code removal request from DOM editor
 */
function handleCodeRemovalRequest(ws, data) {
  const { element, url } = data;
  
  const session = findSessionByWebSocket(ws);
  if (!session) {
    console.warn('DOM Editor: No session found for code removal request');
    ws.send(JSON.stringify({
      type: 'code_removal_failed',
      error: 'No active session'
    }));
    return;
  }
  
  console.log('\n🔧 CODE REMOVAL REQUEST');
  console.log('================================');
  console.log('URL:', url);
  console.log('Element:', element.tagName + (element.id ? '#' + element.id : ''));
  console.log('Classes:', element.className);
  console.log('Text:', element.text?.substring(0, 50) + '...');
  
  if (element.context) {
    console.log('\nContext:');
    console.log('- Parent chain:', element.context.parentChain?.map(p => p.tagName).join(' > '));
    console.log('- Sibling position:', element.context.siblingContext?.index + 1, 'of', element.context.siblingContext?.totalSiblings);
    console.log('- Source file hint:', element.context.filePath || 'Unknown');
  }
  
  console.log('\n📝 Element Details:');
  console.log('- Selector:', element.selector);
  console.log('- Inner HTML preview:', element.innerHTML?.substring(0, 100) + '...');
  console.log('- Outer HTML preview:', element.outerHTML?.substring(0, 100) + '...');
  
  // Broadcast code removal request to dashboard/agents
  broadcast({
    type: 'code_removal_requested',
    sessionId: session.sessionId,
    element: element,
    url: url,
    timestamp: new Date().toISOString()
  });
  
  // Store the request for integrations to handle
  if (!domEditorState.pendingRemovals) {
    domEditorState.pendingRemovals = new Map();
  }
  domEditorState.pendingRemovals.set(session.sessionId, {
    element,
    url,
    requestTime: new Date().toISOString(),
    ws
  });
  
  console.log('⏳ Waiting for integration to handle removal...');
}

/**
 * Find session by WebSocket connection
 */
function findSessionByWebSocket(ws) {
  for (const [sessionId, sessionData] of domEditorConnections) {
    if (sessionData.ws === ws) {
      return sessionData;
    }
  }
  return null;
}

/**
 * DOM Editor API Endpoints
 */

// Get DOM editor context for Claude
app.get('/api/dom-editor/context', (req, res) => {
  const recentChanges = domEditorState.recentChanges.slice(-10); // Last 10 changes
  const activeSessions = Array.from(domEditorState.sessions.entries()).map(([sessionId, sessionData]) => ({
    sessionId,
    url: sessionData.url,
    selectedElement: sessionData.selectedElement,
    changesCount: sessionData.changes.length,
    lastActivity: sessionData.changes.length > 0 ? sessionData.changes[sessionData.changes.length - 1].timestamp : null
  }));
  
  res.json({
    recentChanges,
    activeSessions,
    totalChanges: domEditorState.recentChanges.length
  });
});

// Get specific session details
app.get('/api/dom-editor/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const sessionData = domEditorState.sessions.get(sessionId);
  
  if (!sessionData) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    sessionId,
    ...sessionData
  });
});

// Get all DOM editor activity (for Claude context)
app.get('/api/dom-editor/activity', (req, res) => {
  const { limit = 20, sessionId } = req.query;
  
  let changes = domEditorState.recentChanges;
  
  if (sessionId) {
    changes = changes.filter(change => change.sessionId === sessionId);
  }
  
  const limitedChanges = changes.slice(-parseInt(limit));
  
  res.json({
    changes: limitedChanges,
    totalChanges: changes.length,
    sessionId: sessionId || null
  });
});

// Send message to DOM editor (for Claude to control extension)
app.post('/api/dom-editor/message', (req, res) => {
  const { sessionId, message } = req.body;
  
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }
  
  const connection = domEditorConnections.get(sessionId);
  if (!connection) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  try {
    connection.ws.send(JSON.stringify(message));
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending message to DOM editor:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Hot DOM update endpoint
app.post('/api/dom-editor/hot-update', (req, res) => {
  const { type, selector, styles, content, reason } = req.body;
  
  console.log(`🔥 Hot DOM Update: ${type} for ${selector}`);
  console.log(`   Reason: ${reason}`);
  if (content) console.log(`   Content: ${content.substring(0, 100)}...`);
  
  // Broadcast hot update to all clients
  const hotUpdate = {
    type: 'hot_dom_update',
    updateType: type,
    selector: selector,
    styles: styles,
    content: content,
    reason: reason,
    timestamp: new Date().toISOString()
  };
  
  broadcast(hotUpdate);
  
  res.json({ success: true, message: 'Hot update broadcasted' });
});

server.listen(port, () => {
  console.log(`Decision Tapestry server listening at http://localhost:${port}`);
  console.log(`Watching for changes in: ${CWD}`);
});

const gracefulShutdown = () => {
  console.log("Attempting graceful shutdown...");

  // Stop Claude Code integration if running
  if (claudeCodeIntegrationProcess) {
    console.log("Stopping Claude Code integration...");
    claudeCodeIntegrationProcess.kill();
    claudeCodeIntegrationProcess = null;
  }

  // Close file watcher
  if (watcher) {
    watcher.close();
    console.log("File watcher closed.");
  }

  server.close(() => {
    console.log("Server successfully closed.");
    process.exit(0);
  });

  // Force close after 5 seconds
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 5000);
};

// Listen for nodemon's restart signal
process.once("SIGUSR2", gracefulShutdown);

// Listen for standard interrupt signal
process.on("SIGINT", gracefulShutdown);

// Listen for standard termination signal
process.on("SIGTERM", gracefulShutdown);


// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 86
// Task: Install and configure Gemini CLI wrapper
// Timestamp: 2025-07-16T08:35:08.934Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 86
// Task: Create Gemini API endpoint in server
// Timestamp: 2025-07-16T08:35:09.035Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 86
// Task: Replace search panel with Gemini prompt interface
// Timestamp: 2025-07-16T08:35:09.144Z



// Global variable to track integration process
let claudeCodeIntegrationProcess = null;

/**
 * Start Claude Code integration if not already running
 */
function startClaudeCodeIntegration() {
  // Check if integration is already connected
  if (domEditorState.integrations?.has('claude_code_dom_editor')) {
    console.log('✅ Claude Code integration already connected');
    return;
  }
  
  // Check if process is already starting/running
  if (claudeCodeIntegrationProcess) {
    console.log('⏳ Claude Code integration already starting...');
    return;
  }
  
  console.log('🚀 Auto-starting Claude Code DOM Editor integration...');
  
  // Find the integration script
  const integrationPath = path.join(__dirname, '..', 'claude-code-integration', 'dom-editor-integration.mjs');
  
  // Spawn the integration process
  claudeCodeIntegrationProcess = spawn('node', [integrationPath], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Handle output
  claudeCodeIntegrationProcess.stdout.on('data', (data) => {
    console.log(`[Integration] ${data.toString().trim()}`);
  });
  
  claudeCodeIntegrationProcess.stderr.on('data', (data) => {
    console.error(`[Integration Error] ${data.toString().trim()}`);
  });
  
  // Handle process exit
  claudeCodeIntegrationProcess.on('exit', (code) => {
    console.log(`[Integration] Process exited with code ${code}`);
    claudeCodeIntegrationProcess = null;
  });
  
  claudeCodeIntegrationProcess.on('error', (err) => {
    console.error('[Integration] Failed to start:', err);
    claudeCodeIntegrationProcess = null;
  });
}

/**
 * Handle integration connections (Claude Code, etc.)
 */
function handleIntegrationConnect(ws, data) {
  const { integrationType, projectRoot, capabilities } = data;
  
  console.log(`🔌 Integration connected: ${integrationType}`);
  console.log(`   Project: ${projectRoot}`);
  console.log(`   Capabilities: ${capabilities.join(', ')}`);
  
  // Store integration connection
  if (!domEditorState.integrations) {
    domEditorState.integrations = new Map();
  }
  
  domEditorState.integrations.set(integrationType, {
    ws,
    projectRoot,
    capabilities,
    connectedAt: new Date().toISOString()
  });
  
  // Send acknowledgment
  ws.send(JSON.stringify({
    type: 'integration_connected',
    integrationType,
    message: 'Integration registered successfully'
  }));
}

/**
 * Handle code removal completion from integrations
 */
function handleCodeRemovalComplete(ws, data) {
  const { sessionId, element, method, success } = data;
  
  console.log(`\n✅ CODE REMOVAL COMPLETED`);
  console.log(`   Element: ${element}`);
  console.log(`   Method: ${method}`);
  console.log(`   Success: ${success}`);
  
  // Find the pending removal request
  const pendingRemoval = domEditorState.pendingRemovals?.get(sessionId);
  if (pendingRemoval) {
    // Send completion message to the DOM editor
    pendingRemoval.ws.send(JSON.stringify({
      type: 'code_removal_complete',
      element: element,
      success: success,
      method: method
    }));
    
    // Clean up
    domEditorState.pendingRemovals.delete(sessionId);
    
    console.log('✅ Notified DOM editor of successful removal');
  } else {
    console.warn('⚠️  No pending removal found for session:', sessionId);
  }
}

// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 86
// Task: Implement streaming response display
// Timestamp: 2025-07-16T08:35:09.227Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 86
// Task: Add decision context injection for Gemini prompts
// Timestamp: 2025-07-16T08:35:09.302Z



// Enhanced by Decision Tapestry Agent Framework
// Decision ID: 86
// Task: Create natural language to action translation
// Timestamp: 2025-07-16T08:35:09.394Z

