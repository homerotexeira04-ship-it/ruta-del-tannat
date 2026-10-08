# DECISIONES — Reel «La Ruta del Tannat»

Showreel de motion design de 15 s sobre el proyecto *La Ruta del Tannat* (circuito enoturístico de Salto, Uruguay).
Todo —imagen, tipografía animada, música y efectos de sonido— está generado **con código**. No se usó ningún modelo de generación de imagen, video ni audio, y no hay muestras (samples) ni fotos: cada píxel y cada onda sonora sale de una fórmula.

| | |
|---|---|
| Entregable | `video/ruta-del-tannat-reel.mp4` |
| Formato | 1920×1080 · 60 fps constantes · 15,000 s (900 cuadros) · H.264 High, yuv420p, BT.709 |
| Audio | AAC-LC estéreo 48 kHz, 320 kbps · −14,1 LUFS integrada, pico real −1,5 dBFS |
| Peso | 32,1 MB (~17 Mb/s de video) |
| Código fuente | `video/` (motor de render, escenas, síntesis de audio y `build.sh` para rehacerlo todo) |
| Tiempo total | **98 min (1 h 38 min)** (de 19:43 a 21:21 UTC, 8-oct-2026) — detalle en la sección 9 |

---

## 1. Idea

Un reel de currículum tiene que demostrar oficio, no solo contar algo. Así que el hilo es un **objeto que cae y se transforma**: una gota de vino baja por una línea dorada (la «ruta»), golpea y desborda la pantalla; de ahí en adelante cada escena es una pieza de motion distinta (tipografía cinética, odómetro, perspectiva, líquido, mapa, instrumentos, geometría), todas atadas por el mismo sistema visual y por un pulso de **128 BPM**. 15 s = 8 compases exactos, y cada corte, golpe de cámara y evento de pantalla cae sobre el beat (ver sección 4).

Se muestra «todo» el proyecto, tomado del contenido real del repositorio (`LaRutadelTannat.html`, `PRODUCT.md`, `README.md`, tesis en `.md`):

| # | t (s) | Escena | Qué cuenta | Técnica de motion |
|---|---|---|---|---|
| 1 | 0,00 – 1,88 | **La gota** | Salto, 31°23′S 57°58′O | línea con regla que baja, gota con *squash & stretch*, corona de salpicadura, ondas |
| 2 | 1,88 – 3,75 | **El nombre** | La Ruta del Tannat · «Cepa, origen e identidad» | tipografía con resorte, rosetón *guilloché* generativo, destellos, ondas al beat |
| 3 | 3,75 – 5,63 | **Harriague · 1874** | Pascual Harriague (1819–1894), primeras cepas en Salto, Día Nacional del Tannat (14-abr) | odómetro, línea de tiempo, viñedo en perspectiva de un punto de fuga |
| 4 | 5,63 – 7,50 | **La Copa** | La Copa de Tannat interactiva: 5 aromas, tanino/cuerpo/acidez | copa con vino en remolino, chips que salen de la boca, medidores, brindis |
| 5 | 7,50 – 9,38 | **4 Estaciones** | Las 4 bodegas, 3 km · 21 km · 9 km, 33 km / 32 min | mapa topográfico por *shader*, ruta que se dibuja, cámara que sigue al vehículo |
| 6 | 9,38 – 10,31 | **Termas** | Termas del Daymán y del Arapey, hasta 44 °C, Acuífero Guaraní | instrumento de medición, agua con cáusticas, vapor y burbujas |
| 7 | 10,31 – 11,25 | **Sostenible** | 4 principios + 31 % de superficie vitícola certificada (INAVI, 2023) | campo de columnas de basalto hexagonales, anillo de progreso |
| 8 | 11,25 – 12,19 | **Cuatro temporadas** | Vendimia · Día del Tannat · Cavas y fogones · Brotación | cuatro paneles con resorte, íconos animados (sol, uvas, llama, brote) |
| 9 | 12,19 – 13,13 | **Paquetes y reserva** | USD 45 (4 h) y USD 95 (8 h), WhatsApp, ES · PT · EN | tarjetas, contadores, sellos con resorte |
| 10 | 13,13 – 15,00 | **Cierre** | Logotipo, dirección web, equipo y UTU | golpe + flash, rosetón, título que repite el de la escena 2 (efecto de «marco») |

