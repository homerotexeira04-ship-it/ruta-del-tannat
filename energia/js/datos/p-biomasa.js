/* Preguntas de la estación Biomasa. Misma convención que p-hidraulica.js. */
(function (g) {
  'use strict';
  var P = g.RE.datos.preguntas;
  function q(o) {
    P.push({
      id: o.id, estacion: 'biomasa', dificultad: o.d, tipo: o.t, pregunta: o.p, opciones: o.o, correcta: 0,
      explicacion: o.e, fuente: o.f, vigencia: o.v || null, noJuntarCon: o.no || []
    });
  }

  q({ id: 'bio-001', d: 1, t: 'concepto',
    p: '¿Con qué se produce, sobre todo, la electricidad de biomasa en Uruguay?',
    o: ['Con restos de madera y de cultivos', 'Con carbón mineral que llega en barco', 'Con plásticos separados de la basura', 'Con petróleo refinado en el país'],
    e: 'Los restos de la industria forestal y de algunos cultivos son la materia prima más usada para generar electricidad con biomasa.',
    f: ['uyxxi-2025'] });

  q({ id: 'bio-002', d: 2, t: 'numero',
    p: '¿En qué año empezó a funcionar la planta de celulosa de Fray Bentos, hoy de UPM?',
    o: ['2007', '1997', '2015', '2023'],
    e: 'Empezó en 2007, con el nombre de Botnia. Genera parte de su propia electricidad y vende excedentes a la red.',
    f: ['miem-upm1'] });

  q({ id: 'bio-003', d: 3, t: 'lugar',
    p: '¿Dónde está el complejo de celulosa y energía de Montes del Plata, de 180 MW?',
    o: ['Punta Pereira, en Colonia', 'Fray Bentos, en Río Negro', 'Pueblo Centenario, en Durazno', 'Bella Unión, en Artigas'],
    e: 'Genera 180 MW con restos de madera y de la propia fábrica; el excedente, unos 80 MW, se comercializa.',
    f: ['miem-montes'], no: ['sol-014'] });

  q({ id: 'bio-004', d: 3, t: 'numero', v: '2025',
    p: 'En 2025, ¿qué lugar ocupó la biomasa entre las fuentes que entregaron electricidad a la red?',
    o: ['Tercero, detrás de la hidráulica y la eólica', 'Primero, por delante de la hidráulica y de la eólica', 'Segundo, por delante de la eólica y de la solar', 'Cuarto, por detrás de la solar'],
    e: 'Aportó el 14 % de lo entregado a la red. Contando toda la generación del país sube al 28 %, casi como la eólica.',
    f: ['miem-sin-2025', 'bep-2025'] });

  q({ id: 'bio-005', d: 3, t: 'concepto',
    p: '¿Por qué se dice que quemar biomasa casi no suma CO₂ al ambiente?',
    o: ['Porque ese CO₂ lo absorbieron las plantas al crecer', 'Porque el humo se filtra y se guarda bajo tierra en el suelo',
        'Porque al quemarse la madera no libera CO₂', 'Porque se compensa con el CO₂ de los autos'],
    e: 'Los árboles absorben CO₂ mientras crecen y al quemarse devuelven ese mismo carbono. Es casi neutro si se replanta lo que se usa.',
    f: ['idae-biomasa'] });

  q({ id: 'bio-006', d: 2, t: 'concepto',
    p: '¿Qué es la cogeneración?',
    o: ['Producir electricidad y calor con un combustible', 'Generar electricidad con dos fuentes distintas a la vez',
        'Compartir una misma central entre dos países vecinos', 'Usar dos turbinas gemelas en una misma represa'],
    e: 'La fábrica usa el vapor de la caldera para producir electricidad y después lo aprovecha en sus procesos.',
    f: ['idae-cogeneracion', 'miem-montes'] });

  q({ id: 'bio-007', d: 3, t: 'concepto',
    p: '¿Qué es el «licor negro» de las fábricas de celulosa?',
    o: ['Un líquido con restos de madera que se quema', 'Un petróleo pesado que se importa para las calderas',
        'Un residuo contaminante que se vierte al río', 'Un aceite vegetal que usan los camiones de la planta'],
    e: 'Sale al cocinar la madera para hacer celulosa y contiene lignina. Se quema en una caldera para recuperar químicos y generar energía.',
    f: ['miem-upm1'] });

  q({ id: 'bio-008', d: 2, t: 'dato',
    p: 'En Treinta y Tres, la planta de Galofer genera electricidad quemando…',
    o: ['Cáscara de arroz', 'Bagazo de caña', 'Basura urbana', 'Neumáticos usados'],
    e: 'Galofer, en Villa Sara, produce 14 MW con la cáscara de arroz de las arroceras de la zona.',
    f: ['miem-galofer'] });

  q({ id: 'bio-009', d: 2, t: 'lugar',
    p: '¿En qué departamento está la planta de celulosa UPM Paso de los Toros?',
    o: ['Durazno', 'Río Negro', 'Tacuarembó', 'Colonia'],
    e: 'Está en Durazno, sobre el río Negro, 12 km al sur de Paso de los Toros. Empezó a operar en abril de 2023.',
    f: ['upm-pdlt'], no: ['bio-020'] });

  q({ id: 'bio-010', d: 1, t: 'concepto',
    p: '¿Qué es el biogás?',
    o: ['Un gas que sale de residuos en descomposición', 'Un gas que se extrae de pozos de petróleo y llega en barcos',
        'El vapor de agua que sale de las calderas', 'Aire comprimido que se usa para mover turbinas'],
    e: 'Se forma cuando bacterias descomponen residuos sin oxígeno y tiene mucho metano, que se puede quemar para generar electricidad.',
    f: ['idae-digestores'], no: ['bio-019', 'bio-011'] });

  q({ id: 'bio-011', d: 2, t: 'dato',
    p: 'En el relleno sanitario de Las Rosas (Maldonado), ¿qué se hace con el biogás de la basura?',
    o: ['Se quema en motores para generar electricidad', 'Se envasa en garrafas para usar en las cocinas',
        'Se inyecta bajo tierra para sellar el relleno', 'Se convierte en agua potable para el barrio'],
    e: 'Los motores de la planta generan electricidad que se vuelca a la red de UTE; es el único relleno del país que lo hace.',
    f: ['lasrosas-prensa'], no: ['bio-010', 'bio-019'] });

  q({ id: 'bio-012', d: 2, t: 'dato',
    p: '¿Qué produce ALUR en su complejo de Bella Unión (Artigas)?',
    o: ['Azúcar, etanol y electricidad con caña', 'Celulosa y papel a partir de eucalipto', 'Cemento y cal a partir de piedra caliza', 'Harina de pescado y biogás de residuos'],
    e: 'ALUR muele caña para hacer azúcar y etanol (que se mezcla con nafta) y usa los restos de la caña para generar electricidad.',
    f: ['alur-bu'], no: ['bio-018'] });

  q({ id: 'bio-013', d: 2, t: 'concepto',
    p: '¿Qué ventaja tiene la biomasa frente al viento y al sol?',
    o: ['Se guarda el combustible y se genera cuando hace falta', 'No necesita ningún combustible para funcionar bien',
        'Produce más electricidad por cada hectárea de campo', 'No deja ningún residuo después de funcionar'],
    e: 'Es energía «firme»: se puede acopiar y usar a pedido, a diferencia del viento y el sol, que varían durante el día.',
    f: ['uyxxi-2025'] });

  q({ id: 'bio-014', d: 3, t: 'concepto',
    p: '¿Para qué se pueden usar las cenizas que deja la madera quemada en una caldera?',
    o: ['Como fertilizante o corrector de suelos', 'Como material para hacer paneles solares', 'Como combustible para volver a quemar', 'Como relleno para las represas'],
    e: 'Tienen calcio, potasio y magnesio: sirven para corregir suelos ácidos y fertilizar, siempre que se controle su composición.',
    f: ['mapa-cenizas'] });

  q({ id: 'bio-015', d: 2, t: 'numero', v: '2025',
    p: '¿Qué parte de toda la energía que abastece al país, no solo la electricidad, viene de la biomasa?',
    o: ['Cerca de la mitad', 'Cerca de un décimo', 'Cerca de un cuarto', 'Cerca de tres cuartos'],
    e: 'En 2024 fue cerca de la mitad: es la principal fuente de energía del país, sobre todo por el uso de la industria.',
    f: ['uyxxi-2025'] });

  q({ id: 'bio-016', d: 1, t: 'dato',
    p: '¿Qué árbol ocupa la mayor parte de los bosques plantados de Uruguay?',
    o: ['El eucalipto', 'El pino', 'El ceibo', 'El sauce'],
    e: 'Los eucaliptos ocupan cerca del 80 % de la superficie forestada (más de 900.000 hectáreas); los pinos, unas 131.000.',
    f: ['mgap-forestal'] });

  q({ id: 'bio-017', d: 1, t: 'concepto',
    p: '¿Qué pieza de una central de biomasa convierte el vapor a presión en giro para el generador?',
    o: ['La turbina de vapor', 'El inversor solar', 'El anemómetro', 'La compuerta de admisión'],
    e: 'El agua se evapora en la caldera; el vapor a presión mueve los álabes de la turbina y esta mueve el generador.',
    f: ['miem-montes'] });

  q({ id: 'bio-018', d: 2, t: 'concepto',
    p: '¿Qué es el bagazo de la caña de azúcar?',
    o: ['La fibra que queda al moler la caña', 'El jugo dulce que se convierte en azúcar',
        'Un fertilizante hecho con las hojas de la caña', 'El alcohol que se mezcla con la nafta'],
    e: 'Es la fibra que sobra tras exprimir la caña. Se quema en calderas para generar vapor y electricidad.',
    f: ['alur-bu'], no: ['bio-012'] });

  q({ id: 'bio-019', d: 3, t: 'concepto',
    p: '¿Qué es la «digestión anaeróbica» en una planta de biogás?',
    o: ['Bacterias que descomponen residuos sin oxígeno', 'Quemar residuos con muy poco oxígeno',
        'Secar los residuos al sol durante varios días antes de quemarlos', 'Filtrar el agua que sale de los residuos'],
    e: 'En un biodigestor cerrado, microorganismos descomponen residuos orgánicos sin oxígeno y liberan biogás.',
    f: ['idae-digestores'], no: ['bio-010', 'bio-011'] });

  q({ id: 'bio-020', d: 3, t: 'numero', v: '2025',
    p: '¿Cuánta energía firme entrega a la red la nueva planta de UPM sobre el río Negro?',
    o: ['Más de 150 MW', 'Unos 15 MW', 'Unos 600 MW', 'Unos 30 MW'],
    e: 'Entrega más de 150 MW de energía firme y renovable, unos 1,3 TWh por año, que se vuelcan a la red de UTE.',
    f: ['upm-pdlt', 'uyxxi-2025'], no: ['bio-009'] });
})(typeof globalThis !== 'undefined' ? globalThis : this);
