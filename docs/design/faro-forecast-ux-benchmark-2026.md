# FARO | Forecast UX benchmark & design principles
**Revisión:** 23 noviembre 2026 · **Ámbito:** Chile (primero) y Zeeland (paridad futura)  
**Propósito:** conservar un criterio verificable de diseño de marca, producto e ingeniería en vez de acumular retoques CSS inconexos.

## 1. Qué producto estamos construyendo
FARO es un **intérprete de condiciones oceánicas para decisiones de surf**, no una versión reducida de Surfline ni una consola meteorológica con branding. La promesa razonable es: **«¿Qué spot? ¿Cuándo? ¿Por qué? ¿Qué sabemos y qué no?»**. El índice 0–10 es experimental, no una predicción validada de la altura de ola rompiendo ni un certificado de seguridad.

### Contrato de identidad que NO debe perderse
- Deep Ocean, tipografía legible, composición editorial, faro original de cuatro segmentos, haz y halo animados como identidad; deben ser discretos, visibles y estar detrás del contenido.
- Cinco colores de calidad **canónicos** en `assets/faro-visual-system-v2.css`; azul para física de olas, teal para selección y códigos separados para peligro/UV. **Nunca** cambiar la escala de score entre temas.
- Día como selector independiente **encima** del HERO; franjas de 2 horas **dentro** del HERO; una selección, un estado, un conjunto de mediciones y advertencias.
- Texto de salida del modelo distinguido de observaciones, avisos oficiales y condiciones reales de la rompiente. Nunca etiquetar como «live» un dato sin observación verificada.
- Las indicaciones de peligro, restricciones, datos vencidos o faltantes predominan siempre sobre el optimismo visual de los scores.

## 2. Auditoría del estado actual (código + capturas de QA)

**Fuentes internas:** `chile/index.html`, `chile/chile-forecast.js`, `chile/faro-tide-read.css`, `chile/faro-editorial-experience-v2.css`, `chile/faro-score-colour-lock-v1.css`; QA `chile/test-browser.cjs` y `tests/faro-responsive-browser.mjs`.

**Fortalezas:** atmósfera oceánica propia; índice de sesión y mejores ventanas; datos más profundos bajo progressive disclosure; modo claro/oscuro; selector de día + 2 horas conectados al mismo modelo; advertencias en estados incompletos; pruebas con Chromium/WebKit.

**Problemas observables:**
1. En la captura de Chromium 1440×840 generada el 22-11-2026, una tarjeta de ubicación de aproximadamente 260 px, aviso de fuentes y navegación preceden el selector semanal. El HERO empieza cerca del límite inferior del viewport: **no hay decisión inmediata en el primer pantallazo**.
2. En el iPhone de 390 px, la ubicación, avisos y selector semanal desplazan las horas relevantes hacia abajo. La identidad gráfica es atractiva, pero la prioridad de tareas no siempre es visible.
3. Los 7 días se comparan principalmente por números, sin representación gráfica de magnitud; las 8 franjas repiten «Bueno/Regular» en vez de aportar un segundo dato.
4. Gran parte del producto bajo el HERO contiene componentes técnicos muy completos, pero el usuario tiene que descubrirlos desplazándose por varias secciones.
5. Deuda de especificidad: a fecha de auditoría `faro-tide-read.css` tenía 484 `!important`, `faro-editorial-experience-v2.css` 896 y `chile-visual-contract.css` 266: 1.646 solo en esas tres hojas. Esto significa **riesgo de mantenimiento**, no es una medición directa de velocidad de carga. Prohibido resolver un bug moviendo esa deuda entre propietarios.

**Nota de evidencia:** las capturas del CI usan modelos simulados para garantizar la reproducción de estados; NO son una observación de cómo estuvo el mar ese día.

## 3. Benchmark de producto y diseño (fuentes primarias)

