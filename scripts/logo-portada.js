// Prepara el logo de la portada: borra las motas sueltas de transparencia, lo recorta al dibujo y lo guarda en tres tamaños WebP (400, 640 y 880 px de ancho).
// Uso:  npm i --no-save sharp      (solo para esto: no queda en package.json)
//       node scripts/logo-portada.js <logo.webp|png>      (con fondo transparente; cuanto más grande, mejor)
// Escribe LaRutadelTannat_files/logo-portada-{400,640,880}.webp y muestra el ancho y el alto del <img> de la portada (LaRutadelTannat.html). Ver README: "Imágenes".
const path = require('path');
const sharp = require('sharp');
const [logo] = process.argv.slice(2);
if (!logo) { console.error('uso: node scripts/logo-portada.js <logo.webp|png>'); process.exit(1); }
const DIR = path.join(__dirname, '..', 'LaRutadelTannat_files'), ANCHOS = [400, 640, 880];
(async () => {
  const { data, info } = await sharp(logo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info, N = W * H, lab = new Int32Array(N), tam = [0];
  for (let s = 0; s < N; s++) { // componentes conexas de lo visible: la mayor es el logo; el resto, motas
    if (lab[s] || !data[s * 4 + 3]) continue;
    const id = tam.length, pila = [s]; let c = 0; lab[s] = id;
    while (pila.length) { const p = pila.pop(), x = p % W; c++; for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p >= W ? p - W : -1, p < N - W ? p + W : -1]) if (q >= 0 && !lab[q] && data[q * 4 + 3]) { lab[q] = id; pila.push(q); } }
    tam.push(c);
  }
  const mayor = tam.indexOf(Math.max(...tam.slice(1)));
  let x0 = W, y0 = H, x1 = 0, y1 = 0, motas = 0;
  for (let p = 0; p < N; p++) {
    if (!data[p * 4 + 3]) continue;
    if (lab[p] !== mayor) { data[p * 4 + 3] = 0; motas++; continue; }
    const x = p % W, y = (p / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const MARGEN = Math.max(4, Math.round((x1 - x0 + 1) * 0.0046)); // ≈ 4 px a 880 px de ancho, sea cual sea el tamaño del maestro
  const left = Math.max(0, x0 - MARGEN), top = Math.max(0, y0 - MARGEN), width = Math.min(W - left, x1 - x0 + 1 + 2 * MARGEN), height = Math.min(H - top, y1 - y0 + 1 + 2 * MARGEN);
  const limpio = sharp(data, { raw: { width: W, height: H, channels: 4 } }).extract({ left, top, width, height });
  for (const a of ANCHOS) { const o = await limpio.clone().resize({ width: a, kernel: 'lanczos3' }).webp({ quality: 76, alphaQuality: 90, effort: 6 }).toFile(path.join(DIR, 'logo-portada-' + a + '.webp')); console.log('logo-portada-' + a + '.webp', o.width + '×' + o.height, (o.size / 1024).toFixed(0) + ' KB'); }
  console.log('motas borradas: ' + motas + ' px · recorte ' + width + '×' + height + ' → en el <img> de la portada: width="880" height="' + Math.round(880 * height / width) + '"');
})().catch((e) => { console.error(e.message); process.exit(1); });
