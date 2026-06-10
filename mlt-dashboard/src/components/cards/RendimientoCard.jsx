import Card from '../common/Card';
import MetricRow from '../common/MetricRow';
import FlagIndicator from '../common/FlagIndicator';
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

export default function RendimientoCard({ datos, resultado }) {
  return (
    <Card title="Rendimiento Energético" subtitle="Análisis de rentabilidad económica" accentColor={COLORS.success}>
      <MetricRow label="Potencia bomba" value={datos.potenciaBomba.toFixed(0)} unit="W" tag="sim" />
      <MetricRow label="Agua producida (1h)" value={resultado.litrosProducidos} unit="l" tag="sim" />
      <div style={{ height: 8 }} />
      <MetricRow label="Energía consumida" value={resultado.energiaConsumida} unit="Wh" />
      <MetricRow label="Energía ahorrada" value={resultado.energiaAhorrada} unit="Wh" highlight />
      <MetricRow label="Ratio eficiencia" value={resultado.ratioEficiencia} unit="×" highlight />
      <MiniBar value={Math.min(resultado.ratioEficiencia, 20)} max={20} color={resultado.flagRentable ? COLORS.success : COLORS.error} />
      <div style={{ height: 4 }} />
      <FlagIndicator active={resultado.flagRentable} label="Sistema rentable (consumida < ahorrada)" />

      <div style={{ marginTop: 8, padding: 8, background: COLORS.successDim, borderRadius: 0, border: `1px solid ${COLORS.successBorder}` }}>
        <p style={{ fontSize: 10, color: COLORS.success, margin: 0, fontWeight: 500 }}>
          Referencia patente: Q = 540 Kcal/l · Métodos convencionales: &gt;500 Kcal/l
        </p>
      </div>
    </Card>
  );
}
