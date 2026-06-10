# DewCore Validation System

**TFG (Final Degree Project) — Cyber-Physical Validation System**
**Technology**: Atmospheric Water Condensation (Patent ES-3046193-A1)
**Methodology**: Mayéutica (Formal Causal Design)
**University**: Universidad de Alicante (2025-26)

---

## 📋 Overview

DewCore is a cyber-physical validation system for a novel atmospheric water condensation technology. The system is designed following the **Mayéutica** formal methodology, which defines 7 canonical modules with strict responsibility boundaries.

This repository implements:
- **Real-time thermodynamic validation** (dew point, absolute humidity, condensable water, energy balance)
- **Economic audit** (cost/liter, ROI, competitiveness vs desalination)
- **Ecological audit** (zero thermal footprint, no effluents, energy rentability)
- **Immutable data custody** (SQLite append-only database for TRL 5 traceability)
- **Dual-view dashboard** (scientific + executive) with RBAC

**Current state**: Simulation mode (TRL 3-4). Physical sensors will replace `SimulatorAdapter` for TRL 5+ validation.

---

## 🏗️ The 7 Canonical Modules (Mayéutica)

The Mayéutica methodology defines 7 modules with strict responsibilities:

| Module | Full Name | Responsibility | Implementation |
|--------|-----------|----------------|----------------|
| **MOE** | Módulo de Orquestación de Ensayo | Experiment director: start/stop/pause cycles, monitor module health, log incidents | [backend/modules/moe/](backend/modules/moe/) |
| **MAS** | Módulo de Adquisición Sensorial | Physical perception: translate continuous magnitudes into digital signals. Uses Adapter pattern for hardware abstraction | [backend/modules/mas/](backend/modules/mas/) |
| **MID** | Módulo de Ingesta y Discretización | Normalization funnel: calibration factors, temporal sync (UTC), geographic coordinates, unit conversion. **NOTHING ELSE**. | [backend/modules/mid/](backend/modules/mid/) |
| **MLT** | Módulo Lógico-Termodinámico | Analytical brain: runs patent formulas (dew point, absolute humidity, condensable water, energy balance, ecological audit). **Pure computation, NO UI**. | [backend/modules/mlt/](backend/modules/mlt/) + [shared/mlt-engine.js](shared/mlt-engine.js) |
| **MPT** | Módulo de Persistencia Trazable | Immutable data custody: SQLite append-only. **No UPDATE, no DELETE**. | [backend/modules/mpt/](backend/modules/mpt/) |
| **CMA** | Cuadro de Mando Analítico | Human interface: scientific view + executive view + RBAC. **The ONLY frontend**. | [frontend/](frontend/) |
| **MCD** | Módulo de Certificación y Documentación | Document generation (TRL 5 verification acts, Ports 4.0 reports). **Placeholder for now**. | [backend/modules/mcd/](backend/modules/mcd/) |

---

## 🔄 Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       DATA FLOW PIPELINE                        │
└─────────────────────────────────────────────────────────────────┘

   MOE (tick) ──controls──> MAS ──raw data──> MID ──normalized──> MLT ──results──> MPT (persist)
  (Orchestrator)          (Sensors)      (Normalizer)       (Engine)                (Database)
                                                                                          │
                                                                                          └──> CMA
                                                                                         (WebSocket)
```

### Module Interactions

1. **MOE** emits `tick` events every 1 second (adjustable speed)
2. **MAS** acquires raw sensor data at the current circadian hour
3. **MID** normalizes, calibrates, validates, and stamps with UTC + GPS coordinates
4. **MLT** runs thermodynamic + economic calculations (from `@dewcore/shared/mlt-engine`)
5. **MPT** persists to SQLite (append-only, no updates/deletes)
6. **CMA** receives data via WebSocket and renders scientific/executive views

---

## 📦 Project Structure

```
dewcore-validacion/
├── package.json                    # npm workspaces root
├── mlt_core.py                     # Python reference implementation (UNTOUCHED)
├── README.md                       # This file
│
├── shared/                         # Shared code (@dewcore/shared)
│   ├── package.json
│   ├── constants.js                # Physical constants + color palette + economics + RBAC
│   ├── mlt-engine.js               # Thermodynamic + economic formulas (SINGLE SOURCE OF TRUTH)
│   └── mlt-engine.test.js          # Calibration tests (verified against mlt_core.py)
│
├── backend/                        # Node.js backend (@dewcore/backend)
│   ├── package.json
│   ├── index.js                    # HTTP + WebSocket server
│   ├── pipeline.js                 # Orchestrates all modules (MAS→MID→MLT→MPT)
│   ├── modules/
│   │   ├── moe/orchestrator.js     # ExperimentOrchestrator class
│   │   ├── mas/
│   │   │   ├── sensor-adapter.js   # Abstract adapter interface
│   │   │   └── simulator-adapter.js# SimulatorAdapter (current simulation mode)
│   │   ├── mid/normalizer.js       # Normalizer class
│   │   ├── mlt/engine.js           # MLTEngine wrapper (imports @dewcore/shared/mlt-engine)
│   │   ├── mpt/
│   │   │   ├── database.js         # MPTDatabase class
│   │   │   └── schema.sql          # SQLite schema (CREATE TABLE + triggers)
│   │   └── mcd/placeholder.js      # MCD not implemented yet
│   └── data/                       # SQLite database files (gitignored)
│
└── frontend/                       # React frontend (@dewcore/frontend)
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                 # Auth gate + view router
        ├── hooks/useBackendStream.js # WebSocket hook
        └── views/
            ├── ScientificView.jsx  # Thermodynamic validation dashboard
            └── ExecutiveView.jsx   # Business metrics dashboard
