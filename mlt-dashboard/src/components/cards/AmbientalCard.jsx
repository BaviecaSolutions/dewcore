import Card from '../common/Card';
import MetricRow from '../common/MetricRow';
import { COLORS } from '../../constants';

export default function AmbientalCard({ datos, resultado }) {
  return (
    <Card title="Condiciones Ambientales" subtitle="Variables de entrada del sistema" accentColor="#0ea5e9">
      <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600, marginBottom: 4 }}>
        ATMOSFÉRICAS
      </div>
      <MetricRow label="T aire entrada" value={datos.tempAire} unit="°C" tag="real" />
      <MetricRow label="Humedad relativa" value={datos.hr} unit="%" tag="real" />
      <MetricRow label="Presión atmosférica" value={datos.presion} unit="hPa" tag="real" />
      <MetricRow label="Velocidad viento" value={datos.viento} unit="m/s" tag="real" />

      <div style={{ height: 8 }} />
      <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600, marginBottom: 4 }}>
        MARINAS
      </div>
      <MetricRow label="T agua profunda" value={datos.tempAguaFria.toFixed(1)} unit="°C" tag="sim" />
      <MetricRow label="T agua retorno" value={datos.tempAguaRetorno.toFixed(1)} unit="°C" tag="sim" />
      <MetricRow label="T condensador" value={resultado.tempCondensador} unit={`°C (${resultado.condMedida ? "MEDIDA" : "EST."})`} tag={resultado.condMedida ? "sim" : "design"} />
    </Card>
  );
}
