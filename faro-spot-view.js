/* FARO sector profile UI, v1. Sources and editorial claims are kept in
 * faro-spot-evidence.js; never infer a local sandbar optimum or legal entry
 * merely from a forecast coordinate. */
(function(root){
 'use strict';
 const document=root.document;
 function node(tag,className,text){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(text!==undefined)el.textContent=String(text);
  return el;
 }
 function render(target,input){
  if(!target)return;
  target.replaceChildren();
  const es=input.locale==='es',choose=(a,b)=>es?b:a;
  const id=input.beach+'::'+input.sector;
  const evidence=root.FaroSpotEvidence?.locateSector(id);
  const guide=root.FaroSpotEvidence?.locate(id);
  const head=node('header','spot-profile-header');
  head.append(
   node('small','spot-profile-eyebrow',choose('SECTOR PROFILE / RESEARCH','PERFIL DEL SECTOR / INVESTIGACIÓN')),
   node('h3','spot-profile-title',input.beach+' · '+input.sector)
  );
  const chips=node('div','spot-profile-chips');
  chips.append(
   node('span','spot-profile-chip',choose('Local context','Contexto local')),
   node('span','spot-profile-chip spot-profile-chip--muted',choose('Break not calibrated','Rompiente no calibrada'))
  );
  head.append(chips);
  target.append(head);
  function row(icon,title,value){
   const el=node('section','spot-profile-row');
   const label=node('div','spot-profile-row-label');
   label.append(node('span','spot-profile-icon',icon),node('strong',null,title));
   el.append(label,node('p','spot-profile-copy',value));
   target.append(el);
  }
  if(evidence){
   const p=evidence.sector;
   row('🏖',choose('Sector character','Características del sector'),p.setting[es?'es':'en']);
   row('⚠',choose('What to watch','Qué observar'),p.watch[es?'es':'en']);
   row('📍',choose('Access and local use','Acceso y usos de playa'),p.access[es?'es':'en']);
  }else{
   row('🏖',choose('Beach environment','Entorno de la playa'),input.fallback?.type||choose('Coastal beach','Playa costera'));
   row('⚠',choose('What to watch','Qué observar'),input.fallback?.risks||choose('Check local beach conditions.','Revisa las condiciones locales.'));
  }
  if(guide){
   const refs=node('section','spot-profile-guide');
   refs.append(node('strong','spot-profile-section-title',choose('BEACH-LEVEL GUIDE SIGNALS','REFERENCIAS GENERALES DE LA PLAYA')));
   refs.append(node('p','spot-profile-copy',choose('Reported wind: ','Viento orientativo: ')+guide.windsFrom+
    ' · '+choose('Swell: ','Oleaje: ')+guide.swellFrom));
   refs.append(node('p','spot-profile-copy',choose('Tide evidence: ','Marea según guías: ')+guide.tide));
   target.append(refs);
   const x=input.forecast,orientation=input.orientation;
   if(x&&Number.isFinite(orientation)){
    const signal=root.FaroSpotEvidence?.signal({
     windDirection:x.dir,windSpeed:x.wind,waveDirection:x.wd,orientation
    },id);
    if(signal){
     const values={
      'offshore-influenced':choose('offshore-influenced','con componente offshore'),
      'onshore-influenced':choose('onshore-influenced','con componente onshore'),
      'cross-shore':choose('cross-shore','lateral'),
      unknown:choose('unknown','sin datos')
     };
     target.append(node('p','spot-profile-model-note',
      choose('Selected model wind: ','Viento modelado seleccionado: ')+
      (values[signal.windRole]||values.unknown)+
      choose(' (indicative coastline orientation, not an observed breaking wave).',
       ' (orientación aproximada de la costa; no es una observación de olas rompientes).')));
    }
   }
  }
  target.append(node('p','spot-profile-caveat',
   choose('Evidence boundary: bank shape, ideal tide, currents and activity permissions are not mapped to this exact coordinate. Always verify signs and the shore before entering.',
    'Límite de la evidencia: los bancos, la marea óptima, las corrientes y las zonas autorizadas no están cartografiados para esta coordenada. Comprueba siempre la señalización y la playa.')));
  const refs=node('footer','spot-profile-sources');
  refs.append(node('strong','spot-profile-section-title',choose('SOURCES / LOCAL GUIDES','FUENTES / GUÍAS LOCALES')));
  const found=new Set();
  for(const source of [evidence?.sector?.source,...(guide?.sources||[])]){
   if(!source?.url||found.has(source.url))continue;
   found.add(source.url);
   const a=node('a','spot-profile-link',source.name+' ↗');
   a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';
   refs.append(a);
  }
  target.append(refs);
 }
 root.FaroSpotView=Object.freeze({render});
})(typeof globalThis!=='undefined'?globalThis:this);
