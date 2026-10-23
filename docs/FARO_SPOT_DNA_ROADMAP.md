# FARO Spot DNA — evidence-based, spot-specific surf quality

**Status (23 October 2026): research and observation infrastructure, NOT a validated new score.**

## 1. What is already true in the code

`surf-engine.js` calculates quality from modelled wave height, wave period, wave direction, wind direction and wind speed, then subtracts simple precipitation/weather penalties. It currently has **five beach-level height/period heuristics**. The 12 sectors inherit those beach presets; some have different coast-orientation angles. The live Forecast, Best of Week and widget use shared base calculations. The currently displayed "Surf Quality" score has *not* been trained or validated against observed breaking waves.

These existing assumed orientations, height ranges and ideal periods must be audited before being called **spot optimal conditions**. Different catalogue coordinates do not guarantee independent forecast grid cells at ~5 km marine resolution.

## 2. FARO Spot DNA — the real differentiator

**Research hypothesis:** a calibrated, physically informed, observation-corrected model of *rideability* for individual surf spots will outperform today's generic wind/wave heuristic in identifying worthwhile surf sessions in Zeeland.

Proposed core layers:

1. **Offshore sea state (available):** total, wind-wave and swell height/direction/period, peak period, multiple swell trains where data permits. Distinguish wave energy from nearshore breaking height, which cannot be inferred reliably from offshore significant height alone.
2. **Local exposure and geometry (partly documented but unverified):** seaward-facing direction, directional exposure, protective structures, refraction and sandbar mobility. Need chart/bathymetry and evidence review per named beach section.
3. **Wind memory and stability (implementable after validation):** present wind and direction, gusts, previous 3–6 h wind and sea-state evolution, model disagreements. Avoid claiming residual chop was directly observed.
4. **Tide and water level (not implemented):** from a verified nearby Rijkswaterstaat tide gauge and/or a suitable tidal forecast. Store station, datum and station-to-spot limitations. No invented tidal optimum; learn spot-specific behaviour only after observing different tidal phases.
5. **Local human observations (beta capture implemented):** surfed vs observed from shore, ordinal observed rideability 1–5, surface texture and optional short notes. Preserve observation timestamp and any available model *snapshot* captured by Faro during that period. **Forecast values are not beach measurements**.
6. **Calibration and uncertainty (future):** individual spot performance, partial pooling across nearby spots until samples are sufficient, uncertainty separated from expected quality. Avoid adjusting a score upward just because notes are sparse or selecting a high-quality prior without data.

### Separate the outputs

- **Surf Quality:** how rideable the model suggests a spot may be in that time slot. Keep the 0–10 user-facing convention; recalibrate against observations before naming a new version.
- **Evidence / confidence:** whether this estimate has spot-specific verification; source freshness, forecast horizon, model spread, validation coverage. This is **not** a probability of safety or of definitely finding waves.
- **Board Fit:** surfer preference and board compatibility; never feed it into the supposedly objective Surf Quality scale.
- **Worth the trip:** eventually a separate personal decision combining conditions, departure time, travel costs and user's minimum acceptable surf. Never silently present it as physical ocean quality.
- **Safety:** danger/warning statements independent from score. Forecast score cannot clear a beach for entry.

## 3. Source hierarchy and limitations

| Source | Potential observations | Constraints |
|---|---|---|
| Open-Meteo Marine API | Hourly model wave, wind waves, swell components, sea level and currents | Marine model grid around 5 km; nearshore wave and tidal/current estimates are limited; not observed breaking surf |
| KNMI Data Platform | Atmospheric wind measurements and historic series | Stations not at the exact wave face; station exposure and timestamps must be matched |
| Rijkswaterstaat Waterinfo | Measured water levels, waves and water temperature at actual stations | Do not label regional buoy/tide-station data "at Noordduine"; check datum and distance |
| FARO field notes | Optional observations made from shore or in water | Subjective, sparse, selection-biased and currently stored only in the user's browser |
| Licensed surf cameras (future) | Potential observed breakers/sets and shape | Requires rights/permissions, human labeling and site-specific performance validation |

Sources reviewed:
- https://open-meteo.com/en/docs/marine-weather-api
- https://www.rijkswaterstaat.nl/water/waterdata
- https://dataplatform.knmi.nl/
- https://support.surfline.com/hc/en-us/articles/35995874238491-Observation-Clarity
- https://support.surfline.com/hc/en-us/articles/36277684017819-Surf-Ratings-Colors

**Avoid look-ahead bias.** Do not reconstruct a past prediction using today's hindcast and call it what Faro showed a surfer at the time. Store or reconstruct the exact issue/run time where available. Distinguish Open-Meteo Historical Forecast, Previous Runs and Single Runs.

- https://open-meteo.com/en/docs/historical-forecast-api
- https://open-meteo.com/en/docs/previous-runs-api

## 4. Field Notes prototype currently in production

