/* node chile/test-live-forecast.js
 * Deterministic synthetic fixture. No network, no historical claims and
 * no reliance on an actually returned Open-Meteo forecast.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const json=name=>JSON.parse(fs.readFileSync(path.join(__dirname,name),'utf8'));
require('./valparaiso-score-lab.js');
require('./faro-chile-live.js');
const L=globalThis.FaroChileLive;
const config=json('valparaiso-live.config.json'),profile=json('valparaiso-score.config.json'),registry=json('regions/CL-VS.json');
assert.equal(config.region,'CL-VS');
assert.equal(config.noOfficialAlertAssertions,true);
assert.equal(config.pilots.length,4);
assert.equal(profile.active,false);
for(const p of config.pilots){
 assert.equal(p.coordinateStatus.includes('not_'),true,'Coordinates cannot masquerade as calibrated wave breaks');
 assert.ok(registry.spots.some(s=>s.id===p.id),'Every live-model pilot needs a local guide record');
 assert.ok(profile.profiles[p.id],'Every pilot needs a source-backed experimental profile');
 const query=L.buildUrls(p,config);
 assert.ok(query.marine.includes('cell_selection=sea')&&query.marine.includes('swell_wave_height'));
 assert.ok(query.weather.includes('uv_index')&&query.weather.includes('precipitation'));
}
const fmtParts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:config.timezone,
 day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
const nowDate=fmtParts.year+'-'+fmtParts.month+'-'+fmtParts.day;
const days=Array.from({length:7},(_,i)=>{
 const d=new Date(nowDate+'T12:00:00Z');
 d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10);
});
const times=days.flatMap(d=>Array.from({length:24},(_,h)=>d+'T'+String(h).padStart(2,'0')+':00'));
const repeat=x=>times.map(()=>x);
const marine={latitude:-32.91,longitude:-71.51,hourly:{
 time:times,wave_height:repeat(1.1),wave_direction:repeat(285),wave_period:repeat(8.1),
 swell_wave_height:repeat(.8),swell_wave_direction:repeat(295),swell_wave_period:repeat(10.1),
 wind_wave_height:repeat(.6),wind_wave_direction:repeat(270),sea_surface_temperature:repeat(15.9)
}};
const weather={latitude:-32.92,longitude:-71.5,hourly:{
 time:times,wind_speed_10m:repeat(12),wind_direction_10m:repeat(135),wind_gusts_10m:repeat(19),
 precipitation:repeat(0),weather_code:repeat(1),uv_index:times.map(t=>Number(t.slice(11,13))>=9&&Number(t.slice(11,13))<=17?8:0),
 temperature_2m:repeat(22),cloud_cover:repeat(32),precipitation_probability:repeat(0)
},daily:{time:days,sunrise:days.map(d=>d+'T07:10'),sunset:days.map(d=>d+'T20:10'),
 uv_index_max:days.map(()=>9),precipitation_sum:days.map(()=>0)}
};
const result=L.extract(config,config.pilots[0],marine,weather,profile,'es');
assert.equal(result.days.length,7);
assert.equal(result.windows.length,56);
assert.equal(result.model.offshoreApproximation,true);
assert.equal(result.hazard.officialStatus,'not_checked');
const best=result.days[0].best;
assert.ok(best&&best.score<=7.9,'Score capped because actual surfing conditions are not calibrated');
assert.equal(best.nearshoreHeightEstimated,false);
assert.equal(best.observed,false);
assert.equal(best.windSeaHeightM,.6);
assert.equal(best.swellHeightM,.8);
assert.equal(best.uv.category,best.uvIndex>=8?'very-high':best.uv.category);
assert.equal(L.statusUV(11).category,'extreme');
assert.equal(L.statusUV(2).category,'low');
assert.equal(L.slotRisk(best,config),'none');
const hazardousWeather=JSON.parse(JSON.stringify(weather));
const currentHour=times.findIndex(t=>t.slice(0,10)===nowDate&&Number(t.slice(11,13))>=Number(fmtParts.hour));
assert.ok(currentHour>=0);
hazardousWeather.hourly.wind_gusts_10m[currentHour]=79;
assert.equal(L.screenRisk(config,hazardousWeather,'es').level,'danger');
hazardousWeather.hourly.wind_gusts_10m[currentHour]=19;
hazardousWeather.hourly.weather_code[currentHour]=95;
assert.equal(L.screenRisk(config,hazardousWeather,'es').level,'danger');
hazardousWeather.hourly.weather_code[currentHour]=1;
hazardousWeather.hourly.precipitation[currentHour]=21;
assert.equal(L.screenRisk(config,hazardousWeather,'es').level,'caution');
const noSwell=JSON.parse(JSON.stringify(marine));
noSwell.hourly.swell_wave_height=repeat(null);
assert.equal(L.extract(config,config.pilots[0],noSwell,weather,profile,'es').days[0].best,null,
 'Do not invent score from total wave data when partition is absent');
assert.equal(L.daylight({hour:6},nowDate+'T07:10',nowDate+'T20:10',40).eligible,true);
assert.equal(L.daylight({hour:4},nowDate+'T07:10',nowDate+'T20:10',40).eligible,false);
assert.equal(L.boardFit(best,'mid','intermediate','flow','es',result.hazard).safetyAssessed,false);
assert.equal(config.faroVibeTerms.disallowedChileanLabels.includes('Vidriado'),true);
assert.equal(config.faroVibeTerms.restrictedTags[0].term,'Campana');
console.log('FARO Chile: 4 pilots, 7-day model slots, UV, partition isolation, risk screens, and tentative match passed.');
