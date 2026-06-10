# 🌊 Proyecto DewCore — Sistema de Condensación Atmosférica

**TFG Universidad de Alicante 2025-26**
**Patente ES-3046193-A1**
**Condensador Atmosférico para Producción de Agua Dulce**

---

## 📋 Descripción del Proyecto

Sistema innovador de producción de agua dulce mediante condensación atmosférica controlada, utilizando agua de mar profunda como refrigerante natural. El proyecto incluye validación científica del modelo termodinámico y análisis de viabilidad económica.

---

## 🏗️ Arquitectura del Sistema (7 Módulos Canónicos)

### **Módulos Implementados** ✅

| Módulo | Estado | Puerto | Descripción |
|--------|--------|--------|-------------|
| **MLT** | ✅ Funcionando | 5174 | Dashboard científico (validación termodinámica) |
| **CMA** | ✅ Funcionando | 5175 | Dashboard ejecutivo (análisis económico + RBAC) |

### **Módulos Futuros** 🔄

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **MOE** | 🔄 Pendiente | Hardware: Sensores IoT (temperatura, humedad, presión, caudal) |
| **MAS** | 🔄 Pendiente | Backend: Adquisición y validación de señales del MOE |
| **MID** | ⚠️ Simulado | Backend: **Integración, normalización y distribución de datos** (cerebro del sistema) |
| **MPT** | 🔄 Pendiente | Base de datos: TimescaleDB para series temporales |
| **MCD** | 🔄 Pendiente | Service: Generación automática de documentos PDF/Excel |

---

## 📊 Dashboards Implementados

### MLT Dashboard (Módulo Lógico-Termodinámico)

**Propósito**: Validación científica del modelo termodinámico

**Características**:
- 4 KPIs científicos: Producción (l/h), Ratio Eficiencia, Punto Rocío (°C), % Acierto Modelo
- Gráfico 1: Validación Modelo (Teórico Magnus-Tetens vs Empírico sensores)
- Gráfico 2: Flags de Auditoría (RENTABLE, ECOLÓGICO, EFLUENTES, OPERABLE)
- 3 Tarjetas de datos: Condiciones Ambientales, Rendimiento, Validación
- Acceso: **Público** (sin autenticación)

**Usuarios objetivo**: Ingenieros, investigadores, equipo técnico

```bash
cd mlt-dashboard
npm install
npm run dev  # http://localhost:5174
```

---

### CMA Dashboard (Cuadro de Mando Analítico)

**Propósito**: Análisis de viabilidad económica para inversores

**Características**:
- 4 KPIs ejecutivos: Producción Diaria (l/día), Coste/Litro (€/l), Beneficio Anual (€/año), ROI (años)
- Gráfico 1: Producción con Proyección Realista (24h con factor circadiano)
- Gráfico 2: Análisis Económico (Ingresos vs Costes)
- Gráfico 3: Competitividad (vs Desalación €0.60/l)
- 3 Tarjetas económicas: Ingresos, Costes, Rentabilidad (solo Auditor)
- Exportación CSV de datos históricos (solo Auditor)
- Acceso: **RBAC** con 2 roles

**RBAC (Roles y Permisos)**:

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| **Observer** | `observer@dewcore.com` | `observer123` | Solo KPIs en tiempo real (sin histórico, sin export) |
| **Auditor** | `auditor@dewcore.com` | `auditor123` | Acceso completo (histórico + export + detalles económicos) |

**Usuarios objetivo**: Inversores, directivos, auditores financieros

```bash
cd cma-dashboard
npm install
npm run dev  # http://localhost:5175
```

---

## 🔄 Flujo de Datos (Arquitectura Completa)

### **Entorno Actual: Simulación**

```
┌──────────────────────────────────────────────────┐
│  dataGenerator.js                                │
│  └─ Simula MOE + MAS + MID (ciclo circadiano)   │
└──────────────┬───────────────────────────────────┘
               │
               ├──→ MLT Dashboard (científico)
               │    └─ http://localhost:5174
               │
               └──→ CMA Dashboard (ejecutivo)
                    └─ http://localhost:5175
```

### **Entorno Futuro: Producción Real**

```
[MOE] Sensores IoT (ESP32)
   ↓ MQTT (datos brutos)
[MAS] Backend adquisición (Node.js)
   ↓ WebSocket (datos validados)
[MID] ⭐ Backend integración (CEREBRO)
   │  ├─ Normalización (calibración, interpolación)
   │  ├─ Enriquecimiento (cálculos termodinámicos + económicos)
   │  └─ Distribución (WebSocket + SQL + Queue)
   ↓
   ├──→ [MPT] TimescaleDB (persistencia)
   ├──→ [MLT] Dashboard científico (WebSocket)
   ├──→ [CMA] Dashboard ejecutivo (WebSocket)
   └──→ [MCD] Queue → Generación PDF/Excel
```

