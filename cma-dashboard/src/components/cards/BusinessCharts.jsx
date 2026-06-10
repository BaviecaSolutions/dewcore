import { COLORS } from '../../constants';
import Card from '../common/Card';

// ===== GRÁFICO 1: Producción con Proyección Realista =====
function ProductionChart({ history }) {
  if (history.length < 2) return null;

  const chartWidth = 400;
  const chartHeight = 100;
  const padding = 8;

  // Datos reales (histórico)
  const produccion = history.map(h => h.produccionLph || 0);

  // Calcular proyección realista (media móvil ponderada últimas 6 horas)
  const ultimas = history.slice(-Math.min(12, history.length));
  const mediaProduccion = ultimas.reduce((sum, h) => sum + (h.produccionLph || 0), 0) / ultimas.length;
  const factorCircadiano = 0.85; // Factor corrección ciclo diario
  const proyeccion24h = mediaProduccion * 24 * factorCircadiano;

  const maxVal = Math.max(...produccion, mediaProduccion * 1.2);
  const minVal = 0;

  const scaleY = (value) => {
    const range = maxVal - minVal;
    if (range === 0) return chartHeight / 2;
    return chartHeight - padding - ((value - minVal) / range) * (chartHeight - padding * 2);
  };

  // Puntos del gráfico
  const points = produccion.map((val, i) => {
    const x = padding + (i / (produccion.length - 1)) * (chartWidth - padding * 2);
    return `${x},${scaleY(val)}`;
  }).join(' ');

  // Área bajo la curva
  const areaPoints = [
    `${padding},${scaleY(0)}`,
    ...produccion.map((val, i) => {
      const x = padding + (i / (produccion.length - 1)) * (chartWidth - padding * 2);
      return `${x},${scaleY(val)}`;
    }),
    `${chartWidth - padding},${scaleY(0)}`
  ].join(' ');

  return (
    <div style={{
      flex: 1,
      minWidth: 380,
      background: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderTop: `3px solid ${COLORS.primary}`,
      borderRadius: 0,
      padding: 16,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 11,
          color: COLORS.textMuted,
          marginBottom: 4,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Producción de Agua
        </div>
        <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 10 }}>
          Histórico + Proyección realista (basada en media móvil)
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 3, fontWeight: 600 }}>ACTUAL</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.primary,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {(produccion[produccion.length - 1] || 0).toFixed(2)}
            </span>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>l/h</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 3, fontWeight: 600 }}>MEDIA 6H</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.info,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {mediaProduccion.toFixed(2)}
            </span>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>l/h</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 3, fontWeight: 600 }}>PROY. 24H</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
            <span style={{
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.success,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {proyeccion24h.toFixed(1)}
            </span>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>l/día</span>
          </div>
        </div>
      </div>

      {/* Gráfico SVG */}
      <div style={{
        background: COLORS.bgSubtle,
        borderRadius: 0,
        padding: 12,
        border: `1px solid ${COLORS.cardBorder}`,
      }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Grid horizontal */}
          {[0.25, 0.5, 0.75].map(fraction => {
            const y = chartHeight - padding - fraction * (chartHeight - padding * 2);
            return (
              <line
                key={fraction}
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke={COLORS.cardBorder}
                strokeWidth="0.5"
                opacity="0.3"
              />
            );
          })}

          {/* Área bajo la curva */}
          <polygon
            points={areaPoints}
            fill={`${COLORS.primary}15`}
            stroke="none"
          />

          {/* Línea principal */}
          <polyline
            fill="none"
            stroke={COLORS.primary}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Punto final */}
          <circle
            cx={chartWidth - padding}
            cy={scaleY(produccion[produccion.length - 1])}
            r="4"
            fill={COLORS.primary}
            stroke="#fff"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Interpretación */}
      <div style={{
        marginTop: 12,
        padding: 10,
        background: `${COLORS.info}08`,
        border: `1px solid ${COLORS.info}30`,
        fontSize: 10,
        color: COLORS.textDim,
        lineHeight: 1.5,
      }}>
        <strong style={{ color: COLORS.text }}>Proyección:</strong> La producción estimada de {proyeccion24h.toFixed(1)} l/día se calcula con media móvil ponderada de las últimas 6h, aplicando factor circadiano de 0.85 para compensar variaciones nocturnas.
      </div>
    </div>
  );
}

