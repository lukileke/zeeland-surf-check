/* FARO Spot DNA / evidence registry + shadow feature extractor.
   Research patterns are BEACH-LEVEL, not proven for individual sandbars.
   Shadow signals NEVER modify the live Surf Quality score.
   Clockwise angles indicate COMING FROM directions (meteorological). */
(function(root){
'use strict';
const E={
 Domburg:{
  windsFrom:'ESE–S / especially SE',swellFrom:'SW–N (changes with tide)',tide:'North swell: mid-to-higher tide in a local guide; SW swell: low tide. Surfline reports low–mid generally. Opinions differ.',
  sector:[[220,360],[0,20]],windSector:[[105,180]],conditions:'Bank-dependent beach break around groynes. Tide and swell direction interact; no universal optimum.',
  caveat:'Groynes and rip currents; different banks have different breaking shapes.',
  evidence:'multiple independent surf guides, not verified at each Faro sector',
  sources:[
   {name:'Surfline — Domburg',url:'https://www.surfline.com/surf-report/domburg/584204204e65fad6a77095f9/spot-guide'},
   {name:'Goede Golven — Domburg',url:'https://goedegolven.nl/surfspots/domburg'},
   {name:'SurfInfo — Domburg',url:'https://www.surfinfo.nl/spots/domburg/'}
  ]
 },
 Westkapelle:{
  windsFrom:'E–SE',swellFrom:'SW–N / particularly W–NW',tide:'Mid tide is suggested by SurfInfo; other accounts highlight bigger waves at high water. No accepted single tide optimum.',
  sector:[[220,360],[0,10]],windSector:[[65,145]],conditions:'West-facing coast and sea-defence structures alter exposure and reflected wave shape.',
  caveat:'Rock revetment, groynes and strong currents; not automatically a learner break.',
  evidence:'regional surf guides; local sector positions not verified',
  sources:[
   {name:'SurfInfo — Westkapelle',url:'https://www.surfinfo.nl/spots/westkapelle/'},
   {name:'Wompy — Westkapelle (high-tide hypothesis)',url:'https://www.wompy.nl/wanneer-surfen/westkapelle'},
   {name:'Westkapelle local guide',url:'https://www.westkapelle.com/nl/recreatie-en-sport/surfen-in-zeeland'}
  ]
 },
 Oostkapelle:{
  windsFrom:'E–S (shoreline-dependent)',swellFrom:'W–NW, and sometimes SW',tide:'Regional guide describes NW swell at mid–higher tide and SW swell at lower tide. Berkenbosch guide mentions mid tide; these are candidate patterns.',
  sector:[[225,355]],windSector:[[70,180]],conditions:'Beach breaks and changing banks; Berkenbosch evidence should not automatically be assigned to Main beach.',
  caveat:'Local sandbars, groynes and beach zoning; confirm legal surf location for each entry.',
  evidence:'indirect local/regional guides; no validated sector-specific optima',
  sources:[
   {name:'StrandAlert — Duinweg beach orientation (not a breaking-wave survey)',url:'https://strandalert.nl/nl/strand/oostkapelle-duinweg-veere'},
   {name:'Surfzeeland — Berkenbosch (windsurf/foil context)',url:'https://www.surfzeeland.nl/spot/oostkapelle-berkenbosch'}
  ]
 },
 Cadzand:{
  windsFrom:'E–SE',swellFrom:'NW / some SW events',tide:'Mid–high tide reported in a Zeeland surf directory; insufficient local validation for a definitive rule.',
  sector:[[280,360],[0,10]],windSector:[[65,150]],conditions:'Forecast direction is not enough to establish the breaking height at every bank.',
  caveat:'Check local tide, banks and currents. The two Faro sectors still lack separate field evidence.',
  evidence:'regional surf directory, low-to-moderate location specificity',
  sources:[
   {name:'Boardshortz surf map',url:'https://www.boardshortz.nl/surfen/nederland/surfspots/'},
   {name:'WaveSpot — Cadzand forecast (not validated spot optimum)',url:'https://wavespot.nl/surf/cadzand'}
  ]
 },
 Brouwersdam:{
  windsFrom:'E–SE for east-facing offshore conditions on North Sea side',swellFrom:'SW–N (nearshore exposure uncertain)',tide:'Mid tide is proposed in a generic guide. Do not infer surfing tide optimum from windsurf/foil guidance.',
  sector:[[220,360],[0,10]],windSector:[[65,145]],conditions:'North Sea side can differ substantially from the sheltered lagoon. Water-sports guidance mostly addresses kite, wing and foil rather than paddle surfing.',
  caveat:'Currents around dam structures and separation of water-sports zones; local signage is essential.',
  evidence:'surf guide + on-site water-sports provider; not verified for the three Faro surf sectors',
  sources:[
   {name:'SurfInfo — Brouwersdam',url:'https://www.surfinfo.nl/spots/brouwersdam/'},
   {name:'Natural High — Ouddorp and Brouwersdam (mostly kite/foil)',url:'https://surfshop.natural-high.nl/pages/brouwersdam-and-ouddorp-surf-spot-guide'}
  ]
 }
};
const parent=Object.fromEntries(Object.entries(E).map(([key,value])=>[key,Object.freeze({
 ...value,sources:Object.freeze(value.sources.map(s=>Object.freeze(s))),
 sector:Object.freeze(value.sector.map(pair=>Object.freeze(pair))),
 windSector:Object.freeze(value.windSector.map(pair=>Object.freeze(pair)))
})]));
function locate(spotId){
 const name=String(spotId||'').split('::')[0];
 const p=parent[name];
 return p?{beach:name,...p,spotEvidence:'inherited beach-level research; not verified at the selected Faro subspot'}:null;
}
function angleGap(a,b){return Math.abs(((a-b+540)%360)-180)}
function valid(v){return typeof v==='number'&&Number.isFinite(v)}
function inSectors(deg,sets){
 if(!valid(deg)||!sets)return null;
 const direction=((deg%360)+360)%360;
 return sets.some(([a,b])=>direction>=a&&direction<=b);
}
function signal(input,spotId){
 const p=locate(spotId);
 if(!p)return null;
 const waveFrom=valid(input?.swellDirection)?input.swellDirection:input?.waveDirection;
 const windFrom=input?.windDirection,angleNormal=input?.orientation;
 const windRelative=(valid(windFrom)&&valid(angleNormal))?Math.cos(angleGap(windFrom,(angleNormal+180)%360)*Math.PI/180):null;
 const windRole=windRelative===null?'unknown':windRelative>0.45?'offshore-influenced':windRelative<-.45?'onshore-influenced':'cross-shore';
 const swellAligned=inSectors(waveFrom,p.sector);
 const sectorWind=inSectors(windFrom,p.windSector);
 const sh=input?.swellHeight,wh=input?.windWaveHeight;
 // Squared significant-height share: an energy PROXY, not an observed energy flux.
 const proxy=valid(sh)&&valid(wh)&&sh>=0&&wh>=0&&sh*sh+wh*wh>0?
  (sh*sh)/(sh*sh+wh*wh):null;
 const gustiness=valid(input?.windGust)&&valid(input?.windSpeed)&&input.windSpeed>0?
  input.windGust/input.windSpeed:null;
 return {
  status:'shadow-evidence-only',beach:p.beach,spotId,
  windRole,windInReportedSector:sectorWind,reportedIncidentDirection:swellAligned,
  waveDirectionSource:valid(input?.swellDirection)?'separate swell':'total wave direction',
  swellEnergyProxyShare:proxy,windGustRatio:gustiness,
  modelMissing:[...(proxy===null?['separate swell / wind-wave heights']:[]),
   ...(gustiness===null?['wind gusts']:[]),
   'validated local tide-to-quality response','observed breaking-wave size','local sandbar state'],
  advisory:'These are candidate physical/guide signals, NOT a trained spot rating or safety assessment.'
 };
}
root.FaroSpotEvidence=Object.freeze({beaches:parent,locate,signal,angleGap,inSectors});
})(typeof globalThis!=='undefined'?globalThis:this);
