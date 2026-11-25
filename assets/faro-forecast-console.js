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

.hero-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(.55rem,1.2cqi,1rem);align-items:start}
.hero-grid>*{min-inline-size:0}
.read{display:grid;gap:.25rem;align-content:start;position:relative;z-index:2;padding-inline-end:clamp(3.5rem,12cqi,7rem)}
h2,p{margin:0}
h2{font-family:Manrope,system-ui,sans-serif;font-weight:750;letter-spacing:-.025em;line-height:1.25;font-size:clamp(1rem,.92rem + .65cqi,1.65rem);max-inline-size:36ch;overflow-wrap:anywhere}
.deck{font-size:clamp(.78rem,.74rem + .18cqi,.95rem);color:var(--muted);max-inline-size:62ch;overflow-wrap:anywhere}
.location{font-size:.76rem;color:var(--accent);font-weight:650;overflow-wrap:anywhere}
.signal{display:grid;gap:.65rem;align-content:start;min-inline-size:0;position:relative;z-index:2}
.session-primary{display:grid;grid-template-columns:minmax(0,1fr);gap:.25rem;align-items:end}
.session-primary>div{min-inline-size:0;display:grid;gap:.2rem}
.session-primary .kicker{font-size:.63rem;letter-spacing:.065em}
.timing{align-content:start}
.window{font-size:clamp(1.9rem,1.4rem + 2.5cqi,3.5rem);font-weight:800;letter-spacing:-.055em;font-variant-numeric:tabular-nums;line-height:1.08;overflow-wrap:normal}
.scoreline{display:flex;align-items:baseline;gap:.24rem;flex-wrap:wrap}
.scoreline strong{font-size:clamp(1.15rem,1rem + .8cqi,1.65rem);font-weight:800;line-height:1.08;letter-spacing:-.045em;font-variant-numeric:tabular-nums;color:var(--score,var(--ink))}
.scoreline small{font-size:.68rem}.scoreline .grade{font-weight:650;color:var(--score,var(--muted));font-size:.73rem}
.hero[data-unavailable] .session-primary{display:none}
.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.4rem;padding-block:.65rem}.conditions{border-bottom:1px solid var(--border,#42565a);padding:.2rem .1rem .6rem}.conditions .metrics small{color:var(--outer-muted)}.conditions .metrics div:first-child b{color:var(--outer-ink)}.excluded{font-size:.72rem;color:var(--muted)}.excluded summary{cursor:pointer;min-block-size:2.75rem;display:flex;align-items:center;gap:.4rem;list-style:none}.excluded summary::before{content:"+"}.excluded[open] summary::before{content:"−"}.excluded:not([open])>.hours{display:none}
.metrics div{min-inline-size:0;display:grid;gap:.12rem}
.metrics small{font-size:.67rem;line-height:1.3}.metrics b{font-size:clamp(.95rem,.85rem + .5cqi,1.25rem);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.metrics div:first-child b{color:#8acde1}
.hours{grid-template-columns:repeat(auto-fit,minmax(min(100%,3.85rem),1fr));background:rgba(24,59,65,.30);border:1px solid var(--line);border-radius:.6rem;gap:0;padding:.15rem}
.hours button{color:var(--ink);min-block-size:2.75rem;padding-block:.3rem;gap:.1rem}
.hours button strong{font-size:clamp(1rem,.9rem + .5cqi,1.35rem)}
.hours button .tile-label{font-size:.72rem}
.hours button small{font-size:.64rem}
.hours button:disabled{opacity:.64}.hours button:disabled strong{color:var(--muted)}
.hours-head{border-top:1px solid var(--line);padding-top:.55rem;display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:.3rem}
.hero-footer{display:flex;align-items:center;justify-content:space-between;gap:.6rem;flex-wrap:wrap}
.local-read{display:grid;gap:.5rem;min-inline-size:0;color:var(--outer-ink)}
.local-read details{border:1px solid var(--border,#42565a);border-radius:.75rem;padding:.65rem;background:var(--panel,var(--shell))}
.local-read summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:.4rem;font-size:.85rem;font-weight:750;min-block-size:2rem}
.local-read summary::-webkit-details-marker{display:none}
.local-read summary::after{content:"+";font-size:1.15rem;color:var(--selection)}
.local-read details[open] summary::after{content:"−"}
.local-read p{font-size:.8rem;line-height:1.5;margin:.4rem 0;color:var(--outer-muted);overflow-wrap:anywhere}
.local-read .uv-advice{border-inline-start:.2rem solid #bd8e57;padding:.45rem .65rem;margin:0;background:color-mix(in srgb,#bd8e57 9%,var(--panel,var(--shell)));border-radius:.4rem}
.local-read .local-links{display:flex;gap:.4rem;flex-wrap:wrap}
.local-read .local-links button{border-color:var(--border,#42565a);min-block-size:2.75rem;font-size:.77rem;font-weight:750;flex:1 1 auto}

.disclaimer{font-size:.7rem;color:var(--muted);max-inline-size:75ch;overflow-wrap:anywhere;flex:1 1 15rem}

/* Secondary tasks sit on the page surface, not inside the decision hero. */
.actions{display:flex;gap:.35rem;flex-wrap:wrap;align-items:center}
.actions button{color:var(--outer-ink);min-block-size:2.75rem;padding:.45em .8em;border-color:var(--border,#42565a);font-size:.78rem;font-weight:650;flex:1 1 auto}
.actions button:first-child{background:color-mix(in srgb,var(--selection) 12%,var(--panel,var(--shell)));border-color:var(--selection)}
.prep{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,5.5rem),1fr));gap:.45rem}
.prep div{display:grid;gap:.15rem;min-inline-size:0}.prep small{font-size:.7rem;color:var(--outer-muted)}.prep b{font-size:.95rem;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.local-read .prep{margin-block:.45rem .65rem}
/* The original four-arc O, with independent water, halo, core and beam.
   All layers use a single 5.4s phase. Static Gaussian blur restores the
   original submerged emblem; never animate an SVG filter or use drop-shadow. */
.beacon{position:absolute;z-index:1;inset-block-start:0;inset-inline-end:0;inline-size:clamp(7rem,23cqi,17rem);aspect-ratio:1;display:grid;place-items:center;pointer-events:none;overflow:visible}
.beacon::before,.beacon::after,.beacon .pulse,.beacon .beam{content:"";position:absolute;inset:0;pointer-events:none}
.beacon::before{background:radial-gradient(ellipse,rgba(111,193,181,.31) 0%,rgba(85,158,153,.12) 43%,transparent 76%);filter:blur(.5rem);animation:water 5.4s ease-in-out infinite}
.beacon::after{background:radial-gradient(circle,rgba(255,211,111,.27),rgba(110,204,182,.17) 35%,transparent 73%);filter:blur(clamp(.65rem,1.6cqi,1.75rem));animation:halo 5.4s ease-in-out infinite}
.beacon .pulse{inset:14%;background:radial-gradient(circle,rgba(255,216,122,.62),rgba(255,200,93,.19) 38%,transparent 72%);filter:blur(clamp(.65rem,1.65cqi,1.35rem));animation:core 5.4s ease-in-out infinite}
.beacon .beam{background:radial-gradient(ellipse at 58% 45%,rgba(173,232,206,.22),transparent 72%);filter:blur(.8rem);animation:beam 5.4s ease-in-out infinite}
.read>*,.signal>*{position:relative;z-index:2}
.beacon svg{position:relative;z-index:1;inline-size:37%;block-size:auto;fill:#d4ece5;opacity:.55;filter:blur(clamp(.05rem,.18cqi,.085rem));transform:rotate(-8deg);animation:mark 5.4s ease-in-out infinite}
.beacon .faro-beacon-core{fill:#ffda71}.beacon .faro-beacon-ring{fill:#d4ece5}
@keyframes water{0%,100%{opacity:.6;scale:.98}50%{opacity:.85;scale:1.03}}
@keyframes halo{0%,100%{opacity:.61;scale:.97}50%{opacity:.96;scale:1.055}}
@keyframes core{0%,100%{opacity:.42;scale:.945}50%{opacity:1;scale:1.08}}
@keyframes beam{0%,100%{opacity:.45;scale:.975}50%{opacity:.85;scale:1.045}}
@keyframes mark{0%,100%{translate:0 0;scale:1;opacity:.44}50%{translate:0 -.3rem;scale:1.028;opacity:.60}}
@container faro (min-width:39rem){.context{grid-template-columns:minmax(0,.8fr) minmax(0,1.25fr)}.update{grid-column:1/-1}}
@container faro (min-width:55rem){.context{grid-template-columns:minmax(0,.8fr) minmax(0,1.3fr) minmax(9rem,.7fr)}.update{grid-column:auto;justify-content:flex-end}.update span{text-align:end}}
@container faro (min-width:44rem){.hero-grid{grid-template-columns:minmax(0,1fr);gap:.4rem;padding-inline-end:clamp(5rem,16cqi,12rem)}.read{padding-inline-end:0}.session-primary{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:1rem}}
@container faro (max-width:43.99rem){.beacon{inline-size:clamp(6rem,21cqi,9rem)}}

@container faro (max-width:29rem){
 .context{padding:.65rem;gap:.5rem;grid-template-columns:minmax(0,1fr) auto;align-items:end}
 .coast{grid-column:1/-1;grid-template-columns:auto minmax(0,1fr);gap:.65rem}
 .context label{grid-column:1/-1}
 .update{grid-column:1/-1;gap:.45rem}
 .update button{min-block-size:2.75rem;padding:.35rem .6rem}
 .days{grid-template-columns:repeat(7,minmax(6rem,1fr))}
 .days button{padding:.7rem .45rem .45rem;min-block-size:4.1rem;gap:.12rem}
 .days .tile-grade{display:none}
 .hero{padding:.85rem;gap:.65rem}
 .hours button{min-block-size:2.75rem}
 .hours-head{padding-top:.45rem}
 .hero-footer .disclaimer{font-size:.67rem}
}

@container faro (max-width:19rem){.session-primary{grid-template-columns:minmax(0,1fr)}}
@media(hover:hover){.days button:not(:disabled):hover,.hours button:not(:disabled):hover{background:rgba(220,246,235,.08)}.actions button:not(:disabled):hover,.update button:hover{border-color:var(--accent)}}
@media(prefers-reduced-motion:reduce){.beacon::before,.beacon::after,.beacon .pulse,.beacon .beam{animation:none;opacity:.75}.beacon svg{animation:none;opacity:.55}.days button,.hours button{transition:none}}
`;
const shades=["var(--faro-score-0,#ef9b77)","var(--faro-score-1,#efbd6e)","var(--faro-score-2,#e0cc73)","var(--faro-score-3,#b1d574)","var(--faro-score-4,#8cc584)"];
const score=(n,lang)=>valid(n)?new Intl.NumberFormat(lang==="es"?"es-CL":"en-GB",{minimumFractionDigits:1,maximumFractionDigits:1}).format(n):"—";
const tint=(e,n)=>{if(valid(n))e.style.setProperty("--score",shades[Math.max(0,Math.min(4,Math.floor(n/2)))]);return e};
function mount({before,retire=[],getData,onSpot,onDay,onHour,onRefresh,onDetails,onMatch,onExplore,onDNA,onCamera,beacon,regionLinks}){
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
  const addTile=(parent,item,fn,prefix)=>{const b=control("",()=>fn(item.id),prefix+item.id);b.setAttribute("aria-pressed",String(!!item.selected));b.setAttribute("aria-label",[item.label,valid(item.score)?score(item.score,lang)+"/10":t("Sin score","No score"),item.grade,item.note].filter(Boolean).join(" · "));b.disabled=!!item.disabled;if(valid(item.score)){tint(b,item.score);b.dataset.scored="";b.style.setProperty("--quality",String(Math.max(0,Math.min(10,item.score))/10))}b.append(make("span","tile-label",item.label),make("strong",null,score(item.score,lang)));if(item.grade)b.append(make("span","tile-grade",item.grade));b.append(make("small",null,item.note||"—"));parent.append(b)};
  for(const item of d.days||[])addTile(days,item,onDay,"day");
  const existingHero=layout.querySelector(".hero"),hero=existingHero||make("section","hero"),grid=make("div","hero-grid"),read=make("div","read"),signal=make("div","signal"),excludedOpen=!!existingHero?.querySelector(".excluded")?.open;
  for(const child of [...hero.children])if(!child.classList.contains("beacon"))child.remove();
  if(beacon&&!existingHero){const glow=make("div","beacon");glow.setAttribute("aria-hidden","true");const svg=beacon.cloneNode(true);svg.removeAttribute("class");glow.append(make("span","pulse"),make("span","beam"),svg);hero.append(glow)}
  const available=valid(d.score)&&!!d.window&&d.window!=="—";
  hero.toggleAttribute("data-unavailable",!available);
  read.append(make("span","location",d.location||"—"));if(!available)read.append(make("h2",null,d.headline||t("Leyendo tu costa…","Reading your coast…")));
  if(!available&&d.deck)read.append(make("p","deck",d.deck));
  const actions=make("div","actions"),details=control(t("Ver datos de la sesión","Session details"),onDetails,"details");details.disabled=!(d.days||[]).length;actions.append(details);if(onExplore)actions.append(control(t("Explorar costa ↗","Explore coast ↗"),onExplore,"explore"));actions.append(control("FARO Match",onMatch,"match"));
  const scoreline=make("div","scoreline");scoreline.append(tint(make("strong",null,score(d.score,lang)),d.score),make("small",null,valid(d.score)?"/10":""));
  if(d.grade)scoreline.append(tint(make("small","grade",d.grade),d.score));
  const primary=make("div","session-primary"),rating=make("div","rating"),timing=make("div","timing");
  rating.append(scoreline);scoreline.setAttribute("aria-label",t("Índice de sesión modelado","Modelled session index")+" "+score(d.score,lang)+"/10 "+(d.grade||""));
  timing.append(make("span","kicker",/seleccionada|selected/i.test(d.windowLabel||"")?t("Franja seleccionada · modelo","Selected window · model"):t("Mejor ventana · modelo","Best window · model")),make("h2","window",d.window||"—"));primary.append(timing,rating);signal.append(primary);
  const metrics=make("div","metrics");for(const m of [[t("Altura oceánica","Offshore height"),d.wave],[t("Período","Period"),d.period],[t("Viento","Wind"),d.wind]]){const x=make("div");x.append(make("small",null,m[0]),make("b",null,m[1]||"—"));metrics.append(x)}const prep=make("div","prep");for(const item of d.prep||[]){if(!item.value)continue;const x=make("div");x.append(make("small",null,item.label),make("b",null,item.value));prep.append(x)}const caution=available&&(d.caution===true||/precauci[oó]n|caution/i.test((d.grade||"")+" "+(d.verdict||"")));if(caution&&d.reason)signal.append(make("p","deck",d.reason));grid.append(read,signal);hero.append(grid);
  const hourHead=make("div","hours-head"),hours=make("div","hours");hours.setAttribute("role","group");hours.setAttribute("aria-label",t("Seleccionar franja","Select time window"));hourHead.append(make("span","kicker",t("Franjas disponibles","Available windows")));const eligible=(d.hours||[]).filter(x=>!x.disabled&&valid(x.score)),other=(d.hours||[]).filter(x=>x.disabled||!valid(x.score));
  if(eligible.length){hero.append(hourHead,hours);for(const item of eligible){addTile(hours,item,onHour,"hour");const note=hours.lastElementChild.querySelector("small");if(note){if(/precauci[oó]n|caution/i.test(item.note||""))note.textContent=t("Precaución","Caution");else note.remove()}}}
  const excluded=make("details","excluded"),excludedRail=make("div","hours");if(other.length){excluded.open=excludedOpen;excluded.append(make("summary",null,t("Franjas no evaluables","Ineligible windows")+" ("+other.length+")"),excludedRail);for(const item of other)addTile(excludedRail,item,onHour,"hour");hero.append(excluded)}
  const footer=make("div","hero-footer");footer.append(make("p","disclaimer",(!available||caution)&&d.disclaimer?d.disclaimer:t("Modelo experimental · no garantiza seguridad ni altura de rompiente.","Experimental model · not a safety or breaking-height guarantee.")));hero.append(footer);
  const oldLocal=layout.querySelector(".local-read"),local=make("section","local-read");
  if(available){const conditions=make("section","conditions");conditions.append(make("span","kicker",t("Condiciones de la franja","Window conditions")),metrics);if(d.reason&&!caution){const why=make("details","why");why.open=!!oldLocal?.querySelector(".why")?.open;why.append(make("summary",null,t("¿Por qué esta franja?","Why this window?")),make("p",null,d.reason));conditions.append(why)}local.append(conditions)}
  if(prep.children.length){const kit=make("details","kit"),summary=make("summary",null,t("Prepara tu sesión","Prepare your session"));kit.open=!!oldLocal?.querySelector(".kit")?.open;kit.append(summary,prep);local.append(kit)}
  if(d.local?.uvAdvice)local.append(make("p","uv-advice",d.local.uvAdvice));
  local.append(actions);
  if(d.local?.headline){const detail=make("details","interpretation"),summary=make("summary",null,t("Lectura local · ","Local read · ")+d.local.headline);detail.open=!!oldLocal?.querySelector(".interpretation")?.open;detail.append(summary);for(const p of d.local.paragraphs||[])if(p)detail.append(make("p",null,p));local.append(detail)}
  const links=make("div","local-links");if(onDNA)links.append(control("Spot DNA",onDNA,"dna"));if(onCamera)links.append(control(t("Cámaras","Cameras"),onCamera,"camera"));if(links.children.length)local.append(links);
  if(existingHero){layout.querySelector(".context").replaceWith(context);layout.querySelector(".week").replaceWith(week);if(oldLocal)oldLocal.replaceWith(local);else layout.append(local)}else layout.replaceChildren(context,week,hero,local);days.scrollLeft=previousScroll;railObserver?.disconnect();if(typeof ResizeObserver==="function"){railObserver=new ResizeObserver(syncRail);railObserver.observe(days)}requestAnimationFrame(syncRail);
  for(const rail of [days,hours,excludedRail])rail.addEventListener("keydown",event=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;const buttons=[...rail.querySelectorAll("button:not(:disabled)")],i=buttons.indexOf(shadow.activeElement);if(i<0)return;event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?buttons.length-1:Math.max(0,Math.min(buttons.length-1,i+(event.key==="ArrowRight"?1:-1)));if(next!==i){buttons[next].focus({preventScroll:true});buttons[next].click()}});
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
   failed=true;railObserver?.disconnect();console.error("FARO shared console failed; restoring legacy interface",e);
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
