/*
 * FARO Chile · physics-informed feature laboratory v0.1
 * No UI quality score, no breaking-wave height, no safety assessment.
 * The exported quantities are model diagnostics, NOT measured nearshore surf.
 * Real forecasting requires verified bathymetry, tides, model issue times,
 * local observations and prospective error assessment.
 */
(function(root){
'use strict';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const wrap=deg=>((deg%360)+360)%360;
const gap=(a,b)=>finite(a)&&finite(b)?Math.abs(((wrap(a)-wrap(b)+540)%360)-180):null;
function component(name,heightM,periodS,fromDeg){
 if(![heightM,periodS,fromDeg].every(finite)||heightM<0||periodS<=0)
  return {name,available:false,heightM:null,periodS:null,fromDeg:null,proxyM2S:null};
 return {name,available:true,heightM,periodS,fromDeg:wrap(fromDeg),
  // Hs^2 * characteristic model period is only a relative proxy. The actual
  // wave-power equation requires the spectral ENERGY PERIOD Te (not any T).
  proxyM2S:heightM**2*periodS};
}
function guideDistance(deg,interval){
 if(!finite(deg)||!Array.isArray(interval)||interval.length!==2||!interval.every(finite))return null;
 const v=wrap(deg),a=wrap(interval[0]),b=wrap(interval[1]);
 const inside=a<=b?v>=a&&v<=b:v>=a||v<=b;
 return inside?0:Math.min(gap(v,a),gap(v,b));
}
function guideCompatibility(fromDeg,ranges){
 if(!finite(fromDeg)||!Array.isArray(ranges)||!ranges.length)return null;
 const distances=ranges.map(x=>guideDistance(fromDeg,x)).filter(finite);
 return distances.length?Math.min(...distances):null;
}
function evaluate(slot,spotGuide=null){
 const main=component('primary',slot?.swellHeightM,slot?.swellPeriodS,slot?.swellDirection);
 const optional=(name,obj)=>component(name,obj?.heightM,obj?.periodS,obj?.fromDeg);
 const secondary=optional('secondary',slot?.secondarySwell);
 const tertiary=optional('tertiary',slot?.tertiarySwell);
 const systems=[main,secondary,tertiary];
 const available=systems.filter(x=>x.available&&x.proxyM2S>0);
 // Do not treat missing secondary/tertiary partitions as known zero.
 const partitionsComplete=systems.every(x=>x.available);
 const proxies=partitionsComplete?available.reduce((v,x)=>v+x.proxyM2S,0):null;
 const observedFraction=proxies>0?
  systems.map(x=>({name:x.name,fraction:x.available?x.proxyM2S/proxies:null})):null;
 const strongest=[...available].sort((a,b)=>b.proxyM2S-a.proxyM2S);
 const crossing=strongest.length>=2?gap(strongest[0].fromDeg,strongest[1].fromDeg):null;
 // Wind-wave Hs over total Hs is a sea-state magnitude proxy, NOT
 // a direct probability of a choppy breaking face.
 const windSeaRatio=finite(slot?.windSeaHeightM)&&finite(slot?.totalWaveHeightM)&&slot.totalWaveHeightM>0?
  Math.max(0,slot.windSeaHeightM/slot.totalWaveHeightM):null;
 const gustExcess=finite(slot?.gustKmh)&&finite(slot?.windKmh)?
  Math.max(0,slot.gustKmh-slot.windKmh):null;
 const windGuideAngle=guideCompatibility(slot?.windDirection,spotGuide?.windFromDeg);
 const swellGuideAngle=guideCompatibility(slot?.swellDirection,spotGuide?.waveFromDeg);
 return {
  status:main.available?'diagnostic_only':'insufficient_inputs',
  systems,secondarySwellAvailable:secondary.available,
  tertiarySwellAvailable:tertiary.available,
  proxiesComplete:partitionsComplete,proxySumM2S:proxies,relativeProxies:observedFraction,
  crossingAngleDeg:crossing,crossingScope:crossing===null?'not_resolved':'two_highest_proxy_swell_partitions',
  windSeaToTotalHeightRatio:windSeaRatio,gustExcessKmh:gustExcess,
  guideFit:{windAngularDistanceDeg:windGuideAngle,swellAngularDistanceDeg:swellGuideAngle,
   evidence:'guide_only_not_georeferenced'},
  verifiedLocalPhysics:{shorelineNormalDeg:null,bathymetry:null,tidalStage:null,
   diffractionModel:null,breakingWaveHeightM:null},
  predictedSurfQuality:null,confidenceProbability:null,validated:false,
  caveats:['Model-only offshore diagnostic','Period type is not verified energy period Te',
   'Missing partitions do not imply zero contribution','Guide azimuths are not measured coastline orientation',
   'Breaking wave, tide and safety are not assessed']
 };
}
root.FaroChilePhysicsLab=Object.freeze({evaluate,component,gap,guideDistance,guideCompatibility});
})(typeof globalThis!=='undefined'?globalThis:this);
