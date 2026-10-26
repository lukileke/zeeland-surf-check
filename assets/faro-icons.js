/* FARO designer-owned icon registry, Zeeland + Chile.
 * No emoji or developer-drawn placeholder. Pending SVG = text-only UI.
 * When Maria supplies SVG, set manifest status "ready".
 */
(function(root){"use strict";
 const script=document.currentScript;
 const rootUrl=new URL("./",script?.src||document.baseURI);
 const registryUrl=new URL("faro-icon-manifest.json",rootUrl);
 let registry=new Map(),ready=false;
 const seen=new WeakMap();
 function paint(container){
  for(const node of [...container.querySelectorAll?.("[data-faro-icon]")||[]]){
   const name=node.getAttribute("data-faro-icon"),asset=registry.get(name);
   if(seen.get(node)===name)continue;
   seen.set(node,name);node.classList.add("faro-icon-slot");
   // Non-graphical fallback: text label lives next to the slot.
   node.replaceChildren();
   node.setAttribute("aria-hidden","true");
   if(!asset||asset.status!=="ready"||!asset.file){node.hidden=true;continue}
   node.hidden=false;
   const img=document.createElement("img");img.alt="";img.loading="lazy";img.decoding="async";
   // Only URL-literal paths from the same repository manifest are supported.
   if(!/^assets\/icons\/[a-z0-9-]+\.svg$/.test(asset.file)){node.hidden=true;continue}
   img.src=new URL("../"+asset.file,rootUrl).toString();
   img.addEventListener("error",()=>{node.hidden=true},{once:true});
   node.append(img);
  }
 }
 async function init(){
  try{
   const response=await fetch(registryUrl,{cache:"no-cache"});
   if(response.ok){
    const data=await response.json();
    if(Array.isArray(data.icons))registry=new Map(data.icons.map(x=>[x.id,x]));
   }
  }catch(error){/* Website remains fully useful with text-only controls. */}
  ready=true;paint(document);
  const observer=new MutationObserver(records=>{
   const roots=new Set();
   for(const r of records){
    if(r.type==="attributes")roots.add(r.target);
    else for(const node of r.addedNodes)if(node.nodeType===1)roots.add(node);
   }
   for(const node of roots){
    if(node.matches?.("[data-faro-icon]")){ // standalone slot
     // Paint live attached node using parent traversal.
     paint(node.parentElement||document);
    }else paint(node);
   }
  });
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["data-faro-icon"]});
 }
 root.FaroIcons=Object.freeze({refresh:()=>paint(document),getStatus:id=>registry.get(id)?.status||"unknown"});
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else void init();
})(typeof window!=="undefined"?window:globalThis);
