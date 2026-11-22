import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

// ---------------------------------------------------------------------------
// 舞台：与具体展品无关的一切
//   · 环境反射、三点布光（冷白主光 + 青/紫轮廓光）、一次性烘焙的阴影
//   · 「场」纹台座、浮尘
//   · 辉光后期
//   · 镜头：入场推近、闲置缓转、飞向目标、为侧栏让位的视口偏移
// 改编自 threejs-stage-polish/stage.js
// ---------------------------------------------------------------------------

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createStage({ renderer, scene, camera, controls }) {
  let H = 1;

  // ---- 环境反射 ----
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  // ---- 布光：暖主光自右前上方，玉青轮廓光自两侧后方，正面只留极弱补光 ----
  // 旧版环境光 + 半球光 + 正面光叠得太满，明暗交界被抹平，铜人因此发「呆」。
  scene.add(new THREE.HemisphereLight(0xdce8ff, 0x0b0f1a, 0.4));
  const key = new THREE.DirectionalLight(0xf2f6ff, 2.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.012;
  scene.add(key, key.target);
  const rimL = new THREE.DirectionalLight(0x6fd6ff, 1.6);
  const rimR = new THREE.DirectionalLight(0xa98cff, 1.2);
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.4);
  scene.add(rimL, rimR, fill);

  // 阴影只在模型就位（或显隐变化）时烘焙一次：191 万面的高模不宜每帧再画一遍
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  // ---- 后期：辉光 ----
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.55, 0.5, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---- 台座 / 浮尘（待身高确定后再建） ----
  const decor = new THREE.Group();
  scene.add(decor);
  let compass = null;
  let dust = null;

  function makeCompassTexture() {
    const S = 1024, c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d");
    g.translate(S / 2, S / 2);
    g.strokeStyle = "rgba(120,200,255,0.9)";
    g.fillStyle = "rgba(170,225,255,0.95)";
    for (const [r, w] of [[500, 3], [440, 1.2], [350, 1.2], [338, 3.5], [200, 1]]) {
      g.lineWidth = w;
      g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
    }
    for (let i = 0; i < 144; i++) {
      const a = (i / 144) * Math.PI * 2, long = i % 12 === 0;
      g.lineWidth = long ? 3 : 1;
      g.beginPath();
      g.moveTo(Math.cos(a) * 500, Math.sin(a) * 500);
      g.lineTo(Math.cos(a) * (long ? 460 : 482), Math.sin(a) * (long ? 460 : 482));
      g.stroke();
    }
    // 螺旋：张祥前「统一场论」里空间以光速螺旋式运动
    g.lineWidth = 1.4;
    g.strokeStyle = "rgba(120,200,255,0.55)";
    for (let arm = 0; arm < 4; arm++) {
      g.beginPath();
      for (let k = 0; k <= 200; k++) {
        const u = k / 200, r = 200 + u * 138, a = arm * Math.PI / 2 + u * Math.PI * 1.1;
        k ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.stroke();
    }
    g.font = "500 44px -apple-system,'PingFang SC','Microsoft YaHei',sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const words = [..."果克星球  空间以光速螺旋运动  "];
    words.forEach((ch, i) => {
      g.save();
      g.rotate((i / words.length) * Math.PI * 2);
      g.translate(0, -394);
      g.fillText(ch, 0, 0);
      g.restore();
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }

  function radialTexture(stops) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    for (const [o, col] of stops) grad.addColorStop(o, col);
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function buildDecor(span = H) {
    decor.clear();

    // 台座：暗铜圆台，承接铜人的影子
    const R = span * 0.62;
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R * 1.06, R * 0.06, 96),
      new THREE.MeshStandardMaterial({ color: 0x111722, metalness: 0.6, roughness: 0.72, envMapIntensity: 0.35 })
    );
    base.position.y = -R * 0.03;
    base.receiveShadow = true;
    decor.add(base);

    const rimEdge = new THREE.Mesh(
      new THREE.TorusGeometry(R, R * 0.007, 8, 128),
      new THREE.MeshStandardMaterial({ color: 0x7cc8ff, metalness: 1, roughness: 0.3, emissive: 0x1d5f9a, emissiveIntensity: 0.6 })
    );
    rimEdge.rotation.x = Math.PI / 2;
    decor.add(rimEdge);

    compass = new THREE.Mesh(
      new THREE.CircleGeometry(R * 0.985, 96),
      new THREE.MeshBasicMaterial({
        map: makeCompassTexture(), transparent: true, opacity: 0.5,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    compass.rotation.x = -Math.PI / 2;
    compass.position.y = R * 0.002;
    decor.add(compass);

    // 地面光晕：台座之外向黑暗过渡，免得铜人悬在虚空里
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(R * 14, R * 14),
      new THREE.MeshBasicMaterial({
        map: radialTexture([[0, "rgba(40,90,150,0.5)"], [0.22, "rgba(24,50,90,0.3)"], [0.6, "rgba(10,16,30,0.08)"], [1, "rgba(0,0,0,0)"]]),
        transparent: true, depthWrite: false, fog: false,
      })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -R * 0.062;
    glow.renderOrder = -5;
    decor.add(glow);

    // 浮尘
    const N = 240, pos = new Float32Array(N * 3), speed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, r = H * (0.35 + Math.random() * 1.1);
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.random() * H * 1.5;
      pos[i * 3 + 2] = Math.sin(a) * r;
      speed[i] = 0.012 + Math.random() * 0.03;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    dust = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: H * 0.011, map: radialTexture([[0, "rgba(190,230,255,1)"], [0.4, "rgba(120,190,255,0.35)"], [1, "rgba(0,0,0,0)"]]),
        transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      })
    );
    dust.userData.speed = speed;
    decor.add(dust);
  }

  // ---- 镜头 ----
  const home = { target: new THREE.Vector3(), dist: 1.8, dir: new THREE.Vector3(0, 0.1, 1) };
  const VIEWS = {
    front: [0, 0.1, 1],
    back: [0, 0.1, -1],
    left: [1, 0.1, 0],    // 身体左侧在 +X
    right: [-1, 0.1, 0],
  };
  let anim = null;
  let lastInteract = -Infinity;
  let now = 0;
  const rig = { autoRotate: true, hold: false };
  const _off = new THREE.Vector3();
  const _sph = new THREE.Spherical();

  controls.addEventListener("start", () => { anim = null; lastInteract = Infinity; });
  controls.addEventListener("end", () => { lastInteract = now; });
  controls.autoRotateSpeed = 0.55;

  // 沿球面插值（而非直线），镜头才会绕着铜人转过去，而不是从胸口穿过去
  function flyTo(targetVec, dir, dist, dur = 1.15) {
    const from = new THREE.Spherical().setFromVector3(_off.copy(camera.position).sub(controls.target));
    const to = new THREE.Spherical().setFromVector3(_off.copy(dir).normalize().multiplyScalar(dist));
    to.phi = THREE.MathUtils.clamp(to.phi, 0.25, Math.PI / 2 + 0.25);
    let dTheta = to.theta - from.theta;
    dTheta = ((dTheta + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    anim = { t: 0, dur, from, to, dTheta, t0: controls.target.clone(), t1: targetVec.clone() };
  }

  function setView(name, dur) {
    const v = name === "front" ? home.dir : new THREE.Vector3(...(VIEWS[name] || VIEWS.front));
    flyTo(home.target, v, home.dist, dur);
  }

  // 视口偏移：侧栏与面板占掉的屏幕不算数，铜人应居于「剩下的那块」正中
  const inset = { x: 0, y: 0, cx: 0, cy: 0, w: 0, h: 0 };
  function setInsets({ left = 0, right = 0, top = 0, bottom = 0 }) {
    inset.x = (left - right) / 2;
    inset.y = (top - bottom) / 2;
  }

  // opts.span：展品的最大水平跨度（宽扁的飞船、仓库要据此拉远镜头）
  function setHeight(h, opts = {}) {
    H = h;
    const span = Math.max(H, opts.span || 0);
    home.target.set(0, opts.targetY ?? H * 0.5, 0);
    home.dist = opts.dist ?? Math.max(H * 1.85, span * 1.45);
    home.dir.set(...(opts.view || [0, 0.1, 1]));

    key.position.set(H * 1.6, H * 2.6, H * 2.2);
    key.target.position.set(0, H * 0.5, 0);
    const sc = key.shadow.camera;
    sc.left = sc.bottom = -span * 0.8;
    sc.right = sc.top = span * 0.8;
    sc.near = H * 0.5;
    sc.far = H * 6;
    sc.updateProjectionMatrix();
    rimL.position.set(-H * 2.4, H * 1.5, -H * 2);
    rimR.position.set(H * 2.2, H * 1.0, -H * 2.4);
    fill.position.set(-H * 1.2, H * 0.6, H * 3);

    controls.minDistance = H * 0.22;
    controls.maxDistance = home.dist * 2.6;
    controls.maxPolarAngle = Math.PI / 2 + 0.3;

    buildDecor(span);
    refreshShadow();

    // 入场：自斜后方远处推近并转到正面
    controls.target.copy(home.target);
    camera.position.copy(home.target).add(new THREE.Vector3(-1.3, 0.55, 1.25).multiplyScalar(home.dist));
    setView("front", 2.6);
  }

  function refreshShadow() {
    renderer.shadowMap.needsUpdate = true;
  }

  // 画质自适应：连续掉帧就逐级降低像素比（高模 + 高分屏 + 集显时最易吃紧）。
  // 间隔超过 200ms 的帧多半是标签页被切到后台，不计入。
  let lastT = 0, slow = 0;
  function adaptQuality() {
    const t = performance.now(), d = t - lastT;
    lastT = t;
    if (d > 200) return;
    slow = d > 30 ? slow + 1 : Math.max(0, slow - 1);
    const pr = renderer.getPixelRatio();
    if (slow > 45 && pr > 1) {
      slow = 0;
      renderer.setPixelRatio(Math.max(1, pr - 0.5));
      resize(window.innerWidth, window.innerHeight);
    }
  }

  function update(elapsed, dt) {
    now = elapsed;
    adaptQuality();

    if (anim) {
      anim.t = Math.min(1, anim.t + dt / anim.dur);
      const k = easeInOut(anim.t);
      controls.target.lerpVectors(anim.t0, anim.t1, k);
      _sph.radius = THREE.MathUtils.lerp(anim.from.radius, anim.to.radius, k);
      _sph.phi = THREE.MathUtils.lerp(anim.from.phi, anim.to.phi, k);
      _sph.theta = anim.from.theta + anim.dTheta * k;
      camera.position.copy(controls.target).add(_off.setFromSpherical(_sph));
      if (anim.t >= 1) { anim = null; lastInteract = elapsed; }
    }
    controls.autoRotate = rig.autoRotate && !rig.hold && !anim && elapsed - lastInteract > 3.5;
    controls.update();

    // 视口偏移缓动
    const w = window.innerWidth, h = window.innerHeight;
    const nx = inset.cx + (inset.x - inset.cx) * Math.min(1, dt * 7);
    const ny = inset.cy + (inset.y - inset.cy) * Math.min(1, dt * 7);
    if (Math.abs(nx - inset.cx) > 0.2 || Math.abs(ny - inset.cy) > 0.2 || inset.w !== w || inset.h !== h) {
      inset.cx = nx; inset.cy = ny; inset.w = w; inset.h = h;
      camera.setViewOffset(w, h, -nx, -ny, w, h);
    }

    if (compass) compass.rotation.z = elapsed * 0.035;
    if (dust) {
      const p = dust.geometry.attributes.position, s = dust.userData.speed;
      for (let i = 0; i < s.length; i++) {
        let y = p.getY(i) + s[i] * H * dt;
        if (y > H * 1.5) y = 0;
        p.setY(i, y);
      }
      p.needsUpdate = true;
      dust.rotation.y = elapsed * 0.012;
    }
  }

  function resize(w, h) {
    camera.aspect = w / h;
    inset.w = 0; // 迫使下一帧重设视口偏移（内含 updateProjectionMatrix）
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
  }

  return {
    rig, home, bloom, decor, setHeight, refreshShadow, update, resize, flyTo, setView, setInsets,
    render: () => composer.render(),
    isFlying: () => Boolean(anim),
  };
}
