'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { cargar, semilla, NUCLEO } = require('./cargar');

const RE = cargar(NUCLEO.concat(['js/motor.js']));
const { motor: M, config: C, datos: D } = RE;

function partida(n, opts) { return M.nuevaPartida(Object.assign({ rng: semilla(n), vistas: [] }, opts)); }

test('una partida completa tiene 25 preguntas: 5 por estación, sin repetidas y con la dificultad de la plantilla', () => {
  for (let s = 1; s <= 200; s++) {
    const P = partida(s);
    assert.equal(P.total, 25);
    assert.equal(new Set(P.preguntas.map((q) => q.id)).size, 25);
    D.estaciones.forEach((e, i) => {
      const qs = P.preguntas.filter((q) => q.estIdx === i);
      assert.equal(qs.length, 5);
      assert.ok(qs.every((q) => q.estacion === e.clave));
      assert.equal(JSON.stringify(qs.map((q) => q.dificultad)), JSON.stringify(C.modos.completo.plantilla));
    });
  }
});

test('el recorrido corto tiene 10 preguntas y 3 lugares en el desafío', () => {
  const P = partida(7, { modo: 'corto' });
  assert.equal(P.total, 10);
  assert.equal(P.desafio.items.length, 3);
  assert.equal(P.desafio.deptos.length, 4);
});

test('nunca salen juntas dos preguntas que se regalan la respuesta (noJuntarCon, en los dos sentidos)', () => {
  const por = new Map(D.preguntas.map((q) => [q.id, q]));
  for (let s = 1; s <= 500; s++) {
    const ids = partida(s).preguntas.map((q) => q.id);
    for (const a of ids) for (const b of ids) {
      if (a === b) continue;
      assert.ok(!por.get(a).noJuntarCon.includes(b), a + ' y ' + b + ' no deberían salir juntas');
    }
  }
});

test('las opciones conservan las mismas cuatro respuestas y la correcta marcada es la verdadera', () => {
  const orig = new Map(D.preguntas.map((q) => [q.id, q]));
  for (let s = 1; s <= 100; s++) for (const q of partida(s).preguntas) {
    const o = orig.get(q.id);
    assert.deepEqual(JSON.stringify([...q.opciones].sort()), JSON.stringify([...o.opciones].sort()));
    assert.equal(q.opciones[q.correcta], o.opciones[o.correcta]);
  }
});

test('la posición de la correcta es pareja y no hay rachas de tres ni escaleras A-B-C-D', () => {
  const cuenta = [0, 0, 0, 0];
  let total = 0;
  for (let s = 1; s <= 3000; s++) {
    const pos = partida(s).preguntas.map((q) => q.correcta);
    assert.ok(!M.tieneRacha(pos), 'racha de tres: ' + pos.join(''));
    assert.ok(!M.tieneEscalera(pos), 'escalera: ' + pos.join(''));
    pos.forEach((p) => { cuenta[p]++; total++; });
  }
  cuenta.forEach((c, i) => assert.ok(Math.abs(c / total - 0.25) < 0.015, 'posición ' + i + ' sale ' + Math.round((100 * c) / total) + ' %'));
});

// ---- jugadores que no leen: ninguna estrategia fija puede pasar de un poco más que el azar ----
function precision(estrategia, juegos) {
  let ok = 0, n = 0;
  for (let s = 1; s <= juegos; s++) {
    const P = partida(1000 + s);
    let previa = null;
    P.preguntas.forEach((q, i) => {
      if (estrategia(q, i, previa) === q.correcta) ok++;
      n++;
      previa = q.correcta;
    });
  }
  return ok / n;
}
const BOTS = {
  'siempre A': () => 0, 'siempre B': () => 1, 'siempre C': () => 2, 'siempre D': () => 3,
  'cíclico A-B-C-D': (q, i) => i % 4,
  'cíclico inverso': (q, i) => 3 - (i % 4),
  'repite la correcta anterior': (q, i, previa) => (previa == null ? 0 : previa),
  'sigue la correcta anterior + 1': (q, i, previa) => (previa == null ? 0 : (previa + 1) % 4),
  'la opción más larga': (q) => q.opciones.reduce((m, o, i, a) => (o.length > a[m].length ? i : m), 0),
  'la opción más corta': (q) => q.opciones.reduce((m, o, i, a) => (o.length < a[m].length ? i : m), 0)
};
for (const [nombre, bot] of Object.entries(BOTS)) {
  test('trampa «' + nombre + '» acierta cerca del azar (25 %) y nunca pasa de 33 %', () => {
    const p = precision(bot, 1500);
    assert.ok(p > 0.17 && p < 0.33, nombre + ' acierta ' + Math.round(100 * p) + ' %');
  });
}

