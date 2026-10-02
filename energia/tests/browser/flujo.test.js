// Funcionamiento: partidas completas tocando la pantalla, teclado, nombres raros, sin sonido, sin guardado, arrastre, inactividad y administración.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, dormir } = require('./ayudas');

let B;
test.before(async () => { B = await iniciar(); });
test.after(async () => { await B.cerrar(); });

const pantalla = (page) => page.evaluate(() => RE.ui.estado.pantalla);
async function clic(page, sel, espera) { await page.waitForSelector(sel, { visible: true, timeout: 5000 }); await page.click(sel); await dormir(espera == null ? 120 : espera); }

// Juega tocando: acierta las preguntas para las que acierta(i, q) es verdadero. Devuelve cuando llega al desafío.
async function jugarHastaDesafio(page, acierta) {
  for (let guardia = 0; guardia < 200; guardia++) {
    const p = await pantalla(page);
    if (p === 'desafio') return;
    if (p === 'intro') await clic(page, '#botonEstacion');
    else if (p === 'estacion') await clic(page, '#botonContinuar');
    else if (p === 'pregunta') {
      const r = await page.evaluate(() => { const P = RE.ui.estado.partida, q = RE.motor.actual(P); return { respondida: P.respondida, correcta: q.correcta, i: P.i }; });
      if (!r.respondida) {
        const ok = acierta ? acierta(r.i) : true;
        await clic(page, '.respuesta[data-i="' + (ok ? r.correcta : (r.correcta + 1) % 4) + '"]');
      }
      await clic(page, '#botonSiguiente');
    } else throw new Error('pantalla inesperada: ' + p);
  }
  throw new Error('no llegó al desafío');
}
async function resolverDesafioTocando(page) {
  const items = await page.evaluate(() => RE.ui.estado.partida.desafio.items.map((i) => ({ id: i.id, depto: i.depto })));
  for (const it of items) {
    await clic(page, '.lugar[data-id="' + it.id + '"]', 60);
    const idx = await page.evaluate((dep) => [...document.querySelectorAll('.ficha')].findIndex((f) => f.textContent === dep), it.depto);
    await (await page.$$('.ficha'))[idx].click(); await dormir(120);
  }
}

test('recorrido corto tocando solo la pantalla: de «Comenzar» hasta el ranking, y «Jugar de nuevo» conserva el nombre', async () => {
  const page = await B.pagina();
  await clic(page, '.modo[data-foco="modo-corto"]');
  await page.evaluate(() => { RE.ui.estado.ops.nombre = 'Lucía'; RE.ui.ir('inicio'); });
  await clic(page, '#botonComenzar');
  await jugarHastaDesafio(page, (i) => i % 3 !== 0);
  await resolverDesafioTocando(page);
  await page.waitForSelector('#tituloFinal', { timeout: 8000 });
  const r = await page.evaluate(() => ({ titulo: document.querySelector('#tituloFinal').textContent, guardado: RE.almacen.ranking.todos().length, aviso: document.querySelector('.aviso-guardado').textContent, nodos: document.querySelectorAll('.ruta__nodo--hecho').length }));
  assert.match(r.titulo, /Lucía/);
  assert.equal(r.guardado, 1);
  assert.match(r.aviso, /quedó anotado/);
  assert.equal(r.nodos, 5);
  await clic(page, '#botonOtraVez');
  assert.equal(await pantalla(page), 'inicio');
  assert.equal(await page.evaluate(() => document.querySelector('#campoNombre').textContent), 'Lucía');
  assert.match(await page.evaluate(() => document.querySelector('.ranking').textContent), /Lucía/);
  assert.deepEqual(page.errores, []);
  await page.cerrarContexto();
});