Los datos salen del sitio y de la documentación del repo; lo que ahí figura como ilustrativo se mantiene así en el video (los precios dicen «precios de referencia»; el mapa es un esquema, no está a escala; las barras de la copa son ilustrativas, igual que en el sitio). No se usa la palabra «oficial» (regla de `PRODUCT.md`).

---

## 2. Dirección de arte

- **Paleta**: la del propio sitio (`tailwind.config.js`): vino `#721B28` / `#4A101D` / `#2B0A14`, dorado `#C29D62`, crema `#FAF8F5`, basalto `#181818`. Añadí un único acento frío (teal) solo en las termas, para que el agua se lea como agua. Alternancia oscuro / claro / oscuro para que el ritmo de color también marque el corte (la escena de Harriague y la de Paquetes son crema; el resto, oscuro).
- **Tipografía**: *Playfair Display* (titulares, cursiva para el tono editorial) y *Plus Jakarta Sans* (etiquetas, cifras), **los mismos archivos `.woff2` del sitio** (licencia OFL). Las cifras grandes van en Jakarta porque los números de Playfair son «de estilo antiguo» (el 4 y el 7 bajan de la línea) y rompían el odómetro y el título «4 Estaciones».
- **HUD de showreel** (esquinas de corte, *timecode* cuadro a cuadro en celdas fijas, índice de escena, barra de progreso): da la lectura «pieza de portfolio» y deja ver que el video es exacto al cuadro. Lleva sombra suave para leerse sobre paneles claros.
- **Principios de movimiento**: entradas con curva *expo-out* / resortes subamortiguados (con sobreimpulso) en lo que «aterriza»; anticipación y *squash & stretch* en la gota; *stagger* en semicorcheas (0,117 s) para que lo escalonado también sea rítmico; un solo héroe por golpe; cámara con empuje lento y sacudida breve solo en los golpes fuertes.
- **Transiciones** (nueve, todas distintas y calculadas en un *shader*): iris desde el punto de impacto, líquido que sube con filo dorado, persianas verticales, zoom a través de la copa con desenfoque radial, barrido diagonal con filo dorado, dos *whip pans* (horizontal y vertical con *smear*), persianas finas y *flash* en el golpe final.
- **Acabado de cine**: *motion blur* real, *bloom*, leve aberración cromática que crece en los golpes, viñeta, grano de película con *dither*, curva S suave y gradación cálida. En las escenas crema el *bloom* se apaga a propósito (lavaba el papel).

## 3. Decisiones técnicas

- **Motor propio**, sin librerías de animación ni de gráficos: *Canvas 2D* dibuja cada escena en capas; *WebGL2* genera los fondos por *shader* (seda de vino con *domain warping*, papel, topografía con isolíneas, cáusticas de agua), compone las transiciones y hace el posproceso. Corre en Chromium sin pantalla (`puppeteer-core`, que el repo ya traía).
- **Render determinista**: cada cuadro es una **función pura del tiempo** `render(t)`. No hay estado acumulado, así que se puede renderizar en paralelo (3 procesos) y repetir cualquier cuadro idéntico para corregir un detalle.
- **Motion blur real, no un filtro**: cada cuadro se dibuja en 5 sub-instantes (9 en los golpes, 12 en transiciones y en el odómetro), con obturador de 270°–360°, y se acumulan en un *framebuffer* de coma flotante de 16 bits. Así el mismo blur sale en la tipografía, las líneas y las máscaras de transición. El instante de cada sub-cuadro lleva un pequeño *jitter* por cuadro para que las estelas no se vean escalonadas.
- **Una sola línea de tiempo** (`timeline.js`) manda a imagen y sonido: la tabla de golpes y transiciones, más `events.js` (casi 50 tipos de evento de pantalla), se exporta a `timeline.json` y la lee el script de audio. No hay «sincronización a ojo»: cada clic del odómetro, cada nodo del mapa y cada chip de aroma tiene su sonido en el mismo instante.
- **Velocidad**: el primer render tardaba **~8 s por cuadro**; el cuello de botella era el canvas acelerado por «GPU» de software de Chromium. Pasando a `--disable-accelerated-2d-canvas` bajó a **~1,1 s por cuadro** (7×). Además la capa de luz va a media resolución (brillos suaves, ahorra 3/4 de la subida a GPU).
- **Codificación**: los cuadros se guardan como JPEG de calidad 0,97 (intermedio) y se pasan a H.264 con conversión explícita sRGB→BT.709 de rango limitado (`scale=in_range=pc…out_color_matrix=bt709`) y metadatos de color correctos. CRF 19, `preset slow`, `aq-mode=3`. Con el grano de película el peso no es lineal: CRF 14 → ~100 Mb/s (≈190 MB), CRF 17 → 89 MB, **CRF 19 → 32 MB**, CRF 21 → 17 MB. Comparé recortes 1:1 de dos cuadros codificados a CRF 17/19/21 y no vi diferencia entre 17 y 19, así que elegí 19: un archivo que cabe en un correo o en una carpeta de currículum.

