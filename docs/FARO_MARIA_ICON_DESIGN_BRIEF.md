# FARO | Sistema de iconografía y brief de diseño para María

**Fecha:** 26 octubre 2026 · **Versión:** 1.0 · **Proyecto:** FARO Zeeland + FARO Chile

## Encargo

Crear una familia de iconos **propia, consistente, surfista, editorial y contemporánea**, que reemplace TODOS los emojis y los símbolos dibujados improvisadamente en FARO. Los iconos acompañan texto y datos; nunca son el único medio de comunicación. FARO es un servicio de decisión sobre surf, no una app infantil ni un tablero meteorológico corporativo.

### Dirección de arte
- Identidad: navegación costera, líneas de ola, brújula, cultura surf, aire editorial, precisión y calma; cierta personalidad retro-surf, pero ejecución nítida y moderna.
- Inspiración: cartografía marina simplificada, señalética atlántica/pacífica, libros de surf y numeración náutica. No copiar símbolos o identidades de Surfline ni de otras marcas.
- Estilo: **vectorial**, pocos trazos, esquinas suavemente redondeadas, sin contornos negros exagerados, sin brillos, sombras, caricaturas, gradientes ni emojis.
- El logo FARO (incluida su O) se entrega como recurso de identidad separado de la familia de iconos operativos. En la web actual se mantiene el logo provisional hasta recibir el nuevo aprobado.
- Relación con la tipografía: **Archivo Black** para titulares, **Manrope** para datos e interfaz. Los iconos deben tener peso visual compatible con Manrope semibold; para el logo, una presencia proporcional a Archivo.
- Colores: monocromático por defecto, compatible con **light/dark**. El software usa colores de contexto para score/alertas. Los iconos no codifican por sí solos seguridad ni calidad.
- Exportar SVG optimizados con `viewBox="0 0 24 24"` cuando proceda, trazo aproximado 1,8–2 px a 24 px, extremos redondos, sin texto trazado ni fuentes embebidas. El favicon y el isotipo usan exportaciones propias de 16, 32 y 64 px.
- Probar legibilidad a **16, 20, 24 y 32 px**, pantallas 375 px y escritorio 1366–1600 px. Evitar detalles diminutos.
- Formatos entregables: `assets/icons/{id}.svg` por pieza, versión editable original para María (Figma/Illustrator/etc.), y una hoja comparativa light/dark; no publicar archivos fuente de tipografías.
- Accesibilidad: texto visible junto a cada icono; contraste suficiente; estados peligrosos combinan icono + texto + color. La información oceanográfica no se puede reemplazar por un dibujo impreciso.

## Prioridades

**P0 — imprescindible (diseñar primero):** identidad, altura, swell, viento, período, brújula, ubicación, mapa, calidad, VIBE, cámara, notas, alertas y actualizar. No empezar por una colección de 50 dibujos decorativos.

**P1 — segundo paquete:** estados del mar, seguridad complementaria, clima, neopreno, paneles, enlaces, navegación y tema.

**P2 — tercer paquete:** equipo, componentes y categorías científicas de rompiente, siempre conservando precisión semántica. **P3** solo cuando los datos opcionales existan.

## Inventario de 59 iconos — nombre de archivo y objetivo

