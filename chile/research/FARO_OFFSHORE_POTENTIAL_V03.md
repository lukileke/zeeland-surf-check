# FARO Chile · Offshore Surf-Potential Index v0.3

**Status:** physics-informed, heuristic transformation; **not field-calibrated**. Date: 29 October 2026.

## Purpose and meaningful distinction

This index estimates the *potential of the modelled offshore sea state for a particular guide-described spot*. It is not a predicted breaking height, an observed wave-quality rating, a probability, or a water-safety assessment. It is not Surfline's LOTUS model. FARO presently uses Open-Meteo wave/weather grids and published directional *guide sectors* for its four experimental Valparaíso pilots; it has no actual nearshore wave transformation, measured banks or licensed camera observations.

## Inputs

For each aligned two-hour slot (requiring both model hours):
- Primary swell height `Hs` (m), period `Tm` (s) and incoming direction **FROM** (degrees).
- If delivered with **all three valid values**, optional secondary and tertiary swell partitions with the same fields. If absent, do not invent or impute them.
- Wind speed and **FROM** direction; maximum forecast gust where provided.
- Optional *separate* windsea significant height (m), used as a small surface-chop adjustment, not as an additional swell.
- Per-spot published **wind** and **swell** direction-sector guide priors (no bathymetric factors are inferred).
- Total `wave_height` is displayed as a marine condition, **never summed** with its swell/windsea partitions to generate the score.

### What is established physics?

Deep-water wave-power flux per unit crest can be expressed approximately as `P ≈ (rho g² / (64π)) Hs² Te` with **energy period `Te`**, not any arbitrary period. Surf forecasting input from Open-Meteo here uses **modelled mean swell periods**, which are NOT generally `Te`. FARO therefore uses only a dimensionless, relative **energy-like proxy** `E* = Σ Hs_i² × Tmean_i × exposure_i`, with units m²·s, and **does not label it kW/m or actual wave-power flux**. Windsea is not added as primary surf energy. The source wave heights are significant wave heights rather than breaking-wave estimates. Wave partitions contribute by squared height rather than summing their heights.

Sources:
- USGS climatology: https://cmgds.er.usgs.gov/catalog/whcmsc/SB_data_release/DR_P9HJ0JIQ/Climatological_Wave_Height_Period_Power_HSOFS.faq.html
- Copernicus separation of windsea/swell and squared-height relation: https://help.marine.copernicus.eu/en/articles/6175153-how-to-describe-wave-height-period-and-direction-parameters
- Open-Meteo available marine variables, reference limitations and directions FROM: https://open-meteo.com/en/docs/marine-weather-api
- Surfline states its spot-specific ratings and adjustments can depend on bathymetry, webcams, manual validation and setup: https://www.surfline.com/lp/whatsnew/features/lotus-swell-model

### What is heuristic / unknown?

The conversion of `E*` into a user-facing 0–10 index is **explicitly heuristic** and has not been fitted to real surf:
- Each partition directional `fit_i` uses guide ranges and a 50° angular shoulder. `exposure_i = 0.05 + 0.95 fit_i`. The 5% residual is a tiny hypothesis floor, **not a refraction coefficient**.
- `energyResponse = 1-exp(-E*/12)`. The 12 m²·s response scale is a declared design parameter, not an inferred local threshold.
- `energyGate = clamp(E*/2.4,0,1)^0.8`; ensures flat or tiny swells cannot gain a high score solely from light wind.
- Wind strength uses bounded continuous piecewise thresholds (8/18/32 km/h; strong gust penalty from 55 km/h). **Direction matters increasingly above 4 km/h**, until fully weighted at 18 km/h, so essentially calm conditions are not penalised for a misleading compass bearing.
- `windQuality = windStrength × [1 - 0.65 × windDirectionWeight × (1-guideWindFit)]`.
- `windSeaModifier = 1 - 0.12 × [Hwindsea²/(ΣHs_swell²+Hwindsea²)] × clamp(windKmh/20,0,1)`. This small penalty is **not** an observed chop measurement, nor added windsea energy.
- `crossingModifier = 1 - 0.08 × (1 - R)`, where `R` is the resultant length of incoming swell directions weighted by their squared significant heights. This is a cautious cross-swell uncertainty heuristic, **not** a computed interference field or closeout probability.
- `Score = round_0.1(10 × energyGate × [0.76×energyResponse + 0.24×windQuality] × windSeaModifier × crossingModifier)`, clamped at 0–10 **only as the display range**. No artificial 7.9 cap is imposed.
- All constants are declared in `valparaiso-score.config.json`, not secretly adjusted to fit today's weather.
- **Tide is excluded** until valid nearshore tidal datum and bank-specific observations are available. No point-scoring bonus for unvalidated tide folklore.
- Data-source error and spatial-grid distance remain separate forecast-model caveats; we make **no statistical confidence interval** without independent observed outcomes.

## Scientific caveats and future work

1. The score can exceed 7.9 and approach 10; a 9/10 is **not 90% confidence, 90% wave quality or predicted 9/10 breaking surf**.
2. This approach only partly differentiates spots: guide swell/wind direction ranges differ; **there is no site-specific refraction, shoaling, sediment morphology or reliable surf height estimate**. A common offshore grid cell can still produce similar indices at nearby beaches.
3. Do not use it as an access approval, to forecast currents or to override public restrictions. **Ventanas remains unscored** while the reported recreational-use restriction has not been verified lifted and break coordinates and observations are absent.
4. For future calibration, archive issued forecasts with valid-time offsets and geolocated observations; obtain per-spot tide and observed rideability/wave forms with permissions. Use chronological hold-out and compare to simpler directional baselines. Optimise declared heuristic coefficients only on training days; test on independent days/seasons. Do not fit to synthetic outcomes.
5. No camera access is required to **publish a clearly labelled experimental index**. It *is* required (or comparable independent field observation) to substantiate predictive surf quality/accuracy at a given breaking spot.

