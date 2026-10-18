<template>
  <div ref="root" class="sf-helper" :style="ballStyle">
    <!-- 悬浮球:点击弹设置,按住拖动(位置记忆);拖动用指针事件,点击用 click 兼容无指针事件环境 -->
    <button
      class="sf-ball"
      :class="{ on: autoplay, playing: isPlaying }"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
      @click="onBallClick"
    >
      <img
        class="sf-ball-img"
        :src="aiImg"
        alt="AI智能语音小助手"
        draggable="false"
      />
    </button>

    <!-- 设置面板 -->
    <div
      v-if="open"
      class="sf-panel"
      :class="panelPos"
      @pointerdown.stop
      @click.stop
    >
      <div class="sfp-head">
        <div class="sfp-title">AI智能语音小助手</div>
        <button class="sfp-reset" @click="resetAssistant">重置小助手</button>
      </div>
      <div class="sfp-row">
        <div class="sfp-texts">
          <div class="sfp-label">记图语音自动播放</div>
          <div class="sfp-desc">播完自动切下一张<br />没有技巧语音的卡直接跳过</div>
        </div>
        <button
          class="sfp-switch"
          :class="{ on: autoplay }"
          role="switch"
          :aria-checked="autoplay"
          @click="setAutoplay(!autoplay)"
        >
          <span class="sfp-knob"></span>
        </button>
      </div>
      <div class="sfp-loop">
        <div class="sfp-label">循环模式</div>
        <div class="sfp-modes">
          <button
            v-for="m in MODES"
            :key="m.key"
            class="sfp-mode"
            :class="{ active: loopMode === m.key, dim: !autoplay }"
            @click="setLoopMode(m.key)"
          >
            {{ m.name }}
          </button>
        </div>
      </div>
      <div class="sfp-loop">
        <div class="sfp-label">切下一张间隔</div>
        <div class="sfp-modes four">
          <button
            v-for="d in NEXT_DELAYS"
            :key="d"
            class="sfp-mode"
            :class="{ active: nextDelay === d, dim: !autoplay }"
            @click="setNextDelay(d)"
          >
            {{ d }}秒
          </button>
        </div>
      </div>
      <div class="sfp-state">
        {{ stateText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useTipAudio } from "../composables/useTipAudio.js";
import aiImg from "../assets/img/ai.png";

const {
  autoplay,
  loopMode,
  nextDelay,
  NEXT_DELAYS,
  playingImage,
  setAutoplay,
  setLoopMode,
  setNextDelay,
} = useTipAudio();

const MODES = [
  { key: "single", name: "单个循环" },
  { key: "category", name: "分类循环" },
  { key: "all", name: "全部循环" },
];

const BALL = 52;
const PANEL_W = 260; // 面板宽 252px + 阴影余量,用于弹出方向的空间判断
const POS_KEY = "cv_study_float_pos";

const root = ref(null);
const open = ref(false);
const pos = ref({ x: 0, y: 0 });

const isPlaying = computed(() => !!playingImage.value);
const stateText = computed(() => {
  if (!autoplay.value) return "自动播放已关闭";
  const mode = MODES.find((m) => m.key === loopMode.value)?.name || "";
  return isPlaying.value ? `${mode} · 播放中` : `${mode} · 等待播放`;
});

// ---------- 位置:默认右下角,localStorage 记忆拖动位置 ----------
function clampPos(p) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    x: Math.min(Math.max(p.x, 6), w - BALL - 6),
    y: Math.min(Math.max(p.y, 6), h - BALL - 6),
  };
}

function defaultPos() {
  // 默认贴主内容栏(居中限宽的 .study-screen)右下角,宽屏时不超出主画面;取不到布局回落视口右缘
  const screen = document.querySelector(".study-screen");
  const right = screen
    ? screen.getBoundingClientRect().right
    : window.innerWidth;
  return {
    x: right - BALL - 14,
    y: window.innerHeight - BALL - 96,
  };
}

