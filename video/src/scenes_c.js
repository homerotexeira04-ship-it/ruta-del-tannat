/* ============================================================
   Escenas 4–5: La Copa de Tannat y las 4 Estaciones
   ============================================================ */
(function () {
  const { TAU, clamp, lerp, E, seg, spring, hash, noise1, rgba, col, text, W, H, BEAT, BAR, c01 } = R;
  const num = (o) => Object.assign({ weight: 800 }, o);
  const cam = (ctx, ctxL, T, zoom = 1, ox = 960, oy = 540, shk = 1) => {
    const [dx, dy, r] = R.shakeAt(T, shk);
    for (const c of [ctx, ctxL]) { c.translate(W / 2 + dx, H / 2 + dy); c.rotate(r); c.scale(zoom, zoom); c.translate(-ox, -oy); }
  };

  /* ---------- íconos de aromas (dibujados, 0,0 = centro, radio ~ 22) ---------- */
  const ICON = {
    mora(c, s) { // racimo de mora/ciruela
      c.fillStyle = '#5E1A4A'; for (const [x, y] of [[-8, 4], [8, 4], [0, 12], [-4, -5], [5, -4]]) { c.beginPath(); c.arc(x * s, y * s, 7 * s, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(255,200,230,.7)'; c.beginPath(); c.arc(-6 * s, 1 * s, 2 * s, 0, TAU); c.fill();
      c.fillStyle = '#6E9A3A'; c.beginPath(); c.ellipse(4 * s, -15 * s, 8 * s, 4 * s, -0.6, 0, TAU); c.fill();
    },
    violeta(c, s) {
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; c.fillStyle = i % 2 ? '#8A6CC6' : '#7358B5'; c.beginPath(); c.ellipse(Math.cos(a) * 9 * s, Math.sin(a) * 9 * s, 8 * s, 5 * s, a, 0, TAU); c.fill(); }
      c.fillStyle = '#F1D27A'; c.beginPath(); c.arc(0, 0, 4 * s, 0, TAU); c.fill();
    },
    pimienta(c, s) {
      for (const [x, y, r] of [[-8, 5, 7], [8, 4, 7], [0, -7, 7.5]]) { const g = c.createRadialGradient((x - 2) * s, (y - 2) * s, 1, x * s, y * s, r * s); g.addColorStop(0, '#6a6a6a'); g.addColorStop(1, '#161616'); c.fillStyle = g; c.beginPath(); c.arc(x * s, y * s, r * s, 0, TAU); c.fill(); }
    },
    vainilla(c, s) {
      c.strokeStyle = '#3B2514'; c.lineWidth = 7 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(-14 * s, 12 * s); c.quadraticCurveTo(-2 * s, -16 * s, 15 * s, -10 * s); c.stroke();
      c.strokeStyle = '#8A6038'; c.lineWidth = 2.5 * s; c.beginPath(); c.moveTo(-13 * s, 11 * s); c.quadraticCurveTo(-2 * s, -15 * s, 14 * s, -10 * s); c.stroke();
    },
    chocolate(c, s) {
      for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { c.fillStyle = (i + j) % 2 ? '#5A3220' : '#4A2616'; R.rr(c, (-13 + j * 9.2) * s, (-9 + i * 10) * s, 8.4 * s, 9.2 * s, 1.6 * s); c.fill(); }
      c.fillStyle = 'rgba(255,220,190,.35)'; c.fillRect(-13 * s, -9 * s, 26 * s, 1.6 * s);
    },
  };
  const AROMAS = [
    { k: 'mora', t: 'MORA Y CIRUELA', x: 330, y: 280 },
    { k: 'violeta', t: 'VIOLETA', x: 930, y: 330 },
    { k: 'pimienta', t: 'PIMIENTA NEGRA', x: 300, y: 560 },
    { k: 'vainilla', t: 'VAINILLA Y TOSTADO', x: 946, y: 640 },
    { k: 'chocolate', t: 'CHOCOLATE Y TABACO', x: 370, y: 850 },
  ];

  /* ---------- la copa ---------- */
  function glass(ctx, ctxL, gx, gy, T, lt, amp) {
    // geometría (gy = y de la base del vaso). Todo en coordenadas locales
    const rimY = gy - 640, midY = gy - 470, botY = gy - 190, stemY = gy - 28;
    const bowlHalf = (y) => { // radio de la copa en y
      const u = clamp((y - rimY) / (botY - rimY));
      if (u < 0.3) { const k = u / 0.3; return lerp(150, 214, k * k * (3 - 2 * k)); }
      const v = (u - 0.3) / 0.7; return 214 * Math.sqrt(Math.max(0, 1 - Math.pow(v, 2.1))) * (1 - 0.0 * v) + 6 * v;
    };
    const bowl = () => {
      ctx.beginPath(); ctx.moveTo(gx - bowlHalf(rimY), rimY);
      for (let y = rimY; y <= botY; y += 6) ctx.lineTo(gx - bowlHalf(y), y);
      ctx.lineTo(gx - 6, botY + 8); ctx.lineTo(gx + 6, botY + 8);
      for (let y = botY; y >= rimY; y -= 6) ctx.lineTo(gx + bowlHalf(y), y);
      ctx.closePath();
    };
    // sombra / halo detrás
    R.glow(ctxL, gx, gy - 400, 560, '#B22A44', 0.26 * amp);
    // pie y tallo
    const stemG = ctx.createLinearGradient(gx - 9, 0, gx + 9, 0); stemG.addColorStop(0, 'rgba(255,255,255,.55)'); stemG.addColorStop(0.5, 'rgba(255,255,255,.12)'); stemG.addColorStop(1, 'rgba(255,255,255,.4)');
    ctx.fillStyle = stemG; ctx.fillRect(gx - 8, botY, 16, stemY - botY);
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.ellipse(gx, gy, 150, 24, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(gx, gy, 150, 24, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(gx, gy - 8, 134, 19, 0, 0, TAU); ctx.stroke();
    // vidrio (relleno tenue)
    bowl(); const gg = ctx.createLinearGradient(gx - 220, 0, gx + 220, 0);
    gg.addColorStop(0, 'rgba(255,255,255,.12)'); gg.addColorStop(0.5, 'rgba(255,255,255,.03)'); gg.addColorStop(1, 'rgba(255,255,255,.1)');
    ctx.fillStyle = gg; ctx.fill();
    // vino
    ctx.save(); bowl(); ctx.clip();
    const lvl = midY + 0, Rl = bowlHalf(lvl);
    const ph = lt * 7.4, A = (30 + 28 * Math.sin(lt * 5.1)) * amp;
    const pts = [];
    const N = 72;
    for (let i = 0; i <= N; i++) {
      const th = i / N * TAU, wave = Math.pow(0.5 + 0.5 * Math.cos(th - ph), 2.6);
      const rr_ = Rl * (1 + 0.035 * Math.cos(th - ph) * amp);
      pts.push([gx + rr_ * Math.cos(th), lvl + rr_ * 0.17 * Math.sin(th) - A * wave * (0.55 + 0.45 * Math.sin(th))]);
    }
    // cuerpo (hacia abajo desde el frente de la superficie)
    const body = ctx.createLinearGradient(0, lvl - 60, 0, botY + 20);
    body.addColorStop(0, 'rgba(120,20,48,.92)'); body.addColorStop(0.35, 'rgba(66,8,30,.96)'); body.addColorStop(1, 'rgba(20,2,12,1)');
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(gx + 400, botY + 40);
    for (let i = 0; i <= N; i++) { const pI = pts[i]; if (Math.sin(i / N * TAU) >= -0.02) ctx.lineTo(pI[0], pI[1]); }
    ctx.lineTo(gx - 400, botY + 40); ctx.closePath(); ctx.fill();
    ctx.fillRect(gx - 400, lvl, 800, 1); // relleno entre extremos
    ctx.fillStyle = body; ctx.fillRect(gx - 300, lvl + 6, 600, botY + 30 - lvl);
    // superficie
    const sg = ctx.createRadialGradient(gx - 40, lvl - 6, 8, gx, lvl, Rl);
    sg.addColorStop(0, '#9E2B49'); sg.addColorStop(0.55, '#681330'); sg.addColorStop(1, '#3A0A1D');
    ctx.fillStyle = sg; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
    // brillo especular girando sobre la superficie
    ctx.strokeStyle = 'rgba(255,225,230,.55)'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i <= 26; i++) { const th = ph + 0.4 + i / 26 * 1.5; const k = Math.pow(0.5 + 0.5 * Math.cos(th - ph), 2.6); const xx = gx + Rl * 0.92 * Math.cos(th), yy = lvl + Rl * 0.92 * 0.17 * Math.sin(th) - A * k * 0.9 * (0.55 + 0.45 * Math.sin(th)); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
    // película de vino ("lágrimas") sobre la pared
    for (let i = 0; i < 9; i++) {
      const th = i / 9 * Math.PI + 0.15, xx = gx + Rl * 1.0 * Math.cos(th + Math.PI) * 0.97, len = 30 + 70 * hash(i * 3.1) * amp;
      ctx.strokeStyle = `rgba(150,30,60,${0.30 + 0.2 * hash(i)})`; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      const yTop = lvl - A * 0.55 - 8 - len * 0.45; ctx.beginPath(); ctx.moveTo(xx, yTop); ctx.lineTo(xx, yTop + len * 0.5); ctx.stroke();
    }
    // reflejo del fondo en el cuerpo
    const hl = ctx.createLinearGradient(gx - 160, 0, gx + 160, 0); hl.addColorStop(0, 'rgba(255,170,190,.0)'); hl.addColorStop(0.15, 'rgba(255,170,190,.26)'); hl.addColorStop(0.3, 'rgba(255,170,190,0)');
    ctx.fillStyle = hl; ctx.fillRect(gx - 200, lvl, 400, botY - lvl);
    ctx.restore();
    // borde del vidrio
    bowl(); ctx.strokeStyle = 'rgba(255,255,255,.62)'; ctx.lineWidth = 3; ctx.stroke();
    // boca
    const rimR = bowlHalf(rimY);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(gx, rimY, rimR, rimR * 0.17, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(gx, rimY, rimR - 7, (rimR - 7) * 0.17, 0, 0, TAU); ctx.stroke();
    // reflejos de luz (tiras verticales)
    ctx.save(); bowl(); ctx.clip();
    const sp1 = ctx.createLinearGradient(gx - 150, 0, gx - 110, 0); sp1.addColorStop(0, 'rgba(255,255,255,0)'); sp1.addColorStop(0.5, 'rgba(255,255,255,.55)'); sp1.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sp1; ctx.beginPath(); ctx.moveTo(gx - 148, rimY + 40); ctx.quadraticCurveTo(gx - 182, midY, gx - 118, botY - 60); ctx.lineTo(gx - 100, botY - 70); ctx.quadraticCurveTo(gx - 150, midY, gx - 116, rimY + 40); ctx.closePath(); ctx.fill();
    const sp2 = ctx.createLinearGradient(gx + 118, 0, gx + 150, 0); sp2.addColorStop(0, 'rgba(255,255,255,0)'); sp2.addColorStop(0.5, 'rgba(255,255,255,.3)'); sp2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sp2; ctx.fillRect(gx + 116, rimY + 80, 36, midY - rimY + 120);
    ctx.restore();
    return { rimY, midY, rimR };
  }

  R.defScene('copa', {
    fx: { bloomMul: 1.0, vig: 0.5 },
    bg: (lt, T) => ({
      mode: 0, c0: c01('#080106'), c1: c01('#3a0a18'), c2: c01('#8A1E3A'), c3: c01('#ffd7c0'),
      p: [1.0, 2.3, 0.7, 0.2], q: [0.5, 0.6, 30, 0.45], r: [0, 5, 3, 0.55],
    }),
    draw(ctx, ctxL, lt, T, scene) {
      ctx.save(); ctxL.save();
      const zIn = 1 + 0.09 * E.outQt(1 - seg(lt, -0.2, 0.45)) + 0.025 * seg(lt, 0, 1.9);
      cam(ctx, ctxL, T, zIn, 960, 540, 0.5);
      R.motes(ctxL, T, { n: 40, seed: 19, alpha: 0.8, dy: 2.2 });
      const amp = E.outC(seg(lt, 0.05, 0.8));
      const GX = 640, GY = 930;
      const pop = spring(lt + 0.05, 2.0, 0.55);
      ctx.save(); ctx.translate(GX, GY); ctx.scale(0.86 + 0.14 * clamp(pop, 0, 1.2), 0.86 + 0.14 * clamp(pop, 0, 1.2)); ctx.translate(-GX, -GY);
      ctx.globalAlpha = clamp(pop * 1.4);
      const g = glass(ctx, ctxL, GX, GY, T, lt, amp);
      ctx.restore();

      // aromas: salen de la boca y se acomodan alrededor
      let released = 0;
      AROMAS.forEach((a, i) => {
        const t0 = 0.3 + i * 0.2343, p = (lt - t0) / 0.55; if (p <= 0) return; released++;
        const e = E.outQt(clamp(p)), sx = GX, sy = g.rimY - 10;
        // trayectoria curva (arco)
        const mx = lerp(sx, a.x, 0.5) + (a.x < GX ? -90 : 90), my = Math.min(sy, a.y) - 130;
        const bx = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * a.x, by = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * a.y + Math.sin(T * 2 + i * 1.7) * 6 * e;
        // estela
        if (p < 1.2) {
          ctx.strokeStyle = rgba('#F1D9A6', 0.55 * (1 - clamp(p))); ctx.lineWidth = 2; ctx.beginPath();
          for (let k = 0; k <= 20; k++) { const ee = E.outQt(clamp(p - k * 0.012)); const px = (1 - ee) * (1 - ee) * sx + 2 * (1 - ee) * ee * mx + ee * ee * a.x, py = (1 - ee) * (1 - ee) * sy + 2 * (1 - ee) * ee * my + ee * ee * a.y; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
          ctx.stroke();
        }
        // línea punteada al vaso
        ctx.strokeStyle = rgba(col.goldL, 0.35 * e); ctx.lineWidth = 1.5; ctx.setLineDash([3, 7]); ctx.beginPath(); ctx.moveTo(sx + (a.x < GX ? -50 : 50), sy + 20); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
        // chip
        const cs = spring(lt - t0 - 0.12, 2.5, 0.5);
        const w = 80 + R.textWidth({ size: 21, weight: 700, ls: 3.2 }, a.t), h = 66;
        ctx.save(); ctx.translate(bx, by); ctx.scale(clamp(cs, 0, 1.15), clamp(cs, 0, 1.15));
        ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
        ctx.fillStyle = 'rgba(24,4,12,.78)'; R.rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.strokeStyle = rgba(col.goldL, 0.85); ctx.lineWidth = 2; R.rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.stroke();
        ctx.fillStyle = '#F6EBDD'; ctx.beginPath(); ctx.arc(-w / 2 + h / 2, 0, h / 2 - 7, 0, TAU); ctx.fill();
        ctx.save(); ctx.translate(-w / 2 + h / 2, 0); ICON[a.k](ctx, 1.0); ctx.restore();
        text(ctx, a.t, -w / 2 + h + 2, 7.5, { size: 21, weight: 800, ls: 3.2, fill: '#F6EBDD' });
        ctx.restore();
        R.glow(ctxL, bx, by, 150, '#FFD7A0', 0.10 * e);
      });

      // columna derecha
      const X = 1180;
      text(ctx, 'EXPERIENCIA INTERACTIVA', X, 232, { size: 20, weight: 800, ls: 8, fill: col.goldL, alpha: E.outC(seg(lt, 0.1, 0.5)) });
      ctx.strokeStyle = rgba(col.gold, 0.9); ctx.lineWidth = 2.5; R.line(ctx, X, 254, X + 90 * E.outQt(seg(lt, 0.15, 0.6)), 254);
      const o1 = { size: 150, weight: 600, italic: true, serif: true, fill: '#FBF1E6', align: 'left', ls: -2 };
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 10;
      R.riseText(ctx, 'La Copa', X, 410, o1, lt, 0.15, 0.04, 0.55, { spring: true, f: 2.2, z: 0.5, rise: 1.0 });
      R.riseText(ctx, 'de Tannat', X, 556, Object.assign({}, o1, { fill: col.goldHi }), lt, 0.3, 0.036, 0.55, { spring: true, f: 2.2, z: 0.5, rise: 1.0 });
      ctx.restore();
      // medidores
      [['TANINO', 0.86, 0], ['CUERPO', 0.68, 1], ['ACIDEZ', 0.58, 2]].forEach(([lab, v, i]) => {
        const y = 650 + i * 78, p = E.outQt(seg(lt, 0.55 + i * 0.12, 1.15 + i * 0.12));
        text(ctx, lab, X, y, { size: 20, weight: 800, ls: 6, fill: '#E9DCC4', alpha: clamp(p * 3) });
        const bw = 470, bx = X + 168;
        ctx.fillStyle = 'rgba(255,255,255,.14)'; R.rr(ctx, bx, y - 17, bw, 12, 6); ctx.fill();
        const fg = ctx.createLinearGradient(bx, 0, bx + bw, 0); fg.addColorStop(0, '#B83A4B'); fg.addColorStop(1, '#F1D9A6');
        ctx.fillStyle = fg; R.rr(ctx, bx, y - 17, Math.max(12, bw * v * p), 12, 6); ctx.fill();
        ctx.fillStyle = '#FFF4DC'; R.circle(ctx, bx + Math.max(12, bw * v * p) - 6, y - 11, 9); ctx.fill();
        R.glow(ctxL, bx + Math.max(12, bw * v * p), y - 11, 60, '#F1D9A6', 0.35 * p);
      });
      // contador de aromas
      const cnt = Math.min(5, released);
      text(ctx, 'AROMAS LIBERADOS', X, 928, { size: 17, weight: 700, ls: 5, fill: col.goldL, alpha: 0.9 });
      text(ctx, `${cnt} / 5`, X + 300, 930, { size: 34, weight: 800, ls: 1, fill: '#FFF4DC' });
      // "girá la copa" (flecha circular)
      const ga = E.outC(seg(lt, 0.5, 0.9));
      ctx.save(); ctx.translate(X + 640, 912); ctx.rotate(-lt * 3.2); ctx.strokeStyle = rgba(col.goldHi, 0.9 * ga); ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, 18, 0.4, TAU - 0.7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(14, -16); ctx.lineTo(20, -6); ctx.lineTo(8, -6); ctx.closePath(); ctx.fillStyle = rgba(col.goldHi, ga); ctx.fill(); ctx.restore();

      // brindis: destello en el borde al final
      const bt = lt - BEAT * 3;
      if (bt > 0 && bt < 0.5) {
        const f = Math.exp(-bt / 0.12), sx = GX + 150, sy = g.rimY - 4;
        ctxL.save(); ctxL.translate(sx, sy); ctxL.rotate(Math.PI / 4);
        for (let k = 0; k < 2; k++) { const l = 130 * f * (k ? 0.6 : 1); const gr = ctxL.createLinearGradient(-l, 0, l, 0); gr.addColorStop(0, 'rgba(255,240,200,0)'); gr.addColorStop(0.5, 'rgba(255,248,225,1)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); ctxL.fillStyle = gr; ctxL.fillRect(-l, -2.5, l * 2, 5); ctxL.rotate(Math.PI / 2); }
        ctxL.restore(); R.glow(ctxL, sx, sy, 160, '#FFF0C8', 0.9 * f);
      }
      ctx.restore(); ctxL.restore();
      R.hud(ctx, T, scene, 'dark');
    },
  });

  /* ---------------------------------------------------------
     5 · LAS 4 ESTACIONES (7.5 – 9.375) — mapa topográfico
     --------------------------------------------------------- */
  const ST = [
    { n: '01', name: 'Bodega Harriague', sub: 'PUNTO CERO · 1874', p: [380, 730], card: [150, 790, 'l'] },
    { n: '02', name: 'Bodega Salto Chico', sub: 'RIBERA DEL RÍO URUGUAY', p: [545, 585], card: [170, 392, 'l'] },
    { n: '03', name: 'Bertolini & Broglio', sub: 'PARADA DAYMÁN', p: [1500, 345], card: [1090, 150, 'r'] },
    { n: '04', name: 'Mori Maglio Wines', sub: 'VIÑEDO EL ASOMBRADO', p: [1090, 655], card: [1180, 604, 'r'] },
  ];
  const ROUTE_PTS = [
    ST[0].p, [455, 668], ST[1].p, [700, 640], [880, 560], [1040, 500], [1200, 430], [1350, 405], ST[2].p,
    [1445, 440], [1330, 520], [1210, 600], ST[3].p,
  ];
  const ROUTE = R.makePath(ROUTE_PTS, 24);
  const nodeU = ST.map((s) => { let bi = 0, bd = 1e9; ROUTE.pts.forEach((q, i) => { const d = Math.hypot(q[0] - s.p[0], q[1] - s.p[1]); if (d < bd) { bd = d; bi = i; } }); return ROUTE.len[bi] / ROUTE.total; });
  const RIVER = R.makePath([[40, -40], [120, 200], [95, 420], [190, 640], [150, 860], [230, 1130]], 24);
  const T_DRAW0 = 0.12, T_DRAW1 = 1.40625;
  R.RUTA = { nodeU, T_DRAW0, T_DRAW1 };

  R.defScene('ruta', {
    fx: { bloomMul: 0.9, vig: 0.5 },
    bg: (lt, T) => ({ mode: 2, c0: c01('#0E0B0C'), c1: c01('#22181A'), c2: c01('#C29D62'), c3: c01('#8F2636'), p: [1.5, 0, 0.5, 0], r: [26, 3, 1, 0.35] }),
    draw(ctx, ctxL, lt, T, scene) {
      ctx.save(); ctxL.save();
      const prog = E.inOutC(seg(lt, T_DRAW0, T_DRAW1));
      const head = ROUTE.at(prog);
      const camx = lerp(960, head.x, 0.16), camy = lerp(540, head.y, 0.16);
      const zIn = 1.07 - 0.07 * E.outC(seg(lt, -0.1, 1.8)) + 0.02 * E.outQt(1 - seg(lt, -0.15, 0.4));
      cam(ctx, ctxL, T, zIn, camx, camy, 0.5);
      // cuadrícula + marcas
      ctx.strokeStyle = 'rgba(194,157,98,.07)'; ctx.lineWidth = 1;
      for (let x = -60; x < W + 120; x += 120) R.line(ctx, x, -60, x, H + 60);
      for (let y = -60; y < H + 120; y += 120) R.line(ctx, -60, y, W + 60, y);
      // río Uruguay
      const rv = E.outC(seg(lt, -0.1, 0.5));
      ctx.save(); ctx.globalAlpha = rv;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      RIVER.trace(ctx, 0, 1); ctx.strokeStyle = 'rgba(12,58,64,.9)'; ctx.lineWidth = 112; ctx.stroke();
      RIVER.trace(ctx, 0, 1); ctx.strokeStyle = 'rgba(47,143,134,.35)'; ctx.lineWidth = 92; ctx.stroke();
      ctx.setLineDash([2, 38]); for (let k = 0; k < 3; k++) { ctx.lineDashOffset = -T * (60 + k * 22); RIVER.trace(ctx, 0, 1); ctx.strokeStyle = `rgba(160,225,214,${0.35 - k * 0.08})`; ctx.lineWidth = 3; ctx.save(); ctx.translate((k - 1) * 22, 0); ctx.stroke(); ctx.restore(); }
      ctx.setLineDash([]); ctx.restore();
      ctx.save(); ctx.translate(112, 700); ctx.rotate(-Math.PI / 2 + 0.12); text(ctx, 'RÍO URUGUAY', 0, 0, { size: 20, weight: 800, ls: 12, fill: 'rgba(190,235,226,.8)', align: 'center', alpha: rv }); ctx.restore();

      // título
      text(ctx, 'SALTO  →  PARADA DAYMÁN', 118, 188, { size: 20, weight: 800, ls: 8, fill: col.goldL, alpha: E.outC(seg(lt, 0, 0.4)) });
      const oT = { size: 118, weight: 600, italic: true, serif: true, fill: '#FBF1E6', align: 'left', ls: -2 };
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 8;
      { // el «4» en sans (cifra alineada) + «Estaciones» en serif cursiva
        const p4 = spring(lt - 0.0, 2.3, 0.5), nx = 116;
        ctx.save(); ctx.beginPath(); ctx.rect(nx - 10, 190, 130, 140); ctx.clip();
        text(ctx, '4', nx, 306 + (1 - clamp(p4, 0, 1.05)) * 130, num({ size: 116, fill: col.goldHi, align: 'left' })); ctx.restore();
        R.riseText(ctx, 'Estaciones', nx + 98, 306, oT, lt, 0.08, 0.03, 0.55, { spring: true, f: 2.3, z: 0.5, rise: 1.0 }); }
      ctx.restore();

      // Ruta 3 + termas (detalles de mapa)
      const dt = E.outC(seg(lt, 0.6, 1.1));
      text(ctx, 'RUTA 3', 890, 612, { size: 16, weight: 800, ls: 7, fill: 'rgba(233,220,196,.65)', alpha: dt });
      { const tx = 960, ty = 388; ctx.save(); ctx.globalAlpha = dt; ctx.strokeStyle = 'rgba(127,209,196,.9)'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(11,61,68,.9)';
        ctx.beginPath(); ctx.arc(tx, ty, 18, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx, ty - 9); ctx.quadraticCurveTo(tx + 8, ty + 1, tx, ty + 8); ctx.quadraticCurveTo(tx - 8, ty + 1, tx, ty - 9); ctx.fillStyle = 'rgba(160,225,214,.95)'; ctx.fill();
        text(ctx, 'TERMAS DEL DAYMÁN', tx + 30, ty + 6, { size: 15, weight: 800, ls: 4, fill: 'rgba(160,225,214,.95)' }); ctx.restore(); }

      // ruta: halo + línea + brillo de flujo
      const trailA = 1;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ROUTE.trace(ctx, 0, prog); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 17; ctx.stroke();
      const rg = ctx.createLinearGradient(380, 0, 1500, 0); rg.addColorStop(0, '#C29D62'); rg.addColorStop(1, '#F1D9A6');
      ROUTE.trace(ctx, 0, prog); ctx.strokeStyle = rg; ctx.lineWidth = 7; ctx.stroke();
      ctx.setLineDash([2, 26]); ctx.lineDashOffset = -T * 90; ROUTE.trace(ctx, 0, prog); ctx.strokeStyle = 'rgba(255,244,214,.55)'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([]);
      ctxL.lineCap = 'round'; ROUTE.trace(ctxL, 0, prog); ctxL.strokeStyle = 'rgba(241,217,166,.16)'; ctxL.lineWidth = 20; ctxL.stroke();

      // distancias por tramo
      [[0, 1, '3 km', 0], [1, 2, '21 km', 1], [2, 3, '9 km', 2]].forEach(([a, b, lab, i]) => {
        const ua = nodeU[a], ub = nodeU[b], um = (ua + ub) / 2; if (prog < um + 0.015) return;
        const q = ROUTE.at(um), s = spring(lt - ((i === 0 ? 0.55 : i === 1 ? 1.0 : 1.38)), 2.6, 0.5);
        const w = 20 + R.textWidth({ size: 22, weight: 800, ls: 1.5 }, lab);
        ctx.save(); ctx.translate(q.x, q.y - 36); ctx.scale(clamp(s, 0, 1.15), clamp(s, 0, 1.15));
        ctx.fillStyle = 'rgba(14,10,12,.85)'; R.rr(ctx, -w / 2, -18, w, 36, 18); ctx.fill(); ctx.strokeStyle = rgba(col.goldL, 0.9); ctx.lineWidth = 1.8; R.rr(ctx, -w / 2, -18, w, 36, 18); ctx.stroke();
        text(ctx, lab, 0, 8, { size: 22, weight: 800, ls: 1.5, fill: col.goldHi, align: 'center' }); ctx.restore();
      });

      // estaciones
      ST.forEach((s, i) => {
        const tN = T_DRAW0 + (T_DRAW1 - T_DRAW0) * (E.inOutC ? 0 : 0); // (placeholder)
        // momento exacto en que la línea alcanza el nodo
        let pu = 0; { let lo = 0, hi = 1; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (E.inOutC(m) < nodeU[i]) lo = m; else hi = m; } pu = (lo + hi) / 2; }
        const tn = T_DRAW0 + (T_DRAW1 - T_DRAW0) * pu - 0.04;
        const age = lt - tn; if (age < 0) return;
        const pop = spring(age, 2.6, 0.5), ring = E.outQt(clamp(age / 0.6));
        // anillo que se expande
        ctx.strokeStyle = rgba(col.goldHi, 0.8 * (1 - ring)); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.p[0], s.p[1], 18 + 90 * ring, 0, TAU); ctx.stroke();
        ctx.save(); ctx.translate(s.p[0], s.p[1]); ctx.scale(clamp(pop, 0, 1.3), clamp(pop, 0, 1.3));
        ctx.fillStyle = '#14090B'; R.circle(ctx, 0, 0, 27); ctx.fill(); ctx.fillStyle = col.gold; R.circle(ctx, 0, 0, 22); ctx.fill();
        ctx.fillStyle = '#14090B'; R.circle(ctx, 0, 0, 17); ctx.fill();
        text(ctx, String(i + 1), 0, 7, { size: 20, weight: 800, fill: col.goldHi, align: 'center' });
        ctx.restore();
        R.glow(ctxL, s.p[0], s.p[1], 120, '#F1D9A6', 0.35 * Math.exp(-age / 0.5));
        // tarjeta
        const [cx, cy, side] = s.card; const cp = E.outQt(clamp((age - 0.1) / 0.5));
        const cw = 470, ch = 118;
        ctx.save(); ctx.globalAlpha = cp; ctx.translate(0, (1 - cp) * 26);
        ctx.fillStyle = 'rgba(16,9,11,.82)'; R.rr(ctx, cx, cy, cw, ch, 18); ctx.fill();
        ctx.strokeStyle = rgba(col.gold, 0.55); ctx.lineWidth = 1.5; R.rr(ctx, cx, cy, cw, ch, 18); ctx.stroke();
        ctx.fillStyle = col.gold; R.rr(ctx, cx, cy + 16, 5, ch - 32, 3); ctx.fill();
        text(ctx, s.n, cx + 28, cy + 76, { size: 62, weight: 800, fill: col.gold, ls: -2 });
        text(ctx, s.name, cx + 128, cy + 56, { size: 31, weight: 600, serif: true, fill: '#FBF1E6' });
        text(ctx, s.sub, cx + 128, cy + 90, { size: 15, weight: 700, ls: 3.2, fill: col.goldL });
        ctx.restore();
        // guía hacia el nodo
        ctx.strokeStyle = rgba(col.gold, 0.5 * cp); ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]);
        const ax = side === 'l' ? cx + cw / 2 : cx + cw / 2, ay = cy + (cy > s.p[1] ? 0 : ch);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(s.p[0], s.p[1] + (cy > s.p[1] ? 28 : -28)); ctx.stroke(); ctx.setLineDash([]);
      });

      // vehículo
      if (prog > 0 && prog < 1) {
        ctx.save(); ctx.translate(head.x, head.y); ctx.rotate(head.ang);
        ctx.fillStyle = '#FFF4DC'; R.rr(ctx, -12, -7, 24, 14, 6); ctx.fill(); ctx.fillStyle = '#8F2636'; ctx.fillRect(-2, -7, 4, 14); ctx.restore();
      }
      if (prog > 0) R.glow(ctxL, head.x, head.y, 80, '#FFE7B0', 0.4);

      // KPI
      const kp = E.outQt(seg(lt, 0.7, T_DRAW1)), kx = 1190, ky = 950;
      const km = Math.round(33 * kp), mn = Math.round(32 * kp), ka = E.outC(seg(lt, 0.6, 1.0));
      text(ctx, 'RECORRIDO COMPLETO', kx, ky - 138, { size: 16, weight: 800, ls: 6, fill: col.goldL, alpha: ka * 0.9 });
      const kpop = 1 + 0.06 * Math.exp(-Math.max(0, lt - T_DRAW1) / 0.15) * Math.cos(Math.max(0, lt - T_DRAW1) * 30);
      ctx.save(); ctx.translate(kx, ky); ctx.scale(kpop, kpop); ctx.translate(-kx, -ky);
      text(ctx, String(km), kx, ky - 22, { size: 124, weight: 800, fill: '#FBF1E6', ls: -4, alpha: ka });
      const wk = R.textWidth({ size: 124, weight: 800, ls: -4 }, String(km));
      text(ctx, 'km', kx + wk + 14, ky - 22, { size: 40, weight: 700, fill: col.goldL, alpha: ka });
      const mx = kx + 330;
      text(ctx, String(mn), mx, ky - 22, { size: 124, weight: 800, fill: '#FBF1E6', ls: -4, alpha: ka });
      const wm = R.textWidth({ size: 124, weight: 800, ls: -4 }, String(mn));
      text(ctx, 'min', mx + wm + 14, ky - 22, { size: 40, weight: 700, fill: col.goldL, alpha: ka });
      ctx.restore();
      // brújula
      { const nx = 1790, ny = 232, a = E.outC(seg(lt, 0.2, 0.7)); ctx.save(); ctx.globalAlpha = a * 0.8; ctx.strokeStyle = col.goldL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(nx, ny, 34, 0, TAU); ctx.stroke();
        ctx.fillStyle = col.goldHi; ctx.beginPath(); ctx.moveTo(nx, ny - 28); ctx.lineTo(nx + 9, ny + 6); ctx.lineTo(nx, ny); ctx.lineTo(nx - 9, ny + 6); ctx.closePath(); ctx.fill(); text(ctx, 'N', nx, ny - 44, { size: 17, weight: 800, fill: col.goldHi, align: 'center' }); ctx.restore(); }

      ctx.restore(); ctxL.restore();
      R.hud(ctx, T, scene, 'dark');
    },
  });
})();
