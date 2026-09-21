// Verifica que un informe de Lighthouse (JSON) no baje de los mínimos acordados. Uso: node scripts/lh-assert.js lh.json
// Los mínimos son piso contra regresiones grandes, no la meta: hoy el sitio publicado da ~91 / 97 / 100 / 100 en celular.
const MINIMOS = { performance: 0.5, accessibility: 0.95, 'best-practices': 0.9, seo: 0.95 };
const r = JSON.parse(require('fs').readFileSync(process.argv[2] || 'lh.json', 'utf8'));
let mal = 0;
for (const [k, min] of Object.entries(MINIMOS)) {
  const c = r.categories[k]; const puntaje = c ? c.score : null; const ok = puntaje !== null && puntaje >= min; if (!ok) mal++;
  console.log((ok ? 'OK  ' : 'MAL ') + k.padEnd(15) + (puntaje === null ? 'sin dato' : Math.round(puntaje * 100)) + '  (mínimo ' + Math.round(min * 100) + ')');
}
process.exit(mal ? 1 : 0);
