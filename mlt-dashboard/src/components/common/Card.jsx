import { COLORS } from '../../constants';

export default function Card({ title, subtitle, children, accentColor, className = "" }) {
  return (
    <div
      className={className}
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        borderTop: `3px solid ${accentColor || COLORS.accent}`,
        borderRadius: 0,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      {(title || subtitle) && (
        <div style={{ marginBottom: 8 }}>
          {title && (
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: accentColor || COLORS.primary,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontFamily: "'Red Hat Display', 'Inter', sans-serif"
            }}>
              {title}
            </div>
          )}
          {subtitle && (
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
