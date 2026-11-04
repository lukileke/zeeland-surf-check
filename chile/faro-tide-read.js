/* FARO / TWO DEPTHS
 * Decision first, physical evidence on demand. Progressive enhancement:
 * without this file, original forecast content remains visible.
 * Existing IDs are moved, never cloned, so forecast updates remain intact.
 */
(()=>{
  "use strict";
  const $=id=>document.getElementById(id);
  const tr=(es,en)=>document.documentElement.lang?.toLowerCase()==="en"?en:es;
  const read=$("dailyOverview"),brief=$("chileDecisionBrief"),reason=$("chileDecisionDriver"),
    metrics=$("daySignalMetrics"),vibe=read?.querySelector(".chile-vibe"),
    prep=$("faroPrepHints"),uv=$("dayUVBadge"),
    hourly=$("faroHourlyPreview"),slots=$("slots");
  if(!read||!brief||!reason||!metrics||!vibe||!prep||!uv||!hourly||!slots)return;

  const node=(tag,cls)=>{const x=document.createElement(tag);if(cls)x.className=cls;return x};
  const mini=(label,id)=>{
    const item=node("span","faro-brief-fact");
    const key=node("small");key.dataset.faroLabel=label;
    const value=node("strong");value.dataset.faroFrom=id;
    item.append(key,value);
    return item;
  };
  const facts=node("div","faro-brief-facts");
  facts.append(mini("wave","dayWave"),mini("period","dayPeriod"),mini("wind","dayWind"));

  // One physical surface, two readings, no second card below the first.
  const surface=node("section","faro-ocean-surface");
  surface.setAttribute("aria-label","FARO daily decision and supporting conditions");
  const windowBox=node("div","faro-surface-window");
  const front=node("div","faro-surface-face faro-surface-front");
  front.id="faroSurfaceFront";
  const back=node("div","faro-surface-face faro-surface-back");
  back.id="faroSurfaceBack";
  const backTitle=node("div","faro-surface-back-heading");
  backTitle.setAttribute("aria-hidden","true");
  const science=node("p","faro-surface-science");
  front.append(brief,facts);
  back.append(backTitle,metrics,reason,vibe,science);
  windowBox.append(front,back);

  const control=node("div","faro-surface-control");
  const context=node("span","faro-surface-context");
  context.setAttribute("aria-hidden","true");
  const flip=node("button","faro-surface-flip");
  flip.type="button";
  flip.setAttribute("aria-controls","faroSurfaceFront faroSurfaceBack");
  flip.innerHTML='<span class="faro-flip-ripple" aria-hidden="true"></span><span class="faro-flip-label"></span><span class="faro-flip-icon" aria-hidden="true">↗</span>';
  control.append(context,flip);
  surface.append(windowBox,control);
  // The UV advisory always stays OUTSIDE the swapping content.
  read.querySelector(".day-overview-row")?.after(surface);

  let mode="read";
  const switchMode=next=>{
    mode=next;
    surface.dataset.mode=mode;
    const isDetail=mode==="signals";
    for(const [face,isActive]of [[front,!isDetail],[back,isDetail]]){
      face.inert=!isActive;
      face.setAttribute("aria-hidden",String(!isActive));
    }
    flip.setAttribute("aria-expanded",String(isDetail));
    const label=flip.querySelector(".faro-flip-label");
    label.textContent=isDetail?tr("Volver","Back"):tr("Ver señales","See signals");
    flip.querySelector(".faro-flip-icon").textContent=isDetail?"↶":"↗";
    context.textContent=isDetail?tr("FARO · SEÑALES","FARO · SIGNALS"):tr("FARO · LECTURA","FARO · READ");
  };
  flip.addEventListener("click",()=>switchMode(mode==="read"?"signals":"read"));

  // Render-friendly, short evidence strip from the *same* model DOM fields.
  const refreshFacts=()=>{
    const labels={
      wave:tr("OLAS","SWELL"),period:tr("PERÍODO","PERIOD"),wind:tr("VIENTO","WIND")
    };
    for(const fact of facts.children){
      const label=fact.querySelector("small"),value=fact.querySelector("strong");
      label.textContent=labels[label.dataset.faroLabel]||"";
      value.textContent=$(value.dataset.faroFrom)?.textContent?.trim()||"—";
    }
  };
  const localise=()=>{
    backTitle.textContent=tr("¿Qué está leyendo FARO?","What is FARO reading?");
    science.textContent=tr(
      "Modelo experimental: altura oceánica, no de rompiente. Calibración local pendiente.",
      "Experimental model: offshore height, not breaking-wave height. Local calibration pending."
    );
    hourlyTitle.textContent=tr("FARO · TU FRANJA","FARO · YOUR WINDOW");
    hourlyToggle.querySelector(".faro-hourly-flip-label").textContent=
      hourlyMode==="read"?tr("Ver datos","See data"):tr("Volver","Back");
    hourlyToggle.setAttribute("aria-expanded",String(hourlyMode!=="read"));
    refreshFacts();
    switchMode(mode);
    slots.setAttribute("aria-label",tr("Comparar ventanas de dos horas","Compare two-hour forecast windows"));
  };

  // Hourly detail also changes IN PLACE. Avoid a second explanation card.
  const meta=hourly.querySelector(".faro-hourly-read-meta");
  const headline=$("faroHourlyHeadline"),explain=$("faroHourlyExplanation"),
    signals=$("faroHourlySignals"),map=$("faroHourlyGoLens");
  if(!meta||!headline||!explain||!signals||!map)return;
  const hourlyWindow=node("div","faro-hourly-window");
  const hourlyFront=node("div","faro-hourly-face faro-hourly-front");
  hourlyFront.id="faroHourlyFront";
  const hourlyBack=node("div","faro-hourly-face faro-hourly-back");
  hourlyBack.id="faroHourlyBack";
  const hourlyTitle=meta.querySelector("small");
  hourlyFront.append(headline);
  hourlyBack.append(signals,explain,map);
  hourlyWindow.append(hourlyFront,hourlyBack);
  const hourlyToggle=node("button","faro-hourly-flip");
  hourlyToggle.type="button";
  hourlyToggle.setAttribute("aria-controls","faroHourlyFront faroHourlyBack");
  hourlyToggle.innerHTML='<span class="faro-hourly-flip-label"></span><span aria-hidden="true">↗</span>';
  meta.append(hourlyToggle);
  meta.after(hourlyWindow);
  hourly.classList.add("faro-hourly-in-place");
  let hourlyMode="read";
  const updateHourly=()=>{
    hourly.dataset.mode=hourlyMode;
    for(const [face,active]of [[hourlyFront,hourlyMode==="read"],[hourlyBack,hourlyMode==="signals"]]){
      face.inert=!active;
      face.setAttribute("aria-hidden",String(!active));
    }
    hourlyToggle.querySelector(".faro-hourly-flip-label").textContent=
      hourlyMode==="read"?tr("Ver datos","See data"):tr("Volver","Back");
    hourlyToggle.setAttribute("aria-expanded",String(hourlyMode==="signals"));
  };
  hourlyToggle.addEventListener("click",()=>{
    hourlyMode=hourlyMode==="read"?"signals":"read";updateHourly();
  });

  // Existing controller regenerates button nodes on every hour selection.
  // Keep every safety/unavailable message in the accessibility label;
  // show visible small print only for warnings and missing daylight/data.
  const decorateSlots=()=>{
    for(const button of slots.querySelectorAll(":scope > button")){
      const time=button.querySelector(".chile-slot-hour")?.textContent?.trim()||"";
      const score=button.querySelector(".chile-slot-score")?.textContent?.trim()||"—";
      const quality=button.querySelector(".chile-slot-quality")?.textContent?.trim()||"";
      const note=button.querySelector(".chile-slot-vibe")?.textContent?.trim()||"";
      const urgent=/riesgo|risk|precau|caution|restric|danger|sin luz|no daylight|sin score|no score/i.test(note);
      button.classList.toggle("faro-slot-warning",urgent);
      button.classList.add("faro-slot-compact");
      button.setAttribute("aria-label",[time,score==="—"?tr("Sin índice","No index"):score+"/10",quality,note].filter(Boolean).join(" · "));
    }
  };
  const slotWatcher=new MutationObserver(decorateSlots);
  slotWatcher.observe(slots,{childList:true});
  decorateSlots();
  const valueWatcher=new MutationObserver(refreshFacts);
  for(const id of ["dayWave","dayPeriod","dayWind"]){
    const value=$(id);
    if(value)valueWatcher.observe(value,{childList:true,characterData:true,subtree:true});
  }
  new MutationObserver(localise).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});

  // The front state should be meaningful even when no forecast is loaded.
  switchMode("read");updateHourly();localise();
})();
