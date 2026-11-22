import * as THREE from "three";
import { holoMaterial } from "../lib.js";

// 果克星人身体（单位：米，身高约 1 m），供多个展品复用。
// 依据书中第一、八章：大眼、饱满发亮的眼睑、头不大、下巴鼻嘴都小、耳朵大而薄、
// 上唇微翘呈 m 状；粉白色、极细腻、漫反射的皮肤，偶带雪青色；
// 四肢躯干浑圆、没有骨骼肌肉感；女性腰极细（和成人手臂差不多粗）、臀宽；
// 女性头发像黑得发亮的橡胶管，一束一束螺旋、向外膨开，夹杂雪青色；男性头发像一整块贴头皮的橡胶。

export function skinMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xe8cdd5, roughness: 0.78, metalness: 0,
    sheen: 0.3, sheenColor: new THREE.Color(0xb7a2f0), sheenRoughness: 0.7,
  });
}

const rubber = (color) => new THREE.MeshPhysicalMaterial({
  color, roughness: 0.22, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08,
});

function lathe(profile, mat, zScale = 0.78, seg = 48) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.scale.z = zScale;
  return m;
}

// 一条「浑圆」的肢体：两端半球、中间渐细
function limb(r0, r1, len, mat) {
  const pts = [];
  const N = 14;
  for (let i = 0; i <= N; i++) { // 上端半球
    const a = (i / N) * Math.PI / 2;
    pts.push(new THREE.Vector2(Math.sin(a) * r0, -r0 + Math.cos(a) * r0 + r0));
  }
  pts.reverse();
  const out = [];
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI / 2;
    out.push(new THREE.Vector2(Math.cos(a) * r1, -len - Math.sin(a) * r1));
  }
  const prof = [new THREE.Vector2(0, r0)];
  for (let i = 1; i <= N; i++) { const a = (i / N) * Math.PI / 2; prof.push(new THREE.Vector2(Math.sin(a) * r0, Math.cos(a) * r0)); }
  for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI / 2; prof.push(new THREE.Vector2(Math.cos(a) * r1, -len - Math.sin(a) * r1)); }
  const g = new THREE.LatheGeometry(prof, 32);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function eye(side, skin) {
  const g = new THREE.Group();
  // 眼球：深色、湿润、有清漆高光
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 28),
    new THREE.MeshPhysicalMaterial({ color: 0x120c1c, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02, metalness: 0 })
  );
  ball.scale.set(0.031, 0.04, 0.022);
  g.add(ball);
  // 虹膜：雪青色的圈
  const iris = new THREE.Mesh(
    new THREE.RingGeometry(0.009, 0.019, 40),
    new THREE.MeshBasicMaterial({ color: 0x7a5cc8, transparent: true, opacity: 0.85 })
  );
  iris.position.z = 0.0215;
  iris.scale.y = 1.2;
  g.add(iris);
  const glint = new THREE.Mesh(new THREE.CircleGeometry(0.0055, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  glint.position.set(side * -0.007, 0.012, 0.0225);
  g.add(glint);
  // 饱满发亮的上眼睑
  const lid = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshPhysicalMaterial({ color: skin.color, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15, sheen: 0.5, sheenColor: new THREE.Color(0xd9c8ff) })
  );
  lid.scale.set(0.035, 0.044, 0.026);
  lid.rotation.x = -0.55;
  g.add(lid);
  g.userData.lid = lid;
  return g;
}

