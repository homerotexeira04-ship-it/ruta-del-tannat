/* Interfaz: resultados finales (puntaje, ranking, matriz eléctrica real) y repaso de las preguntas falladas. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});
  var C = RE.config, ui = RE.ui, M = RE.motor, U = RE.util, h = U.h;

  var COLORES = { hidraulica: '#1C6E9C', eolica: '#2E8C9E', biomasa: '#4C7A34', solar: '#E8990F', fosiles: '#8E8573' };

  function dato(num, etiqueta) {
    return h('div', { class: 'dato' }, h('div', { class: 'dato__num' }, num), h('div', { class: 'dato__etiqueta' }, etiqueta));
  }

  function nombresFuentes(q) {
    var F = RE.datos.fuentes;
    return (q.fuente || []).map(function (id) { return F[id] ? F[id].nombre : null; }).filter(Boolean);
  }

  ui.pantallas.final = function () {
    var e = ui.estado, P = e.partida, res = e.resumen, gu = e.guardado;
    var base = 'red';
    var matriz = h('div');

    function pintarMatriz() {
      var M_ = RE.datos.matriz, b = M_.bases.filter(function (x) { return x.clave === base; })[0];
      var hijos = [
        h('h3', { class: 'matriz__titulo' }, 'Así es la electricidad de Uruguay (' + M_.anio + ')'),
        h('div', { class: 'matriz__bases', role: 'group', 'aria-label': 'Cómo se cuenta la electricidad' }, M_.bases.map(function (x) {
          return h('button', { type: 'button', class: 'matriz__base', 'aria-pressed': x.clave === base ? 'true' : 'false', onclick: function () { base = x.clave; pintarMatriz(); } }, x.clave === 'red' ? 'Entregada a la red' : 'Toda la generación');
        })),
        h('p', { class: 'matriz__detalle' }, b.detalle)
      ].concat(b.partes.map(function (p) {
        return h('div', { class: 'matriz__fila' },
          h('div', { class: 'matriz__nombre' }, M_.nombres[p.f]),
          h('div', { class: 'matriz__pista', 'aria-hidden': 'true' }, h('div', { class: 'matriz__barra', style: 'width:' + p.pct + '%;background:' + COLORES[p.f] })),
          h('div', { class: 'matriz__pct' }, p.pct + ' %'));
      }), [h('p', { class: 'matriz__nota' }, M_.nota)]);
      matriz.replaceChildren.apply(matriz, hijos);
    }
    pintarMatriz();

    var nombre = P.nombre;
    var persistente = gu && gu.guardado;
    var aviso = gu
      ? (persistente
        ? h('p', { class: 'aviso-guardado', role: 'status' }, 'Tu puntaje quedó anotado en el ranking de esta pantalla: puesto ' + gu.puesto + ' de ' + gu.deTotal + ' en «' + ui.nombreCategoria(P.modo, P.contrarreloj) + '».')
        : h('p', { class: 'aviso-guardado aviso-guardado--mal', role: 'status' }, 'Este navegador no puede guardar datos: tu puntaje se ve mientras esta pantalla siga abierta, pero se pierde al cerrarla.'))
      : null;

    var cat = RE.almacen.ranking.categoria(P.modo, P.contrarreloj);
    var top = RE.almacen.ranking.top(cat, C.ranking.mostrar);
    var enTop = gu && top.some(function (x) { return x.id === gu.entrada.id; });
    var ranking = h('div', { class: 'ranking' }, h('h3', { class: 'ranking__titulo' }, ui.icono('trofeo'), 'Mejores puntajes'), ui.listaRanking(top, gu && gu.entrada.id, gu && !enTop ? gu : null));

    var fallos = P.falladas.length;
    var acciones = h('div', { class: 'acciones' },
      fallos ? ui.boton('Repasar lo que se complicó (' + fallos + ')', { id: 'botonRepaso', icono: 'repasar', clase: 'boton--fantasma', onclick: function () { e.repasoIdx = 0; ui.ir('repaso'); } }) : null,
      ui.boton('Jugar de nuevo', { id: 'botonOtraVez', icono: 'jugar', onclick: function () { ui.reiniciar(false); } }),
      ui.boton('Créditos y fuentes', { id: 'botonCreditosFinal', icono: 'info', clase: 'boton--fantasma', onclick: function () { ui.abrirCreditos(); } }));

    var d_ = res.desafio;
    ui.anunciar('Recorrido completo. ' + res.aciertos + ' aciertos de ' + res.total + ', ' + res.puntaje + ' puntos.');
    return h('section', { class: 'tarjeta', 'aria-labelledby': 'tituloFinal' },
      h('div', { class: 'final' },
        h('div', { class: 'final__cuerpo' },
          h('div', { class: 'final__col' },
            h('div', { class: 'final__cab' },
              h('h2', { class: 'titulo', id: 'tituloFinal', tabindex: '-1' }, nombre ? '¡Recorrido completo, ' + nombre + '!' : '¡Recorrido completo!'),
              h('p', { class: 'insignia' }, res.insignia.titulo), h('p', { class: 'nota' }, res.insignia.cuerpo)),
            h('div', { class: 'datos' },
              dato(res.aciertos + '/' + res.total, 'Aciertos'), dato(String(res.puntaje), 'Puntaje'), dato(String(res.mejorRacha), 'Mejor racha'), dato(res.pct + '%', 'Precisión')),
            h('p', { class: 'nota', style: 'text-align:center' }, 'Desafío final: ' + d_.aPrimera + ' de ' + d_.total + ' lugares a la primera (' + d_.puntos + ' puntos).'),
            aviso, ranking),
          h('div', { class: 'final__col' }, matriz)),
        acciones));
  };

  // ---------- repaso ----------
  ui.pantallas.repaso = function () {
    var e = ui.estado, P = e.partida, lista = P.falladas;
    var i = Math.min(e.repasoIdx, lista.length - 1);
    var f = lista[i], q = P.preguntas.filter(function (x) { return x.id === f.id; })[0], est = ui.estacion(q.estIdx);
    var fuentes = nombresFuentes(q);
    var ultimo = i === lista.length - 1;
    var tuya = f.elegida >= 0 ? q.opciones[f.elegida] : 'Se acabó el tiempo';
    ui.anunciar('Repaso ' + (i + 1) + ' de ' + lista.length + '. ' + q.pregunta + ' La respuesta correcta es ' + q.opciones[q.correcta] + '.');
    return h('section', { class: 'tarjeta', 'aria-labelledby': 'tituloRepaso' },
      h('div', { class: 'repaso' },
        h('div', { class: 'repaso__cab' },
          h('div', null, h('span', { class: 'kicker' }, 'Repaso · ' + est.nombre), h('h2', { class: 'titulo titulo--m', id: 'tituloRepaso', tabindex: '-1' }, 'Para repasar ' + (i + 1) + ' de ' + lista.length)),
          ui.boton('Volver a mis resultados', { icono: 'flechaIzq', clase: 'boton--fantasma boton--chico', onclick: function () { ui.ir('final'); } })),
        h('div', { class: 'repaso__cuerpo' },
          h('p', { class: 'repaso__pregunta' }, q.pregunta),
          h('div', { class: 'repaso__par' },
            h('div', { class: 'repaso__caja ' + (f.elegida >= 0 ? 'repaso__caja--mal' : 'repaso__caja--neutra') }, h('small', null, f.elegida >= 0 ? 'Tu respuesta' : 'Tiempo'), tuya),
            h('div', { class: 'repaso__caja repaso__caja--ok' }, h('small', null, 'Respuesta correcta'), q.opciones[q.correcta])),
          h('div', { class: 'repaso__explica' }, q.explicacion, fuentes.length || q.vigencia ? h('span', { class: 'explicacion__fuente' }, (q.vigencia ? 'Dato de ' + q.vigencia + '. ' : '') + (fuentes.length ? 'Fuente: ' + fuentes.join(' · ') : '')) : null)),
        h('div', { class: 'repaso__nav' },
          i > 0 ? ui.boton('Anterior', { icono: 'flechaIzq', clase: 'boton--fantasma', onclick: function () { e.repasoIdx = i - 1; ui.ir('repaso'); } }) : h('span'),
          ultimo ? ui.boton('Listo', { icono: 'check', onclick: function () { ui.ir('final'); } }) : ui.boton('Siguiente', { icono: 'flechaDer', iconoAntes: false, onclick: function () { e.repasoIdx = i + 1; ui.ir('repaso'); } }))));
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
