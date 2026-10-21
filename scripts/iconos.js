// Regenera todos los íconos del sitio desde el retrato de Pascual Harriague con su marco dorado.
// Uso:  npm i --no-save sharp      (solo para esto: no queda en package.json)
//       node scripts/iconos.js [retrato-enmarcado.jpg]       (por defecto originales/retrato-harriague-marco.jpg: la imagen de 765×1024 con el marco dorado y el paspartú vino tinto)
// Escribe: favicon.ico (16/32/48) y apple-touch-icon.png en la raíz; favicon-32.png, icon-192.png, icon-512.png e icon-maskable-192/512.png en LaRutadelTannat_files/.
// Después, si el dibujo cambió, subir el ?v= de los íconos en el HTML, index.html, 404.html, manifest.json y sw.js (los navegadores guardan los favicons mucho tiempo). Ver README: "Íconos".
//
// Cómo se arma (el marco original es muy grueso y adornado: a 16–48 px se comería la cara):
//  · el marco se reconstruye más fino con piezas del propio marco: las cuatro esquinas y los adornos del centro de cada lado, a escala, y los tramos lisos estirados entre ellos;
//  · la foto se recorta al rostro (de la coronilla a la punta de la barba) en vez de mostrar el busto entero, así la cara ocupa mucho más lugar;
//  · para tamaños chicos se dibuja más grande y se reduce, con un marco todavía más fino (el grosor sube con el tamaño) y un leve afilado.
// Las medidas de abajo (D, C, FOTO, TRAMOS) son de ESA imagen; con otra distinta hay que volver a medirlas.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const RAIZ = path.join(__dirname, '..'), DIR = path.join(RAIZ, 'LaRutadelTannat_files');
const FUENTE = process.argv[2] || path.join(RAIZ, 'originales', 'retrato-harriague-marco.jpg');
const W0 = 765, H0 = 1024;                                     // tamaño de la imagen original
const D = 128, C = 216;                                        // grosor del marco (moldura + paspartú + cordón) y lado de las esquinas, en px de la imagen original
const FOTO = { x0: 129, x1: 637, y0: 129, y1: 896 };           // zona de la foto, dentro del cordón dorado
const TOP = { fl: [216, 280], orn: [280, 486], fr: [486, 549] };   // bordes de arriba y abajo: tramo liso, adorno central, tramo liso (en x)
const LAT = { ft: [216, 412], orn: [412, 610], fb: [610, 808] };   // bordes de los costados (en y)
const FILAS = 560, Y0 = FOTO.y0;                               // filas de la foto que se muestran (rostro completo), desde la coronilla
const VINO = '#2e010a';                                        // color del paspartú
let cache;
const origen = async () => (cache ||= await sharp(FUENTE).removeAlpha().toBuffer());
const trozo = async (l, t, w, h) => sharp(await origen()).extract({ left: l, top: t, width: w, height: h });
const aEscala = (s, w, h) => s.resize({ width: Math.max(1, w), height: Math.max(1, h), fit: 'fill', kernel: 'lanczos3' }).png().toBuffer();
async function esquina(l, t) {   // cuadrado de C px; lo que cae sobre la foto queda transparente (la foto se coloca aparte)
  const { data } = await (await trozo(l, t, C, C)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) { const x = l + i, y = t + j; if (x >= FOTO.x0 && x < FOTO.x1 && y >= FOTO.y0 && y < FOTO.y1) data[(j * C + i) * 4 + 3] = 0; }
  return sharp(data, { raw: { width: C, height: C, channels: 4 } });
}
// retrato enmarcado de alto SH (el ancho sale de la proporción de la foto); ratio = grosor del marco / SH (en la imagen original es 0,167)
async function armar(SH, ratio) {
  const ancho = FOTO.x1 - FOTO.x0, d = Math.round(SH * ratio), k = d / D, c = Math.round(C * k), AH = SH - 2 * d, AW = Math.round(ancho * AH / FILAS), SW = AW + 2 * d, piezas = [];
  const poner = (input, left, top) => piezas.push({ input, left, top });
  for (const [x0, y0, x, y] of [[0, 0, 0, 0], [W0 - C, 0, SW - c, 0], [0, H0 - C, 0, SH - c], [W0 - C, H0 - C, SW - c, SH - c]]) poner(await aEscala(await esquina(x0, y0), c, c), x, y);
  const lh = SW - 2 * c, wo = Math.round((TOP.orn[1] - TOP.orn[0]) * k), wl = Math.floor((lh - wo) / 2), wr = lh - wo - wl;
  for (const [fila0, y] of [[0, 0], [H0 - D, SH - d]]) for (const [[a, b], w, x] of [[TOP.fl, wl, c], [TOP.orn, wo, c + wl], [TOP.fr, wr, c + wl + wo]]) poner(await aEscala(await trozo(a, fila0, b - a, D), w, d), x, y);
  const lv = SH - 2 * c, ho = Math.round((LAT.orn[1] - LAT.orn[0]) * k), ht = Math.floor((lv - ho) / 2), hb = lv - ho - ht;
  for (const [col0, x] of [[0, 0], [W0 - D, SW - d]]) for (const [[a, b], h, y] of [[LAT.ft, ht, c], [LAT.orn, ho, c + ht], [LAT.fb, hb, c + ht + ho]]) poner(await aEscala(await trozo(col0, a, D, b - a), d, h), x, y);
  const foto = await aEscala(await trozo(FOTO.x0, Y0, ancho, FILAS), AW, AH);
  return sharp({ create: { width: SW, height: SH, channels: 3, background: VINO } }).composite([{ input: foto, left: d, top: d }, ...piezas]).png().toBuffer();
}
const ratioPara = (H) => (H >= 128 ? 0.125 : H >= 64 ? 0.11 : H >= 48 ? 0.10 : H >= 32 ? 0.09 : 0.085);
// el retrato enmarcado a alto H (dibujado más grande y reducido si es chico), con leve afilado en los tamaños chicos
async function retrato(H) {
  const f = H >= 256 ? 1 : H >= 96 ? 2 : 4;
  let img = sharp(await armar(H * f, ratioPara(H)));
  if (f > 1) img = sharp(await img.resize({ height: H, kernel: 'lanczos3' }).png().toBuffer());
  if (H <= 64) img = img.sharpen({ sigma: H <= 16 ? 0.6 : 0.5 });
  const buf = await img.png().toBuffer(), m = await sharp(buf).metadata();
  return { buf, ancho: m.width };
}
// favicon: el retrato centrado en un cuadrado transparente (queda apenas más angosto que alto)
async function cuadrado(n) {
  const { buf, ancho } = await retrato(n);
  return sharp({ create: { width: n, height: n, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: buf, left: Math.floor((n - ancho) / 2), top: 0 }]).png({ compressionLevel: 9 }).toBuffer();
}
// baldosa vino tinto (mismo degradé del sitio) con el retrato al centro: para iOS (que redondea las esquinas), para el ícono de la app y para los "maskable" (que el sistema recorta en círculo o cuadrado)
async function baldosa(n, altura) {
  const fondo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4A101D"/><stop offset="1" stop-color="#2B0A14"/></linearGradient></defs><rect width="${n}" height="${n}" fill="url(#g)"/></svg>`);
  const { buf, ancho } = await retrato(Math.round(n * altura));
  return sharp(fondo).composite([{ input: buf, left: Math.round((n - ancho) / 2), top: Math.round(n * (1 - altura) / 2) }]).removeAlpha().png({ palette: true, quality: 90, effort: 10, dither: 0.8 }).toBuffer();   // paleta de colores: es una foto y de otro modo el de 512 px pesa medio mega
}
// .ico con las imágenes PNG adentro (lo entienden todos los navegadores actuales)
const ico = (imgs, tamanos) => {
  const cab = Buffer.alloc(6 + 16 * imgs.length); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(imgs.length, 4);
  let desde = cab.length;
  imgs.forEach((b, i) => { const o = 6 + 16 * i; cab[o] = tamanos[i]; cab[o + 1] = tamanos[i]; cab.writeUInt16LE(1, o + 4); cab.writeUInt16LE(32, o + 6); cab.writeUInt32LE(b.length, o + 8); cab.writeUInt32LE(desde, o + 12); desde += b.length; });
  return Buffer.concat([cab, ...imgs]);
};
(async () => {
  const m = await sharp(FUENTE).metadata();
  if (m.width !== W0 || m.height !== H0) throw new Error('se esperaba el retrato enmarcado de ' + W0 + '×' + H0 + ' (' + FUENTE + ' mide ' + m.width + '×' + m.height + ')');
  const tam = [16, 32, 48], cuadrados = await Promise.all(tam.map(cuadrado)), salidas = {};
  salidas['favicon.ico'] = ico(cuadrados, tam);
  salidas[path.join('LaRutadelTannat_files', 'favicon-32.png')] = cuadrados[1];
  salidas['apple-touch-icon.png'] = await baldosa(180, 0.86);
  for (const [nombre, n, altura] of [['icon-192.png', 192, 0.92], ['icon-512.png', 512, 0.92], ['icon-maskable-192.png', 192, 0.80], ['icon-maskable-512.png', 512, 0.80]]) salidas[path.join('LaRutadelTannat_files', nombre)] = await baldosa(n, altura);
  for (const [rel, buf] of Object.entries(salidas)) { fs.writeFileSync(path.join(RAIZ, rel), buf); console.log(rel.replace(/\\/g, '/').padEnd(48), (buf.length / 1024).toFixed(1).padStart(6) + ' KB'); }
})().catch((e) => { console.error(e.message); process.exit(1); });
