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
function waveCharacter(x){if(!x)return {name:'Forecast unavailable',emoji:'🌫️',description:'No wave data for this window.'};let name,emoji,detail;if(x.wind>=38){name='Wild & Windy';emoji='💨';detail='Strong wind is likely to disrupt the surface and make paddling demanding.'}else if(x.period<5&&x.wind>=18){name='Choppy & Messy';emoji='🌪️';detail='Short-period wind waves with closely spaced, bumpy sections.'}else if(x.h<.45){name='Tiny & Tricky';emoji='🐚';detail='Small waves: bring extra volume if you want to catch more rides.'}else if(x.period>=8&&x.wind<20&&x.h<=1.7){name='Clean Lines';emoji='✨';detail='Longer-period energy and relatively light wind could offer more defined lines.'}else if(x.period>=5.5&&x.h<=1.5&&x.wind<25){name='Mellow & Cruisy';emoji='🏄';detail='Potentially playful waves for relaxed trimming, carving and smooth turns.'}else if(x.h>=1.8){name='Punchy & Powerful';emoji='⚡';detail='More energy and potentially challenging sections; check the break carefully.'}else if(x.wind<20){name='Easygoing Sessions';emoji='☀️';detail='Manageable-looking conditions, though actual wave shape depends on the beach.'}else{name='Mixed Bag';emoji='🌊';detail='Variable conditions: some rideable sections may be mixed with chop.'}return {name,emoji,description:detail+' Modelled waves '+x.h.toFixed(1)+' m · '+x.period.toFixed(1)+' s · wind '+x.wind.toFixed(0)+' km/h. These are offshore indicators, not measured breaking-wave shape.'}}
function evaluate(x,orientation,ai){const q=qualityComponents(x.h,x.period,x.wd,x.wind,x.dir,orientation,ai);const penalty=weatherPenalty(x.precip,x.code);return {...q,penalty,v:Math.round(clamp(q.surf-penalty,0,10)*10)/10};}
root.ZeelandEngine={surfProfiles,qualityComponents,weatherPenalty,waveCharacter,evaluate};
})(typeof globalThis!=='undefined'?globalThis:this);
