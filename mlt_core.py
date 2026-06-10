"""
===========================================================================
MLT — Módulo Lógico-Termodinámico
Proyecto: Validación Empírica del Condensador Atmosférico
Patente: ES-3046193-A1

Núcleo algorítmico que encapsula las fórmulas de psicrometría y
transferencia de calor de la patente. Diseñado para operar tanto con
datos simulados (fase de desarrollo) como con datos reales procedentes
del MAS a través del MID (fase de ensayo).

Funcionalidades cubiertas (Capítulo II, Mayéutica):
  - F14: Automatización del Modelo Termodinámico Teórico
  - F15: Computación Continua de la Inecuación de Rentabilidad
  - F06: Auditoría Ecológica y Operativa (3 verificaciones)
  - F18: Identificación de Constantes de Eficiencia (interfaz preparada)

Autor: Carlos Rodrigo Díaz-Ropero
Fecha: Mayo 2026
===========================================================================
"""

import math
from dataclasses import dataclass
from typing import Optional


# =========================================================================
# CONSTANTES DE LA PATENTE Y DE LA FÍSICA
# =========================================================================

# Calor latente de condensación del agua a ~20°C (Kcal/l)
# Fuente: Patente ES-3046193-A1 vía Memoria Ports 4.0
Q_LATENTE_CONDENSACION_KCAL_L = 540.0

# Conversión: 1 Kcal = 1.163 Wh
KCAL_A_WH = 1.163

# Calor latente en Wh/l (para comparación directa con consumo eléctrico)
Q_LATENTE_WH_L = Q_LATENTE_CONDENSACION_KCAL_L * KCAL_A_WH  # ~628 Wh/l

# Constantes de Magnus-Tetens (rango válido: -45°C a 60°C)
# Referencia: Alduchov & Eskridge (1996), J. Applied Meteorology
MAGNUS_A = 17.625
MAGNUS_B = 243.04  # °C

# Presión de referencia estándar (hPa)
P_ATM_ESTANDAR = 1013.25

# Densidad del aire seco a nivel del mar y 20°C (kg/m³)
RHO_AIRE_SECO_STD = 1.204

# Constante de gas para vapor de agua (J/(kg·K))
RV = 461.5

# Constante de gas para aire seco (J/(kg·K))
RD = 287.05

# Gravedad estándar (m/s²)
G = 9.80665


# =========================================================================
# ESTRUCTURAS DE DATOS
# =========================================================================

@dataclass
class CondicionesAtmosfericas:
    """
    Variables atmosféricas del circuito de aire, proporcionadas por el
    MAS a través del MID (funcionalidad 12b / 13b).

    Incluye mediciones a la ENTRADA y a la SALIDA del condensador.
    La medición diferencial (entrada - salida) cuantifica el vapor de
    agua efectivamente extraído de la corriente de aire.
    """
    # --- Aire a la ENTRADA del condensador ---
    temperatura_aire_c: float         # °C - Temperatura del aire ambiente
    humedad_relativa_pct: float       # % (0-100) - Humedad relativa entrada
    presion_atmosferica_hpa: float    # hPa - Presión atmosférica local
    velocidad_viento_ms: float = 0.0  # m/s - Velocidad del viento incidente

    # --- Aire a la SALIDA del condensador ---
    # Estos campos son None cuando se trabaja con modelo teórico (simulación)
    # y se rellenan con datos reales del MAS durante el ensayo empírico.
    temp_aire_salida_c: Optional[float] = None   # °C - Temperatura aire post-condensador
    hr_aire_salida_pct: Optional[float] = None   # % - HR aire post-condensador (esperada ~100%)


@dataclass
class CondicionesHidraulicas:
    """
    Variables hidráulicas de los circuitos de agua, proporcionadas por el
    MAS a través del MID (funcionalidad 12 / 13).

    Incluye tanto las variables de los circuitos de agua como la medición
    directa de la temperatura del condensador y los datos de profundidad
    para la base de datos espacio-temporal marina (funcionalidad 5b).
    """
    temp_agua_fria_c: float           # °C - Temperatura del agua de captación profunda
    temp_agua_retorno_c: float        # °C - Temperatura del agua tras el condensador
    caudal_agua_fria_lpm: float       # l/min - Caudal de agua marina en el circuito
    nivel_agua_dulce_mm: float = 0.0  # mm - Nivel en el colector de agua dulce
    caudal_agua_dulce_lpm: float = 0.0  # l/min - Caudal de agua dulce condensada

    # --- Temperatura medida directamente en el serpentín ---
    # None cuando se estima por modelo (T_agua + resistencia térmica).
    # Se rellena con dato real del termopar en superficie del condensador.
    temp_superficie_condensador_c: Optional[float] = None  # °C

    # --- Datos de profundidad para BD espacio-temporal (F5b) ---
    profundidad_captacion_m: Optional[float] = None   # m - Profundidad de extracción
    latitud: Optional[float] = None                    # ° - Coordenada geográfica
    longitud: Optional[float] = None                   # ° - Coordenada geográfica


