#!/usr/bin/env node
// Genera el PDF del guion de recorrido desde FichasPatrimonialesSalto-GuionDeRecorrido.md.
// Sin dependencias: convierte el Markdown a HTML y lo imprime con Chromium headless.
//   node guion-pdf/build.js            -> FichasPatrimonialesSalto-GuionDeRecorrido.pdf
// Las fotos reales se declaran en guion-pdf/fotos.json (archivos en guion-pdf/fotos/).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const ROOT = path.join(HERE, '..');
const SRC = path.join(ROOT, 'FichasPatrimonialesSalto-GuionDeRecorrido.md');
const OUT = path.join(ROOT, 'FichasPatrimonialesSalto-GuionDeRecorrido.pdf');
const HTML = path.join(HERE, 'build', 'guion.html');

// Ilustraciones de las fichas originales: el guion las nombra como Figura X.1 / X.2.
const FIGURAS = {
  parada1: [
    { file: 'figuras/fig-1-1.jpg', cap: '<b>Figura 1.1 · Imagen de época</b> (c. 1911-1930). Tienda «París Londres»: marquesina, letrero y vidrieras de la planta baja.' },
    { file: 'figuras/fig-1-2.jpg', cap: '<b>Figura 1.2 · Estado actual.</b> «El Revoltijo Electrodomésticos»: planta baja modernizada, balcones y frontón de 1911 conservados.' },
  ],
  parada2: [
    { file: 'figuras/fig-2-1.jpg', cap: '<b>Figura 2.1 · Imagen de época</b> (c. 1900). Residencia señorial frente a la Plaza 18 de Julio: simetría, zaguán y pilastras.' },
    { file: 'figuras/fig-2-2.jpg', cap: '<b>Figura 2.2 · Estado actual.</b> Sede del Consulado Argentino: mástil con bandera, placa de bronce, rejas de seguridad.' },
  ],
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');

// --- Markdown mínimo (solo lo que usa el guion) -> bloques ---
function parse(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }
    let m;
    if ((m = ln.match(/^(#{1,4}) (.*)$/))) { out.push({ t: 'h', l: m[1].length, text: m[2] }); i++; continue; }
    if (/^---+$/.test(ln.trim())) { out.push({ t: 'hr' }); i++; continue; }
    if (ln.startsWith('>')) {
      const paras = [[]];
      while (i < lines.length && lines[i].startsWith('>')) {
        const body = lines[i].replace(/^>\s?/, '');
        if (!body.trim()) paras.push([]); else paras[paras.length - 1].push(body);
        i++;
      }
      out.push({ t: 'bq', paras: paras.filter((p) => p.length).map((p) => p.join(' ')) });
      continue;
    }
    if (ln.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++; }
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      out.push({ t: 'table', head: cells(rows[0]), rows: rows.slice(2).map(cells) });
      continue;
    }
    if (/^\d+\. /.test(ln)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, '')); i++; }
      out.push({ t: 'ol', items });
      continue;
    }
    if (/^- /.test(ln)) {
      const items = [];
      while (i < lines.length && /^- /.test(lines[i])) { items.push(lines[i].slice(2)); i++; }
      out.push({ t: 'ul', items });
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4} |>|\||---|\d+\. |- )/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push({ t: 'p', text: para.join(' ') });
  }
  return out;
}

// --- Fotos y figuras ---
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, 'fotos.json'), 'utf8'));
const slotOk = (s) => s.file && fs.existsSync(path.join(HERE, 'fotos', s.file));
let pendientes = 0;

function relImg(p) { return path.relative(path.dirname(HTML), path.join(HERE, p)).split(path.sep).join('/'); }

function figurasHtml(key) {
  const f = FIGURAS[key].map((x) => `<figure><img src="${relImg(x.file)}" alt=""><figcaption>${x.cap}</figcaption></figure>`).join('');
  return `<div class="figuras">${f}<p class="nota-fig">Ilustraciones de las fichas originales.</p></div>`;
}

function fotosHtml(key) {
  const slots = manifest[key];
  if (!slots || !slots.length) return '';
  const cls = slots.length === 1 ? 'n1' : slots.length === 2 ? 'n2' : 'n3';
  const items = slots.map((s) => {
    if (slotOk(s)) {
      const credit = s.credit ? `<span class="cr">${esc(s.credit)}</span>` : '';
      return `<figure><img src="${relImg('fotos/' + s.file)}" alt="${esc(s.caption || s.descripcion)}"><figcaption>${esc(s.caption || s.descripcion)}${credit}</figcaption></figure>`;
    }
    pendientes++;
    return `<figure class="pendiente"><div class="ph">Foto real pendiente</div><figcaption>${esc(s.descripcion)}</figcaption></figure>`;
  }).join('');
  return `<div class="fotos ${cls}">${items}</div>`;
}

