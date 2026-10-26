# FARO · Chile surf spot atlas (research scaffold, October 2026)

**Research beta visible at [FARO Chile](index.html), NOT an active Chile forecast.** Users can switch between the Zeeland live forecast and the Chile regional atlas. FARO's operational forecasts, risk notices, board matching and widgets remain scoped to Zeeland. The Chile atlas is a separately maintained, source-attributed foundation.

The [country explorer](index.html) loads one regional JSON file on demand and explicitly shows source evidence vs missing calibration. It exposes **five experimental Valparaíso profiles** but no live Chile score, tide, warnings or surf-height predictions.

## Valparaíso research pilot

The first priority is **La Boca de Concón**, the Aconcagua river-mouth beach. The [Valparaíso Spot DNA reference](VALPARAISO_SPOT_DNA.md) now describes 5 sourced wind/swell pilot profiles within **21 named places**, out of **73 research candidates across 16 Chilean regions**.

**[Open the interactive FARO Lab: Valparaíso](lab.html)** to enter hypothetical wave/wind parameters and compare La Boca, Ritoque, Reñaca, Maitencillo and Papagayo. It is **not a live forecast** and does not change Zeeland's model. It produces experimental, visibly capped /10 compatibility values, FARO VIBE, tags, and source-attributed local readings. Changing [`valparaiso-score.config.json`](valparaiso-score.config.json) will change the model rules without rewriting the UI; `valparaiso-score-lab.js` holds the independent interpreter.

**Next operational document:** [La Boca controlled pilot, observations and Chile launch gates](LA_BOCA_PILOT_PLAN.md) · [empty field observation template](field-observations-template.csv). The UV provides nearshore model outlooks around 20 m in the bay of Concón and around Reñaca, but not observed surf height at the breaking peak.

Before release, validate all regional parameters against observed surf at the named bank, check local legal restrictions and coastal warning sources, and only then assess a true forecast score. Run the [regression tests](test-valparaiso-score.js) with `node chile/test-valparaiso-score.js`.

## Structure
- [`regions.json`](regions.json) — all **16 Chilean regions**, including empty or inland ones
- [`regions/`](regions/) — **one JSON record per region**, with documented/candidate surf areas
- [`sources.json`](sources.json) — provenance: official Chile Travel, SERNATUR, DIRECMAR/SHOA, independent spot directories
- [`spot.schema.json`](spot.schema.json) — versioned field contract (region metadata and per-spot facts)
- [`catalog-loader.js`](catalog-loader.js) — optional future loader with validation, deliberately not imported into live FARO
- [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md) — staged surf-science and engineering plan

## Evidence and integrity
Each spot stores a stable `CL-XX:slug` identifier, locality, region and timezone, source references, currently known break type or wave hand (only if supported), and deliberately unpopulated calibration fields. This prevents a generic mainland reference from masquerading as a nearshore/bank-specific reading.

### Confidence states
- `directory_listed`: the spot exists in a named surf directory; **no reliable physics inferred**.
- `guide_described`: a guide describes a limited property (e.g. Punta de Lobos left point; El Gringo reef); not independently validated.
- `field_checked`: planned later after FARO/local surfing field notes corroborate observations.
- `locally_calibrated`: future milestone, not asserted for any current record.

`publishedReference` holds a **quoted categorical guide claim** (e.g. SW swell and SE wind for Punta de Lobos); it does NOT automatically set `favourableWindDegrees`, swell response or a numeric score. Everything that is still unknown is `null` or `unverified`, never zero.

## Included scope
Candidate locations are grouped in Arica y Parinacota, Tarapacá, Antofagasta, Atacama, Coquimbo, Valparaíso (including an **insular Rapa Nui** placeholder), O'Higgins, Maule, Ñuble, Biobío, Los Ríos and Los Lagos. La Araucanía, Aysén and Magallanes have empty placeholder inventories until independently sourced. Metropolitana is preserved as an **inland** administrative region, not a coastal surf spot.

### Regional timezone requirements
- Most mainland regions: `America/Santiago`.
- Rapa Nui: `Pacific/Easter` (insular Valparaíso; distinct local clocks).
- Aysén: `America/Coyhaique` (tzdata 2025b, permanent UTC−3).
- Magallanes: `America/Punta_Arenas` (permanent UTC−3).
- Compute daylight and arrival windows in the **spot's** timezone, not a single hard-coded Chile timezone. Validate the IANA timezone library before launch.

## Readiness barriers before publishing any Chile spot
1. Verify coordinates **at the exact break**, rather than a town centroid.
2. Verify wind exposure, bathymetry / banks, wave approach and coastline orientation with at least one reliable local source; distinguish total model waves from directional swell systems.
3. Determine offshore wave model geographical coverage/resolution and choose a nearshore transformation model or documented conservative limitations.
4. Connect licensed near-real-time SHOA tide predictions and appropriate reference ports, with datum, timing and local tide interpolation uncertainty.
5. Add official marejadas / coastal hazard references and sector-specific access rules; do not invent government warning status.
6. Establish separate conditions-based Surf Quality, local Spot Fit and user-dependent FARO Match scoring, then **validate against observed sessions**.
7. Build native bilingual ES/EN text and allow a manual country/region selector only after data and alert behaviour work; do not let NL warnings leak into Chile.
8. Integrate widget parameters, cache namespace and region-aware climate/seasonal behaviour **after** an end-to-end country mode test.

## Current science limitation
The atlas is not a tide guide, not a safety clearance and not evidence that any named beach is suitable for a particular surfer at a given instant. Conditions change across the same beach. The current five-band palette is a display scale, not a universal score calibration for Chile.

## Editing together
Start with a region JSON file. Add a `sourceId` to `sources.json` before writing a claim. Specify uncertainty, evidence scope, season and whether a wind/swell direction means **FROM**. Keep every observed surf session and model forecast paired by local timestamp and sector ID, then fit spot-specific parameters only when there is sufficient replication.

Reference entry points:
- [Chile Travel · Arica](https://chile.travel/blog/surf-en-chile-7-destinos-con-olas-perfectas/)
- [Chile Travel · Pichilemu](https://chile.travel/blog/los-mejores-lugares-para-hacer-surf-en-pichilemu-y-sus-alrededores/)
- [Surfline · Punta de Lobos spot guide](https://www.surfline.com/surf-report/punta-de-lobos/5842041f4e65fad6a7708cba/spot-guide)
- [Sernatur · Ñuble](https://www.sernatur.cl/region/nuble/)
- [DIRECMAR / SHOA · Tide predictions](https://www.directemar.cl/directemar/site/edic/base/port/preg_frec_shoa.html)
- [DIRECTEMAR · Official time changes](https://www.directemar.cl/cambio-de-hora-en-chile-continental-e-insular-occidental-0)
