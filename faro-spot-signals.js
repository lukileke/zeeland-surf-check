/* FARO Spot Fit / shadow interpretations, v1.
 * Deliberately separate from Surf Quality and from safety alerts.
 * Uses model wave DIRECTION, not a verified breaking swell or measured bank.
 */
(function(root){
 'use strict';
 const fallback={version:1,enabled:true,thresholds:{
   wind:{favourableThrough:19,mixedThrough:32,stronglyUnfavourableFrom:38,gustConcernFrom:55,offshoreToleranceDegrees:65,onshoreToleranceDegrees:65},
   wave:{nearSectorMarginDegrees:15,veryShortPeriodSeconds:5}
 },sectorOverrides:{}};
 const wrap=a=>((a%360)+360)%360;
 const valid=x=>typeof x==='number'&&Number.isFinite(x);
 const gap=(a,b)=>Math.abs(((wrap(a)-wrap(b)+540)%360)-180);
 const match=(dir,sets)=>{
  if(!valid(dir)||!Array.isArray(sets)||!sets.length)return null;
  return sets.some(pair=>Array.isArray(pair)&&pair.length===2&&valid(pair[0])&&valid(pair[1])&&(
   wrap(pair[0])<=wrap(pair[1])?
    wrap(dir)>=wrap(pair[0])&&wrap(dir)<=wrap(pair[1]):
    wrap(dir)>=wrap(pair[0])||wrap(dir)<=wrap(pair[1])
  ));
 };
 const near=(dir,sets,margin)=>{
  if(!valid(dir)||!Array.isArray(sets))return false;
  return sets.some(pair=>Array.isArray(pair)&&pair.length===2&&[pair[0],pair[1]].some(edge=>valid(edge)&&gap(dir,edge)<=margin));
 };
 function interpret(data){
  const C=root.FaroSpotSignalConfig||fallback;
  if(!C.enabled)return {enabled:false};
  const E=root.FaroSpotEvidence;
  const id=String(data?.spotId||''),record=E?.locateSector(id);
  const override=C.sectorOverrides?.[id]||{};
  const beach=record?.beach;
  const configWind=Array.isArray(override.windFrom)?override.windFrom:beach?.windSector;
  const configWave=Array.isArray(override.waveFrom)?override.waveFrom:beach?.sector;
  const th=C.thresholds?.wind||fallback.thresholds.wind;
  const wh=C.thresholds?.wave||fallback.thresholds.wave;
  const forecast=data?.forecast,windSpeed=forecast?.wind,windFrom=forecast?.dir,
   gust=forecast?.gust,waveFrom=forecast?.wd,period=forecast?.period;
  const orientation=valid(data?.orientation)?data.orientation:null;
  let wind='unknown',wave='unknown',tide='unknown';
  let windContext='',waveContext='';
  if(valid(windSpeed)&&valid(windFrom)&&orientation!==null&&configWind?.length){
   const offshore=gap(windFrom,wrap(orientation+180)),
    onshore=gap(windFrom,orientation),
    bestSector=match(windFrom,configWind);
   if(windSpeed>=th.stronglyUnfavourableFrom||(valid(gust)&&gust>=th.gustConcernFrom)){
    wind='unfavourable';windContext='wind-strength';
   }else if(offshore<=th.offshoreToleranceDegrees&&bestSector&&windSpeed<=th.favourableThrough){
    wind='favourable';windContext='light-offshore';
   }else if((onshore<=th.onshoreToleranceDegrees&&windSpeed>12)||
      (windSpeed>th.mixedThrough&&!bestSector)){
    wind='unfavourable';windContext='onshore-or-strong';
   }else{
    wind='mixed';windContext='cross-or-variable';
   }
  }
  if(valid(waveFrom)&&configWave?.length){
   if(match(waveFrom,configWave)){
    wave=!valid(period)||period<wh.veryShortPeriodSeconds?'mixed':'favourable';
    waveContext=!valid(period)?'period-unavailable':
     (wave==='mixed'?'short-period':'direction-in-range');
   }else if(near(waveFrom,configWave,wh.nearSectorMarginDegrees)){
    wave='mixed';waveContext='sector-edge';
   }else{wave='unfavourable';waveContext='outside-reported-window';}
  }
  // FARO does not have verified tide-to-wave relationships for any sector.
  // Only a future explicitly validated local config AND tide reading could
  // justify changing this badge; disabled in v1 by construction.
  const tideNote='not-modelled';
  const locallyValidated=override.validated===true;
  const confidence=locallyValidated?'local-evidence':'beach-guide-only';
  let verdict='uncertain';
  if(wind==='unfavourable')verdict='wind-challenge';
  else if(wind==='favourable'&&wave==='favourable')verdict='both-align';
  else if(wind==='favourable')verdict='wind-helps';
  else if(wave==='unfavourable')verdict='wave-question';
  else if(wind==='mixed'||wave==='mixed')verdict='mixed';
  return {
   enabled:true,spotId:id,wind,wave,tide,confidence,verdict,
   windContext,waveContext,tideNote,validationScope:locallyValidated?'local':'beach',
   values:{windSpeed:valid(windSpeed)?windSpeed:null,windFrom:valid(windFrom)?windFrom:null,
    waveFrom:valid(waveFrom)?waveFrom:null,period:valid(period)?period:null},
   evidenceNote:'Guide-derived candidate compatibility. It is not observed wave quality, an individual-bank prediction or a safety clearance.',
   configVersion:C.version
  };
 }
 root.FaroSpotSignals=Object.freeze({interpret,gap,match});
})(typeof globalThis!=='undefined'?globalThis:this);
