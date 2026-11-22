import * as THREE from "three";
import { glowTexture, sampleSurface, smooth, label, std, glowSprite } from "../lib.js";

export const meta = {
  id: "robot", group: "人物", icon: "🔴", title: "穿墙的发光机器人", sub: "无数飞舞的红色小虫",
  chapter: "第一章 · 第四章",
  summary:
    "1985 年初夏的夜里，作者看到土墙上渗出一股发光的液体，暗红色里夹着雪青色，渗进屋后逐渐变成几个人形。它们的身体像无数个飞舞的红色小虫子聚在一起，快速地、纷纷扰扰地舞动着，时时刻刻都在微微抖动，可以在液体和固体之间随意变化。墙外的另一个机器人拿着一个东西对墙照射，墙变得半透明，作者跟着它们以平常走路的速度穿了过去。到了飞船上，机器人身体突然收缩到一块，变成一颗紫红色的水珠，落在地上钻进地板不见了。",
  principle:
    "作者猜它们不是真人，后来得到证实是机器人。穿墙用的是和瞬移同样的人工场原理：照射让墙和人的质量暂时变成零，于是墙的每个分子都均匀地从身体里穿过去，而不是裂开一条缝。作者的感觉是有无数细砂在身体里轻轻摩擦，还带一点爽快，墙的土腥味很重，出来时脚后跟一阵木痛。",
  quotes: [
    ["墙壁上渗出一股发光的液体", "第一章"],
    ["像无数个飞舞的红色小虫子组合在一起", "第一章"],
    ["身体突然收缩到一块", "第四章"],
  ],
  model:
    "机器人是 3000 个粒子组成的人形，每个粒子都在原位附近乱飞，颜色在暗红和雪青之间。土墙用了带颗粒的贴图。「照射墙壁」时墙变半透明，机器人以走路速度穿过去。",
};

function earthTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#8a6a4a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const v = 90 + Math.random() * 70;
    g.fillStyle = `rgba(${v + 30},${v},${v - 30},${Math.random() * 0.5})`;
    g.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  for (let i = 0; i < 30; i++) { // 稻草与裂纹
    g.strokeStyle = `rgba(210,180,110,${0.3 + Math.random() * 0.3})`;
    g.lineWidth = 1.5;
    const x = Math.random() * 512, y = Math.random() * 512, a = Math.random() * Math.PI;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 30, y + Math.sin(a) * 30); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  return t;
}

// 一个 1.5 m 左右的人形，只用来采样粒子位置
function humanShape() {
  const g = new THREE.Group();
  const add = (geo, x, y, z = 0, rz = 0) => { const m = new THREE.Mesh(geo); m.position.set(x, y, z); m.rotation.z = rz; g.add(m); };
  add(new THREE.SphereGeometry(0.11, 16, 12), 0, 1.38);
  add(new THREE.CapsuleGeometry(0.15, 0.36, 6, 12), 0, 1.0);
  for (const s of [-1, 1]) {
    add(new THREE.CapsuleGeometry(0.055, 0.62, 6, 10), s * 0.085, 0.38);
    add(new THREE.CapsuleGeometry(0.04, 0.5, 6, 10), s * 0.22, 0.95, 0, s * 0.12);
  }
  g.updateMatrixWorld(true);
  return g;
}

function swarm(N, seed) {
  const shape = humanShape();
  const pts = sampleSurface(shape.children, N);
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    c.setHex(Math.random() < 0.72 ? 0xb3122a : 0xb48cff).multiplyScalar(0.7 + Math.random() * 0.8);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts3 = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.035, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  pts3.userData = { home: pts, phase: Float32Array.from({ length: N }, () => Math.random() * 100), seed };
  pts3.frustumCulled = false;
  return pts3;
}

