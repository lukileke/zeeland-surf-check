/* FARO Tide Read — progressive enhancement for Chile forecast.
   Preserve original DOM IDs and data bindings; never move risk/UV notices.
   The forecast stays fully visible if this script fails to load. */
(()=>{
 "use strict";
 const $=id=>document.getElementById(id);
 const lang=()=>document.documentElement.lang?.toLowerCase().startsWith("en")?"en":"es";
 const tr=(es,en)=>lang()==="en"?en:es;
 const read=$("dailyOverview"),metrics=$("daySignalMetrics"),vibe=read?.querySelector(".chile-vibe");
 const preview=$("faroHourlyPreview");
 if(!read||!metrics||!vibe||!preview)return;
 const details=document.createElement("details");
 details.id="faroTideRead";details.className="faro-tide-read";
 const summary=document.createElement("summary");
 summary.setAttribute("aria-controls","faroTideReadBody");
 const copy=document.createElement("span");copy.className="faro-tide-summary-copy";
 const eyebrow=document.createElement("span");eyebrow.className="faro-tide-eyebrow";
 const title=document.createElement("strong");title.className="faro-tide-title";
 copy.append(eyebrow,title);
 const right=document.createElement("span");right.className="faro-tide-right";
 const action=document.createElement("span");
 const chevron=document.createElement("span");chevron.className="faro-tide-chevron";
 chevron.setAttribute("aria-hidden","true");chevron.textContent="⌄";
 right.append(action,chevron);summary.append(copy,right);
 const body=document.createElement("div");body.id="faroTideReadBody";body.className="faro-tide-body";
 const science=document.createElement("p");science.className="faro-tide-science";
 science.setAttribute("role","note");
 metrics.before(details);body.append(metrics,vibe,science);details.append(summary,body);
 const meta=preview.querySelector(".faro-hourly-read-meta");
 const toggle=document.createElement("button");toggle.type="button";
 toggle.className="faro-tide-hourly-toggle";toggle.setAttribute("aria-controls","faroHourlySignals faroHourlyExplanation");
 preview.classList.add("faro-tide-hourly");
 meta?.append(toggle);
 let expanded=false;
 const localise=()=>{
   eyebrow.textContent=tr("BAJO LA SUPERFICIE","BENEATH THE SURFACE");
   title.textContent=tr("Oleaje, viento y carácter de la ola","Swell, wind and wave character");
   action.textContent=details.open?tr("Ocultar datos","Hide details"):tr("Ver datos","Explore data");
   toggle.textContent=expanded?tr("Menos detalle −","Less detail −"):tr("Ver condiciones +","Explore conditions +");
   const height=$("dayWave")?.textContent?.trim()||"—";
   science.textContent=tr(
     "El índice FARO refleja un ajuste estimado de las condiciones, no el tamaño de la ola. "+height+" corresponde a altura oceánica modelada; la altura rompiente depende de la batimetría, dirección, bancos de arena y marea. Modelo experimental sin calibración local.",
     "FARO's index represents estimated conditions, not breaking-wave size. "+height+" is modelled offshore wave height; breaking waves depend on bathymetry, direction, sandbanks and tide. Experimental model without local calibration."
   );
 };
 const update=()=>{preview.classList.toggle("faro-tide-hourly-expanded",expanded);toggle.setAttribute("aria-expanded",String(expanded));localise()};
 details.addEventListener("toggle",localise);
 toggle.addEventListener("click",()=>{expanded=!expanded;update()});
 // Language toggling in Chile is synchronous; update after its handler.
 $("languageToggle")?.addEventListener("click",()=>queueMicrotask(localise));
 const wave=$("dayWave");
 if(wave)new MutationObserver(localise).observe(wave,{characterData:true,childList:true,subtree:true});
 update();
})();
