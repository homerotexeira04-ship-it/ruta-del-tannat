const puppeteer = require('/home/user/ruta-del-tannat/node_modules/puppeteer-core'); const path = require('path'); const fs = require('fs');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage(); page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto('file://' + path.join(__dirname, '..', 'index.html')); await page.evaluate(() => R.ready());
  const ev = await page.evaluate(() => R.EVENTS);
  fs.writeFileSync(path.join(__dirname, '..', 'timeline.json'), JSON.stringify(ev, null, 1));
  console.log('timeline.json', Object.keys(ev.ev).length, 'eventos;', 'rutaNodes', ev.ev.rutaNodes, 'odoTicks', ev.ev.odoTicks.length);
  await browser.close();
})();