@dataclass
class ConsumoEnergetico:
    """
    Variables eléctricas de la bomba de agua marina.
    """
    potencia_bomba_w: float           # W - Potencia instantánea consumida
    altura_elevacion_m: float = 2.0   # m - Altura sobre el nivel del mar del condensador


@dataclass
class ResultadoTermodinamico:
    """
    Resultado del cálculo del modelo termodinámico teórico.
    Funcionalidad 14.
    """
    punto_rocio_c: float              # °C - Punto de rocío calculado
    presion_saturacion_hpa: float     # hPa - Presión de saturación del vapor
    humedad_absoluta_g_m3: float      # g/m³ - Contenido de agua en el aire
    litros_teoricos_por_m3: float     # l/m³ - Agua condensable teóricamente
    delta_enfriamiento_c: float       # °C - Enfriamiento necesario (Taire - Trocío)
    produccion_teorica_lph: Optional[float] = None  # l/h - Producción estimada (requiere caudal de aire)


@dataclass
class ResultadoRentabilidad:
    """
    Resultado de la inecuación de rentabilidad energética.
    Funcionalidad 15.
    """
    energia_consumida_wh: float       # Wh - Energía eléctrica del bombeo
    energia_ahorrada_wh: float        # Wh - Calor latente ahorrado (540 Kcal/l equiv.)
    litros_condensados: float         # l - Volumen de agua dulce producido
    ratio_eficiencia: float           # adimensional - Ahorrado / Consumido
    flag_rentable: bool               # True si Consumida < Ahorrada


@dataclass
class ResultadoAuditoriaEcologica:
    """
    Resultado de las tres verificaciones de auditoría ecológica y operativa.
    Funcionalidad 6 (mejorada).
    """
    # Verificación 1: Delta térmico marino
    delta_termico_c: float            # °C - |T_captación - T_retorno_vertido|
    umbral_termico_c: float           # °C - Umbral máximo aceptable
    flag_huella_termica_nula: bool    # True si delta <= umbral

    # Verificación 2: Ausencia de efluentes
    flag_ausencia_efluentes: bool     # True (el sistema por diseño no genera efluentes)
    nota_efluentes: str               # Justificación documental

    # Verificación 3: Condición de operabilidad
    punto_rocio_c: float              # °C - Punto de rocío atmosférico
    temp_agua_fria_c: float           # °C - Temperatura del refrigerante
    margen_operabilidad_c: float      # °C - (Trocío - Tagua_fría)
    flag_condicion_operabilidad: bool  # True si Trocío > Tagua_fría


# =========================================================================
# FUNCIONES DE PSICROMETRÍA
# =========================================================================

def presion_saturacion_vapor(temperatura_c: float) -> float:
    """
    Calcula la presión de saturación del vapor de agua (hPa) a una
    temperatura dada, usando la fórmula de Magnus-Tetens mejorada
    (Alduchov & Eskridge, 1996).

    Parámetros:
        temperatura_c: Temperatura en °C

    Retorna:
        Presión de saturación en hPa

    Referencia:
        es(T) = 6.1078 × exp( (A × T) / (B + T) )
        donde A = 17.625, B = 243.04°C
    """
    return 6.1078 * math.exp(
        (MAGNUS_A * temperatura_c) / (MAGNUS_B + temperatura_c)
    )


def punto_de_rocio(temperatura_c: float, humedad_relativa_pct: float) -> float:
    """
    Calcula el punto de rocío (°C) a partir de la temperatura del aire
    y la humedad relativa, usando la inversión de Magnus-Tetens.

    Parámetros:
        temperatura_c: Temperatura del aire en °C
        humedad_relativa_pct: Humedad relativa en % (0-100)

    Retorna:
        Punto de rocío en °C

    Referencia:
        γ(T, HR) = ln(HR/100) + (A × T) / (B + T)
        Td = (B × γ) / (A - γ)
    """
    hr_frac = humedad_relativa_pct / 100.0
    if hr_frac <= 0:
        raise ValueError("La humedad relativa debe ser positiva")

    gamma = math.log(hr_frac) + (MAGNUS_A * temperatura_c) / (MAGNUS_B + temperatura_c)
    td = (MAGNUS_B * gamma) / (MAGNUS_A - gamma)
    return td


