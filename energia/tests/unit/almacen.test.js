'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { cargar, localStorageFalso, NUCLEO } = require('./cargar');

const nuevo = (ls) => cargar(NUCLEO.concat(['js/almacen.js']), ls === undefined ? {} : { localStorage: ls });
const plano = (x) => JSON.parse(JSON.stringify(x)); // los objetos nacen en otro contexto de Node: se pasan por JSON para comparar
const entrada = (o) => Object.assign({ nombre: 'Ana', puntaje: 100, aciertos: 10, total: 25, pct: 40, mejorRacha: 3, modo: 'completo', contrarreloj: false, duracionS: 300 }, o);

test('con localStorage, el ranking se guarda y se lee', () => {
  const RE = nuevo(localStorageFalso());
  const r = RE.almacen.ranking.guardar(entrada({}));
  assert.equal(r.guardado, true);
  assert.equal(RE.almacen.estado().persistente, true);
  assert.equal(RE.almacen.ranking.todos().length, 1);
});

test('sin localStorage el juego sigue y avisa que no queda guardado', () => {
  for (const ls of [undefined, localStorageFalso({ falla: 'siempre' })]) {
    const RE = nuevo(ls);
    const r = RE.almacen.ranking.guardar(entrada({}));
    assert.equal(r.guardado, false);
    assert.equal(RE.almacen.estado().persistente, false);
    assert.equal(RE.almacen.ranking.todos().length, 1, 'se conserva en memoria mientras la página siga abierta');
  }
});

test('si el disco se llena al guardar, se avisa y no se pierde la partida en curso', () => {
  const ls = localStorageFalso();
  const RE = nuevo(ls);
  ls.setItem = () => { throw new Error('QuotaExceededError'); };
  const r = RE.almacen.ranking.guardar(entrada({}));
  assert.equal(r.guardado, false);
  assert.equal(RE.almacen.estado().persistente, false);
  assert.equal(r.puesto, 1);
});

test('el ranking ordena por puntaje, luego aciertos y luego tiempo, y separa las categorías', () => {
  const RE = nuevo(localStorageFalso());
  const R = RE.almacen.ranking;
  R.guardar(entrada({ nombre: 'A', puntaje: 200 }));
  R.guardar(entrada({ nombre: 'B', puntaje: 250 }));
  R.guardar(entrada({ nombre: 'C', puntaje: 200, pct: 60 }));
  R.guardar(entrada({ nombre: 'D', puntaje: 200, pct: 60, duracionS: 100 }));
  R.guardar(entrada({ nombre: 'E', puntaje: 999, modo: 'corto' }));
  R.guardar(entrada({ nombre: 'F', puntaje: 999, contrarreloj: true }));
  assert.deepEqual(plano(R.top('completo', 10).map((e) => e.nombre)), ['B', 'D', 'C', 'A']);
  assert.deepEqual(plano(R.top('corto', 10).map((e) => e.nombre)), ['E']);
  assert.deepEqual(plano(R.top('completo+reloj', 10).map((e) => e.nombre)), ['F']);
  const g = R.guardar(entrada({ nombre: 'G', puntaje: 230 }));
  assert.equal(g.puesto, 2);
  assert.equal(g.deTotal, 5);
});

test('el nombre se limpia: sin etiquetas, sin saltos de línea, con largo máximo y «Anónimo/a» si queda vacío', () => {
  const RE = nuevo(localStorageFalso());
  const R = RE.almacen.ranking;
  assert.equal(R.guardar(entrada({ nombre: '  Ana\n\n\t Pérez  ' })).entrada.nombre, 'Ana Pérez');
  assert.equal(R.guardar(entrada({ nombre: '   ' })).entrada.nombre, 'Anónimo/a');
  assert.ok(R.guardar(entrada({ nombre: 'x'.repeat(100) })).entrada.nombre.length <= 24);
  assert.equal(R.guardar(entrada({ nombre: 'Liceo N°5 "2°B" & co' })).entrada.nombre, 'Liceo N°5 "2°B" & co');
});

