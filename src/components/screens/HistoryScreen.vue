<template>
  <div class="screen stats-screen">
    <div class="back-bar">
      <button class="back-link" @click="$emit('back')">
        <svg viewBox="0 0 20 20" width="15" height="15">
          <path
            d="M12.5 4.5L7 10l5.5 5.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        返回
      </button>
    </div>
    <div class="card stats-card">
      <h2>测试统计</h2>
      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-num">{{ statsSummary.count }}</span>
          <span class="stat-label">测试次数</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">{{ statsSummary.totalQ }}</span>
          <span class="stat-label">累计答题</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">{{ statsSummary.accuracy }}%</span>
          <span class="stat-label">总体正确率</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">{{ statsSummary.best }}%</span>
          <span class="stat-label">最佳单次</span>
        </div>
      </div>

      <button
        v-if="statsSummary.count"
        class="wrongbook-entry"
        @click="openWrongBook('stats')"
      >
        <span class="we-icon">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 9v4M12 17h.01" />
            <path
              d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
            />
          </svg>
        </span>
        <span class="we-text">
          <span class="we-title">常错图</span>
          <span class="we-desc">按答错次数排序,重点复习易错图</span>
        </span>
        <span class="we-count">{{ wrongPlateStats.length }}</span>
        <svg class="we-arrow" viewBox="0 0 20 20" width="14" height="14">
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

      <div v-if="statsRecords.length" class="history">
        <h3>最近记录</h3>
        <div class="history-list" :key="historyPage">
          <div
            v-for="r in pagedRecords"
            :key="r.ts"
            class="history-item"
            :class="{ clickable: r.wrong && r.wrong.length }"
            @click="openRecord(r)"
          >
            <div class="h-main">
              <span class="h-time">{{ formatTime(r.ts) }}</span>
              <span class="h-sub"
                >{{ modeName(r.mode) }} · 答对 {{ r.correct }}/{{ r.total
                }}<template v-if="r.wrong && r.wrong.length">
                  · 错 {{ r.wrong.length }} 题</template
                ></span
              >
            </div>
            <span
              v-if="r.mode === 'driving'"
              class="h-driving"
              :class="drivingVerdict(r)"
              >{{ drivingVerdict(r) === "pass" ? "通过" : "未通过" }}</span
            >
            <span v-else class="h-score" :class="scoreClass(r)"
              >{{ recordScore(r) }}分</span
            >
            <svg
              v-if="r.wrong && r.wrong.length"
              class="h-arrow"
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
          </div>
        </div>
        <div v-if="historyTotalPages > 1" class="history-pager">
          <button
            class="pager-btn"
            :disabled="historyPage <= 1"
            @click="setPage(historyPage - 1)"
          >
            上一页
          </button>
          <span class="pager-info"
            >{{ historyPage }} / {{ historyTotalPages }}</span
          >
          <button
            class="pager-btn"
            :disabled="historyPage >= historyTotalPages"
            @click="setPage(historyPage + 1)"
          >
            下一页
          </button>
        </div>
      </div>
      <p v-else class="no-data">暂无测试记录,快去完成一次测试吧</p>

      <button
        v-if="statsSummary.count"
        class="btn btn-danger"
        @click="confirmOpen = true"
      >
        清空本版数据
      </button>
    </div>

    <!-- 清空确认弹层:Teleport 到 body,.card 的 backdrop-filter 会劫持 fixed 定位 -->
    <Teleport to="body">
      <transition name="rc-fade">
        <div v-if="confirmOpen" class="rc-mask" @click.self="confirmOpen = false">
          <div class="rc-card">
            <h3 class="rc-title">清空本版数据</h3>
            <p class="rc-text">
              将删除 <b>{{ editionLabel }}</b> 的全部测试记录与常错图统计，
              其他版本的数据不受影响。此操作无法撤销。
            </p>
            <div class="rc-actions">
              <button class="rc-btn rc-cancel" @click="confirmOpen = false">
                取消
              </button>
              <button class="rc-btn rc-ok" @click="doReset">确认清空</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRecords } from "../../composables/useRecords.js";
import { useEdition } from "../../composables/useEdition.js";

defineEmits(["back"]);

const {
  statsSummary,
  statsRecords,
  historyPage,
  historyTotalPages,
  pagedRecords,
  setPage,
  openWrongBook,
  confirmReset,
  modeName,
  formatTime,
  recordScore,
  scoreClass,
  drivingVerdict,
  openRecord,
  wrongPlateStats,
} = useRecords();
const { editionLabel } = useEdition();

// 清空确认弹层(局部状态,不进全局)
const confirmOpen = ref(false);
function doReset() {
  confirmReset();
  confirmOpen.value = false;
}
</script>

