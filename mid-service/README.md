# MID Service — Módulo de Integración de Datos

**Backend Node.js para el Sistema DewCore**
**Gestión centralizada del flujo de datos: MOE → MAS → MID → MLT/CMA**

---

## 🎯 Propósito

El **MID Service** es el "cerebro" del sistema DewCore. Se encarga de:

1. **Simular** MOE/MAS (generación de datos brutos atmosféricos/marinos)
2. **Normalizar** datos (calibración, interpolación, validación)
3. **Enriquecer** datos (cálculos termodinámicos + económicos)
4. **Distribuir** datos a los dashboards (MLT/CMA) vía WebSocket

---

## 🚀 Inicio Rápido

```bash
# Instalación
cd mid-service
npm install

# Ejecutar
npm start

# Desarrollo (auto-reload con --watch)
npm run dev
```

El servicio estará disponible en:
- **HTTP**: http://localhost:3000
- **WebSocket**: ws://localhost:3000

---

## 📡 WebSocket Endpoints

El MID Service expone 3 endpoints WebSocket según el tipo de cliente:

### 1. MID Monitor (Control + Visualización)
```javascript
const ws = new WebSocket('ws://localhost:3000?type=monitor');

// Recibe:
// - status: Estado del MID (running, hora, speed, uptime)
// - log: Logs en tiempo real
// - data_normalized: Datos después de normalización
// - data_enriched: Datos después de enriquecimiento
// - error: Errores del sistema

// Envía:
ws.send(JSON.stringify({ type: 'start' }));  // Iniciar simulación
ws.send(JSON.stringify({ type: 'stop' }));   // Detener simulación
ws.send(JSON.stringify({ type: 'reset' }));  // Resetear
ws.send(JSON.stringify({ type: 'set_speed', speed: 2 })); // Cambiar velocidad
```

### 2. MLT Dashboard (Datos Científicos)
```javascript
const ws = new WebSocket('ws://localhost:3000?type=mlt');

// Recibe:
// - type: 'data'
// - data: { tempAire, hr, presion, puntoRocio, produccionLph, ratioEficiencia, flags, ... }
```

### 3. CMA Dashboard (Datos Económicos)
```javascript
const ws = new WebSocket('ws://localhost:3000?type=cma');

// Recibe:
// - type: 'data'
// - data: { tempAire, hr, produccionLph, costeLitro, beneficio, roiAnios, ventajaCompetitiva, ... }
```

---

## 🛠️ REST API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/status` | Estado actual del MID |
| `POST` | `/start` | Iniciar simulación |
| `POST` | `/stop` | Detener simulación |
| `POST` | `/reset` | Resetear simulación |
| `GET` | `/metrics` | Métricas del sistema (dataProcessed, errors, uptime, dataPerSecond) |

### Ejemplo de uso:

```bash
# Obtener estado
curl http://localhost:3000/status

# Iniciar simulación
curl -X POST http://localhost:3000/start

# Obtener métricas
curl http://localhost:3000/metrics
```

---

## 📐 Arquitectura Interna

```
┌─────────────────────────────────────────────────┐
│              MID SERVICE (index.js)             │
├─────────────────────────────────────────────────┤
│  1. Express HTTP Server (REST API)             │
│  2. WebSocket Server (ws library)              │
│  3. MID Core (mid-core.js)                     │
│     ├─ Simulador (data-generator.js)           │
│     ├─ Normalizador                            │
│     ├─ Enriquecedor (calculations.js)          │
│     └─ Distribuidor (WebSocket broadcast)      │
└─────────────────────────────────────────────────┘
```

### Flujo de Datos Interno

```
[TICK cada 600ms / velocidad]
         ↓
[1. Simular MOE/MAS]
  → generarDatosSimulados(hora)
  → Datos brutos: {tempAire, hr, presion, ...}
         ↓
[2. Normalizar]
  → Aplicar calibración (en producción)
  → Interpolar valores faltantes (en producción)
  → Validar rangos
  → Emit 'data_normalized'
         ↓
[3. Enriquecer]
  → calcularMLT(params) → Datos científicos
  → calcularCMA(params) → Datos económicos
  → Emit 'data_enriched'
         ↓
[4. Distribuir]
  → WebSocket → MLT Dashboard (datos científicos)
  → WebSocket → CMA Dashboard (datos económicos)
  → WebSocket → MID Monitor (logs + estado)
```

---

## ⚙️ Configuración

### Velocidad de Simulación

Por defecto, la simulación avanza **0.5h cada 600ms** (velocidad 1x).

Puedes cambiarla con:

```javascript
// Desde WebSocket (MID Monitor)
ws.send(JSON.stringify({ type: 'set_speed', speed: 2 }));  // 2x más rápido
ws.send(JSON.stringify({ type: 'set_speed', speed: 0.5 })); // 2x más lento

// O desde REST API (futuro)
// POST /speed { "speed": 2 }
```

Velocidades útiles:
- `0.5x`: Slow motion (para demostraciones detalladas)
- `1x`: Normal (igual que dashboards originales)
- `2x`: Rápido (para pruebas)
- `5x`: Muy rápido (ciclo 24h en ~5 minutos)

---

## 📊 Métricas del Sistema

```json
{
  "dataProcessed": 1203,        // Número de ticks procesados
  "errors": 0,                  // Errores capturados
  "startTime": 1715286473000,   // Timestamp inicio (ms)
  "uptime": 720600,             // Tiempo activo (ms)
  "dataPerSecond": "1.67"       // Datos procesados por segundo
}
```

---

## 🔧 Desarrollo

### Estructura de Archivos

```
mid-service/
├── index.js              # Servidor HTTP + WebSocket
├── mid-core.js           # Lógica principal del MID
├── calculations.js       # Cálculos termodinámicos + económicos
├── data-generator.js     # Simulador de datos atmosféricos
├── package.json
└── README.md
```

### Añadir Nuevos Cálculos

Edita `calculations.js`:

```javascript
export function calcularMLT(params) {
  // ... cálculos existentes

  // Nuevo cálculo
  const nuevoParametro = params.tempAire * 1.5;

  return {
    // ... resultados existentes
    nuevoParametro,  // Añadir aquí
  };
}
```

El MID automáticamente distribuirá el nuevo parámetro a los dashboards conectados.

---

## 🚨 Troubleshooting

### Error: "Cannot find module 'express'"

```bash
npm install
```

### WebSocket no conecta desde el dashboard

Verifica que:
1. MID Service esté ejecutándose (`npm start`)
2. La URL sea correcta: `ws://localhost:3000?type=mlt` (no `wss://`)
3. No haya firewall bloqueando puerto 3000

### Simulación no avanza

```bash
# Desde otro terminal
curl -X POST http://localhost:3000/start
```

O envía mensaje WebSocket:
```javascript
ws.send(JSON.stringify({ type: 'start' }));
```

---

## 📚 Documentación Relacionada

- [ARQUITECTURA_FLUJO_DATOS.md](../ARQUITECTURA_FLUJO_DATOS.md) - Arquitectura completa de los 7 módulos
- [mid-monitor/README.md](../mid-monitor/README.md) - Dashboard de control del MID
- [mlt-dashboard/README.md](../mlt-dashboard/README.md) - Dashboard científico
- [cma-dashboard/README.md](../cma-dashboard/README.md) - Dashboard ejecutivo

---

**Última actualización**: 9 de mayo de 2026
**Versión**: v1.0
**Estado**: ✅ Funcionando correctamente
