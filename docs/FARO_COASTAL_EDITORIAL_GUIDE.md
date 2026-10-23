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
