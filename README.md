# La Ruta del Tannat

Sitio web estático (HTML + JavaScript sin framework) del circuito enoturístico de Salto, Uruguay. Trabajo final de Diseño Turístico, UTU.

Publicado con GitHub Pages: https://homerotexeira04-ship-it.github.io/ruta-del-tannat/LaRutadelTannat.html

## Estructura

| Archivo | Para qué sirve |
|---|---|
| `LaRutadelTannat.html` | Página completa (contenido, estilos propios, textos ES/PT/EN y lógica) |
| `LaRutadelTannat_files/tailwind.css` | CSS de Tailwind **compilado** (no editar a mano) |
| `LaRutadelTannat_files/copa-tannat-*.js` | La Copa de Tannat (render en canvas + interfaz), se carga al acercarse a la sección |
| `sw.js`, `manifest.json` | Instalación como app y uso sin conexión |
| `index.html` | Solo redirige a la página principal |
| `apps-script/` | Opiniones reales de visitantes (planilla de Google + Apps Script). Guía de instalación y moderación en su README; sin instalar, el sitio no muestra el formulario |
| `scripts/` | Chequeos del sitio: `check.js` (estático), `smoke.js` (en Chrome real) y `lh-assert.js` (mínimos de Lighthouse); `postal-miniatura.js` prepara fotos para la Postal de la Ruta |
| `.github/workflows/checks.yml` | Los mismos chequeos, automáticos en GitHub Actions |
| `404.html`, `robots.txt`, `sitemap.xml`, `favicon.ico`, `apple-touch-icon.png` | Archivos públicos de SEO y navegación |

## Cambiar el diseño (Tailwind)

El HTML ya no descarga Tailwind en el navegador: usa el CSS compilado. **Si agregás o cambiás clases de Tailwind en el HTML o en los `.js`, hay que recompilar**:

```bash
npm install      # solo la primera vez
npm run build:css
```

Después de cambiar cualquier archivo que use el service worker (`sw.js`), subir `CACHE_VERSION` para que los visitantes reciban la versión nueva, y con el mismo número el `?v=` de `tailwind.css` (en el `<link>` del HTML y en `CORE_ASSETS` de `sw.js`): sin él, quien ya visitó el sitio vería la primera vez el HTML nuevo con el CSS viejo. `npm run check` avisa si no coinciden. Si se edita `copa-tannat-render.js` o `copa-tannat-ui.js`, subir también el `?v=` con que los carga el HTML.

## Imágenes

Las fotos van en WebP. Los originales pesados (JPG/PNG, incluido el logo maestro) no se suben al repositorio: viven en la carpeta local `originales/`, que git ignora. Toda `<img>` lleva `width` y `height` para evitar saltos de diseño y `loading="lazy"`, salvo la imagen principal del inicio. Esa foto se ofrece en 720, 1280 y 1920 px (`srcset` + `sizes`; la precarga del `<head>` debe decir lo mismo que el `<img>`, si no se baja dos veces): los celulares bajan la de 720 px, que va recortada y bajo un velo oscuro.

**Logo de la portada**: el logo del proyecto va en el `#hero` en tres tamaños (`logo-portada-400/640/880.webp`, 32/64/96 KB; `srcset` + `sizes`, siempre un archivo con píxeles de sobra para el tamaño y la densidad de la pantalla). Desde 1024 px va a la izquierda de la columna de texto (la columna del `#hero` mide lo que su contenido, 736 px, así que el logo se ancla a su borde con `lg:right-full`, fuera del flujo, y su ancho sale del espacio libre a cada lado: de 120 a 400 px) y no mueve nada del texto. Debajo de 1024 px (celulares y tabletas verticales) va arriba de la insignia solo en pantallas altas (celular de 760 px de alto o más, tableta de 820 o más); en las bajas se omite porque empujaría «Explorar las 4 Estaciones» bajo la barra fija de reserva (el encabezado ya lleva el logo). Es `loading="lazy"`, así que cuando está oculto ni se descarga. Para cambiarlo: `npm i --no-save sharp` y `node scripts/logo-portada.js <logo.webp|png>` (borra motas sueltas de transparencia, recorta al contenido y escribe los tres tamaños; imprime el `width`/`height` que lleva el `<img>`). La prueba de humo #28 mide todo esto en 15 tamaños de pantalla.

