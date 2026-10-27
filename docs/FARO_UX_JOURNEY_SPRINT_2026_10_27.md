# FARO | Ocean-first UX sprint (27 October 2026)

## Safe release
- Baseline preserved: `backup/faro-ux-navigation-before-2026-10-27`.
- Work branch: `feature/faro-ux-navigation-and-map-2026-10-27`.
- Revert the eventual merge to roll back without rewriting main.

## Research translated into implemented choices
- [Surfline Charts](https://support.surfline.com/hc/en-us/articles/16345467668763-Surfline-Charts-map-of-wave-height-period-wind-and-swell-components): separate chart modes and a point-specific reading rather than drawing everything simultaneously. FARO uses Combined, Swell, Wind and overlays only active measurements.
- [Surfline Explore](https://support.surfline.com/hc/en-us/articles/5339373466523-Understanding-the-iOS-Explore-Tab-Map-of-Spots-Buoys-Wind-Stations-Weather-Charts): exploration of beaches distinct from marine data; FARO keeps selected beach visually distinct and offers a four-step journey.
- [Mapbox map design](https://www.mapbox.com/insights/map-design-process): hierarchy, legibility, density and contrast. FARO uses one arrow per grid sample and a muted basemap; markers remain honestly geolocated.
- [Apple Maps HIG](https://developer.apple.com/design/human-interface-guidelines/maps): selected POIs, avoid UI covering map, progressive zoom detail.
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/): 2.5.8 target size, keyboard focus, 1.4.11 non-text contrast and 1.4.1 not relying on colour alone.

## Implemented on the Chile forecast page
1. **Four-step route**: `01 Horarios`, `02 Mapa`, `03 Spot DNA`, `04 Cámaras` at the top of forecast. Buttons scroll to actual content; disclosure destinations are opened and their summary receives accessible focus. Buttons get bilingual labels and 44px min targets.
2. **Desktop grid fix**: journey navigation spans all 12 columns, avoiding the default auto-placement of an unassigned grid item. On mobile, navigation is horizontally scrollable with scroll snap, not an intrusive sticky bar.
3. **Coastal Lens**: optional exposure/motion moved to a compact `Opciones del mapa` disclosure; `Encuadrar playa y mar` is a clear touch target to show selected coastal reference plus nearby oceanic and atmospheric model sample cells.
4. **Context-first framing**: include real provider samples within a defensible local 60km radius, using a conservative max zoom; never move a distant sample to the beach.
5. **Manual exploration preserved**: beach selection reframes once; when the beach arrives before its weather data, one additional framing is permitted as the *first valid local sample* arrives. Thereafter hourly updates preserve user's pan/zoom. A map drag cancels the pending auto-fit.
6. **Accurate layer semantics**: the legend no longer advertises secondary/tertiary dashed overlays that were removed to avoid spaghetti vectors. Those components remain in the source popup / technical panel.
7. **Compass guides**: optional sector uses the spot's *wind* guide in Wind mode and *swell* guide in the other modes. These are published azimuth ranges, not calibrated refraction.
8. **Fallback**: if Leaflet or map tiles fail, keep the compass over the geographical SVG fallback and show a bilingual status without claiming current observations.
9. **Shared accessibility**: keyboard focus styling and touch-target improvements in the canonical stylesheet apply to both Zeeland and Chile. Numeric score thresholds and forecast engines are not changed.

## Manual QA matrix — not yet verified on devices
- Device widths: 375, 390, 430, 768, 1024, 1120, 1440 and 1920 CSS px.
- EN/ES and dark/light; verify no horizontal overscroll and no text lost in selected spot and four-step navigation.
- Tab navigation into journey bar, source details, map controls, current beach, safety statements.
- Map with nearby (11 km) marine sample; map with no sample; model load after beach selection; pan and change hourly window; reframe button.
- Model mode transitions; wind-sector vs swell-sector; manual controls collapsed by default.
- Safari iOS: 44 px targets; safe areas and map-touch behaviour.
- Actual GitHub Pages deployment, tiles, map drag and browser screenshots remain pending.

## What remains intentionally outside this sprint
- A spatially complete marine heatmap requires **multiple genuine model grid cells per forecast time**; FARO currently samples one provider cell. Do not simulate a regional colour raster from one value.
- A bathymetric/refraction engine requires high-resolution bathymetry and independent local observations; current range comparisons remain labelled guides.
- No unauthorized camera dataset ingestion or scraped Surfline assets.
- María's [68-icon manifest](../assets/faro-icon-manifest.json) and [illustration handoff](FARO_MARIA_ICON_BRIEF_68.md) remain canonical. Avoid placeholder emoji and nonfunctional ornaments.

## Regression
- `node --test tests/faro-visual-regression.test.cjs tests/faro-coastal-lens-v4.test.cjs tests/faro-ux-journey.test.cjs`
- Pure source checks and simulated Leaflet map interaction complement, but **do not replace**, browser or iOS screenshot testing.
