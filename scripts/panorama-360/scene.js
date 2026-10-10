// Recreación ilustrada del circuito, vista desde un pasillo del viñedo al atardecer. Se dibuja una sola vez y se exporta como panorama equirrectangular (2:1) para el visor 360° del sitio.
// Orientación: acimut 0° = adelante (centro de la imagen, "norte"), 90° = derecha. Estaciones alrededor: 1 Harriague N (0°), 2 Salto Chico E (90°), 3 Bertolini S (180°), 4 Mori Maglio O (270°), termas NO (330°); el sol, al ONO (285°).
import * as THREE from 'three';

// Parámetros de la URL (solo para depurar): ?solo=vinedo,ruinas,rio,bertolini,mori,termas,arboles  dibuja solo esas partes · ?eye=70  cambia la altura del punto de vista (metros)
const Q = new URLSearchParams(location.search);
const SOLO = (Q.get('solo') || '').split(',').filter(Boolean);
const usa = (n) => !SOLO.length || SOLO.includes(n);

// ---------- utilidades ----------
const rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const R = rng(11); const rr = (a, b) => a + (b - a) * R(); const pick = (arr) => arr[Math.floor(R() * arr.length)];
const C = (hex) => new THREE.Color(hex); const D2R = Math.PI / 180;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const xz = (az, d) => [Math.sin(az * D2R) * d, -Math.cos(az * D2R) * d];
const hash2 = (ix, iy, s) => { let h = (ix * 374761393 + iy * 668265263 + s * 144665) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, y, s = 1) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const fbm = (x, y, s = 1) => { let t = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { t += a * vnoise(x * f, y * f, s + i); f *= 2; a *= 0.5; } return t; };

// ---------- render ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.NoToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); const EYE = Number(Q.get('eye')) || 5.0;
const FOG = '#E2AE78'; scene.fog = new THREE.FogExp2(FOG, 0.0026);

// ---------- cielo ----------
const SUN_AZ = 285, SUN_EL = 8;
const sunDir = new THREE.Vector3(Math.sin(SUN_AZ * D2R) * Math.cos(SUN_EL * D2R), Math.sin(SUN_EL * D2R), -Math.cos(SUN_AZ * D2R) * Math.cos(SUN_EL * D2R));
const STOPS = [[-90, '#E2AE78'], [-1, '#E2AE78'], [0.5, '#F3CC8E'], [3, '#F4BC74'], [8, '#E58E57'], [15, '#BD5B4C'], [28, '#74304A'], [48, '#3D1628'], [90, '#1B0A14']];
const skyAt = (el) => { for (let i = 0; i < STOPS.length - 1; i++) if (el >= STOPS[i][0] && el <= STOPS[i + 1][0]) return C(STOPS[i][1]).lerp(C(STOPS[i + 1][1]), (el - STOPS[i][0]) / (STOPS[i + 1][0] - STOPS[i][0])); return C(STOPS[STOPS.length - 1][1]); };
{
  const g = new THREE.SphereGeometry(2600, 160, 96); const pos = g.attributes.position, col = new Float32Array(pos.count * 3), v = new THREE.Vector3(), glow = C('#FFB86B');
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).normalize(); const el = Math.asin(v.y) / D2R; const c = skyAt(el); const d = Math.acos(Math.min(1, v.dot(sunDir))) / D2R; const k = Math.exp(-((d / 9) ** 2)) * 0.55 + Math.exp(-((d / 38) ** 2)) * 0.22; c.r += glow.r * k; c.g += glow.g * k; c.b += glow.b * k; col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); scene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false })));
}
const radial = (stops, size = 256) => { const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, size, size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const billboard = (tex, az, el, size, opts = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * (opts.aspect || 1)), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, toneMapped: false, blending: opts.add ? THREE.AdditiveBlending : THREE.NormalBlending, opacity: opts.opacity ?? 1, color: opts.color || 0xffffff })); const d = 2300, a = az * D2R, e = el * D2R; m.position.set(Math.sin(a) * Math.cos(e) * d, Math.sin(e) * d, -Math.cos(a) * Math.cos(e) * d); m.lookAt(0, 0, 0); if (opts.roll) m.rotateZ(opts.roll); m.renderOrder = opts.order || 1; scene.add(m); return m; };
billboard(radial([[0, 'rgba(255,248,225,1)'], [0.12, 'rgba(255,236,190,0.95)'], [0.3, 'rgba(255,196,120,0.35)'], [1, 'rgba(255,150,80,0)']]), SUN_AZ, SUN_EL, 900, { add: true, order: 3 });
billboard(radial([[0, 'rgba(255,255,240,1)'], [0.6, 'rgba(255,250,220,1)'], [0.66, 'rgba(255,240,200,0)'], [1, 'rgba(255,240,200,0)']]), SUN_AZ, SUN_EL, 70, { order: 4 });
{ // nubes alargadas, iluminadas desde abajo por el sol
  const nube = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d'); for (let i = 0; i < 26; i++) { const cx = 70 + R() * 372, cy = 64 + (R() - 0.5) * 28, rx = 40 + R() * 90, ry = 8 + R() * 18; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rx); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.save(); x.translate(cx, cy); x.scale(1, ry / rx); x.translate(-cx, -cy); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rx, 0, 7); x.fill(); x.restore(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const RN = rng(5); const lista = [[250, 6, 700], [262, 14, 900], [300, 9, 800], [320, 20, 700], [345, 11, 650], [20, 17, 800], [55, 24, 760], [95, 12, 700], [130, 20, 900], [165, 8, 760], [205, 15, 820], [235, 27, 780], [20, 38, 900], [150, 40, 900], [270, 36, 800], [310, 50, 900], [60, 52, 900]];
  lista.forEach(([az, el, s]) => { const d = Math.abs(((az - SUN_AZ + 540) % 360) - 180); const cal = Math.max(0, 1 - d / 120); const col = C('#6B2D45').lerp(C('#FFB070'), cal); billboard(nube, az + (RN() - 0.5) * 6, el, s, { aspect: 0.25, opacity: 0.55 + 0.35 * cal, color: col, roll: (RN() - 0.5) * 0.12 }); });
}

