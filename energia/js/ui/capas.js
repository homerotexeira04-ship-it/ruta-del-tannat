/* Interfaz: capas por encima de la pantalla (diálogos, cartel de logro, confeti). Mientras hay un diálogo abierto,
   el resto de la página queda inerte (no se enfoca ni se lee) y la cuenta regresiva de la pregunta se detiene. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});
  var ui = RE.ui, U = RE.util, h = U.h, d = g.document;

  var capas = (ui.capas = {});
  var pila = [];
  ui.pausas = 0;
  ui.pausar = function () { ui.pausas++; };
  ui.reanudar = function () { ui.pausas = Math.max(0, ui.pausas - 1); };

  function bloquear(si) {
    var app = ui.el.app;
    try { app.inert = si; } catch (e) { /* navegador sin inert: la capa tapa igual toda la pantalla */ }
    if (si) app.setAttribute('aria-hidden', 'true'); else app.removeAttribute('aria-hidden');
  }

  function enfocables(raiz) {
    return Array.prototype.slice.call(raiz.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
  }

  // Abre un diálogo modal. contenido: elemento que va dentro de la tarjeta blanca. o: {etiqueta, alCerrar, escape, clase, ancho}
  capas.abrir = function (contenido, o) {
    o = o || {};
    var previo = d.activeElement;
    var tarjeta = h('div', { class: 'dialogo' + (o.clase ? ' ' + o.clase : ''), tabindex: '-1' }, contenido);
    var fondo = h('div', { class: 'capa', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.etiqueta || 'Diálogo' }, tarjeta);
    var entrada = { nodo: fondo, previo: previo, alCerrar: o.alCerrar, escape: o.escape !== false };
    pila.push(entrada);
    ui.el.capas.appendChild(fondo);
    bloquear(true);
    ui.pausar();
    var primero = enfocables(tarjeta)[0] || tarjeta;
    try { primero.focus({ preventScroll: true }); } catch (e) { /* sin foco */ }
    return { cerrar: function () { cerrar(entrada); }, tarjeta: tarjeta, nodo: fondo };
  };

  function cerrar(entrada) {
    var i = pila.indexOf(entrada);
    if (i < 0) return;
    pila.splice(i, 1);
    entrada.nodo.remove();
    ui.reanudar();
    if (!pila.length) bloquear(false);
    if (entrada.previo && d.body.contains(entrada.previo)) { try { entrada.previo.focus({ preventScroll: true }); } catch (e) { /* sin foco */ } }
    if (entrada.alCerrar) entrada.alCerrar();
  }

  capas.cerrarTodas = function () {
    while (pila.length) cerrar(pila[pila.length - 1]);
    var logros = d.querySelectorAll('.logro'); for (var i = 0; i < logros.length; i++) logros[i].remove();
    var cf = d.querySelectorAll('.confeti'); for (var j = 0; j < cf.length; j++) cf[j].remove();
  };
  capas.hayAbiertas = function () { return pila.length > 0; };

  // Escape cierra el diálogo de arriba; Tab no se escapa de él.
  d.addEventListener('keydown', function (ev) {
    if (!pila.length) return;
    var arriba = pila[pila.length - 1];
    if (ev.key === 'Escape' && arriba.escape) { ev.preventDefault(); cerrar(arriba); return; }
    if (ev.key === 'Tab') {
      var l = enfocables(arriba.nodo);
      if (!l.length) { ev.preventDefault(); return; }
      var primero = l[0], ultimo = l[l.length - 1];
      if (ev.shiftKey && d.activeElement === primero) { ev.preventDefault(); ultimo.focus(); }
      else if (!ev.shiftKey && d.activeElement === ultimo) { ev.preventDefault(); primero.focus(); }
    }
  }, true);

  // Pregunta de sí o no. o: {titulo, texto, si, no, peligro, alSi, alNo}
  capas.confirmar = function (o) {
    var dlg;
    function cierra(fn) { return function () { dlg.cerrar(); if (fn) fn(); }; }
    dlg = capas.abrir(h('div', { style: 'display:contents' },
      h('h2', null, o.titulo), o.texto ? h('p', null, o.texto) : null,
      h('div', { class: 'dialogo__botones' },
        ui.boton(o.no || 'Cancelar', { clase: 'boton--fantasma', onclick: cierra(o.alNo) }),
        ui.boton(o.si || 'Aceptar', { clase: o.peligro ? 'boton--peligro' : '', onclick: cierra(o.alSi) }))), { etiqueta: o.titulo });
    return dlg;
  };

  // Cartel de logro: no bloquea ni toma el foco, se va solo.
  capas.logro = function (logro) {
    var el = h('div', { class: 'logro', role: 'status' },
      h('div', { class: 'logro__tarjeta' }, ui.icono(logro.icono, 'logro__icono'), h('div', { class: 'logro__titulo' }, logro.titulo), h('div', { class: 'logro__cuerpo' }, logro.cuerpo)));
    d.body.appendChild(el);
    RE.audio.reproducir('logro');
    setTimeout(function () { el.classList.add('logro--sale'); }, 2600);
    setTimeout(function () { el.remove(); }, 3200);
  };

  capas.confeti = function () {
    var colores = ['#1C6E9C', '#2E8C9E', '#E8990F', '#4C7A34', '#4A3F6B'], c = h('div', { class: 'confeti', 'aria-hidden': 'true' });
    for (var i = 0; i < 28; i++) {
      var s = h('span', { style: 'left:' + Math.round(Math.random() * 100) + '%;background:' + colores[i % colores.length] + ';animation-delay:' + (Math.random() * 0.6).toFixed(2) + 's;animation-duration:' + (2.4 + Math.random() * 1.4).toFixed(2) + 's' });
      c.appendChild(s);
    }
    d.body.appendChild(c);
    setTimeout(function () { c.remove(); }, 4300);
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