def humedad_absoluta(
    temperatura_c: float,
    humedad_relativa_pct: float,
    presion_hpa: float
) -> float:
    """
    Calcula la humedad absoluta (g de agua / m³ de aire) a partir de
    las condiciones atmosféricas.

    Parámetros:
        temperatura_c: Temperatura del aire en °C
        humedad_relativa_pct: Humedad relativa en % (0-100)
        presion_hpa: Presión atmosférica en hPa

    Retorna:
        Humedad absoluta en g/m³

    Referencia:
        ρv = (es × HR/100 × 100) / (Rv × T_kelvin) × 1000
        donde 100 convierte hPa a Pa, y 1000 convierte kg a g
    """
    t_kelvin = temperatura_c + 273.15
    es = presion_saturacion_vapor(temperatura_c)
    presion_vapor = es * (humedad_relativa_pct / 100.0)

    # ρv en kg/m³, convertido a g/m³
    rho_vapor = (presion_vapor * 100.0) / (RV * t_kelvin) * 1000.0
    return rho_vapor


def agua_condensable_por_m3(
    temperatura_c: float,
    humedad_relativa_pct: float,
    presion_hpa: float,
    temp_condensador_c: float
) -> float:
    """
    Calcula los gramos de agua que se pueden condensar por cada metro
    cúbico de aire, dado que el condensador enfría el aire desde su
    temperatura ambiente hasta la temperatura de su superficie.

    El agua condensable es la diferencia entre la humedad absoluta a
    temperatura ambiente y la humedad absoluta a saturación (HR=100%)
    a la temperatura del condensador.

    Parámetros:
        temperatura_c: Temperatura del aire ambiente en °C
        humedad_relativa_pct: Humedad relativa del aire en %
        presion_hpa: Presión atmosférica en hPa
        temp_condensador_c: Temperatura de la superficie del condensador en °C

    Retorna:
        Gramos de agua condensable por m³ de aire. 0 si no hay condensación.
    """
    # Humedad absoluta del aire entrante
    ha_entrada = humedad_absoluta(temperatura_c, humedad_relativa_pct, presion_hpa)

    # Humedad absoluta a saturación a la temperatura del condensador
    # (el aire sale saturado, HR=100%, a la temperatura del condensador)
    ha_salida = humedad_absoluta(temp_condensador_c, 100.0, presion_hpa)

    condensable = ha_entrada - ha_salida
    return max(0.0, condensable)


# =========================================================================
# FUNCIONES DEL MLT — FUNCIONALIDADES DEL CAPÍTULO II
# =========================================================================

def calcular_modelo_teorico(
    atm: CondicionesAtmosfericas,
    temp_condensador_c: float,
    caudal_aire_m3h: Optional[float] = None
) -> ResultadoTermodinamico:
    """
    FUNCIONALIDAD 14: Automatización del Modelo Termodinámico Teórico.

    Dado un conjunto de condiciones atmosféricas y la temperatura del
    condensador (determinada por el agua fría marina), calcula el punto
    de rocío, la humedad absoluta y los litros teóricos de condensación
    por metro cúbico de aire.

    Si se proporciona el caudal de aire (m³/h), calcula también la
    producción teórica en litros por hora.

    Parámetros:
        atm: Condiciones atmosféricas del instante de medición
        temp_condensador_c: Temperatura de la superficie del serpentín (°C).
                           Usar hid.temp_superficie_condensador_c si está
                           medida, o estimar como hid.temp_agua_fria_c + delta.
        caudal_aire_m3h: Caudal de aire que atraviesa el condensador (m³/h).
                         Depende del diseño del PT1 (área del serpentín × velocidad).
                         Si es None, no se calcula producción horaria.

    Retorna:
        ResultadoTermodinamico con todos los cálculos
    """
    td = punto_de_rocio(atm.temperatura_aire_c, atm.humedad_relativa_pct)
    es = presion_saturacion_vapor(atm.temperatura_aire_c)
    ha = humedad_absoluta(
        atm.temperatura_aire_c,
        atm.humedad_relativa_pct,
        atm.presion_atmosferica_hpa
    )
    condensable_g = agua_condensable_por_m3(
        atm.temperatura_aire_c,
        atm.humedad_relativa_pct,
        atm.presion_atmosferica_hpa,
        temp_condensador_c
    )
    # Convertir g/m³ a l/m³ (densidad del agua ≈ 1000 g/l)
    litros_por_m3 = condensable_g / 1000.0

    delta_enfriamiento = atm.temperatura_aire_c - td

    # Producción horaria (si se conoce el caudal de aire)
    produccion_lph = None
    if caudal_aire_m3h is not None and caudal_aire_m3h > 0:
        produccion_lph = round(litros_por_m3 * caudal_aire_m3h, 4)

    return ResultadoTermodinamico(
        punto_rocio_c=round(td, 2),
        presion_saturacion_hpa=round(es, 4),
        humedad_absoluta_g_m3=round(ha, 2),
        litros_teoricos_por_m3=round(litros_por_m3, 6),
        delta_enfriamiento_c=round(delta_enfriamiento, 2),
        produccion_teorica_lph=produccion_lph
    )