## Tipografías

Playfair Display (titulares) y Plus Jakarta Sans (texto) están alojadas en el sitio, sin pedidos a Google: tres archivos `.woff2` variables en `LaRutadelTannat_files/`, solo el subconjunto latin (alcanza para español, portugués e inglés; otro alfabeto cae a la fuente del sistema), declarados con `@font-face` en el `<head>` del HTML, precargados y guardados por el service worker. Licencia OFL. Los rangos de peso declarados (500–700, cursiva 500–600 y 400–800) son los mismos que pedía Google, para que nada cambie de aspecto; los archivos traen el rango completo si hiciera falta ampliarlo.

## Postal de la Ruta

La sección `#postal` arma una postal de 1080×1350 en un `<canvas>`: el visitante elige una foto (o sube la suya), escribe un mensaje y la descarga como JPG o la comparte con el menú de compartir del celular. Todo ocurre en su dispositivo: ni su foto ni su mensaje se suben a ningún lado. Las miniaturas (`postal-th-*.webp`, 244×200, ya recortadas como saldrán) cargan perezosas, y la foto grande, el logo y las tipografías se piden recién cuando la sección está por verse. El crédito de cada foto sale impreso bajo la foto.

Son 30 fotos. Fuentes: banners y fotos de bodegas de INAVI, Ministerio de Turismo (entrada de Termas del Daymán), archivo del proyecto, las de la Galería (sus créditos están en esa sección y en `FOTOS`) y 11 de Wikimedia Commons con licencia CC BY o CC BY-SA (autor y licencia salen impresos en la postal; en `FOTOS` están en `cr`). Las de Commons se bajaron a 1600 px de ancho desde la propia API de Commons, no el original de varios MB.

**Agregar una foto**:
1. `npm i --no-save sharp` (solo para esto) y `node scripts/postal-miniatura.js <foto> <id> [fx] [fy] --copiar`: crea la miniatura recortada con el foco `fx`/`fy` (0 = izquierda/arriba, 1 = derecha/abajo) y la foto en WebP (`postal-<id>.webp`).
2. Sumar una línea a `FOTOS` en `initPostal` (`LaRutadelTannat.html`) con el mismo `id`, el archivo, la clave de la leyenda, el crédito y los mismos `fx`/`fy`.
3. Escribir la leyenda en los tres idiomas (`postal.c.<id>` en `translations`) o reutilizar una de la Galería (`gallery.capN`). Si la foto ya trae letras, marcarla con `sg: 1` para que la postal no le ponga el saludo encima.

## Maridaje

La sección `#maridaje` va del plato al vino (La Copa va al revés: del perfil del vino a los platos). Cada uno de los 9 platos tiene asociado uno de 4 estilos de Tannat (joven sin barrica, Reserva con barrica, de guarda, rosado o espumoso) con sus medidas de tanino, cuerpo y acidez, temperatura de servicio, aireación, copa y qué evitar. Los textos están en `translations` (`pair.*`: así `npm run check` verifica que estén en los tres idiomas); en `initMaridaje` (`LaRutadelTannat.html`) solo quedan la tabla plato → estilo (`PLATOS`) y las medidas (`ESTILOS`). Las frases «En la Ruta» solo repiten datos que ya están en Vinos y en las temporadas (Bertolini & Broglio sin barrica, Salto Chico con barrica de roble francés y americano, cata de Gran Reserva en invierno): si cambian allá, cambiarlas acá. Son sugerencias generales de maridaje, no la recomendación de una bodega, y la sección lo dice. El botón «Mandar este maridaje en una postal» escribe la sugerencia en la Postal de la Ruta.

## Chequeos automáticos

En GitHub Actions (`.github/workflows/checks.yml`) corren solos en cada cambio a `master` y en cada pull request, y los lunes revisan además los enlaces externos. Se pueden correr también en la computadora:

