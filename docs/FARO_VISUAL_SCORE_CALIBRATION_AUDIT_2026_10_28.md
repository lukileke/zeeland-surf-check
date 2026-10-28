# FARO · Visual quality and score-calibration audit · 28 October 2026

## What is shipped
- **Beach-centred dial**: a single integrated coastal reference instrument per selected beach, built as SVG primitives. The primary swell and wind are plotted in **separate concentric lanes** with modelled FROM bearings moving inward. No artificial rays connecting the offshore model cell to the beach, no crossing PowerPoint-style trajectories, and no bathymetric refraction claims. The fixed compass remains in **regional** mode only.
- **Sharper basemap**: when WebGL is available, the map dynamically loads MapLibre GL JS 6.3.0 and its Leaflet adapter, using the OpenFreeMap Positron vector style and preserving Leaflet beach markers and popups. A working OpenStreetMap raster basemap remains visible until vector tiles finish loading; if blocked, raster **detectRetina** serves HiDPI clients more clearly. Only tiles in the user-opened viewport are requested. OpenStreetMap and OpenMapTiles/OpenFreeMap attribution obligations still apply.
- **More useful footer**: six details are arranged into three task groups (Read conditions, Know the break, Plan and contribute), with individual previews, real content and accessible native summary controls. Footer links open Methods or Cameras within the app rather than raw Markdown. Mobile is one column.
- **Score honesty**: Chile's score remains **experimental**. `valparaiso-score.config.json` currently records **zero field-calibration sessions**, `active:false`, and a `7.9` provisional cap. The evaluation now exposes `capActive`, `fieldSessions`, `rawDirectionalIndex` and `rawSwellAvailability` for auditing, **not** as alternative calibrated scores. Chile's visible grade uses the actual guide-derived experimental label (e.g. Prometedor), not generic Good/Epic quality labels. The score and weekly comparisons disclose when the cap prevents discriminating between high index values.

## Why not declare the score calibrated
A four-site local score requires independently observed conditions at the beach, not only Open-Meteo offshore forecasts and guide azimuths. Do **not** tune weights until field evidence is acquired. No cross-spot reliability, measured wave-face height, bank geometry, official alerts or wave safety determination is claimed.

### Calibration study — minimum scientifically defensible workflow
1. **Archive forecasts prospectively** (before observation) with spot ID, local time and UTC, provider/model version, marine and atmosphere cell coordinates, direction, height, period, wind, gust and model-index components.
2. **Log field observations** from authorised surfers/cameras with precise beach/bank reference, timestamp, wind-face cleanliness, breaking-wave height/period where assessable, tide and water quality separately, plus a human-rated session quality definition. Preserve the raw source and its permissions.
3. Predefine the rating rubric. Collect **multiple independent swell events and tide phases for every target beach**; 0 sessions cannot estimate a valid residual or confidence interval. Avoid random leakage between consecutive hours from the same event.
4. Use **held-out swell events and/or held-out weeks** for blind evaluation against a direction-only baseline. Report rank agreement, classification confusion, calibration reliability, mean/median absolute error and sample count for each spot; include a bootstrap CI clustered by swell event.
5. Only after demonstrated validation, consider an empirical adjustment and a confidence badge. Distinguish a tuned experimental score from one with independently verified site-level accuracy. Mark scarce-data spots as **Unvalidated** rather than hiding this status.

## Design principles and third-party sources
- Map hierarchy, contrast and legibility: https://www.mapbox.com/insights/map-design-process
- OpenFreeMap vector basemap and attribution: https://openfreemap.org/quick_start/
- Leaflet+MapLibre official adapter: https://github.com/maplibre/maplibre-gl-leaflet
- OSMF community tile usage/attribution: https://operations.osmfoundation.org/policies/tiles/
- Progressive disclosure and avoiding unnecessary accordions: https://www.nngroup.com/articles/accordions-on-desktop/
- Explicitly separate observed and modelled conditions: https://support.surfline.com/hc/en-us/articles/35995874238491-Observation-Clarity

## Rollback and QA
- Pre-sprint backup: `backup/faro-before-visual-score-audit-2026-10-28`; edits staged in `feature/faro-sharp-map-ux-score-audit-2026-10-28`.
- Test: `node --test tests/faro-visual-scoring-audit.test.cjs tests/faro-coastal-lens-v4.test.cjs tests/faro-ux-journey.test.cjs tests/faro-visual-regression.test.cjs`.
- Need **actual browser/device visual checks** at 390 and 1440 CSS px and light/dark EN/ES; CDNs/WebGL and GitHub Pages propagation cannot be confirmed by source tests.
- María's custom SVG artwork remains pending; the currently coded beach dial is an editable vector component intended for eventual replacement with her design.