test('con las preguntas ya vistas, la próxima partida no las repite mientras haya otras', () => {
  let vistas = [];
  const salieron = new Set();
  for (let g = 0; g < 2; g++) {
    const P = partida(50 + g, { vistas });
    for (const q of P.preguntas) { assert.ok(!salieron.has(q.id), q.id + ' se repitió en la partida ' + (g + 1)); salieron.add(q.id); }
    vistas = vistas.concat(P.preguntas.map((q) => q.id));
  }
});

test('el sorteo recorre todo el banco: con muchas partidas seguidas, todas las preguntas salen', () => {
  let vistas = [];
  const salieron = new Set();
  for (let g = 0; g < 12; g++) {
    const P = partida(900 + g, { vistas });
    P.preguntas.forEach((q) => salieron.add(q.id));
    vistas = vistas.concat(P.preguntas.map((q) => q.id)).slice(-C.vistasMax);
  }
  assert.ok(salieron.size >= 95, 'solo salieron ' + salieron.size + ' de 100');
});

// ---- puntaje ----
function jugar(P, acierta, msPorPregunta) {
  const res = [];
  while (!P.terminoPreguntas) {
    const q = M.actual(P);
    const eleccion = acierta(q, P.i) ? q.correcta : (q.correcta + 1) % 4;
    res.push(M.responder(P, eleccion, msPorPregunta || 0));
    M.avanzar(P);
  }
  return res;
}

test('recorrido perfecto: 25 × 10 + 8 bonos de racha de 5 = 290 puntos, y cinco logros', () => {
  const P = partida(3);
  const res = jugar(P, () => true);
  assert.equal(P.puntaje, 290);
  assert.equal(P.aciertos, 25);
  assert.equal(P.mejorRacha, 25);
  assert.equal(JSON.stringify(res.filter((r) => r.logro).map((r) => r.logro.clave)), JSON.stringify(['voltio', 'viento', 'solar', 'corriente', 'leyenda']));
});

test('un error corta la racha y el bono de +5 vuelve a contar desde cero', () => {
  const P = partida(4);
  const q = (i) => (i === 3 ? false : true);
  jugar(P, (_, i) => q(i));
  // 24 aciertos, racha 3 (preguntas 0-2) → +5; error; luego 21 seguidos → 7 bonos de +5 → 24*10 + 5 + 35 = 280
  assert.equal(P.puntaje, 24 * 10 + 5 + 7 * 5);
  assert.equal(P.mejorRacha, 21);
});

test('no se puede responder dos veces la misma pregunta', () => {
  const P = partida(5);
  const q = M.actual(P);
  assert.ok(M.responder(P, q.correcta, 0));
  assert.equal(M.responder(P, q.correcta, 0), null);
  assert.equal(P.puntaje, 10);
  assert.equal(P.aciertos, 1);
});

test('sin tiempo (−1) cuenta como error y guarda la pregunta para el repaso', () => {
  const P = partida(6);
  const r = M.responder(P, -1, 99999);
  assert.equal(r.ok, false);
  assert.equal(r.tiempoAgotado, true);
  assert.equal(P.falladas.length, 1);
  assert.equal(P.falladas[0].elegida, -1);
});

test('contrarreloj: el bono de velocidad va de 0 a 5 y solo se da con acierto', () => {
  const rapida = partida(8, { contrarreloj: true }), lenta = partida(8, { contrarreloj: true }), mala = partida(8, { contrarreloj: true });
  const q = M.actual(rapida), lim = M.limiteMs(q, 'normal');
  assert.equal(M.responder(rapida, q.correcta, 0).bonoVelocidad, 5);
  assert.equal(M.responder(lenta, q.correcta, lim).bonoVelocidad, 0);
  assert.equal(M.responder(lenta === mala ? lenta : mala, (q.correcta + 1) % 4, 0).bonoVelocidad, 0);
  const sin = partida(8);
  assert.equal(M.responder(sin, M.actual(sin).correcta, 0).bonoVelocidad, 0);
});

