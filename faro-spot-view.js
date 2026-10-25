/* FARO Spot Insight — compact, source-labelled sector profile.
 * This is local context, NOT observed bathymetry or safe-entry clearance.
 * Guide evidence is available on demand rather than dominating the forecast. */
(function(root){
'use strict';
const doc=root.document;
function el(tag,cls,value){
 const result=doc.createElement(tag);
 if(cls)result.className=cls;
 if(value!==undefined)result.textContent=String(value);
 return result;
}
function render(target,input){
 if(!target)return;
 target.replaceChildren();
 const es=input.locale==='es',tr=(en,spa)=>es?spa:en;
 const id=input.beach+'::'+input.sector;
 const evidence=root.FaroSpotEvidence?.locateSector(id);
 const guide=root.FaroSpotEvidence?.locate(id);
 const sector=evidence?.sector;
 const textFor=o=>o?.[es?'es':'en']||'';
 const intro=el('header','spot-profile-intro');
 intro.append(
  el('small','spot-profile-eyebrow',tr('LOCAL SPOT / RESEARCH','SPOT LOCAL / INVESTIGACIÓN')),
  el('h3','spot-profile-title',input.beach+' · '+input.sector)
 );
 intro.append(el('p','spot-profile-lead',sector?textFor(sector.setting):
  input.fallback?.type||tr('The local surf break is not calibrated.','Esta rompiente no está calibrada.')));
 const trust=el('div','spot-profile-trust');
 trust.append(el('span','spot-profile-trust-dot','◌'),
  el('span',null,tr('Guide-based context · individual sandbars unverified',
   'Contexto de guías · bancos sin validar')));
 try{
  const notes=root.FaroSpotDNA?.summary(id);
  if(notes?.count>0)trust.append(el('span','spot-profile-notes',
   tr(notes.count+' personal field notes',notes.count+' notas personales')));
 }catch(e){/* User may have disabled local storage. */}
 intro.append(trust);target.append(intro);
 function highlight(icon,title,value){
  if(!value)return;
  const item=el('div','spot-profile-highlight');
  const titleRow=el('div','spot-profile-highlight-title');
  titleRow.append(el('span','spot-profile-highlight-icon',icon),el('strong',null,title));
  item.append(titleRow,el('p','spot-profile-copy',value));
  target.append(item);
 }
 highlight('⚠',tr('Keep in mind','Ten en cuenta'),
  sector?textFor(sector.watch):input.fallback?.risks);
 highlight('↗',tr('Access & local use','Acceso y usos'),
  sector?textFor(sector.access):input.fallback?.extra);
 const extra=el('details','spot-profile-more');
 const heading=el('summary','spot-profile-more-summary');
 heading.append(el('span',null,tr('Wind, swell, tides & sources','Viento, oleaje, mareas y fuentes')),
  el('span','spot-profile-more-arrow','⌄'));
 extra.append(heading);
 const body=el('div','spot-profile-more-body');
 if(guide){
  const area=el('div','spot-profile-guide');
  area.append(el('small','spot-profile-section-title',tr('BEACH-LEVEL GUIDES','GUÍAS DE LA PLAYA')));
  const simple=el('div','spot-profile-facts');
  function fact(name,value){const d=el('div','spot-profile-fact');d.append(el('strong',null,name),el('span',null,value));simple.append(d)}
  fact(tr('Wind','Viento'),guide.windsFrom);
  fact(tr('Swell','Oleaje'),guide.swellFrom);
  area.append(simple);
  area.append(el('p','spot-profile-copy',tr('Tide evidence: ','Referencias de marea: ')+guide.tide));
  body.append(area);
  if(input.forecast&&Number.isFinite(input.orientation)){
   const signal=root.FaroSpotEvidence?.signal({
    windDirection:input.forecast.dir,windSpeed:input.forecast.wind,
    waveDirection:input.forecast.wd,orientation:input.orientation
   },id);
   if(signal){
    const windRole={
     'offshore-influenced':tr('offshore influence','componente offshore'),
     'onshore-influenced':tr('onshore influence','componente onshore'),
     'cross-shore':tr('cross-shore','lateral'),
     unknown:tr('undetermined','sin determinar')
    }[signal.windRole];
    body.append(el('p','spot-profile-model-note',
     tr('Selected window: modelled wind suggests ','Ventana seleccionada: el viento modelado sugiere ')+windRole+
     tr('. This does not verify the shape of breaking waves.','. No permite verificar cómo rompen las olas.')));
   }
  }
 }
 body.append(el('p','spot-profile-disclaimer',
  tr('Local bank shape, ideal tide, currents and permitted activities are not verified for this point. Check beach signs, actual water and official notices before entering.',
   'La forma de los bancos, marea óptima, corrientes y actividades permitidas no están verificadas para este punto. Comprueba la playa y los avisos oficiales antes de entrar.')));
 const links=el('div','spot-profile-links');
 const seen=new Set();
 for(const source of [sector?.source,...(guide?.sources||[])]){
  if(!source?.url||seen.has(source.url))continue;
  seen.add(source.url);
  const a=el('a','spot-profile-link',source.name+' ↗');
  a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';
  links.append(a);
 }
 if(seen.size)body.append(el('small','spot-profile-section-title',tr('REFERENCES','REFERENCIAS')),links);
 extra.append(body);target.append(extra);
}
root.FaroSpotView=Object.freeze({render});
})(typeof globalThis!=='undefined'?globalThis:this);
