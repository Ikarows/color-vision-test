<template>
  <!-- 域名迁移公告弹窗（仅 VITE_DOMAIN_NOTICE=1 的构建中包含） -->
  <Teleport to="body">
    <div v-if="visible" class="dn-overlay">
      <div class="dn-dialog">
        <div class="dn-head">
          <div class="dn-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9v4.5m0 3.2v.1"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
              />
              <path
                d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h2 class="dn-title">网站更换域名公告</h2>
          <p class="dn-sub">请尽快保存新域名，避免失联</p>
        </div>

        <!-- 新域名卡片 -->
        <div class="dn-domain-card">
          <span class="dn-domain-tag">新域名</span>
          <span class="dn-domain-text">{{ newDomain }}</span>
        </div>

        <div class="dn-body">
          <p class="dn-text">
            本站已迁移至新域名，<b>新域名长期有效</b>。<br />
            当前旧域名将于 <b>{{ stopDate }}</b> 停止服务，<br />
            届时将无法再通过旧域名访问。
          </p>
          <p class="dn-tip">建议立即收藏 / 保存上方新域名</p>
        </div>

        <div class="dn-btns">
          <button class="dn-btn-ghost" @click="copyDomain">
            {{ copied ? "已复制 ✓" : "复制新域名" }}
          </button>
          <a
            class="dn-btn-main"
            :href="newDomain"
            target="_blank"
            rel="noopener"
          >
            立即访问新域名
          </a>
        </div>
        <p class="dn-lock-tip">旧域名即将停用，请保存新域名后继续使用</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from "vue";

// 编译期注入：仅 --mode notice 构建时为 "1"（普通构建中被常量折叠剔除）
const enabled = import.meta.env.VITE_DOMAIN_NOTICE === "1";
const newDomain = import.meta.env.VITE_NEW_DOMAIN || "";

// 旧域名停用日期 = 构建日期 + 2 天
const stopDate = (() => {
  const base = typeof __BUILD_DATE__ !== "undefined" ? __BUILD_DATE__ : "";
  const d = base ? new Date(base) : new Date();
  d.setDate(d.getDate() + 2);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
})();

const visible = ref(enabled);
const copied = ref(false);

async function copyDomain() {
  try {
    await navigator.clipboard.writeText(newDomain);
  } catch {
    // http 环境剪贴板 API 可能不可用，退回 execCommand 方案
    const ta = document.createElement("textarea");
    ta.value = newDomain;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}
</script>

<style>
/* ---------- 域名迁移公告弹窗 ---------- */
.dn-overlay {
  position: fixed;
  inset: 0;
  z-index: 110; /* 高于协议弹窗(100)/更新弹窗(90),保证最先弹出且置顶 */
  background: rgba(20, 30, 47, 0.5);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.dn-dialog {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 24px 64px rgba(30, 50, 90, 0.22);
  padding: 24px 20px 18px;
  animation: pop-in 0.25s ease;
  text-align: center;
}

.dn-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 10px;
  border-radius: 15px;
  background: linear-gradient(135deg, #ffb14f, #f57e2e);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 8px 18px rgba(245, 126, 46, 0.3);
}

.dn-icon svg {
  width: 26px;
  height: 26px;
}

.dn-title {
  font-size: 18px;
  letter-spacing: 2px;
  color: #22314a;
  margin: 0;
}

.dn-sub {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: #9aa8b8;
  letter-spacing: 0.5px;
}

/* 新域名卡片 */
.dn-domain-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: 16px 0 0;
  padding: 14px 12px 12px;
  border-radius: 14px;
  background: #fff7ec;
  box-shadow: inset 0 0 0 1.5px #f5b06a;
  user-select: all;
}

.dn-domain-tag {
  font-size: 11px;
  letter-spacing: 2px;
  color: #e08a3a;
}

.dn-domain-text {
  font-size: 15px;
  font-weight: 700;
  color: #c05c14;
  word-break: break-all;
  line-height: 1.5;
}

.dn-body {
  padding: 14px 0 0;
}

.dn-text {
  margin: 0;
  background: #f7f9fc;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 13.501px;
  line-height: 2;
  color: #45556b;
  text-align: left;
}

.dn-text b {
  color: #c23b27;
  font-weight: 700;
}

.dn-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: #9aa8b8;
  letter-spacing: 0.5px;
}

/* 按钮组 */
.dn-btns {
  display: flex;
  gap: 10px;
  padding: 16px 0 0;
}

.dn-btn-ghost {
  flex: 1;
  height: 44px;
  border: none;
  outline: none;
  appearance: none;
  border-radius: 14px;
  background: #f5f7fa;
  color: #64748b;
  font-size: 14.5px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dn-btn-ghost:active {
  background: #ebf0f6;
}

.dn-btn-main {
  flex: 1.4;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffb14f, #f57e2e);
  color: #fff;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 8px 18px rgba(245, 126, 46, 0.32);
  transition: transform 0.12s ease;
}

.dn-btn-main:active {
  transform: scale(0.97);
}

.dn-lock-tip {
  margin: 12px 0 0;
  font-size: 12px;
  color: #c23b27;
  letter-spacing: 0.5px;
}
</style>
