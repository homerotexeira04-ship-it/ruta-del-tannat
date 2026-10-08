/* ============================================================
   common.js — piezas reutilizables: HUD de reel, polvo de luz,
   guilloché, bisel de ticks, íconos vectoriales.
   ============================================================ */
(function () {
  const { TAU, clamp, lerp, E, seg, hash, noise1, noise2, rgba, col, text, W, H, BEAT } = R;
  R.DEFS = {};
  R.defScene = (id, def) => { R.DEFS[id] = def; };
  R.c01 = (h) => R.hex(h).map((v) => v / 255);

  /* ---------- HUD de showreel ---------- */
  // theme: 'dark' (texto crema/dorado) | 'light' (texto vino)
  R.hud = function (ctx, T, scene, theme = 'dark', alphaMul = 1) {
    const a = clamp((T - 0.35) / 0.5) * alphaMul * (1 - clamp((T - 14.62) / 0.3));
    if (a <= 0) return;
    const c = theme === 'light' ? col.wine : col.goldL;
    const c2 = theme === 'light' ? col.terroir : '#E9DCC4';
    ctx.save(); ctx.globalAlpha = a * 0.78;
    ctx.shadowColor = theme === 'light' ? 'rgba(255,248,235,.7)' : 'rgba(0,0,0,.6)'; ctx.shadowBlur = 8;
    const m = 56;
    // marcas de corte en las esquinas
    ctx.strokeStyle = rgba(c, 0.8); ctx.lineWidth = 1.5;
    const L = 20, ins = 34;
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const x = sx > 0 ? ins : W - ins, y = sy > 0 ? ins : H - ins;
      ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke();
    }
    const o1 = { size: 17, weight: 700, ls: 4.2 };
    text(ctx, 'LA RUTA DEL TANNAT', m + 14, 84, Object.assign({ fill: c2 }, o1));
    text(ctx, 'MOTION REEL  ·  SALTO, URUGUAY', m + 14, 108, { size: 14, weight: 500, ls: 3.2, fill: c, alpha: 0.9 });
    // timecode con celdas fijas (no tiembla)
    const tcs = R.tc(T);
    ctx.textAlign = 'center';
    R.setFont(ctx, { size: 19, weight: 600 }); ctx.fillStyle = c2;
    const cw = 12.5; let x = W - m - 14 - tcs.length * cw;
    for (const ch of tcs) { ctx.fillText(ch, x + cw / 2, 84); x += cw; }
    text(ctx, 'TC  /  00:00:15:00', W - m - 14, 108, { size: 14, weight: 500, ls: 3.2, fill: c, align: 'right', alpha: 0.9 });
    // inferior
    const idx = String(scene.n).padStart(2, '0');
    text(ctx, `${idx} / 10`, m + 14, H - 78, { size: 17, weight: 700, ls: 4, fill: c2 });
    const iw = R.textWidth({ size: 17, weight: 700, ls: 4 }, `${idx} / 10`);
    text(ctx, scene.name, m + 14 + iw + 30, H - 78, { size: 17, weight: 600, ls: 4.2, fill: c, alpha: 0.95 });
    text(ctx, '128 BPM  ·  60 FPS  ·  1920×1080', W - m - 14, H - 78, { size: 15, weight: 600, ls: 3.2, fill: c2, align: 'right', alpha: 0.85 });
    // progreso
    ctx.globalAlpha = a * 0.35; ctx.fillStyle = rgba(c, 1); ctx.fillRect(m + 14, H - 54, W - 2 * m - 28, 1.5);
    ctx.globalAlpha = a * 0.95; ctx.fillStyle = rgba(c, 1); ctx.fillRect(m + 14, H - 55, (W - 2 * m - 28) * clamp(T / 15), 3.5);
    ctx.restore();
  };

  /* ---------- polvo de luz (bokeh determinista) ---------- */
  R.motes = function (ctxL, T, o = {}) {
    const n = o.n || 46, color = o.color || col.goldL, amp = o.amp === undefined ? 1 : o.amp, seed = o.seed || 1;
    ctxL.save();
    for (let i = 0; i < n; i++) {
      const h1 = hash(i * 1.37 + seed), h2 = hash(i * 2.11 + seed + 5), h3 = hash(i * 3.7 + seed + 9);
      const depth = 0.3 + h3 * 0.9;
      const sp = (o.speed || 18) * depth;
      const x = ((h1 * (W + 300) + T * sp * (o.dx === undefined ? 1 : o.dx) + Math.sin(T * 0.6 + i) * 18) % (W + 300) + (W + 300)) % (W + 300) - 150;
      const y = (((h2 * (H + 300) - T * sp * (o.dy === undefined ? 1.4 : o.dy)) % (H + 300)) + (H + 300)) % (H + 300) - 150;
      const r = (o.r || 2.2) * (0.4 + depth * 1.6) * (h3 > 0.86 ? 4.5 : 1);
      const tw = 0.55 + 0.45 * Math.sin(T * (1 + h1 * 2.5) + i * 3.1);
      const a = (h3 > 0.86 ? 0.1 : 0.34) * tw * amp * (o.alpha === undefined ? 1 : o.alpha);
      R.glow(ctxL, x, y, r * 3.2, color, a);
    }
    ctxL.restore();
  };

  /* ---------- guilloché: rosetón de líneas finas ---------- */
  R.guilloche = function (ctx, cx, cy, Rr, o = {}) {
    const K = o.K || 44, n = o.n || 13, rot = o.rot || 0, prog = o.prog === undefined ? 1 : o.prog;
    const color = o.color || col.goldL, aMul = o.alpha === undefined ? 1 : o.alpha;
    const seg_ = 540;
    ctx.save(); ctx.lineWidth = o.lw || 1.1; ctx.lineJoin = 'round';
    for (let k = 0; k < K; k++) {
      const u = k / (K - 1);
      const kp = clamp(prog * (K + 6) - k) // cada curva se dibuja con retraso
      if (kp <= 0) continue;
      const base = Rr * (0.5 + 0.5 * u), amp = Rr * 0.075 * (1 - u * 0.55);
      const ph = rot + k * 0.205;
      const arcN = Math.max(2, Math.floor(seg_ * E.outC(kp)));
      ctx.beginPath();
      for (let s = 0; s <= arcN; s++) {
        const th = (s / seg_) * TAU;
        const r = base + amp * Math.sin(n * th + ph) + amp * 0.45 * Math.sin((n * 2 + 1) * th - ph * 1.7);
        const x = cx + r * Math.cos(th + rot * 0.15), y = cy + r * Math.sin(th + rot * 0.15);
        s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = rgba(color, (0.16 + 0.34 * (1 - Math.abs(u - 0.5) * 1.4)) * aMul);
      ctx.stroke();
    }
    ctx.restore();
  };

  /* ---------- bisel de ticks (como una corona de reloj) ---------- */
  R.ticks = function (ctx, cx, cy, r, o = {}) {
    const n = o.n || 120, rot = o.rot || 0, color = o.color || col.gold, prog = o.prog === undefined ? 1 : o.prog;
    ctx.save(); ctx.lineCap = 'butt';
    for (let i = 0; i < n * prog; i++) {
      const a = (i / n) * TAU + rot, big = i % 10 === 0, mid = i % 5 === 0;
      const l = big ? 26 : mid ? 16 : 9;
      ctx.lineWidth = big ? 2.2 : 1.2; ctx.strokeStyle = rgba(color, (big ? 0.9 : mid ? 0.6 : 0.38) * (o.alpha === undefined ? 1 : o.alpha));
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.lineTo(cx + Math.cos(a) * (r + l), cy + Math.sin(a) * (r + l)); ctx.stroke();
    }
    ctx.restore();
  };

  /* ---------- letras en columna que "suben" detrás de una máscara ---------- */
  R.riseText = function (ctx, str, x, y, o, T, t0, stag = 0.05, dur = 0.5, opts = {}) {
    const L = R.layoutChars(o, str, x, o.align || 'center');
    const h = o.size;
    ctx.save();
    for (const c of L.chars) {
      const p = clamp((T - t0 - c.i * stag) / dur);
      if (p <= 0) continue;
      const e = opts.spring ? R.spring(T - t0 - c.i * stag, opts.f || 2.4, opts.z || 0.5) : E.outQt(p);
      const dy = (1 - e) * h * (opts.rise || 1.05) + (opts.bob && p >= 1 ? opts.bob * Math.sin(T * 2.6 + c.i * 0.85) * clamp((T - t0 - c.i * stag - 0.5) / 0.4) : 0);
      ctx.save();
      ctx.beginPath(); ctx.rect(c.x - o.size * 0.3, y - h * 1.02, c.w + o.size * 0.6, h * 1.3); ctx.clip();
      R.setFont(ctx, o); ctx.textAlign = 'left'; ctx.fillStyle = o.fill;
      if (opts.rot) { ctx.translate(c.x + c.w / 2, y + dy); ctx.rotate((1 - e) * opts.rot * (c.i % 2 ? 1 : -1)); ctx.fillText(c.ch, -c.w / 2, 0); }
      else ctx.fillText(c.ch, c.x, y + dy);
      ctx.restore();
    }
    ctx.restore();
    return L;
  };

  R.rgb = (c, a = 1) => rgba(c, a);
  R.shadowText = (ctx, str, x, y, o, blur = 24, color = 'rgba(0,0,0,.4)', oy = 8) => {
    ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.shadowOffsetY = oy; text(ctx, str, x, y, o); ctx.restore();
  };
})();
