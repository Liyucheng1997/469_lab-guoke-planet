import * as THREE from "three";
import { glowSprite, glowTexture, holoMaterial, label, std } from "../lib.js";

export const meta = {
  id: "field-center", group: "网络", icon: "🛰️", title: "人工场发射中心", sub: "直径 10 公里的粒子环流器",
  chapter: "第二十一章",
  summary:
    "全球运动网的 9 个人工场发生器之一，白天从地面就能看到这颗银灰色的「卫星」。它大得进去以后根本看不出所以然，像到了另一个星球。里面是许多连在一起的精致金属房间，墙壁整面发出柔和的光；有的房间门开向太空，空气却不外泄。人一进去就离地约 30 厘米浮起来，自动快速滑行。核心是一个巨大的圆环状圆管「粒子环流器」，圆环直径约 10 公里，圆管直径接近 1 公里。环流器的背面是一块小得多的巨大平板「汇聚恒星能接收器」，上面布满像画上去的圆圈，每个圆圈中心有一个黑点。",
  principle:
    "原理和飞碟相同：环流器里的带电粒子高速环绕，变化的电磁场产生正反引力场，反引力场以光速射向地面，被照到的物体周围空间消失，质量和电荷随之消失，进入激发态以光速移动。书里把「场」描述为圆柱状螺旋式运动变化的空间。接收器能压缩空间，让一平方米接收上万甚至上亿平方米的恒星光能；这种对空间的影响是网格化的，像横竖线交织。接收器还能向地面照射、减少某处的恒星能量，配合计算机调节大气，所以整个星球像装了大空调，没有灾害天气。",
  quotes: [
    ["圆环直径大约有10 公里", "第二十一章"],
    ["场就是以圆柱状螺旋式运动变化的空间", "第二十一章"],
  ],
  model:
    "按书里的比例：环直径和管径约 10 : 1。环上的一段剖开，露出里面的粒子流。顶上的平板是恒星能接收器，朝向远处的恒星；下方螺旋光柱是射向星球的人工场。中间那一簇小方块是金属房间群，旁边的光点是浮在空中滑行的工作人员。",
};

function receiverTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d");
  g.fillStyle = "#3a4250"; g.fillRect(0, 0, 1024, 1024);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const cx = 64 + x * 128, cy = 64 + y * 128;
    g.strokeStyle = "#b9c6d8"; g.lineWidth = 6;
    g.beginPath(); g.arc(cx, cy, 50, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2;
    g.beginPath(); g.arc(cx, cy, 36, 0, Math.PI * 2); g.stroke();
    g.fillStyle = "#05070b";
    g.beginPath(); g.arc(cx, cy, 9, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function build() {
  const root = new THREE.Group();
  const station = new THREE.Group();
  station.position.y = 4.2;
  station.rotation.x = 0.18;
  root.add(station);

  const metal = new THREE.MeshStandardMaterial({ color: 0x8c95a4, metalness: 0.9, roughness: 0.38, envMapIntensity: 0.6 });
  const lead = new THREE.MeshStandardMaterial({ color: 0x5f6773, metalness: 0.85, roughness: 0.42, envMapIntensity: 0.6 });
  const R = 5, r = 0.5;
  const GAP = 0.55; // 剖开的一段（弧度）
  const torus = new THREE.Mesh(new THREE.TorusGeometry(R, r, 48, 240, Math.PI * 2 - GAP), metal);
  torus.rotation.set(Math.PI / 2, 0, GAP / 2);
  station.add(torus);
  // 环上的周期光脉冲
  const pulseMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      void main(){ float p = pow(fract(vUv.x * 6.0 - uTime * 0.35), 18.0); float band = smoothstep(0.0,0.08,abs(vUv.y-0.5)) ;
        vec3 c = vec3(0.45,0.8,1.0) * p * 1.8; gl_FragColor = vec4(c, p * 0.9); }`,
  });
  const pulse = new THREE.Mesh(new THREE.TorusGeometry(R, r * 1.02, 24, 240, Math.PI * 2 - GAP), pulseMat);
  pulse.rotation.copy(torus.rotation);
  station.add(pulse);
  // 剖开处的端盖 + 里面的粒子流
  const NP = 700;
  const pg = new THREE.BufferGeometry();
  const pp = new Float32Array(NP * 3), pa = new Float32Array(NP), po = new Float32Array(NP * 2);
  for (let i = 0; i < NP; i++) {
    pa[i] = (Math.random() - 0.5) * (GAP + 0.25);
    const rr = Math.sqrt(Math.random()) * r * 0.8, aa = Math.random() * Math.PI * 2;
    po[i * 2] = Math.cos(aa) * rr; po[i * 2 + 1] = Math.sin(aa) * rr;
  }
  pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  const flow = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x9fe8ff, size: 0.09, map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  station.add(flow);
  for (const s of [-1, 1]) {
    const capRing = new THREE.Mesh(new THREE.RingGeometry(r * 0.82, r, 40), lead);
    const a = s * GAP / 2;
    capRing.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
    capRing.lookAt(capRing.position.clone().add(new THREE.Vector3(-Math.sin(a), 0, Math.cos(a))));
    capRing.material = lead.clone();
    capRing.material.side = THREE.DoubleSide;
    station.add(capRing);
  }
  const lblRing = label("粒子环流器 · 环直径约 10 km · 管径近 1 km");
  lblRing.position.set(R, 1.0, 0);
  station.add(lblRing);

  // 轮辐 + 中央房间群
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, R - 0.9, 12), lead);
    spoke.position.set(Math.cos(a) * (R + 0.9) / 2, 0, Math.sin(a) * (R + 0.9) / 2);
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.y = -a;
    station.add(spoke);
  }
  const rooms = new THREE.Group();
  station.add(rooms);
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 40; i++) {
    const w = 0.25 + rnd() * 0.45, h = 0.2 + rnd() * 0.35, d = 0.25 + rnd() * 0.45;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), rnd() < 0.5 ? metal : lead);
    const a = rnd() * Math.PI * 2, rr = rnd() * 0.85;
    b.position.set(Math.cos(a) * rr, (rnd() - 0.5) * 0.8, Math.sin(a) * rr);
    rooms.add(b);
    if (rnd() < 0.35) { // 整面墙发光的房间
      const win = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, h * 0.6), new THREE.MeshBasicMaterial({ color: 0xfff1d6, toneMapped: false }));
      win.position.set(b.position.x, b.position.y, b.position.z + d / 2 + 0.002);
      rooms.add(win);
    }
  }
  // 浮在空中滑行的工作人员（光点）
  const NW = 26;
  const workers = [];
  for (let i = 0; i < NW; i++) {
    const s = glowSprite(0xffe3b0, 0.08, 0.9);
    s.userData = { a: rnd() * Math.PI * 2, r: 0.4 + rnd() * 0.6, y: (rnd() - 0.5) * 0.7, v: 0.3 + rnd() * 0.6 };
    rooms.add(s);
    workers.push(s);
  }

  // 顶上的恒星能接收器（环流器的背面），朝向恒星
  const recv = new THREE.Group();
  recv.position.y = 1.4;
  station.add(recv);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 3.2), [lead, lead, new THREE.MeshStandardMaterial({ map: receiverTexture(), metalness: 0.7, roughness: 0.4 }), lead, lead, lead]);
  recv.add(plate);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.3, 12), lead);
  mast.position.y = -0.7;
  recv.add(mast);
  const lblRecv = label("汇聚恒星能接收器");
  lblRecv.position.set(0, 0.6, 1.6);
  recv.add(lblRecv);
  // 恒星 + 被压缩汇聚的光线
  const star = glowSprite(0xfff0c0, 7, 1);
  star.position.set(-26, 30, -40);
  root.add(star);
  const starLines = new THREE.Group();
  station.add(starLines);
  const NLINE = 40;
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < NLINE; i++) {
    const a = (i / NLINE) * Math.PI * 2, rr = 5 + (i % 5) * 1.2;
    const far = new THREE.Vector3(Math.cos(a) * rr, 9, Math.sin(a) * rr);
    const near = new THREE.Vector3((Math.random() - 0.5) * 2.4, 1.46, (Math.random() - 0.5) * 2.4);
    starLines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([far, near]), lineMat));
  }
  // 网格化空间
  const grid = new THREE.GridHelper(14, 28, 0x4a7ab0, 0x4a7ab0);
  grid.material.transparent = true;
  grid.material.opacity = 0;
  grid.position.y = 2.6;
  station.add(grid);

  // 射向星球的人工场：圆柱状螺旋
  const fieldMat = holoMaterial(0x7fd4ff, { power: 0.8, base: 0.25, intensity: 2.2, scan: 0 });
  fieldMat.uniforms.uOpacity.value = 0;
  const pts = [];
  for (let i = 0; i <= 300; i++) { const u = i / 300, a = u * Math.PI * 2 * 12; pts.push(new THREE.Vector3(Math.cos(a) * 0.45, -u * 5, Math.sin(a) * 0.45)); }
  const helix = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 600, 0.03, 6), fieldMat);
  helix.position.y = -0.4;
  station.add(helix);
  const emitter = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 32, 1, true), lead);
  emitter.position.y = -0.75;
  emitter.rotation.x = Math.PI;
  station.add(emitter);

  const flags = { field: false, star: false, grid: false };
  let ctxRef = null;
  const say = () => ctxRef?.setState([flags.field && "人工场发射中", flags.star && "汇聚恒星能", flags.grid && "显示网格化空间"].filter(Boolean).join(" · ") || "");

  return {
    root, height: 7, span: 11, targetY: 3.9, dist: 23, view: [0.35, 0.45, 1], bloom: 0.8,
    actions: [
      { label: "发射人工场", run: () => { flags.field = !flags.field; say(); } },
      { label: "汇聚恒星能", run: () => { flags.star = !flags.star; say(); } },
      { label: "显示网格化空间", run: () => { flags.grid = !flags.grid; say(); } },
    ],
    init(ctx) { ctxRef = ctx; },
    update(t, dt) {
      station.rotation.y += dt * 0.04;
      pulseMat.uniforms.uTime.value = t;
      const p = pg.attributes.position;
      for (let i = 0; i < NP; i++) {
        pa[i] += dt * 0.9;
        if (pa[i] > (GAP + 0.25) / 2) pa[i] -= GAP + 0.25;
        const a = -pa[i];
        const rr = R + po[i * 2];
        p.setXYZ(i, Math.cos(a) * rr, po[i * 2 + 1], Math.sin(a) * rr);
      }
      p.needsUpdate = true;
      for (const w of workers) {
        const u = w.userData;
        u.a += dt * u.v * 0.4;
        w.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t + u.a) * 0.05, Math.sin(u.a) * u.r);
      }
      const k = Math.min(1, dt * 3);
      fieldMat.uniforms.uOpacity.value += ((flags.field ? 1 : 0) - fieldMat.uniforms.uOpacity.value) * k;
      fieldMat.uniforms.uTime.value = t;
      helix.rotation.y = -t * 2.5;
      lineMat.opacity += ((flags.star ? 0.55 : 0) - lineMat.opacity) * k;
      plate.material[2].emissive = plate.material[2].emissive || new THREE.Color();
      plate.material[2].emissive.setRGB(0.35, 0.3, 0.15).multiplyScalar(lineMat.opacity * (0.7 + 0.3 * Math.sin(t * 2)));
      grid.material.opacity += ((flags.grid ? 0.35 : 0) - grid.material.opacity) * k;
    },
  };
}
