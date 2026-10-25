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
/* Specific, research-backed sector context (not calibrated sandbar forecasts).
 * EN/ES strings intentionally authored together to avoid brittle auto translation.
 * Source support ranges from neighbourhood/location to beach-level surf guides;
 * none establishes a measured break optimum for any FARO subspot. */
const SECTOR_CONTEXT={
 "Domburg::Noordduine": {
  "setting": {
   "en": "North-of-centre dune beach near Noordduine, with the Domburg surf-school area. This is an exposed sandy beach with groynes, not a mapped individual sandbank.",
   "es": "Sector de dunas al norte del centro, próximo a Noordduine y a la zona de escuelas de surf. Es una playa arenosa con espigones, no un banco de arena cartografiado."
  },
  "watch": {
   "en": "Wooden groynes and rip channels can affect entry and shape; look at several banks from shore before deciding.",
   "es": "Los espigones de madera y posibles canales de retorno condicionan el acceso y la ola; observa varios bancos desde la orilla."
  },
  "access": {
   "en": "Use marked beach access and check the signs, surf-school activity and swimming zones on arrival.",
   "es": "Usa accesos señalizados y comprueba carteles, clases de surf y zonas de baño al llegar."
  },
  "source": {
   "name": "Surfline · Domburg spot guide",
   "url": "https://www.surfline.com/surf-report/domburg/584204204e65fad6a77095f9/spot-guide"
  }
 },
 "Domburg::Central beach": {
  "setting": {
   "en": "Town-front beach on Domburg's north-west-facing coast. Different groyne-separated sandbanks may work differently on the same tide.",
   "es": "Playa frente al centro de Domburg, en una costa orientada al noroeste. Los bancos entre espigones pueden funcionar de forma distinta con la misma marea."
  },
  "watch": {
   "en": "Do not extrapolate a favourable tide from one groyne compartment to the next; account for currents and submerged timber.",
   "es": "No extrapoles la marea favorable de un tramo entre espigones a otro; considera corrientes y postes sumergidos."
  },
  "access": {
   "en": "Access is through the Domburg beachfront; inspect the precise bank and seasonal bathing zones.",
   "es": "El acceso es por el frente de playa de Domburg; comprueba el banco concreto y las zonas de baño estacionales."
  },
  "source": {
   "name": "Surfline · Domburg spot guide",
   "url": "https://www.surfline.com/surf-report/domburg/584204204e65fad6a77095f9/spot-guide"
  }
 },
 "Domburg::West sector": {
  "setting": {
   "en": "A western FARO sampling point along Domburg's beach. It shares the exposed beach-break setting, but its bank geometry has not been locally surveyed.",
   "es": "Punto de pronóstico occidental de FARO en la playa de Domburg. Comparte el entorno de rompiente arenosa expuesta, pero sus bancos no se han estudiado localmente."
  },
  "watch": {
   "en": "Groynes, currents and shifting banks remain relevant. A town-centre report does not confirm this sector's breaking shape.",
   "es": "Siguen importando los espigones, corrientes y bancos cambiantes. Un reporte del centro no confirma cómo rompe este sector."
  },
  "access": {
   "en": "Check the nearest legal beach access, visible groynes and an exit route before entering.",
   "es": "Comprueba el acceso autorizado más cercano, los espigones visibles y cómo salir antes de entrar."
  },
  "source": {
   "name": "Surfline · Domburg spot guide",
   "url": "https://www.surfline.com/surf-report/domburg/584204204e65fad6a77095f9/spot-guide"
  }
 },
 "Westkapelle::North beach": {
  "setting": {
   "en": "FARO's northern sampling area near the changing coastline of Westkapelle. The mapped sampling point is not a verified individual surf break.",
   "es": "Sector norte de FARO cerca del cambio de orientación de la costa de Westkapelle. El punto cartografiado no es una rompiente individual validada."
  },
  "watch": {
   "en": "Sea defences, rocks and currents may be relevant; do not assume the central-dike conditions apply here.",
   "es": "Puede haber defensas costeras, rocas y corrientes; no supongas que las condiciones del dique central son iguales aquí."
  },
  "access": {
   "en": "Inspect a genuinely sandy entry and local coastal restrictions before planning a session.",
   "es": "Comprueba una entrada realmente arenosa y las restricciones costeras locales antes de entrar."
  },
  "source": {
   "name": "SurfInfo · Westkapelle",
   "url": "https://www.surfinfo.nl/spots/westkapelle/"
  }
 },
 "Westkapelle::Central area": {
  "setting": {
   "en": "Westkapelle's central coast lies by the sea-dike frontage; the stony revetment can alter reflection and access compared with an open sandy beach.",
   "es": "La costa central de Westkapelle bordea el dique; el revestimiento de piedra puede modificar el rebote de las olas y el acceso frente a una playa abierta."
  },
  "watch": {
   "en": "Rock, wave reflection and potentially strong tidal currents matter more than an appealing model score.",
   "es": "Las rocas, el rebote de las olas y las posibles corrientes de marea fuertes importan más que una buena puntuación del modelo."
  },
  "access": {
   "en": "Do not assume there is a safe paddle-surf entry beside the dike; check the on-site signs and conditions.",
   "es": "No presupongas que hay un acceso seguro para surfear junto al dique; verifica carteles y condiciones en el lugar."
  },
  "source": {
   "name": "SurfInfo · Westkapelle",
   "url": "https://www.surfinfo.nl/spots/westkapelle/"
  }
 },
 "Oostkapelle::Main beach": {
  "setting": {
   "en": "Open sandy coast towards Oostkapelle's main beach and dune landscape; FARO does not currently know the active nearshore sandbars.",
   "es": "Costa arenosa abierta hacia la playa principal y las dunas de Oostkapelle; FARO aún no conoce los bancos activos cerca de la orilla."
  },
  "watch": {
   "en": "Rip channels and changes in the sandbar profile may matter; do not transfer Berkenbosch tide advice to this sector.",
   "es": "Pueden influir los canales de retorno y los cambios de bancos; no traslades la recomendación de marea de Berkenbosch a este sector."
  },
  "access": {
   "en": "Use official dune crossings and check local beach zoning, including nature-area access restrictions.",
   "es": "Usa pasos de dunas oficiales y verifica las zonas de uso de playa y las restricciones de los espacios naturales."
  },
  "source": {
   "name": "Zeeland · Oostkapelle",
   "url": "https://www.zeeland.com/en/visit/islands/walcheren/towns-and-villages/oostkapelle/what-makes-oostkapelle-so-special"
  }
 },
 "Oostkapelle::West sector": {
  "setting": {
   "en": "FARO's western point is near the Berkenbosch coastal area. Published local guidance mainly concerns windsurfing and foiling rather than verified paddle-surf banks.",
   "es": "El punto occidental de FARO está próximo a Berkenbosch. Las guías locales tratan principalmente de windsurf y foil, no de bancos validados para surf de remo."
  },
  "watch": {
   "en": "A published mid-tide preference for Berkenbosch must not be presented as a proven surf optimum for this exact point.",
   "es": "La preferencia por media marea publicada para Berkenbosch no demuestra que sea óptima para surfear en este punto."
  },
  "access": {
   "en": "Check the longer dune access, and read the seasonal wind/foil activity signs before entering the water.",
   "es": "Comprueba el acceso por las dunas y la señalización estacional sobre windsurf y foil antes de entrar."
  },
  "source": {
   "name": "Surfzeeland · Berkenbosch (wind/foil)",
   "url": "https://www.surfzeeland.nl/spot/oostkapelle-berkenbosch"
  }
 },
 "Cadzand::Cadzand-Bad": {
  "setting": {
   "en": "Resort-front Cadzand beach has designated recreational zones. The harbour and Zwingeul are distinct high-current areas, not recommended surf entries.",
   "es": "La playa turística de Cadzand cuenta con zonas recreativas señalizadas. El puerto y la Zwingeul son áreas separadas con corrientes peligrosas, no accesos recomendados para surf."
  },
  "watch": {
   "en": "Check swimmer, kite and sport-beach areas; municipal restrictions are not inferred from a forecast point.",
   "es": "Comprueba las zonas de baño, kite y playa deportiva; un punto de pronóstico no determina las restricciones municipales."
  },
  "access": {
   "en": "Follow municipal access boards; the published sport-beach section around Moio Beach is conditional on crowding.",
   "es": "Sigue los carteles municipales; la zona deportiva publicada cerca de Moio Beach depende de la afluencia."
  },
  "source": {
   "name": "Gemeente Sluis · Beach zoning",
   "url": "https://www.gemeentesluis.nl/onze-stranden/"
  }
 },
 "Cadzand::West sector": {
  "setting": {
   "en": "Western Cadzand is in the direction of the Het Zwin coastal reserve. FARO does not map the legal sports-zone boundaries onto this exact forecast point.",
   "es": "El sector occidental de Cadzand queda en dirección a la reserva costera de Het Zwin. FARO no superpone los límites de zonas deportivas al punto exacto del pronóstico."
  },
  "watch": {
   "en": "Stay away from the Zwingeul tidal channel and check the designated surf/kite zones; strong currents and conservation restrictions matter.",
   "es": "Aléjate del canal mareal Zwingeul y revisa las zonas autorizadas para surf y kite; importan las corrientes y la protección ambiental."
  },
  "access": {
   "en": "Municipal information identifies specific 't Zwin sport-beach sections; verify the entry point and signs on site.",
   "es": "La información municipal identifica tramos deportivos específicos en 't Zwin; verifica el acceso y los carteles en el lugar."
  },
  "source": {
   "name": "Gemeente Sluis · Beach zoning",
   "url": "https://www.gemeentesluis.nl/onze-stranden/"
  }
 },
 "Brouwersdam::North beach": {
  "setting": {
   "en": "Northern North Sea-side forecast point at Brouwersdam, not a validated breaking-wave bank. It must not be confused with the sheltered Grevelingen side.",
   "es": "Punto norte del pronóstico en el lado del mar del Norte de Brouwersdam, no un banco de rompiente validado. No debe confundirse con el lado protegido de Grevelingen."
  },
  "watch": {
   "en": "Other watersports, dam structures and tidal currents can complicate the area; the model does not resolve their local positions.",
   "es": "Otros deportes acuáticos, las estructuras del dique y las corrientes de marea pueden complicar la zona; el modelo no identifica sus posiciones locales."
  },
  "access": {
   "en": "Check the North Sea-side beach entrance and the current surf/kite/foil zoning.",
   "es": "Comprueba la entrada a la playa del mar del Norte y las zonas vigentes de surf, kite y foil."
  },
  "source": {
   "name": "Rijkswaterstaat · Brouwerspuisluis",
   "url": "https://www.rijkswaterstaat.nl/water/projectenoverzicht/grevelingen-vervangen-stroomgeleidingsschermen-brouwerspuisluis"
  }
 },
 "Brouwersdam::Central beach": {
  "setting": {
   "en": "Central North Sea-facing Brouwersdam sector, where coastal defences and recreational watersports are important context. An offshore wave height is not a breaking-wave measurement.",
   "es": "Sector central de Brouwersdam orientado al mar del Norte, donde importan las defensas costeras y los deportes acuáticos. La altura mar adentro no mide las olas que rompen."
  },
  "watch": {
   "en": "Avoid outlet and dam infrastructure; Rijkswaterstaat documents strong eddies at the Brouwerspuisluis inlet.",
   "es": "Evita las infraestructuras de desagüe y del dique; Rijkswaterstaat documenta remolinos fuertes junto a la Brouwerspuisluis."
  },
  "access": {
   "en": "Check local signage for permitted sports and safe beach access; do not enter near sluices.",
   "es": "Comprueba los carteles de deportes permitidos y acceso seguro; no entres cerca de las esclusas."
  },
  "source": {
   "name": "Rijkswaterstaat · Brouwerspuisluis",
   "url": "https://www.rijkswaterstaat.nl/water/projectenoverzicht/grevelingen-vervangen-stroomgeleidingsschermen-brouwerspuisluis"
  }
 },
 "Brouwersdam::South beach": {
  "setting": {
   "en": "Southern FARO point on the North Sea coast near Brouwersdam. The waves here have not been calibrated against observed sandbanks.",
   "es": "Punto sur de FARO en la costa del mar del Norte cerca de Brouwersdam. Las olas aquí no se han calibrado con observaciones de bancos."
  },
  "watch": {
   "en": "Coastal structures, currents and shifting beach conditions need direct assessment; lagoon-side windsports reports may not describe paddle surf here.",
   "es": "Las estructuras costeras, corrientes y cambios en la playa requieren observación directa; las guías del lado de la laguna pueden no describir el surf de este sector."
  },
  "access": {
   "en": "Use the signed North Sea beach access and verify sport zones and restrictions before a session.",
   "es": "Usa los accesos señalizados a la playa del mar del Norte y verifica zonas deportivas y restricciones."
  },
  "source": {
   "name": "Rijkswaterstaat · Brouwerspuisluis",
   "url": "https://www.rijkswaterstaat.nl/water/projectenoverzicht/grevelingen-vervangen-stroomgeleidingsschermen-brouwerspuisluis"
  }
 }
};
function locateSector(spotId){
 const id=String(spotId||'');
 const beach=locate(id);
 const sector=SECTOR_CONTEXT[id];
 return beach&&sector?{id,beach,sector,confidence:'indicative-sector-context; beach-level surf evidence'}:null;
}
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
root.FaroSpotEvidence=Object.freeze({beaches:parent,sectors:SECTOR_CONTEXT,locate,locateSector,signal,angleGap,inSectors});
})(typeof globalThis!=='undefined'?globalThis:this);