test('teclado: A–D y 1–4 responden, Enter pasa a la siguiente', async () => {
  const page = await B.pagina();
  await page.evaluate(() => { RE.ui.nuevaPartida(); });
  await page.keyboard.press('Tab');
  await clic(page, '#botonEstacion');
  const antes = await page.evaluate(() => RE.motor.actual(RE.ui.estado.partida).correcta);
  await page.keyboard.press('abcd'[antes]);
  await dormir(150);
  assert.equal(await page.evaluate(() => RE.ui.estado.partida.aciertos), 1);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'botonSiguiente', 'el foco pasa a «Siguiente» para seguir con el teclado');
  await page.keyboard.press('Enter'); await dormir(200);
  const q2 = await page.evaluate(() => RE.motor.actual(RE.ui.estado.partida).correcta);
  await page.keyboard.press(String(((q2 + 1) % 4) + 1)); await dormir(150);
  assert.equal(await page.evaluate(() => RE.ui.estado.partida.aciertos), 1, 'una tecla equivocada no suma');
  assert.equal(await page.evaluate(() => RE.ui.estado.partida.racha), 0);
  await page.cerrarContexto();
});

test('nombres con comillas, etiquetas y símbolos se muestran como texto y no rompen nada', async () => {
  const nombres = ['Ana "la 2°B"', "O'Higgins <b>x</b>", '"><img src=x onerror=window.__hack=1>', '&lt;script&gt;', 'Liceo N°5 — 2.º año ñandú'];
  for (const nombre of nombres) {
    const page = await B.pagina();
    await page.evaluate((n) => { RE.ui.estado.ops.nombre = n; RE.ui.ir('inicio'); }, nombre);
    assert.equal(await page.evaluate(() => document.querySelector('#campoNombre').textContent), nombre, 'el campo muestra el texto tal cual');
    await clic(page, '#botonComenzar');
    const limpio = await page.evaluate(() => RE.ui.estado.partida.nombre);
    assert.ok(limpio.length <= 24 && nombre.startsWith(limpio.slice(0, 5)));
    assert.equal(await page.evaluate(() => document.querySelector('.chip--nombre .chip__valor').textContent), limpio);
    await jugarHastaDesafio(page);
    await resolverDesafioTocando(page);
    await page.waitForSelector('#tituloFinal', { timeout: 8000 });
    const r = await page.evaluate(() => ({ hack: window.__hack, imgs: document.querySelectorAll('img[src="x"]').length, scripts: document.querySelectorAll('#escenario script').length, titulo: document.querySelector('#tituloFinal').textContent }));
    assert.equal(r.hack, undefined);
    assert.equal(r.imgs, 0);
    assert.equal(r.scripts, 0);
    assert.ok(r.titulo.includes(limpio));
    assert.deepEqual(page.errores, []);
    await page.cerrarContexto();
  }
});

test('sin Web Audio el juego anda igual, y silenciar no rompe', async () => {
  const page = await B.pagina({ antes: (p) => p.evaluateOnNewDocument(() => { delete window.AudioContext; delete window.webkitAudioContext; }) });
  await clic(page, '#botonComenzar');
  await clic(page, '#botonEstacion');
  await clic(page, '#botonSonido');
  await page.evaluate(() => { const P = RE.ui.estado.partida; document.querySelector('.respuesta[data-i="' + RE.motor.actual(P).correcta + '"]').click(); });
  await dormir(100);
  assert.equal(await page.evaluate(() => RE.ui.estado.partida.aciertos), 1);
  assert.deepEqual(page.errores, []);
  await page.cerrarContexto();
});

test('sin poder guardar (localStorage bloqueado): se juega, se avisa y no hay errores', async () => {
  const page = await B.pagina({ antes: (p) => p.evaluateOnNewDocument(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('bloqueado', 'SecurityError'); } }); }) });
  assert.match(await page.evaluate(() => document.querySelector('.ranking').textContent), /no deja guardar/);
  await clic(page, '.modo[data-foco="modo-corto"]');
  await clic(page, '#botonComenzar');
  await jugarHastaDesafio(page);
  await resolverDesafioTocando(page);
  await page.waitForSelector('#tituloFinal', { timeout: 8000 });
  assert.match(await page.evaluate(() => document.querySelector('.aviso-guardado').textContent), /no puede guardar datos/);
  assert.deepEqual(page.errores, []);
  await page.cerrarContexto();
});