export function build() {
  const root = new THREE.Group();

  // 土墙（墙面在 z=0）
  const wallMat = new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.95, transparent: true, opacity: 1 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(3, 2.2, 0.3), wallMat);
  wall.position.set(0, 1.1, 0);
  root.add(wall);
  const lblIn = label("屋里");
  lblIn.position.set(-1.25, 2.4, 0.9);
  const lblOut = label("墙外");
  lblOut.position.set(-1.25, 2.4, -0.9);
  root.add(lblIn, lblOut);

  const N = 3000;
  const A = swarm(N, 1); // 从墙里渗出的那个
  const B = swarm(N, 2); // 墙外照射墙的那个
  root.add(A, B);
  B.userData.base = new THREE.Vector3(0.8, 0, -1.1);
  B.rotation.y = Math.PI * 0.9;

  // 照射器 + 光锥
  const device = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.18, 12), std(0x2a2a30, { metalness: 0.8, roughness: 0.3 }));
  device.rotation.x = Math.PI / 2;
  root.add(device);
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xd8b4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.0, 32, 1, true), coneMat);
  root.add(cone);

  // 紫红色水珠
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.07, 24, 18), new THREE.MeshPhysicalMaterial({ color: 0xa0205a, emissive: 0x6a0a40, emissiveIntensity: 1.2, roughness: 0.1, clearcoat: 1, transparent: true }));
  drop.visible = false;
  root.add(drop);
  const dropGlow = glowSprite(0xff4a9a, 0.5, 0);
  root.add(dropGlow);

  // 状态：seep（渗出成形）→ idle → pass（穿墙）→ shrink（缩成水珠）
  let mode = "idle", e = 0, ctxRef = null;
  const tmp = new THREE.Vector3();
  const posA = new THREE.Vector3(0, 0, 0.7);
  let gather = 1, shrink = 0;

  function drive(sw, origin, rotY, t, dt, opts = {}) {
    const p = sw.geometry.attributes.position;
    const { home, phase } = sw.userData;
    const cos = Math.cos(rotY), sin = Math.sin(rotY);
    for (let i = 0; i < home.length; i++) {
      const h = home[i], ph = phase[i];
      // 原位附近乱飞：「纷纷扰扰」
      const jx = Math.sin(t * 7 + ph) * 0.025 + Math.sin(t * 13 + ph * 2) * 0.012;
      const jy = Math.cos(t * 9 + ph * 1.3) * 0.025;
      const jz = Math.sin(t * 11 + ph * 0.7) * 0.025;
      let x = h.x * cos + h.z * sin, z = -h.x * sin + h.z * cos, y = h.y;
      if (opts.gather !== undefined && opts.gather < 1) {
        // 从墙面上的一片发光液体汇聚：起点在墙面 z=0.16
        const g = smooth(0, 1, opts.gather * 1.3 - (ph % 1) * 0.3);
        const sx = (Math.sin(ph * 3.1) * 0.5) - origin.x, sy = 0.2 + ((ph * 7.3) % 1.6) - origin.y * 0, sz = 0.16 - origin.z;
        x = sx + (x - sx) * g; y = sy + (y - sy) * g; z = sz + (z - sz) * g;
      }
      if (opts.shrink) {
        const k = smooth(0, 1, opts.shrink);
        x *= 1 - k; z *= 1 - k; y = y * (1 - k) + 0.7 * k;
      }
      p.setXYZ(i, origin.x + x + jx, origin.y + y + jy, origin.z + z + jz);
    }
    p.needsUpdate = true;
  }

  return {
    root, height: 2.4, span: 3.2, targetY: 1.0, dist: 5.6, view: [0.5, 0.25, 1], bloom: 0.9,
    actions: [
      { label: "从墙里渗出", run: () => { mode = "seep"; e = 0; posA.set(0, 0, 0.7); shrink = 0; A.visible = true; drop.visible = false; ctxRef?.setState("墙上渗出暗红夹雪青的发光液体，逐渐变成人形"); } },
      { label: "照射墙壁 · 穿墙而过", run: () => { mode = "pass"; e = 0; A.visible = true; drop.visible = false; shrink = 0; ctxRef?.setState("墙外的机器人对墙照射，墙变得半透明，以走路的速度穿过去"); } },
      { label: "缩成紫红色水珠", run: () => { mode = "shrink"; e = 0; ctxRef?.setState("身体突然收缩到一块，变成水珠，钻进地板消失"); } },
    ],
    init(ctx) { ctxRef = ctx; },
    update(t, dt) {
      e += dt;
      // 墙外的机器人：拿着照射器
      drive(B, B.userData.base, Math.PI * 0.1, t, dt);
      device.position.set(B.userData.base.x - 0.25, 1.0, B.userData.base.z + 0.3);
      device.lookAt(0.1, 1.0, 0);
      device.rotateX(Math.PI / 2);
      let beam = 0;

      if (mode === "seep") {
        gather = Math.min(1, e / 4);
        drive(A, posA, 0, t, dt, { gather });
        if (e > 4.2) mode = "idle";
      } else if (mode === "pass") {
        beam = smooth(0, 0.8, e) * (1 - smooth(5.2, 6, e));
        const k = smooth(1.2, 4.8, e);
        posA.set(0.1 * k, 0, 0.7 - k * 1.8);
        drive(A, posA, Math.PI, t, dt);
        if (e > 6.5) { mode = "idle"; }
      } else if (mode === "shrink") {
        shrink = Math.min(1, e / 1.4);
        drive(A, posA, 0, t, dt, { shrink });
        if (e > 1.4) {
          A.visible = false;
          drop.visible = true;
          const f = e - 1.4;
          drop.position.set(posA.x, Math.max(0.07, 0.7 - f * f * 2.5), posA.z);
          // 钻进地板：落地后逐渐下沉
          if (drop.position.y <= 0.071) drop.position.y = 0.07 - Math.max(0, f - 0.55) * 0.12;
          drop.material.opacity = 1 - smooth(1.2, 2.4, f);
          dropGlow.position.copy(drop.position);
          dropGlow.material.opacity = drop.material.opacity * 0.8;
          if (f > 2.5) { mode = "done"; drop.visible = false; dropGlow.material.opacity = 0; }
        }
      } else if (mode === "idle") {
        drive(A, posA, posA.z < 0 ? Math.PI : 0, t, dt);
      }
      wallMat.opacity = 1 - beam * 0.72;
      wallMat.depthWrite = wallMat.opacity > 0.95;
      coneMat.opacity = beam * 0.22;
      tmp.set(0.1, 1.0, -0.15);
      cone.position.copy(device.position).lerp(tmp, 0.5);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), device.position.clone().sub(tmp).normalize());
      cone.scale.set(1, device.position.distanceTo(tmp), 1);
    },
  };
}
