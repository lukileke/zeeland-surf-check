# FARO Phase 2 — model contract and migration status

2026-11-25. Implementation contract, not validation of breaking surf.

## Common runtime

- `surf-engine.js` exports `FaroModelCore`, with finite-value checks, exact hour pairing, arithmetic and circular means, two-hour Zeeland summaries and eligibility, a common session policy, and the preserved Zeeland raw quality equation.
- Zeeland Forecast, Best of Week and FARO Match consume the same two-hour summaries. Scriptable uses the same engine and provider fields, with a versioned engine cache. The widget and web retry a rejected optional marine-variable request with the required total-wave fields; absent partitions remain unknown.
- Chile loads the same arithmetic/circular helpers and v0.5 decision kernel. The standalone Chile modules retain their historical compatibility implementations for offline snapshot generation and tests; these are not separate production policies.
- The decision policy separates physical or legacy raw potential from recommendation. Missing risk data or modelled danger prevents a recommendation; known caution caps the recommendation at 5.9; a large within-window wind range reduces it by at most 0.5. Official warnings and beach access are independent evidence. None of this represents a probability of safety.
- Local risk thresholds are not silently transferred: Zeeland uses its existing wind, gust, thunder, fog and offshore wave warning thresholds. Ordinary seasonal cold water no longer caps surf quality; thermal guidance and independent warning displays remain in force. Extreme cold under 7 C retains the pre-existing Zeeland danger threshold. Chile retains its configured screening and access restrictions.

## Shared scientific readout

`assets/faro-region-response.js` evaluates both coasts with the same v0.4 offshore response implementation, and renders the same bilingual technical panel. The Zeeland profile priors derive from the historical area reference height, period and spot orientation; Chile uses the documented guide sectors. There is no empirical calibration in Zeeland and no claim of nearshore calibration in Chile.

- Both report primary/secondary/tertiary swell height, period, direction FROM and Hs²T; wind sea is separate.
- The index uses a bulk model period, not the spectral energy period. Hs²T is a relative proxy; it is not a measured wave power or a breaker-height prediction. Optional missing partitions are not zero.
- Zeeland uses the legacy raw operational quality equation plus the shared decision policy. The v0.4 response is an explicitly experimental separate diagnostic, not the operational ranking. Chile uses the existing v0.4 potential plus the same v0.5 decision policy. Do not compare public scores across regions as calibrated surf quality.
- The North Sea can contain substantial wind sea. The current swell response does not model its positive contribution to surf; treating total height as swell or adding total height to partitions would double count. Do not switch Zeeland's operational ranking to v0.4 until wind-sea contribution and spot response have been evaluated with local observations.

## Remaining phase 2 work

- Harmonise the complete FARO Match preference model, including skill, board and local response parameters. Numerical preference ranking in Zeeland and qualitative Chile board fit remain regionally distinct.
- Consolidate secondary visual modules, complete the local data contract (UV, currents, sea level, tides, camera provenance and observation coverage) and independently verify live data sources. Do not infer local tide or rip currents from coarse offshore products.
- Evaluate retrospective and prospective spot-level observations before changing the operational raw score or claiming calibration; preserve the raw and candidate score versions during comparison.
- Complete browser QA on both full entry pages and published provider/fallback QA.

## References

- Open-Meteo Marine Weather API: https://open-meteo.com/en/docs/marine-weather-api
- Copernicus Marine wave parameter definitions: https://help.marine.copernicus.eu/en/articles/6175153-how-to-describe-wave-height-period-and-direction-parameters
- ECMWF Ocean Wave Model overview: https://confluence.ecmwf.int/pages/viewpage.action?navigatingVersions=true&pageId=261066964

Phase 3 (monthly outlook) intentionally not started.
