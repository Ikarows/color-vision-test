<template>
  <div class="screen menu-screen">
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
            <span>{{ e.source }}{{ e.edition }}</span>
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
      <svg class="menu-entry-arrow" viewBox="0 0 20 20" width="14" height="14">
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

    <p class="disclaimer">本软件仅供自测学习使用，不能替代专业医学诊断</p>
    <p class="copyright">@Copyright 来杯橙汁/Ikarows 2026 v1.4.0</p>
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

function pickEdition(id) {
  setEdition(id);
  badgeOpen.value = false;
}

// 点击徽章外部时关闭弹出列表
function onDocClick(e) {
  if (!e.target.closest(".edition-badge-wrap")) badgeOpen.value = false;
}
onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
</script>

<style>
/* ---------- 首页菜单 ---------- */
.menu-screen {
  justify-content: center;
  position: relative;
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
  margin-top: 10px;
  font-size: 12px;
  color: #9aa8b8;
  text-align: center;
}

/* 左上角版本切换:固定贴角,与子页面返回栏同一水平基线;宽屏时左缘不超过内容区 */
.menu-top {
  position: absolute;
  top: 25px;
  left: max(16px, calc(50% - 330px));
  z-index: 5;
}

html.android-app .menu-top {
  top: 55px; /* 安卓状态栏避让,与 back-link 的 30px margin 基线一致(25+30) */
}

.edition-badge-wrap {
  position: relative;
}

.edition-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.85);
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
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(8px);
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
</style>
