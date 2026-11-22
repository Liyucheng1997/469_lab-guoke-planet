import * as THREE from "three";
import { glowTexture, label, std, smooth } from "../lib.js";
import { makeGuoke } from "./guoke-body.js";

export const meta = {
  id: "virtual-home", group: "生活", icon: "🛋️", title: "虚拟墙与虚拟家具", sub: "一按开关就消失",
  chapter: "第四章 · 第七章 · 第八章",
  summary:
    "飞碟仓库和诺顿家的墙都是虚拟的：柔和细腻的黄色，没有一点瑕疵，近看却由无数微小的东西组成，纷纷扰扰地抖动。手伸进去会遇到像磁铁同极相斥的力，越往里越强。诺顿挥一下手，一堵墙就消失了，客厅一下子大了好几倍。虚拟沙发和虚拟床像有无形的力托着，柔软舒服；关掉开关，人就掉到地上，开着的时候又会把人「逼」出来。乳白色的虚拟浴缸悬在半空，里面的水却是真的，从一端冒出、从另一端流走，人一出来浴缸就消失。",
  principle:
    "墙脚下有小小的黑色「人工场发生器」，同时发出两种场：一种是平面对称的斥力场，把一切往外推；另一种是「光线凝固场」，把环境光凝固在空间里形成看得见的墙面，这里只选了黄色，所以夜里光线少的时候墙也会变暗。这种墙比实墙结实得多，但有极限，一按开关就没了。浴缸里的水靠全球运动网瞬移进出。",
  quotes: [
    ["光线凝固场", "第四章"],
    ["一按人工场开关", "第四章"],
    ["乳白色的浴缸", "第八章"],
  ],
  model:
    "墙、沙发、浴缸都由抖动的粒子组成，墙脚的黑色小方块是人工场发生器。「关掉人工场」会让所有虚拟物散开，坐着的人掉到地上、浴缸里的真水洒出来。「挥手扩大客厅」会让前墙退到远处。",
};

// 在一个盒子表面上撒抖动粒子
function particleBox(w, h, d, count, color, size = 0.02) {
  const pts = new Float32Array(count * 3), home = [];
  const areas = [w * h, w * h, d * h, d * h, w * d, w * d];
  const total = areas.reduce((a, b) => a + b, 0);
  for (let i = 0; i < count; i++) {
    let r = Math.random() * total, f = 0;
    while (r > areas[f]) { r -= areas[f]; f++; }
    const u = Math.random() - 0.5, v = Math.random() - 0.5;
    let p;
    if (f === 0) p = [u * w, v * h + h / 2, d / 2];
    else if (f === 1) p = [u * w, v * h + h / 2, -d / 2];
    else if (f === 2) p = [w / 2, v * h + h / 2, u * d];
    else if (f === 3) p = [-w / 2, v * h + h / 2, u * d];
    else if (f === 4) p = [u * w, h, v * d];
    else p = [u * w, 0, v * d];
    home.push(new THREE.Vector3(...p));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
  const pm = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: glowTexture(), transparent: true, depthWrite: false, alphaTest: 0.02 }));
  pm.userData = { home, scatter: home.map(() => new THREE.Vector3().randomDirection().multiplyScalar(0.6 + Math.random() * 1.4)), phase: home.map(() => Math.random() * 100) };
  pm.frustumCulled = false;
  return pm;
}
function tickParticles(pm, t, gone) {
  const p = pm.geometry.attributes.position, { home, scatter, phase } = pm.userData;
  const k = smooth(0, 1, gone);
  for (let i = 0; i < home.length; i++) {
    const h = home[i], s = scatter[i], ph = phase[i];
    const j = 0.006;
    p.setXYZ(i,
      h.x + s.x * k + Math.sin(t * 17 + ph) * j,
      h.y + s.y * k + Math.cos(t * 13 + ph * 1.7) * j,
      h.z + s.z * k + Math.sin(t * 19 + ph * 0.6) * j);
  }
  p.needsUpdate = true;
  pm.material.opacity = 0.75 * (1 - k);
}

