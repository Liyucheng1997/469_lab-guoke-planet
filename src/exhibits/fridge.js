import * as THREE from "three";
import { glowTexture, holoMaterial, alienSign, label, std, phys } from "../lib.js";
import { makeGuoke } from "./guoke-body.js";

export const meta = {
  id: "fridge", group: "生活", icon: "🧊", title: "时空冰箱", sub: "不降温，让时间变慢",
  chapter: "第二十三章",
  summary:
    "果克星球的冰箱不靠低温冷冻，靠的是让时间凝固。冰箱里的温度和外面一样，可外面过了一年，里面连千分之一秒都不到，放进去的雪糕一年后取出来几乎没变。这种冰箱一般都很巨大，外表像房屋、大楼，很少用来放食品，主要用在工业和科研上。生物研究所里一排排装着微黄透明液体的玻璃容器，泡着似睡非睡的备用身体，它们其实也是时空冰箱。",
  principle:
    "用人工场照射冰箱内部的空间，让这一处空间的时间流速和外面不一样。冰箱有调节档位：低档时里面一分钟、外面一年；高档时里面一分钟、外面几千年。档位越高，维持的时间差越大，耗能越多，设备越庞大，系统也越不稳定，所以备用身体的容器只开到「外面一年，里面几秒」，还得用管子供给营养。按下时空转换开关选「负」，就反过来，里面的时间比外面快，研究所用这种冰箱看病毒和人体在里面「进化一万年」，外面才过几个小时。但它不能让时间倒流：时间快慢只能拿两个地方来比较。",
  quotes: [
    ["我们是使时间凝固的方法", "第二十三章 · 微丽"],
    ["有调节档位大小的，有时空转换开关", "第二十三章"],
    ["时间是不可能倒流的", "第二十三章"],
  ],
  model:
    "左边是对照组，右边玻璃舱里是一模一样的雪糕、摆锤和一盆小苗。「快进外面的时间」让外面过一年：对照组的雪糕化掉、钟飞转，舱里纹丝不动。切到「负」档后舱里反而更快：小苗在里面长大、开枝。档位越高，舱壁上的场越亮，抖动也越明显，对应书里说的「越不稳定」。后面一排是泡着备用身体的容器型时空冰箱。",
};

// 档位：里面 1 分钟 ≈ 外面多久（按书中说法：低档一年，高档几千年）
const GEARS = [
  { name: "1 档", outside: "1 年", ratio: 5.3e5 },
  { name: "2 档", outside: "10 年", ratio: 5.3e6 },
  { name: "3 档", outside: "100 年", ratio: 5.3e7 },
  { name: "4 档", outside: "1000 年", ratio: 5.3e8 },
  { name: "5 档", outside: "5000 年", ratio: 2.6e9 },
];

function iceCream() {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 24, 1, true), std(0xd9a35a, { roughness: 0.8 }));
  cone.rotation.x = Math.PI;
  cone.position.y = 0.08;
  const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.066, 32, 24), phys(0xffd9e6, { roughness: 0.55, clearcoat: 0.3 }));
  scoop.position.y = 0.19;
  const drip = new THREE.Mesh(new THREE.CircleGeometry(1, 32), phys(0xffd9e6, { roughness: 0.2, clearcoat: 1 }));
  drip.rotation.x = -Math.PI / 2;
  drip.position.y = 0.012;
  drip.scale.setScalar(0.001);
  // 托住雪糕的小支架
  const holder = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.005, 8, 32), std(0xb9c4d6, { metalness: 0.9, roughness: 0.25 }));
  holder.rotation.x = Math.PI / 2;
  holder.position.y = 0.06;
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.05, 0.06, 16, 1, true), std(0xb9c4d6, { metalness: 0.9, roughness: 0.25, wireframe: true }));
  legs.position.y = 0.03;
  g.add(cone, scoop, drip, holder, legs);
  g.userData = { scoop, drip, melt: 0 };
  return g;
}

