import test from "node:test";
import assert from "node:assert/strict";
import {inspect,sources} from "../chile/faro-official-monitor.mjs";
test("official portals are checked without claiming any alert clearance",async()=>{
 const fake=async()=>({ok:true,status:200,text:async()=>"<!doctype html><html><body>"+("Servicio Meteorológico Armada de Chile ".repeat(30))+"</body></html>"});
 const r=await inspect(new Date("2026-11-15T12:00:00Z"),fake);
 assert.equal(r.sources.length,3);
 assert.equal(r.sources.filter(x=>x.reachable).length,3);
 assert.equal(r.coverage,"partial");
 assert.equal(r.clearanceVerified,false);
 assert.equal(r.bulletinsVerified,false);
 assert.equal(r.checkedAt,"2026-11-15T12:00:00.000Z");
 assert.ok(r.sources.every(x=>sources.some(s=>s.url===x.url)));
});
test("bad responses and HTML shell cannot be treated as verified notices",async()=>{
 const f=async u=>u.includes("senapred")?{ok:true,status:200,text:async()=>"<html>app</html>"}:
  u.includes("meteoarmada")?{ok:false,status:503,text:async()=>""}:
  Promise.reject(new Error("offline"));
 const r=await inspect(new Date("2026-11-15T13:00:00Z"),f);
 assert.equal(r.sources.filter(x=>x.reachable).length,0);
 assert.equal(r.coverage,"partial");
 assert.equal(r.clearanceVerified,false);
 assert.ok(r.sources.every(x=>x.reachable===false));
});
