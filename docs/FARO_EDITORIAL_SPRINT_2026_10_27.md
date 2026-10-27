# FARO · Coastal Editorial Sprint · 27 October 2026

## Respaldo y recuperación
**Versión anterior intacta:** commit `38b0938f4625284a23f4661e723df68491978e07`.
- GitHub branch: [backup/faro-pre-editorial-2026-10-27](https://github.com/lukileke/zeeland-surf-check/tree/backup/faro-pre-editorial-2026-10-27)
- Rama de diseño: [feature/faro-coastal-editorial-sprint-2026-10-27](https://github.com/lukileke/zeeland-surf-check/tree/feature/faro-coastal-editorial-sprint-2026-10-27)

No se ha creado un Git tag: el backup branch preserva el mismo commit original, sin modificaciones. Para recuperar esta versión sin perder historial, abrir una PR desde el branch de respaldo hacia la rama de despliegue, o revertir el merge del sprint. **No usar `git reset --hard` ni `push --force` sobre main.**

## Cambios del sprint
1. **Instrumentos de oleaje**: bloque de altura encuadrado, escala explicita 0–2 m+ para 8 bins de 0,25 m, barras armonizadas, sin atribuir forma de rompiente al modelo oceánico. Altura en m permanece el dato principal.
2. **Semantic quality pills**: los vocablos Poor/Fair/Good/Excellent tienen tonalidad y fondo propios, con estados ausentes neutros. Las categorías verbales se definen a umbrales 3/5/7/8,5 y **no** se confunden con las cinco bandas cromáticas del número a 2/4/6/8.
3. **Selected window**: tarjeta principal con más contraste estructural, overline, instrumentación coherente en Zeeland y Chile. En Chile se aporta una interpretación compacta y cauta a partir del viento/período real del modelo (no cámara).
4. **Coastal Lens**: rosa vectorial colocada en la celda marina devuelta por el proveedor; primary swell sólido, secundarios/terciarios discontinuos cuando existen, cada uno en rumbo de propagación `(FROM+180) mod 360`. Viento en **su propia celda atmosférica**. No hay refracción inventada, ray-tracing de bancos, cam feed ni medición de altura rompiente.
5. **Microcopy**: "FARO PICK" / "YOUR WINDOW"; encabezado "COASTAL LENS"; mensajes sobre pulso, viento y prioridad de confirmar condiciones. Avisos oficiales y cautelas conservados.
6. **Un mismo sistema**: estilos compartidos dentro de `assets/faro-visual-system-v2.css`, sin generar iconos decorativos nuevos, sin emojis y sin modificar `surf-engine.js` ni `chile/faro-chile-live.js`.

## Condiciones de aceptación de ingeniería
- Source-only regression: `node --test tests/faro-visual-regression.test.cjs`; se actualizaron pruebas de cromatismo categórico, medidores con cero, datos oceánicos y grillas separadas.
- JS: sintaxis parseada en página de Zeeland, Chile y mapa. Geometría probada con puntos cardinales.
- Marcadores oceánicos y atmosféricos no deben presentarse como un pronóstico calibrado de la rompiente.
- Probar en navegador real: iPhone 375/390/430 px, 768/1024 px, desktop 1120/1440 px, claro/oscuro, EN/ES, con y sin valores de las particiones. Revisar desbordes horizontales, posición de marcadores, CTA, score pills y mapas desplazables.
- Comprobar el tiempo de carga y las condiciones de uso de OpenStreetMap antes de escalar el mapa.

## Límites del trabajo
Estos cambios de UI **no constituyen entrenamiento nuevo** ni mejora verificada de la precisión física. Aún no hemos comprobado capturas reales de Safari iOS o Chrome de escritorio ni observado la disponibilidad de despliegue de GitHub Pages. Los datos y derechos del dataset audiovisual siguen documentados por separado.
