import { COLORS } from '../../constants';

export default function BusinessKPICard({
  title,
  value,
  unit,
  subtitle,
  trend,
  trendValue,
  status = 'info',
  icon,
}) {
  const statusColors = {
    success: COLORS.success,
    error: COLORS.error,
    warning: COLORS.warning,
    info: COLORS.info,
    profit: COLORS.profit,
    cost: COLORS.cost,
    neutral: COLORS.neutral,
  };

  const borderColor = statusColors[status] || COLORS.primary;

  // Mismo formato que MLT: siempre .toFixed(2) para consistencia
  const displayValue = typeof value === 'number' ? value.toFixed(2) : value;

  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderTop: `4px solid ${borderColor}`,
      borderRadius: 0,
      padding: "20px",  // ✅ Mismo padding que MLT (era 16px)
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      minWidth: "200px",  // ✅ Mismo minWidth que MLT
      flex: 1,  // ✅ Añadido para consistencia con MLT
    }}>
      {/* Header con título e icono */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: COLORS.textMuted,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          fontFamily: "'Red Hat Display', 'Inter', sans-serif"  // ✅ Añadido para consistencia
        }}>
          {title}
        </div>
        {icon && (
          <div style={{ fontSize: 20, color: borderColor, opacity: 0.3 }}>
            {icon}
          </div>
        )}
      </div>

      {/* Valor principal */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>  {/* ✅ gap: 8 como MLT */}
        <span style={{
          fontSize: 32,
          fontWeight: 700,
          color: COLORS.text,  // ✅ Mismo color que MLT (no borderColor)
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",  // ✅ Añadido 'Fira Code' como MLT
        }}>
          {displayValue}
        </span>
        <span style={{
          fontSize: 16,  // ✅ Mismo tamaño que MLT (era 14)
          color: COLORS.textDim,  // ✅ Mismo color que MLT
          fontWeight: 600,
        }}>
          {unit}
        </span>
      </div>

      {/* Subtítulo o descripción */}
      {subtitle && (
        <div style={{
          fontSize: 11,
          color: COLORS.textDim,
          marginTop: -4,
        }}>
          {subtitle}
        </div>
      )}

      {/* Trend y valor de cambio */}
      {trend && trendValue && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginTop: 2,
        }}>
          <span style={{
            fontSize: 14,
            color: trend === 'up' ? COLORS.success : trend === 'down' ? COLORS.error : COLORS.neutral,
          }}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: trend === 'up' ? COLORS.success : trend === 'down' ? COLORS.error : COLORS.neutral,
          }}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}
