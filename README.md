# FARO · Surf Forecast and Chile Research Atlas

FARO helps decide **where and when to surf**, and what kind of session the model suggests. Forecasts are modelled estimates, not measured breaking-wave conditions or a safety clearance.

**Zeeland live forecast:** https://lukileke.github.io/zeeland-surf-check/  
**Chile Valparaíso model forecast (provisional fit):** https://lukileke.github.io/zeeland-surf-check/chile/  
**Chile national research atlas:** https://lukileke.github.io/zeeland-surf-check/chile/atlas.html  
**Chile test lab:** https://lukileke.github.io/zeeland-surf-check/chile/lab.html

## Two geographic modes · one FARO identity

The website presents **ZEELAND · LIVE / CHILE · MODELO**. Zeeland retains its established forecast, KNMI warning links, widget and scoring. Chile now uses the **same core CSS and component hierarchy** and has a **model-fed Valparaíso view** with four source-located pilot beaches (La Boca, Reñaca, Ritoque, Maitencillo): seven days, 2-hour daylight windows, offshore wave/swell/wind data, UV, model-derived FARO VIBE with expanded FARO READ, Spot DNA (previously Spot Insight), experimental Best of Week and FARO Match.

**Important:** Chile's weather/marine inputs are updated numerical model data, but spot-specific **/10 scores are guide-derived compatibility estimates capped at 7.9**, not calibrated breaking-wave quality, and do not certify safety. The current nearshore sampling locations are coastal references (not exact validated surf-bank coordinates). No Chilean official warning status is automatically checked; the small safety disclosure links the Armada, DMC and SENAPRED while independently screening modelled strong wind, rain and thunderstorms. Chile widgets remain deferred. The [regional research atlas](chile/atlas.html) continues to cover 16 regions and 73 candidate places without inventing forecast scores for unconfigured spots.

**Favicon:** both countries use the actual salvavidas/O shape extracted from the official FARO SVG, without a background plate.

## Key features

- Seven-day forecasts with two-hour windows and daylight checks
- Five numeric score-colour bands with the **same colours on light and dark**; FARO VIBE is the visible wave-character tag, and tapping it reveals FARO READ rather than duplicating the interpretation
- FARO Match for optional board/riding-style preferences
- Spot Insight: twelve named FARO sectors, local beach-guide evidence, conservative sector context, official/local source links
- Spot Fit: independently adjustable wind, wave-direction, tide-uncertainty and evidence signals for each sector. [Calibration guide](FARO_SPOT_FIT_GUIDE.md)
- Local Field Notes (stored only on the current device unless explicitly exported)
- Weather-model risk screening and external official-warning references

## iPhone and iPad widgets

**Coastal Editorial v13:** the visual hierarchy is now genuinely different, with a large isolated quality score, a separate blue offshore-model height tile, a segmented five-tone meter, clearer location/time and a dedicated FARO VIBE ribbon. The large WEEK option emphasises alternative daylight sessions.

The `zeeland-widget.js` Scriptable source supports **small square, medium rectangle, large square, iPad extra large, and Lock Screen accessory** layouts with four styles: FLOW, MINIMAL, DATA, and WEEK.

**[Setup and ready-made widget parameters](FARO_WIDGET_SETUP.md)**

**[Forecast 2.0: evidence-based Surfline comparison, swell partitions and tides](FARO_FORECAST_V2_RESEARCH.md)**

**[FARO Swell Compass spec](FARO_SWELL_COMPASS_SPEC.md)** — Chile includes a provisional vector compass with modelled swell/wind vectors, but coastline geometry, satellite basemap and bathymetric transformation remain future milestones.

**Desktop layout:** at 1120 px and wider, all seven days show together; the daily take and two-hour windows share a decision-first row. Tablet/mobile remain stacked. Styles live in [`faro-desktop.css`](faro-desktop.css).

You must replace the code of an existing Scriptable widget script with the current version for the changes to appear on your iPhone; updating this GitHub repository alone does not overwrite a script stored in Scriptable.

## Data integrity

All widgets and website score calculations use `surf-engine.js`. Scores, spot orientation and guide-derived signals are estimates; tidal response, the shape of specific sandbars, permitted access, rip currents and breaking-wave height are **not calibrated at individual FARO sectors**. Local coastal advice must be verified on site.

## Valparaíso · implementation priorities

**P0 done:** Shared Zeeland-derived UI, FARO VIBE → FARO READ, Spot DNA accordion, cross-country navigation, favicon O, model-fed four-spot Chile prototype, 2-hour windows, model UV, wind/rain/thunderstorm threshold screening, official source links, experimental Match and ranking.

**P1 next:** Validate actual live API outputs, sea-grid sampling, daylight logic on Chile DST, local field evidence, official marine/met alerts and SHOA tide integration. [Chile alerts/UV source plan](chile/ALERTAS_UV.md), [La Boca activation gates](chile/LA_BOCA_PILOT_PLAN.md).

**P2:** Pair nearshore UV model with Open-Meteo, calibrate local break observations and scores, add verified bank locations and tide response before calling a score “real quality”, expand beyond Valparaíso, and finally adapt widgets.

[Interactive FARO Lab with editable, NON-live wind/swell input](chile/lab.html) · [Spot DNA source research](chile/VALPARAISO_SPOT_DNA.md) · [pilot score configuration](chile/valparaiso-score.config.json).

## Research registry

[Chile 16-region atlas](chile/atlas.html) · [regional source inventory](chile/README.md) · [field-observation CSV](chile/field-observations-template.csv) · [local validation tests](chile/test-live-forecast.js).

