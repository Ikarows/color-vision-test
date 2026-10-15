<template>
  <div
    class="screen quiz-screen"
    ref="quizScreenEl"
    :style="{ '--quiz-s': quizScale }"
  >
    <!-- 素材加载遮罩:体检机背景图/检查图就绪前覆盖,避免看到图片逐步加载 -->
    <transition name="fade">
      <div v-if="quizLoading" class="quiz-loading" aria-hidden="true">
        <div class="quiz-boot">
          <div class="quiz-boot-glow"></div>
          <div class="quiz-boot-ring"></div>
        </div>
        <p class="quiz-loading-text">设备启动中…</p>
      </div>
    </transition>
    <!-- 返回按钮:吸顶悬浮在体检机上方,滚动时始终可见 -->
    <!-- <div class="quiz-top">
      <button class="back-link" @click="stage = drillMode ? 'wrongBook' : 'start'">
        <svg viewBox="0 0 20 20" width="15" height="15"><path d="M12.5 4.5L7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        返回
      </button>
    </div> -->
    <div class="tjj" ref="tjjEl">
      <!-- 体检机头部：左右机翼 + 中间机身底色蓝框屏幕(题目文字+检查图) + 底部摄像头区,样式参照真机照片 -->
      <div class="tjj-head" :style="quizScaleStyle">
        <div class="tjj-head-machine">
          <img
            class="tjj-head-wing wing-left"
            :src="tjjHeadLeftImg"
            alt=""
            draggable="false"
          />
          <div class="tjj-head-mid">
            <div class="tjj-head-panel-frame">
              <div class="tjj-head-panel">
                <div class="tjj-head-panel-in">
                  <p class="tjj-head-question">
                    请在
                    <strong
                      v-if="timerVisible"
                      class="tjj-head-sec"
                      :class="{ urgent: timeLeft <= 5 }"
                      >{{ timeLeft }}S</strong
                    >
                    <em v-else class="tjj-head-blank" aria-hidden="true"></em>
                    内进行选择，否则视为检测失败
                  </p>
                  <div
                    class="plate-wrap tjj-plate"
                    :class="{ shake: shaking }"
                    :key="currentIndex"
                  >
                    <div class="plate-box">
                      <img
                        :src="plateSrc"
                        :alt="'色盲检查图 第' + (currentIndex + 1) + '题'"
                        class="plate-img"
                        draggable="false"
                        @load="plateReady = true"
                        @error="plateReady = true"
                      />
                      <div class="answer-mask" aria-hidden="true">
                        <img :src="plateSrc" alt="" draggable="false" />
                      </div>
                    </div>
                    <transition name="fade">
                      <div
                        v-if="answered"
                        class="plate-badge"
                        :class="lastCorrect ? 'ok' : 'no'"
                      >
                        {{
                          lastCorrect
                            ? "✓ 正确"
                            : "✗ 正确答案:" + " " + currentQuestion.answer
                        }}
                      </div>
                    </transition>
                  </div>
                </div>
              </div>
            </div>
            <img
              class="tjj-head-foot"
              :src="tjjHeadBottomImg"
              alt=""
              draggable="false"
            />
          </div>
          <img
            class="tjj-head-wing wing-right"
            :src="tjjHeadRightImg"
            alt=""
            draggable="false"
          />
        </div>
      </div>

      <!-- 体检机机身：屏幕照片，蓝条秒表图标后为倒计时，六个蓝色选项为答案（仅文字,卡片由 CSS 呈现） -->
      <div class="tjj-body" :style="quizScaleStyle">
        <img class="tjj-img" :src="tjjBodyImg" alt="" draggable="false" />
        <div
          v-if="timerVisible"
          class="tjj-body-count"
          :class="{ urgent: timeLeft <= 5 }"
        >
          {{ timeLeft }}S
        </div>
        <button class="tjj-exit" type="button" @click="quitQuiz">
          退出测试
        </button>
        <button
          class="tjj-stop"
          aria-label="停止检测"
          @click="quitQuiz"
        ></button>
        <div class="tjj-options">
          <button
            v-for="opt in currentOptions"
            :key="opt"
            class="tjj-option"
            :class="optionClass(opt)"
            :disabled="answered"
            @click="choose(opt)"
          >
            {{ opt }}
          </button>
        </div>
      </div>
    </div>

    <!-- 复测确认层:首轮失败(错 >2)触发,确认后抽 4 张新图重考一轮 -->
    <transition name="fade">
      <div v-if="retestOffer" class="retest-mask">
        <div class="retest-card">
          <p class="retest-tag">首轮未通过</p>
          <p class="retest-main">触发复测</p>
          <p class="retest-desc">
            本轮答错 <b>{{ drivingRoundWrong }}</b> 题,超出容错上限(最多错 2 题)
          </p>
          <p class="retest-note">
            复测将抽取 4 张新图,同样最多错 2 题;复测仍未通过,本轮测试结束
          </p>
          <div class="retest-actions">
            <button class="btn btn-primary" @click="startDrivingRetest">
              开始复测
            </button>
            <button class="btn btn-ghost" @click="endDrivingFail">
              结束测试
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useQuiz } from "../../composables/useQuiz.js";
import { useQuizConfig } from "../../composables/useQuizConfig.js";
import { useStage } from "../../composables/useStage.js";
// 仿真体检机界面素材（头部机翼/底部摄像头区 + 机身图拼接）
import tjjHeadLeftImg from "../../assets/img/tjj_head_left.png";
import tjjHeadRightImg from "../../assets/img/tjj_head_right.png";
import tjjHeadBottomImg from "../../assets/img/tjj_head_bottom.png";
import tjjBodyImg from "../../assets/img/tjj_body.jpg";

