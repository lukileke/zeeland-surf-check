'use strict';
/* FARO: dependency-free regression smoke checks.
 * Run: node tests/faro-smoke.cjs
 * These are code/logic checks, not browser or visual Safari tests.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'faro-ui.css'),'utf8');
const engine=fs.readFileSync(path.join(root,'surf-engine.js'),'utf8');
const scripts=Array.from(html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi),m=>m[1]);
assert.ok(scripts.length>=2,'HTML includes application and translation scripts');
scripts.forEach((s,i)=>assert.doesNotThrow(()=>new vm.Script(s), 'Script '+i+' syntax'));
assert.doesNotThrow(()=>new vm.Script(engine),'Shared surf engine syntax');
const ids=Array.from(html.matchAll(/\bid=["']([^"']+)["']/g),m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'No duplicate static DOM identifiers');
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'CSS braces balanced');
assert.ok(css.includes('html[data-theme="light"]'),'Light theme present');
assert.ok(css.includes('html:not([data-theme="light"])'),'Dark theme present');
assert.ok(html.includes('faro-ui.css?v=9'),'Current CSS cache key');
assert.match(css,/#bestPage \.hero-footer \.wizard-pick\s*\{[^}]*border:1px solid/s,'Best character retains badge');
assert.ok(html.includes('id="legacyBoard"'),'Original board wizard kept under details');
assert.ok(html.includes('aria-disabled="true"'),'Unavailable session controls disabled');

const tStart=html.indexOf('function nlNow('),tEnd=html.indexOf('function chooseForecastDay(',tStart);
assert.ok(tStart>0&&tEnd>tStart,'Time selection helpers found');
const fixedDates=['2026-10-23','2026-10-24'];
const slots=d=>[{valid:true,s:{v:d===0?4.1:6.0},to:1080},
                {valid:false,s:{v:9.0},to:1200}];
const {nlNow,pastWindow,enoughTimeRemaining,upcomingWindow}=new Function('dateTimes','blocks',html.slice(tStart,tEnd)+'; return {nlNow,pastWindow,enoughTimeRemaining,upcomingWindow};')(()=>fixedDates,slots);
assert.deepEqual(nlNow(new Date('2026-10-23T18:55:00Z')),{date:'2026-10-23',minutes:1255},'Netherlands summer clock');
assert.deepEqual(nlNow(new Date('2026-12-01T12:00:00Z')),{date:'2026-12-01',minutes:780},'Netherlands winter clock');
assert.equal(pastWindow('2026-10-23',1080,{date:'2026-10-23',minutes:1255}),true);
assert.equal(enoughTimeRemaining('2026-10-23',1080,{date:'2026-10-23',minutes:1041}),false,'39 min not useful');
assert.equal(enoughTimeRemaining('2026-10-23',1080,{date:'2026-10-23',minutes:1040}),true,'40 min still useful');
assert.equal(upcomingWindow(0,slots(0)[1],{date:'2026-10-23',minutes:900}),false,'Invalid daylight excluded');
assert.equal(upcomingWindow(1,slots(1)[0],{date:'2026-10-23',minutes:1255}),true,'Tomorrow remains selectable');

const translationStart=html.indexOf('/* Display-layer translation:');
const translationEnd=html.indexOf('let siteLanguage=',translationStart);
assert.ok(translationStart>=0&&translationEnd>translationStart,'Translation source found');
const translations=html.slice(translationStart,translationEnd);
const names=Array.from(translations.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=/g),m=>m[1]);
const dict=new Function(translations+';return {'+names.join(',')+'};')();
const pairs=Object.values(dict).filter(Array.isArray).flat().filter(x=>Array.isArray(x)&&typeof x[0]==='string').sort((a,b)=>b[0].length-a[0].length);
function es(s){for(const [en,translated] of pairs)s=s.split(en).join(translated);return s;}
assert.equal(es('Best of the Week'),'Lo mejor de la semana');
assert.equal(es('Find your next surf session'),'Encuentra tu próxima sesión de surf');
assert.equal(es('What would you like to find?'),'¿Qué quieres encontrar?');
assert.ok(es('Choppy & Messy')!=='Choppy & Messy');
console.log('FARO smoke checks passed: JavaScript, markup, themes, timing and translations.');