test('movimiento reducido: la partida, el logro y la contrarreloj funcionan sin animaciones', async () => {
  const page = await B.pagina({ antes: (p) => p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]) });
  await page.evaluate(() => { RE.config.tiempo = { baseS: 3, palabrasPorS: 1000, minS: 3, maxS: 3 }; RE.ui.estado.ops.contrarreloj = true; RE.ui.ir('inicio'); });
  await clic(page, '#botonComenzar'); await clic(page, '#botonEstacion');
  // la barra de tiempo avanza con JavaScript, no con transiciones, y al llegar a cero la pregunta se da por perdida
  const ancho1 = await page.evaluate(() => parseFloat(document.querySelector('.reloj__relleno').style.width));
  await dormir(500);
  const ancho2 = await page.evaluate(() => parseFloat(document.querySelector('.reloj__relleno').style.width));
  assert.ok(ancho2 < ancho1, 'la barra de tiempo tiene que ir bajando');
  await page.waitForSelector('#botonSiguiente', { visible: true, timeout: 8000 });
  assert.match(await page.evaluate(() => document.querySelector('.explicacion__titulo').textContent), /Se acabó el tiempo/);
  // un logro se ve completo aunque no haya animación
  await page.evaluate(() => RE.ui.capas.logro(RE.config.logros[0]));
  const op = await page.evaluate(() => { const c = document.querySelector('.logro__tarjeta'); const s = getComputedStyle(c); return { o: s.opacity, t: s.transform }; });
  assert.equal(op.o, '1');
  assert.ok(op.t === 'none' || op.t === 'matrix(1, 0, 0, 1, 0, 0)');
  assert.deepEqual(page.errores, []);
  await page.cerrarContexto();
});

test('contrarreloj: se acaba el tiempo, cuenta como error y la racha vuelve a cero; el tiempo se frena con un diálogo abierto', async () => {
  const page = await B.pagina();
  await page.evaluate(() => { RE.config.tiempo = { baseS: 1, palabrasPorS: 1000, minS: 3, maxS: 3 }; RE.ui.estado.ops.contrarreloj = true; RE.ui.ir('inicio'); });
  await clic(page, '#botonComenzar'); await clic(page, '#botonEstacion');
  await page.evaluate(() => RE.ui.pausar());
  await dormir(1500);
  assert.equal(await page.evaluate(() => RE.ui.estado.partida.respondida), false, 'con una pausa no corre el reloj');
  const num = await page.evaluate(() => document.querySelector('.reloj__num').textContent);
  assert.equal(num, '3');
  await page.evaluate(() => RE.ui.reanudar());
  await page.waitForSelector('#botonSiguiente', { visible: true, timeout: 5000 });
  const r = await page.evaluate(() => ({ racha: RE.ui.estado.partida.racha, falladas: RE.ui.estado.partida.falladas.length, elegida: RE.ui.estado.partida.elegida }));
  assert.deepEqual(r, { racha: 0, falladas: 1, elegida: -1 });
  await page.cerrarContexto();
});

