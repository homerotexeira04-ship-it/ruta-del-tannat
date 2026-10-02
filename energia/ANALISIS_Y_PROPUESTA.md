# Ruta de la Energía Uruguay — Análisis completo y propuesta de cambios

**Archivo analizado:** `JUEGORENOVABLESLICEO.html` (1.468 líneas, 119 KB, un solo archivo con CSS y JS adentro).
**Fecha del análisis:** 2026-10-02.
**Estado:** este análisis es del juego **original**. Después pediste ejecutarlo todo (solo para una pantalla interactiva Ricoh, no para celulares; primero dijiste 85" y después aclaraste que es la **Ricoh D6510**, de 65"): lo que se hizo está en la **sección 8** y el juego nuevo está en esta carpeta (ver el [README](README.md)). Las secciones 1 a 7 se dejan como estaban, salvo las correcciones marcadas con ✏️.

Las referencias tipo `L790` son líneas del archivo original. Los IDs de preguntas tipo `solar#12` son «estación # posición dentro del banco, en el orden del archivo».

---

## 0. Veredicto en cinco líneas

1. **En una pantalla grande (1920×1080) el juego anda bien**: se ve bien, se entiende y en las pruebas todo se puede tocar y leer (los defectos ahí son menores: P5, P6, A1). Esa parte hay que conservarla.
2. **Hoy no sirve como app**: en un celular no se puede jugar (en un iPhone 14 se ve la pregunta y la opción A; las B, C y D quedan cortadas), no es instalable y depende de internet para fotos y tipografías.
3. **El puntaje no mide lo que sabés**: elegir siempre la opción más larga, sin leer la pregunta, da 79 % de aciertos (224 de 290 puntos); y la posición de la respuesta correcta sigue un ciclo A→B→C→D que se descubre con dos respuestas.
4. **Hay datos del banco para corregir** (verifiqué 26 contra fuentes públicas: 2 son claramente erróneos, 3 imprecisos o desactualizados, 7 con matices) y el pie dice «Datos verificados».
5. **Todo tiene arreglo sin reescribir desde cero**, y varios arreglos son de una línea. La propuesta está en la sección 6.

---

## 1. Qué es el juego (inventario del sistema)

| Pieza | Qué hace | Dónde |
|---|---|---|
| Flujo | `welcome → intro → quiz ×5 → stationDone` por cada una de las 5 estaciones (Hidráulica, Eólica, Solar, Biomasa, Uruguay) → `dragChallenge` → `final` | L842–853 |
| Banco | 100 preguntas (20 por estación), 4 opciones, explicación y «fuente». Cada partida sortea 5 por estación = 25 | L588–699 |
| Mezcla | Mezcla opciones y fuerza la posición de la correcta | L718–745 |
| Puntaje | +10 por acierto, +5 cada 3 seguidos; insignias de racha cada 5; máximo teórico 290 | L1038–1068 |
| Modo contrarreloj | 15/20/30 s por pregunta, barra, número, temblor de tarjeta en los últimos 10 s | L1188–1261 |
| Desafío final | Arrastrar 4 íconos a 4 lugares (Salto Grande, Artilleros, La Jacinta, UPM). No suma puntos | L1294–1461 |
| Ranking | `localStorage`, tope 50, se muestra el Top 4 «de esta pantalla» | L764–807 |
| Gráfico final | Barras con la «matriz eléctrica 2025» | L748–754, L1120 |
| Audio / vibración | Sonidos sintetizados con Web Audio; `navigator.vibrate` | L521–560 |
| Fondos | 5 fotos de Wikimedia Commons a 1920 px, enlazadas directo, con desenfoque | L572–586 |
| Dependencias externas | Google Fonts (Fredoka, Nunito) y las 5 fotos. Nada más; no se envía ningún dato a ningún lado | L10, L572 |

---

## 2. Cómo lo analicé (y hasta dónde llega)

- **Lectura completa** del código (HTML, CSS, JS, banco).
- **Ejecución en Chromium (Playwright)** en 11 tamaños de pantalla (kiosco 1920×1080 hasta iPhone SE horizontal), con mouse y con toque real (eventos táctiles por CDP), con y sin «movimiento reducido», sin Web Audio, con `localStorage` bloqueado y con las fuentes de Google demoradas.
- **Las 100 preguntas** renderizadas una por una en cada tamaño de pantalla para medir qué se puede tocar y qué se puede leer.
- **axe-core** (accesibilidad automática) en cada pantalla y en cada color de estación.
- **Simulaciones de 600 partidas** con las funciones reales del juego para ver qué puntaje saca un jugador «ciego».
- **Verificación de datos**: 26 afirmaciones del banco contra fuentes públicas/oficiales (apéndice A).

**Lo que NO pude hacer** (para que no te quedes con una falsa seguridad):
- No probé en **Safari/iPhone/iPad reales**, ni en Firefox, ni en el hardware del museo. Solo Chromium de escritorio emulando pantallas.
- No medí **rendimiento real** (fluidez en equipos viejos); en un Chromium sin GPU los números no sirven. Lo que digo sobre rendimiento sale del código y es una hipótesis a medir.
- **No verifiqué una por una las 100 preguntas**: verifiqué las 26 más riesgosas. Las otras ~74 son sobre todo hechos técnicos generales (turbinas, inversores, etc.) que no encontré motivo para dudar, pero no están comprobadas con fuente.
- No pude consultar las licencias de las fotos por API (Wikimedia me limitó con HTTP 429), pero sí las leí en las páginas de cada archivo.

---

## 3. Hallazgos

Severidad: 🔴 crítico (rompe el uso o el sentido del juego) · 🟠 alto · 🟡 medio · 🟢 bajo.

### 3.1 Pantallas y dispositivos (P)

**P1 🔴 No se puede jugar en celular.** Medido sobre las 100 preguntas:

| Pantalla | A: respuestas tocables (de 4, pregunta mediana) | B: preguntas donde se lee **completa** la explicación | C: se ve la línea «Fuente» |
|---|---|---|---|
| 1920×1080 kiosco | 4/4 | 100/100 | 99/100 |
| 1366×768 portátil | 4/4 | 86/100 | 4/100 |
| 1280×800 tablet | 4/4 | **0/100** | **0/100** |
| 1024×768 XGA | 4/4 | 21/100 | 4/100 |
| 820×1180 / 768×1024 iPad vertical | 4/4 | 100/100 | 100/100 |
| 412×915 Android | **3/4** | 0/100 | 0/100 |
| 390×844 iPhone | **1/4** | 0/100 | 0/100 |
| 360×640 Android chico | **0/4** | 0/100 | 0/100 |
| 844×390 iPhone horizontal | **0/4** | 0/100 | 0/100 |

Además, en 360×640, 844×390 y 667×375 el botón «Siguiente» queda intocable en las 100 preguntas (el jugador queda trabado).
*Causa:* el encabezado + HUD + mapa de ruta + pie ocupan 400–500 px de alto; la tarjeta de pregunta se queda con lo que sobra y tiene `overflow:hidden` (L207–211); `html, body` están en `position:fixed; overflow:hidden` (L32–34), así que no hay scroll; el único ajuste móvil es pasar las respuestas a 1 columna a ≤640 px (L339).
*Arreglo:* diseño «mobile-first» (sección 6, fase 1).

