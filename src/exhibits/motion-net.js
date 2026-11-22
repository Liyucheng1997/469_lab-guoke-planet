import * as THREE from "three";
import { glowSprite, glowTexture, holoMaterial, label, smooth } from "../lib.js";

export const meta = {
  id: "motion-net", group: "网络", icon: "🌐", title: "全球公众运动网", sub: "9 个同步轨道人工场发生器",
  chapter: "第七章 · 第二十一章",
  summary:
    "果克星球上空的同步轨道上有 9 个人工场发生器，比地球的卫星大得多，跟着星球一起转，从天上照射地面，覆盖整个星球。人想去哪里，只要在脑子里发出请求、在耳边挥一下手确认，一秒钟内就能出现在星球上任何地方。旁人看到的是一个人突然在原地消失，又突然在别处出现，密封的房间也挡不住。送餐、搬东西、建房子、给身体输送营养，靠的都是这张网。",
  principle:
    "请求经全球公众信息网传给人工场发生器，系统先确认身份，再用全球定位系统锁定人的位置，然后同时照射起点和终点。人工场让人周围空间的光速运动消失，质量随之变成零，人就以光速到达终点，再恢复质量。途中挡着的物体也被一起置零质量，所以能穿墙。它有规矩：一般用户最多送 100 吨，不送进危险区，违法请求会被拒绝；外星人不能单独瞬移，只能作为某个果克人的「附属物」；它只照射地面，不能把人送出星球。",
  quotes: [
    ["一秒钟内出现在全球任何地方", "第七章"],
    ["和你们地球上空的同步卫星一样", "第七章"],
    ["请求附属物瞬移被通过，类型：异型生物人", "第七章 · 系统提示"],
  ],
  model:
    "星球与轨道按示意比例缩小。点「发起一次瞬移」会按书里的流程走一遍：发请求、经信息网上传、确认身份并定位、同时照射起点和终点、零质量光速到达。螺旋光柱表示书里说的「场」：圆柱状螺旋式运动的空间。",
};

function planetTexture() {
  const W = 1024, H = 512;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  // 简单的值噪声，生成大陆轮廓：铁红色土地 + 绿色植被 + 碧清的海
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const G = 16, grid = [];
  for (let i = 0; i < (G + 1) * (G / 2 + 1); i++) grid.push(rnd());
  const val = (u, v, f) => {
    const x = u * f, y = v * f, xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const at = (a, b) => grid[((b % (G / 2 + 1)) * (G + 1) + (a % G)) % grid.length];
    const s = (t) => t * t * (3 - 2 * t);
    const a = at(xi, yi), b = at(xi + 1, yi), cc = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return (a + (b - a) * s(xf)) * (1 - s(yf)) + (cc + (d - cc) * s(xf)) * s(yf);
  };
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = y / H;
    const n = val(u, v, 6) * 0.6 + val(u * 2.3, v * 2.3, 6) * 0.3 + val(u * 5.1, v * 5.1, 6) * 0.1;
    const veg = val(u * 3.7 + 0.3, v * 3.7, 6);
    const i = (y * W + x) * 4;
    let r, gg, b;
    if (n < 0.5) { const d = n / 0.5; r = 14 + d * 20; gg = 50 + d * 50; b = 90 + d * 60; }
    else if (veg > 0.55) { r = 70; gg = 128 + (veg - 0.55) * 120; b = 70; }
    else { r = 150 + (n - 0.5) * 120; gg = 72 + (n - 0.5) * 60; b = 48; }
    const pole = Math.abs(v - 0.5) > 0.44 ? 1 : 0;
    img.data[i] = pole ? 236 : r; img.data[i + 1] = pole ? 244 : gg; img.data[i + 2] = pole ? 252 : b; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function generator() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xa9b2c0, metalness: 0.9, roughness: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 12, 48), metal);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.22, 20), metal);
  hub.rotation.x = Math.PI / 2;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.02), new THREE.MeshStandardMaterial({ color: 0x2b3442, metalness: 0.6, roughness: 0.4 }));
  plate.position.z = -0.18;
  const eye = glowSprite(0x7fd4ff, 0.3, 0.9);
  eye.position.z = 0.14;
  g.add(ring, hub, plate, eye);
  return g;
}

