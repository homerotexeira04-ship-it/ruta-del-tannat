// Linter del banco de preguntas de "Ruta de la Energía Uruguay". Sin dependencias. Uso: node scripts/check-banco.js [--detalle]
// Valida estructura, fuentes, y los defectos que hacían trampa posible: la correcta más larga que las demás,
// opciones absurdas, números de órdenes de magnitud distintos, preguntas que regalan la respuesta de otra, etc.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const ARCHIVOS_DATOS = ['base.js', 'fuentes.js', 'p-hidraulica.js', 'p-eolica.js', 'p-solar.js', 'p-biomasa.js', 'p-uruguay.js'];

function cargarDatos() {
  const ctx = vm.createContext({});
  for (const f of ARCHIVOS_DATOS) vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', 'datos', f), 'utf8'), ctx, { filename: f });
  return ctx.RE.datos;
}

const palabras = (s) => String(s).trim().split(/\s+/).filter(Boolean);
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const STOP = new Set('entre sobre desde hasta porque cuando donde cuanto cuanta cuales como para esta este estos estas esas esos otra otros otras cada mucho mucha muchos todas todos tiene tienen tener hacer hacen sirve sirven puede pueden parte partes sido ellas ellos ahora antes despues segun misma mismo mismas mismos solo solas tambien siempre mas menos nunca unos unas'.split(' '));
const tokens = (s) => (norm(s).match(/[a-z0-9]+/g) || []).filter((t) => t.length >= 5 && !STOP.has(t));

// "1.500" -> 1500, "99,9" -> 99.9
function numeros(texto) {
  const out = [];
  for (const m of String(texto).matchAll(/\d[\d.,]*/g)) {
    let s = m[0].replace(/[.,]+$/, '');
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    s = s.replace(',', '.');
    const n = parseFloat(s);
    if (isFinite(n)) out.push(n);
  }
  return out;
}

