# FARO · Coastal Lens regional UX and softer glass · 28 October 2026

## Safe restore point
- `backup/faro-before-regional-ux-2026-10-28` is an untouched copy of `main` before this sprint.
- Changes worked on `feature/faro-regional-ux-glass-hud-2026-10-28`.
- Revert the merge PR to roll back. Do not force-push or overwrite the original.

## Rationale
A surf map has two distinct questions: **What is happening at this break?** and **Which break should I inspect?** Mixing the current spot's offshore model grid with an overview of four breaks produced confusing zoom extents and scattered markers.

Mapbox's cartographic principles of **hierarchy, density, contrast and legibility** favour a selected point of interest in beach mode and a genuinely region-oriented location overview when comparing candidates:
https://www.mapbox.com/insights/map-design-process

## Product behaviour
### Playa / Beach focus (default)
- Local zoom 15 on narrow/mobile viewports, 16 desktop (unchanged).
- One selected beach marker.
- Compact direction HUD in the viewport's upper-right corner.
- HUD background now **56 % light / 49 % dark** alpha, **16 px blur**, lighter border and shadow. Preserve legibility and opaque fallback under `prefers-reduced-transparency: reduce`.
- Wind and swell retain actual model bearings, provisional directional/energy states and explicit non-calibration caveats.
- Quick-reading card remains available directly below the map.

### Región / Regional view
- The map fits **all four actual named beach reference coordinates**, not the selected spot's marine or wind model sampling points. No exact break/bank geometry is implied.
- **No beach-specific compass/HUD on the regional map**; its signals are contextual to the selected spot, not independently forecast for each neighbouring break.
- A brief non-overlay context line describes the regional comparison; markers and their orientation-guide dots are the map focus.
- A region-specific three-state legend distinguishes guide alignment *only* (inside/near/outside). It does **not** infer relative breaking height, energy or real session quality at each spot.
- The current beach's offshore quick-reading card is hidden in this mode to prevent mistaking it for a regional prediction.
- The four-beach comparison disclosure opens when entering regional view; tapping a beach returns to its close-up with the locally selected model.
- Under **Model data**, users may **explicitly opt in** to display true marine and atmosphere sample points. When enabled, framing widens to include those sample coordinates if they are within 60 km of the reference, so the option is useful and does not silently leave them outside the frame.

## UI and accessibility
- Native checkbox remains keyboard navigable.
- Local-only exposure and motion controls are hidden in regional mode, where they would not modify a beach-specific HUD.
- Region summary is hidden in local mode and vice versa. `hidden` is enforced with explicit CSS because older `display:...!important` rules exist.
- Region context and map status remain bilingual (Spanish/English). Mobile context is stacked.

## Tests and limits
- `node --test tests/faro-regional-map-ux.test.cjs tests/faro-hud-wave-gauge.test.cjs tests/faro-visual-scoring-audit.test.cjs tests/faro-coastal-lens-v4.test.cjs tests/faro-ux-journey.test.cjs tests/faro-visual-regression.test.cjs`
- 43 regression cases passed; mocked Leaflet transition checked all four coordinates in regional bounds, beach mode zoom restoration and default exclusion of offshore grids.
- Browser/real-device screenshot QA remains required for light/dark and iPhone/desktop; code tests do not prove contrast on every underlying map tile.
- No wave refraction, bathymetry solver, model accuracy or camera ingestion added.

## Further refinements
- Check the opaque accessibility fallback and corner HUD's legibility above different basemap land/ocean backgrounds.
- When María provides icons, exchange generic arrows and pins for her design assets while preserving model-driven rotation, contrast and accessible text.
