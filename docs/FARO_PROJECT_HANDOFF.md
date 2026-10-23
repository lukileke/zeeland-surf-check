# FARO · Proyecto, decisiones y continuidad entre chats

> **Propósito:** documento de continuidad **autoritativo** para seguir trabajando en Faro sin depender de la memoria de ChatGPT o del historial de una conversación muy larga.  
> **Actualizado:** 23 de octubre de 2026.  
> **Repo:** https://github.com/lukileke/zeeland-surf-check  
> **Web:** https://lukileke.github.io/zeeland-surf-check/  
> **ESTADO VERIFICADO EN GITHUB AL REDACTAR:** `index.html` carga `faro-ui.css?v=8` y Google Fonts **Archivo Black + Manrope**. Verificar siempre la versión más reciente del repositorio al retomar.

## 1. Qué es Faro

**Faro** (antes *Zeeland Surf Check*) es una app web de pronósticos para surfistas, inicialmente en la costa de Zeeland, Países Bajos. Su misión **NO** es replicar un panel meteorológico técnico. Debe ayudar a una persona que vive lejos de la playa a decidir rápidamente:

- **¿Vale la pena ir a surfear?**
- **¿A qué playa y spot?**
- **¿Qué día y a qué hora conviene ir?**
- **¿Qué olas y condiciones puedo esperar?**
- **¿Con qué tabla y equipo me conviene ir?**
- **¿Cuáles son las alertas y limitaciones del pronóstico?**

La propuesta de valor es **reducir la incertidumbre y el tiempo de decisión sobre desplazarse hasta la playa**. No usar únicamente la frase “buen surf”: separar **Surf Quality** (calidad modelada para el spot), **Wave Height**, **Board Fit** (afinidad heurística con tabla y estilo) y advertencias de seguridad.

El proyecto es personal, iterativo, aspiracionalmente comercializable; no debe presentarse como predicción calibrada de rompientes, observación de cámaras, pronóstico de mareas, información de corrientes o garantía de seguridad.

## 2. Preferencias centrales del dueño del proyecto

- Trabajamos en **español chileno natural**, sin exceso de tecnicismos de UI en las explicaciones. La app es **bilingüe (EN/ES)**.
- Busca una app **cool, actual, moderna, surfista, relajada y con identidad** sin perder **elegancia, orden ni seriedad**. Ni dashboard corporativo rígido ni estética surf caricaturesca llena de olas y emojis.
- **Jerarquía editorial orgánica**: los ojos deben saber dónde mirar; no muchas tarjetas/colores/títulos que compiten; menos cajas y separaciones duras.
- **Un solo protagonista visual:** la sesión seleccionada con calidad de surf y altura modelada; el selector de días es para comparar y el resumen del día es secundario.
- No repetir una misma puntuación `4.2/10` tres veces con igual importancia. Mantener el score del día en los chips y la puntuación prominente en la sesión, no sobrecargar el resumen del día.
- **Contrastes fuertes y tipografía realmente legible** en ambos temas, especialmente selector **BEACH** / **SURF SPOT**. No texto lavado ni labels diminutos. Las puntuaciones ámbar deben verse claramente distintas de malas rojas/rosadas.
- Mantener **el wavemeter de ocho barras**, score adaptado al spot, tags de carácter de ola y los componentes científicos útiles.
- Preferencia actual: **títulos más destacados, con identidad editorial de marca** y texto/valores más sobrios. Inspiración surf/outdoor y marcas como Firewire, GearFreak y Coastline; no copiar logotipos ni fuentes propietarias.
- Tag `Choppy & Messy` (y otros caracteres) **debe verse como chip/pill** con borde tenue + fondo tonal; usuario detectó que había quedado como texto flotante y pidió restaurarlo.
- Advertencias `CAUTION`: etiqueta + razón visible, explicación desplegable. `DANGER`: más prominente y abierto. Información meteorológica densa (seis métricas) desplegable, igual que metodología.
- Las recomendaciones deben tener **criterio científico, transparencia sobre su origen y limitaciones**. No “inventar” tiempo real ni tendencias a largo plazo.

## 3. Producto existente: tres pestañas

### Forecast (principal)

