import { COLORS } from '../../constants';

export default function TimeControl({ hora, playing, onHoraChange, onPlayingToggle }) {
  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 0,
      padding: "12px 16px",
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    }}>
      <span style={{
        fontSize: 11,
        color: COLORS.textDim,
        fontWeight: 700,
        letterSpacing: "0.05em",
        fontFamily: "'Red Hat Display', 'Inter', sans-serif"
      }}>
        SIMULACIÓN TEMPORAL
      </span>
      <button
        onClick={onPlayingToggle}
        style={{
          background: playing ? COLORS.error : COLORS.primary,
          border: `2px solid ${playing ? COLORS.error : COLORS.primary}`,
          color: "#ffffff",
          borderRadius: 0,
          padding: "6px 16px",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.03em",
          transition: "all 0.2s ease",
          fontFamily: "'Red Hat Display', 'Inter', sans-serif"
        }}
      >
        {playing ? "⏸ PAUSAR" : "▶ SIMULAR 24H"}
      </button>
      <input
        type="range"
        min={0}
        max={24}
        step={0.5}
        value={hora}
        onChange={(e) => onHoraChange(parseFloat(e.target.value))}
        style={{ flex: 1, minWidth: 120, accentColor: COLORS.primary }}
      />
      <span style={{
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 15,
        fontWeight: 700,
        color: COLORS.primary,
        minWidth: 60,
      }}>
        {String(Math.floor(hora)).padStart(2, "0")}:{String(Math.round((hora % 1) * 60)).padStart(2, "0")}h
      </span>
    </div>
  );
}
