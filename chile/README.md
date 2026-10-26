# FARO Chile · Valparaíso y atlas nacional

**[FARO Chile · Pronóstico modelado de Valparaíso](index.html)** comparte la interfaz de Zeeland; [atlas nacional de investigación](atlas.html) conserva las 16 regiones y 73 lugares candidatos.

La primera versión de Valparaíso ofrece cuatro spots con datos de Open-Meteo solicitados en cada actualización: **La Boca, Reñaca, Ritoque y Maitencillo**. Se muestran oleaje total modelado, swell primario, viento, UV, siete días, ventanas de 2 h, FARO VIBE + READ integrados, Spot DNA, Best of Week y Match. **No** presenta altura de la ola rompiente observada, una tabla de marea local verificada ni un score de calidad de surf calibrado.

Las puntuaciones /10 utilizan un perfil distinto de viento y dirección de swell por spot, basado en guías, y están limitadas a 7.9 como advertencia de su carácter provisional. Este techo no equivale a una validación estadística. La vista no comprueba en automático el estado de marejadas o alertas de la Armada, DMC ni SENAPRED. Sí muestra riesgos heurísticos del modelo y los enlaces oficiales. [Protocolo de alertas y UV](ALERTAS_UV.md).

**Quinto perfil solo de laboratorio:** Papagayo. Todavía no hay una coordenada comprobada de la rompiente para incorporarlo al pronóstico principal.

Archivos clave:
- [`index.html`](index.html), [`chile-forecast.js`](chile-forecast.js), [`chile-forecast.css`](chile-forecast.css): modo Chile con la base CSS compartida de Zeeland
- [`valparaiso-live.config.json`](valparaiso-live.config.json): coordenadas costeras *aproximadas*, referencias, fuentes, umbrales heurísticos, UV y proveedores de modelos
- [`faro-chile-live.js`](faro-chile-live.js): consulta Open-Meteo y organiza ventanas, daylight, Spot Fit, riesgos modelados y Match
- [`valparaiso-score.config.json`](valparaiso-score.config.json), [`valparaiso-score-lab.js`](valparaiso-score-lab.js): hipótesis y motor experimental por playa
- [`lab.html`](lab.html): simulador con variables manuales; no confundir con la información modelada actualizada
- [`VALPARAISO_SPOT_DNA.md`](VALPARAISO_SPOT_DNA.md): investigación respaldada por fuentes
- [`LA_BOCA_PILOT_PLAN.md`](LA_BOCA_PILOT_PLAN.md): próximos pasos y validación
- [`field-observations-template.csv`](field-observations-template.csv): registro vacío para evaluar la precisión

**Pruebas de regresión (sin red):** `node chile/test-valparaiso-score.js` y `node chile/test-live-forecast.js`.

## Prioridades de producto · Zeeland es la referencia

**P0 — Base unificada (implementado en código):** FARO Chile reutiliza las hojas de estilo, navegación, tarjetas de siete días, selector de horario, pestañas Pronóstico/Lo mejor/FARO Match y logotipo oficiales de Zeeland. No se traslada el antiguo diseño del atlas a Zeeland. El icono O original aparece como favicon en ambos países.

**P0 — FARO VIBE + READ (implementado):** el tag de carácter de ola abre una lectura sencilla y señales de respaldo. En el resumen queda solo la etiqueta y la invitación a desplegar. Terminología chilena: Glassy, Picadas, Suavecitas, Líneas limpias, Potentes y Mixed Bag. «Campana» queda reservada para condiciones de cierre locales verificadas; no se predice a partir de altura de ola offshore.

**P0 — Datos y seguridad (parcial):** Open-Meteo aporta pronóstico actualizado de oleaje, swell, período, viento, nubosidad y UV. El bloque expandible de riesgos diferencia viento, lluvia y tormentas del modelo; el aviso oficial de marejadas sigue sin sincronizar. El resumen muestra el UV máximo diario y la sesión elegida contiene UV horario. Véase [Alertas y UV](ALERTAS_UV.md).

**P1 — Score específico y evidencia (pendiente de calibración):** establecer geometría exacta de los cuatro breaks, resolver exposición y shadowing, marea y tamaño rompiente. Los pesos actuales son hipótesis basadas en guías; 7.9 es un límite precautorio arbitrario, no precisión validada. Se necesitan observaciones prospectivas y resultados fuera de muestra antes de calificarlo como score de calidad.

