# FARO Swell Compass · implementation specification v0.2
Date: 2026-10-26 · Status: **Stage A implemented; Stage B partially implemented in Valparaíso**. An optional Leaflet/OSM geolocated map plots documented beach references, real Open-Meteo marine-grid sample coordinates, primary swell travel direction, and typed swell/wind readings. Coastline orientation, camera-linked calibration, bathymetric refraction and surf-bank geometry remain unimplemented.

## Goal
Surface one instantly readable answer: **from where are waves arriving relative to the selected coastline?** This is more useful than a decorative satellite thumbnail. Aim for a coastal-navigation identity distinctive to FARO.

## Visual components
**Stage A · vector compass**, no external map:
- 96–140 px circular true-north compass on mobile, 160–220 px on desktop;
- coastline orientation line only when supported by actual verified coastline bearing; if unknown show a circle alone and “Coast orientation not validated”;
- **total wave** vector clearly labelled `TOTAL WAVE · FROM 302° (WNW)`;
- independent wind vector labelled `WIND · FROM 125° (SE)`, with speed and gust;
- direction of travel is **FROM + 180°**, so a wave travelling toward the SE has a WNW source bearing. Never invert labels or confuse shore-facing with wind direction.
- show selected **time window** and model update provenance, not a frozen generic picture.

**Stage B · geolocated sample map** · partially implemented with Leaflet and OSM, while surveyed coastline geometry remains future work:
- **Current:** Leaflet 1.9.4 and OSM tiles loaded only when the user expands the map; retain OSM attribution and respect tile usage policy. Later consider MapLibre and a licensed production tile provider.
- modest zoom focused on the break (not a map of an arbitrary town centroid);
- **Current:** a swell travel vector at the API-returned offshore marine grid point, with numeric FROM bearing, height and period, not a decorative icon; wind direction read separately in the adjoining compass. Beach pins are documented approximate coastal references, NOT verified surf-bank markers; no shoreline polyline.
- When the marine grid is unavailable use a labelled relative-coordinate schematic or Stage A. No fictional coastline, bathymetry or nearshore rays.
- map is progressively revealed from the forecast; no autoplay animations, no huge heading/banners.

**Stage C · swell partitions** · implemented as numeric model-component readings where data exist; validation/coverage reporting remains incomplete:
- total wave, windsea and primary/secondary/tertiary swells are displayed as individually labelled **model components** with distinct directional glyphs and numeric height/period;
- do NOT sum component heights linearly or call the offshore component "surf height";
- display component model coverage, issue and valid timestamps, missing components as unavailable.

## Canonical data example (STRUCTURE only; numbers are NOT current forecasts)

```json
{
  "country": "NL",
  "spotId": "Zeeland:Domburg:Noordduine",
  "localValidTime": null,
  "coordinateVerified": false,
  "coastFacingDeg": null,
  "directionConvention": "coming_from_true_north_clockwise",
  "offshoreModelPoint": null,
  "totalWave": { "heightM": null, "fromDeg": null, "periodS": null, "sourceVariable": "wave_direction" },
  "primarySwell": { "heightM": null, "fromDeg": null, "periodS": null, "sourceVariable": "swell_wave_direction" },
  "secondarySwell": null,
  "tertiarySwell": null,
  "wind": { "fromDeg": null, "speedKmh": null, "gustKmh": null },
  "provenance": { "modelName": null, "issuedAt": null, "validAt": null, "gridResolutionKm": null }
}
```

## SVG / UI geometry checks
For each FROM bearing θ, a screen arrow indicating direction of TRAVEL has azimuth (θ+180°) mod 360. With screen x-axis right and y-axis down, unit direction is (sin(θ+π), -cos(θ+π)). For a FROM-location annotation, draw the tail at θ and the head at the centre (not the reverse). Independent test vectors: N=0° (travel south), E=90° (travel west), SW=225° (travel NE). UI must explicitly label "from" so direction is not ambiguous.

Use distinct tokens: model waves `--faro-wave`, wind `--faro-quiet`, selected time `--faro-selection`; the 5-band score palette is **not** a legend for wave direction. Danger/coral remains exclusive to alerts.

## Desktop and mobile placement
- Desktop: a compact visual **beside** an updated conditions card, never ahead of the actual forecast and period/height.
- Mobile: optional fold under **Detailed conditions**, no extra page-height burden until opened.
- Widget: Stage A simplified in a LARGE or DATA layout only, possibly an SF Symbol compass; never embed map tile API calls in Scriptable widget.

## Engineering stages / acceptance tests
1. Define a framework-independent `wave-bearing.js` for consistent angle normalisation, FROM vs TO labels and test cases.
2. Implement accessible compass SVG from canonical direction data. When no direction, show a null state (not "0° N").
3. Audit marine API fields: Open-Meteo `wave_direction` is total wave FROM; `swell_wave_direction` is swell FROM. Keep variable labels explicit. Verify marine + atmospheric timestamps.
4. Map tiles and offshore sample location are now wired on Chile; only later include VERIFIED shoreline geometry, productive/licensed tile infrastructure and actual breaking-bank surveys.
5. Validate 0°, 90°, 180°, 270°, 359°, missing values; Spanish/English strings; light/dark and desktop/mobile rendering; reduced-motion and keyboard navigation.
6. Do not compute shoreline sheltering or breaking wave angle purely by rotating the model offshore vector.

### Research links
- [Surfline forecast interface explained](https://support.surfline.com/hc/en-us/articles/13749782983579-Understanding-the-Spot-Forecast-Page-on-the-Surfline-Website)
- [Surfline chart overlays and model context](https://support.surfline.com/hc/en-us/articles/16345467668763-Surfline-Surf-Charts-FAQ)
- [Open-Meteo Marine API / direction definitions](https://open-meteo.com/en/docs/marine-weather-api)
- [MapLibre GL JS docs](https://maplibre.org/maplibre-gl-js/docs/)
