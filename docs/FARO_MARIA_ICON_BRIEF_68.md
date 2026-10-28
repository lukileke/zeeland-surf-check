# FARO | Brief de iconografía para María

**Preparado para compartir** · 26 de octubre de 2026 · **68 piezas previstas** · Zeeland + Chile

## 1. Qué estamos diseñando

FARO es un sistema de pronóstico para decidir si merece la pena ir a surfear. Necesita una familia visual con identidad **surfista, editorial, costera y contemporánea**, sin emojis, sin muñecos simpáticos, sin símbolos arbitrarios y sin copiar iconos de otras plataformas.

La lectura debe sentirse cuidada como un producto de diseño, pero también precisa: **la altura de ola offshore no es la altura de rompiente**, la dirección del swell no es la dirección en que se propaga, y un score favorable no significa ausencia de peligros.

Los 68 iconos ya están definidos por ID, nombre y objetivo en el [manifiesto de FARO](../assets/faro-icon-manifest.json). **Este documento es la versión legible para ti**. No necesitamos dibujarlos todos de una vez.

## 2. Lenguaje visual y reglas

- **Inspiración:** cartografía de costa, líneas de oleaje, señales náuticas y cultura surf contemporánea. Un toque retro-surf en el carácter, pero limpio, no vintage caricaturesco.
- **Construcción:** SVG en grilla 24 × 24 px, trazo aprox. **1,75 px**, extremos y uniones redondos, sin sombras, emojis, rasters o gradientes. Ajusta visualmente la masa óptica cuando sea necesario.
- **Color:** monocromáticos y heredan `currentColor`. El programa asignará colores contextuales según score, alerta o jerarquía. Deben funcionar en fondos claros y oscuros.
- **Tamaños:** probar a **16, 20, 24 y 32 px**; uso principal 16–20 para información y 20–24 para acciones y secciones.
- **Tipografía de referencia:** Archivo Black en títulos principales, Manrope para valores, botones, navegación y contenido. Los iconos deben convivir ópticamente con Manrope Semibold.
- **Accesibilidad:** el nombre escrito acompaña al icono. Un aviso de peligro necesita icono + color + texto y no debe parecer un score de surf.
- **Qué no es un icono:** las flechas de una brújula con grados, la escala de ola, las barras y los vectores son visualizaciones de datos reales; pueden cambiar su estilo gráfico, pero no perder precisión.
- **Logo FARO:** la O actual queda provisional. Cualquier rediseño final del isotipo se revisa por separado para favicon, pestaña, widget y uso a 16 px.

## 3. Prioridades para trabajar

**P0 – Primero:** 36 iconos necesarios para la experiencia principal. Propongo dividirlos en lotes pequeños: datos de oleaje y viento → navegación y acciones → tags VIBE → seguridad y observaciones.

**P1 – Después:** 32 iconos que aportan contexto, personalización o una segunda profundidad de la interfaz.

**P2/P3 – Futuro:** 0 iconos para opciones avanzadas y datos que todavía no están disponibles en todos los spots.

## 4. Lista maestra con objetivo y ubicación

Cada ID corresponde exactamente a un archivo SVG en `assets/icons/`. No renombrar: ambos países consumen un manifiesto común.

