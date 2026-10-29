# FARO | Model Accuracy Programme: Surfline/LOTUS benchmark & coastal upgrade
**Version:** design v0.4 (no model changes in this PR)
**Date:** 2026-10-29
**Current production baseline:** FARO offshore-potential v0.3 (4 experimental Chile pilots; Ventanas is unscored research-only)
**Status:** engineering research / implementation specification; NO accuracy improvement claimed.

## 1. Evidence-based competitor benchmark

Surfline LOTUS is built using WAVEWATCH III-derived global wave modelling, nearshore transformation with bathymetry and spot-level setup, and a large historical/observational feedback system (forecasters, buoys, satellites and Smart Cams). The formula and data pipelines are proprietary; public documentation does not allow reverse-engineering its actual coefficients.

**Important distinctions:**
- Surfline's **automatic model ratings** currently account primarily for breaking-wave height and wind, displayed as five bars (Very Poor to Fair-to-Good). It explicitly says these are mainly useful for **comparing different times at the same spot**, and can omit tide/wave shape. Human forecasters can override with observed Good/Epic.
- Ratings are **relative to local potential**. A Fair at Pipeline cannot be directly equated with a Fair at an arbitrary beachbreak.
- The **Wave Consistency** product uses a modelled count of waves exceeding a spot-related height threshold. It is NOT the same as surf quality, and FARO cannot infer an equivalent wave-count distribution from bulk 2-h Hs/Tmean summaries.
- When cameras or observations are missing, Surfline says its model ratings may use relatively simple height-plus-wind logic. FARO can compete on transparency and decision usefulness before it can compete on absolute surf-height accuracy.
- Surfline reports improved model skill after comparison with observations (some publicly described cases); we must not substitute its improvement percentages for FARO accuracy.

### References (provider)
https://support.surfline.com/hc/en-us/articles/4410495359643-What-is-LOTUS
https://www.surfline.com/lp/whatsnew/features/lotus-swell-model
https://support.surfline.com/hc/en-us/articles/35995874238491-Observation-Clarity
https://support.surfline.com/hc/en-us/articles/36277684017819-Surf-Ratings-Colors
https://support.surfline.com/hc/en-us/articles/20350539606683-Wave-Consistency
https://www.surfline.com/lp/whatsnew/forecast-performance-updates

## 2. What FARO v0.3 does, and does not do

**Live inputs:** Open-Meteo sea-cell primary/optional secondary/tertiary swell partitions, Hs and modelled mean periods/directions; total and windsea Hs; matching wind fields; four different guide-azimuth profiles. Each score requires two aligned hours of mandatory marine/weather data.

**Core proxy:** `E* = Σ Hs_i² · Tmean_i · guideExposure_i`, then a heuristic nonlinear transformation to a **0–10 offshore-potential index** with intensity-sensitive wind and modest independent windsea/crossing adjustments. The mean period is NOT necessarily spectral energy period Te; therefore E* is not measured wave power. Modelled ocean height is NOT the breaking-wave height. Directional guide bounds are NOT calculated from nearshore physics.

**Not yet supported:** survey-grade bathymetry, per-break slope, measured refraction/shoaling, harbour diffraction, beachbar state, tide- and river-flow-dependent break morphology, verified local surf heights, observed wave-count distribution, cross-spot empirical normalisation, independent skill metrics or calibrated confidence intervals.

**Non-negotiables:** never sum total Hs with partitioned Hs; no fake missing partitions; preserve FROM-bearing convention; honour time zones, daylight, public access restrictions; Ventanas remains unscored until access and local setup are verified.

## 3. Model pipeline — proposed v0.4/v1

`Ocean forecast(s) → timestamp/units/provenance QC → independent swell spectra/partitions → nearshore transformation → break geometry + water-level modelling → potential/rideability model → user board/skill preference (separate) → accessible UX with traceable evidence + uncalibrated status → observed verification feedback`

