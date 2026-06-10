/**
 * @fileoverview DewCore Backend Server
 *
 * HTTP REST API + WebSocket server
 * Integrates all 7 Mayéutica modules through the data pipeline
 *
 * REST Endpoints:
 * - GET /status - Orchestrator status
 * - POST /start - Start experiment
 * - POST /stop - Stop experiment
 * - POST /reset - Reset experiment
 * - POST /speed - Set simulation speed
 * - GET /history - Query historical data
 * - GET /metrics - Database statistics
 *
 * WebSocket Messages:
 * - Server → Client: { type: 'data', hora, normalized, results }
 * - Server → Client: { type: 'status', ...status }
 * - Client → Server: { type: 'start' | 'stop' | 'reset' | 'set_speed', speed? }
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Import all modules
import { ExperimentOrchestrator } from './modules/moe/orchestrator.js';
import { SimulatorAdapter } from './modules/mas/simulator-adapter.js';
import { Normalizer } from './modules/mid/normalizer.js';
import { MLTEngine } from './modules/mlt/engine.js';
import { MPTDatabase } from './modules/mpt/database.js';
import { Pipeline } from './pipeline.js';

// =========================================================================
// INITIALIZATION
// =========================================================================

const PORT = process.env.PORT || 3000;

// Instantiate all modules
console.log('[INIT] Initializing DewCore modules...');

const orchestrator = new ExperimentOrchestrator();
const sensorAdapter = new SimulatorAdapter();
const normalizer = new Normalizer();
const engine = new MLTEngine();
const database = new MPTDatabase();
const pipeline = new Pipeline({
  orchestrator,
  sensorAdapter,
  normalizer,
  engine,
  database,
});

console.log('[INIT] All modules initialized');

// =========================================================================
// EXPRESS HTTP SERVER
// =========================================================================

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'dewcore-backend' });
});

// Get orchestrator status
app.get('/status', (req, res) => {
  const status = orchestrator.getStatus();
  res.json(status);
});

// Start experiment
app.post('/start', (req, res) => {
  orchestrator.start();
  res.json({ success: true, message: 'Experiment started' });
});

// Stop experiment
app.post('/stop', (req, res) => {
  orchestrator.stop();
  res.json({ success: true, message: 'Experiment stopped' });
});

// Reset experiment
app.post('/reset', (req, res) => {
  orchestrator.reset();
  res.json({ success: true, message: 'Experiment reset' });
});

// Set simulation speed
app.post('/speed', (req, res) => {
  const { speed } = req.body;
  if (!speed || speed <= 0) {
    return res.status(400).json({ error: 'Invalid speed (must be > 0)' });
  }
  orchestrator.setSpeed(speed);
  res.json({ success: true, speed });
});

// Query historical data
app.get('/history', (req, res) => {
  const { last } = req.query;

  if (last) {
    const n = parseInt(last, 10);
    if (isNaN(n) || n <= 0) {
      return res.status(400).json({ error: 'Invalid "last" parameter' });
    }
    const data = database.queryLast(n);
    return res.json({ count: data.length, data });
  }

  // If no query params, return last 48 measurements (default)
  const data = database.queryLast(48);
  res.json({ count: data.length, data });
});

// Get database metrics
app.get('/metrics', (req, res) => {
  const stats = database.getStats();
  res.json(stats);
});

// Create HTTP server
const httpServer = createServer(app);

// =========================================================================
// WEBSOCKET SERVER
// =========================================================================

const wss = new WebSocketServer({ server: httpServer });

// Track connected clients
const clients = new Set();

wss.on('connection', (ws, req) => {
  const clientType = new URL(req.url, 'http://localhost').searchParams.get('type') || 'unknown';
  console.log(`[WS] Client connected (type=${clientType})`);

  clients.add(ws);

  // Send current status on connection
  ws.send(JSON.stringify({
    type: 'status',
    ...orchestrator.getStatus(),
  }));

  // Handle incoming messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleClientMessage(ws, data);
    } catch (error) {
      console.error('[WS] Invalid message from client:', error.message);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    clients.delete(ws);
    console.log('[WS] Client disconnected');
  });
});

/**
 * Handle WebSocket messages from client
 * @param {WebSocket} ws - Client WebSocket
 * @param {Object} data - Message data
 */
function handleClientMessage(ws, data) {
  switch (data.type) {
    case 'start':
      orchestrator.start();
      break;

    case 'stop':
      orchestrator.stop();
      break;

    case 'reset':
      orchestrator.reset();
      break;

    case 'set_speed':
      if (data.speed && data.speed > 0) {
        orchestrator.setSpeed(data.speed);
      }
      break;

    default:
      console.warn(`[WS] Unknown message type: ${data.type}`);
  }
}

/**
 * Broadcast message to all connected clients
 * @param {Object} message - Message object to broadcast
 */
function broadcast(message) {
  const payload = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === 1) {  // WebSocket.OPEN
      client.send(payload);
    }
  });
}

// =========================================================================
// PIPELINE EVENT HANDLERS
// =========================================================================

// Pipeline data events → broadcast to CMA clients
pipeline.on('data', (data) => {
  broadcast({
    type: 'data',
    ...data,
  });
});

// Pipeline log events → log to console
pipeline.on('log', (log) => {
  console.log(`[${log.module}] ${log.message}`);
});

// Orchestrator status updates → broadcast to clients
orchestrator.on('status_update', (status) => {
  broadcast({
    type: 'status',
    ...status,
  });
});

// Orchestrator log events → log to console
orchestrator.on('log', (log) => {
  console.log(`[${log.module}] ${log.message}`);
});

// =========================================================================
// START SERVER
// =========================================================================

httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     DewCore Backend Server                     ║
║                   Mayéutica Validation System                  ║
╚════════════════════════════════════════════════════════════════╝

HTTP API:  http://localhost:${PORT}
WebSocket: ws://localhost:${PORT}

Modules initialized:
  ✓ MOE - Experiment Orchestrator
  ✓ MAS - Sensor Adapter (${sensorAdapter.getType()})
  ✓ MID - Normalizer
  ✓ MLT - Thermodynamic Engine
  ✓ MPT - Database (SQLite)
  ✓ Pipeline - Data flow orchestration

Press Ctrl+C to shutdown
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Closing database...');
  database.close();
  console.log('[SHUTDOWN] Server stopped');
  process.exit(0);
});
