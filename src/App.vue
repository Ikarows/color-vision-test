<template>
  <div class="app">
    <!-- ===================== 首页菜单 ===================== -->
    <div v-if="stage === 'menu'" class="screen menu-screen">
      <div class="brand">
        <span class="dot red"></span>
        <span class="dot amber"></span>
        <span class="dot green"></span>
        <span class="dot blue"></span>
      </div>
      <h1 class="title">色盲色弱助手</h1>
      <p class="subtitle">基于《色盲检查图》第 6 版 · 共 {{ TOTAL_COUNT }} 题</p>

      <div class="menu-cards">
        <button class="menu-card study" @click="enterStudy">
          <span class="menu-icon">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/><path d="M9 8h7M9 12h5"/></svg>
          </span>
          <span class="menu-name">技巧记图</span>
          <span class="menu-desc">逐图记忆技巧讲解<br/>简单 13 · 特征 26 · 数字 9</span>
        </button>
        <button class="menu-card quiz" @click="stage = 'start'">
          <span class="menu-icon">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </span>
          <span class="menu-name">体检模拟</span>
          <span class="menu-desc">模拟体检自测<br/>固定顺序 · 随机 10 / 20 / 全部</span>
        </button>
      </div>
      <p class="disclaimer">本测试仅供自测参考,不能替代专业医学诊断</p>
      <p class="copyright">@copyright Ikarows 2026 v1.0.0</p>
    </div>

    <!-- ===================== 学习模式 ===================== -->
    <div v-else-if="stage === 'study'" class="screen study-screen">
      <header class="study-header">
        <button class="back-link" @click="stage = 'menu'">
          <svg viewBox="0 0 20 20" width="15" height="15"><path d="M12.5 4.5L7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          返回菜单
        </button>
        <div class="study-tabs">
          <button
            v-for="c in STUDY_CATEGORIES"
            :key="c.key"
            class="study-tab"
            :class="{ active: studyCat === c.key }"
            @click="switchCategory(c.key)"
          >
            {{ c.name }}
            <em>{{ categoryCount(c.key) }}</em>
          </button>
        </div>
        <div class="study-subtabs" v-if="studyCat === 'feature'">
          <button
            v-for="s in FEATURE_SUBS"
            :key="s.key"
            class="sub-tab"
            :class="{ active: studySubCat === s.key }"
            @click="setSubCat(s.key)"
          >{{ s.name }} <em>{{ subCount(s.key) }}</em></button>
        </div>
      </header>

      <main class="quiz-main study-main" :key="studyCat + '-' + studyIndex">
        <div v-if="hasStudyOriginal || studyItem.details?.length" class="view-switch">
          <button
            class="vs-btn"
            :class="{ active: studyView === 'question' }"
            @click="studyView = 'question'"
          >题目图</button>
          <button
            v-if="hasStudyOriginal"
            class="vs-btn"
            :class="{ active: studyView === 'original' }"
            @click="studyView = 'original'"
          >原图</button>
          <button
            v-if="studyItem.details?.length"
            class="vs-btn"
            :class="{ active: studyView === 'detail' }"
            @click="studyView = 'detail'"
          >答案解析图</button>
        </div>

        <div class="plate-wrap" v-if="studyView === 'question'">
          <img
            :src="studyPath(studyItem.image)"
            :alt="'学习图 ' + (studyIndex + 1)"
            class="plate-img zoomable"
            draggable="false"
            @click="openZoom(studyPath(studyItem.image))"
          />
        </div>
        <div class="plate-wrap" v-else-if="studyView === 'original' && hasStudyOriginal">
          <img
            :src="studyOriginalPath(studyItem)"
            :alt="'原图'"
            class="plate-img zoomable"
            draggable="false"
            @click="openZoom(studyOriginalPath(studyItem))"
          />
        </div>
        <div class="plate-wrap detail-wrap" v-else-if="studyView === 'detail' && studyItem.details?.length">
          <img
            v-for="d in studyItem.details"
            :key="d"
            :src="studyPath(d)"
            :alt="'答案解析图'"
            class="plate-img zoomable"
            draggable="false"
            @click="openZoom(studyPath(d))"
          />
        </div>

        <div class="study-info">
          <div class="study-answer-row">
            <span class="study-label">答案</span>
            <span class="study-answer">{{ studyItem.answer }}</span>
          </div>
          <div class="study-tip">
            <span class="study-label">技巧</span>
            <p>{{ studyItem.tip || '一眼就能看出,无需背诵。' }}</p>
          </div>
        </div>

        <div class="study-nav">
          <button class="btn btn-ghost nav-btn" :disabled="studyIndex === 0" @click="prevStudy">‹ 上一张</button>
          <span class="study-progress">{{ studyIndex + 1 }} / {{ studyList.length }}</span>
          <button class="btn btn-primary nav-btn" :disabled="studyIndex === studyList.length - 1" @click="nextStudy">下一张 ›</button>
        </div>
      </main>
    </div>

    <!-- ===================== 测试设置界面 ===================== -->
    <div v-else-if="stage === 'start'" class="screen start-screen">
      <div class="back-bar">
        <button class="back-link" @click="stage = 'menu'">
          <svg viewBox="0 0 20 20" width="15" height="15"><path d="M12.5 4.5L7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          返回菜单
        </button>
      </div>
      
      <div class="brand">
        <span class="dot red"></span>
        <span class="dot amber"></span>
        <span class="dot green"></span>
        <span class="dot blue"></span>
      </div>
      <h1 class="title">色盲色弱自测</h1>
      <p class="subtitle">基于《色盲检查图》第 6 版 · 共 {{ TOTAL_COUNT }} 题</p>
      <button class="stats-brief" @click="openStats">
        <div class="sb-item">
          <span class="sb-num">{{ statsSummary.count }}</span>
          <span class="sb-label">测试次数</span>
        </div>
        <div class="sb-divider"></div>
        <div class="sb-item">
          <span class="sb-num">{{ statsSummary.accuracy }}%</span>
          <span class="sb-label">总体正确率</span>
        </div>
        <div class="sb-divider"></div>
        <div class="sb-item">
          <span class="sb-num">{{ statsSummary.best }}%</span>
          <span class="sb-label">最佳单次</span>
        </div>
        <!-- <span class="sb-more">详情 ›</span> -->
      </button>
      <div class="card start-card">
        <p class="section-label">选择出题模式</p>
        <div class="mode-grid">
          <button
            v-for="m in MODES"
            :key="m.key"
            class="mode-card"
            :class="{ active: mode === m.key }"
            @click="mode = m.key"
          >
            <span class="mode-check" v-if="mode === m.key">
              <svg viewBox="0 0 20 20" width="14" height="14"><path d="M3 10.5l4.5 4.5L17 5.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
            <span class="mode-name">{{ m.name }}</span>
            <span class="mode-count">{{ m.count }} 题</span>
            <span class="mode-desc">{{ m.desc }}</span>
          </button>
        </div>

        <div class="timer-setting">
          <div class="ts-text">
            <span class="ts-title">倒计时模式</span>
            <span class="ts-desc">{{ timerEnabled ? '每题限时 15 秒,超时视为答错' : '关闭时不限时,慢慢作答' }}</span>
          </div>
          <button class="toggle" :class="{ on: timerEnabled }" aria-label="倒计时开关" @click="toggleTimer">
            <span class="toggle-knob"></span>
          </button>
        </div>

        <div class="intro">
          <p>请在自然光线下、距离屏幕约 60–80 厘米处作答。</p>
          <p>每张图下方有 <strong>6 个选项</strong>,凭第一直觉选择你看到的内容。</p>
        </div>

        <button class="btn btn-primary btn-lg" @click="startTest">
          开始测试
          <svg viewBox="0 0 20 20" width="18" height="18"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="stats-entry" @click="openStats">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>
          测试统计
        </button>
        <p class="disclaimer">本测试仅供自测参考,不能替代专业医学诊断</p>
      </div>
    </div>

    <!-- ===================== 测试统计界面 ===================== -->
    <div v-else-if="stage === 'stats'" class="screen stats-screen">
      <div class="back-bar">
        <button class="back-link" @click="stage = 'start'">
          <svg viewBox="0 0 20 20" width="15" height="15"><path d="M12.5 4.5L7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          返回
        </button>
      </div>
      <div class="card stats-card">
        <h2>测试统计</h2>
        <div class="stats-grid">
          <div class="stat-box">
            <span class="stat-num">{{ statsSummary.count }}</span>
            <span class="stat-label">测试次数</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">{{ statsSummary.totalQ }}</span>
            <span class="stat-label">累计答题</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">{{ statsSummary.accuracy }}%</span>
            <span class="stat-label">总体正确率</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">{{ statsSummary.best }}%</span>
            <span class="stat-label">最佳单次</span>
          </div>
        </div>

        <div v-if="statsRecords.length" class="history">
          <h3>最近记录</h3>
          <div class="history-list">
            <div v-for="(r, i) in statsRecords" :key="i" class="history-item">
              <span class="h-time">{{ formatTime(r.ts) }}</span>
              <span class="h-mode">{{ modeName(r.mode) }}</span>
              <span class="h-score" :class="scoreClass(r)">{{ r.correct }}/{{ r.total }}</span>
            </div>
          </div>
        </div>
        <p v-else class="no-data">暂无测试记录,快去完成一次测试吧</p>

        <button
          v-if="statsSummary.count"
          class="btn btn-danger"
          :class="{ armed: resetArmed }"
          @click="confirmReset"
        >{{ resetArmed ? '再点一次确认清空' : '清空统计数据' }}</button>
      </div>
    </div>

    <!-- ===================== 答题界面 ===================== -->
    <div v-else-if="stage === 'quiz'" class="screen quiz-screen">
      <header class="quiz-header">
        <button class="back-link" @click="quitQuiz">
          <svg viewBox="0 0 20 20" width="15" height="15"><path d="M12.5 4.5L7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          退出测试
        </button>
        <div class="progress-info">
          <span class="q-index">
            <span class="q-current">{{ currentIndex + 1 }}</span>
            <span class="q-total"> / {{ total }}</span>
          </span>
          <span class="q-mode">{{ currentModeName }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div v-if="timerEnabled" class="quiz-timer" :class="{ urgent: timeLeft <= 5 }">
          <span class="timer-num">{{ timeLeft }}s</span>
          <div class="timer-track">
            <div class="timer-fill" :style="{ width: (timeLeft / QUIZ_TIME) * 100 + '%' }"></div>
          </div>
        </div>
      </header>

      <main class="quiz-main" :key="currentIndex">
        <div class="plate-wrap" :class="{ shake: shaking }">
          <img
            :src="plateSrc"
            :alt="'色盲检查图 第' + (currentIndex + 1) + '题'"
            class="plate-img"
            draggable="false"
          />
          <transition name="fade">
            <div v-if="answered" class="plate-badge" :class="lastCorrect ? 'ok' : 'no'">
              {{ lastCorrect ? '✓ 正确' : '✗ 正确答案:' + ' ' + currentQuestion.answer }}
            </div>
          </transition>
        </div>

        <p class="question-text">请选出你在图中看到的内容</p>

        <div class="options-grid">
          <button
            v-for="opt in currentOptions"
            :key="opt"
            class="option-btn"
            :class="optionClass(opt)"
            :disabled="answered"
            @click="choose(opt)"
          >
            {{ opt }}
          </button>
        </div>
      </main>

      <footer class="quiz-footer">已答对 {{ correctCount }} 题</footer>
    </div>

    <!-- ===================== 结果界面 ===================== -->
    <div v-else class="screen result-screen">
      <div class="card result-card">
        <h2>测试完成</h2>
        <div class="score-circle" :class="scoreLevel">
          <div class="score-inner">
            <span class="score-num">{{ correctCount }}</span>
            <span class="score-total">/ {{ total }}</span>
          </div>
        </div>
        <p class="score-percent">正确率 {{ Math.round((correctCount / total) * 100) }}%</p>
        <p class="verdict">{{ verdictText }}</p>

        <div v-if="wrongList.length" class="wrong-section">
          <h3>答错的题目 · {{ wrongList.length }}</h3>
          <div class="wrong-list">
            <div v-for="item in wrongList" :key="item.index" class="wrong-item">
              <img :src="platePath(item.q.image)" :alt="'第' + (item.index + 1) + '题'" />
              <div class="wrong-info">
                <span class="wrong-no">第 {{ item.index + 1 }} 题</span>
                <span>你的选择:<em class="bad">{{ item.chosen ?? '超时未答' }}</em></span>
                <span>正确答案:<em class="good">{{ item.q.answer }}</em></span>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="all-right">全部答对,辨色力表现优秀!</p>

        <div class="result-actions">
          <button class="btn btn-primary" @click="restart">再测一次</button>
          <button class="btn btn-ghost" @click="stage = 'start'">返回</button>
        </div>
        <p class="disclaimer">如有疑虑,请到正规医疗机构进行色觉检查</p>
      </div>
    </div>

    <!-- ===================== 首次使用协议弹窗 ===================== -->
    <div v-if="showAgreement" class="agreement-overlay">
      <div class="agreement-dialog">
        <h2 class="agreement-title">使用协议</h2>
        <div class="agreement-body">
          <p>欢迎使用「色弱速记与自测」,使用前请仔细阅读以下内容:</p>
          <p>1. 本软件提供色觉速记学习与自测功能,仅供个人学习参考,不能替代专业医学诊断。</p>
          <p>2. 软件内的图片和答案均由网络收集整理,图片素材等版权归素材原作者所有。</p>
          <p>3. 本软件完全免费,软件版权归作者所有,仅限个人自测使用,禁止转卖或用于任何商业用途。</p>
          <p>4. 最后祝大家逢检必过。</p>
          <p>5. 点击「同意并继续」或继续使用本软件,即表示您已阅读并同意本协议的全部内容。</p>
        </div>
        <button class="btn btn-primary agreement-btn" @click="acceptAgreement">同意并继续</button>
      </div>
    </div>

    <!-- ===================== 图片放大查看层(支持双指/滚轮缩放,拖动平移,双击放大) ===================== -->
    <transition name="zoom-fade">
      <div
        v-if="studyZoomSrc"
        class="zoom-overlay"
        @click="onZoomOverlayClick"
        @pointerdown="onZoomPointerDown"
        @pointermove="onZoomPointerMove"
        @pointerup="onZoomPointerUp"
        @pointercancel="onZoomPointerUp"
        @wheel.prevent="onZoomWheel"
      >
        <img
          ref="zoomImgEl"
          :src="studyZoomSrc"
          class="zoom-img"
          :style="{ transform: `translate(${zoomTx}px, ${zoomTy}px) scale(${zoomScale})` }"
          alt="放大查看"
          draggable="false"
        />
        <button class="zoom-close" aria-label="关闭放大" @click.stop="closeZoom">×</button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { QUESTIONS, buildOptions, shuffle } from './data/questions.js'
import { STUDY_CATEGORIES, STUDY_ITEMS } from './data/study.js'
import { loadStats, addRecord, resetStats } from './data/stats.js'

const TOTAL_COUNT = QUESTIONS.length

const MODES = [
  { key: 'random10', name: '随机 10 题', count: 10, desc: '快速自测' },
  { key: 'random20', name: '随机 20 题', count: 20, desc: '标准自测' },
  { key: 'randomAll', name: '随机全部', count: TOTAL_COUNT, desc: '打乱顺序作答' },
  { key: 'fixed',    name: '固定顺序', count: TOTAL_COUNT, desc: '按原书顺序作答' },
]

const stage = ref('menu') // menu | start | study | quiz | result | stats
const mode = ref('random10')
const questions = ref([])
const currentIndex = ref(0)
const correctCount = ref(0)
const answered = ref(false)
const lastCorrect = ref(false)
const chosenOption = ref(null)
const shaking = ref(false)
const currentOptions = ref([])
const records = ref([]) // { index, chosen, correct }

// ---------- 倒计时 ----------
const QUIZ_TIME = 15 // 每题限时(秒)
const timerEnabled = ref(localStorage.getItem('cv_timer') === '1')
const timeLeft = ref(QUIZ_TIME)
let timerId = null

function stopTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

function startTimer() {
  stopTimer()
  if (!timerEnabled.value) return
  timeLeft.value = QUIZ_TIME
  timerId = setInterval(() => {
    if (answered.value) {
      stopTimer()
      return
    }
    timeLeft.value--
    if (timeLeft.value <= 0) {
      stopTimer()
      if (!answered.value) choose(null) // 超时按答错处理
    }
  }, 1000)
}

function quitQuiz() {
  stopTimer()
  stage.value = 'start'
}

function toggleTimer() {
  timerEnabled.value = !timerEnabled.value
  localStorage.setItem('cv_timer', timerEnabled.value ? '1' : '0')
}

// ---------- 学习模式 ----------
const studyCat = ref('easy')
const studyIndex = ref(0)
const studyView = ref('question') // question | original | detail
const studyList = ref([]) // 每次进入/切换分类时随机排序
const studyZoomSrc = ref('') // 点击放大的图片地址,空 = 关闭
const studySubCat = ref('all') // 特征对应子分类: all | num | animal | other
const FEATURE_SUBS = [
  { key: 'all', name: '全部' },
  { key: 'num', name: '数字' },
  { key: 'animal', name: '动物' },
  { key: 'other', name: '其它' },
]
const zoomScale = ref(1)
const zoomTx = ref(0)
const zoomTy = ref(0)
const zoomImgEl = ref(null)
const zoomPointers = new Map() // pointerId -> {x,y}
let zoomDragBase = null // 单指拖动基准 {px,py,tx,ty}
let zoomPinchBase = null // 双指捏合基准 {dist,mx,my,s,tx,ty}
let zoomMoved = false // 本次手势是否移动过,抑制误触关闭
let zoomLastTap = 0
let zoomLastTapX = 0
let zoomLastTapY = 0

function zoomReset() {
  zoomScale.value = 1
  zoomTx.value = 0
  zoomTy.value = 0
  zoomPointers.clear()
  zoomDragBase = null
  zoomPinchBase = null
  zoomMoved = false
}

function openZoom(src) {
  zoomReset()
  studyZoomSrc.value = src
}

function closeZoom() {
  studyZoomSrc.value = ''
  zoomReset()
}

function clampScale(s) {
  return Math.min(5, Math.max(1, s))
}

function clampPan() {
  const el = zoomImgEl.value
  if (!el) return
  if (zoomScale.value <= 1) {
    zoomTx.value = 0
    zoomTy.value = 0
    return
  }
  const r = el.getBoundingClientRect()
  const maxX = Math.max(0, (r.width - window.innerWidth) / 2)
  const maxY = Math.max(0, (r.height - window.innerHeight) / 2)
  zoomTx.value = Math.min(maxX, Math.max(-maxX, zoomTx.value))
  zoomTy.value = Math.min(maxY, Math.max(-maxY, zoomTy.value))
}

// 围绕屏幕点 (cx,cy) 缩放到 s
function applyZoomAround(s, cx, cy) {
  const kk = s / zoomScale.value
  const vwHalf = window.innerWidth / 2
  const vhHalf = window.innerHeight / 2
  zoomScale.value = s
  zoomTx.value = cx - vwHalf - kk * (cx - vwHalf - zoomTx.value)
  zoomTy.value = cy - vhHalf - kk * (cy - vhHalf - zoomTy.value)
  clampPan()
}

function toggleZoomAt(cx, cy) {
  if (zoomScale.value > 1.2) {
    zoomScale.value = 1
    zoomTx.value = 0
    zoomTy.value = 0
  } else {
    applyZoomAround(2.5, cx, cy)
  }
}

function onZoomPointerDown(e) {
  try {
    e.currentTarget.setPointerCapture?.(e.pointerId)
  } catch {}
  zoomPointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  zoomMoved = false
  const now = performance.now()
  if (now - zoomLastTap < 300 && Math.hypot(e.clientX - zoomLastTapX, e.clientY - zoomLastTapY) < 30) {
    toggleZoomAt(e.clientX, e.clientY)
    zoomMoved = true
    zoomLastTap = 0
  } else {
    zoomLastTap = now
    zoomLastTapX = e.clientX
    zoomLastTapY = e.clientY
  }
  if (zoomPointers.size === 1) {
    zoomDragBase = { px: e.clientX, py: e.clientY, tx: zoomTx.value, ty: zoomTy.value }
    zoomPinchBase = null
  } else if (zoomPointers.size === 2) {
    const [a, b] = [...zoomPointers.values()]
    zoomPinchBase = {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      mx: (a.x + b.x) / 2,
      my: (a.y + b.y) / 2,
      s: zoomScale.value,
      tx: zoomTx.value,
      ty: zoomTy.value,
    }
    zoomDragBase = null
    zoomMoved = true
  }
}

function onZoomPointerMove(e) {
  if (!zoomPointers.has(e.pointerId)) return
  zoomPointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (zoomPointers.size === 1 && zoomDragBase) {
    const dx = e.clientX - zoomDragBase.px
    const dy = e.clientY - zoomDragBase.py
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) zoomMoved = true
    zoomTx.value = zoomDragBase.tx + dx
    zoomTy.value = zoomDragBase.ty + dy
    clampPan()
  } else if (zoomPointers.size >= 2 && zoomPinchBase) {
    const [a, b] = [...zoomPointers.values()]
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    if (zoomPinchBase.dist > 0 && dist > 0) {
      const s = clampScale((zoomPinchBase.s * dist) / zoomPinchBase.dist)
      const kk = s / zoomPinchBase.s
      const vwHalf = window.innerWidth / 2
      const vhHalf = window.innerHeight / 2
      zoomScale.value = s
      zoomTx.value = mx - vwHalf - kk * (zoomPinchBase.mx - vwHalf - zoomPinchBase.tx)
      zoomTy.value = my - vhHalf - kk * (zoomPinchBase.my - vhHalf - zoomPinchBase.ty)
      clampPan()
    }
  }
}

