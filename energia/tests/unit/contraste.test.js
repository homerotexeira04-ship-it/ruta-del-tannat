// Contraste de colores (WCAG 2.1): los pares de colores del CSS cumplen 4,5:1 en texto y 3:1 en íconos.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', '..', 'css', 'juego.css'), 'utf8');

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contraste(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

const raiz = {};
for (const m of css.match(/:root \{[\s\S]*?\n\}/)[0].matchAll(/--([a-z-]+): (#[0-9A-Fa-f]{6})/g)) raiz[m[1]] = m[2];
const estaciones = {};
for (const m of css.matchAll(/body\[data-e="(\w+)"\]\s*\{([^}]*)\}/g)) {
  const o = {};
  for (const v of m[2].matchAll(/--([a-z-]+): (#[0-9A-Fa-f]{6})/g)) o[v[1]] = v[2];
  estaciones[m[1]] = o;
}
const nodos = {};
for (const m of css.matchAll(/\.ruta__nodo\[data-e="(\w+)"\]\s*\{([^}]*)\}/g)) {
  const o = {};
  for (const v of m[2].matchAll(/--([a-z-]+): (#[0-9A-Fa-f]{6})/g)) o[v[1]] = v[2];
  nodos[m[1]] = o;
}

test('hay cinco estaciones con sus colores definidos', () => {
  assert.deepEqual(Object.keys(estaciones).sort(), ['biomasa', 'eolica', 'hidraulica', 'solar', 'uruguay']);
  assert.deepEqual(Object.keys(nodos).sort(), ['biomasa', 'eolica', 'hidraulica', 'solar', 'uruguay']);
});

test('texto base: la tinta y la tinta suave leen bien sobre blanco y sobre el fondo crema', () => {
  for (const fondo of [raiz.tarjeta, raiz.bg]) {
    assert.ok(contraste(raiz.ink, fondo) >= 7, 'tinta sobre ' + fondo);
    assert.ok(contraste(raiz['ink-soft'], fondo) >= 4.5, 'tinta suave sobre ' + fondo);
  }
});

test('botón principal: el texto oscuro sobre el amarillo pasa 4,5:1 (el original era blanco sobre amarillo, 2,3:1)', () => {
  assert.ok(contraste(raiz['cta-ink'], raiz.cta) >= 4.5);
});

test('en cada estación, el color de texto pasa 4,5:1 sobre blanco y sobre su tono suave', () => {
  for (const [k, e] of Object.entries(estaciones)) {
    assert.ok(contraste(e['e-ink'], '#FFFFFF') >= 4.5, k + ' sobre blanco: ' + contraste(e['e-ink'], '#FFFFFF').toFixed(2));
    assert.ok(contraste(e['e-ink'], e['e-luz']) >= 4.5, k + ' sobre su tono suave: ' + contraste(e['e-ink'], e['e-luz']).toFixed(2));
    assert.ok(contraste(raiz.ink, e['e-luz']) >= 7, k + ': tinta sobre su tono suave');
    assert.ok(contraste(e['e-sobre'], e['e-color']) >= 3, k + ': ícono sobre el color de la estación: ' + contraste(e['e-sobre'], e['e-color']).toFixed(2));
  }
});

test('el recorrido: los íconos de cada estación se distinguen sobre el color de su círculo', () => {
  for (const [k, n] of Object.entries(nodos)) {
    assert.ok(contraste(n['n-sobre'], n['n-fondo']) >= 3, k + ': ' + contraste(n['n-sobre'], n['n-fondo']).toFixed(2));
    assert.ok(contraste(n['n-ink'], '#FFFFFF') >= 4.5, k + ': borde y nombre sobre blanco');
  }
});

test('aciertos y errores: el texto de cada uno pasa 4,5:1 sobre su fondo suave', () => {
  assert.ok(contraste(raiz['ok-ink'], raiz['ok-luz']) >= 4.5);
  assert.ok(contraste(raiz['mal-ink'], raiz['mal-luz']) >= 4.5);
  assert.ok(contraste(raiz['ok-ink'], raiz.tarjeta) >= 4.5);
  assert.ok(contraste(raiz['mal-ink'], raiz.tarjeta) >= 4.5);
});