**P2 🟠 La explicación queda cortada en pantallas «medianas».** En 1280×800 no se lee entera en ninguna pregunta. *Causa:* la regla `@media (min-width:1200px) and (min-height:800px)` (L247) **agranda** tipografías y paddings justo donde no sobra espacio, y la barra «Siguiente» (`position:sticky`) tapa el texto. Es el momento de aprendizaje (la explicación) el que se pierde.

**P3 🟠 El desafío de arrastrar es inusable en celular.** En 390×844 la tarjeta visible mide 265 px y el contenido 1.077 px; las zonas de destino quedan fuera de pantalla (y a 1230 px de alto). Con toque real no se puede completar.

**P4 🟡 Superposiciones.** El logo de Energimundo (fijo, L63–70) tapa parte del texto «Educación media básica…» en celulares en vertical y se monta sobre el borde del encabezado en horizontal; en 390 px las etiquetas del mapa se pegan («HidráulicaEólica», «BiomasaUruguay»); la leyenda de la foto pisa el pie.

**P5 🟡 El nombre del jugador se trunca a una letra** en el HUD de 1920×1080 («JUGANDO **A…**» para «Ana y Liceo N°5»; «D…» para «Drag»). `max-width:180px` incluye la etiqueta (L386–387).

**P6 🟢** El botón «Modo Contrarreloj» se estira a todo el ancho (es `inline-flex` dentro de una columna flex). `user-scalable=no` y `maximum-scale=1` (L5) bloquean el zoom. No usa `100dvh`, `safe-area-inset` ni `overscroll-behavior`. `user-select:none` va sin prefijo `-webkit-` (L31); Safari suele exigir el prefijo, así que en iPhone/iPad probablemente se pueda seleccionar texto con pulsación larga (a probar en un equipo real).

### 3.2 Jugabilidad, puntaje y trampas (J)

**J1 🔴 La opción más larga acierta casi siempre.** En **76 de 100** preguntas la correcta es estrictamente la más larga (79,5 % contando empates; azar = 25 %). Por estación: Hidráulica 9/20 · Eólica **18/20** · Solar **17/20** · Biomasa **17/20** · Uruguay **15/20**. En promedio la correcta mide **2,63×** el largo de las incorrectas. Ejemplos: `biomass#19` («Aproximadamente el 40 % del consumo energético global del país» contra «0,5 % | 90 % | 100 %») y `final#12` («Más del 99,8 % de los hogares» contra «50 % | 75 % | 30 %»).

**J2 🔴 La posición de la respuesta correcta es un ciclo.** `randomizeStationQuestions` fuerza `(número de pregunta + offset) % 4` (L732): en 2.000 partidas simuladas el patrón fue **100 % cíclico** (A→B→C→D→A…, con arranque al azar). El reparto es parejo, pero es predecible.

**Qué puntaje saca cada tipo de jugador** (600 partidas simuladas con las funciones reales del juego):

| Jugador | Puntaje medio (máx. 290) | Aciertos | Insignia final |
|---|---|---|---|
| Azar puro | 65 | 25 % | 100 % «Explorador/a en Formación» |
| **Siempre la opción más larga (sin leer)** | **224** | **79 %** | 88 % «Guardián/a», 4 % «Experto/a» |
| **Detecta el ciclo tras 1 respuesta** | **282** | **97 %** | **100 % «Experto/a en Energías Renovables»** |
| Sabe el 70 % y adivina el resto | 217 | 77 % | 77 % «Guardián/a», 5 % «Experto/a» |

Un jugador que no sabe nada pero usa la regla de la longitud saca **más** que uno que realmente sabe el 70 %. El ranking premia el truco.

**J3 🟠 El contrarreloj no respeta la lectura y no premia la rapidez.** Cada pantalla tiene en promedio **29,6 palabras** para leer (enunciado + 4 opciones; máximo 48). A 150 palabras/min son ~12 s solo de leer: con 15 s **no alcanza a leer 23 de 100 preguntas** (42 de 100 a 120 palabras/min, que es una lectura normal a los 12 años). Responder en 1 s o en 19 s da el mismo puntaje. Además, el temblor de la tarjeta (hasta ±10 px y 2,2° de giro, durante los últimos 10 s, L1230–1247) mueve los botones mientras se intenta tocarlos.

**J4 🟡 El desafío final no suma puntos y es trivial.** Son 4 ítems con los mismos nombres de las estaciones, reintentos ilimitados sin costo, y no cambia el puntaje ni la insignia. Además el botón de la última estación dice «Ver resultados finales» pero lleva al desafío (L1100).

**J5 🟡 Ranking.** Mezcla partidas con y sin tiempo; sin desempate (por tiempo); solo muestra 4; adivinar no tiene costo.

**J6 🟡 No hay repaso.** La explicación se ve una vez; al terminar no queda nada de lo que fallaste.

**J7 🟢 Fugas entre preguntas.** Una pregunta o explicación regala la respuesta de otra de la misma estación. Ejemplos claros: `biomass#13` nombra «ALUR», que es la respuesta de `biomass#12`; la explicación de `solar#6` dice «inversor», respuesta de `solar#7`; `wind#14` y `wind#20` (Pampa). Si caen en la misma partida (≈5 % por par) la segunda es gratis.

### 3.3 Contenido: el banco de 100 preguntas (C)

**C1 🔴 Sesgo de longitud** (J1). La raíz es el banco, no el código: hay que reescribir distractores con largo y plausibilidad parecidos (ejemplos en la sección 6.3).

**C2 🔴 Datos a corregir** (detalle y fuentes en el apéndice A):

| ID | El juego dice | Lo correcto |
|---|---|---|
| `solar#12` 🔴 | «Ley de Energía Solar Térmica (**Ley 18.597**)» | Es la **Ley 18.585**. La 18.597 es la de *Uso Eficiente de la Energía* |
| `final#13` 🔴 | Tarifa «**Doble u Horario Inteligente**» | No existe con ese nombre. UTE tiene *Tarifa Residencial Doble Horario* y *Triple Horario*, dentro del *Plan Inteligente* |
| `wind#6` 🟠 | «primer parque eólico experimental de UTE a **inicios de los años 2000**» | Caracoles es el primer parque de UTE, pero se montó en 2008, entró en producción en febrero de 2009 y se amplió en 2010. Además dice «experimental» en el enunciado y «comercial» en la explicación |
| `wind#3` 🟡 | «cerca de **30** parques… unos 700 aerogeneradores» | Las fuentes públicas hablan de **43 parques** |
| `final#6` 🟡 | «Segunda **Transformación** Energética» | El nombre del MIEM es «Segunda **Transición** Energética» |

**C3 🟠 Matices y rotulado** (no son datos inventados, pero un estudiante que los busque va a encontrar otra cosa):

- **Matriz 2025 (`hydro#4`, `wind#1`, `biomass#4` y el gráfico final):** 46/34/14/4/2 coincide con el comunicado preliminar del MIEM sobre lo **entregado a la red (SIN): 13.040 GWh**. Pero el juego lo atribuye al «Balance Energético Preliminar» y lo titula «Matriz eléctrica real 2025» sin decir la base. El Balance Energético Preliminar 2025 (abril de 2026) da otra base, **generación total 15.855 GWh: 38,5 / 28,1 / 27,9 / 3,7 / 1,8** (probablemente porque incluye lo que las industrias generan para sí, aunque no lo pude confirmar). La biomasa pasa de 14 % a 28 %. **Arreglo:** rotular la base y convertirlo en una lección («dos formas de contar»).
- `biomass#19`: «≈40 % del consumo final» → BEN 2024: **36 %** (algunas notas del mismo balance dicen 37 %).
- `hydro#15` y `hydro#19`: Salto Grande a «15 km» de la ciudad (las fuentes dicen 13 km) y «22 a 25 m» de salto (26 m).
- `wind#20`: «comprar acciones» fue cierto en Valentines (desde US$ 100) pero Pampa fue con *certificados de participación* de un fideicomiso (≈4.000 minoristas, ~15 % del capital).
- `biomass#8` Galofer quema una mezcla (hasta 20 % de cáscara de arroz y biomasa forestal).
- `hydro#11` Palmar: la central está en Soriano; el embalse toca Flores, Durazno y Río Negro.
- `solar#4` Melo: ya está en construcción (inicio abril 2026, fin previsto 2028); «el futuro» queda viejo.