- Selectores de **Beach** y **Surf Spot**. Zeeland incluye Domburg, Westkapelle, Oostkapelle, Cadzand y Brouwersdam; 12 spots entre las cinco playas.
- Selector horizontal de **7 días**, cada uno con el **mejor score modelado**, texto de calidad (`Very poor / Poor / Fair / Good / Excellent`) y su mejor ventana de dos horas.
- Resumen breve: fecha, nombre de playa/spot, **Best Window**, una frase contextual sobre el principal factor limitante (p.ej., viento fuerte, período corto, olas pequeñas) y horario de luz solar en `<details>`.
- Hero **Your Session**: ventana horaria, **Surf Quality /10**, nivel textual y **Model estimate**, **Wave Height** en m, wavemeter de 8 barras, carácter de ola en tag clicable, periodo y viento.
- Safety: peligro grave visible/expandido; precaución visible con detalles desplegables; no decir “seguro para entrar” por no detectar flags.
- **Before You Go / Session Essentials**: traje sugerido, temperatura del agua, aire y viento; información de equipo expandible.
- **Find Your Time**: comparación por ventanas de 2 horas.
- **Explore the Conditions**: desplegables para factores que explican el score, mediciones modeladas (wave, period, wind, swell/wind directions, rainfall), lluvia/nubosidad/metodología.
- **Wave Wizard**: detalles del carácter de ola. **Spot Insight**: consideraciones de la playa. **What to Wear**: sugerencias de neopreno.
- Reglas de selección: al elegir día/spot, normalmente elegir su mejor ventana válida con luz diurna, salvo una elección explícita desde resultados Wizard/Best of Week. No mostrar puntajes de un spot anterior mientras carga uno nuevo.

### Best of Week

- Destaca **la mejor oportunidad de surf modelada en la semana**, con lugar, ventana, Surf Quality, altura de ola, wavemeter y carácter de ola.
- Compara en segundo plano las **tres mejores playas distintas**; al seleccionar una opción se abre Forecast para ese spot y ventana.
- “Best” es relativo al conjunto disponible y **no implica que el pronóstico sea bueno o que sea seguro**.

### Faro Wizard (Beta)

- Búsqueda guiada de tres pasos: **objetivo** (`qué tabla / cuándo / dónde`), disponibilidad horaria/días y zona geográfica.
- Tiene resultados **Top 3 surf sessions**, diferencia Surf Quality de **Board Fit** y permite volver a Forecast para la ventana propuesta.
- Tablas modeladas: soft-top, longboard, mid-length, shortboard; riding styles incluyen relaxed & flowing, progression/turns, performance y versátil según el flujo.
- **Advanced / Original Board Wizard** sigue bajo `<details>`: no quitarlo sin revisar dependencias.
- Board Fit es heurístico, **no índice de seguridad**; no tiene aún volumen real de tabla, técnica del surfista, ni una calibración personalizada completa.

## 4. Diseño actual y evolución

### Dirección de diseño

Nombre de trabajo: **Faro Coastal Editorial**. Fondo dark carbón/basalto húmedo, modo claro espuma marina azulada, teal oceánico para identidad e interacción, azul para tamaño de ola, tonos semánticos para Surf Quality, colores acotados para carácter de ola y riesgos. Una **sola superficie hero**; los complementos usan líneas discretas y divulgación progresiva.

**Último estado confirmado:**
- `index.html` utiliza **Archivo Black** (Google Fonts, titulares) y **Manrope** (textos/datos/controles). Primero se había evaluado **Barlow Condensed + Manrope**, pero **Archivo Black + Manrope es la elección más reciente**: NO volver a Barlow sin nueva solicitud.
- Marca superior tipo wordmark **FARO≈** (la “≈” es una pequeña señal gráfica de ola).
- La fuente de titulares debe ser **expresiva pero no ocupar media pantalla**. Archivo Black es ancha; se redujeron algunos tamaños respecto de Barlow.
- En el código se restauró el estilo de tag para `Choppy & Messy`, etc.: `#dayview .session-glance .wizard-pick` debe usar `inline-flex`, fondo `var(--wave-bg)`, borde `var(--wave-border)` y texto `var(--wave-text)`, radio de esquinas 11px. Evitar overrides tardíos que le quiten borde/fondo.
- `#dayview .session-glance .glance-title` y `.glance-window` pueden aparecer en la estructura vigente; **inspeccionar la implementación actual** antes de modificar (ha evolucionado después de capturas anteriores).
- Los encabezados en Forecast, Best of Week y Wizard usan una jerarquía editorial coherente.
- Existe un documento de principios más extenso: `docs/FARO_COASTAL_EDITORIAL_GUIDE.md`.

