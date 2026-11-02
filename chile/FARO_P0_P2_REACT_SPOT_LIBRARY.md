# FARO · P0–P2 delivery · 2 November 2026

## Backup and rollback
- **Original main snapshot:** branch `backup/faro-pre-p0-p2-react-20261102`.
- **New work:** `faro/p0-p2-react-spot-library-safety-20261102`, reviewed in PR #49.
- Classic production remains `/zeeland-surf-check/chile/`. React is an isolated preview at `/zeeland-surf-check/react/` once GitHub Actions publishes on main. **No automatic switch of live users to React**.
- To recover, deploy the backup branch using a recovery PR or revert the squash commit; do not delete field observations, permissions or citation records in the process.

## P0 — visual and safety
**Visual**
- FARO O symbol: exact original segmented logo remains crisp within the left editorial content, outside the translucent numeric panel. The **atmospheric radial wash**, not the SVG, is blurred.
- Hero numerals read `var(--brand-score-ink)`, the identical five FARO bands (`#ef9b77`, `#efbd6e`, `#e0cc73`, `#b1d574`, `#8cc584`) in both themes. No second olive-green palette.
- Dedicated iPhone hero: flexible vertical stack, 2-column score/window section, responsive labels, 3-column metrics and no boxed overlapping logo. The legacy styling stays available for reversible rollback.

**Risk policy (independent of physical offshore potential)**
- `chile/faro-session-decision.js` is a pure module shared with the React preview.
- `potentialScore`: original experimental offshore index, **unchanged** and never equated to probability of safe surfing.
- `sessionScore`: optional *conservative editorial decision index*, NOT a physical predictor or certified safety algorithm.
  - A documented access restriction (Ventanas) or dangerous condition in the relevant time window: `sessionScore=null`, recommendation blocked. Unknown risk coverage also prevents a recommendation.
  - Caution window: `sessionScore ≤5.9/10`, while the underlying offshore potential is explicitly recoverable in the details. The 5.9 cap is **a product policy, not fitted or field-validated**.
  - Two consecutive valid hourly model inputs: wind-speed range can apply a bounded downward adjustment of up to 0.5 points if speeds change rapidly. Thresholds are provisional until observations support tuning.
  - Only externally verified notices with authority, HTTPS source and UTC checked timestamp may be passed as independently verified official alerts. **FARO does not automatically check official Chile warnings today.**
  - Wind, precipitation and thunder screens are **model thresholds, not official warnings**. A forecast-horizon danger is visible even if no safe individual time window remains.
- The classic Daily Take still contains original offshore metrics. The session hero and hourly index explain risk status without falsifying physical wave data.

## P1 — adaptable spot model / diagnostics
`chile/faro-spot-registry.js` wraps the existing, source-attributed `valparaiso-live.config.json`, `valparaiso-score.config.json`, and `spot-intelligence.json`. **Do not duplicate or invent another set of per-spot orientation coefficients.**

Every entry retains ID, guide sectors, origin/source IDs, coordinate provenance, break class, unobserved banks/tide, calibration status and access gate. `audit()` prevents silent structurally invalid pilots. New candidates must pass the existing `research/spot-doctor.cjs` checks before activation.

`chile/faro-spot-diagnostics.js` supplies:
- Direction ±15° sensitivity range (NOT a confidence interval).
- Offshore Hs²×T energy and complete swell partitions, when supplied.
- Crossing-swell bearing difference, when available.
- Two-hour wind / swell range using *two matching hours* of real model input.
- Coarse sea-level tendency for context, **never** a local optimal tide prediction.
- Unknown bank, rip-current risk and breaking-wave height remain explicit `null`.
- Empirical forecast confidence remains **uncalibrated** without independent observations.

**Score upgrade boundaries:** numerical tide-optimum, nearshore breaking or mobile-sandbank penalties cannot be inferred from coarse marine model grids. Open-Meteo cautions that its currents and sea-level models are ~8 km and unreliable for nearshore navigation. Improvements are hypotheses until tested against field data.

## P2 — React application + evidence library
**React preview**
- `apps/web/` is an actual Vite + React app (not a screenshot or HTML mockup). It imports the original FARO model and new pure registry/risk modules, and fetches the same real marine/weather providers. It supports the five documented pilots, two-hour windows, session risk gating, bilingual interface, light/dark styles, and reads with model-source limitations.
- `.github/workflows/faro-react-preview.yml` compiles the application on PRs and pushes. On main it publishes only the generated `react/` preview directory without touching the stable Chile production page.
- The React view is deliberately **not** yet a feature-complete replacement: the richer Leaflet map, manual video notebook, detailed Spot DNA, camera catalogue, and all administrative notices remain in classic FARO until separately migrated and reviewed. The React preview links to them. React is a view library, not itself a native iPhone app or a forecasting backend.

**Learning / observation evidence**
- Existing `chile/calibrate-observations.cjs` already enforces human review/rights and compares chronological future-event holdouts against constant, ridge and frozen FARO baselines.
- `chile/research/spot-learning-report.cjs` now composes the sourced spot inventory with that research comparison in a **private, read-only report**; it never updates public weights. Run:
  ```sh
  node chile/research/spot-doctor.cjs
  node chile/test-session-and-registry.cjs
  node chile/research/spot-learning-report.cjs OBS.jsonl APPROVALS.jsonl private-report.json
  ```
- Cameras require *licensed imagery*, reviewed annotations, timestamp-matched issued forecasts and held-out observations. No camera integration can legitimately be called trained/calibrated today. Video remains browser-only unless the user supplies it and permits a specific upload workflow.

## P2 follow-up prerequisites (NOT fake complete)
1. Reliable, time-stamped, rights-clear quality observations at each distinct break and seasonal sandbar setting.
2. Coastal bathymetry and locally referenced water-level data, if estimating refraction/shoaling, banks and surf-zone currents.
3. Partner camera licences and documented observation QA, then untouched future-time validation.
4. Relative skill against frozen FARO and constant baselines; do not claim superiority to Surfline without fair observed, permitted comparisons.
5. Migrate remaining UI to React one feature at a time after browser and iPhone Safari validation, then optionally make React the default.

## Sources
- React gradual adoption: https://react.dev/learn/add-react-to-an-existing-project
- Open-Meteo model variables/nearshore caveats: https://open-meteo.com/en/docs/marine-weather-api

This release does **not** claim empirical breaking-wave forecast accuracy, verified live warnings, a fully trained learner, observed bank state or complete React feature parity.