| Producto | Patrón observado | Patrón trasladable | Qué NO copiar |
|---|---|---|---|
| Surfline | Pestañas **Live / Forecast / Analysis / Charts / Guide**; resumen cercano al comienzo, comparativa temporal, color semántico, gráficos avanzados desplegables | **Capas de decisión**: vista de 5 segundos, lectura de 30 segundos y ciencias profundas opcionales | «Surf height at break» o falsa cámara en vivo si FARO solo tiene modelo mar adentro |
| Lineup Surf Forecast (Europa) | Interpreta modelos y condiciones de cada spot, incorpora boyas y mapa, prioriza interpretación respecto de una tabla bruta | Traducir datos en **factores a favor / en contra** con procedencia explícita | Prometer validación local o correspondencia con rompiente que no se ha medido |
| Lineup (Latinoamérica, lineup.surf) | Combina cámaras, pronósticos expertos, tarjetas de condición y spots recomendados; distingue lectura humana y modelo | Un **estado claro del origen**: modelo solo, observado, informe experto cuando exista | Presentar un modelo automático como observación humana |
| Surf-Forecast.com | Alta densidad técnica, energía, dirección, tabla temporal, WaveFinder, ratings y contexto de rompiente | Conservar el modo **Ocean Lab** como segunda capa verificable | Convertir la primera pantalla en un muro de números |
| Windy / Windy.app | Tiempo compartido para viento, swell y capas de mapas, lectura de patrones espaciales | Mantener una **hora seleccionada sincronizada** con análisis y mapa | Usar mapas estéticos sin hora o modelo asociado |
| Lineup: Surf Forecast & Guides | Predicción adaptada a nivel, spot y tablas/guías; recomendaciones fáciles de interpretar | En `FARO Match`, separar oportunidad física, adecuación al usuario y factores de seguridad | Mezclar nivel de surfer con certeza meteorológica |

### URLs de referencia, consultadas 23-11-2026
- Surfline, guía oficial del spot: https://support.surfline.com/hc/en-us/articles/13749782983579-Understanding-the-Spot-Forecast-Page-on-the-Surfline-Website
- Surfline, app: https://support.surfline.com/hc/en-us/articles/5291001325595-Understanding-the-Live-and-Forecast-tabs-on-the-Surfline-iOS-App
- Lineup Forecast: https://lineupforecast.com/ y https://apps.apple.com/gb/app/lineup-surf-forecast/id1554147127
- Lineup LatAm: https://lineup.surf/es/faq y https://lineup.surf/es/news/el-pronostico-experto-evoluciona-nueva-interfaz-mejor-lectura-del-mar
- Surf-Forecast, explicación de calificaciones: https://www.surf-forecast.com/pages/faq
- Surf-Forecast, ejemplo: https://www.surf-forecast.com/breaks/Surfers/forecasts/latest
- Windy.app, guía: https://windy.app/guide/mini-guide-to-surfing.html
- Windy.com, mapa de olas: https://www.windy.com/39.715/19.681/ecmwfWaves/waves
- Lineup / Surf Guides: https://www.lineup-experience.com/

Estas referencias describen patrones visibles o documentados; **no constituyen una validación independiente de precisión predictiva**.

## 4. Diseño objetivo: cinco segundos, treinta segundos, Ocean Lab

```text
FARO / región + spot actual                 [cambiar spot]
[Avances del modelo y avisos: línea compacta; advertencias nunca ocultas]
[ 7 días comparables · color canónico + score + barra de tendencia ]
┌──────────────────────────────────────────────────────────────┐
│ El mar para [spot]             [FARO iluminado, sin tapar]    │
│ [Headline de decisión breve]                                 │
│ Score y franja seleccionada; explicación y origen del dato   │
│ —─────────────────────────────────────────────────────────── │
│ Horas de 2 h: score + viento, riesgo siempre visible          │
│ [Ver análisis técnico]                                       │
└──────────────────────────────────────────────────────────────┘
[Lo que explica la ventana]  [Mapa/compás asociado a esa hora]
[Ocean Lab desplegable: swell, periodo, dirección, viento, marea, fuentes]
```

**Capas:**
- **5 segundos:** spot, ventana elegida/posible, índice de sesión, avisos relevantes, calidad de los datos.
- **30 segundos:** comparación horizontal de días y horas, exposición al viento, condiciones mar adentro, lectura sobre orientación.
- **Laboratorio:** física detallada, fuentes, limitaciones, mapas, comparaciones y trayectorias horarias con progresiva divulgación.

