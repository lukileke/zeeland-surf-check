# FARO · Brand refresh v1 — Forecast
**Dirección de arte, UX y entrega técnica** · 2 noviembre de 2026 · Región de Valparaíso

## Principio rector
**Primero la lectura del mar. Después los controles y el detalle científico.**

No buscamos copiar el colorido ni las cámaras de Surfline. En las capturas comparativas proporcionadas, Surfline crea una narrativa mediante fotografía real, titulares grandes y capítulos visuales distintos. FARO debe ganar identidad mediante cartografía, la O de la marca, señal oceánica verificada y una escritura sobria. Una foto ajena o una cámara sin derechos de distribución NO es una solución de diseño.

El fallo actual es informacional, no solo estético: el visitante primero ve marca, navegación, región, selector, refresco y ruta; la evaluación del mar queda por debajo del primer scroll. La repetición posterior de "Read / Ocean Read / Coastal Read" produce mucha interfaz y poca claridad.

## Auditoría bloque a bloque — antes → después

| Bloque | Diagnóstico visual y funcional | Decisión FARO v1 |
|---|---|---|
| Header y logo | Marca correctamente aplicada, pero todas las utilidades compiten por atención | Mantener logo real y controles pequeños, navegación editorial sin convertirse en hero |
| País/región | Switch y "primera región" consumen demasiado foco | Conservar acceso geográfico; reducir su peso visual como contexto |
| Actualización/refresh | Línea y botón flotante desperdician la zona superior | Convertir en metadatos secundarios bajo el lead |
| Selector spot | Correcto técnicamente, pero aparece antes de una razón para visitar la página | Mantener lista FARO accesible, situarla bajo el lead |
| **Inicio sin foco** | No muestra la mejor franja ni la señal de condiciones hasta el scroll | **Nuevo FARO Ocean Lead**, modelo real, ventana, score, ola/período/viento, CTA funcional |
| Restricciones | Correctas, deben aparecer vinculadas al spot, no tintar el score | Mantener aviso fechado compacto y bloquear recomendaciones en Ventanas |
| Your route | Accesos útiles pero prematuros antes de conocer el mar | Mover a después del Daily Take, sin eliminar funciones |
| Next 7 days | Resumen compite con lectura prioritaria | Ubicar tras el Daily Take, mantener desplegable por defecto |
| Daily Take | Información física completa, excelente para profundizar; débil como primer punto de contacto | Mantener detallado, convertido en segundo nivel tras el lead |
| Find your time | Bloque central y útil; colores semánticos ya consistentes | Mantener bandas de score y evitar mezclar color de ola con calidad |
| Coastal Read | Visual distintivo, pero aún demasiado parecido a otra tarjeta | Enmarcar como capítulo FARO con una línea/horizonte; conservar mapa existente |
| Preparación | Panel gear y avisos ya progresivos | Mantener secundario, sin repetir score y marejadas |
| Footer/Explore | Demasiados subbloques, cierre poco intencionado | Dar aire, usar color de marca y una firma "Know the coast" sobria |
| Imágenes | No hay cámara propia ni fotos licenciadas dentro de este flujo | **No fabricar previews**. Cuando existan cámaras permitidas, incluirlas solo con fuentes y permisos claros |

## Visual system v1

**Roles** (no nuevos colores de score):
- `FARO deep coastal`: azul petróleo / teal profundo para un único lead por página. Alto contraste en títulos blancos, una sola región oscura en primer plano.
- `FARO ocean mint`: texto o señal blanca-menta de interfaz, no sustituye la escala numérica de calidad.
- `FARO signal scale`: conservar bandas verde/amarillo/naranja existentes sin reatribuirlas a alturas oceánicas.
- `FARO surface`: fondos claros u oscuros de la UI según tema. Los capítulos secundarios usan fondo simple y hairlines discretos.
- `FARO contour`: **3 curvas topográficas CSS** derivadas de la identidad costera, sin fingir que son isóbatas reales. La O original del logo aparece como marca de agua sutil, nunca como pegatina.
- `Typography`: Archivo Black exclusivamente para titulares editoriales; Manrope para cifras, etiquetas y lectura funcional.
- `Interaction`: CTAs accesibles con estados teclado, hover 150–190 ms y reducción de movimiento cuando se solicita.

**Qué eliminar**:
1. El espacio muerto inicial entre logo, selector y score.
2. La navegación de cuatro pills antes de la lectura del mar.
3. La comparación semanal interponiéndose antes del Daily Take.
4. La necesidad de hacer scroll para averiguar la mejor franja o score.
5. La duplicación de un segundo Daily Take de 700 px: el Ocean Lead ofrece una *síntesis*, la tarjeta detallada sigue explicando UV, evidencia, Vibe y altura.
6. Promesas implícitas de olas rompientes / seguridad / observaciones que el modelo aún no mide.

