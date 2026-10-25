# FARO · Approved Brand Identity Integration (25 October 2026)

## Sources supplied by the designer

- `Logo_mientras 2.svg`: authentic FARO logotype with integrated circular isotipo, retained in `assets/faro-logo.svg`. Original vector viewBox `0 0 128.81 43.63`.
- `salva_rojo.svg`: translucent coral protective-ring / salva symbol, retained in `assets/faro-salva-red.svg`. Original vector viewBox `0 0 126.82 126.5`, opacity 0.13. Its use is **restricted to the hazard disclosure watermark**. Do not use it as a general FARO logo.
- `colores_marca.pdf`: one-page brand-colour scale and token guide. The codes below are transcribed from the supplied PDF.
- `Captura de pantalla 2026-10-25 a la(s) 12.19.42 p.m..png`: light-mode mobile screenshot: original FARO wordmark, clean light canvas, ink outlines, ocean-blue selected navigation, warm hazard border with coral watermark, beach/spot filters, seven-day score rail.

## Source-of-truth colours

| Role | Official code | Guidance |
|---|---|---|
| Logo dark ink | `#1f3b3d` | Preserve original vector; controls and outlines in light mode |
| Logo golden centre | `#ffda71` | Preserve original vector; supporting signature |
| Model danger red | `#e55845` | Danger foreground and border, **not general score quality** |
| Coral accent / salva | `#f47b67` | Safety badge and translucent vector |
| Blue-grey base | `#526a74` | Muted annotations |
| Mist base | `#c9d8da` | Hairline borders |
| Deep blue | `#355baf` | Marine and supporting blue |
| Blue highlight | `#5878e0` | Active tabs and selected filters; never denotes Good surf |
| Score 0–2.5 | `#ce762e` | For `0 <= score < 2.5` |
| Score 2.5–5 | `#efbc62` | For `2.5 <= score < 5` |
| Score 5–7.5 | `#6b9347` | For `5 <= score < 7.5` |
| Score 7.5–10 | `#a4d156` | For `7.5 <= score <= 10` |

The four score bands **do not change** the scoring mathematics or the existing labels `Very poor / Poor / Fair / Good / Excellent`. Labels retain their current product meanings until expressly redesigned, and the numeric interval dictates the brand swatch. This avoids conflating the colour of a selected day with the quality of the underlying surf conditions.

Accessibility: pale yellow and lime swatches have weak contrast on white backgrounds; use deeper ink colours for small text and numeral glyphs as necessary, retaining the exact official hex for surrounding badge borders/fills. Screen readers receive scores plus text grades.

## Implementation

- `index.html` loads the SVG brand wordmark as a responsive image within the accessible `h1`, then applies `faro-brand.css?v=24` **after** the legacy and Coastal Editorial CSS.
- `faro-brand.css` defines the official colour tokens, dark-mode accessibility substitutions, selected-state blue, score bands and translucent safety watermark. Keep future additions in this token layer rather than appending contradictory overrides across multiple legacy files.
- `index.html` `scoreTone(v)` now appends a `brand-band-low/mid/regular/high` class while preserving the existing quality-grade class. This class is present in the Forecast seven-day strip, session numbers, Best of Week, Wizard and other surfaces using the shared `scoreTone` formatter.
- `faro-safety.js` still controls hazard severity and real-time model evidence. Style changes do not make official KNMI data live, infer breaking waves or reduce the visibility of serious gusts.
- The `salva_rojo.svg` watermark is limited to `.faro-safety-center.danger .faro-safety-summary::before`, visually behind the essential text with no pointer events. The disclosure remains a native keyboard-accessible `details/summary`.
- For dark mode, the logo is shown against a small pale background so its original ink remains visible; **do not silently recolour the vector.**

## QA

GitHub smoke tests assert the presence of both actual vector assets, source codes, score thresholds, and CSS integration. Mobile Chromium QA checks image loading, actual computed colour tokens, watermarked danger disclosure, responsive widths 320/375/390/430 px, theme and language combinations, and horizontal overflow. These do not replace native Safari testing on the user's phone.

Next visual review: ask for an actual phone screenshot after the deployed stylesheet clears cache, and adjust spacing, weight, background and mark positioning against the user's screenshot before treating visual parity as final.
