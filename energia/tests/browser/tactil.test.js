// Pantalla táctil de varios dedos (la Ricoh D6510 reconoce hasta 10): toques reales, arrastre con el dedo y toques simultáneos.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, dormir } = require('./ayudas');

let B;
test.before(async () => { B = await iniciar(); });
test.after(async () => { await B.cerrar(); });

const tactil = (page) => page;
async function paginaTactil(ancho, alto) {
  return B.pagina({ ancho, alto, antes: async (p) => { await p.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1, hasTouch: true }); } });
}
async function centro(page, sel) { const e = await page.$(sel); const b = await e.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }

test('un toque con el dedo responde y avanza (en 3840×2160)', async () => {
  const page = await paginaTactil(3840, 2160);
  const c = await centro(page, '#botonComenzar'); await page.touchscreen.tap(c.x, c.y); await dormir(250);
  const c2 = await centro(page, '#botonEstacion'); await page.touchscreen.tap(c2.x, c2.y); await dormir(250);
  const correcta = await page.evaluate(() => RE.motor.actual(RE.ui.estado.partida).correcta);
  const r = await centro(page, '.respuesta[data-i="' + correcta + '"]'); await page.touchscreen.tap(r.x, r.y); await dormir(250);
  assert.equal(await page.evaluate(() => RE.ui.estado.partida.aciertos), 1);
  const s = await centro(page, '#botonSiguiente'); await page.touchscreen.tap(s.x, s.y); await dormir(250);
  assert.equal(await page.evaluate(() => RE.ui.estado.partida.i), 1);
  assert.deepEqual(page.errores, []);
  await page.cerrarContexto();
});

test('dos dedos a la vez en respuestas distintas: solo cuenta la primera', async () => {
  const page = await paginaTactil(1920, 1080);
  await page.evaluate(() => { RE.ui.nuevaPartida(); RE.ui.ir('pregunta'); });
  const correcta = await page.evaluate(() => RE.motor.actual(RE.ui.estado.partida).correcta);
  const otra = (correcta + 1) % 4;
  const a = await centro(page, '.respuesta[data-i="' + correcta + '"]'), b = await centro(page, '.respuesta[data-i="' + otra + '"]');
  const t1 = await page.touchscreen.touchStart(a.x, a.y), t2 = await page.touchscreen.touchStart(b.x, b.y);
  await t1.end(); await t2.end(); await dormir(250);
  const r = await page.evaluate(() => ({ aciertos: RE.ui.estado.partida.aciertos, falladas: RE.ui.estado.partida.falladas.length, hist: RE.ui.estado.partida.historial.length }));
  assert.deepEqual(r, { aciertos: 1, falladas: 0, hist: 1 });
  await page.cerrarContexto();
});

test('dos dedos a la vez en opciones distintas del inicio: se aplican las dos', async () => {
  const page = await paginaTactil(1920, 1080);
  const a = await centro(page, '.modo[data-foco="modo-corto"]'), b = await centro(page, '.interruptor');
  const t1 = await page.touchscreen.touchStart(a.x, a.y), t2 = await page.touchscreen.touchStart(b.x, b.y);
  await t2.end(); await t1.end(); await dormir(350);
  const r = await page.evaluate(() => ({ modo: RE.ui.estado.ops.modo, reloj: RE.ui.estado.ops.contrarreloj }));
  assert.deepEqual(r, { modo: 'corto', reloj: true });
  assert.deepEqual(page.errores, []);
  await page.cerrarContexto();
});

test('un solo dedo no dispara el toque dos veces (el respaldo para varios dedos no duplica nada)', async () => {
  const page = await paginaTactil(1920, 1080);
  for (let i = 0; i < 4; i++) {
    const c = await centro(page, '.interruptor'); await page.touchscreen.tap(c.x, c.y); await dormir(400);
    assert.equal(await page.evaluate(() => RE.ui.estado.ops.contrarreloj), i % 2 === 0, 'toque ' + (i + 1));
  }
  await page.cerrarContexto();
});

