// =========================================================================
// CONSTANTS - Colores, configuración y constantes del CMA
// =========================================================================

// Paleta de colores profesional corporativa + colores business
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

  // Colores específicos para CMA (business/finanzas)
  revenue: "#10b981",           // Verde para ingresos
  cost: "#ef4444",              // Rojo para costes
  profit: "#059669",            // Verde esmeralda para beneficio
  loss: "#dc2626",              // Rojo para pérdidas
  neutral: "#6b7280",           // Gris para neutro/break-even

  // Acento (usar azul corporativo)
  accent: "#1a6eb7",
  accentDim: "#1d90cf",
  accentLight: "#aadeff",
};

// Constantes económicas y de negocio
export const ECONOMICS = {
  // Precios de referencia (€)
  precioAguaDesalada: 0.60,        // €/litro agua desalada convencional
  precioAguaPotable: 0.80,         // €/litro agua potable comercial
  precioElectricidad: 0.15,        // €/kWh (tarifa industrial media)

  // Costes operacionales
  costeMantenimientoAnual: 5000,   // €/año
  costePersonalHora: 25,           // €/hora operador
  costeQuimicosMes: 200,           // €/mes tratamiento

  // ROI y amortización
  inversionInicial: 50000,         // € (instalación PT1)
  vidaUtilAnios: 10,               // años
  tasaDescuento: 0.05,             // 5% tasa de descuento

  // Umbrales de rentabilidad
  ratioMinimoRentable: 1.0,        // Ratio eficiencia mínimo
  precioObjetivoLitro: 0.40,       // € precio objetivo para ser competitivo
  produccionMinimaDiaria: 20,      // litros/día mínimo viable
};

// Roles de usuario RBAC
export const ROLES = {
  OBSERVER: 'observer',     // Solo lectura
  AUDITOR: 'auditor',       // Lectura + exportación + histórico completo
};

// Permisos por rol
export const PERMISSIONS = {
  [ROLES.OBSERVER]: {
    viewDashboard: true,
    viewRealTimeData: true,
    viewHistorical: false,
    exportData: false,
    viewCosts: false,
    viewROI: false,
  },
  [ROLES.AUDITOR]: {
    viewDashboard: true,
    viewRealTimeData: true,
    viewHistorical: true,
    exportData: true,
    viewCosts: true,
    viewROI: true,
  },
};
