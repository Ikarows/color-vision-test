<template>
  <div class="screen study-screen">
    <header class="study-header">
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
        返回菜单
      </button>
      <div class="study-tabs">
        <button
          v-for="c in visibleCategories"
          :key="c.key"
          class="study-tab"
          :class="{ active: studyCat === c.key }"
          @click="switchCategory(c.key)"
        >
          {{ c.name }}
          <em>{{ categoryCount(c.key) }}</em>
        </button>
      </div>
      <div class="study-subtabs" v-if="studyCat === 'feature'">
        <button
          v-for="s in visibleSubs"
          :key="s.key"
          class="sub-tab"
          :class="{ active: studySubCat === s.key }"
          @click="setSubCat(s.key)"
        >
          {{ s.name }} <em>{{ subCount(s.key) }}</em>
        </button>
      </div>
    </header>

    <main class="quiz-main study-main" :key="studyCat + '-' + studyIndex">
      <div v-if="showViewSwitch" class="view-switch">
        <button
          v-if="hasStudyOriginal"
          class="vs-btn"
          :class="{ active: studyView === 'original' }"
          @click="studyView = 'original'"
        >
          原图
        </button>
        <button
          v-if="hasStudyTip"
          class="vs-btn"
          :class="{ active: studyView === 'question' }"
          @click="studyView = 'question'"
        >
          技巧图
        </button>
        <button
          v-if="studyItem.details?.length"
          class="vs-btn"
          :class="{ active: studyView === 'detail' }"
          @click="studyView = 'detail'"
        >
          答案解析图
        </button>
      </div>

      <div
        class="plate-wrap"
        v-if="studyView === 'question' && hasStudyTip"
      >
        <img
          :src="studyQuestionSrc"
          :alt="'学习图 ' + (studyIndex + 1)"
          class="plate-img zoomable"
          draggable="false"
          @error="retryImg"
          @click="$emit('zoom', studyQuestionSrc)"
        />
      </div>
      <div
        class="plate-wrap"
        v-else-if="studyView === 'original' && hasStudyOriginal"
      >
        <img
          :src="studyOriginalPath(studyItem)"
          :alt="'原图'"
          class="plate-img zoomable"
          draggable="false"
          @error="retryImg"
          @click="$emit('zoom', studyOriginalPath(studyItem))"
        />
      </div>
      <div
        class="plate-wrap detail-wrap"
        v-else-if="studyView === 'detail' && studyItem.details?.length"
      >
        <img
          v-for="d in studyItem.details"
          :key="d"
          :src="studyPath(d)"
          :alt="'答案解析图'"
          class="plate-img zoomable"
          draggable="false"
          @error="retryImg"
          @click="$emit('zoom', studyPath(d))"
        />
      </div>

      <div class="study-info">
        <div class="study-answer-row">
          <span class="study-label">答案</span>
          <span class="study-answer">{{ studyItem.answer }}</span>
        </div>
        <div class="study-tip">
          <span class="study-label">技巧</span>
          <p>{{ studyItem.tip || "一眼就能看出,无需背诵。" }}</p>
        </div>
      </div>

      <div class="study-nav">
        <button
          class="btn btn-ghost nav-btn"
          :disabled="studyIndex === 0"
          @click="prevStudy"
        >
          ‹ 上一张
        </button>
        <span class="study-progress"
          >{{ studyIndex + 1 }} / {{ studyList.length }}</span
        >
        <button
          class="btn btn-primary nav-btn"
          :disabled="studyIndex === studyList.length - 1"
          @click="nextStudy"
        >
          下一张 ›
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStudy } from "../../composables/useStudy.js";
import { studyPath, studyOriginalPath, retryImg } from "../../utils/assets.js";

defineEmits(["back", "zoom"]);

const {
  studyCat,
  studyIndex,
  studyView,
  studyList,
  studySubCat,
  studyItem,
  hasStudyOriginal,
  hasStudyTip,
  studyQuestionSrc,
  subCount,
  setSubCat,
  categoryCount,
  visibleCategories,
  visibleSubs,
  switchCategory,
  prevStudy,
  nextStudy,
} = useStudy();

// 视图栏仅在两个及以上视图时显示,只有一个视图无需切换
const showViewSwitch = computed(
  () =>
    (hasStudyTip.value ? 1 : 0) +
      (hasStudyOriginal.value ? 1 : 0) +
      (studyItem.value?.details?.length ? 1 : 0) >=
    2,
);
</script>

