# FARO · Camera-to-Forecast Learning: La Boca pilot
**Investigación y arquitectura · 26 October 2026**

## Resumen ejecutivo
Queremos inferir **condiciones observadas de la rompiente** mediante grabaciones de cámara autorizadas, y usarlas como objetivos (*ground truth*) para aprender la relación con el pronóstico marítimo que se emitió **antes** de esos momentos. El producto final debe responder *"¿vale la pena ir a surfear aquí mañana y cuándo?"*, no solo asignar un color al swell offshore.

**Estado: cámara de acceso gratuito encontrada, SIN permiso de captura/almacenamiento/ML, ninguna imagen almacenada, ningún modelo de visión entrenado.** El catálogo `camera-sources.json` bloquea explícitamente el uso para entrenamiento de cámaras ajenas.

## Cámaras y observaciones disponibles
| Fuente | Vista | Acceso para visualizar | Estado / permiso ML |
|---|---|---|---|
| [Lineup La Boca 1](https://lineup.surf/es/spots/chile/valparaiso/concon/la-boca-concon-1758/camera1) | Host Boca Surf | Gratis, **requiere crear cuenta/iniciar sesión** | Transmisión real no verificada en sesión; SIN licencia de grabación/ML |
| [Lineup La Boca 2](https://lineup.surf/es/spots/chile/valparaiso/concon/la-boca-concon-1758/camera2) | Host Surf Academy Concón | Premium | SIN permiso de uso ML |
| [Windmaster Reñaca](https://windmaster.cl/webcams/) | Vista de playa Reñaca | Página pública | Su página reportaba OFFLINE durante revisión; comprobar en persona |
| [Windmaster legacy Playa Amarilla](https://www.windmaster.cl/old/web/webcam/0/webcams.html) | Tres orientaciones: playa Amarilla, Punta Lilenes, hacia Quintero | Página antigua | NO equivale a cámara del peak La Boca ni Ritoque; disponibilidad desconocida |
| [UV marejadas La Boca](https://marejadas.uv.cl/CL15CCN01) | Modelo costero (~20 m) | Página pública | NO es cámara; requiere acceso numérico licenciado |

**Lineup FAQ:** https://lineup.surf/es/faq confirma que las cámaras gratuitas exigen cuenta; el rebobinado y descarga de vídeos están reservados a Premium. *Premium tampoco otorga derechos de entrenamiento*. Contacto para consultar licencias/colaboración: **aloha@lineup.surf**, con Boca Surf y Surf Academy Concón como anfitriones. No iniciar extracción automatizada sin autorización contractual. También aplica a snapshots visibles públicamente, ya que "visible" no significa reutilizable.

**Una alternativa estratégica probablemente más controlable:** trabajar con una escuela local o alojamiento para instalar **una cámara propiedad del proyecto** bajo consentimiento/permiso explícito y acordar acceso, captura, retención y entrenamiento. Esa cámara tendría una vista fija, calibrable y posiblemente más útil que una cuenta gratis de plataforma ajena.

## Hallazgo del forecaster local
La publicación de Lineup sobre La Boca describe:
- S / SSO → líneas potencialmente más largas y abiertas;
- NW → rompientes potencialmente más rápidas/huecas;
- corriente más fuerte durante grandes marejadas;
- fondo arenoso y condiciones variadas según época del año.
Fuente: https://lineup.surf/es/news/la-boca-en-vivo-bienvenida-a-la-nueva-camara-en-concon-chile

Son **opiniones cualitativas atribuidas al pronosticador, no verdades calibradas por estación**. Antes de entrenar esto como etiqueta habría que verificarlo mediante imágenes y observaciones independientes. No copiar textos, ratings, fotos o clips de proveedores a FARO sin licencia.

## Arquitectura científica propuesta
```text
[Forecast snapshot saved BEFORE valid time]
 Open-Meteo Hs, Tp, direction, multiple swells, wind/gusts
 + UV coastal node at ~20 m (only if permitted numeric data)
 + tide and water level from calibrated station/datum
                         |
                         v
              Forecast feature store
            issued / fetched / valid UTC
                         |
               time + spot / sector join
                         |
[Licensed surf-camera captures] -> [surf-zone ROI / privacy masks]
   time, fixed view, light, fog, camera health, framing
                         |
                         v
         Image/video analysis and QA
      A. weather/light/visibility filter
      B. breaking-crest detection and tracking
      C. wave events and sets (count, frequency, interval)
      D. opening wall vs closeout occurrence
      E. median rideable wall duration (if measurable)
      F. face height ONLY with camera geometry calibration
      G. surfer count optional aggregate; NO identity recognition
                         |
                         v
             Human reviewer labels
             blind to forecast score
                         |
                         v
       (model wave features -> observed features)
          Per-sector statistical correction
           tested on unseen swell episodes
                         |
                         v
   FARO: wave character / expected opportunity
          + measured forecast uncertainty
```

### Targets
1. `waveCount` per annotated standard observation interval (e.g. **10-minute clip**), allowing counting of broken waves rather than random image frames.
2. `surfableWaveCount` per interval; define operationally "forms an open rideable wall for at least X s" **after expert calibration**, not subjective every time.
3. `closeoutFraction` among visible broken waves (0–1), with adjudication of visually occluded waves.
4. `medianWaveFaceSeconds` from tracked wall persistence, where camera field of view is sufficient.
5. `rideability1to5` human score **per sector**, not a replacement for risk assessment.
6. `surface`: clean / mixed / choppy, with blind annotators and inter-rater agreement.
7. If camera is geometrically surveyed (pixel-to-world, reference water level, tide), optional wave-face heights in physical units; otherwise **do not estimate height from pixels alone**.

Record `cameraId`, exact spot sector ROI, camera azimuth/zoom, frame resolution, exposure, time window UTC, sunrise/clouds/fog/visibility, and explicit recording permission. Exclude nights, fogged lens, blocked views, camera repositioning and clips too short for statistical detection.

### Sample density
A fixed camera can provide many *frames*, but they are **not independent training examples**. A whole 10-minute clip yields one observation summary, and contiguous clips belong to the same storm/swell regime. Ideally capture broad seasonal regimes for many months, including offshore/onside wind transitions, a range of tide levels and mixed SW/NW systems. Manually label initial clips, measure inter-rater repeatability, train video detectors on a held-out camera-day/episode basis.

### Forecast version and causal matching
The offline joiner `camera-learning.cjs` pairs:
- `observedAtUtc`: centre time of the permitted 10-minute clip;
- `issuedAtUtc`: model-issue time, if known, **not** the `validAtUtc`;
- `ingestedAtUtc`: immutable time that FARO stored that prediction snapshot;
- `validAtUtc`: forecast valid instant near observed time (default ±60 min);
- `spotId`, `cameraId`, licensed and privacy-processed asset ID, labels and model variables.

**Strict default:** requires both model issue time and FARO ingestion time before the observed wave time. **Explicit fallback:** `--allow-unknown-issue-time` accepts only frozen snapshots actually retrieved BEFORE the observation, marks `forecastVintageStatus:retrieved_pre_observation_issue_unknown`, and never fabricates a model issue date. It is lower-quality provenance and should be reported separately in validation. Existing live FARO scores are NOT a safe training history; they change with each update.

### Evaluation, not vanity accuracy
- Baseline 0: existing guide/score thresholds.
- Baseline 1: regime-specific simple regression (e.g. calibrated logistic/ordinal or GAM) on swell, wind and, once available, tide.
- Model 2: tree-based gradient boosting on engineered wave-state × spot exposure features, if the number of distinct episodes justifies complexity.
- Vision model: pretrained crest segmentation/tracking, *fine-tune only on licensed authorised footage*; use blind human verification of detected events.
- Optional joint forecaster: temporal tabular model predicting camera-derived targets from **prior** forecast variables.
- Keep complete swells in the same train/validation/test split; reserve chronologically later seasons for honest generalisation. Use 3-day provisional groups only as a first guard until storms are explicitly identified; never claim these groups equal real physical swell events.
- Report ordinal MAE and agreement for rideability, Brier score for surfable opportunity if a probability is trained, precision/recall for wave-event recognition, precision for closeouts and failures by visibility/tide. Verify on unseen conditions / camera shifts and compare against trivial baselines.

### Operational and privacy policy
No scraping or session-cookie replay, private API extraction, automated browser recording, circumventing authentication, embedding restricted frames, or storage in the GitHub repository. Written permission must specify capture rate, images/derivatives, ML purposes, retention and deletion, attribution, sublicensing, access and commercial restrictions. Mask faces, body identifying details, private land areas and bystanders as far as practical; analyse breaking region ROI, not people. No facial recognition or individual tracking. Treat uncertain sightings as unknown, not clean.

## Current code and how to use it
- `camera-sources.json`: per-camera access and rights gate. Lineup entries marked **not granted**.
- `camera-learning.cjs`: offline JSONL pairer, exports `pair`; refuses unlicensed cameras, late-issued or late-ingested forecasts, incomplete labels, mismatched spots, bad UTC. Uses the **most recently ingested eligible frozen snapshot**, strict ±60-minute valid-time matching, and explicit weaker provenance when `--allow-unknown-issue-time` is supplied.
- `test-camera-learning.cjs`: synthetic rights, future leakage, group holdout, missing labels, matched spots and risk-free read tests; NO copyrighted imagery.
- When an owner explicitly grants permission, add **document ID**, `trainingRights:"written_training_permission_verified"`, `automatedCapturePermitted:true`, and `privacyPolicyReviewed:true` to an *authorised local-only* config. Do not publish private agreements, credentials, video or raw private images in GitHub.
- Example CLI with consented local files:
  ```sh
  node chile/camera-learning.cjs --catalog /private/approved-cameras.json --observations /private/manual-labels.jsonl --forecasts /private/frozen-forecast-snapshots.jsonl --out /private/paired-training-set.json
  ```
- Outputs a record bundle including explicit `train`/`holdout` groups only when at least five independent *provisional* temporal groups exist; below that all rows remain `research_only_not_train_ready`.
- Current `camera-sources.json` intentionally blocks ALL third-party camera training. A unit test with synthetic owned-camera data proves **code correctness**, not forecast skill, real camera rights or availability. Add `--allow-unknown-issue-time` for a frozen Open-Meteo snapshot captured before observed footage while retaining the explicit lower-quality vintage flag.

## Partnership and data requests (no messages sent)
1. Lineup at **aloha@lineup.surf**: permission for non-identifying 10-minute clips or periodic frames from La Boca; training, evaluation, derived stats and attribution; request fixed field-of-view parameters, timestamps, viewing angle; explicitly explain research use and public/private model boundaries.
2. Host schools **Boca Surf / Surf Academy Concón**: ask for original recordings or a dedicated project camera with camera placement/ROI, local guidance, and verified filming/data-processing permissions.
3. UV Marine/Coastal modelling **marejadas@uv.cl**: ask for historical model time series at CL15CCN01 and CL15VAS04, including issuance/valid time, spectral partitions, depth/tide reference, coordinate, terms of reuse, and how to obtain numeric series.
4. Seek official water level from SHOA with station/datum and timestamp, or a licensed source with explicit validity; don't equate tide model and bank-level surf.

## Methodological references
- Lineup La Boca camera blog https://lineup.surf/es/news/la-boca-en-vivo-bienvenida-a-la-nueva-camara-en-concon-chile
- Lineup FAQ https://lineup.surf/es/faq
- Windmaster cameras https://windmaster.cl/webcams/
- UV coastal model La Boca https://marejadas.uv.cl/CL15CCN01 and Reñaca https://marejadas.uv.cl/CL15VAS04
- UV Wave Atlas methodology https://oleaje.uv.cl/index.html
- Surfline Smart Cams privacy & features https://support.surfline.com/hc/en-us/articles/27224444365211-Smart-Cams-and-Privacy
- Image-based runup detection (Coastal Engineering 2024) https://www.sciencedirect.com/science/article/pii/S0378383924001480
- Nearshore data-driven correction (Applied Ocean Research 2024) https://doi.org/10.1016/j.apor.2024.104282
- Fixed-camera breaking-wave depth inversion (2026 research **preprint, not peer reviewed**) https://eartharxiv.org/repository/view/15662/


## Actualización 26/10/2026 · Archivo de pronósticos que realmente se emitieron ANTES de observar

**Nuevo ejecutable:** `chile/archive-forecast.mjs`. Captura los 3 pilotos de Valparaíso desde Open-Meteo marine + weather a horas UTC reales cada seis horas mediante [GitHub Actions](../.github/workflows/faro-chile-forecast-archive.yml), con ejecución inicial al integrar el workflow en main. Los snapshots van a la rama dedicada [`faro-research-data`](https://github.com/lukileke/zeeland-surf-check/tree/faro-research-data/research-data/chile/forecast-snapshots) en `research-data/chile/forecast-snapshots/YYYY/MM/` como **JSON comprimido `.json.gz`** inmutable por hora de consulta. Se conserva el primer JSON del 26/10/2026 en `main` como captura inicial, pero el flujo regular archiva en la rama de datos sin forzar despliegues de GitHub Pages. El esquema `1.0.0` conserva para cada uno:
- ubicación del punto costero y **coordenada real de la celda marina y meteorológica**;
- tiempo UTC `validAtUtc` de cada pronóstico; `fetchedAtUtc` y `ingestedAtUtc` del congelamiento;
- `issuedAtUtc:null` explícito porque Open-Meteo forecast live NO documenta la fecha de emisión de cada modelo en esta respuesta. NO falsificarla;
- swell principal y, si están disponibles, secundario/terciario, viento, viento marino, marea **modelada a MSL** si la API la devuelve; NO confundirla con nivel medido por SHOA ni referenciarla a la cota del banco;
- lluvia, rachas, UV y procedencia. Si una variable opcional falta queda `null`, no cero;
- `cameraFramesCollected:false` / `observedWaveData:false`, sin imágenes ni cuentas personales.

**Límites contractuales:** el servicio gratuito de Open-Meteo solo puede utilizarse sin fines comerciales. Aunque los datos utilizan CC BY 4.0, el **acceso gratuito a la API está sujeto a condiciones no comerciales**. Migrar a endpoint con licencia comercial antes de anuncios, suscripciones, comercialización o uso comercial del pipeline. Ver https://open-meteo.com/en/terms y https://open-meteo.com/en/docs/marine-weather-api.

**Activación operativa:** el workflow debe demostrar un primer ciclo exitoso y un JSON bajo `research-data/`; definirlo en código no significa que exista historial. GitHub puede retrasar cron o desactivar workflows programados tras inactividad; revisar Actions y permisos `contents:write`. Cada ciclo toma un snapshot nuevo, sin descargar cámaras ni inventar observaciones; las predicciones históricas ya publicadas no pueden ser reconstruidas con `past_days` como si fueran un archivo de predicciones anteriores.

**Importante:** el dataset de investigación seguirá sin entrenarse hasta contar con observaciones reales. Si las nuevas tomas son en vídeo de Lineup, se necesitará autorización explícita para captura, copia y ML; no hay forma legítima de convertir la cámara de acceso gratuito en una API privada.

## Nuevas bases para comparar oleaje observado
- **Universidad de Valparaíso:** https://marejadas.uv.cl/CL15CCN01, https://oleaje.uv.cl/descargas.html: el Atlas contiene informes de calibración de WaveWatch III, comparación con boyas y altimetría satelital, y análisis de sesgo. Esto fundamenta una corrección de modelado, pero no es medición en la rompiente.
- **SHOA / CENDHOC:** https://cendhoc.shoa.cl/solicitudes registra solicitudes científicas de nivel del mar, olas y corrientes. De ser necesarias series académicas, existen formularios y compromiso de uso; una finalidad comercial puede tener requisitos diferentes.
- **DGA hidrometría:** https://dga.mop.gob.cl/sistema-hidrometrico-en-linea/ presenta registros de caudales, calidad del agua y turbiedad según estación. Para La Boca interesaría identificar una estación de caudal del Aconcagua y la distancia/tiempo de propagación antes de modelar la influencia de la descarga del río sobre las condiciones locales.
- **Validación local:** la cámara debería entregar olas observadas y métricas de formación; la lectura de guías locales proporciona hipótesis físicas, pero no debe ser la etiqueta objetivo de entrenamiento.


## 26/10/2026 · FARO v2: calibration with reviewed manual surf data

The [calibrate-observations.cjs](calibrate-observations.cjs) module is a **real runnable offline statistical baseline**, not a trained camera-vision product. It can fit ordinal rideability (1–5), observed closeout fraction, and number of rideable waves per ten minutes **once sufficiently many genuine reviewed observations exist**. It never opens camera footage, downloads third-party frames, or changes the public app's scores.

**Current reality:** zero reviewed observations available to this repository. The regression has only passed synthetic deterministic tests. There is no defensible predictive error estimate for La Boca yet and no deployed AI weights. Do not show synthetic accuracy to surfers.

### Data provenance and explicit human review

Export the [FARO Field Notes](https://lukileke.github.io/zeeland-surf-check/chile/) JSONL file from your own browser (user-contributed observations remain on-device). The observations contain `observationId`, `spotId`, `cameraId` if applicable, Chile and UTC time, observed wave counts, classified campanas, rider rating, observation duration, and the forecast **already stored before** the observed instant. Raw video never accompanies the JSONL. An observation is `trainingEligible:false` and `reviewStatus:pending_review_not_training_data` until a separate human reviewer approves rights and quality.

Create a **private** JSONL review manifest, one row per genuine observation, such as:

```json
{"observationId":"real-id-from-export","reviewer":"human reviewer","reviewedAtUtc":"2026-11-15T17:00:00Z","qualityStatus":"accepted","dataRightsStatus":"manual_derived_facts_reviewed"}
```

The manifest is an attestation by a person who has reviewed the source data, not a checkbox to bypass camera provider terms. For **owned/licensed video annotation**, `dataRightsStatus` must be `written_training_licence_verified` and include `permissionDocumentId` (the actual signed agreement). No authorisation can be assumed from paid Lineup access; licence conditions still apply. Source providers may restrict even derived use.

Run:
```bash
node chile/calibrate-observations.cjs /private/faro-observations.jsonl /private/review-manifest.jsonl /private/calibration-research.json
```

The script excludes unknown rights, incomplete wave labels, wrong-spot forecast pairs, forecast versions saved **after** the video moment, and observations shorter than five minutes. It requires **at least 60 reviewed clips/sessions and 15 independent provisional three-day blocks for a given spot**, with a chronological 75/25 episode split and a sufficient unseen holdout. Its simple ridge baseline predicts a numerical measure of rideability, closeout percentage and waves per 10 minutes, evaluated against a constant training-set baseline. Its outputs are `researchOnly:true`, `deployed:false`. They must **not** be integrated into public scores until held-out accuracy and real session coverage justify it.

Do not conflate three-day blocks with actual storm events: the next methodological improvement is to group contiguous forecasts by shared directional swell episode and hold out complete swell systems, preferably across seasons. Re-evaluate when the camera moves, the bank changes or the observing definition changes. Collect human inter-rater reliability before scoring model skill. A confident interface can prioritise what to do and why, while detailed residual errors belong to the expandable methodology section at the bottom.

### Newly confirmed camera-source lineage

- [Lineup's interview with Buscaolas founders](https://lineup.surf/news/los-creadores-de-buscaolas-cuentan-su-historia) says Buscaolas was acquired by Lineup in 2025. [buscaolas.cl](https://buscaolas.cl/) now redirects to Lineup. Third-party camera directories linking Buscaolas or the old Los Lobos feed are **not an independent camera source or a reuse permission**.
- [Lineup terms](https://lineup.surf/terms-of-use) limit access to personal use and do not provide authorisation for scraping, redistributing, automatic recording or using video to train FARO. The Lineup camera 1 may be watched with an account, but cannot be silently ingested.
- [Windmaster webcams](https://windmaster.cl/webcams/) show Reñaca, Acapulco and other coastal feeds as OFFLINE at the time of this review; surf-camera availability and legal permissions must be checked before relying on those links.
