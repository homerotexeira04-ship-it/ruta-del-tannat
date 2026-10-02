// Diseño: ninguna pregunta se corta, se tapa ni obliga a desplazar la pantalla, en cada tamaño probado y en cada estado.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, mostrarPregunta, dormir } = require('./ayudas');

let B;
test.before(async () => { B = await iniciar(); });
test.after(async () => { await B.cerrar(); });

// Mide si algo sobresale: la tarjeta con scroll, elementos fuera de la tarjeta o de la pantalla, texto cortado.
function medir() {
  const prob = [];
  const vw = window.innerWidth, vh = window.innerHeight;
  const tarjeta = document.querySelector('#escenario .tarjeta');
  if (!tarjeta) return ['no hay tarjeta'];
  const r = tarjeta.getBoundingClientRect();
  if (tarjeta.scrollHeight > tarjeta.clientHeight + 1) prob.push('la tarjeta necesita desplazarse (' + tarjeta.scrollHeight + ' > ' + tarjeta.clientHeight + ')');
  if (tarjeta.scrollWidth > tarjeta.clientWidth + 1) prob.push('la tarjeta se desborda a lo ancho');
  const app = document.getElementById('app').getBoundingClientRect();
  if (app.left < -1 || app.top < -1 || app.right > vw + 1 || app.bottom > vh + 1) prob.push('la aplicación se sale de la pantalla');
  for (const el of tarjeta.querySelectorAll('*')) {
    const b = el.getBoundingClientRect();
    if (!b.width || !b.height) continue;
    if (b.bottom > r.bottom + 1 || b.right > r.right + 1 || b.left < r.left - 1 || b.top < r.top - 1) {
      prob.push('sobresale de la tarjeta: ' + el.tagName.toLowerCase() + '.' + (el.className && el.className.baseVal === undefined ? el.className : '') + ' «' + (el.textContent || '').slice(0, 30) + '»');
      break;
    }
    const cs = getComputedStyle(el);
    if ((cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1 && !el.closest('.chip')) { prob.push('texto cortado: «' + (el.textContent || '').slice(0, 30) + '»'); break; }
  }
  // elementos que se pisan: respuestas entre sí y con la zona de la explicación
  const cajas = [...tarjeta.querySelectorAll('.respuesta, .explicacion, .pie-pregunta .boton, .pregunta__texto')].map((e) => e.getBoundingClientRect());
  for (let i = 0; i < cajas.length; i++) for (let j = i + 1; j < cajas.length; j++) {
    const a = cajas[i], b = cajas[j];
    if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) { prob.push('se pisan dos elementos de la pregunta'); i = cajas.length; break; }
  }
  // desafío final: el tablero, el estado y el botón no se pisan, y el contenido del tablero cabe en su casillero
  const tab = tarjeta.querySelector('.desafio__tablero'), pie = tarjeta.querySelector('.desafio__pie');
  if (tab && pie) {
    const t = tab.getBoundingClientRect(), p = pie.getBoundingClientRect();
    if (t.bottom > p.top + 1) prob.push('el tablero del desafío se mete en la fila del estado');
    for (const hijo of tab.querySelectorAll('.lugar, .ficha')) { const b = hijo.getBoundingClientRect(); if (b.bottom > t.bottom + 1 || b.top < t.top - 1) { prob.push('una pieza del desafío sale del tablero'); break; } }
    const cab = tarjeta.querySelector('.desafio__cab').getBoundingClientRect();
    if (cab.bottom > t.top + 1) prob.push('el encabezado del desafío pisa el tablero');
  }
  return prob;
}

const TAMANOS = [[3840, 2160], [1920, 1080], [1366, 768], [1280, 800], [1024, 768]];

