# FARO Chile · Beach Focus & Incident Vectors

27 October 2026

## Recoverable baseline
- Before changes: `backup/faro-beach-focus-before-2026-10-27`
- Work: `feature/faro-beach-focus-vectors-2026-10-27`
- Rollback: revert sprint PR, no force-push and no history rewriting.

## Behaviour and information architecture
1. **Selected beach first**. On choosing La Boca / Reñaca / Ritoque / Maitencillo, Leaflet centres the exact existing **coastal reference** and sets zoom **14 on compact screens** or **15 on desktop**. It does not automatically fit distant marine grid points.
2. **Regional context on demand**. The former fit button now toggles `Ver región / Volver a la playa`. Regional view fits the coastal reference plus actual marine/atmospheric model cells within 60 km. Original grid markers and point popups are visible only in regional context. Clicking another beach always returns to its local beach view.
3. **Two anchored incident vectors**. A single, compact north-up SVG DivIcon anchored at the currently selected beach reference renders the offshore model's **primary swell travel bearing** and **wind travel bearing**. Swell receives the heavier 5 px stroke; wind a lighter 3.3 px one, with staggered endpoints to avoid crossing. They change when user switches spot, hour or Combined / Swell / Wind layer. The tip is positioned near the beach reference **symbolically** rather than solving a physical wave path.
4. **Colour means guide-angle match, not surf quality**. Each vector and its accompanying quick-read card reflect `guideClass()` against that beach's distinct sourced `waveFromDeg` and `windFromDeg` sectors:
   - green: inside guide angle sector
   - yellow/ochre: within 25° of guide sector
   - coral: outside
   - blue-grey: no assessed guide
   - red caution: wind speed ≥ 30 km/h even if direction meets guide
5. **Explicit oceanographic limitation**. Direction vectors are `FROM+180°`, north-up, and **do not model shoaling, refraction, bank layout, coastal shelter, local wave height or actual measured breaking surf**. Wind speed caution threshold is a deliberately conservative UI heuristic, not a scientific universal onshore/wind-quality standard.
6. **Readability and access**. Model grid provenance, partitioned swell and atmospheric values remain in the existing technical details. No camera feeds or training material are downloaded or fabricated.
7. **María**. The beach SVG arrows are provisional, programmatically rotated/coloured. María's final SVG artwork can replace the geometry without changing the map data architecture. See `assets/faro-icon-manifest.json` and the previously supplied PDF brief.

## Checks executed
- 28/28 source and pure-function regression assertions passed including first/wrap-around angular sectors, wind caution, local vector placement, selected beach zoom, and correct asset versions.
- JavaScript parsing and CSS bracket matching passed.
- Mock Leaflet interactive simulation: beach A → beach B automatically centred at zoom 14; later hour changes preserved zoom; Regional zoom fitted actual model points; returning to Beach refocused the chosen shore.
- **Not completed**: actual Safari iOS/Chrome screenshot QA, colour contrast audit on the live OSM tile background, GitHub Pages deployment confirmation, local wave-model validation.

## Source design principles
- Leaflet DivIcon, iconAnchor, markers and setView: https://leafletjs.com/reference
- Surfline Spot Forecast help (local guides and collapsible advanced data): https://support.surfline.com/hc/en-us/articles/13749782983579-Understanding-the-Spot-Forecast-Page-on-the-Surfline-Website
- Mapbox colour, hierarchy, density and legibility: https://www.mapbox.com/insights/map-design-process
