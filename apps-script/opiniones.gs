/**
 * Opiniones de visitantes de La Ruta del Tannat.
 * Planilla de Google + Apps Script (aplicación web). Pasos de instalación: README.md de esta carpeta.
 *
 *   POST  → guarda la opinión con Estado "pendiente" (nadie la ve hasta que el equipo la publique)
 *   GET   → devuelve solo las filas con Estado "publicada"
 */
const HOJA = 'Opiniones';
const ENCABEZADOS = ['Fecha', 'Estado', 'Nombre', 'Origen', 'Experiencia', 'Puntaje', 'Opinión', 'Visita', 'Idioma'];
const EXPERIENCIAS = {
  circuito: 'Todo el circuito',
  harriague: 'Espacio Cultural Bodega Harriague',
  saltochico: 'Bodega Salto Chico',
  bertolini: 'Bodega Bertolini & Broglio',
  morimaglio: 'Mori Maglio Wines',
  termas: 'Termas',
  otra: 'Otra'
};
const MAX_POR_HORA = 30;   // tope global de envíos por hora contra inundaciones de spam
const MAX_PUBLICADAS = 30; // cuántas opiniones muestra el sitio (las más nuevas)

/** Ejecutar una sola vez desde el editor: crea la hoja, los encabezados y el menú de Estado. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName(HOJA) || ss.insertSheet(HOJA);
  hoja.getRange(1, 1, 1, ENCABEZADOS.length).setValues([ENCABEZADOS]).setFontWeight('bold');
  hoja.setFrozenRows(1);
  // texto plano: la planilla no convierte "2026-05" en fecha ni interpreta nada como fórmula
  hoja.getRange('C:E').setNumberFormat('@');
  hoja.getRange('G:I').setNumberFormat('@');
  hoja.getRange('B2:B').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['pendiente', 'publicada', 'rechazada'], true).build());
  hoja.setColumnWidth(7, 480);
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return salida({ ok: false, error: 'formato' }); }
  // Bots: el campo "web" está oculto para las personas y nadie completa el formulario en menos de 5 s.
  // Se responde "ok" igual para no darles pistas.
  if (d.web || !(d.t >= 5000)) return salida({ ok: true });
  const r = validar(d);
  if (r.error) return salida({ ok: false, error: r.error });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return salida({ ok: false, error: 'ocupado' });
  try {
    if (!hayCupo()) return salida({ ok: false, error: 'ocupado' });
    hoja().appendRow(r.fila);
  } finally { lock.releaseLock(); }
  avisar(r.fila);
  return salida({ ok: true });
}

function doGet() {
  const cache = CacheService.getScriptCache();
  let json = cache.get('pub');
  if (!json) {
    const zona = Session.getScriptTimeZone();
    const claves = {};
    Object.keys(EXPERIENCIAS).forEach(function (k) { claves[EXPERIENCIAS[k]] = k; });
    const lista = hoja().getDataRange().getValues().slice(1)
      .filter(function (f) { return String(f[1]).trim().toLowerCase() === 'publicada'; })
      .reverse() // las filas se agregan en orden cronológico: la última es la más nueva
      .slice(0, MAX_PUBLICADAS)
      .map(function (f) {
        return {
          nombre: String(f[2]), origen: String(f[3]), experiencia: claves[f[4]] || 'otra',
          puntaje: Number(f[5]), opinion: String(f[6]),
          visita: f[7] instanceof Date ? Utilities.formatDate(f[7], zona, 'yyyy-MM') : String(f[7])
        };
      });
    json = JSON.stringify({ ok: true, opiniones: lista });
    cache.put('pub', json, 300);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/** Cuando el equipo cambia un Estado en la planilla, la lista pública se actualiza al instante. */
function onEdit() { CacheService.getScriptCache().remove('pub'); }

function validar(d) {
  const puntaje = Number(d.puntaje);
  const opinion = limpiar(d.opinion, 500);
  if (d.acepto !== true) return { error: 'consentimiento' };
  if (!(puntaje >= 1 && puntaje <= 5 && puntaje % 1 === 0)) return { error: 'puntaje' };
  if (opinion.length < 20) return { error: 'opinion' };
  if (!EXPERIENCIAS.hasOwnProperty(d.experiencia)) return { error: 'experiencia' };
  return {
    fila: [
      new Date(), 'pendiente', limpiar(d.nombre, 40) || 'Anónimo', limpiar(d.origen, 40),
      EXPERIENCIAS[d.experiencia], puntaje, opinion,
      /^\d{4}-(0[1-9]|1[0-2])$/.test(d.visita) ? d.visita : '',
      ['es', 'pt', 'en'].indexOf(d.idioma) >= 0 ? d.idioma : 'es'
    ]
  };
}

/** Texto en una línea, con largo máximo y sin "=", "+", "-" o "@" al comienzo (la planilla podría tomarlo por una fórmula). */
function limpiar(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().replace(/^[=+\-@]+\s*/, '').slice(0, max);
}

function hayCupo() {
  const cache = CacheService.getScriptCache();
  const clave = 'n' + Math.floor(Date.now() / 3600000);
  const n = Number(cache.get(clave) || 0);
  if (n >= MAX_POR_HORA) return false;
  cache.put(clave, String(n + 1), 3600);
  return true;
}

function avisar(f) {
  try {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Nueva opinión pendiente · La Ruta del Tannat',
      f[2] + ' (' + f[5] + '/5, ' + f[4] + '):\n\n' + f[6] + '\n\nPara publicarla, cambiá su Estado a "publicada": ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  } catch (err) { /* el aviso por mail es opcional */ }
}

function hoja() { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA); }

function salida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
