// Toques de más: los toques dobles y los toques «fantasma» de una pantalla infrarroja no encadenan pantallas sin querer.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, dormir } = require('./ayudas');

let B;
test.before(async () => { B = await iniciar(); });
test.after(async () => { await B.cerrar(); });

const pantalla = (page) => page.evaluate(() => RE.ui.estado.pantalla);
async function centro(page, sel) { const e = await page.$(sel); const b = await e.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }
async function aEstacionCompleta(page) {
  await page.evaluate(() => { RE.ui.nuevaPartida(); const P = RE.ui.estado.partida; P.i = 4; P.respondida = true; RE.ui.estado.estIdx = 0; RE.ui.ir('estacion'); });
  await dormir(450); // pasa el antirrebote de la pantalla recién abierta
}

test('un toque doble sobre «Continuar» no se salta la presentación de la estación siguiente', async () => {
  const page = await B.pagina({ antirrebote: true });
  await aEstacionCompleta(page);
  const c = await centro(page, '#botonContinuar');
  await page.mouse.click(c.x, c.y);
  await page.mouse.click(c.x, c.y); // el segundo toque llega enseguida, sobre la pantalla nueva
  await dormir(150);
  assert.equal(await pantalla(page), 'intro');
  assert.equal(await page.evaluate(() => RE.ui.estado.estIdx), 1);
  await page.cerrarContexto();
});

test('pasado el antirrebote, el mismo toque sí se atiende (no se traba nada)', async () => {
  const page = await B.pagina({ antirrebote: true });
  await aEstacionCompleta(page);
  await page.click('#botonContinuar'); await dormir(450);
  assert.equal(await pantalla(page), 'intro');
  await page.click('#botonEstacion'); await dormir(100);
  assert.equal(await pantalla(page), 'pregunta');
  await page.cerrarContexto();
});

test('el teclado no tiene antirrebote: Enter sobre el botón siempre funciona', async () => {
  const page = await B.pagina({ antirrebote: true });
  await aEstacionCompleta(page);
  await page.focus('#botonContinuar'); await page.keyboard.press('Enter'); await dormir(80);
  assert.equal(await pantalla(page), 'intro');
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); await dormir(80);
  assert.equal(await pantalla(page), 'pregunta');
  await page.cerrarContexto();
});

test('por defecto el antirrebote es de unos 300 milisegundos', async () => {
  const page = await B.pagina({ antirrebote: true });
  assert.ok(await page.evaluate(() => RE.config.antirreboteMs >= 200 && RE.config.antirreboteMs <= 500));
  await page.cerrarContexto();
});

test('anotar la partida dos veces seguidas (botón y cierre automático a la vez) no duplica el puntaje en el ranking', async () => {
  const page = await B.pagina();
  await page.evaluate(() => { RE.ui.nuevaPartida(); RE.ui.ir('desafio'); RE.ui.finalizar(); RE.ui.finalizar(); });
  assert.equal(await page.evaluate(() => RE.almacen.ranking.todos().length), 1);
  await page.cerrarContexto();
});