### A. Physical coastal layer (highest impact for actual accuracy)
1. For two reference pilot spots (La Boca, Reñaca), verify Universidad de Valparaíso 20-m nearshore forecast feeds and site coordinates; compare these **against** existing Open-Meteo sea cells. UV is NOT yet integrated into FARO. Confirm redistribution / access conditions before automating.
2. Read provider issue times and valid times. Archive both in UTC; no look-ahead leakage (do not compare a revised forecast issued after an observation to the original forecast).
3. Source GEBCO_2025 coarse bathymetry (15 arc-second) only for **regional** context; inspect source/TID quality and coastline coverage. Do not infer surf-break slope or sandbars from this 400–500-m-class grid.
4. If good local bathymetry is available with appropriate licence, test a nested **SWAN** model with open-boundary spectra (not just Hs/mean direction): shoaling, refraction, whitecapping, bottom friction, depth-induced breaking and tide/current interaction. Keep a verification hold-out, baseline comparison and boundary/mesh sensitivity tests.
5. Only publish predicted **breaking surf height** if independently tested against real local height measurements. If not, publish 'Offshore wave height' and 'nearshore potential' separately.

### B. Independent forecast sources and data quality
- Open-Meteo sea grid nominally ~5 km: source fields are NWP outputs, **not observed breakers**.
- Copernicus `GLOBAL_ANALYSISFORECAST_WAV_001_027` (~1/12°) gives an alternative wave-model provenance and 3-hourly forecasts / partitioned swells. Check whether this and Open-Meteo share underlying inputs/models before calling it an independent ensemble.
- SHOA publishes some real buoy spectral observations and Chilean tide station data. Map actual buoy IDs, spatial coverage, record dates, quality flags and licence. These can validate **marine model wave variables**, but NOT beach-specific rideability.
- Chilean tidal stations (SHOA CENDHOC) can validate sea-level predictions with datum harmonisation and local residuals. Never score local tide response based only on a regional tide stage.
- Track missing data, grid distance, issue latency, optional-partition coverage and forecast horizon. These are **coverage/quality indicators**, not empirical accuracy.

### C. Score / decision separation
**Primary user-facing number:** `FARO Potential 0–10` only as model output; use consistent 2-h time windows.

**Separate and optional diagnostics:**
- `Ocean energy`: exposed direction-weighted offshore swell Hs²·Tmean by partition; relative proxy.
- `Wind compatibility`: direction/speed/gust, with calm-wind exception.
- `Surface organisation`: windsea/cross-swells flagged as heuristic, never asserted as observed surf shape.
- `Reliability`: data completeness, provenance, lead time, spatial mismatch and (later) model disagreement. Use **categorical data reliability** until measured verification justifies empirical probability intervals.
- `FARO Match`: board, skill, style and intended session; personal preference, **not a substitute for safety or underlying wave quality**.
- `Public restrictions / hazard context`: independent gating; 9/10 potential must NEVER override an official restriction.
- `Wave consistency`: mark **unknown** unless spectral distribution and spot threshold can be responsibly estimated; do not fake based on Hs alone.

**Cross-spot comparison:** keep explicit disclaimer that numerically larger unvalidated index ≠ empirically better beach. Week picks are candidate windows, not a statistically validated league table. Eventually normalise per-spot using a verified seasonal climatology and, separately, calibrate to observed breaking surf or verified surfability. Only then quantify across-spot ranking skill.

### D. User reading model (compact, decision-first)
**At top:** spot, selected 2-h window, **one** potential score, the top 1–2 causal/model limitations in plain language, and a provenance label ('Experimental model'). No additional oversized duplicate score panel.

**Secondary action:** 'Why this score?' with partition energy, wind, direction fits and any missing inputs; show a counterfactual explanation only if all needed terms are present, labelled a **model scenario**, not a forecast.

**Expanded:** map and swell compass, nearshore quality / input source, tide metadata, model agreement, data and warnings. User can choose gear preference without changing physical conditions.

**Do NOT create an arbitrary numerical reliability percentage** without measured skill. Show 'Observed: none / Buoy verified: ... / Camera calibrated: none' truthfully.

## 4. Implementation milestones and acceptance gates

