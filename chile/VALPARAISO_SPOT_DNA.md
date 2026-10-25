# FARO Spot DNA · Valparaíso (research edition, 25 October 2026)

**Status:** research only. No Chilean spot has an operational 0–10 Surf Quality forecast. The separate [FARO LAB simulator](lab.html) estimates **guide-derived compatibility**, NOT measured breaking waves. Never use as an entry/safety recommendation.

## How spot-specific FARO scoring works

A swell coming from the same direction can meet one bay directly, refract around a headland elsewhere or be blocked by another shoreline. The provisional engine therefore has **one source-linked profile per named break or justified beach sector** instead of a country-wide generic score.

The [editable scoring configuration](valparaiso-score.config.json) contains experimental wind / wave direction sectors and weights. The [stand-alone scoring engine](valparaiso-score-lab.js) calculates:

`FARO Lab = 10 × (0.28 wind-direction fit + 0.28 swell-direction fit + 0.19 wind-strength fit + 0.17 period proxy + 0.08 offshore-swell-presence proxy)`.

All components are bounded between 0 and 1. The weights are **engineering hypotheses**, not experimentally fitted coefficients. With no observations the total is capped at **7.9**, and it is never displayed on the main FARO website. No tide fit is scored. Neither `waveHeightM` from offshore nor `swellHeightM` in the simulator equals a predicted *breaking surf height*. The user selects model parameters manually, and the result is explicitly non-live.

Wind/swell direction are **FROM** true north in degrees. If a spot lacks credible ranges, it receives **no score**. No score or tag implies safe entry.

## Source-backed pilot spots

