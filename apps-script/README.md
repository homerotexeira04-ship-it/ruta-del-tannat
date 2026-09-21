# Opiniones reales de visitantes y contador de uso

Este Apps Script hace dos cosas con la misma planilla: **recibe y modera las opiniones** ("Voces del Circuito") y **cuenta el uso del sitio sin cookies** (sección "Contador de uso", más abajo).

Cómo funciona: el visitante deja su opinión en el sitio → se guarda en una **planilla de Google** como *pendiente* → alguien del equipo la lee y la cambia a *publicada* → aparece en el sitio. Nada se publica solo.

```
Visitante ──formulario──▶ Apps Script (opiniones.gs) ──▶ Planilla "Opiniones" (Estado: pendiente)
                                                              │  el equipo cambia Estado a "publicada"
Sitio (lista de opiniones) ◀── Apps Script (GET, solo "publicada") ◀┘
```

Mientras no se instale, el sitio no muestra formulario ni lista: queda solo el botón de WhatsApp de siempre.

## Instalación (unos 10 minutos, sin programar)

Conviene hacerlo con una cuenta de Google **del proyecto** (no personal), para que no dependa de una sola persona.

1. Entrá a <https://sheets.new> y ponele un nombre a la planilla (por ejemplo, "Opiniones La Ruta del Tannat").
2. Menú **Extensiones → Apps Script**. Borrá lo que aparece, pegá todo el contenido de [`opiniones.gs`](opiniones.gs) y guardá.
3. En la barra superior elegí la función **`setup`** y tocá **Ejecutar**. Google va a pedir permisos (planilla, correo): aceptalos. Crea la hoja "Opiniones" con sus columnas.
4. **Implementar → Nueva implementación → Aplicación web.** Configurá:
   - *Ejecutar como*: **Yo**
   - *Quién tiene acceso*: **Cualquier persona**
5. Copiá la URL que termina en `/exec`.
6. Pegala en `LaRutadelTannat.html`, en la línea `const OPINIONS_API = '';` (entre las comillas), y publicá el sitio. Desde ese momento aparece el formulario.

Si después cambiás `opiniones.gs`, hay que volver a **Implementar → Administrar implementaciones → Editar → Nueva versión** para que el cambio llegue al sitio (la URL no cambia).

## Moderar (lo que hace el equipo)

- Cada opinión nueva llega a la hoja con **Estado = pendiente** y le avisa por mail a la cuenta dueña de la planilla.
- Leela. Si es una opinión real, cambiá Estado a **`publicada`** (hay un menú desplegable). Si es spam, insultos o trae datos personales de otra persona, ponele **`rechazada`**.
- La lista pública se actualiza en el momento. El sitio muestra las 6 más nuevas y un botón "Ver más opiniones" con hasta 30. Mientras no haya ninguna publicada, no aparece la lista: solo la invitación a dejar la primera.
- **Regla de oro:** las críticas también se publican. Si solo se muestran los elogios, la sección pierde credibilidad (y el sitio dice públicamente que publica ambas). Rechazá solo spam, insultos y datos personales.
- Para sacar una opinión ya publicada, lo más rápido es cambiar su Estado a **rechazada** (se nota en el momento). Si el autor pide que se borre (se puede pedir por WhatsApp), eliminá la fila: en el sitio puede tardar hasta 5 minutos en desaparecer.
- No se puede verificar que la persona hizo el circuito. Si quieren, agreguen una columna propia "Reserva verificada" y publiquen solo las que puedan confirmar con sus reservas.

## Qué protege el sistema

- Consentimiento obligatorio y datos mínimos: puntaje, texto, nombre o iniciales, ciudad/país y mes (opcionales), sin correo ni teléfono. La política de privacidad del sitio se actualiza sola cuando se activa el formulario.
- Anti-spam: campo oculto que solo llenan los bots, descarte de envíos en menos de 5 segundos y un tope de 30 envíos por hora.
- Lo que escribe un visitante nunca se interpreta como HTML en el sitio, y la planilla descarta símbolos de fórmula (`=`, `+`, `-`, `@`) al comienzo del texto.

