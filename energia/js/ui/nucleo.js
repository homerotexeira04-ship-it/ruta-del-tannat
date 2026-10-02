/* Interfaz: núcleo. Estado de la pantalla en uso, cabecera, recorrido, fondo, anuncios para lectores de pantalla
   y paso de una pantalla a otra. Cada pantalla vive en su propio archivo y se registra en RE.ui.pantallas. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});
  var C = RE.config, U = RE.util, M = RE.motor, h = U.h, d = g.document;

  var ui = (RE.ui = { pantallas: {}, extras: {} });

  ui.estado = {
    pantalla: 'inicio',
    ops: { modo: 'completo', contrarreloj: false, ritmo: 'normal', nombre: '' },
    partida: null,
    estIdx: 0,
    guardado: null,    // lo que devolvió ranking.guardar al terminar
    resumen: null,
    repasoIdx: 0,
    sonido: true
  };

  var el = {};
  function $(id) { return d.getElementById(id); }

  ui.ahora = function () { return g.performance && g.performance.now ? g.performance.now() : Date.now(); };
  ui.icono = function (nombre, clase) { return h('span', { class: 'ico' + (clase ? ' ' + clase : ''), html: RE.iconos[nombre] || '' }); };
  ui.nombreMostrado = function () { return ui.estado.ops.nombre || ''; };
  ui.estacion = function (i) { return RE.datos.estaciones[i]; };

  // Botón grande. opciones: {icono, clase, onclick, id, ariaLabel}
  ui.boton = function (texto, o) {
    o = o || {};
    return h('button', { type: 'button', id: o.id, class: 'boton' + (o.clase ? ' ' + o.clase : ''), onclick: o.onclick, 'aria-label': o.ariaLabel, disabled: o.disabled },
      o.icono && o.iconoAntes !== false ? ui.icono(o.icono) : null, texto, o.icono && o.iconoAntes === false ? ui.icono(o.icono) : null);
  };

  // ---------- anuncios para lectores de pantalla ----------
  var anuncioTimer = null;
  ui.anunciar = function (texto) {
    if (!el.avisos) return;
    el.avisos.textContent = '';
    clearTimeout(anuncioTimer);
    anuncioTimer = setTimeout(function () { el.avisos.textContent = texto; }, 60);
  };

  // ---------- tema (colores y foto de la estación) ----------
  ui.tema = function (clave) {
    d.body.setAttribute('data-e', clave);
    var f = RE.fotos && RE.fotos[clave];
    var pie = el.fondoPie;
    if (!pie) return;
    pie.textContent = '';
    if (f && ui.estado.pantalla !== 'inicio') {
      pie.appendChild(ui.icono('pin', 'ico--pie'));
      pie.appendChild(d.createTextNode(f.lugar + ' · Foto: ' + f.autor + ' (' + f.licencia.nombre.split(' (')[0] + ')'));
    }
  };

  // ---------- cabecera ----------
  function chip(etiqueta, valor, extra) {
    return h('div', { class: 'chip' + (extra ? ' ' + extra : '') }, h('span', { class: 'chip__etiqueta' }, etiqueta), h('span', { class: 'chip__valor' }, valor));
  }

  ui.completadas = function () {
    var e = ui.estado, P = e.partida;
    if (!P || e.pantalla === 'inicio') return 0;
    if (['desafio', 'final', 'repaso'].indexOf(e.pantalla) >= 0) return P.total;
    if (e.pantalla === 'pregunta') return P.i + (P.respondida ? 1 : 0);
    if (e.pantalla === 'estacion') return P.i + 1;
    var antes = 0;
    for (var i = 0; i < e.estIdx; i++) antes += P.porEstacion[i] || 0;
    return antes;
  };

  ui.cabecera = function () {
    var e = ui.estado, P = e.partida;
    var jugando = P && e.pantalla !== 'inicio' && e.pantalla !== 'creditos';
    el.hud.textContent = '';
    if (!jugando) {
      el.hud.appendChild(h('p', { class: 'cabecera__subtitulo' }, 'Un recorrido por las energías renovables de Uruguay, inspirado en Energimundo.'));
      el.barra.hidden = true;
      return;
    }
    var nombre = P.nombre;
    if (nombre) el.hud.appendChild(chip('Jugando', nombre, 'chip--nombre'));
    el.hud.appendChild(chip('Puntaje', String(P.puntaje)));
    el.hud.appendChild(h('div', { class: 'chip' }, h('span', { class: 'chip__etiqueta' }, 'Racha'), h('span', { class: 'chip__valor' }, String(P.racha), P.racha > 0 ? ui.icono('llama') : null)));
    var n = e.pantalla === 'pregunta' ? P.i + 1 : Math.min(ui.completadas() + (e.pantalla === 'intro' ? 1 : 0), P.total);
    el.hud.appendChild(chip('Pregunta', Math.min(n, P.total) + '/' + P.total));
    el.hud.appendChild(h('button', { type: 'button', class: 'boton-icono', id: 'botonSonido', 'aria-label': e.sonido ? 'Silenciar sonidos' : 'Activar sonidos', 'aria-pressed': e.sonido ? 'false' : 'true', onclick: ui.alternarSonido }, ui.icono(e.sonido ? 'sonido' : 'silencio')));
    el.hud.appendChild(h('button', { type: 'button', class: 'boton-icono', id: 'botonSalir', 'aria-label': 'Terminar el juego', onclick: ui.pedirSalir }, ui.icono('salir')));
    var pct = Math.round((100 * ui.completadas()) / P.total);
    el.barra.hidden = false;
    el.barra.setAttribute('aria-valuenow', String(pct));
    el.barraRelleno.style.width = pct + '%';
  };

  ui.alternarSonido = function () {
    ui.estado.sonido = !ui.estado.sonido;
    RE.audio.activar(ui.estado.sonido);
    RE.almacen.ajustes.guardar({ sonido: ui.estado.sonido });
    ui.cabecera();
    if (ui.estado.sonido) RE.audio.reproducir('correcto');
  };

  ui.pedirSalir = function () {
    ui.capas.confirmar({
      titulo: '¿Querés terminar el juego?', texto: 'Se pierde el recorrido en curso y no queda anotado en el ranking.',
      si: 'Terminar', no: 'Seguir jugando', peligro: true, alSi: function () { ui.reiniciar(); }
    });
  };

  // ---------- recorrido ----------
  ui.ruta = function () {
    var e = ui.estado, nodos = RE.datos.estaciones.map(function (est, i) {
      var cls = 'ruta__nodo';
      var terminado = ['desafio', 'final', 'repaso'].indexOf(e.pantalla) >= 0;
      if (e.partida && e.pantalla !== 'inicio' && e.pantalla !== 'creditos') {
        if (i < e.estIdx || terminado || (i === e.estIdx && e.pantalla === 'estacion')) cls += ' ruta__nodo--hecho';
        else if (i === e.estIdx) cls += ' ruta__nodo--actual';
      }
      var hecho = cls.indexOf('--hecho') >= 0;
      return h('li', { class: cls, 'data-e': est.clave, 'aria-current': cls.indexOf('--actual') >= 0 ? 'step' : null },
        h('div', { class: 'ruta__circulo', 'data-i': i }, ui.icono(hecho ? 'check' : est.clave)),
        h('div', { class: 'ruta__nombre' }, est.nombre, hecho ? h('span', { class: 'solo-lectores' }, ' (completada)') : null));
    });
    el.ruta.replaceChildren.apply(el.ruta, nodos);
  };

  ui.destelloEstacion = function (ok) {
    var c = el.ruta.querySelector('.ruta__nodo--actual .ruta__circulo');
    if (!c) return;
    var cls = ok ? 'destello-ok' : 'destello-mal';
    c.classList.add(cls);
    setTimeout(function () { c.classList.remove(cls); }, 550);
  };

  // ---------- paso de pantalla ----------
  // Antirrebote: apenas se abre una pantalla se ignoran por un instante los toques sobre ella. Así, un toque doble en «Continuar»
  // o un toque «fantasma» de una pantalla infrarroja (un antebrazo apoyado) no encadenan pantallas sin querer. El teclado y los
  // clics programados (detail 0) no se frenan.
  ui.bloqueoHasta = 0;
  d.addEventListener('click', function (ev) {
    if (ev.detail === 0 || ui.ahora() >= ui.bloqueoHasta) return;
    var t = ev.target;
    if (t && t.closest && t.closest('#escenario')) { ev.stopPropagation(); ev.preventDefault(); }
  }, true);

  var usandoTeclado = false;
  d.addEventListener('keydown', function () { usandoTeclado = true; }, true);
  d.addEventListener('pointerdown', function () { usandoTeclado = false; }, true);
  ui.usandoTeclado = function () { return usandoTeclado; };

  ui.ir = function (pantalla, tema) {
    var e = ui.estado, P = e.partida;
    ui.bloqueoHasta = ui.ahora() + (C.antirreboteMs || 0);
    if (ui.limpiarPantalla) { ui.limpiarPantalla(); ui.limpiarPantalla = null; }
    e.pantalla = pantalla;
    d.body.setAttribute('data-pantalla', pantalla);
    var clave = tema || (pantalla === 'desafio' || pantalla === 'final' || pantalla === 'repaso' ? 'uruguay' : (pantalla === 'inicio' || pantalla === 'creditos' ? 'hidraulica' : ui.estacion(e.estIdx).clave));
    if (pantalla === 'pregunta' && P) clave = ui.estacion(P.preguntas[P.i].estIdx).clave;
    ui.tema(clave);
    ui.cabecera();
    ui.ruta();
    var fn = ui.pantallas[pantalla];
    var nodo = fn();
    el.escenario.replaceChildren(nodo);
    el.escenario.scrollTop = 0;
    if (!(ui.enfocarPantalla && ui.enfocarPantalla())) el.escenario.focus({ preventScroll: true });
    ui.enfocarPantalla = null;
    if (ui.alKiosco) ui.alKiosco(pantalla);
  };

  // ---------- partida ----------
  ui.nuevaPartida = function () {
    var e = ui.estado, o = e.ops;
    e.partida = M.nuevaPartida({ modo: o.modo, contrarreloj: o.contrarreloj, ritmo: o.ritmo, nombre: o.nombre, vistas: RE.almacen.vistas.leer(), ahoraMs: ui.ahora() });
    e.estIdx = 0; e.guardado = null; e.resumen = null; e.repasoIdx = 0;
    ui.ir('intro');
  };

  ui.finalizar = function () {
    var e = ui.estado, P = e.partida;
    if (!P || e.resumen) return;   // ya se anotó esta partida (el botón y el cierre automático no pueden anotarla dos veces)
    var res = M.resumen(P, ui.ahora());
    var guardado = RE.almacen.ranking.guardar({
      nombre: P.nombre, puntaje: res.puntaje, aciertos: res.aciertos, total: res.total, pct: res.pct, mejorRacha: res.mejorRacha,
      modo: P.modo, contrarreloj: P.contrarreloj, duracionS: res.duracionS
    });
    e.resumen = res; e.guardado = guardado;
    RE.audio.reproducir('logro');
    ui.ir('final');
  };

  // Vuelve al inicio descartando la partida (salir, inactividad). Con "limpiar" también se borran nombre y opciones.
  ui.reiniciar = function (limpiar) {
    var e = ui.estado;
    e.partida = null; e.estIdx = 0; e.guardado = null; e.resumen = null;
    if (limpiar) ui.opcionesPorDefecto();
    ui.capas.cerrarTodas();
    ui.ir('inicio');
  };

  ui.opcionesPorDefecto = function () {
    var a = RE.almacen.ajustes.leer();
    ui.estado.ops = { modo: a.modoPorDefecto, contrarreloj: false, ritmo: a.ritmoPorDefecto, nombre: '' };
  };

  // Con dos dedos a la vez, Chrome entrega pointerdown/pointerup de cada uno pero NO genera el «click» de ninguno: en una
  // pantalla compartida se perderían los dos toques. Si un toque terminó sobre el mismo botón donde empezó y el click no
  // llegó enseguida, se lo dispara acá. Con un solo dedo el click llega solo y esto no hace nada.
  function toquesSimultaneos() {
    var abajo = {};
    d.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType === 'mouse') return;
      var b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
      if (b) abajo[ev.pointerId] = { el: b, x: ev.clientX, y: ev.clientY };
    }, true);
    d.addEventListener('pointercancel', function (ev) { delete abajo[ev.pointerId]; }, true);
    d.addEventListener('pointerup', function (ev) {
      var p = abajo[ev.pointerId];
      delete abajo[ev.pointerId];
      if (!p || Math.abs(ev.clientX - p.x) > 24 || Math.abs(ev.clientY - p.y) > 24) return;
      var el = p.el, llego = false;
      function visto() { llego = true; }
      el.addEventListener('click', visto, { capture: true, once: true });
      setTimeout(function () {
        el.removeEventListener('click', visto, true);
        if (!llego && !el.disabled && d.body.contains(el)) el.click();
      }, 120);
    }, true);
  }

  ui.iniciar = function () {
    toquesSimultaneos();
    el.app = $('app'); el.hud = $('hud'); el.barra = $('barraProgreso'); el.barraRelleno = $('barraProgresoRelleno');
    el.ruta = $('ruta'); el.escenario = $('escenario'); el.avisos = $('avisos'); el.fondoPie = $('fotoPie'); el.capas = $('capas');
    ui.el = el;
    var a = RE.almacen.ajustes.leer();
    ui.estado.sonido = a.sonido;
    RE.audio.activar(a.sonido);
    ui.opcionesPorDefecto();
    var cred = $('botonCreditos');
    if (cred) cred.addEventListener('click', function () { ui.abrirCreditos(); });
    ui.ir('inicio');
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
