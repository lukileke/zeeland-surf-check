# FARO · Surf Forecast and Chile Research Atlas

FARO helps decide **where and when to surf**, and what kind of session the model suggests. Forecasts are modelled estimates, not measured breaking-wave conditions or a safety clearance.

**Zeeland live forecast:** https://lukileke.github.io/zeeland-surf-check/  
**Chile Valparaíso model forecast (provisional fit):** https://lukileke.github.io/zeeland-surf-check/chile/  
**Chile national research atlas:** https://lukileke.github.io/zeeland-surf-check/chile/atlas.html  
**Chile test lab:** https://lukileke.github.io/zeeland-surf-check/chile/lab.html

## Two geographic modes · one FARO identity

The website presents **ZEELAND · LIVE / CHILE · MODELO**. Zeeland retains its established forecast, KNMI warning links, widget and scoring. Chile now uses the **same core CSS and component hierarchy** and has a **model-fed Valparaíso view** with four source-located pilot beaches (La Boca, Reñaca, Ritoque, Maitencillo): seven days, 2-hour daylight windows, offshore wave/swell/wind data, UV, model-derived FARO VIBE with expanded FARO READ, Spot DNA (previously Spot Insight), experimental Best of Week and FARO Match.

**Important:** Chile's weather/marine inputs are updated numerical model data, but spot-specific **/10 scores are guide-derived compatibility estimates capped at 7.9**, not calibrated breaking-wave quality, and do not certify safety. The current nearshore sampling locations are coastal references (not exact validated surf-bank coordinates). No Chilean official warning status is automatically checked; the small safety disclosure links the Armada, DMC and SENAPRED while independently screening modelled strong wind, rain and thunderstorms. Chile widgets remain deferred. The [regional research atlas](chile/atlas.html) continues to cover 16 regions and 73 candidate places without inventing forecast scores for unconfigured spots.

**Favicon:** both countries use the actual salvavidas/O shape extracted from the official FARO SVG, without a background plate.

## Key features

- Seven-day forecasts with two-hour windows and daylight checks
- Five numeric score-colour bands with **the same five numerical thresholds AND identical score pigment values in both themes**; FARO VIBE is the visible wave-character tag, and tapping it reveals FARO READ rather than duplicating the interpretation
- FARO Match for optional board/riding-style preferences
- Spot Insight: twelve named FARO sectors, local beach-guide evidence, conservative sector context, official/local source links
- Spot Fit: independently adjustable wind, wave-direction, tide-uncertainty and evidence signals for each sector. [Calibration guide](FARO_SPOT_FIT_GUIDE.md)
- Local Field Notes (stored only on the current device unless explicitly exported)
- Weather-model risk screening and external official-warning references

## iPhone and iPad widgets

**Coastal Editorial v13:** the visual hierarchy is now genuinely different, with a large isolated quality score, a separate blue offshore-model height tile, a segmented five-tone meter, clearer location/time and a dedicated FARO VIBE ribbon. The large WEEK option emphasises alternative daylight sessions.

The `zeeland-widget.js` Scriptable source supports **small square, medium rectangle, large square, iPad extra large, and Lock Screen accessory** layouts with four styles: FLOW, MINIMAL, DATA, and WEEK.

**[Setup and ready-made widget parameters](FARO_WIDGET_SETUP.md)**

**[Forecast 2.0: evidence-based Surfline comparison, swell partitions and tides](FARO_FORECAST_V2_RESEARCH.md)**

**[FARO Swell Compass spec](FARO_SWELL_COMPASS_SPEC.md)** — Chile includes the model-vector compass and a lazy-loaded coastal map with a real marine-grid swell sample point. Accurate bank coastline geometry, bathymetric refraction and breaking-wave-height calibration remain future milestones.

**Desktop layout:** at 1120 px and wider, all seven days show together; the daily take and two-hour windows share a decision-first row. Tablet/mobile remain stacked. The final shared presentation contract is [`assets/faro-visual-system-v2.css`](assets/faro-visual-system-v2.css), layered after [`faro-desktop.css`](faro-desktop.css). Screenshot QA is still pending.

You must replace the code of an existing Scriptable widget script with the current version for the changes to appear on your iPhone; updating this GitHub repository alone does not overwrite a script stored in Scriptable.

## Data integrity

All widgets and website score calculations use `surf-engine.js`. Scores, spot orientation and guide-derived signals are estimates; tidal response, the shape of specific sandbars, permitted access, rip currents and breaking-wave height are **not calibrated at individual FARO sectors**. Local coastal advice must be verified on site.

## Valparaíso · implementation priorities

**P0 done:** Shared Zeeland-derived UI, FARO VIBE → FARO READ, Spot DNA accordion, cross-country navigation, favicon O, model-fed four-spot Chile prototype, 2-hour windows, model UV, wind/rain/thunderstorm threshold screening, official source links, experimental Match and ranking.

