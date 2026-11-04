'use strict';
/* FARO CSS bundles: order-preserving build, not blind minification.
 * Usage: node scripts/build-faro-css.cjs [--check]
 * Why: Chile previously loaded 28 local CSS resources. The late overrides,
 * including !important rules, are order-sensitive and shared Zeeland sheets
 * remain independently maintained. Build these files, then inspect browser
 * screenshots before changing specificity/deleting obsolete rules.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const groups=[
 {target:'chile/faro-bundle-01-foundations.css',
  header:'/* FARO CSS bundle A · source order locked. Generated 2026-11-04. */',
  sources:['assets/faro-icons.css','assets/faro-editorial-polish.css']},
 {target:'chile/faro-bundle-02-core.css',
  header:'/* FARO CSS bundle B · core design contracts · exact source order. */',
  sources:['faro-core.css','faro-ui.css','faro-brand.css','faro-daily.css','faro-rhythm.css',
   'faro-colours.css','faro-spot-signals.css','faro-desktop.css']},
 {target:'chile/faro-bundle-03-coast.css',
  header:'/* FARO CSS bundle C · physical models, map and Chile editorial. Exact cascade. */',
  sources:['faro-country.css','chile/chile-forecast.css','faro-spot-dna-editorial.css',
   'assets/faro-visual-system-v2.css','assets/faro-coastal-lens-v4.css',
   'chile/chile-visual-contract.css','chile/faro-coastal-editorial-v3.css',
   'chile/faro-brand-refresh-v1.css']},
 {target:'chile/faro-bundle-04-experience.css',
  header:'/* FARO CSS bundle D · final editorial and responsive composition. Exact cascade. */',
  sources:['chile/faro-responsive-safety-v3.css','chile/faro-beacon-atmosphere-v4.css',
   'chile/faro-editorial-experience-v2.css','chile/faro-finish-pass-v1.css',
   'chile/faro-mobile-reading-order-v1.css','chile/faro-hero-synchronised-pulse-v1.css',
   'chile/faro-editorial-hero-focus-v1.css','chile/faro-responsive-quality-v1.css',
   'chile/faro-decision-balance-v1.css']}
];
function rewriteCssUrls(src,file){
 const dir=file.split('/').slice(0,-1);
 return src.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/g,(all,q,u)=>{
  const value=u.trim();
  if(/^(?:data:|https?:|\/\/|\/|#|blob:)/i.test(value))return all;
  const segments=[...dir];
  for(const piece of value.split('/')){
   if(piece==='..')segments.pop();
   else if(piece!=='.')segments.push(piece);
  }
  const rewritten=segments[0]==='chile'?segments.slice(1).join('/'):'../'+segments.join('/');
  return 'url('+q+rewritten+q+')';
 });
}
function build(group){
 const parts=group.sources.map(file=>{
  const source=fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(!/@import\s/.test(source),'CSS @import requires special handling: '+file);
  return '\n/* >>> '+file+' >>> */\n'+rewriteCssUrls(source,file)+
   '\n/* <<< '+file+' <<< */\n';
 });
 return group.header+'\n'+parts.join('\n');
}
const verify=process.argv.includes('--check');
for(const group of groups){
 const data=build(group),target=path.join(root,group.target);
 if(verify){
  assert.equal(fs.readFileSync(target,'utf8'),data,group.target+
   ' out of sync. Regenerate with node scripts/build-faro-css.cjs');
 }else{
  fs.writeFileSync(target,data,'utf8');
 }
 console.log((verify?'CHECK':'BUILD')+' '+group.target+': '+data.length+' chars');
}
const html=fs.readFileSync(path.join(root,'chile/index.html'),'utf8');
const styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]);
const expected=['faro-bundle-01-foundations.css?v=1',
 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Manrope:wght@400;500;600;700;800&display=swap',
 'faro-bundle-02-core.css?v=1','faro-bundle-03-coast.css?v=1',
 'faro-bundle-04-experience.css?v=1','faro-score-colour-lock-v1.css?v=1'];
assert.deepEqual(styles,expected,'FARO CSS bundle order changed; do not silently alter precedence');
console.log('FARO Chile: 27 legacy CSS layers consolidated into four bundles; score lock is last');
