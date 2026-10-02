# Ruta de la Energía Uruguay

Juego educativo sobre las energías renovables de Uruguay, hecho para la **pantalla interactiva Ricoh D6510** (65 pulgadas, Full HD de 1920 × 1080, táctil por infrarrojos) y para estudiantes de Educación Media Básica (12 a 15 años). Está inspirado en Energimundo, el museo de Salto Grande.

Es HTML, CSS y JavaScript comunes, sin framework y sin servidor. Una vez cargado funciona **sin internet** y **no envía ningún dato a terceros**: los nombres y puntajes quedan solo en la pantalla donde se juega.

Este juego reemplaza al archivo `JUEGORENOVABLESLICEO.html` original. El análisis completo de lo que tenía y de lo que se cambió está en [`ANALISIS_Y_PROPUESTA.md`](ANALISIS_Y_PROPUESTA.md).

## Cómo se juega

1. Se elige el **recorrido completo** (25 preguntas y un desafío, de 10 a 12 minutos) o el **recorrido corto** (10 preguntas y un desafío, unos 5 minutos). Se puede activar la **contrarreloj** (con ritmo tranquilo, normal o veloz) y escribir un nombre o un alias para el ranking, o dejarlo en blanco.
2. Se recorren cinco estaciones: Hidráulica, Eólica, Solar, Biomasa y Uruguay. Después de cada respuesta se explica por qué y se cita la fuente.
3. Al final, un **desafío**: unir lugares reales (por ejemplo, la represa de Salto Grande) con su departamento, tocando o arrastrando.
4. Resultados, ranking de la categoría, matriz eléctrica real de Uruguay (2025) y repaso de las preguntas que se complicaron.

Puntos: 10 por respuesta correcta, +5 cada tres seguidas, hasta +5 por rapidez (solo con contrarreloj) y, en el desafío, 10 por lugar a la primera y 5 a la segunda.

## Instalarlo en la pantalla Ricoh D6510