// ---------- luces ----------
const sun = new THREE.DirectionalLight('#FFC37E', 2.35); sun.position.copy(sunDir).multiplyScalar(300); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); { const s = sun.shadow.camera; s.left = -165; s.right = 165; s.top = 165; s.bottom = -165; s.near = 20; s.far = 700; s.updateProjectionMatrix(); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.3; }
scene.add(new THREE.HemisphereLight('#C99096', '#6B4A3A', 1.55)); { const fill = new THREE.DirectionalLight('#8A78B0', 0.55); fill.position.set(200, 90, 120); scene.add(fill); }

// ---------- terreno ----------
const terrainH = (x, z) => { const r = Math.hypot(x, z); let h = smooth(200, 700, r) * 75 * (0.3 + 0.7 * fbm(x * 0.0032 + 10, z * 0.0032 + 3, 5)) * (0.65 + 0.35 * Math.sin(x * 0.0021 + z * 0.0033)); h += -3.4 * smooth(98, 122, x) * (1 - smooth(300, 350, x)) * (1 - smooth(560, 760, Math.abs(z))); h += 16 * smooth(330, 450, x) * (0.5 + 0.5 * fbm(x * 0.006, z * 0.006, 9)); return h; };
const PATCH = ['#99A04E', '#B3A455', '#7F9246', '#A98E55', '#8E7B4A', '#B89A5E', '#6F8444', '#C2AC68'];
const terrain = (() => {
  // malla irregular: fina cerca del visor (4 m) y gruesa lejos; desplazada 2 m para que ningún vértice quede justo debajo de la cámara
  // (con triángulos enormes que cruzan el plano de la cámara, el rasterizador por software dibujaba el terreno por encima del follaje)
  const lado = []; for (let x = 2; x <= 1400; ) { lado.push(x); const a = Math.abs(x); x += a < 130 ? 4 : a < 420 ? 10 : 40; }
  const eje = [...lado.map((v) => -v).reverse(), ...lado]; const n = eje.length, pos = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), idx = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = eje[i], z = eje[j], h = terrainH(x, z), k = j * n + i; pos.set([x, h, z], k * 3);
    const cell = hash2(Math.floor(x / 62), Math.floor(z / 62), 3); const c = C(PATCH[Math.floor(cell * PATCH.length)]); c.lerp(C('#7A5C3E'), 0.14 * hash2(Math.floor(x / 23), Math.floor(z / 23), 8));
    c.lerp(C('#6B5E4A'), smooth(0, 60, h) * 0.5); if (x > 98 && x < 340) c.lerp(C('#4F5B3C'), 0.5 * (1 - smooth(98, 122, x) * 0.4));
    const jit = 0.94 + 0.12 * hash2(k, 7, 2); col.set([c.r * jit, c.g * jit, c.b * jit], k * 3);
    if (i < n - 1 && j < n - 1) idx.push(k, k + n, k + 1, k + 1, k + n, k + n + 1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
  const faceted = g.toNonIndexed(); faceted.computeVertexNormals(); // normales por cara calculadas acá (flatShading por derivadas dejaba el terreno negro al renderizar el cubo)
  const m = new THREE.Mesh(faceted, new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.position.y = -0.03; scene.add(m); return m;
})();

// ---------- viñedo ----------
const ROW_X = 95, ROW_N = 8, ROW_DZ = 3.0;
const rowZ = []; for (let k = -ROW_N; k < ROW_N; k++) rowZ.push(ROW_DZ * (k + 0.5));
if (usa('vinedo')) {
  // piso con franjas (hilera de tierra + pasillo de pasto)
  const W = 4096, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); const zspan = ROW_N * ROW_DZ * 2 + 10; const pz = (z) => (z + zspan / 2) / zspan * H;
  x.fillStyle = '#8F9248'; x.fillRect(0, 0, W, H);
  for (let k = -ROW_N - 2; k <= ROW_N + 2; k++) { const za = ROW_DZ * k; const g = x.createLinearGradient(0, pz(za - 1.5), 0, pz(za + 1.5)); g.addColorStop(0, '#6E5232'); g.addColorStop(0.14, '#86884A'); g.addColorStop(0.5, '#A2A653'); g.addColorStop(0.86, '#86884A'); g.addColorStop(1, '#6E5232'); x.fillStyle = g; x.fillRect(0, pz(za - 1.5), W, pz(za + 1.5) - pz(za - 1.5)); }
  for (let i = 0; i < 26000; i++) { x.fillStyle = 'rgba(' + pick(['215,190,100', '100,112,56', '160,128,76', '80,62,40', '230,205,120']) + ',' + (0.1 + R() * 0.22) + ')'; x.fillRect(R() * W, R() * H, 2 + R() * 16, 1 + R() * 3); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; const piso = new THREE.Mesh(new THREE.PlaneGeometry(ROW_X * 2, zspan, ROW_X, Math.round(zspan / 2)), new THREE.MeshLambertMaterial({ map: t })); piso.rotation.x = -Math.PI / 2; piso.position.y = 0.012; piso.receiveShadow = true; scene.add(piso);
  const AUTUMN = ['#D8A93C', '#D8A93C', '#D8A93C', '#CF8B30', '#CF8B30', '#7F8D3C', '#7F8D3C', '#6E8A3A', '#93973F', '#B8552E', '#8F2636'];
  const M = new THREE.Matrix4(), Qn = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), P = new THREE.Vector3();
  // postes y alambres
  const nPost = rowZ.length * Math.floor(ROW_X * 2 / 5); const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 2.05, 0.1), new THREE.MeshLambertMaterial({ color: '#4A3626' }), nPost); let ip = 0;
  const wires = new THREE.InstancedMesh(new THREE.BoxGeometry(ROW_X * 2, 0.018, 0.018), new THREE.MeshLambertMaterial({ color: '#3A3A3A' }), rowZ.length * 2); let iw = 0;
  rowZ.forEach((z) => { for (let w = 0; w < 2; w++) { M.compose(P.set(0, w ? 1.7 : 0.98, z), Qn.identity(), S.set(1, 1, 1)); wires.setMatrixAt(iw++, M); } for (let px = -ROW_X + 2; px < ROW_X - 2; px += 5) { M.compose(P.set(px, 1.02, z), Qn.identity(), S.set(1, 1, 1)); posts.setMatrixAt(ip++, M); } });
  posts.count = ip;
  // follaje en tres niveles de detalle (fino cerca del visor, grueso lejos) y racimos oscuros en el lado del pasillo
  const TIERS = [{ max: 30, step: 0.4, r: 0.3, ys: [1.0, 1.3, 1.6, 1.85], zs: [-0.2, 0.2] }, { max: 80, step: 0.8, r: 0.5, ys: [1.1, 1.55], zs: [-0.15, 0.15] }, { max: 400, step: 1.7, r: 0.95, ys: [1.35], zs: [0] }];
  const ico = new THREE.IcosahedronGeometry(1, 0); const cap = 90000; const blobs = new THREE.InstancedMesh(ico, new THREE.MeshLambertMaterial({ flatShading: true }), cap); let ib = 0;
  const grapes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.1, 0), new THREE.MeshLambertMaterial({ flatShading: true }), 30000); let ig = 0;
  rowZ.forEach((z) => { const bias = R();
    for (let bx = -ROW_X + 1; bx < ROW_X - 1; ) { const d = Math.hypot(bx, z); const tier = TIERS.find((q) => d < q.max) || TIERS[2];
      for (const y of tier.ys) for (const dz of tier.zs) { if (ib >= cap) break; if (R() < 0.06) continue; const r = tier.r * rr(0.8, 1.25); E.set(rr(0, 6), rr(0, 6), rr(0, 6)); Qn.setFromEuler(E);
        M.compose(P.set(bx + rr(-0.15, 0.15) * tier.step, y + rr(-0.08, 0.08) * tier.r * 3, z + dz + rr(-0.06, 0.06)), Qn, S.set(r * 1.25, r * 0.9, r * 0.95)); blobs.setMatrixAt(ib, M);
        let hex = pick(AUTUMN); if (R() < bias * 0.25) hex = pick(['#D8A93C', '#CF8B30']); const col = C(hex).multiplyScalar(0.86 + R() * 0.3); blobs.setColorAt(ib, col); ib++; }
      if (d < 34 && ig < 29990 && R() < 0.7) for (const s of [-1, 1]) { M.compose(P.set(bx + rr(-0.2, 0.2), rr(0.82, 1.05), z + s * rr(0.3, 0.42)), Qn.identity(), S.set(rr(1.1, 1.6), rr(1.5, 2.3), rr(1.1, 1.5))); grapes.setMatrixAt(ig, M); grapes.setColorAt(ig, C(pick(['#2B0A1C', '#3A1030', '#241230', '#46122E']))); ig++; }
      bx += tier.step; }
  });
  blobs.count = ib; grapes.count = ig;
  [posts, wires, blobs, grapes].forEach((m) => { m.castShadow = true; m.receiveShadow = true; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; scene.add(m); });
  console.log('follaje:', ib, 'racimos:', ig, 'postes:', ip);
}

