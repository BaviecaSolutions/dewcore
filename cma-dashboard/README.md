# CMA Dashboard — Cuadro de Mando Analítico

**Dashboard Ejecutivo para Análisis Económico del Condensador Atmosférico**
DewCore Engineering · Patente ES-3046193-A1

---

## 📋 Descripción

El **CMA Dashboard** (Cuadro de Mando Analítico) es un panel ejecutivo diseñado para inversores, directivos y auditores que necesitan analizar la viabilidad económica del sistema de condensación atmosférica.

A diferencia del MLT Dashboard (científico/técnico), el CMA se enfoca en:
- **Métricas de negocio**: Ingresos, costes, beneficios, ROI
- **Proyecciones realistas**: Producción diaria/anual basada en histórico
- **Comparativa económica**: Coste vs desalación convencional
- **Control de acceso RBAC**: Roles Observer y Auditor con permisos diferenciados

---

## 🚀 Inicio Rápido

### Instalación

```bash
cd cma-dashboard
npm install
```

### Desarrollo

```bash
npm run dev
```

El dashboard estará disponible en: **http://localhost:5175**

### Build para producción

```bash
npm run build
npm run preview
```

---

## 🔐 Sistema de Autenticación

El CMA implementa un sistema RBAC (Role-Based Access Control) con 2 roles:

### 1. **Observer** (Observador)
- **Email**: `observer@dewcore.com`
- **Contraseña**: `observer123`
- **Permisos**:
  - ✅ Ver dashboard en tiempo real
  - ✅ Ver KPIs actuales (producción, coste/litro)
  - ❌ NO puede ver histórico completo
  - ❌ NO puede exportar datos
  - ❌ NO puede ver detalles económicos (ingresos/costes/beneficios)

### 2. **Auditor** (Auditor Completo)
- **Email**: `auditor@dewcore.com`
- **Contraseña**: `auditor123`
- **Permisos**:
  - ✅ Ver dashboard completo
  - ✅ Ver histórico de series temporales
  - ✅ Exportar datos a CSV
  - ✅ Ver detalles económicos completos
  - ✅ Ver proyecciones financieras

---

## 📊 Funcionalidades Principales

### 1. **KPIs Ejecutivos**

4 tarjetas grandes con métricas clave:

| KPI | Descripción | Unidad |
|-----|-------------|--------|
| **Producción Diaria** | Litros de agua proyectados para 24h | l/día |
| **Coste / Litro** | Coste de producción por litro (energía + op.) | €/l |
| **Beneficio Anual** | Beneficio proyectado anual | €/año |
| **ROI** | Años para recuperar inversión inicial | años |

### 2. **Series Temporales de Negocio** (Solo Auditor)

3 gráficos business-oriented:

#### a) **Gráfico de Producción**
- Histórico de producción (l/h)
- Media móvil ponderada (últimas 6h)
- Proyección realista 24h con factor circadiano (0.85)
- Interpretación de cálculo de proyección

#### b) **Gráfico de Análisis Económico**
- Línea de ingresos (verde, valor del agua)
- Línea de costes (roja punteada, energía + operacional)
- Balance acumulado (beneficio/pérdida)
- Interpretación del balance

#### c) **Gráfico de Competitividad**
- Coste por litro del sistema (azul/verde)
- Línea de referencia desalación (€0.60/l, roja)
- Ventaja competitiva (%)
- Análisis de viabilidad comercial

### 3. **Resumen Económico Detallado** (Solo Auditor)

3 tarjetas con desglose completo:

**Tarjeta Ingresos:**
- Ingresos por hora (€/h)
- Proyecciones diarias y anuales
- Precio referencia del agua (€0.60/l)

**Tarjeta Costes:**
- Costes totales por hora
- Desglose: energía + operacional
- Coste por litro producido

**Tarjeta Rentabilidad:**
- Beneficio/hora (€/h)
- Beneficio anual proyectado
- ROI en años
- Ventaja competitiva vs desalación (%)

### 4. **Exportación de Datos** (Solo Auditor)