## Contador de uso (analítica sin cookies)

El sitio manda un aviso mínimo a este mismo Apps Script y este suma 1 a un total diario en la hoja **Estadisticas**. La hoja **Resumen** lo muestra ordenado (hoy, últimos 7 y 30 días, total; visitas por idioma, dispositivo y origen; toques a WhatsApp por lugar).

| Qué se cuenta | Cuándo | Detalles guardados |
|---|---|---|
| **visita** | la página queda abierta 3 segundos | idioma (es/pt/en), dispositivo (m celular, t tablet, d computadora), origen (directo, google, buscador, social, otro, o el valor de `?src=`) |
| **wa** | se toca un enlace de WhatsApp | dónde estaba (paquetes, testimonios, fab, …) |
| **reserva** | se abre el formulario (`abrir`) o se lo envía (`enviar`) | paquete elegido (`dia-completo`, `medio-dia`, `personalizada`) |
| **itinerario** | se imprime o guarda el itinerario (botón o Ctrl+P) | — |
| **copa** | se toca "Brindar" en La Copa | `brindis` |

**Qué NO se guarda:** cookies, dirección IP, navegador, nombre ni ningún identificador. Solo se suma un número a una fila del día. El sitio no cuenta si el visitante tiene activado "No rastrear", ni en robots, ni en pruebas locales (`localhost`).

**Para activarlo (una vez):** pegá el nuevo `opiniones.gs` en el proyecto de Apps Script, guardá, **Ejecutar → `setup`** (crea Estadisticas y Resumen y pone la planilla en hora de Uruguay) y creá una **Nueva versión** de la implementación (misma URL). El sitio ya trae el código que manda los avisos.

**Cómo leerlo:** abrí la hoja **Resumen**. Para medir un cartel con QR, agregá `?src=nombre` al enlace del sitio que va en el QR (por ejemplo `.../LaRutadelTannat.html?src=cartel-hotel`): sus visitas aparecen en la fila "Con ?src=" del Resumen y con su nombre en la hoja Estadisticas.

**Cuidados:**
- Las cifras son **orientativas**: no distinguen a una persona de otra, una recarga cuenta como otra visita, y quien bloquea los avisos no aparece.
- No ordenes ni filtres la hoja **Estadisticas** (las filas de hoy tienen que quedar al final). Para armar tus propios cuadros, usá una tabla dinámica en otra hoja.
- Topes: 600 avisos por hora y 300 combinaciones distintas por día. Si se pasan, el contador ignora lo que sobra (no afecta al sitio ni a las opiniones).
- Para borrar filas de prueba, ejecutá `borrarPruebas` (quita las que tienen "prueba" en Detalle 1).
- Las fórmulas de la hoja **Resumen** se adaptan solas a la configuración regional de la planilla (coma o punto y coma entre argumentos, según el país): `setup` lo detecta. La planilla de este proyecto está en es_ES (usa punto y coma) y en hora de Uruguay.
- Al abrir el sitio, el navegador se conecta a servidores de Google (donde vive el Apps Script). Nosotros no vemos esos datos técnicos; la política de privacidad del sitio lo explica.

## Límites

- Apps Script tarda uno o dos segundos en responder; la lista se pide recién cuando el visitante se acerca a esa sección.
- El aviso por mail usa la cuota de Gmail (100 por día en cuentas comunes): más que suficiente para este volumen.
- Los datos quedan en Google Sheets. Si el proyecto crece mucho, el mismo formulario puede apuntar a otra base de datos cambiando solo este backend.

## Probar el backend en la computadora

```bash
npm test
```

Usa una planilla simulada (no toca Google). `opiniones.test.js` valida que una opinión quede pendiente, que se rechacen datos inválidos, que los bots no dejen filas, que se limpien las fórmulas, que la lista pública solo traiga las publicadas y el tope por hora. `estadisticas.test.js` valida el contador: que sume sin duplicar filas, que descarte lo no permitido, el cambio de día, los topes y `borrarPruebas`.