function onZoomPointerUp(e) {
  zoomPointers.delete(e.pointerId)
  if (zoomPointers.size === 1) {
    const [p] = [...zoomPointers.values()]
    zoomDragBase = { px: p.x, py: p.y, tx: zoomTx.value, ty: zoomTy.value }
    zoomPinchBase = null
  } else if (zoomPointers.size === 0) {
    zoomDragBase = null
    zoomPinchBase = null
  }
}

function onZoomWheel(e) {
  const s = clampScale(zoomScale.value * (e.deltaY < 0 ? 1.15 : 1 / 1.15))
  applyZoomAround(s, e.clientX, e.clientY)
  zoomMoved = true
}

function onZoomOverlayClick() {
  if (zoomMoved) {
    zoomMoved = false
    return
  }
  closeZoom()
}

function shuffleStudy() {
  let list = STUDY_ITEMS.filter((i) => i.category === studyCat.value)
  if (studyCat.value === 'feature' && studySubCat.value !== 'all') {
    list = list.filter((i) => i.sub === studySubCat.value)
  }
  studyList.value = shuffle(list)
}
const studyItem = computed(() => studyList.value[studyIndex.value])

function studyPath(name) {
  return import.meta.env.BASE_URL + 'study/' + name
}

// 速记题目图 q_imageN.png → 测试原图 plates/imageN.jpeg
function studyOriginalPath(item) {
  const m = item.image.match(/^q_(image\d+)\.png$/)
  return m ? platePath(m[1] + '.jpeg') : null
}