test('el tiempo de cada pregunta depende de lo que hay que leer y del ritmo, entre 10 y 60 segundos', () => {
  for (let s = 1; s <= 30; s++) for (const q of partida(s).preguntas) {
    const t = M.limiteMs(q, 'tranquilo'), n = M.limiteMs(q, 'normal'), v = M.limiteMs(q, 'veloz');
    assert.ok(v <= n && n <= t, 'el ritmo veloz no puede dar más tiempo que el tranquilo');
    for (const x of [t, n, v]) assert.ok(x >= 10000 && x <= 60000 && x % 1000 === 0);
  }
  const corta = { pregunta: 'a b c', opciones: ['a', 'b', 'c', 'd'] };
  const larga = { pregunta: new Array(25).fill('palabra').join(' '), opciones: new Array(4).fill(new Array(10).fill('palabra').join(' ')) };
  assert.ok(M.limiteMs(larga, 'normal') > M.limiteMs(corta, 'normal'));
});

test('resumen: porcentaje, insignia según umbrales y duración', () => {
  const P = partida(9);
  P.inicioMs = 1000;
  jugar(P, (_, i) => i < 18); // 18 de 25 = 72 %
  const r = M.resumen(P, 61000);
  assert.equal(r.pct, 72);
  assert.equal(r.insignia.clave, 'guardian');
  assert.equal(r.duracionS, 60);
  assert.equal(M.insigniaPara(100).clave, 'experto');
  assert.equal(M.insigniaPara(50).clave, 'aprendiz');
  assert.equal(M.insigniaPara(0).clave, 'explorador');
});

// ---- desafío final ----
test('el desafío usa departamentos distintos, un lugar de cada energía y fichas de más para no resolverlo por descarte', () => {
  for (let s = 1; s <= 200; s++) {
    const d = M.nuevoDesafio(D, 'completo', semilla(s));
    assert.equal(d.items.length, 5);
    assert.equal(new Set(d.items.map((x) => x.depto)).size, 5);
    assert.equal(new Set(d.items.map((x) => x.energia)).size >= 4, true);
    assert.equal(d.deptos.length, 7);
    assert.equal(new Set(d.deptos).size, 7);
    d.items.forEach((x) => assert.ok(d.deptos.includes(x.depto)));
  }
});

test('desafío: 10 puntos a la primera, 5 a la segunda y a la segunda equivocación se muestra la respuesta', () => {
  const P = partida(11);
  const d = P.desafio, [a, b, c] = d.items;
  // una ficha equivocada que todavía esté disponible
  const mala = (it, ya) => d.deptos.find((x) => x !== it.depto && !d.colocados[x] && !(ya || []).includes(x));
  assert.equal(M.resolverLugar(P, a.id, a.depto).puntos, 10);
  const m1 = mala(b);
  const e1 = M.resolverLugar(P, b.id, m1);
  assert.deepEqual([e1.ok, e1.revelado, e1.intentosQuedan], [false, false, 1]);
  assert.equal(M.resolverLugar(P, b.id, b.depto).puntos, 5);
  const m2 = mala(c);
  assert.equal(M.resolverLugar(P, c.id, m2).revelado, false);
  const e2 = M.resolverLugar(P, c.id, mala(c, [m2]));
  assert.equal(e2.revelado, true);
  assert.equal(c.estado, 'revelado');
  assert.equal(d.colocados[c.depto], c.id);
  assert.equal(P.puntaje, 15);
  assert.equal(d.terminado, false);
});

test('desafío: no se puede reusar una ficha ni volver a un lugar ya resuelto', () => {
  const P = partida(12), d = P.desafio, [a, b] = d.items;
  M.resolverLugar(P, a.id, a.depto);
  assert.equal(M.resolverLugar(P, b.id, a.depto), null);
  assert.equal(M.resolverLugar(P, a.id, a.depto), null);
  assert.equal(M.resolverLugar(P, b.id, 'Atlántida'), null);
});

test('desafío: resolverlo todo a la primera da 50 puntos y lo deja terminado; el máximo del juego es 340', () => {
  const P = partida(13);
  jugar(P, () => true);
  P.desafio.items.forEach((it) => M.resolverLugar(P, it.id, it.depto));
  assert.equal(P.desafio.terminado, true);
  assert.equal(P.desafio.puntos, 50);
  assert.equal(P.puntaje, 340);
});
