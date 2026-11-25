/* FARO · region adapter for the common experimental offshore response.
 * Zeeland's starting priors are derived from the legacy orientation and area
 * reference heights/periods, NOT from calibrated surf observations.
 * This is an opt-in research preview. Do not replace production rankings
 * or compare regions as measured surf quality until data/validation align. */
(function(root){
"use strict";
const finite=Number.isFinite;
const wrap=d=>(d%360+360)%360;
const band=(center,half)=>[wrap(center-half),wrap(center+half)];
function zeeland(input,orientation,reference,shared,engine=root.FaroChileScoreLab){
 if(!engine?.potentialScore||!shared||!reference||
 ![orientation,reference.min,reference.ideal,reference.periodMin,reference.periodIdeal,
 input?.swellHeightM,input?.swellPeriodS,input?.swellFromDeg,input?.windKmh,input?.windFromDeg].every(finite)||
 reference.min<=0||reference.ideal<=0||reference.periodMin<=0||reference.periodIdeal<=0||
 input.swellHeightM<0||input.swellPeriodS<=0||input.windKmh<0)return null;
 // The old linear direction fit scored >=8/10 within 30° (swell)
 // and 36° (wind). Reuse those as provisional full-fit guide sectors.
 const profile={waveFromDeg:[band(orientation,30)],windFromDeg:[band(orientation+180,36)]};
 // Anchor the common exponential response at 80% of the legacy area's
 // reference H²T. Anchor the energy gate at its historical minimum H²T.
 // Different regional priors, exactly the same response equation as Chile.
 const H={...shared,
  energyResponseScaleM2S:reference.ideal**2*reference.periodIdeal/Math.log(5),
  minimumEnergyGateM2S:reference.min**2*reference.periodMin};
 const science=engine.potentialScore(input,profile,H);
 if(!finite(science?.unrounded))return null;
 return {potential:Math.round(Math.max(0,Math.min(10,science.unrounded))*10)/10,
  responseScaleM2S:H.energyResponseScaleM2S,minimumGateM2S:H.minimumEnergyGateM2S,
  evidence:"legacy-profile-derived-uncalibrated",validated:false};
}
root.FaroRegionResponse=Object.freeze({zeeland});
if(typeof module==="object"&&module.exports)module.exports=root.FaroRegionResponse;
})(typeof globalThis!=="undefined"?globalThis:this);
