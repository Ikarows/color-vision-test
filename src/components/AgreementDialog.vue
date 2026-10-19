<template>
  <!-- 首次使用协议弹窗 -->
  <div v-if="showAgreement" class="agreement-overlay">
    <div class="agreement-dialog">
      <h2 class="agreement-title">使用协议</h2>
      <div class="agreement-body">
        <p>欢迎使用「{{ appTitle }}」，使用前请仔细阅读以下内容:</p>
        <p>
          <strong
            >1.
            软件版权归开发者本人（来杯橙汁/Ikarows）所有，仅限个人自测使用，禁止转卖或用于任何商业用途，否则将追究相关法律责任。</strong
          >
        </p>
        <p>2. 本软件提供色觉速记学习与自测功能，仅供个人学习。</p>
        <p>
          3. 软件内的辨色图素材由收集整理，图片素材等版权归图片原作者所有。
        </p>
        <p>4. 最后祝大家逢检必过。</p>
        <p>
          5.
          点击「同意并继续」或继续使用本软件，即表示您已阅读并同意本协议的全部内容。
        </p>
      </div>
      <button class="btn btn-primary agreement-btn" @click="acceptAgreement">
        同意并继续
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const appTitle = import.meta.env.VITE_APP_TITLE;

// ---------- 首次使用协议 ----------
const AGREEMENT_KEY = "cv_agreement_v1";
const showAgreement = ref(!localStorage.getItem(AGREEMENT_KEY));

function acceptAgreement() {
  localStorage.setItem(AGREEMENT_KEY, "1");
  showAgreement.value = false;
}
</script>

<style>
/* ---------- 首次使用协议弹窗 ---------- */
.agreement-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(23, 34, 51, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.agreement-dialog {
  width: 100%;
  max-width: 460px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  padding: 26px 24px 22px;
  animation: pop-in 0.25s ease;
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.agreement-title {
  font-size: 20px;
  text-align: center;
  letter-spacing: 2px;
  margin-bottom: 14px;
  color: #22314a;
}

.agreement-body {
  overflow-y: auto;
  background: #f4f7fb;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 13.501px;
  line-height: 2;
  color: #45556b;
  text-align: left;
}

.agreement-body p + p {
  margin-top: 6px;
}

.agreement-btn {
  width: 100%;
  justify-content: center;
  margin-top: 16px;
}
</style>