test('desafío: arrastrando la ficha hasta el lugar, tocando, y con dos errores se muestra la respuesta', async () => {
  const page = await B.pagina();
  await page.evaluate(() => { RE.ui.nuevaPartida(); RE.ui.ir('desafio'); });
  const items = await page.evaluate(() => RE.ui.estado.partida.desafio.items.map((i) => ({ id: i.id, depto: i.depto })));
  async function centro(sel) { const e = await page.$(sel); const b = await e.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }
  async function fichaSel(dep) { const idx = await page.evaluate((d) => [...document.querySelectorAll('.ficha')].findIndex((f) => f.textContent === d), dep); return '.ficha:nth-child(' + (idx + 1) + ')'; }
  // 1) arrastrar
  const a = items[0], pa = await centro('.lugar[data-id="' + a.id + '"]'), pf = await centro(await fichaSel(a.depto));
  await page.mouse.move(pf.x, pf.y); await page.mouse.down(); await page.mouse.move(pf.x + 30, pf.y - 20, { steps: 4 });
  assert.equal(await page.evaluate(() => document.querySelectorAll('.ficha--arrastrando').length), 1, 'hay una ficha fantasma siguiendo el dedo');
  await page.mouse.move(pa.x, pa.y, { steps: 8 }); await page.mouse.up(); await dormir(150);
  assert.equal(await page.evaluate((id) => document.querySelector('.lugar[data-id="' + id + '"]').classList.contains('lugar--resuelto'), a.id), true);
  assert.equal(await page.evaluate(() => document.querySelectorAll('.ficha--arrastrando').length), 0);
  assert.equal(await page.evaluate(() => RE.ui.estado.partida.puntaje), 10);
  // 2) soltar en el vacío no hace nada
  const b = items[1], pf2 = await centro(await fichaSel(b.depto));
  await page.mouse.move(pf2.x, pf2.y); await page.mouse.down(); await page.mouse.move(pf2.x - 100, pf2.y + 5, { steps: 5 }); await page.mouse.up(); await dormir(150);
  assert.equal(await page.evaluate((id) => RE.ui.estado.partida.desafio.items.find((i) => i.id === id).intentos, b.id), 0);
  // 3) dos errores seguidos revelan la respuesta
  const mala = await page.evaluate((dep) => RE.ui.estado.partida.desafio.deptos.filter((d) => d !== dep && !RE.ui.estado.partida.desafio.colocados[d]), b.depto);
  for (const dep of mala.slice(0, 2)) {
    await page.click('.lugar[data-id="' + b.id + '"]'); await dormir(80);
    const idx = await page.evaluate((d) => [...document.querySelectorAll('.ficha')].findIndex((f) => f.textContent === d), dep);
    await (await page.$$('.ficha'))[idx].click(); await dormir(120);
  }
  assert.equal(await page.evaluate((id) => RE.ui.estado.partida.desafio.items.find((i) => i.id === id).estado, b.id), 'revelado');
  assert.equal(await page.evaluate(() => RE.ui.estado.partida.puntaje), 10);
  assert.deepEqual(page.errores, []);
  await page.cerrarContexto();
});

test('desafío con teclado: Tab, Enter en el lugar y Enter en la ficha', async () => {
  const page = await B.pagina();
  await page.evaluate(() => { RE.ui.nuevaPartida(); RE.ui.ir('desafio'); });
  const it = await page.evaluate(() => { const d = RE.ui.estado.partida.desafio.items[0]; return { id: d.id, depto: d.depto }; });
  await page.focus('.lugar[data-id="' + it.id + '"]'); await page.keyboard.press('Enter'); await dormir(80);
  assert.equal(await page.evaluate((id) => document.querySelector('.lugar[data-id="' + id + '"]').getAttribute('aria-pressed'), it.id), 'true');
  const idx = await page.evaluate((d) => [...document.querySelectorAll('.ficha')].findIndex((f) => f.textContent === d), it.depto);
  await (await page.$$('.ficha'))[idx].focus(); await page.keyboard.press('Enter'); await dormir(120);
  assert.equal(await page.evaluate(() => RE.ui.estado.partida.puntaje), 10);
  await page.cerrarContexto();
});

test('inactividad: aparece «¿Seguís ahí?», un toque sigue jugando y, si nadie responde, vuelve al inicio sin nombre', async () => {
  const page = await B.pagina();
  await page.evaluate(() => { RE.config.inactividadAvisoS = 1; RE.config.inactividadCuentaS = 3; RE.ui.estado.ops.nombre = 'Mateo'; RE.ui.ir('inicio'); });
  await clic(page, '#botonComenzar'); await clic(page, '#botonEstacion');
  await dormir(2600);
  assert.ok(await page.$('#botonSeguir'), 'aparece el aviso');
  await page.click('#botonSeguir'); await dormir(300);
  assert.equal(await page.$('#botonSeguir'), null);
  assert.equal(await pantalla(page), 'pregunta');
  await page.evaluate(() => { RE.config.inactividadAvisoS = 1; RE.config.inactividadCuentaS = 2; });
  await dormir(1500);
  await page.waitForSelector('#botonSeguir', { timeout: 4000 });
  await page.waitForFunction(() => RE.ui.estado.pantalla === 'inicio', { timeout: 6000 });
  const r = await page.evaluate(() => ({ nombre: RE.ui.estado.ops.nombre, partida: RE.ui.estado.partida, dialogos: document.querySelectorAll('.capa').length }));
  assert.deepEqual(r, { nombre: '', partida: null, dialogos: 0 });
  assert.deepEqual(page.errores, []);
  await page.cerrarContexto();
});