for (const [ancho, alto] of TAMANOS) {
  test('las 100 preguntas entran sin desplazarse en ' + ancho + '×' + alto + ' (sin responder, con acierto y con error)', async () => {
    const page = await B.pagina({ ancho, alto });
    const fallos = [];
    const ids = await page.evaluate(() => RE.datos.preguntas.map((q) => q.id));
    for (const id of ids) {
      // la posición de la correcta más desfavorable para la explicación no importa; probamos las cuatro en una muestra
      for (const estado of ['sin', 'bien', 'mal']) {
        await mostrarPregunta(page, id, { pos: (id.charCodeAt(5) + estado.length) % 4 });
        if (estado !== 'sin') {
          await page.evaluate((e) => {
            const P = RE.ui.estado.partida, q = RE.motor.actual(P);
            document.querySelector('.respuesta[data-i="' + (e === 'bien' ? q.correcta : (q.correcta + 1) % 4) + '"]').click();
          }, estado);
        }
        const prob = await page.evaluate(medir);
        if (prob.length) fallos.push(id + ' [' + estado + ']: ' + prob.join('; '));
      }
    }
    await page.cerrarContexto();
    assert.deepEqual(fallos.slice(0, 10), [], fallos.length + ' preguntas con problemas de diseño');
  });
}

test('el contrarreloj no mueve nada: la barra de tiempo entra en la misma pantalla', async () => {
  const page = await B.pagina();
  const fallos = [];
  for (const id of ['sol-001', 'hid-014', 'uru-018']) {
    await mostrarPregunta(page, id, { contrarreloj: true });
    const prob = await page.evaluate(medir);
    if (prob.length) fallos.push(id + ': ' + prob.join('; '));
  }
  await page.cerrarContexto();
  assert.deepEqual(fallos, []);
});

for (const [ancho, alto] of [[3840, 2160], [1920, 1080], [1280, 800]]) {
  test('todas las pantallas entran en ' + ancho + '×' + alto + ' sin desplazarse', async () => {
    const page = await B.pagina({ ancho, alto });
    const fallos = [];
    async function ver(nombre) { await dormir(50); const p = await page.evaluate(medir); if (p.length) fallos.push(nombre + ': ' + p.join('; ')); }
    await page.evaluate(() => { RE.ui.estado.ops.nombre = 'Ana María de los Ángeles'; RE.ui.ir('inicio'); }); await ver('inicio');
    await page.evaluate(() => { RE.ui.estado.ops.contrarreloj = true; RE.ui.ir('inicio'); }); await ver('inicio con contrarreloj');
    await page.evaluate(() => { RE.ui.estado.ops.contrarreloj = false; RE.ui.nuevaPartida(); }); await ver('intro');
    for (let e = 0; e < 5; e++) {
      await page.evaluate((e) => { RE.ui.estado.estIdx = e; RE.ui.ir('intro'); }, e); await ver('intro ' + e);
    }
    await page.evaluate(() => { const P = RE.ui.estado.partida; P.respondida = true; P.i = 4; RE.ui.estado.estIdx = 0; RE.ui.ir('estacion'); }); await ver('estación');
    await page.evaluate(() => RE.ui.ir('desafio')); await ver('desafío');
    await page.evaluate(() => { const d = RE.ui.estado.partida.desafio, m = d.deptos.find((x) => x !== d.items[0].depto); document.querySelector('.lugar[data-id="' + d.items[0].id + '"]').click(); [...document.querySelectorAll('.ficha')].find((f) => f.textContent === m).click(); }); await ver('desafío con un error');
    await page.evaluate(() => { const P = RE.ui.estado.partida; P.desafio.items.forEach((it) => { document.querySelector('.lugar[data-id="' + it.id + '"]').click(); [...document.querySelectorAll('.ficha')].find((f) => f.textContent === it.depto).click(); }); }); await ver('desafío terminado');
    await page.evaluate(() => { RE.ui.ir('desafio'); }); await ver('desafío (otra vez)');
    await page.evaluate(() => {
      const P = RE.ui.estado.partida; P.preguntas.forEach((q, i) => { P.i = i; P.respondida = false; RE.motor.responder(P, i % 3 === 0 ? q.correcta : (q.correcta + 1) % 4, 0); });
      P.desafio.items.forEach((it) => RE.motor.resolverLugar(P, it.id, it.depto));
      RE.ui.finalizar();
    }); await ver('final');
    await page.evaluate(() => RE.ui.ir('repaso')); await ver('repaso');
    await page.evaluate(() => { RE.ui.estado.repasoIdx = RE.ui.estado.partida.falladas.length - 1; RE.ui.ir('repaso'); }); await ver('repaso (último)');
    await page.cerrarContexto();
    assert.deepEqual(fallos, []);
  });
}

