# FARO · Safety sources & mobile regression (2026-10-24)

## What Faro currently DOES, and what it does NOT

Faro's surf forecast is modelled with Open-Meteo. It **does not ingest live government alerts**, either Dutch or Chilean. The numerical danger/caution triggers are independent model-based **screening heuristics**, not official warning classifications or swimming/surfing safety clearance.

A **persistent warning centre** appears above Forecast, Best of Week and Wizard. It can be set to *Zeeland · NL* or *Chile · CL*, stored locally as `faro-alert-country`. The list configures links to authorities, **not country-specific automated alerts**. Actual sea-state forecasts still use the selected Zeeland spot (and this is explicitly shown if Chilean source links are selected). In a future Chile deployment, country should default from spot coordinates, with optional user override.

### Official authority registry

| Country | Organisation | Authoritative scope | Current implementation |
|---|---|---|---|
| NL | KNMI | Official meteorological warning notices, currently selected for Zeeland | Link to the relevant warning page + a dated, automatically expiring published KNMI bulletin for 24–25 Oct 2026. **Not live.** |
| CL | Servicio Meteorológico de la Armada (SERVIMET/DIRECTEMAR) | Maritime warnings, temporales, coastal winds, *marejadas* | Official maritime warning link only |
| CL | Dirección Meteorológica de Chile (DMC) | Atmospheric weather forecasts, meteorological warnings/alerts | Additional official link only |
| CL | SENAPRED | Civil protection and public emergency alerts | Additional official link only |

Official links:
- KNMI Zeeland: https://www.knmi.nl/nederland-nu/weer/waarschuwingen/zeeland
- Chile Armada maritime weather: https://meteoarmada.directemar.cl/
- Dirección Meteorológica de Chile: https://www.meteochile.gob.cl/
- SENAPRED: https://senapred.cl/alertas/

DIRECTEMAR explains that dedicated maritime meteorology centres issue different products: special coastal weather advisories, bad-weather warnings, storms and swell advisories. Do not replace those with land-only wind alerts. SENAPRED's green/yellow/red civil-protection alert scale is **distinct** from meteorological severity codes and must not be confused with the Faro model's danger/caution colour.

### Model hazard screening — separate from surf score

`faro-safety.js` screens 48 h at the **selected physical spot** for forecast gusts (50 km/h caution, 75 km/h danger), severe mean wind, thunderstorms and other hazard conditions. It also scans the entire selected 2 h interval instead of only the midpoint. These thresholds are **Faro heuristic indicators**, not official closures, forecasts of actual breaking waves, or proof of safe surfing at lower values. Data unavailability cannot be reported as safe.

### Future live official integration

- Server-side fetcher using authorised KNMI/MeteoAlarm or official Chilean government published structured alerts, not private API keys in client JavaScript and not fragile scraped headlines.
- Versioned schema storing source, country, geographic region or polygon, valid-from, valid-to, publication time, update/cancel state, forecast phenomenon, alert severity, refresh and staleness.
- Chile must distinguish SERVIMET ocean/swell threats, DMC meteorological warnings and SENAPRED evacuation/public-safety measures; use the relevant event's official issuing authority.
- Automatically map precise surf spot coordinates to the affected polygon or region. For Chile, this means supporting the full coast, islands and long latitudinal differences rather than defaulting the entire country to one generic warning.
- Unknown/stale feed state should be labelled clearly. Offline or stale does not mean no active warnings.
- Consider marine hazards (rip currents, tide, local bans) not predicted by Open-Meteo; never provide safety clearance.
- UX display: red/orange/yellow official warnings with issuer and validity, separately from model-only risk indicators. Source link always visible.

## Mobile overflow: root cause measured, not guessed

Earlier iPhone Safari showed that the **whole document** could be swiped to a white area to the right. Multiple CSS-only attempts that set `overflow-x:hidden` on body/root did not isolate it. A real Chromium mobile integration test subsequently measured:
- 320 px viewport, **788 px root scrollWidth**.
- After hiding only `#dayStripItems`, scrollWidth immediately returned to 320 px.
- The day rail itself had around 842 px scrollable content and 294 px visible width.
- The successful fix was **`contain:layout paint`** on the day-strip wrapper and its child, without removing `overflow-x:auto` from the rail.
- After the fix the same 320 px viewport had a 320 px document width, while the rail still allowed horizontal exploration. Tests also cover 375, 390 and 430 px, both themes, both languages and all three tabs. Simulated touch swipes outside the rail must never move the root horizontally.
- The temporary JavaScript handler suppressing horizontal touch gestures was removed after verifying CSS containment, as it could block ordinary browser navigation gestures.

The browser QA workflow is `.github/workflows/faro-browser.yml`, which uses actual Chromium touch emulation and synthetic forecast API responses. It is **not an iPhone Safari test**; physical iPhone and VoiceOver QA remain required.

## GitHub Actions fail notifications: diagnosed

Logs for runs `40070264932`, `40070722200`, and `40070749018` all failed on `AssertionError: Current CSS cache key`, because source code updated `?v=N` separately from the old exact-string test. The source test now checks presence of a well-formed versioned local CSS reference instead of pinning a number. Confirm actual workflows before saying CI passed, rather than relying solely on a locally emulated test.

## Internationalisation

The safety banner now directly uses the selected EN/ES language and rerenders when the user switches locale. The original generic MutationObserver string-replacement mechanism remains legacy technical debt and can have collisions: next refactor should replace that with proper per-component keyed i18n dictionaries. Added missing translations for model gust warning, forecast periods, Wizard steps, and capitalised the beginning of displayed weekday date labels. Browser QA checks Spanish severe hazard copy in both light and dark modes.

## Outstanding

1. Confirm mobile Safari no lateral white pan at all, particularly after rapid rail swipes, opening disclosures and switching language.
2. Build and verify an official alerts ingestion backend; do not equate clickable source links with integrated alerts.
3. Move away from broad text-string replacement to semantic i18n keys.
4. Upgrade stale source check, since a previously published bulletin must always expire/cancel with the issuing agency's updates.
