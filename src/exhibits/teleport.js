import * as THREE from "three";
import { glowSprite, holoMaterial, label, std, alienSign, smooth } from "../lib.js";
import { makeGuoke } from "./guoke-body.js";

export const meta = {
  id: "teleport", group: "网络", icon: "✨", title: "瞬移", sub: "密封房间里一闪就不见",
  chapter: "第七章 · 第八章",
  summary:
    "诺顿左手在耳边空中猛地一劈，桌上就出现了一个像企鹅的银白色金属瓶和一把弯弯的金属剪刀；喝完再一挥手，瓶子、剪下的瓶嘴和剪刀一起消失。人也一样：用手按一下耳朵发出请求，人就在原地消失，瞬间出现在另一个地方，自己只觉得「身体一轻，然后恢复」。旁人看来没有任何运动过程，房间是密封的也照样进出。",
  principle:
    "和飞碟同一个原理：人工场照射人或物体，使它周围空间的光速运动消失，质量变成零，它就以光速到达终点，到达后恢复质量。中途挡着的墙也被暂时置零质量，所以能穿过去。书里还说，运动网可以把人「送出极小一段距离再停下」，连续这样做，人就能悬浮在空中、在云里漫步。",
  quotes: [
    ["在耳朵附近空中猛的一劈", "第八章 · 企鹅瓶"],
    ["像企鹅", "第八章"],
    ["身体一轻然后恢复", "第七章"],
  ],
  model:
    "书里写的瞬移几乎没有视觉效果，只是一闪。为了看清楚，这里加了一道 0.2 秒的螺旋场光和落点的光斑。左边是封闭的玻璃房间，右边是街道上的落点（青色、像塑料一样的路面）。",
};

function penguinBottle() {
  const g = new THREE.Group();
  const silver = new THREE.MeshPhysicalMaterial({ color: 0xdfe4ea, metalness: 1, roughness: 0.18, clearcoat: 0.6 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), silver);
  body.scale.set(0.05, 0.075, 0.045);
  body.position.y = 0.075;
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), silver);
  head.scale.set(0.032, 0.03, 0.03);
  head.position.y = 0.16;
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.06, 16), silver);
  beak.rotation.x = Math.PI / 2 - 0.3;
  beak.position.set(0, 0.17, 0.05);
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), silver);
    wing.scale.set(0.01, 0.05, 0.025);
    wing.position.set(s * 0.05, 0.075, 0);
    wing.rotation.z = s * 0.2;
    g.add(wing);
  }
  g.add(body, head, beak);
  return g;
}
function scissors() {
  const g = new THREE.Group();
  const m = std(0xc9d0da, { metalness: 1, roughness: 0.25 });
  for (const s of [-1, 1]) {
    const blade = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.004, 6, 24, Math.PI * 0.6), m);
    blade.rotation.set(Math.PI / 2, 0, s * 0.2);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0035, 6, 20), m);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0.075 + s * 0.012, 0, s * 0.02);
    g.add(blade, ring);
  }
  return g;
}

function flashFx(color = 0x9fe0ff) {
  const g = new THREE.Group();
  const m = holoMaterial(color, { power: 0.8, base: 0.3, intensity: 2.5, scan: 0 });
  m.uniforms.uOpacity.value = 0;
  const pts = [];
  for (let i = 0; i <= 200; i++) { const u = i / 200, a = u * Math.PI * 14; pts.push(new THREE.Vector3(Math.cos(a) * 0.28, u * 1.3, Math.sin(a) * 0.28)); }
  const helix = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.008, 6), m);
  const glow = glowSprite(color, 1.6, 0);
  glow.position.y = 0.6;
  g.add(helix, glow);
  g.userData = { m, glow, helix, t: -1 };
  return g;
}
function fireFx(fx) { fx.userData.t = 0; }
function tickFx(fx, dt) {
  const u = fx.userData;
  if (u.t < 0) { u.m.uniforms.uOpacity.value = 0; u.glow.material.opacity = 0; return; }
  u.t += dt;
  const o = Math.max(0, 1 - u.t / 0.45);
  u.m.uniforms.uOpacity.value = o;
  u.glow.material.opacity = o * 0.8;
  u.helix.rotation.y += dt * 20;
  if (u.t > 0.5) u.t = -1;
}

