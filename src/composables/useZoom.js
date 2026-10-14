import { ref, computed, watch } from "vue";
import { useStudy } from "./useStudy.js";
import { platePath, studyPath, studyOriginalPath } from "../utils/assets.js";

// 图片放大层域(全局单例):双指/滚轮缩放、拖动平移、双击放大、学习条目视图切换
const { studyItemByImage } = useStudy();

const studyZoomSrc = ref(""); // 点击放大的图片地址,空 = 关闭

const zoomStudyItem = ref(null); // zoom 层关联的学习条目,非空时提供原图/技巧图/解析图切换
const zoomView = ref("original");
const zoomScale = ref(1);
const zoomTx = ref(0);
const zoomTy = ref(0);
const zoomImgEl = ref(null);
const zoomImgLoading = ref(false); // zoom 层图片加载中(慢网络下切图给转圈反馈)

let zoomLoadingTimer = null;
watch(studyZoomSrc, () => {
  // 每次换图都视为"可能要加载":延迟 200ms 才显示转圈,
  // 本机/缓存秒开时零闪烁(PC 上切 tab 不再看到遮罩闪一下就关)
  clearTimeout(zoomLoadingTimer);
  zoomLoadingTimer = setTimeout(() => {
    zoomImgLoading.value = true;
  }, 200);
});

// 图片加载完成/失败:撤销未触发的延迟计时并关闭转圈
function onZoomImgDone() {
  clearTimeout(zoomLoadingTimer);
  zoomImgLoading.value = false;
}
const zoomPointers = new Map(); // pointerId -> {x,y}
let zoomDragBase = null; // 单指拖动基准 {px,py,tx,ty}
let zoomPinchBase = null; // 双指捏合基准 {dist,mx,my,s,tx,ty}
let zoomMoved = false; // 本次手势是否移动过,抑制误触关闭
let zoomLastTap = 0;
let zoomLastTapX = 0;
let zoomLastTapY = 0;

function zoomReset() {
  zoomScale.value = 1;
  zoomTx.value = 0;
  zoomTy.value = 0;
  zoomPointers.clear();
  zoomDragBase = null;
  zoomPinchBase = null;
  zoomMoved = false;
}

function openZoom(src) {
  zoomReset();
  zoomStudyItem.value = null;
  studyZoomSrc.value = src;
}

function closeZoom() {
  clearTimeout(zoomLoadingTimer);
  zoomImgLoading.value = false;
  studyZoomSrc.value = "";
  zoomReset();
  zoomStudyItem.value = null;
}

function clampScale(s) {
  return Math.min(5, Math.max(1, s));
}

function clampPan() {
  const el = zoomImgEl.value;
  if (!el) return;
  if (zoomScale.value <= 1) {
    zoomTx.value = 0;
    zoomTy.value = 0;
    return;
  }
  const r = el.getBoundingClientRect();
  const maxX = Math.max(0, (r.width - window.innerWidth) / 2);
  const maxY = Math.max(0, (r.height - window.innerHeight) / 2);
  zoomTx.value = Math.min(maxX, Math.max(-maxX, zoomTx.value));
  zoomTy.value = Math.min(maxY, Math.max(-maxY, zoomTy.value));
}

// 围绕屏幕点 (cx,cy) 缩放到 s
function applyZoomAround(s, cx, cy) {
  const kk = s / zoomScale.value;
  const vwHalf = window.innerWidth / 2;
  const vhHalf = window.innerHeight / 2;
  zoomScale.value = s;
  zoomTx.value = cx - vwHalf - kk * (cx - vwHalf - zoomTx.value);
  zoomTy.value = cy - vhHalf - kk * (cy - vhHalf - zoomTy.value);
  clampPan();
}

function toggleZoomAt(cx, cy) {
  if (zoomScale.value > 1.2) {
    zoomScale.value = 1;
    zoomTx.value = 0;
    zoomTy.value = 0;
  } else {
    applyZoomAround(2.5, cx, cy);
  }
}

function onZoomPointerDown(e) {
  try {
    e.currentTarget.setPointerCapture?.(e.pointerId);
  } catch {}
  zoomPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  zoomMoved = false;
  const now = performance.now();
  if (
    now - zoomLastTap < 300 &&
    Math.hypot(e.clientX - zoomLastTapX, e.clientY - zoomLastTapY) < 30
  ) {
    toggleZoomAt(e.clientX, e.clientY);
    zoomMoved = true;
    zoomLastTap = 0;
  } else {
    zoomLastTap = now;
    zoomLastTapX = e.clientX;
    zoomLastTapY = e.clientY;
  }
  if (zoomPointers.size === 1) {
    zoomDragBase = {
      px: e.clientX,
      py: e.clientY,
      tx: zoomTx.value,
      ty: zoomTy.value,
    };
    zoomPinchBase = null;
  } else if (zoomPointers.size === 2) {
    const [a, b] = [...zoomPointers.values()];
    zoomPinchBase = {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      mx: (a.x + b.x) / 2,
      my: (a.y + b.y) / 2,
      s: zoomScale.value,
      tx: zoomTx.value,
      ty: zoomTy.value,
    };
    zoomDragBase = null;
    zoomMoved = true;
  }
}