### 1 · La Boca, Concón (priority)
- **Morphology:** the Aconcagua river-mouth beach, coarse/dark sand and changing bars. Municipal studies note changing river sediment and currents; guide descriptions also mention local rocks.
- **Wind direction:** E/SE/S, a broad guide-derived candidate sector (~82–199° FROM). **Not field validated**.
- **Swell direction:** W/NW, broad guide-derived candidate sector (~226–355° FROM). **Not locally calibrated**. Narrow these only after observing the actual peak and island/headland sheltering.
- **Tide:** surf guide says several tides are possible; the river mouth and bars can change. Do not assume a static optimum.
- **Wave character:** mellow-to-variable potential, lefts/rights according to the sandbank; not a promise.
- **Hazards:** municipal plan lists it as **not suitable for bathing** because of currents and countercurrents, while documenting recreational surfing on the beach. The adjacent *protected urban wetland* has separate restrictions on boating/water sports inside the protected area; verify **exact boundaries and entry points**, do not infer that the entire beach is closed or permitted. Rain/river discharge can affect water quality; do not infer live safety from weather data alone.
- **Nearshore research:** Universidad de Valparaíso has an approximately 20-m-depth wave outlook for Playa La Boca. It could inform validation alongside offshore models, but is **not** a measured breaking-wave height at the sandbar.
- **Sources:** [SurfRip](https://surfrip.com/surf-spots/1749/la-boca-con-con), [Concón municipal beach plan](https://transparenciaconcon.cl/upload/planilla/07_actosyresoluciones/Pladetur/Parte2.pdf), [MMA river mouth](https://sistemahumedales.mma.gob.cl/OficioHU/DetailsPublico/30), [Municipal wetland restrictions](https://www.concon.cl/medio_ambiente/humedal_urbano), [UV wave outlet](https://marejadas.uv.cl/pronosticos/cl15cc).

### 2 · Ritoque (north end)
- **Morphology:** sand beach with a softer left and another right, paddling channel at the north. Going south, exposure and paddling change.
- **Guide candidate:** SW swell, N wind, medium-low tide.
- **FARO:** provisional compass sectors SW 210–255°, N 337.5–22.5°, while tides are descriptive only.
- **Confidence:** published guide, **not** an observed sandbank.
- **Source:** [Surfline Ritoque guide](https://www.surfline.com/surf-report/ritoque/5842041f4e65fad6a7708cbd/spot-guide).

### 3 · Reñaca (northern peaks)
- **Morphology:** peaky A-frame waves formed by offshore boulders influencing nearshore sandbars; southern stretches have more closeouts.
- **Guide candidate:** W/SW swell, E wind, medium-low tide.
- **FARO:** W–SW ~225–292.5°, E ~67.5–112.5°, prototype only.
- **Confidence:** north-sector guide, not blanket conditions for all five sectors of Reñaca.
- **Source:** [Surfline Reñaca guide](https://www.surfline.com/surf-report/renaca/5842041f4e65fad6a7708cc2/spot-guide).

### 4 · Maitencillo (general beach profile)
- **Published reports:** SW swell, E wind. Some sources describe a river break; others call it a sand beachbreak with several peaks. One user review disputes the river in the Surf-Forecast description. We **do not** treat conflicting classifications as facts.
- **FARO:** generic SW and E sectors in the Lab; keep Abanico and other banks distinct until mapped and validated. Mid / rising tide references are not operational.
- **Sources:** [Surfnerd](https://www.surfnerd.com/surf-forecast/maitencillo), [Surf-Forecast](https://www.surf-forecast.com/breaks/Maitencillo).

### 5 · Papagayo (Quintero)
- **Published reports:** a left over a rocky reef / point-like break, rapid sections; exposed to wind. E wind and SW swell from Surf-Forecast.
- **FARO:** generic E and SW sectors in the Lab; **expert / rocky access considerations** must stay prominent no matter how high the compatibility score.
- **Sources:** [Surfline Papagayo](https://www.surfline.com/surf-report/papagayo/5842041f4e65fad6a7708cc1), [Surf-Forecast](https://it.surf-forecast.com/breaks/Papagayo).

## Other named spots in Valparaíso
The [Valparaíso inventory](regions/CL-VS.json) now contains **21 candidate spots/sectors** including Playa Amarilla, Playa Negra, Punta Piedra, Abanico, Aguas Blancas, Las Salinas, Cochoa, Cachagua, Pichidangui, Pullally, Algarrobo, Tunquén, Santo Domingo and an Rapa Nui research placeholder. Being listed is **not** evidence that their optimal directions are known. They will remain unscored until cross-checked.

## Candidate FARO VIBE and explanatory tags

Each scored spot emits:
- numeric **experimental compatibility** with a five-band colour;
- **FARO VIBE** short wave character, chosen cautiously from modeled wind and swell compatibility;
- component chips for wind direction, swell direction, wind strength, period, offshore swell presence;
- **Marea no calibrada** and **Guía local; sin validar** as mandatory uncertainty chips;
- a one-line **FARO Read**, plus the locally relevant hazards from the spot dossier.

Scores remain separate from the official warning system and do not account for tides, water quality, rip currents, changing banks, personal level or legality of access.

## Research needed before real launch
1. Divide large beaches by **observed breaking peaks**, not only by urban beach names.
2. Verify exact shoreline normals / sheltering by segment, not arbitrary town-centre coordinates.
3. Fit a spot-specific curve for wind direction and intensity, wave approach/period and nearshore height relative to observed wave quality.
4. Paired local field notes: date, timezone, location, tide height/datum, board, bank position, measured observations, rough local wave height (explicitly not offshore) and observed rideability.
5. Validate predicted vs observed score with out-of-sample dates, including cross-validation across swell direction, wind regimes and tides. Report calibration error and uncertainty, not a false precise confidence number.
6. Add Chile-specific official coastal and wetland rules, warnings and water-quality sources. Keep model-screened danger separate from official notices.
7. Only then enable live Chilean ranking and scale to the remaining regional spots.

Research inspiration: physical distinctions between waves and breaking nearshore surf are fundamental; a good-looking index without this evidence is just an attractive number.