**C4 🟠 Fuentes.** 23 «fuentes» distintas, **0 con enlace y 0 con año**; «MIEM» figura en 44 preguntas (más combinadas) incluso para física general; hay «Sector Eólico». Y la bienvenida (L893) habla de «base de datos verificada» y el pie (L516) de «Datos verificados». Con lo anterior, hoy no se puede afirmar eso.

**C5 🟡 Redacción.** 4 preguntas sin «¿» de apertura (`wind#3`, `wind#5`, `solar#4`, `final#2`; en `wind#3` y `final#2` el «¿» queda a mitad de frase). **«robótico» en lugar de «robusto»** (`final#20`), «las álabes» → «los álabes» (`biomass#18`), «primera… pionera» (`hydro#18`). 8 explicaciones pasan las 22 palabras. Vocabulario muy técnico para 12–15 años (erogar, aportaciones, penillanuras, lignina, anaeróbica).

**C6 🟡 Distractores que se descartan sin saber.** 17 de 300 incorrectas usan absolutos o disparates («Solo con huracanes», «A 1 km/h», «Ninguno»); 17 preguntas tienen 4 opciones numéricas de órdenes de magnitud distintos (se resuelven estimando); `biomass#17` pregunta por «un árbol del género *Eucalyptus*» y ninguna otra opción es un eucalipto.

**C7 🟡 Tipo y dificultad.** Por el arranque del enunciado: **45 % nombre/lugar/fecha/organismo, 21 % dato numérico, 14 % definición, 16 % «por qué/cómo»**. Sin etiqueta de dificultad: el sorteo 5/20 da partidas muy desparejas.

**C8 🟢 Vigencia.** Cifras como «2025», «1.538 MW» o «el futuro parque Melo» envejecen: no hay fecha de vigencia ni de revisión.

### 3.4 Accesibilidad (A)

**A1 🟠 Contraste.** El botón principal (blanco sobre ámbar `#E8990F`) tiene **2,33:1** (mínimo 4,5:1): afecta «Comenzar», «Comenzar estación», «Siguiente», «Continuar» y «Jugar de nuevo». Tema Solar: números en ámbar sobre crema **2,18:1**; tema Eólica: etiqueta **3,91:1**; etiquetas del desafío **4,31:1**. **Arreglo de una línea:** el token `--cta-ink` (`#3A2A0F`) ya existe; con él el botón da **5,93:1** y conserva el ámbar de marca.

**A2 🟠 «Movimiento reducido» está roto** (L415: `animation:none !important; transition:none !important`):
- la **barra de tiempo queda en 0 px desde el inicio** (medido: 0 de 1.390 px a los 0,4 s) mientras el número sigue contando;
- la **tarjeta de logro queda en 80×35 px y torcida** (en lugar de 304×100) porque su estado inicial es `scale(0.3) rotateY(-40deg)` y la animación `forwards` está anulada;
- el **confeti queda quieto** en `top:-20px`, invisible;
- el **temblor por JS sigue activo** (la preferencia no lo alcanza).

**A3 🟠 Teclado y lector de pantalla.** Tras responder el foco cae a `<body>`; no hay región `aria-live` para el resultado ni el tiempo; hay un solo atributo ARIA en toda la pantalla de pregunta; el desafío de arrastrar solo funciona con puntero (las fichas tienen `tabindex=-1`).

**A4 🟡** Objetivos táctiles menores a 44 px: chips de duración **36 px**, interruptor de contrarreloj **42 px**.
**A5 🟡** Zoom bloqueado (P6). **A6 🟢** El logo fijo queda fuera de los *landmarks*. Sin botón de silencio. La vibración solo existe en Android.

### 3.5 Errores de código (B)

| ID | Sev. | Problema | Evidencia |
|---|---|---|---|
| B1 | 🔴 | Si el navegador no tiene Web Audio, **pantalla en blanco** (`new (AudioContext||webkitAudioContext)()` sin `try`, L521) | `is not a constructor`; no aparece «Comenzar» |
| B2 | 🟠 | El juego **espera a Google Fonts**: la hoja de estilos bloquea el pintado (L10) y `render()` corre en `window.onload` (L1464) | Con la hoja demorando 6 s, «Comenzar» apareció a los 6,07 s |
| B3 | 🟠 | El nombre escrito **se borra** al activar «Contrarreloj» o cambiar la duración (re-render, L931–941) | `"Liceo 5 - 2B"` → `""` |
| B4 | 🟠 | `escapeHtml` no escapa comillas (L790–794) y se usa dentro de `value="…"` (L896): rompe el campo e **inyecta atributos** | `Liceo "Artigas" 2B` → muestra `Liceo `; `x" autofocus onfocus="…` ejecutó JS (auto‑XSS en kiosco) |
| B5 | 🟡 | «✅ Tu puntaje quedó anotado» aunque `localStorage` falle (L1152) | Con almacenamiento bloqueado igual lo dice |
| B6 | 🟡 | `font-family:'Fredoka'` sin fuente genérica (L370, 381, 441, 468): sin red cae a *serif* | Se ve en las capturas («19/25» en Times) |
| B7 | 🟡 | El temporizador usa `Date.now()` (L1197): si se bloquea la pantalla o se cambia de app, la pregunta vence | Lectura de código |
| B8 | 🟡 | `<link rel="icon" href="logo.png">` (L7): ese archivo no existe → 404 | |
| B9 | 🟡 | `render()` reconstruye todo el DOM en cada acción: reinicia animaciones (aspas, olas), re-dispara el *fade* al responder y pierde el foco. Hay 8 animaciones infinitas siempre activas | |
| B10 | 🟢 | «5 preguntas por estación» y «25 en total» repetidos en 10+ lugares (L725, 747, 827–839, 1097) | |
| B11 | 🟢 | `color-mix()` (L79, 127, 146, 167) exige Chrome ≥111/Safari ≥16.2: en un navegador viejo la barra de progreso queda invisible | Lectura de código |
| B12 | 🟢 | Estado global mutable, sin tests ni CI | |

### 3.6 Red, offline y rendimiento (R)

**R1 🟠 Fotos enlazadas a Wikimedia a 1920 px.** Pesan **2,0 MB** en total (Hidráulica 631 KB, Uruguay 427, Biomasa 352, Solar 302, Eólica 300) y se muestran con `blur(9px)`: sirve una imagen de ~960 px en WebP (~30 KB). Se piden recién al llegar a cada estación (no hay precarga), así que «aparecen de golpe». Enlazar imágenes de Wikimedia en producción es frágil: Wikimedia aplica límites de pedidos (la **API me devolvió HTTP 429** desde esta red compartida; las imágenes en sí cargaron bien) y recomienda copiar el material en usos intensivos. Con muchos equipos en una red de liceo o de museo, es un riesgo real.
**R2 🟠 Sin offline ni instalación:** no hay `manifest`, `service worker` ni íconos. Sin red tampoco hay fotos ni tipografías (B6).
**R3 🟡 Rendimiento sin medir** (hipótesis desde el código): capas con `blur(75px)` animadas + `blur(9px)` a pantalla completa + `backdrop-filter` + 8 animaciones infinitas + un `requestAnimationFrame` de temblor. En equipos viejos conviene medir y simplificar.
**R4 🟢 Pesos razonables:** HTML 119 KB (logo en base64 18 KB, banco ≈30 KB); Google Fonts 101 KB (6 archivos `woff2`).

