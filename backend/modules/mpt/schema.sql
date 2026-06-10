-- =========================================================================
-- MPT - Módulo de Persistencia Trazable
-- Schema Definition for Immutable Data Custody
-- =========================================================================
--
-- APPEND-ONLY DATABASE: No UPDATE, no DELETE allowed (enforced by triggers)
-- All data is timestamped and traceable for TRL 5 verification
--
-- Mayéutica Module: MPT (Traceable Persistence)
-- Mayéutica Functionalities: F11, F12, F13 (data persistence and traceability)
-- =========================================================================

CREATE TABLE IF NOT EXISTS measurements (
  -- Primary key
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Temporal metadata
  timestamp TEXT NOT NULL,              -- ISO 8601 UTC timestamp
  hora REAL NOT NULL,                   -- Circadian hour (0.0 - 24.0)

  -- Geographic metadata (from MID normalization)
  location_lat REAL,
  location_lng REAL,
  location_name TEXT,

  -- Raw (normalized) atmospheric data
  temp_aire REAL,                       -- Air temperature (°C)
  hr REAL,                              -- Relative humidity (%)
  presion REAL,                         -- Atmospheric pressure (hPa)
  viento REAL,                          -- Wind speed (m/s)

  -- Raw (normalized) hydraulic data
  temp_agua_fria REAL,                  -- Cold water temperature (°C)
  temp_agua_retorno REAL,               -- Return water temperature (°C)
  caudal_agua_dulce REAL,               -- Fresh water flow (L/min)
  potencia_bomba REAL,                  -- Pump power (W)

  -- Raw (normalized) air output data
  temp_aire_salida REAL,                -- Outlet air temperature (°C)
  hr_salida REAL,                       -- Outlet humidity (%)

  -- MLT computed: thermodynamic results
  punto_rocio REAL,                     -- Dew point (°C)
  humedad_absoluta REAL,                -- Absolute humidity (g/m³)
  condensable_gm3 REAL,                 -- Condensable water (g/m³)
  produccion_lph REAL,                  -- Production (L/h)
  ratio_eficiencia REAL,                -- Efficiency ratio (dimensionless)
  energia_consumida REAL,               -- Energy consumed (Wh)
  energia_ahorrada REAL,                -- Energy saved (Wh)
  delta_termico REAL,                   -- Thermal delta (°C)
  margen_operabilidad REAL,             -- Operability margin (°C)
  extraccion_empirica REAL,             -- Empirical extraction (g/m³)
  pct_acierto REAL,                     -- Model accuracy (%)

  -- MLT computed: ecological audit flags
  flag_rentable INTEGER,                -- Energy rentable (boolean 0/1)
  flag_huella_nula INTEGER,             -- Zero thermal footprint (boolean 0/1)
  flag_efluentes INTEGER,               -- No effluents (boolean 0/1)
  flag_operable INTEGER,                -- Operable conditions (boolean 0/1)

  -- MLT computed: economic results
  coste_litro REAL,                     -- Cost per liter (€/L)
  beneficio REAL,                       -- Profit (€)
  ingresos REAL,                        -- Revenue (€)
  costes REAL,                          -- Total costs (€)
  ventaja_competitiva REAL,             -- Competitive advantage vs desalination (%)
  roi_anios REAL,                       -- ROI (years)
  flag_competitivo INTEGER,             -- Competitive flag (boolean 0/1)
  flag_roi_aceptable INTEGER            -- ROI acceptable flag (boolean 0/1)
);

-- =========================================================================
-- APPEND-ONLY ENFORCEMENT: Block UPDATE and DELETE operations
-- =========================================================================

CREATE TRIGGER IF NOT EXISTS prevent_update
BEFORE UPDATE ON measurements
BEGIN
  SELECT RAISE(ABORT, 'MPT: UPDATE operations are blocked. This is an append-only store for traceability.');
END;

CREATE TRIGGER IF NOT EXISTS prevent_delete
BEFORE DELETE ON measurements
BEGIN
  SELECT RAISE(ABORT, 'MPT: DELETE operations are blocked. This is an append-only store for traceability.');
END;

-- =========================================================================
-- INDEXES for query performance
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_timestamp ON measurements(timestamp);
CREATE INDEX IF NOT EXISTS idx_hora ON measurements(hora);