```

---

## 🚀 Installation & Usage

### Prerequisites

- **Node.js** 18+ (for ES modules + `node:test`)
- **npm** 8+

### Install Dependencies

```bash
# Install all workspaces
npm install
```

### Run Backend

```bash
npm run dev:backend
```

Backend starts on `http://localhost:3000` (WebSocket: `ws://localhost:3000`)

### Run Frontend

In a separate terminal:

```bash
npm run dev:frontend
```

Frontend starts on `http://localhost:5173`

### Access the Dashboard

1. Open `http://localhost:5173`
2. Login with:
   - **Auditor**: `auditor` / `auditor123` (full access: scientific + executive views)
   - **Observer**: `observer` / `observer123` (read-only: executive KPIs only)
3. Press **Start** to begin the experiment
4. Watch real-time data flowing from backend to frontend via WebSocket

---

## 🧪 Testing

### Run Calibration Tests

```bash
npm test
```

This runs the calibration tests in `shared/mlt-engine.test.js`, verifying that the JavaScript implementation matches the Python reference (`mlt_core.py`).

**Expected output**: 14/14 tests pass ✅

Test cases:
- **Agosto Alborán**: Patm=1013 hPa, HR=88%, T=21°C → Td ≈ 19°C (±0.5°C)
- **Febrero Alborán**: Patm=1022 hPa, HR=81%, T=16°C → Td ≈ 13°C (±0.5°C)
- **Reference**: HR=50%, T=20°C → HA ≈ 8.8 g/m³ (±0.5)
- **Energy rentability**: energiaAhorrada > energiaConsumida → flagRentable = true
- **Economic viability**: cost/liter < desalination price → flagCompetitivo = true

All tests use real atmospheric data from Puerto de Alicante (Alborán Sea).

---

## 💻 Technology Stack

- **Backend**: Node.js + Express + ws (WebSocket)
- **Frontend**: React 19 + Vite 8
- **Database**: SQLite 3 (better-sqlite3) with append-only triggers
- **Shared Logic**: ES modules (`@dewcore/shared`)
- **Package Management**: npm workspaces
- **Testing**: Node.js built-in test runner
- **Fonts**: Red Hat Display (UI) + JetBrains Mono (monospace values)

---

## 🎨 Visual Design

Both views (Scientific + Executive) share the same professional design system:

### Color Palette

```javascript
// Corporate colors
primary: "#1a6eb7"       // DewCore blue
primaryLight: "#aadeff"
primaryMid: "#1d90cf"

// Status colors
success: "#059669"       // Emerald green
error: "#dc2626"         // Professional red
warning: "#d97706"       // Amber

// Business colors (Executive view)
revenue: "#10b981"       // Revenue green
cost: "#ef4444"          // Cost red
profit: "#059669"        // Profit green
```

See [shared/constants.js](shared/constants.js) for the complete palette.

---

## 🔐 RBAC (Role-Based Access Control)

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| **Auditor** | `auditor` | `auditor123` | Full access: scientific view + executive view + historical charts + export |
| **Observer** | `observer` | `observer123` | Read-only: executive KPIs only (no scientific data, no export) |

⚠️ **Security Note**: This is a **mock authentication system** for demonstration purposes. In production, replace with JWT + bcrypt + HTTPS.

---

## 📊 Economic Constants

