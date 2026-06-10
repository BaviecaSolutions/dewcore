import Card from '../common/Card';
import FlagIndicator from '../common/FlagIndicator';
import { COLORS } from '../../constants';

export default function FlagsCard({ resultado }) {
  const allFlags = resultado.flagRentable && resultado.flagHuellaNula && resultado.flagEfluentes && resultado.flagOperable;

  return (
    <Card title="Flags Ecológicos y Operativos" subtitle="Verificaciones continuas del sistema" accentColor={allFlags ? COLORS.success : COLORS.error}>
      <FlagIndicator active={resultado.flagRentable} label="F15 — Rentabilidad energética" />
      <FlagIndicator active={resultado.flagHuellaNula} label="F06.1 — Huella térmica nula" />
      <FlagIndicator active={resultado.flagEfluentes} label="F06.2 — Ausencia de efluentes" />
      <FlagIndicator active={resultado.flagOperable} label="F06.3 — Condición de operabilidad" />

      <div style={{
        marginTop: 10,
        padding: 10,
        textAlign: "center",
        borderRadius: 0,
        background: allFlags ? COLORS.successDim : COLORS.errorDim,
        border: `2px solid ${allFlags ? COLORS.success : COLORS.error}`,
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.05em",
          color: allFlags ? COLORS.success : COLORS.error,
          fontFamily: "'Red Hat Display', 'Inter', sans-serif"
        }}>
          {allFlags ? "✓ TODOS LOS FLAGS ACTIVOS" : "✗ ALGÚN FLAG INACTIVO"}
        </span>
      </div>

      <div style={{ marginTop: 12, padding: 8, background: COLORS.infoDim, borderRadius: 0, border: `1px solid ${COLORS.primary}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, marginBottom: 4 }}>DETALLES DE OPERABILIDAD:</div>
        <div style={{ fontSize: 10, color: COLORS.textDim, lineHeight: 1.5 }}>
          • Δ térmico: {resultado.deltaTermico.toFixed(2)}°C (umbral: ≤0.5°C)<br/>
          • Margen operabilidad: {resultado.margenOperabilidad.toFixed(2)}°C (Td &gt; Tagua)
        </div>
      </div>
    </Card>
  );
}
