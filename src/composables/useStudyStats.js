import { ref, computed, watch } from "vue";
import { useStage } from "./useStage.js";

// 学习统计域(全局单例):学习次数 / 累计时长 / 连续天数,localStorage 持久化
// 计时规则:进入学习页开始计时,页面切后台暂停、回来继续;离开学习页自动结算
const KEY = "cv_study_stats_v1";

function loadStats() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    if (d && typeof d === "object") {
      return {
        count: d.count || 0,
        totalMs: d.totalMs || 0,
        streak: d.streak || 0,
        lastDate: d.lastDate || "",
        lastSessionMs: d.lastSessionMs || 0,
        durMark: d.durMark || 0, // 已播报过的累计时长里程碑
      };
    }
  } catch {
    /* 忽略脏数据 */
  }
  return {
    count: 0,
    totalMs: 0,
    streak: 0,
    lastDate: "",
    lastSessionMs: 0,
    durMark: 0,
  };
}

const stats = ref(loadStats());

function saveStats() {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats.value));
  } catch {
    /* 存储失败不影响使用 */
  }
}

// ---------- 会话计时 ----------
let sessionActive = false; // 本次学习会话进行中(进入学习页 ~ 离开)
let sessionStart = null; // 当前计时起点;null = 暂停中(页面隐藏)
let sessionMs = 0; // 本次会话已累计毫秒
const beat = ref(0); // 心跳:驱动 liveMs 每 5 秒刷新
let beatTimer = null;

const liveMs = computed(() => {
  beat.value; // 依赖心跳,每 5 秒重算一次
  return sessionMs + (sessionStart ? Date.now() - sessionStart : 0);
});

function flush() {
  if (sessionStart) {
    sessionMs += Date.now() - sessionStart;
    sessionStart = null;
  }
}

function dateStr(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 进入学习页:次数 +1、刷新连续天数、开始计时
export function beginStudySession() {
  if (sessionActive) return;
  sessionActive = true;
  sessionMs = 0;
  sessionStart = Date.now();
  stats.value.count += 1;
  const today = dateStr();
  if (stats.value.lastDate !== today) {
    const yest = dateStr(new Date(Date.now() - 86400000));
    stats.value.streak =
      stats.value.lastDate === yest ? stats.value.streak + 1 : 1;
    stats.value.lastDate = today;
  }
  saveStats();
  if (!beatTimer) beatTimer = setInterval(() => beat.value++, 5000);
}

// 离开学习页:本次时长结算进累计
function endStudySession() {
  if (!sessionActive) return;
  flush();
  stats.value.totalMs += sessionMs;
  stats.value.lastSessionMs = sessionMs;
  sessionMs = 0;
  sessionActive = false;
  saveStats();
  clearInterval(beatTimer);
  beatTimer = null;
}

// 页面切后台暂停计时 / 回来继续
function onVisChange() {
  if (!sessionActive) return;
  if (document.visibilityState === "hidden") flush();
  else sessionStart = Date.now();
}

// 直接关掉应用时结算落盘,避免丢时长
function onPageHide() {
  if (sessionActive) endStudySession();
}

// 离开学习页自动结算
const { stage } = useStage();
watch(stage, (to, from) => {
  if (from === "study" && to !== "study") endStudySession();
});

document.addEventListener("visibilitychange", onVisChange);
window.addEventListener("pagehide", onPageHide);

// 毫秒 → 人话时长:不到 1 分钟 / N 分钟 / N 小时 M 分钟
function formatDuration(ms) {
  if (!ms || ms < 60000) return "不到 1 分钟";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m} 分钟`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h} 小时 ${rm} 分钟` : `${h} 小时`;
}

export function useStudyStats() {
  return {
    stats,
    liveMs,
    beginStudySession,
    endStudySession,
    formatDuration,
    saveStats,
  };
}
