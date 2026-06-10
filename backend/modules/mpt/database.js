/**
 * @fileoverview MPT - Módulo de Persistencia Trazable (Database Manager)
 *
 * Responsibilities:
 * - Manage SQLite database connection
 * - Insert measurements (append-only)
 * - Query historical data
 * - Provide database statistics
 * - DOES NOT allow UPDATE or DELETE (enforced by schema triggers)
 *
 * Mayéutica Module: MPT (Traceable Persistence)
 * Mayéutica Functionalities: F11, F12, F13 (immutable data custody)
 * Dependencies: better-sqlite3, schema.sql
 */

import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * MPT Database Manager
 * Manages immutable append-only measurement storage
 */
export class MPTDatabase {
  constructor(dbPath = './backend/data/dewcore.db') {
    // Ensure directory exists
    const dbDir = dirname(dbPath);
    mkdirSync(dbDir, { recursive: true });

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');  // Write-Ahead Logging for better concurrency
    this._initSchema();
  }

  /**
   * Initialize database schema from schema.sql
   * @private
   */
  _initSchema() {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute all SQL statements
    this.db.exec(schema);
  }

  /**
   * Insert a measurement (append-only)
   * @param {Object} measurement - Complete measurement data
   * @returns {number} Inserted row ID
   */
  insert(measurement) {
    const stmt = this.db.prepare(`
      INSERT INTO measurements (
        timestamp, hora,
        location_lat, location_lng, location_name,
        temp_aire, hr, presion, viento,
        temp_agua_fria, temp_agua_retorno, caudal_agua_dulce, potencia_bomba,
        temp_aire_salida, hr_salida,
        punto_rocio, humedad_absoluta, condensable_gm3,
        produccion_lph, ratio_eficiencia,
        energia_consumida, energia_ahorrada,
        delta_termico, margen_operabilidad,
        extraccion_empirica, pct_acierto,
        flag_rentable, flag_huella_nula, flag_efluentes, flag_operable,
        coste_litro, beneficio, ingresos, costes,
        ventaja_competitiva, roi_anios,
        flag_competitivo, flag_roi_aceptable
      ) VALUES (
        @timestamp, @hora,
        @location_lat, @location_lng, @location_name,
        @temp_aire, @hr, @presion, @viento,
        @temp_agua_fria, @temp_agua_retorno, @caudal_agua_dulce, @potencia_bomba,
        @temp_aire_salida, @hr_salida,
        @punto_rocio, @humedad_absoluta, @condensable_gm3,
        @produccion_lph, @ratio_eficiencia,
        @energia_consumida, @energia_ahorrada,
        @delta_termico, @margen_operabilidad,
        @extraccion_empirica, @pct_acierto,
        @flag_rentable, @flag_huella_nula, @flag_efluentes, @flag_operable,
        @coste_litro, @beneficio, @ingresos, @costes,
        @ventaja_competitiva, @roi_anios,
        @flag_competitivo, @flag_roi_aceptable
      )
    `);

    const info = stmt.run(measurement);
    return info.lastInsertRowid;
  }

  /**
   * Query measurements in a time range
   * @param {string} startISO - Start timestamp (ISO 8601)
   * @param {string} endISO - End timestamp (ISO 8601)
   * @returns {Array} Measurements in range
   */
  queryRange(startISO, endISO) {
    const stmt = this.db.prepare(`
      SELECT * FROM measurements
      WHERE timestamp BETWEEN ? AND ?
      ORDER BY timestamp ASC
    `);

    return stmt.all(startISO, endISO);
  }

  /**
   * Query last N measurements
   * @param {number} n - Number of measurements to retrieve
   * @returns {Array} Last n measurements
   */
  queryLast(n) {
    const stmt = this.db.prepare(`
      SELECT * FROM measurements
      ORDER BY id DESC
      LIMIT ?
    `);

    const results = stmt.all(n);
    return results.reverse();  // Return in chronological order
  }

  /**
   * Get database statistics
   * @returns {Object} Database stats (count, earliest, latest)
   */
  getStats() {
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM measurements');
    const rangeStmt = this.db.prepare(`
      SELECT
        MIN(timestamp) as earliest,
        MAX(timestamp) as latest
      FROM measurements
    `);

    const { count } = countStmt.get();
    const { earliest, latest } = rangeStmt.get();

    return {
      count,
      earliest,
      latest,
    };
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}