## 4. Música y sonido (síntesis desde cero, `audio/music.py`)

Todo con `numpy`: osciladores, ruido, filtros espectrales (FFT) y reverb por convolución con respuestas al impulso sintetizadas. Sin muestras.

- **Tempo y forma**: 128 BPM, 8 compases = 15,000 s. Armonía andaluza (La menor → Sol → Fa → Mi) que resuelve en **La mayor** (tercera picarda) en el cierre.
- **Pulso latino**: el bajo y la guitarra tocan el tresillo 3+3+2 en semicorcheas («x··x··x·»). La percusión es de **inspiración candombera** —chico, repique y «piano» como parches afinados sintetizados (seno con caída de tono + ruido de baqueta)—; es una aproximación, **no** una transcripción fiel del toque de candombe.
- **Instrumentos**: guitarra de nailon (Karplus-Strong vectorizado + resonancia de caja), pad de cuerdas (sierras aditivas desafinadas con filtro que se abre a lo largo del reel), subgrave, campanas FM de vidrio y marimba, bombo, palmas, redoble de caja, hi-hats y *shaker*.
- **Diseño de sonido pegado a la imagen**: clics de la regla mientras baja la línea, el *plop* y el subgrave del impacto de la gota, un clic por letra de «Tannat» (arpegio de La menor), 41 clics mecánicos del odómetro, un arpegio de Fa mayor con los cinco aromas, el «clink» de la copa (parciales inarmónicos de vidrio), una campana por cada estación del mapa (Mi mayor), gotitas que suben de tono con el termómetro, cuatro «toks» de madera en Sostenible, un «pop» de mensaje en WhatsApp y un *whoosh* distinto por cada transición (barridos de ruido espectral, paneados con el movimiento).
- **Dinámica**: intro casi en silencio con subida de ruido y tono → golpe del título en el 1,875 → compás de la copa más abierto → *build* final con redoble creciente y una semicorchea de vacío antes del golpe de cierre (13,125 s) → acorde sostenido con cola de reverb y *fade* alineado con el de la imagen.
- **Mezcla y masterización**: *sidechain* por bombo en bajo y pad, filtrado por bus, reverb de placa y de sala, automatización de nivel por sección, limitador con anticipación. Resultado medido sobre el audio del MP4 con `ffmpeg ebur128`: **−14,1 LUFS integrada · LRA 1,8 LU · pico real −1,5 dBFS**.

## 5. Lo que descarté

| Descarté | Por qué |
|---|---|
| **Fotos del sitio** (viñedo, retrato de Harriague, termas…) | Calidad dispareja entre fotos, varias son de terceros con licencias distintas (CC BY-SA, INAVI, Bodegas del Uruguay) y un reel con fotos se lee como pase de diapositivas. Todo ilustrado por código mantiene una sola estética, evita problemas de derechos y es lo que de verdad demuestra el oficio. |
| **El logotipo en mapa de bits** | Es un raster sobre fondo negro (`logo-ruta-del-tannat-450.webp`, 450 px): no escala a 1080p. Preferí reconstruir la marca como tipografía + rosetón generativo. |
| **Escena 3D con cámara** (three.js) | Descartada sin probar: más peso y más riesgo de verse «de demo». El proyecto ya rechazó una escena 3D pegada al scroll (`PRODUCT.md`); acá resolví la profundidad con perspectiva 2D, paralaje, capas y *shaders*. |
| **After Effects / Lottie / plantillas / `ffmpeg` solo con filtros** | Se pidió «solo código»; un motor propio da control total del tiempo, del *motion blur* y de la sincronía con el audio. |
| **Motion blur como filtro de posproceso** | Decidido sin probarlo: un blur direccional no sabe de máscaras ni de texto fino. Preferí pagar el costo de renderizar sub-cuadros. |
| **Estética de reel genérico** (partículas, *lens flares* y glitch por todos lados) | Restringí los efectos a lo que tiene sentido para la marca: vino, oro, basalto, agua. |
| **Narración / voz** | 15 s no dan para narrar y el texto en pantalla ya lleva el dato. |
| **Música con muestras o «tipo» de otra canción** | Prohibido y, además, evitable: la composición es original. |
| **Cifras del reel que no estén en el sitio** | Ni una sola cifra inventada: si no está en el repo, no sale en pantalla. |
| **Exportar con CRF bajo (14)** | Medí ~100 Mb/s en los primeros 2,5 s (≈190 MB para el reel entero) por culpa del grano: excesivo para un currículum. |

