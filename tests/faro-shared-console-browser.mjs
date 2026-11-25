/* The primary FARO renderer is now shared by both real entry pages.
 * Deterministic provider fixtures, not a live forecast or measured surf.
 * Run from repo root with a local http server and playwright installed.
 */
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium,webkit} from "playwright";
const origin=process.env.FARO_QA_ORIGIN||"http://127.0.0.1:8765";
const out="artifacts/faro-browser";await mkdir(out,{recursive:true});
const base=Date.parse("2026-11-25T12:00:00Z"),first="2026-11-25";
function fixture(region){
 const cl=region==="cl",offset=cl?-3:1;
 const dates=Array.from({length:7},(_,i)=>new Date(Date.parse(first+"T12:00:00Z")+i*86400000).toISOString().slice(0,10));
 const time=Array.from({length:7*24+4},(_,i)=>cl?(Date.parse(first+"T00:00:00Z")/1000-offset*3600+i*3600):new Date(Date.parse(first+"T00:00:00Z")+i*3600000).toISOString().slice(0,16));
 const stamp=(d,h,m=0)=>cl?Date.parse(d+"T"+String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+":00Z")/1000-offset*3600:d+"T"+String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");
 const fixed=x=>time.map(()=>x),loc=cl?{latitude:-32.93,longitude:-71.52}:{latitude:51.56,longitude:3.49};
 return {marine:{...loc,hourly:{time,wave_height:fixed(1.3),wave_direction:fixed(cl?282:320),wave_period:fixed(9),swell_wave_height:fixed(1),swell_wave_direction:fixed(cl?295:320),swell_wave_period:fixed(11),wind_wave_height:fixed(.25),wind_wave_direction:fixed(255),sea_surface_temperature:fixed(16),secondary_swell_wave_height:fixed(.3),secondary_swell_wave_period:fixed(13),secondary_swell_wave_direction:fixed(270),tertiary_swell_wave_height:fixed(null),tertiary_swell_wave_period:fixed(null),tertiary_swell_wave_direction:fixed(null)}},
 weather:{...loc,hourly:{time,wind_speed_10m:fixed(10),wind_direction_10m:fixed(cl?125:140),wind_gusts_10m:fixed(15),precipitation:fixed(0),weather_code:fixed(1),uv_index:fixed(3),temperature_2m:fixed(21),apparent_temperature:fixed(20),cloud_cover:fixed(25),precipitation_probability:fixed(0)},daily:{time:cl?dates.map(d=>stamp(d,0)):dates,sunrise:dates.map(d=>stamp(d,7,15)),sunset:dates.map(d=>stamp(d,cl?20:17,15)),uv_index_max:dates.map(()=>7),precipitation_sum:dates.map(()=>0)}}};
}
const errors=[];
for(const [engine,driver] of [["chromium",chromium],["webkit",webkit]]){
 const browser=await driver.launch({headless:true});
 try{
  for(const region of ["nl","cl"]){
   const data=fixture(region);
   for(const theme of ["dark","light"]){
    const ctx=await browser.newContext({viewport:{width:1366,height:1000},reducedMotion:"reduce",colorScheme:theme});
    await ctx.addInitScript(({ms,theme})=>{localStorage.setItem("zeeland-language","es");localStorage.setItem("zeeland-theme",theme);const NativeDate=Date;window.Date=class extends NativeDate{constructor(...a){if(a.length)super(...a);else super(ms)}static now(){return ms}}},{ms:base,theme});
    await ctx.route("**/*",r=>{const url=new URL(r.request().url());if(url.hostname==="marine-api.open-meteo.com")return r.fulfill({json:data.marine});if(url.hostname==="api.open-meteo.com")return r.fulfill({json:data.weather});return url.origin===origin?r.continue():r.abort()});
    const page=await ctx.newPage(),scriptErrors=[];page.on("pageerror",e=>scriptErrors.push(String(e)));
    try{
     await page.goto(origin+(region==="cl"?"/chile/":"/"),{waitUntil:"domcontentloaded"});
     await page.waitForFunction(()=>{const root=document.querySelector("#faroSharedConsole")?.shadowRoot;return root?.querySelectorAll(".days button").length===7&&root?.querySelectorAll(".hours button").length>=7},{timeout:20000});
     const consoleHost=page.locator("#faroSharedConsole");assert.equal(await consoleHost.count(),1);
     const getScore=()=>consoleHost.locator(".scoreline strong").textContent();
     assert.notEqual(await getScore(),"—","Mock data must produce an eligible selected session");
     for(const width of [320,375,768,1024,1366,1920,2560]){
      await page.setViewportSize({width,height:1000});
      for(const scale of [1,1.25,2]){
       await page.evaluate(n=>document.documentElement.style.setProperty("font-size",(16*n)+"px","important"),scale);
       const geometry=await page.evaluate(()=>{const h=document.querySelector("#faroSharedConsole"),r=h.shadowRoot,hero=r.querySelector(".hero"),rail=r.querySelector(".days"),hours=r.querySelector(".hours"),box=e=>e.getBoundingClientRect().toJSON();return {viewport:innerWidth,doc:document.documentElement.scrollWidth,host:box(h),hero:box(hero),days:box(rail),hours:box(hours),heroOverflow:hero.scrollWidth-hero.clientWidth,hourOverflow:hours.scrollWidth-hours.clientWidth,dayCount:rail.children.length,visibleRetired:[...document.querySelectorAll("[data-faro-ui-retired]")].filter(e=>getComputedStyle(e).display!=="none").length}});
       assert.ok(geometry.doc<=width+2,"Page overflow "+JSON.stringify({engine,region,theme,width,scale,geometry}));
       assert.ok(geometry.host.left>=-2&&geometry.host.right<=width+2&&geometry.hero.width>=geometry.host.width*.98,"Console not fitted");
       assert.ok(geometry.days.bottom<=geometry.hero.top+2&&geometry.hours.top>geometry.hero.top&&geometry.hours.bottom<=geometry.hero.bottom+2,"Day rail above hero; hours inside");
       assert.ok(geometry.heroOverflow<=2&&geometry.hourOverflow<=2,"Internal overflow");
       assert.equal(geometry.dayCount,7);assert.equal(geometry.visibleRetired,0);
       const hierarchy=await page.evaluate(()=>{const r=document.querySelector("#faroSharedConsole").shadowRoot,h=r.querySelector(".hero"),w=h.querySelector(".window"),s=h.querySelector(".scoreline strong");return {timeSize:parseFloat(getComputedStyle(w).fontSize),scoreSize:parseFloat(getComputedStyle(s).fontSize),timeFirst:!!(w.compareDocumentPosition(s)&Node.DOCUMENT_POSITION_FOLLOWING),prepInHero:!!h.querySelector(".prep"),actionsInHero:!!h.querySelector(".actions"),hasPrep:!!r.querySelector(".local-read .kit"),hasActions:!!r.querySelector(".local-read .actions")};});
       assert.ok(hierarchy.timeFirst&&hierarchy.timeSize>hierarchy.scoreSize,"Window must precede and visually outweigh the numerical score");
       assert.ok(!hierarchy.prepInHero&&!hierarchy.actionsInHero&&hierarchy.hasActions,"Secondary tools do not compete inside the hero");
       const visual=await page.evaluate(()=>{const r=document.querySelector("#faroSharedConsole").shadowRoot,day=r.querySelector(".days button[data-scored]"),mark=r.querySelector(".beacon svg"),read=r.querySelector(".hero .read"),update=r.querySelector(".update");return {scoreBg:day?getComputedStyle(day.querySelector("strong")).backgroundColor:null,bar:day?getComputedStyle(day,"::after").backgroundColor:null,score:day?getComputedStyle(day.querySelector("strong")).color:null,mark:!!mark,core:!!r.querySelector(".beacon .pulse"),beam:!!r.querySelector(".beacon .beam"),dock:update.parentElement.classList.contains("context"),read:!!read,reduced:mark?getComputedStyle(mark).animationName:null}});
       assert.ok(visual.mark&&visual.core&&visual.beam&&visual.dock&&visual.read,"Visual identity missing");assert.equal(visual.reduced,"none","Reduced motion respected");
       const optics=await page.evaluate(()=>{const b=document.querySelector("#faroSharedConsole").shadowRoot.querySelector(".beacon"),m=getComputedStyle(b.querySelector("svg"));return {filter:m.filter,opacity:Number(m.opacity),halo:getComputedStyle(b,"::after").filter,core:getComputedStyle(b.querySelector(".pulse")).filter}});
       assert.match(optics.filter,/^blur\(/,"Submerged logo uses static Gaussian blur, not a sharp icon or drop-shadow");assert.ok(optics.opacity>=.4&&optics.opacity<=.65,"Submerged logo retains translucent still frame");assert.match(optics.halo,/^blur\(/);assert.match(optics.core,/^blur\(/);assert.equal(visual.scoreBg,"rgba(0, 0, 0, 0)","Day scores must not be detached pills");assert.equal(visual.bar,visual.score,"Day bar uses the canonical score pigment");
       if(scale===1&&[375,1366,1920].includes(width))await page.screenshot({path:out+"/"+engine+"-"+region+"-"+theme+"-"+width+"-shared.png",fullPage:true});
      }
     }
     await page.setViewportSize({width:375,height:812});await page.evaluate(()=>document.documentElement.style.removeProperty("font-size"));
     const tools=consoleHost.locator(".week-tools");await tools.waitFor({state:"visible"});
     const beforeScroll=await consoleHost.locator(".days").evaluate(el=>el.scrollLeft);
     await consoleHost.locator('[data-key="next-day"]').click();
     await page.waitForFunction(()=>document.querySelector("#faroSharedConsole").shadowRoot.querySelector(".days").scrollLeft>0);
     assert.ok(await consoleHost.locator(".days").evaluate(el=>el.scrollLeft)>beforeScroll,"Day navigation is usable without a swipe");
     if(region==="cl"){
      assert.equal(await page.locator("#dailyOverview").isVisible(),false,"Duplicate daily overview retired");
      assert.equal(await page.locator("#faroHourlyPreview").isVisible(),false,"Duplicate selected-window card retired");
      assert.ok(await consoleHost.locator(".local-read .interpretation").count(),"Unique local interpretation retained");
      await consoleHost.locator('[data-key="explore"]').click();
      assert.equal(await page.locator("#coastMapExpand").evaluate(el=>el.open),true,"Hero map action opens the actual disclosure");
      await consoleHost.locator('[data-key="details"]').click();
      assert.equal(await page.locator("#sessionDetailExpand").evaluate(el=>el.open),true,"Preparation action opens actual session kit");
      await consoleHost.locator('[data-key="dna"]').click();
      assert.equal(await page.locator("#spotInsightExpand").evaluate(el=>el.open),true,"Spot DNA remains reachable");
     }
     await page.setViewportSize({width:1366,height:1000});await page.evaluate(()=>document.documentElement.style.removeProperty("font-size"));
     await page.emulateMedia({reducedMotion:"no-preference"});await page.evaluate(()=>{window.faroBeaconBefore=document.querySelector("#faroSharedConsole").shadowRoot.querySelector(".beacon svg")});
     await consoleHost.locator(".days button").nth(1).click();assert.equal(await consoleHost.locator(".days button").nth(1).getAttribute("aria-pressed"),"true");
     assert.ok(await page.evaluate(()=>{const r=document.querySelector("#faroSharedConsole").shadowRoot,b=r.querySelector(".beacon"),mark=b.querySelector("svg");return mark===window.faroBeaconBefore&&[getComputedStyle(b,"::before"),getComputedStyle(b,"::after"),getComputedStyle(b.querySelector(".pulse")),getComputedStyle(b.querySelector(".beam")),getComputedStyle(mark)].every(s=>s.animationDuration==="5.4s"&&s.animationName!=="none")}),"Five animated layers survive selection without resetting the beacon");
     const next=consoleHost.locator(".hours button").filter({has:page.locator("strong", {hasNotText:"—"})}).first();
     await next.click();assert.equal(await next.getAttribute("aria-pressed"),"true");
     assert.equal(await getScore(),await next.locator("strong").textContent(),"Hero and selected window use same score");
     const select=consoleHost.locator("select");const options=await select.locator("option").allTextContents();assert.ok(options.length>1);
     await select.selectOption({index:1});await page.waitForFunction(()=>document.querySelector("#faroSharedConsole")?.shadowRoot?.querySelectorAll(".days button").length===7);
     assert.equal(await select.locator("option:checked").textContent(),options[1]);
     assert.ok((await consoleHost.locator(".location").textContent()).length>0);
     await page.locator("#languageToggle").click();await page.waitForFunction(()=>document.querySelector("#faroSharedConsole")?.shadowRoot?.querySelector(".layout")?.lang==="en");
     assert.equal(scriptErrors.length,0,"Page errors "+JSON.stringify(scriptErrors));
     console.log("PASS shared console",engine,region,theme,"7 widths x 3 font scales and interaction");
    }catch(e){errors.push({engine,region,theme,error:String(e),scriptErrors});console.error("FAIL shared console",engine,region,theme,String(e));await page.screenshot({path:out+"/"+engine+"-"+region+"-"+theme+"-shared-failure.png",fullPage:true}).catch(()=>{})}
    finally{await ctx.close()}
   }
  }
 }finally{await browser.close()}
}
assert.deepEqual(errors,[],"Shared production-entry responsive and interaction QA failed");
