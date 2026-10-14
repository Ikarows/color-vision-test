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
import { onMounted } from "vue";
import { useStage } from "./composables/useStage.js";
import { useRecords } from "./composables/useRecords.js";
import { useStudy } from "./composables/useStudy.js";
import { useQuiz, initQuizPreload } from "./composables/useQuiz.js";
import { useZoom } from "./composables/useZoom.js";
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
  startTest,
  startWrongDrill,
} = useQuiz();
const { openZoom, openQuizZoom } = useZoom();

// 答题页体检机素材:进入应用即后台预载(未就绪时答题页显示 loading 遮罩兜底)
onMounted(() => {
  initQuizPreload();
});
</script>
