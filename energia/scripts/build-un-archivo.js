// Arma dist/ruta-de-la-energia.html: el juego entero en UN solo archivo (estilos, programas, tipografías y fotos adentro),
// para copiarlo en un pendrive y abrirlo en cualquier equipo sin instalar nada ni tener internet.
// Uso: node scripts/build-un-archivo.js
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const leer = (f) => fs.readFileSync(path.join(RAIZ, f));
const texto = (f) => leer(f).toString('utf8');
const MIME = { '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
function datos(ruta) {
  const mime = MIME[path.extname(ruta)];
  if (!mime) throw new Error('tipo de archivo sin soporte para incrustar: ' + ruta);
  return 'data:' + mime + ';base64,' + leer(ruta).toString('base64');
}

function construir() {
  let html = texto('index.html');

  // Estilos, con las tipografías dentro
  const css = texto('css/juego.css').replace(/url\(\.\.\/([^)]+)\)/g, (_, r) => 'url(' + datos(r) + ')');
  html = html.replace(/<link rel="stylesheet" href="css\/juego\.css">/, () => '<style>\n' + css + '\n</style>');

  // Se quitan las pistas de precarga, el manifiesto y los íconos de instalación, que no tienen sentido en un solo archivo
  html = html.replace(/<link rel="preload"[^>]*>\n?/g, '').replace(/<link rel="manifest"[^>]*>\n?/g, '').replace(/<link rel="apple-touch-icon"[^>]*>\n?/g, '');
  html = html.replace(/<link rel="icon" type="image\/svg\+xml" href="([^"]+)">/, (_, r) => '<link rel="icon" type="image/svg+xml" href="' + datos(r) + '">');

  // Fotos de fondo y logo
  html = html.replace(/url\((img\/[^)]+)\)/g, (_, r) => 'url(' + datos(r) + ')');
  html = html.replace(/src="(img\/[^"]+)"/g, (_, r) => 'src="' + datos(r) + '"');

  // Programas, en el mismo orden
  const orden = [];
  html = html.replace(/<script src="(js\/[^"]+)"><\/script>\n?/g, (_, r) => {
    orden.push(r);
    const js = texto(r).replace(/<\/script/gi, '<\\/script');
    return '<script>\n/* ' + r + ' */\n' + js + '\n</script>\n';
  });
  // En un archivo suelto los programas van adentro del HTML: la política de seguridad tiene que permitirlos
  html = html.replace("script-src 'self'", "script-src 'unsafe-inline'");
  if (!html.includes("script-src 'unsafe-inline'")) throw new Error('no encontré la política de seguridad para ajustar');
  html = html.replace(/<script>\n\/\* js\/config\.js \*\//, '<script>window.RE_SIN_SW = true;</script>\n<script>\n/* js/config.js */');

  if (/\s(?:src|href)="(?!data:|#)[^"]*\.(?:js|css|png|webp|woff2)"/.test(html)) throw new Error('quedó una referencia a un archivo externo en el HTML armado');
  return { html: html, scripts: orden };
}

if (require.main === module) {
  const { html, scripts } = construir();
  fs.mkdirSync(path.join(RAIZ, 'dist'), { recursive: true });
  const salida = path.join(RAIZ, 'dist', 'ruta-de-la-energia.html');
  fs.writeFileSync(salida, html);
  console.log('Armado ' + path.relative(RAIZ, salida) + ' (' + Math.round(html.length / 1024) + ' KB, ' + scripts.length + ' programas)');
}
module.exports = { construir };
