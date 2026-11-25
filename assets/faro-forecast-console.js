/* FARO shared forecast console. One renderer, regional data adapters only.
   Shadow DOM isolates this component from legacy !important declarations. */
(function(root){
"use strict";
const valid=Number.isFinite;
const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
const css=`
:host{display:block;min-inline-size:0;max-inline-size:100%;container-type:inline-size;container-name:faro;--gap:clamp(.65rem,1.5cqi,1.25rem);--space:clamp(1rem,2.5cqi,2.5rem);--ink:#edf6f4;--muted:#b1c9c9;--line:#45646a;--accent:#a0d6cf;--shell:var(--bg,#10191d);--outer-ink:var(--fg,#eef6f4);--outer-muted:var(--faro-quiet,#a8bec0);font-family:Manrope,system-ui,sans-serif;color:var(--outer-ink);font-size:1rem;line-height:1.45}
*,*::before,*::after{box-sizing:border-box}
button,select,a{font:inherit}
button,select{min-inline-size:0;border:1px solid var(--line);border-radius:.65rem;color:inherit;background:transparent;padding:.65em;cursor:pointer}
button:disabled{cursor:default;opacity:.55}
button:focus-visible,select:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
a{color:inherit}
.layout{display:grid;gap:var(--gap)}
.context{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr));gap:var(--gap);align-items:end}
.context label{display:grid;gap:.35rem;min-inline-size:0}
.kicker{display:block;font-size:.72rem;line-height:1.4;font-weight:750;letter-spacing:.11em;text-transform:uppercase;color:var(--outer-muted)}
.context select{inline-size:100%;background:var(--shell);color:var(--outer-ink);border-color:var(--border,var(--line));min-block-size:2.8rem}
.countries{display:flex;gap:.5rem;flex-wrap:wrap}
.countries a{flex:1 1 5.5rem;display:block;text-align:center;text-decoration:none;padding:.6em;border:1px solid var(--border,var(--line));border-radius:.65rem;font-weight:750;font-size:.88rem}
.countries a[aria-current]{border-color:var(--faro-selection,#8acdc8);background:color-mix(in srgb,var(--faro-selection,#8acdc8) 10%,transparent)}
.update{display:flex;align-items:center;gap:.5rem;justify-content:space-between;color:var(--outer-muted);font-size:.78rem;flex-wrap:wrap}
.update button{padding:.4em .75em;min-block-size:2.25rem;color:var(--outer-ink)}
.week{display:grid;gap:.55rem}
.days,.hours{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,6.5rem),1fr));gap:clamp(.4rem,.85cqi,.8rem);min-inline-size:0}
.days button,.hours button{display:grid;gap:.2rem;text-align:start;align-content:start;min-inline-size:0;min-block-size:4.8rem;font-size:.8rem;background:var(--tile,#243239);border-color:var(--border,var(--line));padding:clamp(.5rem,1.05cqi,.85rem);overflow-wrap:anywhere}
.days button[aria-pressed="true"],.hours button[aria-pressed="true"]{border-color:var(--faro-selection,#a0d6cf);box-shadow:inset 0 0 0 1px var(--faro-selection,#a0d6cf)}
.days strong,.hours strong{font-size:clamp(1.15rem,1rem + 1cqi,1.7rem);font-variant-numeric:tabular-nums;line-height:1.1;color:var(--score,currentColor)}
.days small,.hours small{font-size:.72rem;color:var(--outer-muted);line-height:1.35}
.hero{position:relative;isolation:isolate;overflow:hidden;display:grid;gap:var(--gap);padding:var(--space);border:1px solid #46686e;border-radius:clamp(.8rem,1.7cqi,1.4rem);background:radial-gradient(ellipse at 84% 4%,#27565a 0%,transparent 52%),linear-gradient(125deg,#153d45,#0b2934);color:var(--ink)}
.hero .kicker,.hero small{color:var(--muted)}
.hero-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space);align-items:start}
.hero-grid>*{min-inline-size:0}
.read{display:grid;gap:.65rem;align-content:start}
h2,p{margin:0}
h2{font-family:"Archivo Black",Manrope,system-ui,sans-serif;font-weight:800;letter-spacing:-.035em;line-height:1.14;font-size:clamp(1.55rem,1.2rem + 2.3cqi,3rem);max-inline-size:27ch;overflow-wrap:anywhere}
.deck{font-size:clamp(.88rem,.8rem + .3cqi,1.08rem);color:var(--muted);max-inline-size:60ch;overflow-wrap:anywhere}
.location{font-size:.83rem;color:var(--accent);font-weight:700;overflow-wrap:anywhere}
.signal{display:grid;gap:.6rem;align-content:start;min-inline-size:0}
.scoreline{display:flex;align-items:baseline;gap:.45rem;flex-wrap:wrap}
.scoreline strong{font-size:clamp(2.5rem,1.8rem + 3cqi,4.4rem);font-weight:800;line-height:1;font-variant-numeric:tabular-nums;color:var(--score,#edf6f4)}
.scoreline small{font-size:.85rem}
.window{font-size:clamp(1.15rem,1rem + .9cqi,1.65rem);font-weight:750;letter-spacing:-.025em}
.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,5rem),1fr));gap:.55rem;border-top:1px solid var(--line);padding-top:.65rem}
.metrics div{min-inline-size:0;display:grid;gap:.2rem}
.metrics small{font-size:.67rem;line-height:1.3}
.metrics b{font-size:clamp(.95rem,.85rem + .6cqi,1.35rem);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.metrics div:first-child b{color:#8acde1}
.hours{grid-template-columns:repeat(auto-fit,minmax(min(100%,5.6rem),1fr))}
.hours button{background:#173d46;border-color:var(--line);color:var(--ink);min-block-size:4.5rem}
.hours small{color:var(--muted)}
.hours button[aria-pressed="true"]{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}
.hours-head{border-top:1px solid var(--line);padding-top:.85rem;display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:.3rem}
.disclaimer{font-size:.72rem;color:var(--muted);max-inline-size:80ch;overflow-wrap:anywhere}
.actions{display:flex;gap:.5rem;flex-wrap:wrap}
.actions button{color:var(--ink);min-block-size:2.6rem;padding:.55em .9em;border-color:var(--line);font-size:.82rem;font-weight:700}
.actions button:first-child{background:#d9ebe6;color:#12383d;border-color:#d9ebe6}
.beacon{position:absolute;z-index:-1;inset-block-start:0;inset-inline-end:1%;inline-size:clamp(5rem,17cqi,13rem);aspect-ratio:1;display:grid;place-items:center;pointer-events:none;opacity:.55}
.beacon::before{content:"";position:absolute;inset:-35%;background:radial-gradient(circle,#edbf6a40,transparent 64%);animation:breathe 5.4s ease-in-out infinite}
.beacon svg{inline-size:38%;block-size:auto;fill:#d0f0e5;animation:float 5.4s ease-in-out infinite}
.beacon .faro-beacon-core{fill:#efc477}
@keyframes breathe{0%,100%{opacity:.55;scale:.96}50%{opacity:1;scale:1.07}}
@keyframes float{0%,100%{translate:0 0}50%{translate:0 -.3rem}}
@container faro (min-width:44rem){.hero-grid{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)}}
@container faro (min-width:52rem){.days{grid-template-columns:repeat(7,minmax(0,1fr))}}
@container faro (min-width:58rem){.hours{grid-template-columns:repeat(8,minmax(0,1fr))}}
@container faro (max-width:29rem){.days{grid-template-columns:repeat(7,minmax(5.6rem,1fr));overflow-x:auto;scroll-snap-type:inline proximity;padding-block:.15rem .35rem}.days button{scroll-snap-align:start}.hours{grid-template-columns:repeat(auto-fit,minmax(min(100%,4.8rem),1fr))}}
@media(prefers-reduced-motion:reduce){.beacon::before,.beacon svg{animation:none}}
`;
const shades=["var(--faro-score-0,#ef9b77)","var(--faro-score-1,#efbd6e)","var(--faro-score-2,#e0cc73)","var(--faro-score-3,#b1d574)","var(--faro-score-4,#8cc584)"];
const score=(n,lang)=>valid(n)?new Intl.NumberFormat(lang==="es"?"es-CL":"en-GB",{minimumFractionDigits:1,maximumFractionDigits:1}).format(n):"—";
const tint=(e,n)=>{if(valid(n))e.style.setProperty("--score",shades[Math.max(0,Math.min(4,Math.floor(n/2)))]);return e};
function mount({before,retire=[],getData,onSpot,onDay,onHour,onRefresh,onDetails,onMatch,beacon,regionLinks}){
 if(!before?.parentNode||!before.attachShadow&&typeof HTMLElement==="undefined")return null;
 const host=make("div","faro-shared-console");host.id="faroSharedConsole";host.style.setProperty("display","block","important");host.style.setProperty("grid-column","1/-1","important");
 const shadow=host.attachShadow({mode:"open"}),style=make("style",null,css),layout=make("section","layout");shadow.append(style,layout);
 before.parentNode.insertBefore(host,before);
 let last="",retired=false;
 function update(){
  const d=getData();if(!d)return;const key=JSON.stringify(d);if(key===last)return;last=key;
  const lang=d.lang==="es"?"es":"en",t=(es,en)=>lang==="es"?es:en;
  const focus=shadow.activeElement?.dataset?.key,previousScroll=layout.querySelector(".days")?.scrollLeft||0;
  const control=(text,fn,k)=>{const b=make("button",null,text);b.type="button";b.dataset.key=k;b.addEventListener("click",fn);return b};
  layout.lang=lang;layout.setAttribute("aria-label",t("Pronóstico FARO","FARO forecast"));
  const context=make("div","context"),coast=make("div"),countries=make("nav","countries");coast.append(make("span","kicker",t("Costa","Coast")),countries);
  for(const item of regionLinks){const a=make("a",null,item.label);a.href=item.href;if(item.current)a.setAttribute("aria-current","page");countries.append(a)}
  const label=make("label"),select=make("select");select.dataset.key="spot";label.append(make("span","kicker",t("Playa / spot","Beach / spot")),select);
  for(const p of d.spots||[]){const o=make("option",null,p.label);o.value=p.id;select.append(o)}select.value=d.spotId||"";select.disabled=!select.options.length;select.addEventListener("change",()=>onSpot(select.value));context.append(coast,label);
  const updated=make("div","update"),status=make("span",null,d.updated||t("Consultando el modelo…","Loading model…"));status.setAttribute("role","status");updated.append(status,control(t("Actualizar","Refresh"),onRefresh,"refresh"));
  const week=make("section","week"),days=make("div","days");week.append(make("span","kicker",t("Próximos 7 días","Next 7 days")),days);
  const addTile=(parent,item,fn,prefix)=>{const b=control("",()=>fn(item.id),prefix+item.id);b.setAttribute("aria-pressed",String(!!item.selected));b.disabled=!!item.disabled;b.append(make("span",null,item.label),tint(make("strong",null,score(item.score,lang)),item.score),make("small",null,item.note||"—"));parent.append(b)};
  for(const item of d.days||[])addTile(days,item,onDay,"day");
  const hero=make("section","hero"),grid=make("div","hero-grid"),read=make("div","read"),signal=make("div","signal");
  if(beacon){const glow=make("div","beacon");glow.setAttribute("aria-hidden","true");const svg=beacon.cloneNode(true);svg.removeAttribute("class");glow.append(svg);hero.append(glow)}
  read.append(make("span","kicker",t("FARO · Lee el mar","FARO · Read the ocean")),make("span","location",d.location||"—"),make("h2",null,d.headline||t("Leyendo tu costa…","Reading your coast…")),make("p","deck",d.deck||""));
  const actions=make("div","actions");actions.append(control(t("Ver análisis","See analysis"),onDetails,"details"),control("FARO Match",onMatch,"match"));read.append(actions);
  const scoreline=make("div","scoreline");scoreline.append(tint(make("strong",null,score(d.score,lang)),d.score),make("small",null,valid(d.score)?"/10":""));
  if(d.grade)scoreline.append(make("small",null,d.grade));
  signal.append(make("span","kicker",d.scoreLabel||t("Índice del modelo","Model index")),scoreline,make("span","kicker",d.windowLabel||t("Franja","Window")),make("div","window",d.window||"—"));
  const metrics=make("div","metrics");for(const m of [[t("Altura oceánica","Offshore height"),d.wave],[t("Período","Period"),d.period],[t("Viento","Wind"),d.wind]]){const x=make("div");x.append(make("small",null,m[0]),make("b",null,m[1]||"—"));metrics.append(x)}signal.append(metrics);grid.append(read,signal);hero.append(grid);
  const hourHead=make("div","hours-head"),hours=make("div","hours");hourHead.append(make("span","kicker",t("Franjas de 2 horas","Two-hour windows")),make("small",null,d.hourDate||""));hero.append(hourHead,hours);
  for(const item of d.hours||[])addTile(hours,item,onHour,"hour");
  hero.append(make("p","disclaimer",d.disclaimer||t("Modelo orientativo. No es una medición de la rompiente ni una garantía de seguridad.","Model guidance, not a breaking-wave measurement or safety clearance.")));
  layout.replaceChildren(context,updated,week,hero);days.scrollLeft=previousScroll;
  if(focus){const next=[...shadow.querySelectorAll("[data-key]")].find(x=>x.dataset.key===focus);next?.focus({preventScroll:true})}
  if(!retired){for(const node of retire.filter(Boolean)){node.setAttribute("data-faro-ui-retired","");node.setAttribute("inert","");node.setAttribute("aria-hidden","true")}retired=true;document.documentElement.setAttribute("data-faro-shared","")}
 }
 try{update()}catch(e){host.remove();throw e}
 return {update,host};
}
root.FaroForecastConsole=Object.freeze({mount});
})(window);
