import { ref } from "vue";
import { useEdition } from "./useEdition.js";

// 测试配置(全局单例):出题模式 + 倒计时开关
const { totalCount } = useEdition();

export const MODES = [
  { key: "random10", name: "随机 10 题", count: 10, desc: "快速自测" },
  { key: "random20", name: "随机 20 题", count: 20, desc: "标准自测" },
  {
    key: "randomAll",
    name: "随机全部",
    get count() {
      return totalCount.value;
    },
    desc: "打乱顺序作答",
  },
  {
    key: "fixed",
    name: "固定顺序",
    get count() {
      return totalCount.value;
    },
    desc: "按原书顺序作答",
  },
];

const mode = ref("random10");
const timerEnabled = ref(localStorage.getItem("cv_timer") === "1");

// 驾照自助机模拟:一轮 4 题随机抽题,容错 2 次(答对至少 2 题通过),必须答完全部题目后统一判定
export const DRIVING_TOTAL = 4;
export const DRIVING_MAX_WRONG = 2;
const drivingMode = ref(localStorage.getItem("cv_driving") === "1");

function toggleTimer() {
  timerEnabled.value = !timerEnabled.value;
  localStorage.setItem("cv_timer", timerEnabled.value ? "1" : "0");
}

function toggleDriving() {
  drivingMode.value = !drivingMode.value;
  localStorage.setItem("cv_driving", drivingMode.value ? "1" : "0");
}

export function useQuizConfig() {
  return {
    MODES,
    mode,
    timerEnabled,
    toggleTimer,
    drivingMode,
    toggleDriving,
    DRIVING_TOTAL,
    DRIVING_MAX_WRONG,
  };
}
