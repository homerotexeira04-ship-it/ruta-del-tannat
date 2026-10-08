/* ============================================================
   Escenas 1–2: la gota y el nombre
   ============================================================ */
(function () {
  const { TAU, clamp, lerp, E, seg, spring, hash, noise1, rgba, col, text, W, H, BEAT, BAR, c01 } = R;
  const cam = (ctx, ctxL, T, zoom = 1, ox = 960, oy = 540, shk = 1) => {
    const [dx, dy, r] = R.shakeAt(T, shk);
    for (const c of [ctx, ctxL]) { c.translate(W / 2 + dx, H / 2 + dy); c.rotate(r); c.scale(zoom, zoom); c.translate(-ox, -oy); }
  };

  /* ---------------------------------------------------------
     1 · LA GOTA  (0 – 1.875)
     --------------------------------------------------------- */
  const TIP = 470, DROP_T = 1.12, HIT_T = 1.5, FLOOR = 900, G = 5200;
  R.defScene('intro', {
    bg: (lt) => ({ mode: 4, c0: [0.010, 0.002, 0.005], c1: [0.115, 0.02, 0.042], c2: [0.45, 0.07, 0.12], r: [0, 0, -0.33, 0.55 * clamp((lt - HIT_T) / 0.1) * Math.exp(-Math.max(0, lt - HIT_T) * 1.2)] }),
    draw(ctx, ctxL, lt, T, scene) {
      ctx.save(); ctxL.save();
      const zoom = 1 + 0.07 * E.inOutC(seg(lt, 0.7, 1.55));
      cam(ctx, ctxL, T, zoom, 960, 700, 0.8);
      R.motes(ctxL, T, { n: 40, alpha: 0.7 * clamp(lt / 0.6), seed: 3 });

      // --- la línea dorada que baja ---
      const head = TIP * E.inOutC(seg(lt, 0.02, 0.8));
      const recoil = lt > DROP_T ? -64 * E.outCirc(seg(lt, DROP_T, DROP_T + 0.28)) + 7 * Math.sin((lt - DROP_T) * 38) * Math.exp(-(lt - DROP_T) * 9) : 0;
      const tipY = head + recoil;
      const bulbP = E.outBack(seg(lt, 0.8, DROP_T - 0.02), 2.2);
      const bulbR = 24 * bulbP;
      if (lt > 0.1) {
        // regla: marcas que acompañan el descenso
        ctx.save();
        for (let y = 0; y < head; y += 20) {
          const big = y % 100 === 0;
          const a = clamp((head - y) / 120) * (big ? 0.85 : 0.38) * (1 - seg(lt, DROP_T, DROP_T + 0.3));
          ctx.strokeStyle = rgba(col.goldL, a); ctx.lineWidth = big ? 1.8 : 1.1;
          R.line(ctx, 960 - (big ? 28 : 15), y, 960, y);
          if (big && y > 0) text(ctx, String(y).padStart(3, '0'), 960 - 40, y + 5, { size: 14, weight: 600, ls: 2, fill: col.goldL, align: 'right', alpha: a });
        }
        ctx.restore();
        // hilo (se afina cerca de la gota)
        const grad = ctx.createLinearGradient(0, 0, 0, Math.max(10, tipY));
        grad.addColorStop(0, rgba(col.gold, 0)); grad.addColorStop(0.55, rgba(col.goldL, 0.95)); grad.addColorStop(1, rgba(col.goldHi, 1));
        const bulbCy = tipY + bulbR * 0.9;
        if (lt < DROP_T) {
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.moveTo(959, 0); ctx.lineTo(961, 0);
          const neck = clamp(bulbP) * 1;
          for (let i = 0; i <= 24; i++) { const y = lerp(0, bulbCy, i / 24); const k = Math.pow(clamp((y - (bulbCy - 90)) / 90), 2.2) * neck; ctx.lineTo(961 + k * bulbR * 0.5 + 0.0, y); }
          for (let i = 24; i >= 0; i--) { const y = lerp(0, bulbCy, i / 24); const k = Math.pow(clamp((y - (bulbCy - 90)) / 90), 2.2) * neck; ctx.lineTo(959 - k * bulbR * 0.5, y); }
          ctx.fill();
        } else {
          ctx.strokeStyle = grad; ctx.lineWidth = 2; R.line(ctx, 960, 0, 960, tipY);
          // látigo del hilo cortado
          ctx.fillStyle = rgba(col.goldHi, 0.9 * (1 - seg(lt, DROP_T, DROP_T + 0.25))); R.circle(ctx, 960, tipY, 3.2); ctx.fill();
        }
        // brillo en la cabeza
        R.glow(ctxL, 960, lt < DROP_T ? tipY + bulbR * 0.9 : tipY, 110, col.gold, 0.55 * (1 - seg(lt, DROP_T, DROP_T + 0.3)));
      }

      // --- la gota ---
      if (lt >= 0.8 && lt < HIT_T) {
        let y, r = 24, stretch = 0;
        if (lt < DROP_T) { r = bulbR; y = tipY + bulbR * 0.9; stretch = 0.25 * (lt - 0.8) / (DROP_T - 0.8); }
        else { const tau = lt - DROP_T; const y0 = TIP + 24 * 0.9 + 0; y = y0 + 0.5 * G * tau * tau; stretch = clamp(G * tau / 2300); r = 24; }
        const rw = r * (1 - 0.2 * stretch), rh = r * (1 + 0.18 * stretch), len = r * (1.5 + 3.4 * stretch);
        const lenTop = lt < DROP_T ? r * 1.2 : len;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(960, y - lenTop);
        ctx.bezierCurveTo(960 + rw * 0.12, y - lenTop * 0.55, 960 + rw, y - rw * 0.9, 960 + rw, y);
        ctx.bezierCurveTo(960 + rw, y + rh * 0.56, 960 + rw * 0.56, y + rh, 960, y + rh);
        ctx.bezierCurveTo(960 - rw * 0.56, y + rh, 960 - rw, y + rh * 0.56, 960 - rw, y);
        ctx.bezierCurveTo(960 - rw, y - rw * 0.9, 960 - rw * 0.12, y - lenTop * 0.55, 960, y - lenTop);
        ctx.closePath();
        const g = ctx.createRadialGradient(960 - rw * 0.3, y - rh * 0.2, 1, 960, y, rh * 1.25);
        g.addColorStop(0, '#E0606F'); g.addColorStop(0.35, '#9B2636'); g.addColorStop(1, '#3a0912');
        ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 1.6; ctx.strokeStyle = rgba(col.goldHi, 0.75); ctx.stroke();
        // reflejo
        ctx.fillStyle = 'rgba(255,240,230,.85)'; ctx.beginPath(); ctx.ellipse(960 - rw * 0.38, y - rh * 0.18, rw * 0.13, rh * 0.32, 0.3, 0, TAU); ctx.fill();
        ctx.restore();
        R.glow(ctxL, 960, y, 140 + 80 * stretch, '#C03045', 0.55);
      }

      // --- impacto ---
      const tau = lt - HIT_T;
      if (tau > 0) {
        // superficie
        const half = 1500 * E.outX(clamp(tau / 0.4));
        const fa = 0.9 * (1 - seg(tau, 0.2, 0.55));
        const lg = ctx.createLinearGradient(960 - half, 0, 960 + half, 0);
        lg.addColorStop(0, rgba(col.goldHi, 0)); lg.addColorStop(0.5, rgba(col.goldHi, fa)); lg.addColorStop(1, rgba(col.goldHi, 0));
        ctx.fillStyle = lg; ctx.fillRect(960 - half, FLOOR - 1.5, half * 2, 3);
        // ondas
        for (let j = 0; j < 4; j++) {
          const t2 = tau - j * 0.065; if (t2 <= 0) continue;
          const p = clamp(t2 / 0.62), rx = 30 + 1250 * E.outQt(p);
          ctx.strokeStyle = rgba(j % 2 ? '#E7A0A8' : col.goldHi, 0.8 * (1 - p) * (1 - j * 0.15)); ctx.lineWidth = 3.2 - j * 0.6;
          ctx.beginPath(); ctx.ellipse(960, FLOOR, rx, rx * 0.15, 0, 0, TAU); ctx.stroke();
        }
        // corona de gotas
        for (let i = 0; i < 46; i++) {
          const hA = hash(i * 1.7 + 4), hB = hash(i * 2.9 + 11), hC = hash(i * 5.3 + 2);
          const ang = -Math.PI / 2 + (hA - 0.5) * 2.5, v = 380 + hB * 1000;
          const px = 960 + Math.cos(ang) * v * tau * 0.95, py = FLOOR + Math.sin(ang) * v * tau + 0.5 * 2900 * tau * tau;
          if (py > FLOOR + 6 && tau > 0.08) continue;
          const rr = 2.6 + hC * 6.2, fade = 1 - seg(tau, 0.35, 0.62);
          if (fade <= 0) continue;
          ctx.fillStyle = rgba(i % 5 === 0 ? col.goldHi : '#B33345', fade);
          R.circle(ctx, px, py, rr); ctx.fill();
          if (i % 3 === 0) R.glow(ctxL, px, py, rr * 5, '#E05468', 0.35 * fade);
        }
        // onda de choque + destello
        const sp = clamp(tau / 0.5);
        ctxL.strokeStyle = rgba(col.goldHi, 0.9 * (1 - sp)); ctxL.lineWidth = 9 * (1 - sp) + 1;
        ctxL.beginPath(); ctxL.arc(960, FLOOR, 1700 * E.outQt(sp), 0, TAU); ctxL.stroke();
        R.glow(ctxL, 960, FLOOR, 720, '#E2566A', 0.85 * Math.exp(-tau / 0.11));
        R.glow(ctxL, 960, FLOOR, 260, col.goldHi, 0.95 * Math.exp(-tau / 0.06));
      }

      // coordenadas (aparecen con la línea)
      const ca = clamp((lt - 0.08) / 0.3) * (1 - seg(lt, 1.2, 1.5));
      if (ca > 0) {
        text(ctx, '31°23′ S', 960 + 60, 214, { size: 22, weight: 600, ls: 5, fill: col.goldL, alpha: ca * 0.9 });
        text(ctx, '57°58′ O', 960 + 60, 246, { size: 22, weight: 600, ls: 5, fill: col.goldL, alpha: ca * 0.9 });
        text(ctx, 'SALTO · URUGUAY', 960 + 60, 296, { size: 16, weight: 700, ls: 6, fill: '#E9DCC4', alpha: ca * 0.75 });
      }
      ctx.restore(); ctxL.restore();
      R.hud(ctx, T, scene, 'dark');
    },
  });

  /* ---------------------------------------------------------
     2 · EL NOMBRE (1.875 – 3.75)
     --------------------------------------------------------- */
  R.defScene('title', {
    fx: { bloomMul: 0.72 },
    bg: (lt, T) => ({
      mode: 0, c0: c01('#16030a'), c1: c01('#5c1020'), c2: c01('#b83a4b'), c3: c01('#ffe6cf'),
      p: [1.55, 2.5, 1.0, 0.26], q: [-0.55, 0.7, 26, 0.55], r: [0, 0, 0, 0.22],
    }),
    draw(ctx, ctxL, lt, T, scene) {
      ctx.save(); ctxL.save();
      const push = 1 + 0.045 * E.inQ(seg(lt, 1.2, 1.9)) + 0.012 * seg(lt, 0, 1.9);
      cam(ctx, ctxL, T, push, 960, 540, 0.7);
      R.motes(ctxL, T, { n: 52, seed: 7, alpha: 0.9 });
      const bp = R.beatEnv(T, 0.2);
      // rosetón guilloché + bisel
      const reveal = E.outC(seg(lt, -0.05, 1.0));
      R.guilloche(ctx, 960, 540, 392, { K: 46, n: 11, rot: lt * 0.38, prog: reveal, alpha: 0.95 });
      R.ticks(ctx, 960, 540, 446, { n: 120, rot: -lt * 0.12 - 0.5, prog: E.outC(seg(lt, 0, 0.9)), alpha: 0.9 });
      R.glow(ctxL, 960, 560, 640, '#B8304A', 0.35 * E.outC(seg(lt, 0, 0.5)));
      // ondas que salen del rosetón en cada golpe
      for (let k = 0; k < 4; k++) {
        const tb = BEAT * (k + 1), tau = lt - tb; if (tau < 0 || tau > 0.9) continue;
        const p = tau / 0.9, rr_ = 120 + 1000 * E.outQt(p);
        ctx.strokeStyle = rgba(col.goldHi, 0.5 * (1 - p)); ctx.lineWidth = 2.5 * (1 - p) + 0.5; ctx.beginPath(); ctx.arc(960, 540, rr_, 0, TAU); ctx.stroke();
        ctxL.strokeStyle = rgba(col.gold, 0.35 * (1 - p)); ctxL.lineWidth = 10 * (1 - p); ctxL.beginPath(); ctxL.arc(960, 540, rr_, 0, TAU); ctxL.stroke();
      }
      // "LA RUTA DEL"
      const o1 = { size: 40, weight: 700, ls: 26, fill: col.goldHi, align: 'center' };
      R.riseText(ctx, 'LA RUTA DEL', 960 + 13, 424, o1, lt, 0.12, 0.035, 0.45);
      // "Tannat"
      const oT = { size: 372, weight: 600, italic: true, serif: true, fill: '#FBF1E6', align: 'center', ls: -4 };
      const scl = 1 + 0.04 * bp * seg(lt, 0.3, 0.5);
      ctx.save(); ctx.translate(960, 740); ctx.scale(scl, scl); ctx.translate(-960, -740);
      ctx.shadowColor = 'rgba(20,0,6,.55)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
      R.riseText(ctx, 'Tannat', 960, 748, oT, lt, 0.0, 0.052, 0.5, { spring: true, f: 2.3, z: 0.46, rise: 1.02, bob: 7 });
      ctx.restore();
      // destello que cruza el título
      const sw = lt < 1.2 ? seg(lt, 0.78, 1.28, E.inOutQ) : 1 - seg(lt, 1.3, 1.75, E.inOutQ);
      if (sw > 0 && sw < 1) {
        ctx.save();
        ctx.beginPath(); const x0 = lerp(300, 1620, sw);
        ctx.moveTo(x0 - 70, 340); ctx.lineTo(x0 + 10, 340); ctx.lineTo(x0 - 130, 830); ctx.lineTo(x0 - 210, 830); ctx.closePath(); ctx.clip();
        R.layoutChars; text(ctx, 'Tannat', 960, 748, Object.assign({}, oT, { fill: '#FFE9B8' }));
        ctx.restore();
      }
      // velo oscuro suave detrás del lema (legibilidad sobre el vino brillante)
      { const g = ctx.createRadialGradient(960, 868, 20, 960, 868, 620); g.addColorStop(0, 'rgba(18,3,9,.62)'); g.addColorStop(1, 'rgba(18,3,9,0)');
        ctx.save(); ctx.translate(960, 868); ctx.scale(1, 0.26); ctx.translate(-960, -868); ctx.globalAlpha = E.outC(seg(lt, 0.4, 0.9)); ctx.fillStyle = g; ctx.fillRect(300, 400, 1320, 960); ctx.restore(); }
      // línea + lema
      const lp = E.outQt(seg(lt, 0.55, 1.05));
      const oS = { size: 27, weight: 700, ls: 15, fill: col.goldL, align: 'center' };
      const tw = R.textWidth(oS, 'CEPA, ORIGEN E IDENTIDAD');
      text(ctx, 'CEPA, ORIGEN E IDENTIDAD', 960 + 7, 846, Object.assign({ alpha: E.outC(seg(lt, 0.6, 0.95)) }, oS));
      ctx.strokeStyle = rgba(col.gold, 0.9); ctx.lineWidth = 2;
      R.line(ctx, 960 - tw / 2 - 40, 837, 960 - tw / 2 - 40 - 260 * lp, 837);
      R.line(ctx, 960 + tw / 2 + 40, 837, 960 + tw / 2 + 40 + 260 * lp, 837);
      ctx.fillStyle = rgba(col.goldHi, lp); R.circle(ctx, 960 - tw / 2 - 40 - 260 * lp, 837, 4); ctx.fill(); R.circle(ctx, 960 + tw / 2 + 40 + 260 * lp, 837, 4); ctx.fill();
      text(ctx, 'SALTO · URUGUAY  —  CUNA DEL TANNAT', 960 + 5, 912, { size: 18, weight: 600, ls: 10, fill: '#E9DCC4', align: 'center', alpha: 0.85 * E.outC(seg(lt, 0.9, 1.3)) });
      ctx.restore(); ctxL.restore();
      R.hud(ctx, T, scene, 'dark');
    },
  });
})();
