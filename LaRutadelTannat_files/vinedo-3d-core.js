/*
 * "Viñedo en el Tiempo" — módulo 1/4: utilidades, etapas y paisaje (cielo, terreno, río).
 * Escena 3D ilustrativa (recreación simbólica, no reconstrucción histórica).
 * Requiere three.min.js (three.js r186, MIT) cargado antes. Autoría de la implementación: Homero Texeira.
 * Unidades: 1 unidad = 1 metro. Eje -Z = hacia el río Uruguay.
 */
(function () {
  'use strict';
  const T = window.THREE;
  const TV = (window.TV = { T });

  // ---------- utilidades ----------
  TV.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  TV.lerp = (a, b, t) => a + (b - a) * t;
  TV.smoothstep = (a, b, x) => { const t = TV.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  TV.rad = (d) => (d * Math.PI) / 180;

  // Ruido de valor 2D determinista (no depende de Math.random => el paisaje es siempre el mismo)
  function hash2(ix, iz) {
    let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function vnoise(x, z) {
    const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
    const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
    return TV.lerp(TV.lerp(a, b, ux), TV.lerp(c, d, ux), uz);
  }
  TV.fbm = (x, z) => vnoise(x, z) * 0.55 + vnoise(x * 2.03 + 7.1, z * 2.03 + 3.7) * 0.3 + vnoise(x * 4.1 + 1.3, z * 4.1 + 9.2) * 0.15;
  TV.hash2 = hash2;

  // PRNG con semilla (mulberry32) para dispersar árboles, piedras, etc. siempre igual
  TV.rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // ---------- etapas: los 6 hitos reales de "El Pionero" + el presente ----------
  // Cada etapa define luz, cielo, clima y estado de la vid. La escena interpola entre etapas contiguas.
  // Ciclo de la vid a lo largo de la historia: brotación (1874) → maduración (1894) → vendimia (2016) → poda (hoy).
  TV.STAGES = [
    { // 1819 · amanecer sobre la tierra basáltica, todavía sin viñedo
      cam: { p: [-46, 22, 98], t: [0, 3, -60], fov: 46 },
      sky: ['#6f8fbf', '#e2b4a8', '#f7cfa6'], sun: { az: 20, el: 7, col: '#ffb48a', int: 1.5 },
      hemi: ['#b0bedb', '#a88468', 1.35], fog: ['#efcdb0', 90, 900], water: ['#3c5a72', '#8fb0c0'],
      grass: '#a2bf68', bronze: '#c08a3e', vine: { prog: 0, size: 0, leaf: 0, leafCol: '#7fb23f', fruit: 0, fruitCol: '#5a7a3a' },
    },
    { // 1838 · llegada por el río/mar, mañana nublada
      cam: { p: [54, 9, -60], t: [6, 5, -122], fov: 40 },
      sky: ['#6784a6', '#a9bccb', '#cdd8de'], sun: { az: -30, el: 22, col: '#f3e6d4', int: 1.0 },
      hemi: ['#b4c6d8', '#8a8070', 1.3], fog: ['#c4d0d6', 90, 900], water: ['#2f4a5c', '#7fa0b0'],
      grass: '#93b06c', bronze: '#c08a3e', vine: { prog: 0, size: 0, leaf: 0, leafCol: '#7fb23f', fruit: 0, fruitCol: '#5a7a3a' },
    },
    { // 1860 · mediodía sobre el saladero / estancia, a orillas del río
      cam: { p: [16, 9, -4], t: [-34, 2.5, -46], fov: 44 },
      sky: ['#3f7fc6', '#8fbfe4', '#d7e8f0'], sun: { az: -50, el: 52, col: '#fff1d6', int: 2.4 },
      hemi: ['#c0dcf2', '#9a8462', 1.25], fog: ['#d2e3ec', 90, 900], water: ['#24506e', '#7fb0c8'],
      grass: '#98bb5a', bronze: '#c08a3e', vine: { prog: 0, size: 0, leaf: 0, leafCol: '#7fb23f', fruit: 0, fruitCol: '#5a7a3a' },
    },
    { // 1874 · atardecer dorado, brotación: las primeras cepas
      cam: { p: [-4.2, 1.75, 7.4], t: [0.2, 1.15, 0.9], fov: 38 },
      sky: ['#35578a', '#e6995c', '#f8c27e'], sun: { az: -75, el: 14, col: '#ffb35e', int: 2.8 },
      hemi: ['#a4b8dc', '#b57c56', 1.35], fog: ['#f0c088', 90, 900], water: ['#41506a', '#e8b27a'],
      grass: '#93c452', bronze: '#c99a48', vine: { prog: 0.16, size: 0.45, leaf: 0.55, leafCol: '#7fb23f', fruit: 0, fruitCol: '#5a7a3a' },
    },
    { // 1894 · pleno verano (12 de enero, verano austral): maduración
      cam: { p: [-15, 9, 24], t: [2, 1.2, -18], fov: 44 },
      sky: ['#3a82c8', '#8ec2e6', '#efdcb6'], sun: { az: -40, el: 34, col: '#ffe2b0', int: 2.6 },
      hemi: ['#bcd8f4', '#a08650', 1.3], fog: ['#e8dcc0', 90, 900], water: ['#245a78', '#8cc0d0'],
      grass: '#b0b256', bronze: '#b98a40', vine: { prog: 0.85, size: 1, leaf: 1, leafCol: '#3f7f2f', fruit: 0.9, fruitCol: '#5a1a3a' },
    },
    { // 2016 · otoño (14 de abril): vendimia terminando, follaje ocre, sello del Día Nacional del Tannat
      cam: { p: [1.5, 1.5, 9.2], t: [0.6, 1.35, 2.6], fov: 34 },
      sky: ['#263760', '#c9647a', '#f39a63'], sun: { az: -95, el: 9, col: '#ff8f5a', int: 2.4 },
      hemi: ['#94a4d0', '#b0705a', 1.55], fog: ['#dc9a80', 90, 900], water: ['#2c3558', '#e58a66'],
      grass: '#c2a25a', bronze: '#a8843f', vine: { prog: 1, size: 1, leaf: 0.85, leafCol: '#c98a2b', fruit: 0.5, fruitCol: '#2a0d20' },
    },
    { // Hoy · invierno, poda, vapor termal, atardecer sobre el valle del río Uruguay
      cam: { p: [-46, 27, 72], t: [-4, 0, -30], fov: 46 },
      sky: ['#27395f', '#b76f8a', '#f5a862'], sun: { az: 70, el: 14, col: '#ffa568', int: 2.6 },
      hemi: ['#a4b6dc', '#b88472', 1.85], fog: ['#e2a58a', 90, 900], water: ['#2c3a5e', '#f0a074'],
      grass: '#86a464', bronze: '#7f8a63', vine: { prog: 1, size: 1, leaf: 0, leafCol: '#8a7040', fruit: 0, fruitCol: '#2a0d20' },
    },
  ];

  // ---------- altura del terreno ----------
  // Meseta plana y rojiza (viñedo) → barranca → río Uruguay → costa lejana con lomas.
  TV.RIVER_Y = -2.6;
  TV.terrainH = function (x, z) {
    const d = Math.hypot(x / 75, (z + 30) / 85);
    const flat = TV.smoothstep(0.9, 1.9, d);
    let h = (TV.fbm(x * 0.006 + 10, z * 0.006) * 11 + TV.fbm(x * 0.02, z * 0.02) * 1.4 - 4) * flat;
    const bank = TV.smoothstep(0, 1, TV.clamp((-88 - z) / 26, 0, 1));
    h = TV.lerp(h, -3.6, bank);
    const far = TV.smoothstep(0, 1, TV.clamp((-335 - z) / 90, 0, 1));
    h += far * (9 + TV.fbm(x * 0.012 + 3, z * 0.012) * 26);
    return h;
  };

  // ---------- texturas procedurales (suelo basáltico rojizo y pasto) ----------
  function speckleTexture(base, palette, count, rockCol, rockCount, seed) {
    const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
    const g = c.getContext('2d'), rnd = TV.rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    const stamp = (x, y, w, h) => { for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) g.fillRect(x + ox, y + oy, w, h); };
    for (let i = 0; i < count; i++) {
      g.globalAlpha = 0.12 + rnd() * 0.3; g.fillStyle = palette[(rnd() * palette.length) | 0];
      stamp(rnd() * s, rnd() * s, 1 + rnd() * 3, 1 + rnd() * 2);
    }
    g.globalAlpha = 0.85; g.fillStyle = rockCol;
    for (let i = 0; i < rockCount; i++) stamp(rnd() * s, rnd() * s, 2 + rnd() * 3, 2 + rnd() * 2);
    g.globalAlpha = 1;
    const tex = new T.CanvasTexture(c);
    tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    return tex;
  }
  TV.soilTex = () => speckleTexture('#96482c', ['#6d301d', '#b96a44', '#7e3a24', '#a8593a'], 7000, '#2d2826', 70, 11);
  TV.grassTex = () => speckleTexture('#5f7a34', ['#7a9440', '#4a6228', '#8a8f45', '#6d8a38'], 7000, '#5b6a30', 20, 23);

  // ---------- cielo (domo con degradé + disco solar) ----------
  TV.buildSky = function (uniforms) {
    const mat = new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uTop: { value: new T.Color() }, uMid: { value: new T.Color() }, uBot: { value: new T.Color() },
        uSunDir: uniforms.uSunDir, uSunCol: uniforms.uSunCol,
      },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        uniform vec3 uTop, uMid, uBot, uSunCol, uSunDir; varying vec3 vDir;
        void main(){
          float h = clamp(vDir.y, -0.1, 1.0);
          vec3 c = mix(uBot, uMid, smoothstep(-0.05, 0.22, h));
          c = mix(c, uTop, smoothstep(0.18, 0.75, h));
          float s = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
          c += uSunCol * (pow(s, 900.0) * 6.0 + pow(s, 28.0) * 0.55 + pow(s, 5.0) * 0.16);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new T.Mesh(new T.SphereGeometry(1300, 32, 16), mat);
    mesh.renderOrder = -10; mesh.frustumCulled = false;
    return { mesh, mat };
  };

  // ---------- terreno ----------
  // El campo es pasto natural; la tierra roja aparece bajo cada hilera a medida que crece el viñedo
  // (uProg), y en la barranca. `lay` = { rows, per, dmax, spX, spZ, fig:[x,z] } del viñedo.
  TV.buildTerrain = function (soilTex, grassTex, grassTint, u, lay) {
    const W = 1800, D = 1100, nx = 200, nz = 140;
    const geo = new T.PlaneGeometry(W, D, nx, nz); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -290);
    const pos = geo.attributes.position, grass = new Float32Array(pos.count), uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, TV.terrainH(x, z));
      let g = 0.72 + TV.fbm(x * 0.03, z * 0.03) * 0.5;
      const bank = TV.smoothstep(-84, -100, z) * (1 - TV.smoothstep(-330, -345, z)); // barranca y playa: tierra desnuda
      g = TV.lerp(g, 0.0, bank);
      grass[i] = TV.clamp(g, 0, 1);
      uv.setXY(i, x / 14, z / 14);              // 1 tile de textura = 14 m
    }
    geo.setAttribute('aGrass', new T.BufferAttribute(grass, 1));
    geo.computeVertexNormals();
    const mat = new T.MeshStandardMaterial({ map: soilTex, roughness: 0.96, metalness: 0 });
    const half = new T.Vector2((lay.rows + 0.5) * lay.spX + 0.4, (lay.per * lay.spZ) / 2 + 0.8);
    const ctr = new T.Vector2(0, -((lay.per - 1) * lay.spZ) / 2);
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uGrassMap = { value: grassTex }; sh.uniforms.uGrassTint = { value: grassTint };
      sh.uniforms.uProg = u.uVineProg; sh.uniforms.uDmax = { value: lay.dmax }; sh.uniforms.uFig = { value: new T.Vector2(lay.fig[0], lay.fig[1]) };
      sh.uniforms.uRectC = { value: ctr }; sh.uniforms.uRectH = { value: half }; sh.uniforms.uSpX = { value: lay.spX };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aGrass; varying float vGrass; varying vec2 vWX;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGrass = aGrass; vWX = (modelMatrix * vec4(position, 1.0)).xz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        uniform sampler2D uGrassMap; uniform vec3 uGrassTint; uniform float uProg, uDmax, uSpX; uniform vec2 uFig, uRectC, uRectH; varying float vGrass; varying vec2 vWX;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
        {
          float fx = fract(vWX.x / uSpX), dr = min(fx, 1.0 - fx);
          float rowSoil = 1.0 - smoothstep(0.14, 0.24, dr);
          vec2 q = abs(vWX - uRectC) - uRectH;
          float inRect = 1.0 - smoothstep(-0.5, 0.5, max(q.x, q.y));
          float gr = clamp((uProg - 0.9 * length(vWX - uFig) / uDmax) * 10.0, 0.0, 1.0);
          float gf = vGrass * (1.0 - rowSoil * inRect * gr);
          vec4 gt = texture2D(uGrassMap, vMapUv);
          float pn = vn(vWX * 0.045) * 0.6 + vn(vWX * 0.21) * 0.4;
          vec3 pas = gt.rgb * uGrassTint * 2.3 * (0.82 + 0.34 * pn);
          pas = mix(pas, pas * vec3(1.3, 1.08, 0.68), smoothstep(0.52, 0.85, pn) * 0.75);
          pas = mix(vec3(dot(pas, vec3(0.3, 0.59, 0.11))), pas, 0.82);
          diffuseColor.rgb = mix(diffuseColor.rgb, pas, gf);
        }`);
    };
    const mesh = new T.Mesh(geo, mat); mesh.receiveShadow = true;
    return mesh;
  };

  // ---------- río Uruguay ----------
  TV.buildRiver = function (u) {
    const mat = new T.ShaderMaterial({
      uniforms: {
        uTime: u.uTime, uSunDir: u.uSunDir, uSunCol: u.uSunCol,
        uColA: { value: new T.Color() }, uColB: { value: new T.Color() },
        uSkyTop: { value: new T.Color() }, uSkyBot: { value: new T.Color() },
        uFogCol: u.uFogCol, uFogNear: u.uFogNear, uFogFar: u.uFogFar,
      },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `
        uniform float uTime, uFogNear, uFogFar; uniform vec3 uSunDir, uSunCol, uColA, uColB, uSkyTop, uSkyBot, uFogCol; varying vec3 vW;
        void main(){
          vec3 V = normalize(cameraPosition - vW);
          vec3 N = normalize(vec3(sin(vW.x*0.35+uTime*0.9)*0.05 + sin(vW.z*0.15+uTime*0.5)*0.03, 1.0, cos(vW.z*0.4-uTime*0.8)*0.05 + cos(vW.x*0.12+uTime*0.3)*0.03));
          float f = pow(1.0 - max(dot(N, V), 0.0), 3.0);
          vec3 R = reflect(-V, N);
          vec3 refl = mix(uSkyBot, uSkyTop, clamp(R.y * 1.6, 0.0, 1.0));
          vec3 c = mix(mix(uColA, uColB, f), refl, clamp(f * 0.85 + 0.12, 0.0, 1.0));
          float sd = max(dot(R, normalize(uSunDir)), 0.0);
          c += uSunCol * (pow(sd, 260.0) * 3.0 + pow(sd, 18.0) * 0.32);
          float fog = smoothstep(uFogNear, uFogFar, length(cameraPosition - vW));
          c = mix(c, uFogCol, fog);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new T.Mesh(new T.PlaneGeometry(1900, 300).rotateX(-Math.PI / 2), mat);
    mesh.position.set(0, TV.RIVER_Y, -240);
    return { mesh, mat };
  };
})();
