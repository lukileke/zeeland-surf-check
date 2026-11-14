/* FARO Comfort Guide · empirical decision support, NOT physiological wind chill.
 * Water temperature determines the baseline thickness; air temperature and wind
 * determine a conservative exposure adjustment. No personalised safety guarantee.
 * Source rationale: Rip Curl Wetsuit Temperature & Thickness Guide (2026).
 */
(function(root){
 "use strict";
 const tiers=["1.5–2","3/2","4/3","5/4","6/5"];
 const valid=x=>typeof x==="number"&&Number.isFinite(x);
 function guide({waterC,airC,windKmh}={}){
  if(!valid(waterC)||waterC<0||waterC>35)return Object.freeze({available:false});
  // A modest ordinal exposure penalty, NOT a fictitious thermal sensation °C.
  const coldAir=valid(airC)&&(airC<13?2:airC<17?1:0);
  const windy=valid(windKmh)&&(windKmh>=32?2:windKmh>=20?1:0);
  const exposure=coldAir+windy;
  const base=waterC<9?4:waterC<13?3:waterC<16?2:waterC<20?1:0;
  const main=Math.min(4,base+(exposure>=3?1:0));
  const warm=Math.min(4,main+1);
  return Object.freeze({
   available:true,
   primary:tiers[main],warmer:tiers[warm],
   warmerDistinct:warm!==main,exposure:exposure>=3?"high":exposure>=1?"moderate":"mild",
   waterC,airC:valid(airC)?airC:null,windKmh:valid(windKmh)?windKmh:null,
   accessories:waterC<13,experimental:true
  });
 }
 root.FaroThermalGuide=Object.freeze({guide});
 if(typeof module==="object"&&module.exports)module.exports=root.FaroThermalGuide;
})(typeof window!=="undefined"?window:globalThis);
