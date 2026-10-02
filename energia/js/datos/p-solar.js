/* Preguntas de la estación Solar. Misma convención que p-hidraulica.js. */
(function (g) {
  'use strict';
  var P = g.RE.datos.preguntas;
  function q(o) {
    P.push({
      id: o.id, estacion: 'solar', dificultad: o.d, tipo: o.t, pregunta: o.p, opciones: o.o, correcta: 0,
      explicacion: o.e, fuente: o.f, vigencia: o.v || null, noJuntarCon: o.no || []
    });
  }

  q({ id: 'sol-001', d: 2, t: 'dato',
    p: '¿Cómo se llama la primera planta solar fotovoltaica conectada a la red en Uruguay, inaugurada en Salto en 2013?',
    o: ['Asahi', 'La Jacinta', 'El Naranjal', 'Melo'],
    e: 'Asahi, que en japonés quiere decir «sol de la mañana», se inauguró el 15 de marzo de 2013 con una donación de Japón.',
    f: ['auci-asahi'], no: ['sol-003'] });

  q({ id: 'sol-002', d: 2, t: 'numero', v: '2025',
    p: 'En 2025, ¿qué parte de la electricidad entregada a la red fue solar?',
    o: ['Cerca del 4 %', 'Cerca del 40 %', 'Cerca del 14 %', 'Menos del 1 %'],
    e: 'Fue el 4 %, un máximo anual para la solar, que viene creciendo año tras año.',
    f: ['miem-sin-2025', 'pvmag-2025'] });

  q({ id: 'sol-003', d: 1, t: 'lugar',
    p: '¿En qué departamento está La Jacinta, una de las plantas solares más grandes del país?',
    o: ['Salto', 'Colonia', 'Rocha', 'Florida'],
    e: 'La Jacinta tiene unos 50 MW de potencia. Cerca de allí está también El Naranjal.',
    f: ['uyxxi-2025'], no: ['sol-001'] });

  q({ id: 'sol-004', d: 3, t: 'numero', v: '2026',
    p: 'El parque solar que UTE construye en Melo (Cerro Largo) tendrá unos…',
    o: ['140.000 paneles', '40.000 paneles', '400.000 paneles', '1.400.000 paneles'],
    e: 'Tendrá unos 140.000 paneles con seguidores y 100 MWp de potencia: abastecerá hasta a 65.000 hogares.',
    f: ['ute-melo'] });

  q({ id: 'sol-005', d: 2, t: 'concepto',
    p: 'La energía solar solo produce de día. ¿Cómo se cubre la electricidad de la noche en Uruguay?',
    o: ['Con otras fuentes: agua, viento y biomasa', 'Con baterías gigantes instaladas en cada ciudad',
        'Importando casi toda la electricidad de noche', 'Los paneles guardan sol para usarlo de noche'],
    e: 'Las represas, el viento y la biomasa siguen generando de noche. Las baterías recién empiezan a incorporarse al sistema.',
    f: ['uyxxi-2025'] });

  q({ id: 'sol-006', d: 1, t: 'concepto',
    p: '¿Qué tipo de corriente producen las celdas de un panel solar?',
    o: ['Corriente continua', 'Corriente alterna', 'Corriente trifásica', 'Corriente estática'],
    e: 'Las celdas producen corriente continua (CC). Para llevarla a la red hay que convertirla.',
    f: ['doe-pv101'], no: ['sol-007'] });

  q({ id: 'sol-007', d: 1, t: 'concepto',
    p: '¿Qué equipo convierte la corriente continua de los paneles en corriente alterna?',
    o: ['El inversor', 'El transformador', 'El rectificador', 'El generador'],
    e: 'El inversor entrega electricidad alterna de 50 Hz, igual que la de la red de Uruguay.',
    f: ['doe-pv101', 'uyxxi-2025'], no: ['sol-006'] });

  q({ id: 'sol-008', d: 1, t: 'concepto',
    p: '¿De qué material semiconductor están hechas casi todas las celdas solares?',
    o: ['Silicio', 'Germanio', 'Cobre', 'Litio'],
    e: 'El silicio es el semiconductor principal de las celdas solares y es un elemento muy abundante.',
    f: ['doe-pv101'] });

  q({ id: 'sol-009', d: 2, t: 'concepto',
    p: '¿Para qué sirve un seguidor solar (tracker)?',
    o: ['Para girar los paneles y seguir al sol', 'Para medir cuánta electricidad producen los paneles',
        'Para limpiar los paneles sin usar agua', 'Para guardar la energía del día en baterías'],
    e: 'Orienta los paneles de este a oeste siguiendo al sol; según el tipo, produce entre 10 % y 45 % más que uno fijo.',
    f: ['wiki-seguidor'] });

  q({ id: 'sol-010', d: 2, t: 'lugar',
    p: '¿En qué zona del país llega, en promedio, un poco más de radiación solar?',
    o: ['El noroeste: Artigas, Salto y Paysandú', 'La costa atlántica: Rocha y Maldonado', 'El sur: Montevideo y Canelones', 'El centro: Durazno y Florida'],
    e: 'El norte recibe algo más de radiación que el sur y la costa este, pero en todo el país la diferencia es chica.',
    f: ['mapa-solar'], no: ['sol-018'] });

  q({ id: 'sol-011', d: 2, t: 'concepto',
    p: '¿Qué diferencia hay entre la energía solar fotovoltaica y la solar térmica?',
    o: ['La fotovoltaica produce electricidad; la térmica calienta agua', 'La fotovoltaica calienta agua; la térmica produce electricidad',
        'La fotovoltaica funciona de día y la térmica solo de noche', 'La fotovoltaica necesita viento y la térmica necesita lluvia'],
    e: 'La fotovoltaica convierte la luz en electricidad. La térmica usa el calor del sol, por ejemplo, para calentar agua.',
    f: ['miem-solar'], no: ['sol-012'] });

  q({ id: 'sol-012', d: 3, t: 'dato',
    p: 'La Ley 18.585 obliga a instalar sistemas solares térmicos en las construcciones nuevas de…',
    o: ['Hoteles, clubes, centros de salud y edificios públicos', 'Casas particulares de más de dos pisos de altura',
        'Fábricas, frigoríficos y aserraderos de la zona', 'Cualquier vivienda nueva que se construya en todo el país'],
    e: 'La ley, de 2009, exige sistemas solares térmicos para calentar agua en esos edificios nuevos o refaccionados.',
    f: ['miem-solar', 'parlamento-18585'], no: ['sol-011'] });

  q({ id: 'sol-013', d: 3, t: 'concepto',
    p: '¿Qué significa «Wp» o «vatio pico» en un panel solar?',
    o: ['La potencia máxima en condiciones de laboratorio', 'El peso máximo que soporta el panel con viento fuerte',
        'La potencia que entrega en la hora de más demanda', 'La cantidad de paneles que caben en un techo'],
    e: 'Es la potencia que da con 1.000 W de luz por m² y 25 °C en la celda; sirve para comparar paneles.',
    f: ['wiki-panel-fv'] });

  q({ id: 'sol-014', d: 2, t: 'concepto',
    p: '¿Qué permite la microgeneración en Uruguay?',
    o: ['Generar electricidad propia y entregar a la red el excedente', 'Desconectarse por completo de la red eléctrica de UTE',
        'Venderles la energía directamente a los vecinos de la cuadra', 'Que UTE instale paneles gratis en los techos de las casas'],
    e: 'Hogares y comercios pueden instalar paneles u otra fuente renovable (hasta 150 kW); un medidor registra lo que consumen y lo que inyectan.',
    f: ['ute-microgeneracion', 'miem-solar'], no: ['sol-015'] });

  q({ id: 'sol-015', d: 3, t: 'numero', v: '2025',
    p: '¿Cuántas plantas solares de gran escala entregan electricidad a la red en Uruguay?',
    o: ['Unas 19', 'Unas 5', 'Unas 40', 'Unas 90'],
    e: 'Hay 19 plantas grandes, que suman unos 264 MW, y más de 1.700 instalaciones pequeñas conectadas a la red.',
    f: ['uyxxi-2025'], no: ['sol-014'] });

  q({ id: 'sol-016', d: 2, t: 'numero',
    p: '¿Cuántos años rinden bien los paneles solares modernos?',
    o: ['Entre 25 y 30 años', 'Entre 5 y 8 años', 'Entre 10 y 12 años', 'Entre 50 y 60 años'],
    e: 'Suelen garantizarse por unos 25 años y pierden cerca de 0,5 % de rendimiento por año.',
    f: ['pvmag-vida-util'] });

  q({ id: 'sol-017', d: 2, t: 'concepto',
    p: 'Si la sombra de un árbol tapa una parte de un panel, ¿qué pasa?',
    o: ['La producción baja mucho más de lo que se ve sombreado', 'Solo se apaga la parte sombreada y el resto sigue igual',
        'Sube la producción porque hay menos calor', 'El panel guarda la sombra y la usa de noche'],
    e: 'Las celdas están conectadas en serie: una celda a la sombra frena la corriente de todas las demás.',
    f: ['frontiers-sombra', 'wiki-panel-fv'] });

  q({ id: 'sol-018', d: 2, t: 'concepto',
    p: 'En Uruguay, ¿hacia dónde y con qué inclinación conviene fijar un panel solar?',
    o: ['Hacia el norte, con unos 30° a 35°', 'Hacia el sur, con unos 30° a 35°', 'Hacia el norte, parado a 90°', 'Hacia el este, acostado a 0°'],
    e: 'En el hemisferio sur el sol pasa por el norte; la inclinación ideal se acerca a la latitud del lugar (30° a 35°).',
    f: ['wiki-panel-fv', 'mapa-solar'] });

  q({ id: 'sol-019', d: 3, t: 'historia',
    p: '¿Quién observó por primera vez el efecto fotovoltaico, en 1839?',
    o: ['Edmond Becquerel', 'Albert Einstein', 'Thomas Edison', 'Nikola Tesla'],
    e: 'Becquerel, un físico francés de 19 años, vio que la luz generaba corriente. La primera celda solar práctica llegó en 1954.',
    f: ['wiki-celula-fe'] });

  q({ id: 'sol-020', d: 3, t: 'concepto',
    p: '¿Qué le pasa al rendimiento de un panel solar cuando se calienta mucho?',
    o: ['Baja un poco con cada grado de más', 'Sube: el calor le da más energía a los electrones',
        'No cambia: solo importa la cantidad de luz', 'Se corta: se apaga hasta que se enfría'],
    e: 'El rendimiento cae cuando sube la temperatura de las celdas; por eso conviene que los paneles se ventilen bien.',
    f: ['wiki-panel-fv'] });
})(typeof globalThis !== 'undefined' ? globalThis : this);
