import * as THREE from "three";
import { holoMaterial, pointsCloud, sampleSurface, smooth, label, std } from "../lib.js";
import { makeGuoke } from "./guoke-body.js";

export const meta = {
  id: "holo-human", group: "人物", icon: "💠", title: "光线虚拟人", sub: "一团烟雾变成人形",
  chapter: "第八章 · 第二十二章",
  summary:
    "有的人是真身通过运动网瞬间到场；有的人先出现一团烟雾，再慢慢变成人形，这就是光线虚拟人，真身在远处通过信息网和你说话。虚拟人和真人看上去几乎没有区别，能说话、有表情，却没有重量，走路飘飘然，能直接穿墙而过，手摸过去就像穿过空气。白天光线足，虚拟人明亮清晰；晚上光线少就暗淡些。书里说约百分之九十的果克人平时以虚拟人身份生活，想回到肉体时再从容器里取出备用身体。",
  principle:
    "人工场远程「锁住」当地的光线和颜色，叠加三维成像，凑成一个由光线构成的人形。背后有全球运动网、信息网和定位系统实时提供感知和服务，人的意识以数字形式存在计算机里。虚拟人看起来能搬东西，其实是请运动网替它搬。它不吃不喝，没有病痛和重量感，没有昼夜和睡眠，也感觉不到冷热。",
  quotes: [
    ["光线影像组成的三维虚拟人", "第二十二章"],
    ["烟雾慢慢转化", "第八章"],
  ],
  model:
    "虚拟人用菲涅尔全息材质（边缘亮、中间透，带扫描线），烟雾是从人体表面采样出来的粒子，先散成一团再聚拢。为了和真人区分，这里把它画成发光的样子；按书里的描写，成像足够细腻时它和真人一模一样。墙是实心的，虚拟人穿过时墙没有任何变化。",
};

export function build() {
  const root = new THREE.Group();

  // 实心墙
  const wall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.18), std(0x5e5a55, { roughness: 0.85 }));
  wall.position.set(0, 0.8, -0.35);
  root.add(wall);

  // 真人诺顿
  const norton = makeGuoke({ female: false });
  norton.root.position.set(0.75, 0, 0.45);
  norton.root.rotation.y = -0.9;
  root.add(norton.root);
  const lblN = label("真人 · 诺顿");
  lblN.position.set(0.75, 1.3, 0.45);
  root.add(lblN);

  // 虚拟人：复用果克人体，换成全息材质
  const holo = makeGuoke({ female: true, icon: false });
  const hm = holoMaterial(0x8fd8ff, { power: 1.7, base: 0.12, intensity: 1.7, scan: 1 });
  holo.root.traverse((o) => { if (o.isMesh) { o.material = hm; o.castShadow = false; } });
  holo.root.position.set(-0.4, 0, 0.35);
  holo.root.rotation.y = 0.5;
  root.add(holo.root);
  holo.root.updateMatrixWorld(true);
  const N = 2600;
  const targets = sampleSurface(holo.meshes(), N);
  const local = targets.map((p) => holo.root.worldToLocal(p.clone()));
  const smoke = pointsCloud(N, 0xe8f6ff, 0.03);
  holo.root.add(smoke);
  const start = local.map(() => new THREE.Vector3((Math.random() - 0.5) * 0.9, 0.2 + Math.random() * 0.9, (Math.random() - 0.5) * 0.9));
  const lblH = label("光线虚拟人", { color: "#9fe0ff" });
  lblH.position.set(0, 1.25, 0);
  holo.root.add(lblH);

  let form = -1;   // 成形进度计时
  let walk = -1;   // 穿墙计时
  let reach = -1;  // 伸手计时
  const pos = smoke.geometry.attributes.position;

  function setFormed(k) {
    // k: 0 = 烟雾团, 1 = 人形
    for (let i = 0; i < N; i++) {
      const s = start[i], e = local[i];
      const w = smooth(0, 1, k * 1.25 - (i % 50) / 200);
      pos.setXYZ(i, s.x + (e.x - s.x) * w, s.y + (e.y - s.y) * w, s.z + (e.z - s.z) * w);
    }
    pos.needsUpdate = true;
    smoke.material.opacity = 0.9 * (1 - smooth(0.75, 1, k)) + 0.05;
    hm.uniforms.uOpacity.value = smooth(0.55, 1, k);
  }
  setFormed(1);
  let ctxRef = null;

  return {
    root, height: 1.6, span: 2.6, targetY: 0.7, dist: 4.4, view: [0.25, 0.25, 1],
    actions: [
      { label: "烟雾凝聚成人", run: () => { form = 0; walk = -1; holo.root.position.set(-0.4, 0, 0.35); ctxRef?.setState("先出现一团白色烟雾，再慢慢变成人形"); } },
      { label: "穿墙而过", run: () => { walk = 0; ctxRef?.setState("虚拟人没有质量，直接穿过实心墙，墙没有任何变化"); } },
      { label: "诺顿伸手去摸", run: () => { reach = 0; ctxRef?.setState("手摸过去，就像穿过空气"); } },
    ],
    init(ctx) { ctxRef = ctx; },
    update(t, dt) {
      norton.update(t, dt);
      holo.update(t, dt);
      hm.uniforms.uTime.value = t;
      if (form >= 0) {
        form += dt / 3.2;
        setFormed(Math.min(1, form));
        if (form >= 1) form = -1;
      }
      // 烟雾粒子轻微飘动
      smoke.rotation.y = Math.sin(t * 0.7) * 0.01;
      // 穿墙：从墙前走到墙后再走回来
      if (walk >= 0) {
        walk += dt;
        const k = walk < 3 ? smooth(0, 3, walk) : 1 - smooth(3.6, 6.6, walk);
        holo.root.position.set(-0.4 + k * 0.1, 0.03 * Math.sin(walk * 5), 0.35 - k * 1.5);
        holo.root.rotation.y = walk < 3.3 ? Math.PI * 0.95 : 0.5;
        if (walk > 6.6) { walk = -1; holo.root.rotation.y = 0.5; }
      }
      // 伸手：诺顿右手前伸，手穿过虚拟人
      if (reach >= 0) {
        if (reach === 0) { walk = -1; holo.root.position.set(-0.4, 0, 0.35); holo.root.rotation.y = 0.5; }
        reach += dt;
        const k = smooth(0, 1.2, reach) * (1 - smooth(4.4, 5.6, reach));
        norton.root.position.set(0.75 - k * 0.75, 0, 0.45 - k * 0.1);
        norton.root.rotation.y = -0.9 - k * 0.55;
        if (reach > 1.2 && reach < 1.3) norton.reach();
        if (reach > 5.6) reach = -1;
      }
    },
  };
}
