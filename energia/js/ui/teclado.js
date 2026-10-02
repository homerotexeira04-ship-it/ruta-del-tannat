/* Interfaz: teclado en pantalla para el nombre o alias. En una pantalla táctil de uso público no se puede contar con que
   el sistema muestre su teclado; este anda en cualquier navegador y también acepta un teclado físico. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});
  var ui = RE.ui, U = RE.util, h = U.h, d = g.document;

  var FILAS = ['1234567890', 'qwertyuiop', 'asdfghjklñ'];
  var FILA4 = 'zxcvbnm';
  var ACENTOS = 'áéíóúü';

  var abierto = null;

  function mayuscula(est) { return est.bloq || est.auto; }

  function abrir(o) {
    if (abierto) cerrar();
    var max = o.max || RE.config.nombreMax || 24;
    var est = { valor: String(o.valor || ''), bloq: false, auto: true };
    est.auto = !est.valor || /\s$/.test(est.valor);
    var teclas = [];   // [{el, letra}]
    var texto = h('div', { class: 'teclado__texto' });
    var previo = d.activeElement;

    function pintar() {
      texto.textContent = '';
      if (est.valor) texto.appendChild(d.createTextNode(est.valor)); else texto.appendChild(h('span', { style: 'color:#6B6554;font-weight:600' }, o.ayuda || 'Escribí tu nombre'));
      texto.appendChild(h('span', { class: 'caret' }));
      teclas.forEach(function (t) { t.el.textContent = mayuscula(est) ? t.letra.toUpperCase() : t.letra; });
      if (mayus) mayus.setAttribute('aria-pressed', est.bloq ? 'true' : 'false');
      if (o.alCambiar) o.alCambiar(est.valor);
    }
    function poner(c) {
      if (est.valor.length >= max) return;
      est.valor += mayuscula(est) ? c.toUpperCase() : c;
      est.auto = c === ' ';
      pintar();
    }
    function borrar() {
      est.valor = est.valor.slice(0, -1);
      est.auto = !est.valor || /\s$/.test(est.valor);
      pintar();
    }
    function listo() { var v = U.limpiarNombre(est.valor, max); cerrar(); if (o.alAceptar) o.alAceptar(v); }

    function tecla(letra, clase, fn, etiqueta) {
      var b = h('button', { type: 'button', class: 'tecla' + (clase ? ' ' + clase : ''), 'aria-label': etiqueta || null, onclick: fn });
      b.textContent = letra;
      return b;
    }
    function filaLetras(cadena) {
      return h('div', { class: 'teclado__fila' }, cadena.split('').map(function (c) {
        var b = tecla(c, '', function () { poner(c); });
        if (/[a-zñáéíóúü]/.test(c)) teclas.push({ el: b, letra: c });
        return b;
      }));
    }

    var mayus = tecla('', 'tecla--ancha', function () { est.bloq = !est.bloq; pintar(); }, 'Mayúsculas');
    mayus.appendChild(h('span', { 'aria-hidden': 'true' }, '⇧'));
    mayus.setAttribute('aria-pressed', 'false');
    var borra = tecla('', 'tecla--ancha', borrar, 'Borrar la última letra');
    borra.appendChild(ui.icono('borrar'));
    var espacio = tecla('espacio', 'tecla--espacio', function () { if (est.valor && !/\s$/.test(est.valor)) poner(' '); });
    var ok = tecla('Listo', 'tecla--ancha tecla--ok', listo);

    var cuerpo = h('div', { class: 'teclado__interior' },
      texto,
      filaLetras(FILAS[0]), filaLetras(FILAS[1]), filaLetras(FILAS[2]),
      h('div', { class: 'teclado__fila' }, mayus, FILA4.split('').map(function (c) { var b = tecla(c, '', function () { poner(c); }); teclas.push({ el: b, letra: c }); return b; }), borra),
      h('div', { class: 'teclado__fila' }, ACENTOS.split('').map(function (c) { var b = tecla(c, '', function () { poner(c); }); teclas.push({ el: b, letra: c }); return b; }), espacio, ok));

    var panel = h('div', { class: 'teclado', role: 'dialog', 'aria-label': o.titulo || 'Teclado en pantalla' }, cuerpo);
    var fondo = h('div', { class: 'capa', style: 'z-index:1890', onclick: function (ev) { if (ev.target === fondo) listo(); } });
    d.body.appendChild(fondo);
    d.body.appendChild(panel);
    ui.pausar();
    ui.el.app.setAttribute('aria-hidden', 'true');
    try { ui.el.app.inert = true; } catch (e) { /* nada */ }
    pintar();

    function teclaFisica(ev) {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === 'Enter') { ev.preventDefault(); listo(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); cerrar(); }
      else if (ev.key === 'Backspace') { ev.preventDefault(); borrar(); }
      else if (ev.key.length === 1 && /[\p{L}\p{N} .\-']/u.test(ev.key)) {
        ev.preventDefault();
        if (ev.key === ' ') { if (est.valor && !/\s$/.test(est.valor)) { est.valor += ' '; est.auto = true; pintar(); } }
        else if (est.valor.length < max) { est.valor += ev.key; est.auto = false; pintar(); }
      }
    }
    d.addEventListener('keydown', teclaFisica, true);

    function cerrar() {
      if (!abierto) return;
      d.removeEventListener('keydown', teclaFisica, true);
      panel.remove(); fondo.remove();
      ui.reanudar();
      ui.el.app.removeAttribute('aria-hidden');
      try { ui.el.app.inert = false; } catch (e) { /* nada */ }
      abierto = null;
      if (previo && d.body.contains(previo)) { try { previo.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
    }
    abierto = { cerrar: cerrar };
    return abierto;
  }

  ui.teclado = { abrir: abrir, cerrar: function () { if (abierto) abierto.cerrar(); }, estaAbierto: function () { return !!abierto; } };
})(typeof globalThis !== 'undefined' ? globalThis : this);