def calcular_inecuacion_rentabilidad(
    consumo: ConsumoEnergetico,
    litros_condensados: float,
    periodo_horas: float
) -> ResultadoRentabilidad:
    """
    FUNCIONALIDAD 15: Computación Continua de la Inecuación de Rentabilidad.

    Compara la energía eléctrica consumida por la bomba de agua marina
    contra el calor latente de condensación (540 Kcal/l) que el sistema
    ahorra al usar agua marina profunda como refrigerante natural.

    La tesis de la patente es que:
        Energía_consumida (bombeo) << Energía_ahorrada (540 Kcal/l × litros)

    Parámetros:
        consumo: Datos de consumo eléctrico de la bomba
        litros_condensados: Litros de agua dulce producidos en el periodo
        periodo_horas: Duración del periodo de medición en horas

    Retorna:
        ResultadoRentabilidad con el flag de rentabilidad
    """
    # Energía consumida: potencia × tiempo
    energia_consumida_wh = consumo.potencia_bomba_w * periodo_horas

    # Energía ahorrada: 540 Kcal/l × litros × conversión a Wh
    energia_ahorrada_wh = Q_LATENTE_CONDENSACION_KCAL_L * litros_condensados * KCAL_A_WH

    # Ratio de eficiencia
    ratio = energia_ahorrada_wh / energia_consumida_wh if energia_consumida_wh > 0 else float('inf')

    # Flag: True si la energía consumida es estrictamente inferior a la ahorrada
    flag = energia_consumida_wh < energia_ahorrada_wh

    return ResultadoRentabilidad(
        energia_consumida_wh=round(energia_consumida_wh, 2),
        energia_ahorrada_wh=round(energia_ahorrada_wh, 2),
        litros_condensados=round(litros_condensados, 4),
        ratio_eficiencia=round(ratio, 2),
        flag_rentable=flag
    )


def auditar_ecologia_operativa(
    atm: CondicionesAtmosfericas,
    hid: CondicionesHidraulicas,
    umbral_termico_c: float = 0.5
) -> ResultadoAuditoriaEcologica:
    """
    FUNCIONALIDAD 6 (mejorada): Auditoría Ecológica y Operativa.

    Ejecuta las tres verificaciones continuas:

    1. Delta térmico: |T_captación - T_retorno| <= umbral
       Demuestra que el proceso no altera la temperatura del medio marino.

    2. Ausencia de efluentes: el sistema, por diseño, no genera residuos
       distintos del agua dulce y del agua marina de retorno.

    3. Condición de operabilidad: Punto de rocío > T_agua_fría
       Verifica que el sistema opera dentro de su rango termodinámico válido.

    Parámetros:
        atm: Condiciones atmosféricas actuales
        hid: Condiciones hidráulicas actuales
        umbral_termico_c: Umbral máximo aceptable de delta térmico (°C)

    Retorna:
        ResultadoAuditoriaEcologica con los tres flags
    """
    # Verificación 1: Delta térmico
    delta = abs(hid.temp_agua_fria_c - hid.temp_agua_retorno_c)
    flag_termica = delta <= umbral_termico_c

    # Verificación 2: Ausencia de efluentes
    # Por diseño del sistema: el único output líquido además del agua de
    # retorno es agua dulce condensada. No hay proceso químico ni filtrado
    # que genere residuos. A diferencia de la ósmosis inversa (salmuera).
    flag_efluentes = True
    nota = (
        "El sistema produce exclusivamente agua dulce condensada y agua "
        "marina de retorno a temperatura y profundidad equivalentes a las "
        "de captación. No existe proceso químico, filtrado ni separación "
        "de sales que genere efluentes. Contraste: la ósmosis inversa "
        "produce salmuera concentrada como subproducto."
    )

    # Verificación 3: Condición de operabilidad
    td = punto_de_rocio(atm.temperatura_aire_c, atm.humedad_relativa_pct)
    margen = td - hid.temp_agua_fria_c
    flag_operabilidad = td > hid.temp_agua_fria_c

    return ResultadoAuditoriaEcologica(
        delta_termico_c=round(delta, 2),
        umbral_termico_c=umbral_termico_c,
        flag_huella_termica_nula=flag_termica,
        flag_ausencia_efluentes=flag_efluentes,
        nota_efluentes=nota,
        punto_rocio_c=round(td, 2),
        temp_agua_fria_c=hid.temp_agua_fria_c,
        margen_operabilidad_c=round(margen, 2),
        flag_condicion_operabilidad=flag_operabilidad
    )


