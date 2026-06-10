/**
 * @fileoverview Scientific View - Thermodynamic Validation Dashboard
 *
 * Shows: atmospheric conditions, thermodynamic results, model validation, audit flags
 * Audience: Auditors, researchers, TRL verification
 */

import { COLORS } from '@dewcore/shared/constants';

export default function ScientificView({ data, history }) {
  if (!data || !data.results) {
    return (
      <div style={styles.empty}>
        <p>Waiting for data... Press START to begin experiment</p>
      </div>
    );
  }

  const { normalized, results } = data;
  const { termodinamica, economia, flags } = results;

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>🔬 Scientific Validation View</h2>

      {/* KPIs */}
      <div style={styles.grid}>
        <KPICard
          title="Producción"
          value={termodinamica.litrosProducidos?.toFixed(2) || '—'}
          unit="L/0.5h"
          color={COLORS.primary}
        />
        <KPICard
          title="Ratio Eficiencia"
          value={termodinamica.ratioEficiencia?.toFixed(2) || '—'}
          unit="×"
          color={COLORS.success}
        />
        <KPICard
          title="Punto de Rocío"
          value={termodinamica.puntoRocio?.toFixed(1) || '—'}
          unit="°C"
          color={COLORS.info}
        />
        <KPICard
          title="Acierto Modelo"
          value={termodinamica.pctAcierto?.toFixed(1) || '—'}
          unit="%"
          color={COLORS.primaryMid}
        />
      </div>

      {/* Atmospheric Conditions */}
      <Card title="Condiciones Ambientales">
        <DataRow label="Temperatura Aire" value={`${normalized.tempAire?.toFixed(1)} °C`} />
        <DataRow label="Humedad Relativa" value={`${normalized.hr?.toFixed(1)} %`} />
        <DataRow label="Presión Atmosférica" value={`${normalized.presion} hPa`} />
        <DataRow label="Viento" value={`${normalized.viento?.toFixed(1)} m/s`} />
        <DataRow label="Humedad Absoluta" value={`${termodinamica.humedadAbsoluta?.toFixed(2)} g/m³`} />
        <DataRow label="Agua Condensable" value={`${termodinamica.condensableGm3?.toFixed(2)} g/m³`} />
      </Card>

      {/* Energy Performance */}
      <Card title="Rendimiento Energético">
        <DataRow label="Energía Consumida" value={`${termodinamica.energiaConsumida?.toFixed(0)} Wh`} />
        <DataRow label="Energía Ahorrada" value={`${termodinamica.energiaAhorrada?.toFixed(0)} Wh`} />
        <DataRow label="Ratio Eficiencia" value={`${termodinamica.ratioEficiencia?.toFixed(2)} ×`} />
        <DataRow label="Delta Térmico" value={`${termodinamica.deltaTermico?.toFixed(2)} °C`} />
        <DataRow label="Margen Operabilidad" value={`${termodinamica.margenOperabilidad?.toFixed(2)} °C`} />
      </Card>

      {/* Audit Flags */}
      <Card title="Flags de Auditoría Ecológica">
        <FlagRow label="Rentable (energético)" active={flags.rentable} />
        <FlagRow label="Huella Nula (térmica)" active={flags.huellaNula} />
        <FlagRow label="Sin Efluentes" active={flags.efluentes} />
        <FlagRow label="Operable" active={flags.operable} />
      </Card>

      {/* Historical Chart Placeholder */}
      <Card title="Histórico (últimas 24 muestras)">
        <p style={styles.placeholder}>
          {history.length} measurements in history. Chart rendering requires full component migration.
        </p>
      </Card>
    </div>
  );
}

// =========================================================================
// COMPONENTS
// =========================================================================

function KPICard({ title, value, unit, color }) {
  return (
    <div style={{ ...styles.kpiCard, borderLeft: `4px solid ${color}` }}>
      <div style={styles.kpiLabel}>{title}</div>
      <div style={styles.kpiValue}>
        {value} <span style={styles.kpiUnit}>{unit}</span>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{title}</h3>
      <div style={styles.cardContent}>{children}</div>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div style={styles.dataRow}>
      <span style={styles.dataLabel}>{label}</span>
      <span style={styles.dataValue}>{value}</span>
    </div>
  );
}

function FlagRow({ label, active }) {
  return (
    <div style={styles.flagRow}>
      <span style={styles.flagLabel}>{label}</span>
      <span style={{ ...styles.flagIndicator, background: active ? COLORS.success : COLORS.error }}>
        {active ? '✓' : '✗'}
      </span>
    </div>
  );
}

// =========================================================================
// STYLES
// =========================================================================

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: COLORS.textMuted,
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  kpiCard: {
    background: COLORS.card,
    padding: '20px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.cardBorder}`,
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  kpiValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'JetBrains Mono, monospace',
  },
  kpiUnit: {
    fontSize: '16px',
    fontWeight: '400',
    color: COLORS.textDim,
  },
  card: {
    background: COLORS.card,
    padding: '24px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.cardBorder}`,
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: '16px',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  dataRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: `1px solid ${COLORS.bgSubtle}`,
  },
  dataLabel: {
    fontSize: '14px',
    color: COLORS.textDim,
  },
  dataValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'JetBrains Mono, monospace',
  },
  flagRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },
  flagLabel: {
    fontSize: '14px',
    color: COLORS.textDim,
  },
  flagIndicator: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '14px',
    fontWeight: '700',
  },
  placeholder: {
    padding: '40px',
    textAlign: 'center',
    color: COLORS.textMuted,
    background: COLORS.bgSubtle,
    borderRadius: '4px',
    fontSize: '14px',
  },
};
