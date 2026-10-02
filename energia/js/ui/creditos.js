/* Interfaz: créditos y fuentes (se abre como diálogo, sin interrumpir la partida en curso). */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});
  var C = RE.config, ui = RE.ui, U = RE.util, h = U.h;

  var TIPOS = { oficial: 'Organismos y empresas públicas', academica: 'Universidad y publicaciones científicas', prensa: 'Prensa', enciclopedia: 'Enciclopedia' };

  ui.abrirCreditos = function () {
    var D = RE.datos, F = D.fuentes;
    var usadas = {};
    D.preguntas.forEach(function (q) { (q.fuente || []).forEach(function (id) { usadas[id] = true; }); });
    D.lugares.forEach(function (l) { usadas[l.fuente] = true; });
    D.matriz.bases.forEach(function (b) { usadas[b.fuente] = true; });

    var grupos = {};
    Object.keys(usadas).forEach(function (id) { if (F[id]) (grupos[F[id].tipo] = grupos[F[id].tipo] || []).push(F[id].nombre); });
    var colFuentes = [];
    Object.keys(TIPOS).forEach(function (t) {
      if (!grupos[t]) return;
      colFuentes.push(h('h3', null, TIPOS[t]), h('ul', { class: 'fuentes' }, grupos[t].sort(function (a, b) { return a.localeCompare(b, 'es'); }).map(function (n) { return h('li', null, n); })));
    });

    var fotos = ['hidraulica', 'eolica', 'solar', 'biomasa', 'uruguay'].map(function (k) {
      var f = RE.fotos[k];
      return h('li', null, f.lugar + '. Foto de ' + f.autor + ', ' + f.licencia.nombre + ' (Wikimedia Commons: «' + f.archivo + '»).');
    });

    var contenido = h('div', { class: 'creditos', style: 'width:100%;text-align:left' },
      h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:1rem' },
        h('h2', null, 'Créditos y fuentes'),
        ui.boton('Cerrar', { id: 'botonCerrarCreditos', clase: 'boton--chico', icono: 'cruz', onclick: function () { dlg.cerrar(); } })),
      h('div', { class: 'creditos__cuerpo' },
        h('div', { class: 'creditos__col', tabindex: '0', role: 'region', 'aria-label': 'Fuentes de los datos' },
          h('h3', null, 'De dónde salen los datos'),
          h('p', null, 'Las preguntas se armaron con la información de estas fuentes (consultadas en octubre de 2026). Cada respuesta indica la suya y el año del dato cuando corresponde. Las cifras de la matriz eléctrica cambian cada año: conviene revisarlas.'),
          colFuentes),
        h('div', { class: 'creditos__col', tabindex: '0', role: 'region', 'aria-label': 'Imágenes, tipografías y otros créditos' },
          h('h3', null, 'Fotos de fondo'),
          h('ul', null, fotos),
          h('p', null, h('small', null, RE.fotos.cambios + ' Las licencias CC BY-SA 3.0 y 4.0 permiten usarlas citando a quien las sacó.')),
          h('h3', null, 'Tipografías'),
          h('p', null, 'Fredoka y Nunito, con licencia SIL Open Font License 1.1.'),
          h('h3', null, 'Inspiración'),
          h('p', null, 'Energimundo, el museo interactivo de energía de la Comisión Técnica Mixta de Salto Grande y el LATU. El logo es de sus titulares.'),
          h('h3', null, 'Sobre este juego'),
          h('p', null, 'Versión ' + C.version + ' · datos revisados el ' + D.revision + '. Funciona sin conexión y no envía datos a ningún servidor: los nombres y puntajes quedan solo en esta pantalla.'))));
    var dlg = ui.capas.abrir(contenido, { etiqueta: 'Créditos y fuentes', clase: 'panel-creditos' });
    return dlg;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