## 6. Iteraciones (lo que salió mal y cómo se corrigió)

1. **Blancos que se volvían cian.** La curva S del gradación (`x²(3−2x)`) se invierte por encima de 1,5 con valores HDR. Corregido recortando antes de aplicarla.
2. **El impacto de la gota se perdía.** El iris de transición cubría la pantalla en ~0,17 s con una curva *ease-out*; pasó a una curva acelerada (`x^1,7`) que respeta salpicadura y ondas ~0,3 s.
3. **Escenas claras lavadas.** El *bloom* global quemaba el crema. Añadí ajustes de posproceso **por escena** (umbral y ganancia de *bloom*, viñeta, grano) y los mezclo durante las transiciones.
4. **Línea que «tachaba» el texto.** Una raya de color vino cruzaba «Las primeras cepas…». La encontré bisecando la escena: eran las puntas de los dígitos siguientes del odómetro asomando bajo el recorte. Recorte y alto de línea corregidos.
5. **Viñedo «de globos».** La primera versión dibujaba copas esféricas por poste. Reescrita como hileras en perspectiva (trapecios convergentes + postes, hojas y racimos que avanzan) y luego con cámara más alta para que se vean las calles entre hileras.
6. **Numerales de Playfair** (estilo antiguo) rompían el odómetro y el título del mapa → cifras en Jakarta.
7. **Chips de aromas ilegibles.** Claros y con *bloom* se «quemaban». Pasaron a vidrio oscuro con filo dorado y se reubicaron para no tapar el título.
8. **Cáusticas del agua saturadas.** Mi adaptación del patrón de cáusticas usaba coordenadas sin el rango del original y llenaba la pantalla de cian. Corregido el espacio de coordenadas; baja la intensidad del vapor.
9. **Persianas que oscurecían todo.** Las líneas entre barras se aplicaban a toda la pantalla; ahora solo donde hay movimiento.
10. **Texto montado**: «°C» chocaba con el extremo del arco del termómetro; el precio rozaba el título en las tarjetas; el badge del 14 de abril tapaba el título; el pie de la escena de paquetes pisaba el HUD. Reubicados.
11. **Cierre demasiado tarde.** La tarjeta final no estaba completa hasta casi el *fade*. Comprimí su coreografía para que quede ≥ 0,9 s con todo visible antes de apagar.
12. **Render lento** (8 s/cuadro → 1,1 s) por la opción de canvas de Chromium; ver sección 3.
13. **Audio v1 demasiado fuerte y sin dinámica**: −10,4 LUFS, pico real +0,3 dBFS, 69 % de la energía bajo 200 Hz. v2: menos subgrave, pad sin fundamental y con pasa-altos, automatización de nivel por sección, limitador y normalización a −14 LUFS. v3/v4: techo más bajo porque el AAC agrega ~0,2–0,4 dB de pico. Medido final en el MP4: −14,1 LUFS, pico real −1,5 dBFS.
14. **Dos renders completos.** El primero (22 min) me permitió revisar a resolución final y detectar los puntos 10 y 11 y el sombreado del HUD; el segundo es el definitivo.
15. **Hueco oscuro durante un *whip pan*.** Al entrar a «Sostenible» había ~0,1 s casi negro porque sus elementos aún no habían empezado: la escena ahora entra 0,1 s adelantada (y sus sonidos se movieron igual en `events.js`). También subí el nivel de la intro, que quedaba casi ilegible.
16. **Control automático de «parpadeos»** (`tools/flicker.py`): mide cambios bruscos entre cuadros consecutivos. Todos los saltos grandes caen en transiciones o golpes previstos; no hay *pops* accidentales.

## 7. Verificación

