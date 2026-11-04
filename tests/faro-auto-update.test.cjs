/* FARO auto-updater: test source contracts and simulated offline scenarios.
 * Run: node --test tests/faro-auto-update.test.cjs
 */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const loader=fs.readFileSync(path.join(root,'FARO_AUTO_WIDGET.js'),'utf8');
const setup=fs.readFileSync(path.join(root,'FARO_AUTO_SETUP.js'),'utf8');
const widget=fs.readFileSync(path.join(root,'zeeland-widget.js'),'utf8');
const header='// FARO Widget\n// const SITE="https://lukileke.github.io/zeeland-surf-check/"\n// Script.setWidget(widget)\n// Script.complete()\n';
const fake=(tag,throws=false)=>header+
  'globalThis.__testRuns.push('+JSON.stringify(tag)+');'+
  (throws?'throw Error("bad-new-code");':'')+
  '/*'+'.'.repeat(21000)+'*/';
async function exercise(old,remotelyAvailable,expected,offline=false){
 const files=new Map(old?[['/docs/faro-auto-zeeland-last-good.txt',old]]:[]);
 const outputs={runs:[],widgets:0,files};
 class Manager{
  documentsDirectory(){return '/docs'}
  joinPath(a,b){return a+'/'+b}
  fileExists(p){return files.has(p)}
  readString(p){return files.get(p)}
  writeString(p,x){files.set(p,x)}
 }
 class Request{
  constructor(url){this.url=url;this.response={statusCode:200}}
  async loadString(){
   if(remotelyAvailable===null)throw Error('network down');
   return remotelyAvailable;
  }
 }
 class Widget{setPadding(){}addText(){return {}}addSpacer(){}}
 function Color(){}Color.white=()=>({});
 const sandbox={
  FileManager:{local:()=>new Manager()},
  Request,ListWidget:Widget,Color,
  Font:{boldSystemFont:()=>({}),mediumSystemFont:()=>({})},
  Script:{setWidget:()=>outputs.widgets++,complete:()=>{}},
  config:{runsInApp:false,widgetFamily:'medium'},
  console:{warn:()=>{}},
  __testRuns:outputs.runs
 };
 vm.createContext(sandbox);
 await vm.runInContext('(async()=>{'+loader+'})()',sandbox);
 assert.deepEqual(outputs.runs,expected);
 assert.equal(outputs.widgets,offline?1:0);
 return outputs;
}
test('loading first time from main caches valid widget',async()=>{
 const o=await exercise(null,fake('new'),['new']);
 assert.ok(o.files.has('/docs/faro-auto-zeeland-last-good.txt'));
});
test('offline uses last downloaded good revision',async()=>{
 await exercise(fake('old'),null,['old']);
});
test('an invalid GitHub response never displaces last good revision',async()=>{
 const o=await exercise(fake('old'),'404 Not Found',['old']);
 assert.ok(o.files.get('/docs/faro-auto-zeeland-last-good.txt').includes('__testRuns.push("old")'));
});
test('failed new code automatically restores prior working widget',async()=>{
 const o=await exercise(fake('old'),fake('new',true),['new','old']);
 assert.ok(o.files.get('/docs/faro-auto-zeeland-last-good.txt').includes('__testRuns.push("old")'));
});
test('first offline launch shows an explanatory fallback',async()=>{
 await exercise(null,null,[],true);
});
test('installer keeps the existing Scriptable name when available',()=>{
 assert.ok(setup.includes('FARO Zeeland v14.js'));
 assert.ok(setup.includes('FARO Zeeland v15.js'));
 assert.ok(setup.includes('FARO anterior - '));
 assert.ok(setup.includes('fm.writeString(target.location, loader)'));
 assert.ok(setup.includes('FARO Auto.js'));
});
test('automatic code is sourced from trusted main and remains valid for top-level await',()=>{
 assert.ok(loader.includes('githubusercontent.com/lukileke/zeeland-surf-check/main/zeeland-widget.js'));
 assert.ok(!loader.includes('eval('));
 assert.doesNotThrow(()=>new (async function(){}).constructor(widget));
 // Accept future Scriptable revisions while still requiring a versioned FARO header.
 assert.match(widget,/^\/\/ FARO Widget · [^\n]+ Editorial v\d+/m);
 assert.ok(widget.includes('widget.backgroundGradient=nativeTideGradient()'));
});