function loadPos() {
  let p = null;
  try {
    p = JSON.parse(localStorage.getItem(POS_KEY) || "null");
  } catch {
    p = null;
  }
  if (!p || typeof p.x !== "number" || typeof p.y !== "number") {
    p = defaultPos();
  }
  pos.value = clampPos(p);
}

function savePos() {
  localStorage.setItem(POS_KEY, JSON.stringify(pos.value));
}

// 重置位置:回到默认右下角并记忆
function resetPos() {
  pos.value = clampPos(defaultPos());
  savePos();
}

// 重置小助手:位置 + 全部播放设置(自动播放关/分类循环/1秒间隔)归默认
function resetAssistant() {
  setAutoplay(false);
  setLoopMode("category");
  setNextDelay(1);
  resetPos();
  open.value = false;
}

const ballStyle = computed(() => ({
  left: pos.value.x + "px",
  top: pos.value.y + "px",
}));

// 面板朝向在每次打开与窗口尺寸变化时实时测量(不用 computed 缓存,避免视口变化后仍按旧尺寸决定方向):
// 横向默认向左展开(右锚),左侧宽度放不下才换到右边展开;
// 纵向按球的上/下剩余空间选边(空间不足自动换向),CSS 默认向上弹,向下弹需挂 .down 类
const PANEL_H = 320; // 面板约 300px 高 + 余量,用于弹出方向的空间判断

const panelPos = ref({ down: false, left: true });

function calcPanelPos() {
  const h = window.innerHeight;
  const spaceUp = pos.value.y - 12;
  const spaceDown = h - pos.value.y - BALL - 12;
  const preferUp = pos.value.y > h / 2;
  const up = preferUp ? spaceUp >= PANEL_H : spaceDown < PANEL_H;
  panelPos.value = {
    down: !up,
    left: pos.value.x + BALL - PANEL_W < 8,
  };
}

// ---------- 拖动(指针事件,位移超 6px 判定拖动) + 点击弹面板(click 兼容无指针事件环境) ----------
let drag = null;
let justDragged = false;

function onDown(e) {
  // setPointerCapture 对合成事件/未激活指针会抛错,拖失败也不影响点击
  try {
    e.currentTarget.setPointerCapture?.(e.pointerId);
  } catch {
    /* 忽略,靠冒泡事件继续跟踪 */
  }
  drag = {
    id: e.pointerId,
    sx: e.clientX,
    sy: e.clientY,
    ox: pos.value.x,
    oy: pos.value.y,
    moved: false,
  };
}

function onMove(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.sx;
  const dy = e.clientY - drag.sy;
  if (!drag.moved && Math.hypot(dx, dy) > 6) {
    drag.moved = true;
    open.value = false;
  }
  if (drag.moved) {
    pos.value = clampPos({ x: drag.ox + dx, y: drag.oy + dy });
  }
}

function onUp(e) {
  if (!drag || e.pointerId !== drag.id) return;
  if (drag.moved) {
    savePos();
    // 拖动松手后会紧跟一次 click,短暂标记避免误开面板
    justDragged = true;
    setTimeout(() => (justDragged = false), 50);
  }
  drag = null;
}

function onCancel() {
  drag = null;
}

function onBallClick() {
  if (justDragged) return;
  open.value = !open.value;
}

// 点击/按下面板外关闭(pointerdown 与 click 双监听,兼容无指针事件环境)
function onDocDown(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false;
}

function onResize() {
  pos.value = clampPos(pos.value);
  if (open.value) calcPanelPos(); // 面板开着时窗口变化,方向实时重算
}

watch(open, (v) => {
  if (v) {
    calcPanelPos(); // 每次弹出前按当前视口实测决定方向
    document.addEventListener("pointerdown", onDocDown, true);
    document.addEventListener("click", onDocDown, true);
  } else {
    document.removeEventListener("pointerdown", onDocDown, true);
    document.removeEventListener("click", onDocDown, true);
  }
});

