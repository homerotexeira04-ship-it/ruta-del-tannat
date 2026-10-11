// Prepara una foto para la Postal de la Ruta: crea su miniatura recortada igual que saldrá en la postal (proporción 976:800) y, con --copiar, la foto en WebP.
// Uso:  npm i --no-save sharp      (solo para esto: no queda en package.json)
//       node scripts/postal-miniatura.js <foto> <id> [fx] [fy] [--copiar]
//   fx, fy: foco del recorte, de 0 (izquierda/arriba) a 1 (derecha/abajo); por defecto 0.5. Tienen que ser los mismos que se escriben en FOTOS (LaRutadelTannat.html).
// Escribe LaRutadelTannat_files/postal-th-<id>.webp (244×200) y, con --copiar, LaRutadelTannat_files/postal-<id>.webp (hasta 1920 px de ancho). Ver README: "Postal de la Ruta".
const path = require('path');
const sharp = require('sharp');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--')), copiar = process.argv.includes('--copiar');
const [foto, id, fx = '0.5', fy = '0.5'] = args;
if (!foto || !/^[a-z0-9]+$/.test(id || '')) { console.error('uso: node scripts/postal-miniatura.js <foto> <id en minúsculas> [fx] [fy] [--copiar]'); process.exit(1); }
const DIR = path.join(__dirname, '..', 'LaRutadelTannat_files'), SLOT = 976 / 800;
(async () => {
  const img = sharp(foto).rotate(), { width: W, height: H } = await img.metadata(); // .rotate() respeta la orientación EXIF
  const cw = W / H > SLOT ? Math.round(H * SLOT) : W, ch = W / H > SLOT ? H : Math.round(W / SLOT);
  const left = Math.round(+fx * (W - cw)), top = Math.round(+fy * (H - ch));
  await sharp(foto).rotate().extract({ left, top, width: cw, height: ch }).resize(244, 200, { fit: 'fill' }).webp({ quality: 72, effort: 6 }).toFile(path.join(DIR, 'postal-th-' + id + '.webp'));
  console.log('miniatura: postal-th-' + id + '.webp (recorte ' + cw + '×' + ch + ' de ' + W + '×' + H + '; en la postal se amplía ×' + (976 / cw).toFixed(2) + (976 / cw > 1.6 ? ': la foto es chica, se va a ver blanda' : '') + ')');
  if (copiar) { await sharp(foto).rotate().resize({ width: Math.min(W, 1920) }).webp({ quality: 80, effort: 5 }).toFile(path.join(DIR, 'postal-' + id + '.webp')); console.log('foto: postal-' + id + '.webp'); }
  console.log('Falta: sumar a FOTOS (initPostal, LaRutadelTannat.html) { id: \'' + id + '\', f: \'' + (copiar ? 'postal-' + id + '.webp' : path.basename(foto)) + '\', c: <clave de la leyenda>, cr: <crédito>, fx: ' + fx + ', fy: ' + fy + ' } y la leyenda en es/pt/en.');
})().catch((e) => { console.error(e.message); process.exit(1); });
