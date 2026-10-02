// Ayudante de las pruebas: carga los archivos del juego en un contexto aislado de Node (sin navegador).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', '..');
const DATOS = ['base.js', 'fuentes.js', 'p-hidraulica.js', 'p-eolica.js', 'p-solar.js', 'p-biomasa.js', 'p-uruguay.js'].map((f) => 'js/datos/' + f);

// extra: variables globales que se quieran simular (por ejemplo, un localStorage)
function cargar(archivos, extra) {
  const ctx = vm.createContext(Object.assign({ console }, extra || {}));
  for (const f of archivos) vm.runInContext(fs.readFileSync(path.join(RAIZ, f), 'utf8'), ctx, { filename: f });
  return ctx.RE;
}

// Generador pseudoaleatorio con semilla (mulberry32): las pruebas dan siempre lo mismo.
function semilla(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// localStorage de mentira. opciones.falla: 'siempre' (lanza al abrir) | 'escritura' (lanza al guardar).
function localStorageFalso(opciones) {
  const m = new Map();
  const falla = opciones && opciones.falla;
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { if (falla === 'siempre' || falla === 'escritura') throw new Error('QuotaExceededError'); m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    _m: m
  };
}

const NUCLEO = ['js/config.js', 'js/util.js'].concat(DATOS);
module.exports = { cargar, semilla, localStorageFalso, NUCLEO, DATOS, RAIZ };