// ---------- hitos de las estaciones (ilustración estilizada: no reproduce fielmente cada lugar) ----------
const MAT = (color, o = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...o });
const put = (geo, mat, x, y, z, o = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; if (o.s) m.scale.set(...o.s); m.castShadow = o.cast !== false; m.receiveShadow = o.recv !== false; (o.parent || scene).add(m); return m; };
const canvasTex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (rep) t.repeat.set(rep[0], rep[1]); return t; };
const stoneTex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#8D7D63'; x.fillRect(0, 0, w, h); let y = 0; while (y < h) { const rh = 34 + R() * 34; let xx = -R() * 60; while (xx < w) { const bw = 50 + R() * 70; x.fillStyle = pick(['#BFAC86', '#B5A27E', '#CBB892', '#A99779', '#C2B08E', '#B09C7A']); x.fillRect(xx + 2, y + 2, bw - 4, rh - 4); x.fillStyle = 'rgba(0,0,0,' + (0.04 + R() * 0.09) + ')'; x.fillRect(xx + 2, y + rh - 9, bw - 4, 7); x.fillStyle = 'rgba(255,240,200,' + (R() * 0.1) + ')'; x.fillRect(xx + 2, y + 2, bw - 4, 5); xx += bw; } y += rh; } for (let i = 0; i < 2400; i++) { x.fillStyle = 'rgba(55,42,28,' + R() * 0.14 + ')'; x.fillRect(R() * w, R() * h, 1 + R() * 3, 1 + R() * 3); } }, [1 / 3, 1 / 3]);
const stoneMat = new THREE.MeshLambertMaterial({ map: stoneTex });
const arco = (cx, y0, w, h) => { const p = new THREE.Path(); p.moveTo(cx - w / 2, y0); p.lineTo(cx + w / 2, y0); p.lineTo(cx + w / 2, y0 + h - w / 2); p.absarc(cx, y0 + h - w / 2, w / 2, 0, Math.PI, false); p.lineTo(cx - w / 2, y0); return p; };
const muro = (len, perfil, huecos, grosor, mat = stoneMat) => { // perfil: alturas del borde superior, en escalones
  const s = new THREE.Shape(); const n = perfil.length, P = []; for (let i = 0; i < n; i++) { const x0 = -len / 2 + len * i / n, x1 = -len / 2 + len * (i + 1) / n; P.push([x0, perfil[i]], [x1, perfil[i]]); }
  s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0); for (let i = P.length - 1; i >= 0; i--) s.lineTo(P[i][0], P[i][1]); s.closePath(); huecos.forEach((h) => s.holes.push(arco(...h)));
  const g = new THREE.ExtrudeGeometry(s, { depth: grosor, bevelEnabled: false }); g.translate(0, 0, -grosor / 2); const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };
const dosAguas = (w, h, len, mat) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2); g.rotateY(Math.PI / 2); const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };
const arbol = (x, z, s = 1, tono = 0) => { const g = new THREE.Group(); const h = rr(4.5, 7.5) * s; put(new THREE.CylinderGeometry(0.16 * s, 0.3 * s, h, 6), MAT('#5A4332'), 0, h / 2, 0, { parent: g }); const verdes = ['#4F6B35', '#5E7A3A', '#3F5B30', '#6C8A3F']; for (let i = 0; i < 3; i++) { const r = rr(1.5, 2.4) * s; put(new THREE.IcosahedronGeometry(r, 0), MAT(verdes[(i + tono) % 4]), rr(-0.8, 0.8) * s, h + (i - 1) * 1.1 * s, rr(-0.8, 0.8) * s, { parent: g, s: [1, rr(0.9, 1.3), 1] }); } g.position.set(x, terrainH(x, z), z); scene.add(g); return g; };
const arbusto = (x, z, r = 1) => put(new THREE.IcosahedronGeometry(r, 0), MAT(pick(['#6E8A3A', '#5E7A3A', '#8A9440', '#4F6B35'])), x, terrainH(x, z) + r * 0.55, z, { s: [1.3, 0.8, 1.1] });

// 1 · Espacio Cultural Bodega Harriague (norte, 0°): muros de piedra con arcos, sin techo
if (usa('ruinas')) {
  const [cx, cz] = xz(0, 56); const g = new THREE.Group(); g.position.set(cx - 4, 0, cz); scene.add(g);
  const frente = muro(38, [7.6, 7.6, 6.4, 5.2, 7.2, 7.6, 7.6, 4.6, 3.4, 5.6, 7.6, 7.2], [[-14.5, 1.6, 2.3, 4.2], [-10, 1.6, 2.3, 4.2], [-5.5, 1.6, 2.3, 4.2], [0, 0, 3.6, 5.4], [5.5, 1.6, 2.3, 4.2], [10, 1.6, 2.3, 4.2], [14.5, 1.6, 2.3, 4.2]], 1.6); frente.position.set(0, 0, 0); g.add(frente);
  [[-19, 0.5], [19, -0.5]].forEach(([x, lado], i) => { const ala = muro(15, i ? [5.4, 4.6, 3.2, 2.2, 2.6] : [5.8, 5.8, 4.4, 3.4, 4.6], [[2.4 * (i ? -1 : 1), 1.4, 2.1, 3.6]], 1.4); ala.rotation.y = Math.PI / 2; ala.position.set(x, 0, 7.4); g.add(ala); });
  const fondo = muro(26, [5.6, 5.0, 4.0, 5.2, 3.4, 2.4, 3.8, 5.0], [[-6, 1.4, 2.1, 3.6], [6, 1.4, 2.1, 3.6]], 1.4); fondo.position.set(0, 0, 15); g.add(fondo);
  for (let i = 0; i < 55; i++) { const a = R() * 7, d = rr(1, 22); put(new THREE.DodecahedronGeometry(rr(0.2, 0.7), 0), MAT(pick(['#A99779', '#B5A27E', '#8D7D63'])), Math.sin(a) * d * 1.3, 0.2, 7 + Math.cos(a) * d * 0.7, { parent: g, ry: R() * 6 }); }
  for (let i = 0; i < 14; i++) arbusto(cx - 4 + rr(-24, 24), cz + rr(-3, 22), rr(0.7, 1.8));
  arbol(cx - 22, cz + 10, 1.4, 0); arbol(cx + 20, cz + 12, 1.2, 1); arbol(cx + 6, cz + 20, 1.0, 2);
}