onMounted(() => {
  loadPos();
  window.addEventListener("resize", onResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
  document.removeEventListener("pointerdown", onDocDown, true);
  document.removeEventListener("click", onDocDown, true);
});
</script>

<style scoped>
.sf-helper {
  position: fixed;
  z-index: 60; /* 低于图片放大层(1000)与协议弹窗(100),高于页面元素 */
  width: 52px;
  height: 52px;
}

.sf-ball {
  position: relative;
  width: 52px;
  height: 52px;
  padding: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background: #fff;
  box-shadow: 0 6px 16px rgba(43, 76, 126, 0.22);
  cursor: pointer;
  touch-action: none; /* 拖动时阻止页面滚动 */
  user-select: none;
  -webkit-user-select: none;
  transition:
    border-color 0.2s ease,
    transform 0.15s ease;
}

.sf-ball-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%; /* 图片自身裁圆,不能用球的 overflow:hidden,会裁掉外圈呼吸光环 */
  display: block;
  pointer-events: none; /* 指针事件交给球本身,避免拖动被图片打断 */
}

.sf-ball:active {
  transform: scale(0.94);
}

/* 自动播放开启:描边变主题色 */
.sf-ball.on {
  border-color: rgba(13, 148, 136, 0.55);
}

/* 播放中:呼吸光环 */
.sf-ball.playing::after {
  content: "";
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 2.5px solid rgba(13, 148, 136, 0.55);
  animation: sf-pulse 1.1s ease-out infinite;
}

@keyframes sf-pulse {
  0% {
    transform: scale(0.92);
    opacity: 1;
  }
  100% {
    transform: scale(1.28);
    opacity: 0;
  }
}

/* ---------- 设置面板 ---------- */
.sf-panel {
  position: absolute;
  bottom: calc(100% + 12px);
  width: 252px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e7e9ee;
  box-shadow: 0 14px 40px rgba(43, 76, 126, 0.2);
  padding: 14px 14px 10px;
  text-align: left;
  cursor: default;
}

.sf-panel.down {
  bottom: auto;
  top: calc(100% + 12px);
}

.sf-panel.left {
  left: 0;
}

.sf-panel:not(.left) {
  right: 0;
}

.sfp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.sfp-title {
  font-size: 14px;
  font-weight: 800;
  color: #22314a;
}

/* 重置位置:标题行右侧文字按钮 */
.sfp-reset {
  flex-shrink: 0;
  border: none;
  background: none;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #0d9488;
  background: #e6f7f3;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sfp-reset:hover {
  background: #0d9488;
  color: #fff;
}

.sfp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sfp-texts {
  min-width: 0;
}

.sfp-label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.sfp-desc {
  font-size: 11px;
  color: #8a97a6;
  margin-top: 2px;
}

/* 开关 */
.sfp-switch {
  flex-shrink: 0;
  width: 44px;
  height: 25px;
  border-radius: 999px;
  border: none;
  background: #cbd5e1;
  position: relative;
  cursor: pointer;
  transition: background 0.18s ease;
  padding: 0;
}

.sfp-switch.on {
  background: #0d9488;
}

.sfp-knob {
  position: absolute;
  top: 2.5px;
  left: 2.5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  transition: transform 0.18s ease;
}

.sfp-switch.on .sfp-knob {
  transform: translateX(19px);
}

/* 循环模式 */
.sfp-loop {
  margin-top: 12px;
}

.sfp-modes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 7px;
}

/* 间隔档位 4 个一排 */
.sfp-modes.four {
  grid-template-columns: repeat(4, 1fr);
}

.sfp-mode {
  padding: 7px 2px;
  border-radius: 9px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.sfp-mode.active {
  border-color: #0d9488;
  background: #0d9488;
  color: #fff;
}

.sfp-mode.dim:not(.active) {
  opacity: 0.55;
}

/* 状态行 */
.sfp-state {
  margin-top: 11px;
  padding-top: 9px;
  border-top: 1px dashed #e7e9ee;
  font-size: 11.5px;
  color: #8a97a6;
  text-align: center;
}
</style>
