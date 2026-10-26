# FARO · Spot Intelligence, Valparaíso (research and launch gates)
Updated 26 October 2026. **Evidence comparison, not local observation or calibrated surf quality.**
Scope: La Boca (Concón), Reñaca Norte (Viña del Mar), Ritoque Norte (Quintero). Do not extrapolate a northern guide to an entire beach, or an offshore grid to a sandbar.

## Research method
1. Separate model data (Open-Meteo offshore), local guide claims (qualitative), independent coastal predictions (UV at ~20 m), published coastal change observations (UC), official warning status (Armada, DMC, SENAPRED) and direct in-water observations (**currently zero**).
2. For each guide claim, store source ID, **FROM direction**, approximate direction band, geographic scope and evidence level. Source ranges are *research hypotheses*, not verified coastline normals or scientifically fitted acceptance cones.
3. Compare forecasts separately against **each** hypothesis. Results: `convergent`, `disputed`, `outside`, `unknown`. A vote is not a probability, an agreement is not nearshore refraction, and a discrepancy is not an automatic recommendation to avoid a session.
4. Treat all tide references as uncalibrated and display disagreements; do not infer measured tide, river discharge or current.
5. Determine the descriptive **READ** from model regime + known spot character + unresolved local dependencies; no fabricated breaking height, guaranteed A-frame or "campana". A read is a conditional explanation of *what to check*, not a verified shape.
6. Keep a separate physical-feature laboratory and the older experimental /10. Do **not** silently reweight that score according to competing blog opinions. Source conflicts show in VIBE/Spot DNA. The experiment is not yet forecast-skill validation.

