# FARO · Scriptable iPhone/iPad widgets

**Chile widgets are not yet active**. This script still operates only in Zeeland, even though the website offers a Chile research section.

The same **`zeeland-widget.js`** script adapts to the widget size chosen in iOS. Add more than one copy of the widget and give each one a different **Parameter** in Scriptable's widget configuration.

## Actualización automática desde GitHub (recomendado)

Instala **una sola vez** el cargador de FARO. La lógica del pronóstico sigue estando en `zeeland-widget.js`, pero Scriptable descarga automáticamente su versión más reciente desde `main` cada vez que iOS vuelve a ejecutar el widget.

**Si ya utilizas FARO Zeeland v14/v15:** ejecuta una vez `FARO_AUTO_SETUP.js`. Este instalador localiza tu script, guarda una copia de seguridad de texto y reemplaza únicamente el contenido por `FARO_AUTO_WIDGET.js`. Conserva el **nombre** y, por tanto, la selección previa del widget en el iPhone. Si renombraste el script, crea en su lugar `FARO Auto`, que deberás seleccionar una vez.

**Instalación breve (copiar una vez en un nuevo script de Scriptable):**

```javascript
const url="https://raw.githubusercontent.com/lukileke/zeeland-surf-check/main/FARO_AUTO_SETUP.js";
const code=await new Request(url).loadString();
if(!code.includes("FARO · ONE-TIME Scriptable auto-update installer"))throw Error("Instalador inesperado");
await new ((async function(){}).constructor)(code)();
```

La próxima vez que iOS actualice el widget, el cargador consultará GitHub y ejecutará el código válido más reciente. La última copia descargada queda almacenada **en local** (`faro-auto-zeeland-last-good.txt`) para funcionar sin conexión. Si el archivo remoto es inválido o su ejecución falla, se intenta restaurar la versión anterior.

El intervalo real de refresco es **decisión de iOS**, no un mecanismo en tiempo real. El código descargado se ejecuta con los permisos de Scriptable: **confía únicamente en tu repositorio GitHub** y revisa los cambios antes de incorporarlos a `main`. Este mecanismo no comprueba firmas criptográficas. La revisión de sintaxis y estructura es una barrera básica contra descargas incorrectas, no una garantía frente a código malicioso.

## Widget sizes

| iOS widget size | FARO layout | Use |
| --- | --- | --- |
| Small square | Side-by-side score and offshore model wave height, window and surf cue | Quick glance |
| Medium rectangle | Unboxed Surf Quality + offshore-model tile + FARO VIBE strip | Everyday decision |
| Large square | Coastal Editorial with VIBE, wave direction / short reading or WEEK windows | Planning |
| Extra large (iPad only) | Expanded version of the large widget | Tablet |
| Lock Screen accessory | Short, circular or rectangular score | Lock Screen |

The size comes from iOS; a parameter cannot make a small iOS widget physically large.

**Deep Ocean Editorial v15** is a structural redesign, not merely a font/colour patch: a clean, unboxed Surf Quality number, a separate marine model-height tile, a slim five-colour meter and a stronger FARO VIBE strip. Large widgets use the same visual family, with source-labelled wave direction and better organised WEEK windows. Actual iOS height is compact, so a wind warning may take priority over the VIBE strip in medium/small sizes.

**New in v15:** medium and large widgets use an actual native-drawn marine background, a softly illuminated four-segment FARO rescue-ring motif, and flowing waterlines. The previous v14 generated an extremely faint image **while also assigning a gradient**, which could obscure the graphic in Scriptable. V15 uses the image alone for medium/large and reserves the fallback gradient for small/accessory or an image-rendering failure. Real source logo, score pigments, hazard prioritisation, model wave values and the four presentation styles are unchanged. Scriptable cannot continuously animate an iOS Home Screen widget. To upgrade an installed v14 Scriptable script, use a one-time updater or replace its contents with the full v15 code; changing GitHub alone does not update the locally stored script.\n\nThe layout uses a five-step copper→olive quality meter, model-wave bearings (direction FROM) where space permits, and SF Symbols for marine metrics. **The original FARO SVG logo is embedded in the widget script**, preserving the custom wordmark and rescue-ring 'O'. Scriptable renders the SVG to a high-resolution PNG on first run and caches it for future updates. For `THEME=AUTO` and default `DARK`, the widget uses a cohesive dark FARO background with the original white/yellow transparent logo directly on it — **no backing box**. Use `THEME=LIGHT` to show the original charcoal/yellow logo on a light widget. Scriptable's device appearance query does not work inside widgets, so AUTO intentionally does not attempt unreliable automatic colour switching.

**Preview recommendation:** compare `BEST|ES|STYLE=FLOW|THEME=DARK|SIZE=MEDIUM` and `BEST|ES|STYLE=WEEK|THEME=DARK|SIZE=LARGE`. iOS will ultimately decide its actual widget size and refresh timing. The preview is indicative, not a pixel-perfect final Home Screen render. Real forecasts remain model estimates, not live surf reports.

## Styles

- **FLOW** (default): FARO VIBE, bold numeric score, five-stage quality meter, an expressive coastal look
- **MINIMAL**: strong score and essentials with minimal commentary
- **DATA**: wave height, period and wind with marine SF Symbols
- **WEEK**: next daylight surf opportunities with score and modelled wave height, best in the large square

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
| `THEME=AUTO` | FARO's fixed dark coastal appearance, without a logo capsule (Scriptable cannot detect system appearance inside widgets) |
| `THEME=LIGHT` / `THEME=DARK` | Use the official transparent dark-ink / white FARO logo on matching light/dark backgrounds |
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

- Forecasts come from Open-Meteo. Height shown in the widget is **modelled total wave height**, NOT the wave height that breaks on a specific sandbank. Period is the modelled mean wave period; a separate primary-swell map is a future feature. All readings are forecasts, not beach observations.
- Score colours now use five quality bands shared with the website: copper (0–<2), amber (2–<4), golden sand (4–<6), lime (6–<8), and olive (8–10). The numerical score calculation is unchanged. Score numerals use **exactly the same five colours in light and dark**; only the background, body text and contextual elements change.
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


## Official FARO logo

The original source artworks are [`assets/faro-logo.svg`](assets/faro-logo.svg) (light background) and [`assets/faro-logo-dark.svg`](assets/faro-logo-dark.svg) (dark background). Do not replace the custom rescue-ring `O` with a generic circular character. The Scriptable conversion uses its `WebView` only on the first run per theme and caches the transparent PNG on-device. If conversion is unavailable, the widget falls back to a plain `FARO` wordmark rather than substituting a misleading icon. Re-run the script once inside Scriptable after replacing the source to populate the cache.