### 3.7 Modo kiosco (K) — «pantalla táctil» del museo

**K1 🟠 Sin reinicio por inactividad:** la partida de la persona anterior queda abierta con su nombre y puntaje.
**K2 🟠 Ranking atrapado en el navegador:** no se puede exportar ni borrar desde la interfaz (hay que borrar datos del navegador); sin PIN de administración.
**K3 🟡 Nombre obligatorio** (L919–925): fricción en un kiosco con teclado en pantalla, y los nombres de menores quedan visibles en la pantalla.
**K4 🟡** Sin pantalla de «atracción», sin pantalla completa, sin bloqueo de menú contextual.
**K5 🟡 Duración:** 25 preguntas ≈ 10 min. Para una visita de museo conviene un modo corto (10 preguntas ≈ 4 min).

### 3.8 Legal, privacidad y seguridad (L)

**L1 🟠 Fotos con licencia que exige crédito, sin crédito.**

| Estación | Archivo | Licencia | Autor | ¿Crédito obligatorio? |
|---|---|---|---|---|
| Hidráulica | `Represa Salto Grande.jpg` | CC BY‑SA 3.0 | Shant | **Sí** |
| Eólica | `Parque Eólico "Sierra de los Caracoles" – panoramio (1).jpg` | CC BY‑SA 3.0 | Andrés Franchi Ugart | **Sí** |
| Solar | `Solar panels in Paysandú Department.jpg` | CC0 | Mx. Granger | No |
| Biomasa | `Botnia-Ñandubaysal.jpg` | CC BY‑SA 3.0 / GFDL | Roblespepe | **Sí** |
| Uruguay | `Sunset on the beach in Colonia del Sacramento.jpg` | CC0 | Mx. Granger | No |

El juego solo muestra «📍 lugar». (Ya tenés una convención de créditos en el sitio del Tannat que se puede copiar.)

**L2 🟠 La foto de «Biomasa» no es lo que dice.** Es la **planta de celulosa de UPM (ex Botnia) en Fray Bentos vista desde la costa argentina** (playa Ñandubaysal), y la leyenda dice «Planta de biomasa forestal, Río Negro» (que además confunde río y departamento). Es una imagen ligada al conflicto de las pasteras, mostrada en una pantalla en Salto, frente a Concordia. Conviene reemplazarla y que cada leyenda describa lo que la foto realmente muestra.

**L3 🟠 Marca y respaldo.** El logo y el nombre de **Energimundo** (museo de Salto Grande, presentado por CTM Salto Grande y LATU) aparecen sin constancia de permiso, y el pie sugiere que MIEM/UTE/ADME/SEG/Energimundo «verificaron» los datos, lo que no está documentado.

**L4 🟡 Privacidad:** bien que no se envíe nada; pero hay nombres de menores en `localStorage` y en pantalla pública. **L5 🟡 Seguridad:** sin CSP; la inyección B4 es el vector; los datos propios van por `innerHTML`.

### 3.9 Diseño de juego y pedagogía (D)

- **D1.** Todo es opción múltiple de reconocimiento. Faltan ordenar, relacionar, estimar y simular.
- **D2.** La «ruta» es solo una barra de progreso; las estaciones no se juegan distinto.
- **D3.** El feedback explica la correcta pero no por qué la elegida está mal; no hay segunda chance.
- **D4.** Lo más valioso de la matriz uruguaya, **la complementariedad** (viento, agua, sol, biomasa se cubren entre sí; qué pasa en una sequía), solo aparece como preguntas sueltas. Es la mejor oportunidad de aprendizaje y de que el juego sea único frente a un quiz cualquiera.
- **D5.** No hay objetivos de aprendizaje declarados ni datos por pregunta (cuáles se fallan más) para mejorar el banco.

### 3.10 Mantenibilidad (M)

Un solo archivo con datos y lógica mezclados; el banco no es un JSON con esquema; sin linter, sin tests, sin CI, sin versión, sin proceso para actualizar cifras cada año.

---

## 4. Lo que está bien y hay que conservar

- La **identidad visual**: paleta cálida, Fredoka/Nunito, íconos SVG animados, color por estación.
- **Feedback inmediato con explicación y fuente**, mezcla por partida (5 de 20), 100 preguntas.
- **Código cuidadoso en el arrastre**: un solo arrastre por vez (probé con dos dedos: no deja fichas trabadas), `pointercancel`, captura con `try/catch`.
- Sonidos **sintetizados** (sin archivos), vibración, confeti, logros por racha.
- Ranking con clave versionada (`_v1`), tope de 50 y nombres escapados al listar.
- **Voseo consistente**, HTML semántico (`header/nav/main/footer`, `lang="es"`, botones reales).
- **No envía datos a terceros.**
- En 1920×1080 todo se puede tocar y leer (explicación completa en 100 de 100 preguntas; la línea «Fuente» en 99 de 100).

---

## 5. Arreglos rápidos (menos de una hora en total, ya identificados)

| # | Cambio | Resuelve |
|---|---|---|
| 1 | `.btn{ color:var(--cta-ink) }` | A1 (2,33 → 5,93:1) |
| 2 | Sacar `maximum-scale=1.0, user-scalable=no` | P6/A5 |
| 3 | Crear el `AudioContext` dentro de `try/catch` y recién en el primer toque | B1 |
| 4 | `DOMContentLoaded` en lugar de `onload`; fuentes locales; `font-family:'Fredoka', system-ui, sans-serif` en los 4 lugares | B2, B6 |
| 5 | `escapeAttr()` que escape `"` y `'`; guardar el nombre en `state` al escribir | B3, B4 |
| 6 | Reglas de movimiento reducido: estado final de la tarjeta de logro, barra de tiempo sin transición pero actualizada por JS, sin temblor | A2 |
| 7 | Chip del nombre sin el límite de 180 px (o la etiqueta aparte) | P5 |
| 8 | Quitar `<link rel="icon" href="logo.png">` o crear el archivo | B8 |
| 9 | Botón final: «Ir al desafío final» en lugar de «Ver resultados finales» | J4 |
| 10 | Corregir `solar#12`, `final#13`, `final#20`, `biomass#18` y los 4 «¿» | C2/C5 |

---

## 6. Propuesta de cambios

### 6.1 Qué sería «la app»

Una **PWA** (aplicación web instalable): el mismo juego, adaptado a cualquier pantalla, que se instala desde el navegador («Instalar» en Android, «Añadir a inicio» en iPhone/iPad), funciona **sin internet** y se actualiza sola. Es lo mismo que ya hacés en el sitio del Tannat (`sw.js`, `manifest.json`), así que el camino ya lo conocés. Un **modo kiosco** (`?kiosco=1`) sirve para la pantalla de Energimundo con el mismo código.

**Opciones de empaquetado** (la recomendación es la 1):

