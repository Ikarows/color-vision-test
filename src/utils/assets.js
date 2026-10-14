// 静态资源路径与图片加载工具(纯函数,多处页面复用)
// 路径按版本解析:各版本数据包的 dirs 决定图片目录(如 v6 → plates/v6/、study/v6/)
import { getEdition, DEFAULT_EDITION_ID } from "../data/editions/index.js";

function dirsOf(editionId) {
  const ed = getEdition(editionId || DEFAULT_EDITION_ID);
  return ed?.dirs ?? { plates: "plates/v6", study: "study/v6" };
}

// 测试检查图 plates/v6/imageN.jpeg
export function platePath(name, editionId) {
  return import.meta.env.BASE_URL + dirsOf(editionId).plates + "/" + name;
}

// 学习技巧图 study/v6/q_imageN.png
export function studyPath(name, editionId) {
  return import.meta.env.BASE_URL + dirsOf(editionId).study + "/" + name;
}

// 速记题目图 q_imageN.png → 测试原图 plates/v6/imageN.jpeg
export function studyOriginalPath(item, editionId) {
  const m = item.image.match(/^q_(image\d+)\.png$/);
  return m ? platePath(m[1] + ".jpeg", editionId) : null;
}

// 图片加载失败自动重试一次(加时间戳绕过失败缓存)
export function retryImg(e) {
  const img = e.target;
  if (img.dataset.retried) return;
  img.dataset.retried = "1";
  img.src = img.src + (img.src.includes("?") ? "&" : "?") + "retry=1";
}
