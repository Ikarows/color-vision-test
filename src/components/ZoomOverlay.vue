<template>
  <!-- 图片放大查看层(支持双指/滚轮缩放,拖动平移,双击放大) -->
  <transition name="zoom-fade">
    <div
      v-if="studyZoomSrc"
      class="zoom-overlay"
      @click="onZoomOverlayClick"
      @pointerdown="onZoomPointerDown"
      @pointermove="onZoomPointerMove"
      @pointerup="onZoomPointerUp"
      @pointercancel="onZoomPointerUp"
      @wheel.prevent="onZoomWheel"
    >
      <!-- 学习关联切换:错题图放大时可切原图/技巧图/解析图
           图片+切换按钮组成一组,按钮始终紧贴图片正下方;
           pointer 事件全部截断,tab 点击不进入底层缩放手势/关闭逻辑 -->
      <div class="zoom-stage">
        <img
          ref="zoomImgEl"
          :src="studyZoomSrc"
          class="zoom-img"
          :class="{ 'is-loading': zoomImgLoading }"
          :style="{
            transform: `translate(${zoomTx}px, ${zoomTy}px) scale(${zoomScale})`,
          }"
          alt="放大查看"
          draggable="false"
          @load="onZoomImgDone"
          @error="onZoomImgDone"
        />
        <div
          v-if="zoomStudyItem"
          class="zoom-tabs"
          @click.stop
          @pointerdown.stop
          @pointerup.stop
          @pointercancel.stop
        >
          <button
            v-for="t in zoomTabs"
            :key="t.key"
            class="zoom-tab"
            :class="{ active: zoomView === t.key }"
            @click="zoomShowView(t.key)"
          >
            {{ t.label }}
          </button>
        </div>
      </div>
      <!-- 图片加载中:居中转圈(慢网络下切图时旧图淡出,避免看起来没反应) -->
      <transition name="fade">
        <div v-if="zoomImgLoading" class="zoom-loading" aria-hidden="true">
          <div class="quiz-boot">
            <div class="quiz-boot-glow"></div>
            <div class="quiz-boot-ring"></div>
          </div>
        </div>
      </transition>
      <!-- 关联学习条目的答案与记忆技巧 -->
      <div v-if="zoomStudyItem" class="zoom-tip">
        <span class="zoom-tip-answer">答案:{{ zoomStudyItem.answer }}</span>
        <p v-if="zoomStudyItem.tip">{{ zoomStudyItem.tip }}</p>
      </div>
      <button
        class="zoom-close"
        aria-label="关闭放大"
        @click.stop="closeZoom"
      >
        ×
      </button>
    </div>
  </transition>
</template>

<script setup>
import { useZoom } from "../composables/useZoom.js";

const {
  studyZoomSrc,
  zoomStudyItem,
  zoomView,
  zoomScale,
  zoomTx,
  zoomTy,
  zoomImgEl,
  zoomImgLoading,
  zoomTabs,
  closeZoom,
  onZoomImgDone,
  onZoomOverlayClick,
  onZoomPointerDown,
  onZoomPointerMove,
  onZoomPointerUp,
  onZoomWheel,
  zoomShowView,
} = useZoom();
</script>

<style>
/* ---------- 图片放大查看层 ---------- */
.zoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(10, 14, 24, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  cursor: zoom-out;
  touch-action: none; /* 手势全部自行接管(捏合/拖动/滚轮) */
  overscroll-behavior: contain;
}

/* 图片+切换按钮组:占满遮罩内区,按钮永远紧贴图片正下方一点点 */
.zoom-stage {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px; /* 图片与按钮的间距("下面一点点") */
}

.zoom-img {
  max-width: 100%;
  max-height: calc(100% - 56px); /* 给正下方按钮留空间(按钮高+间距) */
  object-fit: contain;
  border-radius: 8px;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  transform-origin: center center;
  will-change: transform;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
  transition: opacity 0.25s ease;
}

/* 换图加载中:旧图淡出,配合中央转圈给明确反馈 */
.zoom-img.is-loading {
  opacity: 0.15;
}

.zoom-loading {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* 不挡手势 */
}

/* 深色遮罩上用亮一点的蓝 */
.zoom-loading .quiz-boot-glow {
  background: radial-gradient(circle, rgba(94, 150, 255, 0.4) 0%, transparent 70%);
}

.zoom-loading .quiz-boot-ring {
  border-color: rgba(120, 170, 255, 0.25);
  border-top-color: #7db0ff;
}

.zoom-close {
  position: absolute;
  top: max(14px, var(--sbh, 0px), env(safe-area-inset-top));
  right: max(14px, env(safe-area-inset-right));
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 3px;
}

.zoom-close:active {
  background: rgba(255, 255, 255, 0.28);
}

/* zoom 层学习切换 tab:原图/技巧图/解析图(流式跟在图片正下方,不再绝对定位) */
.zoom-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 999px;
  backdrop-filter: blur(6px);
  max-width: 92%;
  flex-shrink: 0;
  margin-top: 15px;
}

.zoom-tab {
  border: 0;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  background: transparent;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
}

.zoom-tab.active {
  color: #fff;
  background: #2f6fed;
}

/* zoom 层答案/记忆技巧提示:在切换 tab 上方(不可交互,点击穿透到遮罩关闭) */
.zoom-tip {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  z-index: 2;
  max-width: min(86%, 560px);
  padding: 8px 14px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
  color: #fff;
  backdrop-filter: blur(6px);
  pointer-events: none;
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

.zoom-tip .zoom-tip-answer {
  font-weight: 700;
  color: #7dd3fc;
}

.zoom-tip p {
  margin: 2px 0 0;
}

.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: opacity 0.18s ease;
}

.zoom-fade-enter-from,
.zoom-fade-leave-to {
  opacity: 0;
}
</style>
