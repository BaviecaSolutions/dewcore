import { COLORS } from '../../constants';

export default function MetricRow({ label, value, unit, trend, highlight = false }) {
  // ✅ Mismo formato que MLT: siempre .toFixed(2)
  const displayValue = typeof value === 'number' ? value.toFixed(2) : value;

  // Determinar color del trend
  let trendColor = COLORS.textMuted;
  let trendIcon = '';
  if (trend === 'up') {
    trendColor = COLORS.success;
    trendIcon = '↗';
  } else if (trend === 'down') {
    trendColor = COLORS.error;
    trendIcon = '↘';
  } else if (trend === 'neutral') {
    trendColor = COLORS.neutral;
    trendIcon = '→';
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "baseline",  // ✅ Mismo que MLT (era "center")
      justifyContent: "space-between",
      padding: "5px 0",  // ✅ Mismo que MLT (era "6px 0")
      borderBottom: `1px solid ${COLORS.cardBorder}`,  // ✅ Mismo que MLT (era bgSubtle)
    }}>
      {/* Label (lado izquierdo) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
        <span style={{
          fontSize: 12,  // ✅ Mismo que MLT (era 11)
          color: COLORS.textDim,  // ✅ Mismo que MLT
        }}>
          {label}
        </span>
      </div>

      {/* Valor + trend (lado derecho) */}
      <div style={{ textAlign: "right", display: 'flex', alignItems: 'center', gap: 4 }}>
        {trend && (
          <span style={{ fontSize: 12, color: trendColor, fontWeight: 700 }}>
            {trendIcon}
          </span>
        )}
        <span style={{
          fontSize: 15,  // ✅ Mismo que MLT (era 13)
          fontWeight: 600,  // ✅ Mismo que MLT (era 700)
          color: highlight ? COLORS.primary : COLORS.text,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",  // ✅ Añadido 'Fira Code'
        }}>
          {displayValue}
        </span>
        {unit && (
          <span style={{
            fontSize: 11,  // ✅ Mismo que MLT (era 10)
            color: COLORS.textMuted,
            marginLeft: 4,  // ✅ Mismo que MLT
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
