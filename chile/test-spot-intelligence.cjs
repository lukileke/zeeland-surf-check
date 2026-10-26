/* Chile Spot Intelligence synthetic evidence/regime checks. No wave validation claims. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'spot-intelligence.json'),'utf8'));
const sources=JSON.parse(fs.readFileSync(path.join(__dirname,'sources.json'),'utf8')).sources;
require('./faro-physics-lab.js');require('./faro-spot-intelligence.js');
const E=globalThis.FaroChileSpotIntelligence;
const ids=['CL-VS:la-boca-concon','CL-VS:renaca','CL-VS:ritoque'];
for(const id of ids){
 const data=catalog.spots[id];
 assert.ok(data&&data.sectorStatus.includes('not_')||data.sectorStatus.includes('only'),'Spot must not imply surveyed breaking point');
 assert.equal(data.guideHypotheses.swell.length>=2,true);
 assert.equal(data.guideHypotheses.wind.length>=2,true);
 assert.equal(data.guideHypotheses.tide.length>=2,true);
 for(const h of Object.values(data.guideHypotheses).flat())assert.ok(sources[h.source]?.url,'Unattributed claim: '+h.source);
}
const base={modelComplete:true,swellHeightM:1.15,swellPeriodS:11,swellDirection:250,
 windKmh:10,windDirection:95,gustKmh:16,
 totalWaveHeightM:1.5,windSeaHeightM:.35,
 secondarySwell:{heightM:.55,periodS:12,fromDeg:320}};
const boca=E.evaluate(base,ids[0],catalog,'es');
const renaca=E.evaluate(base,ids[1],catalog,'es');
const ritoque=E.evaluate(base,ids[2],catalog,'es');
assert.equal(boca.wind.state,'disputed','La Boca: wind 95 fits SurfRip E but not Surftrips N');
assert.equal(boca.swell.state,'disputed','La Boca: swell 250 fits one guide, not S–SW');
assert.equal(renaca.swell.state,'convergent','Reñaca: 250 within SW/W guides');
assert.equal(renaca.wind.state,'disputed','Reñaca E vs NE guide interpretations differ');
assert.equal(ritoque.swell.state,'convergent','Ritoque: SW fits northern and beach-wide guides');
assert.equal(ritoque.wind.state,'disputed','Ritoque: N and E conflicting guidance');
assert.equal(boca.tide.state,'disputed');
assert.equal(renaca.tide.verified,false);
assert.equal(ritoque.tide.state,'disputed');
assert.notEqual(boca.read,renaca.read);
assert.notEqual(ritoque.read,renaca.read);
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
const nth=E.evaluate({...base,windDirection:0},ids[2],catalog,'en');
const east=E.evaluate({...base,windDirection:90},ids[2],catalog,'en');
assert.equal(nth.wind.state,'disputed');
assert.equal(east.wind.state,'disputed');
assert.notDeepEqual(nth.wind.matches,east.wind.matches);
assert.ok(nth.wind.matches.includes('surf-ritoque'));
assert.ok(east.wind.matches.includes('surfnerd-ritoque'));
const windy=E.evaluate({...base,windKmh:33,gustKmh:46},ids[1],catalog,'es');
assert.equal(windy.vibe.id,'windy');
assert.equal(windy.drivers.windy,true);
const soft=E.evaluate({...base,swellHeightM:.28},ids[0],catalog,'es');
assert.equal(soft.vibe.id,'soft');
assert.notEqual(soft.read,boca.read);
const energy=E.evaluate({...base,swellHeightM:1.85,swellPeriodS:13},ids[2],catalog,'en');
assert.equal(energy.drivers.bigger,true);
assert.ok(energy.read.toLowerCase().includes('south'));
const missing=E.evaluate({...base,modelComplete:false},ids[1],catalog,'en');
assert.equal(missing.status,'model_unavailable');
assert.ok(missing.read.includes('missing'));
const unknown=E.evaluate(base,'CL-VS:unconfigured',catalog,'es');
assert.equal(unknown.status,'unconfigured');
assert.equal(E.angularDistance(5,[345,15]),0);
assert.equal(E.angularDistance(60,[345,15]),45);
assert.equal(E.assessDirection(25,[{source:'guide-x',from:[[345,15]]}]).state,'outside');
const noSecond=E.evaluate({...base,secondarySwell:null},ids[0],catalog,'es');
assert.equal(noSecond.physics.proxySumM2S,null,'Missing secondary partitions cannot be a zero-power claim');
console.log('FARO Spot Intelligence: 3 distinct surf regimes, contradictory source bands, uncertain tide, missing partitions and no fabricated nearshore prediction passed.');
