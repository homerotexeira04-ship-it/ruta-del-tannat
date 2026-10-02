// Fondo: la foto se ve nítida y a través de la tarjeta de «vidrio», y aun así todo texto se lee (4,5:1 contra lo peor que tenga detrás),
// en las pantallas principales y con cada una de las cinco fotos.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, dormir, contrasteDeTextos } = require('./ayudas');
const { ESCENAS, ESTACIONES } = require('./escenas');

let B;
test.before(async () => { B = await iniciar(); });
test.after(async () => { await B.cerrar(); });

const MINIMO = 4.5;

test('los textos se leen con las cinco fotos en todas las pantallas principales', async () => {
  const malos = [];
  for (const [nombre, preparar] of ESCENAS) {
    const page = await B.pagina(); // una página limpia por escena: sin temporizadores ni estados de la escena anterior
    await preparar(page);
    for (const e of ESTACIONES) {
      await page.evaluate((e) => { RE.ui.tema(e); }, e);
      await dormir(1000); // termina el cambio de foto (0,8 s) y la aparición de la tarjeta
      const r = await contrasteDeTextos(page);
      assert.ok(r.length > 5, nombre + ': no se encontraron textos');
      for (const t of r) if (t.ratio < MINIMO) malos.push(nombre + ' · ' + e + ' · «' + t.texto + '» ' + t.color + ' → ' + t.ratio);
    }
    await page.cerrarContexto();
  }
  assert.deepEqual(malos, [], malos.length + ' textos con menos de ' + MINIMO + ':1');
});