export function build() {
  const root = new THREE.Group();

  // ---- 左：密封的房间（虚拟墙，淡黄色）----
  const room = new THREE.Group();
  room.position.set(-1.1, 0, 0);
  root.add(room);
  const floorA = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 1.6), std(0xd8d2c4, { roughness: 0.7 }));
  floorA.position.y = 0.02;
  room.add(floorA);
  const wallMat = new THREE.MeshPhysicalMaterial({ color: 0xffe7a3, transparent: true, opacity: 0.14, roughness: 0.6, depthWrite: false, side: THREE.DoubleSide, emissive: 0x8a6a10, emissiveIntensity: 0.08 });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 1.6), wallMat);
  walls.position.y = 0.79;
  room.add(walls);
  const wallEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.8, 1.5, 1.6)), new THREE.LineBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.7 }));
  wallEdges.position.y = 0.79;
  room.add(wallEdges);
  const table = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.025, 40), std(0xf2f2f2, { roughness: 0.35 }));
  top.position.y = 0.45;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.45, 16), std(0xe0e0e0, { roughness: 0.4 }));
  leg.position.y = 0.225;
  table.add(top, leg);
  table.position.set(0.35, 0.04, -0.15);
  room.add(table);
  const bottle = penguinBottle();
  bottle.position.set(0.32, 0.475, -0.12);
  const sc = scissors();
  sc.position.set(0.47, 0.468, -0.2);
  room.add(bottle, sc);
  bottle.visible = sc.visible = false;
  const fxBottle = flashFx(0xffffff);
  fxBottle.scale.setScalar(0.25);
  fxBottle.position.set(0.38, 0.47, -0.15);
  room.add(fxBottle);
  const lblA = label("封闭房间");
  lblA.position.set(0, 1.75, 0);
  room.add(lblA);

  // ---- 右：街道上的落点 ----
  const street = new THREE.Group();
  street.position.set(1.3, 0, 0);
  root.add(street);
  const road = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 1.6), new THREE.MeshPhysicalMaterial({ color: 0x3fb7b0, roughness: 0.45, clearcoat: 0.4 }));
  road.position.y = 0.015;
  street.add(road);
  for (let i = 0; i < 4; i++) { // 路旁整齐一排的怪异植物
    const p = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.5, 8), std(0x5a7a2a));
    stem.position.y = 0.25;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), std(i % 2 ? 0x9ad42a : 0x3cc85a, { roughness: 0.4, flatShading: true }));
    crown.position.y = 0.58;
    crown.scale.y = 0.7;
    p.add(stem, crown);
    p.position.set(-0.6 + i * 0.4, 0.03, -0.65);
    street.add(p);
  }
  const sign = alienSign(2, 0.16, { seed: 4 });
  sign.position.set(0, 1.6, -0.6);
  street.add(sign);
  const lblB = label("街道");
  lblB.position.set(0, 1.85, 0);
  street.add(lblB);

  // ---- 人 ----
  const norton = makeGuoke({ female: false });
  norton.root.position.set(-1.35, 0.04, 0.15);
  norton.root.rotation.y = 0.4;
  root.add(norton.root);
  const fxA = flashFx(), fxB = flashFx();
  fxA.position.copy(norton.root.position);
  fxB.position.set(1.3, 0.03, 0.1);
  root.add(fxA, fxB);

  let where = "room", pending = null, timer = 0, ctxRef = null;

  function teleport() {
    if (pending) return;
    norton.earTap();
    pending = "jump"; timer = 0.9;
    ctxRef?.setState("左手在耳边一挥：向全球运动网发出瞬移请求…");
  }
  function bottleToggle() {
    if (pending || where !== "room") { ctxRef?.setState(where !== "room" ? "诺顿不在房间里" : ""); return; }
    norton.earTap();
    pending = "bottle"; timer = 0.7;
  }

  return {
    root, height: 1.9, span: 3.8, targetY: 0.75, dist: 6.2, view: [0, 0.35, 1],
    actions: [
      { label: "瞬移到街上 / 回房间", run: teleport },
      { label: "在耳边一劈：送来企鹅瓶", run: bottleToggle },
      { label: "离地悬浮", run: () => norton.cruise(!norton.cruising) },
    ],
    init(ctx) { ctxRef = ctx; },
    update(t, dt) {
      norton.update(t, dt);
      if (pending) {
        timer -= dt;
        if (timer <= 0) {
          if (pending === "jump") {
            const toStreet = where === "room";
            fxA.position.copy(norton.root.position);
            fxA.position.y = 0.03;
            fireFx(fxA);
            norton.root.position.set(toStreet ? 1.3 : -1.35, toStreet ? 0.03 : 0.04, toStreet ? 0.1 : 0.15);
            norton.root.rotation.y = toStreet ? -0.3 : 0.4;
            fxB.position.set(norton.root.position.x, 0.03, norton.root.position.z);
            fireFx(fxB);
            where = toStreet ? "street" : "room";
            ctxRef?.setState(toStreet ? "请求通过：密封房间里一闪就不见了，同一瞬间出现在街上" : "又一闪，回到了房间");
          } else {
            const show = !bottle.visible;
            bottle.visible = sc.visible = show;
            fireFx(fxBottle);
            ctxRef?.setState(show ? "企鹅瓶和弯剪刀瞬间出现在桌上" : "瓶子、剪刀一起被运动网送走");
          }
          pending = null;
        }
      }
      tickFx(fxA, dt); tickFx(fxB, dt); tickFx(fxBottle, dt);
      // 虚拟墙「纷纷扰扰」地微微抖动
      wallMat.opacity = 0.13 + Math.sin(t * 23) * 0.012 + Math.sin(t * 37) * 0.008;
      bottle.rotation.y = Math.sin(t * 0.6) * 0.3;
    },
  };
}