## La Boca: mobile river-mouth bank, contested directions
- **Geomorphology:** Aconcagua river mouth; sandbars, river plume, and variable wave character. Long-standing surf lessons and relatively accessible small waves are reported, but the exact active bank and restrictions at the protected wetland must be checked.
- **SurfRip** ([guide](https://surfrip.com/surf-spots/1749/la-boca-con-con)) describes W–NW (nominal 226–355°) and wind E–SE–S (82–199°) with "all tides" applicable at beach scale.
- **Surftrips** ([guide](https://surftrips.co/chile/central-chile/la-boca-con-con)) instead describes S–SW (approx. 180–235°), wind N–NE (approx. 345–55°), low tide and soft closing beach surf. These directional bands and tide preferences **genuinely conflict**. Do not merge or promote either to geophysical truth.
- **Universidad de Valparaíso** [Playa La Boca 20 m node](https://marejadas.uv.cl/CL15CCN01) provides a separate *coastal model*, not a surf camera or the currently active sandbank.
- **UC Observatorio de la Costa** documented accelerated recession for *Bahía de Concón*; this is regional coastal change evidence, not a measured sandbar shift at the session's exact peak. [Study](https://www.uc.cl/noticias/estudio-del-centro-uc-observatorio-de-la-costa-alerta-aceleracion-de-erosion-en-playas-chilenas/).
- **FARO hypotheses:** quiet wind + small swell may be suitable for mellow surf; stronger swell could increase energy but current/closeout cannot be asserted. Acongagua runoff after rain merits a **caution to check water quality**, not an assumed contamination reading or public access clearance.
- **Validation needs:** exact legal zone; break GPS / bathymetry; bank position, shape, wave face measured or tagged; river discharge / water quality; SHOA stage with station/datum; morning vs afternoon wind records.

## Reñaca Norte: boulder-influenced sandbar A-frames and fast sections
- **Surfline** [spot guide](https://www.surfline.com/surf-report/renaca/5842041f4e65fad6a7708cc2/spot-guide) describes northern A-frame banks influenced by offshore boulders, short manoeuvrable walls and closures farther south, W/SW swell, E wind and medium-low tide; it does **not** guarantee an A-frame on any particular date.
- **Surf-Forecast** [guide](https://www.surf-forecast.com/breaks/Renaca) mentions SW swell and NE offshore wind and surfability at all tide stages. Even where guides broadly agree on swell, wind and tide preferences differ.
- **UV** offers the independent [Reñaca Norte coastal node](https://marejadas.uv.cl/CL15VAS04) and separate Reñaca Centro/Sur sectors via its [Valparaíso site listing](https://marejadas.uv.cl/index.php/pronosticos-bahia-de-valparaiso). Their ~20 m nearshore information is NOT the breaking wave itself.
- **UC Observatorio** measured coastal erosion across Reñaca (regional beach-level, not a daily bank survey). [Source](https://www.uc.cl/noticias/estudio-del-centro-uc-observatorio-de-la-costa-alerta-aceleracion-de-erosion-en-playas-chilenas/).
- **FARO hypotheses:** if offshore swell builds, the north may have *potential* for punchier peaks, but one must assess current bank, closing sections, crowd and rips. Strong swell is not unconditionally a good session. Cannot assume "campana", tubes or closing frequency without observed sandbanks.
- **Validation needs:** north/center/south segmentation, accurate break orientation, boulder shelter diffraction and substrate, bank movement, tide response and observational closeout categories.

## Ritoque Norte: soft north channel vs exposed south
- **Surfline** [Ritoque guide](https://www.surfline.com/surf-report/ritoque/5842041f4e65fad6a7708cbd/spot-guide) describes a *northern* soft left, easier channel and right, SW swell, N wind, medium-low tide, with more power and paddling difficulty southward.
- **Surfnerd** [Ritoque](https://www.surfnerd.com/surf-forecast/ritoque) instead recommends E wind and rising tide, with an S–NW swell window preferring SW. Another [guide](https://surftrips.co/chile/central-chile/ritoque) mixes north and east wind references and multiple tidal recommendations. Important distinctions may be sector- and bank-dependent.
- **FARO hypotheses:** under increased swell, the south is *potentially* more exposed; the app only describes Ritoque Norte and MUST NOT treat this as a precise southern breaking height. When wind N or E differs by guide, signal that the claim is disputed.
- **Validation needs:** georeferenced north peaks and channel, exposure gradients towards south, bathymetry, tide stage, bank evolution, current safety and nearby coastal model availability (not assumed).

## Inference output contract
```json
{
 "status":"guide_compared",
 "sector":"named area, not surveyed bank",
 "wind":{"state":"disputed","matches":["source-a"],"misses":["source-b"]},
 "swell":{"state":"convergent","matches":["source-a","source-b"]},
 "tide":{"state":"disputed","verified":false},
 "physics":{"predictedSurfQuality":null},
 "vibe":{"id":"mixed","label":"Mixed Bag"},
 "headline":"Readable situational hypothesis",
 "read":"Short surf interpretation grounded in model + place",
 "observedWaveShape":false,
 "safetyAssessed":false,
 "tideCalibrated":false
}
```
Source hypotheses, model comparisons and confidence state are **not** mixed into a fake nearshore calibration. No numerical source-confidence percentages and no change to numeric scores yet.

## The feedback loop for actual learning
1. Persist `spotId`, sector, timestamp UTC, actual forecast vintage (`issueAt` if provided, else explicit `unknown`), all model partition values and source/grid for every session being evaluated.
2. Collect structured surfer/local input *after* the session: which peak, active bank, actual surf range and quality, closing sections, wind, estimated currents, crowd, board, timestamp and photographic/observer evidence quality. Protect observer anonymity and avoid publicising sensitive access locations.
3. Version the Spot DNA and guide hypotheses; track independent corrections from local surfers. Avoid crowd-derived changes without moderation.
4. Evaluate by withheld **swell events and time**, across seasons and dayparts. Start with baseline spot-guide predictions, compare a coastal transfer model and then statistical corrections. Quantify error before displaying confidence probabilities or a validated 0–10.
5. Verify bathymetry/tide and licensing. A nearshore SWAN matrix or UV numeric feed must be validated and allowed for reuse. Never imply a web forecast automatically knows the current sandbar.
6. Publish uncertainty as *missing capability or interval supported by evaluated residuals*, not a capped 7.9.

## Source quality and unresolved contradictions
Guide sites may derive content from one another: two matching articles are **not** necessarily independent confirmations. The configured intervals are editorial representations of broad compass directions and may cover different banks. The only direct physical measurements used today are third-party **model outputs**, not observed break conditions. This module deliberately records uncertainty instead of treating source count as predictive accuracy.

Files: `spot-intelligence.json` (hypotheses), `faro-spot-intelligence.js` (deterministic comparison and conditional READ), `test-spot-intelligence.cjs` (regression), `faro-physics-lab.js` (offshore feature diagnostics), and `chile-forecast.js` (VIBE and detailed DNA display).
