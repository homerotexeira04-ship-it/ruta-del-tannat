/*
 * "La Copa de Tannat" — motor de dibujo (Canvas 2D, sin librerías).
 * Copa de estilo bordelés: vidrio con reflejos, vino que se mueve al girarla, "lágrimas" en la pared,
 * servido inicial, brindis con chispas y estelas de aroma. Solo se anima mientras hay movimiento.
 * Autoría de la implementación: Homero Texeira.
 */
(function () {
  'use strict';
  const W = 560, H = 760, CX = 280, RIM_Y = 200, BOWL_END = 500, FOOT_Y = 700, LEVEL = 345, K = 0.25;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

  // Semiancho del cuenco según la altura (spline de Hermite sobre puntos de control)
  const PTS = [[200, 92], [228, 107], [280, 121], [335, 116], [392, 90], [440, 50], [476, 18], [500, 7]];
  const SLOPE = PTS.map((p, i) => { const a = PTS[Math.max(0, i - 1)], b = PTS[Math.min(PTS.length - 1, i + 1)]; return (b[1] - a[1]) / (b[0] - a[0]); });
  function halfW(y) {
    y = clamp(y, PTS[0][0], PTS[PTS.length - 1][0]);
    let i = 0; while (i < PTS.length - 2 && y > PTS[i + 1][0]) i++;
    const y0 = PTS[i][0], w0 = PTS[i][1], y1 = PTS[i + 1][0], w1 = PTS[i + 1][1], h = y1 - y0, t = (y - y0) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * w0 + (t3 - 2 * t2 + t) * h * SLOPE[i] + (-2 * t3 + 3 * t2) * w1 + (t3 - t2) * h * SLOPE[i + 1];
  }
  // punto sobre la pared del cuenco a altura y y ángulo th (th∈[0,π] = pared delantera, la que vemos a través del vino)
  const wallX = (y, th) => CX + halfW(y) * Math.cos(th);
  const wallY = (y, th) => y + halfW(y) * K * Math.sin(th);

  function bowlPath() {
    const p = new Path2D(), N = 56;
    p.moveTo(CX - halfW(RIM_Y), RIM_Y);
    for (let i = 1; i <= N; i++) { const y = RIM_Y + ((BOWL_END - RIM_Y) * i) / N; p.lineTo(CX - halfW(y), y); }
    for (let i = N; i >= 0; i--) { const y = RIM_Y + ((BOWL_END - RIM_Y) * i) / N; p.lineTo(CX + halfW(y), y); }
    p.closePath(); return p;
  }

  // Color del vino según tanino (T), y acidez (A): rubí profundo → violáceo casi opaco; más acidez = más luminoso
  function wineColors(T, A) {
    const h = lerp(352, 334, T), s = lerp(72, 60, T);
    const hsl = (hh, ss, l, a) => 'hsla(' + hh.toFixed(1) + ',' + ss.toFixed(1) + '%,' + l.toFixed(1) + '%,' + (a === undefined ? 1 : a) + ')';
    return {
      center: hsl(h, s, lerp(13, 4.5, T) + A * 1.2), mid: hsl(h, s, lerp(21, 10, T) + A * 2), edge: hsl(h + 4, s + 4, lerp(33, 19, T) + A * 4),
      rim: hsl(h + 10, 70, lerp(50, 36, T) + A * 5), glow: hsl(h - 4, 88, lerp(46, 33, T)), glowA: (a) => hsl(h - 4, 88, lerp(46, 33, T), a),
      rimA: (a) => hsl(h + 10, 70, lerp(50, 36, T) + A * 5, a), midA: (a) => hsl(h, s, lerp(21, 10, T) + A * 2, a),
    };
  }

  function create(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d'), bowl = bowlPath();
    const reduced = !!opts.reducedMotion;
    let S = 1, back = null, front = null, active = false, raf = 0, last = 0, running = false;
    const st = {
      omega: 0, phi: 0, amp: 0, charge: 0, level: LEVEL, film: new Float32Array(33), tears: [], tearAcc: 0,
      T: 0.7, B: 0.65, A: 0.4, cT: 0.7, cB: 0.65, cA: 0.4, tilt: 0,
      pour: null, toast: null, sparks: [], wisps: [], ripples: [], clock: 0,
    };
    let colors = wineColors(st.cT, st.cA);

    // ---------- capas estáticas del vidrio (se dibujan una vez por tamaño) ----------
    function layer() { const c = document.createElement('canvas'); c.width = Math.round(W * S); c.height = Math.round(H * S); const g = c.getContext('2d'); g.setTransform(S, 0, 0, S, 0, 0); return { c, g }; }
    function buildBack() {
      const { c, g } = layer();
      g.save(); g.translate(CX + 8, FOOT_Y + 12); g.scale(1, 0.15);
      const sh = g.createRadialGradient(0, 0, 8, 0, 0, 160); sh.addColorStop(0, 'rgba(0,0,0,.65)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(-170, -170, 340, 340); g.restore();
      // pie de la copa
      const fg = g.createLinearGradient(CX - 108, 0, CX + 108, 0);
      [[0, .32], [.16, .07], [.5, .03], [.84, .07], [1, .3]].forEach(([o, a]) => fg.addColorStop(o, 'rgba(255,255,255,' + a + ')'));
      g.beginPath(); g.ellipse(CX, FOOT_Y + 4, 108, 17, 0, 0, TAU); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1.2; g.stroke();
      g.beginPath(); g.ellipse(CX, FOOT_Y, 108, 17, 0, 0, TAU); g.fillStyle = fg; g.fill(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.3; g.stroke();
      // tallo
      const stem = new Path2D();
      stem.moveTo(CX - 8, 490); stem.bezierCurveTo(CX - 6, 560, CX - 5.5, 610, CX - 6.5, 650); stem.bezierCurveTo(CX - 8, 676, CX - 24, 688, CX - 40, 697);
      stem.lineTo(CX + 40, 697); stem.bezierCurveTo(CX + 24, 688, CX + 8, 676, CX + 6.5, 650); stem.bezierCurveTo(CX + 5.5, 610, CX + 6, 560, CX + 8, 490); stem.closePath();
      const sg = g.createLinearGradient(CX - 8, 0, CX + 8, 0);
      [[0, .4], [.3, .05], [.62, .03], [1, .26]].forEach(([o, a]) => sg.addColorStop(o, 'rgba(255,255,255,' + a + ')'));
      g.fillStyle = sg; g.fill(stem); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.1; g.stroke(stem);
      g.beginPath(); g.moveTo(CX - 3.2, 515); g.lineTo(CX - 3, 650); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.4; g.lineCap = 'round'; g.stroke();
      // borde trasero
      g.beginPath(); g.ellipse(CX, RIM_Y, halfW(RIM_Y), halfW(RIM_Y) * K, 0, Math.PI, TAU); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1.2; g.stroke();
      return c;
    }
    function buildFront() {
      const { c, g } = layer();
      // grosor del vidrio: banda interior suave + contorno
      g.save(); g.clip(bowl); g.lineWidth = 12; g.strokeStyle = 'rgba(255,255,255,.075)'; g.stroke(bowl); g.restore();
      g.lineWidth = 1.3; g.strokeStyle = 'rgba(255,255,255,.34)'; g.stroke(bowl);
      // reflejos verticales (ventana de estudio) a la izquierda y difuso a la derecha
      const streak = (dx, y0, y1, w, a) => {
        g.beginPath();
        for (let y = y0; y <= y1; y += 6) { const x = CX - halfW(y) + dx * (0.55 + 0.45 * Math.sin(((y - y0) / (y1 - y0)) * Math.PI)); y === y0 ? g.moveTo(x, y) : g.lineTo(x, y); }
        const lg = g.createLinearGradient(0, y0, 0, y1); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.25, 'rgba(255,255,255,' + a + ')'); lg.addColorStop(.8, 'rgba(255,255,255,' + a * 0.7 + ')'); lg.addColorStop(1, 'rgba(255,255,255,0)');
        g.strokeStyle = lg; g.lineWidth = w; g.lineCap = 'round'; g.stroke();
      };
      streak(15, 222, 420, 10, 0.11); streak(15, 222, 420, 3, 0.7);
      g.save(); g.scale(-1, 1); g.translate(-2 * CX, 0); streak(17, 250, 400, 9, 0.07); streak(17, 250, 400, 2, 0.32); g.restore();
      // reflejos puntuales
      [[CX - 83, 262, 3.2, .9], [CX - 78, 279, 1.6, .6], [CX + 76, 318, 2, .55]].forEach(([x, y, r, a]) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = 'rgba(255,255,255,' + a + ')'; g.fill(); });
      // borde delantero
      const hr = halfW(RIM_Y);
      g.beginPath(); g.ellipse(CX, RIM_Y, hr, hr * K, 0, 0, Math.PI); g.strokeStyle = 'rgba(255,255,255,.62)'; g.lineWidth = 1.8; g.stroke();
      g.beginPath(); g.ellipse(CX, RIM_Y, hr - 3, (hr - 3) * K * 0.92, 0, 0.1, Math.PI - 0.1); g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1; g.stroke();
      // luz que atraviesa la base del cuenco
      const rg = g.createRadialGradient(CX - 3, 476, 1, CX - 3, 476, 30); rg.addColorStop(0, 'rgba(255,255,255,.18)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg; g.fillRect(CX - 40, 440, 80, 70);
      return c;
    }

    function resize() {
      const cssW = canvas.clientWidth || W, dpr = Math.min(window.devicePixelRatio || 1, 2);
      S = (cssW / W) * dpr;
      canvas.width = Math.round(W * S); canvas.height = Math.round(H * S);
      back = buildBack(); front = buildFront(); draw();
    }

    // ---------- física ----------
    function update(dt) {
      st.clock += dt;
      const kc = 1 - Math.exp(-dt * 7);
      st.cT += (st.T - st.cT) * kc; st.cB += (st.B - st.cB) * kc; st.cA += (st.A - st.cA) * kc;
      if (Math.abs(st.T - st.cT) + Math.abs(st.A - st.cA) > 0.001) colors = wineColors(st.cT, st.cA);
      const damp = lerp(0.9, 0.5, st.cB);
      st.omega *= Math.exp(-damp * dt); if (Math.abs(st.omega) < 0.03) st.omega = 0;
      st.phi += st.omega * dt;
      st.charge += Math.abs(st.omega) * dt * 0.12;
      const target = Math.pow(clamp(Math.abs(st.omega) / 12, 0, 1), 0.8);
      st.amp += (target - st.amp) * (1 - Math.exp(-dt * (target > st.amp ? 6 : 1.3))); if (st.amp < 0.004 && target === 0) st.amp = 0;
      // servido
      let poured = 1;
      if (st.pour) {
        st.pour.t += dt / st.pour.dur; poured = easeOut(st.pour.t / 0.82);
        st.level = lerp(494, LEVEL, poured);
        if (!st.pour.rip || st.clock - st.pour.rip > 0.32) { st.pour.rip = st.clock; if (st.pour.t < 0.86) st.ripples.push({ t: 0, max: 0.9 }); }
        if (st.pour.t < 0.86) st.amp = Math.max(st.amp, 0.16);
        if (st.pour.t >= 1) { st.pour = null; st.level = LEVEL; }
      }
      // película en la pared + lágrimas
      const n = st.film.length; let total = 0;
      for (let i = 0; i < n; i++) {
        const th = (i / (n - 1)) * Math.PI, s = Math.pow(Math.max(0, Math.cos(th - st.phi)), 1.2);
        st.film[i] = Math.max(st.film[i] - dt * 2.8, st.amp * (14 + 50 * s)); total += st.film[i];
      }
      const filmN = total / n / 26;
      if (filmN > 0.12 && st.tears.length < 9 + st.cB * 9) {
        st.tearAcc += dt * filmN * (1.2 + 3.2 * st.cB);
        while (st.tearAcc >= 1) {
          st.tearAcc -= 1;
          const i = Math.floor(2 + Math.random() * (n - 4));
          if (st.film[i] > 9) { const th = (i / (n - 1)) * Math.PI, yc = st.level - liftAt(th), y0 = yc - st.film[i]; st.tears.push({ th, top: y0, y: y0 + 1, v: 11 + Math.random() * 15, lim: yc }); }
        }
      }
      for (let i = st.tears.length - 1; i >= 0; i--) { const t = st.tears[i]; t.y += t.v * dt * (1.25 - 0.55 * st.cB); if (t.y >= t.lim) st.tears.splice(i, 1); }
      // partículas
      const upd = (arr, g) => { for (let i = arr.length - 1; i >= 0; i--) { const p = arr[i]; p.life += dt; if (p.life >= p.max) { arr.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; if (g) p.vy += g * dt; } };
      upd(st.sparks, 150); upd(st.wisps, 0);
      for (let i = st.ripples.length - 1; i >= 0; i--) { st.ripples[i].t += dt; if (st.ripples[i].t >= st.ripples[i].max) st.ripples.splice(i, 1); }
      // brindis
      if (st.toast) { st.toast.t += dt / 0.95; st.tilt = Math.sin(Math.PI * clamp(st.toast.t, 0, 1)) * -0.045 * (1 - st.toast.t * 0.3); if (st.toast.t >= 1) { st.toast = null; st.tilt = 0; } }
      if (opts.onCharge) opts.onCharge(st.charge);
      return poured;
    }
    const liftAt = (th) => st.amp * (8 + 28 * Math.pow(0.5 + 0.5 * Math.cos(th - st.phi), 1.4));

    // ---------- dibujo ----------
    function draw() {
      if (!back) return;
      const g = ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height);
      g.setTransform(S, 0, 0, S, 0, 0);
      g.save();
      if (st.tilt) { g.translate(CX, FOOT_Y); g.rotate(st.tilt); g.translate(-CX, -FOOT_Y); }
      g.drawImage(back, 0, 0, W, H);
      // charco de luz rojiza que la copa proyecta sobre la mesa
      g.save(); g.translate(CX + 44, FOOT_Y + 10); g.scale(1, 0.17);
      const cg = g.createRadialGradient(0, 0, 4, 0, 0, 110); cg.addColorStop(0, colors.glowA(0.5 - st.cT * 0.18)); cg.addColorStop(1, colors.glowA(0)); g.fillStyle = cg; g.fillRect(-120, -120, 240, 240); g.restore();
      if (st.level < 493) drawWine(g);
      if (st.pour && st.pour.t < 0.9) drawStream(g);
      g.drawImage(front, 0, 0, W, H);
      drawParticles(g);
      g.restore();
    }

    function drawWine(g) {
      const A = st.amp, phi = st.phi, N = 64, pts = [];
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * TAU, yc = st.level - liftAt(th), hw = halfW(yc) - 1.4;
        pts.push({ x: CX + hw * Math.cos(th), y: yc + hw * K * Math.sin(th), th, yc, hw });
      }
      g.save(); g.clip(bowl);
      // cuerpo: todo lo que queda por debajo del borde trasero de la superficie
      g.beginPath(); g.moveTo(pts[N / 2].x, pts[N / 2].y);
      for (let i = N / 2; i <= N; i++) g.lineTo(pts[i].x, pts[i].y);
      g.lineTo(CX + 140, 530); g.lineTo(CX - 140, 530); g.closePath();
      const bx = g.createLinearGradient(CX - 124, 0, CX + 124, 0);
      [[0, colors.edge], [.17, colors.mid], [.5, colors.center], [.83, colors.mid], [1, colors.edge]].forEach(([o, c]) => bx.addColorStop(o, c));
      g.fillStyle = bx; g.fill();
      const by = g.createLinearGradient(0, st.level, 0, BOWL_END); by.addColorStop(0, 'rgba(0,0,0,0)'); by.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = by; g.fill();
      // luz que atraviesa el vino en la parte angosta
      const gl = g.createRadialGradient(CX - 10, 468, 2, CX - 10, 468, 80); gl.addColorStop(0, colors.glowA(0.3)); gl.addColorStop(1, colors.glowA(0)); g.fillStyle = gl; g.fill();
      g.save(); g.globalCompositeOperation = 'lighter'; const hl = g.createLinearGradient(CX - 60, 0, CX - 30, 0); hl.addColorStop(0, 'rgba(255,120,140,0)'); hl.addColorStop(.5, 'rgba(255,120,140,.035)'); hl.addColorStop(1, 'rgba(255,120,140,0)');
      g.fillStyle = hl; g.fillRect(CX - 60, st.level, 30, BOWL_END - st.level); g.restore();

      // película de vino en la pared (por encima de la superficie, cara delantera)
      const n = st.film.length;
      if (A > 0.005 || st.film[0] + st.film[16] > 0.6) {
        g.beginPath();
        for (let i = 0; i < n; i++) { const th = (i / (n - 1)) * Math.PI, yc = st.level - liftAt(th), yf = yc - st.film[i]; const x = wallX(yf, th), y = wallY(yf, th); i ? g.lineTo(x, y) : g.moveTo(x, y); }
        for (let i = n - 1; i >= 0; i--) { const th = (i / (n - 1)) * Math.PI, yc = st.level - liftAt(th); g.lineTo(wallX(yc, th), wallY(yc, th)); }
        g.closePath(); g.fillStyle = colors.midA(0.42); g.fill();
        g.beginPath();
        for (let i = 0; i < n; i++) { const th = (i / (n - 1)) * Math.PI, yc = st.level - liftAt(th), yf = yc - st.film[i]; const x = wallX(yf, th), y = wallY(yf, th); i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.strokeStyle = colors.rimA(0.6); g.lineWidth = 1.3; g.stroke();
      }
      // lágrimas
      for (const t of st.tears) {
        g.beginPath();
        for (let y = t.top; y <= t.y; y += 4) { const x = wallX(y, t.th), yy = wallY(y, t.th); y === t.top ? g.moveTo(x, yy) : g.lineTo(x, yy); }
        const hx = wallX(t.y, t.th), hy = wallY(t.y, t.th), w = 1.6 + st.cB * 1.6;
        g.strokeStyle = colors.midA(0.75); g.lineWidth = w; g.lineCap = 'round'; g.stroke();
        g.beginPath(); g.arc(hx, hy, w * 0.95 + 1.2, 0, TAU); g.fillStyle = colors.rimA(0.9); g.fill();
        g.beginPath(); g.arc(hx - 0.5, hy - 0.6, 0.7, 0, TAU); g.fillStyle = 'rgba(255,255,255,.7)'; g.fill();
      }
      // superficie
      g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath();
      const hw0 = halfW(st.level), sy = st.level;
      const sg = g.createRadialGradient(CX, sy, 3, CX, sy, hw0);
      sg.addColorStop(0, colors.center); sg.addColorStop(.55, colors.mid); sg.addColorStop(.9, colors.edge); sg.addColorStop(1, colors.rim);
      g.fillStyle = sg; g.fill();
      if (A > 0.02) { const dip = g.createRadialGradient(CX, sy, 1, CX, sy, hw0 * 0.75); dip.addColorStop(0, 'rgba(0,0,0,' + (A * 0.34) + ')'); dip.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = dip; g.fill(); }
      // destello que gira con la copa
      const cx1 = Math.cos(phi + 0.6), cy1 = Math.sin(phi + 0.6);
      const sh = g.createLinearGradient(CX - cx1 * hw0, sy - cy1 * hw0 * K, CX + cx1 * hw0, sy + cy1 * hw0 * K);
      sh.addColorStop(0.3, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,' + (0.12 + A * 0.2) + ')'); sh.addColorStop(0.7, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fill();
      g.save(); g.translate(CX - hw0 * 0.36, sy - hw0 * K * 0.3); g.rotate(-0.25); g.beginPath(); g.ellipse(0, 0, hw0 * 0.22, hw0 * K * 0.15, 0, 0, TAU); g.fillStyle = 'rgba(255,255,255,.17)'; g.fill(); g.restore();
      // vórtice: arcos concéntricos que giran con distinto retraso
      if (A > 0.03) {
        for (let k = 1; k <= 3; k++) {
          const r = hw0 * (0.28 + 0.2 * k) * (1 - A * 0.06), a0 = phi * (1 - k * 0.18) * 1.0;
          g.beginPath(); g.ellipse(CX, sy, r, r * K, 0, a0, a0 + Math.PI * 0.85); g.strokeStyle = 'rgba(255,255,255,' + (0.05 + A * 0.11) + ')'; g.lineWidth = 1.2; g.stroke();
        }
      }
      // ondas del servido
      for (const r of st.ripples) { const q = r.t / r.max, rr = hw0 * (0.06 + q * 0.8); g.beginPath(); g.ellipse(CX + 14, sy, rr, rr * K, 0, 0, TAU); g.strokeStyle = 'rgba(255,255,255,' + (0.28 * (1 - q)) + ')'; g.lineWidth = 1.3; g.stroke(); }
      // ribete violáceo del borde del vino (señal de vino joven) + borde delantero
      g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath();
      g.strokeStyle = colors.rimA(0.7); g.lineWidth = 1.8; g.stroke();
      g.beginPath(); for (let i = 0; i <= N / 2; i++) (i ? g.lineTo(pts[i].x, pts[i].y + 0.6) : g.moveTo(pts[i].x, pts[i].y + 0.6)); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1; g.stroke();
      g.restore();
    }

    function drawStream(g) {
      const p = st.pour, t = p.t, w = 7.5 * smooth(0, 0.1, t) * (1 - smooth(0.78, 0.9, t)); if (w < 0.3) return;
      const x0 = CX + 14, top = 0, bot = st.level + 2;
      g.save();
      g.beginPath();
      for (let y = top; y <= bot; y += 5) { const x = x0 + Math.sin(y * 0.03 + st.clock * 9) * 1.3, ww = w * (1 - 0.35 * (y / bot)); y === top ? g.moveTo(x - ww / 2, y) : g.lineTo(x - ww / 2, y); }
      for (let y = bot; y >= top; y -= 5) { const x = x0 + Math.sin(y * 0.03 + st.clock * 9) * 1.3, ww = w * (1 - 0.35 * (y / bot)); g.lineTo(x + ww / 2, y); }
      g.closePath();
      const lg = g.createLinearGradient(x0 - 4, 0, x0 + 4, 0); lg.addColorStop(0, colors.edge); lg.addColorStop(.45, colors.mid); lg.addColorStop(1, colors.center);
      g.fillStyle = lg; g.globalAlpha = 0.96; g.fill();
      g.restore();
      g.save(); g.beginPath(); g.moveTo(x0 - w * 0.22, 20); g.lineTo(x0 - w * 0.22, bot); g.strokeStyle = 'rgba(255,255,255,.38)'; g.lineWidth = 1.2; g.stroke(); g.restore();
    }

    function drawParticles(g) {
      if (!st.sparks.length && !st.wisps.length) return;
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const p of st.wisps) {
        const q = p.life / p.max, a = Math.sin(Math.PI * q) * 0.22, r = p.size * (0.7 + q);
        const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); gr.addColorStop(0, 'rgba(255,205,175,' + a + ')'); gr.addColorStop(1, 'rgba(255,205,175,0)'); g.fillStyle = gr; g.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      }
      for (const p of st.sparks) {
        const q = 1 - p.life / p.max, a = q * q; g.fillStyle = 'rgba(255,214,140,' + a + ')';
        g.beginPath(); g.arc(p.x, p.y, p.size * (0.4 + q * 0.6), 0, TAU); g.fill();
        if (p.star && q > 0.35) { g.strokeStyle = 'rgba(255,236,190,' + a * 0.8 + ')'; g.lineWidth = 0.9; const s = p.size * 3 * q; g.beginPath(); g.moveTo(p.x - s, p.y); g.lineTo(p.x + s, p.y); g.moveTo(p.x, p.y - s); g.lineTo(p.x, p.y + s); g.stroke(); }
      }
      g.restore();
    }

    // ---------- bucle: solo corre mientras hay movimiento ----------
    function busy() {
      return st.omega !== 0 || st.amp > 0 || st.tears.length || st.sparks.length || st.wisps.length || st.ripples.length || st.pour || st.toast ||
        Math.abs(st.T - st.cT) + Math.abs(st.B - st.cB) + Math.abs(st.A - st.cA) > 0.001 || st.film[16] > 0.3;
    }
    function frame(now) {
      const dt = clamp((now - last) / 1000 || 0.016, 0.001, 0.05); last = now;
      update(dt); draw();
      if (active && busy()) raf = requestAnimationFrame(frame); else running = false;
    }
    function kick() { if (!active || running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }

    const api = {
      resize,
      // giro: dv en rad/s (positivo = horario)
      // cualquier movimiento suma energía al giro (el sentido lo fija el primer gesto): ir y venir con el mouse también hace girar el vino
      impulse(dv) { const gain = 1.15 - 0.5 * st.B, dir = st.omega < 0 ? -1 : 1; st.omega = clamp(st.omega + dir * Math.abs(dv) * gain, -15, 15); if (st.omega === 0) st.omega = dir * Math.abs(dv) * gain; kick(); },
      setProfile(p) { if (p.t !== undefined) st.T = clamp(p.t, 0, 1); if (p.b !== undefined) st.B = clamp(p.b, 0, 1); if (p.a !== undefined) st.A = clamp(p.a, 0, 1); if (reduced) { st.cT = st.T; st.cB = st.B; st.cA = st.A; colors = wineColors(st.cT, st.cA); draw(); } kick(); },
      pour(instant) {
        if (instant || reduced) { st.pour = null; st.level = LEVEL; draw(); return; }
        st.level = 494; st.pour = { t: 0, dur: 3.1, rip: 0 }; kick();
      },
      toast() {
        st.toast = { t: 0 }; st.omega = clamp(st.omega + 2.5, -15, 15);
        const hr = halfW(RIM_Y), x0 = CX + hr * 0.7, y0 = RIM_Y + hr * K * 0.7;
        for (let i = 0; i < 34; i++) { const a = -Math.PI * (0.1 + Math.random() * 0.8), v = 70 + Math.random() * 150; st.sparks.push({ x: x0, y: y0, vx: Math.cos(a) * v * 0.9 + 20, vy: Math.sin(a) * v, life: 0, max: 0.8 + Math.random() * 0.8, size: 1.3 + Math.random() * 1.8, star: Math.random() < 0.3 }); }
        kick();
      },
      wisps(n) {
        for (let i = 0; i < (n || 10); i++) st.wisps.push({ x: CX + (Math.random() - 0.5) * 120, y: st.level - 8 - Math.random() * 12, vx: (Math.random() - 0.5) * 16, vy: -28 - Math.random() * 40, life: -Math.random() * 0.5, max: 1.7 + Math.random() * 0.9, size: 12 + Math.random() * 16 });
        kick();
      },
      get charge() { return st.charge; }, resetCharge() { st.charge = 0; },
      setActive(on) { active = !!on; if (active) { draw(); kick(); } else { cancelAnimationFrame(raf); running = false; } },
    };
    resize();
    return api;
  }

  window.CopaGlass = { create };
})();