| Prioridad | Archivo SVG | Nombre | Objetivo y ubicación | Nota visual |
|---|---|---|---|---|
| P0 | `brand-mark.svg` | O de FARO | Isotipo principal, favicon, app, widget y mini marca | Marca, no emoji |
| P0 | `wave-height.svg` | Altura de ola | Distinguir altura oceánica modelada de altura rompiente | No dibujar ola cerrando |
| P0 | `swell-primary.svg` | Swell principal | Identificar oleaje de fondo dominante y su procedencia | Línea de onda amplia |
| P0 | `wave-period.svg` | Período | Separación temporal entre olas, segundos | Reloj de ondas |
| P0 | `wave-direction.svg` | Dirección del swell | Distinguir dirección de donde viene swell de propagación | Aguja brújula, compatible con rosa técnica |
| P0 | `wind.svg` | Viento | Velocidad y dirección meteorológica | Ráfagas lineales sin glifos emoji |
| P0 | `compass.svg` | Brújula | Abrir Coastal Lens y orientar mar y viento | La rosa SVG de datos sigue siendo funcional |
| P0 | `spot-pin.svg` | Spot | Identificar playa o referencia del mapa | No implicar pico exacto |
| P0 | `coast-map.svg` | Mapa | Acceso a mapa de condiciones y spots | Más surf, menos cartografía corporativa |
| P0 | `surf-quality.svg` | Calidad del surf | Asociar score del modelo con calidad estimada | Neutral, sin medalla triunfal |
| P0 | `faro-vibe.svg` | FARO VIBE | Identificador de lectura cualitativa, distintivo propio | NO wizard hat improvisado; diseñar una marca elegante |
| P0 | `camera.svg` | Cámara | Abrir fuente externa de imágenes | No prometer cámaras FARO propias |
| P0 | `field-notes.svg` | Field Notes | Acceso al registro de observaciones humanas | Cuaderno surf, no icono genérico lápiz |
| P0 | `alert-warning.svg` | Precaución | Advertencia no crítica | Nunca solo color |
| P0 | `alert-danger.svg` | Peligro | Riesgo importante y fuente | Distinto a calidad pobre |
| P0 | `refresh.svg` | Actualizar | Volver a consultar modelo | Se conserva verbo visible |
| P1 | `wind-gust.svg` | Racha | Resaltar rachas frente a viento medio | Variación viento, no tormenta |
| P1 | `spot-dna.svg` | Spot DNA | Acceso al perfil local de exposición y carácter | Metáfora identidad/huella costera |
| P1 | `tide.svg` | Marea | Nivel del mar y estado de marea cuando existe | Nunca igualar con banco exacto |
| P1 | `current.svg` | Corriente | Avisar corrientes cuando fuentes confiables las detecten | Precaución, no genérico |
| P1 | `glassy.svg` | Glassy | Tag de superficie limpia, bajo viento | Suavidad, reflejo sin brillo emoji |
| P1 | `clean-lines.svg` | Líneas limpias | Tag de potencial orden de líneas | Dos líneas continuas paralelas |
| P1 | `mushy.svg` | Suavecitas | Tag de swell suave o poca energía | Curva blanda |
| P1 | `choppy.svg` | Picadas | Tag de mar desordenado | Pequeños cortes irregulares |
| P1 | `punchy.svg` | Potentes | Tag de mayor energía | No representar rompiente real |
| P1 | `mixed-bag.svg` | Mixed Bag | Tag de señales mixtas | Contraste orden/desorden |
| P1 | `windy-vibe.svg` | Ventoso | Tag de viento que condiciona surf | Derivar de wind |
| P1 | `video.svg` | Vídeo local | Cargar clip autorizado únicamente en dispositivo | No implica grabar stream |
| P1 | `wave-wall.svg` | Pared surfeable | Botón de anotación: pared observada | Distinto de spilling |
| P1 | `wave-closeout.svg` | Campana | Botón de anotación de ola que cierra | Basado en observación, no prediction |
| P1 | `sun.svg` | Sol | UV, luz del día y pronóstico solar | No mezclar con calor |
| P1 | `sunrise.svg` | Amanecer | Inicio de luz surfable | Curva de horizonte |
| P1 | `sunset.svg` | Atardecer | Fin de ventana segura de luz | Par con amanecer |
| P1 | `uv.svg` | Índice UV | Exposición UV modelada | Solo si el dato existe |
| P1 | `rain.svg` | Lluvia | Precipitación | Sobria, sin carita |
| P1 | `storm.svg` | Tormenta | Riesgo meteorológico o aviso | No usar sin evidencia |
| P1 | `temperature-water.svg` | Temperatura agua | Planificación de neopreno | Termómetro con agua |
| P1 | `temperature-air.svg` | Temperatura aire | Confort de sesión | Separar agua y aire |
| P1 | `wetsuit.svg` | Neopreno | Recomendación de traje | Silueta propia minimalista |
| P1 | `calendar.svg` | Día/semana | Pronóstico próximos días | Pequeño, legible |
| P1 | `clock.svg` | Hora | Sesiones de dos horas | Lectura horaria |
| P1 | `arrow-external.svg` | Ir a fuente | Señalar salida a web externa | Link texto accesible |
| P1 | `chevron.svg` | Expandir | Abrir disclosures sin desorden | Cambia orientación, no emoji |
| P1 | `light-mode.svg` | Tema claro | Elegir tema visual | Pareja tema oscuro |
| P1 | `dark-mode.svg` | Tema oscuro | Elegir tema visual | Pareja tema claro |
| P1 | `info.svg` | Información | Datos/modelos/supuestos accesibles | No alert |
| P1 | `match.svg` | FARO Match | Identificar ajuste personal y board wizard | Compatible con iconografía VIBE |
| P2 | `swell-secondary.svg` | Swell secundario | Mostrar segunda partición sin confundir con viento | Doble línea secundaria |
| P2 | `wind-cross.svg` | Viento cruzado | Comunicar lectura de dirección transversal cuando haya datos fiables | Flecha cruzada |
| P2 | `wind-offshore.svg` | Offshore | Comunicar viento que sale de la costa solo con orientación verificada | Separar onshore |
| P2 | `wind-onshore.svg` | Onshore | Comunicar viento que entra a costa solo con orientación verificada | Separar offshore |
| P2 | `spilling.svg` | Spilling break | Forma de rompiente derramante en dataset externo | No equivale a olas fáciles |
| P2 | `plunging.svg` | Plunging break | Forma de rompiente tubular en dataset externo | No equivale a ola surfeable |
| P2 | `surging.svg` | Surging break | Rompiente de avance/surge | Mantener categoría científica |
| P2 | `board-short.svg` | Shortboard | Recomendación y selector de tabla corta | Silueta escalada |
| P2 | `board-mid.svg` | Mid-length | Selector de tabla tipo mid | Diferenciar short/long |
| P2 | `board-long.svg` | Longboard | Selector de tabla larga | Silueta escalada |
| P2 | `surf-person.svg` | Surfista | FARO Match / estilo de surf | Figura técnica, no muñeco |
| P3 | `swell-tertiary.svg` | Swell terciario | Mostrar tercera partición cuando exista | Variación familia swell |