**Documentación completa**: Ver [ARQUITECTURA_FLUJO_DATOS.md](ARQUITECTURA_FLUJO_DATOS.md)

---

## 🎨 Coherencia Visual entre Dashboards

Ambos dashboards (MLT y CMA) mantienen **coherencia visual total**:

### **Tipografía**
- **Red Hat Display**: Títulos, labels, textos (weights 400-800)
- **JetBrains Mono + Fira Code**: Valores numéricos (monospace)
- Fallback: Inter, system fonts

### **Formato Numérico**
- KPI Cards: `value.toFixed(2)` (siempre 2 decimales)
- MetricRow: `value.toFixed(2)` (consistente con KPIs)
- Tamaño valor KPI: `fontSize: 32`
- Tamaño valor MetricRow: `fontSize: 15`

### **Espaciado**
- KPI Cards: `padding: "20px"`
- MetricRow: `padding: "5px 0"`
- Gap entre valor y unidad: `gap: 8`
- Border: `borderTop: "4px solid"`

### **Paleta de Colores**
```javascript
// Corporativos
primary: "#1a6eb7"       // Azul DewCore
primaryLight: "#aadeff"
primaryMid: "#1d90cf"

// Estados
success: "#059669"       // Verde esmeralda
error: "#dc2626"         // Rojo
warning: "#d97706"       // Ámbar

// Business (solo CMA)
revenue: "#10b981"       // Verde ingresos
cost: "#ef4444"          // Rojo costes
profit: "#059669"        // Verde beneficio
loss: "#dc2626"          // Rojo pérdidas
```

---

## 💰 Constantes Económicas (CMA)

