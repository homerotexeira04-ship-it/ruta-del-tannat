/* Preguntas de la estación Hidráulica. Autoría: la opción correcta se escribe primero (c: 0); el juego mezcla las opciones en cada partida.
   d = dificultad (1 fácil, 2 media, 3 difícil) · v = vigencia del dato · no = no sortear junto con esas preguntas (una regala la respuesta de la otra). */
(function (g) {
  'use strict';
  var P = g.RE.datos.preguntas;
  function q(o) {
    P.push({
      id: o.id, estacion: 'hidraulica', dificultad: o.d, tipo: o.t, pregunta: o.p, opciones: o.o, correcta: 0,
      explicacion: o.e, fuente: o.f, vigencia: o.v || null, noJuntarCon: o.no || []
    });
  }

  q({ id: 'hid-001', d: 1, t: 'dato',
    p: '¿Cuántas grandes centrales hidroeléctricas tiene Uruguay?',
    o: ['Cuatro', 'Dos', 'Seis', 'Nueve'],
    e: 'Son cuatro: tres forman una cascada en un mismo río del interior y la cuarta es binacional.',
    f: ['ute-bonete', 'ctm-ficha'], no: ['hid-002', 'hid-003'] });

  q({ id: 'hid-002', d: 1, t: 'lugar',
    p: '¿Sobre qué río están las represas de Rincón del Bonete, Baygorria y Palmar?',
    o: ['Río Negro', 'Río Uruguay', 'Río Santa Lucía', 'Río Yí'],
    e: 'Forman una cascada: Bonete regula el agua que después usan Baygorria y Palmar, río abajo.',
    f: ['prodnac-despacho', 'ute-constitucion'], no: ['hid-001', 'hid-011', 'hid-012'] });

  q({ id: 'hid-003', d: 1, t: 'dato',
    p: '¿Con qué país comparte Uruguay la represa de Salto Grande?',
    o: ['Argentina', 'Brasil', 'Paraguay', 'Chile'],
    e: 'Es binacional: Uruguay y Argentina la operan juntos sobre el río Uruguay y entre las dos suman 1.890 MW.',
    f: ['ctm-ficha', 'salto-turismo'], no: ['hid-001'] });

  q({ id: 'hid-004', d: 3, t: 'numero', v: '2025',
    p: 'En 2025, ¿qué parte de la electricidad entregada a la red nacional vino de las represas?',
    o: ['Un 46 %', 'Un 25 %', 'Un 66 %', 'Un 85 %'],
    e: 'Fue el 46 % de los 13.040 GWh entregados a la red. Si se cuenta toda la generación del país, baja al 38 %.',
    f: ['miem-sin-2025', 'bep-2025'] });

  q({ id: 'hid-005', d: 2, t: 'concepto',
    p: '¿Para qué sirven las esclusas de peces de Salto Grande?',
    o: ['Para que los peces puedan subir el río y pasar la represa', 'Para criar peces y repoblar el embalse cada año',
        'Para contar los peces que pasan y anotarlos en un registro', 'Para enfriar el agua que sale de las turbinas'],
    e: 'Son dos escalas tipo Borland con esclusas automáticas: los peces entran, suben con el agua y siguen su migración.',
    f: ['ctm-caract'] });

  q({ id: 'hid-006', d: 3, t: 'numero',
    p: '¿En qué año se inauguró Rincón del Bonete, la primera gran obra hidroeléctrica del país?',
    o: ['1945', '1925', '1960', '1979'],
    e: 'Se inauguró el 26 de diciembre de 1945. Durante décadas fue la principal fuente renovable de electricidad, hasta que llegó Salto Grande.',
    f: ['ute-bonete'], no: ['hid-012', 'hid-007'] });

  q({ id: 'hid-007', d: 2, t: 'lugar',
    p: '¿Cuál es el lago artificial más grande de Uruguay?',
    o: ['Rincón del Bonete', 'Rincón de Baygorria', 'Salto Grande', 'Palmar (Constitución)'],
    e: 'El de Rincón del Bonete tiene unos 1.240 km² y 8.800 hm³; el de Salto Grande, 783 km² y 5.000 hm³.',
    f: ['wiki-bonete-lago', 'ctm-ficha'] });

  q({ id: 'hid-008', d: 2, t: 'concepto',
    p: '¿Qué tipo de turbinas usa la represa de Salto Grande?',
    o: ['Kaplan', 'Pelton', 'Francis', 'Savonius'],
    e: 'Tiene 14 turbinas Kaplan de 135 MW cada una, pensadas para mucho caudal de agua y poca altura de caída.',
    f: ['ctm-ficha'], no: ['hid-019'] });

  q({ id: 'hid-009', d: 2, t: 'concepto',
    p: '¿Para qué sirve el vertedero de una represa?',
    o: ['Para dejar pasar el agua sobrante cuando el río crece', 'Para que los barcos puedan cruzar de un lado al otro del río',
        'Para sacar la arena y el barro que trae el río hasta el embalse', 'Para guardar agua extra y generar más en verano'],
    e: 'Cuando entra más agua de la que usan las turbinas, el vertedero la deja pasar con control. El de Salto Grande mide 361 m.',
    f: ['ctm-caract'] });

  q({ id: 'hid-010', d: 1, t: 'concepto',
    p: '¿Qué parte de la central transforma el giro de la turbina en electricidad?',
    o: ['El generador', 'El transformador', 'El vertedero', 'La compuerta'],
    e: 'El generador va unido al eje de la turbina: cuando esta gira, produce la corriente eléctrica.',
    f: ['wiki-central-hidro'] });

  q({ id: 'hid-011', d: 2, t: 'lugar',
    p: 'La central de Palmar (Constitución) está sobre el río Negro. ¿En qué departamento?',
    o: ['Soriano', 'Salto', 'Tacuarembó', 'Rocha'],
    e: 'Está en el paraje Palmar, en Soriano. Es el tercer escalón del río y el de mayor potencia: 333 MVA.',
    f: ['ute-constitucion'], no: ['hid-002'] });

  q({ id: 'hid-012', d: 3, t: 'numero',
    p: '¿En qué año se inauguró Baygorria, la segunda central del río Negro?',
    o: ['1960', '1945', '1982', '1979'],
    e: 'Se inauguró el 8 de julio de 1960. Tiene tres turbinas y 108 MW de potencia.',
    f: ['ute-baygorria'], no: ['hid-006', 'hid-002'] });

  q({ id: 'hid-013', d: 3, t: 'numero',
    p: 'Sumadas, las tres centrales del río Negro dan como máximo…',
    o: ['Unos 600 MW', 'Unos 300 MW', 'Unos 1.900 MW', 'Unos 1.000 MW'],
    e: 'Bonete, Baygorria y Palmar aportan hasta 593 MW. Salto Grande, la binacional, suma 1.890 MW.',
    f: ['ute-bonete', 'ctm-ficha'], no: ['hid-003'] });

  q({ id: 'hid-014', d: 2, t: 'concepto',
    p: 'En un año muy seco, ¿qué pasa con la electricidad de Uruguay?',
    o: ['Las represas generan menos y otras fuentes compensan', 'Las represas generan más porque el agua baja con más fuerza y más caudal',
        'Los paneles solares se apagan hasta que vuelve la lluvia', 'Se corta la luz algunas horas por día en todo el país'],
    e: 'En 2023, con una de las peores sequías, la hidráulica cayó y lo renovable bajó al 92 %: hubo más térmica e importación.',
    f: ['uyxxi-2025'], no: ['uru-020'] });

  q({ id: 'hid-015', d: 1, t: 'lugar',
    p: '¿A qué distancia de la ciudad de Salto queda la represa de Salto Grande?',
    o: ['Unos 13 km', 'Unos 30 km', 'Unos 60 km', 'Unos 5 km'],
    e: 'Está 13 km al norte de la ciudad, por la avenida Luis Batlle Berres (ex ruta 3), en el kilómetro 508.',
    f: ['salto-turismo'] });

  q({ id: 'hid-016', d: 2, t: 'concepto',
    p: '¿Por qué se dice que un embalse es como una «batería de agua»?',
    o: ['Guarda agua para generar cuando se necesita', 'Produce corriente continua como las pilas',
        'Su agua se calienta al sol y se vuelve eléctrica', 'Cada represa tiene una batería de litio gigante'],
    e: 'El agua guardada se suelta cuando sube la demanda. Bonete, por ejemplo, regula el caudal de las represas río abajo.',
    f: ['prodnac-despacho'] });

  q({ id: 'hid-017', d: 1, t: 'dato',
    p: '¿Qué empresa pública opera las represas del río Negro?',
    o: ['UTE', 'ANCAP', 'OSE', 'ANTEL'],
    e: 'UTE, la Administración Nacional de Usinas y Trasmisiones Eléctricas, opera Bonete, Baygorria y Palmar.',
    f: ['ute-baygorria'], no: ['uru-011'] });

  q({ id: 'hid-018', d: 3, t: 'historia',
    p: 'La usina de Cuñapirú, en Rivera, funcionó desde 1882. ¿Por qué es famosa?',
    o: ['Se la considera la primera hidroeléctrica de Sudamérica', 'Fue la primera represa compartida entre dos países del continente',
        'Fue la central más grande de todo el continente en su época', 'Fue la primera en usar turbinas modernas'],
    e: 'Se construyó para dar energía a la explotación del oro cerca de Minas de Corrales; hoy son ruinas históricas.',
    f: ['wiki-cunapiru'], no: ['hid-006'] });

  q({ id: 'hid-019', d: 2, t: 'numero',
    p: '¿Qué altura de caída de agua usa Salto Grande para generar?',
    o: ['Unos 25 metros', 'Unos 5 metros', 'Unos 60 metros', 'Unos 150 metros'],
    e: 'Su salto es de 25,3 m: una altura moderada, pero con muchísimo caudal de agua.',
    f: ['ctm-ficha'], no: ['hid-008'] });

  q({ id: 'hid-020', d: 3, t: 'dato',
    p: '¿Quién decide, momento a momento, qué centrales generan para que la electricidad salga lo más barata posible?',
    o: ['ADME', 'URSEA', 'LATU', 'INIA'],
    e: 'ADME administra el mercado mayorista y opera el Despacho Nacional de Cargas, que abastece la demanda de la forma más económica.',
    f: ['adme-mision', 'prodnac-despacho'], no: ['uru-014'] });
})(typeof globalThis !== 'undefined' ? globalThis : this);
