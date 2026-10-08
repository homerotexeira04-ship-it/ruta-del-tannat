/* ============================================================
   events.js — tiempos de cada evento visual, en segundos absolutos.
   El audio los lee (timeline.json) para sincronizar cada sonido con
   la imagen. Los valores replican las constantes de scenes_*.js.
   ============================================================ */
(function () {
  const { BEAT, BAR, E, clamp } = R;
  const seg = R.seg;
  const t0 = {}; R.SCENE_TABLE.forEach((s) => (t0[s.id] = s.t0));
  const EV = {};
  // 1 · gota
  { const ticks = []; // la línea pasa por cada marca de 20 px
    const head = (t) => 470 * E.inOutC(seg(t, 0.02, 0.8));
    for (let k = 1; k * 20 <= 470; k++) { let lo = 0.02, hi = 0.8; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (head(m) < k * 20) lo = m; else hi = m; } ticks.push({ t: +lo.toFixed(4), major: (k * 20) % 100 === 0 }); }
    EV.introTicks = ticks; EV.dropBulb = 0.8; EV.dropRelease = 1.12; EV.impact = 1.5; }
  // 2 · título
  EV.titleLetters = [0, 1, 2, 3, 4, 5].map((i) => t0.title + i * 0.052);
  EV.titleSmallLetters = Array.from({ length: 11 }, (_, i) => t0.title + 0.12 + i * 0.035);
  EV.titleGlints = [t0.title + 0.78, t0.title + 1.3];
  EV.titleRule = t0.title + 0.55; EV.titleTagline = t0.title + 0.6;
  // 3 · harriague
  EV.odoTicks = R.odoTicks().map((o) => ({ t: +(t0.harriague + o.lt).toFixed(4), d: o.d }));
  EV.odoLand = t0.harriague + 0.9375; EV.dotHop1894 = t0.harriague + 1.12; EV.dotHop2016 = t0.harriague + 1.38; EV.chipApr = t0.harriague + 1.40625;
  EV.harriagueText = [t0.harriague + 0.5, t0.harriague + 0.6]; EV.windowIn = t0.harriague - 0.08;
  // 4 · copa
  EV.glassPop = t0.copa - 0.05;
  EV.aromas = [0, 1, 2, 3, 4].map((i) => t0.copa + 0.3 + i * 0.2343 + 0.12);
  EV.copaTitle = [t0.copa + 0.15, t0.copa + 0.3]; EV.meters = [0, 1, 2].map((i) => t0.copa + 0.55 + i * 0.12 + 0.3);
  EV.clink = t0.copa + BEAT * 3;
  // 5 · ruta
  { const { nodeU, T_DRAW0, T_DRAW1 } = R.RUTA;
    EV.rutaDraw = [t0.ruta + T_DRAW0, t0.ruta + T_DRAW1];
    EV.rutaNodes = nodeU.map((u) => { let lo = 0, hi = 1; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (E.inOutC(m) < u) lo = m; else hi = m; } return +(t0.ruta + T_DRAW0 + (T_DRAW1 - T_DRAW0) * ((lo + hi) / 2) - 0.04).toFixed(4); });
    EV.rutaLegs = [0.55, 1.0, 1.38].map((x) => t0.ruta + x);
    const kp = (lt) => E.outQt(seg(lt, 0.7, T_DRAW1)); const ticks = []; let last = 0;
    for (let i = 0; i <= 2000; i++) { const lt = 0.7 + (T_DRAW1 - 0.7) * i / 2000; const v = Math.round(33 * kp(lt)); if (v !== last) { ticks.push(+(t0.ruta + lt).toFixed(4)); last = v; } }
    EV.rutaKpi = ticks; EV.rutaKpiLand = t0.ruta + T_DRAW1; }
  // 6 · termas
  { const ticks = []; let last = 0; for (let i = 0; i <= 2000; i++) { const lt = 0.85 * i / 2000; const v = Math.round(44 * E.outQt(seg(lt, 0, 0.85))); if (v !== last) { ticks.push(+(t0.termas + lt).toFixed(4)); last = v; } }
    EV.termasTicks = ticks; EV.termasLand = t0.termas + 0.85; EV.termasChip = t0.termas + 0.6; EV.termasTitle = t0.termas + 0.02; }
  // 7 · sostenible
  EV.sostChips = [0, 1, 2, 3].map((i) => t0.sostenible + 0.12 + i * 0.1172);   // la escena entra 0,1 s adelantada
  { const ticks = []; let last = 0; for (let i = 0; i <= 2000; i++) { const lt = 0.15 + 0.7 * i / 2000; const v = Math.round(31 * E.outQt(seg(lt, 0.15, 0.85))); if (v !== last) { ticks.push(+(t0.sostenible + lt - 0.1).toFixed(4)); last = v; } }
    EV.sostTicks = ticks; EV.sostLand = t0.sostenible + 0.75; EV.sostTitle = t0.sostenible - 0.08; }
  // 8 · temporadas
  EV.seasonPanels = [0, 1, 2, 3].map((i) => t0.temporadas - 0.02 + i * 0.1172);
  EV.badgeApr = t0.temporadas + 0.62;
  // 9 · paquetes
  EV.cards = [0, 1].map((i) => t0.paquetes + i * 0.117);
  { const ticks = []; for (const [ci, p] of [[0, 45], [1, 95]]) { let last = 0; for (let i = 0; i <= 2000; i++) { const lt = ci * 0.117 + 0.12 + 0.43 * i / 2000; const v = Math.round(p * E.outQt(seg(lt, ci * 0.117 + 0.12, ci * 0.117 + 0.55))); if (v !== last) { ticks.push({ t: +(t0.paquetes + lt).toFixed(4), c: ci }); last = v; } } }
    EV.priceTicks = ticks; }
  EV.reco = t0.paquetes + 0.35; EV.whatsapp = t0.paquetes + 0.62; EV.langs = [0, 1, 2].map((i) => t0.paquetes + 0.72 + i * 0.06);
  // 10 · cierre
  EV.finalLetters = Array.from({ length: 18 }, (_, i) => t0.final + i * 0.026);
  EV.finalMotto = t0.final + 0.4; EV.finalUrl = t0.final + 0.5; EV.finalTeam = t0.final + 0.62;
  EV.finalChips = [0, 1, 2, 3].map((i) => t0.final + 0.74 + i * 0.1);
  EV.finalCredit = t0.final + 1.0; EV.finalSeal = t0.final + 0.15;
  R.EVENTS = {
    bpm: R.BPM, dur: R.DUR, beat: BEAT, bar: BAR,
    hits: R.HITS, scenes: R.SCENE_TABLE.map((s) => ({ id: s.id, t0: s.t0 })),
    trans: R.TRANS_TABLE.map((t) => ({ type: t.type, t0: t.t0, t1: t.t1 })), ev: EV,
  };
})();