**P1 — Alertas oficiales automáticas (pendiente de autorización y pruebas):** integrar feeds oficiales con timestamp, periodo de vigencia y geolocalización. Sin fuente válida, declarar «estado no comprobado» y ofrecer enlace oficial; nunca inventar ausencia de avisos.

**P2 — FARO Swell Compass + mareas:** la brújula ya muestra dirección del swell y viento; después añadir los sistemas secundario/terciario y un mapa de referencia geográfico, solo con coordenadas/shoreline contrastadas. Marea local a partir de SHOA con datum y estación, nunca extrapolar un óptimo para todos los spots.

**P2 — FARO Match calibrado por spot:** cruzar tipo de tabla y nivel con una calidad física objetiva y exposiciones locales, manteniendo la evaluación de seguridad independiente. Validar en La Boca y Reñaca antes de expandir hacia otras regiones.


### Integridad del pronóstico · iteración P1 (rama de revisión)

- Una ventana de 2 h se considera **completa** únicamente si los valores básicos de oleaje total, swell primario, período, dirección y viento existen para **ambas horas coincidentes**. Si faltan entradas no hay score de esa ventana; no se promedian como dos horas los datos de una sola.
- El detalle técnico ofrece **horas completas / horas previstas**, distancia de la celda de oleaje y de la celda atmosférica a la **referencia costera documentada**, además del estado de dicha referencia. Esa distancia **no** es una medición desde la rompiente real.
- Si faltan códigos meteorológicos, lluvia o viento, FARO indica **riesgo no evaluado** en lugar de prometer que no se detectaron alertas. Las ventanas sin evaluación suficiente no participan automáticamente en «mejor hora».
- Se añade una prueba de regresión de Chile al flujo de GitHub Actions; sigue pendiente **verificación en dispositivo y datos de proveedor**, calibración con observaciones y conexión legal y técnica a alertas vigentes.
- **Fuentes:** las variables de Open-Meteo representan predicciones de grilla marina de resolución limitada; el punto de 20 m de la Universidad de Valparaíso no está integrado ni equivale a altura rompiente. La OMM identifica un posible feed CAP de DMC, pero no se ha verificado disponibilidad/CORS ni licencias. Por tanto el estado oficial permanece «no comprobado».


## P1 · Hora UTC, swell opcional y fuente costera (26/10/2026)

