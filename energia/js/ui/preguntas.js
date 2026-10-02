/* Interfaz: presentación de cada estación, preguntas (con contrarreloj) y cierre de estación.
   Al contestar solo se actualizan las piezas que cambian: las respuestas no se vuelven a dibujar ni se mueven. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});
  var C = RE.config, ui = RE.ui, M = RE.motor, U = RE.util, h = U.h, d = g.document;

  var LETRAS = ['A', 'B', 'C', 'D'];

  // ---------- presentación de la estación ----------
  ui.pantallas.intro = function () {
    var e = ui.estado, est = ui.estacion(e.estIdx), P = e.partida;
    var n = P.porEstacion[e.estIdx];
    ui.anunciar('Estación ' + (e.estIdx + 1) + ' de ' + RE.datos.estaciones.length + ': ' + est.nombre);
    return h('section', { class: 'tarjeta tarjeta--centro', 'aria-labelledby': 'tituloIntro' },
      h('div', { class: 'intro' },
        h('div', { class: 'icono-estacion', 'aria-hidden': 'true' }, ui.icono(est.clave)),
        h('span', { class: 'kicker' }, 'Estación ' + (e.estIdx + 1) + ' de ' + RE.datos.estaciones.length),
        h('h2', { class: 'titulo', id: 'tituloIntro', tabindex: '-1' }, est.nombre),
        h('p', { class: 'bajada' }, est.intro),
        h('p', { class: 'nota' }, n + (n === 1 ? ' pregunta' : ' preguntas') + ' en esta estación'),
        ui.boton('Comenzar estación', { id: 'botonEstacion', icono: 'jugar', onclick: function () { ui.ir('pregunta'); } })));
  };

  // ---------- pregunta ----------
  var reloj = null;
  function detenerReloj() { if (reloj) { clearInterval(reloj.id); reloj = null; } }

  function nombresFuentes(q) {
    var F = RE.datos.fuentes;
    return (q.fuente || []).map(function (id) { return F[id] ? F[id].nombre : null; }).filter(Boolean);
  }

  ui.pantallas.pregunta = function () {
    var e = ui.estado, P = e.partida, q = M.actual(P), est = ui.estacion(q.estIdx);
    var respondida = false, botones = [], pie = h('div', { class: 'pie-pregunta' });
    var porEst = P.porEstacion[q.estIdx];

    // progreso de la estación
    var puntos = h('div', { class: 'puntos-progreso', role: 'img', 'aria-label': 'Pregunta ' + q.enEstacion + ' de ' + porEst + ' de la estación' });
    for (var i = 1; i <= porEst; i++) puntos.appendChild(h('span', { class: 'punto' + (i < q.enEstacion ? ' punto--hecho' : i === q.enEstacion ? ' punto--actual' : '') }));

    // contrarreloj
    var relojEl = null, barra = null, numero = null;
    if (P.contrarreloj) {
      barra = h('div', { class: 'reloj__relleno' });
      numero = h('div', { class: 'reloj__num', 'aria-hidden': 'true' });
      relojEl = h('div', { class: 'reloj', role: 'timer', 'aria-label': 'Tiempo para responder' }, h('div', { class: 'reloj__pista', 'aria-hidden': 'true' }, barra), numero);
    }

    var textoP = h('h2', { class: 'pregunta__texto', id: 'textoPregunta', tabindex: '-1' }, q.pregunta);
    var grupo = h('div', { class: 'respuestas', role: 'group', 'aria-labelledby': 'textoPregunta' });
    q.opciones.forEach(function (op, i) {
      var b = h('button', { type: 'button', class: 'respuesta', 'data-i': i, 'aria-label': LETRAS[i] + '. ' + op, onclick: function () { responder(i); } },
        h('span', { class: 'respuesta__letra', 'aria-hidden': 'true' }, LETRAS[i]), h('span', { class: 'respuesta__texto' }, op));
      botones.push(b); grupo.appendChild(b);
    });

    function guia() {
      pie.replaceChildren(h('div', { class: 'explicacion explicacion--guia' }, P.contrarreloj ? 'Elegí una respuesta antes de que se acabe el tiempo.' : 'Tocá la respuesta que creas correcta.'), h('span'));
    }
    guia();

    // ----- cuenta regresiva (solo cuenta el tiempo en que la pantalla está a la vista y sin diálogos) -----
    if (P.contrarreloj) {
      var limite = M.limiteMs(q, P.ritmo), restante = limite, ultimo = ui.ahora();
      var pintarReloj = function () {
        var pct = Math.max(0, restante / limite);
        barra.style.width = (pct * 100).toFixed(1) + '%';
        var s = Math.max(0, Math.ceil(restante / 1000));
        numero.textContent = String(s);
        var urgente = s <= 5;
        barra.classList.toggle('reloj__relleno--urgente', urgente);
        numero.classList.toggle('reloj__num--urgente', urgente);
      };
      pintarReloj();
      reloj = {
        id: setInterval(function () {
          var t = ui.ahora();
          if (ui.pausas > 0 || d.hidden) { ultimo = t; return; }
          restante -= t - ultimo; ultimo = t;
          pintarReloj();
          if (restante <= 0) { detenerReloj(); responder(-1); }
        }, 100),
        usado: function () { return limite - restante; }
      };
      ui.limpiarPantalla = detenerReloj;
    }

    // ----- responder -----
    function responder(eleccion) {
      if (respondida || ui.estado.pantalla !== 'pregunta') return;
      var usado = reloj ? reloj.usado() : 0;
      detenerReloj();
      var res = M.responder(P, eleccion, usado);
      if (!res) return;
      respondida = true;
      RE.almacen.vistas.registrar([q.id]);
      RE.almacen.stats.registrar([{ id: q.id, ok: res.ok }]);
      RE.audio.reproducir(res.ok ? 'correcto' : 'error');
      if (relojEl) { barra.classList.remove('reloj__relleno--urgente'); }

      botones.forEach(function (b, i) {
        b.disabled = true;
        var l = b.querySelector('.respuesta__letra');
        if (i === q.correcta) {
          b.classList.add('respuesta--correcta'); l.replaceChildren(ui.icono('check'));
          b.appendChild(h('span', { class: 'respuesta__marca' }, 'Correcta'));
        } else if (i === eleccion) {
          b.classList.add('respuesta--incorrecta'); l.replaceChildren(ui.icono('cruz'));
          b.appendChild(h('span', { class: 'respuesta__marca' }, 'Tu respuesta'));
        } else b.classList.add('respuesta--apagada');
      });

      var correcta = q.opciones[q.correcta], titulo;
      if (res.ok) titulo = '¡Correcto!';
      else if (res.tiempoAgotado) titulo = '¡Se acabó el tiempo! La respuesta correcta es: ' + correcta;
      else titulo = 'La respuesta correcta es: ' + correcta;
      var extras = [];
      if (res.ok) {
        extras.push('+' + res.puntos + (res.puntos === 1 ? ' punto' : ' puntos'));
        if (res.bonoRacha) extras.push('incluye +' + res.bonoRacha + ' por racha');
        if (res.bonoVelocidad) extras.push('+' + res.bonoVelocidad + ' por rapidez');
      }
      var fuentes = nombresFuentes(q);
      var pieFuente = (q.vigencia ? 'Dato de ' + q.vigencia + '. ' : '') + (fuentes.length ? 'Fuente: ' + fuentes.join(' · ') : '');
      var ultimaEst = M.esUltimaDeEstacion(P);
      var sig = ui.boton(ultimaEst ? 'Ver resultados de la estación' : 'Siguiente pregunta', { id: 'botonSiguiente', icono: 'flechaDer', iconoAntes: false, onclick: siguiente });
      pie.replaceChildren(
        h('div', { class: 'explicacion ' + (res.ok ? 'explicacion--ok' : 'explicacion--mal'), role: 'status' },
          ui.icono(res.ok ? 'check' : 'cruz', 'explicacion__icono'),
          h('div', null,
            h('div', { class: 'explicacion__titulo' }, titulo + (extras.length ? '  ' + extras.join(' · ') : '')),
            h('div', { class: 'explicacion__cuerpo' }, q.explicacion),
            pieFuente ? h('span', { class: 'explicacion__fuente' }, pieFuente) : null)),
        sig);
      ui.anunciar((res.ok ? 'Correcto. ' : (res.tiempoAgotado ? 'Se acabó el tiempo. ' : 'Incorrecto. ')) + (res.ok ? '' : 'La respuesta correcta es ' + correcta + '. ') + q.explicacion);
      ui.cabecera();
      ui.destelloEstacion(res.ok);
      if (res.logro) ui.capas.logro(res.logro);
      if (ui.usandoTeclado()) sig.focus({ preventScroll: true });
    }

    function siguiente() {
      if (!P.respondida) return;
      if (M.esUltimaDeEstacion(P)) ui.ir('estacion');
      else { M.avanzar(P); ui.ir('pregunta'); }
    }

    // Teclas A–D o 1–4 para responder.
    function tecla(ev) {
      if (ui.estado.pantalla !== 'pregunta' || respondida || ui.capas.hayAbiertas() || ev.ctrlKey || ev.altKey || ev.metaKey) return;
      var k = ev.key.toLowerCase(), i = 'abcd'.indexOf(k);
      if (i < 0 && /^[1-4]$/.test(k)) i = +k - 1;
      if (i >= 0 && i < 4 && k.length === 1) { ev.preventDefault(); responder(i); }
    }
    d.addEventListener('keydown', tecla);
    var limpiarReloj = ui.limpiarPantalla;
    ui.limpiarPantalla = function () { d.removeEventListener('keydown', tecla); if (limpiarReloj) limpiarReloj(); detenerReloj(); };

    var tarjeta = h('section', { class: 'tarjeta', 'aria-label': est.nombre + ', pregunta ' + q.numero + ' de ' + P.total },
      h('div', { class: 'pregunta' },
        h('div', { class: 'pregunta__cab' }, puntos, h('span', { class: 'kicker' }, est.nombre + ' · Pregunta ' + q.enEstacion + ' de ' + porEst), relojEl || h('span')),
        textoP, grupo, pie));
    ui.anunciar('Pregunta ' + q.numero + ' de ' + P.total + '. ' + q.pregunta);
    ui.enfocarPantalla = function () { if (ui.usandoTeclado()) { botones[0].focus({ preventScroll: true }); return true; } return false; };
    return tarjeta;
  };

  // ---------- estación completada ----------
  ui.pantallas.estacion = function () {
    var e = ui.estado, P = e.partida, est = ui.estacion(e.estIdx);
    var n = P.porEstacion[e.estIdx], ac = P.aciertosEstacion[e.estIdx] || 0;
    var ultima = M.esUltima(P);
    var sigEst = ultima ? null : ui.estacion(e.estIdx + 1);
    var frase = ac === n ? '¡Estación perfecta!' : ac >= Math.ceil(n / 2) ? '¡Muy bien!' : 'En el repaso final vas a ver lo que se complicó.';
    ui.anunciar('Estación ' + est.nombre + ' completada. ' + ac + ' de ' + n + ' aciertos.');
    return h('section', { class: 'tarjeta tarjeta--centro', 'aria-labelledby': 'tituloEstacion' },
      h('div', { class: 'estacion-lista' },
        h('div', { class: 'icono-estacion icono-estacion--redondo', 'aria-hidden': 'true' }, ui.icono(est.clave)),
        h('h2', { class: 'titulo', id: 'tituloEstacion', tabindex: '-1' }, '¡Estación ' + est.nombre + ' completada!'),
        h('p', { class: 'bajada' }, frase),
        h('div', { class: 'datos' },
          h('div', { class: 'dato' }, h('div', { class: 'dato__num' }, ac + '/' + n), h('div', { class: 'dato__etiqueta' }, 'Aciertos')),
          h('div', { class: 'dato' }, h('div', { class: 'dato__num' }, String(P.puntaje)), h('div', { class: 'dato__etiqueta' }, 'Puntaje total'))),
        ui.boton(ultima ? 'Ir al desafío final' : 'Continuar a ' + sigEst.nombre, { id: 'botonContinuar', icono: 'flechaDer', iconoAntes: false, onclick: function () {
          M.avanzar(P);
          if (ultima) ui.ir('desafio'); else { e.estIdx++; ui.ir('intro'); }
        } })));
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