| # | Opción | Pro | Contra |
|---|---|---|---|
| 1 | **PWA** en GitHub Pages | Gratis, Android + iPhone + PC, sin tiendas, se actualiza sola | No está en Play Store |
| 2 | APK/AAB Android vía **TWA** (Bubblewrap / PWABuilder) | Se ve como app de Play Store | Para quitar la barra de URL necesita `/.well-known/assetlinks.json` **en la raíz del dominio**: con GitHub Pages de proyecto (`usuario.github.io/repo/`) eso no se puede sin dominio propio o repo de usuario. Cuenta de Google Play (pago único) |
| 3 | APK con **Capacitor** (empaqueta los archivos) | Offline nativo, sin verificar dominio | Necesita Android Studio/SDK para compilar (no está en este entorno; se puede hacer con un workflow de GitHub Actions) |
| 4 | **Kiosco** (Chrome `--kiosk` o Fully Kiosk Browser sobre la PWA) | Ideal para el museo | Solo para esa pantalla |

### 6.2 Fases

| Fase | Qué incluye | Resultado visible | Tamaño |
|---|---|---|---|
| **0. Decidir** | Dónde vive, dispositivos, qué es «app», qué hacemos con el contenido (sección 7) | — | chico |
| **1. Que funcione en cualquier pantalla** | Diseño *mobile‑first* (encabezado compacto, mapa de ruta como indicador fino, tarjeta que nunca recorta; `dvh`, `safe-area`); logo sin pisar; **desafío con «tocá y tocá»** además de arrastrar; contraste, zoom, teclado (A–D + Enter), `aria-live`, foco; movimiento reducido arreglado; **sin temblor** (o solo opcional); nombre/comillas/HUD; arranque sin esperar a Google; Web Audio perezoso; botón de silencio | Se juega bien en las 11 pantallas medidas y pasa axe sin faltas serias | mediano‑grande |
| **2. Que sea una app** | `manifest` + íconos (192/512/maskable) + `service worker` con versión (como `sw.js` del Tannat); **fotos propias en WebP ~960 px con crédito**; tipografías locales; botón «Instalar» e instrucciones para iPhone; QR; chequeo automático en Actions | Se instala y anda sin internet; arranque < 1 s con caché | mediano |
| **3. Que el puntaje signifique algo** | Banco en **JSON con metadatos**; reescribir ~76 distractores; corregir los 5 datos y rotular la base 2025; sorteo por dificultad (2 fáciles + 2 medias + 1 difícil) y **«bolsa» de posiciones** (balanceada pero sin patrón); evitar pares con fuga; **linter del banco**; fuente con enlace + fecha | El bot «más larga» baja a ≤ 35 %; no hay ciclo; cada dato tiene fuente | mediano‑grande |
| **4. Juego y aprendizaje** | Modo corto (10) y completo (25); contrarreloj con **tiempo según lectura** y bono por rapidez; **repaso de lo fallado** con explicaciones; desafío final con puntos y dificultad; ranking por modo con desempate por tiempo; alias en vez de nombre; y, si querés, el **simulador «Armá el día»** (cubrir la demanda con viento/agua/sol/biomasa y ver qué pasa en una sequía o sin viento) | Mejor retención y un diferencial real | grande |
| **5. Kiosco y operación** | `?kiosco=1`: reinicio por inactividad, pantalla de atracción, pantalla completa, **PIN** para exportar (CSV) o borrar el ranking; estadísticas **anónimas y locales** por pregunta | Listo para dejarlo solo en el museo | mediano |

**Recomendación:** hacer **1 + 2 + 3 como versión 1.0** (arreglar, instalar y que el puntaje valga) y dejar 4 y 5 para una 2.0 cuando veas cómo lo usa la gente. Lo que **no** haría: reescribir con un framework (el proyecto es chico; JS sin framework alcanza y es consistente con tu sitio), ni sumar analítica de terceros (en el Tannat ya decidiste lo contrario), ni cambiar la identidad visual.

### 6.3 Ejemplos de cómo quedaría el banco

**Antes** (`biomass#10`, la correcta es 6× más larga que el promedio):
> ¿Qué es el biogás? ✔ «Un gas combustible (compuesto principalmente por metano) producido por la descomposición anaeróbica de materia orgánica» ✘ «Gas natural importado» · «Vapor de agua hirviendo» · «Aire comprimido»

**Después** (largo y plausibilidad parecidos, lenguaje de 12–15 años):
> ✔ «Un gas combustible que se produce cuando los residuos orgánicos se descomponen sin oxígeno» ✘ «Un gas que se extrae de pozos de petróleo y llega en barco» · «Vapor de agua que sale de las calderas de las fábricas» · «Aire que se comprime para mover turbinas pequeñas»

**Antes** (`biomass#19`): ✔ «Aproximadamente el 40 % del consumo energético global del país» ✘ «0,5 %» · «90 %» · «100 %»
**Después:** «Cerca del 4 %» · «Cerca del 36 %» ✔ · «Cerca del 70 %» · «Casi el 100 %» — con `fuente: BEN 2024, MIEM` y `vigencia: 2024`.

**Esquema propuesto por pregunta:**

```json
{
  "id": "bio-019", "estacion": "biomasa", "dificultad": 2, "tipo": "dato",
  "pregunta": "¿Qué parte del consumo final de energía de Uruguay cubre la biomasa?",
  "opciones": ["Cerca del 4 %", "Cerca del 36 %", "Cerca del 70 %", "Casi el 100 %"],
  "correcta": 1,
  "explicacion": "…", "porQueNo": ["…", null, "…", "…"],
  "fuente": { "nombre": "Balance Energético Nacional 2024 (MIEM)", "url": "https://…", "vigencia": "2024" },
  "revisada": "2026-10-02", "volatil": true, "noJuntarCon": ["bio-012"]
}
```

**El linter del banco** (se corre solo en cada cambio) rechazaría: opción correcta > 1,6× el promedio de las otras; correcta más larga en > 35 % de una estación; absolutos solo en distractores; falta de fuente con enlace o fecha; enunciado sin «¿…?»; explicación que contiene la respuesta de otra pregunta de la misma estación.

### 6.4 Criterios de aceptación (las pruebas que quedarían automáticas)

1. En las 11 pantallas: las 4 respuestas y «Siguiente» son tocables y la **explicación se lee completa en las 100 preguntas**.
2. axe-core: **0 violaciones serias o críticas** en todas las pantallas y temas.
3. Bot «opción más larga» ≤ 35 % de aciertos; bot «detecta el ciclo» ≤ 30 %.
4. Con «movimiento reducido»: la barra de tiempo avanza y la tarjeta de logro se ve entera.
5. Un nombre con comillas no rompe el campo; escribir un nombre y activar contrarreloj **no lo borra**.
6. Sin Web Audio y sin internet el juego **igual aparece y se juega**.
7. Arranque con caché < 1 s; carga inicial ≤ 300 KB; todo precacheado ≤ 1 MB.
8. Desafío final completable con toque (sin arrastrar) y con teclado.

---

## 7. Decisiones que necesito de vos

