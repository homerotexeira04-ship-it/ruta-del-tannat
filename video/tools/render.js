// Driver de render: abre N Chromium en paralelo y guarda cada cuadro como JPEG.
// Uso: node tools/render.js --out DIR [--frames 0,60,120 | --range 0-899 | --step 30] [--workers 3] [--q 0.97] [--N 5]
const puppeteer = require('/home/user/ruta-del-tannat/node_modules/puppeteer-core');
const fs = require('fs'); const path = require('path');
const a = process.argv.slice(2);
const arg = (k, d) => { const i = a.indexOf('--' + k); return i < 0 ? d : a[i + 1]; };
const out = arg('out', '/tmp/frames'); fs.mkdirSync(out, { recursive: true });
const workers = +arg('workers', 3); const q = +arg('q', 0.97); const Nover = arg('N', null);
const TOTAL = 900;
let frames = [];
if (arg('frames')) frames = arg('frames').split(',').map(Number);
else {
  const [r0, r1] = (arg('range', '0-' + (TOTAL - 1))).split('-').map(Number); const step = +arg('step', 1);
  for (let f = r0; f <= r1; f += step) frames.push(f);
}
if (arg('skip-existing', '0') === '1') frames = frames.filter((f) => !fs.existsSync(path.join(out, 'f' + String(f).padStart(4, '0') + '.jpg')));
const pageUrl = 'file://' + path.join(__dirname, '..', 'index.html');
const ARGS = ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--force-color-profile=srgb', '--disable-lcd-text', '--allow-file-access-from-files', '--disable-accelerated-2d-canvas', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'];

(async () => {
  const t0 = Date.now(); let done = 0;
  const queue = frames.slice();
  async function worker(id) {
    const browser = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium', headless: 'new', args: ARGS });
    const page = await browser.newPage(); await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => console.error('[pageerror]', e.message));
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.error('[console]', m.text().slice(0, 400)); });
    await page.goto(pageUrl); await page.evaluate(() => R.ready());
    while (queue.length) {
      const f = queue.shift();
      const data = await page.evaluate((f, q, N) => { R.renderFrame(f, N ? { N: +N } : {}); return R.grab(q); }, f, q, Nover);
      fs.writeFileSync(path.join(out, 'f' + String(f).padStart(4, '0') + '.jpg'), Buffer.from(data.split(',')[1], 'base64'));
      done++;
      if (done % 20 === 0 || done === frames.length) {
        const el = (Date.now() - t0) / 1000; process.stdout.write(`\r${done}/${frames.length}  ${el.toFixed(0)}s  ETA ${(el / done * (frames.length - done)).toFixed(0)}s   `);
      }
    }
    await browser.close();
  }
  await Promise.all(Array.from({ length: Math.min(workers, frames.length) }, (_, i) => worker(i)));
  console.log(`\nlisto: ${frames.length} cuadros en ${((Date.now() - t0) / 1000).toFixed(1)}s`);
})().catch((e) => { console.error(e); process.exit(1); });
