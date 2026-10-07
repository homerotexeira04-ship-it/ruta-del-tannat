// Pruebas de humo en un Chrome real (puppeteer-core): errores, desbordes, idiomas, botón de WhatsApp, La Copa, itinerario impreso y menú del encabezado.
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
  // Un Chrome sin pantalla (p. ej. el de GitHub Actions) no detecta mouse y reporta (hover: none): ahí los :hover no se aplican, a propósito.
  // Se fuerza "mouse fino con hover" para que las pruebas de escritorio midan lo mismo en cualquier máquina (la emulación táctil del celular lo reemplaza sola).
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4'] });
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

  // 8. encabezado agrupado: una sola línea (ES/PT/EN, 1280 a 1920 px); los 4 grupos abren con clic (uno a la vez), cierran con Esc y con clic afuera, y llevan a TODAS las secciones
  { const page = await abrir(1440, 900, false); const malos = [];
    const partidos = () => page.evaluate(() => { const n = (el) => { const r = document.createRange(); r.selectNodeContents(el); return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size; }; return [...document.querySelectorAll('[data-nav-group] > button span, #mainHeader .hdr-row > button span')].filter((e) => e.offsetParent && n(e) > 1).map((e) => e.textContent.trim()); });
    for (const l of ['es', 'pt', 'en']) { await page.evaluate((l) => setLanguage(l), l); for (const W of [1280, 1440, 1920]) { await page.setViewport({ width: W, height: 900 }); await sleep(250); const m = await partidos(); if (m.length) malos.push(l + ' ' + W + 'px (' + m.join(', ') + ')'); } }
    await page.evaluate(() => setLanguage('es'));
    check('el menú del encabezado cabe en una línea (ES/PT/EN, 1280 a 1920 px)', malos.length === 0, malos.join(' | '));
    const abiertos = () => page.evaluate(() => [...document.querySelectorAll('[data-nav-group] > button')].map((b) => b.getAttribute('aria-expanded') === 'true' ? 1 : 0).join(''));
    await page.click('[aria-controls="navGrp1"]'); const a1 = await abiertos();
    await page.click('[aria-controls="navGrp3"]'); const a2 = await abiertos();
    await page.keyboard.press('Escape'); const a3 = await abiertos(), foco = await page.evaluate(() => document.activeElement.getAttribute('aria-controls'));
    await page.click('[aria-controls="navGrp2"]'); await page.mouse.click(20, 500); const a4 = await abiertos();
    check('los grupos del menú abren con clic (uno a la vez) y cierran con Esc y con clic afuera', a1 === '1000' && a2 === '0010' && a3 === '0000' && foco === 'navGrp3' && a4 === '0000', [a1, a2, a3, foco, a4].join(' '));
    const sin = await page.evaluate(() => { const enMenu = new Set([...document.querySelectorAll('[data-nav-group] a')].map((a) => a.getAttribute('href').slice(1))); return [...document.querySelectorAll('main section[id]')].map((s) => s.id).filter((id) => id !== 'hero' && !enMenu.has(id)); });
    check('todas las secciones de la página son alcanzables desde el menú', sin.length === 0, 'sin acceso: ' + sin.join(', ')); await page.close(); }

  // 9. menú del celular: 4 grupos en acordeón (se abre uno a la vez) con las 17 secciones, y abierto no pisa la barra fija de reserva
  { const page = await abrir(360, 640, true); const r = await page.evaluate(async () => {
      const esp = (ms) => new Promise((ok) => setTimeout(ok, ms)), d = [...document.querySelectorAll('#mobileMenu details')], bar = document.querySelector('div.mbar');
      document.getElementById('mobileMenuBtn').click(); await esp(200);
      d[2].querySelector('summary').click(); await esp(100); d[0].querySelector('summary').click(); await esp(100);
      const exclusivo = d.map((x) => x.open ? 1 : 0).join('') === '1000';
      d[2].querySelector('summary').click(); await esp(150);
      return { grupos: d.length, exclusivo, enlaces: document.querySelectorAll('#mobileMenu details a').length, solapa: Math.round(document.getElementById('mobileMenu').getBoundingClientRect().bottom - bar.getBoundingClientRect().top) };
    });
    check('el menú del celular agrupa las 17 secciones en acordeón y no pisa la barra de reserva', r.grupos === 4 && r.exclusivo && r.enlaces === 17 && r.solapa <= 0, JSON.stringify(r)); await page.close(); }

  // 10. el hover de las tarjetas anima (el reveal al hacer scroll no debe pisarles la transición): se mide cuadro por cuadro cuántos pasos distintos recorre la elevación
  { const page = await abrir(1280, 800, false);
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]); await page.reload({ waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await sleep(700);
    await recorrer(page, 800); await sleep(1700); // deja terminar el reveal
    const sel = '.shadow-editorial-hover[class*="hover:-translate-y"]';
    const c = await page.evaluate(async (sel) => { const el = document.querySelector(sel); el.scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise((ok) => setTimeout(ok, 500)); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, prop: getComputedStyle(el).transitionProperty, hover: matchMedia('(hover: hover)').matches }; }, sel);
    await page.mouse.move(2, 2); await sleep(500);
    await page.evaluate((sel) => { const el = document.querySelector(sel); window.__pasos = null; el.addEventListener('mouseenter', () => { const v = new Set(); window.__pasos = v; const t0 = performance.now(); (function f() { const m = /matrix\(([^)]*)\)/.exec(getComputedStyle(el).transform); v.add(m ? m[1].split(',')[5].trim() : '0'); if (performance.now() - t0 < 600) requestAnimationFrame(f); })(); }, { once: true }); }, sel);
    await page.mouse.move(c.x, c.y); await sleep(1100);
    const pasos = await page.evaluate(() => (window.__pasos ? window.__pasos.size : -1));
    check('el hover de las tarjetas anima en vez de saltar (' + pasos + ' pasos)', c.hover && pasos >= 3, (c.hover ? '' : 'el Chrome de prueba no reporta mouse ((hover: hover) falso) y los hover no se aplican; ') + 'transition-property=' + c.prop + ', pasos=' + pasos); await page.close(); }

  // 11. al apretar, los botones se achican un poco (confirma que el toque se registró): se mide la propiedad scale con el botón presionado
  { const page = await abrir(1280, 800, false);
    const c = await page.evaluate(() => { const r = document.querySelector('#mainHeader .hdr-row > button').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.move(c.x, c.y); await sleep(300); await page.mouse.down(); await sleep(350);
    const esc = await page.evaluate(() => getComputedStyle(document.querySelector('#mainHeader .hdr-row > button')).scale);
    await page.mouse.move(2, 600); await page.mouse.up(); // se suelta afuera: no dispara el clic ni abre la reserva
    check('los botones se achican al apretarlos (scale ' + esc + ')', parseFloat(esc) > 0.9 && parseFloat(esc) < 1, 'scale=' + esc); await page.close(); }

  // 12. los menús del encabezado animan al abrirse con el mouse y no al abrirse con el teclado (una acción de teclado no se hace esperar)
  { const page = await abrir(1280, 800, false);
    await page.click('[aria-controls="navGrp1"]'); const conMouse = await page.evaluate(() => getComputedStyle(document.getElementById('navGrp1')).animationName);
    await page.keyboard.press('Escape'); await page.focus('[aria-controls="navGrp2"]'); await page.keyboard.press('Enter');
    const conTeclado = await page.evaluate(() => getComputedStyle(document.getElementById('navGrp2')).animationName);
    check('el menú del encabezado anima con el mouse y no con el teclado', conMouse !== 'none' && conTeclado === 'none', conMouse + ' / ' + conTeclado); await page.close(); }

  // 12b. un clic en el borde vacío de un panel no lo cierra (el foco sale del botón y eso no es "salir del menú")
  { const page = await abrir(1280, 800, false);
    await page.click('[aria-controls="navGrp1"]'); await sleep(250);
    const pt = await page.evaluate(() => { const m = document.getElementById('navGrp1').getBoundingClientRect(); return { x: m.left + 3, y: m.top + m.height / 2 }; }); // medio del borde izquierdo: en las esquinas redondeadas el clic atraviesa el panel
    await page.mouse.click(pt.x, pt.y); await sleep(250);
    const abierto = await page.evaluate(() => document.querySelector('[aria-controls="navGrp1"]').getAttribute('aria-expanded'));
    check('un clic en el borde vacío del panel no lo cierra', abierto === 'true', 'aria-expanded=' + abierto); await page.close(); }

  // 13. un modal que se cierra y se vuelve a abrir enseguida queda visible (el temporizador de cierre anterior no se lo lleva por delante)
  { const page = await abrir(1280, 800, false);
    const r = await page.evaluate(async () => { const esp = (ms) => new Promise((ok) => setTimeout(ok, ms)); openBookingModal('General'); await esp(400); closeBookingModal(); await esp(60); openBookingModal('General'); await esp(500); const m = document.getElementById('bookingModal'); return { visible: !m.classList.contains('hidden'), abierto: m.classList.contains('modal-open') }; });
    check('un modal cerrado y reabierto enseguida queda visible', r.visible && r.abierto, JSON.stringify(r)); await page.close(); }

  // 14. la galería (movimiento automático) se puede pausar con un botón (WCAG 2.2.2), se reanuda y se queda quieta fuera de pantalla
  { const page = await abrir(1280, 800, false);
    const redMov = await page.evaluate(() => { const b = document.getElementById('galPause'); return { anim: getComputedStyle(document.querySelector('.gallery-track')).animationName, boton: b ? getComputedStyle(b).display : 'no existe' }; });
    check('con "reducir movimiento" la galería no se mueve y el botón de pausa se esconde', redMov.anim === 'none' && redMov.boton === 'none', JSON.stringify(redMov));
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]); await page.reload({ waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await sleep(700);
    if (!await page.$('#galPause')) check('la galería corre sola, se pausa con el botón, se reanuda y se queda quieta fuera de pantalla', false, 'no existe #galPause');
    else {
      const estado = () => page.evaluate(() => getComputedStyle(document.querySelector('.gallery-track')).animationPlayState);
      await page.evaluate(() => document.getElementById('galPause').scrollIntoView({ block: 'start', behavior: 'instant' })); await page.mouse.move(2, 2); await sleep(900); // el IntersectionObserver tarda un par de cuadros: más margen para un equipo lento
      const corre = await estado();
      const rotulo = () => page.evaluate(() => document.getElementById('galPause').innerText.trim());
      const r1 = await rotulo(); await page.click('#galPause'); await page.mouse.move(2, 2); await sleep(150); const pausada = await estado(), r2 = await rotulo();
      await page.click('#galPause'); await page.mouse.move(2, 2); await sleep(150); const reanuda = await estado();
      await page.evaluate(() => window.scrollTo(0, 0)); await sleep(800); const fuera = await estado();
      check('la galería corre sola, se pausa con el botón, se reanuda y se queda quieta fuera de pantalla', corre === 'running' && pausada === 'paused' && reanuda === 'running' && fuera === 'paused' && r1 !== r2, [corre, pausada, reanuda, fuera, r1 + ' → ' + r2].join(' / '));
    } await page.close(); }

  // 15. formulario de reserva en el celular: campos de 16 px o más (con menos, iOS agranda la página al enfocar y no la devuelve)
  { const page = await abrir(390, 844, true);
    const chicos = await page.evaluate(() => [...document.querySelectorAll('#bookingForm input:not([type=hidden]):not([type=checkbox]):not([type=radio]), #bookingForm select, #bookingForm textarea')].map((e) => (e.id || e.name) + ':' + parseFloat(getComputedStyle(e).fontSize)).filter((x) => parseFloat(x.split(':')[1]) < 16));
    check('los campos del formulario de reserva tienen 16 px o más en el celular', chicos.length === 0, chicos.join(', ')); await page.close(); }

  // 16. detalles visuales que no deben volver atrás: letra de 12 px o más, botón principal del celular de 44 px, tabla de distancias completa, temporada actual con contorno y titulares del mismo tamaño
  { const page = await abrir(390, 844, true); await recorrer(page, 844); await sleep(600);
    const chicos = await page.evaluate(() => { // La Copa tiene su propio ajuste de una sola pantalla y las marcas de pago son ilustración dibujada: quedan afuera
      const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const t = n.textContent.trim(), e = n.parentElement; if (!t || !e || e.closest('script,style,noscript,#pagos,.cup-section')) continue;
        const cs = getComputedStyle(e), r = e.getBoundingClientRect(); if (cs.display === 'none' || cs.visibility === 'hidden' || r.width < 1 || r.height < 1) continue;
        const oculto = e.closest('.hidden,[hidden]'); if (oculto && getComputedStyle(oculto).display === 'none') continue;
        if (parseFloat(cs.fontSize) < 12) out.push(cs.fontSize + ' "' + t.slice(0, 28) + '"'); }
      return [...new Set(out)]; });
    check('ningún texto visible baja de 12 px (salvo La Copa y las marcas de pago dibujadas)', chicos.length === 0, chicos.slice(0, 4).join(' | '));
    const m = await page.evaluate(() => { const b = document.querySelector('div.mbar button'), c = document.querySelector('#mapa .overflow-x-auto'); return { boton: Math.round(b.getBoundingClientRect().height), tabla: c.scrollWidth - c.clientWidth }; });
    check('el botón "Reservar Ahora" de la barra mide 44 px o más y la tabla de distancias entra sin deslizar', m.boton >= 44 && m.tabla <= 0, JSON.stringify(m));
    const t = await page.evaluate(() => { const c = [1, 2, 3, 4].map((n) => document.getElementById('seasonCard' + n)).find((e) => e && e.classList.contains('outline')); if (!c) return null; const s = getComputedStyle(c); return s.outlineStyle + ' ' + s.outlineWidth; });
    check('la temporada actual se marca con un contorno visible', t === 'solid 2px', String(t)); await page.close(); }
  { const page = await abrir(1280, 800, false);
    const tam = await page.evaluate(() => [...new Set([...document.querySelectorAll('main h2')].filter((h) => !h.closest('.cup-section') && h.getBoundingClientRect().height > 0).map((h) => getComputedStyle(h).fontSize))]);
    check('los titulares de sección tienen todos el mismo tamaño en escritorio', tam.length === 1, tam.join(' / ')); await page.close(); }

  // 17. cursor propio: solo con mouse (en celular no hay cursor) y sin pisar el de la copa arrastrable ni el de los campos de texto
  for (const [W, H, m, conMouse] of [[1280, 800, false, true], [390, 844, true, false]]) { const page = await abrir(W, H, m);
    const c = await page.evaluate(() => { const g = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).cursor : ''; }; return { cuerpo: g('#historia p'), enlace: g('#mainHeader a[href^="#"]'), copa: g('#cupCanvas'), campo: g('#bookingForm input[name]') }; });
    const propio = (v) => /url\("data:image\/svg\+xml/.test(v);
    check(conMouse ? 'el cursor propio aparece con mouse y la copa y los campos de texto conservan el suyo' : 'el cursor propio no aparece en el celular táctil',
      conMouse ? propio(c.cuerpo) && propio(c.enlace) && c.copa === 'grab' && c.campo === 'text' : !propio(c.cuerpo) && !propio(c.enlace), JSON.stringify(c).replace(/data:[^"]*/g, 'data:…')); await page.close(); }

  // 18. descorche: al hacer clic con mouse sobre algo clicable sale un corcho (~0,6 s), el clic igual funciona y el efecto se borra solo; con "reducir movimiento" no corre
  { const page = await abrir(1280, 800, false);
    const probar = async (reducir) => { await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: reducir ? 'reduce' : 'no-preference' }]); await page.reload({ waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' }); await sleep(500);
      await page.evaluate(() => document.querySelector('#faq button').scrollIntoView({ block: 'center' })); await sleep(300);
      const r = await (await page.$('#faq button')).boundingBox(), antes = await page.evaluate(() => document.querySelector('#faq button').getAttribute('aria-expanded'));
      await page.mouse.click(r.x + r.width * 0.4, r.y + r.height / 2); await sleep(90);
      const hay = await page.evaluate(() => document.querySelectorAll('.pop-corcho').length), despues = await page.evaluate(() => document.querySelector('#faq button').getAttribute('aria-expanded')); await sleep(1300);
      return { hay, funciona: antes !== despues, quedan: await page.evaluate(() => document.querySelectorAll('.pop-corcho').length) }; };
    const con = await probar(false), sin = await probar(true);
    check('el descorche aparece al hacer clic con mouse, no frena el clic y se borra solo', con.hay === 1 && con.funciona && con.quedan === 0, JSON.stringify(con));
    check('con "reducir movimiento" el descorche no corre y el clic igual funciona', sin.hay === 0 && sin.funciona, JSON.stringify(sin)); await page.close(); }

  // 19. sonido de descorche: suena una sola vez al reservar (mouse y teclado) y no en otros botones (audio simulado que solo cuenta cada "pop")
  { const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 800 });
    await page.evaluateOnNewDocument(() => { window.__plays = 0; const mk = () => ({ connect(t) { if (t === 'DEST') window.__plays++; return t; }, start() {}, stop() {}, gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, Q: { value: 0 } });
      window.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 44100; this.destination = 'DEST'; } resume() { return Promise.resolve(); } createGain() { return mk(); } createOscillator() { return mk(); } createBufferSource() { return mk(); } createBiquadFilter() { return mk(); } createBuffer(c, n) { const d = new Float32Array(n); return { getChannelData() { return d; } }; } }; });
    await page.goto(srv.url, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' }); await sleep(600);
    const RES = '#paquetes button[onclick*="openBookingModal"]', suenan = () => page.evaluate(() => window.__plays);
    const centro = async (sel) => { await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await sleep(300); return page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width * 0.4, y: r.top + r.height / 2 }; }, sel); };
    let c = await centro(RES); await page.mouse.click(c.x, c.y); await sleep(300); const conMouse = await suenan(); await page.evaluate(() => closeBookingModal()); await sleep(450);
    c = await centro('#faqBtn5'); await page.mouse.click(c.x, c.y); await sleep(300); const otro = await suenan();
    await centro(RES); await page.focus(RES); await page.keyboard.press('Enter'); await sleep(300); const conTeclado = await suenan();
    check('el sonido de descorche suena una vez al reservar con mouse y con teclado, y no en otros botones', conMouse === 1 && otro === 1 && conTeclado === 2, JSON.stringify({ mouse: conMouse, otroBoton: otro, teclado: conTeclado })); await page.close(); }

  await browser.close(); srv.cerrar();
  if (failures.length) { console.log('\n' + failures.length + ' prueba(s) fallaron:\n - ' + failures.join('\n - ')); process.exit(1); }
  console.log('\nTodas las pruebas de humo pasaron');
})().catch((e) => { console.error(e); process.exit(1); });
