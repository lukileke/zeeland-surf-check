'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const code=fs.readFileSync(path.join(__dirname,'..','zeeland-widget.js'),'utf8');
const engine=fs.readFileSync(path.join(__dirname,'..','surf-engine.js'),'utf8');
new AsyncFunction(code);
class Color{constructor(hex,a){this.hex=hex;this.a=a}static dynamic(a,b){return {a,b}}static white(){return new Color('#ffffff')}}
class Size{constructor(w,h){this.width=w;this.height=h}}
class Node{
 constructor(type){this.type=type;this.children=[]}
 addText(text){let a=new Node('text');a.text=String(text);this.children.push(a);return a}
 addStack(){let a=new Node('stack');this.children.push(a);return a}
 addSpacer(){let a=new Node('spacer');this.children.push(a);return a}
 layoutHorizontally(){}layoutVertically(){}bottomAlignContent(){}centerAlignContent(){}setPadding(){}
 async presentMedium(){}async presentSmall(){}async presentLarge(){}
 async presentAccessoryInline(){}async presentAccessoryRectangular(){}async presentAccessoryCircular(){}
}
class Widget extends Node{constructor(){super('widget')}}
function today(){
 const x=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 return new Date(x+'T12:00:00Z');
}
function response(n,isMarine){
 const dt=today(),days=Array.from({length:7},(_,i)=>new Date(dt.getTime()+i*86400000).toISOString().slice(0,10));
 const times=days.flatMap(d=>Array.from({length:24},(_,h)=>d+'T'+String(h).padStart(2,'0')+':00'));
 const arr=x=>times.map(()=>x),records=[];
 for(let i=0;i<n;i++){
  records.push(isMarine?{hourly:{time:times,wave_height:arr(1.2),wave_period:arr(6.5),wave_direction:arr(315)}}:
   {hourly:{time:times,wind_speed_10m:arr(12),wind_direction_10m:arr(145),
     // Put modelled severe gusts tomorrow at noon, inside the 48 h future scan even when QA runs after noon today.
     wind_gusts_10m:times.map((_,j)=>i===0&&j===36?85:20),
     precipitation:arr(0),weather_code:arr(0)},
    daily:{time:days,sunrise:days.map(d=>d+'T07:00'),sunset:days.map(d=>d+'T19:00')}});
 }
 return n===1?records[0]:records;
}
function nodes(x){return [x,...x.children.flatMap(nodes)]}
function labels(x){return nodes(x).filter(n=>n.type==='text').map(n=>n.text)}
async function run(family,parameter,mem=new Map(),fail=false){
 let widget,complete=false;const requests=[],warnings=[];
 const files={cacheDirectory:()=>'/cache',joinPath:(a,b)=>a+'/'+b,
  fileExists:p=>mem.has(p),readString:p=>mem.get(p).text,
  writeString:(p,text)=>mem.set(p,{text,date:new Date()}),modificationDate:p=>mem.get(p).date};
 class Request{
  constructor(url){this.url=url;requests.push(url)}
  async loadString(){return engine}
  async loadJSON(){
   if(fail)throw Error('API unavailable');
   const u=new URL(this.url),n=u.searchParams.get('latitude').split(',').length;
   return response(n,u.hostname.startsWith('marine-api'));
  }
 }
 const Font={};
 for(const method of ['heavySystemFont','boldSystemFont','semiboldSystemFont','systemFont'])Font[method]=size=>({method,size});
 const env={args:{widgetParameter:parameter},config:{widgetFamily:family,runsInApp:false},
  Color,Size,Font,FileManager:{local:()=>files},ListWidget:Widget,Request,
  Script:{setWidget(x){widget=x},complete(){complete=true}},console:{warn(...x){warnings.push(x.map(String).join(' '))}},globalThis:{}};
 await new AsyncFunction(...Object.keys(env),code)(...Object.values(env));
 assert.ok(complete&&widget,'Scriptable rendered a widget');
 return {widget,text:labels(widget),requests,mem,warnings};
}
(async()=>{
 const base=await run('medium','BEST');
 assert.ok(base.text.includes('FARO')&&base.text.includes('BEST OF WEEK'),JSON.stringify({text:base.text,warnings:base.warnings,requests:base.requests}));
 assert.ok(base.text.some(t=>t.startsWith('MODEL WIND RISK')),'48-hour model warning is visible');
 assert.equal(base.requests.filter(x=>x.includes('marine-api')).length,1);
 assert.equal(base.requests.filter(x=>new URL(x).hostname==='api.open-meteo.com').length,1);
 const u=new URL(base.requests.find(x=>x.includes('marine-api')));
 assert.equal(u.searchParams.get('latitude').split(',').length,12);
 assert.equal(u.searchParams.get('forecast_days'),'7');
 assert.ok(base.widget.url.includes('faroSpot=')&&base.widget.url.includes('&day=')&&base.widget.url.includes('&hour='));
 assert.ok(!base.text.includes('ZEELAND SURF CLUB'));
 for(const family of ['small','large','accessoryRectangular','accessoryInline','accessoryCircular']){
  const x=await run(family,'Domburg');
  assert.ok(x.text.some(t=>t.includes('FARO')),'Family '+family+' displays brand');
  assert.equal(new URL(x.requests.find(t=>t.includes('marine-api'))).searchParams.get('latitude').split(',').length,3);
 }
 const spanish=await run('medium','Oostkapelle|ES');
 assert.ok(spanish.text.includes('PRONÓSTICO DEL SPOT'));
 const specific=await run('small','Domburg:Noordduine|ES');
 assert.equal(new URL(specific.requests.find(t=>t.includes('marine-api'))).searchParams.get('latitude').split(',').length,1);
 const cached=await run('medium','BEST',base.mem,true);
 assert.equal(cached.requests.filter(t=>t.includes('marine-api')).length,0,'Fresh cache avoids HTTP');
 const offline=await run('medium','BEST',new Map(),true);
 assert.ok(offline.text.some(t=>t.includes('API unavailable')),'Offline does not invent scores');
 console.log('PASS FARO widget: 12 locations, 7 days, sizes, parameters, model warnings, cached/offline.');
})().catch(e=>{console.error(e);process.exitCode=1});