# =========================================================================
# FUNCIONES AUXILIARES
# =========================================================================

# Resistencia térmica estimada del serpentín (°C).
# Diferencia entre la temperatura del agua fría circulante y la
# temperatura de la superficie exterior del condensador.
# Este valor es una estimación para la fase de simulación; en el ensayo
# real se sustituye por la medición directa del termopar en superficie.
DELTA_RESISTENCIA_TERMICA_C = 1.0


def temperatura_condensador(hid: CondicionesHidraulicas) -> float:
    """
    Determina la temperatura de la superficie del condensador.

    Si existe medición directa (termopar en el serpentín), la usa.
    Si no, estima como T_agua_fría + resistencia térmica del material.

    Parámetros:
        hid: Condiciones hidráulicas con posible medición directa

    Retorna:
        Temperatura de la superficie del condensador en °C
    """
    if hid.temp_superficie_condensador_c is not None:
        return hid.temp_superficie_condensador_c
    return hid.temp_agua_fria_c + DELTA_RESISTENCIA_TERMICA_C


def calcular_extraccion_empirica(atm: CondicionesAtmosfericas) -> Optional[float]:
    """
    Calcula los gramos de vapor de agua REALMENTE extraídos por m³ de aire,
    usando la medición diferencial entre la entrada y la salida del condensador.

    Solo disponible cuando el MAS proporciona las mediciones de salida
    (temp_aire_salida_c y hr_aire_salida_pct). Retorna None si no hay datos.

    Funcionalidad 17 (parcial): Este dato empírico se compara contra el
    valor teórico de agua_condensable_por_m3() para cuantificar el porcentaje
    de acierto del modelo.

    Parámetros:
        atm: Condiciones atmosféricas con datos de entrada Y salida

    Retorna:
        Gramos de agua extraídos por m³, o None si faltan datos de salida
    """
    if atm.temp_aire_salida_c is None or atm.hr_aire_salida_pct is None:
        return None

    ha_entrada = humedad_absoluta(
        atm.temperatura_aire_c,
        atm.humedad_relativa_pct,
        atm.presion_atmosferica_hpa
    )
    ha_salida = humedad_absoluta(
        atm.temp_aire_salida_c,
        atm.hr_aire_salida_pct,
        atm.presion_atmosferica_hpa
    )
    return max(0.0, ha_entrada - ha_salida)


# =========================================================================
# CALIBRACIÓN — Datos de la Isla de Alborán (Memoria Ports 4.0)
# =========================================================================

