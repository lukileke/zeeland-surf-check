/* FARO shared Maria-designed icon governance. No placeholder emoji artwork. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/icons/icon-manifest.json'),'utf8'));
const approved=JSON.parse(fs.readFileSync(path.join(root,'assets/icons/approved.json'),'utf8'));
assert.ok(manifest.icons.length>=55);
const ids=new Set();
for(const item of manifest.icons){
 assert.ok(!ids.has(item.id),'Duplicate icon ID '+item.id);
 ids.add(item.id);
 assert.match(item.id,/^[a-z0-9][a-z0-9-]+$/);
 assert.equal(item.filename,item.id+'.svg');
 assert.ok(item.goal.length>=16,'Every icon must have a clear objective, not just a name');
 assert.ok(['P0','P1','P2','P3'].includes(item.priority));
 assert.ok(item.status==='pending_design'||item.status==='approved');
}
assert.equal(Object.keys(approved.icons).length,0,'No homemade decorative icon may be approved before Maria delivers source artwork');
for(const [id,file]of Object.entries(approved.icons)){
 assert.ok(ids.has(id),'No orphan registered icon');
 assert.match(file,/^[a-z0-9-]+\.svg$/);
 assert.ok(fs.existsSync(path.join(root,'assets/icons',file)),'Approved icon SVG must exist');
}
const websitePaths=['index.html','chile/index.html','surf-engine.js','chile/chile-forecast.js',
 'chile/faro-chile-live.js','chile/coast-map.js','chile/video-observation-lab.js','faro-spot-view.js'];
for(const p of websitePaths){
 const body=fs.readFileSync(path.join(root,p),'utf8');
 assert.doesNotMatch(body,/\p{Extended_Pictographic}/gu,'No decorative emoji in '+p);
 assert.doesNotMatch(body,/[◎◷〰✎✐⌄↗↘⬆⬇✓☾✕✖✗]/gu,'No old homemade glyphs in '+p);
}
for(const p of ['index.html','chile/index.html']){
 const body=fs.readFileSync(path.join(root,p),'utf8');
 assert.match(body,/faro-icon-system\.css/);
 assert.match(body,/faro-icon-system\.js/);
}
const brief=fs.readFileSync(path.join(root,'docs/FARO_MARIA_ICON_DESIGN_BRIEF.md'),'utf8');
for(const id of ids)assert.ok(brief.includes('`'+id+'.svg`'),'Missing icon objective in Maria design brief: '+id);
console.log('FARO icon design: '+manifest.icons.length+' named objectives, no emoji source, designer-first approval contract passed.');
