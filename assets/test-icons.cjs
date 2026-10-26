/* FARO website visual-language integrity. No placeholder emojis or invented icon vectors.
 * Icon visual assets must belong to Maria and be explicitly marked ready.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const iconDir=path.resolve('assets');
const manifest=JSON.parse(fs.readFileSync(path.join(iconDir,'faro-icon-manifest.json'),'utf8'));
assert.ok(Array.isArray(manifest.icons)&&manifest.icons.length>50);
const icons=new Map();
for(const icon of manifest.icons){
 assert.match(icon.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
 assert.equal(icon.file,'assets/icons/'+icon.id+'.svg');
 assert.ok(!icons.has(icon.id),'Icon names must be unique');
 icons.set(icon.id,icon);
 if(icon.status==='ready'){
  assert.ok(fs.existsSync(icon.file),'A ready icon must have a real designer-supplied SVG: '+icon.id);
  const asset=fs.readFileSync(icon.file,'utf8');
  assert.ok(asset.includes('<svg')&&asset.includes('viewBox'),'Icon asset must be an SVG with viewBox');
 }else assert.equal(icon.status,'design_pending','Unexpected icon approval status');
}
const files=[
 'index.html','surf-engine.js','faro-spot-view.js',
 'chile/index.html','chile/atlas.html','chile/lab.html','chile/chile-forecast.js',
 'chile/chile-hub.js','chile/faro-chile-live.js','chile/valparaiso-score-lab.js',
 'chile/coast-map.js','chile/video-observation-lab.js'
];
let slots=0;
const emoji=/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]/gu;
for(const file of files){
 const src=fs.readFileSync(file,'utf8');
 const match=src.match(emoji);
 assert.equal(match,null,file+' contains legacy emoji/pictogram codepoints: '+match?.join(''));
 const refs=[...src.matchAll(/data-faro-icon="([a-z0-9-]+)"/g)];
 for(const [,id]of refs){
  slots++;
  assert.ok(icons.has(id),file+' references unregistered icon '+id);
 }
}
assert.ok(slots>=8,'FARO must have real semantic icon slots, not just text removal');
assert.ok(manifest.icons.filter(x=>x.priority==='P0').length>=30);
console.log('FARO icon audit PASSED: '+manifest.icons.length+' registered designer assets, '+slots+
 ' semantic slots, 0 emojis in shipped web controllers. Designer SVGs not yet delivered.');
