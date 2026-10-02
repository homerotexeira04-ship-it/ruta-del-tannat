'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validar, cargarDatos } = require('../../scripts/check-banco.js');

test('el banco de preguntas pasa el linter sin errores', () => {
  const { errores } = validar(cargarDatos());
  assert.deepEqual(errores, []);
});

test('hay 100 preguntas, 20 por estación, con ids únicos y cuatro opciones distintas cada una', () => {
  const D = cargarDatos();
  assert.equal(D.preguntas.length, 100);
  assert.equal(new Set(D.preguntas.map((q) => q.id)).size, 100);
  for (const e of D.estaciones) assert.equal(D.preguntas.filter((q) => q.estacion === e.clave).length, 20);
  for (const q of D.preguntas) {
    assert.equal(q.opciones.length, 4);
    assert.equal(new Set(q.opciones).size, 4, q.id + ' tiene opciones repetidas');
    assert.equal(q.correcta, 0, q.id + ': el banco se escribe con la correcta primera; el juego la reubica');
  }
});

test('no se afirma que los datos estén verificados sin matices ni se inventan fuentes', () => {
  const D = cargarDatos();
  for (const q of D.preguntas) for (const f of q.fuente) assert.ok(D.fuentes[f], q.id + ': fuente inexistente ' + f);
  const texto = JSON.stringify(D.preguntas).toLowerCase();
  assert.ok(!texto.includes('datos verificados'));
});
