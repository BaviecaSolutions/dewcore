// =========================================================================
// CALCULATIONS - Motor de cálculos termodinámicos
// =========================================================================

import { MAGNUS_A, MAGNUS_B, Q_LATENTE_KCAL_L, KCAL_A_WH, RV } from '../constants';

export function presionSaturacion(tempC) {
  return 6.1078 * Math.exp((MAGNUS_A * tempC) / (MAGNUS_B + tempC));
}

export function puntoRocio(tempC, hrPct) {
  const hrFrac = hrPct / 100.0;
  const gamma = Math.log(hrFrac) + (MAGNUS_A * tempC) / (MAGNUS_B + tempC);
  return (MAGNUS_B * gamma) / (MAGNUS_A - gamma);
}

export function humedadAbsoluta(tempC, hrPct, presionHpa) {
  const tKelvin = tempC + 273.15;
  const es = presionSaturacion(tempC);
  const pv = es * (hrPct / 100.0);
  return (pv * 100.0) / (RV * tKelvin) * 1000.0;
}

export function aguaCondensable(tempAire, hr, presion, tempCond) {
  const haEntrada = humedadAbsoluta(tempAire, hr, presion);
  const haSalida = humedadAbsoluta(tempCond, 100.0, presion);
  return Math.max(0, haEntrada - haSalida);
}

export function calcularMLT(params) {
  const tempCond = params.tempCondensadorMedida ?? (params.tempAguaFria + 1.0);
  const td = puntoRocio(params.tempAire, params.hr);
  const ha = humedadAbsoluta(params.tempAire, params.hr, params.presion);
  const condensableGm3 = aguaCondensable(params.tempAire, params.hr, params.presion, tempCond);
  const litrosPorM3 = condensableGm3 / 1000.0;

  const produccionLph = params.caudalAireM3h ? litrosPorM3 * params.caudalAireM3h : null;

  const energiaConsumida = params.potenciaBomba * params.periodoHoras;
  const litrosProducidos = params.caudalAguaDulceLpm * 60 * params.periodoHoras;
  const energiaAhorrada = Q_LATENTE_KCAL_L * litrosProducidos * KCAL_A_WH;
  const ratioEficiencia = energiaConsumida > 0 ? energiaAhorrada / energiaConsumida : Infinity;

  const deltaTerm = Math.abs(params.tempAguaFria - params.tempAguaRetorno);
  const margenOp = td - params.tempAguaFria;

  let extraccionEmpirica = null;
  let pctAcierto = null;
  if (params.tempAireSalida != null && params.hrSalida != null) {
    const haEnt = humedadAbsoluta(params.tempAire, params.hr, params.presion);
    const haSal = humedadAbsoluta(params.tempAireSalida, params.hrSalida, params.presion);
    extraccionEmpirica = Math.max(0, haEnt - haSal);
    if (condensableGm3 > 0) pctAcierto = (extraccionEmpirica / condensableGm3) * 100;
  }

  return {
    tempCondensador: tempCond,
    condMedida: params.tempCondensadorMedida != null,
    puntoRocio: td,
    humedadAbsoluta: ha,
    condensableGm3,
    litrosPorM3,
    produccionLph,
    deltaEnfriamiento: params.tempAire - td,
    energiaConsumida,
    energiaAhorrada,
    litrosProducidos,
    ratioEficiencia,
    flagRentable: energiaConsumida < energiaAhorrada,
    deltaTermico: deltaTerm,
    flagHuellaNula: deltaTerm <= 0.5,
    flagEfluentes: true,
    margenOperabilidad: margenOp,
    flagOperable: td > params.tempAguaFria,
    extraccionEmpirica,
    pctAcierto,
  };
}
