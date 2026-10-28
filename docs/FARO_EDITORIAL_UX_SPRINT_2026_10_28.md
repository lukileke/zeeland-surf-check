# FARO · Editorial UX refinement (28 October 2026)

## Scope & restore
- Original `main` preserved as `backup/faro-before-editorial-refinement-2026-10-28`.
- Work branch: `feature/faro-editorial-refinement-2026-10-28`; use **PR revert** to restore without rewriting history.
- This sprint edits Chile UI, map graphics, model-height presentation and regression tests. **It does not change the forecast or experimental potential scoring formula**, Zeeland predictions or data-collection permissions.

## Product intent
FARO helps surfers **read the sea** and pick a spot / time window with interpretable evidence. The primary question must be answered before a person opens model details or notices. It is not a weather-control dashboard, remote surf camera, or calibrated local breaking-wave simulator.

### Decisions from design principles
- [Mapbox: map design](https://www.mapbox.com/insights/map-design-process) — clear hierarchy, legible selected points, low cartographic clutter; avoid bright free-floating model vectors in the default Regional view.
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/maps) — keep the map's primary geographic content understandable beneath compact controls.
- [W3C WCAG 2.2: Use of Colour](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) — the colour is not the sole communication channel; S/W characters, text labels, outline patterns and numerical bearings also convey meaning.
- [NNGroup: Accordions](https://www.nngroup.com/articles/accordions-on-desktop/) — retain functional progressive disclosure; first-level forecast decisions should remain visible.

## Implemented
1. **One score/height module**: a unified, responsive two-column container with shared background and a single quiet divider, balanced padding and metric hierarchy. At phone widths, the two columns stack with a horizontal divider. The left panel continues to label the **experimental** score with its provisional cap and validation count.
2. **Passive offshore-height ruler**: the previously thumb-like circular position marker is entirely absent. Eight fixed coloured segments, printed `0 m / 1 m / 2 m+` reference points, and a clear **not breaking surf** label; no misleading slider. The numeric offshore model height remains unchanged and can exceed the ruler's 2 m+ visual ceiling. This appears in the selected-window and daily readout.
3. **HUD directional geometry**: one simple arrow shaft with an open chevron in a 28 px SVG viewBox, swell 2.2 units and wind 1.65 units; removed decorative tails, disconnected markers and cartoon-style strokes. Bearings remain data-driven and are rotated as **FROM + 180°**, not wave-refraction rays.
4. **Regional markers**: one compact pin with visible **S** and **W** guide-compatibility chips. Wind has a dashed border to distinguish from swell in monochrome. Other beach pins remain subordinate to the selected reference and accessible naming includes the guide status.
5. **Brand language**: low-saturation teal, seafoam, and coastal neutrals, semantic labels retained; no emoji placeholders and no unlicensed Surfline designs copied.
6. **María handoff**: update to the existing `docs/FARO_MARIA_ICON_BRIEF_68.md` with exact SVG geometry, static-ruler requirements and regional pin states.

## Scientific limitations, explicitly preserved
- `H² × T` is an uncalibrated relative offshore strength proxy used for a **directional signal only**; it cannot prove measured local breaking energy.
- The experimental Chile potential score has a provisional **7.9** cap and currently **0 validation sessions**. No formula changed during this UI sprint.
- Regional S/W chips report *angular fit to published guide ranges*, not spot-specific wave height, nearshore refraction, surf quality, safety or bank behaviour.

## QA checklist
- Automated: source regression for two-column structure, passive ruler, clean SVG shape, label-only colour semantics and asset-version refresh.
- Dynamic smoke: selecting another beach changes map fit/spot selection and HUD values; Regional view fits four beaches and defaults without offshore sample grid clutter.
- **Still required**: Safari iOS at 375/390/430 px and Chrome desktop at 1120/1440 px, light/dark and English/Spanish, actual vector tile rendering, contrast, horizontal overflow, S/W chips at different spot names.
- GitHub Pages propagation cannot be inferred from the source merge. Review in a browser after deployment.