**P1 next:** Validate actual live API outputs, sea-grid sampling, daylight logic on Chile DST, local field evidence, official marine/met alerts and SHOA tide integration. [Chile alerts/UV source plan](chile/ALERTAS_UV.md), [La Boca activation gates](chile/LA_BOCA_PILOT_PLAN.md).

**P2:** Pair nearshore UV model with Open-Meteo, calibrate local break observations and scores, add verified bank locations and tide response before calling a score “real quality”, expand beyond Valparaíso, and finally adapt widgets.

[Interactive FARO Lab with editable, NON-live wind/swell input](chile/lab.html) · [Spot DNA source research](chile/VALPARAISO_SPOT_DNA.md) · [pilot score configuration](chile/valparaiso-score.config.json).

## Research registry

[Chile 16-region atlas](chile/atlas.html) · [regional source inventory](chile/README.md) · [field-observation CSV](chile/field-observations-template.csv) · [local validation tests](chile/test-live-forecast.js).



## Handoff de diseño para María y ciencia reproducible (26-10-2026)

- [Brief visual para María: 68 iconos, ubicación, objetivo, prioridad y entrega](docs/FARO_MARIA_ICON_BRIEF_68.md), generado desde el [manifiesto canónico](assets/faro-icon-manifest.json); la app tiene etiquetas sin emojis y solo activará SVG revisados por la diseñadora.
- [Modelo oceanográfico supervisado con boyas reales NOAA](chile/research/OPEN_DATA_TRAINING.md): tareas de altura significativa de ola observada; no es pronóstico validado de rompiente chilena.
- [Experimento complementario de 9.000 etiquetas publicadas de tipo de rompiente](chile/research/wave-breaking-baseline/README.md): priors empíricos, evaluación dejando una costa fuera, y **fallo honesto frente a baseline uniforme**. No descarga ni entrena modelos de vídeo. No se conecta al score de FARO.

La interfaz científica y los nuevos assets deben conservar permisos y procedencia; no usar imágenes de cámaras de terceros para entrenamiento sin verificar las condiciones de la fuente.

## Iteración 26-10-2026 · Marca, mapa y primeros datos visuales

- **Zeeland como identidad base:** actualizada la cascada con un stylesheet final común, mismas cinco bandas numéricas de score (0–2–4–6–8–10), tintas de score idénticas en ambos temas (sin oscurecer las del modo claro), jerarquía responsive, tipografía y superficies. Las categorías verbales Poor/Fair/Good son una dimensión distinta de las cinco bandas numéricas.
- **Sin iconografía inventada:** eliminadas las referencias visuales residuales `.emoji` de las vistas Zeeland y símbolos de enlace improvisados; los SVG decorativos siguen pendientes del [brief de 68 piezas para María](docs/FARO_MARIA_ICON_BRIEF_68.md). Las flechas basadas en ángulos del modelo son representaciones matemáticas, no iconos de marca.
- **Mapa de Chile:** ahora incorpora los cuatro pilotos, sitúa el vector de swell en la celda marina que entrega Open-Meteo y muestra orientación, tamaño/período, fecha/hora y particiones disponibles. No muestra propagación refractada ni marejada costera medida.
- **Registro de datos para visión:** [fuentes y licencias](chile/research/visual-source-registry.v1.json), [plantilla CSV de observaciones](chile/research/visual-observations.v1.csv) y [protocolo de derechos, sincronización y validación](chile/research/VISUAL_DATA_PROTOCOL.md). **0 clips locales recopilados o entrenados** hasta conseguir material autorizado; la existencia de 9.000 vídeos publicados por terceros NO equivale a que FARO los haya descargado.
- **Pruebas:** [regresiones automatizables](tests/faro-visual-regression.test.cjs) y [contrato visual responsive](docs/FARO_VISUAL_QA_CONTRACT.md). Se ha verificado estáticamente la sintaxis de los scripts, las escalas y los rumbos; faltan capturas y prueba real de UX en Safari iOS y escritorio antes de declarar terminada la revisión visual.

### Contrato cromático v3 (27-10-2026)

- Única paleta de calidad numérica para Zeeland, Chile, escritorio, móvil y Scriptable: `#ef9b77`, `#efbd6e`, `#e0cc73`, `#b1d574`, `#8cc584`, con cortes 0/2/4/6/8/10. **Ni el modo claro ni la selección alteran estos pigmentos**.
- Selección y foco: teal costero `#176d78` (claro) o `#90cdd1` (oscuro); NO indican calidad. Altura de ola y swell emplean azules físicos independientes; avisos mantienen la paleta de seguridad.
- Se retiraron los cambios de tinta por tema de `faro-ui.css`, `faro-brand.css` y `faro-colours.css`, y se renovaron las versiones de carga para evitar CSS de caché.
- **Pendiente:** verificar en Safari iPhone/escritorio la legibilidad de los pigmentos claros sobre fondos blancos. Se priorizó mantener el mismo pigmento como se solicitó; no se puede asumir contraste WCAG AA por ello. Las comprobaciones estáticas no sustituyen la inspección visual.
