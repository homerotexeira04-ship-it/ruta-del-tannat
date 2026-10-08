const puppeteer = require('/home/user/ruta-del-tannat/node_modules/puppeteer-core');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium', headless: 'new',
    args: ['--no-sandbox','--disable-dev-shm-usage','--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--force-color-profile=srgb','--disable-lcd-text','--allow-file-access-from-files','--disable-accelerated-2d-canvas'] });
  const page = await browser.newPage(); await page.setViewport({ width: 1920, height: 1080 });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto('file://' + path.join(__dirname, '..', 'index.html')); await page.evaluate(() => R.ready());
  const out = await page.evaluate((f) => {
    const gl = R.GL.gl, px = new Uint8Array(4); const sync = () => gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
    R.renderFrame(f); sync();
    const T = {}; const orig = gl.drawArrays.bind(gl); const origTex = gl.texImage2D.bind(gl);
    gl.drawArrays = (...a) => { const t0 = performance.now(); orig(...a); sync(); const vp = gl.getParameter(gl.VIEWPORT); const k = `draw ${vp[2]}x${vp[3]}`; (T[k] = T[k] || []).push(performance.now() - t0); };
    const t0 = performance.now(); R.renderFrame(f); sync(); const total = performance.now() - t0;
    const res = { total: Math.round(total) }; let sum = 0;
    for (const [k, v] of Object.entries(T)) { const s = v.reduce((a, b) => a + b, 0); sum += s; res[k] = `${v.length}x  total ${s.toFixed(0)}ms  (${(s / v.length).toFixed(0)} each)`; }
    res.non_draw = Math.round(total - sum);
    return res;
  }, +(process.argv[2] || 140));
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