// ===== GRÁFICO 2: Análisis Económico (Costes vs Ingresos) =====
function EconomicChart({ history }) {
  if (history.length < 2) return null;

  const chartWidth = 400;
  const chartHeight = 100;
  const padding = 8;

  // Extraer datos económicos
  const costes = history.map(h => h.costes || 0);
  const ingresos = history.map(h => h.ingresos || 0);
  const beneficios = history.map(h => (h.ingresos || 0) - (h.costes || 0));

  const maxVal = Math.max(...ingresos, ...costes, 0.5);
  const minVal = 0;

  const scaleY = (value) => {
    const range = maxVal - minVal;
    if (range === 0) return chartHeight / 2;
    return chartHeight - padding - ((value - minVal) / range) * (chartHeight - padding * 2);
  };

  // Puntos ingresos (verde)
  const pointsIngresos = ingresos.map((val, i) => {
    const x = padding + (i / (ingresos.length - 1)) * (chartWidth - padding * 2);
    return `${x},${scaleY(val)}`;
  }).join(' ');

  // Puntos costes (rojo)
  const pointsCostes = costes.map((val, i) => {
    const x = padding + (i / (costes.length - 1)) * (chartWidth - padding * 2);
    return `${x},${scaleY(val)}`;
  }).join(' ');

  // Beneficio actual
  const beneficioActual = beneficios[beneficios.length - 1];
  const beneficioTotal = beneficios.reduce((sum, b) => sum + b, 0);

  return (
    <div style={{
      flex: 1,
      minWidth: 380,
      background: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderTop: `3px solid ${beneficioActual >= 0 ? COLORS.profit : COLORS.loss}`,
      borderRadius: 0,
      padding: 16,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 11,
          color: COLORS.textMuted,
          marginBottom: 4,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Análisis Económico
        </div>
        <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 10 }}>
          Ingresos vs Costes operacionales (energía + mantenimiento)
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 3, fontWeight: 600 }}>INGRESOS</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.revenue,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {(ingresos[ingresos.length - 1] || 0).toFixed(2)}
            </span>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>€/h</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 3, fontWeight: 600 }}>COSTES</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.cost,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {(costes[costes.length - 1] || 0).toFixed(2)}
            </span>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>€/h</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 3, fontWeight: 600 }}>
            {beneficioTotal >= 0 ? 'BENEFICIO' : 'PÉRDIDA'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
            <span style={{
              fontSize: 22,
              fontWeight: 700,
              color: beneficioActual >= 0 ? COLORS.profit : COLORS.loss,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {Math.abs(beneficioActual).toFixed(2)}
            </span>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>€/h</span>
          </div>
        </div>
      </div>

      {/* Gráfico SVG */}
      <div style={{
        background: COLORS.bgSubtle,
        borderRadius: 0,
        padding: 12,
        border: `1px solid ${COLORS.cardBorder}`,
      }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Grid horizontal */}
          {[0.25, 0.5, 0.75].map(fraction => {
            const y = chartHeight - padding - fraction * (chartHeight - padding * 2);
            return (
              <line
                key={fraction}
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke={COLORS.cardBorder}
                strokeWidth="0.5"
                opacity="0.3"
              />
            );
          })}

          {/* Línea ingresos (verde) */}
          <polyline
            fill="none"
            stroke={COLORS.revenue}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsIngresos}
          />

          {/* Línea costes (rojo) */}
          <polyline
            fill="none"
            stroke={COLORS.cost}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4,2"
            points={pointsCostes}
          />

          {/* Puntos finales */}
          <circle
            cx={chartWidth - padding}
            cy={scaleY(ingresos[ingresos.length - 1])}
            r="4"
            fill={COLORS.revenue}
            stroke="#fff"
            strokeWidth="2"
          />
          <circle
            cx={chartWidth - padding}
            cy={scaleY(costes[costes.length - 1])}
            r="3.5"
            fill={COLORS.cost}
            stroke="#fff"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 9, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 18, height: 3, background: COLORS.revenue, borderRadius: 2 }} />
          <span style={{ color: COLORS.textDim, fontWeight: 600 }}>Ingresos (valor agua)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 18,
            height: 3,
            background: COLORS.cost,
            borderRadius: 2,
            backgroundImage: `repeating-linear-gradient(90deg, ${COLORS.cost} 0px, ${COLORS.cost} 4px, transparent 4px, transparent 6px)`,
          }} />
          <span style={{ color: COLORS.textDim, fontWeight: 600 }}>Costes (energía + op.)</span>
        </div>
      </div>

      {/* Interpretación */}
      <div style={{
        marginTop: 12,
        padding: 10,
        background: beneficioTotal >= 0 ? `${COLORS.profit}08` : `${COLORS.loss}08`,
        border: `1px solid ${beneficioTotal >= 0 ? COLORS.profit : COLORS.loss}30`,
        fontSize: 10,
        color: COLORS.textDim,
        lineHeight: 1.5,
      }}>
        <strong style={{ color: COLORS.text }}>Balance:</strong> El sistema {beneficioTotal >= 0 ? 'genera beneficio' : 'opera en pérdida'} con un saldo acumulado de <strong>{beneficioTotal >= 0 ? '+' : ''}{beneficioTotal.toFixed(2)}€</strong> durante el periodo monitoreado.
      </div>
    </div>
  );
}

