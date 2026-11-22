import * as THREE from "three";
import { glowSprite, glowTexture, label, smooth } from "../lib.js";
import { earthlingGhost } from "./guoke-body.js";

export const meta = {
  id: "ufo", group: "交通", icon: "🛸", title: "光速飞碟「区图300号」", sub: "两顶草帽扣在一起",
  chapter: "第一章 · 第二章 · 第三十九章",
  summary:
    "作者被带走时看到的飞碟，像两个草帽扣在一起。外壳是铅灰色的金属，没有焊缝、没有窗户、没有孔洞，也没有突出的灯，只在边缘一圈小灯闪着各色暗光。它悬停在几十米高处，起飞降落都没有声音。底部射下的「冷光」是一道雪白的光柱，一节一节向前延伸，照到的地面像撒了一层厚厚的银色粉末，空气中却看不到光柱本身。",
  principle:
    "飞碟边缘的环形空腔里，带电粒子沿同一方向高速环绕，像一台环形加速器。用右手四指顺着粒子环流的方向握拳，大拇指的方向就是飞碟的运动方向，垂直于碟面。变化的电磁场转化出反引力场，把飞碟周围的空间「吃掉」，质量随之变成零；质量为零的物体会瞬间以光速运动。飞碟有三种状态：零质量的激发态（光速飞行）、万分之一克级的准激发态（可在大气里悬浮、任意速度），以及普通态。在大气中它在激发态和准激发态之间极快地来回切换，所以外人看到的是一段段闪现、直角转弯、没有惯性。",
  quotes: [
    ["像两个草帽的东西合在一起", "第一章"],
    ["一节一节向前延伸", "第一章 · 冷光"],
    ["大拇指方向就是飞碟的运动方向", "第二章"],
  ],
  model:
    "外壳是一条旋转轮廓（上下两顶「草帽」）。「剖视」会把外壳变半透明，露出边缘环形空腔里的粒子流，并画出右手定则。冷光柱按书里说的分节伸出；为了看得见，光柱画成很淡的虚影，真正亮的是被照到的地面。被吸上去的蓝色人形是作者本人。",
};