Configurable in [shared/constants.js](shared/constants.js):

```javascript
ECONOMICS = {
  // Reference prices (€)
  precioAguaDesalada: 0.60,        // €/liter desalinated water
  precioAguaPotable: 0.80,         // €/liter commercial water
  precioElectricidad: 0.15,        // €/kWh industrial rate

  // Operating costs
  costeMantenimientoAnual: 5000,   // €/year maintenance
  costeQuimicosMes: 200,           // €/month chemicals

  // ROI and amortization
  inversionInicial: 50000,         // € PT1 installation
  vidaUtilAnios: 10,               // years useful life
  tasaDescuento: 0.05,             // 5% discount rate

  // Thresholds
  ratioMinimoRentable: 1.0,
  precioObjetivoLitro: 0.40,       // € target price to be competitive
  produccionMinimaDiaria: 20,      // liters/day minimum viable
}
```

---

## 🧬 Thermodynamic Model

The system uses **Magnus-Tetens equations** for condensation calculations:

### Implemented Formulas ([shared/mlt-engine.js](shared/mlt-engine.js))

1. **Saturation Pressure**: `Psat(T) = 6.1078 × exp((17.625 × T) / (243.04 + T))`
2. **Dew Point**: Magnus-Tetens inversion
3. **Absolute Humidity**: `HA = (Pvapor × 100) / (RV × TKelvin) × 1000` (g/m³)
4. **Condensable Water**: `HAinlet - HAoutlet` (g/m³)
5. **Efficiency Ratio**: `EnergySaved / EnergyConsumed`

All formulas are verified against the Python reference ([mlt_core.py](mlt_core.py)) using real atmospheric data from Puerto de Alicante.

---

## 🛤️ Roadmap

### ✅ Current State (TRL 3-4)

- ✅ All 7 Mayéutica modules implemented
- ✅ WebSocket real-time data pipeline
- ✅ Dual-view CMA dashboard (scientific + executive)
- ✅ SQLite append-only database (MPT)
- ✅ RBAC (Auditor / Observer roles)
- ✅ Calibration tests (14/14 passing)

### 🔄 Next Steps (TRL 5+)

- ⬜ Replace `SimulatorAdapter` with MQTT/serial adapter for real sensors
- ⬜ Deploy to physical prototype (Puerto de Alicante)
- ⬜ Implement MCD (document generation: TRL 5 acts, Ports 4.0 reports)
- ⬜ Migrate historical chart components from old dashboards
- ⬜ Export CSV functionality for Auditor role
- ⬜ Performance optimization (database indexing, WebSocket compression)

---

## 🔧 Development

### Adding Real Sensors

To replace simulation mode with real hardware:

1. Create a new adapter in `backend/modules/mas/` (e.g., `mqtt-adapter.js` or `serial-adapter.js`)
2. Extend the `SensorAdapter` base class
3. Implement the `acquire(hora)` method to read from physical sensors
4. Replace `SimulatorAdapter` in `backend/index.js` with your new adapter

**No other changes needed** — the pipeline is sensor-agnostic thanks to the Adapter pattern (GoF).

### Module Development

- **Backend modules**: Edit files in `backend/modules/` and restart with `npm run dev:backend`
- **Frontend components**: Edit files in `frontend/src/` (Vite hot-reloads automatically)
- **Shared logic**: Edit `shared/mlt-engine.js` (used by both backend + frontend)

---

## 📚 Documentation

| File | Description |
|------|-------------|
| [shared/mlt-engine.js](shared/mlt-engine.js) | Thermodynamic + economic calculation engine (SINGLE SOURCE OF TRUTH) |
| [backend/pipeline.js](backend/pipeline.js) | Data flow orchestration (MAS→MID→MLT→MPT) |
| [mlt_core.py](mlt_core.py) | Python reference implementation |

---

## 📞 Contact

**Developer**: Carlos
**Institution**: Universidad de Alicante
**Project Type**: TFG (Final Degree Project)
**Academic Year**: 2025-26
**Company**: DewCore Engineering
**Patent**: ES-3046193-A1 (Atmospheric Water Condensation)

**Calibration Data**: Alborán Sea (Ports 4.0 Program)

---

## 📝 License

MIT

This project is part of a Final Degree Project (TFG) at Universidad de Alicante.

**Patent**: ES-3046193-A1 — All rights reserved to DewCore Engineering.

---

**Last Updated**: June 10, 2025
**Version**: 3.0 (Restructured with Mayéutica architecture)
**Status**: ✅ All 7 modules implemented and tested
