/**
 * @fileoverview MAS - Módulo de Adquisición Sensorial (Abstract Adapter)
 *
 * Responsibilities:
 * - Define the interface for sensor data acquisition
 * - Abstract hardware dependencies using the Adapter pattern (GoF)
 * - Translate continuous physical magnitudes into digital signals
 *
 * Mayéutica Module: MAS (Sensorial Acquisition)
 * Mayéutica Functionalities: F04, F05 (sensor acquisition)
 * Dependencies: None (this is the abstraction layer)
 *
 * DESIGN PATTERN: Adapter (Gang of Four)
 * In production, subclasses will implement MQTT/serial acquisition from physical sensors.
 * For now, we use SimulatorAdapter for testing and demonstration.
 */

/**
 * Abstract Sensor Adapter
 * Base class for all sensor acquisition implementations
 */
export class SensorAdapter {
  /**
   * Acquire sensor data at a specific circadian hour
   * @param {number} hora - Circadian hour (0.0 - 24.0)
   * @returns {Object} Raw sensor data
   * @throws {Error} If not implemented by subclass
   *
   * Expected return shape:
   * {
   *   tempAire: number,          // Air temperature (°C)
   *   hr: number,                 // Relative humidity (%)
   *   presion: number,            // Atmospheric pressure (hPa)
   *   viento: number,             // Wind speed (m/s)
   *   tempAguaFria: number,       // Cold water temperature (°C)
   *   tempAguaRetorno: number,    // Return water temperature (°C)
   *   caudalAguaDulce: number,    // Fresh water flow (L/min)
   *   potenciaBomba: number,      // Pump power (W)
   *   tempAireSalida: number,     // Outlet air temperature (°C)
   *   hrSalida: number,           // Outlet humidity (%)
   * }
   */
  acquire(hora) {
    throw new Error('SensorAdapter.acquire() must be implemented by subclass');
  }

  /**
   * Get adapter type (for logging and debugging)
   * @returns {string} Adapter type name
   */
  getType() {
    return this.constructor.name;
  }
}
