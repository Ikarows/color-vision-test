<template>
  <div ref="root" class="sf-helper" :class="{ dragging, settling }" :style="ballStyle">
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
        alt="巧巧 · AI智能记图小助手"
        draggable="false"
      />
    </button>

    <!-- 互动气泡:进学习页欢迎语 / 连续学习提醒,自动消失,点气泡或球外区域收起 -->
    <transition name="sf-pop">
      <div
        v-if="bubble"
        class="sf-bubble"
        :class="{ flip: bubbleFlip, down: bubbleDown }"
        @click.stop="closeBubble"
      >
        <span class="sfb-tag">巧巧</span>
        <p>{{ bubble }}</p>
      </div>
    </transition>

    <!-- 设置面板 -->
    <div
      v-if="open"
      class="sf-panel"
      :class="panelPos"
      @pointerdown.stop
      @click.stop
    >
      <div class="sfp-head">
        <div class="sfp-title">巧巧 · AI记图小助手</div>
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
      <div class="sfp-row">
        <div class="sfp-texts">
          <div class="sfp-label">互动提示</div>
          <div class="sfp-desc">欢迎语 / 学习里程碑播报<br />连续学习休息提醒</div>
        </div>
        <button
          class="sfp-switch"
          :class="{ on: interact }"
          role="switch"
          :aria-checked="interact"
          @click="setInteract(!interact)"
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
import { useStudyStats } from "../composables/useStudyStats.js";
import { useStudy } from "../composables/useStudy.js";
import { useRecords } from "../composables/useRecords.js";
import {
  FIRST_MEET,
  WELCOME_BACK,
  STREAK,
  COUNT_MILESTONE,
  DURATION_MILESTONE,
  REST,
  GREETING,
  FLIP_FAST,
  LINGER,
  CATEGORY_DONE,
  CHITCHAT,
  pickCopy,
  fillCopy,
} from "../data/assistantCopy.js";
import aiImg from "../assets/img/ai.png";

const {
  autoplay,
  loopMode,
  nextDelay,
  NEXT_DELAYS,
  playingImage,
  isReviewActive,
  setAutoplay,
  setLoopMode,
  setNextDelay,
} = useTipAudio();

const { studyItem, studyIndex, studyList, studyCat } = useStudy();
const { statsRecords, recordScore, refreshStats } = useRecords();
const { stats, liveMs, formatDuration, saveStats } = useStudyStats();

// 互动提示开关(欢迎语/里程碑播报/休息提醒),默认开,localStorage 持久化
const INTERACT_KEY = "cv_assistant_interact";
const interact = ref(localStorage.getItem(INTERACT_KEY) !== "0");

function setInteract(v) {
  interact.value = v;
  localStorage.setItem(INTERACT_KEY, v ? "1" : "0");
  if (!v) closeBubble(); // 关闭时立即收起当前气泡
}

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
const settling = ref(false); // 首帧定位中:屏蔽位置过渡,避免挂载时从初始 (0,0) 穿屏飞到落点

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
  const target = clampPos(p);
  // 首帧定位屏蔽过渡:坐标初始是 (0,0),直接赋值会触发从左上飞到落点的穿屏动画;入场弹跳交给 sf-enter keyframes
  settling.value = true;
  pos.value = target;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => (settling.value = false)),
  );
}

function savePos() {
  localStorage.setItem(POS_KEY, JSON.stringify(pos.value));
}

// 重置位置:回到默认右下角并记忆
function resetPos() {
  pos.value = clampPos(defaultPos());
  savePos();
}

// 重置小助手:位置 + 全部设置(自动播放关/分类循环/1秒间隔/互动提示开)归默认
function resetAssistant() {
  setAutoplay(false);
  setLoopMode("category");
  setNextDelay(1);
  setInteract(true);
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

// ---------- 互动气泡:欢迎语 / 连续学习提醒 ----------
const bubble = ref(null); // 当前气泡文案,null = 隐藏
const bubbleFlip = ref(false); // 球贴右缘时气泡改贴球右缘向左展开
const bubbleDown = ref(false); // 球贴顶部时气泡改向下弹
let hideTimer = null;
let welcomeTimer = null;
const REST_STEP = 5 * 60 * 1000; // 每连续学习 5 分钟提醒一次
let restLevel = 0; // 本会话已提醒到的档位

function showBubble(text, stay = 6800) {
  bubble.value = text;
  bubbleFlip.value = pos.value.x + 244 > window.innerWidth; // 气泡宽 236 + 余量
  bubbleDown.value = pos.value.y < 140; // 气泡高约 130,贴顶时改向下弹
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => (bubble.value = null), stay);
}