## Comportamiento del sistema

1. El código usa `data-faro-icon="{id}"` o un selector registrado para identificar los elementos, no emojis hardcodeados ni SVG dibujados por el programador.
2. **Mientras no hay SVG aprobado**, FARO muestra el texto y los datos sin icono. No insertaremos símbolos falsos ni imágenes provisionales que María tenga que deshacer.
3. María exporta `{id}.svg`, lo entrega, validamos visualmente y registramos la ruta en `assets/icons/approved.json`. Solo entonces se activa en Zeeland y Chile, utilizando una CSS mask monocroma para heredar el color apropiado.
4. Iconos de **gráficas y datos** (flechas con grados, rosa real del swell, barras de tamaño) son visualizaciones calculadas y siguen funcionando. María puede rediseñar su lenguaje visual, pero no sustituirlos por dibujos que alteren el significado físico.
5. Las alertas oficiales conservan texto, fuente y prioridad sin depender de un icono.
6. Los textos en inglés y español permanecen visibles y completos. No hacer icon-only navigation en móvil.

## Componentes concretos de FARO

**Pantalla Forecast:** fecha/semana, score, olas modeladas, swell/período, viento, FARO VIBE, lectura de horario, mapa costero, avisos oficiales y accesorios.

**Mapa y Coastal Lens:** brújula real de direcciones DESDE, punto costero, procedencia del viento y del swell, acceso a cámara y Field Notes. El ángulo de la rosa es una variable real, no una ilustración libre.

**FARO VIBE:** familia de siete tags consistentes; usar una estructura de base común con diferencias sutiles, NO siete emojis totalmente dispares.

**FARO MATCH:** iconos de tablas y perfil, sin sugerir condiciones verificadas cuando el cálculo es experimental.

**Safety:** peligro y precaución legibles en escala de grises; avisos nunca dependerán únicamente del color.

**Field Notes / AI Lab:** cámara, vídeo local, pared abierta, campana, anotaciones, calendario y reloj. El icono de cámara no implica que FARO tenga derecho a grabar servicios externos.

## Criterios de aceptación para María

- Una persona reconoce *wave height*, *wind*, *period* y *camera* en cinco segundos sin haber visto FARO.
- No se confunden swell con viento, temperatura del aire con agua, ni marea con corrientes.
- Dos iconos distintos no representan conceptos idénticos, salvo como variación deliberada de la misma familia.
- Los iconos no se ven infantilizados frente a Archivo Black/Manrope.
- Se verifican 16/20/24 px, ambas variantes de tema, y estados de peligro no basados solo en colores.
- Los SVG no incorporan rasterizados, sombras, trazas de tipografía ni scripts.
- Cada exportación coincide exactamente con `assets/icons/icon-manifest.json`, sin renombrar los IDs.
- El conjunto P0 se prueba primero en el pronóstico de Chile y la interfaz de Zeeland antes de continuar P1/P2.

## Base de investigación UX

[Nielsen Norman Group — Icon usability](https://www.nngroup.com/articles/icon-usability/) concluye que los iconos normalmente necesitan etiquetas visibles y deben ser reconocibles sin esfuerzo. [Visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) recomienda jerarquizar mediante tamaño, contraste y agrupación en lugar de multiplicar contenedores y colores. [Cards design](https://www.nngroup.com/articles/cards-component/) distingue tarjetas útiles de tarjetas que rompen la lectura comparativa. Esto se aplica a FARO reduciendo los bloques excesivos, diferenciando score, decisión y condición, y limitando iconos a aquellos que aportan orientación. 
