// =========================================================================
// CALCULATIONS - Motor de cálculos termodinámicos + business
// =========================================================================

import { ECONOMICS } from '../constants';

const MAGNUS_A = 17.625;
const MAGNUS_B = 243.04;
const Q_LATENTE_KCAL_L = 540.0;
const KCAL_A_WH = 1.163;
const RV = 461.5;

// ===== TERMODINÁMICA (reutilizada del MLT) =====

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

// ===== CÁLCULOS DE NEGOCIO (nuevos para CMA) =====

/**
 * Calcula el coste por litro producido
 * @param {number} energiaConsumidaKwh - Energía consumida en kWh
 * @param {number} litrosProducidos - Litros de agua producidos
 * @returns {number} Coste en €/litro
 */
export function costePorLitro(energiaConsumidaKwh, litrosProducidos) {
  if (litrosProducidos === 0) return Infinity;
  const costeEnergia = energiaConsumidaKwh * ECONOMICS.precioElectricidad;
  // Añadir costes operacionales proporcionales (mantenimiento + químicos)
  const costeOperacional = (ECONOMICS.costeMantenimientoAnual / 365 / 24 + ECONOMICS.costeQuimicosMes / 30 / 24) / litrosProducidos;
  return (costeEnergia / litrosProducidos) + costeOperacional;
}

/**
 * Calcula el valor económico del agua producida
 * @param {number} litrosProducidos - Litros de agua producidos
 * @returns {number} Valor en €
 */
export function valorAguaProducida(litrosProducidos) {
  return litrosProducidos * ECONOMICS.precioAguaDesalada;
}

/**
 * Calcula el beneficio neto por hora
 * @param {number} litrosProducidos - Litros producidos en el periodo
 * @param {number} energiaConsumidaKwh - Energía consumida en kWh
 * @returns {object} {beneficio, ingresos, costes}
 */
export function beneficioNeto(litrosProducidos, energiaConsumidaKwh) {
  const ingresos = valorAguaProducida(litrosProducidos);
  const costeEnergia = energiaConsumidaKwh * ECONOMICS.precioElectricidad;
  const costeOperacional = (ECONOMICS.costeMantenimientoAnual / 365 / 24) + (ECONOMICS.costeQuimicosMes / 30 / 24);
  const costesTotales = costeEnergia + costeOperacional;

  return {
    beneficio: ingresos - costesTotales,
    ingresos,
    costes: costesTotales,
    costeEnergia,
    costeOperacional
  };
}

/**
 * Calcula el ROI simple (sin VAN)
 * @param {number} beneficioAnual - Beneficio anual en €
 * @returns {number} Años para recuperar inversión
 */
export function roiSimple(beneficioAnual) {
  if (beneficioAnual <= 0) return Infinity;
  return ECONOMICS.inversionInicial / beneficioAnual;
}

/**
 * Calcula proyección realista de producción
 * @param {array} historial - Array de objetos {hora, produccionLph}
 * @param {number} horasProyeccion - Horas a proyectar (default 24)
 * @returns {object} {proyeccion24h, proyeccionMensual, proyeccionAnual}
 */
export function proyeccionProduccion(historial, horasProyeccion = 24) {
  if (historial.length === 0) return { proyeccion24h: 0, proyeccionMensual: 0, proyeccionAnual: 0 };

  // Media móvil ponderada (últimas muestras tienen más peso)
  const ultimas = historial.slice(-Math.min(12, historial.length)); // Últimas 6 horas (12 muestras de 0.5h)
  const sumaProduccion = ultimas.reduce((sum, h) => sum + h.produccionLph, 0);
  const mediaProduccion = sumaProduccion / ultimas.length;

  // Proyección 24h (considerando variación circadiana)
  const factorCircadiano = 0.85; // Factor de corrección (no todo el día produce igual)
  const proyeccion24h = mediaProduccion * 24 * factorCircadiano;

  return {
    proyeccion24h,
    proyeccionMensual: proyeccion24h * 30,
    proyeccionAnual: proyeccion24h * 365,
    mediaActual: mediaProduccion
  };
}

/**
 * Calcula todos los resultados (termodinámica + business)
 */
export function calcularCMA(params) {
  // Cálculos termodinámicos (del MLT)
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

  // Cálculos de negocio (nuevos)
  const costeLitro = costePorLitro(energiaConsumida, litrosProducidos);
  const valorAgua = valorAguaProducida(litrosProducidos);
  const economia = beneficioNeto(litrosProducidos, energiaConsumida);
  const beneficioAnual = economia.beneficio * 24 * 365;
  const roiAnios = roiSimple(beneficioAnual);

  // Comparación con desalación
  const costeDesalacion = litrosProducidos * ECONOMICS.precioAguaDesalada;
  const ahorroVsDesalacion = costeDesalacion - economia.costes;
  const ventajaCompetitiva = ((costeDesalacion - costeLitro * litrosProducidos) / costeDesalacion) * 100;

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
    valorAgua,
    beneficio: economia.beneficio,
    ingresos: economia.ingresos,
    costes: economia.costes,
    costeEnergia: economia.costeEnergia,
    costeOperacional: economia.costeOperacional,
    beneficioAnual,
    roiAnios,

    // Comparativa
    costeDesalacion,
    ahorroVsDesalacion,
    ventajaCompetitiva,

    // Flags de negocio
    flagRentable: economia.beneficio > 0,
    flagCompetitivo: costeLitro < ECONOMICS.precioAguaDesalada,
    flagROIAceptable: roiAnios < (ECONOMICS.vidaUtilAnios / 2), // ROI en menos de la mitad de vida útil
  };
}