- Open-Meteo Chile se consulta con `timeformat=unixtime`; sus instantes se convierten mediante `Intl.DateTimeFormat` y la zona IANA `America/Santiago`. El `utc_offset_seconds` fijo del proveedor **no** es una conversión válida para todos los días si existe un cambio horario.
- La franja 2 h exige datos marinos y meteorológicos coincidentes **también en UTC**. Las horas repetidas o ambiguas no se fusionan; sin entradas completas no se calcula un score experimental.
- El detalle técnico conserva las horas válidas UTC. Cuando el modelo entrega swell secundario y terciario, se presentan separados de swell primario y oleaje total. Son **opcionales**: en ausencia de soporte (HTTP 400) se vuelve al pronóstico base; no se imputan como cero.
- Se enlazaron las páginas UV para [Nodo Costero Playa La Boca](https://marejadas.uv.cl/CL15CCN01) y [Sector Costero Reñaca Norte](https://marejadas.uv.cl/CL15VAS04). Su pronóstico costero se describe a aproximadamente 20 m de profundidad; **no está integrado automáticamente** ni equivale a ola rompiente observada. El acceso estructurado y los derechos de reutilización se deben validar antes de extraer sus valores.
- Los avisos de Armada/SERVIMET y de DMC/SENAPRED continúan sin sincronización oficial. La OMM registra un posible CAP para DMC (\`https://archivos.meteochile.gob.cl/portaldmc/rss/rss.php\`), pero no ha podido verificarse disponibilidad, formato ni licencia. No afirmar ninguna alerta como activa o descartada por este vínculo.
- QA dedicado: `node chile/test-live-forecast.js`, `node chile/test-valparaiso-score.js`, y `node chile/test-browser.cjs` (Playwright requerido). No altera el pipeline visual de Zeeland.

## Structure
- [`regions.json`](regions.json) — all **16 Chilean regions**, including empty or inland ones
- [`regions/`](regions/) — **one JSON record per region**, with documented/candidate surf areas
- [`sources.json`](sources.json) — provenance: official Chile Travel, SERNATUR, DIRECMAR/SHOA, independent spot directories
- [`spot.schema.json`](spot.schema.json) — versioned field contract (region metadata and per-spot facts)
- [`catalog-loader.js`](catalog-loader.js) — optional future loader with validation, deliberately not imported into live FARO
- [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md) — staged surf-science and engineering plan

## Evidence and integrity
Each spot stores a stable `CL-XX:slug` identifier, locality, region and timezone, source references, currently known break type or wave hand (only if supported), and deliberately unpopulated calibration fields. This prevents a generic mainland reference from masquerading as a nearshore/bank-specific reading.

### Confidence states
- `directory_listed`: the spot exists in a named surf directory; **no reliable physics inferred**.
- `guide_described`: a guide describes a limited property (e.g. Punta de Lobos left point; El Gringo reef); not independently validated.
- `field_checked`: planned later after FARO/local surfing field notes corroborate observations.
- `locally_calibrated`: future milestone, not asserted for any current record.

`publishedReference` holds a **quoted categorical guide claim** (e.g. SW swell and SE wind for Punta de Lobos); it does NOT automatically set `favourableWindDegrees`, swell response or a numeric score. Everything that is still unknown is `null` or `unverified`, never zero.

## Included scope
Candidate locations are grouped in Arica y Parinacota, Tarapacá, Antofagasta, Atacama, Coquimbo, Valparaíso (including an **insular Rapa Nui** placeholder), O'Higgins, Maule, Ñuble, Biobío, Los Ríos and Los Lagos. La Araucanía, Aysén and Magallanes have empty placeholder inventories until independently sourced. Metropolitana is preserved as an **inland** administrative region, not a coastal surf spot.

### Regional timezone requirements
- Most mainland regions: `America/Santiago`.
- Rapa Nui: `Pacific/Easter` (insular Valparaíso; distinct local clocks).
- Aysén: `America/Coyhaique` (tzdata 2025b, permanent UTC−3).
- Magallanes: `America/Punta_Arenas` (permanent UTC−3).
- Compute daylight and arrival windows in the **spot's** timezone, not a single hard-coded Chile timezone. Validate the IANA timezone library before launch.

## Calibration barriers before presenting Chile spot fit as validated surf quality
1. Verify coordinates **at the exact break**, rather than a town centroid.
2. Verify wind exposure, bathymetry / banks, wave approach and coastline orientation with at least one reliable local source; distinguish total model waves from directional swell systems.
3. Determine offshore wave model geographical coverage/resolution and choose a nearshore transformation model or documented conservative limitations.
4. Connect licensed near-real-time SHOA tide predictions and appropriate reference ports, with datum, timing and local tide interpolation uncertainty.
5. Add official marejadas / coastal hazard references and sector-specific access rules; do not invent government warning status.
6. Establish separate conditions-based Surf Quality, local Spot Fit and user-dependent FARO Match scoring, then **validate against observed sessions**.
7. Build native bilingual ES/EN text and allow a manual country/region selector only after data and alert behaviour work; do not let NL warnings leak into Chile.
8. Integrate widget parameters, cache namespace and region-aware climate/seasonal behaviour **after** an end-to-end country mode test.

## Current science limitation
The atlas is not a tide guide, not a safety clearance and not evidence that any named beach is suitable for a particular surfer at a given instant. Conditions change across the same beach. The current five-band palette is a display scale, not a universal score calibration for Chile.

## Editing together
Start with a region JSON file. Add a `sourceId` to `sources.json` before writing a claim. Specify uncertainty, evidence scope, season and whether a wind/swell direction means **FROM**. Keep every observed surf session and model forecast paired by local timestamp and sector ID, then fit spot-specific parameters only when there is sufficient replication.

Reference entry points:
- [Chile Travel · Arica](https://chile.travel/blog/surf-en-chile-7-destinos-con-olas-perfectas/)
- [Chile Travel · Pichilemu](https://chile.travel/blog/los-mejores-lugares-para-hacer-surf-en-pichilemu-y-sus-alrededores/)
- [Surfline · Punta de Lobos spot guide](https://www.surfline.com/surf-report/punta-de-lobos/5842041f4e65fad6a7708cba/spot-guide)
- [Sernatur · Ñuble](https://www.sernatur.cl/region/nuble/)
- [DIRECMAR / SHOA · Tide predictions](https://www.directemar.cl/directemar/site/edic/base/port/preg_frec_shoa.html)
- [DIRECTEMAR · Official time changes](https://www.directemar.cl/cambio-de-hora-en-chile-continental-e-insular-occidental-0)