### Referencias investigadas / conocidas

- Apple Human Interface Guidelines: jerarquía, layout, tipografía y tamaño táctil.
- Nielsen Norman Group: visual hierarchy, progressive disclosure, buen uso de accordions.
- Material Design 3: roles de color, superficies, acciones principales.
- WCAG 2.2: contraste y accesibilidad; sin depender solo del color.
- Baymard Institute: interacciones móviles y sobrecarga de UI.
- Referencias de surf/apps: Surfline, Windy.app, Dawn Patrol.
- Referencias de identidad surf/outdoor: Firewire (Libre Design), GearFreak (Zomeren Studio, uso de Mona Sans y Manrope), Coastline (ArloCreative), tipografía abierta Archivo Black.
- La inspiración no autoriza copiar assets, logotipos, fuentes propietarias o afirmaciones no verificadas.

## 5. Código y despliegue

**Repositorio:** `lukileke/zeeland-surf-check`, publicado por GitHub Pages.

Archivos principales:
- `index.html`: estructura HTML y gran parte del JavaScript inline. Actualmente extenso; varios bloques CSS legados se acumularon allí. Navegación, fetch y render viven aquí.
- `faro-ui.css`: sistema visual moderno cargado **después** del estilo legado; versión referenciada más reciente al redactar `?v=8` (confirmar en repo). Cambios de apariencia deben tender a consolidarse aquí, no a seguir apilando !important indiscriminadamente.
- `surf-engine.js`: motor compartido de puntuación. Reglas de scores, perfiles provisionales por región, weather penalty y clasificación de carácter de ola.
- `zeeland-widget.js`: widget separado, potencialmente comparte el motor; revisar antes de cambiar API o interpretación del score.
- `docs/FARO_COASTAL_EDITORIAL_GUIDE.md`: documentación de UX / contenido / checklist.
- `docs/FARO_LIVE_CONCEPT.md`: concepto potencial de análisis de cámaras autorizadas; NO implementado.
- Este archivo `docs/FARO_PROJECT_HANDOFF.md`: documento de continuidad para nuevos chats.

Stack: HTML/CSS/JavaScript simple y llamadas a Open-Meteo Marine + Weather con la zona `Europe/Amsterdam`. GitHub Pages aloja la app; no hay backend seguro dedicado a los scores. **Fórmulas y umbrales del frontend pueden ser inspeccionados**, incluso si no mostramos pesos en el UI. Un backend sería una decisión de producto futura, no un parche superficial.

La traducción EN/ES se hace actualmente mediante un mecanismo `MutationObserver` y sustituciones de frases en la página. Es **frágil** al cambiar copy/DOM: revisar español e inglés, strings nuevos y posible overflow. Podría reemplazarse más adelante por claves i18n formales.

**Flujo de trabajo recomendado en el próximo chat:**
1. Antes de editar, **consultar siempre el contenido más reciente** de los archivos con el conector GitHub, no confiar en fragmentos de contexto viejo.
2. Usar `fetch_file({repository_full_name:"lukileke/zeeland-surf-check",path:"index.html"})` y `fetch_file(...,"faro-ui.css")`.
3. Para cambios, editar `index.html` y/o `faro-ui.css` y `update_file` con el `sha` exacto retornado por GitHub; **commit real**, no respuesta hipotética.
4. Proteger IDs, callbacks, DOM y estado del `render()`; hubo un crash anterior cuando se eliminaron botones viejos pero `render()` seguía accediendo a `daily`/`weekly`.
5. Comprobar sintaxis de cada script inline, estructura DOM y llaves CSS; **eso NO valida funcionamiento runtime, datos reales, Safari ni apariencia**. Ser honesto con las limitaciones.
6. Controlar el caché del iPhone usando el parámetro de URL `?v=N` y un `?v=N` nuevo del stylesheet cuando se edite CSS. Link estable: https://lukileke.github.io/zeeland-surf-check/
7. Pedir/analisar capturas reales del usuario de iPhone Safari si hacen falta para verificar diseño; nunca afirmar que se visualizó un iPhone real sin haberlo hecho.
8. Cuidar modo claro y oscuro, móviles 320–430 px, desktop, cambios EN/ES y `prefers-reduced-motion`.
9. No exponer detalles de ponderación en el UI público; el código frontend de todos modos es público.

