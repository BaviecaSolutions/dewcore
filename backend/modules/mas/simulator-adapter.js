/**
 * @fileoverview MAS - Simulator Adapter Implementation
 *
 * Responsibilities:
 * - Generate simulated sensor data for testing and demonstration
 * - Implement circadian patterns matching Alborán Sea conditions
 * - Provide realistic data without requiring physical sensors
 *
 * Mayéutica Module: MAS (Sensorial Acquisition)
 * Mayéutica Functionalities: F04, F05 (sensor acquisition in simulation mode)
 * Dependencies: MAS/SensorAdapter (extends)
 *
 * This is the ONLY place where simulation data generation logic exists.
 * Ported from the original dataGenerator.js (now deduplicated).
 */

import { SensorAdapter } from './sensor-adapter.js';

/**
 * Simulator Adapter
 * Generates synthetic sensor data using trigonometric circadian patterns
 */
export class SimulatorAdapter extends SensorAdapter {
  /**
   * Acquire simulated sensor data
   * @param {number} hora - Circadian hour (0.0 - 24.0)
   * @returns {Object} Simulated sensor data
   */
  acquire(hora) {
    // Normalize hora to 0-1 range for trigonometric calculations
    const t = hora / 24;

    // Atmospheric conditions (circadian patterns)
    const tempAire = 22 + 6 * Math.sin(Math.PI * (t - 0.25));
    const hr = 75 + 15 * Math.cos(Math.PI * (t - 0.1));
    const viento = 2.5 + 2 * Math.sin(Math.PI * t * 2);

    // Hydraulic system
    const tempAguaFria = 13.0 + Math.sin(t * Math.PI * 0.5) * 0.3;
    const tempAguaRetorno = 13.4 + Math.sin(t * Math.PI * 0.5) * 0.3;
    const caudalAguaDulce = 0.03 + 0.04 * Math.max(0, Math.sin(Math.PI * (t - 0.2)));

    // Electrical system
    const potenciaBomba = 145 + 10 * Math.sin(t * Math.PI);

    // Air outlet conditions (post-condensation)
    const tempAireSalida = 14.2 + Math.sin(t * Math.PI * 0.5) * 0.5;
    const hrSalida = 99.5 + Math.random() * 0.5;  // Near saturation

    return {
      tempAire: Math.round(tempAire * 10) / 10,
      hr: Math.min(98, Math.max(45, Math.round(hr * 10) / 10)),
      presion: 1013 + Math.round(Math.sin(t * Math.PI) * 3),
      viento: Math.round(viento * 10) / 10,
      tempAguaFria: Math.round(tempAguaFria * 100) / 100,
      tempAguaRetorno: Math.round(tempAguaRetorno * 100) / 100,
      caudalAguaDulce: Math.round(caudalAguaDulce * 1000) / 1000,
      potenciaBomba: Math.round(potenciaBomba * 10) / 10,
      tempAireSalida: Math.round(tempAireSalida * 100) / 100,
      hrSalida: Math.round(hrSalida * 10) / 10,
    };
  }
}
