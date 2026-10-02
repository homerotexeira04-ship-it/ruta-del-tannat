/* Íconos del juego como SVG en texto (propios, sin archivos externos). Los cinco de las estaciones son los del juego original.
   Se pintan con `currentColor`; las clases (aspas, olas…) las anima el CSS solo en la estación activa. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});

  function svg(cuerpo, vista) { return '<svg viewBox="' + (vista || '0 0 48 48') + '" fill="none" aria-hidden="true" focusable="false">' + cuerpo + '</svg>'; }
  function trazo(d, ancho) { return '<path d="' + d + '" stroke="currentColor" stroke-width="' + (ancho || 3) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }

  RE.iconos = {
    // ---- estaciones ----
    hidraulica: svg('<rect x="8" y="10" width="6" height="16" rx="1" fill="currentColor"/><path d="M6 26 H42" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path class="ico-ola ico-ola-1" d="M6 33 Q11 28 16 33 T26 33 T36 33 T42 33" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path class="ico-ola ico-ola-2" d="M6 39 Q11 34 16 39 T26 39 T36 39 T42 39" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>'),
    eolica: svg('<line x1="24" y1="44" x2="24" y2="20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><g class="ico-aspas"><circle cx="24" cy="18" r="2.6" fill="currentColor"/><path d="M24 18 L11 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M24 18 L35 7" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M24 18 L31 31" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></g>'),
    solar: svg('<circle class="ico-sol" cx="24" cy="15" r="7" fill="currentColor"/><g class="ico-rayos" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="24" y1="2" x2="24" y2="5"/><line x1="9" y1="15" x2="12" y2="15"/><line x1="36" y1="15" x2="39" y2="15"/><line x1="13.5" y1="4.5" x2="15.5" y2="6.5"/><line x1="34.5" y1="4.5" x2="32.5" y2="6.5"/></g><rect x="9" y="30" width="30" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="2.4"/><line x1="18.5" y1="30" x2="18.5" y2="43" stroke="currentColor" stroke-width="1.8"/><line x1="29.5" y1="30" x2="29.5" y2="43" stroke="currentColor" stroke-width="1.8"/><line x1="9" y1="36.5" x2="39" y2="36.5" stroke="currentColor" stroke-width="1.8"/>'),
    biomasa: svg('<g class="ico-hoja"><path d="M12 40 C10 24, 18 8, 40 8 C40 30, 26 40, 12 40 Z" fill="currentColor" opacity="0.16"/><path d="M12 40 C10 24, 18 8, 40 8 C40 30, 26 40, 12 40 Z" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M14 38 C20 28, 28 18, 38 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></g>'),
    uruguay: svg('<circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="2.2" opacity="0.35"/><path class="ico-rayo" d="M26 6 L14 27 H22 L20 42 L34 20 H26 Z" fill="currentColor"/>'),

    // ---- interfaz (viewBox 24×24) ----
    check: svg(trazo('M5 13l4 4L19 7', 3), '0 0 24 24'),
    cruz: svg(trazo('M6 6l12 12M18 6L6 18', 3), '0 0 24 24'),
    rayo: svg('<path d="M13 2 5 13.5h6L10 22l9-12h-6.2z" fill="currentColor"/>', '0 0 24 24'),
    llama: svg('<path d="M12 2.5c.6 3.4-1.6 4.9-3.1 6.9C7.6 11.1 7 12.6 7 14.2A5 5 0 0 0 12 19.5a5 5 0 0 0 5-5.1c0-2.2-1-3.7-2-5-.2 1.1-.8 1.9-1.6 2.3.5-3.1-.4-6.5-1.4-9.2z" fill="currentColor"/>', '0 0 24 24'),
    reloj: svg('<circle cx="12" cy="13" r="8" stroke="currentColor" stroke-width="2.4"/>' + trazo('M12 8.5V13l3 2', 2.4) + trazo('M9 2.5h6', 2.4), '0 0 24 24'),
    trofeo: svg('<path d="M7 3.5h10v5.2a5 5 0 0 1-10 0z" fill="currentColor"/>' + trazo('M7 5.5H4c0 3 1.2 4.8 3.4 5.4M17 5.5h3c0 3-1.2 4.8-3.4 5.4', 2) + trazo('M12 13.7V18M8 20.5h8', 2.4), '0 0 24 24'),
    sonido: svg('<path d="M4 9.5v5h3.6L12.5 19V5L7.6 9.5z" fill="currentColor"/>' + trazo('M16 9.2a4 4 0 0 1 0 5.6M18.6 6.6a7.6 7.6 0 0 1 0 10.8', 2.2), '0 0 24 24'),
    silencio: svg('<path d="M4 9.5v5h3.6L12.5 19V5L7.6 9.5z" fill="currentColor"/>' + trazo('M16.5 9.5l5 5M21.5 9.5l-5 5', 2.2), '0 0 24 24'),
    salir: svg(trazo('M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10M15 8l4 4-4 4M19 12H9', 2.4), '0 0 24 24'),
    borrar: svg(trazo('M9 5h10a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H9l-5.5-7zM12.5 9.5l5 5M17.5 9.5l-5 5', 2), '0 0 24 24'),
    dado: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="3.5" stroke="currentColor" stroke-width="2.2"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor"/>', '0 0 24 24'),
    teclado: svg('<rect x="2.5" y="6" width="19" height="12" rx="2.2" stroke="currentColor" stroke-width="2"/>' + trazo('M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7.5 14h9', 2.2), '0 0 24 24'),
    flechaDer: svg(trazo('M5 12h14M13 6l6 6-6 6', 2.6), '0 0 24 24'),
    flechaIzq: svg(trazo('M19 12H5M11 6l-6 6 6 6', 2.6), '0 0 24 24'),
    repasar: svg(trazo('M4 5v5h5M4.8 10A8 8 0 1 1 4 12.5', 2.4), '0 0 24 24'),
    jugar: svg('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>', '0 0 24 24'),
    info: svg('<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.2"/>' + trazo('M12 11v6', 2.4) + '<circle cx="12" cy="7.6" r="1.4" fill="currentColor"/>', '0 0 24 24'),
    pantalla: svg('<rect x="3" y="4.5" width="18" height="12.5" rx="1.8" stroke="currentColor" stroke-width="2.2"/>' + trazo('M8.5 20h7M12 17v3', 2.2), '0 0 24 24'),
    pin: svg('<path d="M12 21s-6.5-6.2-6.5-11A6.5 6.5 0 0 1 12 3.5 6.5 6.5 0 0 1 18.5 10c0 4.8-6.5 11-6.5 11z" fill="currentColor"/><circle cx="12" cy="10" r="2.4" fill="#fff"/>', '0 0 24 24')
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
