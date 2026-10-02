// Sin conexión: el service worker guarda todo, la página arranca sin red y no falta ningún archivo en la lista.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { iniciar, dormir } = require('./ayudas');

let B;
test.before(async () => { B = await iniciar(); });
test.after(async () => { await B.cerrar(); });

const RAIZ = path.join(__dirname, '..', '..');

test('el service worker lista todos los archivos que usa la página, y todos existen', () => {
  const sw = fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8');
  const lista = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter((x) => x && !x.startsWith('./'));
  for (const f of lista) assert.ok(fs.existsSync(path.join(RAIZ, f)), 'falta ' + f + ' (citado en sw.js)');
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(RAIZ, 'css', 'juego.css'), 'utf8');
  const usados = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^":]+)"/g)) usados.add(m[1]);
  for (const m of html.matchAll(/url\(([^)]+)\)/g)) usados.add(m[1]);
  for (const m of css.matchAll(/url\(\.\.\/([^)]+)\)/g)) usados.add(m[1]);
  for (const f of usados) {
    if (f === 'index.html') continue;
    assert.ok(lista.includes(f), f + ' lo usa la página pero no está en la lista del service worker');
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(RAIZ, 'manifest.webmanifest'), 'utf8'));
  for (const i of manifest.icons) assert.ok(lista.includes(i.src), 'el ícono ' + i.src + ' no está en el service worker');
});

test('después de la primera visita, la página abre y se juega sin conexión', async () => {
  const page = await B.pagina();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller || true);
  // esperamos a que termine de instalarse y a que tome el control
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 8000 });
  const guardado = await page.evaluate(async () => { const c = await caches.keys(); const k = await (await caches.open(c[0])).keys(); return { caches: c, archivos: k.length }; });
  assert.match(guardado.caches[0], /^energia-/);
  assert.ok(guardado.archivos >= 40, 'archivos guardados: ' + guardado.archivos);
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => RE.ui.estado.pantalla), 'inicio');
  const fuente = await page.evaluate(() => document.fonts.check('600 20px Fredoka') && document.fonts.check('700 20px Nunito'));
  assert.equal(fuente, true, 'las tipografías cargan desde el propio juego');
  await dormir(450); // el antirrebote ignora los toques durante los primeros 0,3 segundos tras recargar
  await page.click('#botonComenzar'); await dormir(450);
  await page.click('#botonEstacion'); await dormir(450);
  assert.equal(await page.evaluate(() => RE.ui.estado.pantalla), 'pregunta');
  const fondos = await page.evaluate(() => [...document.querySelectorAll('.fondo__img')].map((e) => getComputedStyle(e).backgroundImage.startsWith('url(')));
  assert.ok(fondos.every(Boolean));
  assert.deepEqual(page.errores.filter((e) => !/favicon/.test(e)), []);
  await page.cerrarContexto();
});

test('si otro programa del mismo sitio borra la caché del juego, el service worker la repone en la próxima visita con internet', async () => {
  const page = await B.pagina();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 8000 });
  // el sitio del Tannat (mismo origen) borra «todo lo que no es suyo» cuando se actualiza: se simula
  await page.evaluate(async () => { for (const k of await caches.keys()) await caches.delete(k); });
  assert.equal(await page.evaluate(async () => (await caches.keys()).length), 0);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(async () => { const c = await caches.keys(); if (!c.length) return false; return (await (await caches.open(c[0])).keys()).length >= 40; }, { timeout: 10000 });
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => RE.ui.estado.pantalla), 'inicio');
  assert.deepEqual(page.errores.filter((e) => !/favicon/.test(e)), []);
  await page.cerrarContexto();
});

test('el service worker solo borra cachés propias (las que empiezan con «energia-»), nunca las del sitio del Tannat', () => {
  const sw = fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8');
  assert.match(sw, /k\.startsWith\('energia-'\)/);
  assert.ok(!/caches\.match\(/.test(sw), 'no debe mirar las cachés de otros programas del mismo origen');
});

test('el manifiesto es válido y sus íconos existen con el tamaño declarado', () => {
  const m = JSON.parse(fs.readFileSync(path.join(RAIZ, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.display, 'fullscreen');
  assert.equal(m.orientation, 'landscape');
  assert.ok(m.name && m.short_name && m.start_url && m.scope);
  for (const i of m.icons) {
    const f = fs.readFileSync(path.join(RAIZ, i.src));
    assert.equal(f.readUInt32BE(16) + 'x' + f.readUInt32BE(20), i.sizes, i.src);
  }
  assert.ok(m.icons.some((i) => i.purpose === 'maskable'));
});
