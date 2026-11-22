import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createStage } from "./stage.js";
import { dispose, shadows, glowTexture } from "./lib.js";
import { EXHIBITS, GROUPS } from "./exhibits/index.js";

// ---- 渲染器 / 场景 / 相机 ----
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04060b);
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.01, 4000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

const stage = createStage({ renderer, scene, camera, controls });

// ---- 星空背景（随相机移动，永远在远处）----
const sky = (() => {
  const N = 2600, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(1500 + Math.random() * 400);
    pos.set([v.x, v.y, v.z], i * 3);
    c.setHSL(0.55 + Math.random() * 0.2, 0.5, 0.55 + Math.random() * 0.4);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({
    size: 2.2, sizeAttenuation: false, vertexColors: true, map: glowTexture(),
    transparent: true, depthWrite: false, opacity: 0.85,
  }));
  p.frustumCulled = false;
  scene.add(p);
  return p;
})();

// ---- 界面 ----
const $ = (id) => document.getElementById(id);
const list = $("list"), info = $("info");

for (const grp of GROUPS) {
  const t = document.createElement("div");
  t.className = "group-title";
  t.textContent = grp;
  list.appendChild(t);
  for (const ex of EXHIBITS.filter((e) => e.group === grp)) {
    const b = document.createElement("button");
    b.className = "item";
    b.dataset.id = ex.id;
    b.innerHTML = `<span class="ico-box">${ex.icon}</span><span><div class="t">${ex.title}</div><div class="s">${ex.sub}</div></span>`;
    b.onclick = () => show(ex.id);
    list.appendChild(b);
  }
}
$("info-toggle").onclick = () => info.classList.toggle("collapsed");

function setState(text) { $("state").textContent = text || ""; }

let current = null;
const ctx = { THREE, scene, camera, renderer, stage, controls, setState };

function show(id) {
  const ex = EXHIBITS.find((e) => e.id === id) || EXHIBITS[0];
  if (current) {
    scene.remove(current.root);
    current.dispose?.();
    dispose(current.root);
  }
  setState("");
  const inst = ex.build(ctx);
  current = inst;
  if (inst.shadow !== false) shadows(inst.root);
  scene.add(inst.root);
  inst.init?.(ctx);
  stage.rig.autoRotate = inst.autoRotate !== false;
  stage.bloom.strength = inst.bloom ?? 0.55;
  stage.decor.visible = inst.pedestal !== false;
  stage.setHeight(inst.height, { span: inst.span, targetY: inst.targetY, dist: inst.dist, view: inst.view });

  document.querySelectorAll(".item").forEach((b) => b.classList.toggle("active", b.dataset.id === ex.id));
  $("info-chapter").textContent = ex.chapter;
  $("info-title").textContent = ex.title;
  $("info-summary").textContent = ex.summary;
  $("info-principle").textContent = ex.principle;
  $("info-model").textContent = ex.model || "";
  $("info-quotes").innerHTML = (ex.quotes || [])
    .map(([q, where]) => `<div class="quote">“${q}”<cite>${where}</cite></div>`).join("");
  const acts = $("actions");
  acts.innerHTML = "";
  (inst.actions || []).forEach((a, i) => {
    const b = document.createElement("button");
    b.className = "btn btn-sm" + (i === 0 ? " btn-primary" : "");
    b.textContent = a.label;
    b.onclick = () => { stage.rig.hold = true; a.run(); };
    acts.appendChild(b);
  });
  $("info-body").scrollTop = 0;
  if (location.hash.slice(1) !== ex.id) history.replaceState(null, "", "#" + ex.id);
}

// ---- 每帧 ----
const clock = new THREE.Clock();
function measureInsets() {
  if (innerWidth <= 760) {
    const s = $("side").getBoundingClientRect(), r = info.getBoundingClientRect();
    return { top: s.bottom, bottom: innerHeight - r.top };
  }
  const s = $("side").getBoundingClientRect(), r = info.getBoundingClientRect();
  return { left: s.right, right: innerWidth - r.left };
}
function frame(forceDt) {
  const dt = forceDt ?? Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  stage.setInsets(measureInsets());
  current?.update?.(t, dt);
  stage.update(t, dt);
  sky.position.copy(camera.position);
  stage.render();
}
renderer.setAnimationLoop(() => frame());
addEventListener("resize", () => stage.resize(innerWidth, innerHeight));
addEventListener("hashchange", () => show(location.hash.slice(1)));

show(location.hash.slice(1));
$("loading").classList.add("done");

if (import.meta.env.DEV) window.__debug = { THREE, scene, camera, stage, controls, frame, show,
  look(p, t) { stage.rig.autoRotate = false; controls.target.set(...t); camera.position.set(...p); for (let i = 0; i < 3; i++) frame(0.016); }, get current() { return current; } };
