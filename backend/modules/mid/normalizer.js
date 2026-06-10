/**
 * @fileoverview MID - Módulo de Ingesta y Discretización
 *
 * Responsibilities:
 * - Apply calibration offsets to raw sensor data
 * - Validate ranges (reject NaN, out-of-physical-range values)
 * - Add UTC timestamp and geographic coordinates
 * - Convert units if needed (normalization funnel)
 * - DOES NOT calculate thermodynamic values (that's MLT's job)
 *
 * Mayéutica Module: MID (Ingestion and Discretization)
 * Mayéutica Functionalities: F07, F08, F09, F10 (normalization)
 * Dependencies: None (pure data transformation)
 */

/**
 * Data Normalizer
 * Cleans, validates, and stamps raw sensor data
 */
export class Normalizer {
  constructor(config = {}) {
    // Calibration offsets (default: no correction)
    this.calibration = {
      tempAire: config.calibrationTempAire ?? 0.0,
      hr: config.calibrationHr ?? 0.0,
      presion: config.calibrationPresion ?? 0.0,
      tempAguaFria: config.calibrationTempAguaFria ?? 0.0,
      tempAguaRetorno: config.calibrationTempAguaRetorno ?? 0.0,
      ...config.calibration,
    };

    // Geographic location (default: Puerto de Alicante)
    this.location = {
      lat: config.lat ?? 38.3453,
      lng: config.lng ?? -0.4831,
      name: config.locationName ?? 'Puerto de Alicante',
    };

    // Physical range limits (for validation)
    this.ranges = {
      tempAire: { min: -40, max: 60 },         // °C
      hr: { min: 0, max: 100 },                // %
      presion: { min: 900, max: 1100 },        // hPa
      viento: { min: 0, max: 50 },             // m/s
      tempAguaFria: { min: -5, max: 40 },      // °C
      tempAguaRetorno: { min: -5, max: 40 },   // °C
      caudalAguaDulce: { min: 0, max: 10 },    // L/min
      potenciaBomba: { min: 0, max: 5000 },    // W
      tempAireSalida: { min: -40, max: 60 },   // °C
      hrSalida: { min: 0, max: 100 },          // %
    };
  }

  /**
   * Normalize raw sensor data
   * @param {Object} rawData - Raw sensor data from MAS
   * @returns {Object} Normalized data with metadata
   */
  normalize(rawData) {
    const timestamp = new Date().toISOString();

    // Apply calibration offsets
    const calibrated = {
      tempAire: rawData.tempAire + this.calibration.tempAire,
      hr: rawData.hr + this.calibration.hr,
      presion: rawData.presion + this.calibration.presion,
      viento: rawData.viento,
      tempAguaFria: rawData.tempAguaFria + this.calibration.tempAguaFria,
      tempAguaRetorno: rawData.tempAguaRetorno + this.calibration.tempAguaRetorno,
      caudalAguaDulce: rawData.caudalAguaDulce,
      potenciaBomba: rawData.potenciaBomba,
      tempAireSalida: rawData.tempAireSalida,
      hrSalida: rawData.hrSalida,
    };

    // Validate ranges
    const validated = this._validateRanges(calibrated);

    // Add metadata
    return {
      ...validated,
      _metadata: {
        normalized: true,
        timestamp,
        location: this.location,
      },
    };
  }

  /**
   * Validate that all values are within physical ranges
   * @param {Object} data - Calibrated data
   * @returns {Object} Validated data (NaN/out-of-range values replaced with null)
   * @private
   */
  _validateRanges(data) {
    const validated = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip if not in ranges (not a measured value)
      if (!(key in this.ranges)) {
        validated[key] = value;
        continue;
      }

      // Check for NaN or out of range
      if (isNaN(value) || value == null) {
        validated[key] = null;
        this._logValidationError(key, value, 'NaN or null');
        continue;
      }

      const { min, max } = this.ranges[key];
      if (value < min || value > max) {
        validated[key] = null;
        this._logValidationError(key, value, `out of range [${min}, ${max}]`);
        continue;
      }

      // Value is valid
      validated[key] = value;
    }

    return validated;
  }

  /**
   * Log validation error (can be extended to emit events)
   * @param {string} field - Field name
   * @param {*} value - Invalid value
   * @param {string} reason - Reason for rejection
   * @private
   */
  _logValidationError(field, value, reason) {
    console.warn(`[MID] Validation error: ${field}=${value} (${reason})`);
  }
}