def calibrar_contra_alboran():
    """
    Verifica que las fórmulas del MLT reproducen exactamente los datos
    de calibración de la Memoria de Ports 4.0:

    Agosto Alborán: Patm=1013 hPa, HR=88%, Taire=21°C → Trocío=19°C
    Febrero Alborán: Patm=1022 hPa, HR=81%, Taire=16°C → Trocío=13°C
    Dato de rendimiento: 8.8 g/m³ a HR=50%, T=20°C

    Retorna:
        True si todos los tests pasan dentro de la tolerancia
    """
    print("=" * 70)
    print("CALIBRACIÓN DEL MLT — Datos de la Isla de Alborán")
    print("Fuente: Memoria Ports 4.0 / Patente ES-3046193-A1")
    print("=" * 70)
    
    tolerancia_td = 0.5  # °C de tolerancia para el punto de rocío
    tolerancia_ha = 0.5  # g/m³ de tolerancia para humedad absoluta
    todos_ok = True

    # --- Test 1: Agosto en Alborán ---
    print("\n--- Test 1: Agosto, Isla de Alborán ---")
    print("Condiciones: Patm=1013 hPa, HR=88%, Taire=21°C")
    print("Valor esperado (Memoria): Trocío = 19°C")

    td_agosto = punto_de_rocio(21.0, 88.0)
    print(f"Valor calculado (MLT):    Trocío = {td_agosto:.2f}°C")

    delta_agosto = abs(td_agosto - 19.0)
    ok_agosto = delta_agosto <= tolerancia_td
    print(f"Desviación: {delta_agosto:.2f}°C — {'✓ PASA' if ok_agosto else '✗ FALLA'}")
    todos_ok = todos_ok and ok_agosto

    # --- Test 2: Febrero en Alborán ---
    print("\n--- Test 2: Febrero, Isla de Alborán ---")
    print("Condiciones: Patm=1022 hPa, HR=81%, Taire=16°C")
    print("Valor esperado (Memoria): Trocío = 13°C")

    td_febrero = punto_de_rocio(16.0, 81.0)
    print(f"Valor calculado (MLT):    Trocío = {td_febrero:.2f}°C")

    delta_febrero = abs(td_febrero - 13.0)
    ok_febrero = delta_febrero <= tolerancia_td
    print(f"Desviación: {delta_febrero:.2f}°C — {'✓ PASA' if ok_febrero else '✗ FALLA'}")
    todos_ok = todos_ok and ok_febrero

    # --- Test 3: Rendimiento de referencia ---
    print("\n--- Test 3: Humedad absoluta de referencia ---")
    print("Condiciones: HR=50%, T=20°C (estándar)")
    print("Valor esperado (Memoria): 8.8 g/m³")

    ha_ref = humedad_absoluta(20.0, 50.0, P_ATM_ESTANDAR)
    print(f"Valor calculado (MLT):    {ha_ref:.2f} g/m³")

    delta_ha = abs(ha_ref - 8.8)
    ok_ha = delta_ha <= tolerancia_ha
    print(f"Desviación: {delta_ha:.2f} g/m³ — {'✓ PASA' if ok_ha else '✗ FALLA'}")
    todos_ok = todos_ok and ok_ha

    # --- Test 4: Agua condensable en condiciones de agosto ---
    print("\n--- Test 4: Agua condensable — Agosto, Alborán ---")
    print("Condiciones: Patm=1013, HR=88%, Taire=21°C, T_condensador=17°C")

    condensable = agua_condensable_por_m3(21.0, 88.0, 1013.0, 17.0)
    print(f"Agua condensable: {condensable:.2f} g/m³")
    print(f"Equivalente: {condensable/1000:.6f} l/m³")

    # --- Resumen ---
    print("\n" + "=" * 70)
    if todos_ok:
        print("RESULTADO: ✓ TODOS LOS TESTS DE CALIBRACIÓN SUPERADOS")
    else:
        print("RESULTADO: ✗ ALGÚN TEST DE CALIBRACIÓN HA FALLADO")
    print("=" * 70)

    return todos_ok


# =========================================================================
# DEMOSTRACIÓN DE FUNCIONALIDADES
# =========================================================================

