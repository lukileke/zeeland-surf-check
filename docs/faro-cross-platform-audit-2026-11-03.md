# FARO · Auditoría transversal de producto
**Fecha:** 3 de noviembre de 2026  
**Ámbitos:** FARO Chile web (desktop, iPhone, light/dark) y FARO Zeeland Scriptable v17

## Criterio de dirección de arte
FARO debe ayudar a **leer el mar**, no ofrecer un marcador de cifras aisladas.
La jerarquía canónica es: **spot → situación → decisión → evidencia → preparación**.
El hero web puede usar luz submarina y un pulso coordinado; el widget iOS
debe ser una instantánea, sin animación continua ni una segunda marca gigante.

### Fortalezas conservadas
- Logo vectorial original, O amarilla, tonalidad petróleo y transición oceánica.
- Índice numérico prominente y la paleta exacta de cinco categorías en temas dark y light.
- Separación entre altura oceánica modelada y altura en rompiente observada.
- Avisos costeros de la web por encima del pronóstico, sin confundirlos con
  verificaciones oficiales en tiempo real.
- FARO VIBE y acceso a datos detallados permanecen fuera del hero simplificado.

## Cambios implementados en este pase

| Componente | Problema real | Decisión y cambio |
| --- | --- | --- |
| Widget v17 · marca | Iluminación como mancha y demasiada decoración en v15 | Halo amplio, atenuado y detrás de los datos. Logo original único en la cabecera. |
| Widget v17 · números | 0,2 m de altura oceánica podía acompañar un score 6,1 sin contexto | Etiqueta «Oleaje bajo · modelo» al estar por debajo de 0,45 m. Se conserva el score de origen sin inventar rompiente. |
| Widget v17 · título | «Calidad de surf» parecía una observación local validada | «Índice FARO» / «FARO READ», consistente con el carácter experimental. |
| Widget v17 · alerta | El viento de 48 h se interpretaba como viento de la franja ganadora de 7 días | «Riesgo viento · 48 h» / «Wind risk · next 48 h». Datos y límites de riesgo intactos. |
| Widget v17 · idiomas | La configuración sin parámetros se iniciaba en inglés | Español por defecto; EN o LANG=EN fuerza inglés. |
| Widget v17 · score | Los cinco tramos del pequeño medidor tenían HEX diferentes a la web | Ahora coinciden con #ef9b77 / #efbd6e / #e0cc73 / #b1d574 / #8cc584. |
| Chile web · preparación | UV máximo diario presentado junto al traje de una sesión sin aclaración | Tag rotulado «UV máx. día». |
| Chile web · táctil | Algunos botones reales medían menos de 44 px en viewport móvil | Tamaño mínimo de toque de 44 px para acciones prioritarias. |
| Chile web · lectura | Tipografía de descriptores muy pequeña en iPhone | Cualificaciones y etiquetas críticas elevadas a 10 px donde caben. |
| Chile web · foco | Algunos enlaces y selectores carecían de contorno de foco consistente | `:focus-visible` para principales acciones y selector. |

## Auditoría de escritorio
- **1120 px y superior:** verificaciones para el layout de dos columnas,
  sin reintroducir las 12 pistas del grid antiguo.
- **1024 px y 768 px:** una única columna narrativa; las franjas no deben
  convertirse en elementos estrechos ni dejar la interpretación al pie del contenedor.
- **Desktop y light:** la hoja de score lock se carga **la última**,
  para que la numeración mantenga los mismos cinco colores que dark.
- **Interacción:** hero conduce a la lectura; mapa y brújula tienen papeles
  distintos; el footer se conserva al final.

## Auditoría iPhone / WebKit
- **320, 375 y 390 px** y límite **710/711 px**: comprobar overflow,
  la continuidad de los bloques y el mínimo táctil.
- Hero primero, selector después; el puente final no debe subir antes del hero.
- La O desenfocada y el halo siguen las mismas propiedades dark/light con
  distintas superficies, respetando `prefers-reduced-motion`.
- El footer debe quedar por debajo del resumen del día, los horarios, el mapa
  y la sección editorial.

## Calidad técnica y verificación
- `tests/faro-widget-v17.test.cjs`: sintaxis Scriptable, idioma, fuente de
  información, paleta, advertencias por horizonte y composición.
- `tests/faro-responsive-browser.mjs`: **36 combinaciones** de Chromium/WebKit,
  9 anchuras y temas dark/light, con capturas para comprobar responsive.
- `.github/workflows/faro-responsive-qa.yml`: prueba automatizada y artefactos
  de capturas. Estas comprobaciones solo se consideran **ejecutadas**
  cuando GitHub Actions informa un resultado; crear el workflow no equivale a aprobarlo.
- Test estático deliberado del estilo y del orden. **La ejecución en WebKit CI
  no sustituye una prueba visual final en un iPhone físico.**

## Debilidades pendientes (no ocultarlas)
1. **Deuda CSS:** muchas hojas históricas con especificidades altas y
   `!important`. Refactorizar de forma incremental tras obtener capturas
   comparables, no mediante otro parche de diseño sobre un parche.
2. **Calibración científica:** el score pondera viento, dirección de swell,
   altura y período; puede reflejar una valoración media aun con oleaje
   muy pequeño. Una futura calibración debe contrastarse con observaciones
   antes de modificar umbrales o introducir un límite de altura.
3. **Separación de riesgos:** el peligro meteorológico próximo en el widget
   no se refiere necesariamente a la franja modelo elegida para siete días.
   Ahora se etiqueta su horizonte (48 h), pero sería mejor un desglose de
   alcance por spot y un nivel oficial verificable.
4. **Actualización automática:** Scriptable ejecuta código desde el GitHub
   propio del usuario. La validación del cargador es estructural, **no una
   firma criptográfica**. Publicar en main requiere revisión.
5. **Datos reales y Safari:** la prueba offline de layout es útil para CSS;
   no certifica disponibilidad de API, consistencia meteorológica ni rendimiento
   de WebView en un dispositivo real.

## Recomendación P0/P1/P2
- **P0 (este pase):** exactitud de mensajes, accesibilidad, paleta y pruebas responsive.
- **P1:** capturas CI comparadas con iPhone real, arreglar hallazgos confirmados y
  unir stylesheets redundantes por módulos sin romper la cascada.
- **P2:** estudio con datos observados para calibrar la relación entre score y
  surf realmente practicable; pasar a avisos oficiales sincronizados cuando
  exista una fuente fiable.