### Reglas de diseño para el equipo
1. **Jerarquía:** una afirmación principal por sección y un eje temporal compartido. Nunca repetir el mismo score en tres tarjetas con distintos nombres.
2. **Tokens:** no crear otra escala cromática de puntuación; la intensidad del índice puede cambiar la longitud de un indicador, no su color.
3. **Ritmo:** separadores finos y espacios intencionales en vez de un borde grueso por valor; no más de un CTA principal dentro del HERO.
4. **Imagen de marca:** no eliminar la «O» original ni sustituirla por una ilustración genérica. Animar solo propiedades compatibles con composición eficiente; `prefers-reduced-motion` recibe un fotograma estático.
5. **Datos:** diferenciar `altura oceánica` de altura de ola rompiendo; distinguir estado del modelo, calidad del score, peligro modelado y avisos oficiales.
6. **Accesibilidad:** valores útiles incluso sin color; contraste, foco visible, botones >=44 px de área táctil, etiqueta ARIA completa y teclado izquierda/derecha/inicio/fin.
7. **Estabilidad:** evitar nuevos `!important` y capas CSS propietarias redundantes; modificar el dueño real. Caché versionada en Safari después de cambios de recursos.
8. **Rendimiento:** nada de librerías, imágenes o API externas solo para decorar; evitar animar layout, filtrar grandes áreas o añadir temporizadores sin motivo.
9. **Paridad regional:** Chile y Zeeland comparten las mismas reglas de lectura, pero cada zona mantiene variables y limitaciones auténticas.

## 5. Decisiones de implementación

### Etapa A — ejecutada en esta rama
- Reducir el espacio del selector desktop de región/spot/actualización a una utilidad horizontal: hacer visible el comienzo de la lectura dentro del primer viewport.
- Añadir una barra horizontal **normalizada al índice 0–10 existente** para comparar días de forma inmediata; omitirla si el día no es evaluable.
- Sustituir el texto de calidad repetido en horas **válidas, futuras y seguras** por dirección/intensidad del viento (km/h indicado en el encabezado); mantener Riesgo, Precaución, Sin luz, Pasado y Sin evaluar cuando corresponda.
- Retener días separados del HERO, horas dentro del HERO, el faro animado, el contrato cromático y la misma lógica de scoring y fuentes.
- Cero nuevas hojas de estilos y cero incremento neto de `!important`.

### Etapa B — propuesta, no implementada aquí
- Un único cursor temporal que sincronice franja, mapa, viento y detalle; en los spots con marea verificada, indicar fase de marea sin extrapolaciones.
- Tarjeta secundaria «Por qué esta ventana»: máximo tres factores con signos a favor/en contra/indeterminados, basados en datos realmente disponibles.
- Comparación de hasta tres spots con la misma ventana temporal y la misma fuente; no mezclar scores de modelos incompatibles.
- Mejorar el acceso a fuentes y fecha del dato sin elevar el estado de cobertura a «alerta verificada».

### Etapa C — validar con usuarios, no por estética
- Prueba con tareas («¿En qué franja entrarías?», «¿Qué te haría desistir?», «¿El score viene de boya o modelo?»).
- Medir tiempo de elección, errores de interpretación, scrolling y accesibilidad; comparar mobile/desktop.
- Integrar aprendizaje de spot y perfil **solo cuando existan referencias y evaluación verificable**.

## 6. Criterios verificables antes de fusionar
- Capturas 320, 375, 390, 430, 768, 1180, 1440 px y temas claro/oscuro, WebKit y Chromium.
- En escritorio 1440×840, al menos el inicio de la lectura principal debe aparecer en el primer viewport; reducción medible de la altura del selector.
- Ningún desbordamiento horizontal del documento ni pérdida de posibilidad de desplazamiento lateral de franjas.
- Seleccionar día/hora actualiza un solo modelo y conserva foco accesible.
- Los valores de color, los rangos de score, los avisos de peligro y las reglas de vencimiento no cambian.
- Estados sin dato no presentan magnitudes falsas, ni barras de color positivas, ni un botón funcionalmente vacío.
- El faro original sigue visible y no se superpone al texto; `prefers-reduced-motion` conserva lectura.
- El límite de `!important` por hoja NO aumenta; todas las pruebas CI deben estar en verde.

## 7. Guía para futuras revisiones
Ante cada nuevo cambio: **(1) detectar el problema de usuario, (2) identificar el componente propietario y su contrato, (3) compararlo con este documento, (4) cambiar el mínimo de CSS/JS, (5) ejecutar tests y revisar capturas, (6) documentar la decisión.** El benchmark es una guía persistente, no una invitación a copiar pixel por pixel a los competidores.