test('el pie de página (crédito de la foto y fuentes) entra completo, en una línea, con cada foto', async () => {
  const page = await B.pagina();
  const fallos = [];
  await page.evaluate(() => { RE.ui.estado.ops.nombre = ''; RE.ui.nuevaPartida(); });
  for (const e of ['hidraulica', 'eolica', 'solar', 'biomasa', 'uruguay']) {
    await page.evaluate((e) => RE.ui.tema(e), e);
    const r = await page.evaluate(() => {
      const pie = document.getElementById('pie'), hijos = [...pie.children].filter((c) => c.offsetWidth);
      const caja = pie.getBoundingClientRect();
      return { ancho: Math.round(caja.width), usado: Math.round(hijos.reduce((s, c) => s + c.getBoundingClientRect().width, 0)), cortado: hijos.some((c) => c.scrollWidth > c.clientWidth + 1), alto: Math.round(caja.height), derecha: Math.round(Math.max(...hijos.map((c) => c.getBoundingClientRect().right))), pantalla: window.innerWidth };
    });
    if (r.cortado || r.derecha > r.pantalla || r.alto > 40) fallos.push(e + ': ' + JSON.stringify(r));
  }
  await page.cerrarContexto();
  assert.deepEqual(fallos, []);
});

// La D6510 puede errar hasta 1 cm al detectar el toque y cada punto mide 0,744 mm: los botones de juego tienen que medir al menos 4 cm (54 px).
test('todos los botones y fichas tienen al menos 4 cm de lado en la pantalla de 65" (excepto el enlace del pie)', async () => {
  const page = await B.pagina();
  const chicos = [];
  async function ver(nombre) {
    await dormir(60);
    const r = await page.evaluate(() => [...document.querySelectorAll('button, [role=switch]')].filter((b) => b.offsetWidth && !b.closest('.pie') && !b.disabled).map((b) => { const q = b.getBoundingClientRect(); return { t: (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 28), lado: Math.round(Math.min(q.width, q.height)) }; }).filter((x) => x.lado < 54));
    r.forEach((x) => chicos.push(nombre + ': «' + x.t + '» mide ' + x.lado + ' px (' + (x.lado * 0.744 / 10).toFixed(1) + ' cm)'));
  }
  await page.evaluate(() => { RE.ui.estado.ops.nombre = 'Ana'; RE.ui.estado.ops.contrarreloj = true; RE.ui.ir('inicio'); }); await ver('inicio');
  await page.evaluate(() => { RE.ui.estado.ops.contrarreloj = false; RE.ui.nuevaPartida(); }); await ver('intro');
  await mostrarPregunta(page, 'hid-001', {}); await ver('pregunta');
  await page.evaluate(() => document.querySelector('.respuesta[data-i="0"]').click()); await ver('pregunta respondida');
  await page.evaluate(() => { const P = RE.ui.estado.partida; P.i = 4; P.respondida = true; RE.ui.ir('estacion'); }); await ver('estación');
  await page.evaluate(() => RE.ui.ir('desafio')); await ver('desafío');
  await page.evaluate(() => {
    const P = RE.ui.estado.partida; P.preguntas.forEach((q, i) => { P.i = i; P.respondida = false; RE.motor.responder(P, (q.correcta + 1) % 4, 0); });
    P.desafio.items.forEach((it) => RE.motor.resolverLugar(P, it.id, it.depto)); RE.ui.finalizar();
  }); await ver('final');
  await page.evaluate(() => { RE.ui.estado.repasoIdx = 0; RE.ui.ir('repaso'); }); await ver('repaso');
  await page.evaluate(() => RE.ui.abrirCreditos()); await ver('créditos'); await page.keyboard.press('Escape');
  await page.evaluate(() => RE.kiosco.abrirAdmin()); await ver('PIN'); await page.keyboard.press('Escape');
  await page.evaluate(() => RE.ui.teclado.abrir({ valor: '', alAceptar() {} })); await ver('teclado en pantalla');
  await page.cerrarContexto();
  assert.deepEqual([...new Set(chicos)], []);
  // el enlace del pie es secundario pero no puede ser diminuto: al menos 2,5 cm
  const page2 = await B.pagina();
  const lado = await page2.evaluate(() => { const q = document.querySelector('.pie button').getBoundingClientRect(); return Math.min(q.width, q.height); });
  await page2.cerrarContexto();
  assert.ok(lado * 0.744 >= 25, 'el enlace del pie mide ' + (lado * 0.744 / 10).toFixed(1) + ' cm');
});
