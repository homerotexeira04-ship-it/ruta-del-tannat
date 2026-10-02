// Archivos de acompañamiento: el .bat de Windows y la documentación hablan de los mismos archivos.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');

test('el .bat de Windows es ASCII puro con saltos de línea de Windows (si no, cmd.exe se confunde)', () => {
  const d = fs.readFileSync(path.join(RAIZ, 'dist', 'iniciar-en-pantalla-completa.bat'));
  assert.ok([...d].every((c) => c < 128), 'tiene caracteres que no son ASCII');
  const texto = d.toString('ascii');
  assert.equal((texto.match(/\n/g) || []).length, (texto.match(/\r\n/g) || []).length, 'todos los saltos de línea tienen que ser CRLF');
  assert.match(texto, /--kiosk/);
  assert.match(texto, /ruta-de-la-energia\.html/);
  assert.match(texto, /msedge\.exe/);
  // un paréntesis suelto dentro de un bloque ( ) rompe el .bat cuando la ruta de Windows lleva «(x86)»: no se usan bloques
  assert.ok(!/^\s*if .*\(\s*$/mi.test(texto), 'no usar bloques con paréntesis');
});

test('el README nombra los archivos de dist y la pantalla Ricoh D6510', () => {
  const r = fs.readFileSync(path.join(RAIZ, 'README.md'), 'utf8');
  assert.match(r, /D6510/);
  assert.match(r, /iniciar-en-pantalla-completa\.bat/);
  assert.match(r, /ruta-de-la-energia\.html/);
  assert.ok(!/85 pulgadas|85"/.test(r), 'el README todavía habla de 85 pulgadas');
  for (const f of ['iniciar-en-pantalla-completa.bat', 'ruta-de-la-energia.html']) assert.ok(fs.existsSync(path.join(RAIZ, 'dist', f)), 'falta dist/' + f);
});
