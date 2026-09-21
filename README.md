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
| `404.html`, `robots.txt`, `sitemap.xml`, `favicon.ico`, `apple-touch-icon.png` | Archivos públicos de SEO y navegación |

## Cambiar el diseño (Tailwind)

El HTML ya no descarga Tailwind en el navegador: usa el CSS compilado. **Si agregás o cambiás clases de Tailwind en el HTML o en los `.js`, hay que recompilar**:

```bash
npm install      # solo la primera vez
npm run build:css
```

Después de cambiar cualquier archivo que use el service worker (`sw.js`), subir `CACHE_VERSION` para que los visitantes reciban la versión nueva. Si se edita `copa-tannat-render.js` o `copa-tannat-ui.js`, subir también el `?v=` con que los carga el HTML.

## Imágenes

Las fotos van en WebP (con el original JPG/PNG como respaldo en la carpeta). Toda `<img>` lleva `width` y `height` para evitar saltos de diseño y `loading="lazy"`, salvo la imagen principal del inicio.

## Si el sitio pasa a un dominio propio

Actualizar la URL en: `<link rel="canonical">`, las etiquetas `og:` / `twitter:`, el JSON-LD, `sitemap.xml`, `robots.txt` y `404.html`. Con dominio propio también conviene poner `robots.txt` y `sitemap.xml` en la raíz de ese dominio.

## Límites de GitHub Pages

No permite configurar cabeceras de seguridad (HSTS, CSP, X-Frame-Options). Si se necesitan, hay que poner un servicio delante (por ejemplo Cloudflare).
