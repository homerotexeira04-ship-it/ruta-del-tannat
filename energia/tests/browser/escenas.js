// Pantallas armadas para las pruebas de aspecto: cada escena deja una pantalla del juego lista; después se cambia la foto con RE.ui.tema(e).
'use strict';
const { mostrarPregunta } = require('./ayudas');

const ESTACIONES = ['hidraulica', 'eolica', 'solar', 'biomasa', 'uruguay'];

// Juega una partida entera sin tocar la pantalla: acierta una de cada tres preguntas y resuelve bien el desafío.
function jugarTodo() {
  RE.ui.nuevaPartida();
  const P = RE.ui.estado.partida;
  P.preguntas.forEach((q, i) => { P.i = i; P.respondida = false; RE.motor.responder(P, i % 3 === 0 ? q.correcta : (q.correcta + 1) % 4, 0); });
  P.desafio.items.forEach((it) => RE.motor.resolverLugar(P, it.id, it.depto));
}

const ESCENAS = [
  ['inicio vacío', async (page) => { await page.evaluate(() => { RE.ui.estado.ops.nombre = ''; RE.ui.ir('inicio'); }); }],
  ['inicio con ranking y contrarreloj', async (page) => {
    await page.evaluate(() => {
      for (const [n, p] of [['Ana', 320], ['Bruno 2°B', 280], ['Camila', 250], ['Diego', 210], ['Emilia', 180]]) RE.almacen.ranking.guardar({ nombre: n, puntaje: p, aciertos: 20, total: 25, pct: 80, mejorRacha: 6, modo: 'completo', contrarreloj: true, duracionS: 600 });
      RE.ui.estado.ops.nombre = 'Ana María de los Ángeles'; RE.ui.estado.ops.contrarreloj = true; RE.ui.ir('inicio');
    });
  }],
  ['presentación de la estación', async (page) => { await page.evaluate(() => { RE.ui.nuevaPartida(); RE.ui.estado.estIdx = 2; RE.ui.ir('intro'); }); }],
  ['pregunta sin responder', async (page) => { await mostrarPregunta(page, 'hid-001'); }],
  ['pregunta con acierto', async (page) => {
    await mostrarPregunta(page, 'eol-003');
    await page.evaluate(() => { const q = RE.motor.actual(RE.ui.estado.partida); document.querySelector('.respuesta[data-i="' + q.correcta + '"]').click(); });
  }],
  ['pregunta con error', async (page) => {
    await mostrarPregunta(page, 'sol-004', { contrarreloj: true });
    await page.evaluate(() => { const q = RE.motor.actual(RE.ui.estado.partida); document.querySelector('.respuesta[data-i="' + ((q.correcta + 1) % 4) + '"]').click(); });
  }],
  ['cierre de la estación', async (page) => { await page.evaluate(() => { RE.ui.nuevaPartida(); const P = RE.ui.estado.partida; P.respondida = true; P.i = 4; RE.ui.estado.estIdx = 0; RE.ui.ir('estacion'); }); }],
  ['desafío con un error', async (page) => {
    await page.evaluate(() => {
      RE.ui.nuevaPartida(); RE.ui.ir('desafio');
      const d = RE.ui.estado.partida.desafio, mal = d.deptos.find((x) => x !== d.items[0].depto);
      document.querySelector('.lugar[data-id="' + d.items[0].id + '"]').click();
      [...document.querySelectorAll('.ficha')].find((f) => f.textContent === mal).click();
    });
  }],
  ['resultado final', async (page) => { await page.evaluate(jugarTodo); await page.evaluate(() => RE.ui.finalizar()); }],
  ['repaso de errores', async (page) => { await page.evaluate(jugarTodo); await page.evaluate(() => { RE.ui.estado.repasoIdx = 0; RE.ui.ir('repaso'); }); }]
];

module.exports = { ESCENAS, ESTACIONES };