function closeBubble() {
  bubble.value = null;
  clearTimeout(hideTimer);
}

// ---------- 发言调度:统一入口,冷却 + 占用检查,避免小助手轰炸 ----------
let coolUntil = 0; // 冷却截止时间戳,冷却期内普通互动不发言
const NUDGE_STAY_MS = 60 * 1000; // 小挪步门槛:连续学习满 1 分钟后的发言才可能挪动,刚进页/短停留不折腾

function speak(text, { stay = 6500, force = false, cool = 75000 } = {}) {
  // force 仅跳过冷却,不跳过占用(气泡显示中/面板开着时不插话)
  if (!interact.value || bubble.value || open.value) return false;
  const now = Date.now();
  if (!force && now < coolUntil) return false;
  showBubble(text, stay);
  // 小挪步双条件:用户长停留(连续学习满 1 分钟) + 40% 概率,说话才可能挪一下
  if (!dragging.value && liveMs.value >= NUDGE_STAY_MS && Math.random() < 0.4) nudgeBall();
  coolUntil = now + cool;
  return true;
}

// 发言伴生的小挪步:在当前位置附近小幅漂移(clamp 兜底不出屏);不写回 localStorage,不覆盖用户摆的位置
function nudgeBall() {
  pos.value = clampPos({
    x: pos.value.x + (Math.random() * 2 - 1) * 48,
    y: pos.value.y + (Math.random() * 2 - 1) * 36,
  });
  if (bubble.value) {
    // 挪动可能跨过贴边阈值,气泡弹出方向实时重算
    bubbleFlip.value = pos.value.x + 244 > window.innerWidth;
    bubbleDown.value = pos.value.y < 140;
  }
}

// 最近一次普通测试成绩(驾照模拟除外;无记录返回 null)
function lastTestScore() {
  refreshStats(); // 回读,刚测完的分数也能被提到
  const r = statsRecords.value.find((x) => x.mode !== "driving");
  return r ? recordScore(r) : null;
}

// 时段桶:morning(5-10) noon(11-13) afternoon(14-17) evening(18-22) night(23-4)
function greetingBucket() {
  const h = new Date().getHours();
  if (h >= 23 || h < 5) return "night";
  if (h < 11) return "morning";
  if (h < 14) return "noon";
  if (h < 18) return "afternoon";
  return "evening";
}

// 欢迎语优先级:首次见面 > 次数里程碑 > 累计时长里程碑 > 深夜问候 > 连续天数 > (时段问候 / 统计回访)
function welcomeText() {
  const s = stats.value;
  if (s.count <= 1) return pickCopy(FIRST_MEET);
  if (COUNT_MILESTONE[s.count]) return COUNT_MILESTONE[s.count];
  const nextDur = DURATION_MILESTONE.find(
    (d) => d.ms > s.durMark && d.ms <= s.totalMs,
  );
  if (nextDur) {
    s.durMark = nextDur.ms;
    saveStats();
    return nextDur.text;
  }
  if (greetingBucket() === "night") return pickCopy(GREETING.night);
  if ([3, 7, 14, 21, 30, 60, 100].includes(s.streak))
    return fillCopy(pickCopy(STREAK), { streak: s.streak });
  // 回访:约四成走时段问候,其余走统计版(带成绩/上次时长的模板仅在数据可用时进池)
  if (Math.random() < 0.4) return pickCopy(GREETING[greetingBucket()]);
  const score = lastTestScore();
  const pool = WELCOME_BACK.filter(
    (t) =>
      (t.includes("{last}") ? s.lastSessionMs >= 60000 : true) &&
      (t.includes("{score}") ? score !== null : true),
  );
  return fillCopy(pickCopy(pool), {
    count: s.count,
    total: formatDuration(s.totalMs),
    last: formatDuration(s.lastSessionMs),
    score,
  });
}