// 简单一眼出的图无需对照原图,不提供原图视图
const hasStudyOriginal = computed(
  () => studyItem.value?.category !== 'easy' && !!studyOriginalPath(studyItem.value)
)

function subCount(sub) {
  return STUDY_ITEMS.filter((i) => i.category === 'feature' && (sub === 'all' || i.sub === sub)).length
}

function setSubCat(sub) {
  studySubCat.value = sub
  studyIndex.value = 0
  studyView.value = 'question'
  shuffleStudy()
}

function categoryCount(key) {
  return STUDY_ITEMS.filter((i) => i.category === key).length
}

function switchCategory(key) {
  studyCat.value = key
  studySubCat.value = 'all'
  studyIndex.value = 0
  studyView.value = 'question'
  shuffleStudy()
}

function enterStudy() {
  studyCat.value = 'easy'
  studyIndex.value = 0
  studyView.value = 'question'
  shuffleStudy()
  stage.value = 'study'
}

function prevStudy() {
  if (studyIndex.value > 0) {
    studyIndex.value--
    studyView.value = 'question'
  }
}

function nextStudy() {
  if (studyIndex.value < studyList.value.length - 1) {
    studyIndex.value++
    studyView.value = 'question'
  }
}

const total = computed(() => questions.value.length)
const currentQuestion = computed(() => questions.value[currentIndex.value])
const currentModeName = computed(() => MODES.find((m) => m.key === mode.value)?.name ?? '')
const plateSrc = computed(() => platePath(currentQuestion.value.image))
const progressPercent = computed(
  () => ((currentIndex.value + (answered.value ? 1 : 0)) / total.value) * 100
)

