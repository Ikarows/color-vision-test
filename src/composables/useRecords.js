import { ref, computed } from "vue";
import { getEdition, DEFAULT_EDITION_ID } from "../data/editions/index.js";
import { loadStats, resetStats } from "../data/stats.js";
import { MODES } from "./useQuizConfig.js";
import { useStage } from "./useStage.js";

// 测试记录域(全局单例):历史成绩 / 统计速览 / 常错图聚合 / 记录详情
const statsData = ref(loadStats());
const resetArmed = ref(false);

const statsSummary = computed(() => {
  const rs = statsData.value.records;
  const totalQ = rs.reduce((s, r) => s + r.total, 0);
  const correctQ = rs.reduce((s, r) => s + r.correct, 0);
  return {
    count: rs.length,
    totalQ,
    accuracy: totalQ ? Math.round((correctQ / totalQ) * 100) : 0,
    best: rs.length
      ? Math.max(...rs.map((r) => Math.round((r.correct / r.total) * 100)))
      : 0,
  };
});

const statsRecords = computed(() =>
  [...statsData.value.records].reverse().slice(0, 30),
);

// 最近记录分页:每页 10 条
const HISTORY_PAGE_SIZE = 10;
const historyPage = ref(1);
const historyTotalPages = computed(() =>
  Math.max(1, Math.ceil(statsRecords.value.length / HISTORY_PAGE_SIZE)),
);
const pagedRecords = computed(() =>
  statsRecords.value.slice(
    (historyPage.value - 1) * HISTORY_PAGE_SIZE,
    historyPage.value * HISTORY_PAGE_SIZE,
  ),
);

function setPage(p) {
  historyPage.value = Math.min(Math.max(1, p), historyTotalPages.value);
}

// 重新读取本地存储(答题完成后、进入统计页前调用)
function refreshStats() {
  statsData.value = loadStats();
}

function openStats() {
  resetArmed.value = false;
  refreshStats();
  historyPage.value = 1;
  stageGo("stats");
}

const wrongBookBack = ref("stats");
// from: 常错图入口来源页(返回时回到该页),统计页入口传 "stats",首页/设置页传 "start"
function openWrongBook(from = "start") {
  resetArmed.value = false;
  refreshStats();
  wrongBookBack.value = from;
  stageGo("wrongBook");
}

function confirmReset() {
  if (!resetArmed.value) {
    resetArmed.value = true;
    setTimeout(() => (resetArmed.value = false), 3000);
    return;
  }
  resetStats();
  statsData.value = { records: [] };
  resetArmed.value = false;
}

function modeName(key) {
  if (key === "wrongDrill") return "错图针对测试";
  if (key === "driving") return "驾照自助机模拟";
  return MODES.find((m) => m.key === key)?.name ?? key;
}

function formatTime(ts) {
  return new Date(ts).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 记录评分(旧记录无 score 字段时按正确率折算),100 分上限
function recordScore(r) {
  return typeof r.score === "number"
    ? r.score
    : Math.round((r.correct / r.total) * 100);
}

function scoreClass(r) {
  const p = recordScore(r);
  if (p >= 95) return "good";
  if (p >= 80) return "mid";
  return "bad";
}

// 自助机模拟记录的通过判定:新记录存了 verdict 字段,旧记录按错题数兜底复算(4 题容错 2)
function drivingVerdict(r) {
  if (r.verdict) return r.verdict;
  return r.wrong && r.wrong.length > 2 ? "fail" : "pass";
}

// ---------- 历史记录详情 / 常错图 ----------
const activeRecord = ref(null);
const activeWrong = computed(() => activeRecord.value?.wrong ?? []);

function openRecord(r) {
  if (!r.wrong?.length) return; // 无错图记录不可点
  activeRecord.value = r;
  stageGo("recordDetail");
}

// 跨全部历史记录聚合每张图的答错次数,按次数降序
// 聚合 key 为 "版本id:图名",不同版本同名图互不干扰;条目携带 editionId 供图片路径/答案/针对测试解析
// 同一张图累计连对 2 次(期间没再答错)即移出常错图;之后再答错则重新计算
const WRONG_CLEAR_STREAK = 2;
const wrongPlateStats = computed(() => {
  const map = new Map(); // "ed:image" -> { image, editionId, count, lastTs, streak }
  // records 按时间正序回放,保证"连对"判断正确
  statsData.value.records.forEach((r) => {
    const recEd = r.editionId || DEFAULT_EDITION_ID;
    (r.wrong ?? []).forEach((w) => {
      const ed = w.editionId || recEd;
      const key = ed + ":" + w.image;
      const cur = map.get(key) ?? {
        image: w.image,
        editionId: ed,
        count: 0,
        lastTs: 0,
        streak: 0,
      };
      cur.count++;
      cur.lastTs = r.ts;
      cur.streak = 0;
      map.set(key, cur);
    });
    (r.correctPlates ?? []).forEach((c) => {
      // 旧记录 correctPlates 为纯图名字符串,按记录版本归一
      const ed = (typeof c === "string" ? recEd : c.editionId) || DEFAULT_EDITION_ID;
      const img = typeof c === "string" ? c : c.image;
      const cur = map.get(ed + ":" + img);
      if (cur) cur.streak++;
    });
  });
  return [...map.values()]
    .filter((w) => w.streak < WRONG_CLEAR_STREAK)
    .sort((a, b) => b.count - a.count || b.lastTs - a.lastTs);
});

function answerOf(image, editionId) {
  return (
    getEdition(editionId || DEFAULT_EDITION_ID)?.questions.find(
      (q) => q.image === image,
    )?.answer ?? ""
  );
}

const { go: stageGo } = useStage();

export function useRecords() {
  return {
    statsData,
    resetArmed,
    statsSummary,
    statsRecords,
    historyPage,
    historyTotalPages,
    pagedRecords,
    setPage,
    refreshStats,
    openStats,
    wrongBookBack,
    openWrongBook,
    confirmReset,
    modeName,
    formatTime,
    recordScore,
    scoreClass,
    drivingVerdict,
    activeRecord,
    activeWrong,
    openRecord,
    wrongPlateStats,
    answerOf,
  };
}
