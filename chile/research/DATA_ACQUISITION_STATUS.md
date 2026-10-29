# FARO Chile | Ocean-state comparison: operational status
Date: 2026-10-29 · v0.1

## Implemented and running in the website
- Five experimental model locations: La Boca, Reñaca, Ritoque, Maitencillo and Ventanas.
- Ventanas's `FARO Potential 0–10` is a physics-informed, guide-angle based **offshore index**, not observed rideability or nearshore breaking height. Direction ranges for N swell and N/S wind are based on one community guide; Muelle Chico and Pilotes are not separately calibrated.
- **Access gate** (independent of score): Ventanas was reported under restriction due to Portuguese man-of-war on 27 October. No later clearance has been verified. The interface displays this warning, does not show Ventanas in *Best of Week* recommendations, and disables its gear/session recommendation.
- Model provider remains **Open-Meteo**. Numerical UV coastal forecasts and SHOA observations are **not yet ingested**. UI attribution must not imply otherwise.

## Source inventory, verified on 29 October 2026
| Nearshore / observed source | Coverage / link | In FARO now |
|---|---|---|
| UV · Puerto Ventanas CL15QTN03 | https://marejadas.uv.cl/CL15QTN03 · Quintero Bay 20 m | External source link **only** |
| UV · La Boca CL15CCN01 | https://marejadas.uv.cl/CL15CCN01 | External source link **only** |
| UV · Reñaca Norte CL15VAS04 | https://marejadas.uv.cl/CL15VAS04 | External source link **only** |
| SHOA CENDHOC oleaje | https://cendhoc.shoa.cl/ddoleaje_get | Official request portal **only** |
| SHOA shared wave archive | https://shoabucket.s3.amazonaws.com/shoa.cl/datos/oleaje/OLEAJE.zip | Public announced archive, **not inspected/imported** |

The university confirms 7-day forecasts at ~20 m; its currently exposed webpage provides plots / graphics, not a documented, authenticated or licence-cleared numerical API. **Do not scrape plots and call them measured observations.** Contact marejadas@uv.cl to request machine-readable Hs, periods, FROM directions, model issue UTC, valid UTC, site coordinates, depth and reuse terms.

SHOA provides instrumental observations and an academic/scientific request process: https://cendhoc.shoa.cl/solicitudes. Ask for correct buoy near central Valparaíso/Quintero with station coordinates/depth, original UTC timestamps, quality flags, Hs, spectral period definition (Tp, Tm01, Tm02, Te), FROM convention and terms. If granted, import by an explicit normalisation step preserving raw source and QC flags; do not assume a downloaded historical event represents current conditions.

## Tools committed here
- `node chile/research/capture-open-meteo.cjs coastal-archive`: actual Open-Meteo raw model archive for 5 spots; includes capturedAtUtc, actual grid coordinates, all model arrays and SHA256 receipt; **capture time is not model issue time**.
- Manual GitHub Actions workflow `FARO Chile - capture raw coastal forecast models` can produce 14-day run artifacts. It is deliberately *not* scheduled automatically until API usage/licensing and storage/retention policy have been reviewed.
- `node chile/research/compare-ocean-series.cjs forecast.csv observations.csv`: strict UTC station-matched marine-state comparison, returning MAE, RMSE, bias for Hs and period and circular FROM-direction errors. Forecast issuedAtUtc is mandatory; do not substitute unknown source issue times without explicitly recording archive capture date as a surrogate.
- `node chile/research/test-compare-ocean-series.cjs`: synthetic fixture, **NOT** measured skill.

### Input schema for normalised numerical series
`stationId,source,issuedAtUtc,validAtUtc,heightM,periodS,directionFromDeg`

Rows must use UTC timestamps ending in Z, marine *significant* height in m, period in s (definition must be explicitly consistent), FROM wave direction in degrees [0,360), source/station identity grounded by metrological metadata. For observations issuedAtUtc is empty. Source-specific nomenclature is **not** automatically equivalent; compare Tm with Tm, Tp with Tp, and reject mixed definitions.

**No published error numbers or reliability probabilities are presently justified.** A second model agreement score is not calibration. Neither UV coastal Hs nor an offshore SHOA buoy measures the quality of a surfable breaking wave at Pilotes.

## Actual next data gate
1. Obtain UV machine-readable output legally and define model issue and valid timestamps, coordinates and period definitions.
2. Obtain a geographically appropriate quality-controlled SHOA observation series.
3. Verify distance/depth/direction conventions and period comparability.
4. Archive as-issued Open-Meteo (and UV if granted) against valid times; compare out-of-sample independent days/events rather than correlated adjacent hours.
5. **Only then** report observed ocean-state errors and decide whether UV improves modelled coastal input. Do not reweight the surf score to fit nonexistent wave-quality observations.