const { stage } = useStage();
const { timerEnabled, drivingMode } = useQuizConfig();

// 倒计时显示:用户开关开启,或自助机模拟模式(自助机强制 14 秒限时)
const timerVisible = computed(() => timerEnabled.value || drivingMode.value);
const {
  machineReady,
  plateReady,
  quizLoading,
  currentIndex,
  answered,
  lastCorrect,
  shaking,
  currentOptions,
  timeLeft,
  plateSrc,
  currentQuestion,
  drillMode,
  retestOffer,
  drivingRoundWrong,
  choose,
  optionClass,
  quitQuiz,
  startDrivingRetest,
  endDrivingFail,
} = useQuiz();

// ---------- 答题页等比缩放:小屏/矮屏时整体缩小,保证一屏完整显示 ----------
const quizScreenEl = ref(null);
const tjjEl = ref(null);
const quizScale = ref(1);

function fitQuizScale() {
  const screenEl = quizScreenEl.value;
  const tjj = tjjEl.value;
  if (!screenEl || !tjj) return;
  const head = tjj.querySelector(".tjj-head");
  const body = tjj.querySelector(".tjj-body");
  if (!head || !body) return;
  const GAP = 10; // 头屏与机身之间的最小间隙
  const needH = head.offsetHeight + body.offsetHeight + GAP;
  if (needH <= 0) return;
  // 取容器与真实视口的较小值,避免容器被内容撑高时比例恒为 1;
  // 可用高度取机器容器实际高度(flex 已自动扣除顶部留白,兼容安卓状态栏额外避让)
  const sbh =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--sbh"),
    ) || 0;
  const availH = Math.min(tjj.clientHeight, window.innerHeight - sbh);
  quizScale.value = Math.min(1, availH / needH);
}

// 头屏贴顶向顶边收缩,机身贴底向底边收缩,整体同一比例
const quizScaleStyle = computed(() => ({
  transform: `scale(${quizScale.value})`,
}));

// 观察头/身布局尺寸变化(大图加载完成、内容变化),自动重新适配
let quizRO = null;
function observeQuizParts() {
  const tjj = tjjEl.value;
  if (!tjj || !("ResizeObserver" in window)) return;
  if (!quizRO) {
    quizRO = new ResizeObserver(() => {
      if (stage.value === "quiz") fitQuizScale();
    });
  }
  quizRO.disconnect();
  const head = tjj.querySelector(".tjj-head");
  const body = tjj.querySelector(".tjj-body");
  if (head) quizRO.observe(head);
  if (body) quizRO.observe(body);
}

