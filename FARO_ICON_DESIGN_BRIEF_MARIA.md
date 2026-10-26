# FARO · Sistema de iconografía para María
**Brief de diseño / implementación · 26 octubre 2026**

## Dirección creativa
FARO se siente **surfista, costero, editorial y contemporáneo**, no una app meteorológica genérica ni una colección de stickers. La marca combina titulares con personalidad y datos científicos ordenados: los iconos sirven para **identificar variables y acciones**, nunca para sustituir cifras ni etiquetas. Mantener el mismo sistema visual en **Zeeland, Chile, web móvil, PC y widget Scriptable**.

**No usar:** emojis, trazos dibujados al azar por el desarrollador, surfistas cartoon, pictogramas llenos de detalles, brillos 3D, degradados arbitrarios, dibujar viento y swell con el mismo símbolo, representar un banco exacto sin batimetría verificada.

## Especificaciones de entrega
- **Familia base:** grid 24 × 24 px, viewBox `0 0 24 24`, stroke **1,75 px** (ajustar ópticamente solo cuando necesario), extremos y uniones redondeados. Icono monocolor limpio, no relleno por defecto; `currentColor` lo define FARO.
- **Prueba de legibilidad:** 16, 20, 24 y 32 px; el icono debe seguir siendo reconocible a **16 px**. Exportar cada uno en SVG optimizado, un archivo por ID. Si un símbolo necesita variante sólida por aviso severo, indicar `-solid` y entregar ambas.
- **Posicionamiento y color:** no codificar colores fijos dentro del SVG. El sistema aplica azul océano para swell, ámbar para viento; verde/amarillo/rojo para scores/alertas SOLO si el estado lo exige. Tema claro y oscuro usan los mismos SVGs.
- **Entregables:** `assets/icons/<id>.svg`; fuente editable original de Figma/Illustrator en el proyecto de María; componentes **Outline**. Mantener nombres exactos. No subir archivos de fuentes tipográficas.
- **Accesibilidad:** las etiquetas de texto siguen visibles; icono decorativo `aria-hidden`. Si se emplea solo un icono en un botón, asignar un nombre accesible, foco y área táctil de al menos 40–44 px.
- **Identidad:** `faro-logo.svg` y el símbolo O de FARO son activos de marca distintos: NO redibujar el logo en este paquete ni sustituirlo por un emoji.

## Trabajo priorizado (68 iconos)
**P0 = primera entrega para quitar emojis y publicar el lenguaje visual. P1 = segunda entrega para profundizar datos, observaciones y equipos.**

