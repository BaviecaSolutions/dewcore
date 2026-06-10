import { COLORS } from '../../constants';

export default function DataTag({ type }) {
  const config = {
    sim: {
      label: "PROTOTIPO",
      color: COLORS.warning,
      bg: COLORS.warningDim,
      border: COLORS.warningBorder,
      dot: COLORS.warning
    },
    real: {
      label: "REAL",
      color: COLORS.success,
      bg: COLORS.successDim,
      border: COLORS.successBorder,
      dot: COLORS.success
    },
    design: {
      label: "DISEÑO",
      color: COLORS.design,
      bg: "#ede9fe",
      border: "#c4b5fd",
      dot: COLORS.design
    },
  };
  const c = config[type];

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: "0.08em",
      padding: "3px 8px",
      borderRadius: 0,
      background: c.bg,
      color: c.color,
      border: `1.5px solid ${c.border}`,
      fontFamily: "'Red Hat Display', 'Inter', sans-serif"
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: c.dot,
        display: "inline-block"
      }} />
      {c.label}
    </span>
  );
}
