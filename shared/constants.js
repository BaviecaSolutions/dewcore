/**
 * @fileoverview SHARED CONSTANTS - DewCore Validation System
 *
 * Contains all physical constants, color palette, economic parameters,
 * and RBAC configuration shared across backend and frontend modules.
 *
 * Mayéutica Functionalities: Shared across all modules (F01-F23)
 * Dependencies: None (pure constants)
 */

// =========================================================================
// COLOR PALETTE - Professional corporate design system
// =========================================================================

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

// =========================================================================
// PHYSICAL CONSTANTS - Thermodynamic and atmospheric
// =========================================================================

// Magnus-Tetens equation constants for saturation pressure
export const MAGNUS_A = 17.625;
export const MAGNUS_B = 243.04;  // °C

// Energy constants
export const Q_LATENTE_KCAL_L = 540.0;  // Latent heat of vaporization (kcal/L)
export const KCAL_A_WH = 1.163;          // Conversion factor kcal to Wh

// Gas constant for water vapor
export const RV = 461.5;  // J/(kg·K)

// Thermal resistance delta (for thermal footprint calculation)
export const DELTA_RESISTENCIA_TERMICA = 1.0;  // °C

// =========================================================================
// ECONOMIC CONSTANTS - Business and financial parameters
// =========================================================================

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

// =========================================================================
// RBAC - Role-Based Access Control
// =========================================================================

export const ROLES = {
  OBSERVER: 'observer',     // Solo lectura, KPIs ejecutivos
  AUDITOR: 'auditor',       // Lectura + exportación + histórico completo + datos científicos
};

export const PERMISSIONS = {
  [ROLES.OBSERVER]: {
    viewDashboard: true,
    viewRealTimeData: true,
    viewHistorical: false,
    exportData: false,
    viewCosts: false,
    viewROI: false,
    viewScientificData: false,
  },
  [ROLES.AUDITOR]: {
    viewDashboard: true,
    viewRealTimeData: true,
    viewHistorical: true,
    exportData: true,
    viewCosts: true,
    viewROI: true,
    viewScientificData: true,
  },
};
