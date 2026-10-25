# FARO · Spot Fit calibration notes (v1)

Spot Fit lives inside **Forecast → Spot Insight**. It is a *research-informed compatibility hint*, not another 0–10 quality index, not a forecast of the exact breaking bank, and **never a safety clearance**.

The four compact indicators are:
- **Wind:** potentially favourable / mixed / less favourable / unknown.
- **Model waves:** directional fit with published **beach-level** exposure, not measured breaking swell. Short periods are treated cautiously.
- **Tide:** **not calibrated** for all 12 sectors. FARO does not yet ingest validated sector-level tidal response, so it does not invent an optimum.
- **Evidence:** says **beach-level only** until a sector has genuinely corroborated observations.

The one-line interpretation explains the current modelled fit. The live **Surf Quality** score, model hazard alert, Wave Wizard and FARO Match are **unchanged**.

## Files and responsibilities

| File | Edit when… |
| --- | --- |
| `faro-spot-evidence.js` | You find better **published, attributable evidence** about a beach: wind sectors, wave directions, restrictions and source links |
| **`faro-spot-signals.config.js`** | You want to **tune presentation thresholds or one sector's directional ranges**. This is the first file to edit together |
| `faro-spot-signals.js` | You deliberately want to change interpretation logic; generally leave this alone |
| `faro-spot-view.js` | You want to change labels, structure, translations and explanations |
| `faro-spot-signals.css` | You want to change spacing, colour or typography of the four tiles |
| `faro-spot-dna.js` | You want to add recorded field observations (currently browser-local and not automatically used for calibration) |

All 12 sectors have explicit entries in `sectorOverrides`, currently empty: **they inherit the beach-level guide**. This deliberate default avoids claiming that the western and central bank at the same beach are interchangeable at high precision.

## How to tune together

Open `faro-spot-signals.config.js` and change only the desired field. Commit to GitHub and increase the query version in `index.html` (such as `faro-spot-signals.config.js?v=2`) so Safari refreshes the settings.

**Example: a conservative wind-speed adjustment**

```js
thresholds: {
  wind: {
    favourableThrough: 17,   // was 19 km/h
    mixedThrough: 32,
    stronglyUnfavourableFrom: 38,
    gustConcernFrom: 55,
    offshoreToleranceDegrees: 65,
    onshoreToleranceDegrees: 65
  },
  wave: {
    nearSectorMarginDegrees: 15,
    veryShortPeriodSeconds: 5
  }
}
```

**Example: sector-specific candidate directions**

```js
sectorOverrides: {
  "Cadzand::West sector": {
    windFrom: [[100, 150]], // degrees FROM, candidate local window
    waveFrom: [[295, 345]], // MODEL waves FROM, not breaking-wave evidence
    // Do NOT mark validated until corroborated by actual field data.
  },
  // Keep all other spot IDs exactly as they appear in the file.
}
```

These example angles are **illustrative only** and are not being assigned as real calibration. Distinguish **wind direction FROM** from **where the swell is going**. The code uses the site orientation to infer a preliminary offshore/onshore component, then cross-checks the guide window. Wave direction is from the offshore model, not an observed reef or sandbar.

## Interpretation boundaries

- Favourable **wind** requires a light modelled wind, plausible offshore component and the beach's reported wind window. Very strong wind or strong gusts disqualify the favourable label.
- Wave-direction fit inherits an observed/published **beach guide direction**, and becomes **mixed** if the period is very short.
- The values are heuristic editorial thresholds, **not scientifically calibrated probabilities**; avoid claiming an 80% match or a precise tide window without observations.
- Published advice for kite, windsurf or wingfoil **must not automatically be treated as paddle-surf evidence**.
- Verify local signs, rip currents, groynes, tide and official coastal restrictions independently.

## What we can improve next

As field notes accumulate at a named spot, compare the model direction, wind and tide with *observed* surf shape/rideability at a specific time. Keep data provenance and replication counts. Only then consider a genuinely sector-specific wind, wave or tidal window. The present field notes do **not** automatically adjust Spot Fit, nor do they certify any bank.

Useful example sources: [Domburg Surfline guide](https://www.surfline.com/surf-report/domburg/584204204e65fad6a77095f9/spot-guide), [Westkapelle SurfInfo](https://surfinfo.nl/spots/westkapelle/), [Sluis beach zoning](https://www.gemeentesluis.nl/onze-stranden/) and [Cadzand.org](https://cadzand.org/nl/surfen.php#map).
