import { v6 } from "./v6.js";
import { v5 } from "./v5.js";

// 版本注册表:版本作为数据包挂载,引擎(出题/学习/记录)复用,新增版本只需
// 在 data/editions/ 下新建数据包并加入数组,业务代码零改动
export const EDITIONS = [v6, v5];

export const DEFAULT_EDITION_ID = "v6";

// 按 id 取版本数据包,未注册的 id 返回 null(调用方兜底回默认版本)
export function getEdition(id) {
  return EDITIONS.find((e) => e.id === id) ?? null;
}
