# FARO: scalable spot scoring, diagnosis and evidence-gated learning
Updated 2026-10-29 · implemented on branch for Chile FARO v0.4 + research-only calibration comparison

## What actually improved in the code
- Removed the redundant "Map & Swell Compass" teaser followed by duplicate map and compass accordions. One responsive ocean reader now switches **Map | Compass** using the existing source-driven components; no recoding or fake map layers.
- Replaced Ventanas's sprawling open-by-default notice with a compact, accessible disclosure. It states **reported** restriction with date and unverified present status, *not* a live official government alert. Regional map pin and fallback georeferenced schematic show a small warning mark. The restriction continues to block actionable Best-of-Week and gear recommendations independently of the numerical potential.
- Spot DNA adds physically interpretable **deepwater wavelength** approximated by `gTmean²/(2π)`, steepness proxy `Hs/L0`, and optional angular separation of secondary swell. Bulk mean period cannot represent an entire spectrum or guarantee wave form at the break. Not a breaking-wave model, hazardous set model, or actual wavelength measurement.
- When available, Open-Meteo's `ocean_current_velocity` and `ocean_current_direction` are reported as **coarse (~8 km) ocean circulation**, velocity in km/h and **TO** bearing, never local rip currents or surfing access advice. Missing hours yield null; the score does not incorporate these fields. The optional-data HTTP 400 fallback preserves independent swell partition coverage if currents are unavailable. Coarse sea level remains unscored and non-navigational.
- Added `spot-doctor.cjs`: validates source references, guide angles, coordinate provenance and status on all active pilots; emits an explicitly unscored/unlocated candidate draft. Designed for adding Chile regions/spots without pretending modelled ocean cells are surveyed take-off coordinates.
- Extended the **existing**, legally reviewed offline `calibrate-observations.cjs` lab to compare future held-out, reviewed rideability observations with a *frozen* FARO v0.4 numerical baseline (predetermined 1–5 mapping), in addition to simple constant and ridge baselines. Does NOT train on its own scores as labels; research-only, zero auto-deployment.

## Input ontology and rules for expansion

| Domain | From source | Used by live score? | Research/validation gate |
|---|---|---|---|
| Primary/secondary/tertiary swell, Hs Tmean FROM | Open-Meteo marine; complete 2-h partitions only | **Yes**: relative `ΣHs²·Tmean` and guide support | Mean period is not `Te`; verify marine heights/periods with buoy |
| Wind mean/direction FROM, gust | Open-Meteo atmosphere | **Yes**: speed-sensitive wind fit | Local bay sheltering unvalidated |
| Separate windsea Hs and crossing-swell orientation | Open-Meteo marine | **Small bounded heuristic modifiers** | Does not predict peeling/closeouts or face texture |
| Sea level MSL, tide | Open-Meteo (~8 km) | **No** | Local mareograph datum + observed spot-specific tide response |
| Current velocity and flow TO direction | Open-Meteo (~8 km) | **No** | NOT a surf rip current or hazardous-channel prediction |
| Banks/sandbars, bathymetry, river mouth, cliff sheltering, surf sector | Published guides and local geomorphology | **Only guide wind/swell sectors**, not wave-breaking geometry | GPS/survey/observed break and season/bank evolution |
| Water quality, wildlife, maritime restrictions | Official authorities where verifiable | **Independent access gate**, never numerical quality bonus | Currently manually checked; no claim of live official sync |
| Cameras / manual observations | **Not present** at Chile breaks | **No live auto-training** | Consent/rights, quality review, matched issued forecasts, chronological holdout |

### Why we cannot just add 'sandbank correction' or 'rip current index'
The nearshore equation needs sea-bottom shape and local water level to estimate shoaling/refraction/closure. Sandbars migrate in rivers and alongshore sediment systems. A guide's mention of a bank is not a measured bar depth/profile. Rip currents are local surf-zone circulation shaped by breaking waves, channels and temporal water level; coarse Open-Meteo 8-km current vectors cannot resolve them. We store **unknown** rather than a fake estimate. Using rough inferred numbers in a 0–10 score would *decrease* scientific trustworthiness.

