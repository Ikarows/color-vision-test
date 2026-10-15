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
          <p class="dh-core">4 道题 · 最多允许错 2 题 · 倒计时 14 秒</p>
          <ul class="dh-list">
            <li class="ok">错 0 题 · 对 4 题 <b>✔ 通过</b></li>
            <li class="ok">错 1 题 · 对 3 题 <b>✔ 通过</b></li>
            <li class="ok">错 2 题 · 对 2 题 <b>✔ 通过</b></li>
            <li class="bad">错 3 题 · 对 1 题 <b>❌ 本轮失败,触发复测</b></li>
            <li>触发复测（再4张新图，同样最多错2题），如果复测也没通过就直接结束本轮测试。</li>
          </ul>
          <p class="dh-core-line">
            核心:4 题,容错 2 次,最低答对 2 题即可过关
          </p>
        </div>

        <div class="dh-section dh-examples">
          <p>
            <b>例 1</b> 错 2 题、对 2 题 → 整套做完,判定通过,直接进入下一项体检,不会再追加题目。
          </p>
          <p>
            <b>例 2</b> 错 3 题、对 1 题 → 本轮失败,触发复测(再 4 张新图);复测仍未通过,本轮测试结束。
          </p>
        </div>

        <div class="dh-warn">
          <p class="dh-warn-title">重要提醒</p>
          <p>
            是整套 4 题全部答完之后才统计,不是答对 2 题就立刻提前结束页面!哪怕前
            2 题答对了,依然要继续做完剩下 2 道题,直到 4 题全部完成,再出结果。
          </p>
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
  padding: 24px 16px;
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

.dh-core {
  font-size: 15.5px;
  font-weight: 800;
  color: #22314a;
  letter-spacing: 0.5px;
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

.dh-core-line {
  margin-top: 12px;
  font-size: 13.5px;
  font-weight: 700;
  color: #2f6fed;
}

.dh-examples p {
  font-size: 13.5px;
  color: #46586e;
  line-height: 1.7;
}

.dh-examples p + p {
  margin-top: 8px;
}

.dh-examples b {
  color: #22314a;
  margin-right: 4px;
}

.dh-warn {
  margin-top: 14px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 14px;
  padding: 14px 18px;
}

.dh-warn-title {
  font-size: 14px;
  font-weight: 800;
  color: #b45309;
}

.dh-warn p {
  font-size: 13.5px;
  color: #7c5a1e;
  line-height: 1.7;
  margin-top: 4px;
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
