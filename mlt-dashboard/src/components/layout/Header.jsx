import { COLORS } from '../../constants';
import logo from '../../assets/logo.png';

export default function Header({ allFlagsActive, resultado }) {
  return (
    <div style={{ marginBottom: 20, borderBottom: `1px solid ${COLORS.cardBorder}`, paddingBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        {/* Logo y título */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 300 }}>
          <img src={logo} alt="DewCore Logo" style={{ height: 50, width: "auto" }} />
          <div>
            <h1 style={{
              fontSize: 20,
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.02em",
              color: COLORS.primary,
              fontFamily: "'Red Hat Display', 'Inter', sans-serif"
            }}>
              MLT — Módulo Lógico-Termodinámico
            </h1>
            <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "4px 0 0 0" }}>
              Validación Empírica del Condensador Atmosférico · Patente ES-3046193-A1
            </p>
          </div>
        </div>

        {/* Flags compactos */}
        <div style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          padding: "6px 12px",
          background: allFlagsActive ? `${COLORS.success}08` : `${COLORS.error}08`,
          border: `1px solid ${allFlagsActive ? COLORS.success : COLORS.error}`,
          borderRadius: 0
        }}>
          <div
            title="Rentabilidad: El sistema produce más valor del que consume energéticamente (Ratio > 1)"
            style={{ display: "flex", gap: 6, alignItems: "center", cursor: "help" }}
          >
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: resultado.flagRentable ? COLORS.success : COLORS.error,
              boxShadow: resultado.flagRentable ? `0 0 6px ${COLORS.success}` : 'none'
            }} />
            <span style={{ fontSize: 9, color: COLORS.textDim, fontWeight: 600, letterSpacing: "0.03em" }}>RENT</span>
          </div>

          <div style={{ width: 1, height: 12, background: COLORS.cardBorder }} />

          <div
            title="Ecológico: Sistema con huella de carbono nula, sin emisiones contaminantes"
            style={{ display: "flex", gap: 6, alignItems: "center", cursor: "help" }}
          >
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: resultado.flagHuellaNula ? COLORS.success : COLORS.error,
              boxShadow: resultado.flagHuellaNula ? `0 0 6px ${COLORS.success}` : 'none'
            }} />
            <span style={{ fontSize: 9, color: COLORS.textDim, fontWeight: 600, letterSpacing: "0.03em" }}>ECO</span>
          </div>

          <div style={{ width: 1, height: 12, background: COLORS.cardBorder }} />

          <div
            title="Efluentes: Sin contaminantes líquidos generados en el proceso de condensación"
            style={{ display: "flex", gap: 6, alignItems: "center", cursor: "help" }}
          >
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: resultado.flagEfluentes ? COLORS.success : COLORS.error,
              boxShadow: resultado.flagEfluentes ? `0 0 6px ${COLORS.success}` : 'none'
            }} />
            <span style={{ fontSize: 9, color: COLORS.textDim, fontWeight: 600, letterSpacing: "0.03em" }}>H₂O</span>
          </div>

          <div style={{ width: 1, height: 12, background: COLORS.cardBorder }} />

          <div
            title="Operable: Condiciones atmosféricas dentro de rangos seguros de operación"
            style={{ display: "flex", gap: 6, alignItems: "center", cursor: "help" }}
          >
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: resultado.flagOperable ? COLORS.success : COLORS.error,
              boxShadow: resultado.flagOperable ? `0 0 6px ${COLORS.success}` : 'none'
            }} />
            <span style={{ fontSize: 9, color: COLORS.textDim, fontWeight: 600, letterSpacing: "0.03em" }}>OPR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
