// Prueba del contador de uso de opiniones.gs con un Google Sheets / Apps Script simulado. Uso: node --test apps-script/estadisticas.test.js
const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function entorno() {
  let ahora = Date.UTC(2026, 8, 21, 15, 0, 0); // 2026-09-21 15:00 UTC = 12:00 en Montevideo
  class Fecha extends Date { constructor(...a) { super(...(a.length ? a : [ahora])); } static now() { return ahora; } }
  const cache = new Map(), hojas = {}, log = { zona: null };
  const rango = (filas, r, c, nr, nc) => {
    const api = {
      getDisplayValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => String((filas[r - 1 + i] || [])[c - 1 + j] ?? ''))),
      getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => (filas[r - 1 + i] || [])[c - 1 + j] ?? '')),
      getValue: () => (filas[r - 1] || [])[c - 1] ?? '',
      setValue: (v) => { (filas[r - 1] = filas[r - 1] || [])[c - 1] = v; return api; },
      setValues: (vs) => { vs.forEach((f, i) => f.forEach((v, j) => { (filas[r - 1 + i] = filas[r - 1 + i] || [])[c - 1 + j] = v; })); return api; },
      setFormula: (f) => { (filas[r - 1] = filas[r - 1] || [])[c - 1] = f; return api; },
      setFormulas: (fs) => api.setValues(fs),
    };
    ['setFontWeight', 'setFontSize', 'setNumberFormat', 'setDataValidation'].forEach((m) => { api[m] = () => api; });
    return api;
  };
  const crearHoja = (nombre) => {
    const filas = []; const h = {
      nombre, filas,
      getLastRow: () => filas.length, appendRow: (f) => { filas.push(f); }, deleteRow: (i) => { filas.splice(i - 1, 1); }, clear: () => { filas.length = 0; },
      getRange: (a, b, c, d) => (typeof a === 'string' ? rango([], 1, 1, 1, 1) : rango(filas, a, b, c || 1, d || 1)),
      getDataRange: () => ({ getValues: () => filas.map((f) => f.slice()) }),
      setFrozenRows() {}, setColumnWidth() {}, setColumnWidths() {},
    };
    hojas[nombre] = h; return h;
  };
  crearHoja('Opiniones').filas.push(['Fecha', 'Estado', 'Nombre', 'Origen', 'Experiencia', 'Puntaje', 'Opinión', 'Visita', 'Idioma']);
  const ss = { getUrl: () => 'https://planilla', getSheetByName: (n) => hojas[n] || null, insertSheet: (n) => crearHoja(n), setSpreadsheetTimeZone: (z) => { log.zona = z; } };
  const ctx = {
    console, Number, String, JSON, Object, Math, Date: Fecha,
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, newDataValidation: () => ({ requireValueInList() { return this; }, build() { return {}; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) || null, put: (k, v) => cache.set(k, v), remove: (k) => cache.delete(k) }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ t, setMimeType() { return this; } }) },
    MailApp: { sendEmail() {} },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'equipo@ejemplo.uy' }), getScriptTimeZone: () => 'UTC' },
    Utilities: { formatDate: (d, tz, fmt) => (fmt === 'yyyy-MM-dd' ? d.toISOString().slice(0, 10) : d.toISOString().slice(0, 7)) },
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'opiniones.gs'), 'utf8') + '\n;this.api = { doPost, setup, borrarPruebas };', ctx);
  const post = (d) => JSON.parse(ctx.api.doPost({ postData: { contents: JSON.stringify(d) } }).t);
  const ev = (e, a = '', b = '', c = '') => post({ tipo: 'evento', e, a, b, c });
  const stats = () => (hojas.Estadisticas ? JSON.parse(JSON.stringify(hojas.Estadisticas.filas)) : null); // copia plana: los arreglos del contexto simulado tienen otro prototipo
  return { post, ev, stats, hojas, cache, log, api: ctx.api, dia: (y, m, d) => { ahora = Date.UTC(y, m - 1, d, 15, 0, 0); } };
}

test('un evento válido crea la hoja y la fila; repetirlo suma 1 sin crear filas nuevas', () => {
  const e = entorno();
  assert.strictEqual(e.stats(), null);
  assert.deepStrictEqual(e.ev('visita', 'es', 'm', 'directo'), { ok: true });
  assert.deepStrictEqual(e.stats()[0], ['Fecha', 'Evento', 'Detalle 1', 'Detalle 2', 'Detalle 3', 'Cantidad']);
  assert.deepStrictEqual(e.stats()[1], ['2026-09-21', 'visita', 'es', 'm', 'directo', 1]);
  e.ev('visita', 'es', 'm', 'directo'); e.ev('visita', 'es', 'm', 'directo');
  assert.strictEqual(e.stats().length, 2);
  assert.strictEqual(e.stats()[1][5], 3);
});

