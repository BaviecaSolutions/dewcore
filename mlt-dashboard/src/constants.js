// =========================================================================
// CONSTANTS - Colores, configuración y constantes del sistema
// =========================================================================

// Nueva paleta de colores profesional basada en colores corporativos
// Colores base: #1a6eb7 (azul primario), #aadeff (azul claro), #1d90cf (azul medio), #3b82f6 (azul brillante)
export const COLORS = {
  // Fondos y estructura
  bg: "#ffffff",
  bgSubtle: "#f8fafc",
  card: "#ffffff",
  cardBorder: "#e2e8f0",

  // Colores primarios (azules corporativos)
  primary: "#1a6eb7",           // Azul corporativo principal
  primaryLight: "#aadeff",      // Azul claro corporativo
  primaryMid: "#1d90cf",        // Azul medio corporativo
  primaryBright: "#3b82f6",     // Azul brillante corporativo
  primaryDim: "#dbeafe",        // Azul muy claro
  primaryDark: "#0f4c81",       // Azul oscuro

  // Estados (manteniendo funcionalidad)
  success: "#059669",           // Verde esmeralda (más profesional)
  successDim: "#d1fae5",
  successBorder: "#6ee7b7",

  error: "#dc2626",             // Rojo profesional
  errorDim: "#fee2e2",
  errorBorder: "#fca5a5",

  warning: "#d97706",           // Ámbar/naranja profesional
  warningDim: "#fef3c7",
  warningBorder: "#fbbf24",

  info: "#1d90cf",              // Azul medio (corporativo)
  infoDim: "#dbeafe",

  // Textos
  text: "#0f172a",              // Texto principal (más oscuro)
  textDim: "#475569",           // Texto secundario
  textMuted: "#64748b",         // Texto terciario
  textLight: "#94a3b8",         // Texto muy claro

  // Clasificación de datos
  simulated: "#d97706",         // Ámbar para datos simulados
  real: "#059669",              // Verde para datos reales
  design: "#7c3aed",            // Púrpura para diseño (mantiene distinción)

  // Acento (usar azul corporativo)
  accent: "#1a6eb7",
  accentDim: "#1d90cf",
  accentLight: "#aadeff",
};

// Constantes físicas y termodinámicas
export const MAGNUS_A = 17.625;
export const MAGNUS_B = 243.04;
export const Q_LATENTE_KCAL_L = 540.0;
export const KCAL_A_WH = 1.163;
export const RV = 461.5;
export const DELTA_RESISTENCIA_TERMICA = 1.0;
