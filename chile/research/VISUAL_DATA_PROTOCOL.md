# FARO · Protocolo de fuentes audiovisuales y alineamiento oceanográfico
Fecha: 26-10-2026 · Estado: protocolo de recopilación, **sin vídeos externos copiados ni entrenamiento visual**.

## Inventario verificable
- `visual-source-registry.v1.json` separa permisos de visualización, uso para análisis manual y entrenamiento; una cámara pública **no** pasa a ser reutilizable por ser gratuita.
- `visual-observations.v1.csv` contiene **solo cabeceras**, sin fabricar medidas ni clips. Cada fila futura tendrá identificador, hora UTC y procedencia.
- Las dos cámaras de La Boca (Lineup) requieren una cuenta o suscripción, según el ángulo, y autorización expresa para uso derivado. No iniciar automatización, grabación ni descarga de material Lineup bajo su licencia personal/no comercial. Fuentes: https://lineup.surf/es/faq y https://lineup.surf/terms-of-use.
- Nodo Costero La Boca de Universidad de Valparaíso: pronóstico numérico a ~20 m de profundidad, **no es vídeo ni observación directa de rompiente**. https://marejadas.uv.cl/CL15CCN01
- Dataset VWBT_9000: 9.000 clips de 30 s, 15 cámaras, 6 sitios, 3 clases; la publicación documenta `Set_A`, `Set_B`, y el CSV `ERA5_offshore_wave_wind_by_clip.csv`. Permiso específico de medios Figshare todavía por verificar. https://doi.org/10.6084/m9.figshare.28814993
- USGS P13EOBZQ y Coast Train: imágenes costeras etiquetadas, CC0. Útiles para segmentación y preentrenamiento, **no** prueban predicción del rompiente chileno y no se deben contar como clips de La Boca. https://doi.org/10.5066/P13EOBZQ y https://doi.org/10.5066/P91NP87I

## Plan de datos para La Boca (antes de calibrar un score)
1. Obtener licencia por escrito de cámara/propietario o material grabado por un colaborador con consentimiento; registrar texto de autorización, fecha, alcance comercial, retención, ubicación y posibilidad de entrenar.
2. Definir punto de cámara fijo, azimut y campo visual, exposición y visibilidad. Evitar o anonimizar rostros, matrículas y elementos identificables. No guardar audio irrelevante.
3. Etiquetar intervalos completos, también condiciones malas: UTC inicial y final, cantidad de olas visibles, `spilling/plunging/surging/mixed/unknown`, cierres, duración de pared útil, incertidumbre y motivo de baja visibilidad. La altura de cara se anota **solo** con escala calibrada.
4. Registrar pronóstico **emitido antes del evento** con versión de modelo y hora de validez, no hindcast retrospectivo presentado como acierto predictivo. Mantener variables offshore separadas de altura real al romper.
5. Asignar dos revisores independientes para un subconjunto y resolver discrepancias. Separar entrenamiento/validación/prueba por **cámara y episodio de swell**, no por fotogramas al azar. Comparar con persistencia y reglas físicas básicas.
6. Antes de integrar a producción, evaluar error MAE cuando proceda, precisión por clase y por cámara, calibración/confianza, rendimiento con niebla/noche y sensibilidad a cambios del banco. Mantener el score público experimental hasta que la comparación local supere un baseline.

## Integridad y seguridad
- `trainingAllowed: true` del registro es condición necesaria, pero se deben volver a comprobar metadatos/licencias del fichero particular antes de entrenar.
- El conjunto actual contiene **0 vídeos locales observados y 0 vídeos descargados**. Los recuentos publicados de VWBT_9000 son externos, no 9.000 clips ingeridos.
- Es imposible afirmar que FARO conoce la forma de La Boca hasta contar con vídeos localmente autorizados y validación inter-episodio.
- Mantener los datos visuales brutos fuera de GitHub público, usar manifiestos con identificadores no personales, y separar claramente score experimental / modelo offshore / medición de vídeo.

## Próximo conjunto de datos útil
Una tabla por ventana de 30 s–2 min vinculada con pronóstico oceánico congelado, condiciones de viento de la misma hora, marea (fuente y datum verificados), cámara y doble etiqueta humana. Después, un dataset multi-episodio con semanas retenidas para prueba prospectiva.
