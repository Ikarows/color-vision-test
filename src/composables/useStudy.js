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

// 简单一眼出的图无需对照原图,不提供原图视图
const hasStudyOriginal = computed(
  () =>
    studyItem.value?.category !== "easy" &&
    !!studyOriginalPath(studyItem.value, edition.value.id),
);

// 简单一眼出分类直接展示 plates 原图(与测试图一致),其余分类展示技巧题目图
const studyQuestionSrc = computed(() => {
  const item = studyItem.value;
  if (item?.category === "easy" && studyOriginalPath(item, edition.value.id))
    return studyOriginalPath(item, edition.value.id);
  return studyPath(item.image, edition.value.id);
});

// 进入新卡片时:有技巧图默认选中技巧图,并预加载原图与解析图
watch(studyItem, (item) => {
  if (!item) return;
  studyView.value = "question";
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

function switchCategory(key) {
  studyCat.value = key;
  studySubCat.value = "all";
  studyIndex.value = 0;
  shuffleStudy();
}

function enterStudy() {
  studyCat.value = "easy";
  studyIndex.value = 0;
  shuffleStudy();
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
    hasStudyOriginal,
    studyQuestionSrc,
    subCount,
    setSubCat,
    categoryCount,
    switchCategory,
    enterStudy,
    prevStudy,
    nextStudy,
  };
}
