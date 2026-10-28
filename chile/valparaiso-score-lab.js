/* FARO Chile research scorer / v0.1 — NOT wired into the active website.
 * Interprets guide-sourced local directions and generic model parameters.
 * Experimental score: capped at 7.9 until measured beach validation.
 * NEVER a breaking-wave prediction, safety approval or official alert.
 */
(function(root){
 'use strict';
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
 const wrap=x=>((x%360)+360)%360;
 const delta=(a,b)=>Math.abs(((wrap(a)-wrap(b)+540)%360)-180);
 function distanceToRange(dir,pair){
  if(!finite(dir)||!Array.isArray(pair)||pair.length!==2||!pair.every(finite))return null;
  const x=wrap(dir),a=wrap(pair[0]),b=wrap(pair[1]);
  const contained=a<=b?(x>=a&&x<=b):(x>=a||x<=b);
  return contained?0:Math.min(delta(x,a),delta(x,b));
 }
 function directionalFit(dir,ranges,falloff){
  if(!finite(dir)||!Array.isArray(ranges)||!ranges.length)return null;
  const distances=ranges.map(range=>distanceToRange(dir,range)).filter(finite);
  if(!distances.length)return null;
  const distance=Math.min(...distances);
  return {value:clamp(1-distance/falloff,0,1),distance};
 }
 function strength(wind,gust,H){
  if(!finite(wind)||wind<0)return null;
  let value=wind<=H.windLowKmh?1:
   wind<=H.windMediumKmh?1-.2*(wind-H.windLowKmh)/(H.windMediumKmh-H.windLowKmh):
   wind<=H.windHighKmh?.8-.6*(wind-H.windMediumKmh)/(H.windHighKmh-H.windMediumKmh):
   Math.max(0,.2-(wind-H.windHighKmh)*.01);
  if(finite(gust)&&gust>=H.gustWarningKmh)value*=.4;
  return clamp(value,0,1);
 }
 function periodFit(sec,H){
  if(!finite(sec)||sec<=0)return null;
  if(sec<H.periodTooShortS)return clamp(.15+sec/H.periodTooShortS*.12,.15,.27);
  if(sec<H.periodModerateS)return .3+(sec-H.periodTooShortS)/(H.periodModerateS-H.periodTooShortS)*.4;
  if(sec<H.periodGoodS)return .7+(sec-H.periodModerateS)/(H.periodGoodS-H.periodModerateS)*.3;
  return 1;
 }
 function presenceFit(height,H){
  // A generic "some swell is present" proxy — not an ideal surf-height range.
  if(!finite(height)||height<0)return null;
  if(height<H.presenceWeakM)return clamp(height/H.presenceWeakM*.25,0,.25);
  if(height<H.presenceModerateM)return .3+.7*(height-H.presenceWeakM)/(H.presenceModerateM-H.presenceWeakM);
  return 1;
 }
 const t=(lang,es,en)=>lang==='es'?es:en;
 const bands=[
  {max:2,id:'copper',es:'Muy pobre',en:'Very poor'},
  {max:4,id:'amber',es:'Pobre',en:'Poor'},
  {max:6,id:'sand',es:'Regular',en:'Fair'},
  {max:8,id:'lime',es:'Prometedor',en:'Promising'},
  {max:11,id:'olive',es:'Muy prometedor',en:'Very promising'}
 ];
 function fitTag(key,val,lang){
  const states={windDirection:['Viento','Wind'],swellDirection:['Swell','Swell'],windStrength:['Intensidad','Wind strength'],period:['Período','Period'],swellPresence:['Oleaje offshore','Offshore swell']};
  const state=val>=.8?'positive':val>=.45?'mixed':'negative';
  const label=key==='windDirection'?
   [val>=.8?'Dirección favorable':val>=.45?'Viento lateral/mixto':'Dirección desfavorable',val>=.8?'Favourable direction':val>=.45?'Cross/mixed wind':'Unfavourable direction']:
   key==='swellDirection'?
   [val>=.8?'Swell entra bien':val>=.45?'Swell parcial':'Swell fuera de rango',val>=.8?'Swell direction aligns':val>=.45?'Partial swell fit':'Swell out of range']:
   key==='period'?
   [val>=.8?'Período con energía':val>=.45?'Período moderado':'Período corto',val>=.8?'Longer-period swell':val>=.45?'Moderate period':'Short period']:
   key==='windStrength'?
   [val>=.8?'Viento suave':val>=.45?'Viento moderado':'Viento intenso',val>=.8?'Light wind':val>=.45?'Moderate wind':'Strong wind']:
   [val>=.8?'Swell presente':val>=.45?'Swell limitado':'Swell débil',val>=.8?'Swell present':val>=.45?'Limited swell':'Weak swell'];
  return {id:key,label:t(lang,...label),state,criterion:t(lang,...states[key]),value:+val.toFixed(2)};
 }
 function read({windDirection,swellDirection,windStrength,period},locale,name){
  const es=locale==='es';
  if(windDirection.value>=.8&&swellDirection.value>=.8&&windStrength.value>=.65)
   return es?'Viento y dirección de swell bien alineados en el modelo; verifica el banco antes de entrar.':
    'Wind and swell approach look aligned in the model; check the actual sandbank before entering.';
  if(windStrength.value<.4)
   return es?'El viento podría desordenar la pared, aunque el swell tenga buena dirección.':
    'Wind could disturb the wave face even with a favourable swell direction.';
  if(swellDirection.value<.4)
   return es?'La dirección del swell encaja poco con la referencia publicada para este spot.':
    'Swell direction has limited compatibility with the published spot guide.';
  if(period.value<.4)
   return es?'El período corto puede limitar el empuje y la organización de las olas.':
    'Short period could limit wave energy and coherence.';
  return es?'Señales mixtas: el pronóstico orienta, pero la rompiente aún no está calibrada.':
   'Mixed signals: the model is indicative, while the breaking wave remains uncalibrated.';
 }
 function evaluate(config,spotId,input,{locale='es'}={}){
  const es=locale==='es';
  if(config?.active!==false||config?.status!=='experimental')throw Error('Only inactive experimental Chile configuration is supported');
  const profile=config.profiles?.[spotId];
  if(!profile)return {spotId,status:'unconfigured',score:null,tags:[],read:t(locale,'Spot pendiente de calibración.','Spot not yet calibrated.'),confidence:'not-calibrated'};
  // Directions are METEOROLOGICAL FROM; do not infer nearshore refraction.
  const keys=['windFromDeg','windKmh','swellFromDeg','swellPeriodS','swellHeightM'];
  if(!keys.every(key=>finite(input?.[key]))||input.windKmh<0||input.swellHeightM<0||input.swellPeriodS<=0)
   return {spotId,status:'incomplete',score:null,tags:[{id:'missing',state:'unknown',label:t(locale,'Faltan datos del modelo','Model inputs missing')}],read:t(locale,'No hay datos suficientes para generar un índice experimental.','Insufficient data for an experimental index.'),confidence:'incomplete',tideEvaluated:false,safetyAssessed:false};
  const H=config.heuristics;
  const windDirection=directionalFit(input.windFromDeg,profile.windFromDeg,H.angleFalloffDegrees);
  const swellDirection=directionalFit(input.swellFromDeg,profile.waveFromDeg,H.angleFalloffDegrees);
  const windStrength={value:strength(input.windKmh,input.gustKmh,H)};
  const period={value:periodFit(input.swellPeriodS,H)};
  const swellPresence={value:presenceFit(input.swellHeightM,H)};
  if(!windDirection||!swellDirection)throw Error('Profile direction bands not defined');
  const components={windDirection,swellDirection,windStrength,period,swellPresence};
  const directionalIndex=10*Object.entries(config.weights).reduce((sum,[key,weight])=>sum+weight*components[key].value,0);
  // Wind and directions alone cannot imply rideable surf when the input swell
  // is tiny or missing. A deliberately uncalibrated *offshore presence* gate
  // reduces the prototype index in such cases. It does NOT convert offshore
  // swell height into breaking wave height or incorporate secondary windsea.
  const swellAvailability=clamp(input.swellHeightM/H.presenceModerateM,0,1);
  const unrounded=directionalIndex*swellAvailability;
  const score=+Math.min(H.provisionalScoreCap,unrounded).toFixed(1);
  // The experimental cap saturates many different offshore conditions.
  // Preserve the unrounded arithmetic for auditing, NOT as a calibrated
  // hidden score, and disclose saturation explicitly in every UI surface.
  const capActive=unrounded>=H.provisionalScoreCap;
  const fieldSessions=Number.isInteger(config.calibration?.fieldSessions)?
   config.calibration.fieldSessions:0;
  const band=bands.find(b=>score<b.max);
  const label=t(locale,band.es,band.en);
  const tags=['windDirection','swellDirection','windStrength','period','swellPresence'].map(k=>fitTag(k,components[k].value,locale));
  tags.push({id:'tide',state:'unknown',label:t(locale,'Marea no calibrada','Tide not calibrated')});
  tags.push({id:'confidence',state:'unknown',label:t(locale,'Guía local; sin validar','Guide-based; unvalidated')});
  let vibe='mixed';
  if(windStrength.value<.4)vibe='choppy';
  else if(period.value<.4)vibe='short';
  else if(windDirection.value>=.8&&swellDirection.value>=.8)
   vibe=profile.kind==='river-mouth beachbreak'?'mellow':'clean';
  const vibes={
   mixed:[' MIXED · Variable',' MIXED · Variable'],
   choppy:[' CHOPPY · Picadas',' CHOPPY · Bumpy'],
   short:[' SHORT · Cortas',' SHORT · Short period'],
   mellow:[' EASYGOING · Bancos variables',' EASYGOING · Shifting banks'],
   clean:[' CLEAN LINES · Potenciales',' CLEAN LINES · Potential']
  };
  const modelRisk=finite(input.gustKmh)&&input.gustKmh>=75||input.windKmh>=55;
  return {
   spotId,spot:profile.name,status:'experimental',score,scoreLabel:label,band:band.id,components,
   capActive,fieldSessions,rawDirectionalIndex:+directionalIndex.toFixed(3),
   rawSwellAvailability:+swellAvailability.toFixed(3),
   tags,vibe:{id:vibe,label:t(locale,...vibes[vibe])},
   read:read(components,locale,profile.name),
   caution:profile['hazardContext'+(es?'Es':'En')],
   sourceIds:Object.values(profile.origins),modelRisk:{
    isScreened:modelRisk,
    label:modelRisk?t(locale,'Rachas/viento potencialmente peligrosos (criterio FARO)','Potentially hazardous wind (FARO screen)'):null,
    official:false
   },
   swellAvailability:+swellAvailability.toFixed(2),evidence:'published_guide_not_calibrated',tideEvaluated:false,nearshoreWaveHeightEstimated:false,
   safetyAssessed:false,confidence:'low',scoreCap:H.provisionalScoreCap,
   warning:t(locale,
    'Índice experimental con corrección por presencia de swell offshore; no estima ola rompiente, marea óptima ni seguridad.',
    'Experimental index with an offshore swell-presence adjustment, not breaking height, optimal tide or safety.')
  };
 }
 root.FaroChileScoreLab=Object.freeze({evaluate,directionalFit,distanceToRange,periodFit,strength});
})(typeof globalThis!=='undefined'?globalThis:this);
