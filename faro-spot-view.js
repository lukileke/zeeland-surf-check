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
 // Four compact, independent signals. They never change the 0–10 score.
 const fit=root.FaroSpotSignals?.interpret({
  spotId:id,orientation:input.orientation,forecast:input.forecast
 });
 if(fit?.enabled){
  const signalPanel=el('section','spot-fit-panel');
  signalPanel.setAttribute('aria-label',tr('Model-to-spot compatibility','Compatibilidad orientativa con el spot'));
  const eyebrow=el('div','spot-fit-eyebrow');
  eyebrow.append(el('span','spot-fit-kicker',tr('SPOT FIT / MODEL VIEW','ENCAJE CON EL SPOT / MODELO')),
   el('span','spot-fit-scope',tr('Beach-level reference','Referencia de playa')));
  signalPanel.append(eyebrow);
  const headlines={
   'both-align':[ 'Wind and wave direction look aligned.', 'Viento y oleaje parecen alineados.' ],
   'wind-helps':[ 'The wind could help; wave shape remains uncertain.', 'El viento podría ayudar; la forma de la ola sigue incierta.' ],
   'wind-challenge':[ 'Wind could make this session harder.', 'El viento podría complicar esta sesión.' ],
   'wave-question':[ 'Wave direction is less compatible with the guide.', 'La dirección del oleaje encaja menos con la guía.' ],
   mixed:[ 'Mixed local signals. Check the beach.', 'Señales mixtas. Conviene revisar la playa.' ],
   uncertain:[ 'Insufficient local signals to decide.', 'Faltan datos locales para interpretar la sesión.' ]
  };
  signalPanel.append(el('p','spot-fit-verdict',
    (headlines[fit.verdict]||headlines.uncertain)[es?1:0]));
  const grid=el('div','spot-fit-grid');
  const statuses={
   favourable:[tr('Potentially favourable','Potencialmente favorable'),'positive'],
   mixed:[tr('Mixed','Mixto'),'mixed'],
   unfavourable:[tr('Less favourable','Menos favorable'),'negative'],
   unknown:[tr('Unknown','Sin datos'),'unknown']
  };
  function tile(name,heading,key,detail,displayOverride){
   const pair=statuses[key]||statuses.unknown;
   const item=el('div','spot-fit-item spot-fit--'+pair[1]);
   item.dataset.signal=name;
   item.append(el('span','spot-fit-label',heading),
    el('strong','spot-fit-state',displayOverride||pair[0]));
   if(detail)item.append(el('small','spot-fit-detail',detail));
   grid.append(item);
  }
  const windText={
   'light-offshore':tr('Light landward-origin wind','Viento suave desde tierra'),
   'wind-strength':tr('Strong wind or gusts','Viento o rachas fuertes'),
   'onshore-or-strong':tr('Onshore or strong wind','Viento de mar o intenso'),
   'cross-or-variable':tr('Cross-shore or variable angle','Viento lateral o ángulo variable')
  };
  const waveText={
   'period-unavailable':tr('Period data unavailable','No hay datos de período'),
   'direction-in-range':tr('Modelled direction in guide range','Dirección modelada dentro del rango'),
   'sector-edge':tr('Near the reported angle range','Cerca del límite de orientación'),
   'short-period':tr('Short-period modelled waves','Oleaje modelado de período corto'),
   'outside-reported-window':tr('Outside the guide angle range','Fuera del rango indicado por la guía')
  };
  tile('wind',tr('WIND','VIENTO'),fit.wind,windText[fit.windContext]||
    tr('Direction or speed missing','Falta dirección o velocidad'));
  tile('wave',tr('MODEL WAVES','OLEAJE DEL MODELO'),fit.wave,waveText[fit.waveContext]||
    tr('Direction unavailable','Dirección no disponible'));
  tile('tide',tr('TIDE','MAREA'),fit.tide,
    tr('No validated tide-to-break model','Sin modelo de marea validado'),
    tr('Not calibrated','No calibrada'));
  // Confidence is NOT an ordinal "high/medium" judgement: all twelve
  // subspots currently inherit beach-level literature, not observed banks.
  tile('evidence',tr('EVIDENCE','EVIDENCIA'),'unknown',
   fit.validationScope==='local'?
    tr('Local corroboration added','Validación local incorporada'):
    tr('Beach guide, not a measured sandbank','Guía de playa, no banco medido'),
   fit.validationScope==='local'?tr('Local reference','Referencia local'):
    tr('Beach-level only','Solo de playa'));
  signalPanel.append(grid);
  signalPanel.append(el('p','spot-fit-method',
   tr('Indicative only: wave direction represents modelled total waves, not a measured breaking swell. These signals are not a safety clearance and do not change Surf Quality.',
    'Solo orientativo: la dirección corresponde al oleaje total del modelo, no al swell que rompe en la playa. No evalúa seguridad ni modifica Surf Quality.')));
  target.append(signalPanel);
 }
 function highlight(icon,title,value){
  if(!value)return;
  const item=el('div','spot-profile-highlight');
  const titleRow=el('div','spot-profile-highlight-title');
  titleRow.append(el('span','spot-profile-highlight-icon',icon),el('strong',null,title));
  item.append(titleRow,el('p','spot-profile-copy',value));
  target.append(item);
 }
 highlight('',tr('Keep in mind','Ten en cuenta'),
  sector?textFor(sector.watch):input.fallback?.risks);
 highlight('',tr('Access & local use','Acceso y usos'),
  sector?textFor(sector.access):input.fallback?.extra);
 const extra=el('details','spot-profile-more');
 const heading=el('summary','spot-profile-more-summary');
 heading.append(el('span',null,tr('Wind, swell, tides & sources','Viento, oleaje, mareas y fuentes')),
  el('span','spot-profile-more-arrow',''));
 extra.append(heading);
 const body=el('div','spot-profile-more-body');
 if(guide?.surfCulture){
  body.append(el('small','spot-profile-section-title',tr('LOCAL SURF SCENE','ENTORNO SURF LOCAL')));
  body.append(el('p','spot-profile-copy',guide.surfCulture[es?'es':'en']));
 }
 if(guide){
  const area=el('div','spot-profile-guide');
  area.append(el('small','spot-profile-section-title',tr('BEACH-LEVEL GUIDES','GUÍAS DE LA PLAYA')));
  const simple=el('div','spot-profile-facts');
  function fact(name,value){const d=el('div','spot-profile-fact');d.append(el('strong',null,name),el('span',null,value));simple.append(d)}
  fact(tr('Wind','Viento'),guide.windsFrom);
  fact(tr('Swell','Oleaje'),guide.swellFrom);
  area.append(simple);
  area.append(el('p','spot-profile-copy',tr('Tide evidence: ','Referencias de marea: ')+(es?(guide.tideEs||guide.tide):guide.tide)));
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
  const a=el('a','spot-profile-link',source.name+' ');
  a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';
  links.append(a);
 }
 if(seen.size)body.append(el('small','spot-profile-section-title',tr('REFERENCES','REFERENCIAS')),links);
 extra.append(body);target.append(extra);
}
root.FaroSpotView=Object.freeze({render});
})(typeof globalThis!=='undefined'?globalThis:this);
