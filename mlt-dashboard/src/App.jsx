import { useState, useEffect } from "react";
import { COLORS } from './constants';
import { calcularMLT } from './utils/calculations';
import { generarDatosSimulados } from './utils/dataGenerator';

// Layout components
import Header from './components/layout/Header';
import KPICard from './components/layout/KPICard';
import TimeControl from './components/layout/TimeControl';

// Feature cards
import AmbientalCard from './components/cards/AmbientalCard';
import RendimientoCard from './components/cards/RendimientoCard';
import ValidacionCard from './components/cards/ValidacionCard';
import FlagsCard from './components/cards/FlagsCard';
import TimeSeriesChart from './components/cards/TimeSeriesChart';

export default function MLTDashboard() {
  const [hora, setHora] = useState(12);
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useState([]);

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
  const r = calcularMLT(params);

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

  useEffect(() => {
    setHistory((prev) => {
      const entry = { hora, td: r.puntoRocio, prod: r.produccionLph, ratio: r.ratioEficiencia, condensable: r.condensableGm3 };
      const next = [...prev, entry];
      return next.length > 48 ? next.slice(-48) : next;
    });
  }, [hora, r.puntoRocio, r.produccionLph, r.ratioEficiencia, r.condensableGm3]);

  const allFlags = r.flagRentable && r.flagHuellaNula && r.flagEfluentes && r.flagOperable;

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: "'Red Hat Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: 16,
    }}>
      {/* Header */}
      <Header allFlagsActive={allFlags} resultado={r} />

      {/* Hero Section - KPIs principales */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12,
        marginBottom: 16,
      }}>
        <KPICard
          title="Producción"
          value={r.produccionLph || 0}
          unit="l/h"
          subtitle={`${((r.produccionLph || 0) * 24).toFixed(1)} l/día proyectados`}
          trend="up"
          trendValue="+5%"
          status="success"
        />
        <KPICard
          title="Ratio Eficiencia"
          value={r.ratioEficiencia}
          unit="×"
          subtitle={r.flagRentable ? "Sistema rentable" : "No rentable"}
          status={r.flagRentable ? "success" : "error"}
        />
        <KPICard
          title="Punto de Rocío"
          value={r.puntoRocio}
          unit="°C"
          subtitle="Temperatura crítica"
          status="info"
        />
        <KPICard
          title="Acierto Modelo"
          value={r.pctAcierto || 0}
          unit="%"
          subtitle="Precisión teórico vs empírico"
          status={r.pctAcierto > 80 ? "success" : "warning"}
        />
      </div>

      {/* Time Control */}
      <TimeControl
        hora={hora}
        playing={playing}
        onHoraChange={setHora}
        onPlayingToggle={() => setPlaying(!playing)}
      />

      {/* Main Grid - Datos principales */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 12,
        marginBottom: 16,
      }}>
        <AmbientalCard datos={datos} resultado={r} />
        <RendimientoCard datos={datos} resultado={r} />
        <ValidacionCard datos={datos} resultado={r} />
      </div>

      {/* Time Series Chart - Full Width */}
      <div style={{ marginBottom: 16 }}>
        <TimeSeriesChart history={history} />
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 16,
        padding: "10px 0",
        borderTop: `1px solid ${COLORS.cardBorder}`,
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <span style={{ fontSize: 10, color: COLORS.textMuted }}>
          MLT v2.0 · Calibrado contra Isla de Alborán (Memoria Ports 4.0)
        </span>
        <span style={{ fontSize: 10, color: COLORS.textMuted }}>
          © DewCore Engineering · TFG · Universidad de Alicante 2025-26
        </span>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input[type=range] { height: 4px; }
      `}</style>
    </div>
  );
}