// 2 · Viñas y Bodega del Salto Chico (este, 90°): cascada basáltica sobre el río Uruguay y el cartel de entrada
if (usa('rio')) {
  const g = new THREE.PlaneGeometry(250, 1600, 1, 24); g.rotateX(-Math.PI / 2); const pos = g.attributes.position, col = new Float32Array(pos.count * 3), a = C('#C48A9A'), b = C('#F0B890'), cc = C();
  for (let i = 0; i < pos.count; i++) { const t = (pos.getX(i) + 125) / 250; cc.copy(a).lerp(b, t * t); col.set([cc.r, cc.g, cc.b], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const agua = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#7A3F4A', emissiveIntensity: 0.75 })); agua.position.set(225, -1.25, 0); agua.receiveShadow = true; scene.add(agua);
  for (let i = 0; i < 90; i++) { const x = rr(100, 126), z = rr(-44, 48); const base = terrainH(x, z) - 0.6, h = rr(1.4, 4.6) * (1.15 - (x - 100) / 60); const r = rr(0.7, 1.7); const m = put(new THREE.CylinderGeometry(r, r * 1.08, h, 6), MAT(pick(['#2E2929', '#383030', '#443A38', '#2A2525', '#4B403D'])), x, base + h / 2, z, { ry: R() * 6 }); if (R() < 0.25) { m.rotation.z = rr(-0.5, 0.5); m.rotation.x = rr(-0.5, 0.5); } }
  const cartel = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#4A2F20'; x.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, i * 43, w, 3); } x.fillStyle = '#F1E4C8'; x.textAlign = 'center'; x.font = '600 34px Georgia'; x.fillText('Viñas y Bodega del', w / 2, 78); x.font = '700 62px Georgia'; x.fillText('SALTO CHICO', w / 2, 150); x.font = '500 28px Georgia'; x.fillText('Terroir 100% Salteño', w / 2, 205); }, [1, 1]);
  const [sx, sz] = xz(88, 99); const tablero = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.8, 5.6), [MAT('#4A2F20'), new THREE.MeshLambertMaterial({ map: cartel }), MAT('#4A2F20'), MAT('#4A2F20'), MAT('#4A2F20'), MAT('#4A2F20')]);
  tablero.position.set(sx, 2.7, sz); tablero.castShadow = true; scene.add(tablero);
  [-2.2, 2.2].forEach((dz) => put(new THREE.BoxGeometry(0.28, 3.4, 0.28), MAT('#3A2618'), sx + 0.2, 1.7, sz + dz));
  // el cartel mira al oeste (hacia el visor): su cara visible es la -x (índice 1)
}

