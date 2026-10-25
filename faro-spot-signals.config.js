/* FARO Spot Fit / editable research calibration, v1.
 * Change values HERE without editing the forecast UI or scoring engine.
 * Research-backed beach sectors are read from faro-spot-evidence.js.
 * These thresholds are INITIAL HEURISTICS, not calibrated physical optima.
 *
 * Angles use meteorological direction FROM, degrees clockwise from north.
 * For future per-sector evidence, set the sector override explicitly:
 *   "Cadzand::West sector": {windFrom:[[100,160]],waveFrom:[[295,345]],validated:true}
 * Only set validated:true after an independently corroborated LOCAL survey.
 */
(function(root){
 'use strict';
 const config={
  version:1,
  enabled:true,
  thresholds:{
   wind:{
    // km/h; these are conservative presentation bands, NOT safety thresholds.
    favourableThrough:19,
    mixedThrough:32,
    stronglyUnfavourableFrom:38,
    gustConcernFrom:55,
    offshoreToleranceDegrees:65,
    onshoreToleranceDegrees:65
   },
   wave:{
    // "wave direction" is a MODEL TOTAL WAVE direction, not measured swell.
    nearSectorMarginDegrees:15,
    veryShortPeriodSeconds:5
   }
  },
  // Unknown tide by default: no real tidal height or verified sector-specific
  // response is included in FARO's current input data.
  tide:{requireVerifiedSectorAndLiveTide:true},
  // A single source of truth for beach-level directions: FaroSpotEvidence.
  // Null = INHERIT BEACH LEVEL, not absence of waves or dangerous conditions.
  sectorOverrides:{
   "Domburg::Noordduine":{},
   "Domburg::Central beach":{},
   "Domburg::West sector":{},
   "Westkapelle::North beach":{},
   "Westkapelle::Central area":{},
   "Oostkapelle::Main beach":{},
   "Oostkapelle::West sector":{},
   "Cadzand::Cadzand-Bad":{},
   "Cadzand::West sector":{},
   "Brouwersdam::North beach":{},
   "Brouwersdam::Central beach":{},
   "Brouwersdam::South beach":{}
  }
 };
 root.FaroSpotSignalConfig=config;
})(typeof globalThis!=='undefined'?globalThis:this);
