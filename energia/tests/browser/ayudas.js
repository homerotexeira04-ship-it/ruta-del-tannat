// Ayudas para las pruebas en navegador: busca Chrome, levanta el servidor del juego y abre páginas listas para usar.
'use strict';
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { servir } = require('../../scripts/servir.js');

function buscarChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidatos = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  try {
    for (const d of fs.readdirSync('/opt/pw-browsers')) {
      if (/^chromium-\d+$/.test(d)) candidatos.unshift(path.join('/opt/pw-browsers', d, 'chrome-linux', 'chrome'));
    }
  } catch (e) { /* no hay Playwright instalado */ }
  const c = candidatos.find((x) => fs.existsSync(x));
  if (!c) throw new Error('No encuentro Chrome. Definí CHROME_PATH con la ruta del ejecutable.');
  return c;
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function iniciar() {
  const servidor = await servir(0);
  const navegador = await puppeteer.launch({ executablePath: buscarChrome(), args: ['--no-sandbox', '--force-device-scale-factor=1', '--autoplay-policy=no-user-gesture-required'] });
  return {
    servidor, navegador,
    url: servidor.url + 'index.html',
    async cerrar() { await navegador.close(); await servidor.cerrar(); },
    // Página nueva con el juego cargado. opciones: {ancho, alto, antes(page) para preparar antes de cargar, esperarInicio}
    async pagina(o) {
      o = o || {};
      const ctx = await navegador.createBrowserContext();
      const page = await ctx.newPage();
      page.errores = [];
      page.on('pageerror', (e) => page.errores.push('pageerror: ' + e.message));
      page.on('console', (m) => { if (m.type() === 'error') page.errores.push('console: ' + m.text()); });
      page.on('requestfailed', (r) => { if (!/favicon/.test(r.url())) page.errores.push('requestfailed: ' + r.url()); });
      await page.setViewport({ width: o.ancho || 1920, height: o.alto || 1080, deviceScaleFactor: 1 });
      if (o.antes) await o.antes(page);
      await page.goto(o.url || this.url, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      // Las pruebas tocan los botones enseguida después de cada cambio de pantalla: se apaga el antirrebote (salvo que se pida lo contrario).
      if (!o.antirrebote) await page.evaluate(() => { if (window.RE) { RE.config.antirreboteMs = 0; RE.ui.bloqueoHasta = 0; } });
      page.cerrarContexto = () => ctx.close();
      return page;
    }
  };
}

// Arma una partida con las preguntas de la estación indicada y deja la pregunta n en pantalla.
async function mostrarPregunta(page, idPregunta, o) {
  o = o || {};
  await page.evaluate((id, o) => {
    const RE = window.RE, q = RE.datos.preguntas.find((x) => x.id === id);
    const ei = RE.datos.estaciones.findIndex((e) => e.clave === q.estacion);
    RE.ui.estado.ops.nombre = o.nombre || '';
    RE.ui.estado.ops.contrarreloj = !!o.contrarreloj;
    RE.ui.nuevaPartida();
    const P = RE.ui.estado.partida;
    const pos = o.pos == null ? 0 : o.pos;
    P.preguntas[0] = RE.motor.armarPregunta(q, ei, 1, 1, pos, () => 0.5);
    P.i = 0;
    RE.ui.estado.estIdx = ei;
    RE.ui.ir('pregunta');
  }, idPregunta, o);
}

module.exports = { iniciar, dormir, mostrarPregunta, buscarChrome };