| Prioridad | Icono / archivo | Ubicación | Objetivo funcional y dirección artística |
|---|---|---|---|
| P0 | `wave-height.svg` (Oleaje) | Resumen diario, sesión, tarjetas, widget | Altura total prevista del oleaje; cresta con 2 líneas de mar, no un emoji |
| P0 | `swell-direction.svg` (Oleaje) | Coastal Lens, brújula, detalle | Procedencia del swell; línea ondulada con vector FROM, reutilizable rotando |
| P0 | `swell-period.svg` (Oleaje) | Resumen diario, detalle horario | Segundos entre crestas; dos crestas sucesivas y marca de intervalo |
| P0 | `breaking-wave.svg` (Oleaje) | Observación de cámara, Spot DNA | Fase de rompiente, borde de espuma, sin afirmar surfabilidad |
| P0 | `clean-lines.svg` (FARO VIBE) | Tag de calidad percibida | Pared de ola larga y abierta, limpio ≠ ausencia de riesgo |
| P0 | `small-swell.svg` (FARO VIBE) | Tag de swell chico | Onda corta de baja amplitud sin connotación de peligro |
| P0 | `choppy.svg` (FARO VIBE) | Tag de picadas | Líneas cortas quebradas por viento; distinto de marejada peligrosa |
| P0 | `glassy.svg` (FARO VIBE) | Tag de superficie lisa | Una cresta suave con reflejo discreto |
| P0 | `wind-speed.svg` (Atmósfera) | Resumen, before you go, slots | Velocidad media 10 m; 3 líneas de flujo abstractas |
| P0 | `wind-direction.svg` (Atmósfera) | Brújula, Coastal Lens | Vector naranja viento DESDE, independiente de swell |
| P0 | `rain.svg` (Meteorología) | Pronóstico y warnings | Gotas bajo nube esquemática, una forma de familia |
| P0 | `thunderstorm.svg` (Seguridad) | Alertas de tormenta | Nube con evento eléctrico y alto contraste |
| P0 | `sun.svg` (Luz y UV) | Tema, UV, luz solar | Disco sobrio y rayos cortos |
| P0 | `moon.svg` (Luz y UV) | Tema oscuro, noche | Luna creciente monoline geométrica |
| P0 | `uv-index.svg` (Luz y UV) | UV elevado / extremo | Disco y aro de radiación; intensidad la comunica el color del badge |
| P0 | `air-temperature.svg` (Temperaturas) | Before you go | Termómetro con marca de aire |
| P0 | `water-temperature.svg` (Temperaturas) | Before you go | Termómetro con onda de agua distintiva |
| P0 | `marine-alert.svg` (Seguridad) | Marejadas y alerta oficial | Escudo/triángulo marino distinto de riesgo modelado |
| P0 | `weather-caution.svg` (Seguridad) | Precaución por modelo | Triángulo alerta sencillo para precaución |
| P0 | `weather-danger.svg` (Seguridad) | Riesgo severo | Triángulo alerta sólido de alta prioridad |
| P0 | `unknown-data.svg` (Datos) | Sin pronóstico / sin confirmar | Círculo abierto con interrogación simple |
| P0 | `map.svg` (Navegación) | Mapa de spots | Costa geográfica abstracta, no emoji mapa plegado |
| P0 | `location-pin.svg` (Navegación) | Selector de spot | Pin con centro neutro legible a 16 px |
| P0 | `compass.svg` (Navegación) | Coastal Lens, Swell Compass | Aguja direccional, no duplicar brújula de datos dinámica |
| P0 | `spot-dna.svg` (Navegación) | Ficha específica playa | Capas de costa y arena: no ADN biológico literal |
| P0 | `camera.svg` (Observación) | Ver webcam | Cámara frontal minimal de lente |
| P0 | `field-notes.svg` (Observación) | FARO Lab, notas | Cuaderno sencillo con marcas, no lápiz de texto |
| P0 | `faro-read.svg` (FARO) | Explicación del porqué | Documento/onda con líneas interpretativas |
| P0 | `faro-match.svg` (FARO) | Recomendación tabla/persona | Tabla que coincide con onda, no surfista de emoji |
| P0 | `wetsuit.svg` (Equipo) | Qué usar, before you go | Silueta de traje de neopreno sin detalles de persona |
| P0 | `water-safety.svg` (Seguridad) | Safety guide / instrucciones | Salvavidas circular monoline |
| P0 | `refresh.svg` (Acciones) | Actualizar forecast | Flecha circular única, sin flechas doble decorativas |
| P0 | `chevron.svg` (Acciones) | Desplegables, select | Ángulo 90 grados neutral |
| P0 | `external-link.svg` (Acciones) | Cámaras y fuentes | Flecha de enlace externo legible |
| P0 | `check.svg` (Estados) | Confirmación y observación | Marca de verificación limpia |
| P0 | `info.svg` (Estados) | Detalles del modelo / ayuda | Letra i en círculo con buen contraste |
| P1 | `swell-energy.svg` (Oleaje) | Detalles técnicos, Spot DNA | Comparación de potencia proxy sin parecer altura de rompiente |
| P1 | `secondary-swell.svg` (Oleaje) | Swell Compass, datos espectrales | Segundo tren de swell; dos ondas con trama secundaria |
| P1 | `wave-set.svg` (Oleaje) | FARO READ, observaciones | Grupo de olas de una serie, no frecuencia continua |
| P1 | `mushy.svg` (FARO VIBE) | Tag suave / baja potencia | Cresta blanda, volumen redondeado, sin forma de cartoon |
| P1 | `punchy.svg` (FARO VIBE) | Tag de swell potente | Cresta marcada con pared más vertical, no rayos ni explosiones |
| P1 | `mixed-bag.svg` (FARO VIBE) | Tag de señales mixtas | Dos ondas de carácter opuesto; no bolsa literal |
| P1 | `windy.svg` (FARO VIBE) | Tag ventoso | Tres estelas de viento sobre superficie |
| P1 | `closeout.svg` (Observación real) | Registro de campanas | Frente de espuma que cierra al mismo tiempo; no usar sin observación |
| P1 | `rideable-wall.svg` (Observación real) | Marcado manual de pared | Pared abierta y línea de recorrido, sin surfista identifiable |
| P1 | `wind-gust.svg` (Atmósfera) | Rachas, riesgos | Flujo con pequeña acentuación, no tornado |
| P1 | `offshore-wind.svg` (Atmósfera) | Spot DNA, orientación | Dirección mar afuera con costa; solo si exposición está sustentada |
| P1 | `onshore-wind.svg` (Atmósfera) | Spot DNA, orientación | Dirección tierra adentro; solo si exposición está sustentada |
| P1 | `cross-shore-wind.svg` (Atmósfera) | Spot DNA, orientación | Dirección lateral respecto a costa; distinguir viento cruzado |
| P1 | `fog.svg` (Meteorología) | FARO READ, visibilidad | Estratos horizontales que ocultan costa, sin emoji nube |
| P1 | `cloud.svg` (Meteorología) | Forecast del día | Nube monoline simple, sin cara |
| P1 | `sunrise.svg` (Luz y UV) | Amanecer | Sol emergiendo sobre horizonte |
| P1 | `sunset.svg` (Luz y UV) | Atardecer | Sol descendiendo sobre horizonte |
| P1 | `daylight.svg` (Luz y UV) | Ventana navegable | Disco con segmento temporal útil |
| P1 | `sea-current.svg` (Seguridad) | Datos costeros y avisos | Vector de corriente de agua; distinguir del swell |
| P1 | `rip-current.svg` (Seguridad) | Advertencias verificadas | Canal de retorno entre olas; solo evidencia fiable |
| P1 | `tide.svg` (Mareas) | Tide / Spot DNA | Nivel de agua sobre marcas de referencia, no confundir con energía |
| P1 | `sandbank.svg` (Spot DNA) | Banco / fondo arenoso | Contorno de curva de nivel bajo ola, sin afirmar banco exacto |
| P1 | `river-mouth.svg` (Spot DNA) | La Boca y dinámica río-mar | Río que desemboca en costa; icono informativo |
| P1 | `video-play.svg` (Observación) | Reproductor video local | Triángulo playback dentro de marco |
| P1 | `wave-count.svg` (Observación) | Olas por 10 minutos | Crestas repetidas con conteo |
| P1 | `prediction-history.svg` (Datos) | Archivo de pronóstico | Reloj temporal y onda, sin simular observación |
| P1 | `board-short.svg` (Tablas) | Shortboard | Outline shortboard distinguible |
| P1 | `board-mid.svg` (Tablas) | Midlength 6–8 ft | Outline midlength con punta y cola proporcionales |
| P1 | `board-long.svg` (Tablas) | Longboard | Outline longboard claramente largo |
| P1 | `board-soft.svg` (Tablas) | Softtop / principiantes | Outline tabla soft con canto ancho |
| P1 | `calendar.svg` (Acciones) | Calendario, mejor semana | Cuadrícula de calendario |
| P1 | `download.svg` (Acciones) | Exportar Field Notes JSONL | Archivo con flecha de salida |