// 连续学习提醒:liveMs 心跳驱动,跨过 5 分钟档位弹一次(不受冷却排队,直接插话)
watch(liveMs, (ms) => {
  const level = Math.floor(ms / REST_STEP);
  if (level >= 1 && level > restLevel) {
    if (speak(fillCopy(pickCopy(REST), { minutes: level * 5 }), { force: true }))
      restLevel = level;
  }
});

// ---------- 行为互动:翻卡太快 / 同卡停留 / 分类通关 / 闲聊彩蛋 ----------
const flipTimes = []; // 最近翻卡时间戳(快速翻页检测窗口)
let lingerTimer = null;
let lingerCount = 0; // 本会话停留提醒已发次数
const doneCats = new Set(); // 本会话已恭喜过的分类
let chitchatCount = 0; // 本会话闲聊彩蛋已发条数
let chitchatTimer = null;
const mountedAt = Date.now();

function onCardChanged() {
  if (isReviewActive.value || autoplay.value) return; // 画廊无翻卡;自动播放是机器节奏,不算手速
  const now = Date.now();
  // 6 秒窗口内翻 4 张以上:提醒慢点翻
  flipTimes.push(now);
  while (flipTimes.length && now - flipTimes[0] > 6000) flipTimes.shift();
  if (flipTimes.length >= 4) {
    flipTimes.length = 0;
    speak(pickCopy(FLIP_FAST));
    return;
  }
  // 同卡停留 45 秒:提示看技巧/放大细节(每会话最多 2 次)
  clearTimeout(lingerTimer);
  lingerTimer = setTimeout(() => {
    if (lingerCount < 2 && speak(pickCopy(LINGER))) lingerCount++;
  }, 45000);
}

watch(studyItem, onCardChanged);

// 翻到某分类最后一张:恭喜通关(每组一次)
watch([studyIndex, studyList], () => {
  const list = studyList.value;
  if (isReviewActive.value || list.length < 5) return;
  if (
    studyIndex.value === list.length - 1 &&
    !doneCats.has(studyCat.value) &&
    speak(pickCopy(CATEGORY_DONE))
  ) {
    doneCats.add(studyCat.value);
  }
});

// 闲聊彩蛋:进页 3 分钟后,每 45 秒小概率冒一句,每会话最多 2 条
function armChitchat() {
  chitchatTimer = setInterval(() => {
    const now = Date.now();
    if (
      chitchatCount < 2 &&
      now - mountedAt > 3 * 60000 &&
      now > coolUntil &&
      !autoplay.value &&
      document.visibilityState === "visible" &&
      Math.random() < 0.2
    ) {
      if (speak(pickCopy(CHITCHAT), { cool: 90000 })) chitchatCount++;
    }
  }, 45000);
}

// ---------- 拖动(指针事件,位移超 6px 判定拖动) + 点击弹面板(click 兼容无指针事件环境) ----------
let drag = null;
let justDragged = false;
const dragging = ref(false); // 拖动中关闭位置过渡,保证跟手

function onDown(e) {
  // setPointerCapture 对合成事件/未激活指针会抛错,拖失败也不影响点击
  try {
    e.currentTarget.setPointerCapture?.(e.pointerId);
  } catch {
    /* 忽略,靠冒泡事件继续跟踪 */
  }
  dragging.value = true;
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
    closeBubble(); // 拖动时收起气泡
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
  dragging.value = false;
}

function onCancel() {
  drag = null;
  dragging.value = false;
}

function onBallClick() {
  if (justDragged) return;
  open.value = !open.value;
}

// 点击/按下面板外关闭(pointerdown 与 click 双监听,兼容无指针事件环境)
function onDocDown(e) {
  if (root.value && !root.value.contains(e.target)) {
    open.value = false;
    closeBubble(); // 点小助手以外区域收起气泡
  }
}

function onResize() {
  pos.value = clampPos(pos.value);
  if (open.value) calcPanelPos(); // 面板开着时窗口变化,方向实时重算
  if (bubble.value) {
    // 气泡开着时窗口变化,弹出方向实时重算
    bubbleFlip.value = pos.value.x + 244 > window.innerWidth;
    bubbleDown.value = pos.value.y < 140;
  }
}

