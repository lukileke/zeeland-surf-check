# FARO v0.4 — Spot Response and Observational Validation

**Status, 29 October 2026:** deployed experimental hypothesis model once CI passes; this is NOT a calibrated nearshore or surf-height model. Contains no invented field observations, camera observations or numerical UV/SHOA integration. User-facing scores are NOT measured probabilities.

## What problem v0.4 addresses

v0.3 combines `Σ Hsᵢ² Tmeanᵢ (0.05 + 0.95 × guideFitᵢ)` with wind. Because the 0.05 residual exposure grows quadratically with offshore wave height, a *huge* swell arriving completely outside a documented break's favourable directions could saturate the energy response and receive a very good score. This was a model-internal consistency error, unrelated to a Surfline comparison.

**Correction:** for each available partition i, compute its offshore energy-like proxy `Eᵢ = Hsᵢ² Tmeanᵢ` and guide compatibility `fᵢ(θ) ∈ [0,1]` from that named spot's source-backed bearings:

- `directionalGuideSupport = Σ(Eᵢ fᵢ) / Σ(Eᵢ)` (0 when no swell energy).
- `directionalSupportFactor = 0.24 + 0.76√(directionalGuideSupport)`.
- `FARO v0.4 = FARO v0.3 pre-rounding × directionalSupportFactor`, with 0–10 display clamping only.

The `0.24` constant is a **heuristic residual uncertainty floor**: its value is not a measured nearshore transmission rate and is not supported by empirical skill. Likewise, the square-root shape is a documented design prior, NOT an inferred local response. It deliberately prevents off-axis energy from masquerading as known good surf while allowing >7.9 for source-aligned strong swell under favourable model wind. It is suitable only as an experimental comparison and should be recalibrated if/when actual observations justify doing so. We do NOT use the empirical-looking term “confidence”.

## How this differs by spot

| Modelled forecast place | Current guide-based incoming swell FROM | Guide-based wind FROM | What we know / do NOT know |
|---|---|---|---|
| La Boca, Concón | 226–355° | 82–199° | River mouth, mobile sandbanks. No surveyed bank, refraction or river-flow data. |
| Ritoque · north | 210–255° | 337.5–22.5° | Specific north sector. Other beach sections are not represented. |
| Reñaca · north | 225–292.5° | 67.5–112.5° | North peaks only, not the whole bay. |
| Maitencillo (general) | 210–255° | 67.5–112.5° | General coast, changing bars; source uncertainty. |
| Ventanas | 337.5–22.5° | 337.5–22.5°, 157.5–202.5° | Single community guide hypothesis, NOT independently verified for Muelle Chico or Pilotes; exact take-offs unknown. Recreational access restriction reported as still in force at 27 October; separate hard safety gate excludes it from actionable picks. |

Angles are **FROM** directions, with circular wrap handled. These are the pre-existing, cited guide-sector parameters, not measured beach-specific optimum surf. The compass supports interpretation but does not simulate local refraction.

## Open-Meteo data-quality improvements

1. Secondary and tertiary swell partitions are accepted only when all three variables (height, period and FROM direction) are finite **at both hours of the two-hour window**. An incomplete half-window is excluded, never imputed as complete.
2. Optional `sea_level_height_msl` is requested as **context only**. Open-Meteo documents a coarse model (~8 km), including tides, atmospheric and other ocean-level terms. Neither observed tide gauge, nautical chart datum nor bank-specific water level. It is **not used in the 0–10 score**.
3. If the provider rejects sea-level with HTTP 400, retry the same requested swell partitions **without only that field**. Only a second HTTP 400 drops all optional marine variables. Primary required variables must always be available and verified.
4. Spot DNA displays directional fraction, number of complete partitions and required model-hour coverage, labelled **model inputs / guide fit, not observed accuracy**. Unknown sea level remains unavailable, not “low tide”.
5. Best window selection uses the model's actual score first, with the earlier guide-based decision priority only as a tie-break after hazard/daylight filtering. This avoids declaring a lower-scoring window “best” while simultaneously marketing the v0.4 index as primary.

## What is physically justified vs not

- `Hs² × Tmean` is only an offshore **energy-like proxy**; true energy flux requires the spectral energy period `Te`, adequate depth and dispersion. Copernicus's `VTM10` is more suitable for wave energy than generic mean period, but is not yet integrated. Do not call the proxy wave power kW/m.
- Squared heights sum by distinct partition rather than simply adding Hs; no physical nearshore breaking heights are inferred.
- Guide angular windows are sourced but may represent distinct breaks within the same beach and are not confirmed by independent observations.
- The modelled sea level does NOT yield a confident tide optimum, safe navigation datum or surf-breaking depth. It does not change the score.
- Current relative FARO 0–10 scores are not comparable in calibrated “surf quality” units across beaches. Within-spot temporal comparison is the appropriate starting point.

Scientific and provider references:
- https://open-meteo.com/en/docs/marine-weather-api (sea-level limitation, variables, spatial resolution)
- https://help.marine.copernicus.eu/en/articles/6175153-how-to-describe-wave-height-period-and-direction-parameters (SWH, Tm-10 energy period, partitions)
- https://www1.eere.energy.gov/water/pdfs/mappingandassessment.pdf (spectral energy and wave power flux)
- https://support.surfline.com/hc/en-us/articles/4410127028251-Dealing-with-Conditions-Differing-from-Forecast (spot-dependent config variance)
- https://support.surfline.com/hc/en-us/articles/35995874238491-Observation-Clarity (observed vs modelled, relative per-spot ratings)

## Testing and objective progression

1. **Numerical regression:** on-guide high energy with light wind can score >7.9; same strong swell far outside a spot's guide range must NOT be rated excellent. Fix existing v0.3 pathology without using any invented measured wave-quality labels.
2. **Wind and energy monotonic checks:** flat ocean never excellent, calm wind largely insensitive to direction, strong adverse wind reduces potential; independent second swell may affect score.
3. **2-hour provenance test:** incomplete optional partitions discarded, no sea-level score effect, coast sea level clearly marked approximate, missing level stays null.
4. **Measured ocean data:** use existing `chile/research/compare-ocean-series.cjs` and the archived forecast issue timestamps to compare genuinely observed SHOA buoy height/period/direction. Never equate Open-Meteo capture time with model issue time.
5. **Coastal transform:** obtain machine-readable UV node data (La Boca/Reñaca/Puerto Ventanas) including source issue/valid UTC and licence. Compare against independent station and existing Open-Meteo first. No numerical UV integration exists.
6. **Real surf verification:** collect time-stamped and geolocated breaking-height and rideability labels (consented manual observations or later authorised cameras), and use held-out dates for MAE and *per-spot* rank concordance. Only then test if v0.4 outperforms v0.3 (and only against Surfline if comparable time/spot forecast snapshots and observed outcomes are licensed and available).

## “Beyond Surfline” — falsifiable, bounded goal

Potential initial differentiators: openly documented source-of-score and individual swell partitions, published coverage limitations, separable user board/skill matching, honest access restrictions, and a reproducible 2-hour forecast archive/validation workflow. We have **not** shown better surf-height prediction than Surfline. A useful benchmark requires *matched issue time, location, sea state, breaking height, surfability outcome, lead time and pre-defined scoring metrics*. No such comparative dataset is available yet.
