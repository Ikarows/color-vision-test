<template>
  <div class="screen hs-screen">
    <header class="back-bar hs-back">
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
    </header>

    <!-- 筛选工具条:独立第二吸顶层,跟在返回条正下方一起悬浮 -->
    <div class="hs-toolbar">
      <div class="hs-selects">
        <select
          class="hs-select"
          :value="province"
          @change="setProvince($event.target.value)"
        >
          <option value="">全部省份</option>
          <option v-for="p in provinceOptions" :key="p" :value="p">
            {{ p }}
          </option>
        </select>
        <select
          class="hs-select"
          :value="city"
          :disabled="!province"
          @change="setCity($event.target.value)"
        >
          <option value="">全部城市</option>
          <option v-for="c in cityOptions" :key="c" :value="c">
            {{ c }}
          </option>
        </select>
        <select
          class="hs-select"
          :value="district"
          :disabled="!city"
          @change="district = $event.target.value"
        >
          <option value="">全部区县</option>
          <option v-for="d in districtOptions" :key="d" :value="d">
            {{ d }}
          </option>
        </select>
      </div>

      <div class="hs-chips">
        <button
          class="hs-chip"
          :class="{ active: scene === 'all' }"
          @click="setScene('all')"
        >
          全部 <em>{{ sceneCounts.all }}</em>
        </button>
        <button
          v-for="s in SCENES"
          :key="s.key"
          class="hs-chip"
          :class="{ active: scene === s.key }"
          @click="setScene(s.key)"
        >
          {{ s.name }} <em>{{ sceneCounts[s.key] }}</em>
        </button>
      </div>

      <div class="hs-search">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          v-model="keyword"
          class="hs-input"
          type="text"
          placeholder="搜索医院 / 机构名称"
        />
        <button
          v-if="keyword"
          class="hs-clear"
          aria-label="清空搜索"
          @click="keyword = ''"
        >
          <svg viewBox="0 0 20 20" width="12" height="12">
            <path
              d="M5 5l10 10M15 5L5 15"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 数据状态 -->
    <div v-if="loading" class="hs-state">
      <div class="hs-boot">
        <div class="hs-boot-glow"></div>
        <div class="hs-boot-ring"></div>
      </div>
      <span>正在加载体检点数据…</span>
    </div>

    <div v-else-if="loadError" class="hs-state">
      <span>数据加载失败：{{ loadError }}</span>
      <button class="hs-retry" @click="retry">重新加载</button>
    </div>

    <!-- 结果列表 -->
    <div v-else class="hs-list">
      <p v-if="!filtered.length" class="hs-empty">
        没有符合条件的体检点，试试放宽筛选条件
      </p>
      <article
        v-for="(e, i) in shownList"
        :key="e.hospital_name + '-' + i"
        class="hs-card"
      >
        <div class="hs-top">
          <h3 class="hs-name">{{ e.hospital_name }}</h3>
          <span class="hs-tag">{{ e.scene_label || "体检点" }}</span>
        </div>
        <p class="hs-loc">
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {{ regionText(e) }}
        </p>
        <!-- <p v-if="e.location_detail" class="hs-detail">{{ e.location_detail }}</p> -->
        <div class="hs-meta">
          <span v-if="e.version_display" class="hs-ver">{{
            e.version_display
          }}</span>
          <span v-if="shownDate(e)" class="hs-date"
            >更新 {{ shownDate(e) }}</span
          >
        </div>
      </article>

      <!-- 滚动到底触发的加载哨兵:还有未显示数据时才出现 -->
      <div v-if="remainingCount > 0" ref="sentinelRef" class="hs-sentinel">
        <div class="hs-boot">
          <div class="hs-boot-glow"></div>
          <div class="hs-boot-ring"></div>
        </div>
      </div>
    </div>

    <p
      v-if="!loading && !loadError && remainingCount === 0"
      class="hs-disclaimer"
    >
      数据仅供参考，检查项目与流程以当地体检机构实际为准
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useHospitalSearch } from "../../composables/useHospitalSearch.js";

defineEmits(["back"]);

const {
  SCENES,
  loading,
  loadError,
  ensureLoaded,
  retry,
  province,
  city,
  district,
  scene,
  keyword,
  provinceOptions,
  cityOptions,
  districtOptions,
  sceneCounts,
  filtered,
  setProvince,
  setCity,
  setScene,
} = useHospitalSearch();

