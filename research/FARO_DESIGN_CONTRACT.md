# FARO product design contract — decision first

The shared console is the single visual owner for both coasts. Do not redesign regional heroes independently.

## Default hero
- Location/date, selected or best eligible model window, model score and grade.
- The window is the only dominant typographic element. No generic marketing headline or repeated weather sentence in a valid session.
- Only eligible time slots are visible by default, with time and score; caution remains visible. Expired, unassessed, dangerous and daylight-excluded intervals remain in a collapsed disclosure INSIDE the hero.
- Keep the explicit model caveat. For unavailable or caution states, retain the full warning and never imply clearance.
- No metric grid, thermal advice, exploration buttons, map or science in the hero.
- Preserve the original score pigments, ocean gradient and translucent diffuse animated FARO emblem. Do not change formulas or risk rules to change aesthetics.

## Outside hero
Seven-day rail remains above. Conditions (offshore height, period, wind), explanation, preparation, local interpretation, map and science are secondary. Avoid repeating the numeric values in prose. Retain the data and actions; do not erase information to meet a visual goal.
Use fluid/intrinsic CSS, container queries and shared components; no additional regional overrides. Validate both light/dark, mobile/tablet/desktop, zoom, language and unavailable/caution states. Passing a geometry test alone does not demonstrate design quality. Do not claim deployment or visual validation before observing it.

## Visual refinements, v10
- The emblem is a brand anchor rather than a small icon: SVG occupies 57% of its fluid glow envelope. Maintain blur, opacity, four arcs and animation. Reserve space for it; never cover the selected time.
- The hour rail uses a chronological, balanced four-column mobile comparison (fewer columns for narrow or enlarged text; all eligible intervals fit in a desktop row). Use the same quality pigment and proportional bar as the week rail. Do not add metrics to the hero.
- The day rail should show complete cards wherever possible, with swipe and accessible arrow controls. Preparation may preview the suit already recommended by the model without opening the disclosure.
- References consulted: https://support.surfline.com/hc/en-us/articles/13749782983579-Understanding-the-Spot-Forecast-Page-on-the-Surfline-Website ; https://www.surf-forecast.com/breaks/Domburg/forecasts/latest ; https://www.nngroup.com/articles/progressive-disclosure/ . Adapt the principles, not their branding or unsupported forecast claims.

## Information library
- Both coasts use a single three-group hierarchy: Your session, Explore the spot, Science & sources. Native disclosures use the same title, supporting metadata and chevron. Avoid cards nested in cards; tables are subordinate to evidence headings.
- Preserve all IDs, provider references, local guidance and official warning entry points. Keep official authority reachability distinct from model provenance. Do not imply verified alert status or equivalent regional data coverage.
- Provider links document forecast inputs; local references remain attached to Spot DNA. Technical equations and warning rules are unchanged. Do not enlarge or reintroduce data into the hero while refining this library.