### Milestone 0 — data provenance, no algorithm redesign
- Add UTC forecast-issued/valid timestamps and provenance to archived snapshots.
- Verify 2-hour completeness, missing partition behaviour, physical unit checks and source reliability metadata.
- Report coverage grade (complete/partial/unavailable), not '90% accurate'.
- **Acceptance:** no NaN or fabricated zeros; reproducible snapshots; DST-safe; model scores are versioned.

### Milestone 1 — independent data comparison without cameras
- Pilot La Boca and Reñaca: compare Open-Meteo, UV 20-m nearshore source where licensed/available and suitable SHOA buoy (where geographically valid).
- Quantify errors in *measurable marine variables*: MAE/RMSE/bias for Hs; circular error in wave-from degrees; period errors; event arrival offsets; performance as a function of lead time.
- Time-split train/verification: compare against persistence and current v0.3 forecast baseline; bootstrap by **independent days/events**, not adjacent correlated hours.
- **Acceptance:** measured score improves on held-out ocean-state metrics before publishing stronger claims. If not, keep baseline.

### Milestone 2 — local physics
- Verify bathymetry resolution, vertical datums and surf-sector coordinates.
- Use physically supported refraction/shoaling (nested SWAN/nearshore model), with tidal water-level boundaries if valid.
- **Acceptance:** measured better nearshore conditions against independent station/field observation; no 'breaking wave height' without breaking-wave observations.

### Milestone 3 — surfability and personal preferences
- Record low-friction field feedback and authorised videos/cameras only when available; label source and time. Do not train on subjective user opinion as though it were measured height.
- Distinguish 3 targets: offshore Hs skill, breaking-wave height skill, surfer's rideability/pleasure label. Evaluate them separately.
- Fit spot-by-season effects only if evidence supports them. Evaluate across a chronological, untouched hold-out.
- **Acceptance:** calibration plots, uncertainty intervals, cohort-specific metrics and a comparison against a simple baseline.

## 5. Biggest risks
1. An elaborate weighting formula is **not** evidence of improved accuracy. No further coefficient tweaking just because screenshots look too green.
2. The UV 20-m product is nearshore, **not automatically a beach-break forecast**. Never represent integration until access, coordinate and source contract are verified.
3. Without an independent observation we cannot quantify true accuracy of surf quality. Disagreement of two highly correlated models is not a calibrated confidence bound.
4. GEBCO is too coarse for individual shifting sandbars; avoid manufacturing a 'bathymetry correction' from a beach-centre point.
5. High scores can coexist with dangerous currents, pollution, vessel restrictions or restrictions on water access. Keep safety separately modelled and external warnings independent.
6. 'Beyond Surfline' is realistic initially in **auditable science, personal fit, transparent provenance and actionable explanations**, not in proven global breaking-wave height skill.

## 6. Verified public research/source endpoints (access still to verify)
- Surfline LOTUS method: https://www.surfline.com/lp/whatsnew/features/lotus-swell-model
- Surfline rating interpretation: https://support.surfline.com/hc/en-us/articles/35995874238491-Observation-Clarity
- Surfline consistency: https://support.surfline.com/hc/en-us/articles/20350539606683-Wave-Consistency
- Surfline performance methodology: https://www.surfline.com/lp/whatsnew/forecast-performance-updates
- Open-Meteo marine: https://open-meteo.com/en/docs/marine-weather-api
- University of Valparaíso, Quintero Bay: https://marejadas.uv.cl/sinicio/pronosticos-bahia-de-quintero
- SHOA publicly announced wave archive: https://www.armada.cl/tecnologia-al-servicio-de-la-navegacion-shoa-monitorea-oleaje-en-tiempo
- SHOA/CHILE CENDHOC sea-level station data: https://cendhoc.shoa.cl/ddenm_get
- Copernicus Global Ocean Waves: https://data.marine.copernicus.eu/product/GLOBAL_ANALYSISFORECAST_WAV_001_027/description
- Copernicus interpretation of spectral variables: https://help.marine.copernicus.eu/en/articles/6175153-how-to-describe-wave-height-period-and-direction-parameters
- GEBCO_2025 grid: https://www.gebco.net/data-products-gridded-bathymetry-data/gebco2025-grid
- SWAN documented physics: https://swanmodel.sourceforge.io/features/features.htm
