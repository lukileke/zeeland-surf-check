# FARO Chile · Primera activación controlada (La Boca → Reñaca)
**26 de octubre de 2026 · Plan operativo v1 · Chile permanece DESACTIVADO**

FARO ya dispone de un catálogo de 16 regiones, 73 lugares candidatos y un FARO Lab experimental con perfiles documentados para La Boca, Ritoque, Reñaca norte, Maitencillo y Papagayo. Nada de eso constituye todavía un pronóstico publicado ni una calibración de la ola rompiente. Este documento convierte la investigación en **tareas con entregables y criterios de salida**.

## Decisión de producto
**Primera playa: La Boca de Concón.** Segunda fase: Reñaca Norte. No activar todo Chile de una vez. Mantener Zeeland sin cambios. Hasta superar los criterios de salida, el modo Chile debe seguir oculto en la navegación principal y los widgets.

### Puerta 0 — Identificar el lugar EXACTO
Entregables:
- [ ] Registrar coordenada comprobada de cada zona de entrada y punto del **modelo costero**, explícitamente distintos.
- [ ] Separar La Boca / bancos de desembocadura / tramos adyacentes solo donde existan evidencias de rompientes diferentes.
- [ ] Validar orientación de línea de costa (° true north), rompiente de arena/desembocadura, posibles obstáculos y fondo.
- [ ] Verificar con municipalidad y organismos ambientales los límites aplicables al humedal y accesos a surf.
- [ ] Anotar el horario `America/Santiago`, la fuente y la incertidumbre espacial.

**Salida:** un Spot DNA que pueda etiquetarse como `field_checked` para hechos verificados, no para todo el spot. Si no hay coordenadas precisas y delimitación, no desplegar mapa ni score por sector.

