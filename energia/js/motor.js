/* Motor del juego: sorteo de preguntas, orden de las opciones, puntaje, contrarreloj y desafío final.
   No toca el DOM ni el disco: todo recibe sus datos y su azar por parámetro, así se puede probar en Node. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});
  var C = RE.config, U = RE.util;

  // ---------- posición de la opción correcta ----------
  // Cada posición se sortea de forma independiente y pareja. Se descartan los sorteos con tres iguales seguidas
  // o con una escalera A→B→C→D, porque son los patrones que un jugador que no lee puede aprovechar.
  function tieneRacha(p) {
    for (var i = 2; i < p.length; i++) if (p[i] === p[i - 1] && p[i] === p[i - 2]) return true;
    return false;
  }
  function tieneEscalera(p) {
    for (var i = 3; i < p.length; i++) {
      var d1 = (p[i] - p[i - 1] + 4) % 4, d2 = (p[i - 1] - p[i - 2] + 4) % 4, d3 = (p[i - 2] - p[i - 3] + 4) % 4;
      if (d1 === d2 && d2 === d3 && (d1 === 1 || d1 === 3)) return true;
    }
    return false;
  }
  function sortearPosiciones(n, rng) {
    var p;
    for (var intento = 0; intento < 300; intento++) {
      p = [];
      for (var i = 0; i < n; i++) p.push(U.entero(4, rng));
      if (!tieneRacha(p) && !tieneEscalera(p)) return p;
    }
    return p;
  }

  // Las tres incorrectas se mezclan y la correcta se coloca en la posición sorteada.
  function ordenarOpciones(q, pos, rng) {
    var malas = U.barajar(q.opciones.filter(function (_, i) { return i !== q.correcta; }), rng), k = 0, r = [];
    for (var i = 0; i < 4; i++) r.push(i === pos ? q.opciones[q.correcta] : malas[k++]);
    return r;
  }

  // ---------- sorteo de preguntas ----------
  function chocan(a, b) {
    return (a.noJuntarCon || []).indexOf(b.id) >= 0 || (b.noJuntarCon || []).indexOf(a.id) >= 0;
  }

  // Entre las candidatas, primero las que no se vieron (al azar); si ya se vieron todas, una de la mitad que se vio hace más tiempo.
  function elegirUna(cands, vistas, rng) {
    var barajadas = U.barajar(cands, rng);
    var nuevas = barajadas.filter(function (q) { return vistas.indexOf(q.id) < 0; });
    if (nuevas.length) return nuevas[U.entero(nuevas.length, rng)];
    var orden = barajadas.sort(function (a, b) { return vistas.indexOf(a.id) - vistas.indexOf(b.id); });
    return orden[U.entero(Math.min(orden.length, Math.max(2, Math.ceil(orden.length / 2))), rng)];
  }

  function elegirPreguntas(o) {
    var D = o.datos || RE.datos, M = C.modos[o.modo] || C.modos.completo, rng = o.rng, vistas = o.vistas || [];
    var elegidas = [], ids = {};
    D.estaciones.forEach(function (est, ei) {
      var pool = D.preguntas.filter(function (q) { return q.estacion === est.clave; });
      M.plantilla.forEach(function (dif) {
        var libres = pool.filter(function (q) { return !ids[q.id]; });
        var sinChoque = libres.filter(function (q) { return !elegidas.some(function (e) { return chocan(q, e.q); }); });
        var cands = sinChoque.filter(function (q) { return q.dificultad === dif; });
        if (!cands.length) { // no alcanzan de esa dificultad: la más cercana, sin choques
          var cerca = sinChoque.slice().sort(function (a, b) { return Math.abs(a.dificultad - dif) - Math.abs(b.dificultad - dif); });
          cands = cerca.filter(function (q) { return q.dificultad === (cerca[0] && cerca[0].dificultad); });
        }
        if (!cands.length) cands = libres;
        var q = elegirUna(cands, vistas, rng);
        ids[q.id] = true;
        elegidas.push({ q: q, ei: ei });
      });
    });
    var pos = sortearPosiciones(elegidas.length, rng), cuenta = {};
    return elegidas.map(function (e, i) {
      var q = e.q;
      cuenta[e.ei] = (cuenta[e.ei] || 0) + 1;
      return {
        id: q.id, estacion: q.estacion, estIdx: e.ei, enEstacion: cuenta[e.ei], numero: i + 1,
        dificultad: q.dificultad, tipo: q.tipo, pregunta: q.pregunta,
        opciones: ordenarOpciones(q, pos[i], rng), correcta: pos[i],
        explicacion: q.explicacion, fuente: q.fuente, vigencia: q.vigencia
      };
    });
  }

  // ---------- contrarreloj ----------
  // Tiempo para contestar: lo que se tarda en leer la pregunta y las cuatro opciones, más un margen, según el ritmo elegido.
  function limiteMs(q, ritmo) {
    var t = C.tiempo, f = (C.ritmos[ritmo] || C.ritmos.normal).factor;
    var n = U.palabras(q.pregunta);
    for (var i = 0; i < q.opciones.length; i++) n += U.palabras(q.opciones[i]);
    return Math.round(U.limitar((t.baseS + n / t.palabrasPorS) * f, t.minS, t.maxS)) * 1000;
  }

  // ---------- desafío final: unir cada lugar con su departamento ----------
  var INTENTOS_LUGAR = 2;
  function nuevoDesafio(D, modo, rng) {
    D = D || RE.datos;
    var M = C.modos[modo] || C.modos.completo, n = Math.min(M.lugares, D.lugares.length);
    var porEnergia = {};
    D.lugares.forEach(function (l) { (porEnergia[l.energia] = porEnergia[l.energia] || []).push(l); });
    var items = [], usados = {};
    // Primero uno de cada energía (en orden al azar); si faltan, se completa con lugares de otros departamentos.
    U.barajar(Object.keys(porEnergia), rng).forEach(function (e) {
      if (items.length >= n) return;
      var l = U.barajar(porEnergia[e], rng)[0];
      if (!usados[l.depto]) { items.push(l); usados[l.depto] = true; }
    });
    U.barajar(D.lugares, rng).forEach(function (l) {
      if (items.length < n && !usados[l.depto] && items.indexOf(l) < 0) { items.push(l); usados[l.depto] = true; }
    });
    var otros = [];
    D.lugares.forEach(function (l) { if (!usados[l.depto] && otros.indexOf(l.depto) < 0) otros.push(l.depto); });
    var extra = U.barajar(otros, rng).slice(0, M.distractoresLugares);
    return {
      items: U.barajar(items, rng).map(function (l) {
        return { id: l.id, lugar: l.lugar, depto: l.depto, energia: l.energia, fuente: l.fuente, estado: 'pendiente', intentos: 0, puntos: 0 };
      }),
      deptos: U.barajar(items.map(function (l) { return l.depto; }).concat(extra), rng),
      colocados: {},      // departamento → id del lugar donde quedó
      puntos: 0, aPrimera: 0, revelados: 0, terminado: false
    };
  }

  // Un intento de unir un lugar con un departamento. Devuelve null si el intento no corresponde
  // (lugar ya resuelto o departamento ya usado); si no, {ok, revelado, puntos, intentosQuedan}.
  function probarLugar(des, itemId, depto) {
    var it = null, i;
    for (i = 0; i < des.items.length; i++) if (des.items[i].id === itemId) it = des.items[i];
    if (!it || it.estado !== 'pendiente' || des.colocados[depto] || des.deptos.indexOf(depto) < 0) return null;
    it.intentos++;
    var ok = depto === it.depto, revelado = false, puntos = 0;
    if (ok) {
      puntos = it.intentos === 1 ? C.puntos.desafioPrimera : C.puntos.desafioSegunda;
      it.estado = 'resuelto'; it.puntos = puntos; des.colocados[depto] = it.id;
      if (it.intentos === 1) des.aPrimera++;
    } else if (it.intentos >= INTENTOS_LUGAR) {
      revelado = true; it.estado = 'revelado'; des.colocados[it.depto] = it.id; des.revelados++;
    }
    des.puntos += puntos;
    des.terminado = des.items.every(function (x) { return x.estado !== 'pendiente'; });
    return { ok: ok, revelado: revelado, puntos: puntos, intentosQuedan: ok || revelado ? 0 : INTENTOS_LUGAR - it.intentos, item: it };
  }

  // ---------- partida ----------
  function nuevaPartida(o) {
    o = o || {};
    var modo = C.modos[o.modo] ? o.modo : 'completo', rng = o.rng;
    var preguntas = elegirPreguntas({ datos: o.datos, modo: modo, vistas: o.vistas, rng: rng });
    var porEst = {};
    preguntas.forEach(function (q) { porEst[q.estIdx] = (porEst[q.estIdx] || 0) + 1; });
    return {
      modo: modo, contrarreloj: !!o.contrarreloj, ritmo: C.ritmos[o.ritmo] ? o.ritmo : 'normal',
      nombre: U.limpiarNombre(o.nombre, C.nombreMax),
      preguntas: preguntas, total: preguntas.length, porEstacion: porEst,
      i: 0, respondida: false, elegida: null, terminoPreguntas: false,
      puntaje: 0, racha: 0, mejorRacha: 0, aciertos: 0, aciertosEstacion: {},
      historial: [], falladas: [],
      desafio: nuevoDesafio(o.datos, modo, rng),
      inicioMs: o.ahoraMs || 0
    };
  }

  function actual(P) { return P.preguntas[P.i]; }
  function esUltimaDeEstacion(P) {
    var q = P.preguntas[P.i], sig = P.preguntas[P.i + 1];
    return !sig || sig.estIdx !== q.estIdx;
  }
  function esUltima(P) { return P.i >= P.preguntas.length - 1; }

  function logroPara(racha) {
    var L = C.logros, idx = Math.min(Math.floor(racha / C.puntos.logroCada) - 1, L.length - 1);
    return L[Math.max(0, idx)];
  }

  // eleccion: posición elegida (0 a 3), o -1 si se acabó el tiempo. usadoMs: cuánto tardó (solo importa en contrarreloj).
  function responder(P, eleccion, usadoMs) {
    if (P.respondida || P.terminoPreguntas) return null;
    var q = actual(P), P_ = C.puntos;
    var agotado = eleccion === -1 || eleccion == null;
    var ok = !agotado && eleccion === q.correcta;
    var base = 0, bonoRacha = 0, bonoVel = 0, logro = null;
    if (ok) {
      P.racha++; P.aciertos++;
      P.mejorRacha = Math.max(P.mejorRacha, P.racha);
      P.aciertosEstacion[q.estIdx] = (P.aciertosEstacion[q.estIdx] || 0) + 1;
      base = P_.acierto;
      if (P.racha % P_.bonoRachaCada === 0) bonoRacha = P_.bonoRacha;
      if (P.contrarreloj) {
        var lim = limiteMs(q, P.ritmo);
        bonoVel = Math.round(P_.bonoVelocidadMax * U.limitar(1 - (usadoMs || 0) / lim, 0, 1));
      }
      if (P.racha % P_.logroCada === 0) logro = logroPara(P.racha);
    } else {
      P.racha = 0;
      P.falladas.push({ id: q.id, numero: q.numero, estIdx: q.estIdx, elegida: agotado ? -1 : eleccion });
    }
    var puntos = base + bonoRacha + bonoVel;
    P.puntaje += puntos;
    P.respondida = true; P.elegida = agotado ? -1 : eleccion;
    P.historial.push({ id: q.id, estacion: q.estacion, elegida: P.elegida, correcta: q.correcta, ok: ok, agotado: agotado, ms: Math.round(usadoMs || 0), puntos: puntos });
    return { ok: ok, tiempoAgotado: agotado, correcta: q.correcta, puntos: puntos, base: base, bonoRacha: bonoRacha, bonoVelocidad: bonoVel, racha: P.racha, logro: logro };
  }

  // Pasa a la pregunta siguiente. Si era la última de todas, marca que las preguntas terminaron.
  function avanzar(P) {
    if (!P.respondida) return false;
    if (P.i < P.preguntas.length - 1) { P.i++; P.respondida = false; P.elegida = null; }
    else P.terminoPreguntas = true;
    return true;
  }

  function resolverLugar(P, itemId, depto) {
    var r = probarLugar(P.desafio, itemId, depto);
    if (r) P.puntaje += r.puntos;
    return r;
  }

  function insigniaPara(pct) {
    for (var i = 0; i < C.insignias.length; i++) if (pct >= C.insignias[i].desde) return C.insignias[i];
    return C.insignias[C.insignias.length - 1];
  }

  function resumen(P, ahoraMs) {
    var pct = P.total ? Math.round((100 * P.aciertos) / P.total) : 0, d = P.desafio;
    return {
      aciertos: P.aciertos, total: P.total, pct: pct, puntaje: P.puntaje, mejorRacha: P.mejorRacha,
      insignia: insigniaPara(pct),
      duracionS: Math.max(0, Math.round(((ahoraMs || 0) - (P.inicioMs || 0)) / 1000)),
      desafio: { total: d.items.length, aPrimera: d.aPrimera, puntos: d.puntos, revelados: d.revelados }
    };
  }

  RE.motor = {
    sortearPosiciones: sortearPosiciones, tieneRacha: tieneRacha, tieneEscalera: tieneEscalera, ordenarOpciones: ordenarOpciones,
    elegirPreguntas: elegirPreguntas, limiteMs: limiteMs, nuevoDesafio: nuevoDesafio, probarLugar: probarLugar, INTENTOS_LUGAR: INTENTOS_LUGAR,
    nuevaPartida: nuevaPartida, actual: actual, esUltimaDeEstacion: esUltimaDeEstacion, esUltima: esUltima,
    responder: responder, avanzar: avanzar, resolverLugar: resolverLugar, insigniaPara: insigniaPara, logroPara: logroPara, resumen: resumen
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
