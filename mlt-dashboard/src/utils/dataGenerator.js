// =========================================================================
// DATA GENERATOR - Generador de datos simulados
// =========================================================================

export function generarDatosSimulados(hora) {
  const t = hora / 24;
  const tempAire = 22 + 6 * Math.sin(Math.PI * (t - 0.25));
  const hr = 75 + 15 * Math.cos(Math.PI * (t - 0.1));
  const viento = 2.5 + 2 * Math.sin(Math.PI * t * 2);

  return {
    tempAire: Math.round(tempAire * 10) / 10,
    hr: Math.min(98, Math.max(45, Math.round(hr * 10) / 10)),
    presion: 1013 + Math.round(Math.sin(t * Math.PI) * 3),
    viento: Math.round(viento * 10) / 10,
    tempAguaFria: 13.0 + Math.sin(t * Math.PI * 0.5) * 0.3,
    tempAguaRetorno: 13.4 + Math.sin(t * Math.PI * 0.5) * 0.3,
    caudalAguaFria: 10.0,
    caudalAguaDulce: 0.03 + 0.04 * Math.max(0, Math.sin(Math.PI * (t - 0.2))),
    potenciaBomba: 145 + 10 * Math.sin(t * Math.PI),
    tempAireSalida: 14.2 + Math.sin(t * Math.PI * 0.5) * 0.5,
    hrSalida: 99.5 + Math.random() * 0.5,
  };
}
