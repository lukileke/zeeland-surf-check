/* FARO · region adapter for the common experimental offshore response.
 * Zeeland's starting priors are derived from the legacy orientation and area
 * reference heights/periods, NOT from calibrated surf observations.
 * This is an opt-in research preview. Do not replace production rankings
 * or compare regions as measured surf quality until data/validation align. */
(function(root){
"use strict";
const finite=Number.isFinite;
const wrap=d=>(d%360+360)%360;
const band=(center,half)=>[wrap(center-half),wrap(center+half)];
function zeeland(input,orientation,reference,shared,engine=root.FaroChileScoreLab){
 if(!engine?.potentialScore||!shared||!reference||
 ![orientation,reference.min,reference.ideal,reference.periodMin,reference.periodIdeal,
 input?.swellHeightM,input?.swellPeriodS,input?.swellFromDeg,input?.windKmh,input?.windFromDeg].every(finite)||
 reference.min<=0||reference.ideal<=0||reference.periodMin<=0||reference.periodIdeal<=0||
 input.swellHeightM<0||input.swellPeriodS<=0||input.windKmh<0)return null;
 // The old linear direction fit scored >=8/10 within 30° (swell)
 // and 36° (wind). Reuse those as provisional full-fit guide sectors.
 const profile={waveFromDeg:[band(orientation,30)],windFromDeg:[band(orientation+180,36)]};
 // Anchor the common exponential response at 80% of the legacy area's
 // reference H²T. Anchor the energy gate at its historical minimum H²T.
 // Different regional priors, exactly the same response equation as Chile.
 const H={...shared,
  energyResponseScaleM2S:reference.ideal**2*reference.periodIdeal/Math.log(5),
  minimumEnergyGateM2S:reference.min**2*reference.periodMin};
 const science=engine.potentialScore(input,profile,H);
 if(!finite(science?.unrounded))return null;
 return {potential:Math.round(Math.max(0,Math.min(10,science.unrounded))*10)/10,modelVersion:'faro-spot-response-v0.4',
  responseScaleM2S:H.energyResponseScaleM2S,minimumGateM2S:H.minimumEnergyGateM2S,
  evidence:"legacy-profile-derived-uncalibrated",validated:false};
}

function chile(input,config,spotId,engine=root.FaroChileScoreLab){
 if(!engine?.evaluate||!config||!input)return null;
 const profile=config.profiles?.[spotId];if(!profile)return null;
 const result=engine.evaluate(config,spotId,input);
 return finite(result.score)?{potential:result.score,modelVersion:result.indexVersion,evidence:"local-guide-derived-uncalibrated",validated:false}:null;
}
function report(input,response,thermalInput,physics=root.FaroChilePhysicsLab,thermal=root.FaroThermalGuide){
 const p=input?physics?.evaluate(input):null;
 const rows=p?.systems||[];
 const parts=rows.map(x=>({name:x.name,available:x.available,heightM:x.heightM,periodS:x.periodS,fromDeg:x.fromDeg,proxyM2S:x.proxyM2S}));
 return {modelVersion:"faro-spot-response-v0.4",response:response||null,parts,
  coverage:{primary:parts[0]?.available===true,secondary:parts[1]?.available===true,tertiary:parts[2]?.available===true},
  crossingAngleDeg:p?.crossingAngleDeg??null,windSeaHeightM:finite(input?.windSeaHeightM)?input.windSeaHeightM:null,
  windSeaToTotalHeightRatio:p?.windSeaToTotalHeightRatio??null,
  thermal:thermalInput?thermal?.guide(thermalInput)||null:null,validated:false};
}
function markup(report,locale="es"){
 const es=locale==="es",t=(a,b)=>es?a:b,f=(v,n=1)=>finite(v)?new Intl.NumberFormat(es?"es-CL":"en-GB",{minimumFractionDigits:n,maximumFractionDigits:n}).format(v):"—";
 const cell=(label,value)=>'<div><small>'+label+'</small><strong>'+value+'</strong></div>';
 const parts=[["primary",t("Swell primario","Primary swell")],["secondary",t("Swell secundario","Secondary swell")],["tertiary",t("Swell terciario","Tertiary swell")]];
 const partitionRows=parts.map(([key,label])=>{const p=report?.parts?.find(x=>x.name===key);return '<tr><th scope="row">'+label+'</th><td>'+f(p?.heightM)+'</td><td>'+f(p?.periodS)+'</td><td>'+f(p?.fromDeg,0)+'</td><td>'+f(p?.proxyM2S,2)+'</td></tr>'}).join("");
 const response=report?.response,wear=report?.thermal,score=finite(response?.potential)?f(response.potential)+"/10":"—";
 return '<section class="faro-common-science" aria-label="'+t("Física y método FARO","FARO physics and method")+'"><header><h4>'+t("Física del oleaje","Ocean physics")+'</h4></header><div class="faro-science-grid">'+
 cell(t("Potencial oceánico experimental","Experimental offshore potential"),score)+
 cell(t("Ángulo entre swells","Swell crossing angle"),finite(report?.crossingAngleDeg)?f(report.crossingAngleDeg,0)+"°":"—")+
 cell(t("Altura de mar de viento","Wind-sea height"),finite(report?.windSeaHeightM)?f(report.windSeaHeightM)+" m":"—")+
 cell(t("Traje orientativo","Wetsuit guidance"),wear?.available?wear.primary+" mm":"—")+
 '</div><div class="faro-science-table"><table><thead><tr><th>'+t("Componente","Partition")+'</th><th>Hs (m)</th><th>T (s)</th><th>'+t("Desde (°)","From (°)")+'</th><th>Hs²T (m²·s)</th></tr></thead><tbody>'+partitionRows+
 '</tbody></table></div><details class="faro-method-note"><summary>'+t("Método y límites","Method & limitations")+'</summary><p>'+t("Misma ecuación FARO v0.4, con parámetros locales sin calibración empírica. Hs²T es un proxy relativo, no potencia medida ni altura de rompiente. Las componentes ausentes no equivalen a cero. El mar de viento se informa por separado; este índice no estima su contribución al surf ni acredita seguridad.","Same FARO v0.4 equation, with locally derived, uncalibrated parameters. Hs²T is a relative proxy, not measured wave power or breaking height. Missing partitions are not zero. Wind sea is shown separately; this index does not estimate its surf contribution or establish safety.")+'</p></details></section>';
}
root.FaroRegionResponse=Object.freeze({zeeland,chile,report,markup});
if(typeof module==="object"&&module.exports)module.exports=root.FaroRegionResponse;
})(typeof globalThis!=="undefined"?globalThis:this);
