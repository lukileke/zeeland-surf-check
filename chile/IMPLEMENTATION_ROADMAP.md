# FARO Chile · staged implementation roadmap

## Baseline architecture
Zeeland is active. Chile catalogue is **inactive** and read-only. Do not feed Chile places into the Zeeland evaluator and do not clone its ocean exposure thresholds. A global `surf-engine.js` might one day orchestrate model outputs but calibrated parameters must remain region/spot-specific.

**Immediate owner of the next implementation steps:** [La Boca → Reñaca launch gates](LA_BOCA_PILOT_PLAN.md). Start with the pilot, not a simultaneous national rollout. The empty observation spreadsheet template is [here](field-observations-template.csv).

## P0 · Coastline and break identity
- [ ] Confirm region, coastal municipality, break access point and subspot names. Store exact coordinates only from verified sources (never town-centroid guesses).
- [ ] Categorise: exposed beachbreak, sheltered beachbreak, rocky/reef, point, rivermouth, reef/point mixture; include changing banks, direction of ride, local restrictions and known hazards.
- [ ] Mark documented versus hypothesised inputs independently, with dated source or field note.

## P1 · A real Chile forecast feed
- [ ] Verify offshore grids for Pacific coast AND Easter Island independently; do not assume the North Sea model performs there.
- [ ] Record model issue time, valid time, spatial resolution, grid sea/land mask, source/units and missing-value policy.
- [ ] If using swell partitions, keep each swell height, period and direction separate from total significant wave height and from nearshore breaking-wave height.
- [ ] Estimate local shoreline exposure and shadowing only when local orientation and geology are verified.
- [ ] Model wind direction as FROM, gusts separately; use local time and daylight cutoffs.
- [ ] Obtain tide tables/observations with SHOA reference station and datum; do not relabel tide height as low/high without a reference model.

## P2 · Safety first
- [ ] Official coastal notice links: DIRECTEMAR / Armada marejadas; local beach access, conservation and port status.
- [ ] Distinguish **official alert** from FARO forecast risk heuristics; show timestamp and jurisdiction clearly.
- [ ] Avoid treating a beach-wide tide or generic rule as a safe-entry certificate.

## P3 · Calibration trials
- [ ] Prioritise: Arica's rock/reef surf, Iquique, Punta de Lobos and La Puntilla, Curanipe, Buchupureo.
- [ ] Run observed/model comparisons (at least multiple varying conditions) and evaluate direction errors, wind exposure, wave height/period, rideability and daypart.
- [ ] Keep Surf Quality objective, FARO VIBE descriptive and FARO Match personalised.
- [ ] Explicitly handle expert-only reef and big-wave surf: favourable waves **do not imply personal safety**.

## P4 · Surfline-inspired, FARO-differentiated user experience
- [ ] Top strip: precise time, location and local conditions with source/issued time.
- [ ] **Two heights** if supported: modelled offshore wave height vs locally estimated surf breaking-wave range (clearly labelled, no invented conversion).
- [ ] Swell cards: primary/secondary/tertiary swell directions and periods with compass orientation and uncertainties.
- [ ] Tides: real curve with time cursor, explicit reference port, datum and uncertainty.
- [ ] Better dynamic cards: wind vectors/gusts, 2-hour quality, shore-exposure, water temp and evidence.
- [ ] Surfing-first differentiation: transport worthiness, choice of board, easygoing vs punchy feel, constraints, local Spot DNA and transparent score drivers.
- [ ] Mobile clarity: strong typography, progressive disclosures, separate safety; avoid intrusive banners and third-party ads.

## P5 · Activation gates
Chile manual country toggle, forecasts, widgets and Chile-specific warning routing remain **off** until functional QA, legal/licensing review, official source availability and calibration confidence are satisfactory. Tests should explicitly verify no Netherlands-specific KNMI content appears when Chile is activated.
