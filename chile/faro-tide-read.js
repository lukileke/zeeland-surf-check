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
  // Preserve the original model-bound DOM, but keep the technical instrument
  // out of the editorial face until a reader explicitly asks for it.
  const technical=node("details","faro-technical-fold");
  technical.id="faroTechnicalEvidence";
  const technicalSummary=node("summary","faro-technical-summary");
  technical.append(technicalSummary,metrics,science);
  back.append(backTitle,reason,vibe,technical);
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
    technicalSummary.textContent=tr("Datos oceánicos y límites del modelo","Ocean data and model limits");
    science.textContent=tr(
      "Modelo experimental: altura oceánica, no de rompiente. Calibración local pendiente.",
      "Experimental model: offshore height, not breaking-wave height. Local calibration pending."
    );
    hourlyTitle.textContent=tr("FARO · TU FRANJA","FARO · YOUR WINDOW");
    scoreKicker.textContent=tr("ÍNDICE DE CONDICIONES","CONDITIONS INDEX");
    hourlyReasonSummary.textContent=tr("¿Por qué?","Why this reading?");
    hourlyToggle.querySelector(".faro-hourly-flip-label").textContent=
      hourlyMode==="read"?tr("Ver datos","See data"):tr("Volver","Back");
    hourlyToggle.setAttribute("aria-expanded",String(hourlyMode!=="read"));
    refreshFacts();
    // Locale changes must refresh labels even if the selected hour is stable.
    if(typeof refreshSelectedRead==="function")refreshSelectedRead();
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
  // The hourly face must not repeat the daily verdict. Give the selected
  // session its own compact model index and short, model-derived cue.
  const scoreFace=node("div","faro-hourly-score-read");
  const scoreKicker=node("small","faro-hourly-score-label");
  const scoreNumber=node("strong","faro-hourly-score-value");
  const scoreUnit=node("span","faro-hourly-score-unit");
  const scoreNote=node("span","faro-hourly-score-note");
  scoreFace.append(scoreKicker,scoreNumber,scoreUnit,scoreNote);
  hourlyFront.append(scoreFace);
  const hourlyReason=node("details","faro-hourly-why");
  const hourlyReasonSummary=node("summary","faro-hourly-why-summary");
  // Preserve FARO's real forecast interpretation as evidence, not a second
  // competing headline in the initial reading.
  hourlyReason.append(hourlyReasonSummary,headline,explain);
  hourlyBack.append(signals,hourlyReason);
  hourlyWindow.append(hourlyFront,hourlyBack);
  const hourlyToggle=node("button","faro-hourly-flip");
  hourlyToggle.type="button";
  hourlyToggle.setAttribute("aria-controls","faroHourlyFront faroHourlyBack");
  hourlyToggle.innerHTML='<span class="faro-hourly-flip-label"></span><span aria-hidden="true">↗</span>';
  meta.append(hourlyToggle);
  meta.after(hourlyWindow);
  // Keep the canonical map action outside the scrolling evidence viewport.
  // This eliminates occluded clicks without duplicating a button or its ID.
  hourly.append(map);
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
  const refreshSelectedRead=()=>{
    const selected=slots.querySelector(":scope > button.selected");
    const score=selected?.querySelector(".chile-slot-score")?.textContent?.trim()||"—";
    const cue=selected?.querySelector(".chile-slot-vibe")?.textContent?.trim()||"";
    const quality=selected?.querySelector(".chile-slot-quality")?.textContent?.trim()||"";
    const band=selected?[...selected.classList].find(c=>c.startsWith("brand-band-")):"";
    scoreFace.className="faro-hourly-score-read"+(band?" "+band:"");
    scoreNumber.textContent=score;
    scoreUnit.textContent=score==="—"?"":"/10";
    scoreNote.textContent=(cue||quality||tr("Modelo experimental","Experimental model"));
  };
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
    refreshSelectedRead();
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
