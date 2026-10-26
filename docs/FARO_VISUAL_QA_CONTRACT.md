# FARO · Visual acceptance contract (Zeeland first)
26 October 2026 · implementation QA checklist · **browser screenshot verification still required**

## Brand source of truth
1. Zeeland is the **canonical presentation**, not Chile. Shared logo: original designer FARO rescue-ring O, in light and dark assets. Headline: Archivo Black; UI/body: Manrope. No emojis or improvised illustrative icons. For María's assets use `assets/faro-icon-manifest.json` and her 68-item brief only.
2. Surfaces: atmospheric coastal neutrals; quality score is a 5-step copper→amber→sand→lime→olive sequence; sea measurements are blue, wind directional overlay ochre, and danger warnings follow a SEPARATE safety palette. Do not colour wave height as though it were quality.
3. The hue of a numeric /10 score is a strict interval **[0,2), [2,4), [4,6), [6,8), [8,10]** in BOTH countries and Scriptable. Words such as Poor/Fair/Good may have different thresholds by design; do not infer a numeric band from a verbal label.
4. CSS cascade: `assets/faro-visual-system-v2.css` is the final-loaded normative layer for both countries. Future refactors should migrate old selectors there and remove duplicated rules in `faro-ui.css`, `faro-brand.css`, `faro-colours.css` and the Chile override, rather than add more patch stylesheets. Do not collapse scientific caveats into marketing tags.

## Information architecture
1. Brand / location / navigation then concise advisory. A 7-day horizon; suggested daily window; height, period, wind and conditions; optional FARO VIBE → FARO READ; expandable evidence, Spot DNA and coast map; FARO Match.
2. All regions share the same **component order, spacing/radius logic, type scale and numeric band colour**; differences are content/data-source/safety status.
3. Avoid repeated descriptions of the same wave mood; FARO VIBE supplies short tag and the expandable READ gives interpretation. No icon should convey critical risk without text.
4. Distinguish updated *marine model data* from actual observations and experimental compatibility scores. Official warnings only declared checked when official service integration genuinely succeeded.

## Responsive screenshot matrix (pending)
- iPhone SE width 375px portrait; iPhone 390px; 430px portrait and landscape.
- Tablet 768px and 1024px.
- Desktop 1120px, 1440px and 1920px. Check Chrome, Firefox, Safari iOS.
- Both light/dark modes, Zeeland and Chile, English and Spanish, with genuine forecast data and no-data handling.
- Verify no page horizontal scrolling, truncated day chips, overlays spilling beyond map, illegible swatch or hidden controls, accidental empty icon padding or contrast failures.
- Verify size 44×44 CSS px for touch targets, visible keyboard focus, reduced motion, SVG accessible labels, legible units / timestamps and data labels. Day-chip scroll only inside the intended scroller on mobile.

## Map acceptance
- Points are documented **coastal references** and are not claims of surveyed surf-bank locations.
- The swell/wind arrow goes on the genuine marine **grid sample**, not on the beach pin; from-direction numeric bearings converted to travel azimuth by +180° (mod 360). No artificial line tracing wave refraction.
- If no valid marine grid point exists, do not invent one. Provide an honest coordinate-based schematic and text-only bearings.
- Cite model source, selected date and local time, grid-to-coast distance and separate total waves, primary swell, windsea and optional secondary/tertiary swell components. Never linearly sum swell heights.
- Coastline geometry, sandbars, bathymetry, refraction, real breaking height and live camera observations are **NOT implemented** by this map.
- Use map tiles only when user explicitly expands map; retain attributions and usage limits. Do not treat this demo as calibrated coastal hydrodynamics.

## Regression commands
```sh
node --test tests/faro-visual-regression.test.cjs
```
This test guards source invariants, colour contrast, maths and provenance only, not actual browser layout. Production rollout also needs browser/device screenshots and manual accessibility inspection.

## Current known limitations
- The project still has historical CSS selectors and `!important` rules that should be progressively consolidated; the new final CSS contract stops most visible conflicts but does not automatically remove technical debt.
- Testing performed in this iteration included static syntax, script parsing and data/math invariants; **not a verified live iPhone/desktop screenshot pass**.
- Chile's spot-fit model remains provisional, cameras are external links only, visual observations currently contain no training-ready clips and official alert status is not automatically integrated.
