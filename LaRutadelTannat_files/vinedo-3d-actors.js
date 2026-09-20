/*
 * "Viñedo en el Tiempo" — módulo 3/4: figura escultórica de Pascual Harriague, estancia/saladero y barco.
 * La figura es una estilización low-poly en bronce (sin rasgos realistas), no un retrato.
 * Depende de vinedo-3d-core.js y vinedo-3d-plants.js.
 */
(function () {
  'use strict';
  const TV = window.TV, T = TV.T;

  // Orienta y estira un cilindro unitario (eje Y, alto 1) entre dos puntos.
  function limb(mesh, a, b) {
    const dir = new T.Vector3().subVectors(b, a), len = dir.length();
    mesh.position.copy(a).addScaledVector(dir, 0.5); mesh.scale.set(1, len, 1);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
  }
  // IK de dos huesos: devuelve la posición del codo para que la mano llegue a "target".
  function elbowFor(shoulder, target, l1, l2, bend) {
    const d = new T.Vector3().subVectors(target, shoulder), dist = TV.clamp(d.length(), 0.05, l1 + l2 - 0.001);
    const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
    const mid = shoulder.clone().addScaledVector(d.normalize(), a);
    return mid.addScaledVector(bend, h);
  }

  function plaqueTexture(text) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#3a2c1a'; g.fillRect(0, 0, 256, 128);
    g.strokeStyle = '#c9a24e'; g.lineWidth = 5; g.strokeRect(8, 8, 240, 112);
    g.fillStyle = '#e2bf6a'; g.font = 'bold 74px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 68);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  }

  // ---------- Pascual Harriague (figura de bronce) ----------
  TV.buildFigure = function (u, env) {
    const g = new T.Group(), P = (x, y, z) => new T.Vector3(x, y, z);
    const bronze = new T.MeshStandardMaterial({ color: '#b8863f', metalness: 1.0, roughness: 0.34, flatShading: true, envMap: env, envMapIntensity: 2.4 });
    const cloth = bronze.clone();
    cloth.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = u.uTime;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float k = smoothstep(1.05, 0.55, position.y);
          transformed.xz += normalize(position.xz + vec2(1e-4)) * sin(uTime * 1.5 + position.x * 9.0 + position.z * 7.0) * 0.014 * k;`);
    };
    const mesh = (geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat || bronze); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };

    // base de basalto + placa "1874"
    const stone = new T.MeshStandardMaterial({ color: '#2f2b2a', roughness: 0.9, flatShading: true });
    const base = new T.Mesh(new T.BoxGeometry(1.15, 0.16, 0.95), stone); base.position.y = 0.08; base.castShadow = base.receiveShadow = true; g.add(base);
    const plaque = new T.Mesh(new T.PlaneGeometry(0.5, 0.2), new T.MeshStandardMaterial({ map: plaqueTexture('1874'), metalness: 0.7, roughness: 0.45, envMap: env }));
    plaque.position.set(0, 0.085, 0.4775); g.add(plaque);

    const Y0 = 0.16; // altura de la base
    // botas y piernas (solo se ven las canillas bajo la levita)
    for (const s of [-1, 1]) {
      mesh(new T.CylinderGeometry(0.085, 0.068, 0.5, 6), bronze, s * 0.12, Y0 + 0.27, 0);
      mesh(new T.BoxGeometry(0.15, 0.1, 0.34), bronze, s * 0.12, Y0 + 0.05, -0.05);
    }
    // levita larga: hombros caídos, cintura marcada y falda que se abre (con vaivén de tela)
    const prof = [[0.37, 0.42], [0.345, 0.6], [0.295, 0.85], [0.235, 1.05], [0.25, 1.22], [0.275, 1.38], [0.225, 1.5], [0.09, 1.56], [0.01, 1.575]].map(([r, y]) => new T.Vector2(r, y));
    const coat = new T.Mesh(new T.LatheGeometry(prof, 12), cloth); coat.scale.set(1, 1, 0.72); coat.position.y = Y0;
    coat.castShadow = coat.receiveShadow = true; g.add(coat);
    // pajarita (rasgo del retrato histórico) y solapas
    for (const s of [-1, 1]) { const w = mesh(new T.ConeGeometry(0.05, 0.1, 4), bronze, s * 0.06, Y0 + 1.49, -0.17); w.rotation.z = -s * Math.PI / 2; }
    mesh(new T.IcosahedronGeometry(0.03, 0), bronze, 0, Y0 + 1.49, -0.17);
    // cabeza estilizada: cráneo, cabello y barba llena (sin rasgos)
    mesh(new T.CylinderGeometry(0.07, 0.085, 0.1, 6), bronze, 0, Y0 + 1.6, 0);
    const head = mesh(new T.IcosahedronGeometry(0.14, 1), bronze, 0, Y0 + 1.75, 0); head.scale.set(0.9, 1.1, 1);
    const hair = mesh(new T.IcosahedronGeometry(0.15, 1), bronze, 0, Y0 + 1.8, 0.02); hair.scale.set(1, 0.6, 1.05);
    const beard = mesh(new T.IcosahedronGeometry(0.125, 1), bronze, 0, Y0 + 1.66, -0.075); beard.scale.set(0.98, 1.25, 0.85);
    const ears = [-1, 1].map((s) => mesh(new T.IcosahedronGeometry(0.045, 0), bronze, s * 0.125, Y0 + 1.74, 0.01));
    [head, hair, beard, ...ears].forEach((m) => { m.rotation.x = -0.08; });
    // hombros
    for (const s of [-1, 1]) mesh(new T.IcosahedronGeometry(0.1, 1), bronze, s * 0.265, Y0 + 1.44, 0);

    // brazos por IK: el izquierdo (x<0) toca la planta joven; el derecho descansa en la cintura
    const armMat = bronze, up = new T.CylinderGeometry(0.06, 0.052, 1, 6), lo = new T.CylinderGeometry(0.052, 0.04, 1, 6);
    function arm(shoulder, hand, bend) {
      const el = elbowFor(shoulder, hand, 0.31, 0.29, bend);
      const a = new T.Mesh(up, armMat), b = new T.Mesh(lo, armMat), h = new T.Mesh(new T.IcosahedronGeometry(0.06, 0), armMat);
      limb(a, shoulder, el); limb(b, el, hand); h.position.copy(hand);
      [a, b, h].forEach((m) => { m.castShadow = true; g.add(m); });
    }
    arm(P(-0.265, Y0 + 1.42, 0), P(-0.4, Y0 + 0.95, -0.36), P(-0.5, -0.3, 0.6).normalize());
    arm(P(0.265, Y0 + 1.42, 0), P(0.33, Y0 + 1.0, -0.06), P(0.8, -0.2, 0.5).normalize());

    // planta joven que toca (estaca + brote con hojas)
    const sap = new T.Group(); sap.position.set(-0.4, Y0, -0.38); g.add(sap);
    const stake = new T.Mesh(new T.CylinderGeometry(0.014, 0.018, 0.95, 5), new T.MeshStandardMaterial({ color: '#7a6650', roughness: 0.9 })); stake.position.y = 0.475; sap.add(stake);
    const cane = new T.Mesh(new T.CylinderGeometry(0.008, 0.014, 0.8, 4), new T.MeshStandardMaterial({ color: '#5a4030', roughness: 0.9 })); cane.position.set(0.012, 0.42, 0); sap.add(cane);
    const leafMat = new T.MeshStandardMaterial({ color: '#7fb23f', flatShading: true, roughness: 0.8, side: T.DoubleSide });
    const leaves = new T.Group(); sap.add(leaves);
    for (let i = 0; i < 6; i++) {
      const l = new T.Mesh(new T.IcosahedronGeometry(0.075, 0), leafMat); l.scale.set(1, 0.32, 1.15);
      const a = i * 2.4, y = 0.28 + i * 0.1; l.position.set(Math.cos(a) * 0.08, y, Math.sin(a) * 0.08); l.rotation.set(0.5, a, 0.3); l.castShadow = true; leaves.add(l);
    }

    // mirada al horizonte: cabeza levemente elevada
    g.userData = { bronze, leafMat, leaves };
    return {
      group: g,
      update(s) {
        bronze.color.copy(s.bronzeCol); cloth.color.copy(s.bronzeCol);
        leafMat.color.copy(s.leafCol); leaves.scale.setScalar(Math.max(s.leaf, 0.0001));
        leaves.visible = s.leaf > 0.03;
      },
    };
  };

  // ---------- estancia / saladero rioplatense (siluetas simples, nunca torres ni castillos) ----------
  TV.buildEstancia = function () {
    const g = new T.Group(), rnd = TV.rng(5);
    const wall = new T.MeshStandardMaterial({ color: '#ece2cb', roughness: 0.95, flatShading: true });
    const roof = new T.MeshStandardMaterial({ color: '#9a4a30', roughness: 0.8, flatShading: true });
    const tin = new T.MeshStandardMaterial({ color: '#8b9096', roughness: 0.55, metalness: 0.4, flatShading: true });
    const wood = new T.MeshStandardMaterial({ color: '#5a4636', roughness: 0.9, flatShading: true });
    const dark = new T.MeshStandardMaterial({ color: '#33261f', roughness: 0.9 });
    const add = (geo, mat, x, y, z, ry) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.castShadow = m.receiveShadow = true; g.add(m); return m; };

    // techo a dos aguas de baja pendiente
    function gable(len, wid, hgt, mat, x, y, z) {
      const s = new T.Shape(); s.moveTo(-wid / 2, 0); s.lineTo(wid / 2, 0); s.lineTo(0, hgt); s.closePath();
      const geo = new T.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); geo.translate(0, 0, -len / 2); geo.rotateY(Math.PI / 2);
      return add(geo, mat, x, y, z);
    }
    add(new T.BoxGeometry(18, 3.2, 7), wall, 0, 1.6, 0);
    gable(19.6, 8.8, 1.7, roof, 0, 3.2, 0);
    // galería con columnas simples
    add(new T.BoxGeometry(18.6, 0.2, 3.2), wall, 0, 0.1, 5.1);
    const gal = new T.Mesh(new T.BoxGeometry(19, 0.16, 3.6), roof); gal.position.set(0, 3.05, 5.3); gal.rotation.x = 0.1; gal.castShadow = true; g.add(gal);
    for (let i = 0; i < 9; i++) add(new T.BoxGeometry(0.3, 2.95, 0.3), wall, -8.6 + i * 2.15, 1.6, 6.5);
    // puertas y ventanas con postigos
    for (let i = 0; i < 5; i++) { add(new T.BoxGeometry(1.3, 2.2, 0.08), dark, -7 + i * 3.5, 1.2, 3.55); add(new T.BoxGeometry(0.42, 2.2, 0.06), new T.MeshStandardMaterial({ color: '#3f5a4a' }), -7 + i * 3.5 - 0.95, 1.2, 3.56); add(new T.BoxGeometry(0.42, 2.2, 0.06), new T.MeshStandardMaterial({ color: '#3f5a4a' }), -7 + i * 3.5 + 0.95, 1.2, 3.56); }
    // galpón de chapa + chimenea del saladero
    add(new T.BoxGeometry(11, 2.6, 6), wall, 15, 1.3, -2, 0);
    gable(12, 6.8, 1.2, tin, 15, 2.6, -2);
    add(new T.CylinderGeometry(0.55, 0.85, 8.5, 6), new T.MeshStandardMaterial({ color: '#8a4a36', roughness: 0.95, flatShading: true }), -12, 4.2, -3.5);
    add(new T.CylinderGeometry(0.75, 0.55, 0.5, 6), dark, -12, 8.6, -3.5);
    // corral y ganado
    for (let i = 0; i <= 14; i++) { add(new T.BoxGeometry(0.16, 1.5, 0.16), wood, -11 + i * 1.6, 0.75, 16); }
    for (let k = 0; k < 2; k++) add(new T.BoxGeometry(22.4, 0.12, 0.1), wood, 0.4, 0.55 + k * 0.5, 16);
    const cowCols = ['#6b4a34', '#e8e0d0', '#2e2622', '#8a5a3a'];
    for (let i = 0; i < 7; i++) {
      const cow = new T.Group(), cm = new T.MeshStandardMaterial({ color: cowCols[i % 4], roughness: 0.95, flatShading: true });
      const b = new T.Mesh(new T.BoxGeometry(1.9, 0.95, 0.75), cm); b.position.y = 1.05; cow.add(b);
      const h = new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.45), cm); h.position.set(1.15, 1.2, 0); cow.add(h);
      for (const lx of [-0.7, 0.7]) for (const lz of [-0.25, 0.25]) { const l = new T.Mesh(new T.BoxGeometry(0.16, 0.7, 0.16), cm); l.position.set(lx, 0.35, lz); cow.add(l); }
      cow.children.forEach((m) => { m.castShadow = true; });
      cow.position.set(-9 + rnd() * 18, 0, 19 + rnd() * 9); cow.rotation.y = rnd() * 6.28; g.add(cow);
    }
    return { group: g };
  };

  // ---------- barco de vela sobre el río (1838) ----------
  TV.buildShip = function () {
    const g = new T.Group(), hull = new T.MeshStandardMaterial({ color: '#2b2320', roughness: 0.85, flatShading: true });
    const sailM = new T.MeshStandardMaterial({ color: '#efe6d2', roughness: 0.9, flatShading: true, side: T.DoubleSide });
    const woodM = new T.MeshStandardMaterial({ color: '#5a4636', roughness: 0.9, flatShading: true });
    const body = TV.mergeParts([
      { geo: new T.BoxGeometry(4.2, 1.6, 11), pos: [0, 0.4, 0], color: '#3a2a20' },
      { geo: new T.ConeGeometry(2.95, 4.5, 4), pos: [0, 0.4, 7.7], rot: [Math.PI / 2, 0, Math.PI / 4], scale: [0.7, 1, 0.55], color: '#2b2320' },
      { geo: new T.BoxGeometry(4.4, 1.2, 3), pos: [0, 1.7, -4], color: '#4a3a30' },
      { geo: new T.BoxGeometry(4.3, 0.18, 11.6), pos: [0, 1.25, 0.2], color: '#6b5440' },
      { geo: new T.BoxGeometry(4.28, 0.22, 10.6), pos: [0, 0.95, 0], color: '#cdb98a' },
    ]);
    const hullMesh = new T.Mesh(body, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true })); hullMesh.castShadow = true; g.add(hullMesh);
    [[-2.5, 15], [2.2, 17], [6.2, 12]].forEach(([z, h], i) => {
      const mast = new T.Mesh(new T.CylinderGeometry(0.13, 0.2, h, 5), woodM); mast.position.set(0, 1.2 + h / 2, z); mast.castShadow = true; g.add(mast);
      for (let k = 0; k < 3; k++) {
        const w = 6.4 - k * 1.3, s = new T.Mesh(new T.PlaneGeometry(w, 3.6 - k * 0.3, 1, 1), sailM);
        s.position.set(0, 2.6 + h * 0.3 + k * 3.7, z + 0.08); s.castShadow = true; g.add(s);
      }
    });
    g.scale.setScalar(1.7);
    return { group: g };
  };
})();
