# FARO · Scriptable iPhone/iPad widgets

The same **`zeeland-widget.js`** script adapts to the widget size chosen in iOS. Add more than one copy of the widget and give each one a different **Parameter** in Scriptable's widget configuration.

## Widget sizes

| iOS widget size | FARO layout | Use |
| --- | --- | --- |
| Small square | Compact score, beach, window and a single surf cue | Quick glance |
| Medium rectangle | Surf Quality, wave height, period, wind and wave character | Everyday decision |
| Large square | Full surf summary and a choice of additional information | Planning |
| Extra large (iPad only) | Expanded version of the large widget | Tablet |
| Lock Screen accessory | Short, circular or rectangular score | Lock Screen |

The size comes from iOS; a parameter cannot make a small iOS widget physically large.

The redesigned layout uses a narrow coloured quality rail, larger score typography, a five-step quality meter, and SF Symbols for marine metrics. The background supports iOS light and dark appearances; no embedded logo raster is required.

## Styles

- **FLOW** (default): FARO VIBE, bold numeric score, five-stage quality meter, an expressive coastal look
- **MINIMAL**: strong score and essentials with minimal commentary
- **DATA**: wave height, period and wind with marine SF Symbols
- **WEEK**: next daylight surf opportunities, best in the large square

## Configure

In Scriptable, **replace the complete content of your existing FARO script** with the latest `zeeland-widget.js` source (or create a new script). Changes on GitHub do not overwrite scripts already saved in Scriptable. Add a Scriptable widget to the Home Screen, long-press it, choose **Edit Widget**, set **Script** to your FARO script and enter a **Parameter**.

Parameters use `|` to combine choices; order does not matter except that the first non-option term specifies the target.

| Parameter | Meaning |
| --- | --- |
| `BEST` | Best future window across the registered Zeeland beaches |
| `Domburg` | Best future window at Domburg |
| `Domburg:Noordduine` | Best future window at one FARO sector |
| `Cadzand:West sector` | Exact sector, preserving spaces |
| `ES` / `EN` | Spanish / English |
| `STYLE=FLOW` | Editorial appearance |
| `STYLE=MINIMAL` | Simplified appearance |
| `STYLE=DATA` | More forecast metrics |
| `STYLE=WEEK` | Next available windows |
| `THEME=AUTO` | Follow iOS Light/Dark |
| `THEME=LIGHT` / `THEME=DARK` | Force light/dark appearance |
| `SIZE=SMALL` / `SIZE=MEDIUM` / `SIZE=LARGE` | Preview only when running inside Scriptable |

### Ready-made widget configurations

```text
BEST|ES|STYLE=FLOW|THEME=AUTO
Domburg:Noordduine|EN|STYLE=MINIMAL|THEME=DARK
Cadzand:West sector|ES|STYLE=DATA|THEME=LIGHT
BEST|ES|STYLE=WEEK|THEME=AUTO
Westkapelle|ES|STYLE=FLOW|THEME=AUTO
```

You can use these in separate widgets simultaneously. For example, put a **FLOW medium widget** next to a **WEEK large widget**, or a small **MINIMAL** widget for a favourite spot.

## Preview

When running the script from within Scriptable, append `SIZE=SMALL`, `SIZE=MEDIUM` or `SIZE=LARGE` to inspect a different size. The actual widget size is always determined by iOS.

## Data and limitations

- Forecasts come from Open-Meteo. Wave, period and wind values are **model predictions, not beach observations**.
- Score colours now use five quality bands shared with the website: copper (0–<2), amber (2–<4), golden sand (4–<6), lime (6–<8), and olive (8–10). The numerical score calculation is unchanged. Large numerals use brighter matching tints in dark mode and legible ink tints in light mode.
- The user-facing Poor / Fair / Good labels follow their own verbal thresholds.
- Weather safety warnings take priority over stylistic commentary, but do **not** substitute for official alerts and visual checks at the spot.
- iOS controls when widgets refresh. A 30-minute requested refresh does **not** guarantee 30-minute updates.
- Successful model responses are cached for approximately 24 minutes. Up to 12-hour-old data may be shown if an update fails, but only with a **cached model** label.
- A tap opens the selected FARO spot, date and two-hour window on the website.
- Widgets and the web reuse the same shared `surf-engine.js` scoring engine. The widget caches this file locally for up to six hours and refreshes it when needed; new script versions use a new cache key.
- The North Sea wave model does not resolve the changing sandbars, true breaking-wave shape, safe entry routes, tides or local hazards of each subspot.

## Files

- `zeeland-widget.js`: Scriptable widget
- `surf-engine.js`: shared scoring and wave-character engine
- `faro-spot-evidence.js`: beach guide registry and indicative research
- `faro-spot-view.js`: mobile web UI for each sector