// ===== GRÁFICO 3: ROI y Competitividad =====
function ROIChart({ history }) {
  if (history.length < 2) return null;

  const chartWidth = 400;
  const chartHeight = 100;
  const padding = 8;

  // Extraer coste por litro
  const costeLitro = history.map(h => h.costeLitro || 0);
  const precioDesalacion = 0.60; // € referencia desalación

  const maxVal = Math.max(...costeLitro, precioDesalacion * 1.2);
  const minVal = 0;

  const scaleY = (value) => {
    const range = maxVal - minVal;
    if (range === 0) return chartHeight / 2;
    return chartHeight - padding - ((value - minVal) / range) * (chartHeight - padding * 2);
  };

  // Puntos del gráfico
  const points = costeLitro.map((val, i) => {
    const x = padding + (i / (costeLitro.length - 1)) * (chartWidth - padding * 2);
    return `${x},${scaleY(val)}`;
  }).join(' ');

  // Línea de referencia desalación
  const yDesalacion = scaleY(precioDesalacion);

  // Ventaja competitiva
  const costeActual = costeLitro[costeLitro.length - 1];
  const ventaja = ((precioDesalacion - costeActual) / precioDesalacion) * 100;
  const esCompetitivo = costeActual < precioDesalacion;

  return (
    <div style={{
      flex: 1,
      minWidth: 380,
      background: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderTop: `3px solid ${esCompetitivo ? COLORS.success : COLORS.warning}`,
      borderRadius: 0,
      padding: 16,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 11,
          color: COLORS.textMuted,
          marginBottom: 4,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Competitividad
        </div>
        <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 10 }}>
          Coste por litro vs Desalación convencional (€0.60/l referencia)
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 3, fontWeight: 600 }}>NUESTRO COSTE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{
              fontSize: 22,
              fontWeight: 700,
              color: esCompetitivo ? COLORS.success : COLORS.warning,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {costeActual.toFixed(3)}
            </span>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>€/l</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 3, fontWeight: 600 }}>DESALACIÓN</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.textDim,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {precioDesalacion.toFixed(3)}
            </span>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>€/l</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 3, fontWeight: 600 }}>VENTAJA</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
            <span style={{
              fontSize: 22,
              fontWeight: 700,
              color: ventaja > 0 ? COLORS.success : COLORS.error,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {ventaja > 0 ? '+' : ''}{ventaja.toFixed(1)}
            </span>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>%</span>
          </div>
        </div>
      </div>

      {/* Gráfico SVG */}
      <div style={{
        background: COLORS.bgSubtle,
        borderRadius: 0,
        padding: 12,
        border: `1px solid ${COLORS.cardBorder}`,
      }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Grid horizontal */}
          {[0.25, 0.5, 0.75].map(fraction => {
            const y = chartHeight - padding - fraction * (chartHeight - padding * 2);
            return (
              <line
                key={fraction}
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke={COLORS.cardBorder}
                strokeWidth="0.5"
                opacity="0.3"
              />
            );
          })}

          {/* Línea de referencia desalación (roja horizontal) */}
          <line
            x1={padding}
            y1={yDesalacion}
            x2={chartWidth - padding}
            y2={yDesalacion}
            stroke={COLORS.error}
            strokeWidth="2"
            strokeDasharray="6,3"
          />

          {/* Label de línea de referencia */}
          <text
            x={chartWidth - padding - 50}
            y={yDesalacion - 4}
            fontSize="8"
            fill={COLORS.error}
            fontWeight="700"
            fontFamily="'JetBrains Mono', monospace"
          >
            Desalación
          </text>

          {/* Línea de coste (azul/verde según competitividad) */}
          <polyline
            fill="none"
            stroke={esCompetitivo ? COLORS.success : COLORS.warning}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Punto final */}
          <circle
            cx={chartWidth - padding}
            cy={scaleY(costeActual)}
            r="4"
            fill={esCompetitivo ? COLORS.success : COLORS.warning}
            stroke="#fff"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Interpretación */}
      <div style={{
        marginTop: 12,
        padding: 10,
        background: esCompetitivo ? `${COLORS.success}08` : `${COLORS.warning}08`,
        border: `1px solid ${esCompetitivo ? COLORS.success : COLORS.warning}30`,
        fontSize: 10,
        color: COLORS.textDim,
        lineHeight: 1.5,
      }}>
        <strong style={{ color: COLORS.text }}>Análisis:</strong> {esCompetitivo ? `El sistema es ${ventaja.toFixed(0)}% más económico que la desalación convencional, confirmando su viabilidad comercial.` : `El coste actual supera a la desalación. Optimizar condiciones operacionales para mejorar eficiencia.`}
      </div>
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function BusinessCharts({ history }) {
  if (history.length < 2) {
    return (
      <Card title="Series Temporales CMA" subtitle="Análisis económico y proyecciones">
        <div style={{ padding: '40px 20px', textAlign: 'center', color: COLORS.textMuted }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>Iniciando simulación...</p>
          <p style={{ margin: '6px 0 0 0', fontSize: 10 }}>Los gráficos aparecerán al avanzar el tiempo (mínimo 2 muestras).</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Series Temporales CMA"
      subtitle={`Análisis económico y proyecciones (${history.length} muestras · ${(history.length * 0.5).toFixed(1)}h de simulación)`}
      accentColor={COLORS.primary}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14 }}>
        <ProductionChart history={history} />
        <EconomicChart history={history} />
        <ROIChart history={history} />
      </div>
    </Card>
  );
}
