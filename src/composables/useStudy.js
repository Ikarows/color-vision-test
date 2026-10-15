import { ref, computed, watch, nextTick } from "vue";
import { shuffle } from "../data/questions.js";
import { getEdition, DEFAULT_EDITION_ID } from "../data/editions/index.js";
import { STUDY_CATEGORIES } from "../data/study.js";
import { useStage } from "./useStage.js";
import { useEdition } from "./useEdition.js";
import { studyPath, studyOriginalPath } from "../utils/assets.js";

// 学习模式域(全局单例):分类切换 / 卡片列表 / 视图切换 / 图片预载
const { stage } = useStage();
const { edition } = useEdition();

const studyCat = ref("easy");
const studyIndex = ref(0);
const studyView = ref("question"); // question | original | detail
const studyList = ref([]); // 每次进入/切换分类时随机排序
const studySubCat = ref("all"); // 特征对应子分类: all | num | animal | other
const FEATURE_SUBS = [
  { key: "all", name: "全部" },
  { key: "num", name: "数字" },
  { key: "animal", name: "动物" },
  { key: "other", name: "其它" },
];

// 当前版本的学习条目(切换版本即整体切换)
const studyItems = computed(() => edition.value.studyItems);

function shuffleStudy() {
  let list = studyItems.value.filter((i) => i.category === studyCat.value);
  if (studyCat.value === "feature" && studySubCat.value !== "all") {
    list = list.filter((i) => i.sub === studySubCat.value);
  }
  studyList.value = shuffle(list);
}
const studyItem = computed(() => studyList.value[studyIndex.value]);

// 学习条目索引:按版本缓存 "imageN" → 学习条目(供错题图放大时匹配任意版本的错题)
const studyIndexCache = new Map(); // editionId -> { imageN: item }
function studyIndexFor(editionId) {
  const id = editionId || DEFAULT_EDITION_ID;
  if (!studyIndexCache.has(id)) {
    const map = {};
    (getEdition(id)?.studyItems ?? []).forEach((it) => {
      const m = it.image.match(/^q_(image\d+)\.png$/);
      if (m) map[m[1]] = it;
    });
    studyIndexCache.set(id, map);
  }
  return studyIndexCache.get(id);
}

// 按检查图编号 + 版本匹配学习条目;未收录返回 null
function studyItemByImage(imageNo, editionId) {
  return studyIndexFor(editionId)[imageNo] ?? null;
}

// 是否有真技巧图:noTipImg 条目(如 easy 类)的 q_*.png 只是原图复制品,不算技巧图。
// 学习页与 zoom 层共用,保持"没有技巧图就隐藏技巧图栏、默认展示原图"的一致规则
function hasTipImg(item) {
  return !!item && !!item.image && !item.noTipImg;
}

// 原图始终提供给可推导出测试图的条目(不再对 easy 特判隐藏)
const hasStudyOriginal = computed(() => {
  const item = studyItem.value;
  return !!item && !!studyOriginalPath(item, edition.value.id);
});
// 当前条目是否有技巧图栏
const hasStudyTip = computed(() => hasTipImg(studyItem.value));

// 技巧图视图(仅对有真技巧图的条目渲染)
const studyQuestionSrc = computed(() => {
  const item = studyItem.value;
  if (!hasTipImg(item)) return "";
  return studyPath(item.image, edition.value.id);
});

// 卡片默认视图:有技巧图看技巧图,没有默认原图,再没有落解析图
function defaultViewFor(item) {
  return hasTipImg(item)
    ? "question"
    : studyOriginalPath(item, edition.value.id)
      ? "original"
      : item.details?.length
        ? "detail"
        : "question";
}

// 进入新卡片时:按默认视图选中,并预加载原图与解析图
watch(studyItem, (item) => {
  if (!item) return;
  studyView.value = defaultViewFor(item);
  if (hasTipImg(item)) new Image().src = studyPath(item.image, edition.value.id);
  const orig = studyOriginalPath(item, edition.value.id);
  if (orig) new Image().src = orig;
  item.details?.forEach((d) => {
    new Image().src = studyPath(d, edition.value.id);
  });
});

// 进入某分类时,延迟在后台预加载该分类全部图片,彻底消除翻卡等待
watch(studyCat, (cat) => {
  if (stage.value !== "study") return;
  setTimeout(() => {
    studyItems.value.filter((i) => i.category === cat).forEach((item) => {
      if (hasTipImg(item))
        new Image().src = studyPath(item.image, edition.value.id);
      const orig = studyOriginalPath(item, edition.value.id);
      if (orig) new Image().src = orig;
      item.details?.forEach((d) => {
        new Image().src = studyPath(d, edition.value.id);
      });
    });
  }, 400);
});

// 进入学习页或切换子视图后回到顶部
watch([stage, studyView], () => {
  nextTick(() => window.scrollTo(0, 0));
});

function subCount(sub) {
  return studyItems.value.filter(
    (i) => i.category === "feature" && (sub === "all" || i.sub === sub),
  ).length;
}

function setSubCat(sub) {
  studySubCat.value = sub;
  studyIndex.value = 0;
  shuffleStudy();
}

function categoryCount(key) {
  return studyItems.value.filter((i) => i.category === key).length;
}

// 分类/子分类按当前版本数据显隐:没有条目的分类不显示
const visibleCategories = computed(() =>
  STUDY_CATEGORIES.filter((c) => categoryCount(c.key) > 0),
);
const visibleSubs = computed(() =>
  FEATURE_SUBS.filter((s) => subCount(s.key) > 0),
);

function switchCategory(key) {
  studyCat.value = key;
  studySubCat.value = "all";
  studyIndex.value = 0;
  shuffleStudy();
}

function enterStudy() {
  // 默认进第一个有数据的分类(各版本分类数可能不同)
  studyCat.value = visibleCategories.value[0]?.key || "easy";
  studyIndex.value = 0;
  shuffleStudy();
  // 重进学习页时条目对象可能与上次相同(watch 不触发),显式归位默认视图
  studyView.value = defaultViewFor(studyItem.value);
  stage.value = "study";
}

function prevStudy() {
  if (studyIndex.value > 0) {
    studyIndex.value--;
  }
}

function nextStudy() {
  if (studyIndex.value < studyList.value.length - 1) {
    studyIndex.value++;
  }
}

export function useStudy() {
  return {
    studyCat,
    studyIndex,
    studyView,
    studyList,
    studySubCat,
    FEATURE_SUBS,
    STUDY_CATEGORIES,
    studyItem,
    studyItemByImage,
    hasTipImg,
    hasStudyOriginal,
    hasStudyTip,
    studyQuestionSrc,
    subCount,
    setSubCat,
    categoryCount,
    visibleCategories,
    visibleSubs,
    switchCategory,
    enterStudy,
    prevStudy,
    nextStudy,
  };
}
