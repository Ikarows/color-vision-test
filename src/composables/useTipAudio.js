import { ref, computed, watch } from "vue";
import { useStudy } from "./useStudy.js";
import { useEdition } from "./useEdition.js";
import { useStage } from "./useStage.js";
import { STUDY_CATEGORIES } from "../data/study.js";
import { studyPath } from "../utils/assets.js";

// 技巧语音播放引擎(全局单例):手动点播 + 记图自动播放(悬浮小助手控制)
// 自动播放:当前卡语音播完自动切下一张继续播;循环模式:单个 / 单个分类 / 所有分类
const { studyCat, studyIndex, studyList, studyItem, switchCategory, reviewGroups } =
  useStudy();
const { edition } = useEdition();
const { stage } = useStage();

// ---------- 设置(持久化) ----------
const AUTO_KEY = "cv_study_autoplay";
const LOOP_KEY = "cv_study_loop";
const DELAY_KEY = "cv_study_nextdelay";
const LOOP_MODES = ["single", "category", "all"];
// single=单个循环 category=单个分类循环 all=所有分类循环
const autoplay = ref(localStorage.getItem(AUTO_KEY) === "1");
const savedLoop = localStorage.getItem(LOOP_KEY);
const loopMode = ref(LOOP_MODES.includes(savedLoop) ? savedLoop : "category");
// 播完当前卡到切下一张的间隔(秒),可选档位
export const NEXT_DELAYS = [0.5, 1, 2, 3];
const savedDelay = parseFloat(localStorage.getItem(DELAY_KEY));
const nextDelay = ref(NEXT_DELAYS.includes(savedDelay) ? savedDelay : 1);

// ---------- 播放状态 ----------
const playingImage = ref(""); // 正在播放的条目 image 键("" = 未播)
let audio = null;
let currentPlayItem = null; // 当前正在播的条目(ended 回调里用)
let advanceTimer = null;
let playSeq = 0; // 播放序号:异步拉取期间被新播放/停止取代时作废旧回调

// 语音经 fetch 转 Blob 播放:不直接挂 mp3 地址,绕开夸克等浏览器对媒体 URL 的下载劫持
const blobCache = new Map(); // src → Promise<objectURL>
function loadBlobUrl(src) {
  if (!blobCache.has(src)) {
    const p = fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.arrayBuffer();
      })
      .then((buf) => URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" })));
    blobCache.set(src, p);
    p.catch(() => blobCache.delete(src)); // 失败不缓存,下次可重试
  }
  return blobCache.get(src);
}

function setAutoplay(v) {
  autoplay.value = v;
  localStorage.setItem(AUTO_KEY, v ? "1" : "0");
  if (v) {
    // 开启即从当前卡开始播(总结复习画廊无卡片时不播)
    if (!isReviewActive.value && stage.value === "study" && studyItem.value) {
      playItem(studyItem.value);
    }
  } else {
    stopPlayback();
  }
}

function setLoopMode(m) {
  if (!LOOP_MODES.includes(m)) return;
  loopMode.value = m;
  localStorage.setItem(LOOP_KEY, m);
}

function setNextDelay(v) {
  if (!NEXT_DELAYS.includes(v)) return;
  nextDelay.value = v;
  localStorage.setItem(DELAY_KEY, String(v));
}

function nextDelayMs() {
  return nextDelay.value * 1000;
}

// ---------- 音频元素(懒创建,复用同一个) ----------
function audioEl() {
  if (!audio) {
    audio = new Audio();
    audio.preload = "auto";
    audio.addEventListener("ended", onAudioEnded);
    audio.addEventListener("error", onAudioError);
  }
  return audio;
}

function tipAudioSrc(item) {
  if (!item?.tipAudio) return "";
  // 生产构建时 mp3 已被构建脚本改名为 .aud（资源保护），开发环境仍用原名
  const file = import.meta.env.PROD ? item.tipAudio.replace(/\.mp3$/, ".aud") : item.tipAudio;
  return studyPath(file, edition.value.id);
}

// 播放指定条目的技巧语音;无语音条目在自动播放下直接跳下一张
function playItem(item) {
  if (!item) return;
  stopAdvanceTimer();
  currentPlayItem = item;
  const src = tipAudioSrc(item);
  if (!src) {
    playingImage.value = "";
    // 无语音条目:自动播放下不作停留,直接跳下一张有语音的卡
    if (autoplay.value) scheduleAdvance(350);
    return;
  }
  const seq = ++playSeq;
  audio?.pause();
  playingImage.value = item.image;
  loadBlobUrl(src)
    .then((url) => {
      if (seq !== playSeq) return; // 拉取期间已被新播放/停止取代
      const el = audioEl();
      el.src = url;
      el.play().catch(() => {
        // 播放被浏览器策略拦截或加载失败:按播完处理,避免自动播放卡死
        if (seq === playSeq && playingImage.value === item.image) {
          playingImage.value = "";
          if (autoplay.value) scheduleAdvance(650);
        }
      });
      prefetchNextAudio(item);
    })
    .catch(() => {
      // fetch 失败:按加载失败处理
      if (seq === playSeq) {
        playingImage.value = "";
        if (autoplay.value) scheduleAdvance(650);
      }
    });
}

// 自动连播时预取下一条语音,切卡即播无感等待
function prefetchNextAudio(item) {
  if (!autoplay.value) return;
  let next;
  if (loopMode.value === "single") {
    next = item;
  } else if (loopMode.value === "all") {
    next = nextInSeq(audioSeqAll(), item);
  } else {
    next = nextInSeq(studyList.value.filter((it) => it.tipAudio), item);
  }
  const src = tipAudioSrc(next);
  if (src) loadBlobUrl(src).catch(() => {});
}