```bash
npm install           # solo la primera vez
npm run check         # archivos citados, anclas, ids, JSON-LD, idiomas ES/PT/EN y FAQ al día
npm test              # backend de opiniones y contador de uso, con una planilla simulada
npm run smoke         # en Chrome real: errores, desbordes, WhatsApp, La Copa, itinerario, menú del encabezado, movimiento (hover, presión, galería y modales) y detalles visuales (letra mínima, zonas táctiles, cursor de botella, descorche y su sonido, tipografías propias, foto del inicio según la pantalla, tarjetas de Estaciones, retrato de El Pionero reintento de la lista de opiniones si Google falla la postal (se dibuja, descarga un JPG de 1080×1350 y comparte) y el maridaje (9 platos, teclado, idiomas y pase a la postal)) (CHROME_PATH si no lo encuentra)
npm run check:links   # enlaces externos (más lento)
```

`npm run smoke` mide en un navegador, así que sirve para no romper cosas que no se ven en el código: que La Copa siga entrando en la pantalla de un celular, que el botón de WhatsApp no tape "Reservar", que el itinerario siga saliendo en una sola hoja, que el menú del encabezado siga cabiendo en una línea y llevando a todas las secciones, que el hover de las tarjetas siga animando, que los modales no se escondan al reabrirlos, que la galería en movimiento se pueda pausar, que el cursor de botella solo exista con mouse o que el sonido de descorche suene una sola vez al reservar.

## Claude Code

El repositorio trae la configuración lista para trabajar con Claude Code, en la computadora o en la web:

| Qué | Dónde | Notas |
|---|---|---|
| Skills de Emil Kowalski (`emil-design-eng`, `animate`, `apple-design`, `break-ui`, `mobile-native`…) | `.claude/skills/`, `skills-lock.json` | Las 10 que aplican a un sitio estático. Para actualizarlas: `npx skills update`. Para sumar otra del mismo pack: `npx skills add emilkowalski/skills -a claude-code --copy -s <nombre>` |
| Skills de diseño `impeccable` ([pbakaus/impeccable](https://github.com/pbakaus/impeccable), Apache-2.0) y `design-taste-frontend` ([Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), MIT) | `.claude/skills/impeccable/`, `.claude/skills/design-taste-frontend/` | Se suben con su licencia (`LICENSE`; impeccable también `NOTICE.md`). A impeccable le falta el motor nativo de Windows (`scripts/bin/`, 14 MB, ignorado por git): su lanzador lo baja solo la primera vez. En la computadora del proyecto son accesos directos a `.agents/skills/` (carpeta que git ignora); en un clon nuevo alcanzan estas copias |
| MCP de Playwright (Claude maneja un navegador) | `.mcp.json`, `.claude/mcp/playwright-mcp.js` | Usa el Chromium de la nube o el Chrome de la máquina. Bloquea `file:`, así que hay que servir el sitio (`python3 -m http.server`). Deja snapshots en `.playwright-mcp/` (ignorada por git) |
| MCP de Figma | Conector de la cuenta de claude.ai (no está en `.mcp.json`) | Se conecta una vez en [claude.ai/customize/connectors](https://claude.ai/customize/connectors) y queda disponible en la computadora y en la web de Claude Code. Quien clone el repo con otra cuenta debe conectar el suyo. Con un plan Starter o asiento "View", Figma limita las herramientas de lectura a unas 20 llamadas por mes |
| Preparación de cada sesión en la web | `.claude/hooks/session-start.sh`, `.claude/settings.json` | Corre `npm install` y define `CHROME_PATH` para que `npm run smoke` funcione. En la computadora local no hace nada |

La primera vez que se abre el proyecto en una computadora, Claude Code pide aprobar los servidores de `.mcp.json`.

## Si el sitio pasa a un dominio propio

Actualizar la URL en: `<link rel="canonical">`, las etiquetas `og:` / `twitter:`, el JSON-LD, `sitemap.xml`, `robots.txt` y `404.html`. Con dominio propio también conviene poner `robots.txt` y `sitemap.xml` en la raíz de ese dominio.

## Límites de GitHub Pages

No permite configurar cabeceras de seguridad (HSTS, CSP, X-Frame-Options). Si se necesitan, hay que poner un servicio delante (por ejemplo Cloudflare).