**Qué reforzar**:
- Firma FARO e idea “read the coast”; score y ventana actualizados de la misma selección que los datos detallados.
- Legibilidad de permisos, limitaciones y restricciones (el score nunca sustituye acceso).
- CTAs verdaderos: el lead **lleva** a la lectura diaria o abre el mapa.
- Jerarquía por capítulos: Overview → Why → Window selection → Coastal model → Prepare → Explore.
- Modo oscuro y claro; el lead es intencionadamente oscuro en ambos como momento identitario, con todo el contenido accesible.

## Wireframe desktop ≥1120 px

```text
┌ FARO (logo)                       Idioma   Tema   Estado ┐
│ Pronóstico | Best of Week | FARO Match                │
│ Zeeland / Chile (location utility)                    │
├───────────────────────────────────────────────────────┤
│ FARO · READ THE COAST                  MODELLED SIGNAL │
│ La Boca · [día seleccionado]           9.4 /10*        │
│ Potencial alto frente a La Boca        Mejor ventana   │
│ [lectura resumida sustentada por datos] 10:00–12:00     │
│ [Leer el pronóstico] [Mapa]            Hs · T · viento │
│          3 trazos costeros y O watermark sutil        │
├───── actualizado / refresh ──── región · spot ────────┤
│ Aviso de acceso compacto (solo si existe)             │
├───────────────────────┬───────────────────────────────┤
│ DAILY TAKE detallado  │ FIND YOUR TIME                │
│ fecha / explicación   │ 8 franjas de 2 h              │
│ altura y UV           │ vista de franjas seleccionada │
├───────────────────────┴───────────────────────────────┤
│ TU RUTA · Horarios / Mapa / DNA / Cámaras              │
│ Next 7 days — acordeón cerrado                         │
│ Mapa + Brújula — coastal chapter                       │
│ Preparación / fuentes / investigación / explora más    │
└───────────────────────────────────────────────────────┘
```

(*) Número únicamente ejemplificativo de composición. La interfaz usa el score real de cada consulta o “—” cuando falta.

## Wireframe mobile 375–430 px

```text
 FARO                                ES · Claro
 Forecast · Best of Week · Match
 CHILE · MODELO
┌──────────────────────────────────┐
│ FARO · READ THE COAST            │
│ La Boca · fecha                  │
│ Potencial alto frente a La Boca  │
│ Explicación 2–3 líneas           │
│ [Ver lectura]  [Mapa]            │
│ ───────────────────────────────  │
│ SCORE          MEJOR VENTANA     │
│ 9.4*           10–12            │
│ Hs 1.6m   T 11s   Viento 3km/h   │
│ Modelo experimental              │
└──────────────────────────────────┘
 actualizado + refresh · selector playa
 [Aviso restringido compacto si corresponde]
 DAILY TAKE — detalles científicos
 TU RUTA → acceso a mapa/DNA/cámaras
 Next 7 days (cerrado)
 Find your time → Coastal Read → Prep
 FARO cierre editorial
```

No se debe ocultar la advertencia de Ventanas en el hero. Si el spot está restringido, el texto dice **no recomendado** aunque exista score, y la información de acceso queda a continuación.

## Implementación por prioridades y criterios de aceptación

### P0 — implemented in PR
- Crear un lead de datos **reales** (no imagen ni score escrito a mano), primero en DOM de Forecast.
- Conectar spot, día, mejor franja (o franja elegida), score, swell, viento y explicación a la misma selección que Daily Take.
- Manejar falta de datos, ventanas sin luz, restricciones y tiempos transcurridos sin promesas.
- CTAs funcionales: scroll al detalle, mapa a la vista.
- Desplazar Your route y Next 7 days después del Daily Take; sin perder enlaces ni función de comparación.
- Evitar huecos de grid desktop cuando la alerta esté oculta, móvil sin overflow.
- Tests navegador 375/390/430/768/1180/1440: orden, score, CTR, cambio de spot, no errores.

### P1 — implemented in PR
- Un lead costero como única superficie de contraste profundo, líneas tipo oleaje y marca O fantasma.
- Sistema tipográfico con contraste de titulares y métricas; evitar 5 tarjetas con el mismo peso.
- Jerarquía de utilidad y metadatos discreta, andamiaje con contornos y fondos.
- Conservar temas, bandas semánticas y accesibilidad (incluido reduce-motion).

### P2 — safe design foundations; not fabricated
- Previsualizaciones fotográficas/cámaras **solo si la fuente concede reproducción/almacenamiento**. Actualmente se muestra enlace a fuentes, no imagen inventada.
- Consolidación CSS heredada en un solo contrato cuando capturas de iPhone Safari reales certifiquen tipografía y dimensiones.
- Cuñas editoriales y capítulos “Read / Choose / Prepare” afinados sin duplicar el score.
- Evaluar con métricas UX (tiempo hasta score/ventana, primer scroll, clics en mapa y selector) cuando haya telemetría consentida; no inventar resultados.

## Validación científica
Los campos y el índice se derivan del proveedor actual y las guías, sin afirmar altura de ola rompiente ni condiciones seguras. FARO no supera a Surfline por una renovación visual. Este cambio no altera `valparaiso-score-lab.js`, datos fuente, comentarios de riesgo ni el estado de Ventanas.
