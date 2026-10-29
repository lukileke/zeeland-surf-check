/* One dated-alert vocabulary shared by the Chile coastal map and the
 * FARO safety disclosure. These are NOT an automatically synced official feed.
 * No generated description may upgrade a reported restriction to a live alert.
 */
(function(root){
 "use strict";
 const copy={
  reported_restriction:{
   severity:"caution",es:"Restricción recreativa reportada",en:"Reported recreation restriction",
   briefEs:"Estado actual no verificado",briefEn:"Current status not verified",
   kindEs:"RESTRICCIÓN REPORTADA",kindEn:"REPORTED RESTRICTION",
   tagEs:"Sin verificación en directo",tagEn:"Not live-verified"
  },
  sanitary_warning:{
   severity:"caution",es:"Aviso sanitario reportado",en:"Reported health notice",
   briefEs:"Verifica vigencia y autoridad",briefEn:"Verify status with authorities",
   kindEs:"AVISO SANITARIO",kindEn:"HEALTH NOTICE",
   tagEs:"No sincronizado",tagEn:"Not synced"
  },
  official_marine_warning:{
   severity:"danger",es:"Aviso marítimo publicado",en:"Published marine warning",
   briefEs:"Confirma el boletín vigente",briefEn:"Confirm current bulletin",
   kindEs:"AVISO MARÍTIMO",kindEn:"MARINE NOTICE",
   tagEs:"Estado sin confirmar",tagEn:"Current status unverified"
  },
  access_closure:{
   severity:"danger",es:"Cierre de acceso reportado",en:"Reported access closure",
   briefEs:"Comprueba resolución vigente",briefEn:"Check current ruling",
   kindEs:"ACCESO RESTRINGIDO",kindEn:"RESTRICTED ACCESS",
   tagEs:"Sin verificación en directo",tagEn:"Not live-verified"
  },
  monitoring_notice:{
   severity:"advisory",es:"Aviso para comprobar",en:"Notice to check",
   briefEs:"Consulta las fuentes oficiales",briefEn:"Check official sources",
   kindEs:"MONITOREO",kindEn:"MONITORING",
   tagEs:"No sincronizado",tagEn:"Not synced"
  }
 };
 const mapped={
  restriction_reported_not_live_verified:"reported_restriction",
  reported_restriction:"reported_restriction",
  sanitary_warning:"sanitary_warning",
  official_marine_warning:"official_marine_warning",
  access_closure:"access_closure",
  monitoring_notice:"monitoring_notice"
 };
 function dateText(raw,es){
  if(!/^\d{4}-\d\d-\d\d$/.test(raw||""))return es?"Fecha no disponible":"Date unavailable";
  const d=new Date(raw+"T12:00:00Z");
  if(!Number.isFinite(d.getTime()))return es?"Fecha no disponible":"Date unavailable";
  return new Intl.DateTimeFormat(es?"es-CL":"en-GB",
   {day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(d);
 }
 function describe(spot,lang){
  const n=spot?.accessNotice;
  if(!n||n.clearanceVerified===true)return null;
  const type=mapped[n.status];
  if(!type)return null; // Unknown states are never promoted into an alert.
  const c=copy[type],es=lang!=="en",spotName=spot.shortName||spot.name||"Spot";
  const date=n.lastConfirmedReport||n.reportedOn||null;
  const title=es?c.es:c.en;
  return Object.freeze({
   type,severity:c.severity,title,spotName,
   headline:spotName+" · "+title,
   kicker:"FARO · "+(es?"AVISOS":"NOTICES"),
   severityLabel:es?c.kindEs:c.kindEn,
   statusLabel:es?c.tagEs:c.tagEn,
   subline:(es?"Último reporte ":"Last report ")+dateText(date,es)+" · "+
    (es?c.briefEs:c.briefEn),
   tooltipTitle:title,
   tooltipDetail:es?"Último reporte: "+dateText(date,true)+". Estado actual no verificado.":
    "Last report: "+dateText(date,false)+". Current status not verified.",
   detail:es?(n.es||c.briefEs):(n.en||c.briefEn),
   sourceUrl:/^https:\/\//.test(n.sourceUrl||"")?n.sourceUrl:null,
   sourceLabel:es?"Fuente del reporte fechado":"Dated report source",
   lastReport:date,live:false,
   actionAllowed:n.publicRecommendationAllowed!==false
  });
 }
 root.FaroChileNotices=Object.freeze({describe,kinds:Object.freeze(Object.keys(copy))});
 if(typeof module==="object"&&module.exports)module.exports=root.FaroChileNotices;
})(typeof window!=="undefined"?window:globalThis);