Según la [ficha técnica de Ricoh](https://tiimg.tistatic.com/fm/7977644/08_d6510.pdf), la D6510 es una pantalla de **65" con 1920 × 1080 puntos (cada punto mide 0,744 mm)**, táctil por infrarrojos: reconoce **10 toques a la vez si se la conecta a una PC por USB y 2 si se usa el controlador de Ricoh**, con una precisión de ±10 mm. No trae computadora propia: se maneja con una PC o con el controlador Windows opcional de Ricoh. Por eso el juego se abre con **Chrome o Edge en Windows**.

El diseño está medido para esos 1920 × 1080: la pregunta se lee desde varios metros y todos los botones y fichas del juego miden al menos 4 cm de lado (el sensor puede errar hasta 1 cm); solo el enlace «Créditos y fuentes» del pie es más chico, de unos 2,6 cm. Si dos personas tocan a la vez, no se pierde ningún toque; apenas se abre una pantalla se ignoran 0,3 segundos de toques, para que un toque doble o un toque «fantasma» de la pantalla infrarroja no pasen dos pantallas de golpe.

> **No se pudo probar en la pantalla real.** Lo siguiente es lo habitual de Chrome y Edge en Windows; el archivo `.bat` no se probó en Windows. Conviene una prueba corta (15 minutos de juego, con dos o tres personas tocando a la vez) antes de dejarla en uso.

### A. Un solo archivo (lo recomendado: sin internet y sin instalar nada)

1. Crear una carpeta **sin espacios en el nombre**, por ejemplo `C:\RutaEnergia`, y copiar ahí los dos archivos de la carpeta `dist/`:
   * `ruta-de-la-energia.html`: el juego completo en un solo archivo de unos 500 KB, con todo adentro;
   * `iniciar-en-pantalla-completa.bat`: lo abre a pantalla completa (modo kiosco) con Chrome o, si no hay, con Edge.
2. Hacer doble clic en `iniciar-en-pantalla-completa.bat`.
3. Para que arranque solo al encender el equipo: `Win + R`, escribir `shell:startup` y dejar ahí un acceso directo al `.bat`.
4. Con un teclado, `Alt + F4` cierra el modo kiosco. Sin teclado, no se puede salir tocando la pantalla.
5. Para **actualizar** el juego, reemplazar `ruta-de-la-energia.html` por el nuevo: el ranking se conserva porque queda guardado en el navegador, no en el archivo.

Ajustes de Windows que conviene hacer (los hace quien administre el equipo):

* **Energía:** que la pantalla y el equipo nunca se apaguen ni se suspendan mientras esté enchufado.
* **Gestos de borde:** si al deslizar el dedo desde el borde aparecen paneles de Windows, desactivarlos con la directiva de grupo «Permitir deslizamiento desde el borde» (Plantillas administrativas → Componentes de Windows → Interfaz de usuario de borde) o, en el registro, `HKLM\SOFTWARE\Policies\Microsoft\Windows\EdgeUI`, valor `AllowEdgeSwipe` en 0 (según la documentación de Microsoft; no se probó).
* **Si el equipo restaura el disco al reiniciar** (Deep Freeze o similar), el ranking se borra con cada reinicio: descargarlo antes desde la administración, o excluir la carpeta del perfil (`%LocalAppData%\RutaEnergia`).

Con otro navegador o sistema (por ejemplo, Android), abrir el mismo archivo con Chrome y tocar «Comenzar el recorrido»: el juego pide pantalla completa solo.

### Prueba de 15 minutos en la pantalla real

Como no se pudo probar en la D6510, conviene hacer esta lista una vez instalado (marcar lo que falle y avisar):

- [ ] Se ve el juego completo, sin barras del navegador ni de Windows, y nada queda cortado en los bordes de la pantalla.
- [ ] Desde 2 metros se lee la pregunta y desde 1 metro las explicaciones.
- [ ] Todos los botones responden al primer toque, también los de las esquinas y los bordes (el marco infrarrojo puede fallar ahí).
- [ ] Dos personas tocando a la vez, una en cada respuesta: se atiende la primera y no se traba nada.
- [ ] En el desafío final se puede arrastrar una ficha hasta su lugar y también tocar lugar y ficha.
- [ ] El teclado en pantalla del nombre responde bien y rápido; «Alias al azar» funciona.
- [ ] Se oye el sonido (y se puede silenciar con el botón del parlante).
- [ ] Una partida corta completa termina en los resultados y queda anotada en el ranking.
- [ ] Sin tocar nada durante 75 segundos aparece «¿Seguís ahí?» y a los 15 segundos más vuelve al inicio.
- [ ] Apretando tres segundos el logo de Energimundo aparece el teclado del PIN; la administración baja el ranking en CSV.
- [ ] Después de reiniciar el equipo, el juego arranca solo y el ranking sigue ahí.
- [ ] Con el equipo sin internet, todo anda igual.

### B. Como página web (se instala sola y se actualiza)

Al publicarse el repositorio con GitHub Pages, el juego queda en `…/energia/` (por ejemplo, `https://homerotexeira04-ship-it.github.io/ruta-del-tannat/energia/`). Abrir esa dirección en Chrome **una vez con internet**: el juego se guarda en el navegador (service worker) y desde entonces abre sin conexión. Se puede usar «Instalar app» para que abra sin barras. Cuando se publica una versión nueva, la pantalla la descarga sola y se recarga cuando nadie está jugando. Comparte el origen con el sitio del Tannat (que al actualizarse borra las cachés que no son suyas): el juego lo detecta y repone su caché solo en la próxima visita con internet.

### C. Desde una computadora propia

```bash
cd energia
npm install        # solo la primera vez
npm run servir     # abre http://127.0.0.1:8130/
```

## Antes de dejarla en uso

* **Cambiar el PIN.** En `js/config.js`, `pinAdmin` (de 4 a 8 dígitos). Con el PIN de fábrica, el panel de administración muestra un aviso. Con el archivo único, abrir `ruta-de-la-energia.html` con el Bloc de notas, buscar `pinAdmin` y cambiar los números (con el PIN cambiado el aviso desaparece); también se puede editar `js/config.js` y volver a armarlo con `npm run build`.
  El PIN evita que alguien toque la administración desde la pantalla; no es una protección fuerte, porque quien tenga acceso a los archivos del equipo puede leerlo.
* **Revisar el sonido.** Viene activado; se puede apagar desde la administración.
* **Logo de Energimundo.** El juego original ya lo usaba y se conservó. Conviene confirmar con la Comisión Técnica Mixta de Salto Grande / LATU que pueden usarlo así.

## Administración de la pantalla

Mantener apretado **tres segundos** el logo de Energimundo (arriba a la derecha) abre un teclado numérico para el PIN. Con teclado físico: `Ctrl + Alt + A`. Adentro se puede:

* descargar el **ranking** y la **estadística de preguntas** (qué preguntas se aciertan menos) en CSV, que abre cualquier planilla;
* **borrar el ranking** (pide confirmación);
* activar o apagar el sonido y elegir el recorrido que aparece al inicio;
* pasar a pantalla completa o volver a cargar el juego.

Los puntajes se guardan en el navegador de esa pantalla (no en internet). Si se limpian los datos del navegador, se pierden: conviene descargar el ranking de vez en cuando.

Si nadie toca la pantalla, aparece «¿Seguís ahí?» y, si no hay respuesta, vuelve al inicio (se borra el nombre y la partida en curso). Los tiempos se cambian en `js/config.js`.

## Las preguntas

El banco tiene **100 preguntas** (20 por estación, de dificultad fácil, media y difícil), cada una con su explicación y sus fuentes, en `js/datos/p-*.js`. Cada partida sortea 5 por estación (o 2 en el recorrido corto), sin repetir las últimas que vio esa pantalla y sin juntar preguntas que se regalan la respuesta. La posición de la respuesta correcta se sortea en cada partida, sin patrones.

Para **editar o agregar una pregunta**, copiar el formato de una existente (la correcta se escribe siempre **primera**; el juego la reubica):

```js
q({ id: 'hid-021', d: 2, t: 'dato', v: '2025',
  p: '¿Cuántas turbinas tiene…?',
  o: ['La correcta', 'Incorrecta 1', 'Incorrecta 2', 'Incorrecta 3'],
  e: 'Explicación de hasta 30 palabras.',
  f: ['ctm-ficha'], no: ['hid-003'] });
```

`d` es la dificultad (1 a 3), `v` el año del dato si puede cambiar, `f` las fuentes (se definen en `js/datos/fuentes.js`) y `no` las preguntas que no deben salir en la misma partida. Después correr:

```bash
npm run check
```

El chequeo rechaza, entre otras cosas, las opciones que delatan la respuesta por su largo (en el juego original, elegir siempre la más larga acertaba el 79 %; hoy acierta el 24 %), los números de órdenes de magnitud distintos, las explicaciones largas, las fuentes que no existen y los lugares o la matriz eléctrica mal armados. Los avisos de «posible fuga» entre preguntas se ven con `npm run check -- --fugas`.

Los datos de potencia y de la matriz eléctrica cambian cada año: están marcados con su vigencia. Quedan **12 preguntas cuya única fuente no se pudo abrir completa** al preparar el juego (se verificaron por buscador); `node scripts/check-banco.js --detalle` las lista, y conviene que alguien las revise contra la fuente.

## Estructura

| Carpeta o archivo | Para qué sirve |
|---|---|
| `index.html`, `css/juego.css` | La página y todos sus estilos (se miden en `rem` y escalan con la pantalla) |
| `js/config.js` | Lo que se ajusta al instalar: PIN, tiempos de inactividad y de antirrebote de toques, modos, puntos |
| `js/motor.js`, `js/almacen.js` | Sorteo de preguntas, puntaje, contrarreloj, desafío; guardado y ranking (sin tocar la pantalla) |
| `js/ui/`, `js/kiosco.js`, `js/audio.js` | Pantallas, teclado en pantalla, diálogos, modo puesto, sonido |
| `js/datos/` | Preguntas, fuentes, lugares, matriz eléctrica y créditos de las fotos |
| `fonts/`, `img/` | Tipografías y fotos de fondo propias, con su licencia |
| `sw.js`, `manifest.webmanifest` | Funcionamiento sin conexión e instalación. **Al cambiar cualquier archivo, subir `CACHE_VERSION` en `sw.js`** |
| `dist/ruta-de-la-energia.html` | El juego en un solo archivo (se arma con `npm run build`) |
| `scripts/`, `tests/` | Chequeo del banco, armado del archivo único y pruebas |

## Chequeos y pruebas

```bash
npm install
npm run check    # banco de preguntas
npm test         # motor, guardado, contraste de colores (50 pruebas)
npm run build    # rearma dist/ruta-de-la-energia.html
npm run smoke    # en Chrome real, 56 pruebas: diseño en 1920×1080 y 4K, accesibilidad, partidas completas, toques simultáneos, sin conexión
npm run todo     # todo lo anterior
```

Las pruebas en Chrome miden, entre otras cosas, que **ninguna de las 100 preguntas se corte o necesite desplazarse** en 1920 × 1080 (el tamaño real de la D6510), en 3840 × 2160 y en otros tamaños, que no haya violaciones de accesibilidad (axe, WCAG 2.1 AA), que todo texto sobre las fotos tenga contraste suficiente y que el juego abra y se juegue sin conexión. Se corren solas en GitHub Actions (`.github/workflows/energia.yml`) cuando cambia esta carpeta.

## Créditos

Preguntas y explicaciones basadas en las fuentes citadas en el propio juego («Créditos y fuentes»). Fotos de fondo de Wikimedia Commons (Shant, Andrés Franchi Ugart, Ayax4555 y Mx. Granger), con licencias CC BY-SA y CC0; los detalles están en `js/datos/fotos.js` y se muestran en pantalla. Tipografías Fredoka y Nunito (SIL Open Font License 1.1, ver `fonts/OFL.txt`).
