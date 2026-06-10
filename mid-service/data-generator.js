// =========================================================================
// DATA GENERATOR - Generador de datos simulados (ciclo circadiano 24h)
// =========================================================================

/**
 * Genera datos atmosféricos y operacionales simulados para una hora específica
 * Simula el ciclo circadiano de 24 horas con variaciones realistas
 * @param {number} hora - Hora del día (0-24)
 * @returns {object} Datos simulados
 */
export function generarDatosSimulados(hora) {
  const t = hora / 24; // Normalizado 0-1

  // Temperatura aire: 16°C (noche) a 28°C (mediodía)
  const tempAire = 22 + 6 * Math.sin(Math.PI * (t - 0.25));

  // Humedad relativa: 60% (mediodía) a 90% (madrugada)
  const hr = 75 + 15 * Math.cos(Math.PI * (t - 0.1));

  // Viento: más intenso por la tarde
  const viento = 2.5 + 2 * Math.sin(Math.PI * t * 2);

  // Temperatura agua profunda: casi constante (13-13.6°C)
  const tempAguaFria = 13.0 + Math.sin(t * Math.PI * 0.5) * 0.3;
  const tempAguaRetorno = 13.4 + Math.sin(t * Math.PI * 0.5) * 0.3;

  // Caudal agua dulce producida: mayor a mediodía (mayor humedad + temperatura)
  const caudalAguaDulce = 0.03 + 0.04 * Math.max(0, Math.sin(Math.PI * (t - 0.2)));

  // Potencia bomba: ligeramente variable
  const potenciaBomba = 145 + 10 * Math.sin(t * Math.PI);

  // Condiciones de salida del aire (después del condensador)
  const tempAireSalida = 14.2 + Math.sin(t * Math.PI * 0.5) * 0.5;
  const hrSalida = 99.5 + Math.random() * 0.5; // Siempre saturado

  return {
    tempAire: Math.round(tempAire * 10) / 10,
    hr: Math.min(98, Math.max(45, Math.round(hr * 10) / 10)),
    presion: 1013 + Math.round(Math.sin(t * Math.PI) * 3),
    viento: Math.round(viento * 10) / 10,
    tempAguaFria: Math.round(tempAguaFria * 100) / 100,
    tempAguaRetorno: Math.round(tempAguaRetorno * 100) / 100,
    caudalAguaFria: 10.0,
    caudalAguaDulce: Math.round(caudalAguaDulce * 1000) / 1000,
    potenciaBomba: Math.round(potenciaBomba),
    tempAireSalida: Math.round(tempAireSalida * 100) / 100,
    hrSalida: Math.round(hrSalida * 10) / 10,
  };
}