export function build() {
  const root = new THREE.Group();
  const ship = new THREE.Group();
  const HOVER = 6.5;
  ship.position.y = HOVER;
  root.add(ship);

  // ---- 外壳：两顶草帽扣合（从下往上的轮廓）----
  const prof = [
    [0, -1.75], [1.6, -1.7], [2.9, -1.45], [3.55, -0.95], [3.8, -0.55], [4.6, -0.42], [6.5, -0.27], [8.4, -0.11], [9, 0],
    [8.4, 0.12], [6.5, 0.29], [4.6, 0.44], [3.8, 0.56], [3.6, 1.1], [3.25, 1.8], [2.5, 2.35], [1.4, 2.58], [0, 2.62],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const hullGeo = new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(160), 160);
  hullGeo.computeVertexNormals();
  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0x6d737c, metalness: 0.92, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.25,
    transparent: true, opacity: 1, side: THREE.DoubleSide, emissive: 0x3aa0ff, emissiveIntensity: 0,
  });
  const hull = new THREE.Mesh(hullGeo, hullMat);
  ship.add(hull);

  // 底部中心的吸入口（没有门）
  const port = new THREE.Mesh(new THREE.CircleGeometry(0.9, 48), new THREE.MeshBasicMaterial({ color: 0x0b0d12 }));
  port.rotation.x = Math.PI / 2;
  port.position.y = -1.752;
  ship.add(port);

  // ---- 边缘一圈小灯：各色暗光 ----
  const NL = 48;
  const lights = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ toneMapped: false }), NL);
  const palette = [0xff5a6e, 0x5ad1ff, 0xffd25a, 0x9a7bff, 0x5affb0];
  const tmp = new THREE.Object3D();
  for (let i = 0; i < NL; i++) {
    const a = (i / NL) * Math.PI * 2;
    tmp.position.set(Math.cos(a) * 8.85, 0, Math.sin(a) * 8.85);
    tmp.updateMatrix();
    lights.setMatrixAt(i, tmp.matrix);
    lights.setColorAt(i, new THREE.Color(palette[i % palette.length]));
  }
  ship.add(lights);
  const col = new THREE.Color();

  // ---- 环形空腔里的带电粒子流（剖视时可见）----
  const cut = new THREE.Group();
  cut.visible = false;
  ship.add(cut);
  const ringR = 6.8;
  const tube = new THREE.Mesh(
    new THREE.TorusGeometry(ringR, 0.2, 16, 160),
    new THREE.MeshBasicMaterial({ color: 0x2a6cff, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  tube.rotation.x = Math.PI / 2;
  cut.add(tube);
  const NP = 900;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(NP * 3), pAng = new Float32Array(NP), pOff = new Float32Array(NP * 2);
  for (let i = 0; i < NP; i++) { pAng[i] = Math.random() * Math.PI * 2; pOff[i * 2] = (Math.random() - 0.5) * 0.28; pOff[i * 2 + 1] = (Math.random() - 0.5) * 0.28; }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x9fe8ff, size: 0.16, map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  cut.add(particles);
  // 环流方向箭头 + 拇指方向箭头
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 20), new THREE.MeshBasicMaterial({ color: 0x7fd4ff, toneMapped: false }));
    cone.position.set(Math.cos(a) * ringR, 0, Math.sin(a) * ringR);
    // 逆时针（俯视）环流：切线方向 (-sin, 0, cos) 取反为顺时针，这里取 +Y 拇指对应的逆时针
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)));
    cut.add(cone);
  }
  const thumb = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 16), new THREE.MeshBasicMaterial({ color: 0xffd25a, toneMapped: false }));
  shaft.position.y = 2.5;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.1, 24), new THREE.MeshBasicMaterial({ color: 0xffd25a, toneMapped: false }));
  tip.position.y = 5.5;
  thumb.add(shaft, tip);
  thumb.position.y = 2.7;
  cut.add(thumb);
  const lblRule = label("右手四指 = 粒子环流方向　大拇指 = 飞行方向", { color: "#ffe7a8" });
  lblRule.position.set(0, 9.6, 0);
  cut.add(lblRule);
  const lblRing = label("环形空腔 · 带电粒子同向环流", { color: "#bfe6ff" });
  lblRing.position.set(ringR, -0.9, 0);
  cut.add(lblRing);

  // ---- 冷光：一节一节伸出的光柱 + 地面银粉 ----
  const beam = new THREE.Group();
  ship.add(beam);
  const SEG = 8, segH = (HOVER - 1.75) / SEG;
  const segs = [];
  for (let i = 0; i < SEG; i++) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.95, segH * 0.86, 40, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    m.position.y = -1.75 - segH * (i + 0.5);
    beam.add(m);
    segs.push(m);
  }
  const spotTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.75, "rgba(235,242,255,0.95)"); grd.addColorStop(1, "rgba(235,242,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2500; i++) { // 银色粉末
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 100;
      g.fillStyle = `rgba(160,170,190,${Math.random() * 0.5})`;
      g.fillRect(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 2, 2);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const spot = new THREE.Mesh(new THREE.CircleGeometry(1.25, 64), new THREE.MeshBasicMaterial({ map: spotTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  spot.rotation.x = -Math.PI / 2;
  spot.position.y = 0.02;
  root.add(spot);

  const person = earthlingGhost(1.7);
  person.position.y = 0.02;
  root.add(person);

  // ---- 闪光 / 余像 ----
  const flash = glowSprite(0xbfe8ff, 0.1, 0);
  ship.add(flash);
  const ghosts = [];

  // ---- 状态机 ----
  let mode = "idle", t0 = 0, now = 0;
  let showCut = false;
  const hops = [];

  function start(m) { mode = m; t0 = now; }

  return {
    root, height: 9.5, span: 18, targetY: 4.2, dist: 40, view: [0.2, 0.42, 1], bloom: 0.7,
    actions: [
      { label: "冷光扫描 · 把人吸上去", run: () => start("beam") },
      { label: "剖视：环形粒子流", run: () => { showCut = !showCut; } },
      { label: "光速跃迁", run: () => start("warp") },
      { label: "直角闪现", run: () => { start("hop"); hops.length = 0; } },
    ],
    update(t, dt) {
      now = t;
      const e = t - t0;
      // 灯光
      for (let i = 0; i < NL; i++) {
        const b = 0.25 + 0.75 * Math.max(0, Math.sin(t * 2.2 + i * 1.7)) ** 3;
        col.setHex(palette[(i + Math.floor(t * 0.8)) % palette.length]).multiplyScalar(b * 1.6);
        lights.setColorAt(i, col);
      }
      lights.instanceColor.needsUpdate = true;
      ship.rotation.y += dt * 0.05;
      if (mode !== "hop") ship.position.y = HOVER + Math.sin(t * 0.8) * 0.12;

      // 剖视
      cut.visible = showCut || hullMat.opacity < 0.99;
      hullMat.opacity += ((showCut ? 0.22 : 1) - hullMat.opacity) * Math.min(1, dt * 4);
      hullMat.depthWrite = hullMat.opacity > 0.9;
      if (cut.visible) {
        const p = pGeo.attributes.position;
        for (let i = 0; i < NP; i++) {
          pAng[i] += dt * (2.2 + (i % 7) * 0.08);
          const r = ringR + pOff[i * 2];
          p.setXYZ(i, Math.cos(-pAng[i]) * r, pOff[i * 2 + 1], Math.sin(-pAng[i]) * r);
        }
        p.needsUpdate = true;
        thumb.position.y = 2.7 + Math.sin(t * 3) * 0.15;
      }

      // 冷光：分节伸出 → 人被吸上去 → 分节收回
      let beamOn = 0, rise = 0;
      if (mode === "beam") {
        if (e < 2) beamOn = e / 2;
        else if (e < 6.5) { beamOn = 1; rise = smooth(2.6, 6.2, e); }
        else if (e < 8.5) { beamOn = 1 - (e - 6.5) / 2; rise = 1; }
        else { mode = "idle"; }
      }
      const shown = beamOn * SEG;
      segs.forEach((m, i) => { m.material.opacity = THREE.MathUtils.clamp(shown - i, 0, 1) * 0.2; });
      spot.material.opacity = THREE.MathUtils.clamp(shown - SEG + 1, 0, 1);
      person.position.y = rise * (HOVER - 1.75 - 1.7) + 0.02;
      person.visible = rise < 0.995 || mode !== "beam";
      if (mode !== "beam") { person.position.y = 0.02; person.visible = true; }
      person.userData.mat.uniforms.uTime.value = t;
      person.userData.mat.uniforms.uOpacity.value = 1 - smooth(0.85, 1, rise);

      // 光速跃迁：激发态 → 消失 → 复现
      if (mode === "warp") {
        const shimmer = smooth(0, 1.4, e) * (e < 1.6 ? 1 : 0);
        hullMat.emissiveIntensity = shimmer * (0.6 + 0.4 * Math.sin(t * 40));
        ship.scale.setScalar(1 + shimmer * 0.02 * Math.sin(t * 55));
        const gone = e >= 1.6 && e < 3.2;
        hull.visible = lights.visible = !gone;
        flash.material.opacity = e >= 1.55 && e < 2.2 ? 1 - (e - 1.55) / 0.65 : e >= 3.2 && e < 3.6 ? 1 - (e - 3.2) / 0.4 : 0;
        flash.scale.setScalar(4 + (e - 1.55) * 30);
        if (e > 3.6) { mode = "idle"; hullMat.emissiveIntensity = 0; ship.scale.setScalar(1); hull.visible = lights.visible = true; }
      } else if (mode !== "hop") {
        flash.material.opacity = 0;
      }

      // 直角闪现：在几个点之间瞬间跳变，留下渐隐的余像
      if (mode === "hop") {
        const path = [[0, HOVER], [6, HOVER], [6, HOVER + 4], [-5, HOVER + 4], [-5, HOVER - 1], [0, HOVER]];
        const k = Math.min(path.length - 1, Math.floor(e / 0.7));
        if (hops.length <= k) {
          const g = hull.clone();
          g.material = new THREE.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
          g.position.copy(ship.position);
          g.rotation.copy(ship.rotation);
          root.add(g);
          ghosts.push({ m: g, life: 1 });
          hops.push(k);
          ship.position.set(path[k][0], path[k][1], 0);
        }
        if (e > 0.7 * path.length) { mode = "idle"; ship.position.set(0, HOVER, 0); }
      }
      for (let i = ghosts.length - 1; i >= 0; i--) {
        const gh = ghosts[i];
        gh.life -= dt * 1.2;
        gh.m.material.opacity = Math.max(0, gh.life) * 0.35;
        if (gh.life <= 0) { root.remove(gh.m); gh.m.material.dispose(); ghosts.splice(i, 1); }
      }
    },
  };
}
