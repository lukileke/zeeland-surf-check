# FARO · Surf Forecast and Chile Research Atlas

FARO helps decide **where and when to surf**, and what kind of session the model suggests. Forecasts are modelled estimates, not measured breaking-wave conditions or a safety clearance.

**Zeeland live forecast:** https://lukileke.github.io/zeeland-surf-check/  
**Chile research beta:** https://lukileke.github.io/zeeland-surf-check/chile/  
**Chile test lab:** https://lukileke.github.io/zeeland-surf-check/chile/lab.html

## Two geographic modes

The main website now has a **ZEELAND · LIVE / CHILE · BETA** region switch. Zeeland continues to fetch real-time *model updates* from Open-Meteo (not measured beach waves) with its own KNMI warning links. Chile is a **separate browseable research atlas** for 16 regions and 73 candidate spots, with five source-derived Valparaíso experimental profiles. Chile does **not** issue current model forecasts, real-time ranks, official alerts or public safety clearance. The country selection is available without mixing countries' data and caches.

## Key features

- Seven-day forecasts with two-hour windows and daylight checks
- Five numeric quality colour bands; Wave Wizard describes modelled wave character independently
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

**[FARO Swell Compass: next-stage visualisation spec](FARO_SWELL_COMPASS_SPEC.md)** — direction FROM, verified coastline geometry, swell partition semantics and eventual geolocated map. Not yet implemented.

**Desktop layout:** at 1120 px and wider, all seven days show together; the daily take and two-hour windows share a decision-first row. Tablet/mobile remain stacked. Styles live in [`faro-desktop.css`](faro-desktop.css).

You must replace the code of an existing Scriptable widget script with the current version for the changes to appear on your iPhone; updating this GitHub repository alone does not overwrite a script stored in Scriptable.

## Data integrity

All widgets and website score calculations use `surf-engine.js`. Scores, spot orientation and guide-derived signals are estimates; tidal response, the shape of specific sandbars, permitted access, rip currents and breaking-wave height are **not calibrated at individual FARO sectors**. Local coastal advice must be verified on site.

## Valparaíso surf research pilot

[Interactive FARO Lab — La Boca, Ritoque, Reñaca, Maitencillo, Papagayo](chile/lab.html) · [local Spot DNA and scientific limitations](chile/VALPARAISO_SPOT_DNA.md) · [editable local scoring profiles](chile/valparaiso-score.config.json).

This experiment deliberately does **not** publish live Chile forecasts or use Zeeland's scoring coefficients. It displays source-backed directional compatibility and a capped provisional index until field validation.

## Chile research atlas (not live)

[Chile regional catalog](chile/README.md) · [**La Boca pilot: activation gates and observation plan**](chile/LA_BOCA_PILOT_PLAN.md) — **16 regions and an initial source-traced surf spot inventory**, with cautious fields for break type, wind/swell, tide, risks, timezone, confidence and later calibration. Chile forecasting and Chile-specific alerts are deliberately **disabled** until independently checked. [Implementation roadmap](chile/IMPLEMENTATION_ROADMAP.md).