test('en el inicio, nombre y opciones se borran solos tras un rato sin tocar nada', async () => {
  const page = await B.pagina();
  await page.evaluate(() => { RE.config.inicioLimpiaAlS = 1; RE.ui.estado.ops.nombre = 'Sofía'; RE.ui.estado.ops.contrarreloj = true; RE.ui.ir('inicio'); });
  await page.waitForFunction(() => RE.ui.estado.ops.nombre === '', { timeout: 5000 });
  assert.equal(await page.evaluate(() => RE.ui.estado.ops.contrarreloj), false);
  await page.cerrarContexto();
});

test('administración: PIN, descargar el ranking, borrarlo con confirmación', async () => {
  const page = await B.pagina();
  await page.evaluate(() => {
    RE.almacen.ranking.guardar({ nombre: '=SUMA(1;1)', puntaje: 200, aciertos: 20, total: 25, pct: 80, mejorRacha: 6, modo: 'completo', duracionS: 400 });
    window.__descargas = [];
    const orig = URL.createObjectURL;
    URL.createObjectURL = (b) => { b.text().then((t) => window.__descargas.push(t)); return orig.call(URL, b); };
  });
  // mantener apretado el logo
  const b = await (await page.$('#logo')).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await dormir(3300); await page.mouse.up(); await dormir(300);
  assert.ok(await page.$('.teclado-num'), 'aparece el teclado del PIN');
  for (const d of '0000') await page.evaluate((c) => [...document.querySelectorAll('.teclado-num .tecla')].find((t) => t.textContent === c).click(), d);
  await dormir(200);
  assert.match(await page.evaluate(() => document.querySelector('.pin-error').textContent), /incorrecto/);
  for (const d of await page.evaluate(() => RE.config.pinAdmin)) await page.evaluate((c) => [...document.querySelectorAll('.teclado-num .tecla')].find((t) => t.textContent === c).click(), d);
  await dormir(300);
  assert.ok(await page.$('.panel-admin'), 'se abre la administración');
  assert.match(await page.evaluate(() => document.querySelector('.aviso-pin') && document.querySelector('.aviso-pin').textContent), /PIN/);
  const btn = async (txt) => page.evaluate((t) => { const x = [...document.querySelectorAll('.panel-admin button')].find((e) => e.textContent.includes(t)); x.click(); return !!x; }, txt);
  await btn('Descargar ranking'); await dormir(400);
  const csv = await page.evaluate(() => window.__descargas[0]);
  assert.ok(csv.includes("'=SUMA(1;1)") && !/;=SUMA/.test(csv), 'el CSV neutraliza fórmulas');
  await btn('Borrar el ranking'); await dormir(250);
  await page.evaluate(() => [...document.querySelectorAll('.dialogo button')].find((e) => e.textContent === 'Sí, borrar').click()); await dormir(300);
  assert.equal(await page.evaluate(() => RE.almacen.ranking.todos().length), 0);
  await page.evaluate(() => document.querySelector('#botonCerrarAdmin').click()); await dormir(300);
  assert.equal(await page.$('.panel-admin'), null);
  assert.deepEqual(page.errores, []);
  await page.cerrarContexto();
});

test('teclado en pantalla: escribe con acentos y ñ, mayúscula automática, borra y acepta', async () => {
  const page = await B.pagina();
  await clic(page, '#campoNombre', 250);
  const tecla = (t) => page.evaluate((x) => { const k = [...document.querySelectorAll('.teclado .tecla')].find((e) => e.textContent.toLowerCase() === x.toLowerCase()); if (!k) throw new Error('no hay tecla ' + x); k.click(); }, t);
  for (const t of ['j', 'o', 's', 'é']) await tecla(t);
  await tecla('espacio'); await tecla('n'); await tecla('ñ'); await tecla('x'); await tecla('x');
  await page.evaluate(() => document.querySelector('.teclado .tecla[aria-label="Borrar la última letra"]').click());
  assert.equal(await page.evaluate(() => document.querySelector('.teclado__texto').textContent.trim()), 'José Nñx');
  await tecla('Listo'); await dormir(250);
  assert.equal(await page.evaluate(() => RE.ui.estado.ops.nombre), 'José Nñx');
  assert.equal(await page.$('.teclado'), null);
  await page.cerrarContexto();
});

