/*
 * "Viñedo en el Tiempo" — módulo 4/4 (parte b): escena, cámara, luz, interpolación entre etapas y bucle de render.
 * Uso: const scene = TV.create(canvas, { mobile, reducedMotion }); scene.setProgress(0..6); scene.setZoom(-1..1)
 */
(function () {
  'use strict';
  const TV = window.TV, T = TV.T, S = TV.smoothstep;

  TV.create = function (canvas, opts) {
    opts = opts || {};
    const mobile = !!opts.mobile, reduced = !!opts.reducedMotion, N = TV.STAGES.length;
    const Q = mobile
      ? { rows: 5, plantsPerRow: 38, trees: 16, monte: 26, steam: 70, visitors: 5, petals: 50, sparks: 40, shadow: 1024, dpr: 1.5 }
      : { rows: 7, plantsPerRow: 52, trees: 30, monte: 60, steam: 130, visitors: 8, petals: 90, sparks: 80, shadow: 2048, dpr: 1.75 };

    const renderer = new T.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
    let pr = Math.min(window.devicePixelRatio || 1, Q.dpr);
    renderer.setPixelRatio(pr);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;

    const scene = new T.Scene(); scene.fog = new T.Fog('#efcdb0', 90, 900);
    const camera = new T.PerspectiveCamera(46, 1, 0.1, 2200);

    // ---------- estado compartido con los shaders ----------
    const u = {
      uTime: { value: 0 }, uPx: { value: 800 },
      uSunDir: { value: new T.Vector3(0, 1, 0) }, uSunCol: { value: new T.Color() },
      uFogCol: { value: scene.fog.color }, uFogNear: { value: 90 }, uFogFar: { value: 900 },
      uVineProg: { value: 0 }, uVineSize: { value: 0 }, uLeaf: { value: 0 }, uFruit: { value: 0 },
    };

    // ---------- iluminación ----------
    const sun = new T.DirectionalLight('#ffb48a', 1.5); sun.castShadow = true;
    sun.shadow.mapSize.set(Q.shadow, Q.shadow); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.06;
    const sc = sun.shadow.camera; sc.left = -65; sc.right = 65; sc.top = 65; sc.bottom = -65; sc.near = 1; sc.far = 420;
    sun.target.position.set(0, 0, -20); scene.add(sun, sun.target);
    const hemi = new T.HemisphereLight('#9fb0d0', '#8a6a58', 0.8); scene.add(hemi);

    // ---------- cielo + mapa de entorno (reflejos del bronce) ----------
    const sky = TV.buildSky(u); scene.add(sky.mesh);
    const envScene = new T.Scene(), envSky = TV.buildSky({ uSunDir: { value: new T.Vector3(-0.9, 0.25, 0.3) }, uSunCol: { value: new T.Color('#ffb35e') } });
    envSky.mat.uniforms.uTop.value.set('#35578a'); envSky.mat.uniforms.uMid.value.set('#e6995c'); envSky.mat.uniforms.uBot.value.set('#f8c27e');
    envScene.add(envSky.mesh, new T.Mesh(new T.CircleGeometry(900, 24).rotateX(-Math.PI / 2).translate(0, -3, 0), new T.MeshBasicMaterial({ color: '#7a4a34' })));
    const hot = (hex, k) => new T.MeshBasicMaterial({ color: new T.Color(hex).multiplyScalar(k), side: T.DoubleSide });
    const envSun = new T.Mesh(new T.CircleGeometry(160, 24), hot('#ffd7a0', 14)); envSun.position.set(-700, 190, 260); envSun.lookAt(0, 0, 0);
    const envFill = new T.Mesh(new T.PlaneGeometry(700, 260), hot('#8fa8d8', 2.2)); envFill.position.set(500, 260, 300); envFill.lookAt(0, 0, 0);
    envScene.add(envSun, envFill);
    const pmrem = new T.PMREMGenerator(renderer), env = pmrem.fromScene(envScene, 0.02).texture; pmrem.dispose();

    // ---------- mundo ----------
    const grassTint = new T.Color('#8aa15a');
    const vineyard = TV.buildVineyard(u, Q); scene.add(vineyard.group);
    scene.add(TV.buildTerrain(TV.soilTex(), TV.grassTex(), grassTint, u, vineyard.layout));
    const river = TV.buildRiver(u); scene.add(river.mesh);
    scene.add(TV.buildFlora(Q).group);
    const figure = TV.buildFigure(u, env); figure.group.position.set(0, 0, 1.4); scene.add(figure.group);
    const estancia = TV.buildEstancia(); estancia.group.position.set(-42, 0, -40); estancia.group.rotation.y = 0.55; scene.add(estancia.group);
    const ship = TV.buildShip(); scene.add(ship.group);
    const thermal = TV.buildThermal(u, Q); scene.add(thermal.group);
    const visitors = TV.buildVisitors(Q); scene.add(visitors.group);
    const seal = TV.buildSeal(u, env, Q); scene.add(seal.group);

    // ---------- etapas precalculadas ----------
    const C = (h) => new T.Color(h);
    const STG = TV.STAGES.map((s) => ({
      s, top: C(s.sky[0]), mid: C(s.sky[1]), bot: C(s.sky[2]), sunCol: C(s.sun.col), hs: C(s.hemi[0]), hg: C(s.hemi[1]), fog: C(s.fog[0]),
      wa: C(s.water[0]), wb: C(s.water[1]), grass: C(s.grass), bronze: C(s.bronze), leafCol: C(s.vine.leafCol), fruitCol: C(s.vine.fruit ? s.vine.fruitCol : s.vine.fruitCol),
    }));
    const st = { leaf: 0, fruit: 0, leafCol: new T.Color(), fruitCol: new T.Color(), grassCol: new T.Color(), bronzeCol: new T.Color(), steamCol: new T.Color() };
    const sunDirTmp = new T.Vector3();

    // ---------- cámara: trayectoria suave por los hitos ----------
    const camCurve = new T.CatmullRomCurve3(TV.STAGES.map((s) => new T.Vector3(...s.cam.p)), false, 'centripetal');
    const tgtCurve = new T.CatmullRomCurve3(TV.STAGES.map((s) => new T.Vector3(...s.cam.t)), false, 'centripetal');
    const camP = new T.Vector3(), camT = new T.Vector3(), tmp = new T.Vector3();

    const vis = (a, b, x, fade) => S(a - (fade || 0.7), a, x) * (1 - S(b, b + (fade || 0.7), x));
    function setVis(group, v, mode) {
      group.visible = v > 0.004;
      if (mode === 'y') group.scale.set(1, Math.max(v, 0.0001), 1); else group.scale.setScalar(Math.max(v, 0.0001));
    }

    function applyState(ue) {
      const i = Math.min(Math.floor(ue), N - 2), b = ue - i, A = STG[i], B = STG[i + 1], a = A.s, c = B.s, L = TV.lerp;
      sky.mat.uniforms.uTop.value.lerpColors(A.top, B.top, b); sky.mat.uniforms.uMid.value.lerpColors(A.mid, B.mid, b); sky.mat.uniforms.uBot.value.lerpColors(A.bot, B.bot, b);
      u.uSunCol.value.lerpColors(A.sunCol, B.sunCol, b);
      const az = TV.rad(L(a.sun.az, c.sun.az, b)), el = TV.rad(L(a.sun.el, c.sun.el, b));
      sunDirTmp.set(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az)); u.uSunDir.value.copy(sunDirTmp);
      sun.position.copy(sun.target.position).addScaledVector(sunDirTmp, 200);
      sun.color.copy(u.uSunCol.value); sun.intensity = L(a.sun.int, c.sun.int, b);
      hemi.color.lerpColors(A.hs, B.hs, b); hemi.groundColor.lerpColors(A.hg, B.hg, b); hemi.intensity = L(a.hemi[2], c.hemi[2], b);
      scene.fog.color.lerpColors(A.fog, B.fog, b); scene.fog.near = u.uFogNear.value = L(a.fog[1], c.fog[1], b); scene.fog.far = u.uFogFar.value = L(a.fog[2], c.fog[2], b);
      river.mat.uniforms.uColA.value.lerpColors(A.wa, B.wa, b); river.mat.uniforms.uColB.value.lerpColors(A.wb, B.wb, b);
      river.mat.uniforms.uSkyTop.value.copy(sky.mat.uniforms.uTop.value); river.mat.uniforms.uSkyBot.value.copy(sky.mat.uniforms.uBot.value);
      grassTint.lerpColors(A.grass, B.grass, b); st.grassCol.copy(grassTint).multiplyScalar(0.8);
      st.bronzeCol.lerpColors(A.bronze, B.bronze, b);
      const va = a.vine, vb = c.vine;
      u.uVineProg.value = L(va.prog, vb.prog, b); u.uVineSize.value = L(va.size, vb.size, b);
      st.leaf = L(va.leaf, vb.leaf, b); st.fruit = L(va.fruit, vb.fruit, b);
      u.uLeaf.value = st.leaf; u.uFruit.value = st.fruit;
      st.leafCol.lerpColors(A.leafCol, B.leafCol, b); st.fruitCol.lerpColors(A.fruitCol, B.fruitCol, b);
      st.steamCol.set('#f6eeee').lerp(u.uSunCol.value, 0.35);
      vineyard.update(st); figure.update(st); thermal.update(st);

      setVis(ship.group, vis(1, 1, ue), 's'); setVis(estancia.group, vis(2, 6, ue), 's'); setVis(figure.group, vis(3, 6, ue), 's');
      setVis(seal.group, vis(5, 5, ue), 's'); setVis(thermal.group, vis(6, 6, ue), 'y'); setVis(visitors.group, vis(6, 6, ue), 'y');
      return { i, b, ue };
    }

    // ---------- control ----------
    let target = 0, cur = 0, zTarget = 0, zCur = 0, tClock = 0, active = false, raf = 0, last = 0, dirty = true;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let ema = 16, frames = 0, w = 1, h = 1;

    function easedIndex(x) { const i = Math.floor(x); if (i >= N - 1) return N - 1; return i + S(0.16, 0.84, x - i); }

    function render() {
      const ue = easedIndex(cur), info = applyState(ue);
      const t = TV.clamp(ue / (N - 1), 0, 1);
      camCurve.getPoint(t, camP); tgtCurve.getPoint(t, camT);
      const i = Math.min(Math.floor(ue), N - 2); let fov = TV.lerp(TV.STAGES[i].cam.fov, TV.STAGES[i + 1].cam.fov, info.b);
      // pantallas verticales (celular): se ensancha el campo de visión para que la escena no quede recortada
      if (camera.aspect < 1.3) fov = Math.min(84, fov * (1 + 0.6 * TV.clamp((1.3 - camera.aspect) / 0.85, 0, 1)));
      const zf = zCur >= 0 ? TV.lerp(1, 0.55, zCur) : TV.lerp(1, 1.8, -zCur);
      tmp.subVectors(camP, camT).multiplyScalar(zf); camP.copy(camT).add(tmp);
      const dist = tmp.length();
      camP.x += mouse.x * dist * 0.03; camP.y += mouse.y * dist * 0.015;
      if (!reduced) { camP.x += Math.sin(tClock * 0.23) * dist * 0.004; camP.y += Math.sin(tClock * 0.31) * dist * 0.003; }
      camP.y = Math.max(camP.y, TV.terrainH(camP.x, camP.z) + 0.45);
      camera.position.copy(camP); camera.lookAt(camT); camera.fov = fov; camera.updateProjectionMatrix();
      u.uPx.value = (h * pr * 0.5) / Math.tan(TV.rad(fov) / 2);
      u.uTime.value = tClock;
      visitors.update(tClock); seal.update(tClock, vis(5, 5, ue));
      ship.group.position.set(6 + Math.sin(tClock * 0.05) * 16, TV.RIVER_Y + Math.sin(tClock * 0.8) * 0.12, -122); ship.group.rotation.set(0, -0.25 + Math.sin(tClock * 0.05) * 0.05, Math.sin(tClock * 0.6) * 0.015);
      sky.mesh.position.copy(camera.position);
      renderer.render(scene, camera);
      if (opts.onFrame) opts.onFrame(ue);
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.06, (now - last) / 1000 || 0.016); last = now;
      if (!reduced) tClock += dt;
      const k = reduced ? 1 : 1 - Math.exp(-dt * 5.5);
      const moved = Math.abs(target - cur) > 0.0004 || Math.abs(zTarget - zCur) > 0.0004 || Math.abs(mouse.tx - mouse.x) > 0.0004 || Math.abs(mouse.ty - mouse.y) > 0.0004;
      cur += (target - cur) * k; zCur += (zTarget - zCur) * k; mouse.x += (mouse.tx - mouse.x) * k * 0.6; mouse.y += (mouse.ty - mouse.y) * k * 0.6;
      if (reduced && !moved && !dirty) return;
      dirty = false;
      render();
      if (!reduced && ++frames > 30) { ema += (dt * 1000 - ema) * 0.05; if (frames % 45 === 0 && ema > 26 && pr > 0.8) { pr = Math.max(0.75, pr * 0.85); renderer.setPixelRatio(pr); renderer.setSize(w, h, false); } }
    }

    const api = {
      renderer, camera, scene,
      setProgress(v) { target = TV.clamp(v, 0, N - 1); dirty = true; },
      setZoom(z) { zTarget = TV.clamp(z, -1, 1); dirty = true; },
      getZoom() { return zTarget; },
      setPointer(x, y) { mouse.tx = x; mouse.ty = y; dirty = true; },
      resize(nw, nh) { w = Math.max(2, nw | 0); h = Math.max(2, nh | 0); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true; },
      setActive(on) {
        if (on && !active) { active = true; last = performance.now(); raf = requestAnimationFrame(frame); }
        else if (!on && active) { active = false; cancelAnimationFrame(raf); }
      },
      // posición en pantalla (px del canvas) de un punto del mundo; null si está detrás de la cámara
      project(x, y, z) {
        tmp.set(x, y, z).project(camera); if (tmp.z > 1) return null;
        return { x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h, d: camera.position.distanceTo(new T.Vector3(x, y, z)) };
      },
      // salto inmediato a una posición (útil para pruebas y capturas deterministas)
      snapTo(v, z) { target = cur = TV.clamp(v, 0, N - 1); zTarget = zCur = z || 0; tClock = 3; render(); },
      dispose() { api.setActive(false); renderer.dispose(); },
    };
    api.resize(canvas.clientWidth || 800, canvas.clientHeight || 600);
    applyState(0);
    return api;
  };
})();
