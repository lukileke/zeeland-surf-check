/* FARO shared forecast console. One renderer, regional data adapters only.
   Shadow DOM isolates this component from legacy !important declarations. */
(function(root){
"use strict";
const valid=Number.isFinite;
const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
const css=`
:host{display:block;min-inline-size:0;max-inline-size:100%;container-type:inline-size;container-name:faro;--gap:clamp(.65rem,1.25cqi,1rem);--space:clamp(1rem,2.3cqi,2.15rem);--ink:#edf7f2;--muted:#b5cec9;--line:rgba(183,227,217,.19);--accent:#c1e5d8;--shell:var(--bg,#10191d);--outer-ink:var(--fg,#eef6f4);--outer-muted:var(--faro-quiet,#a8bec0);--selection:var(--faro-selection,#8acdc8);font-family:Manrope,system-ui,sans-serif;color:var(--outer-ink);font-size:1rem;line-height:1.45}
*,*::before,*::after{box-sizing:border-box}
button,select,a{font:inherit}
button,select{min-inline-size:0;border:1px solid var(--line);border-radius:.6rem;color:inherit;background:transparent;padding:.65em;cursor:pointer}
button:disabled{cursor:default;opacity:.55}
button:focus-visible,select:focus-visible,a:focus-visible{outline:2px solid #f0dc9d;outline-offset:-3px}
a{color:inherit}
.layout{display:grid;gap:var(--gap);min-inline-size:0}
.context{display:grid;grid-template-columns:minmax(0,1fr);gap:.7rem;align-items:end;min-inline-size:0;padding:clamp(.8rem,1.4cqi,1.15rem);border:1px solid var(--border,#42565a);border-radius:.85rem;background:var(--panel,var(--shell))}
.context label,.coast{display:grid;gap:.3rem;min-inline-size:0}.context .coast{align-items:center}
.kicker{display:block;font-size:.69rem;line-height:1.4;font-weight:800;letter-spacing:.105em;text-transform:uppercase;color:var(--outer-muted)}
.context select{inline-size:100%;background:var(--tile,var(--shell));color:var(--outer-ink);border-color:var(--border,#42565a);min-block-size:2.75rem;padding-inline:.8rem;font-weight:650;font-size:.9rem;text-overflow:ellipsis}
.countries{display:flex;gap:.2rem;flex-wrap:wrap;background:var(--tile,var(--shell));border:1px solid var(--border,#42565a);border-radius:.65rem;padding:.2rem;min-block-size:2.75rem;align-items:stretch}
.countries a{flex:1 1 4rem;display:grid;place-items:center;text-align:center;text-decoration:none;padding:.35rem .5rem;border:1px solid transparent;border-radius:.45rem;font-weight:800;font-size:.8rem;min-inline-size:0}
.countries a[aria-current]{border-color:var(--selection);background:color-mix(in srgb,var(--selection) 13%,var(--tile,var(--shell)))}
.update{display:flex;align-items:center;gap:.6rem;justify-content:space-between;color:var(--outer-muted);font-size:.72rem;min-inline-size:0}
.update span{overflow-wrap:anywhere;line-height:1.35}
.update button{padding:.6em .85em;min-block-size:2.75rem;color:var(--outer-ink);border-color:var(--border,#42565a);font-size:.82rem;font-weight:750;white-space:nowrap;flex:none}
.week{display:grid;gap:.45rem;min-inline-size:0}
.week-head{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:.3rem}
.week-head small{font-size:.72rem;color:var(--outer-muted)}.week-tools{display:flex;align-items:center;gap:.35rem}.week-tools button{min-inline-size:2.75rem;min-block-size:2.75rem;padding:.2rem;border-color:var(--border,#42565a);font-size:1.1rem;line-height:1}.week-tools button:disabled{opacity:.35}.week-tools[hidden]{display:none}.week-tools output{font-size:.72rem;color:var(--outer-muted);font-variant-numeric:tabular-nums}
.days,.hours{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,5.6rem),1fr));min-inline-size:0}
.days{grid-template-columns:repeat(7,minmax(6.8rem,1fr));overflow-x:auto;scroll-snap-type:inline proximity;scrollbar-width:thin;scrollbar-color:#577c7d #19363a;background:linear-gradient(120deg,#1c4147,#173238);color:var(--ink);border:1px solid #42636a;border-radius:.85rem;padding:.24rem;gap:0}
.days button,.hours button{position:relative;display:grid;gap:.25rem;text-align:start;align-content:start;min-inline-size:0;border:0;border-radius:.45rem;min-block-size:4.8rem;font-size:.8rem;padding:clamp(.55rem,1.05cqi,.9rem);overflow-wrap:anywhere;background:transparent;transition:background-color .18s ease}
.days button{scroll-snap-align:start;padding-block-start:.85rem}
.days button+button::before,.hours button+button::before{content:"";position:absolute;inset-inline-start:0;inset-block:16%;inline-size:1px;background:var(--line);pointer-events:none}
.days button[data-scored]::after{content:"";position:absolute;inset-inline-start:.65rem;inset-block-start:.27rem;inline-size:calc((100% - 1.3rem)*var(--quality,0));block-size:2px;border-radius:2px;background:var(--score);pointer-events:none}
.days button[aria-pressed="true"],.hours button[aria-pressed="true"]{background:rgba(178,227,215,.12);box-shadow:inset 0 -2px 0 var(--accent)}
.days button[aria-pressed="true"]::before,.hours button[aria-pressed="true"]::before{display:none}
.days strong,.hours strong{font-size:clamp(1.15rem,1rem + .85cqi,1.65rem);font-variant-numeric:tabular-nums;line-height:1.08;letter-spacing:-.045em;color:var(--score,var(--ink));font-weight:800}
.tile-label{font-weight:750;line-height:1.3;font-size:.77rem;color:var(--ink)}
.tile-grade{font-size:.66rem;color:var(--score,var(--muted));line-height:1.25;font-weight:650}
.days small,.hours small{font-size:.7rem;color:var(--muted);line-height:1.35}
.hero{position:relative;isolation:isolate;overflow:hidden;display:grid;gap:var(--gap);padding:var(--space);border:1px solid #43696e;border-radius:clamp(.9rem,1.7cqi,1.35rem);background:radial-gradient(ellipse at 82% 0%,rgba(70,135,133,.31),transparent 57%),radial-gradient(ellipse at 6% 100%,rgba(31,92,100,.25),transparent 65%),linear-gradient(145deg,#194148 0%,#0d303a 47%,#081e29 100%);color:var(--ink);min-inline-size:0}
.hero .kicker,.hero small{color:var(--muted)}
.hero-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--gap);align-items:start}
.hero-grid>*{min-inline-size:0}
.read{display:grid;gap:.55rem;align-content:start;position:relative}
h2,p{margin:0}
h2{font-family:var(--faro-display,Manrope,system-ui,sans-serif);font-weight:800;letter-spacing:-.045em;line-height:1.12;font-size:clamp(1.55rem,1.18rem + 2.1cqi,2.85rem);max-inline-size:23ch;overflow-wrap:anywhere;text-wrap:balance}
.deck{font-size:clamp(.87rem,.81rem + .24cqi,1.04rem);color:var(--muted);max-inline-size:52ch;overflow-wrap:anywhere}
.location{font-size:.8rem;color:var(--accent);font-weight:700;overflow-wrap:anywhere}
.signal{display:grid;gap:.45rem;align-content:start;min-inline-size:0;padding:clamp(.75rem,1.25cqi,1.1rem);border:1px solid var(--line);border-radius:.8rem;background:linear-gradient(145deg,rgba(8,35,43,.32),rgba(12,42,49,.56));position:relative}
.scoreline{display:flex;align-items:baseline;gap:.4rem;flex-wrap:wrap}
.scoreline strong{font-size:clamp(2.6rem,1.85rem + 3cqi,4.2rem);font-weight:800;line-height:.98;letter-spacing:-.065em;font-variant-numeric:tabular-nums;color:var(--score,var(--ink))}
.scoreline small{font-size:.8rem}.scoreline .grade{font-weight:700;color:var(--score,var(--muted))}
.window{font-size:clamp(1.15rem,1rem + .7cqi,1.6rem);font-weight:800;letter-spacing:-.025em;font-variant-numeric:tabular-nums}
.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,4.7rem),1fr));gap:.45rem;border-top:1px solid var(--line);padding-top:.65rem}
.metrics div{min-inline-size:0;display:grid;gap:.2rem}
.metrics small{font-size:.66rem;line-height:1.3}.metrics b{font-size:clamp(.95rem,.85rem + .5cqi,1.3rem);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.metrics div:first-child b{color:#8acde1}
.hours{grid-template-columns:repeat(auto-fit,minmax(min(100%,5.6rem),1fr));background:rgba(24,59,65,.76);border:1px solid var(--line);border-radius:.7rem;gap:0;padding:.2rem}
.hours button{color:var(--ink);min-block-size:4.25rem;padding-block:.6rem}
.hours-head{border-top:1px solid var(--line);padding-top:.75rem;display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:.3rem}
.hero-footer{display:flex;align-items:center;justify-content:space-between;gap:.6rem;flex-wrap:wrap}
.disclaimer{font-size:.7rem;color:var(--muted);max-inline-size:75ch;overflow-wrap:anywhere;flex:1 1 15rem}
.actions{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin-block-start:.25rem}
.actions button{color:var(--ink);min-block-size:2.5rem;padding:.5em .75em;border-color:var(--line);font-size:.78rem;font-weight:750}
.actions button:first-child{background:#d9ebe6;color:#12383d;border-color:#d9ebe6}.prep{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,6rem),1fr));gap:.4rem;padding-block:.4rem;border-top:1px solid var(--line)}.prep:empty{display:none}.prep div{display:grid;gap:.1rem;min-inline-size:0}.prep small{font-size:.67rem;color:var(--muted)}.prep b{font-size:.9rem;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.session-primary{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,7.5rem),1fr));align-items:end;gap:.4rem .75rem}.session-primary>div{min-inline-size:0;display:grid;gap:.2rem}.hours button:disabled{opacity:.7}.hours button:disabled strong{color:var(--muted)}
/* The original four-arc O, with independent water, halo, core and beam.
   All layers use a single 5.4s phase. The SVG itself has no shadow filter. */
.beacon{position:absolute;z-index:1;inset-block-start:0;inset-inline-end:0;inline-size:clamp(7rem,23cqi,17rem);aspect-ratio:1;display:grid;place-items:center;pointer-events:none;overflow:clip}
.beacon::before,.beacon::after,.beacon .pulse,.beacon .beam{content:"";position:absolute;inset:0;pointer-events:none}
.beacon::before{background:radial-gradient(ellipse,rgba(111,193,181,.25),transparent 70%);animation:water 5.4s ease-in-out infinite}
.beacon::after{background:radial-gradient(circle,rgba(255,211,111,.36),rgba(110,204,182,.12) 32%,transparent 63%);animation:halo 5.4s ease-in-out infinite}
.beacon .pulse{inset:22%;background:radial-gradient(circle,rgba(255,216,122,.75),rgba(255,200,93,.22) 32%,transparent 65%);filter:blur(.4rem);animation:core 5.4s ease-in-out infinite}
.beacon .beam{background:radial-gradient(ellipse at 58% 45%,rgba(173,232,206,.28),transparent 62%);animation:beam 5.4s ease-in-out infinite}
.read>*,.signal>*{position:relative;z-index:2}
.beacon svg{position:relative;z-index:1;inline-size:37%;block-size:auto;fill:#d4ece5;opacity:.92;animation:mark 5.4s ease-in-out infinite}
.beacon .faro-beacon-core{fill:#ffda71}.beacon .faro-beacon-ring{fill:#d4ece5}
@keyframes water{0%,100%{opacity:.6;scale:.98}50%{opacity:.85;scale:1.03}}
@keyframes halo{0%,100%{opacity:.61;scale:.97}50%{opacity:.96;scale:1.055}}
@keyframes core{0%,100%{opacity:.42;scale:.945}50%{opacity:1;scale:1.08}}
@keyframes beam{0%,100%{opacity:.45;scale:.975}50%{opacity:.85;scale:1.045}}
@keyframes mark{0%,100%{translate:0 0;scale:1}50%{translate:0 -.3rem;scale:1.028}}
@container faro (min-width:39rem){.context{grid-template-columns:minmax(0,.8fr) minmax(0,1.25fr)}.update{grid-column:1/-1}}
@container faro (min-width:55rem){.context{grid-template-columns:minmax(0,.8fr) minmax(0,1.3fr) minmax(9rem,.7fr)}.update{grid-column:auto;justify-content:flex-end}.update span{text-align:end}}
@container faro (min-width:44rem){.hero-grid{grid-template-columns:minmax(0,1.22fr) minmax(0,1fr);gap:clamp(1rem,2.5cqi,2.4rem);align-items:center}.signal>.kicker:first-child,.scoreline{padding-inline-end:clamp(3rem,7cqi,6rem)}}
@container faro (max-width:43.99rem){.beacon{inline-size:clamp(6rem,21cqi,9rem)}.read .location,.read .kicker{padding-inline-end:clamp(3rem,15cqi,6rem)}}
@container faro (min-width:32rem) and (max-width:57.99rem){.hours{grid-template-columns:repeat(4,minmax(0,1fr))}}
@container faro (min-width:58rem){.hours{grid-template-columns:repeat(8,minmax(0,1fr))}}
@container faro (max-width:29rem){
 .context{padding:.65rem;gap:.5rem;grid-template-columns:minmax(0,1fr) auto;align-items:end}
 .coast{grid-column:1/-1;grid-template-columns:auto minmax(0,1fr);gap:.65rem}
 .context label{grid-column:1/-1}
 .update{grid-column:1/-1;gap:.45rem}
 .update button{min-block-size:2.75rem;padding:.35rem .6rem}
 .days{grid-template-columns:repeat(7,minmax(6rem,1fr))}
 .days button{padding:.7rem .45rem .45rem;min-block-size:4.1rem;gap:.12rem}
 .days .tile-grade{display:none}
 .hero{padding:.8rem;gap:.65rem}
 .read{gap:.28rem}
 .read h2{font-size:clamp(1.35rem,1.1rem + 1.25cqi,1.75rem);max-inline-size:25ch}
 .deck{font-size:.82rem}
 .signal{padding:.65rem;gap:.4rem}
 .signal .scoreline strong{font-size:2.45rem}
 .actions{margin:0;gap:.3rem}
 .actions button{flex:1 1 auto;min-block-size:2.75rem;padding:.4rem;font-size:.73rem}
 .hours{grid-template-columns:repeat(2,minmax(0,1fr))}
 .hours button{min-block-size:3.7rem;gap:.15rem}
 .hours small{font-size:.65rem}
 .hours-head{padding-top:.5rem}
 .hero-footer .disclaimer{font-size:.67rem}
}
@container faro (min-width:21rem) and (max-width:31.99rem){.hours{grid-template-columns:repeat(4,minmax(0,1fr))}.hours button{padding-inline:.35rem}}
@media(hover:hover){.days button:not(:disabled):hover,.hours button:not(:disabled):hover{background:rgba(220,246,235,.08)}.actions button:not(:disabled):hover,.update button:hover{border-color:var(--accent)}}
@media(prefers-reduced-motion:reduce){.beacon::before,.beacon::after,.beacon .pulse,.beacon .beam,.beacon svg{animation:none;opacity:1}.days button,.hours button{transition:none}}
`;
const shades=["var(--faro-score-0,#ef9b77)","var(--faro-score-1,#efbd6e)","var(--faro-score-2,#e0cc73)","var(--faro-score-3,#b1d574)","var(--faro-score-4,#8cc584)"];
const score=(n,lang)=>valid(n)?new Intl.NumberFormat(lang==="es"?"es-CL":"en-GB",{minimumFractionDigits:1,maximumFractionDigits:1}).format(n):"—";
const tint=(e,n)=>{if(valid(n))e.style.setProperty("--score",shades[Math.max(0,Math.min(4,Math.floor(n/2)))]);return e};
function mount({before,retire=[],getData,onSpot,onDay,onHour,onRefresh,onDetails,onMatch,onExplore,beacon,regionLinks}){
 if(!before?.parentNode||!HTMLElement.prototype.attachShadow)return null;
 const host=make("div","faro-shared-console");host.id="faroSharedConsole";host.style.setProperty("display","block","important");host.style.setProperty("grid-column","1/-1","important");
 const shadow=host.attachShadow({mode:"open"}),style=make("style",null,css),layout=make("section","layout");shadow.append(style,layout);
 before.parentNode.insertBefore(host,before);
 let last="",retired=false,failed=false,railObserver=null;const prior=new Map();
 function paint(){
  if(failed)return;
  const d=getData();if(!d)return;const key=JSON.stringify(d);if(key===last)return;last=key;
  const lang=d.lang==="es"?"es":"en",t=(es,en)=>lang==="es"?es:en;
  const focus=shadow.activeElement?.dataset?.key,previousScroll=layout.querySelector(".days")?.scrollLeft||0;
  const control=(text,fn,k)=>{const b=make("button",null,text);b.type="button";b.dataset.key=k;b.addEventListener("click",fn);return b};
  layout.lang=lang;layout.setAttribute("aria-label",t("Pronóstico FARO","FARO forecast"));
  const context=make("div","context"),coast=make("div","coast"),countries=make("nav","countries");coast.append(make("span","kicker",t("Costa","Coast")),countries);
  for(const item of regionLinks){const a=make("a",null,item.label);a.href=item.href;if(item.current)a.setAttribute("aria-current","page");countries.append(a)}
  const label=make("label"),select=make("select");select.dataset.key="spot";label.append(make("span","kicker",t("Playa / spot","Beach / spot")),select);
  for(const p of d.spots||[]){const o=make("option",null,p.label);o.value=p.id;select.append(o)}select.value=d.spotId||"";select.disabled=!select.options.length;select.addEventListener("change",()=>onSpot(select.value));context.append(coast,label);
  const updated=make("div","update"),status=make("span",null,d.updated||t("Consultando el modelo…","Loading model…"));status.setAttribute("role","status");updated.append(status,control(t("↻ Actualizar","↻ Refresh"),onRefresh,"refresh"));context.append(updated);
  const week=make("section","week"),days=make("div","days");days.setAttribute("role","group");days.setAttribute("aria-label",t("Seleccionar día","Select day"));const weekHead=make("div","week-head"),tools=make("div","week-tools"),position=make("output"),prev=control("‹",()=>days.scrollBy({left:-Math.max(1,days.clientWidth*.72),behavior:"auto"}),"prev-day"),next=control("›",()=>days.scrollBy({left:Math.max(1,days.clientWidth*.72),behavior:"auto"}),"next-day");
  prev.setAttribute("aria-label",t("Días anteriores","Previous days"));next.setAttribute("aria-label",t("Días siguientes","Next days"));tools.append(prev,position,next);weekHead.append(make("span","kicker",t("Próximos 7 días","Next 7 days")),tools);week.append(weekHead,days);
  const syncRail=()=>{const max=days.scrollWidth-days.clientWidth;tools.hidden=max<=2;prev.disabled=days.scrollLeft<=2;next.disabled=days.scrollLeft>=max-2;const bounds=days.getBoundingClientRect(),visible=[...days.children].map((x,i)=>({i,r:x.getBoundingClientRect()})).filter(x=>x.r.right>bounds.left+4&&x.r.left<bounds.right-4);position.textContent=visible.length?(visible[0].i+1)+"–"+(visible.at(-1).i+1)+"/"+days.children.length:"";};
  days.addEventListener("scroll",syncRail,{passive:true});
  const addTile=(parent,item,fn,prefix)=>{const b=control("",()=>fn(item.id),prefix+item.id);b.setAttribute("aria-pressed",String(!!item.selected));b.disabled=!!item.disabled;if(valid(item.score)){tint(b,item.score);b.dataset.scored="";b.style.setProperty("--quality",String(Math.max(0,Math.min(10,item.score))/10))}b.append(make("span","tile-label",item.label),make("strong",null,score(item.score,lang)));if(item.grade)b.append(make("span","tile-grade",item.grade));b.append(make("small",null,item.note||"—"));parent.append(b)};
  for(const item of d.days||[])addTile(days,item,onDay,"day");
  const existingHero=layout.querySelector(".hero"),hero=existingHero||make("section","hero"),grid=make("div","hero-grid"),read=make("div","read"),signal=make("div","signal");
  for(const child of [...hero.children])if(!child.classList.contains("beacon"))child.remove();
  if(beacon&&!existingHero){const glow=make("div","beacon");glow.setAttribute("aria-hidden","true");const svg=beacon.cloneNode(true);svg.removeAttribute("class");glow.append(make("span","pulse"),make("span","beam"),svg);hero.append(glow)}
  read.append(make("span","kicker",t("FARO · Lee el mar","FARO · Read the ocean")),make("span","location",d.location||"—"),make("h2",null,d.headline||t("Leyendo tu costa…","Reading your coast…")),make("p","deck",d.deck||""));
  const actions=make("div","actions"),details=control(t("Ver análisis","See analysis"),onDetails,"details");details.disabled=!(d.days||[]).length;actions.append(details);if(onExplore)actions.append(control(t("Explorar costa ↗","Explore coast ↗"),onExplore,"explore"));actions.append(control("FARO Match",onMatch,"match"));
  const scoreline=make("div","scoreline");scoreline.append(tint(make("strong",null,score(d.score,lang)),d.score),make("small",null,valid(d.score)?"/10":""));
  if(d.grade)scoreline.append(tint(make("small","grade",d.grade),d.score));
  const primary=make("div","session-primary"),rating=make("div"),timing=make("div");
  rating.append(make("span","kicker",d.scoreLabel||t("Índice del modelo","Model index")),scoreline);
  timing.append(make("span","kicker",d.windowLabel||t("Franja","Window")),make("div","window",d.window||"—"));primary.append(rating,timing);signal.append(primary);
  const metrics=make("div","metrics");for(const m of [[t("Altura oceánica","Offshore height"),d.wave],[t("Período","Period"),d.period],[t("Viento","Wind"),d.wind]]){const x=make("div");x.append(make("small",null,m[0]),make("b",null,m[1]||"—"));metrics.append(x)}signal.append(metrics);const prep=make("div","prep");for(const item of d.prep||[]){if(!item.value)continue;const x=make("div");x.append(make("small",null,item.label),make("b",null,item.value));prep.append(x)}signal.append(prep);grid.append(read,signal);hero.append(grid);
  const hourHead=make("div","hours-head"),hours=make("div","hours");hours.setAttribute("role","group");hours.setAttribute("aria-label",t("Seleccionar franja","Select time window"));hourHead.append(make("span","kicker",t("Franjas de 2 horas","Two-hour windows")),make("small",null,d.hourDate||""));hero.append(hourHead,hours);
  for(const item of d.hours||[])addTile(hours,item,onHour,"hour");
  const footer=make("div","hero-footer");footer.append(make("p","disclaimer",d.disclaimer||t("Modelo orientativo. No es una medición de la rompiente ni una garantía de seguridad.","Model guidance, not a breaking-wave measurement or safety clearance.")));hero.append(actions,footer);
  if(existingHero){layout.querySelector(".context").replaceWith(context);layout.querySelector(".week").replaceWith(week)}else layout.replaceChildren(context,week,hero);days.scrollLeft=previousScroll;railObserver?.disconnect();if(typeof ResizeObserver==="function"){railObserver=new ResizeObserver(syncRail);railObserver.observe(days)}requestAnimationFrame(syncRail);
  for(const rail of [days,hours])rail.addEventListener("keydown",event=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;const buttons=[...rail.querySelectorAll("button:not(:disabled)")],i=buttons.indexOf(shadow.activeElement);if(i<0)return;event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?buttons.length-1:Math.max(0,Math.min(buttons.length-1,i+(event.key==="ArrowRight"?1:-1)));if(next!==i){buttons[next].focus({preventScroll:true});buttons[next].click()}});
  if(focus){const next=[...shadow.querySelectorAll("[data-key]")].find(x=>x.dataset.key===focus);next?.focus({preventScroll:true})}
  if(!retired){
   for(const node of retire.filter(Boolean)){
    prior.set(node,{display:node.style.getPropertyValue("display"),priority:node.style.getPropertyPriority("display"),inert:node.hasAttribute("inert"),aria:node.getAttribute("aria-hidden")});
    node.style.setProperty("display","none","important");node.setAttribute("data-faro-ui-retired","");node.setAttribute("inert","");node.setAttribute("aria-hidden","true");
   }
   retired=true;document.documentElement.setAttribute("data-faro-shared","");
  }
 }
 function update(){
  try{paint()}catch(e){
   failed=true;console.error("FARO shared console failed; restoring legacy interface",e);
   for(const [node,p] of prior){
    if(p.display)node.style.setProperty("display",p.display,p.priority);else node.style.removeProperty("display");
    node.removeAttribute("data-faro-ui-retired");if(!p.inert)node.removeAttribute("inert");
    if(p.aria===null)node.removeAttribute("aria-hidden");else node.setAttribute("aria-hidden",p.aria);
   }
   document.documentElement.removeAttribute("data-faro-shared");host.remove();
  }
 }
 update();return failed?null:{update,host};
}
root.FaroForecastConsole=Object.freeze({mount});
})(window);
