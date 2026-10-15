<template>
  <div class="app">
    <!-- ===================== 首页菜单 ===================== -->
    <MenuScreen
      v-if="stage === 'menu'"
      @study="enterStudy"
      @start="go('start')"
      @hospitals="go('hospitals')"
    />

    <!-- ===================== 体检点查询 ===================== -->
    <HospitalsScreen v-else-if="stage === 'hospitals'" @back="stage = 'menu'" />

    <!-- ===================== 学习模式 ===================== -->
    <StudyScreen
      v-else-if="stage === 'study'"
      @back="stage = 'menu'"
      @zoom="openZoom"
    />

    <!-- ===================== 测试设置界面 ===================== -->
    <StartScreen
      v-else-if="stage === 'start'"
      @back="back()"
      @stats="openStats"
      @wrongbook="openWrongBook"
      @start="startTest"
    />

    <!-- ===================== 测试统计界面 ===================== -->
    <HistoryScreen v-else-if="stage === 'stats'" @back="stage = 'start'" />

    <!-- ===================== 历史记录详情(回看答错的图) ===================== -->
    <RecordDetailScreen
      v-else-if="stage === 'recordDetail'"
      @back="stage = 'stats'"
      @zoom="openQuizZoom"
    />

    <!-- ===================== 常错图排行 ===================== -->
    <WrongBook
      v-else-if="stage === 'wrongBook'"
      @drill="startWrongDrill"
      @zoom="openQuizZoom"
    />

    <!-- ===================== 答题界面（仿真体检机·左右全屏） ===================== -->
    <QuizScreen v-else-if="stage === 'quiz'" />

    <!-- ===================== 结果界面 ===================== -->
    <ResultScreen
      v-else-if="stage === 'result'"
      :correct-count="correctCount"
      :total="total"
      :wrong-list="wrongList"
      :driving-result="drivingResult"
      :driving-retest="drivingRetest"
      @restart="startTest"
      @back="stage = 'start'"
    />

    <!-- ===================== 首次使用协议弹窗(逻辑自包含) ===================== -->
    <AgreementDialog />

    <!-- ===================== 图片放大查看层(全局单例,双指/滚轮缩放/拖动/双击) ===================== -->
    <ZoomOverlay />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, nextTick, watch } from "vue";
import { useStage } from "./composables/useStage.js";
import { useRecords } from "./composables/useRecords.js";
import { useStudy } from "./composables/useStudy.js";
import { useQuiz, initQuizPreload } from "./composables/useQuiz.js";
import { useZoom } from "./composables/useZoom.js";
import { initBackKey } from "./composables/useBackKey.js";
import MenuScreen from "./components/screens/MenuScreen.vue";
import StartScreen from "./components/screens/StartScreen.vue";
import ResultScreen from "./components/screens/ResultScreen.vue";
import HistoryScreen from "./components/screens/HistoryScreen.vue";
import RecordDetailScreen from "./components/screens/RecordDetailScreen.vue";
import WrongBook from "./components/screens/WrongBook.vue";
import StudyScreen from "./components/screens/StudyScreen.vue";
import QuizScreen from "./components/screens/QuizScreen.vue";
import HospitalsScreen from "./components/screens/HospitalsScreen.vue";
import AgreementDialog from "./components/AgreementDialog.vue";
import ZoomOverlay from "./components/ZoomOverlay.vue";

const { stage, go, back } = useStage();
const { openStats, openWrongBook } = useRecords();
const { enterStudy } = useStudy();
const {
  correctCount,
  total,
  wrongList,
  drivingResult,
  drivingRetest,
  startTest,
  startWrongDrill,
} = useQuiz();
const { openZoom, openQuizZoom } = useZoom();

// 吸顶工具栏:默认透明衔接页面一体,吸顶后加 .scrolled 显形为实色背景
let barTicking = false;
function updateBackBars() {
  barTicking = false;
  const bars = document.querySelectorAll(".back-bar");
  let scrolled = false;
  bars.forEach((bar, i) => {
    if (i === 0) {
      // 返回条吸顶层实测高度写入 CSS 变量,供体检点筛选条跟随吸附
      document.documentElement.style.setProperty(
        "--backbar-h",
        bar.offsetHeight + "px"
      );
    }
    scrolled = bar.getBoundingClientRect().top <= 1;
    bar.classList.toggle("scrolled", scrolled);
  });
  // 体检点筛选条作为第二吸顶层,显色状态与返回条同步
  document.querySelectorAll(".hs-toolbar").forEach((el) => {
    el.classList.toggle("scrolled", scrolled);
  });
}
function onWinScroll() {
  if (!barTicking) {
    barTicking = true;
    requestAnimationFrame(updateBackBars);
  }
}

// 页面切换时重置窗口滚动位置:SPA 切页后滚动残留会把新页面顶部内容顶出屏幕
watch(stage, () => {
  window.scrollTo(0, 0);
  nextTick(updateBackBars);
});

// 答题页体检机素材:进入应用即后台预载(未就绪时答题页显示 loading 遮罩兜底)
onMounted(() => {
  initQuizPreload();
  initBackKey();
  window.addEventListener("scroll", onWinScroll, { passive: true });
  updateBackBars();
});

onUnmounted(() => {
  window.removeEventListener("scroll", onWinScroll);
});
</script>
