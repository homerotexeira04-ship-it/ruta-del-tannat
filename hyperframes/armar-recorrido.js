// Genera hyperframes/recorrido.html con la ruta real (TRAMOS del sitio, ya proyectada en hyperframes/ruta.json).
const fs = require('fs'); const path = require('path');
const DIR = process.argv[2];
const R = JSON.parse(fs.readFileSync(path.join(DIR, 'ruta.json'), 'utf8'));
const P = R.pins;
// Paradas en el orden de «Armá tu día» (ordenMiDia: Harriague primero, Termas al final); lado de la tarjeta y su alto (y) en el cuadro
const paradas = [
  { k: '1', num: '01', sup: 'Espacio Cultural', nom: 'Bodega Harriague', img: '8254D59E-F679-48CA-94EB-EC6CFB40EC77.webp', lado: 'izq', y: 352 },
  { k: '2', num: '02', sup: 'Bodega', nom: 'Salto Chico', img: 'salto-chico-cartel-inavi.webp', lado: 'izq', y: 96 },
  { k: '3', num: '03', sup: 'Bodega', nom: 'Bertolini & Broglio', img: 'bertolini-broglio-inavi.jpg', lado: 'der', y: 852 },
  { k: '4', num: '04', sup: 'Mori Maglio', nom: 'Wines', img: '138db8c89a626f5efc0f940f343ad390bf0ec8ca.jpg', lado: 'der', y: 618 },
  { k: 't', num: '', sup: 'Termas', nom: 'del Daymán', img: 'termas-dayman.webp', lado: 'der', y: 470 },
];
// el marcador de las termas va corrido arriba a la izquierda (está a 500 m de Mori Maglio) con una línea a su punto real
const marca = (k) => (k === 't' ? [P.t[0] - 34, P.t[1] - 30] : P[k]);
const CARD_W = 270, CARD_H = 112;
const cardX = (p) => (p.lado === 'izq' ? 44 : 1080 - 44 - CARD_W);
const esc = (s) => s.replace(/&/g, '&amp;');

const tarjetas = paradas.map((p, i) => {
  const [mx, my] = marca(p.k); const x = cardX(p); const cy = p.y + CARD_H / 2;
  const ax = p.lado === 'izq' ? x + CARD_W : x; // punto de la tarjeta donde arranca la guía
  return `
      <svg class="guia" id="g${i}" viewBox="0 0 1080 1080"><path d="M${ax} ${cy} L${mx} ${my}" pathLength="1" /></svg>
      <div class="tarjeta ${p.lado}" id="c${i}" style="left:${x}px; top:${p.y}px">
        <img src="img/${p.img}" alt="">
        <div>${p.num ? `<span class="num">${p.num}</span>` : ''}<span class="sup">${esc(p.sup)}</span><span class="nom">${esc(p.nom)}</span></div>
      </div>`;
}).join('');

const pines = paradas.map((p, i) => {
  const [mx, my] = marca(p.k);
  const real = p.k === 't' ? `<svg class="guia fina" viewBox="0 0 1080 1080"><path d="M${mx} ${my} L${P.t[0]} ${P.t[1]}"/></svg><span class="punto" style="left:${P.t[0]}px; top:${P.t[1]}px"></span>` : '';
  return `${real}
      <div class="pin ${p.k === 't' ? 'termas' : ''}" id="p${i}" style="left:${mx}px; top:${my}px"><span>${p.num || '♨'}</span></div>
      <div class="onda" id="o${i}" style="left:${mx}px; top:${my}px"></div>`;
}).join('');

const tramos = R.legs.map((l, i) => `<path class="tramo" id="t${i}" d="${l.d}" pathLength="1" />`).join('\n        ');
const etiquetas = R.legs.map((l, i) => `<div class="tiempo" id="e${i}">${l.min} min</div>`).join('');