Botón "📥 EXPORTAR CSV" que genera un archivo con:
- Hora de cada muestra
- Producción (l/h)
- Beneficio (€/h)
- Coste (€/l)
- Ratio eficiencia
- Punto de rocío (°C)
- Flags: Rentable (SÍ/NO), Competitivo (SÍ/NO)

Formato: `cma_historico_YYYY-MM-DDTHH-MM-SS.csv`

---

## 🎨 Diseño y UX

### Paleta de Colores Business

Además de la paleta corporativa del MLT, el CMA añade:

```javascript
// Colores financieros
revenue: "#10b981",    // Verde para ingresos
cost: "#ef4444",       // Rojo para costes
profit: "#059669",     // Verde esmeralda para beneficio
loss: "#dc2626",       // Rojo para pérdidas
neutral: "#6b7280",    // Gris para neutro/break-even
```

### Diferencias Visuales con MLT

| Aspecto | MLT (Científico) | CMA (Ejecutivo) |
|---------|------------------|-----------------|
| **Foco** | Validación termodinámica | Viabilidad económica |
| **KPIs** | Producción, Ratio, Punto Rocío, % Acierto | Producción, Coste/L, Beneficio, ROI |
| **Gráficos** | Teórico vs Empírico, Flags de auditoría | Producción + proyección, Costes vs Ingresos, Competitividad |
| **Autenticación** | No requiere login | RBAC con 2 roles |
| **Exportación** | No disponible | CSV para Auditores |
| **Permisos** | Acceso público | Restricciones por rol |

---

## 💰 Constantes Económicas

Configuradas en `src/constants.js`:

```javascript
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
```

**Nota**: Estos valores son configurables y deben ajustarse según:
- Ubicación geográfica (precio electricidad varía por país)
- Escala de instalación (inversión inicial)
- Modelo de negocio (precio agua puede ser superior a €0.60 si es potable premium)

---

## 📐 Arquitectura de Código

### Estructura de Carpetas

```
cma-dashboard/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Card.jsx                 # Tarjeta base reutilizable
│   │   │   └── MetricRow.jsx            # Fila de métrica (label + valor)
│   │   ├── layout/
│   │   │   ├── Header.jsx               # Header con logo, user info, logout
│   │   │   ├── Login.jsx                # Pantalla de login RBAC
│   │   │   └── BusinessKPICard.jsx      # Tarjeta KPI ejecutiva
│   │   └── cards/
│   │       └── BusinessCharts.jsx       # 3 gráficos de negocio
│   ├── utils/
│   │   ├── auth.js                      # Sistema autenticación RBAC
│   │   ├── calculations.js              # Cálculos termodinámicos + business
│   │   ├── dataGenerator.js             # Generador datos simulados
│   │   └── export.js                    # Exportación CSV
│   ├── constants.js                     # Colores + constantes económicas
│   ├── App.jsx                          # Componente principal (con login gate)
│   └── main.jsx                         # Entry point React
├── index.html                           # HTML base
├── vite.config.js                       # Configuración Vite (puerto 5175)
├── package.json
└── README.md
```

### Flujo de Autenticación

```
Usuario abre http://localhost:5175
    ↓
App.jsx verifica localStorage['cma_session']
    ↓
┌─── NO existe sesión ───┐           ┌─── SÍ existe sesión ───┐
│                        │           │                        │
│   Mostrar Login.jsx    │           │   Mostrar Dashboard    │
│                        │           │   con Header + KPIs    │
│   Usuario elige rol:   │           │                        │
│   - Observer           │           │   Permisos filtrados   │
│   - Auditor            │           │   según session.role   │
│                        │           │                        │
│   auth.login() valida  │           │   Botón "CERRAR        │
│   credenciales mock    │           │   SESIÓN" ejecuta      │
│                        │           │   auth.logout()        │
│   Guardar sesión en    │           │                        │
│   localStorage         │           │                        │
│                        │           │                        │
│   setSession(...)      │           │   Limpiar localStorage │
│   → Re-render          │           │   setSession(null)     │
│                        │           │   → Re-render Login    │
└────────────────────────┘           └────────────────────────┘
```

