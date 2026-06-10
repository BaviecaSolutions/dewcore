/**
 * @fileoverview WebSocket Hook for Backend Communication
 *
 * Custom React hook that manages WebSocket connection to backend
 * with auto-reconnect and historical data loading.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'ws://localhost:3000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const RECONNECT_DELAY = 3000;  // 3 seconds
const MAX_HISTORY = 200;       // Keep last 200 measurements

/**
 * Custom hook for backend WebSocket connection
 * @returns {Object} { data, history, status, connected, send }
 */
export function useBackendStream() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState({ running: false, hora: 0, speed: 1 });
  const [connected, setConnected] = useState(false);

  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;  // Already connected
    }

    console.log('[WS] Connecting to backend...');

    const socket = new WebSocket(`${BACKEND_URL}?type=cma`);

    socket.onopen = () => {
      console.log('[WS] Connected to backend');
      setConnected(true);
      // Load initial history from REST API
      loadHistory();
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('[WS] Failed to parse message:', error);
      }
    };

    socket.onclose = () => {
      console.log('[WS] Disconnected from backend');
      setConnected(false);

      // Auto-reconnect
      reconnectTimeout.current = setTimeout(() => {
        connect();
      }, RECONNECT_DELAY);
    };

    socket.onerror = (error) => {
      console.error('[WS] WebSocket error:', error);
    };

    ws.current = socket;
  }, []);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setConnected(false);
  }, []);

  /**
   * Send message to backend
   * @param {Object} message - Message to send
   */
  const send = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('[WS] Cannot send message: not connected');
    }
  }, []);

  /**
   * Handle incoming WebSocket message
   * @param {Object} message - Parsed message
   */
  const handleMessage = (message) => {
    switch (message.type) {
      case 'data':
        // New measurement from pipeline
        setData(message);
        setHistory((prev) => {
          const updated = [...prev, message];
          // Keep only last MAX_HISTORY entries
          return updated.slice(-MAX_HISTORY);
        });
        break;

      case 'status':
        // Orchestrator status update
        setStatus({
          running: message.running,
          hora: message.hora,
          speed: message.speed,
        });
        break;

      default:
        console.warn('[WS] Unknown message type:', message.type);
    }
  };

  /**
   * Load historical data from REST API
   */
  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/history?last=48`);
      const { data: historyData } = await response.json();

      // Transform database rows into the same format as WebSocket messages
      const transformed = historyData.map((row) => ({
        hora: row.hora,
        normalized: {
          tempAire: row.temp_aire,
          hr: row.hr,
          presion: row.presion,
          viento: row.viento,
          tempAguaFria: row.temp_agua_fria,
          tempAguaRetorno: row.temp_agua_retorno,
          caudalAguaDulce: row.caudal_agua_dulce,
          potenciaBomba: row.potencia_bomba,
          tempAireSalida: row.temp_aire_salida,
          hrSalida: row.hr_salida,
          _metadata: { timestamp: row.timestamp },
        },
        results: {
          termodinamica: {
            puntoRocio: row.punto_rocio,
            humedadAbsoluta: row.humedad_absoluta,
            condensableGm3: row.condensable_gm3,
            produccionLph: row.produccion_lph,
            litrosProducidos: row.produccion_lph * 0.5,  // Approximate
            ratioEficiencia: row.ratio_eficiencia,
            energiaConsumida: row.energia_consumida,
            energiaAhorrada: row.energia_ahorrada,
            pctAcierto: row.pct_acierto,
          },
          economia: {
            costeLitro: row.coste_litro,
            beneficio: row.beneficio,
            ingresos: row.ingresos,
            costes: row.costes,
            beneficioAnual: row.beneficio * 24 * 365,
            roiAnios: row.roi_anios,
            ventajaCompetitiva: row.ventaja_competitiva,
          },
          flags: {
            rentable: Boolean(row.flag_rentable),
            huellaNula: Boolean(row.flag_huella_nula),
            operable: Boolean(row.flag_operable),
            competitivo: Boolean(row.flag_competitivo),
            roiAceptable: Boolean(row.flag_roi_aceptable),
          },
        },
      }));

      setHistory(transformed);
      console.log(`[API] Loaded ${transformed.length} historical measurements`);
    } catch (error) {
      console.error('[API] Failed to load history:', error);
    }
  };

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    data,
    history,
    status,
    connected,
    send,
  };
}
