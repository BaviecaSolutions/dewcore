/**
 * @fileoverview MOE - Módulo de Orquestación de Ensayo
 *
 * Responsibilities:
 * - Start, stop, pause, resume, and reset experiments
 * - Control simulation time (hora circadiana)
 * - Monitor module health and log incidents
 * - Emit status updates and tick events
 *
 * Mayéutica Module: MOE (Experiment Orchestration)
 * Mayéutica Functionalities: F01, F02, F03 (experiment control)
 * Dependencies: None (this is the director module)
 */

import { EventEmitter } from 'events';

/**
 * Experiment Orchestrator
 * Controls the experiment lifecycle and time progression
 */
export class ExperimentOrchestrator extends EventEmitter {
  constructor() {
    super();

    // Experiment state
    this.running = false;
    this.hora = 0.0;  // Circadian hour (0.0 - 24.0)
    this.speed = 1.0;  // Simulation speed multiplier (1.0 = realtime)

    // Time tracking
    this.startTime = null;
    this.lastTick = null;
    this.tickInterval = null;
    this.tickPeriod = 1000;  // Base tick every 1000ms (1 second)
  }

  /**
   * Start the experiment
   * Emits: 'tick' (on each time step), 'status_update', 'log'
   */
  start() {
    if (this.running) {
      this._log('warn', 'Experiment already running');
      return;
    }

    this.running = true;
    this.startTime = Date.now();
    this.lastTick = Date.now();

    this._log('info', `Experiment started at hora=${this.hora.toFixed(1)}, speed=${this.speed}x`);
    this._emitStatus();

    // Start ticking
    this.tickInterval = setInterval(() => this._tick(), this.tickPeriod);
  }

  /**
   * Stop the experiment (can be resumed)
   */
  stop() {
    if (!this.running) {
      this._log('warn', 'Experiment already stopped');
      return;
    }

    this.running = false;
    clearInterval(this.tickInterval);
    this.tickInterval = null;

    this._log('info', `Experiment stopped at hora=${this.hora.toFixed(1)}`);
    this._emitStatus();
  }

  /**
   * Pause the experiment (alias for stop)
   */
  pause() {
    this.stop();
  }

  /**
   * Reset the experiment to hora=0
   */
  reset() {
    const wasRunning = this.running;

    if (wasRunning) {
      this.stop();
    }

    this.hora = 0.0;
    this.startTime = null;
    this.lastTick = null;

    this._log('info', 'Experiment reset to hora=0');
    this._emitStatus();

    if (wasRunning) {
      this.start();
    }
  }

  /**
   * Set simulation speed
   * @param {number} speed - Speed multiplier (e.g., 2.0 = 2x faster, 0.5 = half speed)
   */
  setSpeed(speed) {
    if (speed <= 0) {
      this._log('error', `Invalid speed: ${speed} (must be > 0)`);
      return;
    }

    const oldSpeed = this.speed;
    this.speed = speed;

    this._log('info', `Speed changed: ${oldSpeed}x → ${speed}x`);
    this._emitStatus();
  }

  /**
   * Get current status
   * @returns {Object} Current orchestrator state
   */
  getStatus() {
    return {
      running: this.running,
      hora: this.hora,
      speed: this.speed,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
    };
  }

  /**
   * Internal tick handler
   * Advances the circadian hour and emits tick event
   * @private
   */
  _tick() {
    const now = Date.now();
    const deltaMs = now - this.lastTick;
    this.lastTick = now;

    // Calculate hora increment based on speed
    // 1 second realtime = (1/3600) hours realtime
    // With speed multiplier: deltaHoras = (deltaMs / 1000) / 3600 * speed
    const deltaHoras = (deltaMs / 1000 / 3600) * this.speed;

    // Advance hora
    this.hora += deltaHoras;

    // Wrap at 24 hours (circadian cycle)
    if (this.hora >= 24.0) {
      this.hora = this.hora % 24.0;
      this._log('info', 'Circadian cycle completed (24h → 0h)');
    }

    // Emit tick event (this is what triggers the pipeline)
    this.emit('tick', this.hora);
  }

  /**
   * Emit status update
   * @private
   */
  _emitStatus() {
    this.emit('status_update', this.getStatus());
  }

  /**
   * Log an event
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Log message
   * @private
   */
  _log(level, message) {
    const timestamp = new Date().toISOString();
    this.emit('log', {
      timestamp,
      level,
      module: 'MOE',
      message,
    });
  }
}
