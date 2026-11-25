<template>
  <!-- 应用内更新弹窗(仅安卓 App 内由 useUpdater 触发) -->
  <Teleport to="body">
    <div v-if="showUpdate" class="upd-overlay" @click.self="closeUpdate">
      <div class="upd-dialog">
        <div class="upd-head">
          <div class="upd-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3v11m0 0l-4.2-4.2M12 14l4.2-4.2"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M4.5 17.5v1.2A2.3 2.3 0 006.8 21h10.4a2.3 2.3 0 002.3-2.3v-1.2"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <h2 class="upd-title">发现新版本</h2>
          <p class="upd-sub">新版本已就绪，升级体验更佳</p>
        </div>

        <!-- 新旧版本对比 -->
        <div class="upd-versions">
          <div class="upd-ver-chip upd-ver-old">
            <span class="uv-tag">当前版本</span>
            <span class="uv-num">v{{ localVersion }}</span>
          </div>
          <svg class="upd-arrow" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12h15m0 0l-5-5m5 5l-5 5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div class="upd-ver-chip upd-ver-new">
            <span class="uv-tag">最新版本</span>
            <span class="uv-num">v{{ remoteVersion }}</span>
          </div>
        </div>

        <div class="upd-notes-wrap">
          <div class="upd-notes-title">更新内容</div>
          <div class="upd-notes">{{ remoteNotes }}</div>
        </div>

        <div v-if="downloading" class="upd-progress-row">
          <div class="upd-progress">
            <i :style="{ width: progress + '%' }"></i>
          </div>
          <span class="upd-pct">{{ progress }}%</span>
        </div>
        <p v-if="hint" class="upd-hint">{{ hint }}</p>

        <div class="upd-btns">
          <button
            v-if="!downloading"
            class="upd-btn-ghost"
            @click="closeUpdate"
          >
            暂不更新
          </button>
          <button
            class="upd-btn-main"
            :disabled="downloading"
            @click="startUpdate"
          >
            {{ downloading ? "下载中…" : "立即更新" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 手动检查结果轻提示 -->
    <Transition name="upd-toast-fade">
      <div v-if="toastMsg" class="upd-toast">{{ toastMsg }}</div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useUpdater } from "../composables/useUpdater.js";

const {
  showUpdate,
  localVersion,
  remoteVersion,
  remoteNotes,
  downloading,
  progress,
  hint,
  toastMsg,
  startUpdate,
  closeUpdate,
} = useUpdater();
</script>

<style>
/* ---------- 应用内更新弹窗 ---------- */
.upd-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(20, 30, 47, 0.5);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.upd-dialog {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 24px 64px rgba(30, 50, 90, 0.22);
  padding: 24px 20px 20px;
  animation: pop-in 0.25s ease;
}

/* 头部:白底 + 小渐变图标,不再整块铺色 */
.upd-head {
  text-align: center;
}

.upd-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 10px;
  border-radius: 15px;
  background: linear-gradient(135deg, #4f9bff, #2f7ae5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 8px 18px rgba(47, 122, 229, 0.3);
}

.upd-icon svg {
  width: 26px;
  height: 26px;
}

.upd-title {
  font-size: 18px;
  letter-spacing: 2px;
  color: #22314a;
  margin: 0;
}

.upd-sub {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: #9aa8b8;
  letter-spacing: 0.5px;
}

/* 新旧版本对比 chips */
.upd-versions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 18px 0 2px;
}

.upd-ver-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border-radius: 14px;
  padding: 9px 16px;
  min-width: 108px;
}

.upd-ver-old {
  background: #f5f7fa;
}

.upd-ver-old .uv-tag {
  color: #9aa8b8;
}

.upd-ver-old .uv-num {
  color: #64748b;
}

.upd-ver-new {
  background: #eaf3ff;
  box-shadow: inset 0 0 0 1.5px #7db4f5;
}

.upd-ver-new .uv-tag {
  color: #7fa8dd;
}

.upd-ver-new .uv-num {
  color: #2f7ae5;
}

.uv-tag {
  font-size: 11px;
  letter-spacing: 1px;
}

.uv-num {
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.upd-arrow {
  width: 18px;
  height: 18px;
  color: #4f9bff;
  flex: none;
}

/* 更新内容 */
.upd-notes-wrap {
  padding: 14px 0 0;
}

.upd-notes-title {
  font-size: 11.5px;
  color: #9aa8b8;
  letter-spacing: 1px;
  margin-bottom: 7px;
}

.upd-notes {
  background: #f7f9fc;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 13.501px;
  line-height: 2;
  color: #45556b;
  white-space: pre-line;
  max-height: 24vh;
  overflow-y: auto;
}

/* 下载进度 */
.upd-progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 0 0;
}

.upd-progress {
  flex: 1;
  height: 7px;
  border-radius: 4px;
  background: #edf1f7;
  overflow: hidden;
}

.upd-progress i {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #4f9bff, #2f7ae5);
  transition: width 0.2s ease;
}

.upd-pct {
  min-width: 42px;
  text-align: right;
  font-size: 12.5px;
  color: #45556b;
  font-variant-numeric: tabular-nums;
}

.upd-hint {
  margin: 12px 0 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: #c23b27;
  text-align: center;
}

/* 按钮组 */
.upd-btns {
  display: flex;
  gap: 10px;
  padding: 18px 0 0;
}

.upd-btn-ghost {
  flex: 1;
  height: 44px;
  border: none;
  outline: none;
  appearance: none;
  border-radius: 14px;
  background: #f5f7fa;
  color: #64748b;
  font-size: 14.5px;
  transition: background 0.15s ease;
}

.upd-btn-ghost:active {
  background: #ebf0f6;
}

.upd-btn-main {
  flex: 1.4;
  height: 44px;
  border: none;
  outline: none;
  appearance: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #4f9bff, #2f7ae5);
  color: #fff;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 8px 18px rgba(47, 122, 229, 0.32);
  transition: transform 0.12s ease;
}

.upd-btn-main:active {
  transform: scale(0.97);
}

.upd-btn-main:disabled {
  opacity: 0.65;
}

/* 手动检查结果 toast */
.upd-toast {
  position: fixed;
  left: 50%;
  bottom: 8%;
  transform: translateX(-50%);
  z-index: 95;
  background: rgba(34, 49, 74, 0.92);
  color: #fff;
  font-size: 13.5px;
  padding: 10px 20px;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  white-space: nowrap;
}

.upd-toast-fade-enter-active,
.upd-toast-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.upd-toast-fade-enter-from,
.upd-toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
