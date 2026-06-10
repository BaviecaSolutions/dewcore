/**
 * @fileoverview MLT ENGINE - Thermodynamic and Economic Calculation Engine
 *
 * This is the SINGLE SOURCE OF TRUTH for all thermodynamic and economic calculations
 * in the DewCore validation system. Corresponds to the Python reference implementation
 * in mlt_core.py.
 *
 * Mayéutica Module: MLT (Módulo Lógico-Termodinámico)
 * Responsibilities: Pure computation of thermodynamic formulas and economic audit
 * Mayéutica Functionalities: F06, F14, F15, F16, F17, F18, F19, F20
 * Dependencies: @dewcore/shared/constants
 */

import { MAGNUS_A, MAGNUS_B, Q_LATENTE_KCAL_L, KCAL_A_WH, RV, ECONOMICS } from './constants.js';

// =========================================================================
// THERMODYNAMIC CALCULATIONS
// =========================================================================

/**
 * Calculates saturation pressure using Magnus-Tetens equation
 * @param {number} tempC - Air temperature in °C
 * @returns {number} Saturation pressure in hPa
 * @see Mayéutica F14 - Thermodynamic validation
 */
export function presionSaturacion(tempC) {
  return 6.1078 * Math.exp((MAGNUS_A * tempC) / (MAGNUS_B + tempC));
}

/**
 * Calculates dew point temperature (Magnus-Tetens inversion)
 * @param {number} tempC - Air temperature in °C
 * @param {number} hrPct - Relative humidity in %
 * @returns {number} Dew point temperature in °C
 * @see Mayéutica F14 - Thermodynamic validation
 */
export function puntoRocio(tempC, hrPct) {
  const hrFrac = hrPct / 100.0;
  const gamma = Math.log(hrFrac) + (MAGNUS_A * tempC) / (MAGNUS_B + tempC);
  return (MAGNUS_B * gamma) / (MAGNUS_A - gamma);
}

/**
 * Calculates absolute humidity
 * @param {number} tempC - Air temperature in °C
 * @param {number} hrPct - Relative humidity in %
 * @param {number} presionHpa - Atmospheric pressure in hPa
 * @returns {number} Absolute humidity in g/m³
 * @see Mayéutica F14 - Thermodynamic validation
 */
export function humedadAbsoluta(tempC, hrPct, presionHpa) {
  const tKelvin = tempC + 273.15;
  const es = presionSaturacion(tempC);
  const pv = es * (hrPct / 100.0);
  return (pv * 100.0) / (RV * tKelvin) * 1000.0;
}

/**
 * Calculates condensable water (theoretical model)
 * @param {number} tempAire - Inlet air temperature in °C
 * @param {number} hr - Relative humidity in %
 * @param {number} presion - Atmospheric pressure in hPa
 * @param {number} tempCond - Condensation surface temperature in °C
 * @returns {number} Condensable water in g/m³
 * @see Mayéutica F15 - Production model
 */
export function aguaCondensable(tempAire, hr, presion, tempCond) {
  const haEntrada = humedadAbsoluta(tempAire, hr, presion);
  const haSalida = humedadAbsoluta(tempCond, 100.0, presion);
  return Math.max(0, haEntrada - haSalida);
}

/**
 * Comprehensive thermodynamic calculation
 * @param {Object} params - Input parameters
 * @param {number} params.tempAire - Air temperature °C
 * @param {number} params.hr - Relative humidity %
 * @param {number} params.presion - Atmospheric pressure hPa
 * @param {number} params.tempAguaFria - Cold water temperature °C
 * @param {number} params.tempAguaRetorno - Return water temperature °C
 * @param {number} params.caudalAguaDulceLpm - Fresh water flow L/min
 * @param {number} params.potenciaBomba - Pump power W
 * @param {number} [params.tempAireSalida] - Outlet air temperature °C (optional)
 * @param {number} [params.hrSalida] - Outlet humidity % (optional)
 * @param {number} [params.tempCondensadorMedida] - Measured condenser temp °C (optional)
 * @param {number} [params.caudalAireM3h] - Air flow m³/h (optional)
 * @param {number} [params.periodoHoras=0.5] - Period duration in hours
 * @returns {Object} Thermodynamic results + flags
 * @see Mayéutica F06, F14, F15, F16, F17, F18
 */
