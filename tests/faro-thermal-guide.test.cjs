const test=require("node:test"),assert=require("node:assert/strict");
const {guide}=require("../chile/faro-thermal-guide.js");
test("18.1C water, mild wind = 3/2 baseline and warmer 4/3",()=>{
 const x=guide({waterC:18.1,airC:19.6,windKmh:15});
 assert.equal(x.primary,"3/2");assert.equal(x.warmer,"4/3");
 assert.equal(x.exposure,"mild");assert.equal(x.experimental,true);
});
test("cold air and strong wind shift the conservative option",()=>{
 const x=guide({waterC:17,airC:10,windKmh:34});
 assert.equal(x.primary,"4/3");assert.equal(x.exposure,"high");
});
test("invalid temperatures must not turn into reassuring gear advice",()=>{
 for(const w of [NaN,undefined,-1,40])assert.equal(guide({waterC:w}).available,false);
});
test("without air/wind guidance remains water-based, not false wind chill",()=>{
 const x=guide({waterC:14});assert.equal(x.primary,"4/3");
 assert.equal(x.exposure,"mild");assert.equal(x.airC,null);
});