export function build() {
  const root = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.04, 3.2), std(0x6e6a63, { roughness: 0.8 }));
  floor.position.y = 0.02;
  root.add(floor);

  // 黄色虚拟墙：背墙 + 侧墙 + 前墙（可退后）
  const walls = [];
  const mkWall = (w, h, x, z, ry) => {
    const pm = particleBox(w, h, 0.02, Math.floor(w * h * 1500), 0xffd877, 0.028);
    pm.position.set(x, 0.04, z);
    pm.rotation.y = ry;
    root.add(pm);
    const gen = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), std(0x0c0c10, { metalness: 0.6, roughness: 0.3 }));
    gen.position.set(x, 0.07, z);
    gen.rotation.y = ry;
    root.add(gen);
    walls.push(pm);
    return pm;
  };
  mkWall(4.0, 1.5, 0, -1.5, 0);
  mkWall(3.0, 1.5, -2.0, 0, Math.PI / 2);
  const movable = mkWall(1.6, 1.5, 1.2, 0.2, Math.PI / 2);
  const genLbl = label("人工场发生器", { color: "#cfd6e2" });
  genLbl.position.set(0, 0.32, -1.45);
  root.add(genLbl);

  // 虚拟沙发（乳白色粒子）+ 坐在上面的诺顿
  const sofa = new THREE.Group();
  sofa.position.set(-0.9, 0.04, -0.7);
  root.add(sofa);
  const seat = particleBox(1.0, 0.32, 0.5, 3200, 0xf4f0ff, 0.04);
  const back = particleBox(1.0, 0.45, 0.14, 2000, 0xf4f0ff, 0.04);
  back.position.set(0, 0.32, -0.2);
  sofa.add(seat, back);
  const norton = makeGuoke({ female: false });
  // 坐姿：臀部（髋关节高 0.45）落在沙发座面（0.36）上
  norton.root.position.set(-0.9, -0.08, -0.72);
  norton.sit(true);
  root.add(norton.root);

  // 乳白色虚拟浴缸 + 真实的水
  const tub = new THREE.Group();
  tub.position.set(0.55, 0.32, -0.6);
  root.add(tub);
  const tubShell = particleBox(1.0, 0.34, 0.55, 3600, 0xfbf6ee, 0.04);
  tub.add(tubShell);
  const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0.5, roughness: 0.05, transmission: 0.6, depthWrite: false });
  const water = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.22, 0.5), waterMat);
  water.position.y = 0.13;
  tub.add(water);
  // 水流：从一端冒出，从另一端流走
  const NW = 260;
  const wGeo = new THREE.BufferGeometry();
  const wPos = new Float32Array(NW * 3), wPh = Float32Array.from({ length: NW }, () => Math.random());
  wGeo.setAttribute("position", new THREE.BufferAttribute(wPos, 3));
  const stream = new THREE.Points(wGeo, new THREE.PointsMaterial({ color: 0xbfe6ff, size: 0.03, map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  stream.frustumCulled = false;
  tub.add(stream);
  const tubLbl = label("虚拟浴缸 · 真实的水", { color: "#cfe6ff" });
  tubLbl.position.set(0, 0.6, 0);
  tub.add(tubLbl);
  // 关掉后洒在地上的水
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshPhysicalMaterial({ color: 0x9fd6ff, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.6 }));
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(0.55, 0.045, -0.6);
  puddle.scale.setScalar(0.001);
  root.add(puddle);

  let on = true, offT = 0, expand = 0, expandTarget = 0, ctxRef = null;
  let drop = 0;   // 诺顿下落进度
  let tubFall = 0;

  return {
    root, height: 1.8, span: 4.2, targetY: 0.5, dist: 5.6, view: [0.35, 0.45, 1],
    actions: [
      { label: "关掉 / 打开人工场", run: () => { on = !on; ctxRef?.setState(on ? "人工场打开：墙、沙发、浴缸重新凝聚，沙发把人「逼」了出来" : "人工场关闭：虚拟物全部散掉，人掉到地上，浴缸里的真水洒了一地"); } },
      { label: "挥手：扩大客厅", run: () => { expandTarget = expandTarget ? 0 : 1; norton.earTap(); ctxRef?.setState(expandTarget ? "挥一下手，这堵墙退到远处，客厅大了好几倍" : "墙又回来了"); } },
    ],
    init(ctx) { ctxRef = ctx; },
    update(t, dt) {
      offT = THREE.MathUtils.clamp(offT + (on ? -dt : dt) * 1.4, 0, 1);
      for (const w of walls) tickParticles(w, t, w === movable ? Math.max(offT, 0) : offT);
      tickParticles(seat, t, offT); tickParticles(back, t, offT); tickParticles(tubShell, t, offT);
      // 前墙退后
      expand += (expandTarget - expand) * Math.min(1, dt * 1.5);
      movable.position.x = 1.2 + expand * 4;
      // 诺顿：沙发在时被托着；沙发没了就掉下去
      drop = THREE.MathUtils.clamp(drop + (on ? -dt * 1.2 : dt * 2.5), 0, 1);
      const fall = drop * drop;
      norton.root.position.y = -0.08 - fall * 0.3;
      norton.root.rotation.x = -fall * 0.2;
      norton.update(t, dt);
      // 浴缸：水只在浴缸存在时被托住
      tubFall = THREE.MathUtils.clamp(tubFall + (on ? -dt * 1.5 : dt * 2), 0, 1);
      water.position.y = 0.13 - tubFall * 0.35;
      water.scale.set(1 + tubFall * 0.6, 1 - tubFall * 0.95, 1 + tubFall * 0.6);
      waterMat.opacity = 0.5 * (1 - tubFall);
      puddle.scale.setScalar(0.001 + tubFall * 0.75);
      const p = wGeo.attributes.position;
      for (let i = 0; i < NW; i++) {
        const u = (wPh[i] + t * 0.25) % 1;
        p.setXYZ(i, -0.45 + u * 0.9, 0.24 + Math.sin(u * Math.PI) * 0.02 - tubFall, (Math.sin(i * 12.9) * 0.2));
      }
      p.needsUpdate = true;
      stream.material.opacity = 0.7 * (1 - tubFall);
    },
  };
}