// 体检机图/检查图就绪后重新计算(组件随 quiz 页挂载,无需再观察 stage)
watch([machineReady, plateReady], () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      fitQuizScale();
      observeQuizParts(); // 图片解码完成会改变头/身布局高度,由观察器兜底重算
    });
  });
});

onMounted(() => {
  // 进页先算一次初始比例,再由素材就绪 watch 兜底重算
  nextTick(() => {
    requestAnimationFrame(() => {
      fitQuizScale();
      observeQuizParts();
    });
  });
  window.addEventListener("resize", fitQuizScale);
});

onUnmounted(() => {
  window.removeEventListener("resize", fitQuizScale);
  if (quizRO) quizRO.disconnect();
});
</script>

<style>
/* ---------- 答题页 ---------- */
/* 用 .screen.quiz-screen 双类提升特异性:组件样式先于 App.vue 注入,
   单类 .quiz-screen 的 padding:0 会被 App.vue 的 .screen padding 覆盖 */
.screen.quiz-screen {
  position: relative; /* 素材加载遮罩的定位基准 */
  align-self: stretch;
  width: 100%;
  max-width: 740px; /* 与学习模式一致的最大宽度 */
  margin: 0 auto;
  padding: 0; /* 机身图左右上下全部贴边 */
  padding-top: var(--sbh, 0px); /* 安卓沉浸式:顶部让出状态栏(高度由原生注入) */
  display: flex;
  flex-direction: column;
  flex: none; /* 不随内容撑开,固定一屏高 */
  height: 100vh; /* 旧浏览器回退 */
  height: 100dvh; /* 动态视口高,移动端地址栏收展也精确 */
  min-height: 0;
  overflow: hidden; /* 缩放前的布局溢出不撑开页面 */
}

/* 安卓沉浸式:状态栏高度外再留一段距离,机头不贴着状态栏下沿(web 端无此规则,机器保持贴边) */
html.android-app .screen.quiz-screen {
  padding-top: calc(var(--sbh, 0px) + 12px);
}

