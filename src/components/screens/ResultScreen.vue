<template>
  <div class="screen result-screen">
    <!-- 吸顶状态栏垫:无返回按钮,滚动时不让内容穿过状态栏区域 -->
    <StatusBarPad />
    <div class="card result-card">
      <h2>{{ drivingResult ? "模拟判定完成" : "测试完成" }}</h2>
      <div v-if="drivingResult" class="driving-verdict" :class="drivingResult">
        {{
          drivingResult === "pass"
            ? "驾照自助机模拟 · 通过"
            : "驾照自助机模拟 · 未通过"
        }}
      </div>
      <!-- 自助机模拟:不打分,只显示通过/未通过 -->
      <div v-if="drivingResult" class="driving-main" :class="drivingResult">
        <span class="driving-icon">
          <svg
            v-if="drivingResult === 'pass'"
            viewBox="0 0 24 24"
            width="34"
            height="34"
          >
            <path
              d="M4 12.5l5 5L20 6.5"
              fill="none"
              stroke="#fff"
              stroke-width="3.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="34" height="34">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="#fff"
              stroke-width="3.2"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span class="driving-text">{{
          drivingResult === "pass" ? "通过" : "未通过"
        }}</span>
      </div>
      <template v-else>
        <div class="score-circle" :class="scoreLevel">
          <div class="score-inner">
            <span class="score-num">{{ correctCount }}</span>
            <span class="score-total">/ {{ total }}</span>
          </div>
        </div>
        <p class="score-percent">正确率 {{ percent }}%</p>
      </template>
      <p class="verdict">{{ finalVerdict }}</p>

      <div v-if="wrongList.length" class="wrong-section">
        <h3>答错的题目 · {{ wrongList.length }}</h3>
        <div class="wrong-list">
          <div v-for="item in wrongList" :key="item.index" class="wrong-item">
            <img
              :src="platePath(item.q.image, item.q.editionId)"
              :alt="'第' + (item.index + 1) + '题'"
            />
            <div class="wrong-info">
              <span class="wrong-no">第 {{ item.index + 1 }} 题</span>
              <span
                >你的选择:<em class="bad">{{
                  item.chosen ?? "超时未答"
                }}</em></span
              >
              <span
                >正确答案:<em class="good">{{ item.q.answer }}</em></span
              >
            </div>
          </div>
        </div>
      </div>
      <p v-else class="all-right">全部答对,辨色力表现优秀!</p>

      <div class="result-actions">
        <button class="btn btn-primary" @click="$emit('restart')">
          再测一次
        </button>
        <button class="btn btn-ghost" @click="$emit('back')">返回</button>
      </div>
      <p class="disclaimer">如有疑虑,请到正规医疗机构进行色觉检查</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { platePath } from "../../utils/assets.js";
import StatusBarPad from "../StatusBarPad.vue";

const props = defineProps({
  correctCount: { type: Number, required: true },
  total: { type: Number, required: true },
  wrongList: { type: Array, required: true },
  // 驾照自助机模拟判定: 'pass' | 'fail' | ''(普通测试)
  drivingResult: { type: String, default: "" },
  // 通过时用掉的机会次数(1 = 首次机会即通过)
  drivingChances: { type: Number, default: 1 },
});

defineEmits(["restart", "back"]);

const percent = computed(() =>
  props.total ? Math.round((props.correctCount / props.total) * 100) : 0,
);

const scoreLevel = computed(() => {
  // 自助机模拟以判定结果着色:通过绿/未通过红
  if (props.drivingResult === "pass") return "lv-good";
  if (props.drivingResult === "fail") return "lv-bad";
  const p = props.correctCount / props.total;
  if (p >= 0.95) return "lv-good";
  if (p >= 0.8) return "lv-mid";
  return "lv-bad";
});

const verdictText = computed(() => {
  const p = props.correctCount / props.total;
  if (p === 1) return "太棒了!全部答对,辨色力正常。";
  if (p >= 0.95) return "表现优秀,辨色力基本正常。";
  if (p >= 0.8) return "少量图案辨认有误,建议休息后复测。";
  if (p >= 0.6) return "部分图案辨认困难,可能存在色弱倾向,建议复查。";
  return "较多图案无法正确辨认,建议尽快到专业机构检查色觉。";
});

const finalVerdict = computed(() => {
  if (props.drivingResult === "pass")
    return props.drivingChances <= 1
      ? "第 1 次机会即连续答对 4 张,本轮模拟通过。"
      : `前 ${props.drivingChances - 1} 次机会作废,第 ${props.drivingChances} 次机会连续答对 4 张,本轮模拟通过。`;
  if (props.drivingResult === "fail")
    return `4 次机会均未连续答对 4 张,累计答错 ${props.wrongList.length} 张,未通过驾照自助机模拟,建议针对性练习后再模拟。`;
  return verdictText.value;
});
</script>

<style>
/* ---------- 结果页 ---------- */
.result-card {
  max-width: 720px;
}

.result-card h2 {
  font-size: 26px;
  margin-bottom: 22px;
  letter-spacing: 2px;
}

/* 自助机模拟判定徽标 */
.driving-verdict {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 18px;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 1px;
}

.driving-verdict.pass {
  background: #e7f6ee;
  color: #178a50;
}

.driving-verdict.fail {
  background: #fdecea;
  color: #c23b27;
}

/* 自助机模拟大判定:通过/未通过(替代分数圈) */
.driving-main {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  margin: 0 auto 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #fff;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
}

.driving-main.pass {
  background: linear-gradient(135deg, #22a15f, #5fce7f);
  box-shadow: 0 12px 28px rgba(34, 161, 95, 0.35);
}

.driving-main.fail {
  background: linear-gradient(135deg, #e0533d, #ef7a66);
  box-shadow: 0 12px 28px rgba(224, 83, 61, 0.35);
}

.driving-icon {
  display: flex;
}

.driving-text {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 4px;
  text-indent: 4px;
  line-height: 1;
}

.score-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
}

.score-circle.lv-good {
  background: linear-gradient(135deg, #22a15f, #5fce7f);
}
.score-circle.lv-mid {
  background: linear-gradient(135deg, #f0a23c, #f7c46c);
}
.score-circle.lv-bad {
  background: linear-gradient(135deg, #e0533d, #ef7a66);
}

.score-inner {
  display: flex;
  align-items: baseline;
}

.score-num {
  font-size: 50px;
  font-weight: 800;
}

.score-total {
  font-size: 18px;
  opacity: 0.85;
}

.score-percent {
  font-size: 15px;
  color: #5c6f84;
  margin-bottom: 8px;
}

.verdict {
  font-size: 16px;
  font-weight: 700;
  color: #34455a;
  margin-bottom: 26px;
}

.result-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.result-actions .btn {
  flex: 1;
  justify-content: center;
  padding: 13px 10px;
}
</style>
