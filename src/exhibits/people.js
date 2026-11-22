import * as THREE from "three";
import { makeGuoke, earthlingGhost } from "./guoke-body.js";
import { label } from "../lib.js";

export const meta = {
  id: "people", group: "人物", icon: "👽", title: "果克星人", sub: "一米高 · 大眼 · 橡胶管头发",
  chapter: "第一章 · 第八章 · 第二十五章",
  summary:
    "果克星人身高只有一米左右，男女几乎一样高，看上去像幼儿园的小朋友、像动漫人物，也像精致的充气娃娃。眼睛和饱满发亮的眼睑很大，下巴、鼻子、嘴都很小，耳朵大而薄。皮肤粉白、极细腻，是漫反射而不反光的质感，偶尔带一点雪青色。身体像海豚一样流线浑圆，看不出骨骼和肌肉。女性腰细得和作者的手臂差不多粗，臀部宽；头发像黑得发亮的橡胶管，一束束螺旋着向外膨开。男性头发则像一整块贴着头皮的橡胶。",
  principle:
    "他们的身体是自己设计制造的，没有胃、肠、肝、肾，营养由全球运动网直接瞬移进体内，所以从嘴到下身只是一个简单的空腔。衣服是全球信息网投射在身上的虚拟图像，图案可以像电视画面一样变化；皮肤颜色也能被网络修饰，会在白、淡粉、淡黄、绿、蓝、紫之间循环，变蓝时发出淡蓝辉光。肩旁或头顶漂浮的小三维图像代表个性和心情。见面礼是右手按胸口；笑起来上半身会跟着节奏抖。",
  quotes: [
    ["身高大约只有一米", "第一章"],
    ["像黑得发亮的橡胶管子，一束一束呈螺旋式的，并且向外膨开", "第一章"],
    ["耳朵大而薄", "第八章"],
  ],
  model:
    "全部用代码生成：躯干是按书中比例画的旋转体轮廓，女性腰围压到极细；34 根螺旋管做头发；皮肤用带雪青色光泽（sheen）的低反光材质。半透明的蓝色人形是作者本人（约 1.70 m）的身高参照。衣服上流动的条纹模拟「会变的图案」。",
};

const SKIN_CYCLE = [0xe8cdd5, 0xffd6e2, 0xfff0c8, 0xbff0c8, 0x9fd2ff, 0xd6b8ff, 0xe8cdd5];

export function build() {
  const root = new THREE.Group();
  const her = makeGuoke({ female: true });
  her.root.position.set(-0.32, 0, 0.1);
  her.root.rotation.y = 0.25;
  const him = makeGuoke({ female: false });
  him.root.position.set(0.32, 0, 0.05);
  him.root.rotation.y = -0.25;
  const ghost = earthlingGhost(1.7);
  ghost.position.set(0, 0, -0.55);
  root.add(her.root, him.root, ghost);

  const tagA = label("女性 · 约 1.0 m"); tagA.position.set(-0.32, 1.28, 0.1);
  const tagB = label("男性 · 约 1.0 m"); tagB.position.set(0.32, 1.28, 0.05);
  const tagC = label("地球人作者 · 约 1.70 m", { color: "#a9c8ff" }); tagC.position.set(0, 1.86, -0.55);
  root.add(tagA, tagB, tagC);

  let colorT = -1;
  const c0 = new THREE.Color(), c1 = new THREE.Color();

  return {
    root, height: 1.75, span: 1.6, targetY: 0.72, dist: 3.1,
    actions: [
      { label: "右手按胸致意", run: () => { her.greet(); setTimeout(() => him.greet(), 350); } },
      { label: "笑", run: () => { her.laugh(); him.laugh(); } },
      { label: "离地巡航", run: () => { const on = !her.cruising; her.cruise(on); him.cruise(on); } },
      { label: "皮肤变色", run: () => { colorT = 0; } },
    ],
    update(t, dt) {
      her.update(t, dt);
      him.update(t, dt);
      ghost.userData.mat.uniforms.uTime.value = t;
      if (colorT >= 0) {
        colorT += dt * 0.7;
        const n = SKIN_CYCLE.length - 1;
        const k = Math.min(n - 1e-4, colorT);
        const i = Math.floor(k), f = k - i;
        c0.setHex(SKIN_CYCLE[i]).lerp(c1.setHex(SKIN_CYCLE[i + 1]), f);
        const blue = Math.max(0, 1 - Math.abs(k - 4) * 1.2); // 变蓝时发出淡蓝辉光
        for (const p of [her, him]) {
          p.skin.color.copy(c0);
          p.skin.emissive.setHex(0x4aa8ff);
          p.skin.emissiveIntensity = blue * 0.7;
        }
        if (colorT >= n) colorT = -1;
      }
    },
  };
}
