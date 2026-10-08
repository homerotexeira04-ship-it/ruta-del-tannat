/* ============================================================
   Escenas 3–4: Harriague 1874 y La Copa
   ============================================================ */
(function () {
  const { TAU, clamp, lerp, E, seg, spring, hash, noise1, rgba, col, text, W, H, BEAT, BAR, c01 } = R;
  const cam = (ctx, ctxL, T, zoom = 1, ox = 960, oy = 540, shk = 1) => {
    const [dx, dy, r] = R.shakeAt(T, shk);
    for (const c of [ctx, ctxL]) { c.translate(W / 2 + dx, H / 2 + dy); c.rotate(r); c.scale(zoom, zoom); c.translate(-ox, -oy); }
  };

  /* ---------------------------------------------------------
     3 · HARRIAGUE · 1874   (3.75 – 5.625) — papel crema, tinta vino
     --------------------------------------------------------- */
  const INK = col.deep, WINE = col.wine, GD = col.goldD;
  // odómetro: cada dígito es un rodillo de números que gira y frena
  function reel(ctx, cx, base, size, startV, steps, p, o) {
    const pos = startV + steps * p, b0 = Math.floor(pos + 1e-9), fr = Math.max(0, pos - b0), lh = size * 1.2;
    ctx.save(); ctx.beginPath(); ctx.rect(cx - o.cw / 2 - 6, base - size * 0.9, o.cw + 12, size * 0.96); ctx.clip();
    for (let k = -1; k <= 1; k++) {
      const d = (((b0 + k) % 10) + 10) % 10, y = base + (k - fr) * lh;
      text(ctx, String(d), cx, y, { size, weight: o.weight, serif: o.serif, fill: o.fill, align: 'center', alpha: 1 - 0.0 * Math.abs(y - base) / lh });
    }
    ctx.restore();
  }
  // tiempos de los clics del odómetro (también los usa el audio)
  const ODO_T0 = 0.0, ODO_T1 = 0.9375, ODO_STEPS = [0, 0, 16, 25], ODO_START = [1, 8, 1, 9];
  R.odoEase = (x) => E.outQt(clamp(x));
  R.odoTicks = () => {
    const ticks = [];
    for (let d = 2; d <= 3; d++) {
      let last = 0;
      for (let i = 1; i <= 2000; i++) { const lt = ODO_T0 + (ODO_T1 - ODO_T0) * i / 2000; const pos = ODO_STEPS[d] * R.odoEase((lt - ODO_T0) / (ODO_T1 - ODO_T0)); if (Math.floor(pos) !== last) { ticks.push({ lt, d }); last = Math.floor(pos); } }
    }
    return ticks.sort((a, b) => a.lt - b.lt);
  };

  function vineyard(ctx, ctxL, x, y, w, h, lt, T) {
    ctx.save();
    R.rr(ctx, x, y, w, h, 26); ctx.clip();
    const vx = x + w * 0.5 + Math.sin(T * 0.5) * 8, hy = y + h * 0.43;
    // cielo
    const sky = ctx.createLinearGradient(0, y, 0, hy);
    sky.addColorStop(0, '#2B0A14'); sky.addColorStop(0.35, '#7D1F34'); sky.addColorStop(0.7, '#E08A5A'); sky.addColorStop(1, '#FFE2A8');
    ctx.fillStyle = sky; ctx.fillRect(x, y, w, hy - y + 2);
    // sol
    const sunR = 78 + 4 * Math.sin(T * 2);
    const sunY = hy - 34 + 30 * (1 - E.outC(seg(lt, 0, 1.2)));
    ctx.save(); ctx.fillStyle = 'rgba(255,240,200,.14)';
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + T * 0.1; ctx.beginPath(); ctx.moveTo(vx, sunY); ctx.arc(vx, sunY, 900, a, a + 0.1); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    const sg = ctx.createRadialGradient(vx, sunY, 4, vx, sunY, sunR);
    sg.addColorStop(0, '#FFFBEA'); sg.addColorStop(0.7, '#FFE8A8'); sg.addColorStop(1, '#FFD27D');
    ctx.fillStyle = sg; R.circle(ctx, vx, sunY, sunR); ctx.fill();
    R.glow(ctxL, vx, sunY, 520, '#FFD58A', 0.22);
    // colinas lejanas
    for (const [k, c, a, ph, amp] of [[0.0, '#7A2433', 0.85, 1.3, 20], [1, '#4A1020', 0.95, 4.1, 26]]) {
      ctx.fillStyle = c; ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(x, hy + 4);
      for (let i = 0; i <= 40; i++) { const xx = x + w * i / 40; ctx.lineTo(xx, hy - 14 - k * 4 - amp * (0.5 + 0.5 * Math.sin(i * 0.33 + ph + T * 0.05)) * (0.4 + 0.6 * Math.sin(i * 0.11 + ph))); }
      ctx.lineTo(x + w, hy + 4); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    }
    // suelo basáltico
    const gr = ctx.createLinearGradient(0, hy, 0, y + h);
    gr.addColorStop(0, '#9a6a48'); gr.addColorStop(0.25, '#5e3424'); gr.addColorStop(1, '#2a1410');
    ctx.fillStyle = gr; ctx.fillRect(x, hy, w, y + h - hy);
    // hileras en perspectiva (proyección de un punto de fuga)
    const F = 330, camH = 2.5, zNear = 1.35, zFar = 40, dz = 1.1;
    const scroll = 7.5 * E.outQt(clamp(lt / 2.0)) + T * 0.3;
    const grow = E.outC(seg(lt, 0.0, 1.0));
    const P = (xf, z, yh) => [vx + xf / z * F, hy + (camH - yh) / z * F];
    const rowsN = 16, sp = 1.5, hw = 0.34, ytop = 0.95, ylow = 0.3;
    const order = [];
    for (let j = 0; j < rowsN; j++) { const xw = (j - (rowsN - 1) / 2) * sp; order.push({ xw, j }); }
    order.sort((a, b) => Math.abs(b.xw) - Math.abs(a.xw));
    const NS = 40;
    // surco claro en el centro del callejón
    for (const { xw, j } of order) {
      const side = xw < 0 ? 1 : -1, xf = xw + side * hw;
      if (Math.abs(xw) > 7.5) continue;
      const hgt = ytop * grow;
      for (let i = 0; i < NS; i++) {
        const zb = zNear * Math.pow(zFar / zNear, i / NS), za = zNear * Math.pow(zFar / zNear, (i + 1) / NS);
        const fog = clamp((za - 4) / 30);
        const mk = (y0, y1, c0, c1) => {
          const A = P(xf, za, y1), B = P(xf, zb, y1), C = P(xf, zb, y0), D = P(xf, za, y0);
          ctx.fillStyle = rgba(R.mixc(R.mixc(c0, c1, (i % 3) * 0.12), '#E8A872', fog * 0.85), 1);
          ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(D[0], D[1]); ctx.closePath(); ctx.fill();
        };
        mk(ylow * grow, hgt, '#59642A', '#7E8A36');     // muro de hojas
        mk(0, ylow * grow, '#2B1710', '#3A1D14');        // tronco/sombra
        // cara superior (más clara, recibe el sol)
        const A = P(xw - hw, za, hgt), B = P(xw - hw, zb, hgt), C = P(xw + hw, zb, hgt), D = P(xw + hw, za, hgt);
        ctx.fillStyle = rgba(R.mixc('#C2B24E', '#E8A872', fog * 0.85), 1);
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(D[0], D[1]); ctx.closePath(); ctx.fill();
      }
      // postes, hojas sueltas y racimos: avanzan con el scroll
      const nP = Math.ceil(zFar / dz) + 1;
      const zs = [];
      for (let k = 0; k < nP; k++) zs.push((((k * dz - scroll) % (nP * dz)) + nP * dz) % (nP * dz) + zNear);
      zs.sort((a, b) => b - a);
      for (const z of zs) {
        if (z > zFar) continue;
        const fog = clamp((z - 4) / 30), sc = F / z;
        const p0 = P(xf, z, 0), p1 = P(xf, z, (ytop + 0.14) * grow);
        ctx.strokeStyle = `rgba(28,12,8,${0.85 * (1 - fog * 0.8)})`; ctx.lineWidth = Math.max(1, 0.05 * sc);
        R.line(ctx, p0[0], p0[1], p1[0], p1[1]);
        const seed = j * 31.7 + Math.round((z + scroll) / dz) * 1.3;
        for (let q = 0; q < 3; q++) {
          const zq = z + (hash(seed + q * 5.1) - 0.5) * dz * 0.95, yy = (ylow + 0.08 + hash(seed + q * 2.2) * (ytop - ylow - 0.15)) * grow;
          const pq = P(xf, zq, yy), r = (0.07 + 0.09 * hash(seed + q * 9.3)) * F / zq;
          ctx.fillStyle = rgba(R.mixc(hash(seed + q) > 0.5 ? '#A6B24A' : '#3E4A1E', '#E8A872', fog * 0.85), 0.9);
          ctx.beginPath(); ctx.ellipse(pq[0], pq[1], r * 1.4, r * 0.8, -0.3, 0, TAU); ctx.fill();
        }
        if (z < 10 && grow > 0.6) {
          const g0 = P(xf, z, ylow * 0.9);
          ctx.fillStyle = '#2a0614';
          for (let g = 0; g < 4; g++) { ctx.beginPath(); ctx.arc(g0[0] + (g - 1.5) * 0.07 * sc, g0[1] + (g % 2) * 0.05 * sc, 0.038 * sc, 0, TAU); ctx.fill(); }
          ctx.fillStyle = 'rgba(255,210,220,.7)'; ctx.beginPath(); ctx.arc(g0[0] - 0.08 * sc, g0[1] - 0.01 * sc, 0.012 * sc, 0, TAU); ctx.fill();
        }
      }
    }
    // bruma en el horizonte + viñeta interior
    const hz = ctx.createLinearGradient(0, hy - 30, 0, hy + 120); hz.addColorStop(0, 'rgba(255,200,140,0)'); hz.addColorStop(0.3, 'rgba(255,200,140,.34)'); hz.addColorStop(1, 'rgba(255,200,140,0)');
    ctx.fillStyle = hz; ctx.fillRect(x, hy - 30, w, 150);
    const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, h * 0.35, x + w / 2, y + h / 2, h * 0.82); vg.addColorStop(0, 'rgba(20,4,8,0)'); vg.addColorStop(1, 'rgba(20,4,8,.55)');
    ctx.fillStyle = vg; ctx.fillRect(x, y, w, h);
    ctx.restore();
    // filo dorado
    ctx.strokeStyle = rgba(col.gold, 0.95); ctx.lineWidth = 3; R.rr(ctx, x, y, w, h, 26); ctx.stroke();
    ctx.strokeStyle = rgba(col.goldHi, 0.5); ctx.lineWidth = 1; R.rr(ctx, x + 10, y + 10, w - 20, h - 20, 18); ctx.stroke();
  }

  R.defScene('harriague', {
    fx: { bloomMul: 0.12, bloomThr: 0.96, vig: 0.2, grain: 0.028 },
    bg: () => ({ mode: 1, c0: c01('#F7F0E4'), c1: c01('#CDB892'), c2: c01('#FFF3D6') }),
    draw(ctx, ctxL, lt, T, scene) {
      ctx.save(); ctxL.save();
      cam(ctx, ctxL, T, 1 + 0.018 * seg(lt, 0, 1.9), 960, 540, 0.45);
      const X0 = 112;
      // marca de agua: línea de tiempo en el fondo
      // etiqueta superior
      const lab = E.outC(seg(lt, 0.0, 0.5));
      R.riseText(ctx, 'PASCUAL HARRIAGUE', X0, 196, { size: 24, weight: 800, ls: 9, fill: GD, align: 'left' }, lt, 0.02, 0.022, 0.4);
      text(ctx, 'HASPARREN 1819  —  PARÍS 1894', X0, 232, { size: 17, weight: 600, ls: 5, fill: col.terroir, alpha: lab });
      ctx.strokeStyle = rgba(WINE, 0.9); ctx.lineWidth = 3; R.line(ctx, X0, 258, X0 + 120 * E.outQt(seg(lt, 0.05, 0.5)), 258);

      // odómetro 1874
      const size = 292, base = 590, cw = 178;
      const p = R.odoEase((lt - ODO_T0) / (ODO_T1 - ODO_T0));
      const land = lt - ODO_T1; // golpe al aterrizar
      const bump = land > 0 ? 1 + 0.035 * Math.exp(-land / 0.12) * Math.cos(land * 38) : 1;
      ctx.save(); ctx.translate(X0 + 2 * cw, base - 120); ctx.scale(bump, bump); ctx.translate(-(X0 + 2 * cw), -(base - 120));
      ctx.shadowColor = 'rgba(74,16,29,.28)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 14;
      const reveal = E.outQt(seg(lt, -0.1, 0.35));
      ctx.globalAlpha = reveal;
      for (let d = 0; d < 4; d++) {
        const cx = X0 + cw * (d + 0.5) - d * 20 + 12;
        reel(ctx, cx, base, size, ODO_START[d], ODO_STEPS[d], d >= 2 ? p : 0, { cw: cw - 20, weight: 800, serif: false, fill: WINE });
      }
      ctx.restore();
      // destello al aterrizar
      if (land > 0) {
        const f = Math.exp(-land / 0.2);
        R.glow(ctxL, X0 + 2 * cw - 40, base - 140, 560, '#FFD58A', 0.35 * f);
        ctx.strokeStyle = rgba(col.gold, 0.8 * f); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X0 + 2 * cw - 40, base - 130, 120 + 520 * E.outQt(clamp(land / 0.5)), 0, TAU); ctx.stroke();
      }
      // texto
      const o2 = { size: 50, weight: 500, italic: true, serif: true, fill: INK, align: 'left' };
      R.riseText(ctx, 'Las primeras cepas de Tannat', X0, 690, o2, lt, 0.5, 0.012, 0.5);
      R.riseText(ctx, 'se plantan en Salto.', X0, 750, Object.assign({}, o2, { fill: WINE }), lt, 0.6, 0.014, 0.5);

      // línea de tiempo
      const tl = [['1819', 'NACE EN HASPARREN'], ['1838', 'LLEGA A MONTEVIDEO'], ['1860', 'LA CABALLADA, SALTO'], ['1874', 'PRIMERAS CEPAS'], ['1894', 'FALLECE EN PARÍS'], ['2016', 'DÍA NACIONAL DEL TANNAT']];
      const tx0 = X0 + 10, tx1 = 940, ty = 888;
      const tp = E.outQt(seg(lt, 0.2, 0.8));
      ctx.strokeStyle = rgba(GD, 0.5); ctx.lineWidth = 2; R.line(ctx, tx0, ty, tx0 + (tx1 - tx0) * tp, ty);
      // posición del punto: salta 1819→…→1874 en el aterrizaje, luego 1894, 2016
      const stops = tl.map((_, i) => tx0 + (tx1 - tx0) * i / 5);
      let dot;
      if (lt < ODO_T1) dot = lerp(stops[0], stops[3], E.inOutC(seg(lt, 0.2, ODO_T1)));
      else dot = stops[3] + (stops[4] - stops[3]) * E.outQt(seg(lt, 1.12, 1.3)) + (stops[5] - stops[4]) * E.outQt(seg(lt, 1.38, 1.62));
      ctx.strokeStyle = rgba(WINE, 1); ctx.lineWidth = 4; R.line(ctx, tx0, ty, Math.min(dot, tx0 + (tx1 - tx0) * tp), ty);
      tl.forEach(([yr, cap], i) => {
        const sx = stops[i], on = dot >= sx - 2, a = E.outC(seg(lt, 0.3 + i * 0.05, 0.6 + i * 0.05));
        const hot = i === 3 && lt > ODO_T1 && lt < 1.2;
        ctx.fillStyle = on ? rgba(WINE, a) : rgba(GD, 0.55 * a); R.circle(ctx, sx, ty, i === 3 ? 9 : 6.5); ctx.fill();
        text(ctx, yr, sx, ty + 40, { size: i === 3 ? 28 : 22, weight: 800, ls: 1.5, fill: on ? WINE : col.terroir, align: i === 0 ? 'left' : i === 5 ? 'right' : 'center', alpha: a });
        if (i === 3 || i === 5) text(ctx, cap, sx, ty + 66, { size: 14, weight: 700, ls: 2.4, fill: GD, align: i === 5 ? 'right' : 'center', alpha: a * (i === 5 ? E.outC(seg(lt, 1.4, 1.62)) : 1) });
        if (hot) { ctx.strokeStyle = rgba(WINE, 0.6 * (1 - seg(lt, ODO_T1, 1.2))); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sx, ty, 9 + 60 * E.outQt(seg(lt, ODO_T1, 1.2)), 0, TAU); ctx.stroke(); }
      });
      ctx.fillStyle = rgba(WINE, 1); R.circle(ctx, dot, ty, 11); ctx.fill(); ctx.fillStyle = '#FFF6E0'; R.circle(ctx, dot, ty, 4); ctx.fill();
      // chip del 14 de abril
      const chip = spring(lt - 1.40625, 2.6, 0.52) * E.inQ(1 - seg(lt, 1.86, 1.9));
      if (chip > 0.01) {
        const cwid = 408, chh = 54, cx = tx1 - cwid, cy = ty - 138;
        ctx.save(); ctx.translate(tx1 - cwid / 2, cy + chh / 2); ctx.scale(chip, chip); ctx.translate(-(tx1 - cwid / 2), -(cy + chh / 2));
        ctx.shadowColor = 'rgba(74,16,29,.3)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
        ctx.fillStyle = WINE; R.rr(ctx, cx, cy, cwid, chh, 27); ctx.fill(); ctx.shadowColor = 'transparent';
        text(ctx, '14 DE ABRIL  ·  DÍA DEL TANNAT', cx + cwid / 2 + 1, cy + 34, { size: 19, weight: 800, ls: 3.2, fill: '#FFF3D6', align: 'center' });
        ctx.restore();
      }

      // ventana del viñedo
      const wp = E.outQt(seg(lt, -0.08, 0.55));
      const wx = 1010 + (1 - wp) * 900, rot = (1 - wp) * 0.05;
      ctx.save(); ctx.translate(wx + 400, 540); ctx.rotate(rot); ctx.translate(-(wx + 400), -540);
      ctx.shadowColor = 'rgba(43,10,20,.45)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 26;
      ctx.fillStyle = '#2B0A14'; R.rr(ctx, wx, 150, 800, 800, 26); ctx.fill(); ctx.shadowColor = 'transparent';
      vineyard(ctx, ctxL, wx, 150, 800, 800, lt, T);
      text(ctx, 'SALTO  ·  VIÑEDO', wx + 34, 150 + 800 - 34, { size: 17, weight: 800, ls: 6, fill: '#FFE9B8', alpha: 0.9 * E.outC(seg(lt, 0.7, 1.0)) });
      ctx.restore();
      ctx.restore(); ctxL.restore();
      R.hud(ctx, T, scene, 'light');
    },
  });
})();