- `faro-spot-dna.js`: a **versioned catalogue** of 12 beach/spot names and existing coordinates/orientations from the application. The source is explicitly marked *unvalidated*. Tide ideal, bathymetric response, historical performance are `null`, not guesses.
- `index.html`: *FARO Field Notes* under the technical disclosures in Forecast. It records spot, timestamp, observation type (in water/shore), observed quality 1–5, surface type and optional note. With recent forecast data and an exactly matching model-hour row, it stores a model snapshot with fetch time separately. No snapshot is created from arbitrary past or future hours.
- Data are stored in browser `localStorage`, max 500 most recent entries, exportable as JSON, with a user-facing deletion control.
- **No shared database or telemetry exists**; no automatic upload, cross-device sync or aggregation; notes do not change the live score. Export before clearing browser data. Never claim otherwise.
- Version 1 is a data format, not a calibrated algorithm. No user email, geolocation or identity is requested by the note form.

### Current spot catalogue (metadata still unverified)

| Beach | Surf spots |
|---|---|
| Domburg | Noordduine, Central beach, West sector |
| Westkapelle | North beach, Central area |
| Oostkapelle | Main beach, West sector |
| Cadzand | Cadzand-Bad, West sector |
| Brouwersdam | North beach, Central beach, South beach |

## 5. Validation design and release gates

**Phase A — audit and baseline**
- Cross-check spot coordinates, directional exposure and existing height/period presets with independent maps and local surf knowledge.
- Backtest baseline score against local reports without retuning; log missing data, false positives and negative missed sessions.
- Verify marine grid differences by coordinate: a 12-spot catalogue need not mean 12 independent sea-state observations.

**Phase B — first observations**
- Record field notes from *both good and poor days*, plus different seasons, conditions and tidal states. If people only log good surf, the calibration will be biased.
- Keep original model snapshots and traceable source/time; anonymous locally exported batches can be inspected with explicit user consent.
- Define observation anchors: 1 means near-unsurfable, 3 mixed but some rideable sections, 5 sustained good rideability, **for that spot**.
- Keep repeat observations, observers and discrepancies separated before any averaging. Do not equate one surfer's score with ground truth.

**Phase C — model engineering**
- Evaluate candidate directional-transfer functions, wind history and tide after data coverage. Use monotonic constraints where physically warranted; allow nonlinear interactions and spot×season effects only with evidence.
- Use regularised or hierarchical models that shrink sparse-spot estimates towards a regional baseline rather than fitting 12 arbitrary sets of weights.
- Pre-register a comparable baseline, a new candidate, and a holdout **by future dates / storms**, not random individual hours.
- Evaluate MAE on observed ordinal quality, ranking of best opportunities (precision@k), missed good sessions, discrimination by spot, confidence reliability and calibration by forecast lead time.
- A pilot gate might require dozens of varied observations per spot to *start* estimating trends; this is not sufficient on its own to claim valid tidal optima or generalisable accuracy.

**Phase D — promote carefully**
- Only replace `qualityComponents` after the new method improves the held-out ranking and calibration without degrading weakly sampled spots.
- Run parallel shadow rankings first, including the widget and Best of Week, and version the algorithm.
- Show plain-language drivers: "lighter cross-offshore wind", "wave direction aligned with beach", "conditions previously checked here" **only if supported by that spot's validated evidence**. Don't disclose raw weights in the UI; in a static GitHub Pages application they remain inspectable.
- Publish site-specific uncertainty/confidence truthfully, and keep critical hazards visible independently.

## 6. FARO colour system after the v13 design review

A score isn't a decorative sports grade. Use **strong ink for reading**, and restraint for condition signals:

- Score quality labels convey `Very poor / Poor / Fair / Good / Excellent`, always in text.
- **Fair:** sunlit sand accent (`#E3BC56` light / `#EAD17A` dark), applied to small signals and label backgrounds, not large brown numerical fields. Warm amber on a pale surface by itself has insufficient non-text contrast and must not be the only selected-state indicator.
- **Selected day/slot:** separate ocean-teal outline (`#176D78` light / `#90D6DC` dark) so selection never falsely implies good quality. Numeric Fair values stay graphite in the light theme.
- **Wave Height:** exclusively ocean blue/cyan; a high wave is not automatically good surf.
- **Danger / caution:** continue independently of the surf grade.
- Accessible semantic labels and sufficient border contrast matter more than maximising colourful panels.

## 7. Immediate next work

1. Confirm all twelve existing spot geometries and source provenance, recording uncertainty and changes to exposed coastlines after storms.
2. Perform actual light/dark iPhone Safari screenshot QA of v13 including long Spanish labels and Field Notes. Source smoke checks are **not** visual QA.
3. Pilot 1–2 spots with repeated surf/shore observations; export anonymised JSON, review before building a central ingestion service.
4. Evaluate tide gauge mapping, offshore-vs-nearshore model skill, wind-history features and confidence.
5. Decide backend/privacy/data consent architecture before launching crowdsourced aggregation or hiding algorithm parameters.

Do **not** claim proprietary prediction accuracy, numerical safety, tide-aware rating, community training or observed breaking wave heights based on the current prototype.