function platePath(name) {
  return import.meta.env.BASE_URL + 'plates/' + name
}

function buildQuestionSet() {
  switch (mode.value) {
    case 'random10':
      return shuffle(QUESTIONS).slice(0, 10)
    case 'random20':
      return shuffle(QUESTIONS).slice(0, 20)
    case 'randomAll':
      return shuffle(QUESTIONS)
    default:
      return [...QUESTIONS]
  }
}

function startTest() {
  questions.value = buildQuestionSet()
  currentIndex.value = 0
  correctCount.value = 0
  records.value = []
  loadQuestion()
  stage.value = 'quiz'
}

function loadQuestion() {
  answered.value = false
  lastCorrect.value = false
  chosenOption.value = null
  currentOptions.value = buildOptions(currentQuestion.value)
  startTimer()
}

function choose(opt) {
  if (answered.value) return
  answered.value = true
  stopTimer()
  chosenOption.value = opt
  const correct = opt === currentQuestion.value.answer
  lastCorrect.value = correct
  if (correct) correctCount.value++
  records.value.push({ index: currentIndex.value, chosen: opt, correct })
  if (!correct) {
    shaking.value = true
    setTimeout(() => (shaking.value = false), 400)
  }
  setTimeout(() => {
    if (currentIndex.value < total.value - 1) {
      currentIndex.value++
      loadQuestion()
    } else {
      // 测试完成,写入本地统计
      addRecord(mode.value, total.value, correctCount.value)
      statsData.value = loadStats()
      stage.value = 'result'
    }
  }, correct ? 550 : 1400)
}

