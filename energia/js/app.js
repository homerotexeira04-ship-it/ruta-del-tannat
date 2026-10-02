/* Arranque del juego: inicia la interfaz y el modo puesto, y registra el service worker (funcionamiento sin conexión). */
(function (g) {
  'use strict';
  var RE = g.RE, d = g.document;

  function fallo(e) {
    if (g.console) g.console.error(e);
    var esc = d.getElementById('escenario');
    if (!esc) return;
    esc.textContent = '';
    var p = d.createElement('p');
    p.style.cssText = 'margin:auto;padding:2rem;font:700 2rem/1.4 system-ui,sans-serif;text-align:center';
    p.textContent = 'No se pudo iniciar el juego. Volvé a cargar la página.';
    esc.appendChild(p);
  }

  function registrarServiceWorker() {
    if (g.RE_SIN_SW || !('serviceWorker' in g.navigator) || !/^https?:$/.test(g.location.protocol)) return;
    g.navigator.serviceWorker.register('sw.js').then(function (reg) {
      reg.addEventListener('updatefound', function () {
        var nuevo = reg.installing;
        if (nuevo) nuevo.addEventListener('statechange', function () { if (nuevo.state === 'installed' && g.navigator.serviceWorker.controller) RE.kiosco.hayActualizacion(); });
      });
      setInterval(function () { reg.update().catch(function () { /* sin conexión: no pasa nada */ }); }, 3600000);
    }).catch(function () { /* sin service worker el juego anda igual, pero no queda instalado sin conexión */ });
  }

  function arrancar() {
    try {
      RE.ui.iniciar();
      RE.kiosco.iniciar();
    } catch (e) { fallo(e); return; }
    registrarServiceWorker();
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})(typeof globalThis !== 'undefined' ? globalThis : this);
