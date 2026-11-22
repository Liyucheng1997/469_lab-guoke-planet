import * as THREE from "three";

// 展品共用的小工具：发光贴图、全息材质、粒子云、文字标签

const texCache = new Map();
export function glowTexture(color = "255,255,255") {
  if (texCache.has(color)) return texCache.get(color);
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, `rgba(${color},1)`);
  grad.addColorStop(0.25, `rgba(${color},0.55)`);
  grad.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(color, t);
  return t;
}

export function glowSprite(hex = 0x88ccff, size = 1, opacity = 1) {
  const m = new THREE.SpriteMaterial({
    map: glowTexture(), color: hex, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  return s;
}

// 菲涅尔全息材质：边缘亮、中间透，适合光线虚拟人、场、虚影
export function holoMaterial(color = 0x66ccff, { power = 2.2, base = 0.06, intensity = 1.6, scan = 1 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) }, uTime: { value: 0 },
      uPower: { value: power }, uBase: { value: base }, uInt: { value: intensity }, uScan: { value: scan },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uTime, uPower, uBase, uInt, uScan, uOpacity;
      varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPower);
        float scan = 0.75 + 0.25 * sin(vW.y * 60.0 - uTime * 4.0);
        float a = (uBase + f) * mix(1.0, scan, uScan) * uOpacity;
        gl_FragColor = vec4(uColor * uInt * a, a);
      }`,
  });
}

// 把一组网格的顶点采样成粒子（用于「人体分解成粒子」「复制」之类的效果）
export function sampleSurface(meshes, count) {
  const pts = [];
  const tri = new THREE.Triangle();
  const items = [];
  let total = 0;
  for (const m of meshes) {
    m.updateWorldMatrix(true, false);
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
      const b = new THREE.Vector3().fromBufferAttribute(p, i + 1).applyMatrix4(m.matrixWorld);
      const c = new THREE.Vector3().fromBufferAttribute(p, i + 2).applyMatrix4(m.matrixWorld);
      tri.set(a, b, c);
      const area = tri.getArea();
      total += area;
      items.push({ a, b, c, cum: total });
    }
  }
  for (let k = 0; k < count; k++) {
    const r = Math.random() * total;
    let lo = 0, hi = items.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; items[mid].cum < r ? (lo = mid + 1) : (hi = mid); }
    const { a, b, c } = items[lo];
    let u = Math.random(), v = Math.random();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    pts.push(a.clone().addScaledVector(b.clone().sub(a), u).addScaledVector(c.clone().sub(a), v));
  }
  return pts;
}

export function pointsCloud(count, color = 0x9fe0ff, size = 0.02) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  const mat = new THREE.PointsMaterial({
    color, size, map: glowTexture(), transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

// 世界中的文字牌（屏幕尺寸恒定）
export function label(text, { color = "#e8f2ff", size = 0.024, bg = "rgba(10,14,24,0.72)" } = {}) {
  const c = document.createElement("canvas");
  const g = c.getContext("2d");
  const font = "500 44px -apple-system,'PingFang SC','Microsoft YaHei',sans-serif";
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + 56;
  c.width = w; c.height = 84;
  g.font = font;
  g.fillStyle = bg;
  g.beginPath(); g.roundRect(0, 0, w, 84, 42); g.fill();
  g.fillStyle = color; g.textBaseline = "middle"; g.textAlign = "center";
  g.fillText(text, w / 2, 44);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, sizeAttenuation: false, depthTest: false }));
  s.scale.set(size * (w / 84), size, 1);
  s.renderOrder = 10;
  return s;
}

export const lerp = THREE.MathUtils.lerp;
export const clamp = THREE.MathUtils.clamp;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// 简单的时间轴：play() 后 t 从 0 走到 dur，update 里读 progress
export class Timeline {
  constructor(dur) { this.dur = dur; this.t = -1; }
  play() { this.t = 0; }
  get active() { return this.t >= 0 && this.t < this.dur; }
  tick(dt) { if (this.t >= 0) this.t = Math.min(this.dur, this.t + dt); return this.t < 0 ? 0 : this.t; }
}

export function std(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.5, ...o });
}
export function phys(color, o = {}) {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 0.2, roughness: 0.4, ...o });
}

// 让 group 中所有 mesh 投射/接收阴影
export function shadows(obj, cast = true, receive = true) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    // 全息 / 发光 / 透明的东西不投影（光做的人不该在墙上留下影子）
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    const ghost = m.isShaderMaterial || m.blending === THREE.AdditiveBlending || (m.transparent && m.opacity < 0.6);
    o.castShadow = cast && !ghost;
    o.receiveShadow = receive && !ghost;
  });
  return obj;
}

export function dispose(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) {
      for (const k of Object.keys(m)) if (m[k] && m[k].isTexture && !texCacheHas(m[k])) m[k].dispose();
      m.dispose();
    }
  });
}
function texCacheHas(t) { for (const v of texCache.values()) if (v === t) return true; return false; }

// 果克文字：书里说像英文字母的组合。这里用随机笔画拼出「看不懂的字」
export function alienText(words = 3, { color = "#bfe6ff", h = 96, seed = 1 } = {}) {
  let a = seed * 9301 + 49297;
  const rnd = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
  const glyphs = [];
  for (let w = 0; w < words; w++) { const n = 2 + Math.floor(rnd() * 4); for (let i = 0; i < n; i++) glyphs.push(rnd); glyphs.push(null); }
  const cw = h * 0.62, c = document.createElement("canvas");
  c.width = Math.ceil(glyphs.length * cw + h * 0.4); c.height = h;
  const g = c.getContext("2d");
  g.strokeStyle = color; g.lineWidth = h * 0.07; g.lineCap = "round"; g.lineJoin = "round";
  g.shadowColor = color; g.shadowBlur = h * 0.12;
  glyphs.forEach((r, i) => {
    if (!r) return;
    const x0 = h * 0.2 + i * cw, pad = h * 0.18, W = cw * 0.8, Hh = h - pad * 2;
    g.beginPath();
    const strokes = 2 + Math.floor(rnd() * 3);
    for (let k = 0; k < strokes; k++) {
      const kind = Math.floor(rnd() * 3);
      if (kind === 0) { g.moveTo(x0 + rnd() * W, pad); g.lineTo(x0 + rnd() * W, pad + Hh); }
      else if (kind === 1) { const y = pad + rnd() * Hh; g.moveTo(x0, y); g.lineTo(x0 + W, y + (rnd() - 0.5) * Hh * 0.4); }
      else { g.moveTo(x0 + W * 0.5 + W * 0.35, pad + Hh * 0.5); g.arc(x0 + W * 0.5, pad + Hh * (0.3 + rnd() * 0.4), W * 0.35, 0, Math.PI * (1 + rnd())); }
    }
    g.stroke();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { texture: t, aspect: c.width / c.height };
}

export function alienSign(words, height, opts) {
  const { texture, aspect } = alienText(words, opts);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(height * aspect, height), new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
  }));
  return m;
}
