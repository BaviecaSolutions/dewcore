/**
 * @fileoverview MLT - Módulo Lógico-Termodinámico (Backend Wrapper)
 *
 * Responsibilities:
 * - Run thermodynamic and economic calculations on normalized data
 * - Bridge between the shared calculation library and the pipeline
 * - Could add caching, batching, or model configuration in the future
 *
 * Mayéutica Module: MLT (Logical-Thermodynamic)
 * Mayéutica Functionalities: F06, F14, F15, F16, F17, F18, F19, F20
 * Dependencies: @dewcore/shared/mlt-engine
 *
 * IMPORTANT: This module does NOT contain calculation logic.
 * All calculations are in @dewcore/shared/mlt-engine.js (single source of truth).
 */

import { calcularTermodinamica, calcularEconomia } from '@dewcore/shared/mlt-engine';

/**
 * MLT Computation Engine
 * Stateless computation wrapper around shared calculation library
 */
export class MLTEngine {
  constructor() {
    // Stateless: no configuration needed for now
    // In the future, could add model parameters, calibration curves, etc.
  }

  /**
   * Compute thermodynamic and economic results
   * @param {Object} normalizedData - Normalized sensor data from MID
   * @returns {Object} Complete results: termodinamica, economia, flags
   */
  compute(normalizedData) {
    // Prepare parameters for thermodynamic calculation
    const termoParams = {
      tempAire: normalizedData.tempAire,
      hr: normalizedData.hr,
      presion: normalizedData.presion,
      tempAguaFria: normalizedData.tempAguaFria,
      tempAguaRetorno: normalizedData.tempAguaRetorno,
      caudalAguaDulceLpm: normalizedData.caudalAguaDulce,
      potenciaBomba: normalizedData.potenciaBomba,
      tempAireSalida: normalizedData.tempAireSalida,
      hrSalida: normalizedData.hrSalida,
      periodoHoras: 0.5,  // Default: 0.5h period
    };

    // Run thermodynamic calculations
    const termodinamica = calcularTermodinamica(termoParams);

    // Run economic calculations
    const energiaConsumidaKwh = termodinamica.energiaConsumida / 1000;  // Wh → kWh
    const economia = calcularEconomia(termodinamica.litrosProducidos, energiaConsumidaKwh);

    // Combine flags (thermodynamic + economic)
    const flags = {
      rentable: termodinamica.flagRentable && economia.flagRentable,
      huellaNula: termodinamica.flagHuellaNula,
      efluentes: termodinamica.flagEfluentes,
      operable: termodinamica.flagOperable,
      competitivo: economia.flagCompetitivo,
      roiAceptable: economia.flagROIAceptable,
    };

    return {
      termodinamica,
      economia,
      flags,
    };
  }
}
