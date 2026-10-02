/* Sonidos sintetizados con Web Audio. El contexto se crea recién con el primer toque (los navegadores lo exigen)
   y, si el navegador no tiene Web Audio o falla, el juego sigue sin sonido en lugar de romperse. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});

  var ctx = null, intentado = false, activo = true;

  function contexto() {
    if (ctx) return ctx;
    if (intentado) return null;
    intentado = true;
    try {
      var A = g.AudioContext || g.webkitAudioContext;
      if (A) ctx = new A();
    } catch (e) { ctx = null; }
    return ctx;
  }

  function tono(c, tipo, desde, hasta, inicio, duracion, volumen) {
    var osc = c.createOscillator(), amp = c.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(desde, inicio);
    if (hasta && hasta !== desde) osc.frequency.exponentialRampToValueAtTime(hasta, inicio + duracion * 0.5);
    amp.gain.setValueAtTime(0.0001, inicio);
    amp.gain.exponentialRampToValueAtTime(volumen, inicio + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
    osc.connect(amp); amp.connect(c.destination);
    osc.start(inicio); osc.stop(inicio + duracion + 0.05);
  }

  var SONIDOS = {
    correcto: function (c, t) { tono(c, 'sine', 440, 880, t, 0.3, 0.15); },
    error: function (c, t) { tono(c, 'sawtooth', 150, 90, t, 0.3, 0.12); },
    logro: function (c, t) { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tono(c, 'triangle', f, f, t + i * 0.09, 0.4, 0.16); }); },
    tictac: function (c, t) { tono(c, 'square', 880, 880, t, 0.06, 0.05); }
  };

  RE.audio = {
    activar: function (si) { activo = !!si; },
    estaActivo: function () { return activo; },
    // Se llama desde un toque del usuario: crea el contexto y lo despierta si el navegador lo dejó dormido.
    desbloquear: function () {
      var c = contexto();
      try { if (c && c.state === 'suspended' && c.resume) c.resume(); } catch (e) { /* sin sonido */ }
    },
    reproducir: function (nombre) {
      if (!activo || !SONIDOS[nombre]) return false;
      try {
        var c = contexto();
        if (!c) return false;
        if (c.state === 'suspended' && c.resume) c.resume();
        SONIDOS[nombre](c, c.currentTime);
        return true;
      } catch (e) { return false; }
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
