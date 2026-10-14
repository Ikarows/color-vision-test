<template>
  <div class="screen record-screen">
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
        返回统计
      </button>
    </div>
    <div class="card record-card" v-if="activeRecord">
      <h2>测试详情</h2>
      <div class="rec-summary">
        <span
          v-if="activeRecord.mode === 'driving'"
          class="rd-driving"
          :class="drivingVerdict(activeRecord)"
          >{{ drivingVerdict(activeRecord) === "pass" ? "通过" : "未通过" }}</span
        >
        <div v-else class="rec-score" :class="scoreClass(activeRecord)">
          {{ recordScore(activeRecord) }}<span>分</span>
        </div>
        <div class="rec-meta">
          <span class="rm-time">{{ formatTime(activeRecord.ts) }}</span>
          <span
            >{{ modeName(activeRecord.mode) }} · 答对
            {{ activeRecord.correct }}/{{ activeRecord.total }}</span
          >
        </div>
      </div>

      <div v-if="activeWrong.length" class="wrong-section">
        <h3>答错的图 · {{ activeWrong.length }}</h3>
        <div class="wrong-list">
          <div v-for="(w, i) in activeWrong" :key="i" class="wrong-item">
            <img
              :src="platePath(w.image, w.editionId || activeRecord.editionId)"
              :alt="'错图 ' + (i + 1)"
              class="zoomable"
              draggable="false"
              @error="retryImg"
              @click="$emit('zoom', w.image, w.editionId || activeRecord.editionId)"
            />
            <div class="wrong-info">
              <span class="wrong-no">第 {{ w.no }} 题</span>
              <span
                >你的选择:<em class="bad">{{ w.chosen ?? "超时未答" }}</em
              ></span
              >
              <span
                >正确答案:<em class="good">{{ w.answer }}</em></span
              >
            </div>
          </div>
        </div>
      </div>
      <p v-else class="all-right">本次全部答对,没有错图</p>
    </div>
  </div>
</template>

<script setup>
import { useRecords } from "../../composables/useRecords.js";
import { platePath, retryImg } from "../../utils/assets.js";

defineEmits(["back", "zoom"]);

const {
  activeRecord,
  activeWrong,
  modeName,
  formatTime,
  recordScore,
  scoreClass,
  drivingVerdict,
} = useRecords();
</script>

<style>
/* ---------- 历史记录详情 ---------- */
.record-card {
  max-width: 640px;
}

.record-card h2 {
  font-size: 24px;
  margin-bottom: 20px;
  letter-spacing: 2px;
}

.rec-summary {
  display: flex;
  align-items: center;
  gap: 18px;
  background: #f4f7fb;
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 22px;
}

.rec-score {
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
}

.rec-score span {
  font-size: 15px;
  font-weight: 700;
  margin-left: 2px;
}

.rec-score.good {
  color: #177a46;
}
.rec-score.mid {
  color: #b7791f;
}
.rec-score.bad {
  color: #c23b27;
}

/* 自助机模拟详情:通过/未通过徽章(替代大分数) */
.rd-driving {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 2px;
  flex-shrink: 0;
}

.rd-driving.pass {
  background: #e7f6ee;
  color: #178a50;
}

.rd-driving.fail {
  background: #fdecea;
  color: #c23b27;
}

.rec-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 13.501px;
  color: #5c6f84;
  text-align: left;
}

.rm-time {
  font-weight: 700;
  color: #34455a;
}
</style>
