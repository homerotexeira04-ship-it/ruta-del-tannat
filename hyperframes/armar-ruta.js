// Rehace hyperframes/ruta.json con el MISMO orden que «Armá tu día» (ordenMiDia del sitio) con las 4 bodegas + Termas.
// Uso: node armar-ruta.js <LaRutadelTannat.html> <ruta.json>
const fs = require('fs');
const [HTML, OUT] = process.argv.slice(2);
const s = fs.readFileSync(HTML, 'utf8');
const linea = (pre) => s.split(/\r?\n/).find((l) => l.trim().startsWith(pre));
const TRAMOS = JSON.parse(linea('const TRAMOS = ').trim().replace(/^const TRAMOS = /, '').replace(/;$/, ''));
const tramo = (a, b) => { const k = [a, b].sort((x, y) => (x === 't') - (y === 't') || x.localeCompare(y)).join('-'); const t = TRAMOS[k]; return t && { ...t, c: k.startsWith(a) ? t.c : [...t.c].reverse() }; };
// copia literal de ordenMiDia
function ordenMiDia(estaciones, termas) {
  const fijas = estaciones.includes('1') ? ['1'] : [], resto = estaciones.filter((e) => e !== '1');
  const perms = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms(xs.slice(0, i).concat(xs.slice(i + 1))).map((p) => [x].concat(p))));
  let mejor = null;
  perms(resto).forEach((p) => {
    const orden = fijas.concat(p, termas ? ['t'] : []);
    let min = 0, km = 0;
    for (let i = 1; i < orden.length; i++) { const t = tramo(orden[i - 1], orden[i]); min += t.min; km += t.km; }
    if (!mejor || min < mejor.min || (min === mejor.min && km < mejor.km)) mejor = { orden, min, km };
  });
  return mejor;
}
const plan = ordenMiDia(['1', '2', '3', '4'], true);
const legs = plan.orden.slice(1).map((b, i) => ({ a: plan.orden[i], b, ...tramo(plan.orden[i], b) }));
// proyección equirectangular a la caja x 330–750, y 150–910 (norte arriba), misma escala en los dos ejes
const pts = legs.flatMap((l) => l.c);
const lat0 = pts.reduce((m, p) => m + p[0], 0) / pts.length, kx = Math.cos(lat0 * Math.PI / 180);
const X = (p) => p[1] * kx, Y = (p) => -p[0];
const xs = pts.map(X), ys = pts.map(Y);
const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
const esc = Math.min(420 / (x1 - x0), 760 / (y1 - y0));
const ox = 540 - ((x0 + x1) / 2) * esc, oy = 530 - ((y0 + y1) / 2) * esc;
const P = (p) => [+(X(p) * esc + ox).toFixed(1), +(Y(p) * esc + oy).toFixed(1)];
const pins = {}; legs.forEach((l) => { pins[l.a] = pins[l.a] || P(l.c[0]); pins[l.b] = P(l.c[l.c.length - 1]); });
const out = {
  orden: plan.orden, pins,
  legs: legs.map((l) => ({ de: l.a, a: l.b, min: l.min, km: l.km, d: 'M' + l.c.map((p) => P(p).join(' ')).join(' L') })),
  total: { min: plan.min, km: +plan.km.toFixed(1) },
  escala_px_por_km: +(esc / ((Math.PI / 180) * 6371)).toFixed(2),
};
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(plan.orden.join('→'), plan.min + ' min', plan.km.toFixed(1) + ' km', JSON.stringify(pins), out.legs.map((l) => l.de + '→' + l.a + ' ' + l.min + 'min ' + l.km + 'km').join(' | '));
