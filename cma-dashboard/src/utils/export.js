// =========================================================================
// EXPORT - Funciones de exportación de datos (CSV, Excel-compatible)
// =========================================================================

/**
 * Convierte array de objetos a formato CSV
 * @param {array} data - Array de objetos
 * @param {array} columns - Array de nombres de columnas (opcional)
 * @returns {string} CSV string
 */
export function toCSV(data, columns = null) {
  if (data.length === 0) return '';

  // Si no se especifican columnas, usar todas las keys del primer objeto
  const cols = columns || Object.keys(data[0]);

  // Header
  const header = cols.join(',');

  // Rows
  const rows = data.map(row => {
    return cols.map(col => {
      const value = row[col];
      // Escapar comillas y envolver en comillas si contiene comas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Descarga un CSV desde el navegador
 * @param {string} csvContent - Contenido CSV
 * @param {string} filename - Nombre del archivo
 */
export function downloadCSV(csvContent, filename = 'export.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convierte historial a formato tabular para export
 * @param {array} history - Array de {hora, produccionLph, beneficio, costeLitro, ...}
 * @returns {array} Array de objetos con formato amigable
 */
export function prepareHistoryForExport(history) {
  return history.map(h => ({
    'Hora': h.hora.toFixed(1),
    'Producción (l/h)': h.produccionLph?.toFixed(3) || '0.000',
    'Beneficio (€/h)': h.beneficio?.toFixed(2) || '0.00',
    'Coste (€/l)': h.costeLitro?.toFixed(4) || '0.0000',
    'Ratio Eficiencia': h.ratio?.toFixed(2) || '0.00',
    'Punto Rocío (°C)': h.td?.toFixed(1) || '0.0',
    'Rentable': h.rentable ? 'SÍ' : 'NO',
    'Competitivo': h.competitivo ? 'SÍ' : 'NO',
  }));
}

/**
 * Exporta resumen ejecutivo a CSV
 * @param {object} resumen - Objeto con métricas agregadas
 * @returns {string} CSV string
 */
export function exportResumenEjecutivo(resumen) {
  const data = [
    { Métrica: 'Producción Total (litros)', Valor: resumen.produccionTotal.toFixed(2) },
    { Métrica: 'Beneficio Total (€)', Valor: resumen.beneficioTotal.toFixed(2) },
    { Métrica: 'Coste Promedio (€/l)', Valor: resumen.costePromedio.toFixed(4) },
    { Métrica: 'ROI (años)', Valor: resumen.roiAnios.toFixed(1) },
    { Métrica: 'Energía Consumida (kWh)', Valor: resumen.energiaTotal.toFixed(2) },
    { Métrica: 'Ratio Eficiencia Promedio', Valor: resumen.ratioPromedio.toFixed(2) },
    { Métrica: 'Competitivo vs Desalación', Valor: resumen.ventajaCompetitiva.toFixed(1) + '%' },
  ];

  return toCSV(data);
}

/**
 * Genera nombre de archivo con timestamp
 * @param {string} prefix - Prefijo del archivo
 * @returns {string} Nombre de archivo con timestamp
 */
export function generateFilename(prefix = 'cma_export') {
  const now = new Date();
  const timestamp = now.toISOString().replace(/:/g, '-').split('.')[0];
  return `${prefix}_${timestamp}.csv`;
}