function setMelt(ic, m) {
  const { scoop, drip } = ic.userData;
  ic.userData.melt = m;
  const k = Math.max(0.02, 1 - m);
  scoop.scale.set(1 + m * 0.15, k * k, 1 + m * 0.15);
  scoop.position.y = 0.16 + 0.03 * k;
  drip.scale.setScalar(0.01 + Math.min(1, m * 1.2) * 0.13);
}

function stand(h = 0.6) {
  const g = new THREE.Group();
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, h, 32), std(0x2a3140, { metalness: 0.7, roughness: 0.35 }));
  col.position.y = h / 2;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 40), std(0x3a4254, { metalness: 0.8, roughness: 0.3 }));
  top.position.y = h;
  g.add(col, top);
  return g;
}

function pendulum() {
  const g = new THREE.Group();
  const mat = std(0xb9c4d6, { metalness: 0.9, roughness: 0.25 });
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.008, 8, 48, Math.PI), mat);
  frame.position.y = 0.0;
  const pivot = new THREE.Group();
  pivot.position.y = 0.16;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.13, 6), mat);
  rod.position.y = -0.065;
  const bob = new THREE.Mesh(new THREE.SphereGeometry(0.022, 20, 14), std(0xffc24a, { metalness: 1, roughness: 0.2, emissive: 0x332000 }));
  bob.position.y = -0.135;
  pivot.add(rod, bob);
  g.add(frame, pivot);
  g.userData.pivot = pivot;
  return g;
}

function sprout() {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.08, 24), std(0x6b4a3a, { roughness: 0.9 }));
  pot.position.y = 0.04;
  g.add(pot);
  const stemMat = std(0x5cbf6a, { roughness: 0.6 });
  const leafMat = std(0x7be08a, { roughness: 0.5, side: THREE.DoubleSide });
  const parts = [];
  // 预先生成一棵会「进化」的小植物：越往后，枝叶越多、越复杂
  const add = (parent, depth, len, ang) => {
    const node = new THREE.Group();
    node.rotation.z = ang;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004 * (4 - depth) * 0.6, 0.006 * (4 - depth) * 0.6, len, 6), stemMat);
    stem.position.y = len / 2;
    node.add(stem);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), leafMat);
    leaf.scale.set(0.03, 0.006, 0.016);
    leaf.position.y = len;
    node.add(leaf);
    parent.add(node);
    parts.push({ node, depth });
    if (depth < 3) {
      const kid = new THREE.Group();
      kid.position.y = len;
      node.add(kid);
      add(kid, depth + 1, len * 0.72, 0.6);
      add(kid, depth + 1, len * 0.72, -0.55);
    }
  };
  const base = new THREE.Group();
  base.position.y = 0.08;
  g.add(base);
  add(base, 0, 0.12, 0);
  g.userData.parts = parts;
  return g;
}

function setGrowth(pl, x) {
  for (const p of pl.userData.parts) {
    const s = THREE.MathUtils.clamp(x * 4 - p.depth, 0, 1);
    p.node.scale.setScalar(Math.max(0.0001, s));
  }
}

