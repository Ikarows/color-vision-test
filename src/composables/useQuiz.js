import { ref, computed } from "vue";
import { buildOptions, shuffle } from "../data/questions.js";
import { getEdition } from "../data/editions/index.js";
import { addRecord } from "../data/stats.js";
import { useStage } from "./useStage.js";
import { useQuizConfig } from "./useQuizConfig.js";
import { useEdition } from "./useEdition.js";
import { useRecords } from "./useRecords.js";
import { platePath } from "../utils/assets.js";
// 仿真体检机界面素材（头部机翼/底部摄像头区 + 机身图拼接）
import tjjHeadLeftImg from "../assets/img/tjj_head_left.png";
import tjjHeadRightImg from "../assets/img/tjj_head_right.png";
import tjjHeadBottomImg from "../assets/img/tjj_head_bottom.png";
import tjjBodyImg from "../assets/img/tjj_body.jpg";

const { stage } = useStage();
const { mode, timerEnabled, drivingMode, DRIVING_TOTAL, DRIVING_MAX_WRONG } =
  useQuizConfig();
const { edition } = useEdition();
const { refreshStats, wrongPlateStats } = useRecords();

// ---------- 素材预加载（体检机背景图 + 检查图） ----------
// 进入应用即后台静默预载体检机图片;未就绪时答题页显示 loading 遮罩兜底
const machineReady = ref(false);
const plateReady = ref(false);
const quizLoading = computed(() => !machineReady.value || !plateReady.value);

let preloadStarted = false;
// 由 App.vue onMounted 调用一次(模块级保证幂等)
export function initQuizPreload() {
  if (preloadStarted) return;
  preloadStarted = true;
  Promise.all([
    preloadImage(tjjHeadLeftImg),
    preloadImage(tjjHeadRightImg),
    preloadImage(tjjHeadBottomImg),
    preloadImage(tjjBodyImg),
  ]).then(() => (machineReady.value = true));
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

// ---------- 答题状态 ----------
const questions = ref([]);
const currentIndex = ref(0);
const correctCount = ref(0);
const answered = ref(false);
const lastCorrect = ref(false);
const chosenOption = ref(null);
const shaking = ref(false);
const currentOptions = ref([]);
const records = ref([]); // { index, chosen, correct }
// 驾照自助机模拟判定结果: 'pass' 通过 | 'fail' 未通过 | null 非该模式
const drivingResult = ref(null);
// 驾照自助机复测:首轮失败(错 >2)触发,再抽 4 张新图重考一轮,复测仍未通过直接结束
const drivingRetest = ref(false); // 是否处于复测轮
const retestOffer = ref(false); // 首轮失败后的复测确认层
const drivingRoundStart = ref(0); // 当前轮(首轮/复测)在 records 中的起始下标
const drivingRoundWrong = computed(() =>
  records.value
    .slice(drivingRoundStart.value)
    .filter((r) => !r.correct).length,
);

// ---------- 倒计时 ----------
const QUIZ_TIME = 14; // 每题限时(秒)
const timeLeft = ref(QUIZ_TIME);
let timerId = null;

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function startTimer() {
  stopTimer();
  // 自助机模拟模式强制 14 秒限时(真实自助机为连续作答,超时视为答错)
  if (!timerEnabled.value && !drivingMode.value) return;
  timeLeft.value = QUIZ_TIME;
  timerId = setInterval(() => {
    if (answered.value) {
      stopTimer();
      return;
    }
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      stopTimer();
      if (!answered.value) choose(null); // 超时按答错处理
    }
  }, 1000);
}

function quitQuiz() {
  stopTimer();
  // 错图针对测试中途退出回错题本,普通测试回开始页
  stage.value = drillMode.value ? "wrongBook" : "start";
}

const total = computed(() => questions.value.length);
const currentQuestion = computed(() => questions.value[currentIndex.value]);
// 图片目录按题目所属版本解析(drill 混合版本时逐题正确)
const plateSrc = computed(() =>
  platePath(currentQuestion.value.image, currentQuestion.value.editionId),
);

const wrongList = computed(() =>
  records.value
    .filter((r) => !r.correct)
    .map((r) => ({ ...r, q: questions.value[r.index] })),
);

function buildQuestionSet() {
  const pool = edition.value.questions;
  switch (mode.value) {
    case "random10":
      return shuffle(pool).slice(0, 10);
    case "random20":
      return shuffle(pool).slice(0, 20);
    case "randomAll":
      return shuffle(pool);
    default:
      return [...pool];
  }
}

// 题目快照:附带所属版本 id,图片路径/记录/错题聚合都按它解析
function withEdition(q, editionId) {
  return { ...q, editionId };
}

function startTest() {
  // 驾照自助机模拟:无视出题模式,固定随机抽 5 题
  questions.value = (
    drivingMode.value
      ? shuffle(edition.value.questions).slice(0, DRIVING_TOTAL)
      : buildQuestionSet()
  ).map((q) => withEdition(q, edition.value.id));
  currentIndex.value = 0;
  correctCount.value = 0;
  records.value = [];
  drivingResult.value = null;
  drivingRetest.value = false;
  retestOffer.value = false;
  drivingRoundStart.value = 0;
  drillMode.value = false;
  plateReady.value = false;
  loadQuestion();
  stage.value = "quiz";
}

