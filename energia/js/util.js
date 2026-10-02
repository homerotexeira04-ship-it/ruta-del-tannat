/* Utilidades sin dependencias: azar, listas, texto y construcción segura de elementos del DOM. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});

  // Número al azar en [0, 1): usa crypto si existe y Math.random si no.
  function azar() {
    var c = g.crypto;
    if (c && c.getRandomValues) {
      var b = new Uint32Array(1);
      c.getRandomValues(b);
      return b[0] / 4294967296;
    }
    return Math.random();
  }

  // Entero en [0, n) con el generador dado (por defecto, el de arriba).
  function entero(n, rng) { return Math.floor((rng || azar)() * n); }

  // Fisher–Yates sobre una copia.
  function barajar(lista, rng) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = entero(i + 1, rng), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function palabras(texto) { return (String(texto == null ? '' : texto).trim().match(/\S+/g) || []).length; }
  function limitar(n, min, max) { return Math.min(max, Math.max(min, n)); }

  // Texto de un nombre escrito por el usuario: sin espacios de más, sin caracteres de control, largo acotado.
  // No hace falta quitar «<» ni comillas: los nombres se muestran siempre como texto, nunca como HTML.
  function limpiarNombre(texto, max) {
    var t = String(texto == null ? '' : texto).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
    return t.length > (max || 28) ? t.slice(0, max || 28).trim() : t;
  }

  // Una celda de CSV: se entrecomilla si hace falta y se neutraliza el comienzo de fórmula de las planillas.
  function celdaCsv(v) {
    var s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  // Crea un elemento: h('button', { class: 'btn', onclick: fn, 'aria-label': 'x' }, 'texto', otroElemento).
  // Los textos van siempre como nodos de texto, nunca como HTML: no hay inyección.
  function h(tag, attrs) {
    var doc = g.document, svg = /^(svg|path|g|circle|rect|line|polyline|polygon|ellipse|text)$/.test(tag);
    var el = svg ? doc.createElementNS('http://www.w3.org/2000/svg', tag) : doc.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v === false || v == null) continue;
        if (k === 'class') el.setAttribute('class', v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'html') el.innerHTML = v; // solo para SVG propios del juego, nunca con datos del usuario
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, String(v));
      }
    }
    for (var i = 2; i < arguments.length; i++) agregar(el, arguments[i]);
    return el;
  }
  function agregar(el, hijo) {
    if (hijo == null || hijo === false) return;
    if (Array.isArray(hijo)) { for (var i = 0; i < hijo.length; i++) agregar(el, hijo[i]); return; }
    el.appendChild(hijo && hijo.nodeType ? hijo : g.document.createTextNode(String(hijo)));
  }

  RE.util = { azar: azar, entero: entero, barajar: barajar, palabras: palabras, limitar: limitar, limpiarNombre: limpiarNombre, celdaCsv: celdaCsv, h: h };
})(typeof globalThis !== 'undefined' ? globalThis : this);