## 5. Cómo se verá en la web

- **Vista de pronóstico:** prioridad visual a oleaje, período, viento y decisión; 1 icono por categoría, no una sucesión de pictogramas pequeños.
- **FARO VIBE:** los tags (*Glassy*, *Picadas*, *Suavecitas*, *Líneas limpias*, *Potentes*, *Mixed Bag*, *Ventoso*) deben sentirse como una **misma familia**, con personalidad y coherencia en tamaños y gramática visual. No reemplazar palabras por dibujos ambiguos.
- **Coastal Lens / brújula:** símbolos marinos sobrios, pero los ángulos y agujas proceden de datos. Mantener distinción entre las direcciones **DESDE** y de desplazamiento.
- **Spot DNA:** identificar perfil local, bancos y exposiciones sin dar certeza falsa sobre batimetría que no se haya medido.
- **Cámaras y Field Notes:** distinguir "ver cámara" de "grabar vídeo propio", y paredes observadas de campanas. No sugerir que FARO ya graba transmisiones ajenas.
- **Seguridad:** peligro, advertencia, alerta oficial o estado no verificado deben tener gramática propia e inequívoca.
- **FARO Match:** siluetas diferenciables de tipos de tabla. El dibujo debe funcionar a tamaños muy pequeños en móvil.