// 螺旋场柱：从 a 指向 b
function spiralBeam(color) {
  const m = holoMaterial(color, { power: 0.6, base: 0.25, intensity: 2.4, scan: 0 });
  m.uniforms.uOpacity.value = 0;
  const pts = [];
  for (let i = 0; i <= 240; i++) {
    const u = i / 240, a = u * Math.PI * 2 * 9;
    pts.push(new THREE.Vector3(Math.cos(a) * 0.07, u, Math.sin(a) * 0.07));
  }
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 480, 0.012, 6);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8, 1, true), m);
  core.position.y = 0.5;
  const helix = new THREE.Mesh(geo, m);
  const g = new THREE.Group();
  g.add(helix, core);
  g.userData.mat = m;
  g.userData.helix = helix;
  return g;
}
function aim(obj, a, b) {
  const d = new THREE.Vector3().subVectors(b, a);
  obj.position.copy(a);
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  obj.scale.set(1, d.length(), 1);
}

export function build() {
  const root = new THREE.Group();
  const PR = 2.2, ORBIT = 5.4;
  const spin = new THREE.Group(); // 星球、发生器、地面标记一起转：同步轨道
  spin.position.y = 3.3;
  spin.rotation.z = 0.32;
  root.add(spin);

  const planet = new THREE.Mesh(new THREE.SphereGeometry(PR, 96, 64), new THREE.MeshStandardMaterial({ map: planetTexture(), roughness: 0.85, metalness: 0 }));
  spin.add(planet);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(PR * 1.06, 64, 48), holoMaterial(0x6ec8ff, { power: 3, base: 0, intensity: 1.2, scan: 0 }));
  spin.add(atmo);

  const orbitLine = new THREE.Mesh(new THREE.TorusGeometry(ORBIT, 0.008, 6, 200), new THREE.MeshBasicMaterial({ color: 0x5a8fc8, transparent: true, opacity: 0.5 }));
  orbitLine.rotation.x = Math.PI / 2;
  spin.add(orbitLine);
  const gens = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const g = generator();
    g.position.set(Math.cos(a) * ORBIT, 0, Math.sin(a) * ORBIT);
    g.lookAt(0, 0, 0); // 发生器朝向地面
    spin.add(g);
    gens.push(g);
  }
  const genLbl = label("同步轨道 · 9 个人工场发生器");
  genLbl.position.set(0, 0.55, ORBIT);
  gens[2].add(genLbl);
  genLbl.position.set(0, 0.55, 0);

  // 起点 / 终点
  const surf = (lat, lon) => new THREE.Vector3().setFromSphericalCoords(PR * 1.005, Math.PI / 2 - lat, lon);
  const A = surf(0.25, 0.9), B = surf(-0.15, 2.1);
  const mk = (color) => { const s = glowSprite(color, 0.35, 0); spin.add(s); return s; };
  const dotA = mk(0xffffff), dotB = mk(0xffffff);
  dotA.position.copy(A); dotB.position.copy(B);
  const pulse = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.13, 40), new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  spin.add(pulse);
  pulse.position.copy(A);
  pulse.lookAt(A.clone().multiplyScalar(2));
  const reticle = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.18, 4, 1), new THREE.MeshBasicMaterial({ color: 0xffd25a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  spin.add(reticle);
  reticle.position.copy(A);
  reticle.lookAt(A.clone().multiplyScalar(2));

  // 信号：沿 A → 最近发生器 飞的光点
  const nearest = (p) => gens.reduce((best, g) => (g.position.distanceTo(p) < best.position.distanceTo(p) ? g : best));
  const gA = nearest(A), gB = nearest(B);
  const signal = glowSprite(0x7fd4ff, 0.22, 0);
  spin.add(signal);
  const beamA = spiralBeam(0x7fd4ff), beamB = spiralBeam(0x7fd4ff);
  spin.add(beamA, beamB);
  aim(beamA, gA.position, A);
  aim(beamB, gB.position, B);
  const flashB = glowSprite(0xffffff, 0.1, 0);
  flashB.position.copy(B);
  spin.add(flashB);

  const STEPS = [
    "① 在脑中发出请求，左手在耳边挥一下确认",
    "② 请求经全球公众信息网传给人工场发生器",
    "③ 确认身份，全球定位系统锁定当前位置",
    "④ 人工场同时照射起点和终点",
    "⑤ 质量变为零，以光速到达，再恢复质量",
  ];
  let ctxRef = null, e = -1, lastStep = -1;

  return {
    root, height: 7, span: 12, targetY: 3.3, dist: 19, view: [0.1, 0.3, 1], pedestal: false, bloom: 0.8,
    actions: [
      { label: "发起一次瞬移", run: () => { e = 0; lastStep = -1; } },
    ],
    init(ctx) { ctxRef = ctx; ctx.setState("点「发起一次瞬移」按书里的五步走一遍"); },
    update(t, dt) {
      spin.rotation.y += dt * (e >= 0 ? 0.02 : 0.08);
      atmo.material.uniforms.uTime.value = t;
      for (const g of gens) g.children[3].material.opacity = 0.6 + 0.4 * Math.sin(t * 3 + g.position.x);
      dotA.material.opacity = 1; dotB.material.opacity = 0;
      pulse.material.opacity = 0; reticle.material.opacity = 0; signal.material.opacity = 0;
      beamA.userData.mat.uniforms.uOpacity.value = 0; beamB.userData.mat.uniforms.uOpacity.value = 0;
      flashB.material.opacity = 0;
      if (e < 0) return;
      e += dt;
      const step = Math.min(4, Math.floor(e / 1.6));
      if (step !== lastStep) { lastStep = step; ctxRef?.setState(STEPS[step]); }
      const k = (e % 1.6) / 1.6;
      if (step === 0) {
        pulse.material.opacity = 1 - k;
        pulse.scale.setScalar(1 + k * 3);
      } else if (step === 1) {
        signal.material.opacity = 1;
        signal.position.lerpVectors(A, gA.position, smooth(0, 1, k));
      } else if (step === 2) {
        reticle.material.opacity = 0.5 + 0.5 * Math.sin(t * 20);
        reticle.rotation.z = t * 2;
        reticle.scale.setScalar(2 - smooth(0, 1, k));
      } else if (step === 3) {
        const o = smooth(0, 0.3, k);
        for (const b of [beamA, beamB]) {
          b.userData.mat.uniforms.uOpacity.value = o;
          b.userData.mat.uniforms.uTime.value = t;
          b.userData.helix.rotation.y = t * 6;
        }
      } else {
        // 一闪而已：A 处消失，B 处出现
        const gone = k > 0.15;
        dotA.material.opacity = gone ? 0 : 1;
        dotB.material.opacity = gone ? 1 : 0;
        flashB.material.opacity = gone ? Math.max(0, 1 - (k - 0.15) * 4) : 0;
        flashB.scale.setScalar(0.4 + (k - 0.15) * 2);
        const o = Math.max(0, 1 - k * 3);
        beamA.userData.mat.uniforms.uOpacity.value = o; beamB.userData.mat.uniforms.uOpacity.value = o;
        if (e > 1.6 * 5 + 1) { e = -1; ctxRef?.setState("瞬移完成：旁人只看到她在原地消失、在千里之外出现"); dotA.material.opacity = 1; }
      }
      if (e > 1.6 * 4) { dotA.material.opacity = 0; dotB.material.opacity = 1; }
    },
  };
}
