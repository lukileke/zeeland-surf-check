# FARO Chile · Alertas, riesgo modelado y radiación UV
**26 octubre 2026 · Región piloto de Valparaíso**

## Regla no negociable
**Un modelo meteorológico no es un aviso oficial.** El estado oficial permanece `not_checked` hasta que FARO consulte, interprete y timestampée una fuente autorizada. La ausencia de avisos obtenidos jamás se traduce en «no hay alertas». El modelo tampoco evalúa corrientes de retorno, acceso legal, estabilidad del banco, calidad del agua, anomalías de mareas costeras ni evacuaciones.

## Implementado en la primera vista chilena
La sección de alertas permanece en un **renglón compacto** y abre, al tocarlo, los detalles y enlaces oficiales. El usuario no debe desplazar toda la pantalla por un aviso predeterminado.

FARO calcula un **cribado de condiciones modeladas**, parametrizable en [`valparaiso-live.config.json`](valparaiso-live.config.json). Detecta en las próximas **48 h localizadas en America/Santiago**, desde el momento actual:
- Rachas ≥ 55 km/h: *precaución*; ≥ 75 km/h: *riesgo alto*.
- Viento medio ≥ 55 km/h: *riesgo alto*.
- Códigos de tormenta eléctrica WMO 95–99: *riesgo alto*.
- Lluvia intensa ≥ 15 mm en una hora o ≥ 40 mm en un día: *precaución*.
- Si faltan datos, mostrar *sin evaluación* y enlaces. Ninguno de estos son umbrales oficiales chilenos.
- Las **ventanas con señales de riesgo alto del modelo no se recomiendan** en «mejor hora» ni en «Lo mejor», pero siguen disponibles para inspección manual con advertencia.

## Fuentes oficiales (links de consulta; no sincronización automática)
1. [Armada de Chile · Servicio Meteorológico](https://meteoarmada.directemar.cl/) — avisos de marejadas, viento fuerte y temporales marítimos; ámbito geográfico y vigencia propios de cada aviso.
2. [SENAPRED · Alertas nacionales](https://senapred.cl/alertas/) — alertas preventivas, amarillas y rojas por territorio y fecha, no todas son meteorológicas.
3. [Dirección Meteorológica de Chile](https://www.meteochile.gob.cl/PortalDMC-web/index.xhtml) — avisos, alertas y alarmas por zonas, incluida Valparaíso. Su ámbito no siempre coincide con un spot.
4. [DMC · Pronóstico de índice UV](https://www.meteochile.gob.cl/PortalDMC-web/otros_pronosticos/radiacion_uv.xhtml) — referencia oficial para corroborar el UV.

**No existe un conector comprobado de estos boletines en FARO hoy.** Primero investigar API pública, RSS o licencia/permiso para procesamiento automático. No asumir que se pueden obtener avisos vigentes simplemente consultando una portada HTML sin control de actualización, zona y retiro del aviso. No hacer scraping sin verificar términos.

## Radiación UV
FARO presenta el **UV horario modelado** de Open-Meteo, no el valor observado en una estación DMC.
Clasificación UVI según OMS:
- 0–2: bajo
- 3–5: moderado
- 6–7: alto
- 8–10: muy alto
- 11+: extremo

La protección solar está recomendada desde **UV ≥ 3**. El riesgo UV no modifica directamente la puntuación de calidad del surf: es una dimensión de salud independiente, visible en «Antes de ir» y el detalle técnico. El color UV tiene escala propia y no se confunde con los cinco colores del score FARO.

Referencias: [OMS · UV](https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation), [DMC · Índice UV](https://www.meteochile.gob.cl/PortalDMC-web/otros_pronosticos/radiacion_uv.xhtml), [Open-Meteo](https://open-meteo.com/en/docs).

## Pendientes (prioridad de implementación)
**P0** Comprobar disponibilidad y derechos de un feed de alertas oficial estructurado para Armada, DMC y SENAPRED. Diseñar estado `unknown/checked/stale`, identificador, territorio, tipo, severidad oficial, `issuedAt`, `validFrom/To` y enlace.
**P1** Combinar mensajes de varios organismos sin duplicarlos, con cobertura especial para Valparaíso continental vs Juan Fernández vs Rapa Nui y sin confundir aviso marítimo con alerta meteorológica.
**P1** Implementar almacenamiento/cache y verificación automática con expiración; alertas retiradas deben desaparecer, pero no por error de red.
**P2** Vincular marejadas a elementos costeros verificables sin inferir que una gran ola offshore implica marejada oficial, y sin convertir un score de surf alto en permiso de entrada.
**P2** Contrastar UV horario con valores DMC cuando sea técnica y legalmente posible; documentar sesgo del modelo.
