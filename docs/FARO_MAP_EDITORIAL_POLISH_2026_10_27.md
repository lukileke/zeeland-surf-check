# FARO · Coastal Lens refinamiento editorial (27/10/2026)

## Versión reversible
- **Estado anterior intacto:** `backup/faro-before-map-polish-2026-10-27`
- **Desarrollo:** `feature/faro-map-polish-maria-brief-2026-10-27`
- Procedimiento seguro de retorno: revertir el merge/PR; no hacer force-push ni reset de main.

## Correcciones implementadas
1. La brújula fijada a viewport conserva zoom y ahora enseña **una sola aguja** por modo (swell en Combinado/Swell, viento en Viento); viento se lee en una segunda línea, sin dos flechas que se cruzan.
2. Marcador marino en el mapa representa solo el vector de swell primario. Secundario y terciario siguen disponibles en los detalles y popup de la celda auténtica, pero **no dibujan trayectorias entrecruzadas** que podrían interpretarse como refracción calculada.
3. Mapa base más desaturado, elegido por jerarquía/legibilidad; marcado del spot activo, el resto atenuado; fuente independiente de datos marinos/atmosféricos.
4. Una tarjeta **Ocean Read** solo con swell principal y viento. Comparación de playas **colapsada por defecto**, con cuatro interpretaciones angulares experimentales. Modelo, distancias, fuentes, limitaciones, cámaras externas y observaciones quedan en otro disclosure compacto.
5. Se elimina la duplicación de **Model Point Readout** que repetía las cifras dentro y debajo del mapa.
6. Final de página: **Explore the coast / Know the break** como grid de seis tarjetas informativas, cabecera editorial y pie de página agrupado en Exploración + Ciencia y datos.
7. Nuevos estilos consolidados *dentro del archivo CSS existente* `assets/faro-coastal-lens-v4.css` en vez de seguir añadiendo hojas de overrides. Zeeland conserva la identidad previa.

## María · arte nuevo
Brief PDF de siete páginas entregado en la conversación (no almacenado automáticamente en el repositorio): `FARO_Brief_Iconografia_y_Coastal_Lens_para_Maria.pdf`.
- 68 iconos canónicos, exactamente conforme `assets/faro-icon-manifest.json`: 36 P0 + 32 P1.
- 12 componentes especiales A01-A12; entre ellos face de brújula, agujas swell/viento, pins de spot/celdas, leyenda y sector de guía.
- Íconos `assets/icons/{id}.svg` en grilla 24 px, trazo 1,75 px, currentColor, claro/oscuro.
- El diseño de dirección en formato SVG no debe codificar azimut estático; el software rota basado en el modelo. No copiar assets de Surfline.

## No está implementado
- Resolver físico de batimetría, refracción, altura rompiente o sombra costera: faltan geometría, sondajes de alta resolución y validación local; no etiquetar los rangos de guía como tal.
- Descarga/captura/entrenamiento de vídeo de terceros sin licencia.
- Iconos/ilustraciones finales de María: el PDF es un brief, no los entregables SVG.

## QA de publicación
- Pruebas de regresión de código y matemáticas: **17** aprobadas.
- Mock-DOM montado: 1 brújula, 2 mediciones rápidas y 4 tarjetas de playa; estado de expansiones preservado.
- Sintaxis JS/CSS revisada, archivos cacheados con query distinta.
- **Pendiente**: captura visual real iPhone 375/390/430 px y desktop 1120/1440 px; ambos temas y lenguajes; confirmación visual de GitHub Pages.

## Referencias utilizadas para jerarquía y densidad
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/maps
- Mapbox Guide to Map Design: https://www.mapbox.com/insights/map-design-process
- Surfline Charts help: https://support.surfline.com/hc/en-us/articles/16345467668763-Surfline-Charts-map-of-wave-height-period-wind-and-swell-components