Physics/background:
- Open-Meteo marine inputs and caveats: https://open-meteo.com/en/docs/marine-weather-api
- NDBC sea/swell spectrum partitioning: https://www.ndbc.noaa.gov/faq/windsea.shtml
- NDBC offshore steepness method: https://www.ndbc.noaa.gov/faq/algorithm.shtml
- WMO guide: https://www.imgw.pl/sites/default/files/2021-06/guidetowave-analysisandforecasting.pdf
- Surfline automated model ratings: https://support.surfline.com/hc/en-us/articles/35995874238491-Observation-Clarity

## Honest online learning stages (implemented interfaces, missing observations)
1. **Stage 0: score-only with documented directional guide**. Five Chile pilots active; Ventanas reported restriction continues to block actionable picks.
2. **Stage 1: raw forecast provenance** via `capture-open-meteo.cjs`, manual GitHub Actions; source archive timestamp **NOT** model run issue time. Existing `compare-ocean-series.cjs` compares to quality-controlled, station-correct SHOA/UV measurements *when real numerical files become available*. No measured skill exists today.
3. **Stage 2: human-reviewed field observations** with forecast features recorded **before** field report. Existing calibration lab rejects absent legal rights, insufficient window, invalid/late timestamps, missing source, duplicate IDs and short observation windows. Requires >=60 samples and >=15 independent 3-day groups by default, but these are only minimum research feasibility gates, NOT automatic evidence of generalisability.
4. **Stage 3: frozen-baseline comparison** now additionally compares hold-out MAE against FARO v0.4, using a transparent fixed transformation `1+0.4*score` to 1–5 ordinal, labelled only as a benchmark and not a calibrated mapping. Compare also against constant baseline; ridge model still offline.
5. **Stage 4: release promotion** requires verified improvements over baseline on unseen independent future days/seasons and documented access / observation licence plus human approval. There is **no script to merge trained coefficients into live scoring** and it is intentionally not automatic.

### Workflow for a new spot
1. `node chile/research/spot-doctor.cjs --draft CL-VS:spot-slug "Spot name"` to generate a *candidate-only* JSON with unknown/null fields.
2. Collect attributable spot geometry, separate swell and wind FROM guides, tide source and hazard/access evidence. Preserve conflicting guides and source IDs.
3. Add entry to regional atlas, sources ledger, Spot Intelligence and **only after data review** to `valparaiso-score.config.json` and `valparaiso-live.config.json`. If the selected place is a beach centre rather than break take-off, label accordingly. Do not auto-activate the score.
4. `node chile/research/spot-doctor.cjs` detects missing sources, inconsistent identifiers, invalid angles, lack of observational coverage and restrictive access status. Passing structural checks **does not imply field calibration or approval to enter water**.
5. Run model data integrity, physics sensitivity and mobile browser CI. For other Chile regions, create a region-specific profile and ensure the coast-map knows that region's origin/route.

### Required next external data and feasible improvement
- UV university model 20-m nodes for La Boca, Reñaca and Puerto Ventanas: request machine-readable time series with issue UTC, valid UTC, period convention, coordinates, licence. Public web page is not an integrated API.
- SHOA: request/source a matching directional buoy and QC data covering time windows for the coastal zone, verify station placement and depth. It validates **modelled ocean variables**, not actual breaking surf.
- Survey-grade shallow bathymetry/sandbar observations: do not use a 15-arcsecond GEBCO grid to assert individual bank shapes. Later SWAN with boundary spectra, currents and water levels can be tested against nearshore observations.
- Observed surfing outcomes (manual reports or later consented, licensed cameras) for every spot/sector with stable identifiers. Evaluate both FARO 0–10 and a simple physical baseline on untouched future days; report rank agreement, MAE where coherent, uncertainty calibration and expected improvements. A claim of beating Surfline requires a legally usable matched Surfline/observed dataset; none is available.

**No new empirical spot-quality accuracy or percentage is claimed by this work.**