## 6. Ciencia, scoring, exactitud y seguridad

- Los valores son **estimaciones** adaptadas al spot desde modelos de oleaje y clima; wave height de Open-Meteo se presenta como **modelled offshore**, no como ola rompiendo en playa.
- El motor `surf-engine.js` usa perfiles provisionales de alturas/periodos según playa y factores de dirección de swell, viento, altura y período, además de ajuste de meteorología. **No proclamar calibración experimental ni validación local** que no existe.
- Categorías semánticas y sus colores: `Excellent` ≥8.5, `Good` ≥7, `Fair` ≥5, `Poor` ≥3, `Very poor` <3. Color por sí solo no basta; acompañar con texto.
- Clasificador de olas: `Wild & Windy`, `Choppy & Messy`, `Tiny & Tricky`, `Clean Lines`, `Mellow & Cruisy`, `Punchy & Powerful`, `Easygoing Sessions`, `Mixed Bag`. Interpretaciones estimadas, no observaciones.
- Lógica de seguridad separada: tormentas eléctricas, viento muy fuerte, olas grandes, agua muy fría, niebla y luz insuficiente se etiquetan en distintos niveles. Cuando `danger`, resumen debe quedar abierto; `caution` muestra razón breve y permite expandir explicación.
- Tampoco se evalúan corrientes de resaca, mareas, calidad del agua ni avisos de playa. Mantener aviso de consultar alertas oficiales KNMI y condiciones locales.
- Se añadió protección contra resultados de API asincrónicos atrasados (`spotRequestVersion`) para no asociar pronósticos viejos al spot nuevo, y placeholders de carga claros. Revisar siempre al tocar esta lógica.
- Preferencia: no enseñar fórmulas ni porcentajes exactos del algoritmo en pantalla; sí explicar claramente qué factores contribuyen y cuáles son las limitaciones.

## 7. Funciones futuras / no implementadas

- **Faro Swell Outlook**: posibles horizontes 14/30 días con tendencias e incertidumbre, **NO** inventar scores por ventanas precisas a 30 días.
- **Faro Live**: video de cámaras autorizado + análisis IA de condiciones observadas; ver `docs/FARO_LIVE_CONCEPT.md`. Licencias y permisos escritos antes de integrar o monetizar cámaras ajenas.
- Favoritos de spots, perfil de tablas real, recomendaciones personalizadas, viaje desde ubicación aportada voluntariamente, validación del modelo con surfistas locales, arquitectura de backend si algún día queremos preservar lógica.
- Posibles auditorías de UX y rendimiento, no prometer que ya están hechas.

## 8. Estado de las últimas interacciones

El usuario pasó varias capturas iPhone y señaló:
- Falta de contraste en Beach/Surf Spot → **corregido y mejorado**.
- Resúmenes muy grandes o desordenados → reducción de redundancia y jerarquía editorial.
- Párrafos de advertencia y metodología ocupaban demasiado → advertencias compactas y detalles desplegables.
- Los seis cuadritos de condiciones modeladas ocupaban espacio → **desplegables**.
- El detalle de pesos internos en el score era innecesario y mostraba información del algoritmo → quitado del texto principal.
- Tag `Choppy & Messy` perdió borde y fondo → se restauró, debe seguir como chip.
- Pidió **investigar más fuentes de diseño**, más estilo surfista moderno, títulos con identidad y formalidad; se probó Barlow Condensed + Manrope, y más recientemente **Archivo Black + Manrope**. Se escribió en la guía visual.
- **Última solicitud activa:** seguir refinando tipografía/estilo surfista; luego preguntó cómo evitar perder todo porque la conversación parece estar al límite. Esta documentación es la respuesta para trasladar el proyecto a un chat nuevo.

