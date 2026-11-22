// 展品登记表。每个模块导出 meta（文字说明）和 build(ctx)（返回 3D 内容）。
// build 返回：{ root, height, span?, targetY?, dist?, update?(t, dt), actions?, dispose?, pedestal?, bloom? }
import * as people from "./people.js";
import * as ufo from "./ufo.js";
import * as ufoInterior from "./ufo-interior.js";
import * as fridge from "./fridge.js";
import * as motionNet from "./motion-net.js";
import * as teleport from "./teleport.js";
import * as fieldCenter from "./field-center.js";
import * as holoHuman from "./holo-human.js";
import * as robot from "./robot.js";
import * as virtualHome from "./virtual-home.js";

const MODULES = [people, holoHuman, robot, ufo, ufoInterior, motionNet, teleport, fieldCenter, fridge, virtualHome];

export const EXHIBITS = MODULES.map((m) => ({ ...m.meta, build: m.build }));
export const GROUPS = [...new Set(EXHIBITS.map((e) => e.group))];