watch(open, (v) => {
  if (v) {
    closeBubble(); // 设置面板打开时收起气泡
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
  // 进入学习页 0.7s 后小助手打招呼
  welcomeTimer = setTimeout(() => {
    if (!open.value) speak(welcomeText(), { stay: 6800, force: true, cool: 90000 });
  }, 700);
  armChitchat();
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
  document.removeEventListener("pointerdown", onDocDown, true);
  document.removeEventListener("click", onDocDown, true);
  clearTimeout(welcomeTimer);
  clearTimeout(hideTimer);
  clearTimeout(lingerTimer);
  clearInterval(chitchatTimer);
});
</script>

<style scoped>
.sf-helper {
  position: fixed;
  z-index: 60; /* 低于图片放大层(1000)与协议弹窗(100),高于页面元素 */
  width: 52px;
  height: 52px;
  /* 平时位置变化(发言小挪步/窗口缩放回弹)平滑过渡,带一点回弹更俏皮 */
  transition:
    left 0.5s cubic-bezier(0.34, 1.3, 0.64, 1),
    top 0.5s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.sf-helper.dragging {
  transition: none; /* 拖动跟手,不做平滑 */
}

.sf-helper.settling {
  transition: none; /* 首帧定位,不穿屏 */
}

/* 入场:每次进学习页从左侧同一水平线冲到落点,冲过头再回弹两下落定(纯水平,0.6s) */
.sf-helper {
  animation: sf-enter 0.6s ease-out both;
}

@keyframes sf-enter {
  0% {
    opacity: 0;
    transform: translateX(-120px);
  }
  18% {
    opacity: 1;
  }
  40% {
    transform: translateX(12px); /* 冲过头 */
  }
  58% {
    transform: translateX(-7px); /* 回弹第一下 */
  }
  76% {
    transform: translateX(3px); /* 回弹第二下 */
  }
  100% {
    opacity: 1;
    transform: none;
  }
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

/* 相邻设置行之间留一点间距 */
.sfp-row + .sfp-row {
  margin-top: 12px;
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

/* ---------- 互动气泡 ---------- */
.sf-bubble {
  position: absolute;
  bottom: calc(100% + 13px);
  left: 0;
  width: max-content;
  max-width: 236px;
  background: #fff;
  border: 1px solid #d9ece8;
  border-radius: 14px 14px 14px 4px; /* 锐角指向球 */
  box-shadow: 0 10px 28px rgba(43, 76, 126, 0.18);
  padding: 9px 13px 10px;
  text-align: left;
  cursor: default;
  z-index: 2;
}

/* 球贴顶部:气泡改向下弹,尾巴指向上 */
.sf-bubble.down {
  bottom: auto;
  top: calc(100% + 13px);
  border-radius: 4px 14px 14px 14px;
}

/* 球贴右缘:气泡贴球右缘向左展开,尾巴换到右下 */
.sf-bubble.flip {
  left: auto;
  right: 0;
  border-radius: 14px 14px 4px 14px;
}

/* 球贴右上角:尾巴在右上 */
.sf-bubble.flip.down {
  border-radius: 14px 14px 14px 4px;
}

/* 气泡小尾巴:斜置方块只露一半,双边框与气泡边框拼合 */
.sf-bubble::after {
  content: "";
  position: absolute;
  bottom: -5.5px;
  left: 16px;
  width: 10px;
  height: 10px;
  background: #fff;
  border-right: 1px solid #d9ece8;
  border-bottom: 1px solid #d9ece8;
  transform: rotate(45deg);
}

.sf-bubble.down::after {
  bottom: auto;
  top: -5.5px;
  transform: rotate(225deg);
}

.sf-bubble.flip::after {
  left: auto;
  right: 16px;
}

.sfb-tag {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #0d9488;
  background: #e6f7f3;
  border-radius: 999px;
  padding: 1.5px 8px;
  margin-bottom: 5px;
}

.sf-bubble p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #334155;
}

/* 进出场:弹性放大入场,轻缩退场 */
.sf-pop-enter-active {
  animation: sfb-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sf-pop-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.sf-pop-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.96);
}

@keyframes sfb-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
