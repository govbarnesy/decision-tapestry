import express from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import http from 'http';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

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

// Serve the static frontend from the package's dist directory
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());

// Serve CSS files with the correct MIME type
app.get('/*.css', (req, res) => {
  res.type('text/css');
  res.sendFile(path.join(__dirname, 'dist', req.originalUrl));
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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

async function getData() {
  const decisionsPath = path.join(CWD, 'decisions.yml');
  const content = await fsp.readFile(decisionsPath, 'utf8');
  return yaml.load(content);
}

async function updateData(newData) {
  const decisionsPath = path.join(CWD, 'decisions.yml');
  const yamlString = yaml.dump(newData);
  await fsp.writeFile(decisionsPath, yamlString, 'utf8');
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
    res.status(500).send('Error fetching API data');
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
    res.status(500).send('Error promoting backlog item');
  }
});

server.listen(port, () => {
  console.log(`Decision Tapestry server listening at http://localhost:${port}`);
  console.log(`Watching for changes in: ${CWD}`);
});

const gracefulShutdown = () => {
  console.log('Attempting graceful shutdown...');
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
