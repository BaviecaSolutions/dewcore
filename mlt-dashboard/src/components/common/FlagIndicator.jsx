import { COLORS } from '../../constants';

export default function FlagIndicator({ active, label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: active ? COLORS.success : COLORS.error,
        boxShadow: active ? `0 0 8px ${COLORS.success}80` : `0 0 8px ${COLORS.error}80`,
      }} />
      <span style={{ fontSize: 13, color: COLORS.text }}>{label}</span>
      <span style={{
        fontSize: 11, fontWeight: 700, marginLeft: "auto",
        color: active ? COLORS.success : COLORS.error,
        fontFamily: "'Red Hat Display', 'Inter', sans-serif"
      }}>
        {active ? "TRUE" : "FALSE"}
      </span>
    </div>
  );
}
