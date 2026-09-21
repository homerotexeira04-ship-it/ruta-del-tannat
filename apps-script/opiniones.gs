/**
 * Opiniones de visitantes y contador de uso de La Ruta del Tannat.
 * Planilla de Google + Apps Script (aplicación web). Pasos de instalación: README.md de esta carpeta.
 *
 *   POST  → guarda la opinión con Estado "pendiente" (nadie la ve hasta que el equipo la publique)
 *   POST  con {"tipo":"evento"} → suma 1 al contador diario anónimo de la hoja "Estadisticas" (sin cookies, sin IP, sin identificadores)
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

// Contador de uso
const HOJA_STATS = 'Estadisticas';
const ENC_STATS = ['Fecha', 'Evento', 'Detalle 1', 'Detalle 2', 'Detalle 3', 'Cantidad'];
const EVENTOS = ['visita', 'wa', 'reserva', 'itinerario', 'copa'];
const ZONA = 'America/Montevideo';
const MAX_EVENTOS_POR_HORA = 600; // ponytail: tope global contra inundaciones y contra la cuota diaria de Apps Script; pasado ese número se ignoran eventos hasta la hora siguiente
const MAX_FILAS_POR_DIA = 300;    // combinaciones distintas por día: evita que alguien llene la hoja con valores inventados

/** Ejecutar una sola vez desde el editor (y de nuevo si cambia este archivo): crea las hojas "Opiniones", "Estadisticas" y "Resumen". */
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
  ss.setSpreadsheetTimeZone(ZONA); // que "hoy" del Resumen sea el día de Uruguay
  hojaEstadisticas();
  armarResumen(ss);
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return salida({ ok: false, error: 'formato' }); }
  if (d.tipo === 'evento') return contar(d);
  // Bots: el campo "web" está oculto para las personas y nadie completa el formulario en menos de 5 s.
  // Se responde "ok" igual para no darles pistas.
  if (d.web || !(d.t >= 5000)) return salida({ ok: true });
  const r = validar(d);
  if (r.error) return salida({ ok: false, error: r.error });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return salida({ ok: false, error: 'ocupado' });
  try {
    if (!hayCupo('n', MAX_POR_HORA)) return salida({ ok: false, error: 'ocupado' });
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

function hayCupo(prefijo, max) {
  const cache = CacheService.getScriptCache();
  const clave = prefijo + Math.floor(Date.now() / 3600000);
  const n = Number(cache.get(clave) || 0);
  if (n >= max) return false;
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

// ---------------------------------------------------------------------------------------------
// Contador de uso: una fila por día + evento + hasta tres detalles, con su cantidad. Nada personal.
// ---------------------------------------------------------------------------------------------

/** { tipo: 'evento', e: evento, a: detalle 1, b: detalle 2, c: detalle 3 }. Lo que no está en la lista permitida se descarta. */
function contar(d) {
  const permitido = /^[a-z0-9_-]{0,20}$/;
  const det = [d.a, d.b, d.c].map(function (v) { return v == null ? '' : String(v); });
  if (EVENTOS.indexOf(d.e) < 0 || !det.every(function (v) { return permitido.test(v); })) return salida({ ok: false, error: 'evento' });
  if (d.dry) return salida({ ok: true }); // solo valida (para probar sin escribir)
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return salida({ ok: true }); // ocupado: se pierde este conteo, no vale la pena reintentar
  try {
    if (hayCupo('e', MAX_EVENTOS_POR_HORA)) sumar(d.e, det);
  } finally { lock.releaseLock(); }
  return salida({ ok: true });
}

function sumar(evento, det) {
  const h = hojaEstadisticas();
  const hoy = Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd');
  const ultima = h.getLastRow(), desde = Math.max(2, ultima - 399);
  const filas = ultima >= desde ? h.getRange(desde, 1, ultima - desde + 1, ENC_STATS.length).getDisplayValues() : [];
  let deHoy = 0;
  // las filas de hoy están al final (solo se agregan filas nuevas al pie): se mira de abajo hacia arriba y se corta en la primera de otro día
  for (let i = filas.length - 1; i >= 0 && filas[i][0] === hoy; i--) {
    deHoy++;
    if (filas[i][1] === evento && filas[i][2] === det[0] && filas[i][3] === det[1] && filas[i][4] === det[2]) {
      h.getRange(desde + i, ENC_STATS.length).setValue(Number(filas[i][5]) + 1);
      return;
    }
  }
  if (deHoy < MAX_FILAS_POR_DIA) h.appendRow([hoy, evento, det[0], det[1], det[2], 1]);
}

function hojaEstadisticas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let h = ss.getSheetByName(HOJA_STATS);
  if (!h) {
    h = ss.insertSheet(HOJA_STATS);
    h.getRange(1, 1, 1, ENC_STATS.length).setValues([ENC_STATS]).setFontWeight('bold');
    h.setFrozenRows(1);
    h.getRange('A:A').setNumberFormat('yyyy-mm-dd'); // la fecha se lee tal cual se escribe: no ordenar esta hoja (las filas de hoy tienen que quedar al final)
    h.getRange('B:E').setNumberFormat('@');
  }
  return h;
}

/** Hoja "Resumen": totales por período y desgloses de los últimos 30 días, con fórmulas sobre "Estadisticas". Se regenera con setup(). */
function armarResumen(ss) {
  const r = ss.getSheetByName('Resumen') || ss.insertSheet('Resumen');
  r.clear();
  const sep = separador(r);
  const E = 'Estadisticas!';
  // SUMIFS(suma; criterio_rango; criterio; …): cada par [rango, criterio] se agrega con el separador de la planilla
  const sumifs = function (pares) { const a = [E + '$F:$F']; pares.forEach(function (p) { a.push(p[0], p[1]); }); return 'SUMIFS(' + a.join(sep) + ')'; };
  const par = function (col, valor) { return [E + '$' + col + ':$' + col, '"' + valor + '"']; };
  const fecha = function (dias) { return dias == null ? [] : [[E + '$A:$A', '">="&TODAY()-' + dias]]; };
  const suma = function (evento, d1, dias) { return '=' + sumifs([par('B', evento)].concat(d1 ? [par('C', d1)] : [], fecha(dias))); };
  const metricas = [
    ['Visitas (≥ 3 s)', 'visita', ''], ['Toques a WhatsApp', 'wa', ''], ['Reservas iniciadas', 'reserva', 'abrir'],
    ['Reservas enviadas a WhatsApp', 'reserva', 'enviar'], ['Itinerario impreso o PDF', 'itinerario', ''], ['Brindis en La Copa', 'copa', '']
  ];
  const periodos = [['Hoy', 0], ['Últimos 7 días', 6], ['Últimos 30 días', 29], ['Total', null]];
  r.getRange('A1').setValue('Uso del sitio · contador anónimo (sin cookies ni datos personales)').setFontWeight('bold').setFontSize(13);
  r.getRange('A2').setValue('Se actualiza solo. Una "visita" es una página abierta que se queda al menos 3 segundos; no cuenta robots ni a quienes activaron "No rastrear". Las cifras son orientativas.');
  r.getRange(4, 1, 1, metricas.length + 1).setValues([['Período'].concat(metricas.map(function (m) { return m[0]; }))]).setFontWeight('bold');
  periodos.forEach(function (p, i) {
    r.getRange(5 + i, 1).setValue(p[0]);
    r.getRange(5 + i, 2, 1, metricas.length).setFormulas([metricas.map(function (m) { return suma(m[1], m[2], p[1]); })]);
  });
  // desgloses de los últimos 30 días: columna de detalle (C = idioma, D = dispositivo, E = origen)
  const tabla = function (fila, col, titulo, ev, columna, items) {
    r.getRange(fila, col).setValue(titulo).setFontWeight('bold');
    items.forEach(function (it, i) {
      r.getRange(fila + 1 + i, col).setValue(it[1]);
      r.getRange(fila + 1 + i, col + 1).setFormula('=' + sumifs([par('B', ev), par(columna, it[0])].concat(fecha(29))));
    });
  };
  tabla(11, 1, 'Visitas por idioma (30 días)', 'visita', 'C', [['es', 'Español'], ['pt', 'Português'], ['en', 'English']]);
  tabla(11, 4, 'Visitas por dispositivo (30 días)', 'visita', 'D', [['m', 'Celular'], ['t', 'Tablet'], ['d', 'Computadora']]);
  tabla(17, 1, 'Visitas por origen (30 días)', 'visita', 'E', [['directo', 'Directo (o WhatsApp)'], ['google', 'Google'], ['buscador', 'Otros buscadores'], ['social', 'Redes sociales'], ['otro', 'Otro sitio']]);
  tabla(17, 4, 'Toques a WhatsApp por lugar (30 días)', 'wa', 'C', [['paquetes', 'Paquetes (cotización)'], ['testimonios', 'Opiniones'], ['fab', 'Botón flotante']]);
  // lo que no cae en las categorías de arriba (otros lugares, o orígenes con ?src=) sale por diferencia con el total
  const total30 = function (ev) { return sumifs([par('B', ev)].concat(fecha(29))); };
  r.getRange(23, 1).setValue('Con ?src= (carteles, QR, etc.)'); r.getRange(23, 2).setFormula('=' + total30('visita') + '-SUM(B18:B22)');
  r.getRange(21, 4).setValue('Otros lugares'); r.getRange(21, 5).setFormula('=' + total30('wa') + '-SUM(E18:E20)');
  r.getRange('A25').setValue('El detalle día por día está en la hoja "Estadisticas". Para medir un cartel con QR, agregá "?src=nombre" al enlace: aparece en la columna "Detalle 3" de las visitas.');
  r.setColumnWidth(1, 250); r.setColumnWidth(4, 250);
  r.setColumnWidths(2, 1, 150); r.setColumnWidths(3, 1, 150); r.setColumnWidths(5, 3, 170);
}

/** setFormula() lee las fórmulas con el separador de argumentos de la configuración regional de la planilla ("," en inglés, ";" en es_ES): se detecta probando. */
function separador(hoja) {
  const c = hoja.getRange('Z1');
  c.setFormula('=SUM(1,2)'); SpreadsheetApp.flush();
  const coma = c.getValue() === 3; // con separador ";" la coma es decimal y da 1,2
  c.clear();
  return coma ? ',' : ';';
}

/** Opcional: borra de "Estadisticas" las filas de prueba (Detalle 1 = "prueba"). */
function borrarPruebas() {
  const h = hojaEstadisticas();
  for (let i = h.getLastRow(); i >= 2; i--) if (String(h.getRange(i, 3).getValue()) === 'prueba') h.deleteRow(i);
}
