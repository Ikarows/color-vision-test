<template>
  <div class="screen menu-screen">
    <!-- 顶部吸顶条:只放版本徽章,复用 .back-bar 机制(默认透明,吸顶后由 App.vue 加 .scrolled 变实色) -->
    <header class="menu-top-bar back-bar">
      <div class="menu-top">
        <div class="edition-badge-wrap">
          <button
            class="edition-badge"
            :class="{ open: badgeOpen }"
            aria-label="切换题库版本"
            @click="badgeOpen = !badgeOpen"
          >
            {{ edition.edition }}
            <svg viewBox="0 0 20 20" width="11" height="11">
              <path
                d="M5.5 8l4.5 4.5L14.5 8"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div v-if="badgeOpen" class="edition-menu">
            <button
              v-for="e in editions"
              :key="e.id"
              class="edition-option"
              :class="{ active: edition.id === e.id }"
              @click="pickEdition(e.id)"
            >
              <span> {{ e.name }} {{ e.source }}{{ e.edition }}</span>
              <svg
                v-if="edition.id === e.id"
                viewBox="0 0 20 20"
                width="14"
                height="14"
              >
                <path
                  d="M3 10.5l4.5 4.5L17 5.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="brand">
        <img
          class="brand-logo"
          :src="BRAND_LOGO_SRC"
          alt="色盲色弱助手 logo"
          draggable="false"
        />
      </div>
      <h1 class="title">色盲色弱助手</h1>
    </header>
    <!-- 版本切换动画:内容包一层带 key 的容器,切换时整组重建重放入场动画;display:contents 不影响原 flex 布局 -->
    <div :key="edition.id" class="menu-body">
      <p class="subtitle">基于{{ editionLabel }} · 共 {{ totalCount }} 题</p>

      <div class="menu-cards">
        <button class="menu-card study" @click="$emit('study')">
          <span class="menu-icon">
            <svg
              viewBox="0 0 24 24"
              width="30"
              height="30"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z"
              />
              <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
              <path d="M9 8h7M9 12h5" />
            </svg>
          </span>
          <span class="menu-name">技巧记图</span>
          <span class="menu-desc"
            >逐图记忆技巧讲解<br />简单 {{ categoryCount("easy") }} · 特征
            {{ categoryCount("feature") }} · 数字
            {{ categoryCount("number") }}</span
          >
        </button>
        <button class="menu-card quiz" @click="$emit('start')">
          <span class="menu-icon">
            <svg
              viewBox="0 0 24 24"
              width="30"
              height="30"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 11l3 3L22 4" />
              <path
                d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
              />
            </svg>
          </span>
          <span class="menu-name">体检模拟</span>
          <span class="menu-desc"
            >模拟体检自测<br />固定顺序 · 随机 10 / 20 / 全部</span
          >
        </button>
      </div>

      <!-- 体检点查询入口:全宽横条卡 -->
      <button class="menu-entry" @click="$emit('hospitals')">
        <span class="menu-entry-icon">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <span class="menu-entry-text">
          <span class="menu-entry-name">体检点查询</span>
          <span class="menu-entry-desc">按省市查找提供色觉检查的体检机构</span>
        </span>
        <svg
          class="menu-entry-arrow"
          viewBox="0 0 20 20"
          width="14"
          height="14"
        >
          <path
            d="M7.5 4.5L13 10l-5.5 5.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- 版本切换胶囊:居中弹出,背后带局部柔光垫,避免与内容硬碰 -->
    <div
      v-if="switching"
      :key="'sweep-' + edition.id"
      class="edition-sweep"
      aria-hidden="true"
    >
      <div class="es-pad"></div>
      <div class="es-label">已切换 · {{ edition.edition }}</div>
    </div>

    <p class="disclaimer">本软件仅供自测学习使用，不能替代专业医学诊断</p>
    <p class="copyright">@Copyright 来杯橙汁/Ikarows 2026 v2.0.0</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useEdition } from "../../composables/useEdition.js";
import { useStudy } from "../../composables/useStudy.js";

defineEmits(["study", "start", "hospitals"]);

