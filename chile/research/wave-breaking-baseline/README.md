# FARO · Research training with actual published wave-breaking labels

**26 October 2026** · Research result only, NOT public surf scoring.

## Fitted baseline (reproducible, actual published data)
The source is Hang Yin et al., *Scientific Data* **12**, 1722 (2025), [A Video Dataset for Nearshore Wave Breaking Type Classification](https://www.nature.com/articles/s41597-025-06005-5), DOI **10.1038/s41597-025-06005-5**, Table 3. The original repository [VWBT_9000](https://doi.org/10.6084/m9.figshare.28814993) describes **9,000 human-verified 30-second videos from 15 cameras across six coastal sites**. The classes are *plunging*, *spilling*, and *surging*, 3,000 each in the whole dataset. Study authors also report offshore ERA5 wind and wave records aligned with individual clips. Those per-clip records and videos are **not contained in FARO's current research repository**.

We reproduced **published, factual aggregate label counts** for each of six sites and fitted smoothed categorical priors. Run:
```bash
node chile/research/wave-breaking-baseline/train-breaking-priors.cjs /tmp/breaking-priors.json
node chile/research/wave-breaking-baseline/test-priors.cjs
```
Data: [breaking-types-published-aggregates.json](breaking-types-published-aggregates.json); fitted result: [breaking-types-trained-priors.json](breaking-types-trained-priors.json).

### Measured cross-site result
- Actual training counts: **9,000 published labels**, represented as six aggregate class-count vectors.
- Real video frames downloaded / decoded / modelled: **0**.
- Class labels: 3; 15 reported original cameras; 6 study sites (NONE in Chile).
- Prior over classes in the pooled balanced dataset: **1/3, 1/3, 1/3**.
- Leave-one-site-out negative log likelihood: **1.13485** nats, weighted by number of clips in held-out site.
- Uniform class-prior negative log likelihood: **1.09861** nats.
- **Result: fails to beat a trivial uniform prior when predicting unseen beaches.** This is not model accuracy on the pictures; it quantifies poor transfer of aggregate site class frequencies. A classifier without video features cannot predict individual breaking types.
- No neural-network model, video classification, Chilean surfability model or deployed weights were trained.

## Implications for the real FARO engine
1. It would be scientifically unjustified to infer a beach's closeout fraction, wave-face height or rideability from the global proportions of spilling/plunging/surging waves.
2. Our first meaningful *vision* target should be **wave-breaking classification** after verifying the specific Figshare item media licence and local personal privacy conditions. The paper is open access, but the licence for each media item must be confirmed separately; a generic licence policy is insufficient.
3. The next model should train on permitted frames/videos with **entire camera sites held out** (not shuffled individual frames), and compare against majority/uniform baselines. Report balanced accuracy, per-class precision/recall and error by site. Keep all clips from a single swell episode/group in one split.
4. Then adapt with genuinely labelled, permission-cleared Chilean camera clips, observing optical conditions, tide, swell partitions and local sandbar response.
5. Only after FARO has a separately validated association between forecast snapshots and human-reviewed observed surf may scores make specific rideability claims. Physical type classification is NOT equivalent to whether a wave is safe or fun.

## External sources & permissions
- Open dataset (confirm the licence for the exact item before media download): [Figshare VWBT_9000](https://doi.org/10.6084/m9.figshare.28814993)
- Study [Scientific Data 2025](https://www.nature.com/articles/s41597-025-06005-5)
- Study processing / CRNN code: https://github.com/comyo/Nearshore-Wave-Breaking-Type-Classification
- Other open camera research tools: https://github.com/caiostringari/deepwaves
- FARO original footage sources (Lineup / Marejadas UV): **neither has provided to FARO a verified training licence**. Public camera viewing does not authorize bulk recording by default.
- Open-Meteo forecast runs have distinct licence and endpoint rules, with noncommercial access restrictions; current forecast snapshots are immutable model inputs, not video labels.

**Publication/product rule:** This trained prior stays under `chile/research/`. The live surf score and FARO VIBE shall NOT read these priors or display derived percentages. No fictional validation, no synthetic media, and no source pixels distributed.
