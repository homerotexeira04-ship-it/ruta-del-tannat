// Chequeos estáticos del sitio, sin dependencias. Uso: node scripts/check.js [--links]
//   (sin flags)  archivos referenciados que existan, anclas, ids repetidos, JSON-LD válido, idiomas ES/PT/EN al día, rel="noopener", alt, título/descripción.
//   --links      además, verifica los enlaces externos (solo 404/410/dominio caído son error; el resto avisa: muchos sitios bloquean scripts).
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ROOT = path.join(__dirname, '..'); const DIR = 'LaRutadelTannat_files';
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const errors = [], warns = []; const fail = (m) => errors.push(m);
const html = read('LaRutadelTannat.html');
const markup = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, ''); // solo el HTML "de verdad"

// ---------- 1. archivos referenciados ----------
{
  const sources = ['LaRutadelTannat.html', 'index.html', '404.html', 'manifest.json', 'sw.js']
    .concat(fs.readdirSync(path.join(ROOT, DIR)).filter((f) => /\.(js|css)$/.test(f)).map((f) => DIR + '/' + f));
  let n = 0;
  for (const f of sources) {
    const s = read(f);
    for (const m of s.matchAll(new RegExp(DIR + '/([A-Za-z0-9._%@()-]+)', 'g'))) { n++; const p = DIR + '/' + decodeURIComponent(m[1]); if (!exists(p)) fail('falta el archivo ' + p + ' (citado en ' + f + ')'); }
    if (f === 'sw.js') for (const m of s.matchAll(/'\.\/([A-Za-z0-9._-]+)'/g)) { n++; if (!exists(m[1])) fail('falta ' + m[1] + ' (citado en sw.js)'); }
    if (/^(LaRutadelTannat|index|404)\.html$/.test(f)) for (const m of s.replace(/<script[\s\S]*?<\/script>/g, '').matchAll(/(?:href|src)="\.\/([A-Za-z0-9._-]+)"/g)) { n++; if (!exists(m[1])) fail('falta ' + m[1] + ' (citado en ' + f + ')'); }
  }
  console.log('archivos citados verificados:', n);
}

// ---------- 2. anclas e ids ----------
{
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]); const seen = new Set();
  for (const id of ids) { if (seen.has(id)) fail('id repetido: ' + id); seen.add(id); }
  const allIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of markup.matchAll(/href="#([^"]+)"/g)) if (!allIds.has(m[1])) fail('ancla sin destino: #' + m[1]);
  console.log('ids:', ids.length, '| anclas verificadas');
}

// ---------- 3. JSON-LD, rel="noopener", alt, título y descripción ----------
{
  let n = 0; for (const b of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { n++; try { JSON.parse(b[1]); } catch (e) { fail('JSON-LD inválido: ' + e.message); } }
  console.log('bloques JSON-LD válidos:', n);
  for (const t of markup.match(/<a\b[^>]*target="_blank"[^>]*>/g) || []) if (!/rel="[^"]*noopener/.test(t)) fail('target=_blank sin rel=noopener: ' + t.slice(0, 90));
  for (const t of markup.match(/<img\b[^>]*>/g) || []) if (!/\salt=/.test(t)) fail('<img> sin alt: ' + t.slice(0, 90));
  const title = (/<title>([^<]*)<\/title>/.exec(html) || [])[1] || ''; if (!title || title.length > 70) fail('título vacío o de más de 70 caracteres (' + title.length + ')');
  const desc = (/<meta name="description" content="([^"]*)"/.exec(html) || [])[1] || ''; if (desc.length < 100 || desc.length > 170) fail('meta description fuera de 100–170 caracteres (' + desc.length + ')');
}

// ---------- 4. idiomas ----------
let T;
{
  const i = html.indexOf('const translations = '); if (i < 0) throw new Error('no encuentro "const translations"');
  let depth = 0, j = html.indexOf('{', i), k = j;
  for (; k < html.length; k++) { const c = html[k]; if (c === '{') depth++; else if (c === '}') { depth--; if (!depth) break; } else if (c === '"' || c === "'" || c === '`') { const q = c; k++; while (html[k] !== q) { if (html[k] === '\\') k++; k++; } } }
  T = vm.runInNewContext('(' + html.slice(j, k + 1) + ')');
  const langs = Object.keys(T); const all = new Set(langs.flatMap((l) => Object.keys(T[l])));
  for (const l of langs) { const miss = [...all].filter((x) => !(x in T[l])); if (miss.length) fail('faltan en ' + l + ': ' + miss.slice(0, 8).join(', ') + (miss.length > 8 ? ' … (' + miss.length + ')' : '')); }
  const ph = (s) => (String(s).match(/\{[A-Za-z0-9_]+\}/g) || []).sort().join(',');
  for (const key of Object.keys(T.es)) for (const l of langs) if (T[l][key] !== undefined && ph(T[l][key]) !== ph(T.es[key])) fail('marcadores {…} distintos en ' + key + ' (' + l + ')');
  for (const m of html.matchAll(/data-i18n(?:-ph|-aria)?="([^"]+)"/g)) if (!(m[1] in T.es)) fail('data-i18n sin texto: ' + m[1]);
  console.log('idiomas:', langs.join('/'), '| claves por idioma:', langs.map((l) => Object.keys(T[l]).length).join('/'));
}

// ---------- 5. enlaces externos (solo con --links) ----------
(async () => {
  if (process.argv.includes('--links')) {
    const skip = /openstreetmap\.org\/copyright|leafletjs\.com\/?$|fonts\.g|tile\.openstreetmap|w3\.org|schema\.org|wa\.me|api\.whatsapp|script\.google\.com/;
    const urls = [...new Set([...markup.matchAll(/(?:href|src)="(https?:\/\/[^"#]+)/g)].map((m) => m[1]))].filter((u) => !skip.test(u));
    const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
    await Promise.all(urls.map(async (u) => {
      try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 25000); const r = await fetch(u, { redirect: 'follow', headers: { 'user-agent': ua, accept: 'text/html,*/*' }, signal: c.signal }); clearTimeout(t);
        if (r.status === 404 || r.status === 410) fail('enlace roto (' + r.status + '): ' + u); else if (r.status >= 400) warns.push('responde ' + r.status + ' (puede bloquear scripts): ' + u);
      } catch (e) { const code = e.cause && e.cause.code; if (code === 'ENOTFOUND') fail('dominio inexistente: ' + u); else warns.push('sin respuesta (' + (code || e.name) + '): ' + u); }
    }));
    console.log('enlaces externos revisados:', urls.length);
  }
  warns.forEach((w) => console.log('AVISO ' + w));
  if (errors.length) { errors.forEach((e) => console.log('ERROR ' + e)); console.log('\n' + errors.length + ' problema(s)'); process.exit(1); }
  console.log('\nTodo en orden');
})();
