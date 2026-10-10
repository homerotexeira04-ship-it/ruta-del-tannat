// Dibuja el panorama 360° ilustrado del sitio (ver README.md de esta carpeta). Sirve index.html + scene.js + three desde node_modules, abre Chrome con WebGL por software,
// saca 6 vistas normales y arma la proyección equirrectangular (2:1) acá mismo.
// Uso:  node scripts/panorama-360/render.js panorama [size=4096] [centro=315] [out=panorama.png]
//       node scripts/panorama-360/render.js vistas <acimut,acimut,...> [pitch=0] [fov=70] [w=900] [h=560] [out=vistas]   (vistas rectilíneas para mirar o para el póster)
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('puppeteer-core'); const sharp = require('sharp');
const HERE = __dirname, ROOT = path.join(HERE, '../..'), THREE_DIR = process.env.THREE_DIR || path.join(ROOT, 'node_modules/three');
const CHROME = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('No encuentro Chrome: definí CHROME_PATH'); process.exit(2); }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json' };
const modo = process.argv[2]; const args = Object.fromEntries(process.argv.slice(3).filter((a) => a.includes('=')).map((a) => [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)]));
const lista = process.argv[3] && !process.argv[3].includes('=') ? process.argv[3].split(',').map(Number) : [];
if (!['panorama', 'vistas'].includes(modo)) { console.error('Uso: render.js panorama|vistas (ver el encabezado del archivo)'); process.exit(2); }
(async () => {
  if (!fs.existsSync(THREE_DIR)) { console.error('Falta three: corré  npm i --no-save three sharp  (solo para esto, no queda en package.json)'); process.exit(2); }
  const srv = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p === '/') p = '/index.html'; const f = p.startsWith('/three/') ? path.join(THREE_DIR, p.slice(7)) : path.join(HERE, p);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('no'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => srv.on('listening', r));
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 900000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const p = await b.newPage(); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) console.log('consola:', m.text().slice(0, 200)); }); await p.setViewport({ width: 800, height: 600 });
    await p.goto('http://127.0.0.1:' + srv.address().port + '/?' + (args.q || ''), { waitUntil: 'load' });
    await Promise.race([p.waitForFunction('window.__ready === true', { timeout: 600000 }), new Promise((_, no) => p.once('pageerror', (e) => no(new Error('la escena falló al armarse: ' + e.message))))]);
    if (modo === 'vistas') {
      const w = +args.w || 900, h = +args.h || 560, out = path.resolve(args.out || path.join(HERE, 'vistas')); fs.mkdirSync(out, { recursive: true });
      for (const yaw of lista) { const url = await p.evaluate((o) => window.__view(o), { yaw, pitch: +args.pitch || 0, fov: +args.fov || 70, w, h }); const f = path.join(out, 'vista-' + String(yaw).padStart(3, '0') + '.png'); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log('vista', yaw + '° →', f); }
    } else {
      // 6 vistas de 92° (se solapan para que no se vean costuras) y proyección equirrectangular con supermuestreo 2x2
      const S = +args.face || 2048, W = +args.size || 4096, H = W / 2, CENTRO = args.centro === undefined ? 315 : +args.centro, FOV = 92, K = 1 / Math.tan(FOV / 2 * Math.PI / 180), D = Math.PI / 180, base = [];
      for (const [yaw, pitch] of [[0, 0], [90, 0], [180, 0], [270, 0], [0, 90], [0, -90]]) {
        const url = await p.evaluate((o) => window.__view(o), { yaw, pitch, fov: FOV, w: S, h: S }); const raw = await sharp(Buffer.from(url.split(',')[1], 'base64')).removeAlpha().raw().toBuffer(); const a = yaw * D, e = pitch * D;
        const f = [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)], rt = [Math.cos(a), 0, Math.sin(a)], up = [rt[1] * f[2] - rt[2] * f[1], rt[2] * f[0] - rt[0] * f[2], rt[0] * f[1] - rt[1] * f[0]]; base.push({ raw, f, rt, up }); console.log('cara', yaw, pitch);
      }
      const out = Buffer.alloc(W * H * 3), SS = 2;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let R = 0, G = 0, B = 0;
        for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
          const lon = ((x + (sx + 0.5) / SS) / W - 0.5) * 2 * Math.PI + CENTRO * D, lat = (0.5 - (y + (sy + 0.5) / SS) / H) * Math.PI; const dx = Math.cos(lat) * Math.sin(lon), dy = Math.sin(lat), dz = -Math.cos(lat) * Math.cos(lon);
          let mejor = null, md = -2; for (const c of base) { const d = dx * c.f[0] + dy * c.f[1] + dz * c.f[2]; if (d > md) { md = d; mejor = c; } }
          const xc = (dx * mejor.rt[0] + dy * mejor.rt[1] + dz * mejor.rt[2]) / md, yc = (dx * mejor.up[0] + dy * mejor.up[1] + dz * mejor.up[2]) / md, px = (xc * K * 0.5 + 0.5) * S - 0.5, py = (0.5 - yc * K * 0.5) * S - 0.5;
          const x0 = Math.max(0, Math.min(S - 2, Math.floor(px))), y0 = Math.max(0, Math.min(S - 2, Math.floor(py))), fx = Math.min(1, Math.max(0, px - x0)), fy = Math.min(1, Math.max(0, py - y0)), i00 = (y0 * S + x0) * 3, i10 = i00 + 3, i01 = i00 + S * 3, i11 = i01 + 3, m = mejor.raw;
          for (let ch = 0; ch < 3; ch++) { const v = (m[i00 + ch] * (1 - fx) + m[i10 + ch] * fx) * (1 - fy) + (m[i01 + ch] * (1 - fx) + m[i11 + ch] * fx) * fy; if (ch === 0) R += v; else if (ch === 1) G += v; else B += v; } }
        const o = (y * W + x) * 3, n = SS * SS; out[o] = R / n; out[o + 1] = G / n; out[o + 2] = B / n; }
      const f = path.resolve(args.out || path.join(HERE, 'panorama.png')); await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toFile(f); console.log('panorama', W + 'x' + H, '→', f);
    }
  } finally { await b.close(); srv.close(); }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
