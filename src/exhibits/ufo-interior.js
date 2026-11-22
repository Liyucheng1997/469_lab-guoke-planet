import * as THREE from "three";
import { glowTexture, label, std, smooth, alienText } from "../lib.js";
import { makeGuoke, earthlingGhost } from "./guoke-body.js";

export const meta = {
  id: "ufo-interior", group: "交通", icon: "🌀", title: "飞碟环形舱", sub: "一根大柱子和浮空立体屏",
  chapter: "第一章 · 第二章",
  summary:
    "进到飞碟里，是一间圆环形、极为精致的房子，金属一体成型，没有一条缝，也没有灯泡，却到处是柔和均匀的光。中心有一根直径约 3 米、高五六米的大柱子，和顶部连在一起，底部绕着一圈宽高约 40 厘米的台阶。房间里几乎没有陈设，所有仪表和控制都在贴着弧形墙壁、离地七八十厘米高浮在空中的三维立体屏里。屏幕可大可小，边缘整齐得像被利刀切过。诺顿在空中一划，先出现一块白色细腻的方块状「立体烟雾」，随后变成三维画面，上面是像英文字母组合的陌生文字。",
  principle:
    "立体屏是变化的电磁场产生的正反引力场在计算机控制下成像，所以不需要实体面板。飞船启动时，人只觉得身体一轻，屏幕上偶尔闪出一个星球又消失，一个甜美的女声一直在低声说话。到达后也不是走下飞船，而是「身体一飘」就直接瞬移到了机库。",
  quotes: [
    ["圆环形的极为精致的房子", "第一章"],
    ["中心有一个大柱子", "第一章"],
    ["离地面大约70---80 厘米高", "第一章"],
    ["立体烟雾块", "第二章"],
  ],
  model:
    "舱室外径按 16 米建（书里说「几十米」，这里缩小了一些好看清人），切掉了一部分墙和整个顶棚方便观看。立体屏先是一团方块状的白色粒子烟雾，再「收」成边缘锐利的发光画面。诺顿和作者（蓝色人形）站在屏前作尺度参照。",
};

function screenCanvas() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 576;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const g = c.getContext("2d");
  const glyph = alienText(4, { seed: 9, h: 70 });
  const glyph2 = alienText(3, { seed: 17, h: 52, color: "#ffe2a8" });
  function draw(t, planet) {
    g.clearRect(0, 0, 1024, 576);
    g.fillStyle = "rgba(6,18,36,0.78)"; g.fillRect(0, 0, 1024, 576);
    g.strokeStyle = "rgba(140,210,255,0.9)"; g.lineWidth = 4; g.strokeRect(2, 2, 1020, 572);
    // 星图网格
    g.strokeStyle = "rgba(120,190,255,0.25)"; g.lineWidth = 1;
    for (let x = 0; x < 1024; x += 48) { g.beginPath(); g.moveTo(x, 110); g.lineTo(x, 576); g.stroke(); }
    for (let y = 110; y < 576; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
    g.drawImage(glyph.texture.image, 30, 22, 70 * glyph.aspect, 70);
    // 航线
    g.strokeStyle = "#7fd4ff"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(120, 480); g.bezierCurveTo(350, 200, 650, 520, 900, 220); g.stroke();
    const u = (t * 0.08) % 1;
    const bx = (1 - u) ** 3 * 120 + 3 * (1 - u) ** 2 * u * 350 + 3 * (1 - u) * u * u * 650 + u ** 3 * 900;
    const by = (1 - u) ** 3 * 480 + 3 * (1 - u) ** 2 * u * 200 + 3 * (1 - u) * u * u * 520 + u ** 3 * 220;
    g.fillStyle = "#ffffff"; g.beginPath(); g.arc(bx, by, 9, 0, Math.PI * 2); g.fill();
    // 偶尔闪现的星球
    if (planet > 0) {
      const grd = g.createRadialGradient(760, 330, 10, 760, 330, 140);
      grd.addColorStop(0, `rgba(255,190,120,${planet})`); grd.addColorStop(0.7, `rgba(160,80,60,${planet})`); grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd; g.beginPath(); g.arc(760, 330, 140, 0, Math.PI * 2); g.fill();
    }
    g.drawImage(glyph2.texture.image, 620, 500, 52 * glyph2.aspect, 52);
    tex.needsUpdate = true;
  }
  return { tex, draw };
}