// 滚动到底自动加载:列表尾部哨兵进入视口(提前 200px)即追加一页,间隔 0.5s 让加载环可感知
const PAGE_SIZE = 10;
const LOAD_DELAY = 500;
const shownCount = ref(PAGE_SIZE);
const sentinelRef = ref(null);
const loadingMore = ref(false);
let observer = null;

const shownList = computed(() => filtered.value.slice(0, shownCount.value));
const remainingCount = computed(
  () => filtered.value.length - shownList.value.length,
);

function loadMore() {
  if (loadingMore.value || remainingCount.value <= 0) return;
  loadingMore.value = true;
  setTimeout(() => {
    shownCount.value += PAGE_SIZE;
    loadingMore.value = false;
  }, LOAD_DELAY);
}

watch([province, city, district, scene, keyword], () => {
  shownCount.value = PAGE_SIZE;
});

// 哨兵随列表渲染/分页增减反复挂卸,需重新挂观察器
watch([sentinelRef, remainingCount], () => {
  if (!observer) return;
  observer.disconnect();
  if (sentinelRef.value && remainingCount.value > 0)
    observer.observe(sentinelRef.value);
});

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((en) => en.isIntersecting) && remainingCount.value > 0)
        loadMore();
    },
    { rootMargin: "200px" },
  );
  if (sentinelRef.value && remainingCount.value > 0)
    observer.observe(sentinelRef.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});

function regionText(e) {
  return [e.province, e.city, e.district].filter(Boolean).join(" · ");
}

function shownDate(e) {
  return (e.updated_at || e.test_date || "").slice(0, 10);
}

// 进入页面时懒加载数据(已加载过则直接用缓存)
onMounted(() => {
  ensureLoaded();
});
</script>

<style lang="scss" scoped>
.hs-screen {
  max-width: 740px;
  margin: 0 auto; /* .app 纵向 flex 下 max-width 会卡左,自动外边距水平居中 */
}

.hs-back {
  //margin-bottom: 16px;
}

/* 筛选工具条:独立第二吸顶层,吸附在返回条正下方(top=返回条实测高度,由 App.vue 写入 --backbar-h) */
.hs-toolbar {
  position: sticky;
  top: var(--backbar-h, 65px);
  z-index: 19; /* 低于返回条,边缘重叠时返回条在上 */
  width: calc(100% + 2rem); /* 负 margin 全宽,与返回条吸顶层对齐 */
  max-width: none;
  margin: 0 -1rem; /* 底部间距并入 padding:margin 在背景外会留透明缝,内容从缝里穿出 */
  box-sizing: border-box;
  padding-left: max(1rem, calc(50% - 20.625rem));
  padding-right: max(1rem, calc(50% - 20.625rem));
  /* 18px 间距全部放进 padding:margin 在背景外会留一条透明缝,滚动时列表内容从缝里穿出来 */
  padding-bottom: 18px;
  background: transparent;
  transition: background 0.1s ease;
}