export function calcularTermodinamica(params) {
  const periodoHoras = params.periodoHoras ?? 0.5;

  // Condensation temperature (measured or estimated)
  const tempCond = params.tempCondensadorMedida ?? (params.tempAguaFria + 1.0);

  // Basic thermodynamic calculations
  const td = puntoRocio(params.tempAire, params.hr);
  const ha = humedadAbsoluta(params.tempAire, params.hr, params.presion);
  const condensableGm3 = aguaCondensable(params.tempAire, params.hr, params.presion, tempCond);
  const litrosPorM3 = condensableGm3 / 1000.0;

  // Theoretical production (if air flow is known)
  const produccionLph = params.caudalAireM3h ? litrosPorM3 * params.caudalAireM3h : null;

  // Energy balance
  const energiaConsumida = params.potenciaBomba * periodoHoras;  // Wh
  const litrosProducidos = params.caudalAguaDulceLpm * 60 * periodoHoras;
  const energiaAhorrada = Q_LATENTE_KCAL_L * litrosProducidos * KCAL_A_WH;  // Wh
  const ratioEficiencia = energiaConsumida > 0 ? energiaAhorrada / energiaConsumida : Infinity;

  // Thermal deltas
  const deltaTerm = Math.abs(params.tempAguaFria - params.tempAguaRetorno);
  const margenOp = td - params.tempAguaFria;

  // Model validation (empirical vs theoretical)
  let extraccionEmpirica = null;
  let pctAcierto = null;
  if (params.tempAireSalida != null && params.hrSalida != null) {
    const haEnt = humedadAbsoluta(params.tempAire, params.hr, params.presion);
    const haSal = humedadAbsoluta(params.tempAireSalida, params.hrSalida, params.presion);
    extraccionEmpirica = Math.max(0, haEnt - haSal);
    if (condensableGm3 > 0) {
      pctAcierto = (extraccionEmpirica / condensableGm3) * 100;
    }
  }

  // Audit flags (ecological and operational)
  const flagRentable = energiaConsumida < energiaAhorrada;
  const flagHuellaNula = deltaTerm <= 0.5;  // Thermal footprint negligible
  const flagEfluentes = true;  // No chemical effluents (always true for this technology)
  const flagOperable = td > params.tempAguaFria;  // Operable if dew point > cold water temp

  return {
    // Thermodynamic state
    puntoRocio: td,
    humedadAbsoluta: ha,
    condensableGm3,
    litrosPorM3,
    produccionLph,

    // Energy balance
    energiaConsumida,  // Wh
    energiaAhorrada,   // Wh
    litrosProducidos,
    ratioEficiencia,

    // Thermal analysis
    deltaTermico: deltaTerm,
    margenOperabilidad: margenOp,

    // Model validation
    extraccionEmpirica,
    pctAcierto,

    // Audit flags
    flagRentable,
    flagHuellaNula,
    flagEfluentes,
    flagOperable,

    // Metadata
    tempCondensador: tempCond,
    condMedida: params.tempCondensadorMedida != null,
  };
}

// =========================================================================
// ECONOMIC CALCULATIONS
// =========================================================================

/**
 * Comprehensive economic calculation
 * @param {number} litrosProducidos - Liters of water produced
 * @param {number} energiaConsumidaKwh - Energy consumed in kWh
 * @returns {Object} Economic results + business flags
 * @see Mayéutica F19, F20 - Economic audit
 */
export function calcularEconomia(litrosProducidos, energiaConsumidaKwh) {
  // Avoid division by zero
  if (litrosProducidos === 0) {
    return {
      costeLitro: Infinity,
      ingresos: 0,
      costes: 0,
      costeEnergia: energiaConsumidaKwh * ECONOMICS.precioElectricidad,
      costeOperacional: 0,
      beneficio: 0,
      beneficioAnual: 0,
      roiAnios: Infinity,
      ventajaCompetitiva: -100,
      flagRentable: false,
      flagCompetitivo: false,
      flagROIAceptable: false,
    };
  }

  // Revenue (value of water produced)
  const ingresos = litrosProducidos * ECONOMICS.precioAguaDesalada;

  // Operating costs
  const costeEnergia = energiaConsumidaKwh * ECONOMICS.precioElectricidad;
  const costeOperacional =
    (ECONOMICS.costeMantenimientoAnual / 365 / 24) +
    (ECONOMICS.costeQuimicosMes / 30 / 24);

  const costesTotales = costeEnergia + costeOperacional;
  const costeLitro = costesTotales / litrosProducidos;

  // Profitability
  const beneficio = ingresos - costesTotales;
  const beneficioAnual = beneficio * 24 * 365;

  // ROI (Return on Investment)
  const roiAnios = beneficioAnual > 0
    ? ECONOMICS.inversionInicial / beneficioAnual
    : Infinity;

  // Competitive advantage vs desalination
  const costeDesalacion = litrosProducidos * ECONOMICS.precioAguaDesalada;
  const ventajaCompetitiva = ((costeDesalacion - costesTotales) / costeDesalacion) * 100;

  // Business flags
  const flagRentable = beneficio > 0;
  const flagCompetitivo = costeLitro < ECONOMICS.precioAguaDesalada;
  const flagROIAceptable = roiAnios < (ECONOMICS.vidaUtilAnios / 2);

  return {
    // Costs
    costeLitro,
    costes: costesTotales,
    costeEnergia,
    costeOperacional,

    // Revenue and profit
    ingresos,
    beneficio,
    beneficioAnual,

    // Investment analysis
    roiAnios,
    ventajaCompetitiva,

    // Business flags
    flagRentable,
    flagCompetitivo,
    flagROIAceptable,
  };
}
