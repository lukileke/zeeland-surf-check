/* FARO Official Watch · browser view of periodic official portal checks.
   A reachable website is not proof of absence/presence of a valid alert. */
(function(){
 "use strict";
 const ROOT="https://raw.githubusercontent.com/lukileke/zeeland-surf-check/faro-research-data/research-data/chile/official-watch.json";
 const $=id=>document.getElementById(id);
 const render=(data)=>{
  const es=document.documentElement.lang!=="en",wrap=$("faroOfficialWatch");
  const ageMs=data?.checkedAt?Date.now()-new Date(data.checkedAt).getTime():Infinity;
  const valid=data?.schema===1&&data.region==="CL-VS"&&data.coverage==="partial"&&
   data.clearanceVerified===false&&Array.isArray(data.sources)&&
   Number.isFinite(ageMs)&&ageMs>=-600000&&ageMs<3*3600*1000;
  const count=valid?data.sources.filter(s=>s.reachable===true).length:0;
  wrap.dataset.state=valid&&count>0?"checked":"unverified";
  const headline=valid&&count>0?
   es?"Fuentes oficiales consultadas":"Official portals checked":
   es?"Vigencia oficial sin confirmar":"Official status unverified";
  $("faroOfficialHeading").textContent=headline;
  $("faroOfficialChecked").textContent=valid&&count>0?
   (es?count+" de "+data.sources.length+" portales accesibles · ":""+count+" of "+data.sources.length+" portals reachable · ")+
   new Intl.DateTimeFormat(es?"es-CL":"en-GB",{hour:"2-digit",minute:"2-digit",timeZone:"America/Santiago"}).format(new Date(data.checkedAt))+" CL · "+
   (es?"no certifica alertas":"not an alert clearance"):
   es?"Sin revisión completa reciente · consulta la autoridad":"No recent complete check · consult authorities";
  const state=$("chileOfficialSources")?.querySelector(".chile-official-state");
  if(state)state.textContent=valid&&count?
   (es?"Monitoreo parcial":"Partial monitoring"):
   (es?"Vigencia no confirmada":"Status unverified");
  const list=$("faroOfficialSourceHealth");if(!list)return;
  list.replaceChildren();
  list.dataset.loaded=String(valid);
  if(!valid)return; // Static authority links remain available as fallback.
  const entries=data.sources;
  for(const src of entries){
   const a=document.createElement("a");
   if(!/^https:\/\//.test(src.url))continue;
   a.href=src.url;a.target="_blank";a.rel="noopener noreferrer";
   const sign=document.createElement("span");
   sign.textContent=valid?(src.reachable?"◉":"○"):"○";
   sign.setAttribute("aria-hidden","true");
   const name=document.createElement("strong");name.textContent=src.name;
   const note=document.createElement("small");
   note.textContent=valid&&src.reachable?
    (es?"Portal accesible":"Portal accessible"):(es?"Sin confirmación":"Unverified");
   a.append(sign,name,note);list.append(a);
  }
 };
 const refresh=async()=>{
  try{
   const r=await fetch(ROOT+"?t="+Math.floor(Date.now()/1200000),{cache:"no-store"});
   if(!r.ok)throw Error("Monitor "+r.status);
   render(await r.json());
  }catch(e){render(null);}
 };
 $("faroOfficialWatch")?.querySelector(".faro-watch-link")?.addEventListener("click",e=>{
  const d=$("chileOfficialSources");if(!d)return;
  e.preventDefault();d.open=true;d.scrollIntoView({block:"center",behavior:"smooth"});
 });
 $("languageToggle")?.addEventListener("click",()=>setTimeout(refresh,50));
 refresh();
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});
})();
