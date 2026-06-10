/**
 * @fileoverview Executive View - Business Dashboard
 *
 * Shows: production metrics, cost/liter, ROI, profitability, competitiveness
 * Audience: Executives, investors, business stakeholders
 */

import { COLORS } from '@dewcore/shared/constants';

export default function ExecutiveView({ data, history, isAuditor }) {
  if (!data || !data.results) {
    return (
      <div style={styles.empty}>
        <p>Waiting for data... Press START to begin experiment</p>
      </div>
    );
  }

  const { results } = data;
  const { termodinamica, economia, flags } = results;

  // Calculate daily production (extrapolated)
  const produccionDiaria = (termodinamica.litrosProducidos || 0) * 48;  // 48 periods of 0.5h = 24h

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>💼 Executive Dashboard</h2>

      {/* KPIs */}
      <div style={styles.grid}>
        <KPICard
          title="Producción Diaria"
          value={produccionDiaria.toFixed(1)}
          unit="L/día"
          color={COLORS.primary}
        />
        <KPICard
          title="Coste/Litro"
          value={economia.costeLitro !== Infinity ? economia.costeLitro.toFixed(3) : '—'}
          unit="€/L"
          color={COLORS.cost}
        />
        <KPICard
          title="Beneficio Anual"
          value={(economia.beneficioAnual / 1000).toFixed(1)}
          unit="k€/año"
          color={COLORS.profit}
        />
        <KPICard
          title="ROI"
          value={economia.roiAnios !== Infinity ? economia.roiAnios.toFixed(1) : '∞'}
          unit="años"
          color={economia.roiAnios < 5 ? COLORS.success : COLORS.warning}
        />
      </div>

      {/* Financial Overview (only for Auditor) */}
      {isAuditor && (
        <>
          <Card title="Ingresos y Costes (periodo 0.5h)">
            <DataRow label="Ingresos" value={`${economia.ingresos?.toFixed(3)} €`} valueColor={COLORS.revenue} />
            <DataRow label="Costes Totales" value={`${economia.costes?.toFixed(3)} €`} valueColor={COLORS.cost} />
            <DataRow label="— Coste Energía" value={`${((economia.costes || 0) * 0.3).toFixed(3)} €`} />
            <DataRow label="— Coste Operacional" value={`${((economia.costes || 0) * 0.7).toFixed(3)} €`} />
            <DataRow
              label="Beneficio"
              value={`${economia.beneficio?.toFixed(3)} €`}
              valueColor={economia.beneficio > 0 ? COLORS.profit : COLORS.loss}
            />
          </Card>

          <Card title="Análisis de Rentabilidad">
            <DataRow label="Beneficio Anual" value={`${economia.beneficioAnual?.toFixed(0)} €`} />
            <DataRow label="ROI (años)" value={economia.roiAnios !== Infinity ? economia.roiAnios.toFixed(1) : 'N/A'} />
            <DataRow label="Ventaja vs Desalación" value={`${economia.ventajaCompetitiva?.toFixed(1)} %`} />
          </Card>
        </>
      )}

      {/* Business Flags */}
      <Card title="Indicadores de Negocio">
        <FlagRow label="Rentable" active={flags.rentable} />
        <FlagRow label="Competitivo vs Desalación" active={flags.competitivo} />
        <FlagRow label="ROI Aceptable (< 5 años)" active={flags.roiAceptable} />
      </Card>

      {/* Historical Chart Placeholder */}
      {isAuditor && (
        <Card title="Evolución Económica (últimas 24 muestras)">
          <p style={styles.placeholder}>
            {history.length} measurements in history. Chart rendering requires full component migration.
          </p>
        </Card>
      )}
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

function DataRow({ label, value, valueColor }) {
  return (
    <div style={styles.dataRow}>
      <span style={styles.dataLabel}>{label}</span>
      <span style={{ ...styles.dataValue, color: valueColor || COLORS.text }}>{value}</span>
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
