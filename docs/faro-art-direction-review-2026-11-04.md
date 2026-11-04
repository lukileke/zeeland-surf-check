# FARO Chile — revisión de dirección de arte, UI y deuda técnica
**4 noviembre 2026** · Alcance: web Chile en escritorio/iPhone, y widget Scriptable Zeeland.

## Tesis

FARO debe sentirse como una **lectura editorial del océano**, no como una colección
de paneles tecnológicos. La secuencia de información es:
**lugar → condición → ventana → evidencia → exploración → cierre**.
El hero representa la atmósfera; el cuerpo demuestra la información.

## Referencias investigadas (estética y presentación, no copiar funciones)

| Referencia | Forma de presentar el contenido | Aprendizaje aplicable a FARO | Evitar |
| --- | --- | --- | --- |
| [Oceanographic Magazine](https://oceanographicmagazine.com/) | Narrativa fotográfica, titulares con distintos pesos, módulos de contenido separados por contexto | Una primera escena oceánica, después datos claros; transiciones editoriales, no más tarjetas | Imitar el hero fotográfico cuando no hay fotos verificadas por playa |
| [Aesop](https://www.aesop.nl/) | Composición tipográfica sobria, aire intencional, una acción principal por bloque | Menos microtarjetas, dejar que las cifras principales respiren | Vacío sin propósito o mensajes promocionales redundantes |
| [OceanX](https://levinriegner.com/work/oceanx) | Imagen submarina, titulares limpios, contraste material | Dosificar la iluminación marina en el hero y reservar el resto para lectura | Repetir iluminación o logos grandes en cualquier tarjeta |
| [The Ocean Agency](https://www.awwwards.com/inspiration/the-ocean-agency-creative-agency-for-the-ocean-the-ocean-agency) | Tipografía contrastante, composiciones gráficas muy intencionadas | Pequeños acentos marinos y jerarquía editorial distinta entre capítulos | Decoración indiscriminada |
| [Surfline (solo organización)](https://support.surfline.com/hc/en-us/articles/13749782983579-Understanding-the-Spot-Forecast-Page-on-the-Surfline-Website) | Separación entre pronóstico, análisis, mapas y guía; detalles expandibles | Un nivel rápido y otro profundo; sin afirmar altura rompiente observada | Copiar identidad visual, ratings o el modelo |

No se incorporan imágenes ajenas ni elementos gráficos sujetos a licencia.

## Hallazgos en el repositorio (comprobables por código)

1. El documento `chile/index.html` carga **29 hojas CSS**. Hay al menos cinco
   capas históricas que intervienen sobre la misma cuadrícula diaria o footer.
   En las cinco hojas inspeccionadas aparecen 2.120 declaraciones
   `!important` en conjunto. Es una deuda crítica de mantenibilidad.
2. `:has(#forecastPage:not(.hide))` añade especificidad al footer. La regla
   de una columna a ≤1119 px usaba un selector de menor especificidad y podía
   ser vencida por la regla de dos columnas de escritorio aun dentro del media
   query. **Se corrigió igualando la especificidad en el breakpoint**.
3. Resumen diario: tres métricas estaban encerradas en tres tarjetas dentro
   de otra tarjeta. Incluso correctamente alineadas, la densidad visual
   perjudicaba identificar rápidamente oleaje, periodo y viento.
4. Lectura de franja: una tarjeta debajo de 8 horarios, seguida de otras tres
   microtarjetas con valores físicos. El detalle de evidencia no requería
   otros tres contenedores visuales.
5. Footer: el bloque puente promocional ya había sido eliminado, pero el
   manifiesto seguía teniendo tamaño y separación de otro hero. Además
   conservaba reglas antiguas para un puente que ya no existe.
6. Widget: v20 añadió un SVG transparente de la O original dentro del panel
   de oleaje, con un WebView extra, una caché adicional y una marca duplicada.
   El widget debe privilegiar lectura rápida y el único logotipo real.

## Cambios de este pase

- **Diario desktop:** las métricas pasan de tres minicards a un solo instrumento
  con separadores verticales. Olas / periodo / viento mantienen sus cifras y
  la explicación de altura oceánica sigue accesible.
- **Sesión elegida:** las tres magnitudes modeladas pasan a una banda de evidencia
  delimitada por una línea fina, no tres tarjetas dentro de una tarjeta.
  Las etiquetas suben de 8–9 a 10 px para mejorar la lectura.
- **Footer:** se compacta el título, la altura y el margen exterior.
  Se corrige el selector que impedía la columna única en tablet/iPhone;
  el footer conserva navegación y aviso científico.
- **Widget v21:** se retira la marca fantasma duplicada dentro del panel de
  oleaje. Se conserva un único logo FARO original en el encabezado,
  el degradado Scriptable nativo, las cinco tintas canónicas del score y
  el riesgo de viento especificado para las próximas 48 horas. Panel
  offshore más ligero, sin rasterizado secundario ni WebView decorativo.

## Pruebas

- **Estático:** CSS balanceado en llaves, última hoja
  `faro-score-colour-lock-v1.css`, controles de modelo sin modificación.
- **Automatizado en repositorio:** tests de widget, footer, layout y
  `tests/faro-responsive-browser.mjs`.
- Se añadió una aserción que comprueba el **número real de columnas CSS** del
  footer con Chrome y WebKit a distintas anchuras. No equivale a haber ejecutado
  el test sobre un iPhone físico.
- El sitio publicado no pudo inspeccionarse en una sesión de navegador visual
  durante esta revisión; no se declara aprobado el render real. Se mantienen
  como evidencia los screenshots compartidos por el usuario y el código.

## Siguientes pasos realistas

**P0:** ver capturas de desktop 1440 px e iPhone 390 px en dark/light,
incluyendo el final, y ajustar únicamente errores comprobados.

**P1:** consolidar las 29 hojas CSS por responsabilidad
(`tokens` / `layout` / `components` / `mobile`) en una rama con
capturas de regresión; quitar reglas de componentes inexistentes. No hacer
una migración React simultánea.

**P2:** calibrar la relación entre índice FARO y ola rompiente observada,
explicar incertidumbre y vincular alertas oficiales verificables cuando
estén disponibles. Esto importa más a largo plazo que nuevos efectos.

## Principios de calidad
- Un hero con personalidad; una sola jerarquía tipográfica y un único sistema
  cromático por el resto del sitio.
- El score no es seguridad ni altura de rompiente.
- Los peligros de 48 h, los máximos del día y los valores de franja deben
  etiquetar inequívocamente sus horizontes.
- Nada de «datos bonitos» que no ayuden a decidir si vale la pena mirar la playa.