// tiempos (s): parada i aparece en LLEGA[i]; el tramo i se dibuja de SALE[i] a LLEGA[i+1]
const LLEGA = [0.6, 2.9, 6.2, 7.9, 8.9];
const SALE = [1.4, 3.7, 7.0, 8.6];
const totalKm = Math.round(R.total.km), totalMin = R.total.min;

const html = `<!doctype html>
<!-- El recorrido de La Ruta del Tannat en un día (12 s, 1080×1080). Ruta real: tramos de OpenStreetMap que usa «Armá tu día»
     (TRAMOS en LaRutadelTannat.html), en el mismo orden que «Armá tu día» con todo marcado. Sin texto traducible: nombres propios, números, km y min.
     Render: npx hyperframes render -c recorrido.html -f 30 --crf 30 -o ../LaRutadelTannat_files/video-recorrido.mp4 -->
<html lang="es" style="overflow:hidden; margin:0">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080, height=1080" />
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@hyperframes/core/dist/hyperframe.runtime.iife.js"></script>
  <style>
    @font-face { font-family: "Playfair Display"; font-weight: 400 900; font-style: normal; font-display: block; src: url(fonts/playfair-display-latin.woff2) format("woff2"); }
    @font-face { font-family: "Plus Jakarta Sans"; font-weight: 200 800; font-style: normal; font-display: block; src: url(fonts/plus-jakarta-sans-latin.woff2) format("woff2"); }
    :root { --bg: #1D060D; --vino: #721B28; --oro: #C5A059; --oro-claro: #DFCA9D; --crema: #FDFBF7; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 1080px; height: 1080px; overflow: hidden; background: var(--bg); color: var(--crema); font-family: "Plus Jakarta Sans", sans-serif; }
    .scene { position: absolute; inset: 0; width: 1080px; height: 1080px; overflow: hidden;
      background: radial-gradient(ellipse 60% 70% at 52% 50%, #3a0f1c 0%, rgba(29,6,13,0) 70%), var(--bg); }
    svg.mapa, svg.guia { position: absolute; inset: 0; width: 1080px; height: 1080px; overflow: visible; }
    .reticula line { stroke: rgba(223,202,157,.07); stroke-width: 1; }
    .tramo { fill: none; stroke: var(--oro); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; filter: drop-shadow(0 0 6px rgba(197,160,89,.45)); }
    .tramo-fondo { fill: none; stroke: rgba(253,251,247,.08); stroke-width: 11; stroke-linecap: round; stroke-linejoin: round; }
    svg.guia path { fill: none; stroke: rgba(223,202,157,.55); stroke-width: 1.5; stroke-dasharray: 1; stroke-dashoffset: 1; }
    svg.guia.fina path { stroke: rgba(223,202,157,.6); stroke-dasharray: 3 4; stroke-dashoffset: 0; }
    .punto { position: absolute; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; background: var(--oro-claro); }
    .pin { position: absolute; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%; background: var(--vino); border: 3px solid var(--oro);
      display: grid; place-items: center; box-shadow: 0 4px 14px rgba(0,0,0,.5); }
    .pin span { font: 700 17px/1 "Plus Jakarta Sans", sans-serif; color: var(--crema); letter-spacing: .02em; }
    .pin.termas { background: #0f4c5c; border-color: var(--oro-claro); }
    .pin.termas span { font-size: 22px; }
    .onda { position: absolute; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%; border: 2px solid var(--oro); opacity: 0; }
    .tarjeta { position: absolute; width: ${CARD_W}px; height: ${CARD_H}px; display: flex; align-items: center; gap: 14px; padding: 10px;
      border-radius: 16px; background: rgba(253,251,247,.06); border: 1px solid rgba(197,160,89,.35); box-shadow: 0 10px 30px rgba(0,0,0,.35); }
    .tarjeta.der { flex-direction: row-reverse; text-align: right; }
    .tarjeta img { width: 92px; height: 92px; border-radius: 11px; object-fit: cover; flex-shrink: 0; }
    .tarjeta .num { display: block; font: 700 14px/1 "Plus Jakarta Sans", sans-serif; letter-spacing: .2em; color: var(--oro); margin-bottom: 6px; }
    .tarjeta .sup { display: block; font: 600 15px/1.2 "Plus Jakarta Sans", sans-serif; color: rgba(253,251,247,.7); }
    .tarjeta .nom { display: block; font: 700 23px/1.12 "Playfair Display", Georgia, serif; color: var(--crema); }
    .tiempo { position: absolute; padding: 7px 13px; border-radius: 999px; background: rgba(29,6,13,.85); border: 1px solid rgba(197,160,89,.6);
      font: 700 17px/1 "Plus Jakarta Sans", sans-serif; color: var(--oro-claro); white-space: nowrap; transform: translate(-50%, -50%); }
    .viajero { position: absolute; width: 16px; height: 16px; margin: -8px 0 0 -8px; border-radius: 50%; background: var(--crema);
      box-shadow: 0 0 0 4px rgba(197,160,89,.45), 0 0 18px rgba(255,236,190,.9); opacity: 0; }
    .norte { position: absolute; left: 980px; top: 40px; width: 56px; text-align: center; color: var(--oro-claro); font: 700 18px/1 "Plus Jakarta Sans", sans-serif; }
    .norte svg { display: block; margin: 6px auto 0; }
    .escala { position: absolute; left: 44px; top: 1020px; color: rgba(223,202,157,.75); font: 600 15px/1 "Plus Jakarta Sans", sans-serif; }
    .escala i { display: block; height: 6px; width: ${Math.round(R.escala_px_por_km * 5)}px; border: 2px solid rgba(223,202,157,.75); border-top: 0; margin-bottom: 7px; }
    .total { position: absolute; left: 780px; top: 92px; width: 256px; text-align: right; }
    .total .min { display: block; font: 700 96px/1 "Playfair Display", Georgia, serif; color: var(--crema); }
    .total .km { display: block; margin-top: 10px; font: 600 26px/1 "Plus Jakarta Sans", sans-serif; letter-spacing: .14em; color: var(--oro); }
    .total i { display: block; height: 2px; background: var(--oro); margin: 18px 0 0 auto; width: 150px; transform-origin: 100% 50%; }
  </style>
</head>
<body>
  <div id="main" data-composition-id="main" data-width="1080" data-height="1080" data-start="0" data-duration="12" data-fps="30">
    <div class="scene clip" id="s1" data-start="0" data-duration="12" data-track-index="0">
      <svg class="mapa" viewBox="0 0 1080 1080" aria-hidden="true">
        <g class="reticula" id="ret">${Array.from({ length: 10 }, (_, i) => `<line x1="${108 * (i + 0.5)}" y1="0" x2="${108 * (i + 0.5)}" y2="1080"/><line x1="0" y1="${108 * (i + 0.5)}" x2="1080" y2="${108 * (i + 0.5)}"/>`).join('')}</g>
        ${R.legs.map((l) => `<path class="tramo-fondo" d="${l.d}" />`).join('\n        ')}
        ${tramos}
      </svg>
      ${tarjetas}
      ${pines}
      ${etiquetas}
      <div class="viajero" id="viajero"></div>
      <div class="norte" id="norte">N<svg width="18" height="26" viewBox="0 0 18 26"><path d="M9 0 L18 26 L9 20 L0 26 Z" fill="#C5A059"/></svg></div>
      <div class="escala" id="escala"><i></i>5 km</div>
      <div class="total" id="total"><span class="min" id="totMin">${totalMin} min</span><span class="km">${totalKm} KM</span><i id="totLinea"></i></div>
    </div>
  </div>
  <script>
    window.__timelines = window.__timelines || {};
    var tl = gsap.timeline({ paused: true });
    var LLEGA = ${JSON.stringify(LLEGA)}, SALE = ${JSON.stringify(SALE)};
    var viajero = document.getElementById('viajero');

    // ubica las etiquetas de tiempo en la mitad de cada tramo, corridas hacia afuera de la ruta
    [0, 1, 2, 3].forEach(function (i) {
      var p = document.getElementById('t' + i), L = p.getTotalLength(), m = p.getPointAtLength(L * 0.5), q = p.getPointAtLength(L * 0.52);
      var nx = -(q.y - m.y), ny = q.x - m.x, n = Math.hypot(nx, ny) || 1, off = i === 3 ? 52 : 46;
      var e = document.getElementById('e' + i); e.style.left = (m.x + nx / n * off) + 'px'; e.style.top = (m.y + ny / n * off) + 'px';
    });

    tl.from('#ret', { autoAlpha: 0, duration: 1.2, ease: 'sine.out' }, 0);
    tl.from('#norte', { autoAlpha: 0, y: -12, duration: .7, ease: 'power2.out' }, .3);
    tl.from('#escala', { autoAlpha: 0, x: -14, duration: .7, ease: 'power2.out' }, .4);

    LLEGA.forEach(function (t, i) {
      var der = document.getElementById('c' + i).classList.contains('der');
      tl.from('#p' + i, { scale: 0, autoAlpha: 0, duration: .45, ease: 'back.out(2.2)' }, t);
      tl.fromTo('#o' + i, { scale: 1, autoAlpha: .9 }, { scale: 2.6, autoAlpha: 0, duration: 1.1, ease: 'power2.out', immediateRender: false }, t + .1);
      tl.to('#g' + i + ' path', { strokeDashoffset: 0, duration: .4, ease: 'power2.inOut' }, t + .2);
      tl.from('#c' + i, { autoAlpha: 0, x: der ? 30 : -30, duration: .55, ease: 'power3.out' }, t + .3);
      tl.from('#c' + i + ' img', { scale: 1.15, duration: 1.4, ease: 'power2.out' }, t + .3);
    });
    tl.set('#o0, #o1, #o2, #o3, #o4', { autoAlpha: 0 }, 0);

    SALE.forEach(function (t0, i) {
      var p = document.getElementById('t' + i), L = p.getTotalLength(), dur = LLEGA[i + 1] - t0, avance = { v: 0 };
      tl.to(p, { strokeDashoffset: 0, duration: dur, ease: 'power1.inOut' }, t0);
      tl.set(viajero, { autoAlpha: 1 }, t0);
      tl.to(avance, { v: 1, duration: dur, ease: 'power1.inOut', onUpdate: function () {
        var q = p.getPointAtLength(L * avance.v); viajero.style.left = q.x + 'px'; viajero.style.top = q.y + 'px'; } }, t0);
      tl.set(viajero, { autoAlpha: 0 }, t0 + dur);
      tl.from('#e' + i, { autoAlpha: 0, scale: .7, duration: .4, ease: 'back.out(1.8)' }, t0 + dur * .5);
    });

    // cierre: la ruta brilla entera y aparece el total
    tl.to('.tramo', { strokeWidth: 7, duration: .6, ease: 'sine.inOut' }, 9.4);
    tl.from('#total .min', { autoAlpha: 0, y: 24, duration: .7, ease: 'power3.out' }, 9.5);
    tl.from('#total .km', { autoAlpha: 0, y: 14, duration: .6, ease: 'power2.out' }, 9.75);
    tl.from('#totLinea', { scaleX: 0, duration: .7, ease: 'expo.out' }, 9.9);
    var c = { v: 0 }; tl.to(c, { v: ${totalMin}, duration: 1.1, ease: 'power2.out', onUpdate: function () { document.getElementById('totMin').textContent = Math.round(c.v) + ' min'; } }, 9.5);
    tl.set({}, {}, 12);
    window.__timelines['main'] = tl;
  </script>
</body>
</html>
`;
fs.writeFileSync(path.join(DIR, 'recorrido.html'), html);
console.log('recorrido.html listo');