// 3 · Bodega Bertolini & Broglio (sur, 180°): casa blanca de arcos y parral
if (usa('bertolini')) {
  const [cx, cz] = xz(180, 60); const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = Math.PI; scene.add(g);
  const blanco = MAT('#EFE7D6'), base = new THREE.MeshLambertMaterial({ map: stoneTex });
  put(new THREE.BoxGeometry(20, 6.2, 10), blanco, 0, 3.1, 0, { parent: g }); put(new THREE.BoxGeometry(20.6, 1.1, 10.6), base, 0, 0.55, 0, { parent: g });
  const techo = dosAguas(11.6, 3.2, 21.6, MAT('#A9553A')); techo.position.set(0, 6.2, 0); g.add(techo);
  const puerta = muro(3.4, [5.2], [[0, 0, 2.6, 4.4]], 0.4, MAT('#EFE7D6')); puerta.position.set(0, 0, 5.15); g.add(puerta); put(new THREE.BoxGeometry(2.6, 3.0, 0.3), MAT('#3A2618'), 0, 1.5, 5.25, { parent: g });
  put(new THREE.CylinderGeometry(1.1, 1.1, 0.25, 20), MAT('#2B0A14'), 0, 6.3, 5.2, { parent: g, rx: Math.PI / 2 });
  [-7.5, -4.2, 4.2, 7.5].forEach((x) => { const v = muro(1.9, [3.8], [[0, 0, 1.4, 3.2]], 0.35, MAT('#EFE7D6')); v.position.set(x, 1.4, 5.2); g.add(v); put(new THREE.BoxGeometry(1.4, 2.2, 0.25), MAT('#2F3B46'), x, 2.5, 5.25, { parent: g }); });
  for (let i = 0; i < 2; i++) { const c = put(new THREE.ConeGeometry(1.1, 11, 6), MAT('#2F4A2B'), (i ? 13 : -13), 5.5, 3, { parent: g }); c.scale.set(1, 1, 1); }
  // parral: postes + techo de hojas
  const pg = new THREE.Group(); pg.position.set(0, 0, 18); g.add(pg);
  for (let i = -14; i <= 14; i += 4.7) for (let j = -9; j <= 9; j += 4.5) { put(new THREE.BoxGeometry(0.14, 2.4, 0.14), MAT('#4A3626'), i, 1.2, j, { parent: pg }); }
  for (let i = 0; i < 260; i++) { put(new THREE.IcosahedronGeometry(rr(0.7, 1.2), 0), MAT(pick(['#D8A93C', '#CF8B30', '#7F8D3C', '#6E8A3A', '#D8A93C', '#8F2636'])), rr(-15, 15), rr(2.3, 2.9), rr(-10, 10), { parent: pg, s: [1.3, 0.45, 1.2], ry: R() * 6 }); }
  for (let i = 0; i < 8; i++) arbusto(cx + rr(-22, 22), cz + rr(-6, 8), rr(0.6, 1.3));
}

