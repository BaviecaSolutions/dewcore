import { useState, useEffect } from 'react';
import { COLORS } from './constants';
import { calcularCMA } from './utils/calculations';
import { generarDatosSimulados } from './utils/dataGenerator';
import { getCurrentSession, logout, hasPermission } from './utils/auth';
import { downloadCSV, prepareHistoryForExport, generateFilename } from './utils/export';

// Components
import Login from './components/layout/Login';
import Header from './components/layout/Header';
import BusinessKPICard from './components/layout/BusinessKPICard';
import BusinessCharts from './components/cards/BusinessCharts';
import Card from './components/common/Card';
import MetricRow from './components/common/MetricRow';

export default function CMADashboard() {
  const [session, setSession] = useState(null);
  const [hora, setHora] = useState(12);
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useState([]);

  // Verificar si hay sesión guardada al iniciar
  useEffect(() => {
    const savedSession = getCurrentSession();
    if (savedSession) {
      setSession(savedSession);
    }
  }, []);

  // Simulación temporal
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      setHora((h) => {
        const next = h + 0.5;
        return next > 24 ? 0 : next;
      });
    }, 600);
    return () => clearInterval(iv);
  }, [playing]);

  // Generar datos y calcular métricas
  const datos = generarDatosSimulados(hora);
  const params = {
    tempAire: datos.tempAire,
    hr: datos.hr,
    presion: datos.presion,
    tempAguaFria: datos.tempAguaFria,
    tempAguaRetorno: datos.tempAguaRetorno,
    caudalAguaDulceLpm: datos.caudalAguaDulce,
    potenciaBomba: datos.potenciaBomba,
    periodoHoras: 1,
    caudalAireM3h: 100,
    tempCondensadorMedida: null,
    tempAireSalida: datos.tempAireSalida,
    hrSalida: datos.hrSalida,
  };

  const r = calcularCMA(params);

  // Actualizar historial
  useEffect(() => {
    setHistory((prev) => {
      const entry = {
        hora,
        produccionLph: r.produccionLph,
        beneficio: r.beneficio,
        costeLitro: r.costeLitro,
        ratio: r.ratioEficiencia,
        td: r.puntoRocio,
        ingresos: r.ingresos,
        costes: r.costes,
        rentable: r.flagRentable,
        competitivo: r.flagCompetitivo,
      };
      const next = [...prev, entry];
      return next.length > 48 ? next.slice(-48) : next;
    });
  }, [hora, r.produccionLph, r.beneficio, r.costeLitro, r.ratioEficiencia, r.puntoRocio, r.ingresos, r.costes, r.flagRentable, r.flagCompetitivo]);

  // Login handler
  const handleLogin = (newSession) => {
    setSession(newSession);
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    setSession(null);
    setHora(12);
    setPlaying(false);
    setHistory([]);
  };

  // Export handler
  const handleExport = () => {
    if (!hasPermission('exportData')) {
      alert('No tienes permisos para exportar datos. Solo usuarios con rol Auditor pueden exportar.');
      return;
    }

    const exportData = prepareHistoryForExport(history);
    const csv = toCSV(exportData);
    const filename = generateFilename('cma_historico');
    downloadCSV(csv, filename);
  };

  // Si no hay sesión, mostrar login
  if (!session) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  // Calcular agregados para KPIs
  const produccionDiaria = (r.produccionLph || 0) * 24 * 0.85; // Factor circadiano
  const beneficioAnual = r.beneficioAnual || 0;
  const esRentable = r.flagRentable;

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: "'Red Hat Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: 16,
    }}>
      {/* Header */}
      <Header session={session} onLogout={handleLogout} />

      {/* Hero Section - KPIs principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 16,
      }}>
        <BusinessKPICard
          title="Producción Diaria"
          value={produccionDiaria}
          unit="l/día"
          subtitle={`${(r.produccionLph || 0).toFixed(2)} l/h actual`}
          status="info"
          icon="💧"
        />

        <BusinessKPICard
          title="Coste / Litro"
          value={r.costeLitro || 0}
          unit="€/l"
          subtitle={r.flagCompetitivo ? 'Competitivo vs desalación' : 'Por encima de mercado'}
          status={r.flagCompetitivo ? 'success' : 'warning'}
          icon="💰"
        />

        <BusinessKPICard
          title="Beneficio Anual"
          value={beneficioAnual}
          unit="€/año"
          subtitle={esRentable ? 'Sistema rentable' : 'Revisar eficiencia'}
          status={esRentable ? 'profit' : 'cost'}
          icon="📈"
        />

        <BusinessKPICard
          title="ROI"
          value={r.roiAnios || 0}
          unit="años"
          subtitle={r.flagROIAceptable ? 'Aceptable (<5 años)' : 'Revisar viabilidad'}
          status={r.flagROIAceptable ? 'success' : 'warning'}
          icon="⏱"
        />
      </div>

      {/* Control de simulación */}
      <div style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 0,
        padding: 14,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}>
        {/* Play/Pause button */}
        <button
          onClick={() => setPlaying(!playing)}
          style={{
            padding: '10px 20px',
            background: playing ? COLORS.error : COLORS.primary,
            color: '#ffffff',
            border: 'none',
            borderRadius: 0,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'background 0.2s',
            fontFamily: "'Red Hat Display', sans-serif",
            minWidth: 140,
          }}
        >
          {playing ? '⏸ PAUSAR' : '▶ SIMULAR 24H'}
        </button>

        {/* Slider */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            type="range"
            min="0"
            max="24"
            step="0.5"
            value={hora}
            onChange={(e) => setHora(parseFloat(e.target.value))}
            style={{
              width: '100%',
              cursor: 'pointer',
              accentColor: COLORS.primary,
            }}
          />
        </div>

        {/* Hora display */}
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          color: COLORS.text,
          fontFamily: "'JetBrains Mono', monospace",
          minWidth: 60,
          textAlign: 'center',
        }}>
          {Math.floor(hora).toString().padStart(2, '0')}:{((hora % 1) * 60).toString().padStart(2, '0')}
        </div>

        {/* Export button (solo para auditors) */}
        {hasPermission('exportData') && (
          <button
            onClick={handleExport}
            disabled={history.length === 0}
            style={{
              padding: '10px 20px',
              background: history.length === 0 ? COLORS.textMuted : COLORS.success,
              color: '#ffffff',
              border: 'none',
              borderRadius: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              cursor: history.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              fontFamily: "'Red Hat Display', sans-serif",
            }}
          >
            📥 EXPORTAR CSV
          </button>
        )}
      </div>

      {/* Main Grid - Resumen económico */}
      {hasPermission('viewCosts') ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}>
          {/* Ingresos */}
          <Card title="Ingresos" subtitle="Valor del agua producida" accentColor={COLORS.revenue}>
            <MetricRow label="Ingresos por hora" value={r.ingresos} unit="€/h" highlight />
            <MetricRow label="Ingresos diarios (proy.)" value={r.ingresos * 24} unit="€/día" />
            <MetricRow label="Ingresos anuales (proy.)" value={r.ingresos * 24 * 365} unit="€/año" />
            <MetricRow label="Precio referencia" value={0.60} unit="€/l" />
          </Card>

          {/* Costes */}
          <Card title="Costes" subtitle="Energía + operacionales" accentColor={COLORS.cost}>
            <MetricRow label="Costes por hora" value={r.costes} unit="€/h" highlight />
            <MetricRow label="Coste energía" value={r.costeEnergia} unit="€/h" />
            <MetricRow label="Coste operacional" value={r.costeOperacional} unit="€/h" />
            <MetricRow label="Coste por litro" value={r.costeLitro} unit="€/l" />
          </Card>

          {/* Rentabilidad */}
          <Card
            title="Rentabilidad"
            subtitle="Análisis de viabilidad económica"
            accentColor={esRentable ? COLORS.profit : COLORS.loss}
          >
            <MetricRow
              label="Beneficio/hora"
              value={Math.abs(r.beneficio)}
              unit={r.beneficio >= 0 ? '€/h' : '€/h (pérdida)'}
              highlight
              trend={r.beneficio > 0 ? 'up' : 'down'}
            />
            <MetricRow label="Beneficio anual (proy.)" value={beneficioAnual} unit="€/año" />
            <MetricRow label="ROI (años)" value={r.roiAnios} unit="años" />
            <MetricRow
              label="Ventaja vs desalación"
              value={r.ventajaCompetitiva}
              unit="%"
              trend={r.ventajaCompetitiva > 0 ? 'up' : 'down'}
            />
          </Card>
        </div>
      ) : (
        /* Vista limitada para observers */
        <div style={{
          background: `${COLORS.warning}10`,
          border: `1px solid ${COLORS.warning}`,
          borderRadius: 0,
          padding: 20,
          marginBottom: 16,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.warning, marginBottom: 8 }}>
            ⚠ Vista limitada
          </div>
          <div style={{ fontSize: 12, color: COLORS.textDim }}>
            Los detalles económicos completos solo están disponibles para usuarios con rol Auditor.
          </div>
        </div>
      )}

      {/* Time Series Charts */}
      {hasPermission('viewHistorical') ? (
        <div style={{ marginBottom: 16 }}>
          <BusinessCharts history={history} />
        </div>
      ) : (
        <div style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 0,
          padding: 30,
          textAlign: 'center',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textMuted, marginBottom: 8 }}>
            📊 Gráficos históricos no disponibles
          </div>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>
            El acceso a series temporales históricas requiere permisos de Auditor.
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 16,
        padding: '10px 0',
        borderTop: `1px solid ${COLORS.cardBorder}`,
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        fontSize: 10,
        color: COLORS.textMuted,
      }}>
        <span>CMA Dashboard v1.0 · Cuadro de Mando Analítico</span>
        <span>© DewCore Engineering · Universidad de Alicante 2025-26</span>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input[type=range] { height: 4px; }
      `}</style>
    </div>
  );
}

// Helper para convertir a CSV (necesario para export)
function toCSV(data, columns = null) {
  if (data.length === 0) return '';
  const cols = columns || Object.keys(data[0]);
  const header = cols.join(',');
  const rows = data.map(row => {
    return cols.map(col => {
      const value = row[col];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',');
  });
  return [header, ...rows].join('\n');
}
