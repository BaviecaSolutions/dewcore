import Card from '../common/Card';
import MetricRow from '../common/MetricRow';
import { COLORS } from '../../constants';

const MiniBar = ({ value, max, color }) => (
  <div style={{ width: "100%", height: 6, background: `${color}20`, borderRadius: 0, overflow: "hidden", marginTop: 4 }}>
    <div style={{
      width: `${Math.min(100, (value / max) * 100)}%`,
      height: "100%",
      background: color,
      borderRadius: 0,
      transition: "width 0.5s ease",
    }} />
  </div>
);

export default function ValidacionCard({ datos, resultado }) {
  return (
    <Card title="Validación Científica" subtitle="Contraste teórico vs empírico" accentColor="#a78bfa">
      <MetricRow label="T aire salida" value={datos.tempAireSalida} unit="°C" tag="sim" />
      <MetricRow label="HR aire salida" value={datos.hrSalida.toFixed(1)} unit="%" tag="sim" />
      <div style={{ height: 8 }} />
      <MetricRow label="Vapor teórico" value={resultado.condensableGm3} unit="g/m³" />
      <MetricRow label="Vapor empírico" value={resultado.extraccionEmpirica ?? "—"} unit={resultado.extraccionEmpirica != null ? "g/m³" : ""} tag="sim" />
      {resultado.pctAcierto != null && (
        <>
          <MetricRow label="% acierto modelo" value={resultado.pctAcierto} unit="%" highlight />
          <MiniBar value={resultado.pctAcierto} max={100} color={resultado.pctAcierto > 80 ? COLORS.success : COLORS.warning} />
        </>
      )}

      <div style={{ marginTop: 8, padding: 8, background: COLORS.warningDim, borderRadius: 0, border: `1px solid ${COLORS.warningBorder}` }}>
        <p style={{ fontSize: 10, color: COLORS.warning, margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
          ⚠ Los datos de salida del aire son simulados. En el ensayo real, el MAS proporcionará las mediciones del termopar e higrómetro a la salida del serpentín.
        </p>
      </div>
    </Card>
  );
}