<style>
.quiz-main {
  width: 100%;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 22px;
  box-shadow: 0 18px 50px rgba(43, 76, 126, 0.12);
  padding: 28px 22px 32px;
  text-align: center;
  animation: slide-in 0.28s ease;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.study-screen {
  max-width: 740px;
  margin: 0 auto;
  width: 100%;
}

.study-header {
  width: 100%;
  margin-bottom: 18px;
}

.study-header .back-link {
  margin-bottom: 20px;
}

.study-tabs {
  display: flex;
  gap: 10px;
}

.study-tab {
  flex: 1;
  padding: 11px 8px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.85);
  color: #45556b;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.study-tab em {
  font-style: normal;
  font-size: 12px;
  color: #9aa8b8;
  margin-left: 4px;
}

.study-tab.active {
  border-color: #0d9488;
  background: linear-gradient(180deg, #ecfdf9 0%, #f4fffc 100%);
  color: #0d9488;
  box-shadow: 0 6px 16px rgba(13, 148, 136, 0.15);
}

.study-tab.active em {
  color: #0d9488;
}

.study-subtabs {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
}

.sub-tab {
  padding: 7px 16px;
  border-radius: 999px;
  border: 1.501px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.85);
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.sub-tab em {
  font-style: normal;
  font-size: 11px;
  color: #9aa8b8;
  margin-left: 2px;
}

.sub-tab.active {
  border-color: #0d9488;
  background: #0d9488;
  color: #fff;
}

.sub-tab.active em {
  color: rgba(255, 255, 255, 0.75);
}

.study-main {
  padding-bottom: 26px;
}

.study-info {
  margin: 22px auto 0;
  max-width: 500px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.study-answer-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.study-label {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: #0d9488;
  background: #e6f7f3;
  border-radius: 6px;
  padding: 3px 8px;
  letter-spacing: 1px;
}

.study-answer {
  font-size: 24px;
  font-weight: 800;
  color: #22314a;
}

.study-tip {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: #f4f7fb;
  border-left: 4px solid #0d9488;
  border-radius: 10px;
  padding: 13px 16px;
}

.study-tip p {
  font-size: 15px;
  line-height: 1.8;
  color: #45556b;
}

.study-nav {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.nav-btn {
  padding: 10px 22px;
  font-size: 15px;
}

.btn-ghost.nav-btn {
  margin-left: 0;
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: default;
  transform: none;
  box-shadow: none;
}

.study-progress {
  font-size: 14px;
  font-weight: 700;
  color: #7a8a99;
}

/* ---------- 手机端学习模式适配 ---------- */
@media (max-width: 480px) {
  /* 分类 tab 并排一行,数量随版本不同,自适应列数 */
  .study-tabs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    gap: 6px;
  }

  .study-tab {
    padding: 9px 2px;
    font-size: 13px;
    letter-spacing: 0;
    text-align: center;
    white-space: nowrap;
  }

  .study-tab em {
    font-size: 10.501px;
    margin-left: 1px;
  }

  .sub-tab {
    padding: 6px 12px;
    font-size: 12.501px;
  }

  .sub-tab em {
    font-size: 10.501px;
  }

  .view-switch {
    padding: 3.04px;
  }

  .vs-btn {
    flex-shrink: 0;
    white-space: nowrap;
    padding: 6px 11.04px;
    font-size: 12.48px;
  }

  .study-info {
    margin-top: 18px;
    gap: 10px;
  }

  .study-answer-row {
    gap: 10px;
  }

  .study-answer {
    font-size: 20px;
    word-break: break-all;
  }

  .study-label {
    font-size: 11px;
  }

  .study-tip {
    padding: 11px 13px;
    gap: 10px;
  }

  .study-tip p {
    font-size: 14px;
    line-height: 1.75;
  }

  .nav-btn {
    padding: 9px 16px;
    font-size: 14px;
  }
}

/* ---------- 题目/解析切换 ---------- */
.view-switch {
  display: inline-flex;
  gap: 4px;
  background: #eef2f7;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 16px;
}

.vs-btn {
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 700;
  color: #7a8a99;
  padding: 7px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.vs-btn.active {
  background: #fff;
  color: #0d9488;
  box-shadow: 0 2px 8px rgba(43, 76, 126, 0.12);
}

.detail-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.detail-wrap .plate-img {
  width: auto;
  max-width: 100%;
  margin: 0 auto;
}
</style>
