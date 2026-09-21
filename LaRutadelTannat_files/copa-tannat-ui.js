/*
 * "La Copa de Tannat" — interfaz: gestos, aromas, perfil (tanino/cuerpo/acidez), maridajes y brindis.
 * Depende de copa-tannat-render.js y del diccionario `translations` del sitio (ES/PT/EN).
 */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const section = $('copa'), stage = $('cupStage'), canvas = $('cupCanvas');
  if (!section || !stage || !canvas || !window.CopaGlass) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dict = () => (typeof translations !== 'undefined' ? (translations[currentLang] || translations.es) : {});
  const tr = (k) => dict()[k] || (typeof translations !== 'undefined' && translations.es[k]) || '';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const glass = window.CopaGlass.create(canvas, { reducedMotion: reduced, onCharge });

  // ---------- aromas (típicos de la cepa Tannat; cada vino tiene su propio perfil) ----------
  const ICON = {
    berries: '<circle cx="9" cy="14.5" r="3.9"/><circle cx="15.2" cy="14.5" r="3.9"/><circle cx="12.1" cy="8.6" r="3.9"/><path d="M12 4.6c.2-1.3 1-2.2 2.3-2.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    violet: '<g>' + [0, 72, 144, 216, 288].map((a) => '<ellipse cx="12" cy="6.6" rx="2.7" ry="4.3" transform="rotate(' + a + ' 12 12)"/>').join('') + '</g><circle cx="12" cy="12" r="1.7" fill="#3a1030"/>',
    pepper: '<circle cx="8" cy="9" r="2.6"/><circle cx="15.6" cy="8" r="2.6"/><circle cx="11.5" cy="15.5" r="2.6"/><circle cx="18" cy="15.4" r="1.9"/><circle cx="5.5" cy="16" r="1.9"/>',
    oak: '<path d="M7.2 3.5h9.6c2.2 3 2.2 14 0 17H7.2c-2.2-3-2.2-14 0-17z"/><path d="M6.4 8h11.2M6.2 16h11.6" fill="none" stroke="#3a1030" stroke-width="1.3"/>',
    leaf: '<path d="M4.5 19.5C4.5 10 9.6 4.6 19.5 4.6c0 9.6-5.3 14.9-15 14.9z"/><path d="M5 19l9.5-9.5" fill="none" stroke="#3a1030" stroke-width="1.3" stroke-linecap="round"/>',
  };
  const AROMAS = [
    { id: 'a1', icon: 'berries', x: 15, y: 19, th: 1.1 }, { id: 'a2', icon: 'violet', x: 31, y: 8.5, th: 2.7 }, { id: 'a3', icon: 'pepper', x: 50, y: 4, th: 4.8 },
    { id: 'a4', icon: 'oak', x: 69, y: 8.5, th: 7.0 }, { id: 'a5', icon: 'leaf', x: 85, y: 19, th: 9.6 },
  ];
  const orbsEl = $('cupOrbs'), card = $('cupCard'), cardT = $('cupCardTitle'), cardP = $('cupCardText'), prog = $('cupProgress'), live = $('cupLive'), dots = $('cupDots');
  let released = 0, selected = -1, done = false, touched = false;

  // pestañas (solo se ven en celular/tablet: en escritorio todo el panel está a la vista)
  const panel = $('cupPanel'), tabBtns = [...panel.querySelectorAll('.cup-tab')];
  function setTab(t) { panel.dataset.tab = t; tabBtns.forEach((b) => { const on = b.dataset.tab === t; b.setAttribute('aria-selected', on ? 'true' : 'false'); if (on) b.classList.remove('is-new'); }); }
  tabBtns.forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));

  AROMAS.forEach((a, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cup-orb'; b.style.left = a.x + '%'; b.style.top = a.y + '%'; b.dataset.i = i; b.tabIndex = -1; b.setAttribute('aria-hidden', 'true');
    b.innerHTML = '<span class="cup-orb-i"><svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">' + ICON[a.icon] + '</svg></span><span class="cup-orb-name"></span>';
    b.addEventListener('click', () => select(i));
    orbsEl.appendChild(b); a.el = b;
    const d = document.createElement('span'); d.className = 'cup-dot'; dots.appendChild(d); a.dot = d;
  });

  function aromaName(i) { return tr('cup.' + AROMAS[i].id + '.name'); }
  function renderCard() {
    if (selected >= 0) { cardT.textContent = aromaName(selected); cardP.textContent = tr('cup.' + AROMAS[selected].id + '.info'); }
    else if (done) { cardT.textContent = tr('cup.card.doneT'); cardP.textContent = tr('cup.card.done'); }
    else { cardT.textContent = tr('cup.card.idleT'); cardP.textContent = tr('cup.card.idle'); }
    prog.textContent = tr('cup.card.progress').replace('{n}', released);
    AROMAS.forEach((a, i) => { a.el.setAttribute('aria-label', aromaName(i)); a.el.querySelector('.cup-orb-name').textContent = aromaName(i); a.dot.classList.toggle('is-on', i < released); a.el.classList.toggle('is-selected', i === selected); });
    card.classList.remove('cup-in'); void card.offsetWidth; card.classList.add('cup-in');
  }
  function release(i) {
    const a = AROMAS[i], sw = stage.clientWidth, sh = stage.clientHeight;
    a.el.style.setProperty('--dx', ((50 - a.x) / 100) * sw + 'px'); a.el.style.setProperty('--dy', ((26.3 - a.y) / 100) * sh + 'px');
    a.el.classList.add('is-on'); a.el.tabIndex = 0; a.el.removeAttribute('aria-hidden');
    if (panel.dataset.tab !== 'aromas') tabBtns[0].classList.add('is-new'); // punto de aviso en la pestaña
    glass.wisps(9);
    if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { /* sin vibración */ }
    live.textContent = tr('cup.live.released') + ' ' + aromaName(i);
    if (released === AROMAS.length) {
      done = true; section.classList.add('cup-done'); glass.wisps(16); stage.classList.add('cup-flare');
      if (panel.dataset.tab !== 'pair') tabBtns[2].classList.add('is-new');
      setTimeout(() => stage.classList.remove('cup-flare'), 1600);
    }
    if (selected < 0) renderCard(); else { prog.textContent = tr('cup.card.progress').replace('{n}', released); a.dot.classList.add('is-on'); }
  }
  function select(i) {
    selected = selected === i ? -1 : i; setTab('aromas'); renderCard();
    if (selected >= 0) glass.wisps(4);
  }
  function onCharge(c) {
    while (released < AROMAS.length && c >= AROMAS[released].th) { released++; release(released - 1); }
  }

  // ---------- gestos: arrastrar para girar (el scroll vertical de la página sigue funcionando) ----------
  let drag = null;
  function firstTouch() { if (touched) return; touched = true; const h = $('cupHint'); if (h) { h.classList.add('is-gone'); } }
  canvas.addEventListener('pointerdown', (e) => {
    drag = { id: e.pointerId, x: e.clientX }; canvas.setPointerCapture(e.pointerId); stage.classList.add('is-dragging'); firstTouch();
    glass.impulse(e.pointerType === 'mouse' ? 1.2 : 0.6);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x; drag.x = e.clientX;
      if (Math.abs(dx) >= 1) glass.impulse((Math.abs(dx) / Math.max(260, stage.clientWidth)) * 26);
    }
    if (e.pointerType === 'mouse' && !reduced) tilt(e);
  });
  const endDrag = (e) => { if (drag && e.pointerId === drag.id) { drag = null; stage.classList.remove('is-dragging'); } };
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => { stage.style.setProperty('--rx', '0deg'); stage.style.setProperty('--ry', '0deg'); });
  function tilt(e) { const r = stage.getBoundingClientRect(); stage.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 7 + 'deg'); stage.style.setProperty('--rx', -((e.clientY - r.top) / r.height - 0.5) * 5 + 'deg'); }
  // alternativa para teclado y lector de pantalla
  let dirSign = 1;
  $('cupSwirlBtn').addEventListener('click', () => { firstTouch(); dirSign = -dirSign; glass.impulse(7 * dirSign); });

  // ---------- perfil: tanino / cuerpo / acidez ----------
  const sl = { t: $('cupTannin'), b: $('cupBody'), a: $('cupAcid') };
  const word = (v, k) => tr('cup.w.' + k + (v < 0.34 ? 0 : v < 0.67 ? 1 : 2));
  function profile() { return { t: sl.t.value / 100, b: sl.b.value / 100, a: sl.a.value / 100 }; }
  const PAIRS = {
    cordero: (t, b, a) => 0.45 * t + 0.55 * b - 0.15 * a + 0.1,
    parrilla: (t, b) => 0.6 * t + 0.25 * (1 - Math.abs(b - 0.6) * 1.2),
    quesos: (t, b) => 0.6 * (1 - Math.abs(t - 0.45) * 2) + 0.4 * (1 - Math.abs(b - 0.45) * 1.5),
    pasta: (t, b, a) => 0.7 * a + 0.3 * (1 - t),
    choco: (t, b, a) => 0.45 * b + 0.3 * (1 - a) + 0.2 * t,
    citricos: (t, b, a) => 0.8 * a + 0.2 * (1 - b),
  };
  const pairsEl = $('cupPairs'), why = $('cupWhy'), sum = $('cupSummary');
  function renderProfile(fromInput) {
    const p = profile();
    ['t', 'b', 'a'].forEach((k) => { const v = sl[k].value / 100; sl[k].style.setProperty('--p', sl[k].value + '%'); $('cupVal' + k.toUpperCase()).textContent = word(v, k); sl[k].setAttribute('aria-valuetext', word(v, k)); });
    const lv = (v) => (v < 0.34 ? 0 : v < 0.67 ? 1 : 2);
    sum.textContent = tr('cup.sum').replace('{b}', tr('cup.sB' + lv(p.b))).replace('{t}', tr('cup.sT' + lv(p.t))).replace('{a}', tr('cup.sA' + lv(p.a)));
    const ranked = Object.keys(PAIRS).map((id) => ({ id, s: PAIRS[id](p.t, p.b, p.a) })).sort((x, y) => y.s - x.s).slice(0, 3);
    pairsEl.innerHTML = ranked.map((r, i) => '<li class="cup-pair' + (i === 0 ? ' is-top' : '') + '"><span class="cup-pair-dot"></span><span>' + tr('cup.p.' + r.id) + '</span></li>').join('');
    why.textContent = tr('cup.p.' + ranked[0].id + '.why');
    if (fromInput) { pairsEl.classList.remove('cup-in'); why.classList.remove('cup-in'); void pairsEl.offsetWidth; pairsEl.classList.add('cup-in'); why.classList.add('cup-in'); }
    glass.setProfile(p);
  }
  let rq = 0; Object.values(sl).forEach((s) => s.addEventListener('input', () => { firstTouch(); cancelAnimationFrame(rq); rq = requestAnimationFrame(() => renderProfile(true)); }));

  // ---------- brindis ----------
  // Sonido sintetizado (sin archivo de audio): un golpe seco y dos copas con modos de vidrio (1 : 2,83 : 5,43)
  // que se apagan del agudo al grave, apenas desafinadas entre sí para que "brillen" como dos copas reales.
  let ac = null, tap = null;
  function clink() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ac = ac || new AC(); if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime, out = ac.createGain(); out.gain.value = 0.45; out.connect(ac.destination);
      if (!tap) { tap = ac.createBuffer(1, Math.round(ac.sampleRate * 0.03), ac.sampleRate); const d = tap.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3 * (1 - i / d.length); }
      const hit = ac.createBufferSource(), hp = ac.createBiquadFilter(); hit.buffer = tap; hp.type = 'highpass'; hp.frequency.value = 4000; hit.connect(hp); hp.connect(out); hit.start(t);
      [[1650, 1], [1695, 0.8]].forEach(([f0, v]) => [[1, 0.22, 1.5], [2.83, 0.15, 0.7], [5.43, 0.08, 0.3], [8.9, 0.03, 0.15]].forEach(([r, a, d]) => {
        const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f0 * r;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.05);
      }));
    } catch (e) { /* audio no disponible */ }
  }
  const toastEl = $('cupToast');
  $('cupCheers').addEventListener('click', () => {
    firstTouch(); glass.toast(); clink(); if (navigator.vibrate) try { navigator.vibrate([18, 40, 12]); } catch (e) { /* sin vibración */ }
    toastEl.textContent = tr('cup.cheers'); toastEl.classList.remove('is-on'); void toastEl.offsetWidth; toastEl.classList.add('is-on');
  });

  // ---------- ciclo de vida: se sirve al entrar en pantalla y solo dibuja mientras está a la vista ----------
  let poured = false, inView = false;
  const setActive = () => glass.setActive(inView && !document.hidden);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      inView = es[0].isIntersecting; section.classList.toggle('cup-live', inView); setActive();
      if (inView && !poured && es[0].intersectionRatio > 0.25) { poured = true; glass.pour(); setTimeout(() => { if (!touched) $('cupHint').classList.add('is-on'); }, reduced ? 200 : 3400); }
    }, { threshold: [0, 0.25, 0.5] }).observe(stage);
  } else { inView = true; poured = true; glass.pour(true); $('cupHint').classList.add('is-on'); setActive(); }
  document.addEventListener('visibilitychange', setActive);
  // el tamaño de la copa depende del alto de la pantalla: se re-ajusta cada vez que cambia el escenario
  let rz = 0;
  const fit = () => { stage.style.setProperty('--cup-w', stage.clientWidth + 'px'); glass.resize(); };
  if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(fit, 60); }).observe(stage);
  else window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fit, 150); });
  fit();

  window.copaOnLang = function () { renderCard(); renderProfile(false); };
  section.classList.add('cup-ready');
  renderProfile(false); renderCard();
})();