function stopPlayback() {
  stopAdvanceTimer();
  playSeq++; // 作废还在路上的异步拉取回调
  if (audio) audio.pause();
  playingImage.value = "";
  currentPlayItem = null;
}

// 手动点播/暂停(技巧栏播放按钮):暂停不推进,自动播放开着时切卡后会续播
function togglePlay(item) {
  if (!item) return;
  if (playingImage.value === item.image) {
    stopPlayback();
    return;
  }
  playItem(item);
}

function onAudioEnded() {
  playingImage.value = "";
  // 手动播放:播完即止;自动播放:按设置的间隔切下一张
  if (!autoplay.value) return;
  scheduleAdvance(nextDelayMs());
}

function onAudioError() {
  playingImage.value = "";
  // 语音缺失/加载失败:自动播放时跳过继续,避免卡死
  if (autoplay.value) scheduleAdvance(650);
}

function stopAdvanceTimer() {
  if (advanceTimer) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}

function scheduleAdvance(delay) {
  stopAdvanceTimer();
  advanceTimer = setTimeout(() => {
    advanceTimer = null;
    advanceNext();
  }, delay);
}

// 播完推进:按循环模式找下一张"有语音"的卡(无语音卡直接跳过;当前分类全无语音则整类切走)
function advanceNext() {
  if (!autoplay.value || stage.value !== "study" || isReviewActive.value) return;
  const item = studyItem.value;
  // 单个循环:当前卡有语音时按设置的间隔重播;无语音按普通推进跳走
  if (loopMode.value === "single" && item?.tipAudio) {
    stopAdvanceTimer();
    advanceTimer = setTimeout(() => {
      advanceTimer = null;
      if (autoplay.value) playItem(studyItem.value);
    }, nextDelayMs());
    return;
  }
  if (loopMode.value === "all") {
    locateInStudy(nextInSeq(audioSeqAll(), item));
    return;
  }
  // 单个分类循环:只在该分类有语音的卡里循环;整类无语音切到下一个有语音的分类
  const seq = studyList.value.filter((it) => it.tipAudio);
  if (!seq.length) {
    jumpNextAudioCategory();
    return;
  }
  locateInStudy(nextInSeq(seq, item));
}

// 有语音卡片的顺序序列(当前卡不在序列时取第一张,循环回绕)
function nextInSeq(seq, item) {
  if (!seq.length) return null;
  const pos = seq.findIndex((it) => it.image === item?.image);
  return seq[(pos + 1 + seq.length) % seq.length];
}

// 所有分类循环:按分类栏顺序(排除总结复习画廊)拼平全部有语音的条目
function audioSeqAll() {
  const cats = STUDY_CATEGORIES.map((c) => c.key).filter((k) => k !== "review");
  const seq = [];
  for (const cat of cats) {
    for (const it of edition.value.studyItems) {
      if (it.category === cat && it.tipAudio) seq.push(it);
    }
  }
  return seq;
}

// 把目标卡定位为当前卡:先在当前列表找,不在(跨分类/子分类过滤)则切分类归位
function locateInStudy(target) {
  if (!target) return;
  let idx = studyList.value.findIndex((it) => it.image === target.image);
  if (idx < 0) {
    switchCategory(target.category);
    idx = studyList.value.findIndex((it) => it.image === target.image);
  }
  if (idx >= 0) studyIndex.value = idx;
}

// 分类循环下整类无语音:按分类顺序切到下一个有语音的分类,停在它的第一张语音卡
function jumpNextAudioCategory() {
  const cats = STUDY_CATEGORIES.map((c) => c.key).filter((k) => k !== "review");
  const from = cats.indexOf(studyCat.value);
  for (let step = 1; step <= cats.length; step++) {
    const cat = cats[(from + step + cats.length) % cats.length];
    const first = edition.value.studyItems.find(
      (it) => it.category === cat && it.tipAudio,
    );
    if (first) {
      switchCategory(cat);
      locateInStudy(first);
      return;
    }
  }
  // 所有分类都没有语音:原地停住
}

// ---------- 联动 ----------
// 总结复习是画廊视图无单卡,进入即停播;回到卡片分类恢复
const isReviewActive = computed(
  () => studyCat.value === "review" && reviewGroups.value.length > 0,
);

// 自动播放:卡片变化即播(覆盖自动推进与用户手动翻卡/换分类)
watch(studyItem, (item) => {
  if (!autoplay.value || stage.value !== "study" || isReviewActive.value) return;
  if (item) playItem(item);
});

watch(isReviewActive, (rv) => {
  if (rv) {
    stopPlayback();
  } else if (autoplay.value && stage.value === "study" && studyItem.value) {
    playItem(studyItem.value);
  }
});

// 离开学习页停播;进入学习页且自动播放开着则续播
watch(stage, (s) => {
  if (s !== "study") {
    stopPlayback();
  } else if (autoplay.value && !isReviewActive.value && studyItem.value) {
    playItem(studyItem.value);
  }
});

export function useTipAudio() {
  return {
    autoplay,
    loopMode,
    nextDelay,
    NEXT_DELAYS,
    playingImage,
    isReviewActive,
    setAutoplay,
    setLoopMode,
    setNextDelay,
    togglePlay,
    stopPlayback,
  };
}
