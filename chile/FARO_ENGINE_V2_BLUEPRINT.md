# FARO · Forecast Engine v2 (investigación y especificación)
**26 octubre 2026 · Valparaíso piloto: La Boca → Reñaca.** Zeeland mantiene la UX canónica. Este documento es una **especificación de investigación**, no un anuncio de exactitud validada.

## Qué está mal en el prototipo
El motor actual `valparaiso-score-lab.js` combina cinco coeficientes manuales: dirección viento (0,28), dirección swell (0,28), intensidad viento (0,19), período (0,17), presencia de swell (0,08). Luego multiplica por un limitador de altura offshore y trunca a 7,9/10. El 7,9 es arbitrario y **no expresa confianza**. `Live.vibe()` clasifica carácter con un puñado de umbrales generales; puede confundir `glassy` con rompiente ordenada, y omite la interacción entre swell primario/secundario, mareas y orientación de cada banco. Las coordenadas actuales son **referencias costeras**, no picos georreferenciados. El modelo no dispone de observaciones locales para verificar calidad surf.

### Contrato de honestidad
- Un oleaje oceánico `Hs` NO es la altura de cara de una ola que rompe.
- `swell_wave_period` del API NO es necesariamente el período energético espectral `Te`. NO publicar potencia en kW/m calculando `0,49 Hs² × T` a partir de cualquier período.
- "Modelo recién consultado" NO significa observación en directo ni salida de un modelo de olas rompientes.
- Un buen score NO demuestra seguridad; corrientes, accesos, rescate, contaminación y alertas oficiales se evalúan por separado.
- "Promising β" mezclaba una etiqueta de potencial con metadata experimental. Ninguno equivale a calidad observada.

## Arquitectura recomendada (orden de construcción)

### L0 · Ingesta y contrato de datos
Open-Meteo Marine + Weather con tiempos absolutos UTC, IANA `America/Santiago`, modelo/grid identificado, fecha de emisión si está disponible y valor válido por hora. Forzar `null` ante datos incompletos. Guardar `forecast_run_id`, `issued_at` y los datos **tal como se predijeron ANTES de la observación** en una base de datos/histórico propio si los derechos de uso lo permiten. Actualmente `issueAt` es `null`, no debe confundirse con `fetchedAt`. Seleccionar y registrar los modelos marinos deliberadamente: el modo "best match" puede variar por región/variable y no es una especificación fija de proveedor.

### L1 · Física oceánica cuantificada, todavía no rompiente
Mantener **particiones** primario, secundario y terciario: `H_i`, `T_i`, `fromDeg_i`, `model/source`, `missing`. El proxy `E_i^*=H_i²×T_i` (m²·s) informa la distribución relativa del potencial de swell **solo cuando estén disponibles todas las particiones necesarias y se conozca qué período provee el modelo**. No llamarlo energía medida ni potencia real. Evaluar diferencia angular circular entre sistemas; la presencia de swells cruzados no es necesariamente mala. Separar mar de viento (`wind_wave_height`), rachas, dirección DESDE, persistencia de viento durante horas previas (si existiesen datos horarios válidos) y estado cambiante, no solo una foto instantánea.

El prototipo aislado `faro-physics-lab.js` únicamente extrae estos **features físicos modelados** y rechaza crear `predictedSurfQuality`, altura rompiente o probabilidad de confianza. Sus pruebas muestran invariantes y manejo de ausencia de datos; **no validan la física local**.

### L2 · Transferencia costa / Spot DNA de verdad
Requiere coordenada de **cada rompiente**, azimut/orientación de playa/banco verificado, puntos oceánicos marinos y batimetría fiable, obstáculos/sombra, playa o point/reef, exposición diferencial por dirección, nivel de marea respecto a datum local y, cuando corresponda, caudal/corrientes. Priorizar:
1. La Boca (Concón): desembocadura, bancos móviles, accesos, corriente y zonas ambientales.
2. Reñaca Norte: distinguir picos reales y cambios hacia secciones sur.
3. Ritoque y Maitencillo solo después de establecer sectorización con evidencia.
Usar el modelo costero publicado por Universidad de Valparaíso (~20 m) como **contraste independiente**, no como observación de rompiente. Revisar posibilidad y licencia de acceso numérico/estructurado. Donde la batimetría lo permita, evaluar un modelo anidado **SWAN** o una matriz offline de respuesta direccional obtenida de SWAN: no simular refracción con un multiplicador inventado. SWAN requiere forzantes de contorno espectrales, profundidad, viento y condiciones/calibración.

### L3 · Calidad local / utilidad de sesión
Definir términos separados:
- `offshore_condition`: datos físicos y calidad/ausencia de entrada.
- `nearshore_response`: distribución **estimada** de Hs/dirección a profundidad costera (solo L2 listo).
- `break_surfability`: forma/longitud/coherencia/tamaño rompiente condicionados al banco y la marea, ajustados con observaciones; **no es seguridad**.
- `FARO Match`: interacción con tipo/volumen de tabla, habilidad, estilo y preferencia; no altera `break_surfability`.
- `FARO Worth-the-Drive`: decisión del usuario incorporando distancia, fiabilidad/forecast lead y oportunidad alternativa, nunca identidad física del score.

Evitar score universal fijo antes de calibración; preferir estado explícito `experimental` con etiqueta cualitativa de **señal modelada**. No subir el techo 7,9 por estética. Al validar: comparar desempeño contra baseline, usar escala ordinal estable y publicar el error empírico / periodo de evaluación.