| ID exacto / nombre de archivo | Prio. | Familia | ¿Dónde aparece? | ¿Qué debe comunicar? |
|---|---|---|---|---|
| `wave-height.svg` | P0 | Oleaje | Resumen diario, sesión, tarjetas, widget | Altura total prevista del oleaje; cresta con 2 líneas de mar, no un emoji |
| `swell-direction.svg` | P0 | Oleaje | Coastal Lens, brújula, detalle | Procedencia del swell; línea ondulada con vector FROM, reutilizable rotando |
| `swell-period.svg` | P0 | Oleaje | Resumen diario, detalle horario | Segundos entre crestas; dos crestas sucesivas y marca de intervalo |
| `swell-energy.svg` | P1 | Oleaje | Detalles técnicos, Spot DNA | Comparación de potencia proxy sin parecer altura de rompiente |
| `secondary-swell.svg` | P1 | Oleaje | Swell Compass, datos espectrales | Segundo tren de swell; dos ondas con trama secundaria |
| `wave-set.svg` | P1 | Oleaje | FARO READ, observaciones | Grupo de olas de una serie, no frecuencia continua |
| `breaking-wave.svg` | P0 | Oleaje | Observación de cámara, Spot DNA | Fase de rompiente, borde de espuma, sin afirmar surfabilidad |
| `clean-lines.svg` | P0 | FARO VIBE | Tag de calidad percibida | Pared de ola larga y abierta, limpio ≠ ausencia de riesgo |
| `small-swell.svg` | P0 | FARO VIBE | Tag de swell chico | Onda corta de baja amplitud sin connotación de peligro |
| `mushy.svg` | P1 | FARO VIBE | Tag suave / baja potencia | Cresta blanda, volumen redondeado, sin forma de cartoon |
| `choppy.svg` | P0 | FARO VIBE | Tag de picadas | Líneas cortas quebradas por viento; distinto de marejada peligrosa |
| `glassy.svg` | P0 | FARO VIBE | Tag de superficie lisa | Una cresta suave con reflejo discreto |
| `punchy.svg` | P1 | FARO VIBE | Tag de swell potente | Cresta marcada con pared más vertical, no rayos ni explosiones |
| `mixed-bag.svg` | P1 | FARO VIBE | Tag de señales mixtas | Dos ondas de carácter opuesto; no bolsa literal |
| `windy.svg` | P1 | FARO VIBE | Tag ventoso | Tres estelas de viento sobre superficie |
| `closeout.svg` | P1 | Observación real | Registro de campanas | Frente de espuma que cierra al mismo tiempo; no usar sin observación |
| `rideable-wall.svg` | P1 | Observación real | Marcado manual de pared | Pared abierta y línea de recorrido, sin surfista identifiable |
| `wind-speed.svg` | P0 | Atmósfera | Resumen, before you go, slots | Velocidad media 10 m; 3 líneas de flujo abstractas |
| `wind-direction.svg` | P0 | Atmósfera | Brújula, Coastal Lens | Vector naranja viento DESDE, independiente de swell |
| `wind-gust.svg` | P1 | Atmósfera | Rachas, riesgos | Flujo con pequeña acentuación, no tornado |
| `offshore-wind.svg` | P1 | Atmósfera | Spot DNA, orientación | Dirección mar afuera con costa; solo si exposición está sustentada |
| `onshore-wind.svg` | P1 | Atmósfera | Spot DNA, orientación | Dirección tierra adentro; solo si exposición está sustentada |
| `cross-shore-wind.svg` | P1 | Atmósfera | Spot DNA, orientación | Dirección lateral respecto a costa; distinguir viento cruzado |
| `rain.svg` | P0 | Meteorología | Pronóstico y warnings | Gotas bajo nube esquemática, una forma de familia |
| `fog.svg` | P1 | Meteorología | FARO READ, visibilidad | Estratos horizontales que ocultan costa, sin emoji nube |
| `cloud.svg` | P1 | Meteorología | Forecast del día | Nube monoline simple, sin cara |
| `thunderstorm.svg` | P0 | Seguridad | Alertas de tormenta | Nube con evento eléctrico y alto contraste |
| `sun.svg` | P0 | Luz y UV | Tema, UV, luz solar | Disco sobrio y rayos cortos |
| `moon.svg` | P0 | Luz y UV | Tema oscuro, noche | Luna creciente monoline geométrica |
| `sunrise.svg` | P1 | Luz y UV | Amanecer | Sol emergiendo sobre horizonte |
| `sunset.svg` | P1 | Luz y UV | Atardecer | Sol descendiendo sobre horizonte |
| `daylight.svg` | P1 | Luz y UV | Ventana navegable | Disco con segmento temporal útil |
| `uv-index.svg` | P0 | Luz y UV | UV elevado / extremo | Disco y aro de radiación; intensidad la comunica el color del badge |
| `air-temperature.svg` | P0 | Temperaturas | Before you go | Termómetro con marca de aire |
| `water-temperature.svg` | P0 | Temperaturas | Before you go | Termómetro con onda de agua distintiva |
| `sea-current.svg` | P1 | Seguridad | Datos costeros y avisos | Vector de corriente de agua; distinguir del swell |
| `rip-current.svg` | P1 | Seguridad | Advertencias verificadas | Canal de retorno entre olas; solo evidencia fiable |
| `marine-alert.svg` | P0 | Seguridad | Marejadas y alerta oficial | Escudo/triángulo marino distinto de riesgo modelado |
| `weather-caution.svg` | P0 | Seguridad | Precaución por modelo | Triángulo alerta sencillo para precaución |
| `weather-danger.svg` | P0 | Seguridad | Riesgo severo | Triángulo alerta sólido de alta prioridad |
| `unknown-data.svg` | P0 | Datos | Sin pronóstico / sin confirmar | Círculo abierto con interrogación simple |
| `tide.svg` | P1 | Mareas | Tide / Spot DNA | Nivel de agua sobre marcas de referencia, no confundir con energía |
| `map.svg` | P0 | Navegación | Mapa de spots | Costa geográfica abstracta, no emoji mapa plegado |
| `location-pin.svg` | P0 | Navegación | Selector de spot | Pin con centro neutro legible a 16 px |
| `compass.svg` | P0 | Navegación | Coastal Lens, Swell Compass | Aguja direccional, no duplicar brújula de datos dinámica |
| `spot-dna.svg` | P0 | Navegación | Ficha específica playa | Capas de costa y arena: no ADN biológico literal |
| `sandbank.svg` | P1 | Spot DNA | Banco / fondo arenoso | Contorno de curva de nivel bajo ola, sin afirmar banco exacto |
| `river-mouth.svg` | P1 | Spot DNA | La Boca y dinámica río-mar | Río que desemboca en costa; icono informativo |
| `camera.svg` | P0 | Observación | Ver webcam | Cámara frontal minimal de lente |
| `video-play.svg` | P1 | Observación | Reproductor video local | Triángulo playback dentro de marco |
| `field-notes.svg` | P0 | Observación | FARO Lab, notas | Cuaderno sencillo con marcas, no lápiz de texto |
| `wave-count.svg` | P1 | Observación | Olas por 10 minutos | Crestas repetidas con conteo |
| `prediction-history.svg` | P1 | Datos | Archivo de pronóstico | Reloj temporal y onda, sin simular observación |
| `faro-read.svg` | P0 | FARO | Explicación del porqué | Documento/onda con líneas interpretativas |
| `faro-match.svg` | P0 | FARO | Recomendación tabla/persona | Tabla que coincide con onda, no surfista de emoji |
| `board-short.svg` | P1 | Tablas | Shortboard | Outline shortboard distinguible |
| `board-mid.svg` | P1 | Tablas | Midlength 6–8 ft | Outline midlength con punta y cola proporcionales |
| `board-long.svg` | P1 | Tablas | Longboard | Outline longboard claramente largo |
| `board-soft.svg` | P1 | Tablas | Softtop / principiantes | Outline tabla soft con canto ancho |
| `wetsuit.svg` | P0 | Equipo | Qué usar, before you go | Silueta de traje de neopreno sin detalles de persona |
| `water-safety.svg` | P0 | Seguridad | Safety guide / instrucciones | Salvavidas circular monoline |
| `calendar.svg` | P1 | Acciones | Calendario, mejor semana | Cuadrícula de calendario |
| `refresh.svg` | P0 | Acciones | Actualizar forecast | Flecha circular única, sin flechas doble decorativas |
| `chevron.svg` | P0 | Acciones | Desplegables, select | Ángulo 90 grados neutral |
| `external-link.svg` | P0 | Acciones | Cámaras y fuentes | Flecha de enlace externo legible |
| `download.svg` | P1 | Acciones | Exportar Field Notes JSONL | Archivo con flecha de salida |
| `check.svg` | P0 | Estados | Confirmación y observación | Marca de verificación limpia |
| `info.svg` | P0 | Estados | Detalles del modelo / ayuda | Letra i en círculo con buen contraste |

