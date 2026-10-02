/* Preguntas de la estación Uruguay (el país, la red y Energimundo). Misma convención que p-hidraulica.js. */
(function (g) {
  'use strict';
  var P = g.RE.datos.preguntas;
  function q(o) {
    P.push({
      id: o.id, estacion: 'uruguay', dificultad: o.d, tipo: o.t, pregunta: o.p, opciones: o.o, correcta: 0,
      explicacion: o.e, fuente: o.f, vigencia: o.v || null, noJuntarCon: o.no || []
    });
  }

  q({ id: 'uru-001', d: 1, t: 'numero', v: '2025',
    p: 'En un año normal, ¿qué parte de la electricidad de Uruguay es renovable?',
    o: ['Más del 90 %', 'Cerca del 60 %', 'Cerca del 40 %', 'Cerca del 75 %'],
    e: 'Fue 92 % en 2023 (año de sequía), 99 % en 2024 y 98 % en 2025.',
    f: ['uyxxi-2025', 'miem-sin-2025'] });

  q({ id: 'uru-002', d: 3, t: 'numero', v: '2025',
    p: 'Hoy, ¿cómo se comparan la potencia hidráulica y la eólica instaladas en Uruguay?',
    o: ['Casi iguales, con unos 1.500 MW cada una', 'La eólica tiene el doble que la hidráulica',
        'La hidráulica tiene el triple que la eólica', 'La eólica tiene la mitad que la hidráulica'],
    e: 'Ambas rondan los 1.500 MW: las represas y los parques eólicos aportan una potencia casi igual.',
    f: ['uyxxi-2025'] });

  q({ id: 'uru-003', d: 1, t: 'lugar',
    p: '¿Dónde está Energimundo, el museo interactivo que inspiró este juego?',
    o: ['En el acceso a la represa de Salto Grande', 'En la Ciudad Vieja, en el centro de Montevideo', 'En el puerto viejo de Colonia del Sacramento', 'En la rambla de Punta del Este'],
    e: 'Está en la margen uruguaya de Salto Grande (ruta 3, km 508) y es gratuito. Lo presentaron CTM Salto Grande y el LATU.',
    f: ['energimundo'] });

  q({ id: 'uru-004', d: 2, t: 'dato',
    p: '¿A qué países vecinos exporta electricidad Uruguay cuando le sobra?',
    o: ['Argentina y Brasil', 'Chile y Bolivia', 'Paraguay y Perú', 'Colombia y Ecuador'],
    e: 'Entre 2016 y 2025 Brasil compró el 55 % de lo exportado y Argentina el 45 %, aunque últimamente casi todo va a Argentina.',
    f: ['uyxxi-2025'], no: ['uru-010'] });

  q({ id: 'uru-005', d: 3, t: 'dato',
    p: '¿Qué organismo regula la electricidad, los combustibles y el agua potable?',
    o: ['URSEA', 'ANTEL', 'INAC', 'BPS'],
    e: 'La URSEA, creada por la Ley 17.598 en 2002, regula la energía eléctrica, los combustibles, el agua potable y el saneamiento.',
    f: ['impo-ursea'] });

  q({ id: 'uru-006', d: 2, t: 'concepto',
    p: '¿Cómo se llama la etapa en que Uruguay busca reducir el petróleo del transporte y la industria?',
    o: ['Segunda transición energética', 'Plan de apagón progresivo', 'Regreso al petróleo barato', 'Cierre de las represas'],
    e: 'La primera limpió la electricidad. La segunda apunta al transporte y la industria: más del 40 % de la energía total aún es fósil.',
    f: ['miem-transicion'], no: ['uru-016', 'uru-018', 'uru-019'] });

  q({ id: 'uru-007', d: 2, t: 'concepto',
    p: '¿Qué es el hidrógeno verde?',
    o: ['Hidrógeno obtenido del agua con electricidad renovable', 'Gas natural al que se le agrega colorante verde',
        'Hidrógeno que se extrae de pozos de petróleo', 'Un gas que las plantas producen al hacer fotosíntesis'],
    e: 'Se produce separando el agua con electricidad de origen renovable. Uruguay quiere usarlo en el transporte pesado y exportarlo.',
    f: ['uyxxi-2025', 'miem-transicion'] });

  q({ id: 'uru-008', d: 2, t: 'numero',
    p: 'En la Ruta Eléctrica de UTE, ¿cada cuántos kilómetros hay un cargador para autos eléctricos?',
    o: ['Cada 50 km', 'Cada 10 km', 'Cada 100 km', 'Cada 250 km'],
    e: 'UTE instaló más de 460 puntos de carga en rutas nacionales; 130 son rápidos (80 % de la batería en 20 minutos).',
    f: ['uyxxi-2025'] });

  q({ id: 'uru-009', d: 2, t: 'numero',
    p: 'Antes de 2008, ¿cuántos parques eólicos a gran escala había en Uruguay?',
    o: ['Ninguno', 'Uno', 'Cinco', 'Veinte'],
    e: 'Hasta 2008 no había parques eólicos a gran escala: en pocos años el país pasó a tener más de 40.',
    f: ['uyxxi-2025'], no: ['eol-003'] });

  q({ id: 'uru-010', d: 3, t: 'concepto',
    p: '¿Por qué hacen falta conversoras de frecuencia para venderle electricidad a Brasil?',
    o: ['Porque Uruguay usa 50 Hz y Brasil usa 60 Hz', 'Porque Brasil usa solo corriente continua',
        'Porque los cables de Uruguay tienen más voltaje', 'Porque la electricidad uruguaya es verde y la de Brasil no'],
    e: 'Las conversoras de Melo (500 MW) y Rivera (unos 70 MW) pasan la corriente de 50 Hz a 60 Hz para cruzar la frontera.',
    f: ['uyxxi-2025'] });

  q({ id: 'uru-011', d: 1, t: 'dato',
    p: '¿Qué empresa pública lleva la electricidad a los hogares uruguayos?',
    o: ['UTE', 'ANCAP', 'OSE', 'ANTEL'],
    e: 'UTE produce y compra energía, la transmite y la distribuye a todo el país.',
    f: ['uyxxi-2025'], no: ['hid-017'] });

  q({ id: 'uru-012', d: 2, t: 'numero',
    p: '¿Qué parte de los hogares uruguayos tiene acceso a electricidad?',
    o: ['Cerca del 99,9 %', 'Cerca del 80 %', 'Cerca del 60 %', 'Cerca del 95 %'],
    e: 'La cobertura llega al 99,9 % de los hogares, con unos 90.000 km de líneas de distribución y 5.857 km de transmisión.',
    f: ['uyxxi-2025'] });

  q({ id: 'uru-013', d: 3, t: 'concepto',
    p: '¿Cómo funciona la tarifa Doble Horario de UTE?',
    o: ['Sale más barata casi todo el día, menos 4 horas seguidas', 'Sale más barata de día y más cara toda la noche',
        'Sale el doble de cara durante todos los meses de verano', 'Sale igual todo el día pero baja si se consume más'],
    e: 'El horario punta dura cuatro horas seguidas, a elegir entre las 17 y las 23; el resto del día la energía cuesta bastante menos.',
    f: ['ute-doble-horario'], no: ['hid-001'] });

  q({ id: 'uru-014', d: 3, t: 'concepto',
    p: 'En el despacho de la electricidad, ¿qué fuentes se usan primero?',
    o: ['Las que no gastan combustible: agua, viento y sol', 'Las más viejas, para que no se oxiden con el tiempo',
        'Las que están más lejos de las ciudades', 'Las térmicas, porque se prenden más rápido'],
    e: 'Se usan primero las centrales de menor costo; como el agua, el viento y el sol no gastan combustible, entran antes que las térmicas.',
    f: ['prodnac-despacho', 'adme-mision'], no: ['hid-020'] });

  q({ id: 'uru-015', d: 2, t: 'concepto',
    p: '¿Para qué se usan hoy las centrales térmicas como Punta del Tigre?',
    o: ['De respaldo, para situaciones puntuales', 'Producen casi toda la electricidad del país',
        'Se cerraron y ya no funcionan', 'Generan energía solar durante la noche'],
    e: 'Punta del Tigre B (540 MW) se usa poco pero es imprescindible: entra en sequías o cuando las renovables no alcanzan.',
    f: ['ute-punta-tigre'] });

  q({ id: 'uru-016', d: 1, t: 'concepto',
    p: '¿Qué te dice la etiqueta de eficiencia energética de una heladera?',
    o: ['Cuánto gasta frente a otras; la A es la mejor', 'En qué país se fabricó y en qué año salió',
        'Cuánto pesa y cuánto mide por dentro del equipo', 'Cuánto tiempo dura la garantía del fabricante'],
    e: 'La letra A identifica a los equipos que gastan menos energía para hacer lo mismo. Es obligatoria en heladeras, freezers, aires y calefones.',
    f: ['miem-etiquetado'], no: ['uru-019'] });

  q({ id: 'uru-017', d: 3, t: 'concepto',
    p: '¿Qué son los PPA que firmó UTE con los parques privados?',
    o: ['Contratos de compra de energía a largo plazo', 'Permisos para instalar torres en los campos',
        'Préstamos del Estado sin intereses', 'Subastas de petróleo para las térmicas'],
    e: 'UTE se comprometió a comprarles la energía durante muchos años, y eso dio seguridad para invertir en parques eólicos, solares y de biomasa.',
    f: ['uyxxi-2025', 'elobservador-ppa'] });

  q({ id: 'uru-018', d: 1, t: 'dato',
    p: '¿Qué ministerio define la política energética del país?',
    o: ['MIEM (Industria, Energía y Minería)', 'MSP (Ministerio de Salud Pública)', 'MI (Ministerio del Interior)', 'MGAP (Ganadería, Agricultura y Pesca)'],
    e: 'El Ministerio de Industria, Energía y Minería, a través de su Dirección Nacional de Energía, define la política y publica el balance energético.',
    f: ['miem-transicion', 'uyxxi-2025'] });

  q({ id: 'uru-019', d: 1, t: 'concepto',
    p: '¿Qué es la eficiencia energética?',
    o: ['Lograr el mismo servicio gastando menos energía', 'Usar solo energía de fuentes renovables',
        'Apagar todo lo que se pueda para no gastar', 'Producir más electricidad de la que se consume'],
    e: 'Un equipo con etiqueta A da el mismo servicio que otro de menor eficiencia, pero consume menos energía.',
    f: ['miem-etiquetado'], no: ['uru-016'] });

  q({ id: 'uru-020', d: 2, t: 'concepto',
    p: '¿Por qué la matriz eléctrica uruguaya aguanta bien una sequía?',
    o: ['Porque combina fuentes distintas que se respaldan', 'Porque casi toda la electricidad se importa',
        'Porque depende de un solo río muy grande', 'Porque no usa tecnologías que dependan del clima'],
    e: 'En 2023, con una de las peores sequías, igual el 92 % fue renovable: viento, biomasa y sol compensaron a las represas.',
    f: ['uyxxi-2025'], no: ['hid-014'] });
})(typeof globalThis !== 'undefined' ? globalThis : this);
