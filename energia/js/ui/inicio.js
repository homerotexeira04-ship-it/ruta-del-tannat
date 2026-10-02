/* Interfaz: pantalla de inicio (recorrido, contrarreloj, nombre opcional y ranking de la categoría elegida). */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});
  var C = RE.config, ui = RE.ui, U = RE.util, h = U.h;

  var SUSTANTIVOS = ['Aspa', 'Voltio', 'Turbina', 'Panel', 'Represa', 'Rayo', 'Molino', 'Kilovatio', 'Megavatio', 'Dínamo', 'Electrón', 'Aerogenerador'];
  var ADJETIVOS = ['Veloz', 'Valiente', 'Brillante', 'Potente', 'Audaz', 'Sagaz', 'Ágil', 'Constante', 'Genial', 'Fuerte'];
  ui.aliasAlAzar = function () { return SUSTANTIVOS[U.entero(SUSTANTIVOS.length)] + ' ' + ADJETIVOS[U.entero(ADJETIVOS.length)]; };

  ui.nombreCategoria = function (modo, reloj) {
    return C.modos[modo].nombre + (reloj ? ' con contrarreloj' : '');
  };

  // Lista del ranking. resaltar: id de la entrada propia. extra: entrada propia fuera del top, que se muestra aparte.
  ui.listaRanking = function (entradas, resaltar, extra) {
    if (!entradas.length) return h('p', { class: 'ranking__vacio' }, 'Todavía nadie anotó su puntaje en esta categoría. ¡Sé el primero o la primera!');
    var filas = entradas.map(function (e, i) {
      return h('li', { class: 'ranking__fila' + (e.id === resaltar ? ' ranking__fila--yo' : '') },
        h('span', { class: 'ranking__puesto', 'aria-label': 'Puesto ' + (i + 1) }, String(i + 1)),
        h('span', { class: 'ranking__nombre' }, e.nombre),
        h('span', { class: 'ranking__puntaje' }, e.puntaje + ' pts'));
    });
    if (extra) filas.push(h('li', { class: 'ranking__fila ranking__fila--yo' },
      h('span', { class: 'ranking__puesto', 'aria-label': 'Puesto ' + extra.puesto }, String(extra.puesto)),
      h('span', { class: 'ranking__nombre' }, extra.entrada.nombre),
      h('span', { class: 'ranking__puntaje' }, extra.entrada.puntaje + ' pts')));
    return h('ol', null, filas);
  };

  ui.pantallas.inicio = function () {
    var e = ui.estado, tarjeta = h('section', { class: 'tarjeta', 'aria-labelledby': 'tituloInicio' });

    function pintar(foco) {
      var o = e.ops, cat = RE.almacen.ranking.categoria(o.modo, o.contrarreloj);
      var top = RE.almacen.ranking.top(cat, C.ranking.mostrar);
      var m = C.modos[o.modo];

      function btnModo(clave) {
        var mo = C.modos[clave];
        return h('button', { type: 'button', class: 'modo', 'data-foco': 'modo-' + clave, 'aria-pressed': o.modo === clave ? 'true' : 'false', onclick: function () { o.modo = clave; pintar('modo-' + clave); } },
          h('span', { class: 'modo__marca' }, ui.icono('check')),
          h('span', null, h('span', { class: 'modo__nombre' }, mo.nombre), h('span', { class: 'modo__detalle' }, (5 * mo.plantilla.length) + ' preguntas y un desafío · ' + mo.minutos)));
      }
      function btnRitmo(clave) {
        return h('button', { type: 'button', class: 'ritmo', 'data-foco': 'ritmo-' + clave, 'aria-pressed': o.ritmo === clave ? 'true' : 'false', onclick: function () { o.ritmo = clave; pintar('ritmo-' + clave); } }, C.ritmos[clave].nombre);
      }

      var campo = h('button', { type: 'button', class: 'campo' + (o.nombre ? '' : ' campo--vacio'), 'data-foco': 'nombre', id: 'campoNombre', 'aria-label': o.nombre ? 'Nombre para el ranking: ' + o.nombre + '. Tocá para cambiarlo.' : 'Escribir un nombre o alias para el ranking (opcional)', onclick: abrirTeclado }, o.nombre || 'Tocá acá para escribir un nombre o alias');
      function abrirTeclado() {
        ui.teclado.abrir({ valor: o.nombre, titulo: 'Escribí tu nombre o alias', alCambiar: function (v) { o.nombre = v; }, alAceptar: function (v) { o.nombre = v; pintar('nombre'); } });
      }

      var izq = h('div', { class: 'inicio__izq' },
        h('h2', { class: 'titulo', id: 'tituloInicio', tabindex: '-1' }, '¡Bienvenido/a a la Ruta de la Energía!'),
        h('p', { class: 'bajada' }, 'Vas a recorrer 5 estaciones (Hidráulica, Eólica, Solar, Biomasa y Uruguay) y a responder preguntas sobre la electricidad de nuestro país. Al final, un desafío para unir lugares con departamentos.'),
        h('div', null, h('span', { class: 'etiqueta-campo', id: 'etModo' }, 'Elegí el recorrido'), h('div', { class: 'modos', role: 'group', 'aria-labelledby': 'etModo' }, btnModo('completo'), btnModo('corto'))),
        h('div', { class: 'reloj-fila' },
          h('button', { type: 'button', class: 'interruptor', role: 'switch', 'data-foco': 'reloj', 'aria-checked': o.contrarreloj ? 'true' : 'false', onclick: function () { o.contrarreloj = !o.contrarreloj; pintar('reloj'); } },
            h('span', { class: 'interruptor__pista', 'aria-hidden': 'true' }), 'Modo contrarreloj'),
          o.contrarreloj ? h('div', { class: 'ritmos', role: 'group', 'aria-label': 'Ritmo de la contrarreloj' }, h('span', { class: 'etiqueta-campo', style: 'margin:0 .4rem 0 0;align-self:center' }, 'Ritmo:'), btnRitmo('tranquilo'), btnRitmo('normal'), btnRitmo('veloz')) : h('span', { class: 'nota' }, 'Con tiempo límite por pregunta y puntos extra por responder rápido.')),
        h('div', null, h('span', { class: 'etiqueta-campo' }, 'Nombre o alias para el ranking (opcional)'),
          h('div', { class: 'nombre-fila' }, campo,
            ui.boton('Alias al azar', { clase: 'boton--fantasma boton--chico', icono: 'dado', onclick: function () { o.nombre = ui.aliasAlAzar(); pintar('nombre'); } }),
            o.nombre ? ui.boton('Borrar', { clase: 'boton--fantasma boton--chico', icono: 'borrar', onclick: function () { o.nombre = ''; pintar('nombre'); } }) : null)),
        h('div', { class: 'inicio__comenzar' },
          ui.boton('Comenzar el recorrido', { id: 'botonComenzar', icono: 'jugar', onclick: function () { ui.alComenzar && ui.alComenzar(); ui.nuevaPartida(); } }),
          h('p', { class: 'nota' }, m.nombre + ': ' + (5 * m.plantilla.length) + ' preguntas y un desafío final, ' + m.minutos + '. Podés jugar con un alias: el nombre queda a la vista en el ranking de esta pantalla.')));

      var persistente = RE.almacen.estado().persistente;
      var der = h('aside', { class: 'ranking', 'aria-labelledby': 'tituloRanking' },
        h('h3', { class: 'ranking__titulo', id: 'tituloRanking' }, ui.icono('trofeo'), 'Mejores puntajes'),
        h('p', { class: 'ranking__cat' }, ui.nombreCategoria(o.modo, o.contrarreloj)),
        ui.listaRanking(top, null),
        persistente ? null : h('p', { class: 'nota', style: 'margin-top:.6rem' }, 'Este navegador no deja guardar datos: el ranking se borra al cerrar la página.'));

      var pt = C.puntos;
      var guia = h('aside', { class: 'guia', 'aria-labelledby': 'tituloGuia' },
        h('h3', { id: 'tituloGuia' }, 'Cómo se suman los puntos'),
        h('ul', null,
          h('li', null, ui.icono('check'), 'Cada respuesta correcta: +' + pt.acierto + ' puntos.'),
          h('li', null, ui.icono('llama'), 'Cada ' + pt.bonoRachaCada + ' aciertos seguidos: +' + pt.bonoRacha + ' de bonus.'),
          h('li', null, ui.icono('reloj'), 'Con contrarreloj: hasta +' + pt.bonoVelocidadMax + ' por responder rápido.'),
          h('li', null, ui.icono('pin'), 'Desafío final: +' + pt.desafioPrimera + ' por lugar a la primera, +' + pt.desafioSegunda + ' a la segunda.')));
      tarjeta.replaceChildren(h('div', { class: 'inicio' }, izq, h('div', { class: 'inicio__der' }, guia, der)));
      if (foco) { var f = tarjeta.querySelector('[data-foco="' + foco + '"]'); if (f && ui.usandoTeclado()) f.focus({ preventScroll: true }); }
    }
    pintar();
    ui.enfocarPantalla = function () { return false; };
    return tarjeta;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
