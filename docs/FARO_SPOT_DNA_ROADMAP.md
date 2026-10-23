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

---


## October 2026: source audit and shadow lab (new)

**Read this before adjusting the production score:** SurfInfo already has static exposure, wind and tidal factors per spot (https://www.surfinfo.nl/bronnen/), so **merely adding hand-tuned per-beach weights is not a unique FARO advantage**. The differentiation hypothesis must be based on prospective forecast archives, independent local observations, versioned experiments and proven transfer to unseen surf sessions.

### Source evidence at beach level (not 12 independent confirmed breaks)

| FARO parent beach | Source-backed candidate patterns | Important gaps and contradictory accounts |
|---|---|---|
| **Domburg** | SE offshore, NW/N/SW directions can work, banks around groynes, substantial tide effects. | Surfline describes low–mid tide in general; Goede Golven distinguishes **N swell mid-to-high** from **SW swell low**; Wompy favours mid tide. Do not infer a single optimum. |
| **Westkapelle** | W/NW swell, generally E–SE wind, wave exposure near dyke and groynes. | SurfInfo suggests mid tide; Wompy says rising/high tide for bigger waves. Need sector-specific shore evidence and safety/access review. |
| **Oostkapelle** | NNW-oriented Duinweg shore (~329° from StrandAlert) with land-wind shelter from S/SE; Berkenbosch guide mentions mid tide. | The Berkenbosch source addresses windsurf/foil and must not automatically determine a shortboard/longboard rideability optimum at FARO's Main Beach or West Sector. |
| **Cadzand** | Boardshortz lists NW swell and E–SE wind as candidate positive indicators, mid/high tide, occasionally SW events. | This is a directory-level hypothesis with limited independent break observations. Wavespot provides live model forecast, not empirical optimum. |
| **Brouwersdam** | North Sea-facing outer coast receives modelled western/northern sea state; public surf sources say opportunities are particular. | Many detailed guides are about kite, foil and windsurf, sometimes sheltered water, and **must not be transferred to paddle surfing**. Sandbanks, currents, access rules and protected zones require local verification. |

Source URLs, research caveats and candidate direction intervals live in `faro-spot-evidence.js`. The corresponding observation module `faro-spot-dna.js` still flags the 12 individual sectors **unvalidated**.

Research references:
- Surfline Domburg: https://www.surfline.com/surf-report/domburg/584204204e65fad6a77095f9/spot-guide
- Goede Golven Domburg (Tobias): https://goedegolven.nl/surfspots/domburg
- Wompy Westkapelle: https://www.wompy.nl/wanneer-surfen/westkapelle
- SurfInfo Westkapelle: https://surfinfo.nl/spots/westkapelle/
- StrandAlert Oostkapelle Duinweg: https://strandalert.nl/nl/strand/oostkapelle-duinweg-veere
- Surfzeeland Berkenbosch (wind/foil-specific): https://www.surfzeeland.nl/spot/oostkapelle-berkenbosch
- Boardshortz surfspot map: https://www.boardshortz.nl/surfen/nederland/surfspots/
- SurfInfo Brouwersdam: https://surfinfo.nl/spots/brouwersdam/
- NKV Brouwersdam (kite discipline only): https://kitesurfvereniging.nl/kitespot/brouwersdam/
- Open-Meteo marine variable definitions: https://open-meteo.com/en/docs/marine-weather-api

### Implemented now

- `faro-spot-evidence.js`: research-backed **beach-level** candidate wind/swell sectors and references. A *shadow-only* feature extractor reports offshore/cross/onshore relationship, wind-gust ratio (when available), and a squared-height swell-mix **proxy** (not wave energy flux), with provenance and missing-data labels.
- The single-spot Forecast now requests separate `swell_wave_height`, `swell_wave_direction`, `swell_wave_period`, `wind_wave_height`, `wind_wave_direction` and `wind_gusts_10m` from Open-Meteo. These optional values **never enter the production Surf Quality scorer**. The 12-spot Best of Week still uses its existing lean base request, so the experimental data does not increase its network payload.
- *FARO Field Notes* expands to show a compact, cited research context, with predicted conditional signals only if model fields exist.
- `faro-dna-validation.js` is a research-only diagnostics library to compare ordinal 1–5 observations with paired, pre-observation 0–10 model values. It excludes forecasts fetched after the user's observation, flags ambiguous autumn DST local times, and computes an **ordinal pairwise ranking concordance**, not a new model score. It requires at least 10 comparable pairs from different dates to show even a pilot diagnostic; this **does not demonstrate validated prediction performance**.
- `tests/faro-smoke.cjs` tests the evidence registry, source labelling, model-feature fallback and validation pairing.
- **No production score adjustment, hidden weighting or community backend has yet been deployed.** All source files on GitHub Pages are publicly inspectable.

### Local knowledge in Chile: preserving the moat ethically

To scale later in Chile, recruit willing local surf schools and regulars with **explicit permission**, rather than scraping private groups, identifying individual surfers on cameras, or publicly disclosing sensitive locations. Collect precise definitions of rideability, break shape, set frequency, tide state (with documented local tide gauge/datum), current direction if measured, board type and observer expertise. Record independent good **and** poor sessions to reduce selection bias.

Credibility requires both quantitative and qualitative validation: compare forecasted top sessions with observed outcomes, evaluate false positives / missed surf, keep holdout periods by storm and season, handle changing sandbars as a drift problem, and show sample sizes and uncertainty. Until sufficient representative observations exist, shrink spot estimates towards a parent-beach or Zeeland prior rather than inventing twelve confident "secret" formulae.

**Product security:** if the trained model is eventually a proprietary asset, move inference and calibration to a controlled backend. GitHub Pages/JavaScript cannot keep coefficients secret; hiding UI weights only hides them visually.

### Colour system v15/v16

Following user feedback, the Fair-only exceptions were removed. **All** score tiers now use semantic numeric ink *and* a low-saturation bordered quality pill. Fair uses a darker golden-olive ink (`#65561E`) on light foam backgrounds and a pale sand fill (`#F7EDCC`); Poor stays coral, Good/Excellent remain green. A selected session/day has **ocean teal** border regardless of its score. The UI explicitly separates Surf Quality from blue Wave Height. This is a UI revision, **not algorithm calibration**.

Source smoke checks pass, including mocked DOM navigation and synthetic model-observation pairing. **Outstanding:** real iPhone Safari light/dark + EN/ES visual checks, practical API response error/fallback tests, source-angle field review with locals, and evaluation against actual logged sessions.