1. **¿Dónde vive el proyecto?** *Recomiendo repo propio* (`ruta-de-la-energia`): otro público, otra marca (Energimundo/liceo) y otro ritmo de cambios que el sitio del Tannat. Si preferís no crear un repo ahora, lo arranco en una carpeta `energia/` de este repo con su propio `service worker` y después se mueve sin cambios.
2. **¿Dónde se va a usar?** Celulares de estudiantes / pantalla de Energimundo / las dos (lo recomendado: un mismo código con modo kiosco).
3. **¿Qué es «app» para vos?** PWA instalable (recomendado) · APK Android · las dos. Si querés APK, hay que decidir TWA (necesita dominio) o Capacitor.
4. **Contenido:** ¿Reescribo los ~76 distractores y corrijo los 5 datos **con fuente y enlace** y vos los revisás antes de publicar? (lo recomiendo; en un banco que dice «verificado» la última palabra tiene que ser humana).
5. **Marca y respaldo:** ¿tenés permiso o contacto en Energimundo (CTM Salto Grande / LATU) para el logo y el nombre? Mientras tanto propongo cambiar el pie a «Datos de MIEM, UTE, ADME… consultados en [fecha]» en vez de «verificados».
6. **Alcance de la 1.0:** ¿incluimos ya el modo corto (10 preguntas) y el modo kiosco, o primero 1+2+3?

---

## 8. Qué se hizo (versión 1.0)

Pediste ejecutar todo lo de «lo más importante que encontré», con una sola restricción: **el juego se usa únicamente en una pantalla interactiva Ricoh y no en celulares**, y que decidiera yo el resto. Mientras trabajaba aclaraste que no es de 85" sino la **Ricoh D6510**. Según la [ficha técnica de Ricoh](https://tiimg.tistatic.com/fm/7977644/08_d6510.pdf), es una pantalla de **65" Full HD (1920 × 1080, puntos de 0,744 mm)**, táctil por infrarrojos: **10 toques a la vez conectada a una PC por USB y 2 con el controlador de Ricoh**, con ±10 mm de precisión; no trae computadora propia y se maneja con una PC o con el controlador Windows opcional de Ricoh. Eso cambia el diseño: los hallazgos de celular (P1, P3, P4 en vertical) dejan de aplicar y se reemplazan por una exigencia más clara: **que nada se corte, se tape ni obligue a desplazarse en 1920 × 1080** (y que siga entrando en 4K y en otros tamaños si alguien lo prueba en una computadora), y que **varias personas puedan tocar a la vez** sin perder toques.

### 8.1 Decisiones que tomé por vos (sección 7)