## 6. Entrega para desarrollo

1. Compartir un primer **set P0** con una hoja de presentación que muestre la familia a 16, 20 y 24 px tanto en dark como light.
2. Exportar **un SVG independiente por identificador**, exactamente `assets/icons/{id}.svg`, optimizado sin fuentes embebidas ni scripts. El `viewBox` debe ser `0 0 24 24` salvo casos especiales explícitos de marca.
3. Mantener tus archivos originales editables en Figma, Illustrator u otra herramienta, para iterar sin depender de SVGs ya exportados.
4. Se valida conjunto, peso de trazo, accesibilidad y legibilidad en 375 y 1366 px. **No se publica automáticamente un dibujo sin revisión.**
5. Al aprobar cada SVG, desarrollo cambia su entrada del [manifiesto](../assets/faro-icon-manifest.json) de `design_pending` a `ready` y verifica que el archivo exista. FARO lo utiliza en Zeeland y Chile; mientras tanto se muestra el texto sin un emoji temporal.

## 7. Checklist de aceptación

- El icono se entiende en cinco segundos, con y sin texto.
- No se confunde viento con swell; agua con aire; oleaje con surfabilidad; precaución con score bajo.
- Funciona en 16 px sin depender de detalles microscópicos.
- No incorpora sombras, gradientes, caras ni estética de stickers.
- Contrasta adecuadamente en temas claro y oscuro.
- No se usa el mismo dibujo para acciones o peligros distintos.
- La familia es coherente visualmente al colocar varios iconos juntos, especialmente en el widget.

## 8. Investigación de diseño