def demo_funcionalidades():
    """
    Ejecuta una demostración completa de las funcionalidades del MLT
    usando datos simulados basados en las condiciones de la Isla de
    Alborán en agosto.

    Demuestra dos modos de operación:
    - Modo simulación: sin datos de salida del aire (temp/HR salida = None)
    - Modo empírico: con datos de salida simulados (como si hubiera MAS)
    """
    print("\n")
    print("=" * 70)
    print("DEMOSTRACIÓN DE FUNCIONALIDADES DEL MLT")
    print("Escenario: Condiciones simuladas de agosto en Alborán")
    print("=" * 70)

    # Condiciones atmosféricas (agosto, Alborán) — solo entrada
    atm = CondicionesAtmosfericas(
        temperatura_aire_c=21.0,
        humedad_relativa_pct=88.0,
        presion_atmosferica_hpa=1013.0,
        velocidad_viento_ms=3.5,
        # Datos de salida: None en modo simulación
        temp_aire_salida_c=None,
        hr_aire_salida_pct=None
    )

    # Condiciones hidráulicas simuladas
    # Temperatura del agua profunda: ~13°C (profundidad ~50m en Mediterráneo)
    hid = CondicionesHidraulicas(
        temp_agua_fria_c=13.0,
        temp_agua_retorno_c=13.4,  # Ligero calentamiento tras el intercambio
        caudal_agua_fria_lpm=10.0,
        nivel_agua_dulce_mm=15.0,
        caudal_agua_dulce_lpm=0.05,
        # Medición directa del condensador: None (se estima por modelo)
        temp_superficie_condensador_c=None,
        # Datos de profundidad para BD espacio-temporal
        profundidad_captacion_m=50.0,
        latitud=38.3453,   # Puerto de Alicante
        longitud=-0.4831
    )

    # Consumo eléctrico simulado de la bomba
    consumo = ConsumoEnergetico(
        potencia_bomba_w=150.0,  # Bomba pequeña para prototipo
        altura_elevacion_m=2.0
    )

    # --- F14: Modelo Termodinámico Teórico ---
    print("\n[F14] MODELO TERMODINÁMICO TEÓRICO")
    print("-" * 50)

    # Determinar temperatura del condensador (medida o estimada)
    temp_cond = temperatura_condensador(hid)
    modo_cond = "MEDIDA" if hid.temp_superficie_condensador_c is not None else "ESTIMADA"
    print(f"  T condensador:            {temp_cond}°C ({modo_cond})")

    resultado_td = calcular_modelo_teorico(atm, temp_cond)
    print(f"  Punto de rocío:           {resultado_td.punto_rocio_c}°C")
    print(f"  Presión de saturación:    {resultado_td.presion_saturacion_hpa} hPa")
    print(f"  Humedad absoluta:         {resultado_td.humedad_absoluta_g_m3} g/m³")
    print(f"  Agua condensable:         {resultado_td.litros_teoricos_por_m3 * 1000:.2f} g/m³")
    print(f"                            ({resultado_td.litros_teoricos_por_m3:.6f} l/m³)")
    print(f"  Delta de enfriamiento:    {resultado_td.delta_enfriamiento_c}°C")
    print(f"  Producción horaria:       {'N/D (caudal de aire no disponible)' if resultado_td.produccion_teorica_lph is None else f'{resultado_td.produccion_teorica_lph} l/h'}")

    # Ejemplo con caudal de aire estimado
    print(f"\n  → Estimación con caudal de aire hipotético (100 m³/h):")
    resultado_con_caudal = calcular_modelo_teorico(atm, temp_cond, caudal_aire_m3h=100.0)
    print(f"    Producción teórica:     {resultado_con_caudal.produccion_teorica_lph} l/h")
    print(f"    Producción diaria (24h):{resultado_con_caudal.produccion_teorica_lph * 24:.2f} l/día")

    # --- Validación empírica diferencial ---
    print(f"\n  → Extracción empírica diferencial (entrada vs salida del aire):")
    extraccion = calcular_extraccion_empirica(atm)
    if extraccion is None:
        print(f"    No disponible (datos de salida del aire pendientes del MAS)")
    else:
        print(f"    Vapor extraído:         {extraccion:.2f} g/m³")

    # Simulamos datos de salida para mostrar el modo empírico
    print(f"\n  → Simulando datos de salida del condensador:")
    atm_con_salida = CondicionesAtmosfericas(
        temperatura_aire_c=21.0,
        humedad_relativa_pct=88.0,
        presion_atmosferica_hpa=1013.0,
        velocidad_viento_ms=3.5,
        temp_aire_salida_c=14.5,   # Aire enfriado al pasar por el serpentín
        hr_aire_salida_pct=100.0   # Saturado (HR=100%) a la salida
    )
    extraccion_sim = calcular_extraccion_empirica(atm_con_salida)
    print(f"    T aire salida:          {atm_con_salida.temp_aire_salida_c}°C")
    print(f"    HR aire salida:         {atm_con_salida.hr_aire_salida_pct}%")
    print(f"    Vapor extraído (emp.):  {extraccion_sim:.2f} g/m³")
    print(f"    Valor teórico:          {resultado_td.litros_teoricos_por_m3 * 1000:.2f} g/m³")
    if extraccion_sim > 0:
        pct_acierto = (extraccion_sim / (resultado_td.litros_teoricos_por_m3 * 1000)) * 100
        print(f"    Porcentaje de acierto:  {pct_acierto:.1f}%")

    # --- F15: Inecuación de Rentabilidad ---
    print("\n[F15] INECUACIÓN DE RENTABILIDAD")
    print("-" * 50)

    # Simulamos 1 hora de operación con producción estimada
    litros_1h = hid.caudal_agua_dulce_lpm * 60  # l/h
    resultado_rent = calcular_inecuacion_rentabilidad(consumo, litros_1h, 1.0)

    print(f"  Periodo:                  1 hora")
    print(f"  Agua producida:           {resultado_rent.litros_condensados} litros")
    print(f"  Energía consumida (bomba):{resultado_rent.energia_consumida_wh} Wh")
    print(f"  Energía ahorrada (540Kcal/l): {resultado_rent.energia_ahorrada_wh} Wh")
    print(f"  Ratio de eficiencia:      {resultado_rent.ratio_eficiencia}x")
    print(f"  Flag RENTABLE:            {'✓ TRUE' if resultado_rent.flag_rentable else '✗ FALSE'}")

    if resultado_rent.flag_rentable:
        print(f"  → La energía ahorrada supera a la consumida en "
              f"{resultado_rent.ratio_eficiencia}x")
        print(f"  → Tesis de la patente VALIDADA para estas condiciones")

    # --- F06: Auditoría Ecológica y Operativa ---
    print("\n[F06] AUDITORÍA ECOLÓGICA Y OPERATIVA")
    print("-" * 50)

    resultado_eco = auditar_ecologia_operativa(atm, hid)

    print(f"  Verificación 1 — Huella térmica marina:")
    print(f"    Delta térmico:          {resultado_eco.delta_termico_c}°C")
    print(f"    Umbral aceptable:       {resultado_eco.umbral_termico_c}°C")
    print(f"    Flag HUELLA NULA:       "
          f"{'✓ TRUE' if resultado_eco.flag_huella_termica_nula else '✗ FALSE'}")

    print(f"  Verificación 2 — Ausencia de efluentes:")
    print(f"    Flag SIN EFLUENTES:     "
          f"{'✓ TRUE' if resultado_eco.flag_ausencia_efluentes else '✗ FALSE'}")

    print(f"  Verificación 3 — Condición de operabilidad:")
    print(f"    Punto de rocío:         {resultado_eco.punto_rocio_c}°C")
    print(f"    T agua fría:            {resultado_eco.temp_agua_fria_c}°C")
    print(f"    Margen:                 {resultado_eco.margen_operabilidad_c}°C")
    print(f"    Flag OPERABLE:          "
          f"{'✓ TRUE' if resultado_eco.flag_condicion_operabilidad else '✗ FALSE'}")

    # --- Datos de profundidad (BD espacio-temporal) ---
    print(f"\n  Datos espacio-temporales (F5b):")
    print(f"    Profundidad captación:  {hid.profundidad_captacion_m} m")
    print(f"    Coordenadas:            {hid.latitud}°N, {hid.longitud}°E")
    print(f"    T agua captación:       {hid.temp_agua_fria_c}°C")
    print(f"    T agua retorno:         {hid.temp_agua_retorno_c}°C")

    # --- Resumen global ---
    print("\n" + "=" * 70)
    print("RESUMEN DE FLAGS DEL INSTANTE DE MEDICIÓN")
    print("=" * 70)
    flags = {
        "F15 - Rentabilidad energética": resultado_rent.flag_rentable,
        "F06.1 - Huella térmica nula": resultado_eco.flag_huella_termica_nula,
        "F06.2 - Ausencia de efluentes": resultado_eco.flag_ausencia_efluentes,
        "F06.3 - Condición de operabilidad": resultado_eco.flag_condicion_operabilidad,
    }
    for nombre, valor in flags.items():
        estado = "✓ TRUE" if valor else "✗ FALSE"
        print(f"  {nombre}: {estado}")

    todos = all(flags.values())
    print(f"\n  ESTADO GLOBAL: {'✓ TODOS LOS FLAGS ACTIVOS' if todos else '✗ ALGÚN FLAG INACTIVO'}")


# =========================================================================
# PUNTO DE ENTRADA
# =========================================================================

if __name__ == "__main__":
    calibracion_ok = calibrar_contra_alboran()
    if calibracion_ok:
        demo_funcionalidades()
    else:
        print("\n⚠ La calibración ha fallado. Revisar las fórmulas antes de continuar.")
