// Servidor estático mínimo para probar el juego en el navegador. Uso: node scripts/servir.js [puerto]
// También se usa desde las pruebas: require('./servir').servir(puerto) devuelve {cerrar, url}.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8' };

function servir(puerto, raiz) {
  raiz = raiz || RAIZ;
  const srv = http.createServer((req, res) => {
    let ruta = decodeURIComponent(req.url.split('?')[0]);
    if (ruta.endsWith('/')) ruta += 'index.html';
    const archivo = path.normalize(path.join(raiz, ruta));
    if (!archivo.startsWith(raiz)) { res.writeHead(403); return res.end(); }
    fs.readFile(archivo, (err, datos) => {
      if (err) { res.writeHead(404); return res.end('no encontrado'); }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(datos);
    });
  });
  return new Promise((ok) => srv.listen(puerto || 0, '127.0.0.1', () => ok({ url: 'http://127.0.0.1:' + srv.address().port + '/', cerrar: () => new Promise((r) => srv.close(r)) })));
}

module.exports = { servir };
if (require.main === module) servir(+process.argv[2] || 8130).then((s) => console.log('Sirviendo en ' + s.url));