function optionClass(opt) {
  if (!answered.value) return ''
  if (opt === currentQuestion.value.answer) return 'is-correct'
  if (opt === chosenOption.value) return 'is-wrong'
  return 'is-dim'
}

const wrongList = computed(() =>
  records.value
    .filter((r) => !r.correct)
    .map((r) => ({ ...r, q: questions.value[r.index] }))
)

const scoreLevel = computed(() => {
  const p = correctCount.value / total.value
  if (p >= 0.95) return 'lv-good'
  if (p >= 0.8) return 'lv-mid'
  return 'lv-bad'
})

const verdictText = computed(() => {
  const p = correctCount.value / total.value
  if (p === 1) return '太棒了!全部答对,辨色力正常。'
  if (p >= 0.95) return '表现优秀,辨色力基本正常。'
  if (p >= 0.8) return '少量图案辨认有误,建议休息后复测。'
  if (p >= 0.6) return '部分图案辨认困难,可能存在色弱倾向,建议复查。'
  return '较多图案无法正确辨认,建议尽快到专业机构检查色觉。'
})

function restart() {
  startTest()
}

// ---------- 测试统计 ----------
const statsData = ref(loadStats())
const resetArmed = ref(false)

const statsSummary = computed(() => {
  const rs = statsData.value.records
  const totalQ = rs.reduce((s, r) => s + r.total, 0)
  const correctQ = rs.reduce((s, r) => s + r.correct, 0)
  return {
    count: rs.length,
    totalQ,
    accuracy: totalQ ? Math.round((correctQ / totalQ) * 100) : 0,
    best: rs.length ? Math.max(...rs.map((r) => Math.round((r.correct / r.total) * 100))) : 0,
  }
})

const statsRecords = computed(() => [...statsData.value.records].reverse().slice(0, 30))

function openStats() {
  resetArmed.value = false
  statsData.value = loadStats()
  stage.value = 'stats'
}

function confirmReset() {
  if (!resetArmed.value) {
    resetArmed.value = true
    setTimeout(() => (resetArmed.value = false), 3000)
    return
  }
  resetStats()
  statsData.value = { records: [] }
  resetArmed.value = false
}

function modeName(key) {
  return MODES.find((m) => m.key === key)?.name ?? key
}

function formatTime(ts) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function scoreClass(r) {
  const p = Math.round((r.correct / r.total) * 100)
  if (p >= 95) return 'good'
  if (p >= 80) return 'mid'
  return 'bad'
}

// ---------- 首次使用协议 ----------
const AGREEMENT_KEY = 'cv_agreement_v1'
const showAgreement = ref(!localStorage.getItem(AGREEMENT_KEY))