// 品牌 logo:项目自带图标
const BRAND_LOGO_SRC = import.meta.env.BASE_URL + "logo.png";

const { editions, edition, setEdition, totalCount, editionLabel } =
  useEdition();
const { categoryCount } = useStudy();

// 左上角版本徽章的弹出状态
const badgeOpen = ref(false);

// 版本切换胶囊动画开关(动画结束自动复位)
const switching = ref(false);
let switchTimer = null;

function pickEdition(id) {
  badgeOpen.value = false;
  if (id === edition.value.id) return;
  setEdition(id);
  switching.value = true;
  clearTimeout(switchTimer);
  switchTimer = setTimeout(() => (switching.value = false), 950);
}

// 点击徽章外部时关闭弹出列表
function onDocClick(e) {
  if (!e.target.closest(".edition-badge-wrap")) badgeOpen.value = false;
}
onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
  clearTimeout(switchTimer);
});
</script>

<style>
/* ---------- 首页菜单 ---------- */
.menu-screen {
  position: relative;
  /* 原justify-content:center在内容超高时顶端滚不到底,头部吸顶永远无法触发;
     改为首尾 auto 外边距实现溢出安全居中(空间够时居中,超高时贴顶可滚动) */
}

.menu-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  width: 100%;
  max-width: 620px;
}

@media (max-width: 520px) {
  .menu-cards {
    grid-template-columns: 1fr;
  }
}

.menu-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 22px 28px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 40px rgba(43, 76, 126, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 48px rgba(43, 76, 126, 0.16);
}

.menu-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.menu-card.study .menu-icon {
  background: linear-gradient(135deg, #0d9488, #2dd4bf);
  box-shadow: 0 8px 18px rgba(13, 148, 136, 0.35);
}

.menu-card.quiz .menu-icon {
  background: linear-gradient(135deg, #2f6fed, #63b3ff);
  box-shadow: 0 8px 18px rgba(47, 111, 237, 0.35);
}

.menu-name {
  font-size: 19px;
  font-weight: 800;
  color: #22314a;
  letter-spacing: 1px;
}

.menu-desc {
  font-size: 13px;
  color: #8a99ad;
  line-height: 1.8;
}

/* 体检点查询入口:全宽横条卡,与上方卡片区同宽 */
.menu-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 620px;
  margin-top: 13px;
  padding: 9px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 40px rgba(43, 76, 126, 0.1);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.menu-entry:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 46px rgba(43, 76, 126, 0.15);
}

.menu-entry-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  box-shadow: 0 6px 15px rgba(245, 158, 11, 0.35);
  flex-shrink: 0;
}

.menu-entry-icon svg {
  width: 20px;
  height: 20px;
}

.menu-entry-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-entry-name {
  font-size: 16px;
  font-weight: 800;
  color: #22314a;
  letter-spacing: 1px;
}

.menu-entry-desc {
  font-size: 12.5px;
  color: #8a99ad;
}

.menu-entry-arrow {
  color: #b0bdcd;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.menu-entry:hover .menu-entry-arrow {
  transform: translateX(3px);
  color: #f59e0b;
}

/* 版权行:仅首页菜单使用 */
.copyright {
  margin-top: 8px;
  margin-bottom: auto; /* 尾部 auto 外边距:与头部块顶部 auto 配对,实现溢出安全居中 */
  font-size: 12px;
  color: #9aa8b8;
  text-align: center;
}

/* 吸顶条:徽章行+logo+标题纵向排列,外观与原头部一致,滚动时整组吸顶
   (沿用 .back-bar 机制:透明→吸顶实色盖住滚过的内容,安卓 padding-top 让出状态栏) */
.menu-top-bar.back-bar {
  flex-direction: column;
  align-items: center;
}

/* 徽章行在头部块内左对齐(横向 padding 已按内容区对齐),与 logo 保持原间距 */
.menu-top {
  align-self: flex-start;
  margin-bottom: 12px;
}

