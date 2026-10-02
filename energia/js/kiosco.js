/* Puesto de uso público: vuelve al inicio cuando nadie toca la pantalla, panel de administración con PIN (exportar y borrar
   el ranking, ajustes), pantalla completa, pantalla siempre encendida y bloqueo del menú contextual. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});
  var C = RE.config, ui = RE.ui, U = RE.util, h = U.h, d = g.document;

  var kiosco = (RE.kiosco = {});

  // ---------- inactividad ----------
  var ultimo = ui.ahora(), aviso = null, cuenta = 0, hayActualizacion = false;
  kiosco.hayActualizacion = function () { hayActualizacion = true; };

  function actividad() { ultimo = ui.ahora(); }
  ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'].forEach(function (t) { d.addEventListener(t, actividad, { capture: true, passive: true }); });

  function cerrarAviso() { if (aviso) { aviso.cerrar(); aviso = null; } }

  function mostrarAviso() {
    cuenta = C.inactividadCuentaS;
    var num = h('div', { class: 'cuenta', 'aria-hidden': 'true' }, String(cuenta));
    var dlg = ui.capas.abrir(h('div', { style: 'display:contents' },
      h('h2', null, '¿Seguís ahí?'),
      h('p', null, 'Si nadie toca la pantalla, vuelve al inicio y se pierde el recorrido en curso.'),
      num,
      ui.boton('Seguir jugando', { id: 'botonSeguir', icono: 'jugar', onclick: function () { cerrarAviso(); actividad(); } })), { etiqueta: 'Aviso de inactividad', escape: false });
    dlg.nodo.addEventListener('pointerdown', function () { cerrarAviso(); actividad(); });
    aviso = dlg; aviso.num = num;
    ui.anunciar('¿Seguís ahí? En ' + cuenta + ' segundos se vuelve al inicio.');
  }

  setInterval(function () {
    var e = ui.estado, quieto = (ui.ahora() - ultimo) / 1000;
    if (aviso) {
      cuenta = Math.max(0, C.inactividadCuentaS - Math.floor(quieto - C.inactividadAvisoS));
      aviso.num.textContent = String(cuenta);
      if (cuenta <= 0) { cerrarAviso(); ui.reiniciar(true); actividad(); }
      return;
    }
    if (ui.teclado && ui.teclado.estaAbierto()) return;
    if (e.pantalla === 'inicio') {
      var sinTocar = e.ops.nombre || e.ops.contrarreloj || e.ops.modo !== RE.almacen.ajustes.leer().modoPorDefecto;
      if (quieto > C.inicioLimpiaAlS && sinTocar) { ui.reiniciar(true); actividad(); }
      else if (hayActualizacion && quieto > 20 && !ui.capas.hayAbiertas()) g.location.reload();
      return;
    }
    if (ui.capas.hayAbiertas() && !aviso) return;     // administración o créditos abiertos: lo cierra quien lo abrió
    if (quieto > C.inactividadAvisoS) mostrarAviso();
  }, 1000);

  // ---------- pantalla completa y pantalla encendida ----------
  var bloqueo = null;
  function pedirBloqueoPantalla() {
    if (!C.mantenerPantallaEncendida || !g.navigator.wakeLock || bloqueo) return;
    try {
      g.navigator.wakeLock.request('screen').then(function (b) {
        bloqueo = b;
        b.addEventListener('release', function () { bloqueo = null; });
      }, function () { /* el navegador no lo permite: nada que hacer */ });
    } catch (e) { /* sin wake lock */ }
  }
  d.addEventListener('visibilitychange', function () { if (!d.hidden) pedirBloqueoPantalla(); });

  kiosco.estaEnPantallaCompleta = function () { return !!(d.fullscreenElement || d.webkitFullscreenElement); };
  kiosco.pantallaCompleta = function (si) {
    try {
      var r = d.documentElement;
      if (si && !kiosco.estaEnPantallaCompleta()) { var p = (r.requestFullscreen || r.webkitRequestFullscreen).call(r); if (p && p.catch) p.catch(function () { /* se negó: sigue en ventana */ }); }
      else if (!si && kiosco.estaEnPantallaCompleta()) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    } catch (e) { /* sin pantalla completa */ }
  };

  // El primer toque en «Comenzar» (un gesto del usuario) pide pantalla completa y mantiene la pantalla encendida.
  var yaPidio = false;
  ui.alComenzar = function () {
    RE.audio.desbloquear();
    pedirBloqueoPantalla();
    if (C.pantallaCompletaAlComenzar && !yaPidio && !g.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches) { yaPidio = true; kiosco.pantallaCompleta(true); }
  };
  d.addEventListener('pointerdown', function () { RE.audio.desbloquear(); }, { capture: true, passive: true });

  // ---------- menú contextual y arrastre de imágenes ----------
  d.addEventListener('contextmenu', function (ev) { if (!(ev.target && ev.target.closest && ev.target.closest('input, textarea'))) ev.preventDefault(); });
  d.addEventListener('dragstart', function (ev) { ev.preventDefault(); });

  // ---------- administración ----------
  var intentosPin = 0, bloqueadoHasta = 0;

  function descargar(nombre, texto, tipo) {
    try {
      var blob = new g.Blob(['﻿' + texto], { type: tipo || 'text/csv;charset=utf-8' });
      var url = g.URL.createObjectURL(blob);
      var a = h('a', { href: url, download: nombre });
      d.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { g.URL.revokeObjectURL(url); }, 4000);
      return true;
    } catch (e) { return false; }
  }

  function pedirPin() {
    if (ui.capas.hayAbiertas() || (ui.teclado && ui.teclado.estaAbierto())) return;
    var ingreso = '', largo = C.pinAdmin.length;
    var puntos = h('div', { class: 'pin-puntos', 'aria-hidden': 'true' });
    var error = h('div', { class: 'pin-error', role: 'alert' });
    var dlg;
    function pintar() {
      puntos.replaceChildren.apply(puntos, C.pinAdmin.split('').map(function (_, i) { return h('span', { class: i < ingreso.length ? 'lleno' : '' }); }));
    }
    function probar() {
      if (Date.now() < bloqueadoHasta) { error.textContent = 'Demasiados intentos. Esperá un minuto.'; ingreso = ''; pintar(); return; }
      if (ingreso === C.pinAdmin) { intentosPin = 0; dlg.cerrar(); abrirAdmin(); return; }
      intentosPin++; ingreso = ''; pintar();
      if (intentosPin >= 5) { bloqueadoHasta = Date.now() + 60000; intentosPin = 0; error.textContent = 'Demasiados intentos. Esperá un minuto.'; }
      else error.textContent = 'PIN incorrecto.';
    }
    function digito(n) { if (ingreso.length < largo) { ingreso += n; error.textContent = ''; pintar(); if (ingreso.length === largo) probar(); } }
    function tecla(t, fn, etiqueta) { return h('button', { type: 'button', class: 'tecla', 'aria-label': etiqueta || null, onclick: fn }, t); }
    var grilla = h('div', { class: 'teclado-num' });
    '123456789'.split('').forEach(function (n) { grilla.appendChild(tecla(n, function () { digito(n); })); });
    var borrar = tecla('', function () { ingreso = ingreso.slice(0, -1); pintar(); }, 'Borrar'); borrar.appendChild(ui.icono('borrar'));
    grilla.appendChild(borrar); grilla.appendChild(tecla('0', function () { digito('0'); }));
    grilla.appendChild(tecla('Salir', function () { dlg.cerrar(); }));
    dlg = ui.capas.abrir(h('div', { style: 'display:contents' }, h('h2', null, 'Administración'), h('p', null, 'Ingresá el PIN del puesto.'), puntos, error, grilla), { etiqueta: 'PIN de administración' });
    pintar();
  }

  function abrirAdmin() {
    var dlg;
    var aviso = C.pinAdmin === C.pinDeFabrica ? h('p', { class: 'aviso-pin' }, 'El PIN sigue siendo el de fábrica. Cambialo en js/config.js (pinAdmin) antes de dejar la pantalla funcionando.') : null;

    function actualizar() {
      var n = RE.almacen.ranking.todos().length, a = RE.almacen.ajustes.leer(), st = RE.almacen.estado();
      var cuerpo = h('div', { style: 'display:contents' },
        h('h2', null, 'Administración del puesto'), aviso,
        h('div', { class: 'panel-admin__bloque' }, h('h3', null, 'Ranking y estadística'),
          h('p', null, n + (n === 1 ? ' partida anotada' : ' partidas anotadas') + ' en esta pantalla. ' + (st.persistente ? 'Se guardan en el navegador de este equipo.' : 'Atención: este navegador no guarda datos, se pierden al cerrar.')),
          h('div', { class: 'panel-admin__fila' },
            ui.boton('Descargar ranking (CSV)', { clase: 'boton--chico', icono: 'flechaDer', iconoAntes: false, onclick: function () { if (!descargar('ranking-ruta-energia.csv', RE.almacen.ranking.csv())) mostrarTexto('Ranking', RE.almacen.ranking.csv()); } }),
            ui.boton('Descargar estadística de preguntas (CSV)', { clase: 'boton--chico boton--fantasma', onclick: function () { var t = RE.almacen.stats.csv(RE.datos); if (!descargar('estadistica-preguntas.csv', t)) mostrarTexto('Estadística de preguntas', t); } }),
            ui.boton('Borrar el ranking…', { clase: 'boton--chico boton--peligro', onclick: function () {
              ui.capas.confirmar({ titulo: '¿Borrar todo el ranking?', texto: 'Se borran los ' + n + ' puntajes de esta pantalla. No se puede deshacer; conviene descargarlo antes.', si: 'Sí, borrar', no: 'No', peligro: true, alSi: function () { RE.almacen.ranking.borrar(); redibujar(); } });
            } }))),
        h('div', { class: 'panel-admin__bloque' }, h('h3', null, 'Ajustes del juego'),
          h('div', { class: 'panel-admin__fila' },
            ui.boton('Sonido: ' + (a.sonido ? 'activado' : 'apagado'), { clase: 'boton--chico boton--fantasma', icono: a.sonido ? 'sonido' : 'silencio', onclick: function () { ui.estado.sonido = !a.sonido; RE.audio.activar(ui.estado.sonido); RE.almacen.ajustes.guardar({ sonido: ui.estado.sonido }); redibujar(); } }),
            ui.boton('Recorrido inicial: ' + C.modos[a.modoPorDefecto].nombre, { clase: 'boton--chico boton--fantasma', onclick: function () { var otro = a.modoPorDefecto === 'completo' ? 'corto' : 'completo'; RE.almacen.ajustes.guardar({ modoPorDefecto: otro }); ui.estado.ops.modo = otro; redibujar(); } }))),
        h('div', { class: 'panel-admin__bloque' }, h('h3', null, 'Pantalla y versión'),
          h('p', null, 'Versión ' + C.version + ' · datos del ' + RE.datos.revision + ' · ' + RE.datos.preguntas.length + ' preguntas.'),
          h('div', { class: 'panel-admin__fila' },
            ui.boton(kiosco.estaEnPantallaCompleta() ? 'Salir de pantalla completa' : 'Pantalla completa', { clase: 'boton--chico boton--fantasma', icono: 'pantalla', onclick: function () { kiosco.pantallaCompleta(!kiosco.estaEnPantallaCompleta()); setTimeout(redibujar, 400); } }),
            ui.boton('Volver a cargar el juego', { clase: 'boton--chico boton--fantasma', icono: 'repasar', onclick: function () { g.location.reload(); } }))),
        h('div', { class: 'dialogo__botones' }, ui.boton('Cerrar administración', { id: 'botonCerrarAdmin', onclick: function () { dlg.cerrar(); ui.reiniciar(false); } })));
      return cuerpo;
    }
    function redibujar() { dlg.tarjeta.replaceChildren(actualizar()); var f = dlg.tarjeta.querySelector('button'); if (f) f.focus({ preventScroll: true }); }
    dlg = ui.capas.abrir(actualizar(), { etiqueta: 'Administración del puesto', clase: 'panel-admin' });
    ui.anunciar('Panel de administración abierto.');
  }

  function mostrarTexto(titulo, texto) {
    var dlg = ui.capas.abrir(h('div', { style: 'display:contents' }, h('h2', null, titulo), h('p', null, 'No se pudo descargar el archivo. Copiá este texto:'),
      h('textarea', { readonly: true, rows: '12', style: 'width:100%;font:1.1rem monospace;user-select:text' }, texto), ui.boton('Cerrar', { onclick: function () { dlg.cerrar(); } })), { etiqueta: titulo, clase: 'panel-admin' });
  }

  kiosco.abrirAdmin = pedirPin;

  // Mantener apretado el logo durante tres segundos, o Ctrl+Alt+A con teclado.
  kiosco.iniciar = function () {
    var logo = d.getElementById('logo'), t = null;
    function soltar() { clearTimeout(t); t = null; }
    if (logo) {
      logo.addEventListener('pointerdown', function () { soltar(); t = setTimeout(function () { t = null; pedirPin(); }, 3000); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { logo.addEventListener(ev, soltar); });
    }
    d.addEventListener('keydown', function (ev) { if (ev.ctrlKey && ev.altKey && (ev.key === 'a' || ev.key === 'A')) { ev.preventDefault(); pedirPin(); } });
    pedirBloqueoPantalla();
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