function addHead(root, { female, skin, hairMat, hairMat2 }) {
  const head = new THREE.Group();
  head.position.y = 0.875;
  root.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), skin);
  skull.scale.set(0.095, 0.108, 0.1);
  head.add(skull);
  // 小小的下巴：头部下前方收窄
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 30), skin);
  jaw.scale.set(0.058, 0.05, 0.062);
  jaw.position.set(0, -0.06, 0.028);
  head.add(jaw);
  // 女性脸颊更饱满，像充气
  if (female) {
    for (const s of [-1, 1]) {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(1, 30, 20), skin);
      cheek.scale.set(0.04, 0.036, 0.04);
      cheek.position.set(s * 0.048, -0.035, 0.05);
      head.add(cheek);
    }
  }

  const eyes = [];
  for (const s of [-1, 1]) {
    const e = eye(s, skin);
    e.position.set(s * 0.04, 0.004, 0.083);
    e.rotation.y = s * 0.32;
    e.rotation.z = s * -0.12;
    head.add(e);
    eyes.push(e);
    // 眉毛：女性特别高挑
    const brow = new THREE.Mesh(
      new THREE.TorusGeometry(0.032, 0.0022, 6, 24, Math.PI * 0.75),
      new THREE.MeshStandardMaterial({ color: 0x1b1424, roughness: 0.6 })
    );
    brow.position.set(s * 0.04, female ? 0.03 : 0.022, 0.09);
    brow.rotation.set(-0.3, s * 0.3, Math.PI * 0.125 + (s > 0 ? 0 : Math.PI * 0.0) + (female ? s * 0.18 : 0));
    if (s < 0) brow.rotation.z = Math.PI - Math.PI * 0.125 - Math.PI * 0.75 + (female ? s * 0.18 : 0);
    head.add(brow);
  }

  // 小鼻子
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), skin);
  nose.scale.set(0.007, 0.006, 0.006);
  nose.position.set(0, -0.034, 0.1);
  head.add(nose);

  // 小嘴：上唇微翘成 m 状
  const lipMat = new THREE.MeshPhysicalMaterial({ color: female ? 0xe98aa6 : 0xd59aa6, roughness: 0.35, clearcoat: 0.6 });
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.058, 0.094);
  for (const s of [-1, 1]) {
    const bump = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), lipMat);
    bump.scale.set(0.007, 0.0045, 0.004);
    bump.position.set(s * 0.0055, 0.002, 0);
    mouth.add(bump);
  }
  const lower = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), lipMat);
  lower.scale.set(0.01, 0.0038, 0.0035);
  lower.position.set(0, -0.0045, -0.001);
  mouth.add(lower);
  head.add(mouth);

  // 大而薄的耳朵
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 30, 20), skin);
    ear.scale.set(0.008, 0.05, 0.03);
    ear.position.set(s * 0.097, 0.0, -0.005);
    ear.rotation.set(0.1, s * 0.35, s * -0.25);
    head.add(ear);
  }

  // 头发
  if (female) {
    const hair = new THREE.Group();
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
    cap.scale.set(0.1, 0.113, 0.105);
    cap.rotation.x = -0.92;
    hair.add(cap);
    // 一束一束呈螺旋式向外膨开的「橡胶管」
    const rnd = mulberry(7);
    const count = 34;
    for (let i = 0; i < count; i++) {
      const u = i / count;
      const phi = Math.acos(1 - u * 1.15); // 上半球为主
      const th = i * 2.399963;
      const dir = new THREE.Vector3(Math.sin(phi) * Math.sin(th), Math.cos(phi), Math.sin(phi) * Math.cos(th));
      if (dir.z > 0.35 && dir.y < 0.8) continue; // 留出脸和额头
      const start = dir.clone().multiply(new THREE.Vector3(0.095, 0.105, 0.1));
      const len = 0.12 + rnd() * 0.12;
      const turns = 1.6 + rnd() * 1.4;
      const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1));
      if (side.lengthSq() < 1e-3) side.set(1, 0, 0);
      side.normalize();
      const up = new THREE.Vector3().crossVectors(dir, side).normalize();
      const out = dir.clone().add(new THREE.Vector3(0, -0.35, 0)).normalize();
      const pts = [];
      for (let k = 0; k <= 40; k++) {
        const t = k / 40;
        const r = 0.004 + t * 0.022; // 越往外螺旋越大：膨开
        const a = t * turns * Math.PI * 2 + rnd() * 0.01;
        pts.push(start.clone().addScaledVector(out, t * len)
          .addScaledVector(side, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r));
      }
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.0062, 10, false),
        rnd() < 0.3 ? hairMat2 : hairMat
      );
      hair.add(tube);
    }
    head.add(hair);
  } else {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
    cap.scale.set(0.099, 0.112, 0.104);
    cap.rotation.x = -0.95;
    cap.position.y = 0.004;
    head.add(cap);
  }
  return { head, eyes, mouth };
}

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// 衣服图案像电视画面一样变化：一张流动的条纹贴图
function patternTexture(colors) {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 256;
  const g = c.getContext("2d");
  for (let y = 0; y < 256; y += 16) {
    g.fillStyle = colors[(y / 16) % colors.length];
    g.fillRect(0, y, 64, 16);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeGuoke({ female = true, suit = 0x1a1d2a, skirt = 0x7a3cc8, icon = true } = {}) {
  const root = new THREE.Group();
  const skin = skinMaterial();
  const hairMat = rubber(0x0b0a10);
  const hairMat2 = rubber(0x5b3f8f);

  const pelvis = new THREE.Group();
  root.add(pelvis);

  // 躯干：lathe 轮廓（半径, 高度）
  const torsoProfile = female
    ? [[0, 0.43], [0.06, 0.432], [0.1, 0.455], [0.112, 0.49], [0.1, 0.525], [0.065, 0.555], [0.037, 0.585], [0.036, 0.605], [0.055, 0.63], [0.074, 0.66], [0.08, 0.69], [0.074, 0.715], [0.05, 0.735], [0.024, 0.75], [0.023, 0.785], [0, 0.79]]
    : [[0, 0.43], [0.06, 0.432], [0.083, 0.46], [0.085, 0.5], [0.072, 0.545], [0.064, 0.585], [0.068, 0.625], [0.08, 0.665], [0.086, 0.695], [0.078, 0.72], [0.05, 0.738], [0.026, 0.752], [0.025, 0.785], [0, 0.79]];

  // 连体紧身服：像把身体涂了颜色，所以直接给躯干换材质
  const suitTex = patternTexture(female ? ["#15151d", "#191926", "#15151d", "#1b1630"] : ["#14233a", "#183150", "#14233a", "#1a2b48"]);
  const suitMat = new THREE.MeshPhysicalMaterial({
    color: female ? 0x2a2a36 : suit, metalness: female ? 0.75 : 0.25, roughness: female ? 0.32 : 0.5,
    clearcoat: 0.5, map: suitTex, emissive: female ? 0x0 : 0x0a2a50, emissiveMap: suitTex, emissiveIntensity: female ? 0 : 0.9,
  });
  const torso = lathe(torsoProfile, suitMat, 0.74);
  root.add(torso);
  // 脖子露出皮肤
  const neck = lathe([[0, 0.735], [0.025, 0.735], [0.024, 0.79], [0, 0.795]], skin, 0.9, 24);
  root.add(neck);

  if (female) {
    // 紫色发亮的小短裙
    const sk = lathe([[0.118, 0.405], [0.122, 0.43], [0.116, 0.47], [0.104, 0.52], [0.0, 0.52]], new THREE.MeshPhysicalMaterial({
      color: skirt, metalness: 0.55, roughness: 0.25, clearcoat: 1, emissive: 0x2a0a55, emissiveIntensity: 0.6, side: THREE.DoubleSide,
    }), 0.8, 64);
    root.add(sk);
    // 胸部：小而前突（被紧身衣覆盖）
    for (const s of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), suitMat);
      b.scale.set(0.03, 0.028, 0.038);
      b.position.set(s * 0.036, 0.675, 0.042);
      root.add(b);
    }
  }

  // 腿
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(s * (female ? 0.055 : 0.045), 0.45, 0);
    root.add(hip);
    const thigh = limb(female ? 0.05 : 0.044, 0.036, 0.19, female ? skin : suitMat);
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.21;
    hip.add(knee);
    const shin = limb(0.034, 0.024, 0.17, female ? skin : suitMat);
    knee.add(shin);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), skin); // 赤脚
    foot.scale.set(0.028, 0.018, 0.05);
    foot.position.set(0, -0.205, 0.018);
    knee.add(foot);
    legs.push({ hip, knee });
  }

  // 手臂（肩、肘两级关节，供动作使用）
  const arms = [];
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(s * (female ? 0.084 : 0.092), 0.7, 0);
    shoulder.rotation.z = s * 0.12;
    root.add(shoulder);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.031, 24, 16), suitMat);
    shoulder.add(ball);
    const upper = limb(0.027, 0.022, 0.13, female ? skin : suitMat);
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.145;
    shoulder.add(elbow);
    const fore = limb(0.022, 0.017, 0.12, skin);
    elbow.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), skin);
    hand.scale.set(0.018, 0.026, 0.012);
    hand.position.y = -0.15;
    elbow.add(hand);
    arms.push({ shoulder, elbow, side: s });
  }

  const { head, eyes } = addHead(root, { female, skin, hairMat, hairMat2 });

  // 头顶漂浮的三维立体小图像：表示个性 / 心情（人工场远程成像）
  let iconObj = null;
  if (icon) {
    iconObj = new THREE.Group();
    const hm = holoMaterial(female ? 0xff7ad9 : 0x5cd6ff, { power: 1.6, base: 0.15, intensity: 2.2 });
    const core = new THREE.Mesh(female ? new THREE.TorusKnotGeometry(0.03, 0.009, 90, 10, 2, 3) : new THREE.OctahedronGeometry(0.035, 0), hm);
    iconObj.add(core);
    iconObj.position.y = 1.1;
    iconObj.userData.mat = hm;
    root.add(iconObj);
  }

  // ---- 动作 ----
  const anim = { sit: 0, sitTarget: 0, reach: 0, ear: 0, greet: 0, laugh: 0, cruise: 0, cruiseTarget: 0, blinkT: 2 + Math.random() * 2, phase: Math.random() * 10 };
  const rArm = arms.find((a) => a.side < 0); // 角色自身的右手在 -X（面朝 +Z）

  function update(t, dt) {
    const ph = t + anim.phase;
    // 呼吸 / 轻微晃动
    torso.scale.x = 1 + Math.sin(ph * 1.6) * 0.008;
    head.rotation.y = Math.sin(ph * 0.4) * 0.12;
    head.rotation.x = Math.sin(ph * 0.33) * 0.04;

    // 眨眼
    anim.blinkT -= dt;
    let blink = 0;
    if (anim.blinkT < 0.15) blink = Math.sin(Math.max(0, anim.blinkT) / 0.15 * Math.PI);
    if (anim.blinkT < 0) anim.blinkT = 2.5 + Math.random() * 3;
    for (const e of eyes) e.userData.lid.rotation.x = -0.55 + blink * 1.1;

    // 右手按胸：见面礼
    if (anim.greet > 0) anim.greet = Math.max(0, anim.greet - dt);
    const g = anim.greet > 0 ? Math.sin(Math.min(1, (2.6 - anim.greet) / 2.6) * Math.PI) : 0;
    const k = Math.min(1, g * 1.6);
    rArm.shoulder.rotation.x = -k * 0.9;
    rArm.shoulder.rotation.z = rArm.side * 0.12 + k * 0.35;
    rArm.elbow.rotation.x = -k * 1.9;
    rArm.elbow.rotation.z = -k * 0.6;
    head.rotation.x += k * 0.18;

    // 右手向前伸
    if (anim.reach > 0) anim.reach = Math.max(0, anim.reach - dt);
    if (anim.reach > 0 && !anim.greet) {
      const r = Math.min(1, Math.sin(Math.min(1, (3 - anim.reach) / 3) * Math.PI) * 2);
      rArm.shoulder.rotation.x = -r * 1.45;
      rArm.elbow.rotation.x = -r * 0.1;
    }

    // 左手举到耳边：向全球运动网 / 信息网发请求的手势
    if (anim.ear > 0) anim.ear = Math.max(0, anim.ear - dt);
    const e = anim.ear > 0 ? Math.min(1, Math.sin(Math.min(1, (1.6 - anim.ear) / 1.6) * Math.PI) * 1.8) : 0;
    const lArm = arms.find((a) => a.side > 0);
    lArm.shoulder.rotation.x = -e * 0.5;
    lArm.shoulder.rotation.z = lArm.side * (0.12 + e * 2.3);
    lArm.elbow.rotation.z = e * 2.2;
    lArm.elbow.rotation.x = -e * 0.4;

    // 笑：上半身随节奏「活活」地抖
    if (anim.laugh > 0) anim.laugh = Math.max(0, anim.laugh - dt);
    const shake = anim.laugh > 0 ? Math.sin(t * 38) * 0.012 * Math.min(1, anim.laugh) : 0;
    head.position.y = 0.875 + shake;
    torso.position.y = shake * 0.4;

    // 离地巡航飘行
    anim.cruise += (anim.cruiseTarget - anim.cruise) * Math.min(1, dt * 1.4);
    const c = anim.cruise;
    root.position.y = c * 0.9 + Math.sin(ph * 1.3) * 0.02 * c;
    root.rotation.x = c * 0.9;
    anim.sit += (anim.sitTarget - anim.sit) * Math.min(1, dt * 4);
    for (const l of legs) { l.hip.rotation.x = -c * 0.15 - anim.sit * 1.45; l.knee.rotation.x = c * 0.25 + anim.sit * 1.45; }
    for (const a of arms) { if ((a !== rArm || !anim.greet) && (a === rArm || !anim.ear)) a.shoulder.rotation.x = c * 0.4; }

    if (iconObj) {
      iconObj.rotation.y = t * 1.2;
      iconObj.position.y = 1.1 + Math.sin(t * 2) * 0.015;
      iconObj.userData.mat.uniforms.uTime.value = t;
      iconObj.rotation.x = -root.rotation.x;
    }
    suitTex.offset.y = t * 0.12;
  }

  return {
    root, head, update, skin, suitMat,
    greet: () => { anim.greet = 2.6; },
    earTap: () => { anim.ear = 1.6; },
    reach: () => { anim.reach = 3; },
    sit: (on) => { anim.sitTarget = on ? 1 : 0; },
    laugh: () => { anim.laugh = 1.8; },
    cruise: (on) => { anim.cruiseTarget = on ? 1 : 0; },
    get cruising() { return anim.cruiseTarget > 0; },
    meshes: () => { const ms = []; root.traverse((o) => o.isMesh && o.visible && ms.push(o)); return ms; },
  };
}

// 地球人（作者本人）的半透明身高参照：1.70 m
export function earthlingGhost(height = 1.7) {
  const g = new THREE.Group();
  const m = holoMaterial(0x8fb8ff, { power: 2.4, base: 0.02, intensity: 0.55, scan: 1 });
  const s = height / 1.7;
  const add = (geo, x, y, z = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x * s, y * s, z); g.add(mesh); return mesh; };
  add(new THREE.SphereGeometry(0.11 * s, 24, 16), 0, 1.57).scale.y = 1.15;
  add(new THREE.CapsuleGeometry(0.17 * s, 0.42 * s, 8, 20), 0, 1.15).scale.z = 0.6;
  for (const x of [-0.09, 0.09]) add(new THREE.CapsuleGeometry(0.06 * s, 0.72 * s, 6, 12), x, 0.45);
  for (const x of [-0.23, 0.23]) add(new THREE.CapsuleGeometry(0.045 * s, 0.56 * s, 6, 12), x, 1.04).rotation.z = x > 0 ? 0.08 : -0.08;
  g.userData.mat = m;
  return g;
}
