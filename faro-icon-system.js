/* FARO shared icon contract · replace decorative emoji with clear labels.
 * Do not draw new placeholder artwork. María's reviewed icons are opt-in via
 * assets/icons/approved.json. Oceanographic SVG data visualisations stay intact.
 */
(function(root){"use strict";
 const self=document.currentScript;
 const iconRoot=new URL("assets/icons/",self?.src||document.baseURI);
 const approvedUrl=new URL("approved.json",iconRoot);
 const approved=Object.create(null);
 const iconSelectors=[
  ["#dailyOverview .chile-wave-feature-head","wave-height"],
  ["#dailyOverview .day-signal-metric:nth-child(2) .day-signal-figure","wave-period"],
  ["#dailyOverview .day-signal-metric:nth-child(3) .day-signal-figure","wind"],
  [".faro-vibe-brand","faro-vibe"],
  ["#coastMapExpand>.forecast-accordion-title","coast-map"],
  ["#fieldNotesExpand>.forecast-accordion-title","field-notes"],
  ["#cameraExpand>.forecast-accordion-title","camera"],
  ["#waveInsightExpand>.forecast-accordion-title","compass"],
  ["#spotInsightExpand>.forecast-accordion-title","spot-dna"],
  [".chile-video-lab .chile-lab-header","video"],
  ["#faroHourlyPreview>small","compass"],
  [".daylight-disclosure>summary>span:first-child","sun"],
  [".faro-guide .faro-match-kicker","match"]
 ];
 // JS Unicode property classes match pictographs from both legacy page code and
 // later generated dynamic tags. Scientific azimuth degrees and arrows inside
 // modelled SVG instruments are deliberately exempt.
 const pictograph=/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu;
 const doodle=/[◎◷〰✎✐⌄↗↘⬆⬇✓☾✕✖✗]/gu;
 function clean(str){
  if(typeof str!=="string"||!str.trim())return str;
  return str.replace(pictograph,"").replace(doodle,"")
   .replace(/[\uFE0F\u200D]/g,"").replace(/[ \t]{2,}/g," ");
 }
 function protectedNode(node){
  const el=node.nodeType===1?node:node.parentElement;
  return !!el?.closest("script,style,svg,canvas,pre,code,textarea,option,template,.leaflet-container,[data-faro-preserve-symbol]");
 }
 function sanitize(rootNode){
  if(!rootNode||rootNode.nodeType===3){
   if(rootNode?.nodeType===3&&!protectedNode(rootNode)){
    const desired=clean(rootNode.nodeValue);
    if(rootNode.nodeValue!==desired)rootNode.nodeValue=desired;
   }
   return;
  }
  if(rootNode.nodeType!==1||protectedNode(rootNode))return;
  if(rootNode.hasAttribute("data-es"))for(const attr of ["data-es","data-en"]){
   if(rootNode.hasAttribute(attr)){
    const prev=rootNode.getAttribute(attr),next=clean(prev);
    if(prev!==next)rootNode.setAttribute(attr,next);
   }
  }
  const walker=document.createTreeWalker(rootNode,NodeFilter.SHOW_TEXT);
  let txt;
  while((txt=walker.nextNode())){
   if(protectedNode(txt))continue;
   const old=txt.nodeValue,next=clean(old);
   if(old!==next)txt.nodeValue=next;
  }
  for(const child of rootNode.querySelectorAll("[data-es]")){
   if(protectedNode(child))continue;
   for(const attr of ["data-es","data-en"]){
    if(!child.hasAttribute(attr))continue;
    const old=child.getAttribute(attr),next=clean(old);
    if(old!==next)child.setAttribute(attr,next);
   }
  }
 }
 function registerSlots(){
  for(const [selector,id]of iconSelectors){
   for(const host of document.querySelectorAll(selector)){
    if(host.querySelector(':scope > .faro-svg-icon'))continue;
    const slot=document.createElement("span");
    slot.className="faro-svg-icon";slot.dataset.faroIcon=id;slot.setAttribute("aria-hidden","true");
    host.prepend(slot);
    activate(slot);
   }
  }
 }
 function activate(slot){
  const filename=approved[slot.dataset.faroIcon];
  if(!filename)return;
  if(!/^[a-z0-9][a-z0-9-]*\.svg$/i.test(filename))return;
  slot.style.setProperty("--faro-icon-url",'url("'+new URL(filename,iconRoot).href+'")');
  slot.classList.add("is-approved");
 }
 let busy=false;
 function update(){
  if(busy)return;busy=true;
  try{sanitize(document.body);registerSlots()}
  finally{busy=false}
 }
 function start(){
  update();let scheduled=false;
  const mo=new MutationObserver(()=>{
   if(scheduled)return;
   scheduled=true;queueMicrotask(()=>{scheduled=false;update()});
  });
  mo.observe(document.body,{childList:true,subtree:true,characterData:true});
  fetch(approvedUrl.toString(),{cache:"force-cache"}).then(r=>r.ok?r.json():null).then(data=>{
   for(const [id,name]of Object.entries(data?.icons||{}))approved[id]=name;
   for(const slot of document.querySelectorAll(".faro-svg-icon"))activate(slot);
  }).catch(()=>{});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
 else start();
 root.FaroIconSystem=Object.freeze({clean});
})(typeof window!=="undefined"?window:globalThis);
