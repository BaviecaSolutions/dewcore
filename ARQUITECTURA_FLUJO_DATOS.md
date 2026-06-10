# 🏗️ Arquitectura del Flujo de Datos — Sistema DewCore

**Proyecto TFG · Universidad de Alicante 2025-26**
**Patente ES-3046193-A1 · Condensador Atmosférico**

---

## 📋 Índice

1. [Visión General de los 7 Módulos](#visión-general-de-los-7-módulos)
2. [Flujo de Datos Completo](#flujo-de-datos-completo)
3. [Módulos Implementados vs Futuros](#módulos-implementados-vs-futuros)
4. [Rol del MID (Integración de Datos)](#rol-del-mid-integración-de-datos)
5. [Generación de Documentos (MCD)](#generación-de-documentos-mcd)
6. [Entorno Actual: Simulación](#entorno-actual-simulación)

---

## 1. Visión General de los 7 Módulos

### **MOE** — Módulo de Observación del Entorno
**Tipo**: Hardware + Firmware
**Función**: Captura de datos atmosféricos y marinos en tiempo real
**Responsabilidad**: Adquisición de datos brutos desde sensores físicos

**Sensores incluidos**:
- Temperatura aire (entrada/salida)
- Humedad relativa (entrada/salida)
- Presión atmosférica
- Velocidad del viento
- Temperatura agua de mar (profunda/retorno)
- Caudal de agua dulce producida

**Salida**: Datos brutos sin procesar (JSON/MQTT) → MAS

---

### **MAS** — Módulo de Adquisición de Señales
**Tipo**: Backend Service (Node.js/Python)
**Función**: Recepción y almacenamiento de datos brutos del MOE
**Responsabilidad**: Buffer temporal de datos + validación básica

**Operaciones**:
- Recibir streams MQTT del MOE
- Validar que los valores estén en rangos físicamente posibles
- Rechazar datos corruptos (NaN, out-of-range)
- Almacenar en buffer temporal (Redis o TimescaleDB raw table)
- Enviar datos brutos al MID cada X segundos

**Salida**: Datos brutos validados (JSON) → MID

---

### **MID** — Módulo de Integración de Datos
**Tipo**: Backend Service (Node.js/Python con lógica de negocio)
**Función**: **NORMALIZACIÓN, ENRIQUECIMIENTO Y DISTRIBUCIÓN**
**Responsabilidad**: Transformar datos brutos en datos utilizables para dashboards y documentos

**⭐ Este es el módulo CLAVE del flujo de datos**

**Operaciones**:
1. **Normalización**:
   - Convertir unidades (si MOE envía °F → convertir a °C)
   - Interpolar valores faltantes (si un sensor falla momentáneamente)
   - Aplicar calibración de sensores (offset, gain)
   - Calcular promedios móviles para suavizar ruido

2. **Enriquecimiento**:
   - Calcular métricas derivadas usando `mlt_core.py`:
     - Punto de rocío (Td)
     - Humedad absoluta (HA)
     - Agua condensable teórica (g/m³)
     - Ratio de eficiencia
     - Flags (rentable, ecológico, operable)
   - Añadir metadata: timestamp ISO, location, device_id

3. **Distribución**:
   - Almacenar en **MPT** (TimescaleDB) para histórico
   - Enviar a **MLT Dashboard** vía WebSocket (datos científicos)
   - Enviar a **CMA Dashboard** vía WebSocket (datos de negocio)
   - Encolar en **MCD Queue** para generación de documentos

**Salida**:
- Datos normalizados → MPT (persistencia)
- Datos en tiempo real → MLT/CMA (WebSocket)
- Eventos documentales → MCD (Queue)

---

### **MLT** — Módulo Lógico-Termodinámico
**Tipo**: Frontend Dashboard (React)
**Función**: Visualización científica y validación del modelo
**Responsabilidad**: Dashboard técnico para ingenieros e investigadores

**Datos que consume del MID**:
- Condiciones ambientales (T, HR, P)
- Condiciones marinas (T agua fría/retorno)
- Producción empírica (l/h medida)
- Cálculos teóricos (del MID que usa mlt_core.py)
- Flags de auditoría

**Visualizaciones**:
- KPIs científicos: Producción, Ratio, Punto Rocío, % Acierto
- Gráfico 1: Validación Modelo (Teórico vs Empírico)
- Gráfico 2: Flags de Auditoría (histórico de cumplimiento)
- Tarjetas de condiciones: Ambiental, Rendimiento, Validación

**NO consume datos brutos del MAS** → Solo datos procesados del MID

---

### **MPT** — Módulo de Persistencia Temporal
**Tipo**: Base de Datos (TimescaleDB / PostgreSQL)
**Función**: Almacenamiento de series temporales normalizadas
**Responsabilidad**: Histórico de datos para análisis y auditorías

**Esquema de tablas**:

```sql
-- Tabla principal de mediciones normalizadas
CREATE TABLE measurements (
  time TIMESTAMPTZ NOT NULL,
  device_id TEXT,
  temp_air_in REAL,
  temp_air_out REAL,
  hr_in REAL,
  hr_out REAL,
  pressure REAL,
  temp_water_cold REAL,
  temp_water_return REAL,
  production_lph REAL,
  power_consumption_w REAL,
  -- Métricas calculadas (del MID)
  dew_point REAL,
  absolute_humidity REAL,
  condensable_gm3 REAL,
  efficiency_ratio REAL,
  flag_rentable BOOLEAN,
  flag_huella_nula BOOLEAN,
  flag_efluentes BOOLEAN,
  flag_operable BOOLEAN,
  PRIMARY KEY (time, device_id)
);

SELECT create_hypertable('measurements', 'time');
```

**Políticas de retención**:
- Últimas 48 horas: Resolución 30 segundos (alta frecuencia)
- Últimos 7 días: Agregado a 5 minutos
- Últimos 30 días: Agregado a 1 hora
- Histórico completo: Agregado a 1 día (indefinido)

**Consultas típicas**:
- `SELECT * FROM measurements WHERE time > NOW() - INTERVAL '24 hours'` (MLT/CMA para gráficos)
- `SELECT AVG(production_lph) FROM measurements WHERE time > NOW() - INTERVAL '7 days'` (CMA para proyecciones)

---

### **CMA** — Cuadro de Mando Analítico
**Tipo**: Frontend Dashboard (React) con RBAC
**Función**: Visualización ejecutiva y análisis económico
**Responsabilidad**: Dashboard de negocio para inversores y directivos

**Datos que consume del MID**:
- Producción (l/h)
- Consumo energético (kWh)
- **Cálculos económicos** (añadidos por el MID):
  - Coste por litro (€/l)
  - Ingresos (€/h basado en precio agua)
  - Costes (€/h energía + operacional)
  - Beneficio (€/h)
  - ROI (años)
  - Ventaja competitiva vs desalación (%)

**Visualizaciones**:
- KPIs ejecutivos: Producción Diaria, Coste/L, Beneficio Anual, ROI
- Gráfico 1: Producción con Proyección Realista (24h)
- Gráfico 2: Análisis Económico (Ingresos vs Costes)
- Gráfico 3: Competitividad (vs Desalación €0.60/l)
- Tarjetas económicas: Ingresos, Costes, Rentabilidad (solo Auditor)

**Autenticación RBAC**:
- Observer: Solo KPIs en tiempo real
- Auditor: Histórico + Exportación CSV

**NO consume datos brutos del MAS** → Solo datos procesados del MID con cálculos económicos

---

### **MCD** — Módulo de Certificación y Documentación
**Tipo**: Backend Service (Node.js + Puppeteer/PDFKit)
**Función**: Generación automática de documentos PDF/Excel
**Responsabilidad**: Producir reportes oficiales, actas, certificaciones

**Documentos que genera**:

1. **Acta de Verificación TRL 5** (PDF automático):
   - Datos del MID: Producción promedio 7 días, Flags cumplimiento, % Acierto modelo
   - Incluye firma digital y timestamp criptográfico
   - Template: `templates/acta_verificacion_trl5.html`

2. **Reporte Semanal Ports 4.0** (JSON + PDF):
   - Datos del MPT: Agregados semanales de producción, energía, eficiencia
   - Formato JSON para API + PDF visual para técnicos
   - Template: `templates/reporte_ports4.html`

3. **Anexo TFG (Memoria Universidad)** (LaTeX → PDF):
   - Datos del MPT: Histórico completo del periodo de pruebas
   - Gráficos exportados del MLT/CMA
   - Tablas comparativas teórico vs empírico
   - Template: `templates/tfg_anexo.tex`

4. **Certificación de Producción** (PDF + Blockchain hash):
   - Datos del MPT: Producción mensual certificada
   - Hash SHA-256 del documento + timestamp en blockchain (opcional)
   - Para auditorías externas o venta de agua certificada

**Fuentes de datos**:
- **MID** (vía Queue): Para reportes en tiempo real o disparados por eventos
- **MPT** (vía SQL): Para reportes históricos agregados

**Ejemplo de flujo**:
```
Evento: "Producción diaria > 50 litros"
  → MID detecta evento
  → MID encola mensaje en MCD Queue: { type: "milestone", data: {...} }
  → MCD consume mensaje
  → MCD consulta MPT para histórico completo
  → MCD renderiza template HTML con datos
  → MCD convierte HTML → PDF (Puppeteer)
  → MCD almacena PDF en storage (S3/local)
  → MCD envía email con PDF adjunto
```

---

## 2. Flujo de Datos Completo

### **Diagrama de Flujo (Producción Real)**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CAPA FÍSICA (Hardware)                        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                   ┌───────────────▼───────────────┐
                   │  MOE (Sensores IoT)          │
                   │  - Temperatura aire (DHT22)   │
                   │  - Humedad (DHT22)            │
                   │  - Presión (BMP280)           │
                   │  - T agua (DS18B20)           │
                   │  - Caudal (YF-S201)           │
                   │  - Potencia (PZEM-004T)       │
                   └───────────────┬───────────────┘
                                   │ MQTT (datos brutos JSON)
                                   │ Ejemplo: {"temp_air": 23.4, "hr": 78.2, ...}
                                   │
┌─────────────────────────────────▼────────────────────────────────────┐
│                        CAPA DE ADQUISICIÓN                           │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                   ┌───────────────▼───────────────┐
                   │  MAS (Adquisición Señales)   │
                   │  - Recibir MQTT broker        │
                   │  - Validar rangos físicos     │
                   │  - Buffer temporal (Redis)    │
                   │  - Rechazar datos corruptos   │
                   └───────────────┬───────────────┘
                                   │ HTTP POST/WebSocket (datos validados)
                                   │ Cada 30 segundos batch
                                   │
┌─────────────────────────────────▼────────────────────────────────────┐
│                   CAPA DE INTEGRACIÓN (核心)                          │
└──────────────────────────────────────────────────────────────────────┘
                                   │
         ┌─────────────────────────▼─────────────────────────┐
         │  MID (Integración y Normalización) — ⭐ CEREBRO   │
         │  ┌────────────────────────────────────────────┐   │
         │  │ 1. NORMALIZACIÓN                          │   │
         │  │    - Convertir unidades                   │   │
         │  │    - Interpolar valores faltantes         │   │
         │  │    - Aplicar calibración sensores         │   │
         │  │    - Suavizar ruido (media móvil)         │   │
         │  ├────────────────────────────────────────────┤   │
         │  │ 2. ENRIQUECIMIENTO (mlt_core.py)          │   │
         │  │    - Calcular Td (punto de rocío)         │   │
         │  │    - Calcular HA (humedad absoluta)       │   │
         │  │    - Calcular agua condensable (g/m³)     │   │
         │  │    - Calcular ratio eficiencia            │   │
         │  │    - Calcular métricas económicas:        │   │
         │  │      * Coste/litro (€/l)                  │   │
         │  │      * Beneficio (€/h)                    │   │
         │  │      * ROI (años)                         │   │
         │  │    - Evaluar flags (rentable, eco, op.)   │   │
         │  ├────────────────────────────────────────────┤   │
         │  │ 3. DISTRIBUCIÓN                           │   │
         │  │    - Persistir en MPT (TimescaleDB)       │   │
         │  │    - Stream a MLT (WebSocket)             │   │
         │  │    - Stream a CMA (WebSocket)             │   │
         │  │    - Encolar eventos a MCD (RabbitMQ)     │   │
         │  └────────────────────────────────────────────┘   │
         └────────┬───────────────┬───────────────┬──────────┘
                  │               │               │
        ┌─────────▼─────┐  ┌──────▼──────┐  ┌────▼────────┐
        │ MPT (BBDD)    │  │ MLT Dash    │  │ CMA Dash    │
        │ TimescaleDB   │  │ (Científico)│  │ (Ejecutivo) │
        │               │  │             │  │             │
        │ - Mediciones  │  │ WebSocket   │  │ WebSocket   │
        │ - Agregados   │  │ Real-time   │  │ Real-time   │
        │ - Histórico   │  └─────────────┘  └─────────────┘
        └───────┬───────┘
                │
                │ SQL Queries
                │ (histórico agregado)
                │
        ┌───────▼───────────────────┐
        │  MCD (Documentación)      │
        │  ┌─────────────────────┐  │
        │  │ Queue Consumer      │  │
        │  │ (RabbitMQ/Redis)    │  │
        │  └──────────┬──────────┘  │
        │             │              │
        │  ┌──────────▼──────────┐  │
        │  │ Template Engine     │  │
        │  │ (Handlebars/EJS)    │  │
        │  └──────────┬──────────┘  │
        │             │              │
        │  ┌──────────▼──────────┐  │
        │  │ PDF Generator       │  │
        │  │ (Puppeteer/PDFKit)  │  │
        │  └──────────┬──────────┘  │
        │             │              │
        │  ┌──────────▼──────────┐  │
        │  │ Storage & Email     │  │
        │  │ (S3 + SendGrid)     │  │
        │  └─────────────────────┘  │
        └───────────────────────────┘
```

---

## 3. Módulos Implementados vs Futuros

### **Estado Actual (2026-05-09)**

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **MOE** | ❌ No implementado | Hardware en diseño (próxima fase) |
| **MAS** | ❌ No implementado | Backend pendiente |
| **MID** | ⚠️ Simulado parcialmente | Lógica en `dataGenerator.js` + `calculations.js` (simulación) |
| **MLT** | ✅ **IMPLEMENTADO** | Dashboard científico funcionando en puerto 5174 |
| **MPT** | ❌ No implementado | TimescaleDB pendiente de instalación |
| **CMA** | ✅ **IMPLEMENTADO** | Dashboard ejecutivo funcionando en puerto 5175 |
| **MCD** | ❌ No implementado | Service de documentación pendiente |

### **Entorno Actual: Simulación Completa**

**Problema**: No tenemos MOE (sensores físicos) ni MAS (backend de adquisición).

**Solución Temporal**:
- `dataGenerator.js` simula el **MOE + MAS + MID** en un solo archivo
- Genera datos con ciclo circadiano matemático (funciones trigonométricas)
- `calculations.js` simula la lógica del **MID** (normalización + enriquecimiento)

**Lo que estamos simulando**:
```javascript
// dataGenerator.js simula:
// 1. MOE: Captura de sensores (temperatura, HR, presión...)
// 2. MAS: Validación de rangos
// 3. MID (parcial): Datos ya vienen "normalizados"

export function generarDatosSimulados(hora) {
  // Esto simula MOE + MAS + MID todo junto
  return {
    tempAire: 22 + 6 * Math.sin(...),  // Ciclo circadiano
    hr: 75 + 15 * Math.cos(...),
    // ...
  };
}

// calculations.js simula:
// MID: Enriquecimiento (cálculos termodinámicos)
export function calcularMLT(params) {
  // Aquí está la lógica del mlt_core.py
  const td = puntoRocio(params.tempAire, params.hr);
  // ...
}
```

---

## 4. Rol del MID (Integración de Datos)

### **¿Por qué el MID es el "cerebro"?**

El MID es el único módulo que:
1. **Conoce el modelo termodinámico** (usa `mlt_core.py`)
2. **Conoce las constantes económicas** (precios, costes)
3. **Tiene acceso a datos brutos del MAS**
4. **Tiene acceso a datos históricos del MPT** (para proyecciones)
5. **Decide qué datos enviar a cada dashboard**

### **Flujo de Normalización (MID)**

#### Ejemplo 1: Sensor de Temperatura con Drift

```javascript
// MAS envía datos brutos:
const datoBruto = {
  temp_air_sensor1: 24.8,  // Sensor principal
  temp_air_sensor2: 23.9,  // Sensor redundante (con drift conocido)
};

// MID normaliza:
const datoNormalizado = {
  temp_air: (datoBruto.temp_air_sensor1 + (datoBruto.temp_air_sensor2 + 0.5)) / 2,
  // ↑ Promedio de ambos sensores, aplicando offset de calibración +0.5°C al sensor2
};
```

#### Ejemplo 2: Interpolación de Valores Faltantes

```javascript
// MAS envía datos con un sensor fallando:
const datoBruto = {
  temp_air: 24.5,
  hr: null,  // ❌ Sensor de humedad falló
  presion: 1013,
};

// MID interpola usando último valor válido:
const ultimoValorHR = 78.2;  // Obtenido del MPT
const datoNormalizado = {
  temp_air: 24.5,
  hr: ultimoValorHR,  // ⚠️ Interpolado (marca con flag "interpolated: true")
  presion: 1013,
  _metadata: {
    hr_interpolated: true,
    hr_last_valid_timestamp: "2026-05-09T14:23:00Z"
  }
};
```

#### Ejemplo 3: Enriquecimiento con Cálculos

```javascript
// MID recibe datos normalizados:
const datosNormalizados = {
  temp_air: 24.5,
  hr: 78.2,
  presion: 1013,
  // ...
};

// MID ejecuta mlt_core.py (cálculos termodinámicos):
import { calcularMLT } from './mlt_core.js';

const datosEnriquecidos = calcularMLT(datosNormalizados);
// Ahora incluye:
// - puntoRocio: 19.8°C
// - humedadAbsoluta: 17.2 g/m³
// - condensableGm3: 4.3 g/m³
// - ratioEficiencia: 6.5
// - flagRentable: true
// - flagOperable: true
// ...

// MID añade cálculos económicos (solo para CMA):
const datosParaCMA = {
  ...datosEnriquecidos,
  costeLitro: 0.42,  // €/l
  ingresos: 1.80,    // €/h
  costes: 0.23,      // €/h
  beneficio: 1.57,   // €/h
  roiAnios: 3.2,     // años
};

// MID distribuye:
websocketMLT.send(datosEnriquecidos);  // Sin datos económicos
websocketCMA.send(datosParaCMA);       // Con datos económicos
```

### **¿Qué pasa cuando tengamos sensores reales?**

**Paso 1: Sustituir `dataGenerator.js` por conexión real al MAS**

```javascript
// ANTES (simulación):
import { generarDatosSimulados } from './utils/dataGenerator.js';
const datos = generarDatosSimulados(hora);

// DESPUÉS (producción):
import { connectToMID } from './utils/midClient.js';

useEffect(() => {
  const ws = connectToMID('ws://mid-service.dewcore.com/stream');

  ws.on('data', (datosNormalizados) => {
    // Datos ya vienen procesados del MID
    setDatos(datosNormalizados);
  });
}, []);
```

**Paso 2: El MID se encarga de todo**

Los dashboards (MLT/CMA) **no necesitan cambios** porque ya consumen datos procesados. Solo cambia la fuente (simulación → WebSocket real).

---

## 5. Generación de Documentos (MCD)

### **¿De dónde obtiene datos el MCD?**

**Respuesta**: **Depende del tipo de documento**

#### Opción A: Documentos en Tiempo Real (Eventos)

**Fuente**: **MID vía Queue**

Ejemplo: "Acta de Verificación TRL 5 cuando Producción > 50 l/día por primera vez"

```javascript
// En el MID:
if (produccion24h > 50 && !hitos.trl5_alcanzado) {
  // Encolar evento en MCD Queue
  mqPublish('mcd.events', {
    type: 'milestone.trl5',
    timestamp: new Date().toISOString(),
    data: {
      produccion24h: produccion24h,
      ratioEficiencia: ratioEficiencia,
      flagsActivos: { rentable: true, eco: true, ... },
      pctAcierto: 94.2,
    }
  });
}

// En el MCD:
mqConsume('mcd.events', async (msg) => {
  if (msg.type === 'milestone.trl5') {
    // Generar PDF inmediatamente con datos del evento
    const pdf = await renderTemplate('acta_trl5.html', msg.data);
    await savePDF(pdf, 'actas/trl5_2026-05-09.pdf');
    await sendEmail('investigador@dewcore.com', pdf);
  }
});
```

**Ventaja**: Documentos generados instantáneamente cuando ocurre el evento.

#### Opción B: Documentos Históricos (Agregados)

**Fuente**: **MPT vía SQL Queries**

Ejemplo: "Reporte Mensual de Producción" (cada 1° de mes)

```javascript
// En el MCD (cron job diario):
cron.schedule('0 0 1 * *', async () => {  // 1° de cada mes a medianoche
  // Consultar MPT para histórico del mes anterior
  const mesAnterior = await db.query(`
    SELECT
      DATE(time) as fecha,
      AVG(production_lph) as produccion_promedio,
      SUM(production_lph) as produccion_total,
      AVG(efficiency_ratio) as ratio_promedio,
      COUNT(*) FILTER (WHERE flag_rentable = true) as horas_rentables
    FROM measurements
    WHERE time >= date_trunc('month', NOW() - INTERVAL '1 month')
      AND time < date_trunc('month', NOW())
    GROUP BY DATE(time)
    ORDER BY fecha;
  `);

  // Generar PDF con datos agregados del MPT
  const pdf = await renderTemplate('reporte_mensual.html', {
    mes: mesAnterior[0].fecha,
    produccionTotal: mesAnterior.reduce((sum, d) => sum + d.produccion_total, 0),
    graficos: generarGraficos(mesAnterior),
  });

  await savePDF(pdf, `reportes/mensual_${mes}.pdf`);
});
```

**Ventaja**: Documentos con análisis profundo de períodos largos.

### **Flujo Completo: Acta TRL 5**

```
1. [MID] Detecta que producción sostenida > 50 l/día durante 7 días
     ↓
2. [MID] Calcula métricas de validación:
     - Producción promedio últimos 7 días: 52.3 l/día
     - Ratio eficiencia promedio: 6.8
     - % Acierto modelo: 94.2%
     - Flags activos 100% del tiempo: ✓
     ↓
3. [MID] Encola evento en RabbitMQ:
     Queue: "mcd.events"
     Message: { type: "milestone.trl5", data: {...} }
     ↓
4. [MCD] Consumer recibe mensaje
     ↓
5. [MCD] Consulta MPT para datos históricos adicionales:
     SELECT * FROM measurements WHERE time > NOW() - INTERVAL '7 days'
     ↓
6. [MCD] Renderiza template HTML con datos:
     Template: templates/acta_trl5.html
     Variables: { produccion, ratio, pctAcierto, graficos, ... }
     ↓
7. [MCD] Convierte HTML → PDF:
     Puppeteer.launch()
     page.setContent(htmlRendered)
     page.pdf({ path: 'acta_trl5.pdf' })
     ↓
8. [MCD] Firma digital (opcional):
     hash = SHA256(pdfBuffer)
     signedHash = RSA_sign(hash, privateKey)
     ↓
9. [MCD] Almacena PDF:
     S3.upload('dewcore-docs', 'actas/trl5_2026-05-09.pdf')
     ↓
10. [MCD] Envía notificación:
     SendGrid.send({
       to: 'investigador@dewcore.com',
       subject: '✅ Acta TRL 5 Generada',
       attachments: [{ filename: 'acta_trl5.pdf', content: pdfBuffer }]
     })
```

---

## 6. Entorno Actual: Simulación

### **¿Qué estamos simulando exactamente?**

**Simulamos TODO el stack backend**:

```
┌────────────────────────────────────────────────────┐
│           SIMULACIÓN ACTUAL (Desarrollo)           │
├────────────────────────────────────────────────────┤
│                                                    │
│  dataGenerator.js  → Simula MOE + MAS + MID       │
│  ├─ Ciclo circadiano (trigonometría)              │
│  ├─ Datos "como si" vinieran del sensor           │
│  └─ Ya vienen normalizados                        │
│                                                    │
│  calculations.js   → Simula lógica MID            │
│  ├─ Fórmulas Magnus-Tetens (mlt_core.py)          │
│  ├─ Cálculos termodinámicos                       │
│  └─ Cálculos económicos (CMA)                     │
│                                                    │
│  useState([history]) → Simula MPT                 │
│  └─ Ventana móvil de 48 muestras en memoria       │
│                                                    │
└────────────────────────────────────────────────────┘
```

### **Cuando tengamos prototipo real (PT1)**

```
┌────────────────────────────────────────────────────┐
│           PRODUCCIÓN (Con Hardware Real)           │
├────────────────────────────────────────────────────┤
│                                                    │
│  [MOE] Sensores IoT (ESP32 + DHT22 + ...)         │
│    ↓ MQTT                                          │
│  [MAS] Backend Node.js (recibe MQTT, valida)      │
│    ↓ WebSocket                                     │
│  [MID] Backend Node.js (normaliza, enriquece)     │
│    ↓ WebSocket + SQL                               │
│  ├─→ [MPT] TimescaleDB (persiste)                 │
│  ├─→ [MLT] Dashboard (consume WebSocket)          │
│  ├─→ [CMA] Dashboard (consume WebSocket)          │
│  └─→ [MCD] Queue (RabbitMQ) → PDF Generator       │
│                                                    │
└────────────────────────────────────────────────────┘
```

### **Migración: Simulación → Producción**

**Código de los dashboards MLT/CMA NO CAMBIA** ✅

Solo cambiamos:

```diff
  // MLT Dashboard - App.jsx
- import { generarDatosSimulados } from './utils/dataGenerator';
- const datos = generarDatosSimulados(hora);

+ import { useMIDWebSocket } from './utils/midClient';
+ const datos = useMIDWebSocket('wss://mid.dewcore.com/stream/mlt');
```

El resto del código **permanece idéntico** porque el MID envía datos con la misma estructura que `dataGenerator.js`.

---

## 7. Resumen Ejecutivo

### **Respuestas a tus Preguntas**

**Q1**: ¿La simulación debe usar datos brutos como si vinieran del MAS?

**R**: **NO**. Actualmente `dataGenerator.js` simula MOE+MAS+MID todo junto (datos ya normalizados). Cuando tengamos hardware real:
- MOE → datos brutos → MAS → datos validados → **MID → datos normalizados**
- Los dashboards **siempre** consumen datos normalizados del MID, nunca datos brutos del MAS

**Q2**: ¿Debemos crear un MID simulado que reciba y normalice?

**R**: **Opcional** (no necesario ahora, pero útil para el futuro). Si quieres practicar la arquitectura completa:
```
dataGenerator.js → simula MOE (datos brutos)
    ↓
midSimulator.js → simula MID (normalización)
    ↓
MLT/CMA → consumen datos normalizados
```
Pero para el TFG actual, la simulación integrada en `dataGenerator.js` es suficiente.

**Q3**: ¿El MCD consume datos del MID o del MPT?

**R**: **AMBOS**:
- **Del MID (vía Queue)**: Para documentos en tiempo real cuando ocurren eventos
- **Del MPT (vía SQL)**: Para documentos históricos con agregados de períodos largos

**Q4**: ¿Necesitamos implementar el MID ahora?

**R**: **NO** para la fase actual (simulación). **SÍ** cuando tengamos el prototipo PT1 con sensores reales (próxima fase tras defender TFG).

---

## 📚 Referencias

- **Patente ES-3046193-A1**: Condensador atmosférico (DewCore Engineering)
- **Memoria Ports 4.0**: Datos de calibración Isla de Alborán
- **TFG Universidad de Alicante**: 2025-26

---

**Última actualización**: 9 de mayo de 2026
**Versión**: Arquitectura v1.0
**Estado**: Documentación completa del flujo de datos