test('alias al azar: siempre es un nombre simpático distinto de vacío y entra en el ranking', async () => {
  const page = await B.pagina();
  await clic(page, '.boton--chico:not(.boton--peligro)');
  const alias = await page.evaluate(() => RE.ui.estado.ops.nombre);
  assert.match(alias, /^\S+ \S+$/);
  await page.cerrarContexto();
});

test('salir en medio de la partida pide confirmación y vuelve al inicio sin anotar nada', async () => {
  const page = await B.pagina();
  await clic(page, '#botonComenzar'); await clic(page, '#botonEstacion');
  await clic(page, '#botonSalir');
  assert.ok(await page.$('.dialogo'));
  await page.evaluate(() => [...document.querySelectorAll('.dialogo button')].find((e) => e.textContent === 'Seguir jugando').click()); await dormir(200);
  assert.equal(await pantalla(page), 'pregunta');
  await clic(page, '#botonSalir');
  await page.evaluate(() => [...document.querySelectorAll('.dialogo button')].find((e) => e.textContent === 'Terminar').click()); await dormir(300);
  assert.equal(await pantalla(page), 'inicio');
  assert.equal(await page.evaluate(() => RE.almacen.ranking.todos().length), 0);
  await page.cerrarContexto();
});

test('créditos: se abren sin interrumpir la partida y se cierran con Escape', async () => {
  const page = await B.pagina();
  await clic(page, '#botonComenzar'); await clic(page, '#botonEstacion');
  await clic(page, '#botonCreditos', 300);
  assert.ok(await page.$('.creditos'));
  const t = await page.evaluate(() => document.querySelector('.creditos').textContent);
  assert.match(t, /Shant/); assert.match(t, /Andrés Franchi Ugart/); assert.match(t, /Ayax4555/); assert.match(t, /Mx\. Granger/);
  assert.match(t, /CC BY-SA 3\.0/); assert.match(t, /Fredoka/);
  await page.keyboard.press('Escape'); await dormir(250);
  assert.equal(await page.$('.creditos'), null);
  assert.equal(await pantalla(page), 'pregunta');
  await page.cerrarContexto();
});

test('«Datos verificados» ya no aparece en ninguna pantalla', async () => {
  const page = await B.pagina();
  const texto = await page.evaluate(() => document.body.innerText);
  assert.ok(!/verificad/i.test(texto));
  await page.cerrarContexto();
});

test('al tocar con el dedo el aviso «¿Seguís ahí?» el toque no «pasa» a la respuesta que había justo debajo', async () => {
  const page = await B.pagina({ antirrebote: true, antes: (p) => p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1, hasTouch: true }) });
  await page.evaluate(() => { RE.config.inactividadAvisoS = 1; RE.config.inactividadCuentaS = 30; RE.ui.nuevaPartida(); RE.ui.ir('pregunta'); });
  await page.waitForSelector('#botonSeguir', { timeout: 5000 });
  const e = await page.$('.respuesta[data-i="0"]'), b = await e.boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);   // toca el aviso justo encima de la respuesta A
  await dormir(500);
  assert.equal(await page.$('#botonSeguir'), null, 'el aviso se fue');
  assert.equal(await page.evaluate(() => RE.ui.estado.partida.respondida), false, 'la respuesta de abajo no se tocó');
  await page.cerrarContexto();
});

test('un teclado en pantalla abierto y abandonado se cierra solo y la pantalla vuelve al inicio sin nombre', async () => {
  const page = await B.pagina();
  await page.evaluate(() => { RE.config.inicioLimpiaAlS = 1; RE.ui.estado.ops.nombre = 'Ana'; RE.ui.ir('inicio'); });
  await page.click('#campoNombre'); await dormir(300);
  assert.ok(await page.$('.teclado'));
  await page.waitForFunction(() => !document.querySelector('.teclado') && RE.ui.estado.ops.nombre === '', { timeout: 6000 });
  assert.equal(await page.evaluate(() => RE.ui.estado.pantalla), 'inicio');
  assert.equal(await page.evaluate(() => document.querySelectorAll('.capa').length), 0);
  assert.equal(await page.evaluate(() => document.getElementById('app').hasAttribute('aria-hidden')), false, 'la página vuelve a ser accesible');
  await page.cerrarContexto();
});
