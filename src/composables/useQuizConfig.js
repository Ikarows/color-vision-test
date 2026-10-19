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

// 驾照自助机模拟:共 DRIVING_CHANCES 次机会,每次机会随机抽 DRIVING_TOTAL 张图,
// 必须从头连续答对全部图才算通过;任意一张答错该次机会立即作废,机会全部用完正式结束
export const DRIVING_TOTAL = 4; // 每次机会的图数
export const DRIVING_CHANCES = 4; // 总机会次数
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
    DRIVING_CHANCES,
  };
}
