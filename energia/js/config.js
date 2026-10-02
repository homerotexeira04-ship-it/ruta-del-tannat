/* Ruta de la Energía Uruguay: configuración del puesto (lo único que hace falta tocar al instalarlo).
   Cambiá el PIN antes de dejar la pantalla funcionando. */
(function (g) {
  'use strict';
  var RE = (g.RE = g.RE || {});

  RE.config = {
    version: '1.1.0',
    titulo: 'Ruta de la Energía Uruguay',

    // ---- Puesto en pantalla interactiva ----
    pinAdmin: '4286',                 // PIN del panel de administración (mantener 4 a 8 dígitos). CAMBIARLO.
    pinDeFabrica: '4286',             // si pinAdmin sigue siendo este, el panel avisa que falta cambiarlo
    inactividadAvisoS: 75,            // sin tocar la pantalla durante tanto tiempo: aparece «¿Seguís ahí?»
    inactividadCuentaS: 15,           // y si nadie responde en tanto tiempo, vuelve al inicio
    inicioLimpiaAlS: 90,              // en la pantalla de inicio, borra nombre y opciones tras tanto tiempo sin uso
    pantallaCompletaAlComenzar: true, // pide pantalla completa con el primer toque en «Comenzar»
    mantenerPantallaEncendida: true,  // evita que la pantalla se apague mientras se juega (si el navegador lo permite)
    sonidoPorDefecto: true,
    nombreMax: 24,                    // largo máximo del nombre o alias en el ranking
    antirreboteMs: 300,               // tras abrirse una pantalla, se ignoran los toques durante este rato (toques dobles o «fantasma»)

    // ---- Juego ----
    // plantilla = dificultades de las preguntas de cada estación (1 fácil, 2 media, 3 difícil), en el orden en que salen.
    modos: {
      completo: { nombre: 'Recorrido completo', minutos: '10 a 12 minutos', plantilla: [1, 1, 2, 2, 3], lugares: 5, distractoresLugares: 2 },
      corto: { nombre: 'Recorrido corto', minutos: 'unos 5 minutos', plantilla: [1, 2], lugares: 3, distractoresLugares: 1 }
    },
    ritmos: {
      tranquilo: { nombre: 'Tranquilo', factor: 1.5 },
      normal: { nombre: 'Normal', factor: 1 },
      veloz: { nombre: 'Veloz', factor: 0.7 }
    },
    puntos: {
      acierto: 10,
      bonoRachaCada: 3, bonoRacha: 5,     // +5 cada 3 aciertos seguidos
      logroCada: 5,                       // cartel de logro cada 5 aciertos seguidos
      bonoVelocidadMax: 5,                // solo en contrarreloj: hasta +5 por contestar rápido
      desafioPrimera: 10, desafioSegunda: 5
    },
    // Tiempo por pregunta en contrarreloj: lo que se tarda en leer + un margen, según el largo de la pregunta y sus opciones.
    tiempo: { baseS: 6, palabrasPorS: 2.5, minS: 10, maxS: 60 },
    ranking: { guardar: 200, mostrar: 5 },
    vistasMax: 100,                       // cuántas preguntas recientes recuerda para no repetirlas en la próxima partida
    almacenPrefijo: 're.v1.',

    // Los umbrales de las insignias finales (porcentaje de aciertos en las preguntas)
    insignias: [
      { desde: 90, clave: 'experto', titulo: 'Experto/a en Energías Renovables', cuerpo: 'Conocés la matriz eléctrica uruguaya al dedillo.' },
      { desde: 70, clave: 'guardian', titulo: 'Guardián/a de la Energía', cuerpo: 'Tenés muy buen manejo del tema.' },
      { desde: 50, clave: 'aprendiz', titulo: 'Aprendiz de la Energía', cuerpo: 'Vas por buen camino, seguí explorando.' },
      { desde: 0, clave: 'explorador', titulo: 'Explorador/a en Formación', cuerpo: 'Todo recorrido empieza con un primer paso.' }
    ],
    logros: [
      { clave: 'voltio', icono: 'rayo', titulo: 'Cerebro de Voltio', cuerpo: '5 respuestas correctas seguidas' },
      { clave: 'viento', icono: 'eolica', titulo: 'Maestro/a del Viento', cuerpo: '10 respuestas correctas seguidas' },
      { clave: 'solar', icono: 'solar', titulo: 'Mente Solar', cuerpo: '15 respuestas correctas seguidas' },
      { clave: 'corriente', icono: 'hidraulica', titulo: 'Corriente Imparable', cuerpo: '20 respuestas correctas seguidas' },
      { clave: 'leyenda', icono: 'trofeo', titulo: 'Leyenda Renovable', cuerpo: '¡Recorrido perfecto!' }
    ]
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
