# La Ruta del Tannat

Sitio web estático (HTML + JavaScript sin framework) del circuito enoturístico de Salto, Uruguay. Trabajo final de Diseño Turístico, UTU.

Publicado con GitHub Pages: https://homerotexeira04-ship-it.github.io/ruta-del-tannat/LaRutadelTannat.html

## Estructura

| Archivo | Para qué sirve |
|---|---|
| `LaRutadelTannat.html` | Página completa (contenido, estilos propios, textos ES/PT/EN y lógica) |
| `LaRutadelTannat_files/tailwind.css` | CSS de Tailwind **compilado** (no editar a mano) |
| `LaRutadelTannat_files/estilo-apple.css` | Capa de estilo "híbrido Apple" (tipografía del sistema, superficies neutras, encabezado y barra móvil de vidrio). Se carga después de todo lo demás y se edita a mano; al cambiarla, subir `CACHE_VERSION` en `sw.js` |
| `LaRutadelTannat_files/copa-tannat-*.js` | La Copa de Tannat (render en canvas + interfaz), se carga al acercarse a la sección |
| `sw.js`, `manifest.json` | Instalación como app y uso sin conexión |
| `index.html` | Solo redirige a la página principal |
| `apps-script/` | Opiniones reales de visitantes (planilla de Google + Apps Script). Guía de instalación y moderación en su README; sin instalar, el sitio no muestra el formulario |
| `scripts/` | Chequeos del sitio: `check.js` (estático), `smoke.js` (en Chrome real) y `lh-assert.js` (mínimos de Lighthouse) |
| `.github/workflows/checks.yml` | Los mismos chequeos, automáticos en GitHub Actions |
| `404.html`, `robots.txt`, `sitemap.xml`, `favicon.ico`, `apple-touch-icon.png` | Archivos públicos de SEO y navegación |

## Cambiar el diseño (Tailwind)

El HTML ya no descarga Tailwind en el navegador: usa el CSS compilado. **Si agregás o cambiás clases de Tailwind en el HTML o en los `.js`, hay que recompilar**:

```bash
npm install      # solo la primera vez
npm run build:css
```

Después de cambiar cualquier archivo que use el service worker (`sw.js`), subir `CACHE_VERSION` para que los visitantes reciban la versión nueva. Si se edita `copa-tannat-render.js` o `copa-tannat-ui.js`, subir también el `?v=` con que los carga el HTML.

## Imágenes

Las fotos van en WebP. Los originales pesados (JPG/PNG, incluido el logo maestro) no se suben al repositorio: viven en la carpeta local `originales/`, que git ignora. Toda `<img>` lleva `width` y `height` para evitar saltos de diseño y `loading="lazy"`, salvo la imagen principal del inicio.

## Chequeos automáticos

En GitHub Actions (`.github/workflows/checks.yml`) corren solos en cada cambio a `master` y en cada pull request, y los lunes revisan además los enlaces externos. Se pueden correr también en la computadora:

```bash
npm install           # solo la primera vez
npm run check         # archivos citados, anclas, ids, JSON-LD, idiomas ES/PT/EN y FAQ al día
npm test              # backend de opiniones y contador de uso, con una planilla simulada
npm run smoke         # en Chrome real: errores, desbordes, WhatsApp, La Copa e itinerario (CHROME_PATH si no lo encuentra)
npm run check:links   # enlaces externos (más lento)
```

`npm run smoke` mide en un navegador, así que sirve para no romper cosas que no se ven en el código: que La Copa siga entrando en la pantalla de un celular, que el botón de WhatsApp no tape "Reservar" o que el itinerario siga saliendo en una sola hoja.

## Si el sitio pasa a un dominio propio

Actualizar la URL en: `<link rel="canonical">`, las etiquetas `og:` / `twitter:`, el JSON-LD, `sitemap.xml`, `robots.txt` y `404.html`. Con dominio propio también conviene poner `robots.txt` y `sitemap.xml` en la raíz de ese dominio.

## Límites de GitHub Pages

No permite configurar cabeceras de seguridad (HSTS, CSP, X-Frame-Options). Si se necesitan, hay que poner un servicio delante (por ejemplo Cloudflare).
