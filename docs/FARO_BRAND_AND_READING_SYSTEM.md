# FARO · Brand & digital reading system
**Version:** 1.0 · 11 November 2026 · design direction for Chile + Zeeland

## Brand promise
**FARO · Lee el mar. Elige tu momento.** / **Read the ocean. Choose your moment.**

FARO helps surfers interpret a changing coast. It is **not** a beach observer, safety clearance or local breaking-wave predictor. Its personality balances **coastal intuition** and **scientific humility**: memorable enough to feel like a surf product, precise enough to explain what is modelled and what remains uncertain.

### Ownable identity
- **Mark:** the existing original FARO O / beacon is the brand's distinctive asset. Use its strongest light expression once, in the hero. Do not wallpaper the interface with repeated O marks.
- **Motion:** one brief waterline sweep on a *user-triggered* change of reading state; no permanent glowing animation beside critical data. Honour `prefers-reduced-motion`.
- **Palette:** deep petroleum ocean surfaces, misty off-white text and restrained sea-glass accent. **Numerical quality score colours must reuse the canonical FARO five-band tokens**. Offshore height is a physical measurement and must never inherit the score palette. Safety and UV are separate semantic colours.
- **Typography:** bold Archivo for editorial headlines, Manrope for all values and explanatory labels. Numbers use tabular alignment; headings never compete with score numerals.
- **Shape:** a continuous marine instrument with engraved separators, not eight floating boxes. Rounded containers are reserved for major functional surfaces; the selected state deserves the stronger halo.

## First three seconds: the information hierarchy
1. **Decision:** which break, which 2-hour window, what kind of session might be possible?
2. **Evidence:** three physical numbers (offshore wave height, period, wind) and a concise model-derived character cue.
3. **Safety:** UV, model risks and dated access advisories must remain visible and meaningful without opening drawers.
4. **Deep reading (on demand):** directional factors, model limitations, source provenance and the coast map.

A numerical **FARO conditions index** is never labelled as breaking-wave height, and its quality is never implied to be a field-verified condition. When data is missing, show `—` and an explicit no-data state rather than a reassuring score.

## Interaction: two main depths
- **Lectura / Read:** useful without a click. The daily face shows one verdict and three physical cues. The selected-hour face shows its *actual model index*, not the exact same daily verdict repeated again.
- **Señales / Signals:** the same physical footprint gives the basis for the reading, with map and deeper evidence available where relevant.
- Additional scientific references are subordinate disclosures, never a compulsory third step to decide whether to look at the beach.
- On mobile, the timeline scrolls horizontally; on desktop all eight 2-hour windows remain legible. The selected state must also be represented programmatically with `aria-pressed`.

## Language principles
- Use short, grounded interpretations: *«Vale la pena revisar»*, *«Viento cruzado»*, *«Ventana por confirmar»*.
- Qualify inference: *«El modelo sugiere…»*, *«Altura oceánica modelada»*, *«Sin calibración local»*.
- Avoid unsupported guarantees: *«Olas perfectas»*, *«Condiciones seguras»*, *«Altura de la rompiente: 1,4 m»* when only offshore wave height is available.
- Avoid saying the same verdict in the hero, the daily card and the hourly detail. Repeat only what supports orientation (spot, time) or safety.

## Competitor lessons applied without copying
- **Surfline:** clearly separate quick live context from an extensible forecast; grade and metocean evidence are different representations.
- **Windy:** map and directional context are a technical lens, not a replacement for an immediately readable forecast.
- **Apple Weather:** compact horizontal hourly exploration and a predictable switch to detailed parameters.
- **Nielsen Norman Group:** keep secondary complexity out of the first scan; disclose through an obvious control with a clear label.

## Implementation contract
- One score-colour source of truth: `assets/faro-visual-system-v2.css` and the existing score-colour lock. Never invent alternative colour scales.
- No changes to `surf-engine.js` or Chile score computation as part of visual polishing.
- UI must be testable at **320, 390, 768, 1180 and 1440 px**, in ES/EN and light/dark; inspect actual screenshots and clickable geometry, not only DOM presence.
- Do not add new CSS sheets to fix a local cascade problem. Refactor the owning component, then remove or supersede obsolete rules in a separate, regression-tested architectural PR.
- Target reduction from the current 29 loaded Chile stylesheets in successive verified steps. Do **not** declare CSS consolidation complete until the count and `!important` use genuinely decrease.
- Retain dated provenance for archival or legal-risk notices. A research archive failure is not a live forecast outage.

## North-star review
Can someone look at FARO for three seconds and answer **«¿Dónde, cuándo y con qué incertidumbre?»** without needing to read a paragraph?

If not, remove, reorder or condense information before adding graphics.
