/*
 * "Viñedo en el Tiempo" — módulo 4/4 (parte a): zona termal (piletas, vapor, palmeras),
 * visitantes caminando y sello del Día Nacional del Tannat (medallón, racimo, pétalos de ceibo, destellos).
 * Depende de los módulos anteriores.
 */
(function () {
  'use strict';
  const TV = window.TV, T = TV.T;

  function softSprite() {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  }
  const sprite = softSprite();

  // ---------- zona termal: piletas circulares, vapor y palmeras ----------
  TV.buildThermal = function (u, Q) {
    const group = new T.Group(), rnd = TV.rng(77), centers = [[17, 15], [27, 25], [7, 27]];

    // piletas (disco turquesa + borde de piedra)
    const water = new T.MeshStandardMaterial({ color: '#5fc7c9', roughness: 0.15, metalness: 0.1, emissive: '#1a5a60', emissiveIntensity: 0.55 });
    const rim = new T.MeshStandardMaterial({ color: '#cfc6b4', roughness: 0.9, flatShading: true });
    centers.forEach(([x, z], i) => {
      const r = 4.2 - i * 0.5;
      const ring = new T.Mesh(new T.CylinderGeometry(r + 0.5, r + 0.6, 0.35, 20), rim); ring.position.set(x, 0.17, z); ring.receiveShadow = true; group.add(ring);
      const w = new T.Mesh(new T.CylinderGeometry(r, r, 0.3, 20), water); w.position.set(x, 0.24, z); group.add(w);
    });

    // vapor: partículas que suben, se ensanchan y se disuelven
    const N = Q.steam, pos = new Float32Array(N * 3), ph = new Float32Array(N), seed = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const [cx, cz] = centers[i % centers.length], a = rnd() * 6.283, r = Math.sqrt(rnd()) * 3.4;
      pos.set([cx + Math.cos(a) * r, 0.5, cz + Math.sin(a) * r], i * 3); ph[i] = rnd(); seed.set([rnd(), rnd(), rnd()], i * 3);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aPhase', new T.BufferAttribute(ph, 1)); g.setAttribute('aSeed', new T.BufferAttribute(seed, 3));
    const steamMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: u.uTime, uPx: u.uPx, uMap: { value: sprite }, uCol: { value: new T.Color('#f4ecea') } },
      vertexShader: `attribute float aPhase; attribute vec3 aSeed; uniform float uTime, uPx; varying float vA;
        void main(){
          float t = fract(uTime * 0.07 * (0.7 + aSeed.y * 0.6) + aPhase);
          vec3 p = position; p.y += t * 9.0;
          p.x += (sin(uTime * 0.5 + aSeed.x * 6.283) * 0.6 + 1.7 * t) * (0.5 + aSeed.z);
          p.z += cos(uTime * 0.4 + aSeed.z * 6.283) * 0.6 * t;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = mix(2.2, 7.5, t) * (0.6 + aSeed.y * 0.8) * uPx / -mv.z;
          vA = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.5, 1.0, t)) * 0.5;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `uniform sampler2D uMap; uniform vec3 uCol; varying float vA;
        void main(){ float a = texture2D(uMap, gl_PointCoord).a * vA; gl_FragColor = vec4(uCol, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const steam = new T.Points(g, steamMat); steam.frustumCulled = false; group.add(steam);

    // palmeras (tronco curvo + frondas en arco)
    function frond(len) {
      const seg = 6, v = [], idx = [];
      for (let s = 0; s <= seg; s++) {
        const t = s / seg, y = len * (0.5 * t - 0.62 * t * t), z = t * len, w = 0.5 * Math.sin(Math.PI * (0.12 + 0.88 * t)) * (1 - t * 0.35);
        v.push(-w, y, z, w, y, z);
      }
      for (let s = 0; s < seg; s++) { const a = s * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(v, 3)); geo.setIndex(idx); return geo;
    }
    const parts = [];
    for (let i = 0; i < 6; i++) parts.push({ geo: new T.CylinderGeometry(0.2 - i * 0.012, 0.24 - i * 0.012, 1.4, 6), pos: [Math.sin(i * 0.3) * 0.25 * (i / 5) * 3, 0.7 + i * 1.32, 0], rot: [0, 0, -0.08 * i * 0.4], color: i % 2 ? '#7a6a55' : '#6a5a48' });
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * 6.283 + rnd() * 0.3;
      parts.push({ geo: frond(3.4 + rnd() * 0.8), pos: [0.6, 8.2, 0], rot: [0.15 + rnd() * 0.25, a, 0], color: k % 2 ? '#3f6f38' : '#4d8040' });
    }
    const palmGeo = TV.mergeParts(parts);
    const palmMat = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9, side: T.DoubleSide });
    const palmSpots = [[10, 10], [24, 8], [33, 18], [34, 32], [15, 22], [21, 36], [2, 20], [-4, 30]];
    const palms = new T.InstancedMesh(palmGeo, palmMat, palmSpots.length), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
    palmSpots.forEach(([x, z], k) => { e.set(0, rnd() * 6.28, 0); q.setFromEuler(e); const s = 0.8 + rnd() * 0.5; m.compose(new T.Vector3(x, 0, z), q, new T.Vector3(s, s, s)); palms.setMatrixAt(k, m); });
    palms.castShadow = true; palms.receiveShadow = true; palms.frustumCulled = false; group.add(palms);

    return { group, update(s) { steamMat.uniforms.uCol.value.copy(s.steamCol); } };
  };

  // ---------- visitantes (siluetas que caminan por las calles del viñedo) ----------
  TV.buildVisitors = function (Q) {
    const group = new T.Group(), rnd = TV.rng(9), N = Q.visitors;
    const jackets = ['#7a2a3a', '#2f4a6a', '#c9963a', '#3a5a48', '#5a3a2a', '#6a5a7a'], skin = ['#c8a07a', '#a87a56', '#e0b894', '#8a5e40'];
    const person = (j, s) => TV.mergeParts([
      { geo: new T.CylinderGeometry(0.06, 0.05, 0.85, 5), pos: [-0.08, 0.42, 0], color: '#2a2a34' },
      { geo: new T.CylinderGeometry(0.06, 0.05, 0.85, 5), pos: [0.08, 0.42, 0], color: '#2a2a34' },
      { geo: new T.CylinderGeometry(0.16, 0.19, 0.62, 6), pos: [0, 1.15, 0], color: j },
      { geo: new T.CylinderGeometry(0.035, 0.03, 0.55, 4), pos: [-0.22, 1.12, 0], rot: [0, 0, 0.1], color: j },
      { geo: new T.CylinderGeometry(0.035, 0.03, 0.55, 4), pos: [0.22, 1.12, 0], rot: [0, 0, -0.1], color: j },
      { geo: new T.IcosahedronGeometry(0.105, 1), pos: [0, 1.62, 0], color: s },
      { geo: new T.IcosahedronGeometry(0.11, 1), pos: [0, 1.68, 0.01], scale: [1, 0.55, 1], color: '#3a2a22' },
    ]);
    const list = [];
    for (let i = 0; i < N; i++) {
      const mesh = new T.Mesh(person(jackets[i % jackets.length], skin[i % skin.length]), new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 }));
      mesh.castShadow = true; group.add(mesh);
      list.push({ mesh, x: (((i * 5) % 12) - 6 + 0.5) * 2.6, z0: -6 - rnd() * 40, speed: 0.55 + rnd() * 0.35, ph: rnd() * 6, dir: i % 2 ? 1 : -1 });
    }
    return {
      group,
      update(t) {
        list.forEach((p) => {
          const span = 46, k = (t * p.speed / span + p.ph) % 2, f = k < 1 ? k : 2 - k; // ida y vuelta
          const z = p.z0 + (f - 0.5) * span * 0.5 * p.dir;
          p.mesh.position.set(p.x, Math.abs(Math.sin(t * p.speed * 5 + p.ph)) * 0.035, z);
          p.mesh.rotation.y = (k < 1 ? 1 : -1) * p.dir > 0 ? Math.PI : 0;
        });
      },
    };
  };

  // ---------- sello del Día Nacional del Tannat (14 de abril · 2016) ----------
  function medallionTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, '#6b1f34'); gr.addColorStop(1, '#2a0a14');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#d9b463'; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 116, 0, 6.283); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(128, 128, 104, 0, 6.283); g.stroke();
    g.fillStyle = '#e8c878'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 66px Georgia, serif'; g.fillText('14·IV', 128, 112);
    g.font = 'bold 26px Georgia, serif'; g.fillText('TANNAT', 128, 168);
    g.font = '18px Georgia, serif'; g.fillText('★ 2016 ★', 128, 200);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  }

  TV.buildSeal = function (u, env, Q) {
    const group = new T.Group(), rnd = TV.rng(14);
    group.position.set(0.7, 1.25, 2.9);
    // medallón
    const gold = new T.MeshStandardMaterial({ color: '#d9b463', metalness: 0.95, roughness: 0.3, envMap: env, envMapIntensity: 1.4 });
    const face = new T.MeshStandardMaterial({ map: medallionTexture(), metalness: 0.5, roughness: 0.4, envMap: env });
    const coin = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 0.05, 40), [gold, face, gold]); coin.rotation.x = Math.PI / 2; coin.castShadow = true;
    const ring = new T.Mesh(new T.TorusGeometry(0.42, 0.03, 8, 40), gold); ring.castShadow = true;
    const seal = new T.Group(); seal.add(coin, ring); seal.position.set(0, 0.08, -0.15); group.add(seal);
    // racimo iluminado
    const bMat = new T.MeshStandardMaterial({ color: '#3a1030', roughness: 0.22, metalness: 0.15, envMap: env, envMapIntensity: 1.1, flatShading: true });
    const cluster = new T.Group(); group.add(cluster);
    for (let i = 0; i < 26; i++) {
      const t = i / 26, r = 0.16 * (1 - t * 0.8), a = i * 2.4, b = new T.Mesh(new T.IcosahedronGeometry(0.075 - t * 0.02, 1), bMat);
      b.position.set(Math.cos(a) * r, -t * 0.42, Math.sin(a) * r); b.castShadow = true; cluster.add(b);
    }
    cluster.position.set(0, -0.34, 0.12);
    const light = new T.PointLight('#ffd08a', 0, 5, 1.6); light.position.set(0.3, 0.5, 0.9); group.add(light);
    // pétalos de ceibo (la flor nacional) girando alrededor
    const pGeo = new T.PlaneGeometry(0.05, 0.08, 1, 2); const pp = pGeo.attributes.position;
    for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.pow(Math.abs(pp.getX(i)) * 9, 2) * 0.012 + (pp.getY(i) > 0 ? 0.01 : 0));
    pGeo.computeVertexNormals();
    const pMat = new T.MeshStandardMaterial({ color: '#c4152b', side: T.DoubleSide, roughness: 0.6, emissive: '#5a0610', emissiveIntensity: 0.5 });
    const petals = new T.InstancedMesh(pGeo, pMat, Q.petals); petals.frustumCulled = false; group.add(petals);
    const pd = Array.from({ length: Q.petals }, () => ({ a: rnd() * 6.283, r: 0.5 + rnd() * 1.6, sp: 0.25 + rnd() * 0.5, h: rnd() * 2.4, fs: 0.2 + rnd() * 0.25, rot: rnd() * 6 }));
    const col = new T.Color();
    for (let i = 0; i < Q.petals; i++) petals.setColorAt(i, col.set(rnd() > 0.35 ? '#c4152b' : '#e2333f'));
    // destellos dorados
    const sN = Q.sparks, sPos = new Float32Array(sN * 3), sSeed = new Float32Array(sN * 3);
    for (let i = 0; i < sN; i++) { sPos.set([(rnd() - 0.5) * 1.6, (rnd() - 0.4) * 1.5, (rnd() - 0.5) * 1.2], i * 3); sSeed.set([rnd(), rnd(), rnd()], i * 3); }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sPos, 3)); sg.setAttribute('aSeed', new T.BufferAttribute(sSeed, 3));
    const sMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uTime: u.uTime, uPx: u.uPx, uMap: { value: sprite } },
      vertexShader: `attribute vec3 aSeed; uniform float uTime, uPx; varying float vA;
        void main(){ vec4 mv = modelViewMatrix * vec4(position + vec3(0.0, sin(uTime*0.6+aSeed.x*6.283)*0.05, 0.0), 1.0);
          float tw = 0.5 + 0.5 * sin(uTime * (1.5 + aSeed.y * 2.5) + aSeed.z * 6.283); vA = pow(tw, 3.0);
          gl_PointSize = (0.05 + aSeed.y * 0.06) * uPx / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D uMap; varying float vA; void main(){ float a = texture2D(uMap, gl_PointCoord).a * vA; gl_FragColor = vec4(1.0, 0.82, 0.45, 1.0) * a;
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`,
    });
    const sparks = new T.Points(sg, sMat); sparks.frustumCulled = false; group.add(sparks);

    const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), pv = new T.Vector3(), sc = new T.Vector3(1, 1, 1);
    return {
      group,
      update(t, vis) {
        seal.rotation.y = Math.sin(t * 0.5) * 0.5; seal.position.y = 0.08 + Math.sin(t * 0.9) * 0.025;
        cluster.rotation.y = t * 0.35; cluster.position.y = -0.34 + Math.sin(t * 0.9 + 1) * 0.02;
        light.intensity = 7 * vis;
        for (let i = 0; i < pd.length; i++) {
          const p = pd[i], a = p.a + t * p.sp, hh = ((p.h + t * p.fs) % 2.4) - 0.7;
          pv.set(Math.cos(a) * p.r, hh, Math.sin(a) * p.r * 0.7);
          e.set(t * 0.8 + p.rot, a, t * 0.6 + p.rot); q.setFromEuler(e); m.compose(pv, q, sc); petals.setMatrixAt(i, m);
        }
        petals.instanceMatrix.needsUpdate = true;
      },
    };
  };
})();