// 钟面 + 读数，画在一张画布上，贴到全息屏
function makeScreen() {
  const c = document.createElement("canvas");
  c.width = 768; c.height = 432;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const g = c.getContext("2d");
  function clock(x, y, r, t, title, color) {
    g.strokeStyle = color; g.lineWidth = 4;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.beginPath(); g.moveTo(x + Math.sin(a) * r * 0.82, y - Math.cos(a) * r * 0.82); g.lineTo(x + Math.sin(a) * r * 0.95, y - Math.cos(a) * r * 0.95); g.stroke();
    }
    const hand = (a, len, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * len, y - Math.cos(a) * len); g.stroke(); };
    hand(t / 3600 * Math.PI * 2, r * 0.5, 6);
    hand(t / 60 * Math.PI * 2, r * 0.75, 4);
    hand(t * Math.PI * 2, r * 0.88, 2);
    g.fillStyle = color; g.font = "500 30px -apple-system,'PingFang SC','Microsoft YaHei',sans-serif"; g.textAlign = "center";
    g.fillText(title, x, y + r + 42);
  }
  function draw(s) {
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = "rgba(8,20,40,0.55)"; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = "rgba(120,200,255,0.8)"; g.lineWidth = 3; g.strokeRect(2, 2, c.width - 4, c.height - 4);
    clock(180, 170, 105, s.outT, "外面的时间", "#cfe6ff");
    clock(560, 170, 105, s.inT, "冰箱里的时间", s.neg ? "#ffcf7a" : "#8fe0ff");
    g.fillStyle = "#e8f2ff"; g.font = "600 32px -apple-system,'PingFang SC','Microsoft YaHei',sans-serif"; g.textAlign = "left";
    g.fillText(s.on ? `${s.gear.name} · ${s.neg ? "负（里面更快）" : "正（里面更慢）"}` : "人工场已关闭", 24, 400);
    g.textAlign = "right";
    g.fillStyle = s.on ? "#8fe0ff" : "#8d97a8";
    g.fillText(s.on ? (s.neg ? `里面 ${s.gear.outside} ≈ 外面 1 分钟` : `里面 1 分钟 ≈ 外面 ${s.gear.outside}`) : "里外时间相同", 744, 400);
    tex.needsUpdate = true;
  }
  return { tex, draw };
}

