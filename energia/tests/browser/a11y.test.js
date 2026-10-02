// Accesibilidad con axe-core (WCAG 2.1 A y AA) en cada pantalla del juego.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { iniciar, mostrarPregunta, dormir } = require('./ayudas');

let B;
test.before(async () => { B = await iniciar(); });
test.after(async () => { await B.cerrar(); });

const AXE = path.join(__dirname, '..', '..', 'node_modules', 'axe-core', 'axe.min.js');

async function revisar(page, nombre) {
  await dormir(700); // que terminen las transiciones de color antes de medir el contraste
  await page.addScriptTag({ path: AXE });
  const r = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } }));
  return r.violations.map((v) => nombre + ' · ' + v.id + ' (' + v.impact + '): ' + v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ') + ' → ' + v.help);
}

test('axe: ninguna pantalla tiene violaciones de accesibilidad', async () => {
  const page = await B.pagina({ antes: (p) => p.setBypassCSP(true) }); // axe se inyecta como script en línea; la política de seguridad se prueba en privacidad.test.js
  const problemas = [];
  const juntar = async (n) => problemas.push(...(await revisar(page, n)));

  await juntar('inicio');
  await page.evaluate(() => { RE.ui.estado.ops.contrarreloj = true; RE.ui.estado.ops.nombre = 'Ana'; RE.ui.ir('inicio'); }); await juntar('inicio con contrarreloj');
  await page.evaluate(() => { RE.ui.estado.ops.contrarreloj = false; RE.ui.nuevaPartida(); }); await juntar('presentación de estación');
  for (const [i, id] of [[0, 'hid-001'], [1, 'eol-001'], [2, 'sol-001'], [3, 'bio-001'], [4, 'uru-001']]) {
    await mostrarPregunta(page, id, {}); await juntar('pregunta ' + id);
    await page.evaluate(() => { const q = RE.motor.actual(RE.ui.estado.partida); document.querySelector('.respuesta[data-i="' + ((q.correcta + 1) % 4) + '"]').click(); });
    await juntar('pregunta ' + id + ' respondida mal');
    if (i === 2) { await page.evaluate(() => { RE.ui.ir('pregunta'); }); }
  }
  await mostrarPregunta(page, 'hid-004', { contrarreloj: true }); await juntar('pregunta con contrarreloj');
  await page.evaluate(() => { const P = RE.ui.estado.partida; RE.motor.responder(P, RE.motor.actual(P).correcta, 0); RE.ui.estado.estIdx = 0; RE.ui.ir('estacion'); }); await juntar('estación completada');
  await page.evaluate(() => RE.ui.ir('desafio')); await juntar('desafío');
  await page.evaluate(() => {
    const P = RE.ui.estado.partida;
    P.preguntas.forEach((q, i) => { P.i = i; P.respondida = false; RE.motor.responder(P, i % 2 ? q.correcta : (q.correcta + 1) % 4, 0); });
    P.desafio.items.forEach((it) => RE.motor.resolverLugar(P, it.id, it.depto));
    RE.ui.finalizar();
  }); await juntar('resultados');
  await page.evaluate(() => { RE.ui.estado.repasoIdx = 0; RE.ui.ir('repaso'); }); await juntar('repaso');
  await page.evaluate(() => RE.ui.ir('final'));
  await page.evaluate(() => RE.ui.abrirCreditos()); await juntar('créditos'); await page.keyboard.press('Escape');
  await page.evaluate(() => RE.ui.reiniciar(false));
  await page.evaluate(() => RE.kiosco.abrirAdmin()); await juntar('PIN');
  await page.keyboard.press('Escape');
  await page.evaluate(() => { RE.ui.teclado.abrir({ valor: 'Ana', alAceptar() {} }); }); await juntar('teclado en pantalla');
  await page.cerrarContexto();
  assert.deepEqual(problemas, []);
});

// Algunos textos van directamente sobre la foto de fondo (pie de página y nombres del recorrido): se mide su contraste
// contra lo más oscuro que haya detrás de cada recuadro, en las cinco fotos y en los tres estados del recorrido.
test('los textos que van sobre la foto de fondo se leen en las cinco estaciones', async () => {
  const page = await B.pagina();
  const resultados = [];
  const lum = (r, g, b) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const L = (c) => lum(...c.match(/\d+/g).slice(0, 3).map(Number));
  await page.evaluate(() => { RE.ui.nuevaPartida(); RE.ui.estado.estIdx = 2; RE.ui.ir('intro'); }); // nodos hechos, actual y pendientes a la vez
  await page.addStyleTag({ content: '.sin-texto *, .sin-texto { color: transparent !important; text-shadow: none !important; }' });
  for (const e of ['hidraulica', 'eolica', 'solar', 'biomasa', 'uruguay']) {
    await page.evaluate((e) => { RE.ui.tema(e); }, e);
    const tintas = await page.evaluate(() => [...document.querySelectorAll('.pie > span, .ruta__nombre')].filter((s) => s.offsetWidth).map((s) => getComputedStyle(s).color));
    await page.evaluate(() => document.body.classList.add('sin-texto'));
    await dormir(1100); // termina el cambio de foto (0,8 s)
    const cajas = await page.evaluate(() => [...document.querySelectorAll('.pie > span, .ruta__nombre')].filter((s) => s.offsetWidth).map((s) => { const q = s.getBoundingClientRect(); return [Math.floor(q.left) + 14, Math.floor(q.top) + 4, Math.ceil(q.width) - 28, Math.ceil(q.height) - 8]; }));
    const b64 = await page.screenshot({ encoding: 'base64' });
    const minimos = await page.evaluate(async (b64, cajas) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const f = (r, g_, b) => [r, g_, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
      return cajas.map(([x, y, w, h]) => { let m = 1; const d = g.getImageData(x, y, Math.max(1, w), Math.max(1, h)).data; for (let i = 0; i < d.length; i += 4) m = Math.min(m, f(d[i], d[i + 1], d[i + 2])); return m; });
    }, b64, cajas);
    await page.evaluate(() => document.body.classList.remove('sin-texto'));
    minimos.forEach((m, i) => resultados.push([e, i, ((m + 0.05) / (L(tintas[i]) + 0.05)).toFixed(2)]));
  }
  await page.cerrarContexto();
  const malos = resultados.filter(([, , c]) => +c < 4.5);
  assert.deepEqual(malos, [], 'textos con menos de 4,5:1 sobre la foto: ' + JSON.stringify(malos));
});
