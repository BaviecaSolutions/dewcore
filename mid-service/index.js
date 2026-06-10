// =========================================================================
// MID SERVICE - Módulo de Integración de Datos
// =========================================================================

import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import { MIDCore } from './mid-core.js';

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Instancia del MID Core
const mid = new MIDCore();

// Clientes WebSocket conectados
const clients = {
  monitor: new Set(),  // MID Monitor
  mlt: new Set(),      // MLT Dashboard
  cma: new Set(),      // CMA Dashboard
};

// ===== WEBSOCKET CONNECTION =====
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const clientType = url.searchParams.get('type') || 'unknown';

  console.log(`[WebSocket] Cliente conectado: ${clientType}`);

  // Registrar cliente según tipo
  if (clientType === 'monitor') {
    clients.monitor.add(ws);
    // Enviar estado inicial
    ws.send(JSON.stringify({
      type: 'status',
      data: mid.getStatus(),
    }));
  } else if (clientType === 'mlt') {
    clients.mlt.add(ws);
  } else if (clientType === 'cma') {
    clients.cma.add(ws);
  }

  // Mensajes desde el cliente
  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      handleClientMessage(ws, clientType, msg);
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
    }
  });

  // Desconexión
  ws.on('close', () => {
    console.log(`[WebSocket] Cliente desconectado: ${clientType}`);
    clients.monitor.delete(ws);
    clients.mlt.delete(ws);
    clients.cma.delete(ws);
  });
});

// ===== HANDLE CLIENT MESSAGES =====
function handleClientMessage(ws, clientType, msg) {
  console.log(`[${clientType}] Mensaje recibido:`, msg.type);

  switch (msg.type) {
    case 'start':
      mid.startSimulation();
      broadcastToMonitors({ type: 'simulation_started' });
      break;

    case 'stop':
      mid.stopSimulation();
      broadcastToMonitors({ type: 'simulation_stopped' });
      break;

    case 'reset':
      mid.reset();
      broadcastToMonitors({ type: 'simulation_reset' });
      break;

    case 'set_speed':
      mid.setSpeed(msg.speed);
      broadcastToMonitors({ type: 'speed_changed', speed: msg.speed });
      break;

    default:
      console.warn(`[${clientType}] Tipo de mensaje desconocido: ${msg.type}`);
  }
}

// ===== BROADCAST FUNCTIONS =====
function broadcastToMonitors(data) {
  const message = JSON.stringify(data);
  clients.monitor.forEach(client => {
    if (client.readyState === 1) client.send(message);
  });
}

function broadcastToMLT(data) {
  const message = JSON.stringify(data);
  clients.mlt.forEach(client => {
    if (client.readyState === 1) client.send(message);
  });
}

function broadcastToCMA(data) {
  const message = JSON.stringify(data);
  clients.cma.forEach(client => {
    if (client.readyState === 1) client.send(message);
  });
}

// ===== MID CORE EVENT HANDLERS =====
mid.on('data_normalized', (data) => {
  // Enviar a monitors
  broadcastToMonitors({
    type: 'data_normalized',
    data,
    timestamp: new Date().toISOString(),
  });
});

mid.on('data_enriched', (data) => {
  // Distribuir a dashboards
  broadcastToMLT({
    type: 'data',
    data: data.mlt,
  });

  broadcastToCMA({
    type: 'data',
    data: data.cma,
  });

  // Log a monitors
  broadcastToMonitors({
    type: 'data_enriched',
    data,
    timestamp: new Date().toISOString(),
  });
});

mid.on('log', (logEntry) => {
  broadcastToMonitors({
    type: 'log',
    data: logEntry,
  });
});

mid.on('error', (error) => {
  console.error('[MID] Error:', error);
  broadcastToMonitors({
    type: 'error',
    data: {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    },
  });
});

mid.on('status_update', (status) => {
  broadcastToMonitors({
    type: 'status',
    data: status,
  });
});

// ===== REST API ENDPOINTS =====
app.get('/status', (req, res) => {
  res.json(mid.getStatus());
});

app.post('/start', (req, res) => {
  mid.startSimulation();
  res.json({ success: true, message: 'Simulation started' });
});

app.post('/stop', (req, res) => {
  mid.stopSimulation();
  res.json({ success: true, message: 'Simulation stopped' });
});

app.post('/reset', (req, res) => {
  mid.reset();
  res.json({ success: true, message: 'Simulation reset' });
});

app.get('/metrics', (req, res) => {
  res.json(mid.getMetrics());
});

// ===== START SERVER =====
server.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       MID SERVICE - Módulo de Integración de Datos       ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  HTTP Server:       http://localhost:${PORT}               ║`);
  console.log(`║  WebSocket Server:  ws://localhost:${PORT}                 ║`);
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║  WebSocket Endpoints:                                     ║');
  console.log('║    - ws://localhost:3000?type=monitor (MID Monitor)       ║');
  console.log('║    - ws://localhost:3000?type=mlt (MLT Dashboard)         ║');
  console.log('║    - ws://localhost:3000?type=cma (CMA Dashboard)         ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║  REST API:                                                ║');
  console.log('║    GET  /status   - Estado del MID                        ║');
  console.log('║    POST /start    - Iniciar simulación                    ║');
  console.log('║    POST /stop     - Detener simulación                    ║');
  console.log('║    POST /reset    - Resetear simulación                   ║');
  console.log('║    GET  /metrics  - Métricas del sistema                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('[MID] Esperando conexiones de clientes...');
  console.log('');
});