// 4 · Mori Maglio Wines (oeste, 270°): dos autos antiguos en el campo, molino de viento y galpón
const auto = (x, z, giro, color) => { const g = new THREE.Group(); const cuerpo = MAT(color), cromo = MAT('#CFC7B5'), negro = MAT('#14110F'), vidrio = MAT('#3C4850', { emissive: '#2A1A22', emissiveIntensity: 0.4 });
  put(new THREE.BoxGeometry(4.4, 0.7, 1.7), cuerpo, 0, 0.78, 0, { parent: g }); put(new THREE.BoxGeometry(1.6, 0.85, 1.55), cuerpo, 1.7, 1.05, 0, { parent: g }); put(new THREE.BoxGeometry(1.9, 0.9, 1.5), cuerpo, -0.55, 1.5, 0, { parent: g }); put(new THREE.BoxGeometry(2.0, 0.12, 1.6), cuerpo, -0.55, 2.02, 0, { parent: g });
  put(new THREE.BoxGeometry(1.5, 0.55, 1.56), vidrio, -0.55, 1.55, 0, { parent: g }); put(new THREE.BoxGeometry(0.1, 0.7, 1.2), cromo, 2.52, 1.0, 0, { parent: g });
  [[1.55, 0.85], [1.55, -0.85], [-1.4, 0.85], [-1.4, -0.85]].forEach(([wx, wz]) => { put(new THREE.CylinderGeometry(0.4, 0.4, 0.28, 12), negro, wx, 0.4, wz, { parent: g, rx: Math.PI / 2 }); put(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 8), cromo, wx, 0.4, wz * 1.01, { parent: g, rx: Math.PI / 2 }); put(new THREE.BoxGeometry(1.0, 0.1, 0.42), cuerpo, wx, 0.82, wz * 1.05, { parent: g }); });
  [0.55, -0.55].forEach((fz) => put(new THREE.SphereGeometry(0.17, 8, 6), MAT('#FFE9B0', { emissive: '#FFD27A', emissiveIntensity: 1 }), 2.5, 1.15, fz, { parent: g }));
  g.position.set(x, terrainH(x, z), z); g.rotation.y = giro; g.scale.setScalar(1.7); scene.add(g); return g; };
if (usa('mori')) {
  const [cx, cz] = xz(231, 64); auto(cx + 2, cz - 5, 0.5, '#1E2B2B'); auto(cx - 5, cz + 4, 2.7, '#5B1A22');
  arbol(cx + 14, cz + 6, 1.5, 1); arbol(cx - 16, cz - 12, 1.2, 2);
  const [mx, mz] = xz(265, 98); const mol = new THREE.Group(); mol.position.set(mx, terrainH(mx, mz), mz); mol.scale.setScalar(1.25); scene.add(mol);
  [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].forEach(([px, pz]) => { const l = put(new THREE.BoxGeometry(0.18, 11, 0.18), MAT('#6B6F73'), px * 1.4, 5.5, pz * 1.4, { parent: mol }); l.rotation.z = -px * 0.09; l.rotation.x = pz * 0.09; });
  for (let i = 0; i < 12; i++) { const h = 1 + i * 0.85; put(new THREE.BoxGeometry(3.2 - i * 0.2, 0.08, 0.08), MAT('#6B6F73'), 0, h, 0, { parent: mol }); put(new THREE.BoxGeometry(0.08, 0.08, 3.2 - i * 0.2), MAT('#6B6F73'), 0, h + 0.4, 0, { parent: mol }); }
  const rueda = new THREE.Group(); rueda.position.set(0, 11.6, 1.5); mol.add(rueda); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; const asp = put(new THREE.BoxGeometry(0.12, 2.6, 0.04), MAT('#7B7F82'), Math.sin(a) * 1.4, Math.cos(a) * 1.4, 0, { parent: rueda, rz: -a }); } put(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 8), MAT('#4A4D50'), 0, 0, 0, { parent: rueda, rx: Math.PI / 2 }); mol.rotation.y = 0.5;
  const [gx, gz] = xz(250, 84); const galpon = new THREE.Group(); galpon.position.set(gx, terrainH(gx, gz), gz); galpon.rotation.y = 0.6; galpon.scale.setScalar(1.3); scene.add(galpon); put(new THREE.BoxGeometry(9, 3.4, 6), MAT('#8A4B33'), 0, 1.7, 0, { parent: galpon }); const t2 = dosAguas(7.4, 2.4, 9.8, MAT('#9AA0A4')); t2.position.set(0, 3.4, 0); galpon.add(t2);
}