### Puerta 1 — Proveedor de predicción y derecho de uso
Candidatos:
- **Universidad de Valparaíso, Marejadas:** [bahía de Concón](https://marejadas.uv.cl/sinicio/pronosticos-bahia-de-concon) presenta modelos cerca de 20 m de profundidad para La Boca, Higuerillas y Punta Piqueros. [Bahía de Valparaíso](https://marejadas.uv.cl/index.php/pronosticos-bahia-de-valparaiso) distingue Reñaca Norte, Centro y Sur.
- **Open-Meteo Marine:** variables de total wave, swell primario/secundario, período, dirección, fecha, zona, model run. Evaluar el grid marino real en Chile (tierra vs océano, resolución, componentes faltantes, climatología de error).
- **SHOA / DIRECTEMAR:** mareas por puerto de referencia y avisos de marejadas. Comprobar acceso técnico, licencias y datum ANTES de extraer datos automáticamente.

Entregables:
- [ ] Confirmar con UV si existe endpoint estructurado reutilizable/licencia/atribución, o documentar acceso manual. **No scraping indiscriminado**.
- [ ] Prueba de cobertura Open-Meteo en punto marino verificado y comparación de hora UTC, altura significativa, período y dirección.
- [ ] Guardar UTC + `validTime` + `issuedAt` + versión del modelo; distinguir total wave, swell particionado y observaciones.
- [ ] Determinar la validez de la curva de marea local y su datum; un nivel de mar modelado no equivale automáticamente a una tabla oficial SHOA.

**Salida:** un adaptador de datos que rellene el contrato sin mezclar altura de ola offshore con altura rompiente, y marque los datos ausentes con null.

### Puerta 2 — Seguridad y advertencias jurisdiccionales
- [ ] Enlace oficial Chile: Servicio Meteorológico Armada / DIRECTEMAR, avisos de marejadas; conservar sello temporal y ámbito geográfico.
- [ ] Incorporar notas locales: corrientes de desembocadura, cambios de banco, calidad del agua tras lluvias, rocas y humedal. No inferir potabilidad/seguridad acuática.
- [ ] Separar **alerta oficial consultada** de **riesgo detectado por FARO a partir del modelo**. Nunca mostrar “sin alertas” si no se consultó la fuente oficial.
- [ ] Prohibir que el estado KNMI de Países Bajos aparezca en vistas o widgets de Chile.

**Salida:** pruebas de jurisdicción y estados `unknown / checked / stale`; advertencias con actualización visible.

### Puerta 3 — Calibración científica del score (FARO's edge)
Las bandas iniciales de viento/swell en `valparaiso-score.config.json` son hipótesis basadas en guías, no resultados validados. La nota provisoria está limitada a 7.9, pero ese límite **no es una métrica de confianza**.

Observación recomendada por ventana de ~2 h (ver [plantilla](field-observations-template.csv)):
- Fecha/hora con zona, spot/banco, surf o vista desde orilla, posición observada, marea y fuente, nota de calidad 1–5; forma de ola, altura estimada local, tabla, habilidad/condiciones, viento observado;
- fotografía o nota opcional local y versión del forecast emitido ANTES de la observación; evitar información retrospectiva;
- separar evaluaciones entre surfistas, evitar leakage y marcar datos incompletos.

Piloto operativo inicial: **acumular al menos 30–50 observaciones válidas en regímenes distintos** (criterio exploratorio, no potencia estadística garantizada). Añadir temporadas, vientos cruzados y días claramente malos. Antes de publicar puntuaciones precisas /10, hacer evaluación externa con fechas no usadas al calibrar, errores por régimen, fiabilidad y casos de fallo. Si la evidencia sigue siendo débil, mostrar etiquetas cualitativas y bandas en lugar de decimales.

**Salida:** ajustes por sector con error medido, incertidumbre y cobertura temporal; nada de “ideal tide” estático hasta que datos de marea y observaciones lo justifiquen.

### Puerta 4 — FARO VIBE, FARO READ y FARO MATCH
- [ ] **Surf Quality:** calidad estimada objetiva para el break (0–10 solo si calibración lo permite).
- [ ] **Spot Fit:** compatibilidad direccional del modelo con la exposición y banco; fuente y límites.
- [ ] **FARO VIBE:** carácter de la sesión (“Mellow”, “Punchy”, “Choppy”, “Short-period”) inferido con lógica explicable.
- [ ] **FARO READ:** conclusión en lenguaje natural: la causa dominante y principal incertidumbre, no repetir el score.
- [ ] **FARO Match:** ajuste a tabla y objetivo personal sin cambiar la evaluación física del spot.
- [ ] **Estado de seguridad separado:** un score alto no implica condiciones seguras ni aptitud para principiantes.

**Salida:** pruebas EN/ES de las mismas entradas con explicación y tags consistentes.

### Puerta 5 — Interfaz y despliegue por etapas
- [ ] Comparador La Boca vs Reñaca + franjas horarias de 2 h; información publicada con origen de modelo, UTC/local y fecha de actualización.
- [ ] Brújula FARO Swell Compass fase A (véase [especificación](../FARO_SWELL_COMPASS_SPEC.md)); mapa de base solamente al verificar punto, costa y licencia.
- [ ] Pantallas escritorio (1366 y 1440 px), tablet (1024), iPhone (390/430) en ambos temas; sin desbordamientos ni información crítica truncada.
- [ ] QA de traducciones, cierre de horario diurno, DST Chile y Rapa Nui.
- [ ] Activar una **beta explícita para La Boca**, etiquetada experimental y aislada del principal FARO Zeeland. Añadir Reñaca después de pasar el mismo checklist.
- [ ] Widgets para Chile en última etapa, una vez separados los namespaces de caché, tipos de alerta y zona horaria.

## Próximos tres cambios concretos, en orden
1. **Metadatos fiables de La Boca:** georreferenciar rompiente y punto UV; definir alcance de fuentes, humedal, corriente y acceso.
2. **Ingesta con provenance:** comparar 7 días de UV / Open-Meteo en el mismo horario y declarar explícitamente la diferencia entre modelo oceánico, modelo a 20 m y observación de ola rompiente.
3. **Diario de validación:** capturar observaciones sincronizadas con cada forecast; comparar viento/swell/modelo con forma y rideabilidad observadas. **Después**, discutir coeficientes del score.

## Fuentes base
- UV bahía de Concón: https://marejadas.uv.cl/sinicio/pronosticos-bahia-de-concon
- UV bahía de Valparaíso: https://marejadas.uv.cl/index.php/pronosticos-bahia-de-valparaiso
- Open-Meteo marine: https://open-meteo.com/en/docs/marine-weather-api
- SHOA mareas: https://www.directemar.cl/directemar/site/edic/base/port/preg_frec_shoa.html
- Armada avisos: https://meteoarmada.directemar.cl/
