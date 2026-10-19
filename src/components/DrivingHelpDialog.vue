<template>
  <!-- Teleport 到 body:.card 的 backdrop-filter 会创建 containing block 劫持 fixed 定位,必须脱离卡片层级 -->
  <Teleport to="body">
    <transition name="dh-fade">
      <div v-if="open" class="dh-mask" @click.self="$emit('close')">
        <div class="dh-card">
        <button class="dh-close" aria-label="关闭说明" @click="$emit('close')">
          <svg viewBox="0 0 20 20" width="16" height="16">
            <path
              d="M5 5l10 10M15 5L5 15"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <h2 class="dh-title">深圳 COSUN 科讯体检机</h2>
        <p class="dh-sub">车管所（深圳）体检机规则说明</p>

        <!-- 机器实拍图:src/assets/img/cosun.jpg -->
        <div class="dh-imgs">
          <img
            :src="cosunImg"
            alt="COSUN 科讯体检机"
            draggable="false"
            @error="onImgError"
          />
        </div>

        <div class="dh-section">
          <div class="dh-chips">
            <div class="dh-chip"><b>4 次</b><span>机会总数</span></div>
            <div class="dh-chip"><b>4 张</b><span>每次抽图</span></div>
            <div class="dh-chip"><b>连对 4 张</b><span>才能通过</span></div>
          </div>
          <ul class="dh-list">
            <li class="ok">本次机会连续答对 4 张 <b>✔ 通过</b></li>
            <li class="bad">任意一张答错 <b>❌ 本次机会立即作废</b></li>
            <li>作废后换 4 张新图,从头开始作答</li>
            <li class="bad">4 次机会全部用完 <b>❌ 未通过,正式结束</b></li>
          </ul>
        </div>

        <div class="dh-section dh-examples">
          <div class="dh-eg">
            <span class="dh-eg-no">例 1</span>
            <p>
              第 1 次答对 3 张,第 4 张答错 → 本次机会作废,第 2 次换 4 张新图重新开始。
            </p>
          </div>
          <div class="dh-eg">
            <span class="dh-eg-no">例 2</span>
            <p>
              某次答到第 2 张就错 → 立即作废(剩余的图不用再答),直接进入下一次机会。
            </p>
          </div>
        </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
// 驾照自助机模拟规则说明弹层(深圳 COSUN 科讯体检机)
import cosunImg from "../assets/img/cosun.jpg";

defineProps({
  open: { type: Boolean, default: false },
});
defineEmits(["close"]);

function onImgError(e) {
  e.target.style.display = "none";
}
</script>

<style>
.dh-mask {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: calc(24px + var(--sbh, 0px)) 16px 24px; /* 顶部让出状态栏(安卓沉浸式) */
}

/* margin:auto 在 flex 中实现水平+垂直居中,内容超高时贴边可滚不裁顶 */
.dh-card {
  position: relative;
  width: 100%;
  max-width: 520px;
  margin: auto;
  background: #fff;
  border-radius: 20px;
  padding: 26px 24px 24px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
}

.dh-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dh-close:hover {
  background: #e2e8f0;
}

.dh-title {
  font-size: 21px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: 1px;
}

.dh-sub {
  font-size: 13px;
  color: #8494a7;
  margin-top: 4px;
}

/* 机器实拍图区 */
.dh-imgs {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.dh-imgs img {
  flex: 1;
  min-width: 0;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 12px;
  background: #f4f7fb;
}

.dh-section {
  margin-top: 18px;
  background: #f8fafc;
  border: 1px solid #e8eef5;
  border-radius: 14px;
  padding: 16px 18px;
}

/* 规则数据胶囊:三个关键数字横排,避免长句换行 */
.dh-chips {
  display: flex;
  gap: 10px;
}

.dh-chip {
  flex: 1;
  min-width: 0;
  background: #fff;
  border: 1px solid #e3ecf6;
  border-radius: 12px;
  padding: 12px 6px 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dh-chip b {
  font-size: 16.5px;
  font-weight: 800;
  color: #2f6fed;
  white-space: nowrap;
}

.dh-chip span {
  font-size: 11.5px;
  color: #8494a7;
  white-space: nowrap;
}

.dh-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.dh-list li {
  list-style: none;
  font-size: 13.5px;
  color: #46586e;
  padding: 7px 12px;
  border-radius: 9px;
  background: #fff;
  border: 1px solid #edf2f7;
}

.dh-list li b {
  font-weight: 800;
}

.dh-list li.ok b {
  color: #178a50;
}

.dh-list li.bad b {
  color: #c23b27;
}

/* 徽章式示例行:序号胶囊 + 说明文字 */
.dh-eg {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fff;
  border: 1px solid #edf2f7;
  border-radius: 10px;
  padding: 10px 12px;
}

.dh-eg + .dh-eg {
  margin-top: 8px;
}

.dh-eg-no {
  flex: none;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #2f6fed;
  background: #e9f1fe;
  border-radius: 6px;
  padding: 3px 7px;
  margin-top: 2px;
}

.dh-eg p {
  margin: 0;
  font-size: 13px;
  color: #46586e;
  line-height: 1.65;
}

/* 弹层过渡 */
.dh-fade-enter-active,
.dh-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dh-fade-enter-active .dh-card,
.dh-fade-leave-active .dh-card {
  transition: transform 0.2s ease;
}

.dh-fade-enter-from,
.dh-fade-leave-to {
  opacity: 0;
}

.dh-fade-enter-from .dh-card,
.dh-fade-leave-to .dh-card {
  transform: scale(0.94) translateY(8px);
}
</style>
