# FARO · Coastal Atlas visual/UX refinement (28 October 2026)

## Mission
Help a surfer answer, in order: **Which beach might merit a closer look?** → **What do current offshore model conditions indicate at that beach?** → **What local observations and safety considerations must I verify?**

This is neither a live observation product nor a validated nearshore breaking-wave simulator. Avoid numerical ranking claims for uncalibrated beaches and never draw fabricated wave trajectories.

## Findings from user review and technical audit
1. The saturated blue and amber circles with large arrowheads in the regional screenshot were **marine and atmospheric model-grid markers**, not beach-specific swell/wind evidence. Those markers were instantiated on the map even with their opacity set to zero; inconsistent browser/CSS layering could still expose their presence and confuse the meaning.
2. The same base-map pin language was mixing two unrelated objects: **interactive beach choices** and **technical data provenance**.
3. The local HUD arrow glyphs were simple fat arrows with inline neon-like status colours. Those colours did not adapt adequately to light/dark themes and clashed with FARO's reserved coastal palette.
4. Clicking the already-selected beach in regional view did nothing, an avoidable dead-end.
5. The regional fallback SVG also drew long artificial rays from a single model cell, visually suggesting bathymetric refraction that the model does not calculate.

## Actual implementation
### 1. Regional atlas as beach-first map
- Fit the **four named beach reference coordinates** (La Boca, Reñaca, Ritoque, Maitencillo); do not centre on ocean grid sampling cells.
- The **default map does not even instantiate** ocean/atmosphere sample markers. Previously they were hidden with zero opacity; now they are created **only** when the surfer opts into **Model data → Show model sample points**.
- Sampling markers when enabled are small, neutral **M** (marine) and **A** (atmospheric) provenance annotations. No arrows, no colour suggesting a favourable surf condition, no pretend trajectories. They are at actual model source coordinates.
- On deselection, switching layer or returning to local view, optional markers are removed from Leaflet, not merely made transparent.
- Regional beach pins now carry **two compact alignment marks**: swell = solid stroke, wind = dashed stroke. Both use the **same restrained compatibility palette** (within / near / outside / unknown); the shape differentiates the physical variable. Each pin's accessibility label explains the separate conditions.
- Selected beach gains typographic and border emphasis, not large glowing discs. Regional click on **any** beach, including the one previously selected, returns to beach focus.
- Comparison remains a **guide-bearing comparison only** against published orientations. It is not an independent beach forecast, observed quality grade, energy ranking, or safety rating.
- The fallback latitude/longitude reference plot is aligned with the same philosophy: default shows spots only, opt-in reveals small M/A points; no rays.

### 2. Local beach as conditions dashboard
- Local Beach Focus keeps its small corner HUD and current selected beach reference. It does not show regional microticks on beach pins.
- HUD background: `rgba(243,251,250,.44)` light / `rgba(15,43,47,.40)` dark with **18px blur** and a faint edge. `prefers-reduced-transparency` and no-backdrop-filter clients retain a solid/high-legibility fallback.
- Replace clip-art arrows with original, slim, separate **wave-current** and **wind-feather** vector strokes. Rotation uses actual model `FROM + 180°` bearing convention, not a fixed decorative orientation.
- Semantically compatible **FARO ink** replaces bright neon fills. Tokens change across light/dark; labels remain available for every state, so the meaning is **not based on colour alone**.
- The existing current-window Ocean Read, wave-height meter, model disclosure and score remain unchanged and linked to the selected beach and forecast time.

### 3. Constraints and trade-offs
- Regional map intentionally does not display wind arrows and swell arrows from offshore grid positions because one grid vector cannot establish the trajectory into four differently oriented sandbanks.
- **M/A** marks are optional only and retain their provenance popup; they must not be confused with spots.
- UI alignment colours are **directional guide compatibility**, not measured surf quality, and not calibrated using field observations.
- The MapLibre/OpenFreeMap vector basemap + OSM retina fallback remains. Basemap network performance, contrast above different map tiles and browser support still need actual Safari/Chrome screenshot checks.
- Leave María's original SVG artwork deliverables to her; current code uses carefully sized original SVG primitives only as temporary UI elements.

## External design references and applied decisions
- **Mapbox, Guide to map design**: customisation in colour, typography and iconography, with *hierarchy, density, contrast and legibility*. FARO reduces ornamental map controls and maximises beach label visibility. https://www.mapbox.com/insights/map-design-process
- **Surfline, Explore tab**: spot browsing is distinct from buoys/wind/weather charts; a selected spot is visually distinguished and the deeper forecast is accessed through its dedicated detail. FARO separates beach pins from optional ocean-grid source points and provides a route to Beach Focus. https://support.surfline.com/hc/en-us/articles/5339373466523-Understanding-the-iOS-Explore-Tab-Map-of-Spots-Buoys-Wind-Stations-Weather-Charts
- **Mapbox, iOS map design**: translucent overlays need adequate contrast; geographic pins must clearly indicate interactivity, have enough spacing and should not rely on hover. FARO uses restrained pin type and readable corner HUD. https://docs.mapbox.com/ios/ja/legacy/maps/guides/map-design-for-ios/
- **W3C WCAG 2.2**: meaningful graphics should reach appropriate contrast and should not use colour as the only signal. FARO adds solid/dotted stroke identity and textual statuses, plus `aria-label`. https://www.w3.org/TR/WCAG22/

## Verification
- Exact pre-sprint backup: `backup/faro-before-coastal-atlas-refinement-2026-10-28`.
- New test contract: `tests/faro-coastal-atlas-ux.test.cjs`; existing regional, HUD, model and visual regression tests also run.
- Mock Leaflet session verified: default regional creates no technical model markers; opt-in creates two; tapping the already-selected regional beach opens local zoom and removes both.
- **Not verified in a real browser**: screenshots at 390px / 1440px light and dark, keyboard focus/hover, raster vs MapLibre vector layers, and GitHub Pages propagation. These are required before claiming final visual sign-off.

## Next research milestone — responsible local model calibration
Collect timestamped independent field/video reports across multiple swell and tide events per beach; hold out entire events for validation. Only then estimate local directional-response weights or numerical skill scores. The vector marks remain labelled as provisional guide comparison until this evidence exists.