Configurables en [cma-dashboard/src/constants.js](cma-dashboard/src/constants.js#L52-L74):

```javascript
ECONOMICS = {
  // Precios de referencia
  precioAguaDesalada: 0.60,        // €/litro (desalación convencional)
  precioAguaPotable: 0.80,         // €/litro (agua comercial)
  precioElectricidad: 0.15,        // €/kWh (tarifa industrial media)

  // Costes operacionales
  costeMantenimientoAnual: 5000,   // €/año
  costePersonalHora: 25,           // €/hora operador
  costeQuimicosMes: 200,           // €/mes tratamiento

  // ROI y amortización
  inversionInicial: 50000,         // € (instalación PT1)
  vidaUtilAnios: 10,               // años
  tasaDescuento: 0.05,             // 5%

  // Umbrales
  ratioMinimoRentable: 1.0,
  precioObjetivoLitro: 0.40,       // € para ser competitivo
  produccionMinimaDiaria: 20,      // litros/día mínimo viable
};
```

---

## 🔬 Modelo Termodinámico

El sistema utiliza **fórmulas Magnus-Tetens** para cálculos de condensación:

### **Fórmulas Implementadas** (mlt_core.py → calculations.js)

1. **Presión de Saturación**:
   ```
   Psat(T) = 610.78 × exp((17.27 × T) / (T + 237.3))
   ```

2. **Punto de Rocío**:
   ```
   Td = (237.3 × ln(Pvapor / 610.78)) / (17.27 - ln(Pvapor / 610.78))
   ```

3. **Humedad Absoluta**:
   ```
   HA = (Pvapor × 2.16679) / (T + 273.15)
   ```

4. **Agua Condensable**:
   ```
   Condensable = (HAentrada - HAsalida) × CaudalAire × PeriodoHoras
   ```

5. **Ratio de Eficiencia**:
   ```
   Ratio = ProducciónLitros / ConsumoKWh
   ```

**Explicaciones detalladas**: Ver [mlt-dashboard/RESUMEN_EJECUTIVO.md](mlt-dashboard/RESUMEN_EJECUTIVO.md#L210-L238)

---

## 📦 Stack Tecnológico

### **Frontend (Implementado)**
- React 19.2.5 (functional components + hooks)
- Vite 8.0.11 (build tool, HMR)
- CSS-in-JS (inline styles)
- Google Fonts (Red Hat Display + JetBrains Mono)

### **Backend (Futuro)**
- Node.js + Express (API REST)
- PostgreSQL + TimescaleDB (series temporales)
- WebSocket (Socket.io para streaming)
- MQTT (comunicación con sensores MOE)
- RabbitMQ (cola de eventos para MCD)
- JWT (autenticación producción)

### **Documentación (Futuro - MCD)**
- Puppeteer / PDFKit (generación PDF)
- Handlebars / EJS (templates)
- LaTeX (documentos académicos)

---

## 🚀 Inicio Rápido

### **Requisitos**
- Node.js >= 18.x
- npm >= 9.x

### **Instalación y Ejecución**

```bash
# Clonar repositorio
git clone <repo-url>
cd dewcore-validacion

# MLT Dashboard (científico)
cd mlt-dashboard
npm install
npm run dev  # → http://localhost:5174

# En otra terminal: CMA Dashboard (ejecutivo)
cd ../cma-dashboard
npm install
npm run dev  # → http://localhost:5175
```

### **Build para Producción**

```bash
# MLT
cd mlt-dashboard
npm run build
npm run preview

# CMA
cd ../cma-dashboard
npm run build
npm run preview
```

---

## 📚 Documentación Detallada

| Documento | Descripción |
|-----------|-------------|
| [ARQUITECTURA_FLUJO_DATOS.md](ARQUITECTURA_FLUJO_DATOS.md) | Arquitectura completa de los 7 módulos canónicos + flujo de datos |
| [mlt-dashboard/RESUMEN_EJECUTIVO.md](mlt-dashboard/RESUMEN_EJECUTIVO.md) | Documentación completa del MLT Dashboard |
| [cma-dashboard/README.md](cma-dashboard/README.md) | Documentación completa del CMA Dashboard + RBAC |
| [mlt_core.py](mlt_core.py) | Modelo termodinámico original (Python) |

---

## 🎯 Roadmap

### **Fase 1: Simulación y Validación** ✅ COMPLETADA
- ✅ MLT Dashboard (validación científica)
- ✅ CMA Dashboard (análisis económico + RBAC)
- ✅ Documentación completa del flujo de datos
- ✅ Coherencia visual entre dashboards

### **Fase 2: Backend e Integración** 🔄 PRÓXIMA
- 🔄 MID Service (backend Node.js para integración)
- 🔄 MPT Database (TimescaleDB)
- 🔄 WebSocket real-time streaming
- 🔄 API REST para autenticación JWT

### **Fase 3: Hardware y Sensores** 🔄 FUTURA
- 🔄 MOE (sensores IoT con ESP32)
- 🔄 MAS (backend de adquisición MQTT)
- 🔄 Instalación PT1 (prototipo físico)
- 🔄 Calibración con datos reales

### **Fase 4: Documentación Automatizada** 🔄 FUTURA
- 🔄 MCD Service (generación automática PDF)
- 🔄 Templates (Acta TRL5, Reportes Ports 4.0, Anexo TFG)
- 🔄 Firma digital y blockchain hash
- 🔄 Integración con email (SendGrid)

---

## 🛡️ Seguridad

### **Entorno Actual (Desarrollo)**
⚠️ **NO apto para producción**:
- Credenciales hardcodeadas en código
- Contraseñas en texto plano
- Sesión en localStorage (vulnerable a XSS)
- Sin rate limiting
- Sin expiración de sesiones

### **Recomendaciones para Producción**
1. Backend JWT con tokens firmados
2. Hash de contraseñas (bcrypt/scrypt)
3. Rate limiting (express-rate-limit)
4. HTTPS obligatorio con certificado SSL/TLS
5. HttpOnly cookies (no localStorage)
6. CORS configurado correctamente
7. Expiración de sesiones (24h)

---

## 🧪 Testing (Futuro)

### **Fase 5: Calidad y Testing**
- 🔄 Tests unitarios (Vitest): 80%+ coverage en calculations.js
- 🔄 Tests de integración (Cypress): Flujos completos
- 🔄 CI/CD Pipeline (GitHub Actions)
- 🔄 Documentación técnica (JSDoc + Storybook)

---

## 📞 Contacto y Soporte

**Desarrollador**: Carlos (TFG Universidad de Alicante)
**Empresa**: DewCore Engineering
**Patente**: ES-3046193-A1
**Universidad**: Universidad de Alicante
**Año académico**: 2025-26

**Dashboards**:
- MLT (Científico): http://localhost:5174
- CMA (Ejecutivo): http://localhost:5175

**Calibración de datos**: Isla de Alborán (Memoria Ports 4.0)

---

## 📝 Licencia

Este proyecto es parte de un Trabajo Fin de Grado (TFG) de la Universidad de Alicante. Todos los derechos reservados para DewCore Engineering.

**Patente**: ES-3046193-A1 (Condensador Atmosférico)

---

**Última actualización**: 9 de mayo de 2026
**Versión**: v2.0
**Estado**: ✅ Dashboards MLT y CMA completados y funcionando correctamente