Importante: aunque el código se ha editado, **no se ha validado exhaustivamente en Safari real**. Revisar la apariencia real con nuevas capturas antes de considerarlo terminado.

## 9. Prioridades al retomar

1. Revisar el estado visual en Safari iPhone tras la elección **Archivo Black + Manrope**: escalas de títulos, espacio entre encabezado/tag/hero, contraste, y etiqueta `Choppy & Messy` con borde/fondo.
2. Verificar ambas paletas light/dark, particularmente contraste en scores ámbar/verdes y etiquetas de caracteres.
3. Auditar jerarquía desde arriba hasta abajo: ubicación → 7 días → day verdict → Your Session → hourly → detalles. **No sobrecargar de tarjetas por volver el diseño “más cool”.**
4. Revisar Best of Week y Wizard para que la identidad sea consistente, manteniendo funcionalidad.
5. Mejorar estructura CSS gradualmente eliminando reglas heredadas/!important en conflicto, en vez de seguir acumulando overrides.
6. Probar runtime con datos y errores de API en navegadores, incluidos Safari/teclado/VoiceOver, si se dispone de herramientas capaces de ello.

## 10. Mensaje listo para comenzar un chat nuevo

> Seguimos desarrollando **Faro**, mi web app de pronóstico de surf en el repositorio GitHub `lukileke/zeeland-surf-check`, alojada en `https://lukileke.github.io/zeeland-surf-check/`. Antes de proponer o editar nada, lee `docs/FARO_PROJECT_HANDOFF.md` y `docs/FARO_COASTAL_EDITORIAL_GUIDE.md`, y revisa el **código actual** de `index.html` y `faro-ui.css` mediante GitHub. Hay tres pestañas: Forecast, Best of Week, Wizard. Busco UI moderna, elegante, surfista, editorial y legible, sin parecer dashboard. Actualmente usamos Archivo Black + Manrope, etiqueta Choppy & Messy con fondo y borde, y un hero centrado en Surf Quality + Wave Height. Mantén todas las funcionalidades, el contraste, el bilingüismo y las advertencias. Continúa refinando y **haz commits reales** cuando solicite cambios, sin afirmar que probaste Safari si solo comprobaste sintaxis. Responde en español chileno natural.

---

**Regla de continuidad:** este archivo describe el estado conocido en la fecha de escritura. **El estado real más reciente del repositorio GitHub prevalece** ante cualquier discrepancia de commits, versiones o estructura HTML.

---

## Continuation update — Coastal Editorial implementation (23 Oct 2026)

After this handoff was written, additional GitHub commits introduced a cross-tab interface refinement. **Check the live main branch before working again.**

- Forecast now avoids elapsed/too-late daylight windows using the `Europe/Amsterdam` clock and a minimum of 40 min usable remaining light. With no upcoming session it shows an explicit empty state and next-day action; the landing selection can advance beyond today.
- Two-hour cards are more concise, with inaccessible windows disabled instead of presenting past periods as current recommendations.
- Best of Week now uses genuine date text rather than an emoji with a fictitious printed calendar date, and its wave character regained the same tinted badge treatment as Forecast.
- Primary Wizard has tighter hierarchy; the older advanced Wizard is still present, optional and collapsible.
- A consolidated design pass in `faro-ui.css` increases editorial contrast, reduces layout noise and spacing, while preserving brand, score, wavemeter and scientifically honest wording.
- `index.html` references `faro-ui.css?v=9`; translations now include missing editorial headlines.
- Regression checks: `node tests/faro-smoke.cjs`; GitHub workflow `.github/workflows/faro-checks.yml`.

Still outstanding: visual Safari testing on real devices in dark/light and EN/ES; run-time API slow/error cases and Wizard completion in browser; accessibility audit; careful consolidation of historical CSS, as !important remains heavily used. These are **not verified** by syntactic smoke tests.

Do not revert to Barlow Condensed or remove old Wizard modules without an explicit design/product decision.