// Termas del Daymán (noroeste, 330°): piletas circulares, palmeras y sombrillas
if (usa('termas')) {
  const [cx, cz] = xz(312, 92); const g = new THREE.Group(); g.position.set(cx, terrainH(cx, cz), cz); g.scale.setScalar(1.4); scene.add(g);
  const agua = MAT('#27C4D4', { emissive: '#0F7080', emissiveIntensity: 0.85 }); put(new THREE.CylinderGeometry(15, 15, 0.5, 40), agua, 0, 0.1, 0, { parent: g });
  put(new THREE.TorusGeometry(15, 0.45, 6, 40), MAT('#D49A82'), 0, 0.45, 0, { parent: g, rx: Math.PI / 2 }); put(new THREE.TorusGeometry(8, 0.4, 6, 32), MAT('#D49A82'), 0, 0.5, 0, { parent: g, rx: Math.PI / 2 }); put(new THREE.CylinderGeometry(5.6, 5.6, 0.8, 24), MAT('#7E9A4A'), 0, 0.5, 0, { parent: g });
  const estrella = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 1.6 : 3.4, a = i / 10 * Math.PI * 2; i ? estrella.lineTo(Math.sin(a) * r, Math.cos(a) * r) : estrella.moveTo(Math.sin(a) * r, Math.cos(a) * r); } estrella.closePath(); const est = new THREE.Mesh(new THREE.ShapeGeometry(estrella), MAT('#F2C94C', { emissive: '#7A5A10', emissiveIntensity: 0.4 })); est.rotation.x = -Math.PI / 2; est.position.y = 0.95; g.add(est);
  const palma = (px, pz, hh) => { put(new THREE.CylinderGeometry(0.2, 0.34, hh, 6), MAT('#7A5A3E'), px, hh / 2, pz, { parent: g, rz: rr(-0.12, 0.12) }); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const l = put(new THREE.ConeGeometry(0.28, 3.6, 3), MAT(pick(['#4E7A3A', '#3F6A33', '#5C8A3F'])), px + Math.sin(a) * 1.4, hh + 0.2, pz + Math.cos(a) * 1.4, { parent: g }); l.rotation.set(Math.cos(a) * 1.15, 0, -Math.sin(a) * 1.15); l.scale.set(1, 1, 0.35); } };
  [[-19, -6, 7.5], [-17, 9, 6.4], [19, -9, 7], [21, 5, 6], [2, -21, 7.2], [-6, 20, 6.6]].forEach(([x, z, h]) => palma(x, z, h));
  [['#8F2636', -20, 1], ['#F0E2C8', 17, 14], ['#C29D62', -4, -19], ['#8F2636', 9, 18]].forEach(([col, x, z]) => { put(new THREE.CylinderGeometry(0.07, 0.07, 2.7, 6), MAT('#5A4332'), x, 1.35, z, { parent: g }); put(new THREE.ConeGeometry(1.7, 0.7, 8), MAT(col), x, 2.8, z, { parent: g }); });
  put(new THREE.BoxGeometry(22, 3.2, 5), MAT('#E8D9BE'), 8, 1.6, -29, { parent: g }); const t3 = dosAguas(6, 1.8, 22.8, MAT('#A9553A')); t3.position.set(8, 3.2, -29); g.add(t3);
}

// árboles sueltos para cerrar el horizonte
if (usa('arboles')) { for (let i = 0; i < 46; i++) { const az = rr(0, 360), d = rr(135, 330); const [x, z] = xz(az, d); const cerca = [[0, 56], [88, 105], [180, 60], [231, 64], [250, 84], [265, 98], [312, 86]].some(([a, dd]) => { const [hx, hz] = xz(a, dd); return Math.hypot(x - hx, z - hz) < 38; }); if (!cerca && !(x > 90 && x < 360) && Math.abs(z) > 30) arbol(x, z, rr(0.9, 1.6), i); } }

// ---------- vistas y exportación ----------
window.__view = ({ yaw, pitch, fov, w, h }) => { renderer.setSize(w, h, false); const cam = new THREE.PerspectiveCamera(fov, w / h, 0.3, 6000); cam.position.set(0, EYE, 0); cam.rotation.order = 'YXZ'; cam.rotation.y = -yaw * D2R; cam.rotation.x = pitch * D2R; renderer.render(scene, cam); return renderer.domElement.toDataURL('image/png'); };
window.__ready = true;
