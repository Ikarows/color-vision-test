<template>
  <div class="screen study-screen">
    <!-- 返回条直接挂在 .screen 下:sticky 只能在父容器内吸附,包在矮的 study-header 里会失效 -->
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
        返回菜单
      </button>
      <h2 class="bar-title">技巧记图</h2>
    </div>
    <header class="study-header">
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
      <!-- 总结复习:特写合集画廊(挂 crop 的条目跨分类汇总,无 crop 数据的版本回落卡片视图) -->
      <div v-if="isReviewGallery" class="review-gallery">
        <section
          v-for="(g, gi) in reviewGroups"
          :key="g.key"
          class="rg-group"
          :style="{ '--g': gi }"
        >
          <h3 v-reveal class="rg-title">
            {{ g.name }}<em>{{ g.items.length }}</em>
          </h3>
          <div class="rg-grid">
            <figure
              v-for="(it, ii) in g.items"
              :key="it.image"
              v-reveal
              class="rg-card"
              :style="{ '--i': ii }"
              @click="$emit('zoom', studyPath(it.crop))"
            >
              <div class="rg-pic">
                <img
                  :src="studyPath(it.crop)"
                  :alt="it.answer + ' 特写'"
                  draggable="false"
                  @error="retryImg"
                />
              </div>
              <figcaption>
                <div class="rg-ans">{{ it.answer }}</div>
                <p class="rg-tip">{{ it.tip }}</p>
              </figcaption>
            </figure>
          </div>
        </section>
      </div>

      <template v-else>
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
          <button
            v-if="studyItem.crop"
            class="vs-btn"
            :class="{ active: studyView === 'crop' }"
            @click="studyView = 'crop'"
          >
            特写
          </button>
        </div>

        <div class="plate-wrap" v-if="studyView === 'question' && hasStudyTip">
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
          class="plate-wrap crop-wrap"
          v-else-if="studyView === 'crop' && studyItem.crop"
        >
          <img
            :src="studyPath(studyItem.crop)"
            :alt="'特写图'"
            class="plate-img zoomable"
            draggable="false"
            @error="retryImg"
            @click="$emit('zoom', studyPath(studyItem.crop))"
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
            <button
              v-if="studyItem.tipAudio"
              class="tip-play-btn"
              :class="{ playing: isTipPlaying }"
              :aria-label="isTipPlaying ? '停止技巧语音' : '播放技巧语音'"
              @click="togglePlay(studyItem)"
            >
              <svg v-if="!isTipPlaying" viewBox="0 0 20 20" width="15" height="15">
                <path d="M6.5 4.5l9 5.5-9 5.5z" fill="currentColor" />
              </svg>
              <svg v-else viewBox="0 0 20 20" width="15" height="15">
                <rect x="5" y="4.5" width="3.4" height="11" rx="1.2" fill="currentColor" />
                <rect x="11.6" y="4.5" width="3.4" height="11" rx="1.2" fill="currentColor" />
              </svg>
            </button>
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
      </template>
    </main>

    <!-- 播放小助手:可拖动悬浮球,点开设置记图语音自动播放与循环模式 -->
    <StudyFloatHelper />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStudy } from "../../composables/useStudy.js";
import { useTipAudio } from "../../composables/useTipAudio.js";
import { studyPath, studyOriginalPath, retryImg } from "../../utils/assets.js";
import StudyFloatHelper from "../StudyFloatHelper.vue";

// 滚动浮现:列表项进入视口时播放入场动画(总结复习画廊用),触发一次后停止观察
const vReveal = {
  mounted(el) {
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    el.__revealIO = io;
  },
  unmounted(el) {
    if (el.__revealIO) el.__revealIO.disconnect();
  },
};

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
  reviewGroups,
  visibleCategories,
  visibleSubs,
  switchCategory,
  prevStudy,
  nextStudy,
} = useStudy();

// 技巧语音点播:播当前卡的 tipAudio(暂停不推进;自动播放由悬浮小助手控制)
const { playingImage, togglePlay } = useTipAudio();
const isTipPlaying = computed(
  () => !!studyItem.value && playingImage.value === studyItem.value.image,
);

// 总结复习:有特写合集数据时渲染画廊;无 crop 数据的版本该分类不会出现在分类栏
const isReviewGallery = computed(
  () => studyCat.value === "review" && reviewGroups.value.length > 0,
);