---

## 🔬 Cálculos de Negocio

El archivo `src/utils/calculations.js` implementa funciones específicas de CMA:

### 1. **costePorLitro(energiaKwh, litrosProducidos)**
Calcula el coste total de producción por litro:
```
Coste/litro = (energía × €0.15/kWh + costeOperacional) / litros
```

### 2. **beneficioNeto(litros, energiaKwh)**
Calcula beneficio, ingresos y costes:
```
Ingresos = litros × €0.60 (precio agua desalada)
Costes = energía × €0.15 + mantenimiento + químicos
Beneficio = Ingresos - Costes
```

### 3. **roiSimple(beneficioAnual)**
Años para recuperar inversión:
```
ROI = Inversión Inicial (€50,000) / Beneficio Anual (€/año)
```

### 4. **proyeccionProduccion(historial, horas=24)**
Proyección realista basada en media móvil ponderada:
```
Media = Σ(últimas 6h de producción) / 6
Proyección 24h = Media × 24 × factor_circadiano (0.85)
```

**Factor circadiano**: 0.85 = 85% porque el sistema produce menos de noche (menor humedad/temperatura)

---

## 🎯 Casos de Uso

### Uso 1: Inversor Evaluando Viabilidad

**Rol**: Observer (vista limitada)

1. Login como `observer@dewcore.com`
2. Ver KPIs actuales: Producción, Coste/litro, Beneficio anual, ROI
3. Verificar que ROI < 5 años (flag verde)
4. Confirmar que coste/litro < €0.60 (competitivo vs desalación)
5. **Decisión**: Si todos los indicadores son positivos → Interés en invertir

**Limitación**: No puede ver histórico ni exportar. Si quiere análisis profundo, debe contactar al equipo técnico (rol Auditor).

### Uso 2: Auditor Financiero Generando Informe

**Rol**: Auditor (acceso completo)

1. Login como `auditor@dewcore.com`
2. Iniciar simulación 24h (botón "▶ SIMULAR 24H")
3. Observar evolución de gráficos:
   - Producción: Pico a mediodía (mayor humedad), valle de madrugada
   - Económico: Ingresos siempre por encima de costes (rentable)
   - Competitividad: Coste por debajo de línea roja desalación
4. Pausar simulación a las 24h (datos completos)
5. Revisar tarjetas económicas:
   - Beneficio anual proyectado: ~€X,XXX
   - ROI: X.X años
   - Ventaja vs desalación: +XX%
6. Click "📥 EXPORTAR CSV"
7. Abrir CSV en Excel → Generar gráficos personalizados
8. **Entregable**: Informe financiero con proyecciones respaldadas por datos

### Uso 3: Directivo Comparando Escenarios

**Rol**: Auditor

**Escenario A**: Condiciones óptimas (verano, alta humedad)
1. Ajustar simulación manualmente (slider a hora 14:00 = pico humedad)
2. Observar: Producción = 4.5 l/h, Coste = €0.25/l, Beneficio = +€1.20/h
3. Anotar ROI: 3.2 años

**Escenario B**: Condiciones desfavorables (invierno, baja humedad)
1. Ajustar slider a hora 04:00 (madrugada fría)
2. Observar: Producción = 1.2 l/h, Coste = €0.52/l, Beneficio = +€0.08/h
3. Anotar ROI: 8.5 años

**Decisión Ejecutiva**: El sistema es rentable en promedio, pero en invierno opera en límite. Considerar:
- Instalar acumuladores térmicos para estabilizar producción
- Operar solo en horas pico durante invierno (reducir operación nocturna)

---

## 📈 Roadmap CMA

### Fase 1: Implementado (Actual)
- ✅ RBAC con 2 roles (Observer, Auditor)
- ✅ Login screen con credenciales demo
- ✅ KPIs ejecutivos (4 tarjetas principales)
- ✅ 3 gráficos de negocio (Producción, Económico, Competitividad)
- ✅ Exportación CSV
- ✅ Restricciones de permisos por rol
- ✅ Cálculos de negocio (coste/l, beneficio, ROI)

