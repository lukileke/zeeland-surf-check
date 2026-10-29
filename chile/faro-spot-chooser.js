/* FARO Chile spot chooser.
 * Render custom, accessible options instead of the browser's unthemed white
 * pop-up on dark backgrounds. Existing select remains the sole model value:
 * URL deep links, map selection and Playwright change events still work.
 * No external UI libraries or stored duplicate selection state.
 */
(function(root){
"use strict";
function mount({select,button,panel,getLang=()=> "es"}){
 if(!select||!button||!panel)throw Error("Missing FARO spot chooser elements");
 const host=button.closest(".faro-spot-choice");
 if(!host)throw Error("Missing chooser host");
 let isOpen=false;
 const options=()=>Array.from(panel.querySelectorAll('[role="option"]'));
 function sync(){
  const selected=select.selectedOptions?.[0];
  const label=button.querySelector(".faro-spot-choice-text");
  if(label)label.textContent=selected?.textContent||"—";
  for(const node of options()){
   const active=node.dataset.value===select.value;
   node.setAttribute("aria-selected",String(active));
   node.classList.toggle("is-current",active);
  }
  button.setAttribute("aria-label",
   (getLang()==="en"?"Choose beach: ":"Seleccionar playa: ")+(selected?.textContent||"—"));
 }
 function focusItem(node){
  if(!node)return;
  node.focus({preventScroll:true});
  // Only move the popover scroll position; never scroll the page.
  const y=node.offsetTop-panel.offsetTop;
  if(y<panel.scrollTop)panel.scrollTop=y;
  if(y+node.offsetHeight>panel.scrollTop+panel.clientHeight)
   panel.scrollTop=y+node.offsetHeight-panel.clientHeight;
 }
 function close({focus=false}={}){
  if(!isOpen)return;
  isOpen=false;panel.hidden=true;
  button.setAttribute("aria-expanded","false");host.classList.remove("is-open");
  if(focus)button.focus({preventScroll:true});
 }
 function open({first=false,last=false}={}){
  if(isOpen)return;
  isOpen=true;panel.hidden=false;
  button.setAttribute("aria-expanded","true");host.classList.add("is-open");
  const all=options();
  focusItem(first?all[0]:last?all[all.length-1]:
   all.find(x=>x.dataset.value===select.value)||all[0]);
 }
 function commit(id){
  if(!Array.from(select.options).some(o=>o.value===id))return;
  if(select.value!==id){
   select.value=id;
   select.dispatchEvent(new Event("change",{bubbles:true}));
  }
  sync();
  close({focus:true});
 }
 function refresh(){
  close();
  panel.replaceChildren();
  for(const choice of Array.from(select.options)){
   const item=document.createElement("div");
   item.className="faro-spot-choice-item";
   item.setAttribute("role","option");item.setAttribute("tabindex","-1");
   item.dataset.value=choice.value;
   item.textContent=choice.textContent;
   item.addEventListener("click",()=>commit(choice.value));
   item.addEventListener("pointermove",()=>{
    // Keep mouse movement from stealing keyboard focus until user clicks.
    item.classList.add("has-pointer");
   });
   panel.append(item);
  }
  panel.setAttribute("aria-label",getLang()==="en"?"Beach and surf break":"Playa o spot de surf");
  sync();
 }
 button.addEventListener("click",()=>isOpen?close():open());
 button.addEventListener("keydown",e=>{
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){
   e.preventDefault();open({last:e.key==="ArrowUp"});
  }else if(e.key==="Home"){e.preventDefault();open({first:true})}
  else if(e.key==="End"){e.preventDefault();open({last:true})}
  else if(e.key==="Escape"){close()}
 });
 panel.addEventListener("keydown",e=>{
  const all=options(),index=Math.max(0,all.indexOf(document.activeElement));
  if(e.key==="Escape"){e.preventDefault();close({focus:true})}
  else if(e.key==="Tab"){close()}
  else if(e.key==="ArrowDown"||e.key==="ArrowUp"||e.key==="Home"||e.key==="End"){
   e.preventDefault();
   const next=e.key==="Home"?0:e.key==="End"?all.length-1:
    (index+(e.key==="ArrowDown"?1:-1)+all.length)%all.length;
   focusItem(all[next]);
  }else if(e.key==="Enter"||e.key===" "){
   e.preventDefault();
   const focused=all.find(x=>x===document.activeElement);
   if(focused)commit(focused.dataset.value);
  }else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
   const ch=e.key.toLocaleLowerCase();
   const match=all.slice(index+1).concat(all.slice(0,index+1))
    .find(x=>x.textContent.toLocaleLowerCase().startsWith(ch));
   if(match){e.preventDefault();focusItem(match)}
  }
 });
 select.addEventListener("change",()=>{sync();close()});
 document.addEventListener("pointerdown",e=>{
  if(isOpen&&!host.contains(e.target))close();
 });
 document.addEventListener("focusin",e=>{
  if(isOpen&&!host.contains(e.target))close();
 });
 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&isOpen)close({focus:true});
 });
 refresh();
 return Object.freeze({refresh,sync,close,get isOpen(){return isOpen}});
}
root.FaroChileSpotChooser=Object.freeze({mount});
if(typeof module==="object"&&module.exports)module.exports={mount};
})(typeof window!=="undefined"?window:globalThis);