function creditosHtml() {
  const rows = [];
  for (const k of Object.keys(manifest)) {
    for (const s of manifest[k] || []) if (slotOk(s) && s.credit) rows.push(`<li>${esc(s.caption || s.descripcion)} — ${esc(s.credit)}</li>`);
  }
  const base = '<li>Figuras 1.1, 1.2, 2.1 y 2.2: ilustraciones de las <em>Fichas Arquitectónicas Patrimoniales</em> (Salto, setiembre de 2026).</li>';
  return `<h3 class="sub">Créditos de las imágenes</h3><ul class="lista">${base}${rows.join('')}</ul>`;
}

// --- Render ---
function renderTable(tb) {
  const rows = tb.rows.map((r) => `<tr><th>${inline(r[0])}</th><td>${inline(r[1] || '')}</td></tr>`).join('');
  return `<table class="ficha"><caption>${inline(tb.head[0])}</caption>${rows}</table>`;
}

function render(tokens) {
  let title = '', subtitle = '', intro = [];
  const sections = [];
  let cur = null;
  for (const b of tokens) {
    if (b.t === 'h' && b.l === 1) { title = b.text; continue; }
    if (b.t === 'h' && b.l === 3 && /^Notas para el equipo/.test(b.text)) break; // no va en el PDF
    if (b.t === 'h' && b.l === 2) { cur = { title: b.text, blocks: [] }; sections.push(cur); continue; }
    if (!cur) {
      if (b.t === 'p' && !subtitle) subtitle = b.text;
      else if (b.t === 'bq') intro = b.paras;
      continue;
    }
    if (b.t === 'hr') continue;
    cur.blocks.push(b);
  }

  const cover = `<section class="portada">
  <p class="kicker">Patrimonio de Salto · Guion de recorrido</p>
  <h1>${inline(title)}</h1>
  <p class="sub1">${inline(subtitle)}</p>
  <div class="intro">${intro.map((p) => `<p>${inline(p)}</p>`).join('')}</div>
  <p class="pie-portada">Salto, República Oriental del Uruguay · Setiembre de 2026</p>
</section>`;

  let paradaN = 0;
  const body = sections.map((s) => {
    const isParada = /^Parada \d/.test(s.title);
    if (isParada) paradaN++;
    const key = 'parada' + paradaN;
    const [label, ...rest] = s.title.split(' · ');
    let html = isParada
      ? `<section class="parada"><header><span class="etq">${inline(label)}</span><h2>${inline(rest.join(' · '))}</h2></header>`
      : `<section class="cierre"><h2 class="h2c">${inline(s.title)}</h2>`;
    let inClaves = false;
    for (let k = 0; k < s.blocks.length; k++) {
      const b = s.blocks[k];
      if (b.t === 'table') { html += renderTable(b); if (isParada) html += fotosHtml(key); continue; }
      if (b.t === 'h' && b.l === 3) {
        if (/^3 claves/.test(b.text)) { html += `<div class="claves"><h3>${inline(b.text)}</h3>`; inClaves = true; }
        else html += `<h3 class="sub">${inline(b.text)}</h3>`;
        continue;
      }
      if (b.t === 'h' && b.l === 4) {
        const m = b.text.match(/^(\d+)\. (.*)$/);
        html += `<h4>${m ? `<span class="num">${m[1]}</span>${inline(m[2])}` : inline(b.text)}</h4>`;
        if (/^2\. Lectura de fachada/.test(b.text) && FIGURAS[key]) html += figurasHtml(key);
        continue;
      }
      if (b.t === 'p') { html += `<p>${inline(b.text)}</p>`; continue; }
      if (b.t === 'ol') { html += `<ol>${b.items.map((x) => `<li>${inline(x)}</li>`).join('')}</ol>`; if (inClaves) { html += '</div>'; inClaves = false; } continue; }
      if (b.t === 'ul') { html += `<ul class="lista">${b.items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`; continue; }
    }
    if (/^Fuentes/.test(s.title)) html += creditosHtml();
    return html + '</section>';
  }).join('\n');

  return { cover, body };
}

function findChrome() {
  const c = [process.env.CHROME, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium', 'chromium', 'chromium-browser', 'google-chrome'].filter(Boolean);
  for (const p of c) {
    try { if (p.includes('/') ? fs.existsSync(p) : execFileSync('which', [p]).length) return p; } catch (e) { /* siguiente */ }
  }
  throw new Error('No encontré Chromium; definí CHROME=/ruta/al/chrome');
}

const { cover, body } = render(parse(fs.readFileSync(SRC, 'utf8')));
fs.mkdirSync(path.dirname(HTML), { recursive: true });
const css = fs.readFileSync(path.join(HERE, 'estilo.css'), 'utf8');
const borrador = pendientes > 0 ? '<div class="borrador">Borrador · faltan fotos reales</div>' : '';
const portada = cover.replace('<section class="portada">', `<section class="portada">${borrador}`);
fs.writeFileSync(HTML, `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Salto a pie: dos edificios para leer la ciudad</title><style>${css}</style></head><body>${portada}${body}</body></html>`);

execFileSync(findChrome(), ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${OUT}`, 'file://' + HTML], { stdio: 'ignore' });
console.log(`PDF: ${path.relative(process.cwd(), OUT)}  ·  fotos reales pendientes: ${pendientes}`);