export function build() {
  const root = new THREE.Group();

  // ---- 舱体：金属底座 + 玻璃罩 ----
  const W = 1.5, D = 1.1, Hc = 1.5;
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.12, D + 0.2), std(0x1c2230, { metalness: 0.8, roughness: 0.35 }));
  base.position.set(0.55, 0.06, 0);
  root.add(base);
  const chamber = new THREE.Group();
  chamber.position.set(0.55, 0.12, 0);
  root.add(chamber);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(W, Hc, D), new THREE.MeshPhysicalMaterial({
    color: 0xcfe8ff, metalness: 0, roughness: 0.05, transmission: 0.92, thickness: 0.05, transparent: true, opacity: 0.25, depthWrite: false,
  }));
  glass.position.y = Hc / 2;
  chamber.add(glass);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, Hc, D)), new THREE.LineBasicMaterial({ color: 0x9ad8ff }));
  edges.position.y = Hc / 2;
  chamber.add(edges);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, 0.1, D + 0.12), std(0x1c2230, { metalness: 0.8, roughness: 0.35 }));
  cap.position.y = Hc + 0.05;
  chamber.add(cap);
  const sign = alienSign(2, 0.07, { seed: 23 });
  sign.position.set(0, Hc + 0.05, D / 2 + 0.065);
  chamber.add(sign);

  // 场：贴在舱壁内侧的全息壳（越高档越亮，5 档开始抖）
  const fieldMat = holoMaterial(0x5cc8ff, { power: 1.4, base: 0.05, intensity: 1.2, scan: 1 });
  const field = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, Hc - 0.02, D - 0.02, 8, 8, 8), fieldMat);
  field.position.y = Hc / 2;
  chamber.add(field);

  // ---- 舱内与对照组：同样的雪糕、摆锤 ----
  const inStand = stand(0.55); inStand.position.set(-0.25, 0, 0); chamber.add(inStand);
  const inIce = iceCream(); inIce.position.set(0, 0.56, 0); inStand.add(inIce);
  const inPend = pendulum(); inPend.position.set(0.25, 0.75, -0.2); chamber.add(inPend);
  const plant = sprout(); plant.position.set(0.32, 0, 0.18); chamber.add(plant);
  const pStand = stand(0.42); pStand.position.set(0.25, 0, -0.2); chamber.add(pStand);

  const outGroup = new THREE.Group();
  outGroup.position.set(-1.05, 0, 0.1);
  root.add(outGroup);
  const outStand = stand(0.67); outGroup.add(outStand);
  const outIce = iceCream(); outIce.position.set(0, 0.68, 0); outStand.add(outIce);
  const outPend = pendulum(); outPend.position.set(0, 1.1, 0); outGroup.add(outPend);
  const outLbl = label("对照组 · 普通空间"); outLbl.position.set(0, 1.42, 0); outGroup.add(outLbl);
  const inLbl = label("时空冰箱内部", { color: "#8fe0ff" }); inLbl.position.set(0, Hc + 0.32, 0); chamber.add(inLbl);

  // 舱内漂浮的尘埃：在里面时间凝固时会停在半空
  const ND = 120;
  const dustGeo = new THREE.BufferGeometry();
  const dp = new Float32Array(ND * 3), dv = new Float32Array(ND * 3);
  for (let i = 0; i < ND; i++) {
    dp.set([(Math.random() - 0.5) * (W - 0.1), Math.random() * (Hc - 0.1) + 0.05, (Math.random() - 0.5) * (D - 0.1)], i * 3);
    dv.set([(Math.random() - 0.5) * 0.1, (Math.random() - 0.3) * 0.08, (Math.random() - 0.5) * 0.1], i * 3);
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xcfeaff, size: 0.018, map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  chamber.add(dust);

  // ---- 控制台：全息屏（钟 + 读数）----
  const screen = makeScreen();
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.54), new THREE.MeshBasicMaterial({ map: screen.tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  scr.position.set(1.95, 1.25, 0.25);
  scr.rotation.y = -0.35;
  root.add(scr);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.95, 16), std(0x2a3140, { metalness: 0.7, roughness: 0.35 }));
  post.position.set(1.95, 0.475, 0.25);
  root.add(post);

  // ---- 后排：泡着备用身体的容器型时空冰箱 ----
  const tanks = new THREE.Group();
  tanks.position.set(0, 0, -2.1);
  root.add(tanks);
  const sleepers = [];
  [-1.3, -0.1, 1.1].forEach((x, i) => {
    const t = new THREE.Group();
    t.position.x = x;
    tanks.add(t);
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.55, 40), new THREE.MeshPhysicalMaterial({
      color: 0xf2dc8a, transparent: true, opacity: 0.32, roughness: 0.1, depthWrite: false, emissive: 0x3a2a00, emissiveIntensity: 0.4,
    }));
    liquid.position.y = 0.95;
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.62, 40, 1, true), new THREE.MeshPhysicalMaterial({
      color: 0xdff2ff, transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide,
    }));
    shell.position.y = 0.95;
    const ring1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 40), std(0x1c2230, { metalness: 0.8, roughness: 0.35 }));
    ring1.position.y = 0.07;
    const ring2 = ring1.clone(); ring2.position.y = 1.83;
    const body = makeGuoke({ female: i !== 1, icon: false });
    body.root.scale.setScalar(1.05);
    body.root.position.y = 0.38;
    body.root.rotation.y = Math.PI * 0.08 * (i - 1);
    // 背后的营养管
    const tubeCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.95, -0.06), new THREE.Vector3(0, 1.1, -0.3), new THREE.Vector3(0, 1.75, -0.32)]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(tubeCurve, 30, 0.012, 8), std(0x332a3a, { roughness: 0.4 }));
    t.add(ring1, ring2, body.root, tube, liquid, shell);
    sleepers.push(body);
  });
  const tankLbl = label("备用身体容器 · 外面一年，里面几秒", { color: "#f4e2a6" });
  tankLbl.position.set(-0.1, 2.12, -2.1);
  root.add(tankLbl);

  // ---- 状态 ----
  const S = { on: true, gear: 0, neg: false, outT: 0, inT: 0, fast: 0, outMelt: 0, inMelt: 0, growth: 0, outPh: 0, inPh: 0 };
  let ctxRef = null;
  const say = () => ctxRef?.setState(S.on ? `${GEARS[S.gear].name} · ${S.neg ? "负：里面的时间比外面快" : "正：里面的时间几乎凝固"}` : "人工场关闭：里外时间流速相同");

  let lastDraw = 0;
  return {
    root, height: 2.4, span: 4.2, targetY: 0.95, dist: 7.0, view: [0.12, 0.28, 1],
    actions: [
      { label: "快进外面的时间（一年）", run: () => { S.fast = 5; } },
      { label: "档位 +", run: () => { S.gear = Math.min(4, S.gear + 1); say(); } },
      { label: "档位 −", run: () => { S.gear = Math.max(0, S.gear - 1); say(); } },
      { label: "时空转换开关：正 / 负", run: () => { S.neg = !S.neg; S.growth = 0; say(); } },
      { label: "开 / 关人工场", run: () => { S.on = !S.on; say(); } },
      { label: "换两根新雪糕", run: () => { S.outMelt = 0; S.inMelt = 0; } },
    ],
    init(ctx) { ctxRef = ctx; say(); },
    update(t, dt) {
      // 外面的时间速率：平时 1×；「快进」时极快（把一年压缩进 5 秒）
      if (S.fast > 0) S.fast = Math.max(0, S.fast - dt);
      const outRate = S.fast > 0 ? 60 : 1;
      const g = GEARS[S.gear];
      // 里面的相对速率：正档 ≈ 0（凝固）；负档取演示上限
      const rel = !S.on ? 1 : S.neg ? Math.min(40, 6 + S.gear * 8) : 1 / g.ratio;
      const inRate = outRate * rel;

      S.outT += dt * outRate * (S.fast > 0 ? 400 : 1);
      S.inT += dt * inRate * (S.fast > 0 ? 400 : 1);
      // 雪糕：外面约 30 秒化完
      S.outMelt = Math.min(1, S.outMelt + dt * outRate / 30);
      S.inMelt = Math.min(1, S.inMelt + dt * inRate / 30);
      setMelt(outIce, S.outMelt);
      setMelt(inIce, S.inMelt);
      // 摆锤
      S.outPh += dt * outRate * 3;
      S.inPh += dt * Math.min(inRate, 30) * 3;
      outPend.userData.pivot.rotation.z = Math.sin(S.outPh) * 0.5;
      inPend.userData.pivot.rotation.z = Math.sin(S.inPh) * 0.5;
      // 小苗：只有里面时间快时才看得出生长与「进化」
      if (S.on && S.neg) S.growth = Math.min(1, S.growth + dt * inRate / 120);
      else if (!S.on) S.growth = Math.min(1, S.growth + dt * outRate / 600);
      setGrowth(plant, 0.12 + S.growth * 0.88);
      // 尘埃
      const p = dustGeo.attributes.position;
      const step = dt * Math.min(inRate, 30);
      for (let i = 0; i < ND; i++) {
        let x = p.getX(i) + dv[i * 3] * step, y = p.getY(i) + dv[i * 3 + 1] * step, z = p.getZ(i) + dv[i * 3 + 2] * step;
        if (Math.abs(x) > (W - 0.1) / 2) dv[i * 3] *= -1;
        if (y < 0.05 || y > Hc - 0.05) dv[i * 3 + 1] *= -1;
        if (Math.abs(z) > (D - 0.1) / 2) dv[i * 3 + 2] *= -1;
        p.setXYZ(i, x, y, z);
      }
      p.needsUpdate = true;
      // 场的亮度与不稳定
      const u = fieldMat.uniforms;
      u.uTime.value = t;
      const target = S.on ? 0.5 + S.gear * 0.22 : 0;
      u.uOpacity.value += (target - u.uOpacity.value) * Math.min(1, dt * 3);
      u.uColor.value.setHex(S.neg ? 0xffb84a : 0x5cc8ff);
      const jitter = S.on && S.gear >= 3 ? (S.gear - 2) * 0.004 : 0;
      field.position.set((Math.random() - 0.5) * jitter, Hc / 2 + (Math.random() - 0.5) * jitter, 0);
      field.scale.setScalar(1 + (Math.random() - 0.5) * jitter * 2);
      // 后排备用身体：几乎不动（容器里的时间也很慢）
      for (const s of sleepers) s.update(t * 0.02, dt * 0.02);
      // 屏幕 10 帧/秒
      if (t - lastDraw > 0.1) { lastDraw = t; screen.draw({ ...S, gear: g }); }
      
    },
  };
}
