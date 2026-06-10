import { COLORS } from '../../constants';

export default function KPICard({ title, value, unit, trend, trendValue, status, subtitle }) {
  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
  };

  const getTrendColor = () => {
    if (!trend) return COLORS.textMuted;
    // Para producción y eficiencia, up es bueno
    if (title.includes('Producción') || title.includes('Ratio') || title.includes('Acierto')) {
      return trend === 'up' ? COLORS.success : trend === 'down' ? COLORS.error : COLORS.textMuted;
    }
    // Para temperatura, down puede ser bueno
    return COLORS.textMuted;
  };

  const getStatusColor = () => {
    if (status === 'success') return COLORS.success;
    if (status === 'warning') return COLORS.warning;
    if (status === 'error') return COLORS.error;
    return COLORS.primary;
  };

  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderTop: `4px solid ${getStatusColor()}`,
      borderRadius: 0,
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      minWidth: "200px",
      flex: 1,
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: COLORS.textMuted,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        fontFamily: "'Red Hat Display', 'Inter', sans-serif"
      }}>
        {title}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{
          fontSize: 32,
          fontWeight: 700,
          color: COLORS.text,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}>
          {typeof value === "number" ? value.toFixed(2) : value}
        </span>
        {unit && (
          <span style={{ fontSize: 16, color: COLORS.textDim, fontWeight: 600 }}>
            {unit}
          </span>
        )}
      </div>
      {subtitle && (
        <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: -4 }}>
          {subtitle}
        </div>
      )}
      {trend && (
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: getTrendColor(),
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}>
          <span>{getTrendIcon()}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}
