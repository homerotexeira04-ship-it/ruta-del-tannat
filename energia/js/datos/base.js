/* Ruta de la Energía Uruguay: datos base (estaciones, lugares del desafío final y matriz eléctrica).
   Las preguntas están en p-*.js y las fuentes en fuentes.js. Todo se valida con `npm run check`. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});

  RE.datos = {
    version: '1.0.0',
    revision: '2026-10-02',

    // Las cinco estaciones del recorrido. La introducción no debe adelantar respuestas de las preguntas.
    estaciones: [
      {
        clave: 'hidraulica', nombre: 'Hidráulica',
        intro: 'La hidráulica aprovecha la fuerza de los grandes ríos: el agua que cae mueve turbinas y genera electricidad para millones de hogares.'
      },
      {
        clave: 'eolica', nombre: 'Eólica',
        intro: 'Cientos de aerogeneradores se integran al paisaje uruguayo y aprovechan el viento de nuestras llanuras para producir electricidad.'
      },
      {
        clave: 'solar', nombre: 'Solar',
        intro: 'El sol complementa la matriz uruguaya, desde grandes plantas fotovoltaicas en el norte hasta paneles en techos de casas y comercios.'
      },
      {
        clave: 'biomasa', nombre: 'Biomasa',
        intro: 'Restos de madera y de cultivos, y hasta la basura, se convierten en electricidad firme y renovable.'
      },
      {
        clave: 'uruguay', nombre: 'Uruguay',
        intro: 'Uruguay es referente mundial por su matriz eléctrica casi 100 % renovable. Repasemos los grandes logros del país y de Energimundo.'
      }
    ],

    // Desafío final: unir cada lugar con su departamento. En cada partida se sortean lugares con departamentos distintos.
    lugares: [
      { id: 'salto-grande', lugar: 'Represa de Salto Grande', depto: 'Salto', energia: 'hidraulica', fuente: 'ctm-ficha' },
      { id: 'palmar', lugar: 'Central hidroeléctrica de Palmar', depto: 'Soriano', energia: 'hidraulica', fuente: 'ute-constitucion' },
      { id: 'cunapiru', lugar: 'Usina histórica de Cuñapirú', depto: 'Rivera', energia: 'hidraulica', fuente: 'wiki-cunapiru' },
      { id: 'artilleros', lugar: 'Parque eólico Artilleros', depto: 'Colonia', energia: 'eolica', fuente: 'artilleros-web' },
      { id: 'caracoles', lugar: 'Parque eólico Sierra de los Caracoles', depto: 'Maldonado', energia: 'eolica', fuente: 'ute-caracoles' },
      { id: 'pampa', lugar: 'Parque eólico Pampa', depto: 'Tacuarembó', energia: 'eolica', fuente: 'gub-pampa' },
      { id: 'melo', lugar: 'Parque solar de UTE en Melo', depto: 'Cerro Largo', energia: 'solar', fuente: 'ute-melo' },
      { id: 'paso-de-los-toros', lugar: 'Planta de celulosa UPM Paso de los Toros', depto: 'Durazno', energia: 'biomasa', fuente: 'upm-pdlt' },
      { id: 'fray-bentos', lugar: 'Planta de celulosa UPM de Fray Bentos', depto: 'Río Negro', energia: 'biomasa', fuente: 'miem-upm1' },
      { id: 'galofer', lugar: 'Planta Galofer (cáscara de arroz)', depto: 'Treinta y Tres', energia: 'biomasa', fuente: 'miem-galofer' },
      { id: 'bella-union', lugar: 'Complejo de ALUR en Bella Unión', depto: 'Artigas', energia: 'biomasa', fuente: 'alur-bu' }
    ],

    // Matriz eléctrica 2025 contada de dos maneras (las dos son oficiales y muestran cosas distintas).
    matriz: {
      anio: 2025,
      bases: [
        {
          clave: 'red',
          titulo: 'Electricidad entregada a la red',
          detalle: 'Lo que llegó al Sistema Interconectado Nacional en 2025: 13.040 GWh.',
          totalGwh: 13040,
          fuente: 'miem-sin-2025',
          partes: [
            { f: 'hidraulica', pct: 46 }, { f: 'eolica', pct: 34 }, { f: 'biomasa', pct: 14 },
            { f: 'solar', pct: 4 }, { f: 'fosiles', pct: 2 }
          ]
        },
        {
          clave: 'total',
          titulo: 'Toda la electricidad generada en el país',
          detalle: 'Incluye lo que las industrias generan para su propio consumo: 15.855 GWh.',
          totalGwh: 15855,
          fuente: 'bep-2025',
          partes: [
            { f: 'hidraulica', pct: 38, gwh: 6100 }, { f: 'eolica', pct: 28, gwh: 4457 }, { f: 'biomasa', pct: 28, gwh: 4415 },
            { f: 'solar', pct: 4, gwh: 591 }, { f: 'fosiles', pct: 2, gwh: 293 }
          ]
        }
      ],
      nombres: { hidraulica: 'Hidráulica', eolica: 'Eólica', biomasa: 'Biomasa', solar: 'Solar', fosiles: 'Fósiles' },
      nota: 'Son dos formas de contar la misma electricidad. En el segundo recuento entra lo que las industrias generan para ellas mismas, como las fábricas de celulosa: por eso la biomasa pesa mucho más.'
    },

    fuentes: {},
    preguntas: []
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