## Notas científicas y de UX especialmente importantes
1. **`wave-height` ≠ `breaking-wave`:** altura del pronóstico en celda oceánica no es altura que mide el surfista. Nunca dibujar 1,4 m como pared surfista medida.
2. **`swell-direction` ≠ `wind-direction`:** componentes con metáforas visuales y colores distinguibles; las agujas de la brújula son **visualización de datos rotatoria**, no iconos estáticos exportados.
3. **`weather-danger` y `marine-alert`:** alta prioridad, siempre con etiqueta legible y contraste; una alerta oficial no puede confundirse con cautela de modelo.
4. **`closeout`** («campana») solo acompaña una clasificación observada o calibrada, nunca inferida de dirección offshore sin evidencia.
5. **`glassy`**, `clean-lines` y `small-swell` no son equivalentes; las siluetas deben ser distintas sin texto explicativo.
6. Las tarjetas y el score de Zeeland son el patrón visual. **Chile hereda** escala, tamaños, pesos y espaciados; no crear dos sets nacionales.
7. **`compass`** es un pictograma para encabezados; el **Coastal Lens** utiliza SVG dinámico y escala angular calculada, que María puede ayudar a pulir con un diseño de aro estático más adelante.

## Integración (para developer)
Un componente declarativo `data-faro-icon="wave-height"` sirve de ancla. FARO solo muestra el SVG cuando la entrada del manifiesto cambie a `ready` y el archivo exista en `assets/icons/`. Mientras esté pendiente, la etiqueta descriptiva **permanece sin emoji ni icono provisional**. El sistema de iconos nuevo no debe inventar ilustraciones.
Referencias de diseño: [Apple HIG Icons](https://developer.apple.com/design/human-interface-guidelines/icons), [IBM iconography](https://www.ibm.com/design/language/iconography/ui-icons/usage/), [Primer Octicons](https://primer.github.io/design/foundations/icons/design-guidelines/).
