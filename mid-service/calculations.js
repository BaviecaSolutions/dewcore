// =========================================================================
// CALCULATIONS - Motor de cálculos termodinámicos + business (MID Service)
// =========================================================================

const MAGNUS_A = 17.625;
const MAGNUS_B = 243.04;
const Q_LATENTE_KCAL_L = 540.0;
const KCAL_A_WH = 1.163;
const RV = 461.5;

// Constantes económicas (inline para no depender de módulos React)
const ECONOMICS = {
  precioAguaDesalada: 0.60,
  precioElectricidad: 0.15,
  costeMantenimientoAnual: 5000,
  costeQuimicosMes: 200,
  inversionInicial: 50000,
  vidaUtilAnios: 10,
};

// ===== TERMODINÁMICA =====

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

// ===== CÁLCULOS MLT (Científicos) =====

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

// ===== CÁLCULOS CMA (Económicos) =====

export function calcularCMA(params) {
  // Reutilizar cálculos MLT
  const tempCond = params.tempCondensadorMedida ?? (params.tempAguaFria + 1.0);
  const td = puntoRocio(params.tempAire, params.hr);
  const ha = humedadAbsoluta(params.tempAire, params.hr, params.presion);
  const condensableGm3 = aguaCondensable(params.tempAire, params.hr, params.presion, tempCond);
  const litrosPorM3 = condensableGm3 / 1000.0;

  const produccionLph = params.caudalAireM3h ? litrosPorM3 * params.caudalAireM3h : null;

  const energiaConsumida = params.potenciaBomba * params.periodoHoras / 1000; // kWh
  const litrosProducidos = params.caudalAguaDulceLpm * 60 * params.periodoHoras;
  const energiaAhorrada = Q_LATENTE_KCAL_L * litrosProducidos * KCAL_A_WH;
  const ratioEficiencia = energiaConsumida > 0 ? energiaAhorrada / (energiaConsumida * 1000) : Infinity;

  // Cálculos económicos
  const costeEnergia = energiaConsumida * ECONOMICS.precioElectricidad;
  const costeOperacional = (ECONOMICS.costeMantenimientoAnual / 365 / 24) + (ECONOMICS.costeQuimicosMes / 30 / 24);
  const costesTotales = costeEnergia + costeOperacional;

  const costeLitro = litrosProducidos > 0 ? costesTotales / litrosProducidos : Infinity;
  const ingresos = litrosProducidos * ECONOMICS.precioAguaDesalada;
  const beneficio = ingresos - costesTotales;
  const beneficioAnual = beneficio * 24 * 365;
  const roiAnios = beneficioAnual > 0 ? ECONOMICS.inversionInicial / beneficioAnual : Infinity;

  const costeDesalacion = litrosProducidos * ECONOMICS.precioAguaDesalada;
  const ahorroVsDesalacion = costeDesalacion - costesTotales;
  const ventajaCompetitiva = costeDesalacion > 0 ? ((costeDesalacion - costeLitro * litrosProducidos) / costeDesalacion) * 100 : 0;

  return {
    // Termodinámica
    tempCondensador: tempCond,
    puntoRocio: td,
    humedadAbsoluta: ha,
    condensableGm3,
    produccionLph,
    litrosProducidos,
    energiaConsumida,
    ratioEficiencia,

    // Business
    costeLitro,
    valorAgua: ingresos,
    beneficio,
    ingresos,
    costes: costesTotales,
    costeEnergia,
    costeOperacional,
    beneficioAnual,
    roiAnios,

    // Comparativa
    costeDesalacion,
    ahorroVsDesalacion,
    ventajaCompetitiva,

    // Flags
    flagRentable: beneficio > 0,
    flagCompetitivo: costeLitro < ECONOMICS.precioAguaDesalada,
    flagROIAceptable: roiAnios < (ECONOMICS.vidaUtilAnios / 2),
  };
}
