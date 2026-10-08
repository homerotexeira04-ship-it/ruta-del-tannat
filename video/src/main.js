/* ============================================================
   main.js — orquestador: línea de tiempo, transiciones, motion
   blur por sub-cuadros y salida de cada frame.
   ============================================================ */
(function () {
  const { W, H, FPS, clamp, E, lerp } = R;
  const mk = (k = 1) => { const c = document.createElement('canvas'); c.width = W * k; c.height = H * k; return { c, x: c.getContext('2d', { alpha: true }), k }; };
  // la capa de luz son brillos suaves: media resolución alcanza y ahorra 3/4 de la subida a GPU
  const LA = { fg: mk(), lg: mk(0.5) }, LB = { fg: mk(), lg: mk(0.5) };

  /* estado en el tiempo ts: qué escena(s) se ven y con qué transición */
  function stateAt(ts) {
    const S = R.SCENES, TR = R.TRANS;
    for (let i = 0; i < TR.length; i++) {
      const tr = TR[i];
      if (ts >= tr.t0 && ts < tr.t1) {
        const p = tr.ease(clamp((ts - tr.t0) / (tr.t1 - tr.t0)));
        return { A: S[i], B: S[i + 1], trans: { type: tr.type, p, par: tr.par(p, ts) } };
      }
    }
    let idx = 0;
    for (let i = 0; i < TR.length; i++) if (ts >= TR[i].t1) idx = i + 1;
    return { A: S[idx], B: null, trans: null };
  }

  function drawLayer(L, scene, ts) {
    L.fg.x.setTransform(1, 0, 0, 1, 0, 0); L.lg.x.setTransform(1, 0, 0, 1, 0, 0);
    L.fg.x.clearRect(0, 0, W, H); L.lg.x.clearRect(0, 0, W * 0.5, H * 0.5);
    L.lg.x.setTransform(0.5, 0, 0, 0.5, 0, 0);
    L.fg.x.globalAlpha = 1; L.lg.x.globalAlpha = 1;
    L.fg.x.globalCompositeOperation = 'source-over'; L.lg.x.globalCompositeOperation = 'source-over';
    L.fg.x.save(); L.lg.x.save();
    scene.draw(L.fg.x, L.lg.x, ts - scene.t0, ts, scene);
    L.fg.x.restore(); L.lg.x.restore();
  }

  /* cuántos sub-cuadros: más en transiciones y golpes (donde hay velocidad) */
  function sampling(tc) {
    const o = R.SAMPLING || {};
    for (const tr of R.TRANS) if (tc > tr.t0 - 0.03 && tc < tr.t1 + 0.03) return { N: o.trans || 12, shutter: 1.0 };
    for (const b of (R.BOOST || [])) if (tc >= b.t0 && tc < b.t1) return { N: b.N, shutter: b.shutter || 0.9 };
    for (const h of R.HITS) if (tc >= h.t - 0.02 && tc < h.t + 0.2) return { N: o.hit || 9, shutter: 0.9 };
    return { N: o.base || 5, shutter: 0.75 };
  }

  // ensambla escenas + definiciones (si falta una definición, placeholder)
  R.SCENES = R.SCENE_TABLE.map((row) => Object.assign({}, row, R.DEFS[row.id] || {
    bg: () => ({ mode: 4, c0: [0.1, 0.02, 0.04], c1: [0.2, 0.05, 0.08], c2: [0.4, 0.1, 0.1], r: [0, 0, 0, 0.2] }),
    draw(ctx, ctxL, lt, T, scene) { R.text(ctx, row.id.toUpperCase(), 960, 560, { size: 120, weight: 700, fill: '#fff', align: 'center', serif: true }); R.hud(ctx, T, scene, 'dark'); },
  }));
  R.TRANS = R.TRANS_TABLE;

  let curFrame = -1;
  async function ready() {
    const loads = [
      'italic 600 100px "Playfair Display"', '600 100px "Playfair Display"', '400 100px "Playfair Display"',
      '400 20px "Plus Jakarta Sans"', '600 20px "Plus Jakarta Sans"', '800 20px "Plus Jakarta Sans"',
    ];
    await Promise.all(loads.map((l) => document.fonts.load(l, 'AaÁáñÑ0123456789°·—')));
    await document.fonts.ready;
    return true;
  }

  function renderFrame(f, opts = {}) {
    curFrame = f;
    const tc = (f + 0.5) / FPS;
    const GL = R.GL;
    GL.beginFrame();
    let { N, shutter } = sampling(tc);
    if (opts.N) N = opts.N;
    for (let i = 0; i < N; i++) {
      const jitter = R.hash(f * 7.13 + 0.5) / N;
      const ts = tc + ((i + 0.5) / N - 0.5 + jitter * 0.5 - 0.25 / N) * shutter / FPS;
      const st = stateAt(ts);
      drawLayer(LA, st.A, ts);
      const s = { A: { fg: LA.fg.c, lg: LA.lg.c, bg: GL.bgTex(st.A.id, st.A.bg(tc - st.A.t0, tc), tc) }, trans: st.trans, lightGain: R.LIGHT_GAIN };
      if (st.B) { drawLayer(LB, st.B, ts); s.B = { fg: LB.fg.c, lg: LB.lg.c, bg: GL.bgTex(st.B.id, st.B.bg(tc - st.B.t0, tc), tc) }; }
      GL.accumulate(s, 1 / N);
    }
    const fx = R.fxAt(tc), st0 = stateAt(tc), pp = st0.trans ? st0.trans.p : 0;
    const fa = st0.A.fx || {}, fb = (st0.B && st0.B.fx) || fa;
    const mixv = (k, d) => lerp(fa[k] === undefined ? d : fa[k], fb[k] === undefined ? d : fb[k], pp);
    fx.bloom *= mixv('bloomMul', 1); fx.bloomThr = mixv('bloomThr', fx.bloomThr); fx.vig = mixv('vig', fx.vig); fx.grain = mixv('grain', fx.grain); fx.sat = mixv('sat', 1.04); fx.warm = mixv('warm', 0.5);
    GL.finish(fx, f);
  }

  function grab(q = 0.97) { return R.GL.canvas.toDataURL('image/jpeg', q); }
  function grabPng() { return R.GL.canvas.toDataURL('image/png'); }

  Object.assign(R, { renderFrame, grab, grabPng, ready, stateAt });
})();