### L4 · Motor de interpretación
La lectura simplificada se deriva de features y evidencia. Ejemplo de motor determinista:
```
MAIN DRIVER = dominant evidence-backed constraint (e.g. strong wind)
VIBE        = 1 concise physically cautious character tag
READ        = 1-2 plain-language sentences: "qué esperar + qué limita"
UNCERTAINTY = actual missing capability, not invented confidence %
NEXT STEP   = best other hour/spot/board, or official notices
```
No generar `Glassy`, `Campana`, `tubera`, `clean` como *hechos observados* desde una sola dirección offshore. `Campana` requiere evidencia local de cierres. Si la predicción del banco no existe, evitar una altura rompiente ficticia.

### L5 · Alertas jurisdiccionales
Máquina de estados independiente: `not_checked`, `checked_with_notices`, `checked_without_notices`, `stale`, `error`; con `source`, `issuedAt`, `validUntil`, `geometry`, `noticeId`, `licence`. El modelo heurístico (`rain/thunder/gusts`) no genera avisos Armada/SENAPRED/DMC. La UI de alerta alta solo aparece ante un **evento detectado**. Cuando no hay señal modelada, un enlace discreto "Revisar avisos oficiales · sin verificar" dentro de **Antes de ir** evita alarmismo sin asegurar ausencia de avisos. Si falta cobertura crítica, declarar `riesgo sin evaluar`.

### L6 · Validación, no precisión decorativa
Construir diario local con observación horaria/sector/tabla/estado de banco/altura cara estimada/forma y variables de pronóstico emitidas **antes** de la sesión. Primeras **30–50 sesiones** de diferentes condiciones sirven para examinar errores y ajustar una hipótesis; NO sustentan automáticamente un modelo complejo ni probabilidades bien calibradas. Expandir por régimen, temporada y spot. Separar train/test temporal por semanas/episodios de swell para evitar fuga temporal. Comparar contra modelo base y categorías cualitativas con MAE/RMSE (altura), error circular (dirección), tasa de acierto ordinal, matriz de confusión y probabilidades con Brier/reliability (solo con tamaño muestral adecuado); analizar casos fallidos, intervalos de predicción y variación con horizonte.

## UX · Menos paneles, más decisión real
Primera pantalla, heredada de Zeeland: **spot + mejor ventana + señal/score honesto + altura offshore explícita + VIBE**. Resumen corto del determinante principal. El usuario toca VIBE para READ y luego Spot DNA / condiciones para técnica y evidencia. **Antes de ir** trae UV, temperatura, neopreno y enlaces de alertas oficiales discretos; solo presentar aviso elevado cuando hay evento real detectado por modelo o aviso oficial consultado y válido. Evitar mostrar el mismo "β", warnings y score varias veces. El error o incertidumbre se revela de modo contextual, no con números arbitrarios.

## Etapas de entrega medibles
- **P0 UX y transparencia:** eliminar β repetida y "Promising" ambiguo; alerta vacía deja de ocupar la jerarquía principal, estado oficial siempre consultable. Probar EN/ES, tema, móvil y peligros simulados.
- **P1 ingeniería instrumental:** guardar forecasts con source/model/issue/valid/UTC y snapshots; features físicos aislados y tests reproducibles; enlaces UV Concón/Reñaca; distinguir model-grid vs break coords.
- **P1 datos geográficos:** polilínea costa, azimut real por sector, profundidad y marea SHOA con datum/licencia. Aún no optimizar ola rompiente sin verificación.
- **P2 coastal engine:** contraste modelo offshore / UV 20 m; SWAN si entradas/licencia/infraestructura lo justifican; estimar errores por escenario.
- **P2 observaciones:** registro de campo y evaluación temporal independiente; migración de etiquetas a probabilidad/score validado solamente cuando haya evidencia.
- **P3 experiencia personalizada:** FARO Match y Worth-the-Drive acoplados a incertidumbre y preferencias, no a riesgos convertidos en score.

## Fuentes y limitaciones
- Open-Meteo Marine API, particiones disponibles según modelo, limitaciones cerca de costa: https://open-meteo.com/en/docs/marine-weather-api
- TU Delft SWAN, modelo espectral costero: https://www.tudelft.nl/citg/over-faculteit/afdelingen/hydraulic-engineering/sections/environmental-fluid-mechanics/research/swan
- NOAA NWPS, esquema offshore WAVEWATCH III → SWAN y condiciones de contorno: https://polar.ncep.noaa.gov/nwps/
- NOAA wave energy report, **Te distinto del Tp** y fuerte variación local: https://spo.nmfs.noaa.gov/sites/default/files/tm92.pdf
- Surfline ratings, diferencia explícita entre model-only vs observación humana: https://support.surfline.com/hc/en-us/articles/35995874238491-Observation-Clarity
- Surfline limitations, tide/banks no capturados en rating básico: https://support.surfline.com/hc/en-us/articles/36277684017819-Surf-Ratings-Colors
- USWDS alerta contextual y evitar exceso de notificaciones: https://designsystem.digital.gov/components/alert/
- Nielsen Norman Group, progressive disclosure: https://www.nngroup.com/articles/progressive-disclosure/

## Política de publicación
Lo implementado en esta iteración **NO mejora aún la exactitud de las olas rompientes**. Mejora honestidad, jerarquía de avisos y crea un laboratorio de variables físicas. Ningún componente no validado se comercializa o presenta como medición local. FARO Chile sigue siendo experimental.
