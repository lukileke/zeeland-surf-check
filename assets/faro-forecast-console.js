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
.week-head small{font-size:.72rem;color:var(--outer-muted)}.week-tools{display:flex;align-items:center;gap:.35rem}.week-tools button{min-inline-size:2.75rem;min-block-size:2.75rem;padding:.2rem;border-color:transparent;font-size:1.25rem;line-height:1}.week-tools button:disabled{opacity:.35}.week-tools[hidden]{display:none}.week-tools output{font-size:.72rem;color:var(--outer-muted);font-variant-numeric:tabular-nums}
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

.hero-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:.45rem;align-items:start;position:relative;z-index:2;padding-inline-end:clamp(4.5rem,25cqi,9rem)}
.hero-grid>*{min-inline-size:0}
.read{display:grid;gap:.25rem;align-content:start;position:relative;z-index:2;padding-inline-end:0}
h2,p{margin:0}
h2{font-family:Manrope,system-ui,sans-serif;font-weight:750;letter-spacing:-.025em;line-height:1.25;font-size:clamp(1rem,.92rem + .65cqi,1.65rem);max-inline-size:36ch;overflow-wrap:anywhere}
.deck{font-size:clamp(.78rem,.74rem + .18cqi,.95rem);color:var(--muted);max-inline-size:62ch;overflow-wrap:anywhere}
.location{font-size:.76rem;color:var(--accent);font-weight:650;overflow-wrap:anywhere}
.signal{display:grid;gap:.65rem;align-content:start;min-inline-size:0;position:relative;z-index:2}
.session-primary{display:grid;grid-template-columns:minmax(0,1fr);gap:.25rem;align-items:end}
.session-primary>div{min-inline-size:0;display:grid;gap:.2rem}
.session-primary .kicker{font-size:.63rem;letter-spacing:.065em}
.timing{align-content:start}
.window{font-size:clamp(1.9rem,1.4rem + 2.5cqi,3.5rem);font-weight:800;letter-spacing:-.055em;font-variant-numeric:tabular-nums;line-height:1.08;overflow-wrap:anywhere}
.scoreline{display:flex;align-items:baseline;gap:.24rem;flex-wrap:wrap}
.scoreline strong{font-size:clamp(1.15rem,1rem + .8cqi,1.65rem);font-weight:800;line-height:1.08;letter-spacing:-.045em;font-variant-numeric:tabular-nums;color:var(--score,var(--ink))}
.scoreline small{font-size:.68rem}.scoreline .grade{font-weight:650;color:var(--score,var(--muted));font-size:.73rem}
.hero[data-unavailable] .session-primary{display:none}
.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.4rem;padding-block:.65rem}.conditions{border-bottom:1px solid var(--border,#42565a);padding:.2rem .1rem .6rem}.conditions .metrics small{color:var(--outer-muted)}.conditions .metrics div:first-child b{color:var(--outer-ink)}.excluded{font-size:.72rem;color:var(--muted)}.excluded summary{cursor:pointer;min-block-size:2.75rem;display:flex;align-items:center;gap:.4rem;list-style:none}.excluded summary::-webkit-details-marker{display:none}.excluded summary::before{content:"+"}.excluded[open] summary::before{content:"−"}.excluded:not([open])>.hours{display:none}
.metrics div{min-inline-size:0;display:grid;gap:.12rem}
.metrics small{font-size:.67rem;line-height:1.3}.metrics b{font-size:clamp(.95rem,.85rem + .5cqi,1.25rem);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.metrics div:first-child b{color:#8acde1}
.hours{grid-template-columns:repeat(auto-fit,minmax(min(100%,4.75rem),1fr));background:rgba(24,59,65,.30);border:1px solid var(--line);border-radius:.6rem;gap:0;padding:.15rem}
.hero>.hours{grid-template-columns:repeat(var(--cols,4),minmax(0,1fr))}
.hours button{color:var(--ink);min-block-size:2.75rem;padding:.4rem .4rem;gap:.15rem}
.hero>.hours button[data-scored]::after{content:"";position:absolute;inset-inline-start:.4rem;inset-block-end:.15rem;inline-size:calc((100% - .8rem)*var(--quality,0));block-size:2px;background:var(--score);border-radius:2px;opacity:.8}
.hero>.hours button{padding-block-end:.6rem}
@container faro (min-width:44rem){.hero>.hours{grid-template-columns:repeat(var(--count,4),minmax(0,1fr))}}
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
.local-read details[open] summary::after{content:"−"}.kit-preview{margin-inline-start:auto;font-weight:650;font-size:.78rem;color:var(--outer-muted)}
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
.beacon{position:absolute;z-index:1;inset-block-start:.2rem;inset-inline-end:.35rem;inline-size:clamp(9rem,28cqi,19rem);aspect-ratio:1;display:grid;place-items:center;pointer-events:none;overflow:visible}
.beacon::before,.beacon::after,.beacon .pulse,.beacon .beam{content:"";position:absolute;inset:0;pointer-events:none}
.beacon::before{background:radial-gradient(ellipse,rgba(111,193,181,.31) 0%,rgba(85,158,153,.12) 43%,transparent 76%);filter:blur(.5rem);animation:water 5.4s ease-in-out infinite}
.beacon::after{background:radial-gradient(circle,rgba(255,211,111,.27),rgba(110,204,182,.17) 35%,transparent 73%);filter:blur(clamp(.65rem,1.6cqi,1.75rem));animation:halo 5.4s ease-in-out infinite}
.beacon .pulse{inset:14%;background:radial-gradient(circle,rgba(255,216,122,.62),rgba(255,200,93,.19) 38%,transparent 72%);filter:blur(clamp(.65rem,1.65cqi,1.35rem));animation:core 5.4s ease-in-out infinite}
.beacon .beam{background:radial-gradient(ellipse at 58% 45%,rgba(173,232,206,.22),transparent 72%);filter:blur(.8rem);animation:beam 5.4s ease-in-out infinite}
.read>*,.signal>*{position:relative;z-index:2}
.beacon svg{position:relative;z-index:1;inline-size:57%;block-size:auto;fill:#d4ece5;opacity:.55;filter:blur(clamp(.07rem,.22cqi,.12rem));transform:rotate(-8deg);animation:mark 5.4s ease-in-out infinite}
.beacon .faro-beacon-core{fill:#ffda71}.beacon .faro-beacon-ring{fill:#d4ece5}
@keyframes water{0%,100%{opacity:.6;scale:.98}50%{opacity:.85;scale:1.03}}
@keyframes halo{0%,100%{opacity:.61;scale:.97}50%{opacity:.96;scale:1.055}}
@keyframes core{0%,100%{opacity:.42;scale:.945}50%{opacity:1;scale:1.08}}
@keyframes beam{0%,100%{opacity:.45;scale:.975}50%{opacity:.85;scale:1.045}}
@keyframes mark{0%,100%{translate:0 0;scale:1;opacity:.44}50%{translate:0 -.3rem;scale:1.028;opacity:.60}}
@container faro (min-width:39rem){.context{grid-template-columns:minmax(0,.8fr) minmax(0,1.25fr)}.update{grid-column:1/-1}}
@container faro (min-width:55rem){.context{grid-template-columns:minmax(0,.8fr) minmax(0,1.3fr) minmax(9rem,.7fr)}.update{grid-column:auto;justify-content:flex-end}.update span{text-align:end}}
@container faro (min-width:44rem){.hero-grid{grid-template-columns:minmax(0,1fr);gap:.4rem;padding-inline-end:clamp(9rem,25cqi,18rem)}.read{padding-inline-end:0}.session-primary{grid-template-columns:minmax(0,max-content) minmax(0,1fr);gap:clamp(1rem,4cqi,3rem)}}
@container faro (max-width:43.99rem){.beacon{inline-size:clamp(8rem,29cqi,11rem)}}

@container faro (max-width:29rem){
 .context{padding:.65rem;gap:.5rem;grid-template-columns:minmax(0,1fr) auto;align-items:end}
 .coast{grid-column:1/-1;grid-template-columns:auto minmax(0,1fr);gap:.65rem}
 .context label{grid-column:1/-1}
 .update{grid-column:1/-1;gap:.45rem}
 .update button{min-block-size:2.75rem;padding:.35rem .6rem}
 .days{grid-template-columns:repeat(7,minmax(5.8rem,calc((100% - .48rem)/3)))}
 .days button{padding:.7rem .45rem .45rem;min-block-size:4.1rem;gap:.12rem}
 .days .tile-grade{display:none}
 .hero{padding:.85rem;gap:.45rem}
 .hours button{min-block-size:2.75rem}
 .hours-head{padding-top:.45rem}
 .hero-footer .disclaimer{font-size:.67rem}
}

@container faro (min-width:26rem) and (max-width:29rem){.days{grid-template-columns:repeat(7,minmax(6rem,calc((100% - .48rem)/4)))}}
@container faro (max-width:19rem){.hero-grid{padding-inline-end:clamp(2rem,22cqi,4rem)}.beacon{inline-size:clamp(4rem,30cqi,7rem)}.window{font-size:clamp(1.4rem,1.25rem + 1.7cqi,2.3rem)}.session-primary{grid-template-columns:minmax(0,1fr)}.hero>.hours{grid-template-columns:repeat(min(2,var(--count,2)),minmax(0,1fr))}}
@media(hover:hover){.days button:not(:disabled):hover,.hours button:not(:disabled):hover{background:rgba(220,246,235,.08)}.actions button:not(:disabled):hover,.update button:hover{border-color:var(--accent)}}
@media(prefers-reduced-motion:reduce){.beacon::before,.beacon::after,.beacon .pulse,.beacon .beam{animation:none;opacity:.75}.beacon svg{animation:none;opacity:.55}.days button,.hours button{transition:none}}
`;
const tideCSS="\n.tide{display:grid;gap:.6rem;border-bottom:1px solid var(--border,#42565a);padding:.7rem .1rem .85rem;min-inline-size:0}\n.tide-head{display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:.35rem}\n.tide-head strong{font-size:.9rem;color:var(--outer-ink)}\n.tide svg{display:block;width:100%;height:auto;max-height:10rem;color:var(--outer-muted);overflow:visible}\n.tide-events{display:flex;gap:.4rem .9rem;flex-wrap:wrap;font-size:.78rem;font-variant-numeric:tabular-nums;color:var(--outer-ink)}\n.tide-events span{white-space:nowrap}.tide .tide-note{font-size:.72rem;color:var(--outer-muted);margin:0;line-height:1.45}\n.tide a{font-size:.72rem;color:var(--outer-muted);text-underline-offset:.2em}\n";
const shades=["var(--faro-score-0,#ef9b77)","var(--faro-score-1,#efbd6e)","var(--faro-score-2,#e0cc73)","var(--faro-score-3,#b1d574)","var(--faro-score-4,#8cc584)"];
const score=(n,lang)=>valid(n)?new Intl.NumberFormat(lang==="es"?"es-CL":"en-GB",{minimumFractionDigits:1,maximumFractionDigits:1}).format(n):"—";
const tint=(e,n)=>{if(valid(n))e.style.setProperty("--score",shades[Math.max(0,Math.min(4,Math.floor(n/2)))]);return e};

/* Shared local-time coastal sea-level read. No interpolation over missing hours,
   no extrapolated extrema, and no change to the uncalibrated surf score. */
const tideHour=t=>{const m=String(t).match(/T(\d{2}):(\d{2})/);return m?+m[1]+(+m[2])/60:null};
function tideSeries(times,levels,date){
 if(!date||!Array.isArray(times)||!Array.isArray(levels))return [];
 const byHour=new Map(),duplicate=new Set();
 times.forEach((t,i)=>{if(typeof t!=="string"||!t.startsWith(date+"T"))return;const h=tideHour(t);if(!valid(h)||h<0||h>=24)return;if(byHour.has(h)){duplicate.add(h);return}byHour.set(h,valid(levels[i])?levels[i]:null)});
 return [...byHour].filter(([h,v])=>!duplicate.has(h)&&valid(v)).sort((a,b)=>a[0]-b[0]);
}
function tideProfile(region,id,name){
 if(region==="NL"){
  const a=String(name||"").split(" · ")[0].toLowerCase();
  if(a==="cadzand"&&/cadzand.bad/i.test(name))return {key:"high-rising",source:"Wompy · Cadzand"};
  return null;
 }
 const cl={"CL-VS:renaca":"mid-low","CL-VS:ritoque":"mid-low","CL-VS:maitencillo":"mid-rising","CL-VS:la-boca-concon":"all","CL-VS:ventanas":"falling"};
 return cl[id]?{key:cl[id],source:"FARO Spot DNA · published guides"}:null;
}
function tideRead(rows,hour){
 const points=(Array.isArray(rows)?rows:[]).filter(x=>Array.isArray(x)&&valid(x[0])&&valid(x[1])&&x[0]>=0&&x[0]<24).sort((a,b)=>a[0]-b[0]);
 const events=[];for(let i=1;i<points.length-1;i++){const [h,v]=points[i],a=points[i-1],b=points[i+1];if(h-a[0]!==1||b[0]-h!==1)continue;if(v>a[1]&&v>=b[1])events.push({h,v,type:"high"});else if(v<a[1]&&v<=b[1])events.push({h,v,type:"low"})}
 const full=points.length===24&&points.every((p,i)=>p[0]===i),lo=points.length?Math.min(...points.map(p=>p[1])):null,hi=points.length?Math.max(...points.map(p=>p[1])):null;
 const a=points.find(p=>p[0]===hour),b=points.find(p=>p[0]===hour+1);
 const phase=a&&b?(b[1]-a[1]>.025?"rising":b[1]-a[1]<-.025?"falling":"steady"):null;
 const fraction=full&&a&&b&&hi-lo>=.15?((a[1]+b[1])/2-lo)/(hi-lo):null;
 return {points,events,full,lo,hi,phase,fraction,level:a&&b?(a[1]+b[1])/2:null};
}
function tideFit(read,profile){
 if(!profile||!read.full||!read.phase||!valid(read.fraction))return null;
 const f=read.fraction,p=read.phase;
 switch(profile.key){case "high-rising":return f>=.7||p==="rising";case "mid-low":return f<=.65;case "mid-rising":return (f>=.3&&f<=.7)||p==="rising";case "falling":return p==="falling";default:return null}
}
function renderTide(d,t,lang){
 const tide=d.tide||{},r=tideRead(tide.rows,tide.hour),section=make("section","tide"),header=make("div","tide-head");
 const phases={rising:t("Subiendo","Rising"),falling:t("Bajando","Falling"),steady:t("Casi estable","Nearly steady")};
 header.append(make("span","kicker",t("FARO · Marea","FARO · Tide")),make("strong",null,phases[r.phase]||t("Fase no disponible","Phase unavailable")));section.append(header);
 const fmt=n=>new Intl.NumberFormat(lang==="es"?"es-CL":"en-GB",{minimumFractionDigits:1,maximumFractionDigits:1}).format(n);
 const time=h=>String(h).padStart(2,"0")+":00";
 if(r.points.length>=2){
  const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
  const put=(tag,attrs,txt)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(txt!==undefined)n.textContent=txt;svg.append(n);return n};
  svg.setAttribute("viewBox","0 0 360 116");svg.setAttribute("role","img");svg.setAttribute("aria-label",t("Nivel del mar modelado por hora, en metros sobre MSL","Hourly modelled sea level, metres relative to MSL"));
  const x=h=>12+h/24*336,span=Math.max(.2,r.hi-r.lo),y=v=>12+(r.hi-v)/span*71;
  if(valid(tide.hour)){put("rect",{x:x(tide.hour),y:5,width:Math.min(24-tide.hour,2)/24*336,height:83,rx:3,fill:"currentColor",opacity:.13})}
  for(const h of [0,6,12,18,24]){put("line",{x1:x(h),x2:x(h),y1:8,y2:88,stroke:"currentColor",opacity:.16});put("text",{x:x(h),y:106,"text-anchor":h===0?"start":h===24?"end":"middle","font-size":10,fill:"currentColor"},time(h))}
  let path="",prev=null;for(const [h,v] of r.points){path+=(prev!==null&&h-prev===1?" L":" M")+x(h)+" "+y(v);prev=h}
  put("path",{d:path,fill:"none",stroke:"var(--selection,#8acdc8)","stroke-width":2.3,"stroke-linecap":"round","stroke-linejoin":"round"});
  for(const e of r.events)put("circle",{cx:x(e.h),cy:y(e.v),r:3,fill:"var(--selection,#8acdc8)"});
  section.append(svg);
  const events=make("div","tide-events");for(const e of r.events)events.append(make("span",null,(e.type==="high"?"↑ ":"↓ ")+time(e.h)+" · "+fmt(e.v)+" m"));if(events.children.length)section.append(events);
  if(valid(r.level))section.append(make("p","tide-note",t("Franja seleccionada: ","Selected window: ")+fmt(r.level)+" m MSL"));
 }else section.append(make("p","tide-note",t("Sin serie de nivel del mar para este día. El pronóstico de olas permanece disponible.","No sea-level series for this day. The wave forecast remains available.")));
 const profile=tide.profile,labels={"high-rising":t("Alta o entrante","High or rising"),"mid-low":t("Media a baja","Mid to low"),"mid-rising":t("Media o entrante","Mid or rising"),all:t("Todas las fases, según bancos","All stages, depending on banks"),falling:t("Bajando","Falling")};
 if(profile){section.append(make("p","tide-note",t("Referencia local sin calibrar: ","Uncalibrated local guidance: ")+labels[profile.key]+" · "+profile.source));
  const fit=tideFit(r,profile);if(fit!==null){const alt=(d.hours||[]).filter(v=>!v.disabled&&valid(v.score)&&!v.selected).map(v=>({v,h:Number(String(v.label).match(/^\d{1,2}/)?.[0])})).filter(v=>valid(v.h)&&tideFit(tideRead(tide.rows,v.h),profile)===true).sort((a,b)=>b.v.score-a.v.score)[0];
   section.append(make("p","tide-note",fit?t("La franja coincide con la referencia de marea.","Window aligns with the tide guidance."):t("La franja no coincide con la referencia de marea.","Window does not align with the tide guidance.")+(alt?t(" Alternativa de marea: "," Tide alternative: ")+alt.v.label+" · "+score(alt.v.score,lang)+"/10.":"")));
  }
 }else section.append(make("p","tide-note",t("Preferencia de marea del spot aún no validada.","Spot tide preference not yet validated.")));
 section.append(make("p","tide-note",t("Open-Meteo · nivel del mar modelado (MSL, incluye marea y otros procesos). Extremos aproximados a 1 h; no son tablas oficiales ni modifican el índice.","Open-Meteo · modelled sea level (MSL, includes tide and other effects). Approximate hourly extrema; not official tide tables or a score adjustment.")));
 const link=make("a",null,tide.region==="CL"?t("Consultar SHOA ↗","Check SHOA ↗"):t("Consultar Rijkswaterstaat ↗","Check Rijkswaterstaat ↗"));link.href=tide.region==="CL"?"https://www.shoa.cl/":"https://www.rijkswaterstaat.nl/water/waterdata/getij";link.target="_blank";link.rel="noopener noreferrer";section.append(link);return section;
}

function mount({before,retire=[],getData,onSpot,onDay,onHour,onRefresh,onDetails,onMatch,onExplore,onDNA,onCamera,beacon,regionLinks}){
 if(!before?.parentNode||!HTMLElement.prototype.attachShadow)return null;
 const host=make("div","faro-shared-console");host.id="faroSharedConsole";host.style.setProperty("display","block","important");host.style.setProperty("grid-column","1/-1","important");
 const shadow=host.attachShadow({mode:"open"}),style=make("style",null,css+tideCSS),layout=make("section","layout");shadow.append(style,layout);
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
  const syncRail=()=>{const max=days.scrollWidth-days.clientWidth;tools.hidden=max<=2;prev.disabled=days.scrollLeft<=2;next.disabled=days.scrollLeft>=max-2;const bounds=days.getBoundingClientRect(),visible=[...days.children].map((x,i)=>({i,r:x.getBoundingClientRect()})).filter(x=>x.r.right<=bounds.right+2&&x.r.left>=bounds.left-2);position.textContent=visible.length?(visible[0].i+1)+"–"+(visible.at(-1).i+1)+"/"+days.children.length:"";};
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
  const metrics=make("div","metrics");for(const m of [[t("Altura oceánica","Offshore height"),d.wave],[t("Período","Period"),d.period],[t("Viento","Wind"),d.wind]]){const x=make("div");x.append(make("small",null,m[0]),make("b",null,m[1]||"—"));metrics.append(x)}const prep=make("div","prep");for(const item of d.prep||[]){if(!item.value)continue;const x=make("div");x.append(make("small",null,item.label),make("b",null,item.value));prep.append(x)}const caution=available&&(d.caution===true||/precauci[oó]n|caution/i.test((d.grade||"")+" "+(d.verdict||"")));if(caution)signal.append(make("p","deck",d.reason||t("Precaución del modelo: revisa los avisos oficiales.","Model caution: check official notices.")));grid.append(read,signal);hero.append(grid);
  const hourHead=make("div","hours-head"),hours=make("div","hours");hours.setAttribute("role","group");hours.setAttribute("aria-label",t("Seleccionar franja","Select time window"));hourHead.append(make("span","kicker",t("Franjas disponibles","Available windows")));const eligible=(d.hours||[]).filter(x=>!x.disabled&&valid(x.score)),other=(d.hours||[]).filter(x=>x.disabled||!valid(x.score));
  if(eligible.length){hours.style.setProperty("--count",String(eligible.length));hours.style.setProperty("--cols",String(Math.min(4,eligible.length)));hero.append(hourHead,hours);for(const item of eligible){addTile(hours,item,onHour,"hour");const note=hours.lastElementChild.querySelector("small");if(note){if(/precauci[oó]n|caution/i.test(item.note||""))note.textContent=t("Precaución","Caution");else note.remove()}}}
  const excluded=make("details","excluded"),excludedRail=make("div","hours");if(other.length){excluded.open=excludedOpen;excluded.append(make("summary",null,t("Franjas no evaluables","Ineligible windows")+" ("+other.length+")"),excludedRail);for(const item of other)addTile(excludedRail,item,onHour,"hour");hero.append(excluded)}
  const footer=make("div","hero-footer");footer.append(make("p","disclaimer",(!available||caution)&&d.disclaimer?d.disclaimer:t("Modelo experimental · no garantiza seguridad ni altura de rompiente.","Experimental model · not a safety or breaking-height guarantee.")));hero.append(footer);
  const oldLocal=layout.querySelector(".local-read"),local=make("section","local-read");
  if(available||[d.wave,d.period,d.wind].some(v=>v&&v!=="—")){const conditions=make("section","conditions");conditions.append(make("span","kicker",t("Condiciones de la franja","Window conditions")),metrics);if(d.reason&&!caution){const why=make("details","why");why.open=!!oldLocal?.querySelector(".why")?.open;why.append(make("summary",null,t("¿Por qué esta franja?","Why this window?")),make("p",null,d.reason));conditions.append(why)}local.append(conditions)}
  if(d.tide)local.append(renderTide(d,t,lang));
  if(prep.children.length){const kit=make("details","kit"),summary=make("summary"),kitTitle=make("span",null,t("Prepara tu sesión","Prepare your session"));summary.append(kitTitle);const suit=(d.prep||[]).find(x=>/traje|suit/i.test(x.label));if(suit?.value)summary.append(make("small","kit-preview",suit.value));kit.open=!!oldLocal?.querySelector(".kit")?.open;kit.append(summary,prep);local.append(kit)}
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
root.FaroForecastConsole=Object.freeze({mount,tideSeries,tideRead,tideProfile,tideFit});
})(window);
