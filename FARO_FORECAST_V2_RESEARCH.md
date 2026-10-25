# FARO Forecast 2.0 · lessons from Surfline, not a visual copy

Status: **research / design brief**. The active web and scoring engine remain unchanged by this brief.

## What the 25 October 2026 Cadzand Surfline screenshots reveal
The supplied Surfline mobile screens separate:
- surf quality label and marker bars;
- local *surf height range* (e.g. 0.6–1.1 m), with human-size interpretation;
- wind speed, gusts and **relative shore direction** (onshore in the example);
- primary swell height, period and direction (e.g. 1.9 m at 7 s from 285°);
- rotating compass over the coastline;
- tide curve with high/low events and time cursor;
- water temperature and air weather/conditions.

A critical distinction: **surf height at the breaking beach is not offshore significant wave height or the primary swell height**. FARO currently requests model **total wave height** and **mean wave period** for Zeeland and must not relabel these as nearshore surf height or peak swell period. Compare like-for-like model variables only.

## Priority 1: improve FARO's information precision
1. Make the data badge explicit: `MODELLING · OFFSHORE TOTAL WAVE HEIGHT`; show issued/valid timestamps.
2. Add distinct wind (FROM) compass bearing and wave model bearing; do not imply a direction is `offshore` if coastline orientation is unverified.
3. Request Open-Meteo `swell_wave_height`, `swell_wave_period`, `swell_wave_peak_period`, `swell_wave_direction` and optional secondary/tertiary partitions **where coverage exists**, keeping **each model component separate**. Build null-safe displays and independent fallbacks. Do not sum component heights linearly.
4. Optional tide curve only when provider supports local area and reference datum and enough validation. Open-Meteo `sea_level_height_msl` uses a global mean sea level datum, may be unreliable at complex coasts and **is not** an official local tide table. For Chile, study SHOA official predictions.
5. Make model confidence visible when wave-period and orientation conditions are uncertain; confidence should be evidence-driven, not random.

## Priority 2: surf-first decisions (FARO's differentiator)
- **FARO VIBE** = descriptive riding character (mushy, easygoing, punchy, choppy).
- **Surf Quality** = impartial model estimate /10 (separate numeric score).
- **Spot Fit** = directional/local documented compatibility and provenance.
- **FARO Match** = optional subjective board / surfer fit, never a substitute for safety.
- Display `go / maybe / skip` only if travel worthiness is clearly defined and **never** as water-entry safety clearance; time/daylight matter.
- In a progressive disclosure, show why a forecast received its rating: wind fit, period, wave energy, crowding not estimated, tides unknown, hazards.

## Priority 3: coastal visualization
- Build a small **north-true compass** with FROM arrows for swell and wind, orientation-checked against the actual beach; no invented satellite imagery.
- On a chart, compare 2 h windows (already built) with actual tide curve, wave height, wind gust, and daylight once sources are verified.
- Show beach profile icons: reef, point, beachbreak, rivermouth; exact definition tied to field evidence.
- Group local guide notes and user-collected field notes, never confuse field reports with a live beach camera.

## UX design rules
- Use María's spacious day card as the visual baseline.
- No repeated facts in multiple cards; 20–24 px between primary sections.
- Five quality colours (copper→olive) remain reserved for numeric Surf Quality. Risk is coral; selectable controls are blue.
- No large safety advertisement/banner aesthetics; safety is compact, expandable and independently highlighted.
- Keep the OFFSHORE VS BREAKING distinction in the number's **visible label**.
- Disabled/missing data must not be zero, `Poor` or fabricated tide; show `not available` instead.
- Mobile readability first, no horizontal scroll or huge graphs below the fold.

## Technical and scientific prerequisites
- [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api) supports height, direction, period and individual swell partitions; wave direction is where waves **come from**. Check coverage per region, licensing and API rate limits.
- [Copernicus wave variable guide](https://help.marine.copernicus.eu/en/articles/6175153-how-to-describe-wave-height-period-and-direction-parameters) distinguishes total spectral significant height from windsea, primary and secondary swell partitions; **do not add partition heights directly**.
- [SHOA/DIRECTEMAR](https://www.directemar.cl/directemar/site/edic/base/port/preg_frec_shoa.html) provides authoritative Chilean tide predictions; formal rights and available machine-readable formats need investigation.
- FARO Chile remains research-only until local break calibration and Chile-specific safety routing are available.

## Proposed implementation order
1. **Display accuracy** (labels and bearing units, no score changes).
2. **New swell partition fetch** (null-safe, model provenance).
3. **Responsive 2-hour window chart and compact compass**.
4. **Tide integration** with provenance/datum before any user-facing optimal tide inference.
5. **Regional Chile pilot**, separate timezones, tested model selection, exact coordinates and source quality.
6. **Actual model-to-observation validation** and user field note evaluations before ranking recommendations.

No scraping or reproducing Surfline's proprietary LOTUS forecasts or copyrighted artwork. FARO's own data, transparent assumptions and decision-oriented experience are the priority.