[Nielsen Norman Group, Icon Usability](https://www.nngroup.com/articles/icon-usability/) recomienda **iconos con etiquetas visibles** por la ambigüedad de muchos símbolos. [Visual Hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) enfatiza jerarquía por escala, contraste y agrupación; [Cards](https://www.nngroup.com/articles/cards-component/) advierte que demasiadas tarjetas para información homogénea empeoran el escaneo. Por eso FARO mantendrá texto y decidirá dónde cada icono aporta significado, en lugar de llenar cada superficie de gráficos.

---

**Fuente técnica única:** [assets/faro-icon-manifest.json](../assets/faro-icon-manifest.json), con los mismos 68 IDs de este documento. Para cambios en el alcance, actualizar ambos antes de dibujar o entregar.

## Coastal Lens 2026-10-28 · New high-priority vector handoff
The original 68-icon manifest remains unchanged. These are **variants of existing iconography or new large-format components**, not 68 additional files.

1. **Mini corner-direction HUD face**: very restrained north reference and subtle 1-ring compass, suitable for a 140–174 CSS px translucent panel, light/dark. No solid, opaque background in the asset itself.
2. **Two directional arrow masters**: swell slightly stronger and wind slightly lighter, geometric stroke rather than PPT-style block triangles; separate editable SVGs with centred rotation anchors and `currentColor`.
3. **Five semantic states**: favourable, mixed, low-energy, unfavourable and unknown. Deliver **shape/weight differences** as well as colour tokens, so a surfer can read them in greyscale; do not bake a static red/green meaning into compass art.
4. **Wave-height gauge accent**: single clean oceanographic instrument motif for a numerical *offshore model height* scale, not an illustration of the local breaker. It must work for 0 to 2m+ (display clamps; numeric height does not).
5. **Spot pin / local reference**: thin, unobtrusive selected/nearby variants; must not obscure the coastline at zoom 15 or 16.

Use the integration contract in [FARO HUD + wave gauge](FARO_HUD_SIGNALS_AND_WAVE_GAUGE_2026_10_28.md). The real model supplies bearing, heights, periods, speed and gusts at runtime. **No SVG should contain a hard-coded beach bearing, power rating or simulated ray trace.**

## Coastal Atlas refresh · 28 October 2026 (prioritised handoff)
This update clarifies the assets needed for the redesigned **beach-first Regional View** and the **lightweight Beach Focus HUD**. Do not replace or renumber the canonical 68-icon manifest.

| Priority | Asset | Design brief | Implementation target |
|---|---|---|---|
| P0 | `regional-spot-pin` | 24–32px-height editorial pill with active/nearby and dark/light states; typographic, not cartoon | `.faro-map-pin` |
| P0 | `regional-swell-fit-stroke` | 8–10px **solid** microstroke for guide alignment, usable in greyscale | `.faro-region-fit-tick.is-swell` |
| P0 | `regional-wind-fit-stroke` | Matching **interrupted/dashed** microstroke, same shared palette, never a floating arrow | `.faro-region-fit-tick.is-wind` |
| P0 | `hud-swell-direction` | Delicate current/energy-path arrow made of continuous flow lines, with a clear rotation centre; 24px | `.faro-hud-arrow[data-kind=swell]` |
| P0 | `hud-wind-direction` | Related thinner arrow with wind-tail linework, not a chevron or clip-art arrow; 24px | `.faro-hud-arrow[data-kind=wind]` |
| P0 | `hud-compass-north` | A minimal north reference that stays distinct from two dynamic model bearings, suitable in ~150px HUD | `.faro-hud-heading` |
| P1 | `model-sample-marker` | Quiet monochrome lettering for **M** (marine) and **A** (atmosphere), source icon not a surf-status icon | `.faro-model-sample` |
| P1 | `regional-legend-system` | Small within/near/outside guide symbols; words remain alongside colour, no arbitrary surf score | `.faro-lens-footer-legend` |
| P1 | `wave-height-gauge-accent` | Subtle vector accent for actual offshore model height gauge, not a breaking-wave diagram | `.faro-wave-gauge` |

**Unified visual rules:** 1.5–1.8 px round strokes at 24px, coastal evergreen/seafoam/slate and restrained sand tones, no electric blue or bright yellow distinguishing wind from swell. Colour indicates **alignment/energy status**; stroke style indicates **kind of signal**. The light/dark palettes should be optically balanced, but exported vector icons should use `currentColor`, not fixed status colours.

**No arrow rays from offshore model cells to a beach:** a single directional observation does not provide bathymetric refraction. In regional mode the four beaches are places to choose; model samples are optional, small and neutral. In local mode the directional model reading lives in a **translucent corner HUD**, away from the geographic reference pin. Dynamic bearings, wave strength and wind intensity must come from code.

Source specification and accessible behaviour: [Coastal Atlas UX audit](FARO_COASTAL_ATLAS_UX_VISUAL_AUDIT_2026_10_28.md).