### Fase 2: Backend y Persistencia (Próxima)
- 🔄 API REST para autenticación real (JWT)
- 🔄 Base de datos PostgreSQL con TimescaleDB
- 🔄 Almacenamiento de sesiones de simulación
- 🔄 Histórico de datos reales (no simulados)
- 🔄 WebSocket para streaming de datos en tiempo real

### Fase 3: Funcionalidades Avanzadas
- 🔄 Dashboard multi-sitio (varias instalaciones PT1, PT2, etc.)
- 🔄 Comparativa de periodos (mes actual vs mes anterior)
- 🔄 Alertas por email/Telegram cuando ROI > umbral
- 🔄 Generación automática de informes PDF
- 🔄 Integración con APIs de precio energía en tiempo real
- 🔄 Configuración de constantes económicas desde UI (sin editar código)

### Fase 4: Analytics y ML
- 🔄 Predicción de producción con modelos ML (ARIMA, Prophet)
- 🔄 Optimización automática de horarios de operación
- 🔄 Análisis de sensibilidad (¿qué pasa si electricidad sube 20%?)
- 🔄 Simulación Monte Carlo para análisis de riesgo

---

## 🔗 Relación con otros Módulos

### MLT Dashboard (Científico)
- **Puerto**: 5174
- **Foco**: Validación termodinámica del modelo Magnus-Tetens
- **Usuarios**: Ingenieros, investigadores, equipo técnico
- **Datos compartidos**: Producción (l/h), Punto de rocío, Ratio eficiencia
- **Relación**: El CMA consume los cálculos termodinámicos del MLT y añade capa económica

### MCD Service (Futuro - Documentación)
- **Tipo**: Backend service (no dashboard visual)
- **Foco**: Generación automática de documentos (PDF, Excel, templates TFG)
- **Usuarios**: Administradores, equipo académico
- **Datos consumidos**: Métricas del CMA (beneficio, ROI) + MLT (validación científica)
- **Relación**: MCD leerá datos del CMA para generar "Actas de Verificación Económica TRL 5"

---

## 🛡️ Seguridad

### Limitaciones Actuales (Entorno de Desarrollo)

⚠️ **El sistema actual NO es apto para producción**:

- Credenciales hardcodeadas en `src/utils/auth.js`
- Contraseñas en texto plano
- Sesión guardada en `localStorage` (vulnerable a XSS)
- No hay rate limiting (puede hacerse fuerza bruta)
- No hay expiración de sesiones (permanecen indefinidamente)

### Recomendaciones para Producción

1. **Backend con JWT**:
   ```
   POST /api/auth/login
   → Devuelve JWT firmado con secret
   → Frontend guarda JWT en httpOnly cookie (no localStorage)
   ```

2. **Hash de contraseñas** (bcrypt, scrypt):
   ```javascript
   const hash = await bcrypt.hash(password, 10);
   ```

3. **Rate limiting** (express-rate-limit):
   ```javascript
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutos
     max: 5 // 5 intentos
   });
   app.use('/api/auth/login', limiter);
   ```

4. **HTTPS obligatorio** (producción):
   - Certificado SSL/TLS
   - HSTS headers
   - Secure cookies

5. **Expiración de sesiones**:
   ```javascript
   const token = jwt.sign({ userId }, secret, { expiresIn: '24h' });
   ```

---

## 📞 Soporte y Contacto

**Desarrollador**: Carlos (TFG Universidad de Alicante)
**Empresa**: DewCore Engineering
**Patente**: ES-3046193-A1

**Dashboards**:
- MLT (Científico): http://localhost:5174
- CMA (Ejecutivo): http://localhost:5175

---

**Última actualización**: 9 de mayo de 2026
**Versión**: CMA Dashboard v1.0
**Estado**: ✅ Completado y funcionando correctamente