// 错图针对测试:只考常错图(按答错次数优先,最多 20 题;跨版本逐题带各自版本)
const drillMode = ref(false);
function startWrongDrill() {
  const qs = shuffle(
    wrongPlateStats.value
      .slice(0, 20)
      .map((w) => {
        const q = getEdition(w.editionId)?.questions.find(
          (q) => q.image === w.image,
        );
        return q ? withEdition(q, w.editionId) : null;
      })
      .filter(Boolean),
  );
  if (!qs.length) return;
  questions.value = qs;
  currentIndex.value = 0;
  correctCount.value = 0;
  records.value = [];
  drivingRetest.value = false;
  retestOffer.value = false;
  drivingRoundStart.value = 0;
  drillMode.value = true;
  plateReady.value = false;
  loadQuestion();
  stage.value = "quiz";
}

function loadQuestion() {
  answered.value = false;
  lastCorrect.value = false;
  chosenOption.value = null;
  currentOptions.value = buildOptions(currentQuestion.value);
  startTimer();
}

// 结算:写入本地统计(含评分、错图与答对图明细,逐条带版本 id)并进入结果页
function finishQuiz() {
  const answeredCount = records.value.length;
  const score = Math.round((correctCount.value / answeredCount) * 100);
  const wrongPlates = wrongList.value.map((w) => ({
    image: w.q.image,
    chosen: w.chosen,
    answer: w.q.answer,
    no: w.index + 1,
    editionId: w.q.editionId,
  }));
  const correctPlates = records.value
    .filter((r) => r.correct)
    .map((r) => ({
      image: questions.value[r.index].image,
      editionId: questions.value[r.index].editionId,
    }));
  addRecord(
    drivingMode.value && !drillMode.value
      ? "driving"
      : drillMode.value
        ? "wrongDrill"
        : mode.value,
    answeredCount,
    correctCount.value,
    score,
    wrongPlates,
    correctPlates,
    edition.value.id,
  );
  refreshStats();
  stage.value = "result";
}

// 复测:追加 4 张新图(排除本轮已出的图)继续作答;
// 题目数组续接而非重置,保证已有记录的题目下标不失效
function startDrivingRetest() {
  retestOffer.value = false;
  drivingRetest.value = true;
  drivingRoundStart.value = records.value.length;
  const used = new Set(questions.value.map((q) => q.image));
  let pool = edition.value.questions.filter((q) => !used.has(q.image));
  if (pool.length < DRIVING_TOTAL) pool = edition.value.questions;
  questions.value = questions.value.concat(
    shuffle(pool)
      .slice(0, DRIVING_TOTAL)
      .map((q) => withEdition(q, edition.value.id)),
  );
  currentIndex.value = drivingRoundStart.value;
  plateReady.value = false;
  loadQuestion();
}

// 放弃复测:按首轮失败判定,直接结束本轮测试
function endDrivingFail() {
  retestOffer.value = false;
  drivingResult.value = "fail";
  finishQuiz();
}

function choose(opt) {
  if (answered.value) return;
  answered.value = true;
  stopTimer();
  chosenOption.value = opt;
  const correct = opt === currentQuestion.value.answer;
  lastCorrect.value = correct;
  if (correct) correctCount.value++;
  records.value.push({ index: currentIndex.value, chosen: opt, correct });
  // 答题间隙预载下两题检查图,慢网络下切题时图片已就绪,避免空白等待
  for (const offset of [1, 2]) {
    const nextQ = questions.value[currentIndex.value + offset];
    if (nextQ) preloadImage(platePath(nextQ.image, nextQ.editionId));
  }
  if (!correct) {
    shaking.value = true;
    setTimeout(() => (shaking.value = false), 400);
  }
  setTimeout(
    () => {
      if (currentIndex.value < total.value - 1) {
        currentIndex.value++;
        loadQuestion();
      } else {
        // 测试完成,写入本地统计(含评分、错图与答对图明细,逐条带版本 id)
        if (drivingMode.value && !drillMode.value) {
          // 驾照自助机模拟:按当前轮(首轮/复测)判定,答对至少 2 题(错 ≤2)本轮通过
          const roundWrong = records.value
            .slice(drivingRoundStart.value)
            .filter((r) => !r.correct).length;
          if (roundWrong <= DRIVING_MAX_WRONG) {
            drivingResult.value = "pass"; // 首轮直接通过,或复测通过
          } else if (!drivingRetest.value) {
            retestOffer.value = true; // 首轮失败:触发复测,弹出确认层
            return;
          } else {
            drivingResult.value = "fail"; // 复测仍未通过,直接结束本轮测试
          }
        }
        finishQuiz();
      }
    },
    correct ? 550 : 1400,
  );
}

function optionClass(opt) {
  if (!answered.value) return "";
  if (opt === currentQuestion.value.answer) return "is-correct";
  if (opt === chosenOption.value) return "is-wrong";
  return "is-dim";
}

export function useQuiz() {
  return {
    // 预载状态
    machineReady,
    plateReady,
    quizLoading,
    // 答题状态
    questions,
    currentIndex,
    correctCount,
    answered,
    lastCorrect,
    chosenOption,
    shaking,
    currentOptions,
    timeLeft,
    total,
    currentQuestion,
    plateSrc,
    wrongList,
    drillMode,
    drivingResult,
    drivingRetest,
    retestOffer,
    drivingRoundWrong,
    // 方法
    startTest,
    startWrongDrill,
    startDrivingRetest,
    endDrivingFail,
    choose,
    optionClass,
    quitQuiz,
  };
}
