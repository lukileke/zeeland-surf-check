# Faro — Coastal Editorial product and interface guide

**Design direction:** clear decisions, quietly expressive surf culture, credible modelled forecasts.  
**Scope:** Forecast, Best of Week and Faro Wizard (Zeeland pilot).  
**Updated:** 2026-10-23.

## Product promise

Faro should answer the questions of a surfer who may need to travel to reach the beach:

1. **Where?** Beach and precise surf spot.
2. **When?** Seven-day comparison and usable daylight windows.
3. **Worth going?** Spot-adapted Surf Quality and wave character.
4. **What to expect?** Modelled wave size, period, wind and a concise outlook.
5. **What should I bring?** Suit, temperature and optional board-fit advice.
6. **Why?** An accessible technical explanation *when wanted*, not before a decision.

Not a tide forecast, rip-current assessment, live camera, beach observation or guarantee of surfable waves.

## Research-informed decisions

- **Visual hierarchy:** one primary content focal point per screen. Scale, whitespace, alignment and contrast should do most of the grouping work. [NN/g: Visual Hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/), [Apple: Layout](https://developer.apple.com/design/human-interface-guidelines/layout).
- **Progressive disclosure:** retain quality-driving conditions for technical users but keep initial decisions scannable. Do **not** hide key hazards behind collapsed panels. [NN/g: Accordions](https://www.nngroup.com/articles/accordions-on-desktop/).
- **Model honesty:** always distinguish modelled forecasts from observations. Surfline explicitly distinguishes them in its condition and score presentation. [Surfline: Observation Clarity](https://support.surfline.com/hc/en-us/articles/35995874238491-Observation-Clarity).
- **Meaningful spot context:** Windy.app's forecast journey goes from a named spot to weather conditions and the best time. Use this as inspiration without reproducing its high-data-density table. [Windy.app Guide](https://media.windy.app/page144770606.html).
- **Typography and controls:** small, high-contrast metadata supports rather than competes with decisions; test diverse viewports and text sizes. [Apple Layout](https://developer.apple.com/design/human-interface-guidelines/layout).
- **Semantic colour:** reserve surf-score grades for quality, blue/teal for wave height or controls, pink for descriptive wave character when necessary, and warnings for risk. Never communicate meaning with colour alone. [USWDS Colour](https://designsystem.digital.gov/design-tokens/color/overview/), [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
- **Horizontal interaction:** one compact seven-day scroller is important to the task; avoid turning the entire page into stacked carousels. [Baymard mobile app UX](https://baymard.com/research-articles/mobile-app-ux-trends).
- **Depth:** use tonal layers and soft surfaces rather than many equally bright borders and shadows. [Material Design 3](https://developer.android.com/develop/ui/compose/designsystems/material3).

## Content architecture

### Forecast
- Header: Faro + small refresh signal, then global three-tab navigation.
- Location controls: Beach and Surf Spot, at equal scale; both should remain readable.
- Seven-day strip: compact scores, category words and best two-hour interval for each day.
- Day summary: **date**, **best window**, **what limits/promises the session**.
- Hero: **one Surf Quality score**, **one Wave Height number and eight-bar wavemeter**, descriptive wave character and period/wind. Use “Model estimate” beside the score.
- Safety: danger visible and expanded; caution visible but explanation collapsed; no unearned safety clearance.
- Essentials: suit and key temperatures.
- Two-hour window comparison: allow quick changes in session selection.
- Advanced information: score drivers, detailed measurements, weather details, model limits, Wave Wizard, Spot Insight and What to Wear.

### Best of Week
- Primary recommendation (named place, time, surf score, wave height) is the focus, **even if the best available score is poor**.
- Compare top distinct beaches below, not as equal-weight hero cards.
- Never imply a predicted session is a live observation or that “best” means safe.

### Wizard
- Goal first (board / when / where), then available days/hours, then geography.
- Clear progress and one prominent action per step.
- Results must distinguish **Surf Quality** from heuristic **Board Fit**.
- Do not display algorithm weights in the public UI. Note that current frontend JS source is nevertheless inspectable.
- Preserve specific user-chosen time windows when navigating back into Forecast.

## Surf editorial brand and typography refinement (Oct 2026)

Faro's visual identity draws from **Firewire / Libre Design** (clean precision with freedom), **GearFreak / Zomeren Studio** (professional outdoor credibility with modern expressive typography), **Coastline / ArloCreative** (restrained coastal lifestyle), and the grid/typography research by **Nielsen Norman Group**. This is design inspiration, not an endorsement or a replication of those companies' branding.

- **Display:** Barlow Condensed (500–800), visually expressive, tall, clear, short headlines. Use in Faro wordmark, Forecast section titles, Best of Week feature titles, Wizard step headings and short spot names. Do not use for model reading details, instructions or small labels.
- **Body & metrics:** Manrope (400–800), legible geometric grotesque, steady numerical tracking. Use for choices, scores, data, captions and all explanatory text.
- **Fallback:** Arial Narrow/Impact for display, system UI/Arial for body. Font stylesheet is fetched from Google Fonts with `display=swap`; respect offline and slow network fallbacks.
- **Logo:** typographic "FARO" accompanied by a small ocean glyph, not a pile of surf emoji illustrations.
- **Wave-character chip:** a compact clickable pill with its own border and low-saturation colour from the underlying character type; never leave Choppy & Messy floating as bare coloured text.
- **Titles:** clearer contrast in scale (display ≈ 43–55px; short screen headings ≈ 26–33px; section captions ≈ 11–13px). Avoid decorative all-uppercase running copy.
- **Typography trust rule:** numerical predictions remain Manrope, never in display faces. Warnings and assumptions must remain readable in both languages and themes.
- **Apple branding guidance:** custom headline typography is useful for product identity, but do not let it compete with the surf decision itself.

References:
- https://libredesign.com/case-studies/firewire-surfboards/
- https://zomeren.studio/projects/gearfreak/
- https://arlocreative.co.uk/coastline/
- https://www.nngroup.com/articles/good-visual-design/
- https://developer.apple.com/design/human-interface-guidelines/branding
- https://github.com/google/fonts/blob/main/ofl/barlowcondensed/OFL.txt
- https://fontsource.org/fonts/manrope/about

## Typography decision — Coastline / “Born on Waves” direction (2026-10-23)

User-selected visual direction: **the bold, wide, poster-like letterforms** associated with the Coastline / “Born on Waves” reference, while retaining a restrained, serious surf-forecast interface.

- Display / brand / major section headlines: **Archivo Black** (open-source, SIL OFL). A visual approximation of the reference's bold grotesque style; **not an assertion that it is the original designer's exact font**.
- Functional UI / weather values / score units / warnings: **Manrope**, preserving legibility and stable alignment.
- Compared with the previous condensed Barlow display, wide Archivo requires **smaller type sizes** and fewer competing display headlines, particularly at iPhone widths.
- Never use the poster style for safety instructions, technical descriptions, small labels or numeric readings.
- Typography is loaded via the Google Fonts stylesheet and has system-font fallbacks. No font binaries are committed.
- Keep the textured, expressive surf-brand tone in **typographic proportions**, not background artwork that would obscure model values.

Reference: [ArloCreative Coastline](https://arlocreative.co.uk/coastline/). The project's public page discusses clean surf-inspired typography but does not identify its exact font. Reference typeface: [Archivo Black](https://fonts.adobe.com/fonts/archivo-black).

## Visual tokens and intended use

- **Dark background:** deep charcoal / wet basalt, not pure black.
- **Light background:** cool off-white sea foam, not harsh pure white.
- **Teal:** branding, selected controls, links and subtle decorative ocean glow.
- **Surf Quality:** semantic graded palette plus words (Very poor, Poor, Fair, Good, Excellent).
- **Wave Height:** wave blue, independent of Surf Quality.
- **Surfaces:** one clearly differentiated session hero; everything else quiet, with borders only when they help a task.
- **Typography:** brand ~30–38 px, sectional ~18–21 px, hero score ~40–60 px, body 13–15 px; small text never serves as sole communication for essential information.
- **Rhythm:** align baselines, keep consistent 8/12/16/24 px spacing, avoid multiple nested boxed surfaces.

## Safety and accuracy invariants

- An actual thunderstorm / danger threshold is **not** collapsed away.
- Wind and wave hazards originate from the forecast model, **not** live water observations.
- No fabricated tide, rip current, water quality, route time, or webcam assertions.
- If a spot change is in progress, clear the old forecast and show an honest loading state.
- When multiple network requests overlap, only the most recent selection may update the forecast.
- On failure, show missing data rather than reused scores.

## Release checklist

- [ ] Forecast at ~320, ~375, ~390, ~430, tablet and desktop widths.
- [ ] Both colour themes checked visually, including the day cards and score colours.
- [ ] English and Chilean Spanish labels do not overflow cards.
- [ ] Screen reader announces selected day, score word and score magnitude.
- [ ] Interactive targets comfortable on iPhone; focus-visible states clear.
- [ ] Danger expanded, caution compact and explanatory text available.
- [ ] All changes in location and time update **every** dependent metric correctly.
- [ ] Failed fetch and rapid successive spot switches show no stale data.
- [ ] Contrast checks for ordinary text at least 4.5:1 and large text at least 3:1; key non-text UI boundaries at least 3:1.
- [ ] Test on real Safari/WebKit and with Open-Meteo data; JavaScript syntax checks alone do not establish runtime correctness.

## Next design questions (not implemented)

- Should one-tap favourite spots be prioritised over full geography selectors?
- Should Wizard remember a user's actual boards, volumes and comfort level?
- Should a travel-planning layer distinguish “good conditions” from “worth the drive” using a user-supplied departure location and safe route data?
- Should a future Live mode show camera and observations only where usage rights and appropriate data provenance are established?

This is a product design reference and implementation guide, not proof of calibrated surf forecast accuracy.

---

## Implementation checkpoint — 23 October 2026 (Coastal Editorial refinement)

The following items are now **implemented in the current main branch**, not only proposals:
- **Archivo Black + Manrope** retained: bold display for brand/editorial focus, Manrope for forecasts, controls and technical data.
- Forecast day selection and Best of Week rankings reject elapsed time windows. For a partially elapsed 2-hour slot, at least **40 minutes of usable forecast daylight** must remain. This threshold is about remaining surf time, **not a travel-time estimate**.
- The initial Forecast view advances to a later available day if today's daylight surf opportunity has passed. Explicitly selecting a day without an upcoming opportunity shows an honest no-session state rather than a misleading past recommendation.
- The two-hour window grid now uses short wave-character descriptors. Passed, late, unavailable and insufficient-daylight windows cannot be selected.
- Best of Week displays wave-character tags in bordered tinted pills, matching Forecast. The hard-coded calendar emoji depicting an unrelated date was removed.
- Wizard's original advanced flow is still accessible under a secondary expandable section. The main three-step Wizard remains primary.
- Shared spacing and typographic hierarchy adjusted across Forecast, Best of Week and Wizard. The single main session hero, eight-bar wavemeter, Surf Quality, Wave Height and model caveats remain.
- English/Spanish mappings added for previously untranslated major titles and new time-status messages.
- Cache stylesheet is now `faro-ui.css?v=9`.

### Validation and outstanding work

Implemented: `tests/faro-smoke.cjs` and `.github/workflows/faro-checks.yml`. Checks cover JS syntax, unique DOM IDs, CSS structural balance, basic theme invariants, date/time rules (including Europe/Amsterdam winter/summer) and selected translations. The smoke test was also evaluated against the live repository source after the changes.

**Not yet independently validated:** actual iPhone Safari rendering of these new commits, VoiceOver, measured layout overflow at 320/375/390/430 px, complete end-to-end Open-Meteo fetch and all Wizard steps in a browser, and colour contrast of every interaction state. Earlier iPhone images are the design baseline, not proof of the newly committed result. Never present these as passing until tested.

**Technical debt:** legacy CSS in `index.html` still competes with `faro-ui.css`, which currently uses many `!important` overrides. The current change is deliberately scoped to styling and functional UI defects; a subsequent regression-tested consolidation should migrate legacy styles without breaking the DOM/translation flow. Do not present source visibility of the scoring engine as confidentiality.

---

## Design pass: Surf culture without dashboard clutter (23 October 2026)

### Research considered
- Firewire × Libre Design: https://libredesign.com/case-studies/firewire-surfboards/ — clean lines, precision, playfulness; the identity should last longer than a visual trend.
- GearFreak × Zomeren: https://zomeren.studio/projects/gearfreak/ — Manrope, professional technical credibility plus outdoor energy.
- NN/g mobile carousel discoverability: https://www.nngroup.com/articles/mobile-carousels/ — expose continuation, provide accessible alternative controls, avoid swipe-only interaction.
- MDN scroll snap: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_snap — keep snapping local to the horizontal container.
- Web.dev responsive sizing: https://web.dev/articles/responsive-web-design-basics — do not create a horizontally scrollable entire document on mobile.
- Surfline ratings: https://support.surfline.com/hc/en-us/articles/36277684017819-Surf-Ratings-Colors — model ratings are guides rather than observed breaking waves.

### Implementation in main (after the previous v9 pass)
- Introduced `faro-ui.css?v=10`.
- Seven-day forecast **remains horizontally swipeable**, but now has previous/next controls with disabled states, a visible day-range count, and a quiet progress line. The scroller keeps its horizontal position when a spot/time/day triggers re-rendering; a selected offscreen day is brought into view. Swipe containment and page-width clipping are distinct: page scrolling stays vertical, the day rail is horizontal.
- Simplified the Spanish centre nav label to **Lo mejor** while preserving the editorial **Lo mejor de la semana** headline.
- Separated the visual vocabularies: **Surf Quality** retains semantic poor/fair/good colours; **Wave Height** now uses entirely marine blue/turquoise tones across all size classes in both light and dark modes. Its eight-bar wavemeter stays.
- Changed the sunlight note to a shorter **suggested cut-off**, keeping clear that this is a planning suggestion rather than a hazard clearance or an official beach restriction.
- Filled essential Spanish terms in beach/spot selection, day/time strip, Wizard options, exploratory disclosures and brief technical notes. Proprietary named features such as FARO Wizard / Wave Wizard can remain branded terms.
- A calm coastal identity should come from **editorial typography, waveform metrics, authentic surf vocabulary, sea-inspired colour and selective whitespace**, not stock tropical imagery, invented surf conditions, emojis in every row or extra boxed tiles.

### Practical design rules
1. Product decisions before decoration. Present location and date, then the strongest **available** daylight session, then optional evidence; label mediocre weeks as mediocre.
2. Use Archivo Black only where the heading conveys a significant navigational or editorial step. Manrope remains the data/control voice.
3. One primary recommendation card. Secondary content can be structured by thin rules and native disclosure controls.
4. Quality is not Wave Height. A tall wave is not automatically a good or safe wave; don't conflate their colour systems.
5. In the seven-day rail, the offscreen continuation must be visible/operable without touch gestures and the selected item must not disappear after interaction.
6. UI must work with long Dutch spot names and English/Spanish strings, 320/375/390/430 px; never shrink fonts indiscriminately to force fit.
7. Keep honest caveats on Open-Meteo modelled offshore wave height and limitations (currents, tide, observed breakers).

**QA evidence:** current source regression tests verify structural invariants, translation strings, JS syntax, and future-window logic. **Remaining unverified:** actual iPhone Safari rendering of the new v10 layout in both themes, live Open-Meteo error/timeout behaviour, VoiceOver focus order, precise page overflow at all target mobile widths. Do not claim these passed based on source checks alone.


### Detail disclosure refinement — v11

A subsequent pass aligns the collapsed **Wave Wizard**, **Spot Insight**, and **What to Wear** modules as quiet, accessible disclosure rows, with consistent borders, labels, padding, and visible expanded state. The expanded Wave Wizard no longer repeats its own large headline; a small `FORECAST WAVE CHARACTER` eyebrow introduces the chip and explanation. Essential model-based caution remains in the main hero, outside the disclosures; `Danger` continues expanded by default. Added missing short summaries to the English/Spanish translation dictionary.

The CSS asset version is now `faro-ui.css?v=11` so old iPhone styles are not reused. Source regression checks were updated and passed in an isolated JS evaluation with a **mock 340 px carousel**, including scroll preservation, last-day navigation and correct disabled arrow state. This is not a pixel-perfect Safari test.

Further references for editorial restraint:
- https://needessentials.com/en-gb/pages/about — practical surf culture rooted in only what is needed, not lifestyle gimmicks.
- https://www.nngroup.com/articles/accordions-on-desktop/ — structured progressive disclosure, clear indicators, and no critical information hidden.
- https://www.nngroup.com/articles/mobile-accordions/ — preserve orientation when opening an accordion on mobile.

**Next visual verification request:** new iPhone screenshots of the rail after swiping to days 5–7, selected last-day state, open/closed disclosures, 320–430 px light/dark and EN/ES. The project has no native screenshot evidence for this v11 build yet.


### Fair score colour correction — v12

On real light-theme iPhone screenshots, the brown-dominant `Fair / Regular` score felt inconsistent with the coastal palette. The `5.0–6.9` quality tier keeps its semantic amber association, but **large Fair numerals now use foreground graphite on light backgrounds** (Forecast's day rail, selected session hero, time slots, Best of Week and Wizard scores). The accent remains warm golden amber `#B16B00` in the light theme for selected outlines and discreet signals. In the dark theme, Fair remains a luminous gold `#E9BE60`. Good/Poor thresholds, Board Fit and blue Wave Height were not modified. The style is published as `faro-ui.css?v=12` and regression assertions cover the new treatment. Rendering in Safari still needs a visual check.

### Mobile horizontal overflow hotfix — v17 (24 October 2026)

An iPhone report showed that a horizontal swipe could pan the **entire document** into a white/blank area outside FARO, rather than scrolling only the seven-day rail.

- The prior fallback was `html,body{overflow-x:clip}`. This was replaced by stronger cross-WebKit `overflow-x:hidden!important` and `overscroll-behavior-x:none` on the root and body.
- Root `html` now paints `var(--bg)` in both themes; an inline early background fallback also paints the root before the external stylesheet loads. This avoids revealing an unpainted white canvas during bounce or slow style loading.
- `main` and principal Forecast/Best/Wizard containers are explicitly constrained to the viewport width and use `min-width:0`, without affecting the separate day rail.
- **Important:** `#dayStripItems` retains `overflow-x:auto` on mobile and its normal seven-day navigation. Desktop retains its seven-column non-scrolling layout. Do not use `touch-action:pan-y` on ancestors, as this would disable intentional horizontal gestures.
- Updated asset cache to `faro-ui.css?v=17` and enhanced source regression assertions. The existing Node smoke tests pass.

**Still unverified:** real iPhone Safari horizontal movement and visual output. The report may include native browser overscroll/rubber-band behaviour, which CSS can mitigate but cannot always eliminate. Test both light/dark and Forecast/Best/Wizard at 320/375/390/430 px. In Safari remote inspection compare `document.documentElement.scrollWidth` with `document.documentElement.clientWidth`, and inspect any element whose bounding rectangle extends beyond the viewport. Do not claim a Safari visual pass based on JavaScript/CSS checks.


### Safety regression and KNMI warning transparency — v18 (24 Oct 2026)

The Instagram storm report prompted an audit: prior `safetyAssessment` evaluated only a chosen 2-hour window and **mean wind** thresholds (55 km/h danger, 35 km/h caution), while Open-Meteo's gust variable was fetched but never passed into the safety decision. This could leave dangerous coastal gusts invisible even if an excellent surf window was shown.

**Implementation:** A separate `faro-safety.js` risk engine and a single safety centre directly after global navigation, **outside** Forecast / Best of Week / Wizard. It scans the upcoming 48 h of selected-spot hourly weather independently of score, day-selection or daylight: model wind gusts >=75 km/h trigger Danger; >=50 km/h Caution; thunderstorms trigger Danger; mean wind and water temperature retain their other screening heuristics. In the selected 2-hour session, the maximum gust and any thunderstorm code across both hourly samples now feed the expanded Danger assessment. This does **not** change Surf Quality or mean-wind scoring.

The banner provides a **persistent link to KNMI Zeeland** even without JavaScript/when the Open-Meteo request fails. For this particular event, a **dated KNMI bulletin** published at 07:43 on 24 Oct 2026 forecasts 75–90 km/h gusts in coastal areas from Sat 24 Oct 22:00 through Sunday 25 Oct (published official end around 23:00). The snapshot explicitly says it is not live and expires automatically on 25 October at 23:00 local. The 07:43 KNMI update explicitly said **no active warnings at that moment**: a forecast-for-tonight must not be labelled currently active. The Friday/overnight storm Austen and the expected Saturday-night Boelo weather should not be conflated.

**Critical limitation:** The official KNMI feed has NOT been connected to Faro automatically. Model warning thresholds are Faro heuristics and not KNMI's colour codes. The weather source only covers model-based risks and **cannot certify safe surfing, tides, currents, wave breaking or permitted access**. A future approved KNMI/MeteoAlarm backend feed is tracked in GitHub issue [#1](https://github.com/lukileke/zeeland-surf-check/issues/1). KNMI has announced new polygon-based alerts from 2 November 2026, subject to change; plan for this dataset transition.

The change is shipped as `faro-ui.css?v=18`. Source tests check severe and caution gust thresholds, thunderstorm danger, optional inputs, 48-hour scan, official bulletin expiry, initial HTML warning link, DOM mock rendering and accessible role priority. Source smoke suite passes. **A real iPhone Safari visual test remains outstanding** in both languages, all three tabs and both colour themes.

Official pages: https://www.knmi.nl/nederland-nu/weer/waarschuwingen/zeeland and https://english.knmidata.nl/latest/news/2026/10/07/transition-to-warning-on-a-local-scale .


### Coastal warning rail — v23 (24 October 2026)

User feedback from iPhone Safari made clear that the old v18 warning panel was too large and visually overwhelmed the day's forecast. The permanent safety entry now uses a **compact native HTML `<details>/<summary>` disclosure** in `faro-safety.js`, with a minimal coloured left accent in `faro-ui.css`.

**Collapsed is not hidden:** important hazard facts (model risk level, current spot, peak modelled gusts, sustained wind, storm where present, 48 h horizon, non-official-source limitation) remain visible at all times. Only supporting reasons, historic dated bulletin, model uncertainty detail and the external KNMI warning link move into the expandable body. No country toggle is present; Faro currently serves Zeeland only.

- Danger: restrained coral line + small severity chip; Caution: warm amber accent; Advisory: quiet ocean accent. Strong categorical wording is text, not colour alone.
- A native `summary` makes the whole rail tappable and keyboard-accessible. A small chevron changes direction when expanded. The user-open state survives ordinary app rerendering.
- Both EN/ES are constructed directly rather than relying on the legacy MutationObserver for essential warnings. KNMI's historical 24–25 Oct 2026 bulletin remains clearly identified as dated and not live, expiring at its previously documented end.
- Static fallback HTML has the same disclosure shape before JS and keeps a functional KNMI link inside.
- Versioned CSS asset `faro-ui.css?v=23`.
- Smoke check + real Chromium mobile QA completed successfully (320, 375, 390, 430 px; light/dark; EN/ES), including closed height limit, visible gust value, summary click/open/close and absence of root horizontal overflow. **Not a claim of physical iPhone Safari testing.**

Safety principle: a compact alert is acceptable only when the key danger information is never concealed; the surfer must not have to expand the rail to discover hurricane-strength gusts.


### Forecast microcopy: recommendation versus reader choice — 25 October 2026

The previous Forecast session hero was titled **YOUR SESSION / TU SESIÓN** even immediately after a reader chose only a *day*. FARO itself automatically picks the highest-scored valid two-hour daylight window, so that label incorrectly implied a personally planned or confirmed surf session.

New user-facing states:
- On initial forecast loading, after choosing a day, after switching beach/spot, or whenever FARO automatically replaces an unavailable time: **SUGGESTED WINDOW / HORARIO RECOMENDADO**.
- After the reader explicitly taps a time in **Find your time**, or follows a specific session from Best of Week, Wizard or Scriptable: **SELECTED WINDOW / HORARIO SELECCIONADO**.
- Changing the day returns the hero to **SUGGESTED WINDOW**, because the new time is chosen by FARO rather than by the reader.
- A manually selected interval never represents a reservation, live observed wave, or safety clearance; it is merely the forecast window being examined. Existing model-origin and safety qualifications stay visible.

No buttons, new panels, additional scores or numerical methods were added. The time range remains beside the headline, and the Chilean Spanish translation is maintained alongside the English copy. Automated smoke and mobile-browser tests check both state transitions and their localisation.


### FARO READ × FARO MATCH — 25 October 2026 (v28)

**Problem addressed:** Forecast looked too much like a conventional weather dashboard. Generic "Wizard" naming hid FARO's real differentiation (spot-oriented surf quality plus optional personal board and riding-style compatibility). Numerical metrics arrived before a simple, truthful reading of likely surf characteristics.

**FARO READ** is a compact editorial interpretation inserted below the date / best-window row in Forecast. It reuses the modelled wave height, period, wind speed, gusts and weather code from the *selected* two-hour window, so changing the day or manually comparing hours changes the read appropriately. The code lives in `surf-engine.js::quickRead(x,locale)` and is shared with the Scriptable widget. The interpretation is deliberately cautious: "could", "may", "model suggests"; it never claims on-beach observation, exact breaking-wave shape or safety clearance. Modelled thunderstorms and 75+ km/h gusts take precedence over an otherwise favourable wave-character description. The independent 48-hour safety warning remains untouched and remains above the forecast.

The READ module has (a) a small gold FARO symbol, (b) one headline, (c) one restrained supporting sentence, and (d) a compact **FARO MATCH** link. It introduces **zero additional numeric scores** or decorative weather data panels. The existing more technical score breakdown and safety context still live behind their appropriate disclosures. English and Chilean Spanish translations are provided for all READ states.

**FARO MATCH** is the primary navigation replacement for the generic "Wizard" tab. Its top-of-page editorial identity explains why it differs from ordinary surf forecasts: **Spot Quality ≠ Board Fit**, with the existing experimental-estimate caveat. The existing guided three-step search and original advanced tools remain functional; this is a product/visual rebrand, not a redesigned scoring algorithm. Clicking MATCH from within a forecast carries beach, spot and selected day into the guided form, preselects "Which board?", and leaves all choices editable. Clicking the navigation tab starts from the wizard's existing state. The result headline uses "FARO matches" instead of implying actual sessions were arranged.

**Design:** Keep supplied vector logo and official PDF colours. Use a quiet hairline above and below FARO READ rather than a bright coloured card nested inside the date summary. The MATCH hero uses its existing editorial weight and an ultra-faint copy of the real FARO logo, a gold signpost and careful model provenance; it never puts competing saturated colours beside safety alerts. Blue remains a control/focus colour; day and time selections retain the corrected dark-grey / pale-grey strokes.

**QA:** Live Chromium mobile tests check READ headline and English/Spanish copy, MATCH tab naming and handoff of beach/day/goal/scope. Smoke tests cover the shared interpretation's calm, strong-gust and thunderstorm branches. These tests do not prove visual rendering in a physical iPhone Safari.
