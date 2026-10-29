# FARO Chile | Coastal editorial art direction v3

This is a **visual** release. It does not change model input, scores, access restrictions, forecast validation or source claims.

## The design problem

FARO Zeeland's actual compact notice pattern in `faro-rhythm.css` is a slim rail: **severity + one-line reason + chevron** (~52 px where content fits), with evidence below a native disclosure. The previous Chile adaptation rendered a 3-row badge/kicker/headline/meta card, plus a bordered square around the FARO icon, which was larger and visually inconsistent. The formal presence of a logo is not a substitute for coherence.

## Brand direction

- Use the approved logo and teal/olive/blue roles; do not invent a new logo, an unrelated surf icon or new score palette.
- The first-level content is the daily read. Use a restrained wash, teal horizon stroke and large typographic lead. Keep Manrope for body and figures; Archivo Black for strong editorial headings only.
- Subordinate controls (region/spot picker, navigation rail, week index, model documentation) get hairlines and background hierarchy instead of nested cards.
- Score pigments remain the five semantic bands. Teal is navigation/brand; modelled ocean height remains blue. Amber is a reported restriction, **not** a negative surf-quality assessment.
- The coast map's established visual contract and geolocated markers stay as they are. The map/compass header shares the new editorial wash.
- FARO identity belongs in small consistent overlines (`FARO · EL PANORAMA`, `FARO · LECTURA COSTERA`), not repeated full logos in each panel.
- Focus-visible and the native summary/button states remain readable and interactive.
- Both light and dark themes use existing semantic colours; no darkened score pigments in light mode.

## Compact warning anatomy

`O` **REPORTADA**  *Ventanas · restricción recreativa*   chevron

The source/date line, report, verified-source links and warnings remain **inside the expandable content**. "Reported" is never upgraded to an asserted official active state. Alert expansion does not modify the model score. This is the same visual hierarchy as the Zeeland compact safety rail, with the FARO O used as an unboxed 19–22 px signature. On extremely narrow screens the decorative O may be suppressed to prioritise the hazard wording.

## Maintenance

This visual finisher is loaded after the old Chile contract at `chile/faro-coastal-editorial-v3.css`. Future changes should prefer editing this single finishing layer instead of adding more scattered `!important` patches across the historical styles. A later stylesheet consolidation can remove superseded rules after visual regression screenshots are accepted. Maintain existing mobile breakpoints and test at 375, 390, 430, 768, 1180 and 1440 px. Chromium coverage is not proof of pixel-perfect Safari rendering on physical iPhone hardware.
