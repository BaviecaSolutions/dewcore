import { COLORS } from '../../constants';
import DataTag from './DataTag';

export default function MetricRow({ label, value, unit, tag, highlight }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", justifyContent: "space-between",
      padding: "5px 0", borderBottom: `1px solid ${COLORS.cardBorder}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
        <span style={{ fontSize: 12, color: COLORS.textDim }}>{label}</span>
        {tag && <DataTag type={tag} />}
      </div>
      <div style={{ textAlign: "right" }}>
        <span style={{
          fontSize: 15, fontWeight: 600,
          color: highlight ? COLORS.primary : COLORS.text,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}>
          {typeof value === "number" ? value.toFixed(2) : value}
        </span>
        {unit && <span style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  );
}
