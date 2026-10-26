/* Synthetic Coastal Lens physical-reading regression, no observed surf data. */
'use strict';
const assert=require('node:assert/strict');
const F=require('./faro-coastal-lens.js');
const base={modelComplete:true,swellHeightM:1.2,swellPeriodS:5.7,swellDirection:233,
 windKmh:16,windDirection:244,gustKmh:36,totalWaveHeightM:1.4};
const fit={swell:{state:'convergent'},wind:{state:'outside'},decision:{
 verdict:'No priorizar esta franja',reason:'Swell de poca altura o periodo corto',id:'skip_swell'}};
const read=F.reading(base,fit,'es');
assert.equal(read.available,true);
assert.equal(read.swellFrom,233);
assert.equal(read.windFrom,244);
assert.match(read.explanation,/período|per[ií]odo/i);
assert.equal(read.guideState,'convergent');
assert.equal(read.windGuide,'outside');
assert.equal(read.notes.length,2);
assert.match(read.notes[0].value,/233°/);
assert.match(read.notes[1].detail,/16 km\/h/);
assert.match(read.notes[1].detail,/36/);
assert.equal(F.cardinal(0),'N');assert.equal(F.cardinal(360),'N');
assert.equal(F.cardinal(233),'SW');assert.equal(F.cardinal(45),'NE');
assert.equal(F.azimuth(-30),330);
const strong=F.reading({...base,swellPeriodS:13,windKmh:32},fit,'en');
assert.match(strong.explanation,/wind/i);
const caution=F.reading(base,{...fit,decision:{id:'caution',reason:'Model risk detected',verdict:'Caution'}},'en');
assert.match(caution.explanation,/Model risk detected/);
const unknown=F.reading({...base,modelComplete:false},fit,'es');
assert.equal(unknown.available,false);
assert.equal(unknown.swellFrom,null);
assert.equal(F.reading({},null,'es').available,false);
const mix=F.reading({...base,swellPeriodS:12,windKmh:10},{swell:{state:'disputed'},wind:{state:'disputed'}},'es');
assert.match(mix.explanation,/guías/i);
console.log('Coastal Lens: FROM compass angles, SW/NE labels, risk precedence, short-period case, wind and guide disagreement passed.');
