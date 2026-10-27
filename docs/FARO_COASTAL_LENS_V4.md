# FARO Coastal Lens v4 — P0–P2 · 27 October 2026

## Safe rollback
- Pre-sprint backup: `backup/faro-before-map-lens-p0-p2-2026-10-27`.
- Working branch: `feature/faro-coastal-lens-p0-p2-2026-10-27`.
- Restore with a normal revert of this sprint PR, never force-push main.
- Zeeland forecast and common numeric quality colour scale unchanged.

## User-facing decisions
### P0: Clarity
- Map has **one coast, highlighted current beach, quieter nearby beaches**, a marine model sample pin, and a weather model sample pin.
- **No giant swell-rose over the coastline.** The compact compass is an independent DOM overlay pinned to the map viewport, not attached to model coordinates, so zoom and pan cannot move it out of view.
- Default **Combined** layer: offshore primary swell and wind, annotated as model data.
- Fixed bilingual summary/legend outside the map canvas; compact `Offshore read` below. Advanced partitions are collapsed.
- Clicking a beach changes selected beach; the controller fetches its own model forecast.

### P1: Interaction
- `Combined / Swell / Wind` controls, accessible `aria-pressed` state.
- Swell view reveals the primary model vector and smaller **dashed secondary and tertiary directional vectors** when model data contains them, all attached to the ONE marine sample position.
- Click marine and atmospheric sample markers for distinct provenance and measurements.
- Actual model-grid distance from the selected coastal reference is given when supplied by the weather/marine provider.
- A selected beach or time refresh updates readings **without resetting the zoom** for the same beach.
- Compact always-visible legend differentiates ocean wave partitions, wind and a provisional guide-direction status at beach pins.

### P2: Exploratory, strictly limited
- `Orientación / Exposure` reveals a fan of the **published directional guide ranges** for the selected beach in the pinned compass. Comparison cards for La Boca, Reñaca, Ritoque and Maitencillo match the selected offshore swell bearing against their distinct wave/wind guidance. It is **only angular matching**, not quantified local wave exposure, wave shoaling, coastal sheltering, directional refraction or breaking-wave height. All other beaches are compared provisionally using the selected beach's regional bearing. Select another beach to fetch its own marine model sample.
- `Movimiento / Motion` animates a tiny direction-following dot only when an offshore bearing is present; OFF by default, automatically disabled for `prefers-reduced-motion`. It is a visualization effect, not particle advection physics.
- Actual bathymetric/refraction modelling **NOT** activated: insufficient site bathymetry, breaker coordinates and validation. Never manufacture these results. Future implementation requires high-resolution coastal geometry, bathymetric rasters, a dispersion/shoaling/refraction formulation and independent held-out observations.
- Existing camera page links and the observation log remain external/optional. No unlicensed video captures are ingested, and no `Observed now` claims are generated automatically.

## Scientific/model caveats
- Wind and marine model grids may be distinct and neither is an observed surf break. Wave and wind bearings are originally `FROM` directions; visualization arrows point in the direction of propagation (`(FROM+180) modulo 360`).
- A guide compatibility category is NOT a field-calibrated surf quality rating.
- A green guide-alignment dot never means the break is safe or glassy.
- FARO's Chile experimental rating, daylight and risk logic are untouched.
- Do not reuse third-party Surfline graphics or proprietary data. The design uses independent FARO UI and authorized provider data.

## QA and release
- Source-only automated: `node --test tests/faro-coastal-lens-v4.test.cjs tests/faro-visual-regression.test.cjs`.
- Smoke check script loading, mock-DOM rendering for four beaches, fixed compass and interactive layer controls.
- Device/browser screenshot checks still required at desktop and 375 / 390 / 430 px iPhone widths (both themes, both languages). Verify Leaflet 1.9.4 from CDN, OSC grid position, all layer toggles and zoom retention on actual devices.
- The backup remains available independent of GitHub Pages propagation.
