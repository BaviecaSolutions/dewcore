/**
 * @fileoverview DATA PIPELINE - Connects all 7 Mayéutica modules
 *
 * Flow: MOE (tick) → MAS (acquire) → MID (normalize) → MLT (compute) → MPT (persist)
 *                                                                            ↓
 *                                                                    CMA (via WebSocket)
 *
 * This is the orchestration backbone of the validation system.
 * Each tick from MOE triggers a complete data acquisition, processing, and storage cycle.
 */

import { EventEmitter } from 'events';

/**
 * Data Processing Pipeline
 * Wires all modules together in the canonical data flow
 */
export class Pipeline extends EventEmitter {
  /**
   * @param {Object} modules - All required modules
   * @param {ExperimentOrchestrator} modules.orchestrator - MOE
   * @param {SensorAdapter} modules.sensorAdapter - MAS
   * @param {Normalizer} modules.normalizer - MID
   * @param {MLTEngine} modules.engine - MLT
   * @param {MPTDatabase} modules.database - MPT
   */
  constructor({ orchestrator, sensorAdapter, normalizer, engine, database }) {
    super();

    this.orchestrator = orchestrator;
    this.sensorAdapter = sensorAdapter;
    this.normalizer = normalizer;
    this.engine = engine;
    this.database = database;

    // Subscribe to orchestrator ticks
    this.orchestrator.on('tick', (hora) => this._onTick(hora));

    this._log('Pipeline initialized with all modules');
  }

  /**
   * Handle orchestrator tick
   * Executes the full data processing pipeline
   * @param {number} hora - Circadian hour from MOE
   * @private
   */
  async _onTick(hora) {
    try {
      // STEP 1: MAS - Acquire raw sensor data
      const rawData = this.sensorAdapter.acquire(hora);
      this._log(`[MAS] Acquired data at hora=${hora.toFixed(2)}`);

      // STEP 2: MID - Normalize and validate
      const normalized = this.normalizer.normalize(rawData);
      this._log(`[MID] Normalized data (timestamp=${normalized._metadata.timestamp})`);

      // STEP 3: MLT - Compute thermodynamic + economic results
      const results = this.engine.compute(normalized);
      this._log(`[MLT] Computed results (producción=${results.termodinamica.litrosProducidos?.toFixed(2)} L)`);

      // STEP 4: MPT - Persist to append-only database
      const measurementRow = this._buildMeasurementRow(hora, normalized, results);
      const rowId = this.database.insert(measurementRow);
      this._log(`[MPT] Persisted measurement (id=${rowId})`);

      // STEP 5: Emit to CMA (frontend consumption)
      this.emit('data', {
        hora,
        normalized,
        results,
      });

    } catch (error) {
      this._log(`ERROR in pipeline: ${error.message}`, 'error');
      this.emit('error', error);
    }
  }

  /**
   * Build measurement row for MPT insertion
   * @param {number} hora - Circadian hour
   * @param {Object} normalized - Normalized data
   * @param {Object} results - MLT results
   * @returns {Object} Row data for SQLite insertion
   * @private
   */
  _buildMeasurementRow(hora, normalized, results) {
    const { termodinamica, economia, flags } = results;
    const { _metadata } = normalized;

    return {
      // Temporal
      timestamp: _metadata.timestamp,
      hora,

      // Geographic
      location_lat: _metadata.location.lat,
      location_lng: _metadata.location.lng,
      location_name: _metadata.location.name,

      // Raw (normalized) data
      temp_aire: normalized.tempAire,
      hr: normalized.hr,
      presion: normalized.presion,
      viento: normalized.viento,
      temp_agua_fria: normalized.tempAguaFria,
      temp_agua_retorno: normalized.tempAguaRetorno,
      caudal_agua_dulce: normalized.caudalAguaDulce,
      potencia_bomba: normalized.potenciaBomba,
      temp_aire_salida: normalized.tempAireSalida,
      hr_salida: normalized.hrSalida,

      // Thermodynamic results
      punto_rocio: termodinamica.puntoRocio,
      humedad_absoluta: termodinamica.humedadAbsoluta,
      condensable_gm3: termodinamica.condensableGm3,
      produccion_lph: termodinamica.produccionLph,
      ratio_eficiencia: termodinamica.ratioEficiencia,
      energia_consumida: termodinamica.energiaConsumida,
      energia_ahorrada: termodinamica.energiaAhorrada,
      delta_termico: termodinamica.deltaTermico,
      margen_operabilidad: termodinamica.margenOperabilidad,
      extraccion_empirica: termodinamica.extraccionEmpirica,
      pct_acierto: termodinamica.pctAcierto,

      // Ecological flags
      flag_rentable: flags.rentable ? 1 : 0,
      flag_huella_nula: flags.huellaNula ? 1 : 0,
      flag_efluentes: flags.efluentes ? 1 : 0,
      flag_operable: flags.operable ? 1 : 0,

      // Economic results
      coste_litro: economia.costeLitro,
      beneficio: economia.beneficio,
      ingresos: economia.ingresos,
      costes: economia.costes,
      ventaja_competitiva: economia.ventajaCompetitiva,
      roi_anios: economia.roiAnios,
      flag_competitivo: flags.competitivo ? 1 : 0,
      flag_roi_aceptable: flags.roiAceptable ? 1 : 0,
    };
  }

  /**
   * Log pipeline events
   * @param {string} message - Log message
   * @param {string} level - Log level (info, error)
   * @private
   */
  _log(message, level = 'info') {
    this.emit('log', {
      timestamp: new Date().toISOString(),
      level,
      module: 'PIPELINE',
      message,
    });
  }
}