<style>
.stats-card {
  max-width: 640px;
}

.stats-card h2 {
  font-size: 24px;
  margin-bottom: 22px;
  letter-spacing: 2px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

@media (max-width: 520px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-box {
  background: #f4f7fb;
  border-radius: 12px;
  padding: 18px 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-num {
  font-size: 26px;
  font-weight: 800;
  color: #22314a;
}

.stat-label {
  font-size: 12px;
  color: #8a99ad;
}

.history {
  text-align: left;
  margin-bottom: 24px;
}

.history h3 {
  font-size: 15px;
  margin-bottom: 10px;
  color: #34455a;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

.history-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 12px;
}

.pager-btn {
  padding: 6px 16px;
  border: 1px solid #dde5f0;
  border-radius: 999px;
  background: #fff;
  color: #45556b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.pager-btn:hover:not(:disabled) {
  color: #2f6fed;
  border-color: #b6ccf5;
  box-shadow: 0 4px 12px rgba(47, 111, 237, 0.12);
}

.pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager-info {
  font-size: 13px;
  font-weight: 700;
  color: #6b7a90;
  min-width: 52px;
  text-align: center;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f7f9fc;
  border: 1px solid #e8edf4;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
}

.h-time {
  color: #8a99ad;
}

.h-score {
  font-weight: 800;
}

.h-score.good {
  color: #177a46;
}
.h-score.mid {
  color: #b7791f;
}
.h-score.bad {
  color: #c23b27;
}

/* 自助机模拟记录:通过/未通过徽章(替代评分) */
.h-driving {
  margin-left: 10px;
  flex-shrink: 0;
  white-space: nowrap;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
}

.h-driving.pass {
  background: #e7f6ee;
  color: #178a50;
}

.h-driving.fail {
  background: #fdecea;
  color: #c23b27;
}

/* 历史记录:可点击查看答错的图 */
.history-item.clickable {
  cursor: pointer;
  transition: all 0.15s ease;
}

.history-item.clickable:hover {
  border-color: #b6ccf5;
  background: #f2f7ff;
}

.h-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.h-sub {
  font-size: 12px;
  color: #8a99ad;
}

.h-score {
  margin-left: 10px;
  white-space: nowrap;
}

.h-arrow {
  flex-shrink: 0;
  margin-left: 6px;
  color: #b7c2d0;
}

/* ---------- 常错图入口 ---------- */
.wrongbook-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px 16px;
  margin-bottom: 22px;
  border: 1px solid #f3d9d4;
  background: #fdf6f5;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.18s ease;
}

.wrongbook-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(224, 83, 61, 0.14);
}

.we-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e0533d, #ef7a66);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.we-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.we-title {
  font-size: 15px;
  font-weight: 800;
  color: #22314a;
}

.we-desc {
  font-size: 12px;
  color: #8a99ad;
}

.we-count {
  font-size: 18px;
  font-weight: 800;
  color: #e0533d;
}

.we-arrow {
  flex-shrink: 0;
  color: #d9a79e;
}

.btn-danger {
  background: #fdecea;
  color: #c23b27;
}

.btn-danger:hover {
  background: #fbdad6;
}

/* ---------- 清空确认弹层 ---------- */
.rc-mask {
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
.rc-card {
  width: 100%;
  max-width: 340px;
  margin: auto;
  background: #fff;
  border-radius: 18px;
  padding: 22px 20px 18px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
}

.rc-title {
  font-size: 17px;
  font-weight: 800;
  color: #22314a;
  letter-spacing: 1px;
}

.rc-text {
  margin-top: 10px;
  font-size: 13.5px;
  color: #5c6f84;
  line-height: 1.7;
}

.rc-text b {
  color: #c23b27;
}

.rc-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.rc-btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 11px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.rc-cancel {
  background: #f1f5f9;
  color: #45556b;
}

.rc-cancel:hover {
  background: #e2e8f0;
}

.rc-ok {
  background: #e0533d;
  color: #fff;
}

.rc-ok:hover {
  background: #c94732;
}

/* 弹层过渡 */
.rc-fade-enter-active,
.rc-fade-leave-active {
  transition: opacity 0.2s ease;
}

.rc-fade-enter-active .rc-card,
.rc-fade-leave-active .rc-card {
  transition: transform 0.2s ease;
}

.rc-fade-enter-from,
.rc-fade-leave-to {
  opacity: 0;
}

.rc-fade-enter-from .rc-card,
.rc-fade-leave-to .rc-card {
  transform: scale(0.94) translateY(8px);
}
</style>
