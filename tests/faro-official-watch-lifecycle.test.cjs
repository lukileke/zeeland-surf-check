/* FARO Official Watch must not turn portal reachability into a safety clearance. */
const test=require("node:test"),assert=require("node:assert/strict");
const {assess}=require("../chile/faro-official-watch.js");
const now=Date.parse("2026-11-17T18:00:00Z");
const make=(x={})=>({
 schema:1,region:"CL-VS",coverage:"partial",clearanceVerified:false,
 checkedAt:new Date(now-30*60*1000).toISOString(),
 sources:[{id:"armada",reachable:true},{id:"senapred",reachable:false}],
 ...x
});
test("recent partial check reports reachability, not an all-clear",()=>{
 assert.deepEqual(assess(make(),now),{valid:true,count:1});
 assert.deepEqual(assess(make({sources:[{reachable:false}]}),now),{valid:true,count:0});
});
test("stale, missing and future checks cannot be presented as current",()=>{
 for(const checkedAt of [
  new Date(now-3*3600*1000).toISOString(),
  new Date(now+11*60*1000).toISOString(),"nonsense",null
 ]){
  assert.deepEqual(assess(make({checkedAt}),now),{valid:false,count:0});
 }
});
test("portal status never certifies valid coastal warnings",()=>{
 for(const data of [
  make({clearanceVerified:true}),make({coverage:"complete"}),
  make({region:"CL-RM"}),make({schema:2}),
  make({sources:null}),null
 ])assert.deepEqual(assess(data,now),{valid:false,count:0});
});
