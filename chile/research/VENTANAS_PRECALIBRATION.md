# FARO · Ventanas (Puchuncaví), staged spot-model precalibration
Updated 2026-10-29 · **research only, NOT a calibrated public surf-quality model**

## Current state
- Surf location: *Ventanas* near Puerto Ventanas, Quintero Bay, Chile; approximate centre of Playa Ventanas (-32.74445, -71.48821), **not a verified surf take-off coordinate**.
- A single community text (reproduced on SurfSpots and WannaSurf; NOT two independent observations) describes four breaks, including **Muelle Chico** (left and right, less demanding) and **Pilotes** (reported more demanding), without exact breakout coordinates.
- Guide claims: swell from **N**, wind from **N or S**, rideable at various tides with **falling tide preferred**. These are not measured local optimal ranges, and may refer to different sections. Encoding N and S as 45-degree compass sectors ([337.5°, 22.5°] and [157.5°, 202.5°]) is a **notation prior**, not physically estimated refraction or shelter.
- University of Valparaíso publishes a **20 m depth nearshore wave forecast** for Quintero Bay, including Puerto Ventanas: https://marejadas.uv.cl/pronosticos/cl15qt. FARO does not import this provider's data, cannot verify it corresponds to Muelle Chico or Pilotes, and does not claim a site forecast here.
- Source-reported recreational-use prohibition due to Portuguese man-of-war was **still reported in force on 27 October 2026**. No later lifting resolution has been verified. It must be treated as a legal access block; no surf recommendation or public score is permitted.
- Environmental and port-related exposures require independent clearance; **absence of a warning is not evidence of safe water**.
- Field observations, licensed clips and matched forecast/observation pairs: **0**.
- Experimental profile flags: `scoreEnabled: false`, `forecastEnabled: false`, `observations: 0`, `status: research-hypothesis-only`.

## Physical workflow before local scoring
1. Confirm current legal clearance and whether the exact surf sectors are outside maritime exclusion or port operation areas. Never infer that a beach is open from an old tourism guide.
2. Georeference Muelle Chico and Pilotes separately from shoreline imagery and **locally verified** lineup coordinates. Do not substitute the beach centre for a break.
3. Acquire forecast/time-aligned nearshore data for Quintero Bay at 20 m where permissible (Hs, Tp, mean/directional partitions, tides; check coordinate/depth/reference-time conventions). Where only a website is available, keep an external link instead of scraping or claiming API integration.
4. Obtain repeated, legally permissioned camera observations or researcher field observations across swell sectors, periods, wind strengths, tide heights/phases, and both breaks. Capture *observed* rideable frequency, approximate breaking height and wave shape, closure tendency and uncertainty, alongside model issuance and valid timestamps. Do not infer environmental clearance from wave imagery.
5. Evaluate directional guide priors with circular-angle techniques, tide dependence and period/energy covariates; record both original community prior and updated posterior / interval. Distinguish plausible nearshore height from surf rideability.
6. Fit an empirical relation only on genuinely observed labels, with chronological day-level held-out data. Compare against a simple unsupervised baseline; report MAE or Brier score and confidence calibration, and refuse promotion when skill is unsupported. The provisional 30+ independent session samples per sector would only support feasibility testing, not a claim of robust forecasting.
7. Enable spot-specific fit only after source provenance, observations, uncertainty and authority clearance are separately verified. The 0–10 display is an **uncalibrated index** until those steps; its numeric maximum is not an accuracy percentage.

## Source ledger
- Community guide (one underlying account): https://www.surfspots.co/spot/ventana
- Mirrored guide, not independent evidence: https://www.wannasurf.com/spot/South_America/Chile/Central_Santiago/ventana/
- University of Valparaíso, Quintero Bay coastal forecast at 20 m: https://marejadas.uv.cl/pronosticos/cl15qt
- Puchuncaví municipal locality information: https://www.munipuchuncavi.cl/4.0/ventanas.php
- Directemar maritime restrictions registry: https://www.directemar.cl/directemar/site/tax/port/fid_adjunto/taxport_34_112_219_2.html
- 27 October dated access report: https://puranoticia.pnt.cl/region-valparaiso/seremi-de-salud-levanta-prohibicion-de-bano-en-playa-de-algarrobo-no-han
- UPLA regional environmental study: https://hubambientalupla.cl/estudio-detecta-alta-presencia-de-metales-pesados-en-bahia-de-quintero-puchuncavi/

**Do not publish a numerical Ventanas recommendation solely from this source ledger.** The live FARO four-pilot score and Ventanas research-only guide are deliberately separate.
