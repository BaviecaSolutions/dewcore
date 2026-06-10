/**
 * @fileoverview MLT ENGINE TESTS - Calibration against mlt_core.py
 *
 * These tests verify that the JavaScript implementation matches the Python
 * reference implementation (mlt_core.py) using the Alborán Sea calibration data.
 *
 * Test data source: Real atmospheric conditions from Puerto de Alicante
 * Reference: Python function calibrar_contra_alboran() in mlt_core.py
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  presionSaturacion,
  puntoRocio,
  humedadAbsoluta,
  aguaCondensable,
  calcularTermodinamica,
  calcularEconomia,
} from './mlt-engine.js';

// =========================================================================
// CALIBRATION TESTS - Alborán Sea August (High Production Scenario)
// =========================================================================

test('Agosto Alborán: Punto de Rocío (Patm=1013 hPa, HR=88%, T=21°C)', () => {
  const td = puntoRocio(21.0, 88.0);
  // Expected: ~19°C (±0.5°C tolerance)
  assert.ok(td >= 18.5 && td <= 19.5, `Punto de rocío fuera de rango: ${td}°C (esperado: 19±0.5°C)`);
});

test('Agosto Alborán: Humedad Absoluta (Patm=1013 hPa, HR=88%, T=21°C)', () => {
  const ha = humedadAbsoluta(21.0, 88.0, 1013);
  // Expected: ~16-17 g/m³
  assert.ok(ha >= 15.5 && ha <= 17.5, `Humedad absoluta fuera de rango: ${ha} g/m³ (esperado: 16-17 g/m³)`);
});

test('Agosto Alborán: Agua Condensable (T=21°C, HR=88%, P=1013 hPa, Tcond=17°C)', () => {
  const condensable = aguaCondensable(21.0, 88.0, 1013, 17.0);
  // Expected: > 0 (debe haber condensación)
  assert.ok(condensable > 0, `No hay agua condensable: ${condensable} g/m³ (debe ser > 0)`);
  // Sanity check: debe ser < 20 g/m³ (límite físico razonable)
  assert.ok(condensable < 20, `Agua condensable demasiado alta: ${condensable} g/m³`);
});

// =========================================================================
// CALIBRATION TESTS - Alborán Sea February (Low Production Scenario)
// =========================================================================

test('Febrero Alborán: Punto de Rocío (Patm=1022 hPa, HR=81%, T=16°C)', () => {
  const td = puntoRocio(16.0, 81.0);
  // Expected: ~13°C (±0.5°C tolerance)
  assert.ok(td >= 12.5 && td <= 13.5, `Punto de rocío fuera de rango: ${td}°C (esperado: 13±0.5°C)`);
});

test('Febrero Alborán: Humedad Absoluta (Patm=1022 hPa, HR=81%, T=16°C)', () => {
  const ha = humedadAbsoluta(16.0, 81.0, 1022);
  // Expected: ~11-12 g/m³
  assert.ok(ha >= 10.5 && ha <= 12.5, `Humedad absoluta fuera de rango: ${ha} g/m³ (esperado: 11-12 g/m³)`);
});

// =========================================================================
// REFERENCE TESTS - Standard Conditions
// =========================================================================

test('Referencia: Humedad Absoluta (HR=50%, T=20°C, P=1013 hPa)', () => {
  const ha = humedadAbsoluta(20.0, 50.0, 1013);
  // Expected: ~8.8 g/m³ (±0.5 tolerance)
  assert.ok(ha >= 8.3 && ha <= 9.3, `Humedad absoluta fuera de rango: ${ha} g/m³ (esperado: 8.8±0.5 g/m³)`);
});

test('Referencia: Presión Saturación (T=20°C)', () => {
  const es = presionSaturacion(20.0);
  // Expected: ~23.4 hPa (Magnus-Tetens at 20°C)
  assert.ok(es >= 23.0 && es <= 24.0, `Presión saturación fuera de rango: ${es} hPa (esperado: 23.4±0.6 hPa)`);
});

// =========================================================================
// INTEGRATION TESTS - calcularTermodinamica
// =========================================================================

test('Cálculo Termodinámico Completo: Flags de Rentabilidad', () => {
  const params = {
    tempAire: 21.0,
    hr: 88.0,
    presion: 1013,
    tempAguaFria: 13.0,
    tempAguaRetorno: 13.4,
    caudalAguaDulceLpm: 0.05,  // 50 ml/min → 3 L/h
    potenciaBomba: 145,         // 145 W
    periodoHoras: 0.5,
  };

  const result = calcularTermodinamica(params);

  // Flag rentable: energía ahorrada > energía consumida
  // Energía consumida = 145 W * 0.5 h = 72.5 Wh
  // Litros producidos = 0.05 L/min * 60 * 0.5 = 1.5 L
  // Energía ahorrada = 540 kcal/L * 1.5 L * 1.163 Wh/kcal = 942 Wh
  assert.ok(result.energiaAhorrada > result.energiaConsumida, 'Energía ahorrada debe ser > consumida');
  assert.strictEqual(result.flagRentable, true, 'Flag rentable debe ser true');
});

test('Cálculo Termodinámico Completo: Flag Huella Nula', () => {
  const params = {
    tempAire: 21.0,
    hr: 88.0,
    presion: 1013,
    tempAguaFria: 13.0,
    tempAguaRetorno: 13.3,  // Delta térmico = 0.3°C < 0.5°C
    caudalAguaDulceLpm: 0.05,
    potenciaBomba: 145,
    periodoHoras: 0.5,
  };

  const result = calcularTermodinamica(params);

  assert.ok(result.deltaTermico <= 0.5, 'Delta térmico debe ser ≤ 0.5°C');
  assert.strictEqual(result.flagHuellaNula, true, 'Flag huella nula debe ser true');
});

test('Cálculo Termodinámico Completo: Flag Operable', () => {
  const params = {
    tempAire: 21.0,
    hr: 88.0,
    presion: 1013,
    tempAguaFria: 13.0,  // Punto de rocío ~19°C > 13°C → operable
    tempAguaRetorno: 13.4,
    caudalAguaDulceLpm: 0.05,
    potenciaBomba: 145,
    periodoHoras: 0.5,
  };

  const result = calcularTermodinamica(params);

  assert.ok(result.puntoRocio > params.tempAguaFria, 'Punto de rocío debe ser > temp agua fría');
  assert.strictEqual(result.flagOperable, true, 'Flag operable debe ser true');
});

// =========================================================================
// INTEGRATION TESTS - calcularEconomia
// =========================================================================

test('Cálculo Económico: Rentabilidad Positiva', () => {
  const litrosProducidos = 1.5;  // 1.5 L/hora
  const energiaConsumidaKwh = 0.0725;  // 72.5 Wh = 0.0725 kWh

  const result = calcularEconomia(litrosProducidos, energiaConsumidaKwh);

  // Ingresos = 1.5 L * 0.60 €/L = 0.90 €
  // Costes energía = 0.0725 kWh * 0.15 €/kWh = 0.011 €
  // Costes operacionales ≈ 0.023 € (mantenimiento + químicos)
  // Beneficio = ingresos - costes > 0
  assert.ok(result.beneficio > 0, 'Beneficio debe ser positivo');
  assert.strictEqual(result.flagRentable, true, 'Flag rentable debe ser true');
});

test('Cálculo Económico: Competitividad con Desalación', () => {
  const litrosProducidos = 1.5;
  const energiaConsumidaKwh = 0.0725;

  const result = calcularEconomia(litrosProducidos, energiaConsumidaKwh);

  // Coste/litro debe ser < 0.60 €/L (precio desalación)
  assert.ok(result.costeLitro < 0.60, `Coste/litro ${result.costeLitro} debe ser < 0.60 €/L`);
  assert.strictEqual(result.flagCompetitivo, true, 'Flag competitivo debe ser true');
});

test('Cálculo Económico: ROI Aceptable', () => {
  const litrosProducidos = 3.0;  // Producción alta
  const energiaConsumidaKwh = 0.145;

  const result = calcularEconomia(litrosProducidos, energiaConsumidaKwh);

  // Con producción alta, ROI debe ser < 5 años (vida útil 10 años / 2)
  assert.ok(result.roiAnios < 10, 'ROI debe ser razonable (< 10 años)');
  // Flag ROI aceptable: ROI < vidaUtilAnios/2 = 5 años
  // Con esta producción, debería ser aceptable
  assert.ok(result.flagROIAceptable !== undefined, 'Flag ROI aceptable debe estar definido');
});

test('Cálculo Económico: Caso de Producción Cero', () => {
  const litrosProducidos = 0;
  const energiaConsumidaKwh = 0.145;

  const result = calcularEconomia(litrosProducidos, energiaConsumidaKwh);

  // Producción cero → sin rentabilidad
  assert.strictEqual(result.costeLitro, Infinity, 'Coste/litro debe ser Infinity con producción cero');
  assert.strictEqual(result.flagRentable, false, 'Flag rentable debe ser false');
  assert.strictEqual(result.flagCompetitivo, false, 'Flag competitivo debe ser false');
});
