/* Guardado en el propio equipo (localStorage) con respaldo en memoria: si el navegador no deja guardar
   (modo privado, archivo local bloqueado, disco lleno), el juego sigue andando y avisa que el ranking no se conserva. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});
  var C = RE.config, U = RE.util;

  var memoria = {};
  var persistente = true;   // pasa a false en cuanto una escritura o la prueba inicial fallan

  function disco() {
    try {
      var s = g.localStorage;
      if (!s) return null;
      var k = C.almacenPrefijo + 'prueba';
      s.setItem(k, '1'); s.removeItem(k);
      return s;
    } catch (e) { return null; }
  }
  var almacenamiento = disco();
  if (!almacenamiento) persistente = false;

  function leer(clave, defecto) {
    var k = C.almacenPrefijo + clave;
    try {
      var crudo = almacenamiento ? almacenamiento.getItem(k) : null;
      if (crudo == null) crudo = Object.prototype.hasOwnProperty.call(memoria, k) ? memoria[k] : null;
      if (crudo == null) return defecto;
      var v = JSON.parse(crudo);
      return v == null ? defecto : v;
    } catch (e) { return defecto; }
  }

  // Devuelve true si quedó en el disco del equipo, false si solo quedó en memoria.
  function escribir(clave, valor) {
    var k = C.almacenPrefijo + clave, texto = JSON.stringify(valor);
    memoria[k] = texto;
    if (!almacenamiento) { persistente = false; return false; }
    try { almacenamiento.setItem(k, texto); return true; } catch (e) { persistente = false; return false; }
  }

  function borrar(clave) {
    var k = C.almacenPrefijo + clave;
    delete memoria[k];
    try { if (almacenamiento) almacenamiento.removeItem(k); } catch (e) { /* nada que hacer */ }
  }

  function estado() { return { persistente: persistente }; }

  // ---------- ajustes del puesto ----------
  var AJUSTES = { sonido: C.sonidoPorDefecto, modoPorDefecto: 'completo', ritmoPorDefecto: 'normal' };
  var ajustes = {
    leer: function () {
      var a = leer('ajustes', {}), r = {};
      for (var k in AJUSTES) r[k] = a && typeof a[k] === typeof AJUSTES[k] ? a[k] : AJUSTES[k];
      if (!C.modos[r.modoPorDefecto]) r.modoPorDefecto = AJUSTES.modoPorDefecto;
      if (!C.ritmos[r.ritmoPorDefecto]) r.ritmoPorDefecto = AJUSTES.ritmoPorDefecto;
      return r;
    },
    guardar: function (parcial) {
      var a = ajustes.leer();
      for (var k in parcial) if (k in AJUSTES) a[k] = parcial[k];
      escribir('ajustes', a);
      return a;
    }
  };

  // ---------- ranking ----------
  function categoria(modo, contrarreloj) { return modo + (contrarreloj ? '+reloj' : ''); }
  function categoriaDe(e) { return categoria(e.modo, e.contrarreloj); }
  function comparar(a, b) {
    return b.puntaje - a.puntaje || b.pct - a.pct || (a.duracionS || 0) - (b.duracionS || 0) || a.fecha - b.fecha;
  }
  function limpiarEntrada(e) {
    return {
      id: String(e.id), nombre: U.limpiarNombre(e.nombre, C.nombreMax) || 'Anónimo/a',
      puntaje: Math.max(0, Math.round(+e.puntaje || 0)), aciertos: Math.max(0, Math.round(+e.aciertos || 0)),
      total: Math.max(0, Math.round(+e.total || 0)), pct: Math.max(0, Math.round(+e.pct || 0)),
      mejorRacha: Math.max(0, Math.round(+e.mejorRacha || 0)),
      modo: C.modos[e.modo] ? e.modo : 'completo', contrarreloj: !!e.contrarreloj,
      duracionS: Math.max(0, Math.round(+e.duracionS || 0)), fecha: +e.fecha || 0
    };
  }
  function todos() {
    var l = leer('ranking', []);
    return Array.isArray(l) ? l.filter(function (e) { return e && typeof e === 'object'; }).map(limpiarEntrada) : [];
  }
  // Se conservan los 50 mejores de cada categoría y las partidas más recientes, hasta un tope razonable.
  function recortar(lista) {
    var max = C.ranking.guardar * 5, conservar = {}, porCat = {};
    lista.forEach(function (e) { (porCat[categoriaDe(e)] = porCat[categoriaDe(e)] || []).push(e); });
    Object.keys(porCat).forEach(function (c) { porCat[c].sort(comparar).slice(0, 50).forEach(function (e) { conservar[e.id] = true; }); });
    lista.slice().sort(function (a, b) { return b.fecha - a.fecha; }).slice(0, Math.max(0, max - Object.keys(conservar).length)).forEach(function (e) { conservar[e.id] = true; });
    return lista.filter(function (e) { return conservar[e.id]; });
  }
  var ranking = {
    categoria: categoria,
    todos: todos,
    // Anota una partida terminada. Devuelve la entrada, su puesto dentro de la categoría y si quedó guardada en el disco.
    guardar: function (e) {
      var entrada = limpiarEntrada(Object.assign({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), fecha: Date.now() }, e));
      var lista = recortar(todos().concat(entrada));
      var ok = escribir('ranking', lista);
      var cat = ranking.top(categoriaDe(entrada), 1e9);
      var pos = 0;
      for (var i = 0; i < cat.length; i++) if (cat[i].id === entrada.id) { pos = i + 1; break; }
      return { entrada: entrada, puesto: pos, deTotal: cat.length, guardado: ok };
    },
    top: function (cat, n) {
      return todos().filter(function (e) { return categoriaDe(e) === cat; }).sort(comparar).slice(0, n);
    },
    borrar: function () { borrar('ranking'); },
    csv: function () {
      var cab = ['fecha', 'nombre', 'modo', 'contrarreloj', 'puntaje', 'aciertos', 'total', 'porcentaje', 'mejor_racha', 'duracion_s'];
      var filas = todos().sort(function (a, b) { return a.fecha - b.fecha; }).map(function (e) {
        return [new Date(e.fecha).toISOString(), e.nombre, e.modo, e.contrarreloj ? 'si' : 'no', e.puntaje, e.aciertos, e.total, e.pct, e.mejorRacha, e.duracionS];
      });
      return [cab].concat(filas).map(function (f) { return f.map(U.celdaCsv).join(';'); }).join('\r\n');
    }
  };

  // ---------- preguntas vistas (para no repetirlas enseguida en la misma pantalla) ----------
  var vistas = {
    leer: function () { var v = leer('vistas', []); return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }) : []; },
    // ids en el orden en que se vieron; las más recientes quedan al final
    registrar: function (ids) {
      var v = vistas.leer().filter(function (x) { return ids.indexOf(x) < 0; }).concat(ids);
      escribir('vistas', v.slice(-C.vistasMax));
    },
    borrar: function () { borrar('vistas'); }
  };

  // ---------- estadística de preguntas (cuántas veces salió y cuántas se acertó), solo en este equipo ----------
  var stats = {
    leer: function () { var s = leer('stats', {}); return s && typeof s === 'object' && !Array.isArray(s) ? s : {}; },
    registrar: function (historial) {
      var s = stats.leer();
      historial.forEach(function (r) {
        var x = s[r.id] || [0, 0];
        s[r.id] = [x[0] + 1, x[1] + (r.ok ? 1 : 0)];
      });
      escribir('stats', s);
    },
    borrar: function () { borrar('stats'); },
    csv: function (datos) {
      var s = stats.leer(), cab = ['id', 'estacion', 'pregunta', 'veces', 'aciertos', 'porcentaje_acierto'];
      var filas = (datos && datos.preguntas ? datos.preguntas : []).filter(function (q) { return s[q.id]; }).map(function (q) {
        var x = s[q.id];
        return [q.id, q.estacion, q.pregunta, x[0], x[1], x[0] ? Math.round((100 * x[1]) / x[0]) : ''];
      }).sort(function (a, b) { return (a[5] === '' ? 101 : a[5]) - (b[5] === '' ? 101 : b[5]); });
      return [cab].concat(filas).map(function (f) { return f.map(U.celdaCsv).join(';'); }).join('\r\n');
    }
  };

  function borrarTodo() { ranking.borrar(); vistas.borrar(); stats.borrar(); }

  RE.almacen = { estado: estado, leer: leer, escribir: escribir, borrar: borrar, ajustes: ajustes, ranking: ranking, vistas: vistas, stats: stats, borrarTodo: borrarTodo };
})(typeof globalThis !== 'undefined' ? globalThis : this);
