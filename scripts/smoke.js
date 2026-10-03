// Pruebas de humo en un Chrome real (puppeteer-core): errores, desbordes, idiomas, botón de WhatsApp, La Copa, itinerario impreso, menú del encabezado, recorrido de estaciones, calendario de temporadas y galería.
// Uso: node scripts/smoke.js      (levanta su propio servidor; o usa SITE_URL=http://... si ya hay uno)
//      CHROME_PATH=/ruta/a/chrome si Chrome no está en un lugar conocido.
const puppeteer = require('puppeteer-core'); const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const CHROME = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('No encuentro Chrome: definí CHROME_PATH'); process.exit(2); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const failures = [];
const check = (name, cond, extra) => { if (!cond) failures.push(name + (extra ? ' → ' + extra : '')); console.log((cond ? 'OK  ' : 'MAL ') + name + (extra && !cond ? '  → ' + extra : '')); };

function servidor() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p === '/') p = '/LaRutadelTannat.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('no'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
    }).listen(0, '127.0.0.1', () => ok({ url: 'http://127.0.0.1:' + s.address().port + '/LaRutadelTannat.html', cerrar: () => s.close() }));
  });
}

(async () => {
  const srv = process.env.SITE_URL ? { url: process.env.SITE_URL, cerrar() {} } : await servidor();
  const origin = new URL(srv.url).origin;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const abrir = async (W, H, mobile) => {
    const page = await browser.newPage(); await page.setViewport({ width: W, height: H, isMobile: mobile, hasTouch: mobile });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    page.problemas = [];
    page.on('pageerror', (e) => page.problemas.push('error de JS: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.problemas.push('consola: ' + m.text().slice(0, 120)); });
    page.on('response', (r) => { if (r.url().startsWith(origin) && r.status() >= 400) page.problemas.push(r.status() + ' ' + r.url().slice(0, 100)); });
    page.on('requestfailed', (r) => { if (r.url().startsWith(origin) && !/ERR_ABORTED/.test(r.failure().errorText)) page.problemas.push('falló ' + r.url().slice(0, 100)); });
    await page.goto(srv.url, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await sleep(800); return page; // las tipografías llegan por red: se espera a que terminen para medir siempre con las mismas
  };
  const recorrer = async (page, H) => { const h = await page.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < h; y += Math.round(H * 0.7)) { await page.evaluate((y) => window.scrollTo(0, y), y); await sleep(120); } await sleep(600); await page.evaluate(() => window.scrollTo(0, 0)); };

  // 1. sin errores ni recursos propios rotos (escritorio y celular, recorriendo toda la página)
  for (const [W, H, m] of [[1280, 800, false], [390, 844, true]]) {
    const page = await abrir(W, H, m); await recorrer(page, H);
    check('sin errores ni recursos rotos a ' + W + 'px', page.problemas.length === 0, page.problemas.slice(0, 4).join(' | '));
    if (W === 390) {
      // 2. idiomas: título y <html lang> cambian, y vuelve al español
      const t = {}; for (const l of ['pt', 'en', 'es']) { await page.evaluate((l) => setLanguage(l), l); await sleep(150); t[l] = await page.evaluate(() => document.title + '|' + document.documentElement.lang); }
      check('el idioma cambia título y <html lang>', t.pt.endsWith('|pt') && t.en.endsWith('|en') && t.es.endsWith('|es') && new Set(Object.values(t)).size === 3, JSON.stringify(t));
      // 3. reserva: el formulario abre y cierra
      await page.evaluate(() => openBookingModal('General')); await sleep(300);
      const abierto = await page.evaluate(() => !document.getElementById('bookingModal').classList.contains('hidden')); await page.evaluate(() => closeBookingModal()); await sleep(300);
      check('el formulario de reserva abre y cierra', abierto && await page.evaluate(() => document.getElementById('bookingModal').classList.contains('hidden')));
    }
    await page.close();
  }

  // 4. ningún ancho produce scroll horizontal
  { const page = await abrir(390, 844, true); const malos = [];
    for (const W of [320, 360, 375, 414, 768, 1024, 1280, 1920]) { await page.setViewport({ width: W, height: 800, isMobile: W < 800, hasTouch: W < 800 }); await sleep(250); const ex = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ex > 0) malos.push(W + 'px(+' + ex + ')'); }
    check('sin scroll horizontal de 320 a 1920 px', malos.length === 0, malos.join(' ')); await page.close(); }

  // 5. el botón flotante de WhatsApp no tapa "Reservar" en celulares chicos
  { const page = await abrir(375, 667, true); const malos = [];
    for (const [W, H] of [[375, 667], [320, 568], [390, 844]]) {
      await page.setViewport({ width: W, height: H, isMobile: true, hasTouch: true }); await sleep(300);
      const r = await page.evaluate(() => { const fab = [...document.querySelectorAll('a[href*="wa.me/"]')].find((a) => getComputedStyle(a).position === 'fixed'), btn = document.querySelector('div.mbar button'); if (!fab || !btn) return null; const a = fab.getBoundingClientRect(), b = btn.getBoundingClientRect(); return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom); });
      if (r === null) malos.push(W + ' (no encuentro los botones)'); else if (r) malos.push(W + 'x' + H);
    }
    check('el botón de WhatsApp no tapa "Reservar Ahora"', malos.length === 0, malos.join(' ')); await page.close(); }

  // 6. La Copa entra entera en pantalla (sin scrollear) en tamaños típicos
  { const page = await abrir(390, 844, true); await page.evaluate(() => document.getElementById('copa').scrollIntoView({ block: 'start', behavior: 'instant' })); await sleep(2600); const malos = [];
    for (const [W, H] of [[390, 844], [375, 667], [360, 640], [320, 568], [740, 360], [800, 360], [667, 375], [1024, 768], [1280, 720], [1366, 768], [1920, 950]]) {
      await page.setViewport({ width: W, height: H, isMobile: true, hasTouch: true }); await sleep(300);
      await page.evaluate(() => document.getElementById('copa').scrollIntoView({ block: 'start', behavior: 'instant' })); await sleep(200);
      const m = await page.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); const bar = [...document.querySelectorAll('div.fixed')].find((d) => /Desde Salto|From Salto|A partir/i.test(d.textContent) && d.getBoundingClientRect().bottom >= innerHeight - 1 && getComputedStyle(d).display !== 'none'); return { sobra: Math.max(r('#cupPanel').bottom, r('#cupStage').bottom) - ((bar ? bar.getBoundingClientRect().top : innerHeight) + 3), arriba: r('#mainHeader').bottom - 3 - r('#cupStage').top }; });
      if (m.sobra > 0 || m.arriba > 0) malos.push(W + 'x' + H + '(' + Math.round(Math.max(m.sobra, m.arriba)) + 'px)');
    }
    check('La Copa entra en pantalla sin scrollear', malos.length === 0, malos.join(' ')); await page.close(); }

  // 7. itinerario impreso: una sola hoja A4 en cada idioma, y al imprimir solo se ve la hoja
  { const page = await abrir(688, 1024, false); const res = [], ocupa = []; // 688 px = ancho útil de una hoja A4 (182 mm)
    for (const l of ['es', 'pt', 'en']) {
      await page.evaluate((l) => { setLanguage(l); renderPrintItinerary(); }, l); await page.emulateMediaType('print');
      const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true }); const hojas = (Buffer.from(pdf).toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
      const alto = await page.evaluate(() => Math.round(document.getElementById('printItinerary').getBoundingClientRect().height)); ocupa.push(l + ' ' + Math.round(alto / 1024 * 100) + '%');
      const visibles = await page.evaluate(() => [...document.body.children].filter((e) => getComputedStyle(e).display !== 'none' && !/^(SCRIPT|STYLE|LINK)$/.test(e.tagName)).map((e) => e.id || e.tagName));
      await page.emulateMediaType('screen'); if (hojas !== 1 || visibles.join() !== 'printItinerary') res.push(l + ': ' + hojas + ' hoja(s), visibles=' + visibles.join());
    }
    check('el itinerario imprime en 1 hoja A4 (es/pt/en) y oculta el resto [ocupa ' + ocupa.join(', ') + ' del alto útil]', res.length === 0, res.join(' | ')); await page.close(); }

  // 8. el menú del escritorio cabe en una línea de 1280 a 1920 px, y "Más" abre con clic y cierra con Esc y con clic afuera
  { const page = await abrir(1440, 900, false); const malos = [];
    const partidos = () => page.evaluate(() => { const n = (el) => { const r = document.createRange(); r.selectNodeContents(el); return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size; }; return [...document.querySelectorAll('#mainHeader nav > a, #navMoreBtn span, #mainHeader button.xl\\:inline-flex span')].filter((e) => e.offsetParent).map((e) => e.textContent.trim() + ':' + n(e)).filter((s) => !/:1$/.test(s)); });
    for (const W of [1280, 1440, 1920]) { await page.setViewport({ width: W, height: 900 }); await sleep(250); const m = await partidos(); if (m.length) malos.push(W + 'px (' + m.join(', ') + ')'); }
    const abierto = () => page.evaluate(() => !document.getElementById('navMoreMenu').classList.contains('hidden'));
    await page.click('#navMoreBtn'); const a1 = await abierto();
    await page.keyboard.press('Escape'); const a2 = !(await abierto()) && await page.evaluate(() => document.activeElement.id === 'navMoreBtn');
    await page.click('#navMoreBtn'); await page.mouse.click(20, 500); const a3 = !(await abierto());
    check('el menú del encabezado cabe en una línea (1280 a 1920 px)', malos.length === 0, malos.join(' | '));
    check('el menú "Más" abre con clic y cierra con Esc y con clic afuera', a1 && a2 && a3, [a1, a2, a3].join('/')); await page.close(); }

  // 9. recorrido de estaciones: la línea se dibuja con el scroll (y queda entera con "reducir movimiento")
  { const page = await abrir(1280, 800, false);
    const escalas = () => page.evaluate(() => [...document.querySelectorAll('.route > li')].map((li) => { const m = /matrix\(1, 0, 0, ([\d.e-]+)/.exec(getComputedStyle(li, '::after').transform); return m ? +m[1] : 1; }));
    const entera = (await escalas()).every((v) => v === 1);
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    const soporta = await page.evaluate(() => CSS.supports('animation-timeline: view()'));
    const pinesOn = () => page.evaluate(() => [...document.querySelectorAll('.route-pin')].filter((p) => getComputedStyle(p).backgroundColor === 'rgb(114, 27, 40)').length);
    const en = async (t) => { await page.evaluate((t) => { const r = document.querySelector('.route').getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY - innerHeight * 0.5 + r.height * t, behavior: 'instant' }); }, t); await sleep(400); return { v: (await escalas()).slice(0, -1), pines: await pinesOn() }; };
    let antes = {}, medio = {}, despues = {};
    if (soporta) { antes = await en(-0.3); medio = await en(0.5); despues = await en(1.3); }
    const dec = (v) => v.every((x, i) => i === 0 || x <= v[i - 1] + 0.001);
    const ok = entera && (!soporta || (antes.v.every((x) => x < 0.02) && antes.pines === 0 && dec(medio.v) && medio.v[0] > 0.98 && medio.v[medio.v.length - 1] < 0.02 && medio.pines >= 1 && medio.pines <= 3 && despues.v.every((x) => x > 0.98) && despues.pines === 4));
    check('el recorrido de estaciones se dibuja con el scroll y queda entero con "reducir movimiento"', ok, JSON.stringify({ entera, soporta, antes, medio, despues })); await page.close(); }

  // 10. calendario de temporadas: abre en la de hoy, cada pestaña lleva a su diapositiva y deslizar la pista cambia la pestaña
  { const page = await abrir(1280, 800, false);
    const r = await page.evaluate(async () => {
      const tabs = [...document.querySelectorAll('.season-tab')], tr = document.getElementById('seasonTrack'), esp = (ms) => new Promise((ok) => setTimeout(ok, ms));
      const sel = () => tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'), pos = (i) => tr.children[i].offsetLeft - 8;
      const m = new Date().getMonth(), hoy = (m === 11 || m <= 2) ? 0 : m <= 4 ? 1 : m <= 7 ? 2 : 3, ini = sel(), insignia = !document.getElementById('seasonNowBadge' + (hoy + 1)).classList.contains('hidden');
      const otra = (hoy + 1) % 4; tabs[otra].click(); await esp(1000); const clic = sel() === otra && Math.abs(tr.scrollLeft - pos(otra)) < 4;
      const dest = (otra + 1) % 4; tr.scrollTo({ left: pos(dest), behavior: 'instant' }); await esp(600); const deslizar = sel() === dest;
      tabs[dest].focus(); tabs[dest].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await esp(1000); const teclado = sel() === (dest + 1) % 4;
      return { hoy, ini, insignia, clic, deslizar, teclado };
    });
    check('el calendario de temporadas abre en la de hoy, y la pestaña, el deslizado y las flechas lo mueven', r.ini === r.hoy && r.insignia && r.clic && r.deslizar && r.teclado, JSON.stringify(r)); await page.close(); }

  // 11. galería deslizable: no se mueve sola, los botones y el teclado la recorren y cada foto abre un visor con flechas
  { const page = await abrir(1280, 800, false);
    const r = await page.evaluate(async () => {
      const esp = (ms) => new Promise((ok) => setTimeout(ok, ms)), s = document.getElementById('galleryStrip'), items = [...s.children], prev = document.getElementById('galPrev'), next = document.getElementById('galNext');
      const solas = document.getAnimations().filter((a) => a instanceof CSSAnimation && a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#galeria')).length;
      const cs = getComputedStyle(s), deslizable = s.scrollWidth > s.clientWidth + 100 && cs.overflowX === 'auto' && cs.scrollSnapType.includes('x');
      const ini = prev.getAttribute('aria-disabled') === 'true' && next.getAttribute('aria-disabled') === 'false';
      next.click(); await esp(500); const avanza = s.scrollLeft > 100 && prev.getAttribute('aria-disabled') === 'false';
      s.scrollTo({ left: s.scrollWidth, behavior: 'instant' }); await esp(300); const fin = next.getAttribute('aria-disabled') === 'true';
      items[0].focus(); items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); const teclado = document.activeElement === items[1] && items.filter((i) => i.tabIndex === 0).length === 1;
      items[1].click(); await esp(400);
      const lb = () => ({ abierto: !document.getElementById('galleryLightbox').classList.contains('hidden'), cap: document.getElementById('lightboxCaption').textContent });
      const a = lb(); stepGalleryLightbox(1); const b = lb(); stepGalleryLightbox(-1); const c = lb();
      const visor = a.abierto && !!a.cap && !!b.cap && b.cap !== a.cap && c.cap === a.cap;
      return { solas, deslizable, ini, avanza, fin, teclado, visor };
    });
    check('la galería se desliza (botones, teclado y visor con flechas) y no se mueve sola', r.solas === 0 && r.deslizable && r.ini && r.avanza && r.fin && r.teclado && r.visor, JSON.stringify(r)); await page.close(); }

  await browser.close(); srv.cerrar();
  if (failures.length) { console.log('\n' + failures.length + ' prueba(s) fallaron:\n - ' + failures.join('\n - ')); process.exit(1); }
  console.log('\nTodas las pruebas de humo pasaron');
})().catch((e) => { console.error(e); process.exit(1); });
