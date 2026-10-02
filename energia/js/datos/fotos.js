/* Fotos de fondo de las estaciones: de dónde salen, quién las sacó y con qué licencia (se muestran en Créditos y fuentes).
   Los archivos de img/fondos/ son recortes de 960 × 540 ya desenfocados a partir de las originales de Wikimedia Commons. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});

  var CC_BY_SA_3 = { nombre: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/deed.es' };
  var CC_BY_SA_4 = { nombre: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.es' };
  var CC0 = { nombre: 'CC0 1.0 (dominio público)', url: 'https://creativecommons.org/publicdomain/zero/1.0/deed.es' };

  RE.fotos = {
    cambios: 'Recortadas a 16:9, reducidas y desenfocadas para usarlas de fondo.',
    hidraulica: { lugar: 'Represa de Salto Grande, Salto', autor: 'Shant', licencia: CC_BY_SA_3, archivo: 'Represa Salto Grande.jpg', url: 'https://commons.wikimedia.org/wiki/File:Represa_Salto_Grande.jpg' },
    eolica: { lugar: 'Parque eólico Sierra de los Caracoles, Maldonado', autor: 'Andrés Franchi Ugart', licencia: CC_BY_SA_3, archivo: 'Parque Eólico «Sierra de los Caracoles» - panoramio (1).jpg', url: 'https://commons.wikimedia.org/wiki/File:Parque_E%C3%B3lico_%22Sierra_de_los_Caracoles%22_-_panoramio_(1).jpg' },
    solar: { lugar: 'Paneles solares en el departamento de Paysandú', autor: 'Mx. Granger', licencia: CC0, archivo: 'Solar panels in Paysandú Department.jpg', url: 'https://commons.wikimedia.org/wiki/File:Solar_panels_in_Paysand%C3%BA_Department.jpg' },
    biomasa: { lugar: 'Planta industrial de Montes del Plata, Conchillas (Colonia)', autor: 'Ayax4555', licencia: CC_BY_SA_4, archivo: 'Montes del Plata.jpg', url: 'https://commons.wikimedia.org/wiki/File:Montes_del_Plata.jpg' },
    uruguay: { lugar: 'Atardecer en Colonia del Sacramento', autor: 'Mx. Granger', licencia: CC0, archivo: 'Sunset on the beach in Colonia del Sacramento.jpg', url: 'https://commons.wikimedia.org/wiki/File:Sunset_on_the_beach_in_Colonia_del_Sacramento.jpg' }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
