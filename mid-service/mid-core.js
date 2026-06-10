// =========================================================================
// MID CORE - Lógica principal del Módulo de Integración de Datos
// =========================================================================

import { EventEmitter } from 'events';
import { calcularMLT, calcularCMA } from './calculations.js';
import { generarDatosSimulados } from './data-generator.js';

export class MIDCore extends EventEmitter {
  constructor() {
    super();

    this.state = {
      running: false,
      hora: 12,  // Hora inicial (12:00)
      speed: 1,  // Velocidad de simulación (1x = normal, 2x = doble, etc.)
      lastUpdate: null,
    };

    this.metrics = {
      dataProcessed: 0,
      errors: 0,
      startTime: null,
      uptime: 0,
    };

    this.interval = null;
  }

  // ===== CONTROL DE SIMULACIÓN =====

  startSimulation() {
    if (this.state.running) {
      this.log('warn', 'La simulación ya está en ejecución');
      return;
    }

    this.state.running = true;
    this.metrics.startTime = Date.now();

    this.log('info', `Simulación iniciada (velocidad ${this.state.speed}x)`);
    this.emitStatusUpdate();

    // Intervalo base: 600ms = avanza 0.5h cada 600ms (igual que dashboards)
    const baseInterval = 600;
    const adjustedInterval = baseInterval / this.state.speed;

    this.interval = setInterval(() => {
      this.tick();
    }, adjustedInterval);
  }

  stopSimulation() {
    if (!this.state.running) {
      this.log('warn', 'La simulación no está en ejecución');
      return;
    }

    this.state.running = false;
    clearInterval(this.interval);
    this.interval = null;

    this.log('info', 'Simulación detenida');
    this.emitStatusUpdate();
  }

  reset() {
    this.stopSimulation();
    this.state.hora = 12;
    this.state.speed = 1;
    this.metrics.dataProcessed = 0;
    this.metrics.errors = 0;
    this.metrics.startTime = null;
    this.metrics.uptime = 0;

    this.log('info', 'Simulación reseteada');
    this.emitStatusUpdate();
  }

  setSpeed(speed) {
    const oldSpeed = this.state.speed;
    this.state.speed = speed;

    this.log('info', `Velocidad cambiada: ${oldSpeed}x → ${speed}x`);

    // Si está corriendo, reiniciar con nueva velocidad
    if (this.state.running) {
      clearInterval(this.interval);
      const baseInterval = 600;
      const adjustedInterval = baseInterval / this.state.speed;
      this.interval = setInterval(() => {
        this.tick();
      }, adjustedInterval);
    }

    this.emitStatusUpdate();
  }

  // ===== TICK (Procesamiento de datos) =====

  tick() {
    try {
      // 1. Avanzar hora (simula el paso del tiempo)
      this.state.hora += 0.5;
      if (this.state.hora > 24) {
        this.state.hora = 0;
      }

      // 2. SIMULAR MOE/MAS: Generar datos "brutos" (atmosféricos + marinos)
      const datosBrutos = generarDatosSimulados(this.state.hora);

      this.log('data', `[MOE/MAS] Datos brutos generados para hora ${this.state.hora.toFixed(1)}h`);

      // 3. NORMALIZAR: Aplicar calibración, interpolar valores faltantes
      const datosNormalizados = this.normalizar(datosBrutos);

      this.emit('data_normalized', {
        hora: this.state.hora,
        raw: datosBrutos,
        normalized: datosNormalizados,
      });

      // 4. ENRIQUECER: Calcular métricas termodinámicas y económicas
      const datosEnriquecidos = this.enriquecer(datosNormalizados);

      this.emit('data_enriched', {
        hora: this.state.hora,
        mlt: datosEnriquecidos.mlt,
        cma: datosEnriquecidos.cma,
      });

      // 5. Actualizar métricas
      this.metrics.dataProcessed++;
      this.state.lastUpdate = new Date().toISOString();
      this.metrics.uptime = this.metrics.startTime ? Date.now() - this.metrics.startTime : 0;

      // 6. Emitir estado cada 10 ticks (para no saturar)
      if (this.metrics.dataProcessed % 10 === 0) {
        this.emitStatusUpdate();
      }

    } catch (error) {
      this.metrics.errors++;
      this.emit('error', error);
      this.log('error', `Error en tick: ${error.message}`);
    }
  }

  // ===== NORMALIZACIÓN =====

  normalizar(datosBrutos) {
    // En este ejemplo simple, los datos ya vienen "limpios"
    // En producción real, aquí se haría:
    // - Aplicar calibración de sensores (offset, gain)
    // - Interpolar valores faltantes (NaN, null)
    // - Validar rangos físicos
    // - Suavizar ruido con media móvil

    const datosNormalizados = {
      ...datosBrutos,
      _metadata: {
        normalized: true,
        timestamp: new Date().toISOString(),
      },
    };

    return datosNormalizados;
  }

  // ===== ENRIQUECIMIENTO =====

  enriquecer(datosNormalizados) {
    // Parámetros para cálculos termodinámicos
    const params = {
      tempAire: datosNormalizados.tempAire,
      hr: datosNormalizados.hr,
      presion: datosNormalizados.presion,
      tempAguaFria: datosNormalizados.tempAguaFria,
      tempAguaRetorno: datosNormalizados.tempAguaRetorno,
      caudalAguaDulceLpm: datosNormalizados.caudalAguaDulce,
      potenciaBomba: datosNormalizados.potenciaBomba,
      periodoHoras: 1,
      caudalAireM3h: 100,
      tempCondensadorMedida: null,
      tempAireSalida: datosNormalizados.tempAireSalida,
      hrSalida: datosNormalizados.hrSalida,
    };

    // Calcular datos para MLT (científicos)
    const resultadosMLT = calcularMLT(params);

    // Calcular datos para CMA (económicos)
    const resultadosCMA = calcularCMA(params);

    return {
      mlt: {
        ...datosNormalizados,
        ...resultadosMLT,
      },
      cma: {
        ...datosNormalizados,
        ...resultadosCMA,
      },
    };
  }

  // ===== LOGGING =====

  log(level, message) {
    const logEntry = {
      level,  // 'info', 'warn', 'error', 'data'
      message,
      timestamp: new Date().toISOString(),
    };

    console.log(`[MID] [${level.toUpperCase()}] ${message}`);
    this.emit('log', logEntry);
  }

  // ===== GETTERS =====

  getStatus() {
    return {
      running: this.state.running,
      hora: this.state.hora,
      speed: this.state.speed,
      lastUpdate: this.state.lastUpdate,
      uptime: this.metrics.uptime,
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      dataPerSecond: this.metrics.uptime > 0
        ? (this.metrics.dataProcessed / (this.metrics.uptime / 1000)).toFixed(2)
        : 0,
    };
  }

  emitStatusUpdate() {
    this.emit('status_update', this.getStatus());
  }
}