function onZoomPointerMove(e) {
  if (!zoomPointers.has(e.pointerId)) return;
  zoomPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (zoomPointers.size === 1 && zoomDragBase) {
    const dx = e.clientX - zoomDragBase.px;
    const dy = e.clientY - zoomDragBase.py;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) zoomMoved = true;
    zoomTx.value = zoomDragBase.tx + dx;
    zoomTy.value = zoomDragBase.ty + dy;
    clampPan();
  } else if (zoomPointers.size >= 2 && zoomPinchBase) {
    const [a, b] = [...zoomPointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    if (zoomPinchBase.dist > 0 && dist > 0) {
      const s = clampScale((zoomPinchBase.s * dist) / zoomPinchBase.dist);
      const kk = s / zoomPinchBase.s;
      const vwHalf = window.innerWidth / 2;
      const vhHalf = window.innerHeight / 2;
      zoomScale.value = s;
      zoomTx.value =
        mx - vwHalf - kk * (zoomPinchBase.mx - vwHalf - zoomPinchBase.tx);
      zoomTy.value =
        my - vhHalf - kk * (zoomPinchBase.my - vhHalf - zoomPinchBase.ty);
      clampPan();
    }
  }
}

function onZoomPointerUp(e) {
  zoomPointers.delete(e.pointerId);
  if (zoomPointers.size === 1) {
    const [p] = [...zoomPointers.values()];
    zoomDragBase = { px: p.x, py: p.y, tx: zoomTx.value, ty: zoomTy.value };
    zoomPinchBase = null;
  } else if (zoomPointers.size === 0) {
    zoomDragBase = null;
    zoomPinchBase = null;
  }
}

function onZoomWheel(e) {
  const s = clampScale(zoomScale.value * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  applyZoomAround(s, e.clientX, e.clientY);
  zoomMoved = true;
}

function onZoomOverlayClick() {
  if (zoomMoved) {
    zoomMoved = false;
    return;
  }
  closeZoom();
}

// 错题图放大时的视图切换列表:原图 / 技巧图 / 解析图(多张时带序号)
const zoomTabs = computed(() => {
  const item = zoomStudyItem.value;
  if (!item) return [];
  const ed = item.editionId;
  const orig = studyOriginalPath(item, ed);
  const tabs = [];
  if (orig) tabs.push({ key: "original", label: "原图" });
  // 简单一眼出的技巧图就是原图,不重复提供
  const qsrc = item.category === "easy" && orig ? orig : studyPath(item.image, ed);
  if (qsrc !== orig) tabs.push({ key: "question", label: "技巧图" });
  const details = item.details || [];
  details.forEach((d, i) => {
    tabs.push({
      key: "detail:" + i,
      label: "解析图" + (details.length > 1 ? i + 1 : ""),
    });
  });
  return tabs;
});

// 切换 zoom 层视图并重置缩放状态
function zoomShowView(key) {
  const item = zoomStudyItem.value;
  // 同一视图重复点击直接忽略,避免重设 src 触发无意义的加载态
  if (!item || key === zoomView.value) return;
  zoomView.value = key;
  zoomReset();
  const ed = item.editionId;
  if (key === "original") {
    studyZoomSrc.value = studyOriginalPath(item, ed) || studyPath(item.image, ed);
  } else if (key === "question") {
    studyZoomSrc.value =
      item.category === "easy" && studyOriginalPath(item, ed)
        ? studyOriginalPath(item, ed)
        : studyPath(item.image, ed);
  } else if (key.startsWith("detail:")) {
    const d = (item.details || [])[Number(key.slice(7))];
    if (d) studyZoomSrc.value = studyPath(d, ed);
  }
}

// 答题错图放大:按题号匹配该版本的学习库条目,可在原图/技巧图/解析图间切换;未收录则纯原图放大
function openQuizZoom(image, editionId) {
  const m = String(image).match(/^(image\d+)\.(?:jpe?g|png)$/i);
  const item = m ? studyItemByImage(m[1], editionId) : null;
  openZoom(
    item
      ? studyOriginalPath(item, editionId) || platePath(image, editionId)
      : platePath(image, editionId),
  );
  if (item) {
    zoomStudyItem.value = { ...item, editionId: editionId || item.editionId };
    zoomView.value = "original";
    // 后台预载技巧图/解析图,慢网络下切 tab 不空窗
    new Image().src = studyPath(item.image, editionId);
    item.details?.forEach((d) => {
      new Image().src = studyPath(d, editionId);
    });
  }
}

export function useZoom() {
  return {
    studyZoomSrc,
    zoomStudyItem,
    zoomView,
    zoomScale,
    zoomTx,
    zoomTy,
    zoomImgEl,
    zoomImgLoading,
    zoomTabs,
    openZoom,
    closeZoom,
    openQuizZoom,
    onZoomImgDone,
    onZoomOverlayClick,
    onZoomPointerDown,
    onZoomPointerMove,
    onZoomPointerUp,
    onZoomWheel,
    zoomShowView,
  };
}
