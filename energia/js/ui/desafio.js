/* Interfaz: desafío final. Se une cada lugar con su departamento de tres maneras: tocando el lugar y luego la ficha
   (o al revés), arrastrando la ficha hasta el lugar, o con el teclado. Un solo arrastre a la vez. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});
  var ui = RE.ui, M = RE.motor, U = RE.util, h = U.h, d = g.document;

  ui.pantallas.desafio = function () {
    var e = ui.estado, P = e.partida, des = P.desafio;
    var sel = null;                    // {tipo: 'lugar' | 'ficha', id}
    var arrastre = null;               // arrastre en curso
    var suprimirClic = false;
    var terminado = false;
    var estado = h('p', { class: 'desafio__estado', role: 'status' });
    var lugares = {}, fichas = {};

    function decir(texto, clase) {
      estado.textContent = texto;
      estado.className = 'desafio__estado' + (clase ? ' desafio__estado--' + clase : '');
    }
    function restantes() { return des.items.filter(function (i) { return i.estado === 'pendiente'; }).length; }

    function repintar() {
      des.items.forEach(function (it) {
        var b = lugares[it.id], hueco = b.querySelector('.lugar__hueco');
        b.classList.toggle('lugar--elegido', !!sel && sel.tipo === 'lugar' && sel.id === it.id);
        b.classList.toggle('lugar--resuelto', it.estado === 'resuelto');
        b.classList.toggle('lugar--revelado', it.estado === 'revelado');
        b.setAttribute('aria-pressed', sel && sel.tipo === 'lugar' && sel.id === it.id ? 'true' : 'false');
        b.disabled = it.estado !== 'pendiente';
        if (it.estado === 'resuelto') hueco.textContent = it.depto;
        else if (it.estado === 'revelado') hueco.textContent = it.depto + ' (era este)';
        else hueco.textContent = sel && sel.tipo === 'ficha' ? 'Tocá acá' : 'Departamento';
      });
      des.deptos.forEach(function (dep) {
        var b = fichas[dep], usada = !!des.colocados[dep];
        b.classList.toggle('ficha--usada', usada);
        b.classList.toggle('ficha--elegida', !!sel && sel.tipo === 'ficha' && sel.id === dep);
        b.setAttribute('aria-pressed', sel && sel.tipo === 'ficha' && sel.id === dep ? 'true' : 'false');
        b.disabled = usada;
      });
    }

    function intentar(itemId, depto) {
      var r = M.resolverLugar(P, itemId, depto);
      sel = null;
      if (!r) { repintar(); return; }
      var it = r.item, b = lugares[it.id];
      if (r.ok) {
        RE.audio.reproducir('correcto');
        decir('¡Bien! ' + it.lugar + ' está en ' + it.depto + '. +' + r.puntos + (r.puntos === 1 ? ' punto' : ' puntos'), 'ok');
      } else if (r.revelado) {
        RE.audio.reproducir('error');
        decir('Era ' + it.depto + '. ¡Seguimos con el resto!', 'mal');
      } else {
        RE.audio.reproducir('error');
        decir('Ese no es. Probá otra vez (te queda ' + r.intentosQuedan + ' intento).', 'mal');
        b.classList.add('lugar--error');
        setTimeout(function () { b.classList.remove('lugar--error'); }, 700);
      }
      repintar();
      ui.cabecera();
      if (des.terminado && !terminado) terminar();
    }

    function terminar() {
      terminado = true;
      ui.capas.confeti();
      RE.audio.reproducir('logro');
      var boton = ui.boton('Ver mis resultados', { id: 'botonResultados', icono: 'flechaDer', iconoAntes: false, onclick: function () { clearTimeout(auto); ui.finalizar(); } });
      pie.appendChild(boton);
      if (ui.usandoTeclado()) boton.focus({ preventScroll: true });
      var auto = setTimeout(function () { if (ui.estado.pantalla === 'desafio') ui.finalizar(); }, 3800);
      var antes = ui.limpiarPantalla;
      ui.limpiarPantalla = function () { clearTimeout(auto); if (antes) antes(); };
    }

    // ----- toques -----
    function tocarLugar(id) {
      if (suprimirClic || arrastre) return;
      if (sel && sel.tipo === 'ficha') { intentar(id, sel.id); return; }
      sel = sel && sel.tipo === 'lugar' && sel.id === id ? null : { tipo: 'lugar', id: id };
      repintar();
      decir(sel ? 'Ahora tocá el departamento donde está.' : '');
    }
    function tocarFicha(dep) {
      if (suprimirClic || arrastre) return;
      if (sel && sel.tipo === 'lugar') { intentar(sel.id, dep); return; }
      sel = sel && sel.tipo === 'ficha' && sel.id === dep ? null : { tipo: 'ficha', id: dep };
      repintar();
      decir(sel ? 'Ahora tocá el lugar que corresponde a ' + dep + '.' : '');
    }

    // ----- arrastre -----
    function lugarBajo(x, y) {
      var el = d.elementFromPoint(x, y), l = el && el.closest ? el.closest('.lugar') : null;
      return l && !l.disabled ? l : null;
    }
    function empezar(ev, dep, boton) {
      if (arrastre || ev.button > 0 || boton.disabled) return;
      arrastre = { pid: ev.pointerId, dep: dep, boton: boton, x0: ev.clientX, y0: ev.clientY, fantasma: null, sobre: null };
      try { boton.setPointerCapture(ev.pointerId); } catch (err) { arrastre = null; return; }
    }
    function mover(ev) {
      var a = arrastre;
      if (!a || ev.pointerId !== a.pid) return;
      if (!a.fantasma) {
        if (Math.abs(ev.clientX - a.x0) + Math.abs(ev.clientY - a.y0) < 10) return;
        var r = a.boton.getBoundingClientRect();
        a.dx = a.x0 - r.left; a.dy = a.y0 - r.top;
        a.fantasma = a.boton.cloneNode(true);
        a.fantasma.classList.add('ficha--arrastrando');
        a.fantasma.style.width = r.width + 'px'; a.fantasma.style.height = r.height + 'px';
        d.body.appendChild(a.fantasma);
        sel = null; repintar();
      }
      a.fantasma.style.left = (ev.clientX - a.dx) + 'px';
      a.fantasma.style.top = (ev.clientY - a.dy) + 'px';
      var l = lugarBajo(ev.clientX, ev.clientY);
      if (a.sobre && a.sobre !== l) a.sobre.classList.remove('lugar--sobre');
      if (l) l.classList.add('lugar--sobre');
      a.sobre = l;
    }
    function soltar(ev) {
      var a = arrastre;
      if (!a || ev.pointerId !== a.pid) return;
      arrastre = null;
      try { a.boton.releasePointerCapture(ev.pointerId); } catch (err) { /* ya liberado */ }
      if (a.sobre) a.sobre.classList.remove('lugar--sobre');
      if (a.fantasma) {
        a.fantasma.remove();
        suprimirClic = true; setTimeout(function () { suprimirClic = false; }, 60);
        if (ev.type === 'pointerup') {
          var l = lugarBajo(ev.clientX, ev.clientY);
          if (l) intentar(l.getAttribute('data-id'), a.dep);
        }
      }
    }
    function cancelarArrastre() {
      if (arrastre && arrastre.fantasma) arrastre.fantasma.remove();
      if (arrastre && arrastre.sobre) arrastre.sobre.classList.remove('lugar--sobre');
      arrastre = null;
    }

    // ----- armado -----
    des.items.forEach(function (it) {
      lugares[it.id] = h('button', { type: 'button', class: 'lugar', 'data-id': it.id, 'aria-pressed': 'false', onclick: function () { tocarLugar(it.id); } },
        ui.icono(it.energia, 'lugar__icono'), h('span', { class: 'lugar__texto' }, it.lugar), h('span', { class: 'lugar__hueco' }, 'Departamento'));
    });
    des.deptos.forEach(function (dep) {
      var b = h('button', { type: 'button', class: 'ficha', 'aria-pressed': 'false', onclick: function () { tocarFicha(dep); } }, dep);
      b.addEventListener('pointerdown', function (ev) { empezar(ev, dep, b); });
      b.addEventListener('pointermove', mover);
      b.addEventListener('pointerup', soltar);
      b.addEventListener('pointercancel', soltar);
      fichas[dep] = b;
    });
    var pie = h('div', { class: 'desafio__pie' }, estado);

    function tecla(ev) { if (ev.key === 'Escape' && sel && !ui.capas.hayAbiertas()) { sel = null; repintar(); decir(''); } }
    d.addEventListener('keydown', tecla);
    ui.limpiarPantalla = function () { d.removeEventListener('keydown', tecla); cancelarArrastre(); };

    repintar();
    decir('Elegí un lugar y después su departamento, o arrastrá la ficha hasta el lugar.');
    return h('section', { class: 'tarjeta', 'aria-labelledby': 'tituloDesafio' },
      h('div', { class: 'desafio' },
        h('div', { class: 'desafio__cab' },
          h('span', { class: 'kicker' }, 'Desafío final'),
          h('h2', { class: 'titulo', id: 'tituloDesafio', tabindex: '-1' }, 'Uní cada lugar con su departamento'),
          h('p', { class: 'bajada' }, 'Tocá un lugar y después el departamento donde está, o arrastrá la ficha hasta el lugar. Tenés dos intentos por lugar: 10 puntos a la primera, 5 a la segunda.')),
        h('div', { class: 'desafio__tablero' },
          h('div', { class: 'lugares' }, des.items.map(function (it) { return lugares[it.id]; })),
          h('div', { class: 'fichas', role: 'group', 'aria-label': 'Departamentos' }, des.deptos.map(function (dep) { return fichas[dep]; }))),
        pie));
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
