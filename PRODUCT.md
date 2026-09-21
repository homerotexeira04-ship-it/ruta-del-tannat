# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Principal (confirmado):** turistas que planean una escapada a Salto, Uruguay: uruguayos de otras zonas, argentinos (Concordia queda enfrente), brasileños y visitantes de otros países. Deciden antes del viaje, casi siempre desde el celular, comparan qué ver y coordinan la visita por WhatsApp.

**Secundario (confirmado):** el tribunal de UTU y las instituciones que respaldan o pueden mirar el proyecto (INAVI, Intendencia de Salto, entre otras). El sitio también es el trabajo que se evalúa, pero no se diseña primero para ellos.

## Product Purpose

Dar a conocer y hacer visitable el circuito enoturístico de Salto, "la cuna del Tannat": la historia de Pascual Harriague (1874), 4 estaciones con bodegas, más termas, patrimonio y gastronomía. Es el proyecto final de Federico Camara, Homero Texeira y Anthony Moreira, estudiantes del Polo Educativo Tecnológico Salto (DGETP-UTU).

Éxito: que un turista entienda el circuito, confíe en lo que lee y mande una solicitud de visita por WhatsApp; y que el trabajo se sostenga ante una evaluación académica.

## Positioning

El circuito que cuenta el origen del Tannat en Uruguay desde el lugar donde empezó, y lo une con las aguas termales de Salto: historia viva (Espacio Cultural Bodega Harriague), bodegas familiares y boutique, grupos reducidos y coordinación directa sin intermediarios. Una operadora o un portal de turismo genérico no podría decir con verdad que el Tannat nació en Salto con Harriague ni ofrecer esa combinación.

## Operating Context

- **Estado (confirmado):** proyecto estudiantil en marcha. Coordina visitas reales con las bodegas por WhatsApp. El sitio no afirma aval oficial, salvo respaldos que estén documentados: el programa de Viticultura Sostenible de INAVI (auditado por LSQA), la Comisión Honoraria del Patrimonio Histórico de Salto y la Universidad del País Vasco en el rescate de Bodega Harriague, y la formación de guías en UTU.
- **Reservas:** el formulario arma un mensaje de WhatsApp prellenado que se envía desde el teléfono del visitante. No hay pagos reales: la sección de pasarela es ilustrativa y los precios (USD y $U) son de referencia.
- **Publicación:** GitHub Pages (repositorio `homerotexeira04-ship-it/ruta-del-tannat`), sin dominio propio. La página principal es `LaRutadelTannat.html`.
- **Opiniones:** el visitante deja su opinión en el sitio; llega a una planilla de Google (Apps Script) y el equipo la modera a mano antes de publicarla. Se publican elogios y críticas; solo se descarta spam, insultos y datos personales de terceros.
- Se muestra y se defiende ante un tribunal, y puede llegar a instituciones reales.

## Capabilities and Constraints

- Una sola página estática (HTML y JavaScript sin framework), en español, portugués e inglés (`translations` + `data-i18n`). Tailwind se compila (`npm run build:css`). Instalable como PWA. Mapa (Leaflet), "La Copa de Tannat" interactiva y opiniones con formulario.
- Sin servidor propio y sin analítica ni cookies de seguimiento (estado actual). Sumar analítica queda sin decidir.
- GitHub Pages no permite cabeceras de seguridad, y `robots.txt` y `sitemap.xml` solo cuentan en la raíz de un dominio.
- Que todo texto nuevo deba escribirse en los tres idiomas no fue confirmado como regla obligatoria; hoy el sitio los tiene.
- Historial del usuario: rechazó una escena 3D fijada al scroll porque "se tranca e interfiere". Lo interactivo tiene que ser liviano, iniciado por el visitante y no tomar el control del scroll.
- **Redacción (resuelto):** el sitio no llama "oficial" al circuito ni a sus bodegas. Se corrigieron el `<title>`, el dato estructurado, la descripción del manifest, el panel del inicio ("4 Bodegas del Circuito") y la insignia de las estaciones ("Itinerario del Circuito"). "Fuentes oficiales" en los créditos de fotos se mantiene porque describe a INAVI. En lo nuevo, no usar "oficial" salvo que exista un aval documentado.
- **Financiamiento (confirmado por el autor):** el único financiador real es INAVI. La Intendencia de Salto, UTU y MINTUR son potenciales, no confirmados. El dato estructurado (JSON-LD) lista solo a INAVI como `funder`; no volver a listar a otros como financiadores sin confirmación.
- **Decisión abierta:** en el pie de página, "Marco Institucional" enumera con enlaces a la Intendencia, UTU, INAVI, MINTUR y la Asociación Vasca de Salto / U-riharri. Falta decidir si esa lista se mantiene como está, se aclara qué relación tiene cada una (financia, forma, respalda, potencial) o se recorta a las confirmadas.
- Terminología: "Tannat", "estaciones" (las 4 estaciones de la ruta), "circuito", "Espacio Cultural Bodega Harriague (Punto Cero)". Español rioplatense con voseo.

## Brand Commitments

- Nombre "La Ruta del Tannat", con la frase "Cepa, origen e identidad".
- En el encabezado va el logo del proyecto junto al sello "Enoturismo Uruguay"; el permiso de uso de ese sello no está registrado en el repositorio.
- Voz: cercana y directa ("Contanos", "Probá"), sin exageraciones; honesta sobre lo que es ilustrativo o de referencia.

## Evidence on Hand

- Fotografías reales de Salto con crédito: INAVI (cosecha), Bodegas del Uruguay (ruinas nocturnas, festival), Wikimedia Commons (retrato de Harriague, termas del Arapey, Salto desde el puerto, la fiesta de la vendimia de 1985, entre otras). Las imágenes de paquetes son ilustrativas, de otros lugares, y así se rotulan en el sitio.
- Enlaces oficiales verificados de INAVI, UTU, Intendencia de Salto y el Ministerio de Turismo.
- Contenido y datos del trabajo escrito: `La Ruta del Tannat - Proyecto Final.docx` y `LaRutadelTannatREVISADO.md` en la raíz del repositorio.
- **No hay** (y no se deben inventar): testimonios de turistas fuera de las opiniones que lleguen por el formulario, reseñas de prensa, cifras de visitantes, tarifas cerradas de grupos ni un aval institucional formal registrado.

## Product Principles

1. **Verdad antes que efecto.** Ningún dato, foto, testimonio o respaldo que no se pueda sostener. Lo ilustrativo se rotula como tal.
2. **El turista primero.** Cada pantalla lo acerca a entender el circuito y a coordinar su visita por WhatsApp, sin pasos ni cuentas de por medio.
3. **Honesto sobre lo que es.** Se presenta como proyecto estudiantil en marcha, no como institución ni operador consolidado.
4. **Lo interactivo suma y no estorba.** Opcional, liviano, en manos del visitante.

## Accessibility & Inclusion

El sitio declara públicamente (página "Accesibilidad") que toma como referencia las pautas WCAG. En lo nuevo, mantener contraste AA, foco visible por teclado, etiquetas para lectores de pantalla y áreas táctiles de 44 px. Uso principal en celular, con conexiones móviles variables.
