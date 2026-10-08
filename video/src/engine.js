/* ============================================================
   engine.js — utilidades de motion: easings, resortes, ruido,
   texto cinético, caminos. Todo es función pura del tiempo:
   el mismo t siempre dibuja el mismo cuadro (render en paralelo).
   ============================================================ */
(function () {
  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const fract = (x) => x - Math.floor(x);
  const sat = (x) => clamp(x, 0, 1);

  /* ---------- easings ---------- */
  const E = {
    lin: (x) => x,
    inQ: (x) => x * x,
    outQ: (x) => 1 - (1 - x) * (1 - x),
    inOutQ: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
    inC: (x) => x * x * x,
    outC: (x) => 1 - Math.pow(1 - x, 3),
    inOutC: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outQt: (x) => 1 - Math.pow(1 - x, 4),
    inQt: (x) => x * x * x * x,
    inOutQt: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
    outX: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inX: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
    inOutX: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
    outCirc: (x) => Math.sqrt(1 - Math.pow(x - 1, 2)),
    inCirc: (x) => 1 - Math.sqrt(1 - x * x),
    outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
    inBack: (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x,
    outElastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
    bez(x1, y1, x2, y2) {
      // cubic-bezier estilo CSS
      const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
      const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
      const sx = (t) => ((ax * t + bx) * t + cx) * t;
      const sy = (t) => ((ay * t + by) * t + cy) * t;
      const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
      return (x) => {
        if (x <= 0) return 0; if (x >= 1) return 1;
        let t = x;
        for (let i = 0; i < 6; i++) { const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= (sx(t) - x) / d; }
        t = clamp(t);
        return sy(t);
      };
    },
  };
  // curvas con "peso": la de entrada del reel (rápida al inicio, asienta largo)
  E.snap = E.bez(0.16, 1, 0.3, 1);
  E.punch = E.bez(0.2, 0.9, 0.1, 1);
  E.whip = E.bez(0.7, 0, 0.1, 1);
  E.soft = E.bez(0.45, 0, 0.15, 1);

  /* progreso 0..1 de t entre a y b, con easing */
  const seg = (t, a, b, e = E.lin) => e(clamp((t - a) / (b - a)));
  /* resorte amortiguado subcrítico: sobrepasa y asienta. f en Hz, z amortiguación */
  function spring(t, f = 2.6, z = 0.42) {
    if (t <= 0) return 0;
    const w = TAU * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  }
  /* pulso: golpe instantáneo que decae (para hits en el beat) */
  const pulse = (t, t0, decay = 0.18) => (t < t0 ? 0 : Math.exp(-(t - t0) / decay));

  /* ---------- aleatorio determinista ---------- */
  function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return n - Math.floor(n); }
  function hash2(x, y) { return hash(x * 157.31 + y * 91.7 + 0.37); }
  function mulberry(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }
  function noise2(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
    return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
  }
  function fbm1(x, o = 3) { let s = 0, a = 0.5; for (let i = 0; i < o; i++) { s += a * noise1(x); x *= 2.02; a *= 0.5; } return s; }

  /* ---------- color ---------- */
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function rgba(c, a = 1) { if (typeof c === 'string') c = hex(c); return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
  function mixc(a, b, t) { if (typeof a === 'string') a = hex(a); if (typeof b === 'string') b = hex(b); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  const col = {
    ink: '#12040a', deep: '#2B0A14', wineD: '#4A101D', wine: '#721B28', wineL: '#8F2636', wineHi: '#B83A4B',
    gold: '#C29D62', goldL: '#D9B47A', goldHi: '#F1D9A6', goldD: '#7E6536',
    crema: '#FAF8F5', pergamino: '#EFE6D8', basalt: '#181818', basaltS: '#242424', basaltC: '#2A2A2A',
    teal: '#2F8F86', tealD: '#0B3D44', tealL: '#7FD1C4', terroir: '#5A4D41',
  };

  /* ---------- texto ---------- */
  const _mc = document.createElement('canvas').getContext('2d');
  function setFont(ctx, o) {
    const style = o.italic ? 'italic ' : '';
    const fam = o.serif ? '"Playfair Display", Georgia, serif' : '"Plus Jakarta Sans", sans-serif';
    ctx.font = `${style}${o.weight || 400} ${o.size}px ${fam}`;
    ctx.letterSpacing = '0px';
    ctx.textBaseline = o.base || 'alphabetic';
  }
  const _wc = new Map();
  function measure(o, str) {
    const k = `${o.serif ? 1 : 0}${o.italic ? 1 : 0}${o.weight || 400}|${o.size}|${str}`;
    let w = _wc.get(k);
    if (w === undefined) { setFont(_mc, o); w = _mc.measureText(str).width; _wc.set(k, w); }
    return w;
  }
  /* ancho con tracking */
  const textWidth = (o, str) => measure(o, str) + (o.ls || 0) * (str.length - 1);
  /* posiciones por letra (conserva kerning midiendo prefijos) */
  function layoutChars(o, str, x, align = 'left') {
    const ls = o.ls || 0, total = textWidth(o, str);
    let x0 = x; if (align === 'center') x0 = x - total / 2; else if (align === 'right') x0 = x - total;
    const out = [];
    for (let i = 0; i < str.length; i++) {
      const pre = measure(o, str.slice(0, i));
      const w = measure(o, str.slice(0, i + 1)) - pre;
      out.push({ ch: str[i], x: x0 + pre + i * ls, w, i });
    }
    return { chars: out, total, x0 };
  }
  /* texto simple con alineación y tracking */
  function text(ctx, str, x, y, o) {
    setFont(ctx, o);
    const ls = o.ls || 0;
    ctx.fillStyle = o.fill || '#fff';
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    if (ls === 0 || typeof ctx.letterSpacing === 'undefined') {
      ctx.textAlign = o.align || 'left';
      ctx.fillText(str, x, y);
    } else {
      ctx.textAlign = 'left';
      const L = layoutChars(o, str, x, o.align || 'left');
      for (const c of L.chars) ctx.fillText(c.ch, c.x, y);
    }
    if (o.alpha !== undefined) ctx.globalAlpha /= o.alpha || 1;
  }

  /* ---------- formas ---------- */
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function glow(ctx, x, y, r, color, a = 1, inner = 0) {
    const g = ctx.createRadialGradient(x, y, inner, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(0.4, rgba(color, a * 0.35)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }

  /* ---------- camino Catmull-Rom con longitud de arco ---------- */
  function makePath(pts, steps = 40, closed = false) {
    const P = closed ? pts.concat([pts[0], pts[1], pts[2]]) : [pts[0]].concat(pts, [pts[pts.length - 1]]);
    const out = [];
    const n = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < n; i++) {
      const p0 = P[i], p1 = P[i + 1], p2 = P[i + 2], p3 = P[i + 3] || p2;
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    if (!closed) out.push(pts[pts.length - 1]);
    const len = [0];
    for (let i = 1; i < out.length; i++) len.push(len[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
    const total = len[len.length - 1];
    function at(u) { // u 0..1 por longitud de arco
      const d = clamp(u) * total;
      let lo = 0, hi = len.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (len[m] < d) lo = m; else hi = m; }
      const f = (d - len[lo]) / Math.max(1e-6, len[hi] - len[lo]);
      const a = out[lo], b = out[hi];
      return { x: lerp(a[0], b[0], f), y: lerp(a[1], b[1], f), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    }
    function trace(ctx, u0, u1) {
      const d0 = clamp(u0) * total, d1 = clamp(u1) * total;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < out.length; i++) {
        if (len[i] < d0 - 1e-6 || len[i] > d1 + 1e-6) continue;
        if (!started) { const s = at(u0); ctx.moveTo(s.x, s.y); started = true; }
        ctx.lineTo(out[i][0], out[i][1]);
      }
      const e = at(u1); if (!started) ctx.moveTo(at(u0).x, at(u0).y); ctx.lineTo(e.x, e.y);
    }
    return { pts: out, len, total, at, trace };
  }

  /* ---------- tiempo ---------- */
  const BPM = 128, BEAT = 60 / BPM, S16 = BEAT / 4, BAR = BEAT * 4;
  const FPS = 60, DUR = 15;
  const tc = (t) => { // timecode HH:MM:SS:FF
    const f = Math.floor(t * FPS + 1e-6), ff = f % FPS, s = Math.floor(f / FPS);
    const p = (n, l = 2) => String(n).padStart(l, '0');
    return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(ff)}`;
  };

  window.R = Object.assign(window.R || {}, {
    TAU, clamp, lerp, fract, sat, E, seg, spring, pulse, hash, hash2, mulberry, noise1, noise2, fbm1,
    hex, rgba, mixc, col, setFont, measure, textWidth, layoutChars, text, rr, glow, line, circle, makePath,
    BPM, BEAT, S16, BAR, FPS, DUR, tc, W: 1920, H: 1080,
  });
})();
