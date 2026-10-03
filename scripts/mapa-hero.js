// Regenera la imagen del mapa de la tarjeta de ruta del inicio (LaRutadelTannat_files/mapa-ruta-circuito.webp) y calcula dónde van los pines.
// Uso: node scripts/mapa-hero.js      (levanta su propio servidor, carga el mapa real del sitio y lo encuadra en las 4 estaciones; necesita internet para los mosaicos de OpenStreetMap)
// Si cambian las coordenadas de las estaciones (stationsInfo), correr esto y pegar los porcentajes que imprime en los <span class="hero-pin"> del hero (left/top).
const puppeteer = require('puppeteer-core'); const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..'); const OUT = path.join(ROOT, 'LaRutadelTannat_files', 'mapa-ruta-circuito.webp');
const CHROME = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('No encuentro Chrome: definí CHROME_PATH'); process.exit(2); }
const W = 720, H = 450, PAD = 34, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
(async () => {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p === '/') p = '/LaRutadelTannat.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  }).listen(0, '127.0.0.1'); await new Promise((r) => srv.on('listening', r));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://127.0.0.1:' + srv.address().port + '/LaRutadelTannat.html', { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.getElementById('mapa').scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.waitForFunction(() => typeof leafletMap !== 'undefined' && leafletMap && document.querySelectorAll('#leafletMap .leaflet-tile-loaded').length > 3, { timeout: 45000 });
  // se saca la capa de pines y los controles: los pines se dibujan en el HTML (.hero-pin) para que escalen con la tarjeta
  await page.evaluate((W, H, PAD) => {
    const el = document.getElementById('leafletMap'); el.style.cssText += ';position:fixed!important;left:0;top:0;right:auto;bottom:auto;width:' + W + 'px;height:' + H + 'px;z-index:99999';
    document.querySelectorAll('.leaflet-control-container, .leaflet-marker-pane, .leaflet-shadow-pane').forEach((c) => { c.style.display = 'none'; });
    leafletMap.invalidateSize(); leafletMap.fitBounds(L.latLngBounds(Object.values(stationMarkers).map((m) => m.getLatLng()).concat([thermalMarker.getLatLng()])), { padding: [PAD, PAD], animate: false });
  }, W, H, PAD);
  const pines = await page.evaluate((W, H) => [1, 2, 3, 4].map((id) => { const q = leafletMap.latLngToContainerPoint(stationMarkers[id].getLatLng()); return '0' + id + ': left:' + (q.x / W * 100).toFixed(1) + '%; top:' + (q.y / H * 100).toFixed(1) + '%'; }), W, H);
  await sleep(1500); await page.waitForFunction(() => document.querySelectorAll('#leafletMap .leaflet-tile-loading').length === 0, { timeout: 45000 }).catch(() => {}); await sleep(2500);
  const png = await (await page.$('#leafletMap')).screenshot({ type: 'png' });
  const b64 = await page.evaluate(async (data, W, H) => { const img = new Image(); img.src = 'data:image/png;base64,' + data; await img.decode(); const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(img, 0, 0, W, H); return c.toDataURL('image/webp', 0.82).split(',')[1]; }, Buffer.from(png).toString('base64'), W, H);
  fs.writeFileSync(OUT, Buffer.from(b64, 'base64'));
  console.log('imagen:', path.relative(ROOT, OUT), Math.round(fs.statSync(OUT).size / 1024) + ' KB', W + 'x' + H, '\npines (pegar en el hero):\n  ' + pines.join('\n  '));
  await browser.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