function validar(D, opciones) {
  const errores = [], avisos = [];
  const err = (m) => errores.push(m), avi = (m) => avisos.push(m);
  const claves = D.estaciones.map((e) => e.clave);
  const prefijo = { hidraulica: 'hid', eolica: 'eol', solar: 'sol', biomasa: 'bio', uruguay: 'uru' };
  const ids = new Set(), usadas = new Set();
  const porId = new Map(D.preguntas.map((q) => [q.id, q]));

  // ---------- estaciones y fuentes ----------
  if (claves.length !== 5) err('tienen que ser 5 estaciones');
  for (const e of D.estaciones) if (!e.nombre || !e.intro || e.intro.length < 40) err('estación sin nombre o introducción: ' + e.clave);
  for (const [id, f] of Object.entries(D.fuentes)) {
    if (!f.nombre || !/^https?:\/\//.test(f.url || '')) err('fuente sin nombre o sin URL válida: ' + id);
    if (!['leida', 'busqueda'].includes(f.verificacion)) err('fuente con verificacion inválida: ' + id);
  }

  // ---------- preguntas ----------
  for (const q of D.preguntas) {
    const w = q.id;
    if (!/^(hid|eol|sol|bio|uru)-\d{3}$/.test(w)) err('id inválido: ' + w);
    if (ids.has(w)) err('id repetido: ' + w); ids.add(w);
    if (!claves.includes(q.estacion)) err(w + ': estación inexistente');
    else if (prefijo[q.estacion] !== w.slice(0, 3)) err(w + ': el prefijo del id no coincide con la estación');
    if (![1, 2, 3].includes(q.dificultad)) err(w + ': dificultad debe ser 1, 2 o 3');
    if (!q.tipo) err(w + ': falta el tipo');
    if (!Array.isArray(q.opciones) || q.opciones.length !== 4) { err(w + ': tienen que ser 4 opciones'); continue; }
    if (!q.opciones.every((o) => typeof o === 'string' && o.trim())) err(w + ': hay una opción vacía');
    if (new Set(q.opciones.map((o) => norm(o))).size !== 4) err(w + ': opciones repetidas');
    if (!(q.correcta >= 0 && q.correcta <= 3)) err(w + ': correcta fuera de rango');

    const p = q.pregunta || '';
    const abre = (p.match(/¿/g) || []).length, cierra = (p.match(/\?/g) || []).length;
    if (abre !== cierra) err(w + ': signos de pregunta desbalanceados («¿» y «?»)');
    if (!(cierra > 0 || /[….]$/.test(p))) err(w + ': el enunciado debe ser una pregunta o terminar en «…»');
    if (cierra > 0 && !p.trim().endsWith('?')) avi(w + ': el enunciado no termina en «?»');
    if (/\s{2,}| ,|\.\./.test(p + ' ' + q.explicacion + ' ' + q.opciones.join(' '))) err(w + ': espacios dobles o puntuación rara');

    const ex = q.explicacion || '';
    if (!ex || !/[.!]$/.test(ex.trim())) err(w + ': la explicación debe terminar en punto');
    if (palabras(ex).length > 30) err(w + ': explicación demasiado larga (' + palabras(ex).length + ' palabras)');
    else if (palabras(ex).length > 24) avi(w + ': explicación larga (' + palabras(ex).length + ' palabras)');

    if (!Array.isArray(q.fuente) || q.fuente.length < 1 || q.fuente.length > 2) err(w + ': tiene que citar 1 o 2 fuentes');
    else for (const s of q.fuente) { if (!D.fuentes[s]) err(w + ': fuente inexistente «' + s + '»'); usadas.add(s); }
    if (q.vigencia && !/^\d{4}$/.test(q.vigencia)) err(w + ': vigencia inválida');
    for (const o of q.noJuntarCon || []) { if (!porId.has(o)) err(w + ': noJuntarCon cita un id inexistente ' + o); if (o === w) err(w + ': noJuntarCon se cita a sí misma'); }

    // lectura
    const carga = palabras(p).length + q.opciones.reduce((a, o) => a + palabras(o).length, 0);
    if (carga > 70) err(w + ': demasiado para leer (' + carga + ' palabras entre enunciado y opciones)');
    else if (carga > 58) avi(w + ': carga de lectura alta (' + carga + ' palabras)');

    // largo de la correcta frente a las demás
    const L = q.opciones.map((o) => o.length), c = L[q.correcta];
    const otras = L.filter((_, i) => i !== q.correcta), media = otras.reduce((a, b) => a + b, 0) / 3;
    const ratio = c / media;
    if (media >= 8) {
      if (ratio > 1.55 || ratio < 0.45) err(w + ': la correcta mide ' + ratio.toFixed(2) + '× el promedio de las otras: se adivina por el largo');
      else if (ratio > 1.35 || ratio < 0.6) avi(w + ': la correcta mide ' + ratio.toFixed(2) + '× el promedio de las otras');
    }

    // opciones numéricas de órdenes de magnitud muy distintos
    if (q.opciones.every((o) => numeros(o).length > 0)) {
      const n = q.opciones.map((o) => numeros(o)[0]).filter((x) => x > 0);
      if (n.length === 4) { const r = Math.max(...n) / Math.min(...n); if (r > 400) err(w + ': las opciones numéricas difieren ' + Math.round(r) + ' veces entre sí'); else if (r > 40) avi(w + ': las opciones numéricas difieren ' + Math.round(r) + ' veces entre sí (se resuelve estimando)'); }
    }
    // palabras absolutas o disparatadas en las incorrectas
    const abs = /\b(ninguno|ninguna|nunca|jam[aá]s|huracanes|1 km\/h|para siempre)\b/i;
    q.opciones.forEach((o, i) => { if (i !== q.correcta && abs.test(o) && !abs.test(q.opciones[q.correcta])) avi(w + ': opción incorrecta con palabra absoluta o absurda: «' + o + '»'); });
  }

  // ---------- reparto por estación ----------
  const stats = { porEstacion: {}, correctaMasLarga: 0, total: D.preguntas.length };
  for (const k of claves) {
    const qs = D.preguntas.filter((q) => q.estacion === k);
    if (qs.length !== 20) err(k + ': tienen que ser 20 preguntas y hay ' + qs.length);
    const d = [1, 2, 3].map((n) => qs.filter((q) => q.dificultad === n).length);
    if (d[0] < 4 || d[1] < 6 || d[2] < 4) err(k + ': reparto de dificultad flojo (fáciles ' + d[0] + ', medias ' + d[1] + ', difíciles ' + d[2] + '; mínimo 4/6/4)');
    let largas = 0;
    for (const q of qs) { const L = q.opciones.map((o) => o.length), mx = Math.max(...L); if (L[q.correcta] === mx && L.filter((x) => x === mx).length === 1) largas++; }
    stats.correctaMasLarga += largas;
    stats.porEstacion[k] = { n: qs.length, dificultad: d, correctaMasLarga: largas };
    if (largas / qs.length > 0.4) err(k + ': la correcta es la más larga en ' + largas + ' de ' + qs.length + ' (máximo 8 de 20)');
  }
  if (stats.correctaMasLarga / stats.total > 0.35) err('en todo el banco la correcta es la más larga en ' + stats.correctaMasLarga + ' de ' + stats.total + ' (máximo 35)');

  // ---------- trampas por largo: qué acierta un jugador que no lee la pregunta ----------
  const esperado = (elegir) => {
    let acum = 0;
    for (const q of D.preguntas) { const L = q.opciones.map((o) => o.length), t = elegir(L); const empatadas = L.map((x, i) => (x === t ? i : -1)).filter((i) => i >= 0); if (empatadas.includes(q.correcta)) acum += 1 / empatadas.length; }
    return acum / D.preguntas.length;
  };
  stats.botMasLarga = esperado((L) => Math.max(...L));
  stats.botMasCorta = esperado((L) => Math.min(...L));
  // "elegir siempre la opción que ocupa el lugar r por largo" (1 = la más larga … 4 = la más corta)
  stats.botPorRango = [0, 1, 2, 3].map((r) => esperado((L) => [...L].sort((a, b) => b - a)[r]));
  stats.botPorRango.forEach((p, r) => { if (p > 0.33) err('un jugador que elige siempre la opción n.º ' + (r + 1) + ' por largo acierta ' + Math.round(100 * p) + ' % (máximo 33 %)'); });
  if (stats.botMasLarga > 0.33) err('un jugador que elige siempre la opción MÁS LARGA acierta ' + Math.round(100 * stats.botMasLarga) + ' % (máximo 33 %)');
  if (stats.botMasCorta > 0.33) err('un jugador que elige siempre la opción MÁS CORTA acierta ' + Math.round(100 * stats.botMasCorta) + ' % (máximo 33 %)');

  // ---------- fugas entre preguntas ----------
  const df = {};
  for (const q of D.preguntas) for (const t of new Set(tokens([q.pregunta, q.opciones.join(' '), q.explicacion].join(' ')))) df[t] = (df[t] || 0) + 1;
  const pares = [];
  for (const A of D.preguntas) for (const B of D.preguntas) {
    if (A === B) continue;
    if ((A.noJuntarCon || []).includes(B.id) || (B.noJuntarCon || []).includes(A.id)) continue;
    const mismaEst = A.estacion === B.estacion;
    const rarasB = tokens(B.opciones[B.correcta]).filter((t) => (df[t] || 0) <= (mismaEst ? 4 : 2) && !tokens(B.pregunta).includes(t));
    if (!rarasB.length) continue;
    const vistaA = new Set(tokens(A.pregunta + ' ' + A.explicacion));
    const hit = rarasB.filter((t) => vistaA.has(t));
    if (hit.length) pares.push({ A: A.id, B: B.id, hit });
  }
  const fugas = pares.map((p) => 'posible fuga: «' + p.A + '» menciona ' + p.hit.join(', ') + ', clave de la respuesta de «' + p.B + '» (si es real, agregá noJuntarCon)');

  // ---------- fuentes ----------
  const noUsadas = Object.keys(D.fuentes).filter((s) => !usadas.has(s) && !(D.lugares || []).some((l) => l.fuente === s) && !(D.matriz.bases || []).some((b) => b.fuente === s));
  for (const s of noUsadas) avi('fuente sin usar: ' + s);

  // ---------- lugares y matriz ----------
  const dep = new Set(), idsL = new Set();
  for (const l of D.lugares) {
    if (idsL.has(l.id)) err('lugar repetido: ' + l.id); idsL.add(l.id); dep.add(l.depto);
    if (!D.fuentes[l.fuente]) err('lugar ' + l.id + ': fuente inexistente');
    if (!l.lugar || !l.depto) err('lugar incompleto: ' + l.id);
  }
  if (D.lugares.length < 8 || dep.size < 8) err('el desafío final necesita al menos 8 lugares con departamentos distintos');
  for (const b of D.matriz.bases) {
    const suma = b.partes.reduce((a, x) => a + x.pct, 0);
    if (suma !== 100) err('matriz «' + b.clave + '»: los porcentajes suman ' + suma);
    if (!D.fuentes[b.fuente]) err('matriz «' + b.clave + '»: fuente inexistente');
  }
  const verif = { leida: 0, busqueda: 0 };
  for (const s of usadas) verif[D.fuentes[s].verificacion]++;
  const sinLeer = D.preguntas.filter((q) => (q.fuente || []).every((s) => D.fuentes[s] && D.fuentes[s].verificacion === 'busqueda')).map((q) => q.id);
  stats.fuentes = { distintas: Object.keys(D.fuentes).length, usadas: usadas.size, leidas: verif.leida, soloBusqueda: verif.busqueda, preguntasSoloConFuenteDeBusqueda: sinLeer };
  stats.fugasPosibles = pares.length;
  return { errores, avisos, fugas, stats };
}

module.exports = { cargarDatos, validar, ARCHIVOS_DATOS };

if (require.main === module) {
  const D = cargarDatos();
  const { errores, avisos, fugas, stats } = validar(D);
  const detalle = process.argv.includes('--detalle');
  console.log('Banco: ' + D.preguntas.length + ' preguntas · ' + Object.keys(D.fuentes).length + ' fuentes · ' + D.lugares.length + ' lugares del desafío');
  for (const [k, v] of Object.entries(stats.porEstacion)) console.log('  ' + k.padEnd(11) + 'dificultad fácil/media/difícil ' + v.dificultad.join('/') + ' · correcta más larga en ' + v.correctaMasLarga + '/' + v.n);
  console.log('  correcta estrictamente más larga en todo el banco: ' + stats.correctaMasLarga + '/' + stats.total + ' (' + Math.round((100 * stats.correctaMasLarga) / stats.total) + ' %; azar = 25 %)');
  console.log('  un jugador que elige siempre la opción MÁS LARGA acierta ' + Math.round(100 * stats.botMasLarga) + ' % y siempre la MÁS CORTA ' + Math.round(100 * stats.botMasCorta) + ' % (azar = 25 %; en el juego original la más larga acertaba 79 %)');
  console.log('  elegir siempre la opción n.º 1/2/3/4 por largo acierta ' + stats.botPorRango.map((p) => Math.round(100 * p) + ' %').join(' / '));
  console.log('  fuentes usadas: ' + stats.fuentes.usadas + ' (leídas ' + stats.fuentes.leidas + ', solo por búsqueda ' + stats.fuentes.soloBusqueda + ') · preguntas cuya única base es una fuente no abierta: ' + stats.fuentes.preguntasSoloConFuenteDeBusqueda.length + (detalle ? ' → ' + stats.fuentes.preguntasSoloConFuenteDeBusqueda.join(', ') : ''));
  if (avisos.length) { console.log('\nAvisos (' + avisos.length + '):'); for (const a of avisos) console.log('  ~ ' + a); }
  console.log('\nPosibles fugas entre preguntas (heurística, casi todas son coincidencias de vocabulario): ' + fugas.length + (process.argv.includes('--fugas') ? '' : ' · mostralas con --fugas'));
  if (process.argv.includes('--fugas')) for (const f of fugas) console.log('  ~ ' + f);
  if (errores.length) { console.log('\nERRORES (' + errores.length + '):'); for (const e of errores) console.log('  ✗ ' + e); process.exit(1); }
  console.log('\nBanco en orden' + (avisos.length ? ' (con ' + avisos.length + ' avisos para revisar)' : ''));
}
