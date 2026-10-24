# FARO · Scriptable iPhone widget (Coastal Editorial v2)

**Updated:** 24 October 2026

Source: [`zeeland-widget.js`](../zeeland-widget.js). The file name is retained so existing Scriptable instructions do not break; the widget is now branded **FARO**, not Zeeland Surf Club / Golden Hour Surf Club.

## What changed

- **Consistent FARO colours and hierarchy:** foam/basalt backgrounds adapting to iOS light/dark mode, ink headlines, ocean-blue wave height, teal brand marker and the same quality grades as the live website. A normal iOS system font is used inside Scriptable for legibility; Archivo Black and Manrope are web fonts, not automatically available to Scriptable. No font files are installed or distributed.
- **Best of Week:** evaluates the 12 Zeeland surf spots in seven upcoming forecast days. Each candidate is an upcoming two-hour daylight window with at least 40 minutes of usable daylight.
- **Network:** Open-Meteo supports comma-separated latitude/longitude lists. Each widget refresh therefore fetches all selected spots in one Marine API query plus one Weather API query. A fixed beach fetches only its own sectors; selecting one exact spot fetches only that spot.
- **FARO shared model:** downloads `surf-engine.js` from the trusted same-site GitHub Pages deployment and caches it. Categories match the website: Excellent >= 8.5, Good >= 7, Fair >= 5, Poor >= 3, else Very poor. This is still a provisional modelled offshore quality heuristic, **not a validated breaking-wave observation** or a Spot DNA-calibrated score.
- **Safety:** checks the 48 h modelled gust maximum, mean wind and thunderstorm codes for selected forecast locations independently of the selected surf quality. Danger thresholds use the same preliminary screening values as the web app. If present, model wind risk stays visible even for a high surf score. This does **not** import live KNMI warnings, local bans, rip currents or tides.
- **Updates:** recent downloaded forecasts are kept in a 24-minute cache. If network refresh fails, a previously cached forecast can be shown only up to 12 hours old, explicitly marked as a cached model. After that the widget shows a no-data state, never a fabricated score. `refreshAfterDate` requests a refresh no earlier than 30 minutes, but iOS controls the actual timing.
- **Open FARO at the right session:** tapping the widget opens `?faroSpot=...&day=...&hour=...`; the web app selects the requested spot and future two-hour window, or falls back to its recommendation when outdated/unavailable.

## Sizes

| Scriptable widget family | Content |
|---|---|
| Small | FARO, prominent Surf Quality score and grade, chosen beach, next best daylight window, compact sea-state / warning |
| Medium (recommended) | FARO headline, score /10 + quality label, wave height in marine blue, period and wind, actual spot, day/time and wave character or wind warning |
| Large | Main forecast plus Wave Wizard character and two further promising dates/windows |
| Lock Screen inline | Compact FARO score and next best date/time |
| Lock Screen circular | FARO and numerical quality only |
| Lock Screen rectangular | FARO, spot, quality, day/time and severe-model indicator |

Lock Screen appearances are monochrome/tinted by iOS. Do not interpret coloured quality grading in Lock Screen as an official safety code.

## Widget parameters

In **Scriptable → Edit Widget → Parameter**, use:

- `BEST` (default): best forecast across all 12 spots over seven days
- `Domburg`, `Westkapelle`, `Oostkapelle`, `Cadzand`, `Brouwersdam`: best available future window in that beach's registered sectors
- `Domburg:Noordduine`: one specific spot
- Append `|ES` for Spanish, e.g. `BEST|ES` or `Domburg:Noordduine|ES`. English is the default; `|EN` is optional.

Unknown beach parameters display a clear error instead of silently changing location.

## Updating the existing iPhone widget

**Important:** committing to GitHub updates the hosted JavaScript file, **not a script already copied into the Scriptable app on your phone.** Updating the phone script is an explicit manual action.

1. Open the latest [`zeeland-widget.js` on GitHub](https://github.com/lukileke/zeeland-surf-check/blob/main/zeeland-widget.js) (or [raw source](https://raw.githubusercontent.com/lukileke/zeeland-surf-check/main/zeeland-widget.js)) on your iPhone.
2. Copy the **entire** script.
3. In **Scriptable**, open the existing Zeeland Surf Check / FARO script and replace its contents with the new code. Optionally rename the script to `FARO`; if you do, update the Script selection in your Home Screen widget.
4. Run the script **inside Scriptable** first to see the medium preview and confirm data can be fetched.
5. On the iPhone Home Screen, long-press the Scriptable widget, choose **Edit Widget**, select the correct script and adjust its Parameter (for example `BEST|ES`). You can add Scriptable widgets in small, medium, large and Lock Screen families separately.

The widget is entirely client-side, uses Scriptable's local cache directory and Open-Meteo, and does not sync any private information to a FARO backend. No automatic Scriptable-script update service is installed.

## QA and outstanding validation

Automated GitHub Actions `tests/faro-widget.cjs` executes the actual script in a simulated Scriptable API environment and checks 12-location query batching, seven days, size families, Spanish, wind warnings, caches, invalid parameters and network failure. `tests/faro-browser.cjs` verifies the website deep link opens a selected forecast window.

**Neither test is a native Scriptable/iOS screenshot test.** Actual widget dimensions, clipping, Home Screen light/dark/tint effects, Dynamic Type and Lock Screen accessory previews must be checked on an iPhone in Scriptable. On iOS the refresh schedule is not guaranteed by `refreshAfterDate`.

Research used: [Scriptable ListWidget docs](https://docs.scriptable.app/listwidget/), [WidgetStack docs](https://docs.scriptable.app/widgetstack/), [Apple Widgets HIG](https://developer.apple.com/design/human-interface-guidelines/widgets), [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api).
