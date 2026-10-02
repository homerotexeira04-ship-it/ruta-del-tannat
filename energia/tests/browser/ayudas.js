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

// Mide el contraste real de cada texto de la cabecera y del escenario contra lo que tiene detrás (foto, vidrio, tarjetas, botones).
// Esconde todos los textos, saca una captura y recorre los píxeles de la caja de cada texto: el peor píxel manda.
// Devuelve [{texto, color, ratio}] (ratio = el contraste más bajo de esa caja).
async function contrasteDeTextos(page, raices) {
  raices = raices || ['#cabecera', '#escenario'];
  const textos = await page.evaluate((raices) => {
    const out = [];
    for (const sel of raices) {
      const raiz = document.querySelector(sel);
      if (!raiz) continue;
      const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        if (!n.textContent.trim()) continue;
        const el = n.parentElement, cs = getComputedStyle(el);
        if (el.closest('.solo-lectores') || cs.visibility === 'hidden' || cs.display === 'none') continue;
        const r = document.createRange(); r.selectNodeContents(n);
        const b = r.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) continue;
        out.push({ texto: n.textContent.trim().slice(0, 40), color: cs.color, caja: [b.left, b.top, b.width, b.height] });
      }
    }
    if (!document.getElementById('estilo-sin-texto')) {
      const st = document.createElement('style'); st.id = 'estilo-sin-texto';
      st.textContent = '.sin-texto, .sin-texto * { color: transparent !important; text-shadow: none !important; caret-color: transparent !important; transition: none !important; animation: none !important; }';
      document.head.appendChild(st);
    }
    document.body.classList.add('sin-texto');
    return out;
  }, raices);
  const b64 = await page.screenshot({ encoding: 'base64' });
  await page.evaluate(() => document.body.classList.remove('sin-texto'));
  return page.evaluate(async (b64, textos) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const lum = (r, gg, b) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b);
    return textos.map((t) => {
      const [r, gg, b] = t.color.match(/[\d.]+/g).slice(0, 3).map(Number);
      const lt = lum(r, gg, b);
      const x = Math.max(0, Math.floor(t.caja[0]) + 1), y = Math.max(0, Math.floor(t.caja[1]) + 1);
      const w = Math.max(1, Math.min(img.width - x, Math.ceil(t.caja[2]) - 2)), h = Math.max(1, Math.min(img.height - y, Math.ceil(t.caja[3]) - 2));
      const d = g.getImageData(x, y, w, h).data;
      let peor = 21;
      for (let i = 0; i < d.length; i += 4) {
        const lp = lum(d[i], d[i + 1], d[i + 2]);
        const cr = (Math.max(lp, lt) + 0.05) / (Math.min(lp, lt) + 0.05);
        if (cr < peor) peor = cr;
      }
      return { texto: t.texto, color: t.color, ratio: Math.round(peor * 100) / 100 };
    });
  }, b64, textos);
}

module.exports = { iniciar, dormir, mostrarPregunta, buscarChrome, contrasteDeTextos };
