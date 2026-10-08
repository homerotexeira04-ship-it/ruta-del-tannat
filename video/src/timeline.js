/* ============================================================
   timeline.js — la línea de tiempo maestra (128 BPM, 8 compases
   = 15,000 s exactos). Todo golpe visual y todo golpe de audio
   salen de esta misma tabla (también se exporta a timeline.json).
   ============================================================ */
(function () {
  const { BEAT, BAR, E, clamp, hash, noise1 } = R;
  const b = (n) => n * BEAT; // beats → segundos

  // t0 = "cero local" de la escena (el golpe donde cae); nombre = para el HUD
  R.SCENE_TABLE = [
    { id: 'intro', n: 1, name: 'LA GOTA', t0: 0 },
    { id: 'title', n: 2, name: 'EL NOMBRE', t0: BAR * 1 },
    { id: 'harriague', n: 3, name: 'HARRIAGUE · 1874', t0: BAR * 2 },
    { id: 'copa', n: 4, name: 'LA COPA', t0: BAR * 3 },
    { id: 'ruta', n: 5, name: '4 ESTACIONES', t0: BAR * 4 },
    { id: 'termas', n: 6, name: 'TERMAS', t0: BAR * 5 },
    { id: 'sostenible', n: 7, name: 'SOSTENIBLE', t0: BAR * 5 + b(2) },
    { id: 'temporadas', n: 8, name: 'TEMPORADAS', t0: BAR * 6 },
    { id: 'paquetes', n: 9, name: 'PAQUETES', t0: BAR * 6 + b(2) },
    { id: 'final', n: 10, name: 'LA RUTA', t0: BAR * 7 },
  ];
  // transición i: escena i → i+1 (type: ver gl.js)
  R.TRANS_TABLE = [
    { type: 1, t0: 1.5, t1: BAR + 0.03, ease: (x) => Math.pow(x, 1.7), par: () => [0.5, 0.167, 1.45, 0.9] },                       // iris desde la gota
    { type: 2, t0: BAR * 2 - 0.15, t1: BAR * 2 + 0.15, ease: E.inOutC, par: () => [0, 0, 0, 0] },                // líquido sube
    { type: 3, t0: BAR * 3 - 0.15, t1: BAR * 3 + 0.17, ease: E.inOutC, par: () => [8, 0.7, 0, 0] },              // persianas
    { type: 6, t0: BAR * 4 - 0.17, t1: BAR * 4 + 0.15, ease: E.inOutC, par: () => [0.5, 0.52, 7.0, 1.4] },       // zoom a través de la copa
    { type: 7, t0: BAR * 5 - 0.13, t1: BAR * 5 + 0.13, ease: E.inOutQt, par: () => [1, -0.42, 0, 0] },           // barrido diagonal
    { type: 4, t0: BAR * 5 + b(2) - 0.1, t1: BAR * 5 + b(2) + 0.1, ease: E.whip, par: () => [1, 0, 0, 0.22] },   // whip horizontal
    { type: 3, t0: BAR * 6 - 0.13, t1: BAR * 6 + 0.2, ease: E.inOutC, par: () => [16, 0.9, 0, 0] },              // persianas finas
    { type: 4, t0: BAR * 6 + b(2) - 0.1, t1: BAR * 6 + b(2) + 0.1, ease: E.whip, par: () => [0, 1, 0, 0.22] },   // whip vertical
    { type: 5, t0: BAR * 7 - 0.07, t1: BAR * 7 + 0.07, ease: (x) => x, par: () => [0.8, 0.7, 0, 0] },            // flash en el golpe final
  ];

  // golpes (visual + audio): s = fuerza
  R.HITS = [
    { t: 1.5, s: 0.6 }, { t: BAR * 1, s: 1.0 }, { t: BAR * 2, s: 0.85 }, { t: BAR * 3, s: 0.8 }, { t: BAR * 4, s: 0.9 },
    { t: BAR * 5, s: 0.85 }, { t: BAR * 5 + b(2), s: 0.7 }, { t: BAR * 6, s: 0.85 }, { t: BAR * 6 + b(2), s: 0.7 }, { t: BAR * 7, s: 1.25 },
  ];

  /* sacudón de cámara por golpes: [dx, dy, rot] */
  R.shakeAt = (t, k = 1) => {
    let dx = 0, dy = 0, r = 0;
    for (const h of R.HITS) {
      if (t < h.t) continue;
      const e = Math.exp(-(t - h.t) / 0.09) * h.s * k;
      if (e < 0.003) continue;
      dx += noise1(t * 38 + h.t * 13) * 14 * e; dy += noise1(t * 41 + h.t * 7 + 50) * 11 * e; r += noise1(t * 29 + h.t) * 0.004 * e;
    }
    return [dx, dy, r];
  };
  /* envolvente del beat (0..1) para pulsos sutiles: pico en cada golpe de bombo */
  R.beatEnv = (t, d = 0.16) => { const x = (t % BEAT); return Math.exp(-x / d); };

  /* efectos globales de postproducción por cuadro */
  R.fxAt = (t) => {
    let ca = 0.0007, bloom = 0.5, flash = 0;
    for (const h of R.HITS) if (t >= h.t) { const e = Math.exp(-(t - h.t) / 0.1) * h.s; ca += e * 0.0042; bloom += e * 0.35; }
    for (const tr of R.TRANS_TABLE) if (t > tr.t0 && t < tr.t1) { const p = (t - tr.t0) / (tr.t1 - tr.t0); ca += Math.sin(p * Math.PI) * 0.0035; }
    const fade = Math.min(1, t / 0.5) * (1 - R.E.inQ(clamp((t - 14.68) / 0.32)));
    return { ca, bloom, fade: Math.max(0, fade), vig: 0.46, grain: 0.03, bloomThr: 0.6 };
  };
  R.LIGHT_GAIN = 1.5;
  // ventanas con movimiento muy rápido: más sub-cuadros para un motion blur limpio
  R.BOOST = [{ t0: BAR * 2 + 0.0, t1: BAR * 2 + 0.95, N: 12, shutter: 1.0 }];
})();
