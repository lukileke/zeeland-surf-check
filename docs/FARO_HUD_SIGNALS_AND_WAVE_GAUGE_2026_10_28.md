# FARO · Corner direction HUD + offshore height gauge · 28 October 2026

## Rollback and scope
- **Exact pre-sprint version**: `backup/faro-before-hud-wave-meter-2026-10-28`.
- Implementation: `feature/faro-hud-signal-wave-meter-2026-10-28`.
- To restore, revert this sprint's merge commit; **do not force-push main**.
- This sprint changes Chile's **UI and provisional directional signal interpretation**, not Chile's experimental FARO score arithmetic, Zeeland score or any source observations.

## P1: map, clarity and interaction
- The selected beach remains an ordinary geographic pin; a large compass / ring at that location has been **removed** to stop it hiding the coastline.
- A small responsive **corner HUD** lives as a separate DOM child of the map viewport (not as a coordinate marker). It remains readable and fixed in the corner when panning or zooming.
- Background: ~72% translucent light mode / ~63% translucent dark mode, slight blur and thin outline; reduced-transparency fallback.
- One small visual arrow and colour state for each **swell** and **wind**; north-up orientation and arrows point in the direction of travel, using `(FROM+180) modulo 360`.
- `Combined / Swell / Wind` modes determine which rows display. `Orientación` shows the actual published directional guide sector in text; `Movimiento` activates an optional gentle UI pulse, off for reduced-motion preference.
- Near-map quick read uses the **same** model signal states as the HUD to avoid a green label for a weak-energy swell.
- Individual beach selection still zooms to the chosen beach, with regional map and clickable marine/atmosphere sampling points available separately.

## Provisional signal classification — interpret with care
The HUD is **not a calibrated surfing quality or safety score**. Its colour is an editorial heuristic using original directional guide ranges with a rough offshore strength cue. Exact thresholds below are provisional, not derived from validated beach observations.

### Swell
- Angular fit from `waveFromDeg`: inside, near (within 25°), outside or unknown.
- Relative offshore strength proxy `P = (primary swell height in metres)² × (primary swell period in seconds)`. This is **not** modelled breaker power or actual delivered kW/m at the beach.
- `P ≥ 9`: energetic, `3 ≤ P < 9`: moderate, `P < 3`: low.
- Outside guide: unfavourable; low proxy or period < 7 s: weak; inside guide + energetic: favourable; otherwise mixed. Missing values: unknown.

### Wind
- Angular fit from `windFromDeg`, including a strong-wind override.
- Strong caution if sustained speed ≥26 km/h **or** gusts ≥40 km/h.
- Very light wind ≤4 km/h and gusts ≤12 km/h: favourable regardless of compass bearing, as direction becomes less meaningful when nearly calm.
- Outside guide with appreciable wind: unfavourable.
- Inside guide, below 15 km/h and gusts below 26 km/h: favourable; remaining cases: mixed. Missing: unknown.

**Safety note:** colours do not evaluate currents, reefs, sandbars, breaking-wave height, tides or official warnings. They cannot establish that a spot is safe or suitable for a particular surfer. The map's marine and atmospheric grid positions are model source points, not the exact breaking zone.

## P2: wave-height card
- New continuous metre-scale gauge with a clean ocean-blue progress fill, eight quiet ticks and a position marker. It caps visually at `2 m+`, while the real numerical reading above the gauge remains **uncapped**.
- No invented waveform or local breaker-height visual. `Offshore scale · not breaking surf` is visible.
- Applies to the daily summary and chosen session, in both English and Spanish, with colour and spacing matched to FARO.

## Map clarity and sharpness
- Prefer **MapLibre GL JS 5.24 browser bundle + maplibre-gl-leaflet adapter 0.1.4**, loaded after the user opens the map. This pairing exposes the global expected by the adapter.
- OpenFreeMap Positron is the vector map style. Keep OpenStreetMap raster tile layer visible until vector style actually finishes loading, with `detectRetina:true` for high-density screens. Source attribution is retained.
- No claim of improved actual tile sharpness is made without Chrome/Safari visual testing, real network availability and WebGL checks.

## QA and acceptance
- `node --test tests/faro-hud-wave-gauge.test.cjs tests/faro-visual-scoring-audit.test.cjs tests/faro-coastal-lens-v4.test.cjs tests/faro-ux-journey.test.cjs tests/faro-visual-regression.test.cjs`
- Source and model rules verified, including missing data, near-calm wind, strong gusts, over-2 m wave-gauge behaviour, reduced-motion option and cache invalidation.
- Mock Leaflet component: tested spot changes and changing forecast intensities; HUD rows and lower quick read show the same state.
- **Pending real browser QA**: iPhone at 375/390/430 px and desktop at 1120/1440 px, both languages/themes; contrast and blur support; leaflet vector tile load, scroll/zoom and whether the HUD overlaps labels in unusual beach orientations.

## Art direction for María
- Replace temporary SVG arrow stroke with a custom clean compact glyph, retaining **dynamic JS bearing rotation and CSS colour** (not baked into SVG).
- Provide a small north glyph/rose suitable for a **150–170 px-wide** corner HUD and a matching ocean-height gauge accent.
- Assets should be viewBox-driven, currentColor/stroke-compatible, responsive and independently legible in light/dark; **do not embed a decorative image of local wave refraction**.