| # | Decisión | Qué hice | Por qué |
|---|---|---|---|
| 1 | Dónde vive | Carpeta `energia/` de este repositorio, con su propio service worker (alcance `/energia/`), sin tocar el sitio del Tannat salvo una línea en su README | No pediste un repo nuevo; se puede mover sin cambios |
| 2 | Dónde se usa | **Solo la Ricoh D6510** (65", 1920 × 1080, 10 toques o 2 con el controlador de Ricoh). Diseño de 1920 × 1080 que escala entero a otros tamaños; botones y fichas de al menos 4 cm (el sensor puede errar 1 cm), medido con una prueba automática y letras grandes (1 punto de diseño = 0,744 mm en esa pantalla); funciona con Chrome o Edge en Windows; atiende dos o más toques simultáneos | Tu restricción y la ficha de Ricoh |
| 3 | «App» | **Instalable (PWA) y un archivo único** (`dist/ruta-de-la-energia.html`, unos 490 KB) para copiar en un pendrive. Sin APK | Una pantalla Ricoh abre Chrome; un APK solo agregaría trámite |
| 4 | Contenido | Banco **reescrito de cero**: 100 preguntas con fuente, vigencia, dificultad y exclusiones entre preguntas | Los datos erróneos y el sesgo de largo estaban en el banco, no en el código |
| 5 | Marca y respaldo | El pie ya no dice «verificados»: dice de qué fuentes salen los datos y remite a «Créditos y fuentes». **Se conservó el logo de Energimundo** (el original ya lo usaba) | Pendiente tuyo: confirmar el permiso (ver 8.4) |
| 6 | Alcance | Entró todo: **recorrido corto**, **modo puesto**, ranking por categoría, repaso de errores | Cabía sin riesgo y resuelve K1 a K5 |

### 8.2 Resultado por hallazgo

| Hallazgo | Qué se hizo | Cómo se comprueba |
|---|---|---|
| **P1 a P6** pantallas | Diseño propio de 16:9 (1920 × 1080) que se escala; encabezado de alto fijo; el logo dentro del encabezado; el nombre se corta con «…» y no a una letra; sin `overflow:hidden` en la tarjeta; zoom del navegador permitido y toques dobles desactivados (`touch-action`) | `tests/browser/diseno.test.js`: 100 preguntas × (sin responder, acierto, error) × 5 tamaños, más todas las pantallas y el tamaño de cada botón en centímetros de la D6510 |
| **J1, C1, C6** opción más larga | Los 300 distractores se reescribieron con largo y plausibilidad parecidos | La más larga acierta **24 %** (antes 79 %), la más corta 19 %; ninguna estrategia por largo pasa de 33 % (`npm run check`) |
| **J2** ciclo A→B→C→D | La posición se sortea sin rachas de tres ni escaleras | Diez trampas de posición y de largo, 1.500 partidas cada una: todas entre 17 % y 33 % (`tests/unit/motor.test.js`) |
| **J3** contrarreloj | El tiempo sale de lo que hay que leer (6 s + palabras / 2,5) y del ritmo elegido; hasta +5 por rapidez; se frena con un diálogo abierto o con la pantalla oculta | `flujo.test.js`, `motor.test.js` |
| **J4** desafío | Une 5 lugares (3 en el corto) con su **departamento**, con 2 fichas de más, 10 puntos a la primera y 5 a la segunda; a la segunda equivocación se muestra la respuesta | `motor.test.js`, `flujo.test.js`, `tactil.test.js` |
| **J5** ranking | Una tabla por categoría (recorrido × contrarreloj), desempate por precisión y tiempo, top 5 | `almacen.test.js` |
| **J6** repaso | Pantalla de repaso de lo que se falló, con la respuesta y la fuente | `flujo.test.js` |
| **J7** fugas | Exclusiones entre preguntas (`noJuntarCon`), simétricas | `motor.test.js` (500 partidas) |
| **C2, C3** datos | Corregidos y rotulados: Ley 18.585, tarifa Doble Horario, Caracoles 2008-2009, «más de 40 parques», Segunda Transición, matriz 2025 con sus **dos bases oficiales** (entregada a la red 13.040 GWh / toda la generación 15.855 GWh) | `js/datos/` y la pantalla final |
| **C4** fuentes | 56 fuentes con enlace; cada pregunta cita las suyas y el año del dato | `check-banco.js` |
| **C5, C7, C8** redacción, tipo, vigencia | «¿» balanceados, explicaciones de hasta 30 palabras, dificultad 1-3 por pregunta, año de vigencia | `check-banco.js` |
| **A1** contraste | Botón principal con texto oscuro (**8,0:1**, antes 2,33:1); colores de texto por estación; los textos sobre las fotos van en recuadros claros | `contraste.test.js` y `a11y.test.js` (axe, 0 violaciones en todas las pantallas) |
| **A2** movimiento reducido | La barra de tiempo corre con JavaScript; el logro se ve completo; sin temblor | `flujo.test.js` |
| **A3, A4, A6** teclado y lectores | Teclas A-D y 1-4, foco que sigue la partida, regiones `aria-live`, el desafío también va con teclado, objetivos de 56 px o más, botón de silencio | `flujo.test.js`, `a11y.test.js` |
| **B1 a B12** código | Web Audio perezoso con `try`; ningún pintado espera a la red; el nombre se conserva; los nombres entran como texto (no HTML); «guardado» solo si se guardó; tipografías con respaldo; reloj que cuenta solo el tiempo en pantalla; ícono propio; la pregunta actualiza solo lo que cambia; sin `color-mix`; constantes en `config.js`; pruebas y CI | `flujo.test.js`, `.github/workflows/energia.yml` |
| **R1 a R4** red y offline | Fuentes y fotos propias (cinco WebP ya desenfocados de ~25 KB), service worker, manifiesto, íconos, archivo único | `offline.test.js`, `archivo-unico.test.js` (abre desde `file://` sin pedir nada por red) |
| **K1 a K5** puesto | Aviso «¿Seguís ahí?» y vuelta al inicio; administración con PIN (exportar y borrar el ranking, estadística de preguntas); nombre opcional con alias al azar y teclado en pantalla; pantalla completa y pantalla encendida; sin menú contextual; recorrido corto | `flujo.test.js` |
| **L1, L2** fotos | Cada foto con autor y licencia, en el pie y en «Créditos y fuentes». La foto de Biomasa (la planta de UPM vista desde la costa argentina) se reemplazó por una de la planta de Montes del Plata en Colonia, tomada desde Uruguay | `flujo.test.js` (créditos) |
| **L3** marca | El pie ya no afirma que nadie «verificó» los datos | `flujo.test.js` |
| **L4, L5** privacidad y seguridad | Nada sale de la pantalla; alias en lugar de nombre; los textos del jugador nunca se insertan como HTML; política de seguridad (CSP) que **prohíbe toda conexión de salida** y los programas de afuera | `flujo.test.js`, `privacidad.test.js` (intenta `fetch`, `XMLHttpRequest`, imágenes, `sendBeacon` y scripts hacia otro sitio: todo bloqueado) |
| **Nuevo** toques simultáneos (no estaba en el análisis) | Al probar con toques reales de varios dedos apareció algo que no había medido: con **dos dedos a la vez Chrome no genera el `click` de ninguno**, así que en una pantalla compartida se perdían los dos toques (el original usa `onclick`, por lo que debería tener la misma limitación; no lo medí). Ahora un toque que termina sobre el mismo botón donde empezó se atiende aunque Chrome no genere el `click`; el inicio ya no se redibuja entero al tocar una opción; y un **antirrebote** de 0,3 s al abrir cada pantalla evita que un toque doble o un toque «fantasma» de la pantalla infrarroja encadene pantallas | `tactil.test.js`, `antirrebote.test.js` (dos y tres dedos a la vez: respuestas, opciones del inicio, teclado en pantalla, arrastre) |
| **M** mantenimiento | Datos separados del código, linter del banco, 50 pruebas de Node y 57 pruebas en Chrome, CI, versión y fecha de revisión de los datos | `npm run todo` |

### 8.3 Antes y después

| | Original | Ahora |
|---|---|---|
| Acierto de quien elige siempre la opción más larga | 79 % | 24 % |
| Acierto de quien sigue el ciclo de posiciones | 97 % | 25 % |
| Contraste del botón principal | 2,33 : 1 | 8,0 : 1 |
| Preguntas con la explicación completa visible en 1280 × 800 | 0 de 100 | 100 de 100 (y en 1920 × 1080 —el tamaño de la D6510—, 4K, 1366 × 768 y 1024 × 768) |
| Violaciones de accesibilidad (axe) | varias | 0 |
| Lo que baja de internet al jugar | ~2,1 MB de fotos y tipografías | nada (todo va en el juego) |
| Si falla el sonido o el guardado | pantalla en blanco / dice «guardado» igual | sigue funcionando / avisa que no se guardó |

### 8.4 Lo que no se hizo o queda en tus manos

* **No se probó en la pantalla Ricoh D6510 real**, ni en Windows con Chrome o Edge, ni en Safari. Las pruebas corrieron en Chromium 141 con la pantalla simulada (1920 × 1080 y 3840 × 2160) y con toques reales, de uno y de varios dedos, por el protocolo de Chrome. El archivo `.bat` de `dist/` tampoco se pudo probar en Windows. Conviene una prueba de 15 minutos en el equipo antes de dejarlo.
* **Revisión humana de contenido.** Hay 12 preguntas cuya única fuente no se pudo abrir completa (solo se verificó por buscador): `eol-016`, `sol-010`, `sol-016`, `bio-005`, `bio-010`, `bio-011`, `bio-012`, `bio-014`, `bio-016`, `bio-018`, `bio-019` y `uru-003`. Son conocimientos generales (biogás, bagazo, efecto estela…) y de bajo riesgo, pero alguien debería confirmarlas contra la fuente antes de publicar.
* **Permiso del logo de Energimundo** (CTM Salto Grande / LATU): se conservó el uso del original; conviene tener constancia.
* **Mapa de Uruguay** para el desafío: no se hizo (haría falta dibujar los 19 departamentos). El desafío se resuelve con nombres.
* **Otros tipos de pregunta** (ordenar, estimar, simular una sequía; D1 a D5): no se agregaron. La complementariedad de las fuentes aparece en preguntas sueltas (`hid-014`, `sol-005`, `uru-020`), no en una actividad propia.
* **Pantalla de atracción** (K4): no se hizo; el inicio ya muestra el ranking y las reglas.
* **APK:** no se hizo (ver decisión 3).
* **Lector de pantalla real:** la accesibilidad se midió con axe y con pruebas de teclado y foco, no con NVDA ni TalkBack.
* **Rendimiento en el equipo real:** no se midió; se quitaron los desenfoques en vivo y casi todas las animaciones infinitas para no depender de la potencia del equipo.
* **El PIN** de fábrica (`4286`) hay que cambiarlo en `js/config.js` antes de dejarlo.

## Apéndice A — Verificación de datos (26 chequeos)

**✗ Error / desactualizado**

| ID | Afirmación del juego | Qué dicen las fuentes | Fuente |
|---|---|---|---|
| `solar#12` | Ley de Energía Solar Térmica = Ley 18.597 | La solar térmica es la **Ley 18.585** (18‑09‑2009); la **18.597** (21‑09‑2009) es *Uso Eficiente de la Energía* | [Ley 18.585](https://legislativo.parlamento.gub.uy/temporales/leytemp6274519.htm) · [Ley 18.597](https://parlamento.gub.uy/documentosyleyes/leyes/ley/18597) · [MIEM, leyes de energía solar](https://www.miem.gub.uy/energia/leyes-vinculadas-la-energia-solar) |
| `final#13` | Tarifa «Doble u Horario Inteligente» | *Tarifa Residencial Doble Horario (TRD)* y *Triple Horario (TRT)*, dentro del *Plan Inteligente* | [UTE, opciones tarifarias](https://www.ute.com.uy/clientes/soluciones-para-el-hogar/planes-hogar/opciones-tarifarias-para-hogares) · [Plan Inteligente Hogares](https://www.ute.com.uy/clientes/soluciones-para-el-hogar/planes-hogar/plan-inteligente-hogares) |
| `wind#6` | Primer parque eólico de UTE «a inicios de los 2000» | 5 aerogeneradores en 2008; producción industrial 5‑feb‑2009; ampliación a 20 MW en 2010 | [UTE: 15 años del Parque Eólico Sierra de los Caracoles](https://www.ute.com.uy/noticias/15-anos-del-parque-eolico-sierra-de-los-caracoles-ing-emanuele-cambilargiu) |
| `wind#3` ✏️ | «cerca de 30 parques» | Uruguay XXI (oct. 2025): **41 parques**, unos 1.500 MW; Wikipedia habla de 43. En el juego nuevo se dice «más de 40 parques» | [Uruguay XXI, Energías renovables 2025](https://www.uruguayxxi.gub.uy/uploads/informacion/260810-8be4/Informe%20Energ%C3%ADas%20Renovables%202025.pdf) · [Energía eólica en Uruguay (Wikipedia)](https://es.wikipedia.org/wiki/Energ%C3%ADa_e%C3%B3lica_en_Uruguay) · [energiaeolica.gub.uy](http://www.energiaeolica.gub.uy/index.php?page=parques-en-uruguay) |
| `final#6` | «Segunda **Transformación** Energética» | Nombre del MIEM: «Segunda **Transición** Energética» | [MIEM](https://www.gub.uy/ministerio-industria-energia-mineria/politicas-y-gestion/segunda-transicion-energetica-movilidad-electrica) |

**~ Matiz o rotulado**

| ID | Afirmación | Qué dicen las fuentes | Fuente |
|---|---|---|---|
| `hydro#4`, `wind#1`, `biomass#4`, gráfico | 46/34/14/4/2 «según el Balance Energético Preliminar» | Ese reparto es el del comunicado preliminar sobre lo entregado al SIN (13.040 GWh). El **Balance Energético Preliminar 2025** da **15.855 GWh: hidráulica 6.100 (38,5 %), eólica 4.457 (28,1 %), biomasa 4.415 (27,9 %), solar 591 (3,7 %), fósiles 293 (1,8 %)** | [Ámbito (SIN, 13.040 GWh)](https://www.ambito.com/uruguay/llego-al-98-energia-electrica-renovable-2025-y-se-consolida-como-referente-regional-n6230863) · [Medios Públicos](https://mediospublicos.uy/el-98-de-la-energia-electrica-generada-en-2025-fue-de-origen-renovable-informo-el-miem/) · [Todo el Campo (Balance Preliminar, 15.855 GWh)](https://todoelcampo.com.uy/archives/46249) |
| `biomass#19` | ≈ 40 % del consumo final | BEN 2024: residuos de biomasa **36 %** del consumo final (35 % los combustibles fósiles) | [Infonegocios, BEN 2024](https://infonegocios.biz/enfoque/hacia-la-segunda-transicion-energetica-hitos-relevantes-del-ben-2024) |
| `hydro#15`, `hydro#19` ✏️ | 15 km; salto de 22–25 m | 13 km al norte de Salto (Intendencia de Salto). Salto: **25,30 m** según la ficha técnica de la CTM (la cifra de 26 m que figuraba acá era de Wikipedia y es menos confiable) | [Intendencia de Salto](https://turismo.salto.gub.uy/sitios-de-interes/represa-de-salto-grande) · [CTM Salto Grande, ficha técnica](https://www.saltogrande.org/ficha_tecnica.php) |
| `wind#20` | «comprar acciones» (Pampa y Valentines) | Valentines: acciones desde US$ 100. Pampa: certificados de un fideicomiso, ≈4.000 minoristas, ~15 % del capital | [Valentines](https://enperspectiva.uy/enperspectiva-uy/ute-lanzo-emision-de-acciones-para-el-parque-eolico-valentines/) · [Pampa (UTE)](https://www.ute.com.uy/noticias/inversores-de-parque-eolico-pampa-obtuvieron-22-sobre-el-capital-invertido) |
| `biomass#8` ✏️ | Galofer quema cáscara de arroz | **Era correcto.** Al leer después la página del MIEM: la cáscara de arroz es el **único combustible** de la planta (14 MWe, Villa Sara, Treinta y Tres). La «mezcla» que figuraba acá venía de una fuente secundaria y no se sostiene | [MIEM, planta Galofer](https://www.gub.uy/ministerio-industria-energia-mineria/publicaciones/plantas-operacion-galofer) |
| `hydro#11` | Palmar «Soriano y Flores» | Central en Soriano; el embalse limita con Flores, Durazno y Río Negro | [Represa de Palmar](https://es.wikipedia.org/wiki/Represa_de_Palmar) |
| `solar#4` | «El futuro» Parque Melo, 140.000 paneles, >75 MW | Cifras correctas; ya en construcción (inicio abril 2026; fin previsto 2028; 100 MWp) | [UTE, Parque Solar Melo](https://www.ute.com.uy/noticias/parque-solar-fotovoltaico-melo-el-mas-grande-del-pais-ute-anuncio-el-inicio-de-su-construccion) |

**✓ Confirmado** (14): ASAHI, 480 kW, Salto, 15‑mar‑2013, donación de Japón (`solar#1`) · Artilleros 65,1 MW, UTE + Eletrobras (`wind#5`) · La Jacinta, Salto, 64,8 MWp (`solar#3`) · Montes del Plata 180 MW (`biomass#3`) · Las Rosas, biogás de relleno sanitario, 1 MW (`biomass#11`) · Ruta Eléctrica, cargador cada 50 km (`final#8`) · Rincón del Bonete 1945 (`hydro#6`) · Salto Grande 14 turbinas Kaplan × 135 MW y pasos de peces (`hydro#8`, `hydro#5`) · electrificación 99,8–99,9 % (`final#12`) · 1.538 MW hidráulicos y 1.516 MW eólicos (BEN 2023) (`final#2`) · Energimundo en el acceso del complejo, Ruta 3 km 508 (`final#3`) · Pampa en Tacuarembó, 141,6 MW (`wind#14`) · Cuñapirú, 1882 (`hydro#18`; consistente con fuentes divulgativas, conviene citar una patrimonial).

**Fuentes de las fotos:** [Represa Salto Grande](https://commons.wikimedia.org/wiki/File:Represa_Salto_Grande.jpg) · [Sierra de los Caracoles](https://commons.wikimedia.org/wiki/File:Parque_E%C3%B3lico_%22Sierra_de_los_Caracoles%22_-_panoramio_(1).jpg) · [Solar Paysandú](https://commons.wikimedia.org/wiki/File:Solar_panels_in_Paysand%C3%BA_Department.jpg) · [Botnia‑Ñandubaysal](https://commons.wikimedia.org/wiki/File:Botnia-%C3%91andubaysal.jpg) · [Colonia](https://commons.wikimedia.org/wiki/File:Sunset_on_the_beach_in_Colonia_del_Sacramento.jpg).

---

## Apéndice B — Cómo reproducir los hallazgos principales

Las pruebas corrieron con Playwright sobre una copia del archivo. Cada una es un script corto; si aceptás la propuesta las convierto en pruebas automáticas del repo (en el mismo estilo que tu `scripts/smoke.js`). Resumen de qué mide cada una:

| Prueba | Mide |
|---|---|
| Estadística del banco | longitud de opciones, reparto de la correcta, fuentes, lectura, fugas, redacción |
| Simulación de partidas | puntaje/insignia de 4 estrategias, 600 partidas c/u, con `selectAnswer` real |
| Barrido de pantallas | 100 preguntas × 11 tamaños: respuestas tocables, «Siguiente», explicación y fuente visibles |
| Comportamiento | nombre perdido, comillas, inyección, movimiento reducido, foco, almacenamiento bloqueado, sin Web Audio |
| Arrastre | con mouse y con toque real (CDP); dos dedos; salto de layout |
| axe-core | accesibilidad por pantalla y por tema |
| Arranque | fuentes demoradas 6 s |