test('detalles distintos son filas distintas, y cada una suma por su cuenta', () => {
  const e = entorno();
  e.ev('visita', 'es', 'm', 'directo'); e.ev('visita', 'pt', 'm', 'directo'); e.ev('wa', 'paquetes'); e.ev('wa', 'paquetes'); e.ev('visita', 'es', 'm', 'directo');
  assert.deepStrictEqual(e.stats().slice(1).map((f) => f.slice(1).join('|')), ['visita|es|m|directo|2', 'visita|pt|m|directo|1', 'wa|paquetes|||2']);
});

test('descarta eventos y detalles no permitidos (mayúsculas, espacios, símbolos, largo) sin tocar la hoja', () => {
  const e = entorno();
  assert.strictEqual(e.ev('otro').error, 'evento');
  assert.strictEqual(e.ev('visita', 'ES').error, 'evento');
  assert.strictEqual(e.ev('visita', 'a b').error, 'evento');
  assert.strictEqual(e.ev('visita', '=HYPERLINK("x")').error, 'evento');
  assert.strictEqual(e.ev('visita', 'x'.repeat(21)).error, 'evento');
  assert.strictEqual(e.post({ tipo: 'evento', e: 'visita', a: { x: 1 } }).error, 'evento');
  assert.strictEqual(e.stats(), null);
  assert.strictEqual(e.ev('visita', 'x'.repeat(20)).ok, true); // 20 caracteres sí
});

test('al cambiar el día arranca una fila nueva y la del día anterior no se toca', () => {
  const e = entorno();
  e.ev('visita', 'es', 'd', 'google'); e.ev('visita', 'es', 'd', 'google');
  e.dia(2026, 9, 22);
  e.ev('visita', 'es', 'd', 'google');
  assert.deepStrictEqual(e.stats().slice(1).map((f) => f[0] + ':' + f[5]), ['2026-09-21:2', '2026-09-22:1']);
});

test('tope de combinaciones distintas por día: las nuevas se ignoran y las existentes siguen sumando', () => {
  const e = entorno();
  for (let i = 0; i < 300; i++) e.ev('visita', 'es', 'm', 'src' + i);
  assert.strictEqual(e.stats().length, 301);
  e.ev('visita', 'es', 'm', 'nueva');                 // combinación 301: se ignora
  e.ev('visita', 'es', 'm', 'src7');                  // una existente: suma
  assert.strictEqual(e.stats().length, 301);
  assert.strictEqual(e.stats().find((f) => f[4] === 'src7')[5], 2);
});

test('tope global de eventos por hora', () => {
  const e = entorno();
  for (let i = 0; i < 600; i++) e.ev('wa', 'hero');
  assert.strictEqual(e.stats()[1][5], 600);
  assert.deepStrictEqual(e.ev('wa', 'hero'), { ok: true }); // responde ok pero ya no cuenta
  assert.strictEqual(e.stats()[1][5], 600);
});

test('"dry" valida sin escribir nada', () => {
  const e = entorno();
  assert.deepStrictEqual(e.post({ tipo: 'evento', e: 'copa', a: 'brindis', dry: 1 }), { ok: true });
  assert.strictEqual(e.stats(), null);
  assert.strictEqual(e.post({ tipo: 'evento', e: 'nada', dry: 1 }).error, 'evento');
});

test('las opiniones siguen funcionando y no comparten tope con el contador', () => {
  const e = entorno();
  const op = { acepto: true, t: 9000, web: '', puntaje: 5, experiencia: 'harriague', nombre: 'Ana', origen: 'Salto', opinion: 'Una visita hermosa, la guía explicó toda la historia.', visita: '2026-05', idioma: 'es' };
  for (let i = 0; i < 600; i++) e.ev('wa', 'hero');
  assert.deepStrictEqual(e.post(op), { ok: true });
  assert.strictEqual(e.hojas.Opiniones.filas.length, 2);
});

test('borrarPruebas quita solo las filas con Detalle 1 = "prueba"', () => {
  const e = entorno();
  e.ev('wa', 'prueba'); e.ev('wa', 'hero'); e.ev('copa', 'prueba');
  e.api.borrarPruebas();
  assert.deepStrictEqual(e.stats().slice(1).map((f) => f[1] + ':' + f[2]), ['wa:hero']);
});

test('setup crea Estadisticas y Resumen (con fórmulas sobre Estadisticas) y fija la zona horaria', () => {
  const e = entorno();
  e.api.setup();
  assert.ok(e.hojas.Estadisticas && e.hojas.Resumen);
  assert.strictEqual(e.log.zona, 'America/Montevideo');
  const formulas = e.hojas.Resumen.filas.flat().filter((c) => typeof c === 'string' && c.startsWith('='));
  assert.ok(formulas.length >= 24, 'fórmulas: ' + formulas.length);
  assert.ok(formulas.every((f) => f.includes('Estadisticas!')));
  assert.ok(formulas.every((f) => (f.match(/\(/g) || []).length === (f.match(/\)/g) || []).length), 'paréntesis balanceados');
  assert.ok(formulas.every((f) => (f.match(/"/g) || []).length % 2 === 0), 'comillas balanceadas');
});
