<template>
  <div class="screen wrongbook-screen">
    <div class="back-bar">
      <button class="back-link" @click="stage = wrongBookBack">
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
        {{ wrongBookBack === "start" ? "返回菜单" : "返回统计" }}
      </button>
    </div>
    <div class="card wrongbook-card">
      <h2>常错图</h2>
      <p class="wb-desc">
        共 {{ wrongPlateStats.length }} 张易错图 · 按答错次数排序 · 连对 2
        次自动移出
      </p>
      <button
        v-if="wrongPlateStats.length"
        class="btn drill-btn"
        @click="$emit('drill')"
      >
        错图针对测试
        <svg viewBox="0 0 20 20" width="15" height="15">
          <path
            d="M4 10h11M11 5l5 5-5 5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <div v-if="wrongPlateStats.length" class="wb-grid">
        <div
          v-for="w in wrongPlateStats"
          :key="w.editionId + ':' + w.image"
          class="wb-item"
        >
          <div class="wb-imgwrap">
            <img
              :src="platePath(w.image, w.editionId)"
              :alt="w.image"
              class="zoomable"
              draggable="false"
              @error="retryImg"
              @click="$emit('zoom', w.image, w.editionId)"
            />
            <span class="wb-count">错 {{ w.count }} 次</span>
          </div>
          <span class="wb-answer">答案:{{ answerOf(w.image, w.editionId) }}</span>
        </div>
      </div>
      <p v-else class="no-data">还没有答错的图,继续保持!</p>
    </div>
  </div>
</template>

<script setup>
import { useStage } from "../../composables/useStage.js";
import { useRecords } from "../../composables/useRecords.js";
import { platePath, retryImg } from "../../utils/assets.js";

defineEmits(["drill", "zoom"]);

const { stage } = useStage();
const { wrongBookBack, wrongPlateStats, answerOf } = useRecords();
</script>

<style>
/* ---------- 常错图排行 ---------- */
.wrongbook-card {
  max-width: 720px;
}

.wrongbook-card h2 {
  font-size: 24px;
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.wb-desc {
  font-size: 12.501px;
  color: #8a99ad;
  margin-bottom: 20px;
}

.drill-btn {
  width: 100%;
  justify-content: center;
  gap: 7px;
  padding: 10px 20px;
  margin-bottom: 22px;
  font-size: 14px;
  border-radius: 10px;
  background: #f0f5ff;
  color: #2f6fed;
  border: 1px solid #d9e4fb;
  box-shadow: none;
  transition: all 0.18s ease;
}

.drill-btn:hover {
  background: #e3edff;
  border-color: #b6ccf5;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(47, 111, 237, 0.12);
}

.wb-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

@media (max-width: 560px) {
  .wb-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.wb-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f7f9fc;
  border: 1px solid #e8edf4;
  border-radius: 12px;
  padding: 10px;
}

.wb-imgwrap {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.wb-imgwrap img {
  width: 100%;
  display: block;
  border-radius: 8px;
  border: 1px solid #e6ebf1;
}

.wb-count {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(224, 83, 61, 0.92);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 99px;
}

.wb-answer {
  font-size: 12.501px;
  color: #45556b;
  font-weight: 600;
  text-align: center;
}
</style>
