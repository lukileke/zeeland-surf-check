/* Zeeland Surf Check shared scoring engine. Used by web app and iOS widget. */
(function(root){
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const angle=(a,b)=>Math.abs(((a-b+540)%360)-180);
const surfProfiles=[
 {name:'Domburg',min:.45,ideal:1.05,max:2.05,periodMin:4.2,periodIdeal:8.0},
 {name:'Westkapelle',min:.55,ideal:1.15,max:2.15,periodMin:4.5,periodIdeal:8.0},
 {name:'Oostkapelle',min:.45,ideal:.95,max:1.85,periodMin:4.2,periodIdeal:7.8},
 {name:'Cadzand',min:.45,ideal:.95,max:1.9,periodMin:4.2,periodIdeal:7.8},
 {name:'Brouwersdam',min:.5,ideal:1.05,max:1.95,periodMin:4.3,periodIdeal:8.0}
];
function qualityComponents(h,period,wd,wind,dir,orientation,ai){
 const p=surfProfiles[ai],off=(orientation+180)%360;
 const windQuality=clamp(10-angle(dir,off)/18,0,10)*clamp(1-Math.max(0,wind-14)/40,.15,1);
 const swellQuality=clamp(10-angle(wd,orientation)/15,0,10);
 const heightQuality=h<p.min?clamp(6*h/p.min,0,6):h<=p.ideal?6+4*(h-p.min)/(p.ideal-p.min):clamp(10-8*(h-p.ideal)/(p.max-p.ideal),0,10);
 const periodQuality=clamp(10*(period-p.periodMin)/(p.periodIdeal-p.periodMin),0,10);
 const surf=clamp(.3*windQuality+.25*swellQuality+.25*heightQuality+.2*periodQuality,0,10);
 return {windQuality,swellQuality,heightQuality,periodQuality,surf};
}


function weatherPenalty(p,c){let x=p>=7?2.5:p>=2?1.2:p>=.5?.4:p>0?.1:0;return x+(c===48?3:c===45?1.5:0)+(c>=95&&c<=99?5:0)}
function waveCharacter(x){if(!x)return {name:'Forecast unavailable',emoji:'🌫️',description:'No wave data for this window.'};let name,emoji,detail;if(x.wind>=38){name='Wild & Windy';emoji='💨';detail='Strong wind is likely to disrupt the surface and make paddling demanding.'}else if(x.period<5&&x.wind>=18){name='Choppy & Messy';emoji='🌪️';detail='Short-period wind waves with closely spaced, bumpy sections.'}else if(x.h<.45){name='Tiny & Tricky';emoji='🐚';detail='Small waves: bring extra volume if you want to catch more rides.'}else if(x.period<5){name='Short & Soft';emoji='〰️';detail='Very short-period waves may arrive close together; the shape and push at the beach remain uncertain.'}else if(x.period>=8&&x.wind<20&&x.h<=1.7){name='Clean Lines';emoji='✨';detail='Longer-period energy and relatively light wind could offer more defined lines.'}else if(x.period>=5.5&&x.h<=1.5&&x.wind<25){name='Mellow & Cruisy';emoji='🏄';detail='Potentially playful waves for relaxed trimming, carving and smooth turns.'}else if(x.h>=1.8){name='Punchy & Powerful';emoji='⚡';detail='More energy and potentially challenging sections; check the break carefully.'}else if(x.wind<20){name='Easygoing Sessions';emoji='☀️';detail='Manageable-looking conditions, though actual wave shape depends on the beach.'}else{name='Mixed Bag';emoji='🌊';detail='Variable conditions: some rideable sections may be mixed with chop.'}return {name,emoji,description:detail+' Modelled waves '+x.h.toFixed(1)+' m · '+x.period.toFixed(1)+' s · wind '+x.wind.toFixed(0)+' km/h. These are offshore indicators, not measured breaking-wave shape.'}}
/* FARO READ: model-derived editorial interpretation. No change to the
   numeric Surf Quality algorithm; wording never claims measured surf, tides
   or actual breaking-wave shape. Both web and Scriptable use this function. */
function quickRead(x,locale='en'){
 const es=locale==='es';
 if(!x||![x.h,x.period,x.wind].every(Number.isFinite)){
  return {key:'unknown',headline:es?'Sin lectura disponible':'No model read available',
   detail:es?'Revisa los datos de pronóstico antes de decidir.':'Check the model forecast before deciding.',
   short:es?'Sin datos':'No data'};
 }
 const storm=Number.isFinite(x.code)&&x.code>=95&&x.code<=99;
 const gust=Number.isFinite(x.gust)?x.gust:0;
 let key='mixed';
 if(storm)key='storm';
 else if(gust>=75||x.wind>=55)key='windRisk';
 else if(x.wind>=38)key='windy';
 else if(x.period<5&&x.wind>=18)key='choppy';
 else if(x.h<.45)key='small';
 else if(x.period<5)key='short';
 else if(x.period>=8&&x.wind<20&&x.h<=1.7)key='clean';
 else if(x.period>=5.5&&x.h<=1.5&&x.wind<25)key='mellow';
 else if(x.h>=1.8)key='powerful';
 else if(x.wind<20)key='easy';
 const reads={
  storm:[
   'Modelled thunderstorm risk','Modelo: riesgo de tormentas',
   'Thunderstorms may affect this window. Check KNMI and local warnings before entering the water.',
   'Podrían producirse tormentas. Revisa KNMI y las alertas locales antes de entrar al agua.',
   'Storm risk','Riesgo de tormenta'],
  windRisk:[
   'Very strong wind signal','Viento muy intenso',
   'The model indicates potentially dangerous wind. Check official warnings; this is not a safety clearance.',
   'El modelo indica viento potencialmente peligroso. Revisa las alertas oficiales; esto no garantiza seguridad.',
   'Strong wind risk','Viento intenso'],
  windy:[
   'Wind may dominate','El viento puede dominar',
   'Strong wind could make the surface messy and paddling harder. Actual conditions may vary.',
   'El viento fuerte podría desordenar el mar y dificultar la remada. Las condiciones reales pueden variar.',
   'Windy surf','Surf ventoso'],
  choppy:[
   'Short-period, bumpy surf','Mar picado y período corto',
   'Short-period waves and wind suggest less organised sections. Check the actual break.',
   'El período corto y el viento sugieren secciones más desordenadas. Revisa cómo está quebrando.',
   'Choppy','Mar picado'],
  small:[
   'Small, lower-energy waves','Olas pequeñas y con poca fuerza',
   'The model suggests limited push. A board with more volume may help, depending on the break.',
   'El modelo sugiere poca fuerza. Una tabla con más volumen podría ayudar, según el spot.',
   'Small waves','Olas pequeñas'],
  short:[
   'Short-period, closely spaced waves','Olas de período corto y próximas entre sí',
   'With a very short modelled period, waves may be closely spaced; check the actual beach for shape and rideability.',
   'Con un período modelado muy corto, las olas podrían llegar muy juntas. Revisa la playa para conocer su forma y si son surfeables.',
   'Short period','Período corto'],
  clean:[
   'Potentially more organised','Podría estar más ordenado',
   'Longer-period energy and lighter wind could help the wave shape. Not a measured beach report.',
   'El mayor período y el viento suave podrían favorecer la forma de las olas. No son mediciones de la playa.',
   'Cleaner potential','Posible orden'],
  mellow:[
   'Mellow, flowing potential','Potencial para surf fluido',
   'Moderate swell and manageable wind could favour a relaxed session. Check the break before leaving.',
   'El swell moderado y el viento manejable podrían favorecer un surf fluido. Revisa el spot antes de salir.',
   'Mellow & cruisy','Mellow y fluido'],
  powerful:[
   'More energy in the water','Más energía en el agua',
   'Larger modelled waves could mean more demanding sections; local breaking size can differ.',
   'Las olas modeladas son más grandes y podrían traer secciones exigentes. La rompiente real puede variar.',
   'More powerful','Más fuerza'],
  easy:[
   'Manageable-looking outlook','Pronóstico relativamente manejable',
   'Relatively light wind could help, but the actual wave face depends on the local break.',
   'El viento relativamente suave podría ayudar, pero la pared real depende de cómo quiebre la ola.',
   'Easygoing potential','Potencial tranquilo'],
  mixed:[
   'Mixed conditions ahead','Condiciones variables',
   'Wave energy and wind point to an uneven outlook. Expect variability and check local conditions.',
   'El oleaje y el viento apuntan a condiciones variables. Revisa cómo está la playa antes de ir.',
   'Mixed outlook','Pronóstico mixto']
 };
 const v=reads[key];
 return {key,headline:v[es?1:0],detail:v[es?3:2],short:v[es?5:4]};
}
function evaluate(x,orientation,ai){const q=qualityComponents(x.h,x.period,x.wd,x.wind,x.dir,orientation,ai);const penalty=weatherPenalty(x.precip,x.code);return {...q,penalty,v:Math.round(clamp(q.surf-penalty,0,10)*10)/10};}
root.ZeelandEngine={surfProfiles,qualityComponents,weatherPenalty,waveCharacter,quickRead,evaluate};
})(typeof globalThis!=='undefined'?globalThis:this);