.hs-toolbar.scrolled {
  /* 与 .back-bar.scrolled 同款;attachment fixed 让渐变按视口渲染、与页面背景逐像素同源 */
  background:
    radial-gradient(1200px 500px at 80% -10%, #dbeafe 0%, transparent 55%),
    radial-gradient(900px 420px at -10% 30%, #e0f2f1 0%, transparent 50%),
    linear-gradient(180deg, #f6f9fd 0%, #eef2f7 100%);
  background-attachment: fixed, fixed, fixed;
  /* 淡入要快:0.25s 的渐显会让卡片从半透明背景里透出来,看起来像内容穿过 */
  transition: background 0.1s ease;
}

/* ---------- 筛选工具条 ---------- */
.hs-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hs-selects {
  display: grid;
  /* minmax(0,1fr):允许列宽压到内容以下,省市 option 文字过长时不再把整页撑出横向溢出 */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.hs-select {
  appearance: none;
  -webkit-appearance: none;
  min-width: 0; /* 配合 minmax(0,1fr),长 option 文字在窄屏下裁剪而非撑破布局 */
  text-overflow: ellipsis;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.92);
  color: #33445c;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  padding: 10px 26px 10px 12px;
  border-radius: 11px;
  cursor: pointer;
  outline: none;
  box-shadow: 0 4px 14px rgba(43, 76, 126, 0.08);
  transition: border-color 0.15s ease;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='12' height='12'%3E%3Cpath d='M5.5 8l4.5 4.5L14.5 8' fill='none' stroke='%236b7f99' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.hs-select:hover:not(:disabled),
.hs-select:focus {
  border-color: #b6ccf5;
}

.hs-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hs-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hs-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.85);
  color: #45556b;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  padding: 7px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hs-chip em {
  font-style: normal;
  font-size: 12px;
  color: #8a99ad;
}

.hs-chip:hover {
  border-color: #b6ccf5;
  color: #2f6fed;
}

.hs-chip.active {
  background: linear-gradient(135deg, #2f6fed, #63b3ff);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 6px 16px rgba(47, 111, 237, 0.32);
}

.hs-chip.active em {
  color: rgba(255, 255, 255, 0.85);
}

.hs-search {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  padding: 0 12px;
  box-shadow: 0 4px 14px rgba(43, 76, 126, 0.08);
  color: #8a99ad;
}

.hs-search:focus-within {
  border-color: #b6ccf5;
}

.hs-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: inherit;
  color: #22314a;
  padding: 11px 0;
  outline: none;
}

.hs-input::placeholder {
  color: #9aa8b8;
}

.hs-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: #e6ebf3;
  color: #5d6f88;
  cursor: pointer;
  flex-shrink: 0;
}

.hs-clear:hover {
  background: #d8e0ec;
}

/* ---------- 数据状态 ---------- */
.hs-state {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 56px 0;
  color: #7a8a99;
  font-size: 14px;
}

.hs-boot {
  position: relative;
  width: 38px;
  height: 38px;
}

.hs-boot-glow {
  position: absolute;
  inset: -14px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(94, 150, 255, 0.28) 0%,
    transparent 70%
  );
  animation: quiz-breath 1.6s ease-in-out infinite;
}

.hs-boot-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(47, 111, 237, 0.16);
  border-top-color: #2f6fed;
  animation: quiz-spin 1s linear infinite;
}

.hs-retry {
  border: none;
  background: linear-gradient(135deg, #2f6fed, #63b3ff);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  padding: 9px 26px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(47, 111, 237, 0.32);
}

.hs-retry:hover {
  filter: brightness(1.06);
}

/* ---------- 结果列表 ---------- */
.hs-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hs-empty {
  text-align: center;
  color: #7a8a99;
  font-size: 14px;
  padding: 46px 0;
}

.hs-card {
  text-align: left;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 24px rgba(43, 76, 126, 0.08);
  padding: 15px 18px;
}

.hs-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.hs-name {
  margin: 0;
  font-size: 15.5px;
  font-weight: 800;
  color: #22314a;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.hs-tag {
  flex-shrink: 0;
  margin-top: 1px;
  font-size: 12px;
  font-weight: 600;
  color: #2f6fed;
  background: #eef4ff;
  border: 1px solid #d5e3fb;
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
}

.hs-loc {
  margin: 6px 0 0;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #66788f;
}

.hs-loc svg {
  flex-shrink: 0;
  color: #94a5bb;
}

.hs-detail {
  margin: 5px 0 0;
  font-size: 13px;
  color: #8a99ad;
  overflow-wrap: anywhere;
}

.hs-meta {
  margin-top: 9px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.hs-ver {
  font-size: 12px;
  font-weight: 600;
  color: #0d7a68;
  background: #e8f7f3;
  border: 1px solid #c9ece4;
  padding: 2px 9px;
  border-radius: 999px;
}

.hs-date {
  font-size: 12px;
  color: #9aa8b8;
}

/* 滚动加载哨兵:底部小加载环 */
.hs-sentinel {
  display: flex;
  justify-content: center;
  padding: 8px 0 2px;
}

/* 哨兵里的加载环比页面级首屏加载小一号 */
.hs-sentinel .hs-boot {
  width: 20px;
  height: 20px;
}

.hs-sentinel .hs-boot-glow {
  inset: -7px;
}

.hs-sentinel .hs-boot-ring {
  border-width: 2px;
}

.hs-disclaimer {
  margin: 18px 0 4px;
  font-size: 12px;
  color: #9aa8b8;
  text-align: center;
}
</style>
