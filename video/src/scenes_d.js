/* ============================================================
   Escenas 6–10: termas · sostenible · temporadas · paquetes · cierre
   ============================================================ */
(function () {
  const { TAU, clamp, lerp, E, seg, spring, hash, noise1, noise2, rgba, col, text, W, H, BEAT, BAR, c01 } = R;
  const cam = (ctx, ctxL, T, zoom = 1, ox = 960, oy = 540, shk = 1) => {
    const [dx, dy, r] = R.shakeAt(T, shk);
    for (const c of [ctx, ctxL]) { c.translate(W / 2 + dx, H / 2 + dy); c.rotate(r); c.scale(zoom, zoom); c.translate(-ox, -oy); }
  };
  const num = (o) => Object.assign({ weight: 800 }, o);

  /* ---------------------------------------------------------
     6 · TERMAS  (9.375 – 10.3125)
     --------------------------------------------------------- */
  R.defScene('termas', {
    fx: { bloomMul: 1.0, vig: 0.42, sat: 1.1 },
    bg: (lt, T) => ({ mode: 3, c0: c01('#0A4A52'), c1: c01('#03171C'), c2: c01('#8FE3D3'), c3: c01('#F1D9A6'), p: [0.55, 0, 0.5, 0], r: [0, 0, 0, 0.12] }),
    draw(ctx, ctxL, lt, T, scene) {
      ctx.save(); ctxL.save();
      cam(ctx, ctxL, T, 1.0 + 0.03 * seg(lt, -0.1, 1.0), 960, 540, 0.6);
      // vapor: bruma suave que sube
      for (let i = 0; i < 26; i++) {
        const h1 = hash(i * 2.3), h2 = hash(i * 5.1 + 1), h3 = hash(i * 7.7 + 3);
        const life = ((T * (0.22 + h3 * 0.2) + h1) % 1);
        const x = 160 + h2 * 1600 + Math.sin(T * 1.3 + i) * 50 * life, y = 1100 - life * 1000;
        const r = 90 + h3 * 150 + life * 120, a = Math.sin(life * Math.PI) * 0.05;
        R.glow(ctxL, x, y, r, '#CFF3EA', a);
      }
      // burbujas
      for (let i = 0; i < 22; i++) {
        const h1 = hash(i * 3.3 + 9), h2 = hash(i * 1.9 + 4), life = (T * (0.35 + h2 * 0.4) + h1) % 1;
        const x = 100 + hash(i * 6.1) * 1720 + Math.sin(T * 3 + i * 2) * 10, y = 1080 - life * 1160, r = 3 + h2 * 9;
        ctx.strokeStyle = `rgba(210,250,242,${0.5 * Math.sin(life * Math.PI)})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${0.25 * Math.sin(life * Math.PI)})`; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, TAU); ctx.fill();
      }
      // medidor de temperatura
      const CX = 640, CY = 560, RR = 330;
      const prog = E.outQt(seg(lt, 0.0, 0.85));
      const deg = Math.round(44 * prog);
      const a0 = -225 * Math.PI / 180, sweep = 270 * Math.PI / 180;
      const ap = E.outC(seg(lt, -0.1, 0.25));
      ctx.save(); ctx.globalAlpha = ap;
      for (let i = 0; i <= 60; i++) {
        const a = a0 + sweep * i / 60, big = i % 10 === 0, mid = i % 5 === 0, r1 = RR + 20, r2 = RR + (big ? 52 : mid ? 40 : 30);
        ctx.strokeStyle = i / 60 <= 44 / 60 * prog + 1e-6 ? rgba(col.goldHi, big ? 1 : 0.8) : 'rgba(190,235,226,.35)'; ctx.lineWidth = big ? 3 : 1.6;
        R.line(ctx, CX + Math.cos(a) * r1, CY + Math.sin(a) * r1, CX + Math.cos(a) * r2, CY + Math.sin(a) * r2);
        if (big) text(ctx, String(i), CX + Math.cos(a) * (RR + 84), CY + Math.sin(a) * (RR + 84) + 7, { size: 18, weight: 800, ls: 1, fill: 'rgba(210,245,236,.85)', align: 'center' });
      }
      ctx.lineCap = 'round'; ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(190,235,226,.16)'; ctx.beginPath(); ctx.arc(CX, CY, RR, a0, a0 + sweep); ctx.stroke();
      const gg = ctx.createLinearGradient(CX - RR, 0, CX + RR, 0); gg.addColorStop(0, '#7FD1C4'); gg.addColorStop(1, '#F1D9A6');
      ctx.strokeStyle = gg; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(CX, CY, RR, a0, a0 + sweep * (44 / 60) * prog); ctx.stroke();
      const ea = a0 + sweep * (44 / 60) * prog; ctx.fillStyle = '#FFF4DC'; R.circle(ctx, CX + Math.cos(ea) * RR, CY + Math.sin(ea) * RR, 14); ctx.fill();
      ctx.restore();
      R.glow(ctxL, CX + Math.cos(ea) * RR, CY + Math.sin(ea) * RR, 120, '#F1D9A6', 0.6 * ap);
      // número
      const land = lt - 0.85, bump = land > 0 ? 1 + 0.04 * Math.exp(-land / 0.1) * Math.cos(land * 40) : 1;
      ctx.save(); ctx.translate(CX, CY); ctx.scale(bump, bump); ctx.translate(-CX, -CY);
      ctx.shadowColor = 'rgba(0,30,34,.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
      text(ctx, String(deg), CX - 28, CY + 100, num({ size: 300, fill: '#FBF1E6', align: 'center', ls: -8 }));
      ctx.shadowColor = 'transparent';
      text(ctx, '°C', CX - 28 + R.textWidth({ size: 300, weight: 800, ls: -8 }, String(deg)) / 2 + 6, CY + 100, num({ size: 70, fill: col.goldHi, align: 'left' }));
      ctx.restore();
      text(ctx, 'HASTA', CX - 28, CY - 150, { size: 22, weight: 800, ls: 10, fill: col.goldL, align: 'center', alpha: E.outC(seg(lt, 0.1, 0.4)) });
      text(ctx, 'AGUA HIPERTERMAL', CX, CY + 168, { size: 19, weight: 800, ls: 9, fill: '#BDEFE4', align: 'center', alpha: E.outC(seg(lt, 0.3, 0.6)) });
      // texto derecho
      const X = 1120;
      text(ctx, 'VINO  &  AGUAS TERMALES', X, 318, { size: 19, weight: 800, ls: 8, fill: col.goldL, alpha: E.outC(seg(lt, 0.0, 0.3)) });
      ctx.strokeStyle = rgba(col.goldHi, 0.9); ctx.lineWidth = 2.5; R.line(ctx, X, 340, X + 90 * E.outQt(seg(lt, 0.05, 0.4)), 340);
      ctx.save(); ctx.shadowColor = 'rgba(0,30,34,.55)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 10;
      R.riseText(ctx, 'Termas', X - 4, 506, { size: 170, weight: 600, italic: true, serif: true, fill: '#FBF1E6', align: 'left', ls: -2 }, lt, 0.02, 0.04, 0.5, { spring: true, f: 2.3, z: 0.5, rise: 1.0 });
      ctx.restore();
      [['DEL DAYMÁN', 0.28, 590], ['DEL ARAPEY', 0.4, 650]].forEach(([t, t0, y]) => { const p = E.outQt(seg(lt, t0, t0 + 0.28)); ctx.save(); ctx.globalAlpha = p; text(ctx, t, X + (1 - p) * 40, y, { size: 38, weight: 800, ls: 9, fill: '#E9F7F2' }); ctx.restore(); });
      // chip acuífero
      const cp = spring(lt - 0.6, 2.6, 0.5);
      if (cp > 0.01) { const w = 430, h = 56, cx = X, cy = 712; ctx.save(); ctx.translate(cx + w / 2, cy + h / 2); ctx.scale(clamp(cp, 0, 1.12), clamp(cp, 0, 1.12)); ctx.translate(-(cx + w / 2), -(cy + h / 2));
        ctx.fillStyle = 'rgba(5,30,36,.82)'; R.rr(ctx, cx, cy, w, h, h / 2); ctx.fill(); ctx.strokeStyle = rgba('#8FE3D3', 0.9); ctx.lineWidth = 2; R.rr(ctx, cx, cy, w, h, h / 2); ctx.stroke();
        ctx.fillStyle = '#8FE3D3'; R.circle(ctx, cx + 30, cy + h / 2, 7); ctx.fill();
        text(ctx, 'ACUÍFERO GUARANÍ', cx + 54, cy + 35, { size: 20, weight: 800, ls: 6, fill: '#E9F7F2' }); ctx.restore(); }
      // ondas en la superficie
      for (let k = 0; k < 3; k++) { const p = ((T * 0.5 + k / 3) % 1), rx = 100 + p * 700; ctx.strokeStyle = `rgba(190,245,235,${0.28 * (1 - p)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(1400, 960, rx, rx * 0.12, 0, 0, TAU); ctx.stroke(); }
      ctx.restore(); ctxL.restore();
      R.hud(ctx, T, scene, 'dark');
    },
  });

  /* ---------------------------------------------------------
     7 · SOSTENIBLE  (10.3125 – 11.25) — columnas de basalto
     --------------------------------------------------------- */
  function hexField(ctx, ctxL, lt, T, cx, cy) {
    const r = 62, dx = r * 1.5, dy = r * Math.sqrt(3);
    for (let q = -2; q < 17; q++) for (let k = -2; k < 12; k++) {
      const x = q * dx, y = k * dy + (q % 2 ? dy / 2 : 0);
      const d = Math.hypot(x - cx, y - cy);
      const p = E.outBack(clamp((lt - 0.0 - d / 2600) / 0.4), 1.6);
      if (p <= 0.001) continue;
      const h0 = hash(q * 7.3 + k * 13.1), wave = 0.5 + 0.5 * Math.sin(d * 0.012 - T * 3.2);
      const s = r * 0.97 * clamp(p, 0, 1.2);
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; const px = x + Math.cos(a) * s, py = y + Math.sin(a) * s; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath();
      const L = 24 + h0 * 16 + wave * 14;
      ctx.fillStyle = `rgb(${L},${L * 0.97},${L * 0.94})`; ctx.fill();
      ctx.strokeStyle = rgba(col.gold, 0.1 + 0.28 * wave * wave); ctx.lineWidth = 1.6; ctx.stroke();
      if (h0 > 0.82 && wave > 0.6) { ctx.fillStyle = rgba(col.gold, 0.07); ctx.fill(); }
    }
  }
  const PRINC = ['TERROIR PROPIO', 'GRUPOS REDUCIDOS', 'BODEGAS FAMILIARES', 'SIN INTERMEDIARIOS'];
  R.defScene('sostenible', {
    fx: { bloomMul: 0.9, vig: 0.55 },
    bg: () => ({ mode: 4, c0: c01('#060606'), c1: c01('#1b1b1b'), c2: c01('#C29D62'), r: [0, 0.2, 0.1, 0.12] }),
    draw(ctx, ctxL, lt, T, scene) {
      lt += 0.1; // entra 0,1 s antes: así no hay un instante vacío mientras el whip trae esta escena
      ctx.save(); ctxL.save();
      cam(ctx, ctxL, T, 1.0 + 0.025 * seg(lt, -0.1, 1.0), 960, 540, 0.6);
      hexField(ctx, ctxL, lt + 0.05, T, 1450, 560);
      // velo oscuro a la izquierda para el texto
      const vg = ctx.createLinearGradient(0, 0, 1100, 0); vg.addColorStop(0, 'rgba(8,8,8,.92)'); vg.addColorStop(0.6, 'rgba(8,8,8,.7)'); vg.addColorStop(1, 'rgba(8,8,8,0)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, 1100, H);
      const X = 112;
      text(ctx, 'CUATRO PRINCIPIOS', X, 250, { size: 19, weight: 800, ls: 8, fill: col.goldL, alpha: E.outC(seg(lt, 0, 0.3)) });
      ctx.strokeStyle = rgba(col.gold, 0.95); ctx.lineWidth = 2.5; R.line(ctx, X, 272, X + 90 * E.outQt(seg(lt, 0.05, 0.4)), 272);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
      R.riseText(ctx, 'Sostenible', X - 4, 440, { size: 150, weight: 600, italic: true, serif: true, fill: '#FBF1E6', align: 'left', ls: -2 }, lt, 0.02, 0.032, 0.5, { spring: true, f: 2.3, z: 0.5, rise: 1.0 });
      ctx.restore();
      PRINC.forEach((t, i) => {
        const t0 = 0.22 + i * 0.1172, cp = spring(lt - t0, 2.7, 0.52); if (cp <= 0.01) return;
        const cx = X + (i % 2) * 400, cy = 508 + Math.floor(i / 2) * 78, w = 372, h = 58;
        ctx.save(); ctx.translate(cx + w / 2, cy + h / 2); ctx.scale(clamp(cp, 0, 1.1), clamp(cp, 0, 1.1)); ctx.translate(-(cx + w / 2), -(cy + h / 2));
        ctx.fillStyle = 'rgba(14,12,10,.9)'; R.rr(ctx, cx, cy, w, h, 14); ctx.fill(); ctx.strokeStyle = rgba(col.gold, 0.7); ctx.lineWidth = 1.6; R.rr(ctx, cx, cy, w, h, 14); ctx.stroke();
        ctx.fillStyle = col.gold; ctx.beginPath(); for (let j = 0; j < 6; j++) { const a = j * TAU / 6; const px = cx + 30 + Math.cos(a) * 11, py = cy + h / 2 + Math.sin(a) * 11; j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.fill();
        text(ctx, t, cx + 56, cy + 36, { size: 17, weight: 800, ls: 3.2, fill: '#F1E6D4' }); ctx.restore();
      });
      // anillo 31 %
      const RX = 1440, RY = 560, RR2 = 190, rp = E.outQt(seg(lt, 0.15, 0.85)), v = Math.round(31 * rp), ra = E.outC(seg(lt, 0.0, 0.3));
      ctx.save(); ctx.globalAlpha = ra;
      ctx.fillStyle = 'rgba(8,8,8,.86)'; R.circle(ctx, RX, RY, RR2 + 52); ctx.fill();
      ctx.lineCap = 'round'; ctx.lineWidth = 18; ctx.strokeStyle = 'rgba(194,157,98,.2)'; ctx.beginPath(); ctx.arc(RX, RY, RR2, 0, TAU); ctx.stroke();
      const rg = ctx.createLinearGradient(RX - RR2, 0, RX + RR2, 0); rg.addColorStop(0, '#C29D62'); rg.addColorStop(1, '#F1D9A6');
      ctx.strokeStyle = rg; ctx.beginPath(); ctx.arc(RX, RY, RR2, -Math.PI / 2, -Math.PI / 2 + TAU * 0.31 * rp); ctx.stroke();
      ctx.restore();
      R.glow(ctxL, RX + Math.cos(-Math.PI / 2 + TAU * 0.31 * rp) * RR2, RY + Math.sin(-Math.PI / 2 + TAU * 0.31 * rp) * RR2, 100, '#F1D9A6', 0.5 * ra);
      const land = lt - 0.85, bump = land > 0 ? 1 + 0.05 * Math.exp(-land / 0.1) * Math.cos(land * 40) : 1;
      ctx.save(); ctx.translate(RX, RY); ctx.scale(bump, bump); ctx.translate(-RX, -RY);
      text(ctx, String(v), RX - 22, RY + 52, num({ size: 150, fill: '#FBF1E6', align: 'center', ls: -5 }));
      text(ctx, '%', RX + R.textWidth({ size: 150, weight: 800, ls: -5 }, String(v)) / 2 - 8, RY - 10, num({ size: 64, fill: col.goldHi, align: 'left' }));
      ctx.restore();
      text(ctx, 'SUPERFICIE VITÍCOLA', RX, RY + 100, { size: 15, weight: 800, ls: 5, fill: col.goldL, align: 'center', alpha: ra });
      text(ctx, 'CERTIFICADA · INAVI · 2023', RX, RY + 126, { size: 15, weight: 800, ls: 5, fill: col.goldL, align: 'center', alpha: ra });
      ctx.restore(); ctxL.restore();
      R.hud(ctx, T, scene, 'dark');
    },
  });

  /* ---------------------------------------------------------
     8 · CUATRO TEMPORADAS  (11.25 – 12.1875)
     --------------------------------------------------------- */
  const SEAS = [
    { name: 'Vendimia', m: 'DIC — MAR', d: 'Cosecha en vivo y pisada de uvas', c0: '#F2B94B', c1: '#8E4F18', ic: 'sun' },
    { name: 'Día del Tannat', m: 'ABR — MAY', d: '14 de abril · festivales vascos', c0: '#D4573A', c1: '#4F1612', ic: 'leaf' },
    { name: 'Cavas y fogones', m: 'JUN — AGO', d: 'Gran Reserva junto al fuego', c0: '#4A557A', c1: '#150F24', ic: 'flame' },
    { name: 'Brotación', m: 'SEP — NOV', d: 'Picnics y bicicleta entre viñas', c0: '#A8C25A', c1: '#2E4620', ic: 'sprout' },
  ];
  const ICO = {
    sun(c, T, k) { c.save(); c.rotate(T * 0.6); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, l = (i % 2 ? 40 : 62) * k; c.strokeStyle = '#FFF3C4'; c.lineWidth = 7; c.lineCap = 'round'; R.line(c, Math.cos(a) * 92, Math.sin(a) * 92, Math.cos(a) * (92 + l), Math.sin(a) * (92 + l)); } c.restore(); const g = c.createRadialGradient(-14, -14, 4, 0, 0, 80); g.addColorStop(0, '#FFFBE8'); g.addColorStop(1, '#FFD36A'); c.fillStyle = g; R.circle(c, 0, 0, 78); c.fill(); },
    leaf(c, T, k) { // racimo de uvas con hoja
      c.save(); c.rotate(Math.sin(T * 2.4) * 0.05); c.scale(k, k);
      const rows = [[-1.5, -0.5, 0.5, 1.5], [-1, 0, 1], [-0.5, 0.5], [0]];
      rows.forEach((row, ri) => row.forEach((xi, ci) => { const x = xi * 46, y = -52 + ri * 44, g = c.createRadialGradient(x - 8, y - 9, 2, x, y, 26); g.addColorStop(0, '#B25C86'); g.addColorStop(0.45, '#5E1A4A'); g.addColorStop(1, '#2A0A22'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 25, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,225,240,.7)'; c.beginPath(); c.arc(x - 8, y - 9, 5, 0, TAU); c.fill(); }));
      c.strokeStyle = '#E8F0B0'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -78); c.quadraticCurveTo(10, -104, 26, -112); c.stroke();
      c.fillStyle = '#9DBB4A'; c.beginPath(); c.moveTo(24, -112); c.bezierCurveTo(54, -150, 108, -134, 112, -96); c.bezierCurveTo(78, -86, 44, -92, 24, -112); c.fill();
      c.restore();
    },
    flame(c, T, k) { for (const [s, col1, off] of [[1, '#FF8A3D', 0], [0.7, '#FFC15A', 1.3], [0.42, '#FFF0B8', 2.6]]) { c.fillStyle = col1; c.beginPath(); const w = 70 * s * k, h = 150 * s * k * (1 + 0.08 * Math.sin(T * 14 + off)); const sw = Math.sin(T * 9 + off) * 8 * s; c.moveTo(sw, -h); c.bezierCurveTo(w * 0.9 + sw, -h * 0.35, w, h * 0.1, 0, h * 0.5); c.bezierCurveTo(-w, h * 0.1, -w * 0.9 + sw, -h * 0.35, sw, -h); c.fill(); } },
    sprout(c, T, k) { c.strokeStyle = '#E8F5B8'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 110); c.quadraticCurveTo(-6, 20 * k, 0, -50 * k); c.stroke(); for (const s of [-1, 1]) { c.save(); c.translate(0, -40 * k); c.rotate(s * (0.5 + 0.08 * Math.sin(T * 3))); c.scale(k, k); const g = c.createLinearGradient(0, 0, 90 * s, -40); g.addColorStop(0, '#E6F7A8'); g.addColorStop(1, '#7FA43A'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(50 * s, -64, 104 * s, -20); c.quadraticCurveTo(50 * s, 22, 0, 0); c.fill(); c.restore(); } },
  };
  R.defScene('temporadas', {
    fx: { bloomMul: 0.8, vig: 0.4 },
    bg: () => ({ mode: 4, c0: c01('#0a0608'), c1: c01('#1c1014'), r: [0, 0, 0, 0] }),
    draw(ctx, ctxL, lt, T, scene) {
      ctx.save(); ctxL.save();
      cam(ctx, ctxL, T, 1.0, 960, 540, 0.5);
      SEAS.forEach((s, i) => {
        const t0 = -0.02 + i * 0.1172, e = spring(lt - t0, 2.2, 0.62), x = i * 480, y = (1 - clamp(e, 0, 1.06)) * 1100;
        if (e <= 0.001) return;
        ctx.save(); ctx.translate(x, y);
        const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, s.c0); g.addColorStop(1, s.c1); ctx.fillStyle = g; ctx.fillRect(0, -40, 481, H + 80);
        // grano de luz diagonal
        const lg = ctx.createLinearGradient(0, 0, 480, 0); lg.addColorStop(0, 'rgba(255,255,255,.14)'); lg.addColorStop(1, 'rgba(0,0,0,.18)'); ctx.fillStyle = lg; ctx.fillRect(0, -40, 481, H + 80);
        // número fantasma
        text(ctx, '0' + (i + 1), 240, 1000, num({ size: 330, fill: 'rgba(255,255,255,.07)', align: 'center', ls: -10 }));
        // ícono
        const k = E.outBack(clamp((lt - t0 - 0.08) / 0.4), 1.8);
        ctx.save(); ctx.translate(240, 410); ICO[s.ic](ctx, T, k); ctx.restore();
        R.glow(ctxL, x + 240, y + 410, 280, s.c0, 0.2 * clamp(e));
        // textos
        const o = { size: 56, weight: 600, italic: true, serif: true, fill: '#FFF8EC', align: 'center', ls: -1 };
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
        R.riseText(ctx, s.name, 240, 660, o, lt, t0 + 0.2, 0.014, 0.4); ctx.restore();
        text(ctx, s.m, 240, 716, { size: 22, weight: 800, ls: 8, fill: 'rgba(255,248,236,.92)', align: 'center', alpha: E.outC(seg(lt, t0 + 0.3, t0 + 0.5)) });
        text(ctx, s.d, 240, 772, { size: 18, weight: 600, ls: 0.6, fill: 'rgba(255,248,236,.8)', align: 'center', alpha: E.outC(seg(lt, t0 + 0.34, t0 + 0.55)) });
        ctx.restore();
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; R.line(ctx, x + 480, 0, x + 480, H);
      });
      // 14 de abril
      const bp = spring(lt - 0.62, 2.6, 0.5);
      if (bp > 0.01) { ctx.save(); ctx.translate(850, 262); ctx.rotate(-0.1); ctx.scale(clamp(bp, 0, 1.15), clamp(bp, 0, 1.15));
        ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = '#FBF1E6'; R.rr(ctx, -150, -62, 300, 124, 20); ctx.fill(); ctx.shadowColor = 'transparent';
        text(ctx, '14', -62, 36, num({ size: 92, fill: col.wine, align: 'center', ls: -3 })); text(ctx, 'ABRIL', 52, -4, { size: 26, weight: 800, ls: 5, fill: col.wine, align: 'center' }); text(ctx, 'DÍA NACIONAL', 52, 26, { size: 15, weight: 800, ls: 3, fill: col.terroir, align: 'center' }); text(ctx, 'DEL TANNAT', 52, 46, { size: 15, weight: 800, ls: 3, fill: col.terroir, align: 'center' }); ctx.restore(); }
      // título flotante
      const ta = E.outC(seg(lt, 0.3, 0.6));
      ctx.save(); ctx.globalAlpha = ta; ctx.fillStyle = 'rgba(14,6,8,.78)'; R.rr(ctx, 560, 122, 800, 60, 30); ctx.fill(); text(ctx, '¿CUÁNDO VIVIRLO?  ·  CUATRO TEMPORADAS', 960 + 3, 160, { size: 22, weight: 800, ls: 6, fill: '#FBF1E6', align: 'center' }); ctx.restore();
      ctx.restore(); ctxL.restore();
      R.hud(ctx, T, scene, 'dark');
    },
  });

  /* ---------------------------------------------------------
     9 · PAQUETES + RESERVA  (12.1875 – 13.125)
     --------------------------------------------------------- */
  R.defScene('paquetes', {
    fx: { bloomMul: 0.15, bloomThr: 0.96, vig: 0.25, grain: 0.028 },
    bg: () => ({ mode: 1, c0: c01('#F7F0E4'), c1: c01('#D2BE98'), c2: c01('#FFF3D6') }),
    draw(ctx, ctxL, lt, T, scene) {
      ctx.save(); ctxL.save();
      cam(ctx, ctxL, T, 1.0 + 0.015 * seg(lt, 0, 1), 960, 540, 0.5);
      const INK = col.deep, WINE = col.wine;
      text(ctx, 'EXPERIENCIAS CURADAS', 960, 188, { size: 20, weight: 800, ls: 10, fill: col.goldD, align: 'center', alpha: E.outC(seg(lt, -0.1, 0.25)) });
      R.riseText(ctx, 'Paquetes y visitas guiadas', 960, 262, { size: 62, weight: 600, italic: true, serif: true, fill: INK, align: 'center', ls: -1 }, lt, -0.05, 0.012, 0.45);
      const cards = [
        { x: 250, t: 'VINOS E HISTORIAS', h: '4 HORAS', p: 45, dark: false, lines: ['Visita guiada a Bodega Harriague', 'Cata de 3 varietales', 'Traslado incluido'] },
        { x: 1030, t: 'EL LEGADO DEL TANNAT', h: '8 HORAS', p: 95, dark: true, lines: ['Las 4 estaciones del circuito', 'Almuerzo maridaje de 3 pasos', 'Cata guiada de 6 vinos'] },
      ];
      cards.forEach((c, i) => {
        const t0 = 0.0 + i * 0.117, e = spring(lt - t0, 2.3, 0.6); if (e <= 0.01) return;
        const w = 640, h = 560, y = 312 + (1 - clamp(e, 0, 1.05)) * 240;
        ctx.save(); ctx.translate(c.x + w / 2, y + h / 2); ctx.rotate((1 - clamp(e, 0, 1)) * (i ? 0.06 : -0.06)); ctx.translate(-(c.x + w / 2), -(y + h / 2));
        ctx.shadowColor = 'rgba(74,16,29,.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24;
        ctx.fillStyle = c.dark ? '#5a1424' : '#FFFBF3'; R.rr(ctx, c.x, y, w, h, 28); ctx.fill(); ctx.shadowColor = 'transparent';
        if (c.dark) { const g = ctx.createLinearGradient(c.x, y, c.x + w, y + h); g.addColorStop(0, '#7B1C30'); g.addColorStop(1, '#3a0a16'); ctx.fillStyle = g; R.rr(ctx, c.x, y, w, h, 28); ctx.fill(); }
        ctx.strokeStyle = rgba(col.gold, c.dark ? 0.9 : 0.6); ctx.lineWidth = 2; R.rr(ctx, c.x + 10, y + 10, w - 20, h - 20, 20); ctx.stroke();
        const fgc = c.dark ? '#FBF1E6' : INK, acc = c.dark ? col.goldHi : WINE;
        text(ctx, c.h, c.x + 44, y + 78, { size: 19, weight: 800, ls: 7, fill: c.dark ? col.goldL : col.goldD });
        text(ctx, c.t, c.x + 44, y + 128, { size: 36, weight: 600, italic: false, serif: true, fill: fgc });
        const pr = E.outQt(seg(lt, t0 + 0.12, t0 + 0.55)), val = Math.round(c.p * pr);
        text(ctx, 'USD', c.x + 44, y + 288, { size: 34, weight: 800, ls: 4, fill: acc });
        text(ctx, String(val), c.x + 138, y + 308, num({ size: 170, fill: acc, ls: -6 }));
        text(ctx, 'POR PERSONA', c.x + 44, y + 352, { size: 16, weight: 800, ls: 6, fill: c.dark ? '#E9DCC4' : col.terroir });
        c.lines.forEach((l, j) => { const la = E.outC(seg(lt, t0 + 0.26 + j * 0.07, t0 + 0.5 + j * 0.07)); ctx.save(); ctx.globalAlpha = la; ctx.fillStyle = acc; R.circle(ctx, c.x + 52, y + 412 + j * 44 - 6, 5); ctx.fill(); text(ctx, l, c.x + 74, y + 412 + j * 44, { size: 23, weight: 600, fill: c.dark ? '#F3E7D6' : INK }); ctx.restore(); });
        if (c.dark) { const rp = spring(lt - 0.35, 2.6, 0.5); if (rp > 0.01) { ctx.save(); ctx.translate(c.x + w - 110, y + 54); ctx.rotate(0.12); ctx.scale(clamp(rp, 0, 1.1), clamp(rp, 0, 1.1)); ctx.fillStyle = col.gold; R.rr(ctx, -92, -22, 184, 44, 22); ctx.fill(); text(ctx, 'RECOMENDADO', 0, 8, { size: 15, weight: 800, ls: 3, fill: col.deep, align: 'center' }); ctx.restore(); } }
        ctx.restore();
      });
      // burbuja de WhatsApp
      const wp = spring(lt - 0.62, 2.5, 0.5);
      if (wp > 0.01) { const bx = 960, by = 930; ctx.save(); ctx.translate(bx, by); ctx.scale(clamp(wp, 0, 1.12), clamp(wp, 0, 1.12));
        ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; ctx.fillStyle = '#128C7E'; R.rr(ctx, -330, -42, 660, 84, 42); ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#25D366'; R.circle(ctx, -280, 0, 28); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-280, 0, 14, 0.5, TAU - 0.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-292, 14); ctx.lineTo(-296, 24); ctx.lineTo(-284, 19); ctx.stroke();
        text(ctx, 'Reservá por WhatsApp', -236, 11, { size: 31, weight: 800, fill: '#fff' }); ctx.restore(); }
      // idiomas
      ['ES', 'PT', 'EN'].forEach((l, i) => { const p = spring(lt - 0.72 - i * 0.06, 2.6, 0.5); if (p <= 0.01) return; ctx.save(); ctx.translate(1590 + i * 84, 930); ctx.scale(clamp(p, 0, 1.15), clamp(p, 0, 1.15)); ctx.fillStyle = i === 0 ? WINE : 'rgba(114,27,40,.12)'; R.circle(ctx, 0, 0, 34); ctx.fill(); text(ctx, l, 0, 9, { size: 25, weight: 800, ls: 2, fill: i === 0 ? '#FBF1E6' : WINE, align: 'center' }); ctx.restore(); });
      text(ctx, 'PRECIOS DE REFERENCIA', 250, 944, { size: 15, weight: 700, ls: 3, fill: col.terroir, alpha: 0.85 * E.outC(seg(lt, 0.5, 0.8)) });
      ctx.restore(); ctxL.restore();
      R.hud(ctx, T, scene, 'light');
    },
  });

  /* ---------------------------------------------------------
     10 · CIERRE  (13.125 – 15.0)
     --------------------------------------------------------- */
  R.defScene('final', {
    fx: { bloomMul: 1.1, vig: 0.5 },
    bg: () => ({ mode: 0, c0: c01('#14030a'), c1: c01('#52101f'), c2: c01('#a53347'), c3: c01('#ffe2c8'), p: [1.4, 2.4, 0.9, 0.24], q: [-0.5, 0.7, 26, 0.5], r: [0, 7, 2, 0.28] }),
    draw(ctx, ctxL, lt, T, scene) {
      ctx.save(); ctxL.save();
      const slow = 1 + 0.035 * E.outC(seg(lt, 0, 1.9));
      cam(ctx, ctxL, T, slow, 960, 540, 1.0);
      R.motes(ctxL, T, { n: 60, seed: 41, alpha: 1.0 });
      const bp = R.beatEnv(T, 0.2);
      // onda de choque del golpe
      const sp = clamp(lt / 0.7); if (sp < 1) { ctxL.strokeStyle = rgba(col.goldHi, 0.9 * (1 - sp)); ctxL.lineWidth = 14 * (1 - sp) + 1; ctxL.beginPath(); ctxL.arc(960, 540, 2000 * E.outQt(sp), 0, TAU); ctxL.stroke(); }
      R.glow(ctxL, 960, 540, 900, '#C23A55', 0.4 * Math.exp(-lt / 0.4));
      // rosetón + bisel
      R.guilloche(ctx, 960, 560, 520, { K: 50, n: 13, rot: lt * 0.3, prog: E.outC(seg(lt, 0, 0.8)), alpha: 0.75 });
      R.ticks(ctx, 960, 560, 566, { n: 144, rot: -lt * 0.1, prog: E.outC(seg(lt, 0, 0.7)), alpha: 0.7 });
      // sello 1874
      const sp2 = E.outC(seg(lt, 0.15, 0.55)), sy = 258;
      ctx.save(); ctx.globalAlpha = sp2;
      ctx.strokeStyle = rgba(col.goldHi, 0.9); ctx.lineWidth = 2; R.line(ctx, 960 - 150, sy, 960 - 54, sy); R.line(ctx, 960 + 54, sy, 960 + 150, sy);
      text(ctx, '1874', 960, sy + 9, num({ size: 26, fill: col.goldHi, align: 'center', ls: 4 })); ctx.restore();
      // título
      const o = { size: 168, weight: 600, italic: true, serif: true, fill: '#FBF1E6', align: 'center', ls: -3 };
      const sc2 = 1 + 0.02 * bp * seg(lt, 0.4, 0.6);
      ctx.save(); ctx.translate(960, 520); ctx.scale(sc2, sc2); ctx.translate(-960, -520);
      ctx.shadowColor = 'rgba(20,0,6,.6)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 16;
      R.riseText(ctx, 'La Ruta del Tannat', 960, 500, o, lt, 0.0, 0.026, 0.55, { spring: true, f: 2.4, z: 0.5, rise: 1.0 });
      ctx.restore();
      // lema
      const lp = E.outQt(seg(lt, 0.35, 0.8)), oS = { size: 29, weight: 800, ls: 15, fill: col.goldL, align: 'center' };
      const tw = R.textWidth(oS, 'CEPA, ORIGEN E IDENTIDAD');
      text(ctx, 'CEPA, ORIGEN E IDENTIDAD', 960 + 7, 590, Object.assign({ alpha: E.outC(seg(lt, 0.4, 0.75)) }, oS));
      ctx.strokeStyle = rgba(col.gold, 0.95); ctx.lineWidth = 2; R.line(ctx, 960 - tw / 2 - 36, 580, 960 - tw / 2 - 36 - 230 * lp, 580); R.line(ctx, 960 + tw / 2 + 36, 580, 960 + tw / 2 + 36 + 230 * lp, 580);
      // dirección web
      const up = E.outC(seg(lt, 0.5, 0.8));
      ctx.save(); ctx.globalAlpha = up; ctx.fillStyle = 'rgba(14,3,8,.55)'; R.rr(ctx, 960 - 480, 646, 960, 62, 31); ctx.fill(); ctx.strokeStyle = rgba(col.gold, 0.7); ctx.lineWidth = 1.5; R.rr(ctx, 960 - 480, 646, 960, 62, 31); ctx.stroke();
      text(ctx, 'homerotexeira04-ship-it.github.io/ruta-del-tannat', 960 + 1, 686, { size: 27, weight: 700, ls: 1.4, fill: '#FBF1E6', align: 'center' }); ctx.restore();
      // equipo
      const ep = E.outC(seg(lt, 0.62, 0.9));
      text(ctx, 'FEDERICO CAMARA  ·  HOMERO TEXEIRA  ·  ANTHONY MOREIRA', 960 + 2, 770, { size: 23, weight: 800, ls: 6, fill: col.goldHi, align: 'center', alpha: ep });
      text(ctx, 'Tecnicatura en Diseño de Itinerarios Turísticos Sostenibles  ·  Polo Educativo Tecnológico Salto · UTU', 960, 806, { size: 18, weight: 600, ls: 1, fill: '#E9DCC4', align: 'center', alpha: ep * 0.9 });
      // chips de capacidades
      const chips = ['ES · PT · EN', 'MAPA', 'LA COPA INTERACTIVA', 'FUNCIONA SIN CONEXIÓN'];
      const widths = chips.map((c) => R.textWidth({ size: 16, weight: 800, ls: 3.4 }, c) + 44), gap = 14, totalW = widths.reduce((a, b) => a + b, 0) + gap * 3;
      let cx = 960 - totalW / 2;
      chips.forEach((c, i) => { const p = spring(lt - 0.74 - i * 0.1, 2.9, 0.52), w = widths[i]; if (p > 0.01) { ctx.save(); ctx.translate(cx + w / 2, 876); ctx.scale(clamp(p, 0, 1.12), clamp(p, 0, 1.12)); ctx.fillStyle = 'rgba(14,3,8,.7)'; R.rr(ctx, -w / 2, -22, w, 44, 22); ctx.fill(); ctx.strokeStyle = rgba(col.goldL, 0.8); ctx.lineWidth = 1.5; R.rr(ctx, -w / 2, -22, w, 44, 22); ctx.stroke(); text(ctx, c, 1.5, 6, { size: 16, weight: 800, ls: 3.4, fill: '#F6EBDD', align: 'center' }); ctx.restore(); } cx += w + gap; });
      // crédito del reel
      text(ctx, 'MOTION DESIGN  ·  SOUND DESIGN  ·  100 % CÓDIGO', 960, 950, { size: 16, weight: 700, ls: 8, fill: col.goldL, align: 'center', alpha: 0.85 * E.outC(seg(lt, 1.0, 1.3)) });
      ctx.restore(); ctxL.restore();
      R.hud(ctx, T, scene, 'dark');
    },
  });
})();
