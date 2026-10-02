// El juego en un solo archivo (dist/ruta-de-la-energia.html): se abre desde el disco, sin servidor ni internet.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { buscarChrome, dormir } = require('./ayudas');
const { construir } = require('../../scripts/build-un-archivo.js');

const RAIZ = path.join(__dirname, '..', '..');

test('el archivo único de la carpeta dist está al día con el código (si falla: npm run build)', () => {
  const actual = fs.readFileSync(path.join(RAIZ, 'dist', 'ruta-de-la-energia.html'), 'utf8');
  assert.equal(actual === construir().html, true, 'dist/ruta-de-la-energia.html está desactualizado: corré «npm run build» y subilo');
});

test('abre desde el disco (file://), no pide nada por red y se puede jugar', async () => {
  const navegador = await puppeteer.launch({ executablePath: buscarChrome(), args: ['--no-sandbox', '--force-device-scale-factor=1'] });
  try {
    const page = await navegador.newPage();
    const pedidos = [], errores = [];
    page.on('request', (r) => pedidos.push(r.url()));
    page.on('pageerror', (e) => errores.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('file://' + path.join(RAIZ, 'dist', 'ruta-de-la-energia.html'), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    assert.ok(await page.evaluate(() => document.fonts.check('600 20px Fredoka') && document.fonts.check('700 20px Nunito')));
    await dormir(450); // el antirrebote ignora los toques durante los primeros 0,3 segundos de cada pantalla
    await page.click('#botonComenzar'); await dormir(450);
    await page.click('#botonEstacion'); await dormir(450);
    await page.evaluate(() => { const P = RE.ui.estado.partida; document.querySelector('.respuesta[data-i="' + RE.motor.actual(P).correcta + '"]').click(); });
    await dormir(150);
    assert.equal(await page.evaluate(() => RE.ui.estado.partida.aciertos), 1);
    const externos = pedidos.filter((u) => !/^(data:|file:|about:|blob:)/.test(u));
    assert.deepEqual(externos, [], 'pidió cosas por internet');
    const fondos = await page.evaluate(() => [...document.querySelectorAll('.fondo__img')].map((e) => /^url\("?data:image\/webp/.test(getComputedStyle(e).backgroundImage)));
    assert.ok(fondos.every(Boolean), 'las cinco fotos van dentro del archivo');
    assert.equal(await page.evaluate(() => document.querySelector('#logo img').complete && document.querySelector('#logo img').naturalWidth), 695);
    assert.equal(await page.evaluate(() => !!navigator.serviceWorker && !!window.RE_SIN_SW), true);
    assert.deepEqual(errores, []);
  } finally { await navegador.close(); }
});
