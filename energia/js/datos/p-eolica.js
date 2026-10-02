/* Preguntas de la estación Eólica. Misma convención que p-hidraulica.js. */
(function (g) {
  'use strict';
  var P = g.RE.datos.preguntas;
  function q(o) {
    P.push({
      id: o.id, estacion: 'eolica', dificultad: o.d, tipo: o.t, pregunta: o.p, opciones: o.o, correcta: 0,
      explicacion: o.e, fuente: o.f, vigencia: o.v || null, noJuntarCon: o.no || []
    });
  }

  q({ id: 'eol-001', d: 1, t: 'numero', v: '2025',
    p: 'En 2025, ¿qué parte de la electricidad entregada a la red fue eólica?',
    o: ['Cerca de un tercio', 'Cerca de una décima parte', 'Cerca de la mitad', 'Cerca de tres cuartos'],
    e: 'Fue el 34 % de lo entregado a la red: la segunda fuente del país, solo detrás de la hidráulica.',
    f: ['miem-sin-2025'] });

  q({ id: 'eol-002', d: 1, t: 'numero',
    p: '¿Cuánta potencia eólica tiene instalada Uruguay?',
    o: ['Más de 1.500 MW', 'Cerca de 150 MW', 'Cerca de 3.500 MW', 'Cerca de 500 MW'],
    e: 'Los parques eólicos suman más de 1.500 MW, una parte muy importante de la potencia instalada del país.',
    f: ['uyxxi-2025'] });

  q({ id: 'eol-003', d: 2, t: 'numero',
    p: 'Aproximadamente, ¿cuántos parques eólicos funcionan en Uruguay?',
    o: ['Entre 40 y 45', 'Entre 10 y 15', 'Entre 20 y 25', 'Entre 60 y 65'],
    e: 'Hay más de 40 parques en funcionamiento: 41 según Uruguay XXI y 43 según otras fuentes.',
    f: ['uyxxi-2025', 'wiki-eolica-uy'], no: ['uru-009'] });

  q({ id: 'eol-004', d: 3, t: 'concepto',
    p: '¿Qué mide el «factor de capacidad» de un parque eólico?',
    o: ['Qué parte de su máximo posible produce en el año', 'Cuántos aerogeneradores caben en cada hectárea',
        'El peso máximo que aguanta una torre con viento fuerte', 'Cuánto cuesta producir cada kilovatio hora'],
    e: 'Si un parque produjera siempre a máxima potencia sería 100 %. En Uruguay suele superar el 35 %, un valor muy bueno.',
    f: ['wiki-eolica-uy'] });

  q({ id: 'eol-005', d: 2, t: 'dato',
    p: 'El parque eólico Artilleros (Colonia) lo hicieron UTE y una empresa estatal de otro país. ¿De cuál?',
    o: ['Brasil', 'España', 'China', 'Argentina'],
    e: 'Artilleros es de UTE y Eletrobras, de Brasil, al 50 % cada una: tiene 31 aerogeneradores y 65,1 MW.',
    f: ['artilleros-web'] });

  q({ id: 'eol-006', d: 2, t: 'dato',
    p: '¿Cuál fue el primer parque eólico propio de UTE, que empezó a producir en 2009?',
    o: ['Sierra de los Caracoles', 'Parque Eólico Valentines', 'Parque Eólico Arias', 'Juan Pablo Terra'],
    e: 'Está en Maldonado: sus primeros 5 aerogeneradores se montaron en 2008 y hoy tiene 10, con 20 MW en total.',
    f: ['ute-caracoles', 'fing-eolica'] });

  q({ id: 'eol-007', d: 1, t: 'concepto',
    p: '¿Qué instrumento mide la velocidad del viento en un aerogenerador?',
    o: ['Anemómetro', 'Barómetro', 'Pluviómetro', 'Higrómetro'],
    e: 'El anemómetro le avisa al controlador qué tan fuerte sopla el viento, para arrancar o frenar la máquina.',
    f: ['doe-turbina'] });

  q({ id: 'eol-008', d: 3, t: 'concepto',
    p: 'El rotor gira despacio. ¿Qué pieza acelera ese giro para el generador?',
    o: ['La caja multiplicadora, de engranajes', 'El transformador, que sube la tensión',
        'El inversor, que cambia el tipo de corriente', 'El freno, que regula la velocidad del rotor'],
    e: 'La caja multiplicadora convierte el giro lento y fuerte del rotor en un giro más rápido para el generador.',
    f: ['doe-turbina'] });

  q({ id: 'eol-009', d: 2, t: 'concepto',
    p: '¿De qué están hechas las palas de los aerogeneradores?',
    o: ['De fibra de vidrio o de carbono con resina', 'De acero macizo soldado en varias piezas',
        'De madera de pino tratada', 'De aluminio fundido en una sola pieza'],
    e: 'Son materiales compuestos: livianos, fuertes y flexibles. Reciclarlas es hoy uno de los grandes desafíos del sector.',
    f: ['doe-turbina', 'windeurope-circ'] });

  q({ id: 'eol-010', d: 1, t: 'concepto',
    p: '¿Cómo se llama el sistema que gira la góndola para enfrentar al viento?',
    o: ['Sistema de orientación (guiñada o yaw)', 'Sistema de frenado hidráulico',
        'Sistema de refrigeración del generador', 'Sistema de multiplicación de velocidad'],
    e: 'El mecanismo de yaw gira la góndola para que el rotor mire siempre hacia donde sopla el viento.',
    f: ['doe-turbina'] });

  q({ id: 'eol-011', d: 3, t: 'numero',
    p: '¿Desde qué velocidad de viento empiezan a generar los aerogeneradores?',
    o: ['Desde unos 3 m/s (casi 11 km/h)', 'Desde unos 15 m/s (54 km/h)', 'Desde unos 30 m/s (108 km/h)', 'Desde casi 0 m/s (sin nada de viento)'],
    e: 'Arrancan con unos 3 a 5 m/s; con menos viento no vale la pena girar. A esa velocidad se la llama «de conexión».',
    f: ['doe-turbina'] });

  q({ id: 'eol-012', d: 2, t: 'concepto',
    p: '¿Por qué se frenan los aerogeneradores cuando el viento es demasiado fuerte?',
    o: ['Para proteger las palas y la estructura', 'Para no sobrecargar la red cuando sobra electricidad',
        'Porque con tanto viento el generador deja de funcionar', 'Para que las palas no se calienten con el roce del aire'],
    e: 'Pasado cierto límite (unos 25 m/s) se detienen solos: aguantarían más viento, pero así se reduce el riesgo de daños.',
    f: ['doe-tormentas'] });

  q({ id: 'eol-013', d: 2, t: 'numero',
    p: '¿A qué altura suele estar el centro del rotor en los parques de Uruguay?',
    o: ['Entre 90 y 110 metros', 'Entre 10 y 20 metros', 'Entre 250 y 300 metros', 'Entre 30 y 40 metros'],
    e: 'En Artilleros mide 90 m y en otros parques llega a unos 108 m, para aprovechar vientos más fuertes y parejos.',
    f: ['artilleros-web', 'pluspetrol-parques'] });

  q({ id: 'eol-014', d: 2, t: 'lugar',
    p: 'El Parque Eólico Pampa, de 141,6 MW, ¿en qué departamento está?',
    o: ['Tacuarembó', 'Cerro Largo', 'Maldonado', 'Canelones'],
    e: 'Está sobre la ruta 5, a la altura del kilómetro 320, y tiene 59 aerogeneradores.',
    f: ['ute-pampa-inversores', 'gub-pampa'], no: ['eol-020'] });

  q({ id: 'eol-015', d: 2, t: 'concepto',
    p: '¿Qué hace de Uruguay un buen lugar para los parques eólicos?',
    o: ['Un terreno llano, con mucho viento y sin montañas', 'Muchos volcanes que producen corrientes de aire constantes',
        'Vientos huracanados que soplan todo el año en la costa', 'Grandes cordilleras que concentran el viento fuerte en los valles'],
    e: 'El relieve llano deja que el viento fluya parejo, y el país cuenta con un nivel de viento abundante.',
    f: ['wiki-eolica-uy', 'fing-eolica'] });

  q({ id: 'eol-016', d: 3, t: 'concepto',
    p: '¿Qué es el «efecto estela» en un parque eólico?',
    o: ['Los de atrás reciben viento más lento y turbulento', 'Las palas proyectan una sombra que parpadea',
        'Un zumbido que se escucha cerca de las torres', 'Un brillo en las torres que se ve de noche'],
    e: 'Cada aerogenerador le saca energía al viento: los que quedan detrás reciben un viento más lento y turbulento. Por eso se los separa.',
    f: ['springer-estelas'] });

  q({ id: 'eol-017', d: 1, t: 'concepto',
    p: '¿Qué es la energía eólica «offshore»?',
    o: ['La que se produce con aerogeneradores instalados en el mar', 'La que se produce con molinos dentro de las ciudades y los pueblos',
        'La que se guarda en baterías cerca de la costa', 'La que se produce con aerogeneradores en las sierras más altas'],
    e: 'En inglés «offshore» quiere decir «mar adentro»: allí suele soplar más viento y más parejo. Uruguay estudia su potencial a futuro.',
    f: ['uyxxi-2025'] });

  q({ id: 'eol-018', d: 3, t: 'numero',
    p: '¿Qué parte de un aerogenerador se puede reciclar al final de su vida útil?',
    o: ['Hasta el 90 % de su masa', 'Menos del 10 % de su masa', 'Cerca del 30 % de su masa', 'Cerca del 60 % de su masa'],
    e: 'Casi toda la torre, el cobre y los metales se reciclan bien. El desafío son las palas, de materiales compuestos.',
    f: ['windeurope-circ'] });

  q({ id: 'eol-019', d: 2, t: 'concepto',
    p: '¿Cómo se complementan el viento y las represas en Uruguay?',
    o: ['Cuando sopla mucho viento, las represas guardan agua', 'Cuando sopla viento, las represas usan más agua',
        'Los parques eólicos producen el agua de los lagos', 'Las represas mueven los molinos con el agua que sueltan'],
    e: 'Si hay mucho viento, las represas pueden generar menos y ahorran agua para cuando el viento afloje.',
    f: ['fing-eolica'] });

  q({ id: 'eol-020', d: 3, t: 'dato',
    p: '¿Qué compraron los ahorristas para ser socios del Parque Eólico Pampa?',
    o: ['Certificados de participación de un fideicomiso', 'Acciones de UTE que cotizan en bolsa',
        'Bonos del Estado uruguayo a diez años', 'Paneles solares para instalar en sus casas'],
    e: 'Unos 4.000 ahorristas compraron certificados del Fideicomiso Pampa en la Bolsa de Valores de Montevideo.',
    f: ['ute-pampa-inversores'], no: ['eol-014'] });
})(typeof globalThis !== 'undefined' ? globalThis : this);
