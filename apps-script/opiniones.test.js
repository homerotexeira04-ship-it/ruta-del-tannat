// Prueba de opiniones.gs con un Google Sheets / Apps Script simulado. Uso: node --test apps-script/opiniones.test.js
const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function entorno() {
  const filas = [['Fecha', 'Estado', 'Nombre', 'Origen', 'Experiencia', 'Puntaje', 'Opinión', 'Visita', 'Idioma']];
  const cache = new Map(), mails = [];
  const ctx = {
    console, Date, Number, String, JSON, Object, Math,
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getUrl: () => 'https://planilla', getSheetByName: () => ({ appendRow: (f) => filas.push(f), getDataRange: () => ({ getValues: () => filas.map((f) => f.slice()) }) }) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) || null, put: (k, v) => cache.set(k, v), remove: (k) => cache.delete(k) }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ t, setMimeType() { return this; } }) },
    MailApp: { sendEmail: (...a) => mails.push(a) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'equipo@ejemplo.uy' }), getScriptTimeZone: () => 'UTC' },
    Utilities: { formatDate: (d) => d.toISOString().slice(0, 7) }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'opiniones.gs'), 'utf8') + '\n;this.api = { doPost, doGet, onEdit };', ctx);
  const post = (d) => JSON.parse(ctx.api.doPost({ postData: { contents: JSON.stringify(d) } }).t);
  const get = () => JSON.parse(ctx.api.doGet().t);
  return { filas, mails, post, get, cache, api: ctx.api };
}
const ok = { acepto: true, t: 9000, web: '', puntaje: 5, experiencia: 'harriague', nombre: 'Ana', origen: 'Montevideo', opinion: 'Una visita hermosa, la guía explicó toda la historia.', visita: '2026-05', idioma: 'es' };

test('una opinión válida queda pendiente, con aviso por mail, y no se ve en la lista pública', () => {
  const e = entorno();
  assert.deepStrictEqual(e.post(ok), { ok: true });
  assert.strictEqual(e.filas.length, 2);
  assert.strictEqual(e.filas[1][1], 'pendiente');
  assert.strictEqual(e.filas[1][4], 'Espacio Cultural Bodega Harriague');
  assert.strictEqual(e.mails.length, 1);
  assert.deepStrictEqual(e.get().opiniones, []);
});

test('rechaza sin consentimiento, con puntaje inválido, opinión corta o experiencia desconocida', () => {
  const e = entorno();
  assert.strictEqual(e.post({ ...ok, acepto: false }).error, 'consentimiento');
  assert.strictEqual(e.post({ ...ok, puntaje: 6 }).error, 'puntaje');
  assert.strictEqual(e.post({ ...ok, puntaje: 4.5 }).error, 'puntaje');
  assert.strictEqual(e.post({ ...ok, opinion: 'muy linda' }).error, 'opinion');
  assert.strictEqual(e.post({ ...ok, experiencia: 'x' }).error, 'experiencia');
  assert.strictEqual(e.filas.length, 1);
});

test('los bots (campo oculto lleno o envío instantáneo) reciben ok pero no dejan fila', () => {
  const e = entorno();
  assert.deepStrictEqual(e.post({ ...ok, web: 'http://spam' }), { ok: true });
  assert.deepStrictEqual(e.post({ ...ok, t: 800 }), { ok: true });
  assert.strictEqual(e.filas.length, 1);
});

test('quita símbolos de fórmula del comienzo y recorta el largo', () => {
  const e = entorno();
  e.post({ ...ok, nombre: '=HYPERLINK("x")', opinion: '+' + 'a'.repeat(900) });
  assert.strictEqual(e.filas[1][2], 'HYPERLINK("x")');
  assert.strictEqual(e.filas[1][6].length, 500);
});

test('la lista pública solo trae las "publicada", las más nuevas primero, sin el estado', () => {
  const e = entorno();
  e.post({ ...ok, nombre: 'Uno' }); e.post({ ...ok, nombre: 'Dos' }); e.post({ ...ok, nombre: 'Tres' });
  e.filas[1][1] = 'publicada'; e.filas[3][1] = 'Publicada '; e.filas[2][1] = 'rechazada';
  const lista = e.get().opiniones;
  assert.deepStrictEqual(lista.map((o) => o.nombre), ['Tres', 'Uno']);
  assert.strictEqual(lista[0].experiencia, 'harriague');
  assert.strictEqual(lista[0].visita, '2026-05');
  assert.ok(!('estado' in lista[0]));
});

test('tope de envíos por hora', () => {
  const e = entorno();
  for (let i = 0; i < 30; i++) assert.strictEqual(e.post(ok).ok, true);
  assert.strictEqual(e.post(ok).error, 'ocupado');
});