/* 素材加载遮罩:浅色半透明毛玻璃,与全局浅色主题融合,模糊盖住图片加载过程 */
.quiz-loading {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  background: rgba(246, 249, 253, 0.62);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.quiz-loading-text {
  margin: 0;
  font-size: 14px;
  letter-spacing: 2px;
  color: #55708f;
  animation: quiz-text-breath 1.6s ease-in-out infinite;
}

@keyframes quiz-text-breath {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}

/* ---------- 复测确认层:首轮失败触发,毛玻璃遮罩与加载层一致 ---------- */
.retest-mask {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(246, 249, 253, 0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.retest-card {
  width: 100%;
  max-width: 340px;
  background: #fff;
  border-radius: 18px;
  padding: 26px 24px 22px;
  text-align: center;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
}

.retest-tag {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #c23b27;
}

.retest-main {
  margin: 6px 0 12px;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 3px;
  color: #22314a;
}

.retest-desc {
  margin: 0 0 6px;
  font-size: 14px;
  color: #46586e;
}

.retest-desc b {
  color: #c23b27;
  font-weight: 800;
}

.retest-note {
  margin: 0 0 18px;
  font-size: 12.5px;
  line-height: 1.7;
  color: #8494a7;
}

.retest-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.retest-actions .btn {
  width: 100%;
  justify-content: center;
}

/* 返回按钮:吸顶悬浮,页面滚动时始终可见 */
.quiz-top {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 10px 14px 8px;
}

.quiz-top .back-link {
  margin-top: 0;
}

/* ---------- 仿真体检机答题界面（头屏 + 机身双图,浮层按各图百分比定位） ---------- */
.tjj {
  position: relative; /* 头/身绝对定位的参照 */
  width: 100%;
  margin: 0;
  flex: 1; /* 占满剩余高度 */
  min-height: 0; /* 不让内容撑高自身,保证以视口边缘为基准 */
  background: #cad6d4;
}

/* 头屏钉死贴顶、机身钉死贴底(绝对定位,内容溢出时也不失去贴边),
   等比缩放时头屏向顶边收缩、机身向底边收缩,中间留白自然扩大 */
.tjj-head {
  position: absolute;
  top: 0;
  left: 2%;
  right: 2%;
  transform-origin: top center;
}

.tjj-body {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  transform-origin: bottom center;
}

.tjj-img {
  display: block;
  width: 100%;
  user-select: none;
  -webkit-user-drag: none;
}

/* 电脑(≥772px):机身照片横向拉伸铺满 .tjj 盒子左右两边(以盒子宽为上限),机头保持不动。
   原理:布局宽放大 1/s,经 scale(s) 缩放后视觉宽度恰好 = .tjj 盒子宽(100%);
   高度锁定为 740 布局宽下的原始高度(2731x1922 素材 → 740*1922/2731),
   缩放公式的 needH 不变 → 机头缩放比例与位置完全不受影响;
   照片用 object-fit:fill 做横向拉伸,选项/倒计时/退出均为百分比定位自动跟随 */
@media (min-width: 772px) {
  .tjj-body {
    left: 50%;
    right: auto;
    width: calc(100% / var(--quiz-s, 1));
    margin-left: calc(-50% / var(--quiz-s, 1));
    height: calc(740 * 1922 / 2731 * 1px);
  }

  .tjj-body .tjj-img {
    width: 100%;
    height: 100%;
    object-fit: fill;
  }
}

/* ---------- 头部拼接结构：左右机翼照片 + 中间机身底色蓝框屏幕 + 底部摄像头区 ---------- */
/* 素材 PNG 为透明背景:机身轮廓在机翼照片内,透明区露出页面背景(如参考图的墙面);
   机身正面底色 #32434d 仅由中间列(tjj-head-mid)提供,贯穿屏幕区与底部摄像头区 */
.tjj-head-machine {
  display: flex;
  align-items: stretch;
}

/* 机翼拉伸至整个头部高度(含底部摄像头区),与 foot 底边齐平 */
.tjj-head-wing {
  display: block;
  align-self: stretch;
  height: auto;
  object-fit: fill;
  user-select: none;
  -webkit-user-drag: none;
}

/* 机翼等宽,中间列居中(新素材左右翼尺寸接近,等宽最对称) */
.wing-left {
  width: 13.4%;
}

.wing-right {
  width: 13.4%;
}

/* 中间机身底色区域(#32434d):上方蓝框屏幕面板,下方摄像头区,总高由内容撑开 */
.tjj-head-mid {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 4% 1% 6%;
  /* 上层:左右两侧保持纯色#32434d(与机翼照片机身色无缝),中段渐隐露出下层光影;
     下层:纵向受光渐变(顶部稍亮,底部渐暗) —— 两边不渐变,仅中间渐变,过渡自然 */
  background:
    linear-gradient(
      90deg,
      #32434d 0%,
      #32434d 15%,
      rgba(50, 67, 77, 0) 40%,
      rgba(50, 67, 77, 0) 60%,
      #32434d 85%,
      #32434d 100%
    ),
    linear-gradient(180deg, #32434d 0%, #3d515e 15%, #32434d 48%, #2b3a44 100%);
  border-bottom-left-radius: 5%;
  border-bottom-right-radius: 5%;
  margin: 0 -1px;
  margin-bottom: 10px;
}

/* 屏幕面板最外层:仅左侧和上侧 2px 黑色边框 */
.tjj-head-panel-frame {
  width: 100%;
  border-left: 3px solid #000;
  border-top: 2px solid #000;
}

/* 白底蓝框屏幕面板(参照真机:蓝色边框直角,白色屏幕底圆角) */
.tjj-head-panel {
  width: 100%;
  background: #007ce2;
  border-radius: 0;
  border-top: 5px solid #112c57;
  padding: 8px;
  display: flex;
}

/* 面板内的屏幕区(浅蓝灰底,圆角;参照真机屏幕非纯白) */
.tjj-head-panel-in {
  width: 100%;
  background: #c3dde4;
  border-radius: 8px;
  padding: 3.5% 2% 4%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 题目文字行("请在 __S 内进行选择,否则视为检测失败") */
.tjj-head-question {
  margin: 0 0 2.5%;
  font-size: 12px;
  font-weight: 700;
  color: #42474d;
  text-align: center;
  line-height: 1.35;
  white-space: nowrap;
}

/* 倒计时数字(黄色,与真机一致);固定宽高,数字位数变化时不引起行内布局晃动 */
.tjj-head-sec {
  display: inline-block;
  min-width: 2.2em;
  height: 1.35em;
  line-height: 1.35;
  text-align: center;
  vertical-align: baseline;
  color: #ffc400;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  padding: 0 0.25em;
}

/* 关闭倒计时模式时显示的填空下划线 */
.tjj-head-blank {
  display: inline-block;
  width: 2em;
  margin: 0 0.15em;
  border-bottom: 2px solid #9aa1a9;
}

/* 底部摄像头区照片(居中,底边与机翼下端齐平) */
.tjj-head-foot {
  display: block;
  width: 30%;
  margin: 3.5% 0 0;
  user-select: none;
  -webkit-user-drag: none;
}

/* 蓝条秒表图标右侧的倒计时（白色,紧贴图标,字号随机身图宽度自适应;
   图标位于图片宽度 61.2%~63.9%,倒计时盒子左缘 63%,文字中心约在图标右缘 +3%） */
.tjj-body-count {
  position: absolute;
  left: 63%;
  top: 19.7%;
  width: 8%;
  height: 5%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 与退出按钮同一套反比补偿,两者视觉尺度在缩放下保持同步 */
  font-size: calc(11px / max(var(--quiz-s, 1), 0.8));
  font-weight: 800;
  color: rgba(255, 255, 255, 0.8);
  font-variant-numeric: tabular-nums;
}

/* 宽屏(电脑):字号加大一档并右移,使数字在闹钟图标与退出按钮之间居中 */
@media (min-width: 520px) {
  .tjj-body-count {
    left: 63.5%;
    font-size: calc(13px / max(var(--quiz-s, 1), 0.72));
  }
}

/* 倒计时右侧的退出测试按钮(与倒计时文字同尺度的小胶囊,垂直对齐倒计时行;
   以蓝条右端为锚点向左排布——蓝条在图片宽度约 86.5% 处结束,
   按钮右边缘固定在 85.5%,文字再宽也只向左生长,不会压出条带/机身) */
.tjj-exit {
  position: absolute;
  right: 14.5%;
  top: 22.2%;
  transform: translateY(-50%);
  /* 窄屏(手机):与倒计时数字同尺度;反比下限 0.8 防止向左生长盖住倒计时数字 */
  padding: calc(2px / max(var(--quiz-s, 1), 0.8))
    calc(6px / max(var(--quiz-s, 1), 0.8));
  font-size: calc(10px / max(var(--quiz-s, 1), 0.8));
  border: 1px solid rgba(255, 255, 255, 0.55);
  font-weight: 700;
  line-height: 1;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
}

/* 宽屏(电脑):机身整体缩小后按钮反比放大补偿,视觉尺寸对齐桌面可读标准;
   下限 0.72 在"按钮够大"与"不挤倒计时数字"之间取平衡 */
@media (min-width: 520px) {
  .tjj-exit {
    padding: calc(2.5px / max(var(--quiz-s, 1), 0.72))
      calc(6px / max(var(--quiz-s, 1), 0.72));
    font-size: calc(13px / max(var(--quiz-s, 1), 0.72));
  }
}

.tjj-exit:active {
  background: rgba(255, 255, 255, 0.3);
}

/* 头屏倒计时 ≤5s 时闪烁提醒（机身倒计时不闪烁） */
.tjj-head-sec.urgent {
  animation: tjj-blink 1s infinite;
}

@keyframes tjj-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

/* 蓝条秒表图标热区（点击退出测试,新机身图仅此处可作锚点;
   包住图标 61.2%~63.9% 并各留约 1% 余量） */
.tjj-stop {
  position: absolute;
  left: 60.2%;
  top: 18.4%;
  width: 4.7%;
  height: 8%;
  background: transparent;
  border: 0;
  padding: 0;
  border-radius: 6px;
  cursor: pointer;
}

.tjj-stop:active {
  background: rgba(255, 255, 255, 0.3);
}

/* 六个答案选项(仅文字,机身图屏幕照片的白色区域,白底蓝边框卡片全部由 CSS 呈现,比例参照真机照片) */
.tjj-options {
  position: absolute;
  left: 22%;
  top: 47.9%;
  width: 56%;
  height: 44%; /* 底边上提(原 47.5%),给机身底部留出空间 */
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  column-gap: 6.1%;
  row-gap: 12%; /* 第二排上移贴近第一排(原 17.9%),与高度同步收紧后卡片高度不变 */
}

.tjj-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2%;
  text-align: center;
  background: #cfd8e3; /* 卡片底色保持不变 */
  border: 1.5px solid #5b7ce6; /* 蓝色卡片边框 */
  border-radius: 8px;
  color: #2b52e0;
  font-family: inherit;
  font-weight: 800;
  font-size: 14px;
  line-height: 1.2;
  cursor: pointer;
  transition: all 0.18s ease;
}

.tjj-option:disabled {
  cursor: default;
}

.tjj-option.is-correct {
  color: #177a46;
}

.tjj-option.is-wrong {
  color: #c23b27;
}

.tjj-option.is-dim {
  opacity: 0.45;
}

/* 体检模拟:遮挡左下角自带的“图号/答案”角标(仅显示层覆盖,不改图片文件)。
   plate-box 与图片完全等大,补丁定位严格限制在图片范围内 */
.plate-box {
  position: relative;
}
.answer-mask {
  position: absolute;
  left: 0;
  bottom: 1px; /* 压在图片 1px 边框上沿,不越出图片 */
  width: 40%;
  height: 11%;
  overflow: hidden;
  border-bottom-left-radius: 14px;
  pointer-events: none;
}
.answer-mask img {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 250%; /* 补丁宽为图宽的 40%,放大 2.5 倍即整图原比例宽度 */
  max-width: none;
  /* 取样同图右下角同一水平带并水平镜像:右缘白边翻到补丁左缘、底缘白边保持对齐,
     补丁左右两侧的白边与原图自然衔接 */
  transform: scaleX(-1);
  user-select: none;
}

/* 头部屏幕面板内的检查图:流式布局,宽度撑满面板,plate-box 紧贴图片保证遮罩对齐 */
.tjj-plate {
  position: relative;
  width: 96%;
  max-width: none;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  animation: none;
}

.tjj-plate .plate-box {
  position: relative;
  width: 100%;
  /* 题图宽高比不一(1.28~1.36)且切题时节点重建存在解码空档,
     固定图框宽高比预留空间,消除切题时面板先塌陷再弹回的晃动 */
  aspect-ratio: 1.3;
}

.tjj-plate .plate-img {
  width: 100%;
  height: 100%;
  object-fit: fill; /* 各图比例差异 ≤6%,拉伸不可感知 */
  border: 0;
  box-shadow: none;
}

/* 答对/答错角标 */
.plate-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 14px;
  font-weight: 700;
  padding: 7px 14px;
  border-radius: 99px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.plate-badge.ok {
  background: #22a15f;
}
.plate-badge.no {
  background: #e0533d;
}

/* 答错时题图抖动 */
.shake {
  animation: shake 0.4s;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-6px);
  }
  50% {
    transform: translateX(6px);
  }
  75% {
    transform: translateX(-4px);
  }
}
</style>