export function build() {
  const root = new THREE.Group();
  const RO = 8, RI = 1.5, HT = 5.5, CUT = Math.PI * 0.55;

  const shell = new THREE.MeshStandardMaterial({ color: 0x9aa1ab, metalness: 0.8, roughness: 0.36, side: THREE.DoubleSide, emissive: 0x1a2230, emissiveIntensity: 0.2, envMapIntensity: 0.5 });
  // 地板
  const floor = new THREE.Mesh(new THREE.RingGeometry(RI, RO, 128, 1), std(0x4c525c, { metalness: 0.7, roughness: 0.45, envMapIntensity: 0.4 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.005;
  root.add(floor);
  // 外墙：弧形、切掉一段
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(RO, RO * 0.96, HT, 160, 1, true, CUT / 2, Math.PI * 2 - CUT), shell);
  wall.position.y = HT / 2;
  root.add(wall);
  // 中心柱 + 台阶
  const col = new THREE.Mesh(new THREE.CylinderGeometry(RI, RI, HT + 0.6, 64), std(0xd8dce3, { metalness: 0.8, roughness: 0.25 }));
  col.position.y = (HT + 0.6) / 2;
  root.add(col);
  for (let i = 0; i < 2; i++) {
    const step = new THREE.Mesh(new THREE.CylinderGeometry(RI + 0.4 * (2 - i), RI + 0.4 * (2 - i), 0.4, 80), std(0xd0d4dc, { metalness: 0.7, roughness: 0.3 }));
    step.position.y = 0.2 + i * 0.4;
    root.add(step);
  }
  const lblCol = label("中心大柱 · 直径约 3 米");
  lblCol.position.set(0, HT + 1.1, 0);
  root.add(lblCol);
  // 墙面柔和均匀的光：贴着墙的一圈发光带
  const glowBand = new THREE.Mesh(new THREE.CylinderGeometry(RO - 0.02, RO - 0.02, 0.06, 160, 1, true, CUT / 2, Math.PI * 2 - CUT), new THREE.MeshBasicMaterial({ color: 0xeaf4ff, side: THREE.DoubleSide, toneMapped: false }));
  glowBand.position.y = HT - 0.3;
  root.add(glowBand);

  // 浮空立体屏：贴着弧形墙，离地 0.75 m
  const screenA = screenCanvas();
  const scrAng = Math.PI * 0.86;  // 斜后方，避开中心柱的遮挡
  const scrPos = new THREE.Vector3(Math.sin(scrAng) * (RO - 1.2), 0.75 + 0.9, Math.cos(scrAng) * (RO - 1.2));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshBasicMaterial({ map: screenA.tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  scr.position.copy(scrPos);
  scr.lookAt(0, scrPos.y, 0);
  root.add(scr);
  // 「立体烟雾块」：方块状的白色粒子
  const NS = 3000;
  const sGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array(NS * 3), sHome = [];
  for (let i = 0; i < NS; i++) sHome.push(new THREE.Vector3((Math.random() - 0.5) * 3.2, (Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 1.2));
  sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  const smoke = new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, map: glowTexture(), transparent: true, depthWrite: false, opacity: 0 }));
  smoke.position.copy(scrPos);
  smoke.quaternion.copy(scr.quaternion);
  smoke.frustumCulled = false;
  root.add(smoke);
  const lblScr = label("浮空立体屏 · 离地七八十厘米");
  lblScr.position.copy(scrPos).add(new THREE.Vector3(0, 1.35, 0));
  root.add(lblScr);

  // 人：诺顿 + 作者
  const norton = makeGuoke({ female: false });
  const np = new THREE.Vector3(Math.sin(scrAng - 0.16) * (RO - 3.4), 0, Math.cos(scrAng - 0.16) * (RO - 3.4));
  norton.root.position.copy(np);
  norton.root.lookAt(scrPos.x, 0, scrPos.z);
  root.add(norton.root);
  const me = earthlingGhost(1.7);
  me.position.set(Math.sin(scrAng + 0.14) * (RO - 3.6), 0, Math.cos(scrAng + 0.14) * (RO - 3.6));
  root.add(me);

  let form = 1, formTarget = 1, planet = 0, launch = -1, ctxRef = null, last = 0;

  return {
    root, height: 6.5, span: 16, targetY: 1.2, dist: 20, view: [0.1, 0.75, 1], bloom: 0.6, pedestal: false,
    actions: [
      { label: "空中一划：唤出 / 收起立体屏", run: () => { formTarget = formTarget ? 0 : 1; norton.reach(); ctxRef?.setState(formTarget ? "先出现白色细腻的方块状立体烟雾，再变成三维画面" : "画面散成烟雾消失"); } },
      { label: "飞船启动", run: () => { launch = 0; ctxRef?.setState("身体一轻；屏幕上闪出一个星球又消失"); } },
    ],
    init(ctx) { ctxRef = ctx; },
    update(t, dt) {
      norton.update(t, dt);
      me.userData.mat.uniforms.uTime.value = t;
      form += (formTarget - form) * Math.min(1, dt * 1.2);
      // 0→0.5：烟雾块出现；0.5→1：收成锐利画面
      const p = sGeo.attributes.position;
      const squash = smooth(0.45, 1, form);
      for (let i = 0; i < NS; i++) {
        const h = sHome[i];
        p.setXYZ(i, h.x * (1 + Math.sin(t + i) * 0.02), h.y, h.z * (1 - squash) + Math.sin(t * 2 + i) * 0.03 * (1 - squash));
      }
      p.needsUpdate = true;
      smoke.material.opacity = smooth(0, 0.35, form) * (1 - smooth(0.7, 1, form)) * 0.9;
      scr.material.opacity = smooth(0.7, 1, form);
      scr.visible = scr.material.opacity > 0.01;
      if (launch >= 0) {
        launch += dt;
        planet = Math.max(0, Math.sin(Math.min(1, (launch - 0.8) / 2.4) * Math.PI)) * (launch > 0.8 ? 1 : 0);
        norton.root.position.y = Math.sin(Math.min(1, launch / 1.2) * Math.PI) * 0.06; // 身体一轻
        glowBand.material.color.setHSL(0.58, 0.6, 0.85 + 0.15 * Math.sin(launch * 12));
        if (launch > 3.4) { launch = -1; planet = 0; glowBand.material.color.set(0xeaf4ff); }
      }
      if (t - last > 0.08) { last = t; screenA.draw(t, planet); }
    },
  };
}