test('datos dañados en el disco no rompen el ranking', () => {
  const ls = localStorageFalso();
  ls.setItem('re.v1.ranking', '{no es json');
  const RE = nuevo(ls);
  assert.deepEqual(plano(RE.almacen.ranking.todos()), []);
  ls.setItem('re.v1.ranking', JSON.stringify([null, 5, 'x', { nombre: 'Z', puntaje: 'mucho' }]));
  assert.equal(RE.almacen.ranking.todos().length, 1);
  assert.equal(RE.almacen.ranking.todos()[0].puntaje, 0);
});

test('el ranking no crece sin límite: conserva los mejores de cada categoría y los más recientes', () => {
  const RE = nuevo(localStorageFalso());
  const R = RE.almacen.ranking;
  for (let i = 0; i < 1300; i++) R.guardar(entrada({ nombre: 'J' + i, puntaje: i % 300, fecha: 1000 + i, id: 'id' + i }));
  assert.ok(R.todos().length <= 1000);
  assert.equal(R.top('completo', 1)[0].puntaje, 299);
});

test('el CSV neutraliza fórmulas de planilla y escapa comillas y punto y coma', () => {
  const RE = nuevo(localStorageFalso());
  RE.almacen.ranking.guardar(entrada({ nombre: '=HYPERLINK("x")' }));
  RE.almacen.ranking.guardar(entrada({ nombre: 'a;b "c"' }));
  const csv = RE.almacen.ranking.csv();
  assert.ok(csv.startsWith('fecha;nombre;modo'));
  assert.ok(csv.includes("\"'=HYPERLINK(\"\"x\"\")\"") || csv.includes("'=HYPERLINK"));
  assert.ok(csv.includes('"a;b ""c"""'));
});

test('las preguntas vistas se recuerdan en orden y con tope', () => {
  const RE = nuevo(localStorageFalso());
  RE.almacen.vistas.registrar(['a', 'b', 'c']);
  RE.almacen.vistas.registrar(['b', 'd']);
  assert.deepEqual(plano(RE.almacen.vistas.leer()), ['a', 'c', 'b', 'd']);
  RE.almacen.vistas.registrar(Array.from({ length: 150 }, (_, i) => 'q' + i));
  assert.equal(RE.almacen.vistas.leer().length, RE.config.vistasMax);
});

test('la estadística cuenta veces y aciertos por pregunta', () => {
  const RE = nuevo(localStorageFalso());
  RE.almacen.stats.registrar([{ id: 'hid-001', ok: true }, { id: 'hid-002', ok: false }]);
  RE.almacen.stats.registrar([{ id: 'hid-001', ok: false }]);
  const s = RE.almacen.stats.leer();
  assert.deepEqual(plano(s['hid-001']), [2, 1]);
  assert.deepEqual(plano(s['hid-002']), [1, 0]);
  const csv = RE.almacen.stats.csv(RE.datos).split('\r\n');
  assert.equal(csv.length, 3);
  assert.ok(csv[1].startsWith('hid-002;')); // la peor acertada primero
});

test('los ajustes tienen valores por defecto y se validan', () => {
  const RE = nuevo(localStorageFalso());
  assert.deepEqual(plano(RE.almacen.ajustes.leer()), { sonido: true, modoPorDefecto: 'completo', ritmoPorDefecto: 'normal' });
  RE.almacen.ajustes.guardar({ sonido: false, modoPorDefecto: 'inventado', ritmoPorDefecto: 'veloz', otra: 1 });
  const a = RE.almacen.ajustes.leer();
  assert.equal(a.sonido, false);
  assert.equal(a.modoPorDefecto, 'completo');
  assert.equal(a.ritmoPorDefecto, 'veloz');
  assert.equal('otra' in a, false);
});
