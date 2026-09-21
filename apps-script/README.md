# Opiniones reales de visitantes ("Voces del Circuito")

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
- La lista pública se actualiza en el momento y muestra las 30 más nuevas.
- **Regla de oro:** las críticas también se publican. Si solo se muestran los elogios, la sección pierde credibilidad (y el sitio dice públicamente que publica ambas). Rechazá solo spam, insultos y datos personales.
- Para borrar una opinión a pedido de su autor (se puede pedir por WhatsApp), borrá la fila.
- No se puede verificar que la persona hizo el circuito. Si quieren, agreguen una columna propia "Reserva verificada" y publiquen solo las que puedan confirmar con sus reservas.

## Qué protege el sistema

- Consentimiento obligatorio y datos mínimos: puntaje, texto, nombre o iniciales, ciudad/país y mes (opcionales), sin correo ni teléfono. La política de privacidad del sitio se actualiza sola cuando se activa el formulario.
- Anti-spam: campo oculto que solo llenan los bots, descarte de envíos en menos de 5 segundos y un tope de 30 envíos por hora.
- Lo que escribe un visitante nunca se interpreta como HTML en el sitio, y la planilla descarta símbolos de fórmula (`=`, `+`, `-`, `@`) al comienzo del texto.

## Límites

- Apps Script tarda uno o dos segundos en responder; la lista se pide recién cuando el visitante se acerca a esa sección.
- El aviso por mail usa la cuota de Gmail (100 por día en cuentas comunes): más que suficiente para este volumen.
- Los datos quedan en Google Sheets. Si el proyecto crece mucho, el mismo formulario puede apuntar a otra base de datos cambiando solo este backend.

## Probar el backend en la computadora

```bash
node --test apps-script/opiniones.test.js
```

Usa una planilla simulada (no toca Google): valida que una opinión quede pendiente, que se rechacen datos inválidos, que los bots no dejen filas, que se limpien las fórmulas, que la lista pública solo traiga las publicadas y el tope por hora.