/* 吸顶后用页面同款渐变(.app 背景的顶部一段)代替纯色,与页面背景无缝衔接 */
.menu-top-bar.back-bar.scrolled {
  background:
    radial-gradient(1200px 500px at 80% -10%, #dbeafe 0%, transparent 55%),
    radial-gradient(900px 420px at -10% 30%, #e0f2f1 0%, transparent 50%),
    linear-gradient(180deg, #f6f9fd 0%, #eef2f7 100%);
}

/* 溢出安全居中:吸顶条下方的内容组首尾 auto 外边距(空间够时居中,超高时贴顶可滚动,吸顶才可触发) */
.menu-body > .subtitle {
  margin-top: auto;
}

.edition-badge-wrap {
  position: relative;
}

.edition-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: #fff;
  color: #45556b;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  padding: 8px 14px 8px 16px;
  border-radius: 999px;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
}

.edition-badge:hover,
.edition-badge.open {
  border-color: #b6ccf5;
  color: #2f6fed;
}

.edition-badge svg {
  transition: transform 0.18s ease;
}

.edition-badge.open svg {
  transform: rotate(180deg);
}

/* 版本弹出列表 */
.edition-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 196px;
  background: #fff;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 14px;
  box-shadow: 0 14px 36px rgba(43, 76, 126, 0.18);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 50;
  animation: edPop 0.16s ease;
  transform-origin: top left;
}

@keyframes edPop {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.edition-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: none;
  background: transparent;
  color: #45556b;
  font-size: 13.501px;
  font-weight: 600;
  font-family: inherit;
  text-align: left;
  padding: 10px 12px;
  border-radius: 9px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s ease;
}

.edition-option:hover {
  background: #eef4ff;
  color: #2f6fed;
}

.edition-option.active {
  color: #2f6fed;
  font-weight: 800;
  background: #eef4ff;
}

/* ---------- 版本切换动画 ---------- */
/* 内容容器:不参与布局,仅作为 key 重建的载体 */
.menu-body {
  display: contents;
}

/* 切换后逐项错落入场(副标题/卡片区/查询入口 共 3 项;logo/标题已上移吸顶条,不参与重播) */
.menu-body > * {
  animation: edIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

.menu-body > *:nth-child(1) {
  animation-delay: 0.08s;
}

.menu-body > *:nth-child(2) {
  animation-delay: 0.15s;
}

.menu-body > *:nth-child(3) {
  animation-delay: 0.22s;
}

.menu-body > *:nth-child(4) {
  animation-delay: 0.29s;
}

.menu-body > *:nth-child(5) {
  animation-delay: 0.36s;
}

@keyframes edIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ---------- 版本切换胶囊过渡层 ---------- */
.edition-sweep {
  position: fixed;
  inset: 0;
  z-index: 90;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 柔光垫:只垫在胶囊背后一小圈,轻微压虚底下内容,胶囊悬浮有依托 */
.es-pad {
  position: absolute;
  width: 46vmin;
  height: 46vmin;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.72),
    rgba(255, 255, 255, 0.35) 55%,
    transparent 72%
  );
  animation: esPad 0.85s ease forwards;
}

@keyframes esPad {
  0% {
    opacity: 0;
    transform: scale(0.7);
  }
  20% {
    opacity: 1;
    transform: scale(1);
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.08);
  }
}

.es-label {
  position: relative;
  padding: 12px 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 10px 30px rgba(43, 76, 126, 0.16);
  backdrop-filter: blur(6px);
  font-size: 17px;
  font-weight: 800;
  color: #2f6fed;
  letter-spacing: 2px;
  white-space: nowrap;
  animation: esLabel 0.85s ease forwards;
}

@keyframes esLabel {
  0% {
    opacity: 0;
    transform: scale(0.94);
    filter: blur(2px);
  }
  12% {
    opacity: 1;
    transform: scale(1.02);
    filter: blur(0);
  }
  78% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.04);
    filter: blur(0);
  }
}

/* 弱动效偏好:关闭切换动画 */
@media (prefers-reduced-motion: reduce) {
  .menu-body > * {
    animation: none;
  }

  .edition-sweep {
    display: none;
  }
}
</style>
