/* Fuentes de las preguntas. Cada pregunta cita una o dos por su id.
   verificacion: 'leida'    = se abrió la página y se comprobó el dato citado;
                 'busqueda' = el dato apareció en los resultados de búsqueda pero la página no se pudo abrir (revisar a mano si se puede). */
(function (g) {
  'use strict';
  var F = g.RE.datos.fuentes;
  function f(id, nombre, url, tipo, verificacion) { F[id] = { nombre: nombre, url: url, tipo: tipo, verificacion: verificacion }; }

  // Organismos y empresas públicas de Uruguay
  f('uyxxi-2025', 'Uruguay XXI, Energías renovables (oct. 2025)', 'https://www.uruguayxxi.gub.uy/uploads/informacion/260810-8be4/Informe%20Energ%C3%ADas%20Renovables%202025.pdf', 'oficial', 'leida');
  f('miem-sin-2025', 'MIEM, generación eléctrica 2025 (datos preliminares)', 'https://mediospublicos.uy/el-98-de-la-energia-electrica-generada-en-2025-fue-de-origen-renovable-informo-el-miem/', 'oficial', 'leida');
  f('bep-2025', 'DNE-MIEM, Balance Energético Preliminar 2025', 'https://todoelcampo.com.uy/archives/46249', 'oficial', 'leida');
  f('miem-transicion', 'MIEM, Segunda transición energética', 'https://www.gub.uy/ministerio-industria-energia-mineria/politicas-y-gestion/segunda-transicion-energetica-movilidad-electrica', 'oficial', 'leida');
  f('miem-solar', 'MIEM, Energía solar en Uruguay', 'https://www.gub.uy/ministerio-industria-energia-mineria/politicas-y-gestion/programas/energia-solar-uruguay', 'oficial', 'leida');
  f('miem-etiquetado', 'MIEM, Etiquetado de eficiencia energética', 'https://www.gub.uy/ministerio-industria-energia-mineria/node/8996', 'oficial', 'leida');
  f('miem-upm1', 'MIEM, Plantas de operación: UPM I', 'https://www.gub.uy/ministerio-industria-energia-mineria/publicaciones/plantas-operacion-upm', 'oficial', 'leida');
  f('miem-montes', 'MIEM, Plantas de operación: Montes del Plata', 'https://www.gub.uy/ministerio-industria-energia-mineria/publicaciones/plantas-operacion-montes-del-plata', 'oficial', 'leida');
  f('miem-galofer', 'MIEM, Plantas de operación: Galofer', 'https://www.gub.uy/ministerio-industria-energia-mineria/publicaciones/plantas-operacion-galofer', 'oficial', 'leida');
  f('impo-ursea', 'Ley 17.598 (URSEA), IMPO', 'https://www.impo.com.uy/bases/leyes/17598-2002', 'oficial', 'leida');
  f('parlamento-18585', 'Ley 18.585 de energía solar térmica, Parlamento', 'https://legislativo.parlamento.gub.uy/temporales/leytemp6274519.htm', 'oficial', 'busqueda');
  f('adme-mision', 'ADME, Misión', 'https://adme.com.uy/institucional/mision.php', 'oficial', 'leida');
  f('gub-pampa', 'Presidencia, Parque Eólico Pampa', 'https://www.gub.uy/presidencia/comunicacion/noticias/ute-presento-parque-eolico-pampa-capacidad-generar-140-mw', 'oficial', 'leida');
  f('auci-asahi', 'AUCI, Planta solar Asahi en Salto (2013)', 'https://www.gub.uy/agencia-uruguaya-cooperacion-internacional/comunicacion/noticias/inauguracion-planta-solar-fotovoltaica-salto-marco-cooperacion-japon', 'oficial', 'leida');
  f('mgap-forestal', 'MGAP, Cartografía Forestal Nacional 2024', 'https://descargas.mgap.gub.uy/Documentos%20compartidos/CARTOGRAFIA%202024/Informe%20de%20resultados%202025.pdf', 'oficial', 'busqueda');
  f('ute-bonete', 'UTE, Rincón del Bonete cumplió 75 años', 'https://www.ute.com.uy/noticias/rincon-del-bonete-cumplio-75-jovenes-anos', 'oficial', 'leida');
  f('ute-baygorria', 'UTE, Central Rincón de Baygorria', 'https://www.ute.com.uy/noticias/mas-de-seis-decadas-generando-energia-renovable', 'oficial', 'leida');
  f('ute-constitucion', 'UTE, Central Constitución (Palmar)', 'https://www.ute.com.uy/noticias/visita-la-central-hidroelectrica-constitucion', 'oficial', 'leida');
  f('ute-caracoles', 'UTE, Parque eólico Sierra de los Caracoles', 'https://www.ute.com.uy/noticias/15-anos-del-parque-eolico-sierra-de-los-caracoles-ing-emanuele-cambilargiu', 'oficial', 'leida');
  f('ute-pampa-inversores', 'UTE, Inversores del Parque Pampa', 'https://www.ute.com.uy/noticias/inversores-de-parque-eolico-pampa-obtuvieron-22-sobre-el-capital-invertido', 'oficial', 'leida');
  f('ute-melo', 'UTE, Parque solar fotovoltaico Melo', 'https://www.ute.com.uy/noticias/parque-solar-fotovoltaico-melo-el-mas-grande-del-pais-ute-anuncio-el-inicio-de-su-construccion', 'oficial', 'leida');
  f('ute-doble-horario', 'UTE, Plan Inteligente: tarifa Doble Horario', 'https://www.ute.com.uy/clientes/soluciones-para-el-hogar/planes-hogar/plan-inteligente-hogares', 'oficial', 'leida');
  f('ute-punta-tigre', 'UTE, Ciclo combinado de Punta del Tigre', 'https://portal.ute.com.uy/noticias/ciclo-combinado-respaldo-menor-costo', 'oficial', 'leida');
  f('ute-microgeneracion', 'UTE, Microgeneración', 'https://www.ute.com.uy/clientes/redes-inteligentes/microgeneracion', 'oficial', 'busqueda');
  f('ctm-ficha', 'CTM Salto Grande, Ficha técnica', 'https://www.saltogrande.org/ficha_tecnica.php', 'oficial', 'leida');
  f('ctm-caract', 'CTM Salto Grande, Características', 'https://www.saltogrande.org/caracteristicas.php', 'oficial', 'leida');
  f('salto-turismo', 'Intendencia de Salto, Represa de Salto Grande', 'https://turismo.salto.gub.uy/sitios-de-interes/represa-de-salto-grande', 'oficial', 'leida');
  f('artilleros-web', 'Parque Eólico Artilleros (sitio oficial)', 'https://artilleroseolica.com.uy/', 'oficial', 'leida');
  f('upm-pdlt', 'UPM, Paso de los Toros', 'https://www.upm.uy/nuestras-operaciones/celulosa/upm-paso-de-los-toros/', 'oficial', 'leida');
  f('alur-bu', 'ALUR, Complejo de Bella Unión', 'https://www.alur.com.uy/agroindustrias/bella-union/', 'oficial', 'busqueda');
  f('mapa-solar', 'Mapa Solar del Uruguay (Facultad de Ingeniería, Udelar)', 'http://les.edu.uy/online/msuv2/', 'academica', 'busqueda');
  f('fing-eolica', 'Facultad de Ingeniería, La apuesta por la energía eólica', 'https://www.fing.edu.uy/es/noticias/area-de-comunicacion/la-apuesta-por-la-energia-eolica-en-la-ultima-decada', 'academica', 'leida');

  // Prensa, enciclopedias y organismos del exterior
  f('prodnac-despacho', 'Producción Nacional, Bonete y el Despacho de Cargas', 'https://www.produccionnacional.com.uy/energia-electrica-3/', 'prensa', 'leida');
  f('energimundo', 'Caras y Caretas, Salto Grande y LATU presentaron Energimundo', 'https://www.carasycaretas.com.uy/sociedad/salto-grande-y-el-latu-presentaron-energimundo-museo-energias-renovables-n82029', 'prensa', 'busqueda');
  f('elobservador-ppa', 'El Observador, los contratos PPA de UTE', 'https://www.elobservador.com.uy/economia-y-empresas/presidenta-ute-contratos-ppa-fueron-claves-milagro-uruguayo-las-energias-limpias-n5947703', 'prensa', 'busqueda');
  f('pvmag-2025', 'pv magazine, Uruguay cerró 2025 con 98 % renovable', 'https://www.pv-magazine-latam.com/2026/01/05/uruguay-cerro-2025-con-98-de-generacion-electrica-renovable-y-la-solar-marco-un-maximo-anual/', 'prensa', 'busqueda');
  f('lasrosas-prensa', 'Correo de Punta del Este, biogás en Las Rosas', 'https://correopuntadeleste.com/la-intendencia-de-maldonado-es-la-unica-que-genera-energia-con-los-residuos-domiciliarios/', 'prensa', 'busqueda');
  f('pluspetrol-parques', 'Pluspetrol, Parques eólicos Peralta y Cerro Grande', 'https://www.pluspetrol.net/es/operaciones/uruguay/parques-eolicos', 'prensa', 'busqueda');
  f('wiki-bonete-lago', 'Wikipedia, Lago Rincón del Bonete', 'https://es.wikipedia.org/wiki/Lago_Rinc%C3%B3n_del_Bonete', 'enciclopedia', 'leida');
  f('wiki-cunapiru', 'Wikipedia, Represa de Cuñapirú', 'https://es.wikipedia.org/wiki/Represa_de_Cu%C3%B1apir%C3%BA', 'enciclopedia', 'leida');
  f('wiki-eolica-uy', 'Wikipedia, Energía eólica en Uruguay', 'https://es.wikipedia.org/wiki/Energ%C3%ADa_e%C3%B3lica_en_Uruguay', 'enciclopedia', 'leida');
  f('wiki-central-hidro', 'Wikipedia, Central hidroeléctrica', 'https://es.wikipedia.org/wiki/Central_hidroel%C3%A9ctrica', 'enciclopedia', 'leida');
  f('wiki-panel-fv', 'Wikipedia, Panel fotovoltaico', 'https://es.wikipedia.org/wiki/Panel_fotovoltaico', 'enciclopedia', 'leida');
  f('wiki-celula-fe', 'Wikipedia, Célula fotoeléctrica', 'https://es.wikipedia.org/wiki/C%C3%A9lula_fotoel%C3%A9ctrica', 'enciclopedia', 'leida');
  f('wiki-seguidor', 'Wikipedia, Seguidor solar', 'https://es.wikipedia.org/wiki/Seguidor_solar', 'enciclopedia', 'leida');
  f('doe-turbina', 'Dpto. de Energía de EE. UU., cómo funciona un aerogenerador', 'https://www.energy.gov/eere/wind/inside-wind-turbine-0', 'oficial', 'leida');
  f('doe-tormentas', 'Dpto. de Energía de EE. UU., aerogeneradores y tormentas', 'https://www.energy.gov/cmei/wind/articles/how-do-wind-turbines-survive-severe-weather-and-storms', 'oficial', 'leida');
  f('doe-pv101', 'Dpto. de Energía de EE. UU., celdas fotovoltaicas', 'https://www.energy.gov/cmei/systems/articles/pv-cells-101-primer-solar-photovoltaic-cell', 'oficial', 'leida');
  f('windeurope-circ', 'WindEurope, Circularidad de los aerogeneradores', 'https://windeurope.org/about-wind/circularity/', 'academica', 'leida');
  f('springer-estelas', 'Springer, Wind-Turbine and Wind-Farm Flows: A Review', 'https://link.springer.com/article/10.1007/s10546-019-00473-0', 'academica', 'busqueda');
  f('frontiers-sombra', 'Frontiers in Energy Research, sombreado parcial', 'https://www.frontiersin.org/journals/energy-research/articles/10.3389/fenrg.2022.837540/full', 'academica', 'busqueda');
  f('pvmag-vida-util', 'pv magazine USA, vida útil de los paneles', 'https://pv-magazine-usa.com/2025/08/04/how-long-do-residential-solar-panels-last-3/', 'prensa', 'busqueda');
  f('idae-digestores', 'IDAE (España), Digestores anaerobios', 'https://www.idae.es/uploads/documentos/documentos_Digestores_1f5b2dd6.pdf', 'oficial', 'busqueda');
  f('idae-cogeneracion', 'IDAE (España), Cogeneración', 'https://www.idae.es/en/technologies/energy-efficiency/conversion-energy/cogeneration', 'oficial', 'busqueda');
  f('idae-biomasa', 'IDAE (España), Energía de la biomasa', 'https://www.idae.es/uploads/documentos/documentos_10374_Energia_de_la_biomasa_07_b954457c.pdf', 'oficial', 'busqueda');
  f('mapa-cenizas', 'Ministerio de Agricultura de España, cenizas de biomasa', 'https://www.mapa.gob.es/ministerio/pags/Biblioteca/Revistas/pdf_Agri/Agri_2008_904_168_172.pdf', 'oficial', 'busqueda');
})(typeof globalThis !== 'undefined' ? globalThis : this);
