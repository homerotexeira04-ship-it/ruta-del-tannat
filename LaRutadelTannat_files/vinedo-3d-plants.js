/*
 * "Viñedo en el Tiempo" — módulo 2/4: viñedo (vides, postes, pasto entre hileras) y flora nativa.
 * Depende de vinedo-3d-core.js.
 */
(function () {
  'use strict';
  const TV = window.TV, T = TV.T;

  // Une varias geometrías simples en una sola (sombreado plano + color por vértice).
  TV.mergeParts = function (parts) {
    const pos = [], nor = [], col = [], c = new T.Color(), m = new T.Matrix4();
    for (const p of parts) {
      const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
      m.compose(new T.Vector3(...(p.pos || [0, 0, 0])), new T.Quaternion().setFromEuler(new T.Euler(...(p.rot || [0, 0, 0]))), new T.Vector3(...(p.scale || [1, 1, 1])));
      g.applyMatrix4(m); g.computeVertexNormals();
      const n = g.attributes.position.count; c.set(p.color || '#ffffff');
      for (let i = 0; i < n; i++) col.push(c.r, c.g, c.b);
      pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
    }
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    out.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    return out;
  };

  // Aplica a un material (o a su depth-material de sombras) el "crecimiento" de las vides:
  // brotan en oleadas desde el pionero (uProg), maduran (uSize), se cubren de hojas/fruto (uPart) y se mecen.
  function patchVine(mat, u, opt) {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uProg = u.uVineProg; sh.uniforms.uSize = opt.grows === false ? { value: 1 } : u.uVineSize;
      sh.uniforms.uPart = opt.part ? u[opt.part] : { value: 1 }; sh.uniforms.uTime = u.uTime;
      sh.uniforms.uPivotY = { value: opt.pivotY || 0 }; sh.uniforms.uSway = { value: opt.sway || 0 };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aBirth; attribute float aRand; uniform float uProg, uSize, uPart, uTime, uPivotY, uSway;')
        .replace('#include <begin_vertex>', `
          float gr = clamp((uProg - aBirth) * 10.0, 0.0, 1.0); gr = gr * gr * (3.0 - 2.0 * gr);
          vec3 transformed = vec3(position);
          transformed.y -= uPivotY; transformed *= uPart; transformed.y += uPivotY;
          transformed.x += sin(uTime * 1.3 + aRand * 6.2831 + transformed.y * 2.0) * uSway * uPart;
          transformed *= uSize * gr;`);
    };
    return mat;
  }
  function depthFor(u, opt) {
    return patchVine(new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking }), u, opt);
  }

  // ---------- viñedo ----------
  TV.buildVineyard = function (u, Q) {
    const ROWS = Q.rows, PER = Q.plantsPerRow, SP_X = 2.6, SP_Z = 1.3;
    const FIG = { x: 0, z: 1.2 }, group = new T.Group();

    // posiciones de plantas + "fecha de nacimiento" según distancia al pionero
    const plants = [];
    for (let i = -ROWS; i <= ROWS; i++) for (let j = 0; j < PER; j++) plants.push({ x: i * SP_X, z: -j * SP_Z, j, i });
    let dmax = 1; plants.forEach((p) => { p.d = Math.hypot(p.x - FIG.x, p.z - FIG.z); dmax = Math.max(dmax, p.d); });
    const rnd = TV.rng(7);
    const N = plants.length;

    function makeAttrs(geo, births, rands) {
      geo.setAttribute('aBirth', new T.InstancedBufferAttribute(new Float32Array(births), 1));
      geo.setAttribute('aRand', new T.InstancedBufferAttribute(new Float32Array(rands), 1));
    }
    const births = plants.map((p) => 0.9 * p.d / dmax), rands = plants.map(() => rnd());
    const mtx = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), col = new T.Color();
    function fill(mesh, list, jit) {
      list.forEach((p, k) => {
        const s = 0.92 + rnd() * 0.16;
        e.set(0, (rnd() - 0.5) * jit, 0); q.setFromEuler(e);
        mtx.compose(new T.Vector3(p.x + (rnd() - 0.5) * 0.06, 0, p.z + (rnd() - 0.5) * 0.06), q, new T.Vector3(s, s, s));
        mesh.setMatrixAt(k, mtx);
        const b = 0.82 + rnd() * 0.3; mesh.setColorAt(k, col.setRGB(b, b, b));
      });
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    }

    // 1) tronco + cordón + pulgares (madera)
    const woodGeo = TV.mergeParts([
      { geo: new T.CylinderGeometry(0.035, 0.05, 0.9, 5), pos: [0, 0.45, 0], color: '#4a3424' },
      { geo: new T.CylinderGeometry(0.022, 0.024, 1.2, 4), pos: [0, 0.9, 0], rot: [Math.PI / 2, 0, 0], color: '#5a4030' },
      ...[-0.45, -0.22, 0, 0.22, 0.45].map((z) => ({ geo: new T.CylinderGeometry(0.012, 0.018, 0.2, 3), pos: [0, 1.0, z], color: '#5a4030' })),
    ]);
    makeAttrs(woodGeo, births, rands);
    const wood = new T.InstancedMesh(woodGeo, patchVine(new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }), u, {}), N);
    wood.customDepthMaterial = depthFor(u, {}); fill(wood, plants, 0.3);

    // 2) follaje (muro vegetal de 3 masas alargadas)
    const blob = (z, s) => ({ geo: new T.IcosahedronGeometry(0.5, 1), pos: [0, 1.18, z], scale: [0.55 * s, 0.78 * s, 0.62 * s], color: '#ffffff' });
    const leafGeo = TV.mergeParts([blob(-0.42, 0.95), blob(0, 1.05), blob(0.42, 0.95)]);
    makeAttrs(leafGeo, births, rands);
    const leafMat = patchVine(new T.MeshStandardMaterial({ flatShading: true, roughness: 0.85, vertexColors: false, color: '#3f7f2f' }), u, { part: 'uLeaf', pivotY: 1.15, sway: 0.025 });
    const leaves = new T.InstancedMesh(leafGeo, leafMat, N);
    leaves.customDepthMaterial = depthFor(u, { part: 'uLeaf', pivotY: 1.15, sway: 0.025 }); fill(leaves, plants, 0.4);

    // 3) racimos (dos por planta, colgando del cordón)
    const berry = (x, y, z, r) => ({ geo: new T.IcosahedronGeometry(r, 0), pos: [x, y, z], color: '#ffffff' });
    const cluster = (cx, cz) => [berry(cx, 0.82, cz, 0.06), berry(cx + 0.05, 0.78, cz + 0.02, 0.05), berry(cx - 0.05, 0.78, cz - 0.02, 0.05),
      berry(cx + 0.02, 0.72, cz - 0.04, 0.05), berry(cx - 0.03, 0.72, cz + 0.04, 0.05), berry(cx, 0.66, cz, 0.045)];
    const fruitGeo = TV.mergeParts([...cluster(0.11, 0.28), ...cluster(-0.11, -0.22), ...cluster(0.1, -0.05)]);
    makeAttrs(fruitGeo, births, rands);
    const fruitMat = patchVine(new T.MeshStandardMaterial({ flatShading: true, roughness: 0.4, color: '#5a1a3a' }), u, { part: 'uFruit', pivotY: 0.85 });
    const fruit = new T.InstancedMesh(fruitGeo, fruitMat, N);
    fruit.customDepthMaterial = depthFor(u, { part: 'uFruit', pivotY: 0.85 }); fill(fruit, plants, 0.5);

    // 4) postes de espaldera (uno cada 4 plantas)
    const postList = plants.filter((p) => p.j % 4 === 0).map((p) => ({ x: p.x, z: p.z + 0.65, d: p.d }));
    const pGeo = new T.BoxGeometry(0.07, 1.55, 0.07); pGeo.translate(0, 0.775, 0);
    makeAttrs(pGeo, postList.map((p) => 0.9 * p.d / dmax), postList.map(() => rnd()));
    const posts = new T.InstancedMesh(pGeo, patchVine(new T.MeshStandardMaterial({ color: '#7a6650', roughness: 0.9, flatShading: true }), u, {}), postList.length);
    posts.customDepthMaterial = depthFor(u, {});
    postList.forEach((p, k) => { mtx.makeTranslation(p.x, 0, p.z); posts.setMatrixAt(k, mtx); }); posts.instanceMatrix.needsUpdate = true;

    [wood, leaves, fruit, posts].forEach((m) => { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; group.add(m); });

    return {
      group, FIG, layout: { rows: ROWS, per: PER, dmax, spX: SP_X, spZ: SP_Z, fig: [FIG.x, FIG.z] },
      update(s) {
        leaves.visible = s.leaf > 0.02; fruit.visible = s.fruit > 0.02;
        leafMat.color.copy(s.leafCol); fruitMat.color.copy(s.fruitCol);
      },
    };
  };

  // ---------- flora nativa: espinillos, ombúes y monte ribereño ----------
  TV.buildFlora = function (Q) {
    const group = new T.Group(), rnd = TV.rng(31);
    const ico = (r, d) => new T.IcosahedronGeometry(r, d || 1);

    const espinillo = TV.mergeParts([
      { geo: new T.CylinderGeometry(0.1, 0.22, 3.2, 5), pos: [0, 1.6, 0], rot: [0, 0, 0.08], color: '#4a3a2c' },
      { geo: ico(2.2), pos: [0, 3.9, 0], scale: [1.35, 0.42, 1.25], color: '#55702f' },
      { geo: ico(1.6), pos: [1.5, 3.55, 0.6], scale: [1.3, 0.4, 1.1], color: '#4b6529' },
      { geo: ico(1.5), pos: [-1.5, 3.4, -0.7], scale: [1.3, 0.4, 1.1], color: '#5d7a35' },
    ]);
    const ombu = TV.mergeParts([
      { geo: new T.LatheGeometry([[0.01, 0], [2.3, 0], [2.7, 0.7], [1.9, 2.1], [1.15, 3.3], [0.95, 4.2], [0.01, 4.3]].map(([r, y]) => new T.Vector2(r, y)), 9), color: '#6b5a48' },
      { geo: ico(4.6), pos: [0, 7.2, 0], scale: [1.35, 0.8, 1.35], color: '#3f5a2a' },
      { geo: ico(3.4), pos: [4.2, 6.4, 1.2], scale: [1.3, 0.75, 1.2], color: '#456430' },
      { geo: ico(3.5), pos: [-4.0, 6.5, -1.0], scale: [1.3, 0.75, 1.2], color: '#3a5326' },
      { geo: ico(3.0), pos: [0.6, 6.3, -4.2], scale: [1.3, 0.75, 1.2], color: '#4a6a33' },
    ]);
    const monte = TV.mergeParts([
      { geo: ico(3.6), pos: [0, 4.2, 0], scale: [1, 0.95, 1], color: '#2f4a25' },
      { geo: ico(2.6), pos: [2.6, 3.4, 0.8], color: '#385a2b' },
      { geo: ico(2.4), pos: [-2.4, 3.1, -0.6], color: '#294220' },
    ]);
    const mat = () => new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 });

    function scatter(geo, points) {
      const mesh = new T.InstancedMesh(geo, mat(), points.length), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
      points.forEach((p, k) => {
        e.set(0, rnd() * 6.28, 0); q.setFromEuler(e);
        m.compose(new T.Vector3(p.x, TV.terrainH(p.x, p.z), p.z), q, new T.Vector3(p.s, p.s, p.s)); mesh.setMatrixAt(k, m);
      });
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; group.add(mesh);
    }
    const inExclusion = (x, z) => (Math.abs(x) < 26 && z > -78 && z < 14) || (Math.abs(x + 42) < 20 && Math.abs(z + 40) < 16) || (Math.abs(x) < 16 && z > -22);
    const spots = []; let guard = 0;
    while (spots.length < Q.trees && guard++ < 4000) {
      const x = (rnd() - 0.5) * 320, z = -85 + rnd() * 150;
      if (!inExclusion(x, z) && Math.hypot(x, z) > 14) spots.push({ x, z, s: 0.7 + rnd() * 0.6 });
    }
    scatter(espinillo, spots);
    scatter(ombu, [{ x: 27, z: -60, s: 1 }, { x: -62, z: -12, s: 1.1 }, { x: 95, z: -20, s: 0.9 }]);

    const bank = []; guard = 0;
    while (bank.length < Q.monte && guard++ < 4000) {
      const x = (rnd() - 0.5) * 700, z = -92 - rnd() * 10;
      if (Math.abs(x) > 40) bank.push({ x, z, s: 0.7 + rnd() * 0.9 });
    }
    scatter(monte, bank);
    return { group };
  };
})();
