/* Chile Spot Intelligence synthetic evidence/regime checks. No wave validation claims. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'spot-intelligence.json'),'utf8'));
const sources=JSON.parse(fs.readFileSync(path.join(__dirname,'sources.json'),'utf8')).sources;
require('./faro-physics-lab.js');require('./faro-spot-intelligence.js');
const E=globalThis.FaroChileSpotIntelligence;
const ids=['CL-VS:la-boca-concon','CL-VS:renaca','CL-VS:ritoque'];
function assess(slot,id,locale='es',risk='none'){return E.evaluate(slot,id,catalog,locale,{risk});}
for(const id of ids){
 const data=catalog.spots[id];
 assert.ok(data&&data.sectorStatus.includes('not_')||data.sectorStatus.includes('only'),'Spot must not imply surveyed breaking point');
 assert.equal(data.guideHypotheses.swell.length>=2,true);
 assert.equal(data.guideHypotheses.wind.length>=2,true);
 assert.equal(data.guideHypotheses.tide.length>=2,true);
 for(const h of Object.values(data.guideHypotheses).flat())assert.ok(sources[h.source]?.url,'Unattributed claim: '+h.source);
}
const base={modelComplete:true,score:6.5,daylight:{eligible:true},swellHeightM:1.15,swellPeriodS:11,swellDirection:250,
 windKmh:10,windDirection:95,gustKmh:16,
 totalWaveHeightM:1.5,windSeaHeightM:.35,
 secondarySwell:{heightM:.55,periodS:12,fromDeg:320}};
const boca=assess(base,ids[0],'es');
const renaca=assess(base,ids[1],'es');
const ritoque=assess(base,ids[2],'es');
assert.equal(boca.wind.state,'disputed','La Boca: wind 95 fits SurfRip E but not Surftrips N');
assert.equal(boca.swell.state,'disputed','La Boca: swell 250 fits one guide, not S–SW');
assert.equal(renaca.swell.state,'convergent','Reñaca: 250 within SW/W guides');
assert.equal(renaca.wind.state,'disputed','Reñaca E vs NE guide interpretations differ');
assert.equal(ritoque.swell.state,'convergent','Ritoque: SW fits northern and beach-wide guides');
assert.equal(ritoque.wind.state,'disputed','Ritoque: N and E conflicting guidance');
assert.equal(boca.tide.state,'disputed');
assert.equal(renaca.tide.verified,false);
assert.equal(ritoque.tide.state,'disputed');
assert.notEqual(boca.decision.action,renaca.decision.action);
assert.notEqual(ritoque.decision.action,renaca.decision.action);
for(const item of [boca,renaca,ritoque]){
 assert.equal(item.status,'guide_compared');
 assert.equal(item.safetyAssessed,false);
 assert.equal(item.coastalModelIntegrated,false);
 assert.equal(item.observedWaveShape,false);
 assert.equal(item.tideCalibrated,false);
 assert.equal(item.physics.predictedSurfQuality,null);
 assert.equal(item.evidenceLabels.some(x=>x.state==='disputed'),true);
 assert.ok(item.notes.length>0,'Explain at least one source conflict');
}
const nth=assess({...base,windDirection:0},ids[2],'en');
const east=assess({...base,windDirection:90},ids[2],'en');
assert.equal(nth.wind.state,'disputed');
assert.equal(east.wind.state,'disputed');
assert.notDeepEqual(nth.wind.matches,east.wind.matches);
assert.ok(nth.wind.matches.includes('surf-ritoque'));
assert.ok(east.wind.matches.includes('surfnerd-ritoque'));
const windy=assess({...base,windKmh:33,gustKmh:46},ids[1],'es');
assert.equal(windy.vibe.id,'windy');
assert.equal(windy.drivers.windy,true);
const soft=assess({...base,swellHeightM:.28},ids[0],'es');
assert.equal(soft.vibe.id,'small');
assert.notEqual(soft.read,boca.read);
const energy=assess({...base,swellHeightM:1.85,swellPeriodS:13},ids[2],'en');
assert.equal(energy.drivers.bigger,true);
assert.ok(energy.decision.action.toLowerCase().includes('south'));
const missing=assess({...base,modelComplete:false},ids[1],'en');
assert.equal(missing.status,'model_unavailable');
assert.ok(missing.read.toLowerCase().includes('missing'));
const unknown=assess(base,'CL-VS:unconfigured','es');
assert.equal(unknown.status,'unconfigured');
assert.equal(E.angularDistance(5,[345,15]),0);
assert.equal(E.angularDistance(60,[345,15]),45);
assert.equal(E.assessDirection(25,[{source:'guide-x',from:[[345,15]]}]).state,'outside');
const noSecond=assess({...base,secondarySwell:null},ids[0],'es');
assert.equal(noSecond.physics.proxySumM2S,null,'Missing secondary partitions cannot be a zero-power claim');
// A choice must respond to the physical driver rather than merely describe
// a river-mouth, sandbank or guide. It cannot contradict risk gating.
for(const [id,name] of [[ids[0],"La Boca"],[ids[1],"Reñaca Norte"],[ids[2],"Ritoque Norte"]]){
 const good=assess(base,id,'es');
 assert.equal(good.decision.id,'check');
 assert.equal(good.decision.priority,4);
 assert.match(good.read,/1\.1 m @ 11 s; viento 10 km\/h/);
 assert.ok(good.decision.action.includes(name),'Action should point to the relevant surf sector: '+id);
 assert.ok(good.decision.reason.length>15);
 assert.ok(!/banco.*(no sabe|sin verificar|desconocido)/i.test(good.read),
  'No repetitive bank-data disclaimer instead of a useful conclusion');
 const flat=assess({...base,swellHeightM:.2},id,'es');
 assert.equal(flat.decision.id,'skip_swell');
 assert.equal(flat.decision.priority,1);
 assert.ok(flat.decision.action.length>20);
 const breeze=assess({...base,windKmh:32,gustKmh:48},id,'es');
 assert.equal(breeze.decision.id,'skip_wind');
 assert.equal(breeze.decision.priority,1);
 const caution=assess(base,id,'es','caution');
 assert.equal(caution.decision.id,'caution');
 assert.equal(caution.decision.priority,1);
 const danger=assess(base,id,'es','danger');
 assert.equal(danger.decision.id,'hazard');
 assert.equal(danger.decision.priority,0);
 const unknownRisk=assess(base,id,'es','unknown');
 assert.equal(unknownRisk.decision.id,'unassessed');
 const darkness=assess({...base,daylight:{eligible:false}},id,'es');
 assert.equal(darkness.decision.id,'no_daylight');
 const betterThanLow=assess({...base,swellHeightM:.9,swellPeriodS:10},id,'en');
 assert.ok(betterThanLow.decision.priority>flat.decision.priority);
}
const swLocal=assess({...base,swellDirection:210},ids[0],'es');
assert.equal(swLocal.waveShapeGuide.id,'south_southwest_longer_walls');
assert.equal(swLocal.waveShapeGuide.verifiedByCamera,false);
assert.match(swLocal.decision.action,/En la cámara busca.*S\/SSO/);
const nwLocal=assess({...base,swellDirection:310},ids[0],'en');
assert.equal(nwLocal.waveShapeGuide.id,'northwest_faster_sections');
assert.match(nwLocal.decision.action,/NW.*faster/);
assert.notEqual(swLocal.waveShapeGuide.id,nwLocal.waveShapeGuide.id);
console.log('FARO decision checks: clear local action, low swell, bad wind, hazard gating, missing risk, daylight and opportunity ranking passed.');
console.log('FARO Spot Intelligence: 3 distinct surf regimes, contradictory source bands, uncertain tide, missing partitions and no fabricated nearshore prediction passed.');