function acceptAgreement() {
  localStorage.setItem(AGREEMENT_KEY, '1')
  showAgreement.value = false
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
  color: #1f2d3d;
  -webkit-font-smoothing: antialiased;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(1200px 500px at 80% -10%, #dbeafe 0%, transparent 55%),
    radial-gradient(900px 420px at -10% 30%, #e0f2f1 0%, transparent 50%),
    linear-gradient(180deg, #f6f9fd 0%, #eef2f7 100%);
}

.screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 16px 56px;
}

.card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 22px;
  box-shadow: 0 18px 50px rgba(43, 76, 126, 0.12);
  padding: 34px 32px;
  width: 100%;
  text-align: center;
}

/* ---------- 开始页 ---------- */
.brand {
  display: flex;
  gap: 9px;
  margin-bottom: 16px;
}

.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: inset -2px -3px 4px rgba(0, 0, 0, 0.15);
}

.dot.red { background: #e0533d; }
.dot.amber { background: #f0a23c; }
.dot.green { background: #4caf7d; }
.dot.blue { background: #3f8ef7; }

.title {
  font-size: 34px;
  letter-spacing: 4px;
  font-weight: 800;
  background: linear-gradient(90deg, #1d4ed8, #0d9488);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.subtitle {
  color: #7a8a99;
  font-size: 14px;
  margin: 8px 0 26px;
  letter-spacing: 1px;
}

.start-card {
  max-width: 660px;
}

.section-label {
  text-align: left;
  font-size: 14px;
  font-weight: 700;
  color: #45556b;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 22px;
}

.mode-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  cursor: pointer;
  text-align: left;
  transition: all 0.18s ease;
}

.mode-card:hover {
  border-color: #b6ccf5;
  transform: translateY(-2px);
}

.mode-card.active {
  border-color: #2f6fed;
  background: linear-gradient(180deg, #eef4ff 0%, #f7faff 100%);
  box-shadow: 0 8px 20px rgba(47, 111, 237, 0.15);
}

.mode-check {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #2f6fed;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-name {
  font-size: 16px;
  font-weight: 700;
  color: #22314a;
}

.mode-count {
  font-size: 22px;
  font-weight: 800;
  color: #2f6fed;
  line-height: 1.1;
}

.mode-desc {
  font-size: 12px;
  color: #8a99ad;
}

/* 手机上保持四宫格并压缩卡片 */
@media (max-width: 520px) {
  .mode-grid {
    gap: 8px;
    margin-bottom: 16px;
  }

  .mode-card {
    padding: 12px 10px;
    border-radius: 12px;
    gap: 2px;
  }

  .mode-name {
    font-size: 14px;
  }

  .mode-count {
    font-size: 18px;
  }

  .mode-desc {
    font-size: 11px;
  }

  .mode-check {
    top: 7px;
    right: 7px;
    width: 18px;
    height: 18px;
  }
}

/* ---------- 倒计时开关 ---------- */
.timer-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  background: #f4f7fb;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 13px 18px;
  margin-bottom: 14px;
}

.ts-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}

.ts-title {
  font-size: 15px;
  font-weight: 700;
  color: #33455c;
}

.ts-desc {
  font-size: 12.5px;
  color: #8494a7;
}

.toggle {
  position: relative;
  flex-shrink: 0;
  width: 52px;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: #c3cedb;
  cursor: pointer;
  transition: background 0.2s ease;
}

.toggle.on {
  background: #0d9488;
}

.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: left 0.2s ease;
}

.toggle.on .toggle-knob {
  left: 25px;
}

.intro {
  text-align: left;
  background: #f4f7fb;
  border: 1px dashed #d5deea;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 24px;
  line-height: 1.9;
  font-size: 14px;
  color: #5c6f84;
}

.btn {
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  padding: 13px 40px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn:active {
  transform: scale(0.97);
}

.btn-lg {
  font-size: 17px;
  padding: 14px 52px;
}

.btn-primary {
  background: linear-gradient(135deg, #2f6fed 0%, #4f8cf7 100%);
  color: #fff;
  box-shadow: 0 8px 20px rgba(47, 111, 237, 0.35);
}

.btn-primary:hover {
  box-shadow: 0 10px 26px rgba(47, 111, 237, 0.45);
  transform: translateY(-1px);
}

.btn-ghost {
  background: #eef2f7;
  color: #45556b;
}

.disclaimer {
  margin-top: 20px;
  font-size: 12px;
  color: #9aa8b8;
}

.copyright {
  margin-top: 10px;
  font-size: 12px;
  color: #9aa8b8;
  text-align: center;
}

/* ---------- 答题页 ---------- */
.quiz-screen {
  max-width: 740px;
  margin: 0 auto;
  width: 100%;
}

.quiz-header {
  width: 100%;
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.q-current {
  font-size: 26px;
  font-weight: 800;
  color: #22314a;
}

.q-total {
  font-size: 15px;
  color: #8a99ad;
  font-weight: 600;
}

.q-mode {
  font-size: 13px;
  color: #2f6fed;
  background: #e6efff;
  border-radius: 99px;
  padding: 4px 12px;
  font-weight: 600;
}

.progress-bar {
  height: 10px;
  background: #dde5ee;
  border-radius: 99px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2f6fed, #63b3ff);
  border-radius: 99px;
  transition: width 0.35s ease;
}

/* ---------- 答题倒计时条 ---------- */
.quiz-timer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.timer-num {
  flex-shrink: 0;
  min-width: 34px;
  font-size: 14px;
  font-weight: 800;
  color: #0d9488;
  font-variant-numeric: tabular-nums;
}

.timer-track {
  flex: 1;
  height: 8px;
  background: #dde5ee;
  border-radius: 99px;
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #14b8a6, #2dd4bf);
  border-radius: 99px;
  transition: width 0.95s linear;
}

.quiz-timer.urgent .timer-num {
  color: #e11d48;
  animation: timer-blink 1s infinite;
}

.quiz-timer.urgent .timer-fill {
  background: linear-gradient(90deg, #e11d48, #fb7185);
}

@keyframes timer-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.quiz-main {
  width: 100%;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 22px;
  box-shadow: 0 18px 50px rgba(43, 76, 126, 0.12);
  padding: 28px 26px 32px;
  text-align: center;
  animation: slide-in 0.28s ease;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.plate-wrap {
  position: relative;
  display: inline-block;
  max-width: 500px;
  width: 100%;
}

.plate-img {
  width: 100%;
  border-radius: 14px;
  border: 1px solid #e6ebf1;
  box-shadow: 0 8px 24px rgba(43, 76, 126, 0.12);
  user-select: none;
  display: block;
}

.plate-img.zoomable {
  cursor: zoom-in;
}

/* ---------- 图片放大查看层 ---------- */
.zoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(10, 14, 24, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  cursor: zoom-out;
  touch-action: none; /* 手势全部自行接管(捏合/拖动/滚轮) */
  overscroll-behavior: contain;
}

.zoom-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  transform-origin: center center;
  will-change: transform;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
}

.zoom-close {
  position: absolute;
  top: max(14px, env(safe-area-inset-top));
  right: max(14px, env(safe-area-inset-right));
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 3px;
}

.zoom-close:active {
  background: rgba(255, 255, 255, 0.28);
}

.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: opacity 0.18s ease;
}

.zoom-fade-enter-from,
.zoom-fade-leave-to {
  opacity: 0;
}

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

.plate-badge.ok { background: #22a15f; }
.plate-badge.no { background: #e0533d; }

.fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from { opacity: 0; transform: translateY(-6px); }

.question-text {
  margin: 22px 0 16px;
  font-size: 16px;
  font-weight: 700;
  color: #34455a;
  letter-spacing: 1px;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 560px) {
  .options-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.option-btn {
  padding: 15px 10px;
  font-size: 16px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  color: #2b3a4d;
  cursor: pointer;
  transition: all 0.18s ease;
  font-weight: 600;
  text-align: center;
}

.option-btn:hover:not(:disabled) {
  border-color: #2f6fed;
  background: #eef4ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(47, 111, 237, 0.15);
}

.option-btn:disabled {
  cursor: default;
}

.option-btn.is-correct {
  border-color: #22a15f;
  background: #e8f7ee;
  color: #177a46;
}

.option-btn.is-wrong {
  border-color: #e0533d;
  background: #fdecea;
  color: #c23b27;
}

.option-btn.is-dim {
  opacity: 0.45;
}

.shake {
  animation: shake 0.4s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-4px); }
}

.quiz-footer {
  margin-top: 16px;
  font-size: 14px;
  color: #7a8a99;
  font-weight: 600;
}

/* ---------- 结果页 ---------- */
.result-card {
  max-width: 720px;
}

.result-card h2 {
  font-size: 26px;
  margin-bottom: 22px;
  letter-spacing: 2px;
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

.score-circle.lv-good { background: linear-gradient(135deg, #22a15f, #5fce7f); }
.score-circle.lv-mid { background: linear-gradient(135deg, #f0a23c, #f7c46c); }
.score-circle.lv-bad { background: linear-gradient(135deg, #e0533d, #ef7a66); }

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

.all-right {
  color: #177a46;
  font-weight: 700;
  margin: 10px 0 26px;
}

.wrong-section {
  text-align: left;
  margin-bottom: 28px;
}

.wrong-section h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #34455a;
}

.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
}

.wrong-item {
  display: flex;
  gap: 14px;
  align-items: center;
  background: #f7f9fc;
  border: 1px solid #e8edf4;
  border-radius: 12px;
  padding: 10px 14px;
}

.wrong-item img {
  width: 96px;
  height: auto;
  border-radius: 8px;
  flex-shrink: 0;
}

.wrong-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #45556b;
}

.wrong-no {
  font-weight: 700;
  color: #2b3a4d;
}

.wrong-info em {
  font-style: normal;
  font-weight: 700;
}

em.bad { color: #c23b27; }
em.good { color: #177a46; }

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

/* ---------- 首页菜单 ---------- */
.menu-screen {
  justify-content: center;
}

.menu-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  width: 100%;
  max-width: 620px;
}

@media (max-width: 520px) {
  .menu-cards {
    grid-template-columns: 1fr;
  }
}

.menu-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 34px 22px 28px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 40px rgba(43, 76, 126, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 48px rgba(43, 76, 126, 0.16);
}

.menu-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.menu-card.study .menu-icon {
  background: linear-gradient(135deg, #0d9488, #2dd4bf);
  box-shadow: 0 8px 18px rgba(13, 148, 136, 0.35);
}

.menu-card.quiz .menu-icon {
  background: linear-gradient(135deg, #2f6fed, #63b3ff);
  box-shadow: 0 8px 18px rgba(47, 111, 237, 0.35);
}

.menu-name {
  font-size: 19px;
  font-weight: 800;
  color: #22314a;
  letter-spacing: 1px;
}

.menu-desc {
  font-size: 13px;
  color: #8a99ad;
  line-height: 1.8;
}

/* ---------- 学习模式 ---------- */
.study-screen {
  max-width: 740px;
  margin: 0 auto;
  width: 100%;
}

.study-header {
  width: 100%;
  margin-bottom: 18px;
}

/* 返回按钮容器:与内容区同宽居中,胶囊靠左 */
.back-bar {
  width: 100%;
  max-width: 660px;
  margin: 0 auto 25px;
  display: flex;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.85);
  color: #45556b;
  font-size: 14px;
  font-weight: 700;
  padding: 8px 18px 8px 13px;
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(43, 76, 126, 0.08);
  cursor: pointer;
  transition: all 0.18s ease;
}

.back-link:hover {
  color: #2f6fed;
  border-color: #b6ccf5;
  transform: translateX(-3px);
  box-shadow: 0 8px 20px rgba(43, 76, 126, 0.14);
}

.back-link svg {
  flex-shrink: 0;
}

.study-header .back-link,
.quiz-header .back-link {
  margin-bottom: 25px;
}

.study-tabs {
  display: flex;
  gap: 10px;
}

.study-tab {
  flex: 1;
  padding: 11px 8px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.85);
  color: #45556b;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.study-tab em {
  font-style: normal;
  font-size: 12px;
  color: #9aa8b8;
  margin-left: 4px;
}

.study-tab.active {
  border-color: #0d9488;
  background: linear-gradient(180deg, #ecfdf9 0%, #f4fffc 100%);
  color: #0d9488;
  box-shadow: 0 6px 16px rgba(13, 148, 136, 0.15);
}

.study-tab.active em {
  color: #0d9488;
}

.study-subtabs {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
}

.sub-tab {
  padding: 7px 16px;
  border-radius: 999px;
  border: 1.5px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.85);
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.sub-tab em {
  font-style: normal;
  font-size: 11px;
  color: #9aa8b8;
  margin-left: 2px;
}

.sub-tab.active {
  border-color: #0d9488;
  background: #0d9488;
  color: #fff;
}

.sub-tab.active em {
  color: rgba(255, 255, 255, 0.75);
}

.study-main {
  padding-bottom: 26px;
}

.study-info {
  margin: 22px auto 0;
  max-width: 500px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.study-answer-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.study-label {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: #0d9488;
  background: #e6f7f3;
  border-radius: 6px;
  padding: 3px 8px;
  letter-spacing: 1px;
}

.study-answer {
  font-size: 24px;
  font-weight: 800;
  color: #22314a;
}

.study-tip {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: #f4f7fb;
  border-left: 4px solid #0d9488;
  border-radius: 10px;
  padding: 13px 16px;
}

.study-tip p {
  font-size: 15px;
  line-height: 1.8;
  color: #45556b;
}

.study-nav {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.nav-btn {
  padding: 10px 22px;
  font-size: 15px;
}

.btn-ghost.nav-btn {
  margin-left: 0;
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: default;
  transform: none;
  box-shadow: none;
}

.study-progress {
  font-size: 14px;
  font-weight: 700;
  color: #7a8a99;
}

/* ---------- 题目/解析切换 ---------- */
.view-switch {
  display: inline-flex;
  gap: 4px;
  background: #eef2f7;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 16px;
}

.vs-btn {
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 700;
  color: #7a8a99;
  padding: 7px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.vs-btn.active {
  background: #fff;
  color: #0d9488;
  box-shadow: 0 2px 8px rgba(43, 76, 126, 0.12);
}

.detail-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.detail-wrap .plate-img {
  width: auto;
  max-width: 100%;
  margin: 0 auto;
}

/* ---------- 测试统计 ---------- */
.stats-entry {
  /*display: inline-flex;*/
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  border: none;
  background: none;
  color: #2f6fed;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: block;
  text-align: center;
  margin: 20px auto;
}

.stats-entry:hover {
  text-decoration: underline;
}

/* 模式选择页顶部统计速览条 */
.stats-brief {
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
  max-width: 660px;
  padding: 12px 22px;
  margin-bottom: 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 24px rgba(43, 76, 126, 0.08);
  cursor: pointer;
  transition: all 0.18s ease;
  justify-content: space-around;
}

.stats-brief:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(43, 76, 126, 0.13);
}

.sb-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 64px;
}

.sb-num {
  font-size: 20px;
  font-weight: 800;
  color: #22314a;
}

.sb-label {
  font-size: 11px;
  color: #8a99ad;
}

.sb-divider {
  width: 1px;
  height: 28px;
  background: #e2e8f0;
}

.sb-more {
  margin-left: auto;
  font-size: 13px;
  font-weight: 700;
  color: #2f6fed;
}

.stats-card {
  max-width: 640px;
}

.stats-card h2 {
  font-size: 24px;
  margin-bottom: 22px;
  letter-spacing: 2px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

@media (max-width: 520px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-box {
  background: #f4f7fb;
  border-radius: 12px;
  padding: 18px 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-num {
  font-size: 26px;
  font-weight: 800;
  color: #22314a;
}

.stat-label {
  font-size: 12px;
  color: #8a99ad;
}

.history {
  text-align: left;
  margin-bottom: 24px;
}

.history h3 {
  font-size: 15px;
  margin-bottom: 10px;
  color: #34455a;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f7f9fc;
  border: 1px solid #e8edf4;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
}

.h-time {
  color: #8a99ad;
}

.h-mode {
  font-weight: 700;
  color: #45556b;
}

.h-score {
  font-weight: 800;
}

.h-score.good { color: #177a46; }
.h-score.mid { color: #b7791f; }
.h-score.bad { color: #c23b27; }

.no-data {
  color: #9aa8b8;
  font-size: 14px;
  margin-bottom: 22px;
}

.btn-danger {
  background: #fdecea;
  color: #c23b27;
}

.btn-danger:hover {
  background: #fbdad6;
}

.btn-danger.armed {
  background: #e0533d;
  color: #fff;
}

/* ---------- 首次使用协议弹窗 ---------- */
.agreement-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(23, 34, 51, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.agreement-dialog {
  width: 100%;
  max-width: 460px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  padding: 26px 24px 22px;
  animation: pop-in 0.25s ease;
}

@keyframes pop-in {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

.agreement-title {
  font-size: 20px;
  text-align: center;
  letter-spacing: 2px;
  margin-bottom: 14px;
  color: #22314a;
}

.agreement-body {
  overflow-y: auto;
  background: #f4f7fb;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 13.5px;
  line-height: 2;
  color: #45556b;
  text-align: left;
}

.agreement-body p + p {
  margin-top: 6px;
}

.agreement-btn {
  width: 100%;
  justify-content: center;
  margin-top: 16px;
}
</style>
