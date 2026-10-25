# FARO · Zeeland Surf Forecast

FARO helps decide **where and when to surf**, and what kind of session the model suggests. Forecasts are modelled estimates, not measured breaking-wave conditions or a safety clearance.

**Live site:** https://lukileke.github.io/zeeland-surf-check/

## Key features

- Seven-day forecasts with two-hour windows and daylight checks
- Five numeric quality colour bands; Wave Wizard describes modelled wave character independently
- FARO Match for optional board/riding-style preferences
- Spot Insight: twelve named FARO sectors, local beach-guide evidence, conservative sector context, official/local source links
- Local Field Notes (stored only on the current device unless explicitly exported)
- Weather-model risk screening and external official-warning references

## iPhone and iPad widgets

The `zeeland-widget.js` Scriptable source supports **small square, medium rectangle, large square, iPad extra large, and Lock Screen accessory** layouts with four styles: FLOW, MINIMAL, DATA, and WEEK.

**[Setup and ready-made widget parameters](FARO_WIDGET_SETUP.md)**

You must replace the code of an existing Scriptable widget script with the current version for the changes to appear on your iPhone; updating this GitHub repository alone does not overwrite a script stored in Scriptable.

## Data integrity

All widgets and website score calculations use `surf-engine.js`. Scores, spot orientation and guide-derived signals are estimates; tidal response, the shape of specific sandbars, permitted access, rip currents and breaking-wave height are **not calibrated at individual FARO sectors**. Local coastal advice must be verified on site.
