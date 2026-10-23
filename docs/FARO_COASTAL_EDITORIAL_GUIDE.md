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