- `ffprobe`: H.264 High @ L4.2, 1920×1080, `r_frame_rate=60/1`, **900 cuadros contados** (`-count_frames`), 15,000 s, yuv420p, BT.709 (rango limitado); AAC-LC 48 kHz estéreo de 15,000 s; ambos flujos con `start_time=0`. El audio decodificado desde el MP4 coincide con el WAV original con **desfase de 0 muestras**; el archivo decodifica entero sin errores.
- Sonoridad (ffmpeg `ebur128`): −14,1 LUFS integrada · LRA 1,8 LU · pico real −1,5 dBFS (medido sobre el audio del MP4 con `ffmpeg ebur128`)
- Revisión visual: hojas de contacto cada 15 cuadros de todo el reel, tres cuadros dentro de cada una de las nueve transiciones y, a resolución completa, los cuadros clave de cada escena. Además, un detector automático (`tools/flicker.py`) compara **los 900 pares de cuadros consecutivos** y todos los saltos grandes caen en transiciones o golpes previstos. Y extraje nueve cuadros del MP4 ya codificado para confirmar que el color (conversión sRGB→BT.709) y los textos quedaron bien.
- **Límites honestos**: no puedo *escuchar* el audio; lo verifiqué con instrumentos (espectrograma, curva de nivel por segundo, sonoridad, pico real, balance y correlación estéreo, búsqueda de saltos) y con el alineamiento exacto de cada evento. El balance de timbres y la musicalidad conviene que los valide una persona con parlantes. Tampoco vi el video reproducido en tiempo real: lo revisé cuadro a cuadro.

## 8. Cómo rehacerlo

```bash
cd video && ./build.sh          # timeline → audio → 900 cuadros → MP4
```
Requiere Node (con `puppeteer-core`, ya en `node_modules` del repo), Chromium, Python 3 con `numpy` y `Pillow`, y `ffmpeg`. Un render completo tarda ~21 min con 3 procesos en 4 núcleos (1.247 s medidos).

Estructura: `src/` (motor, escenas, línea de tiempo y eventos), `audio/music.py` (síntesis) y `audio/analyze.py` (medición), `tools/` (render paralelo, codificación, hoja de contacto, detector de parpadeos), `fonts/` (las tipografías del sitio).

## 9. Tiempo total

**98 min (1 h 38 min)**, de 19:43 a 21:21 UTC del 8-oct-2026, medidos con el reloj del sistema (`date`) al inicio y al final. Incluye lectura del proyecto, diseño, código, las esperas de render y codificación, la verificación y esta documentación.

| Hito (UTC) | Hora |
|---|---|
| Inicio: lectura del repo, del sitio y de los datos | 19:43 |
| Pruebas de entorno (WebGL2 en Chromium sin GPU, ffmpeg, numpy) y decisión de arquitectura | hasta 19:50 |
| Motor (Canvas 2D + WebGL2) y primeras escenas (gota, nombre) probadas en pantalla | 19:50 – ~20:00 |
| Harriague, Copa y Mapa escritas y revisadas | ~20:00 – 20:11 |
| Termas, Sostenible, Temporadas, Paquetes y Cierre escritas · primera pasada completa (60 cuadros) | 20:11 – 20:16 |
| **Render completo #1** (22 min, en segundo plano). Mientras tanto: tabla de eventos, audio v1–v3, revisión de cuadros a resolución completa y la tanda de correcciones (HUD, cierre, °C, paquetes, título del mapa) | 20:20 – 20:42 |
| Últimos ajustes, exportación de `timeline.json`, audio y lanzamiento del render definitivo | 20:42 – 20:44 |
| **Render completo #2** (21 min; mientras tanto: escribí este documento y verifiqué las alturas de los tonos) | 20:44 – 21:05 |
| Pruebas de codificación (CRF 17/19/21), arreglo del hueco en «Sostenible» y de la intro, re-render parcial (cuadros 0–116 y 608–692, ~5 min) | 21:05 – 21:19 |
| Codificación final (1 m 46 s), remezcla del audio con techo más bajo, verificación del MP4 | 21:19 – 21:21 |
| Cierre de la documentación | hasta 21:21 |

Reparto aproximado (estimación mía, no medida): diseño y código de escenas ~45 %, motor/shaders/render ~15 %, audio ~15 %, revisión y correcciones ~15 %, esperas de render/codificación que no pude solapar ~10 %.