// 视图栏仅在两个及以上视图时显示,只有一个视图无需切换
const showViewSwitch = computed(
  () =>
    (hasStudyTip.value ? 1 : 0) +
      (hasStudyOriginal.value ? 1 : 0) +
      (studyItem.value?.crop ? 1 : 0) +
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

/* 返回条居中标题:绝对定位保证不受左侧返回按钮宽度影响;align-self:center 使其随 flex 在内容盒内垂直居中(含安卓状态栏加高) */
/* 方案 A:深色雅致,纯粗体大字无装饰 */
.bar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  align-self: center;
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #22314a;
  pointer-events: none;
}

.study-header {
  width: 100%;
  margin-bottom: 18px;
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

/* 技巧语音播放按钮:靠技巧栏最右,播放中变实色带呼吸光圈 */
.tip-play-btn {
  flex-shrink: 0;
  align-self: center;
  margin-left: auto;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid #14b8a6;
  background: #e6f7f3;
  color: #14b8a6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.tip-play-btn.playing {
  background: #14b8a6;
  color: #fff;
  animation: tip-pulse 1.2s ease-out infinite;
}

@keyframes tip-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.35);
  }
  100% {
    box-shadow: 0 0 0 10px rgba(13, 148, 136, 0);
  }
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
/* 整块略窄于卡片宽度居中,按钮均摊填充,块体显大 */
.view-switch {
  display: flex;
  flex-wrap: wrap;
  width: 92%;
  max-width: 460px;
  margin: 0 auto 16px;
  gap: 4px;
  background: #eef2f7;
  border-radius: 10px;
  padding: 4px;
}

.vs-btn {
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 700;
  color: #7a8a99;
  padding: 8px 10px;
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

/* 特写图:外框与原图视图等高(原图统一 1259x963 比例),外框水平居中,内容等比居中 */
.crop-wrap {
  aspect-ratio: 1259 / 963;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.crop-wrap .plate-img {
  width: auto;
  max-width: 100%;
  max-height: 125px;
  margin: 0 auto;
}

/* ---------- 总结复习:特写合集画廊 ---------- */
.review-gallery {
  text-align: left;
}

.rg-group + .rg-group {
  margin-top: 22px;
}

.rg-title {
  font-size: 15px;
  font-weight: 800;
  color: #22314a;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 滚动浮现:未进入视口时先隐藏,进入后按组序/卡序错峰播放入场(v-reveal 加 is-in) */
.rg-title:not(.is-in),
.rg-card:not(.is-in) {
  opacity: 0;
  transform: translateY(12px);
}

.rg-title.is-in {
  animation: rg-in 0.32s ease-out backwards;
  animation-delay: calc(var(--g, 0) * 70ms);
}

.rg-title::before {
  content: "";
  width: 4px;
  height: 15px;
  border-radius: 2px;
  background: #0d9488;
}

.rg-title em {
  font-style: normal;
  font-size: 11px;
  font-weight: 700;
  color: #0d9488;
  background: #e6f5f3;
  border-radius: 999px;
  padding: 1px 9px;
}

.rg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 11px;
}

.rg-card {
  background: #fff;
  border: 1px solid #e7e9ee;
  border-radius: 13px;
  overflow: hidden;
  cursor: zoom-in;
  min-width: 0;
  transition:
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.rg-card.is-in {
  animation: rg-in 0.38s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  /* 组内卡序 × 35ms 错峰 */
  animation-delay: calc(var(--i, 0) * 35ms);
}

@keyframes rg-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rg-card:hover {
  box-shadow: 0 8px 22px rgba(43, 76, 126, 0.14);
  transform: translateY(-2px);
}

.rg-pic {
  background: #fbfbfc;
  border-bottom: 1px solid #eef0f4;
  padding: 8px;
  display: flex;
  justify-content: center;
}

.rg-pic img {
  max-width: 100%;
  max-height: 125px;
  object-fit: contain;
  border-radius: 6px;
  display: block;
}

.rg-card figcaption {
  padding: 9px 11px 11px;
}

.rg-ans {
  font-size: 17px;
  font-weight: 800;
  color: #22314a;
  letter-spacing: 0.5px;
  word-break: break-all;
}

.rg-tip {
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ---------- 手机端画廊适配:固定两列 ---------- */
@media (max-width: 480px) {
  /* 视图切换:须置于基础 .vs-btn 规则之后,否则同优先级被后者覆盖不生效 */
  .view-switch {
    padding: 3px;
    gap: 3px;
  }

  .vs-btn {
    padding: 9px 6px;
    font-size: 13px;
  }

  .crop-wrap .plate-img {
    max-height: 105px;
  }

  .rg-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .rg-pic img {
    max-height: 105px;
  }

  .rg-ans {
    font-size: 16px;
  }

  .rg-tip {
    font-size: 11.5px;
  }

  .rg-group + .rg-group {
    margin-top: 18px;
  }
}
</style>