test('tres dedos a la vez en el teclado en pantalla: las tres letras entran', async () => {
  const page = await paginaTactil(1920, 1080);
  await page.evaluate(() => { RE.ui.teclado.abrir({ valor: '', alAceptar() {} }); });
  const pos = async (t) => { const i = await page.evaluate((x) => [...document.querySelectorAll('.teclado .tecla')].findIndex((k) => k.textContent.toLowerCase() === x), t); const e = (await page.$$('.teclado .tecla'))[i]; const b = await e.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  const [p1, p2, p3] = [await pos('a'), await pos('m'), await pos('o')];
  const d1 = await page.touchscreen.touchStart(p1.x, p1.y), d2 = await page.touchscreen.touchStart(p2.x, p2.y), d3 = await page.touchscreen.touchStart(p3.x, p3.y);
  await d1.end(); await d2.end(); await d3.end(); await dormir(400);
  const texto = await page.evaluate(() => document.querySelector('.teclado__texto').textContent.trim().toLowerCase());
  assert.equal([...texto].sort().join(''), 'amo');
  await page.cerrarContexto();
});

test('desafío con el dedo: arrastrar la ficha, y mientras otro dedo toca no se rompe nada', async () => {
  const page = await paginaTactil(1920, 1080);
  await page.evaluate(() => { RE.ui.nuevaPartida(); RE.ui.ir('desafio'); });
  const items = await page.evaluate(() => RE.ui.estado.partida.desafio.items.map((i) => ({ id: i.id, depto: i.depto })));
  const sel = async (dep) => { const idx = await page.evaluate((d) => [...document.querySelectorAll('.ficha')].findIndex((f) => f.textContent === d), dep); return '.ficha:nth-child(' + (idx + 1) + ')'; };
  const a = items[0], b = items[1];
  const pf = await centro(page, await sel(a.depto)), pl = await centro(page, '.lugar[data-id="' + a.id + '"]');
  const dedo = await page.touchscreen.touchStart(pf.x, pf.y);
  await dedo.move(pf.x - 40, pf.y - 20); await dormir(50);
  assert.equal(await page.evaluate(() => document.querySelectorAll('.ficha--arrastrando').length), 1);
  // un segundo dedo intenta arrastrar otra ficha al mismo tiempo: se ignora
  const pf2 = await centro(page, await sel(b.depto));
  const dedo2 = await page.touchscreen.touchStart(pf2.x, pf2.y);
  await dedo2.move(pf2.x - 60, pf2.y); await dormir(50);
  assert.equal(await page.evaluate(() => document.querySelectorAll('.ficha--arrastrando').length), 1, 'solo hay un arrastre a la vez');
  await dedo2.end();
  await dedo.move(pl.x, pl.y); await dedo.end(); await dormir(250);
  assert.equal(await page.evaluate((id) => document.querySelector('.lugar[data-id="' + id + '"]').classList.contains('lugar--resuelto'), a.id), true);
  assert.equal(await page.evaluate(() => document.querySelectorAll('.ficha--arrastrando').length), 0);
  assert.equal(await page.evaluate(() => RE.ui.estado.partida.desafio.items.filter((i) => i.estado !== 'pendiente').length), 1);
  assert.deepEqual(page.errores, []);
  await page.cerrarContexto();
});

test('un toque cancelado (pointercancel) en medio de un arrastre no deja la ficha trabada', async () => {
  const page = await paginaTactil(1920, 1080);
  await page.evaluate(() => { RE.ui.nuevaPartida(); RE.ui.ir('desafio'); });
  const ficha = await centro(page, '.ficha');
  const dedo = await page.touchscreen.touchStart(ficha.x, ficha.y);
  await dedo.move(ficha.x + 80, ficha.y + 60); await dormir(50);
  assert.equal(await page.evaluate(() => document.querySelectorAll('.ficha--arrastrando').length), 1);
  await page.evaluate(() => { const f = document.querySelector('.ficha'); f.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true })); });
  await dedo.end(); await dormir(100);
  assert.equal(await page.evaluate(() => document.querySelectorAll('.ficha--arrastrando').length), 0);
  // y se puede volver a arrastrar
  const f2 = await centro(page, '.ficha:nth-child(2)'), l = await centro(page, '.lugar');
  const d2 = await page.touchscreen.touchStart(f2.x, f2.y);
  await d2.move(l.x, l.y); await d2.end(); await dormir(250);
  assert.ok(await page.evaluate(() => RE.ui.estado.partida.desafio.items.some((i) => i.intentos > 0)));
  await page.cerrarContexto();
});

test('no hay zoom accidental: la página no permite pellizcar ni toques dobles, pero tampoco bloquea el zoom del navegador', async () => {
  const page = await paginaTactil(1920, 1080);
  const r = await page.evaluate(() => ({ ta: getComputedStyle(document.documentElement).touchAction, meta: document.querySelector('meta[name=viewport]').content }));
  assert.equal(r.ta, 'pan-x pan-y');
  assert.ok(!/user-scalable\s*=\s*no|maximum-scale/.test(r.meta), 'el viewport no desactiva el zoom: ' + r.meta);
  await page.cerrarContexto();
});
