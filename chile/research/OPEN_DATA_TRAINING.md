# FARO · Aprendizaje con datos reales, límites y hoja de validación
**Estado:** investigación no desplegada. Fecha: 26-10-2026.

## Qué entrenamos de verdad
**Primera tarea supervisada:** predecir la *altura significativa medida por una boya dentro de 3 horas*, a partir de las últimas 4 horas medidas, período medio y direcciones medidas de viento/olas. `train_ndbc_observation.py` descarga lecturas reales de las estaciones NOAA NDBC [46026](https://www.ndbc.noaa.gov/data/realtime2/46026.txt) y [46042](https://www.ndbc.noaa.gov/data/realtime2/46042.txt), ambas en la costa de California. NOAA es un servicio gubernamental público, y estas boyas **NO están frente a La Boca, Reñaca o Zeeland**.

Entrenamos dos regresiones ridge por estación, con estándar de fecha UTC, máscara de valores `MM`, ángulos por sen/cos y control de valores físicamente imposibles. Objetivo: WVHT observada a +3 h. Se separan entrenamiento (65 %), validación (15 %), pruebas futuras (20 %) con un margen mínimo de 24 h a ambos lados de cada corte, para reducir *leakage* temporal. Se evalúa MAE y RMSE contra:
- **Persistencia**: asumir misma altura que la observada ahora.
- **Media histórica de entrenamiento**: línea base constante.

Si ridge pierde contra persistencia, el resultado lo indica, sin «porcentaje de acierto» publicitario. Los parámetros permanecen en rama de investigación `faro-research-data` y nunca afectan scores públicos ni FARO VIBE. Se programó una ejecución semanal adicional para recoger nuevos datos. La serie en vivo contiene aproximadamente 45 días recientes, así que **esto no es todavía una validación multianual estacional**.

## Qué NO demuestra el experimento
- No aprende altura de rompiente ni batimetría de bancos.
- No aprende qué olas son «glassy», surfeables ni si cierran en La Boca.
- No corrige el error del proveedor Open-Meteo porque predice observaciones futuras usando **observaciones pasadas**, no las versiones archivadas de modelos de Open-Meteo.
- No constituye un modelo que pueda competir con un predictor profesional; la habilidad se debe evaluar en nuevos períodos y comparar con persistencia.
- No se ha utilizado ningún vídeo descargado de una cámara ajena, ni entrenado un modelo de visión con ella.

## Fuentes externas investigadas (prioridad y uso legítimo)
| Proyecto | Licencia verificada | Datos | Uso FARO |
|---|---|---|---|
| [NOAA NDBC](https://www.ndbc.noaa.gov/data/realtime2/46026.txt) | Servicio público del gobierno de EE. UU. | Alturas, períodos, vientos medidos | **Etapa 0:** entrenamiento de dinámica temporal de Hs observada, no surf local |
| [USGS P13EOBZQ](https://www.usgs.gov/data/labeled-satellite-imagery-training-machine-learning-semantic-segmentation-models-coastal) | **CC0 1.0** verificado | Imágenes satelitales etiquetadas agua/espuma-surf/sedimento/otros, hasta 428 MB en RGB | **Etapa 1:** futura segmentación experimental de espuma y agua. Es vista satelital, no webcam a nivel de playa. Su tamaño y estructura requieren descarga y estudio específico |
| [VWBT_9000](https://doi.org/10.6084/m9.figshare.28814993) | **Pendiente verificar licencia del conjunto Figshare**; licencia CC BY-NC-ND del artículo NO equivale a licencia reutilizable del dataset | 9.000 clips etiquetados por spilling/plunging/surging y 15 cámaras | **Etapa 2:** probar clasificador de tipo de rompiente en vídeos de distintas costas cuando esté aclarado el permiso de entrenamiento |
| [Dryad Robertson et al. 2026](https://doi.org/10.5061/dryad.3ffbg79w1) | Verificar derechos de fotos/derivados y código si se reutilizan | Más de 100 GB de flume / YOLO-RF, código y outputs etiquetados | **Etapa 2:** transferencia de categorías de *breaking* con dominio diferente (flume) |
| [Bath LiDAR](https://researchdata.bath.ac.uk/540/) | **CC BY 4.0** | 116 olas medidas mediante LiDAR | **Etapa 1:** estudio físico de breaking, sin vídeo propio de La Boca |
| [UV Marejadas](https://marejadas.uv.cl/CL15CCN01) | Acceso público para lectura, términos numéricos por confirmar | Modelo costero a ~20 m La Boca/Reñaca | **Etapa 3:** observación local con contrato de datos |
| [Marejadas UV Reñaca YouTube](https://www.youtube.com/watch?v=NomqMgWrVlY) | Vista pública, NO verificada licencia de descarga o entrenamiento | Publicación de cámara universitaria | Solo *viewing* y anotación manual apropiada hasta contar con autorización expresa |

## Arquitectura para modelo útil de surf
1. **L0, hoy:** guardar predicciones de Open-Meteo *tal como estaban antes* de observar una ola (`faro-research-data`).
2. **L1, en entrenamiento:** habilidad temporal oceánica en un experimento externo (NOAA), y aprender las limitaciones.
3. **L2:** primera segmentación espuma/agua a partir de CC0 USGS, con test por escena/cámara y control de licencia. No convertir el área blanca satelital en «closeout».
4. **L3:** vídeos costeros licenciados + anotaciones humanas independientes (olas/10 min, campanas, paredes abiertas, duración, dirección aparente, banco y visibilidad).
5. **L4:** cruzar las observaciones con predicciones marinas **emitidas/archivadas antes**, mareas bien referenciadas y descripciones Spot DNA. Evaluar por evento de swell completo, mantener test futuro, comparación contra score simple y baseline de persistencia.
6. **L5:** únicamente cuando la habilidad sea superior a un baseline, publicar FARO READ/score locales. El error estadístico va al apartado discreto de metodología, no sobre cada tarjeta.

## Reproducción del entrenamiento
```sh
python chile/research/test_ndbc_observation.py
python chile/research/train_ndbc_observation.py --output /tmp/observed-height-model.json
```
El segundo comando requiere Internet y trae **mediciones reales**. GitHub Actions `FARO real ocean-observation model research` corre automáticamente al integrar cambios en `main` y cada lunes; guarda artefacto y copia de métricas en la rama `faro-research-data`. El JSON incluye fechas, estaciones, N de muestras, MAE/RMSE observados, baseline, `researchOnly:true`, `deployed:false`, `cameraModelTrained:false`. Si los datos no bastan, saldrá `insufficient_real_samples`, sin fabricar un resultado.

**Regla de publicación:** nadie podrá afirmar que FARO «predice La Boca con X % de precisión» hasta tener pares validados de esa playa. Esta primera etapa demuestra infraestructura y aprendizaje oceanográfico genérico, no surfabilidad.
