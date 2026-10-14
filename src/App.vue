<template>
  <div class="app">
    <!-- ===================== 首页菜单 ===================== -->
    <div v-if="stage === 'menu'" class="screen menu-screen">
      <div class="brand">
        <!-- <span class="dot red"></span>
        <span class="dot amber"></span>
        <span class="dot green"></span>
        <span class="dot blue"></span> -->
        <img
          class="brand-logo"
          :src="BRAND_LOGO_SRC"
          alt="色盲色弱助手 logo"
          draggable="false"
        />
      </div>
      <h1 class="title">色盲色弱助手</h1>
      <p class="subtitle">
        基于《色盲检查图》第 6 版 · 共 {{ TOTAL_COUNT }} 题
      </p>

      <div class="menu-cards">
        <button class="menu-card study" @click="enterStudy">
          <span class="menu-icon">
            <svg
              viewBox="0 0 24 24"
              width="30"
              height="30"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z"
              />
              <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
              <path d="M9 8h7M9 12h5" />
            </svg>
          </span>
          <span class="menu-name">技巧记图</span>
          <span class="menu-desc"
            >逐图记忆技巧讲解<br />简单 13 · 特征 26 · 数字 9</span
          >
        </button>
        <button class="menu-card quiz" @click="stage = 'start'">
          <span class="menu-icon">
            <svg
              viewBox="0 0 24 24"
              width="30"
              height="30"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 11l3 3L22 4" />
              <path
                d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
              />
            </svg>
          </span>
          <span class="menu-name">体检模拟</span>
          <span class="menu-desc"
            >模拟体检自测<br />固定顺序 · 随机 10 / 20 / 全部</span
          >
        </button>
      </div>
      <p class="disclaimer">本软件仅供自测学习使用，不能替代专业医学诊断</p>
      <p class="copyright">@Copyright 来杯橙汁/Ikarows 2026 v1.4.0</p>
    </div>

    <!-- ===================== 学习模式 ===================== -->
    <div v-else-if="stage === 'study'" class="screen study-screen">
      <header class="study-header">
        <button class="back-link" @click="stage = 'menu'">
          <svg viewBox="0 0 20 20" width="15" height="15">
            <path
              d="M12.5 4.5L7 10l5.5 5.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
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
          >
            {{ s.name }} <em>{{ subCount(s.key) }}</em>
          </button>
        </div>
      </header>

      <main class="quiz-main study-main" :key="studyCat + '-' + studyIndex">
        <div
          v-if="hasStudyOriginal || studyItem.details?.length"
          class="view-switch"
        >
          <button
            v-if="hasStudyOriginal"
            class="vs-btn"
            :class="{ active: studyView === 'original' }"
            @click="studyView = 'original'"
          >
            原图
          </button>
          <button
            class="vs-btn"
            :class="{ active: studyView === 'question' }"
            @click="studyView = 'question'"
          >
            技巧图
          </button>
          <button
            v-if="studyItem.details?.length"
            class="vs-btn"
            :class="{ active: studyView === 'detail' }"
            @click="studyView = 'detail'"
          >
            答案解析图
          </button>
        </div>

        <div class="plate-wrap" v-if="studyView === 'question'">
          <img
            :src="studyQuestionSrc"
            :alt="'学习图 ' + (studyIndex + 1)"
            class="plate-img zoomable"
            draggable="false"
            @error="retryImg"
            @click="openZoom(studyQuestionSrc)"
          />
        </div>
        <div
          class="plate-wrap"
          v-else-if="studyView === 'original' && hasStudyOriginal"
        >
          <img
            :src="studyOriginalPath(studyItem)"
            :alt="'原图'"
            class="plate-img zoomable"
            draggable="false"
            @error="retryImg"
            @click="openZoom(studyOriginalPath(studyItem))"
          />
        </div>
        <div
          class="plate-wrap detail-wrap"
          v-else-if="studyView === 'detail' && studyItem.details?.length"
        >
          <img
            v-for="d in studyItem.details"
            :key="d"
            :src="studyPath(d)"
            :alt="'答案解析图'"
            class="plate-img zoomable"
            draggable="false"
            @error="retryImg"
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
            <p>{{ studyItem.tip || "一眼就能看出,无需背诵。" }}</p>
          </div>
        </div>

        <div class="study-nav">
          <button
            class="btn btn-ghost nav-btn"
            :disabled="studyIndex === 0"
            @click="prevStudy"
          >
            ‹ 上一张
          </button>
          <span class="study-progress"
            >{{ studyIndex + 1 }} / {{ studyList.length }}</span
          >
          <button
            class="btn btn-primary nav-btn"
            :disabled="studyIndex === studyList.length - 1"
            @click="nextStudy"
          >
            下一张 ›
          </button>
        </div>
      </main>
    </div>

    <!-- ===================== 测试设置界面 ===================== -->
    <div v-else-if="stage === 'start'" class="screen start-screen">
      <div class="back-bar">
        <button class="back-link" @click="stage = 'menu'">
          <svg viewBox="0 0 20 20" width="15" height="15">
            <path
              d="M12.5 4.5L7 10l5.5 5.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          返回菜单
        </button>
      </div>

      <div class="brand">
        <img
          class="brand-logo"
          :src="BRAND_LOGO_SRC"
          alt="色盲色弱助手 logo"
          draggable="false"
        />
      </div>
      <h1 class="title">色盲色弱自测</h1>
      <p class="subtitle">
        基于《色盲检查图》第 6 版 · 共 {{ TOTAL_COUNT }} 题
      </p>

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

      <div class="quick-entries">
        <button class="stats-entry" @click="openStats">
          <span class="se-icon">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
            </svg>
          </span>
          <span class="se-text">
            <span class="se-title">测试结果</span>
            <span class="se-desc">查看历次成绩与答题统计</span>
          </span>
          <svg class="se-arrow" viewBox="0 0 20 20" width="14" height="14">
            <path
              d="M7.5 4.5L13 10l-5.5 5.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          v-if="wrongPlateStats.length"
          class="stats-entry wb"
          @click="openWrongBook"
        >
          <span class="se-icon se-icon-warn">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 9v4M12 17h.01" />
              <path
                d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
              />
            </svg>
          </span>
          <span class="se-text">
            <span class="se-title">常错图</span>
            <span class="se-desc"
              >{{ wrongPlateStats.length }} 张易错图待复习</span
            >
          </span>
          <svg class="se-arrow" viewBox="0 0 20 20" width="14" height="14">
            <path
              d="M7.5 4.5L13 10l-5.5 5.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

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
              <svg viewBox="0 0 20 20" width="14" height="14">
                <path
                  d="M3 10.5l4.5 4.5L17 5.5"
                  fill="none"
                  stroke="#fff"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span class="mode-name">{{ m.name }}</span>
            <span class="mode-count">{{ m.count }} 题</span>
            <span class="mode-desc">{{ m.desc }}</span>
          </button>
        </div>

        <div class="timer-setting">
          <div class="ts-text">
            <span class="ts-title">倒计时模式</span>
            <span class="ts-desc">{{
              timerEnabled
                ? "每题限时 15 秒,超时视为答错"
                : "关闭时不限时,慢慢作答"
            }}</span>
          </div>
          <button
            class="toggle"
            :class="{ on: timerEnabled }"
            aria-label="倒计时开关"
            @click="toggleTimer"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>

        <!-- <div class="intro">
          <p>请在自然光线下、距离屏幕约 60–80 厘米处作答。</p>
          <p>每张图下方有 <strong>6 个选项</strong>,凭第一直觉选择你看到的内容。</p>
        </div> -->

        <button class="btn btn-primary btn-lg" @click="startTest">
          开始测试
          <svg viewBox="0 0 20 20" width="18" height="18">
            <path
              d="M4 10h11M11 5l5 5-5 5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <p class="disclaimer">本测试仅供自测参考,不能替代专业医学诊断</p>
      </div>
    </div>

    <!-- ===================== 测试统计界面 ===================== -->
    <div v-else-if="stage === 'stats'" class="screen stats-screen">
      <div class="back-bar">
        <button class="back-link" @click="stage = 'start'">
          <svg viewBox="0 0 20 20" width="15" height="15">
            <path
              d="M12.5 4.5L7 10l5.5 5.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
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

        <button
          v-if="statsSummary.count"
          class="wrongbook-entry"
          @click="
            wrongBookBack = 'stats';
            stage = 'wrongBook';
          "
        >
          <span class="we-icon">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 9v4M12 17h.01" />
              <path
                d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
              />
            </svg>
          </span>
          <span class="we-text">
            <span class="we-title">常错图</span>
            <span class="we-desc">按答错次数排序,重点复习易错图</span>
          </span>
          <span class="we-count">{{ wrongPlateStats.length }}</span>
          <svg class="we-arrow" viewBox="0 0 20 20" width="14" height="14">
            <path
              d="M7.5 4.5L13 10l-5.5 5.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <div v-if="statsRecords.length" class="history">
          <h3>最近记录</h3>
          <div class="history-list" :key="historyPage">
            <div
              v-for="r in pagedRecords"
              :key="r.ts"
              class="history-item"
              :class="{ clickable: r.wrong && r.wrong.length }"
              @click="openRecord(r)"
            >
              <div class="h-main">
                <span class="h-time">{{ formatTime(r.ts) }}</span>
                <span class="h-sub"
                  >{{ modeName(r.mode) }} · 答对 {{ r.correct }}/{{ r.total
                  }}<template v-if="r.wrong && r.wrong.length">
                    · 错 {{ r.wrong.length }} 题</template
                  ></span
                >
              </div>
              <span class="h-score" :class="scoreClass(r)"
                >{{ recordScore(r) }}分</span
              >
              <svg
                v-if="r.wrong && r.wrong.length"
                class="h-arrow"
                viewBox="0 0 20 20"
                width="14"
                height="14"
              >
                <path
                  d="M7.5 4.5L13 10l-5.5 5.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
          <div v-if="historyTotalPages > 1" class="history-pager">
            <button
              class="pager-btn"
              :disabled="historyPage <= 1"
              @click="setPage(historyPage - 1)"
            >
              上一页
            </button>
            <span class="pager-info"
              >{{ historyPage }} / {{ historyTotalPages }}</span
            >
            <button
              class="pager-btn"
              :disabled="historyPage >= historyTotalPages"
              @click="setPage(historyPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
        <p v-else class="no-data">暂无测试记录,快去完成一次测试吧</p>

        <button
          v-if="statsSummary.count"
          class="btn btn-danger"
          :class="{ armed: resetArmed }"
          @click="confirmReset"
        >
          {{ resetArmed ? "再点一次确认清空" : "清空统计数据" }}
        </button>
      </div>
    </div>

    <!-- ===================== 历史记录详情(回看答错的图) ===================== -->
    <div v-else-if="stage === 'recordDetail'" class="screen record-screen">
      <div class="back-bar">
        <button class="back-link" @click="stage = 'stats'">
          <svg viewBox="0 0 20 20" width="15" height="15">
            <path
              d="M12.5 4.5L7 10l5.5 5.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          返回统计
        </button>
      </div>
      <div class="card record-card" v-if="activeRecord">
        <h2>测试详情</h2>
        <div class="rec-summary">
          <div class="rec-score" :class="scoreClass(activeRecord)">
            {{ recordScore(activeRecord) }}<span>分</span>
          </div>
          <div class="rec-meta">
            <span class="rm-time">{{ formatTime(activeRecord.ts) }}</span>
            <span
              >{{ modeName(activeRecord.mode) }} · 答对
              {{ activeRecord.correct }}/{{ activeRecord.total }}</span
            >
          </div>
        </div>

        <div v-if="activeWrong.length" class="wrong-section">
          <h3>答错的图 · {{ activeWrong.length }}</h3>
          <div class="wrong-list">
            <div v-for="(w, i) in activeWrong" :key="i" class="wrong-item">
              <img
                :src="platePath(w.image)"
                :alt="'错图 ' + (i + 1)"
                class="zoomable"
                draggable="false"
                @error="retryImg"
                @click="openQuizZoom(w.image)"
              />
              <div class="wrong-info">
                <span class="wrong-no">第 {{ w.no }} 题</span>
                <span
                  >你的选择:<em class="bad">{{
                    w.chosen ?? "超时未答"
                  }}</em></span
                >
                <span
                  >正确答案:<em class="good">{{ w.answer }}</em></span
                >
              </div>
            </div>
          </div>
        </div>
        <p v-else class="all-right">本次全部答对,没有错图</p>
      </div>
    </div>

    <!-- ===================== 常错图排行 ===================== -->
    <div v-else-if="stage === 'wrongBook'" class="screen wrongbook-screen">
      <div class="back-bar">
        <button class="back-link" @click="stage = wrongBookBack">
          <svg viewBox="0 0 20 20" width="15" height="15">
            <path
              d="M12.5 4.5L7 10l5.5 5.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {{ wrongBookBack === "start" ? "返回菜单" : "返回统计" }}
        </button>
      </div>
      <div class="card wrongbook-card">
        <h2>常错图</h2>
        <p class="wb-desc">
          共 {{ wrongPlateStats.length }} 张易错图 · 按答错次数排序 · 连对 2
          次自动移出
        </p>
        <button
          v-if="wrongPlateStats.length"
          class="btn drill-btn"
          @click="startWrongDrill"
        >
          错图针对测试
          <svg viewBox="0 0 20 20" width="15" height="15">
            <path
              d="M4 10h11M11 5l5 5-5 5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <div v-if="wrongPlateStats.length" class="wb-grid">
          <div v-for="w in wrongPlateStats" :key="w.image" class="wb-item">
            <div class="wb-imgwrap">
              <img
                :src="platePath(w.image)"
                :alt="w.image"
                class="zoomable"
                draggable="false"
                @error="retryImg"
                @click="openQuizZoom(w.image)"
              />
              <span class="wb-count">错 {{ w.count }} 次</span>
            </div>
            <span class="wb-answer">答案:{{ answerOf(w.image) }}</span>
          </div>
        </div>
        <p v-else class="no-data">还没有答错的图,继续保持!</p>
      </div>
    </div>

    <!-- ===================== 答题界面（仿真体检机·左右全屏） ===================== -->
    <div
      v-else-if="stage === 'quiz'"
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
          <p class="quiz-loading-text">设备自检中…</p>
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
                        v-if="timerEnabled"
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
            v-if="timerEnabled"
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
        <p class="score-percent">
          正确率 {{ Math.round((correctCount / total) * 100) }}%
        </p>
        <p class="verdict">{{ verdictText }}</p>

        <div v-if="wrongList.length" class="wrong-section">
          <h3>答错的题目 · {{ wrongList.length }}</h3>
          <div class="wrong-list">
            <div v-for="item in wrongList" :key="item.index" class="wrong-item">
              <img
                :src="platePath(item.q.image)"
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
          <p>欢迎使用「色盲色弱助手」，使用前请仔细阅读以下内容:</p>
          <p>
            <strong
              >1.
              软件版权归开发者本人（来杯橙汁/Ikarows）所有，仅限个人自测使用，禁止转卖或用于任何商业用途，否则将追究相关法律责任。</strong
            >
          </p>
          <p>2. 本软件提供色觉速记学习与自测功能，仅供个人学习。</p>
          <p>
            3. 软件内的第六版辨色图由收集整理，图片素材等版权归图片原作者所有。
          </p>
          <p>4. 最后祝大家逢检必过。</p>
          <p>
            5.
            点击「同意并继续」或继续使用本软件，即表示您已阅读并同意本协议的全部内容。
          </p>
        </div>
        <button class="btn btn-primary agreement-btn" @click="acceptAgreement">
          同意并继续
        </button>
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
        <!-- 学习关联切换:错题图放大时可切原图/技巧图/解析图
             pointer 事件全部截断,tab 点击不进入底层缩放手势/关闭逻辑 -->
        <div
          v-if="zoomStudyItem"
          class="zoom-tabs"
          @click.stop
          @pointerdown.stop
          @pointerup.stop
          @pointercancel.stop
        >
          <button
            v-for="t in zoomTabs"
            :key="t.key"
            class="zoom-tab"
            :class="{ active: zoomView === t.key }"
            @click="zoomShowView(t.key)"
          >
            {{ t.label }}
          </button>
        </div>
        <img
          ref="zoomImgEl"
          :src="studyZoomSrc"
          class="zoom-img"
          :class="{ 'is-loading': zoomImgLoading }"
          :style="{
            transform: `translate(${zoomTx}px, ${zoomTy}px) scale(${zoomScale})`,
          }"
          alt="放大查看"
          draggable="false"
          @load="onZoomImgDone"
          @error="onZoomImgDone"
        />
        <!-- 图片加载中:居中转圈(慢网络下切图时旧图淡出,避免看起来没反应) -->
        <transition name="fade">
          <div v-if="zoomImgLoading" class="zoom-loading" aria-hidden="true">
            <div class="quiz-boot">
              <div class="quiz-boot-glow"></div>
              <div class="quiz-boot-ring"></div>
            </div>
          </div>
        </transition>
        <!-- 关联学习条目的答案与记忆技巧 -->
        <div v-if="zoomStudyItem" class="zoom-tip">
          <span class="zoom-tip-answer">答案:{{ zoomStudyItem.answer }}</span>
          <p v-if="zoomStudyItem.tip">{{ zoomStudyItem.tip }}</p>
        </div>
        <button
          class="zoom-close"
          aria-label="关闭放大"
          @click.stop="closeZoom"
        >
          ×
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
} from "vue";
import { QUESTIONS, buildOptions, shuffle } from "./data/questions.js";
import { STUDY_CATEGORIES, STUDY_ITEMS } from "./data/study.js";
import { loadStats, addRecord, resetStats } from "./data/stats.js";

const TOTAL_COUNT = QUESTIONS.length;

// 品牌 logo:项目自带图标
const BRAND_LOGO_SRC = import.meta.env.BASE_URL + "logo.png";
// 仿真体检机界面素材（头部机翼/底部摄像头区 + 机身图拼接）
import tjjHeadLeftImg from "./assets/img/tjj_head_left.png";
import tjjHeadRightImg from "./assets/img/tjj_head_right.png";
import tjjHeadBottomImg from "./assets/img/tjj_head_bottom.png";
import tjjBodyImg from "./assets/img/tjj_body.jpg";

const MODES = [
  { key: "random10", name: "随机 10 题", count: 10, desc: "快速自测" },
  { key: "random20", name: "随机 20 题", count: 20, desc: "标准自测" },
  {
    key: "randomAll",
    name: "随机全部",
    count: TOTAL_COUNT,
    desc: "打乱顺序作答",
  },
  {
    key: "fixed",
    name: "固定顺序",
    count: TOTAL_COUNT,
    desc: "按原书顺序作答",
  },
];

const stage = ref("menu"); // menu | start | study | quiz | result | stats | recordDetail | wrongBook
const mode = ref("random10");
const questions = ref([]);
const currentIndex = ref(0);
const correctCount = ref(0);
const answered = ref(false);
const lastCorrect = ref(false);
const chosenOption = ref(null);
const shaking = ref(false);
const currentOptions = ref([]);
const records = ref([]); // { index, chosen, correct }

// ---------- 倒计时 ----------
const QUIZ_TIME = 15; // 每题限时(秒)
const timerEnabled = ref(localStorage.getItem("cv_timer") === "1");
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
  if (!timerEnabled.value) return;
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
  stage.value = "start";
}

// ---------- 答题页素材预加载（体检机背景图 + 检查图） ----------
// 进入应用即后台静默预载体检机图片;未就绪时答题页显示 loading 遮罩兜底
const machineReady = ref(false);
const plateReady = ref(false);
const quizLoading = computed(() => !machineReady.value || !plateReady.value);

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

onMounted(async () => {
  await Promise.all([
    preloadImage(tjjHeadLeftImg),
    preloadImage(tjjHeadRightImg),
    preloadImage(tjjHeadBottomImg),
    preloadImage(tjjBodyImg),
  ]);
  machineReady.value = true;
});

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
  // 取容器与真实视口的较小值,避免容器被内容撑高时比例恒为 1
  const availH = Math.min(screenEl.clientHeight, window.innerHeight);
  quizScale.value = Math.min(1, availH / needH);
}

// 头屏贴顶向顶边收缩,机身贴底向底边收缩,整体同一比例
const quizScaleStyle = computed(() => ({
  transform: `scale(${quizScale.value})`,
}));

// 进页、体检机图/检查图就绪、窗口尺寸变化时重新计算
watch([stage, machineReady, plateReady], () => {
  if (stage.value !== "quiz") return;
  nextTick(() => {
    requestAnimationFrame(() => {
      fitQuizScale();
      observeQuizParts(); // 图片解码完成会改变头/身布局高度,由观察器兜底重算
    });
  });
});

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

onMounted(() => {
  window.addEventListener("resize", fitQuizScale);
});

onUnmounted(() => {
  window.removeEventListener("resize", fitQuizScale);
  if (quizRO) quizRO.disconnect();
});

function toggleTimer() {
  timerEnabled.value = !timerEnabled.value;
  localStorage.setItem("cv_timer", timerEnabled.value ? "1" : "0");
}

// ---------- 学习模式 ----------
const studyCat = ref("easy");
const studyIndex = ref(0);
const studyView = ref("question"); // question | original | detail
const studyList = ref([]); // 每次进入/切换分类时随机排序
const studyZoomSrc = ref(""); // 点击放大的图片地址,空 = 关闭
const studySubCat = ref("all"); // 特征对应子分类: all | num | animal | other
const FEATURE_SUBS = [
  { key: "all", name: "全部" },
  { key: "num", name: "数字" },
  { key: "animal", name: "动物" },
  { key: "other", name: "其它" },
];

// 每次切换页面(或学习页子视图)后回到顶部
watch([stage, studyView], () => {
  nextTick(() => window.scrollTo(0, 0));
});

const zoomStudyItem = ref(null); // zoom 层关联的学习条目,非空时提供原图/技巧图/解析图切换
const zoomView = ref("original");
const zoomScale = ref(1);
const zoomTx = ref(0);
const zoomTy = ref(0);
const zoomImgEl = ref(null);
const zoomImgLoading = ref(false); // zoom 层图片加载中(慢网络下切图给转圈反馈)

let zoomLoadingTimer = null;
watch(studyZoomSrc, () => {
  // 每次换图都视为"可能要加载":延迟 200ms 才显示转圈,
  // 本机/缓存秒开时零闪烁(PC 上切 tab 不再看到遮罩闪一下就关)
  clearTimeout(zoomLoadingTimer);
  zoomLoadingTimer = setTimeout(() => {
    zoomImgLoading.value = true;
  }, 200);
});

// 图片加载完成/失败:撤销未触发的延迟计时并关闭转圈
function onZoomImgDone() {
  clearTimeout(zoomLoadingTimer);
  zoomImgLoading.value = false;
}
const zoomPointers = new Map(); // pointerId -> {x,y}
let zoomDragBase = null; // 单指拖动基准 {px,py,tx,ty}
let zoomPinchBase = null; // 双指捏合基准 {dist,mx,my,s,tx,ty}
let zoomMoved = false; // 本次手势是否移动过,抑制误触关闭
let zoomLastTap = 0;
let zoomLastTapX = 0;
let zoomLastTapY = 0;

function zoomReset() {
  zoomScale.value = 1;
  zoomTx.value = 0;
  zoomTy.value = 0;
  zoomPointers.clear();
  zoomDragBase = null;
  zoomPinchBase = null;
  zoomMoved = false;
}

function openZoom(src) {
  zoomReset();
  zoomStudyItem.value = null;
  studyZoomSrc.value = src;
}

function closeZoom() {
  clearTimeout(zoomLoadingTimer);
  zoomImgLoading.value = false;
  studyZoomSrc.value = "";
  zoomReset();
  zoomStudyItem.value = null;
}

function clampScale(s) {
  return Math.min(5, Math.max(1, s));
}

function clampPan() {
  const el = zoomImgEl.value;
  if (!el) return;
  if (zoomScale.value <= 1) {
    zoomTx.value = 0;
    zoomTy.value = 0;
    return;
  }
  const r = el.getBoundingClientRect();
  const maxX = Math.max(0, (r.width - window.innerWidth) / 2);
  const maxY = Math.max(0, (r.height - window.innerHeight) / 2);
  zoomTx.value = Math.min(maxX, Math.max(-maxX, zoomTx.value));
  zoomTy.value = Math.min(maxY, Math.max(-maxY, zoomTy.value));
}

// 围绕屏幕点 (cx,cy) 缩放到 s
function applyZoomAround(s, cx, cy) {
  const kk = s / zoomScale.value;
  const vwHalf = window.innerWidth / 2;
  const vhHalf = window.innerHeight / 2;
  zoomScale.value = s;
  zoomTx.value = cx - vwHalf - kk * (cx - vwHalf - zoomTx.value);
  zoomTy.value = cy - vhHalf - kk * (cy - vhHalf - zoomTy.value);
  clampPan();
}

function toggleZoomAt(cx, cy) {
  if (zoomScale.value > 1.2) {
    zoomScale.value = 1;
    zoomTx.value = 0;
    zoomTy.value = 0;
  } else {
    applyZoomAround(2.5, cx, cy);
  }
}

function onZoomPointerDown(e) {
  try {
    e.currentTarget.setPointerCapture?.(e.pointerId);
  } catch {}
  zoomPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  zoomMoved = false;
  const now = performance.now();
  if (
    now - zoomLastTap < 300 &&
    Math.hypot(e.clientX - zoomLastTapX, e.clientY - zoomLastTapY) < 30
  ) {
    toggleZoomAt(e.clientX, e.clientY);
    zoomMoved = true;
    zoomLastTap = 0;
  } else {
    zoomLastTap = now;
    zoomLastTapX = e.clientX;
    zoomLastTapY = e.clientY;
  }
  if (zoomPointers.size === 1) {
    zoomDragBase = {
      px: e.clientX,
      py: e.clientY,
      tx: zoomTx.value,
      ty: zoomTy.value,
    };
    zoomPinchBase = null;
  } else if (zoomPointers.size === 2) {
    const [a, b] = [...zoomPointers.values()];
    zoomPinchBase = {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      mx: (a.x + b.x) / 2,
      my: (a.y + b.y) / 2,
      s: zoomScale.value,
      tx: zoomTx.value,
      ty: zoomTy.value,
    };
    zoomDragBase = null;
    zoomMoved = true;
  }
}

function onZoomPointerMove(e) {
  if (!zoomPointers.has(e.pointerId)) return;
  zoomPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (zoomPointers.size === 1 && zoomDragBase) {
    const dx = e.clientX - zoomDragBase.px;
    const dy = e.clientY - zoomDragBase.py;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) zoomMoved = true;
    zoomTx.value = zoomDragBase.tx + dx;
    zoomTy.value = zoomDragBase.ty + dy;
    clampPan();
  } else if (zoomPointers.size >= 2 && zoomPinchBase) {
    const [a, b] = [...zoomPointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    if (zoomPinchBase.dist > 0 && dist > 0) {
      const s = clampScale((zoomPinchBase.s * dist) / zoomPinchBase.dist);
      const kk = s / zoomPinchBase.s;
      const vwHalf = window.innerWidth / 2;
      const vhHalf = window.innerHeight / 2;
      zoomScale.value = s;
      zoomTx.value =
        mx - vwHalf - kk * (zoomPinchBase.mx - vwHalf - zoomPinchBase.tx);
      zoomTy.value =
        my - vhHalf - kk * (zoomPinchBase.my - vhHalf - zoomPinchBase.ty);
      clampPan();
    }
  }
}

function onZoomPointerUp(e) {
  zoomPointers.delete(e.pointerId);
  if (zoomPointers.size === 1) {
    const [p] = [...zoomPointers.values()];
    zoomDragBase = { px: p.x, py: p.y, tx: zoomTx.value, ty: zoomTy.value };
    zoomPinchBase = null;
  } else if (zoomPointers.size === 0) {
    zoomDragBase = null;
    zoomPinchBase = null;
  }
}

function onZoomWheel(e) {
  const s = clampScale(zoomScale.value * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  applyZoomAround(s, e.clientX, e.clientY);
  zoomMoved = true;
}

function onZoomOverlayClick() {
  if (zoomMoved) {
    zoomMoved = false;
    return;
  }
  closeZoom();
}

function shuffleStudy() {
  let list = STUDY_ITEMS.filter((i) => i.category === studyCat.value);
  if (studyCat.value === "feature" && studySubCat.value !== "all") {
    list = list.filter((i) => i.sub === studySubCat.value);
  }
  studyList.value = shuffle(list);
}
const studyItem = computed(() => studyList.value[studyIndex.value]);

function studyPath(name) {
  return import.meta.env.BASE_URL + "study/" + name;
}

// 速记题目图 q_imageN.png → 测试原图 plates/imageN.jpeg
function studyOriginalPath(item) {
  const m = item.image.match(/^q_(image\d+)\.png$/);
  return m ? platePath(m[1] + ".jpeg") : null;
}

// 学习条目索引:imageN → STUDY_ITEMS 条目(供错题图放大时匹配)
const studyByImage = computed(() => {
  const map = {};
  for (const it of STUDY_ITEMS) {
    const m = it.image.match(/^q_(image\d+)\.png$/);
    if (m) map[m[1]] = it;
  }
  return map;
});

// 错题图放大时的视图切换列表:原图 / 技巧图 / 解析图(多张时带序号)
const zoomTabs = computed(() => {
  const item = zoomStudyItem.value;
  if (!item) return [];
  const orig = studyOriginalPath(item);
  const tabs = [];
  if (orig) tabs.push({ key: "original", label: "原图" });
  // 简单一眼出的技巧图就是原图,不重复提供
  const qsrc = item.category === "easy" && orig ? orig : studyPath(item.image);
  if (qsrc !== orig) tabs.push({ key: "question", label: "技巧图" });
  const details = item.details || [];
  details.forEach((d, i) => {
    tabs.push({
      key: "detail:" + i,
      label: "解析图" + (details.length > 1 ? i + 1 : ""),
    });
  });
  return tabs;
});

// 切换 zoom 层视图并重置缩放状态
function zoomShowView(key) {
  const item = zoomStudyItem.value;
  // 同一视图重复点击直接忽略,避免重设 src 触发无意义的加载态
  if (!item || key === zoomView.value) return;
  zoomView.value = key;
  zoomReset();
  if (key === "original") {
    studyZoomSrc.value = studyOriginalPath(item) || studyPath(item.image);
  } else if (key === "question") {
    studyZoomSrc.value =
      item.category === "easy" && studyOriginalPath(item)
        ? studyOriginalPath(item)
        : studyPath(item.image);
  } else if (key.startsWith("detail:")) {
    const d = (item.details || [])[Number(key.slice(7))];
    if (d) studyZoomSrc.value = studyPath(d);
  }
}

// 答题错图放大:按题号匹配学习库条目,可在原图/技巧图/解析图间切换;未收录则纯原图放大
function openQuizZoom(image) {
  const m = String(image).match(/^(image\d+)\.(?:jpe?g|png)$/i);
  const item = m ? studyByImage.value[m[1]] : null;
  openZoom(
    item ? studyOriginalPath(item) || platePath(image) : platePath(image),
  );
  if (item) {
    zoomStudyItem.value = item;
    zoomView.value = "original";
    // 后台预载技巧图/解析图,慢网络下切 tab 不空窗
    new Image().src = studyPath(item.image);
    item.details?.forEach((d) => {
      new Image().src = studyPath(d);
    });
  }
}

// 简单一眼出的图无需对照原图,不提供原图视图
const hasStudyOriginal = computed(
  () =>
    studyItem.value?.category !== "easy" &&
    !!studyOriginalPath(studyItem.value),
);

// 简单一眼出分类直接展示 plates 原图(与测试图一致),其余分类展示技巧题目图
const studyQuestionSrc = computed(() => {
  const item = studyItem.value;
  if (item?.category === "easy" && studyOriginalPath(item))
    return studyOriginalPath(item);
  return studyPath(item.image);
});

// 进入新卡片时:有技巧图默认选中技巧图,并预加载原图与解析图
watch(studyItem, (item) => {
  if (!item) return;
  studyView.value = "question";
  const orig = studyOriginalPath(item);
  if (orig) new Image().src = orig;
  item.details?.forEach((d) => {
    new Image().src = studyPath(d);
  });
});

// 进入某分类时,延迟在后台预加载该分类全部图片,彻底消除翻卡等待
watch(studyCat, (cat) => {
  if (stage.value !== "study") return;
  setTimeout(() => {
    STUDY_ITEMS.filter((i) => i.category === cat).forEach((item) => {
      new Image().src = studyPath(item.image);
      const orig = studyOriginalPath(item);
      if (orig) new Image().src = orig;
      item.details?.forEach((d) => {
        new Image().src = studyPath(d);
      });
    });
  }, 400);
});

// 图片加载失败自动重试一次(加时间戳绕过失败缓存)
function retryImg(e) {
  const img = e.target;
  if (img.dataset.retried) return;
  img.dataset.retried = "1";
  img.src = img.src + (img.src.includes("?") ? "&" : "?") + "retry=1";
}

function subCount(sub) {
  return STUDY_ITEMS.filter(
    (i) => i.category === "feature" && (sub === "all" || i.sub === sub),
  ).length;
}

function setSubCat(sub) {
  studySubCat.value = sub;
  studyIndex.value = 0;
  shuffleStudy();
}

function categoryCount(key) {
  return STUDY_ITEMS.filter((i) => i.category === key).length;
}

function switchCategory(key) {
  studyCat.value = key;
  studySubCat.value = "all";
  studyIndex.value = 0;
  shuffleStudy();
}

function enterStudy() {
  studyCat.value = "easy";
  studyIndex.value = 0;
  shuffleStudy();
  stage.value = "study";
}

function prevStudy() {
  if (studyIndex.value > 0) {
    studyIndex.value--;
  }
}

function nextStudy() {
  if (studyIndex.value < studyList.value.length - 1) {
    studyIndex.value++;
  }
}

const total = computed(() => questions.value.length);
const currentQuestion = computed(() => questions.value[currentIndex.value]);
const plateSrc = computed(() => platePath(currentQuestion.value.image));

function platePath(name) {
  return import.meta.env.BASE_URL + "plates/" + name;
}

function buildQuestionSet() {
  switch (mode.value) {
    case "random10":
      return shuffle(QUESTIONS).slice(0, 10);
    case "random20":
      return shuffle(QUESTIONS).slice(0, 20);
    case "randomAll":
      return shuffle(QUESTIONS);
    default:
      return [...QUESTIONS];
  }
}

function startTest() {
  questions.value = buildQuestionSet();
  currentIndex.value = 0;
  correctCount.value = 0;
  records.value = [];
  drillMode.value = false;
  plateReady.value = false;
  loadQuestion();
  stage.value = "quiz";
}

// 错图针对测试:只考常错图(按答错次数优先,最多 20 题)
const drillMode = ref(false);
function startWrongDrill() {
  const qs = shuffle(
    wrongPlateStats.value
      .slice(0, 20)
      .map((w) => QUESTIONS.find((q) => q.image === w.image))
      .filter(Boolean),
  );
  if (!qs.length) return;
  questions.value = qs;
  currentIndex.value = 0;
  correctCount.value = 0;
  records.value = [];
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

function choose(opt) {
  if (answered.value) return;
  answered.value = true;
  stopTimer();
  chosenOption.value = opt;
  const correct = opt === currentQuestion.value.answer;
  lastCorrect.value = correct;
  if (correct) correctCount.value++;
  records.value.push({ index: currentIndex.value, chosen: opt, correct });
  // 答题间隙预载下一题检查图,切题时避免图片闪加载
  const nextQ = questions.value[currentIndex.value + 1];
  if (nextQ) preloadImage(platePath(nextQ.image));
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
        // 测试完成,写入本地统计(含评分、错图与答对图明细)
        const score = Math.round((correctCount.value / total.value) * 100);
        const wrongPlates = wrongList.value.map((w) => ({
          image: w.q.image,
          chosen: w.chosen,
          answer: w.q.answer,
          no: w.index + 1,
        }));
        const correctPlates = records.value
          .filter((r) => r.correct)
          .map((r) => questions.value[r.index].image);
        addRecord(
          drillMode.value ? "wrongDrill" : mode.value,
          total.value,
          correctCount.value,
          score,
          wrongPlates,
          correctPlates,
        );
        statsData.value = loadStats();
        stage.value = "result";
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

const wrongList = computed(() =>
  records.value
    .filter((r) => !r.correct)
    .map((r) => ({ ...r, q: questions.value[r.index] })),
);

const scoreLevel = computed(() => {
  const p = correctCount.value / total.value;
  if (p >= 0.95) return "lv-good";
  if (p >= 0.8) return "lv-mid";
  return "lv-bad";
});

const verdictText = computed(() => {
  const p = correctCount.value / total.value;
  if (p === 1) return "太棒了!全部答对,辨色力正常。";
  if (p >= 0.95) return "表现优秀,辨色力基本正常。";
  if (p >= 0.8) return "少量图案辨认有误,建议休息后复测。";
  if (p >= 0.6) return "部分图案辨认困难,可能存在色弱倾向,建议复查。";
  return "较多图案无法正确辨认,建议尽快到专业机构检查色觉。";
});

function restart() {
  startTest();
}

// ---------- 测试统计 ----------
const statsData = ref(loadStats());
const resetArmed = ref(false);

const statsSummary = computed(() => {
  const rs = statsData.value.records;
  const totalQ = rs.reduce((s, r) => s + r.total, 0);
  const correctQ = rs.reduce((s, r) => s + r.correct, 0);
  return {
    count: rs.length,
    totalQ,
    accuracy: totalQ ? Math.round((correctQ / totalQ) * 100) : 0,
    best: rs.length
      ? Math.max(...rs.map((r) => Math.round((r.correct / r.total) * 100)))
      : 0,
  };
});

const statsRecords = computed(() =>
  [...statsData.value.records].reverse().slice(0, 30),
);

// 最近记录分页:每页 10 条
const HISTORY_PAGE_SIZE = 10;
const historyPage = ref(1);
const historyTotalPages = computed(() =>
  Math.max(1, Math.ceil(statsRecords.value.length / HISTORY_PAGE_SIZE)),
);
const pagedRecords = computed(() =>
  statsRecords.value.slice(
    (historyPage.value - 1) * HISTORY_PAGE_SIZE,
    historyPage.value * HISTORY_PAGE_SIZE,
  ),
);

function setPage(p) {
  historyPage.value = Math.min(Math.max(1, p), historyTotalPages.value);
}

function openStats() {
  resetArmed.value = false;
  statsData.value = loadStats();
  historyPage.value = 1;
  stage.value = "stats";
}

const wrongBookBack = ref("stats");
function openWrongBook() {
  resetArmed.value = false;
  statsData.value = loadStats();
  wrongBookBack.value = "start";
  stage.value = "wrongBook";
}

function confirmReset() {
  if (!resetArmed.value) {
    resetArmed.value = true;
    setTimeout(() => (resetArmed.value = false), 3000);
    return;
  }
  resetStats();
  statsData.value = { records: [] };
  resetArmed.value = false;
}

function modeName(key) {
  if (key === "wrongDrill") return "错图针对测试";
  return MODES.find((m) => m.key === key)?.name ?? key;
}

function formatTime(ts) {
  return new Date(ts).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 记录评分(旧记录无 score 字段时按正确率折算),100 分上限
function recordScore(r) {
  return typeof r.score === "number"
    ? r.score
    : Math.round((r.correct / r.total) * 100);
}

function scoreClass(r) {
  const p = recordScore(r);
  if (p >= 95) return "good";
  if (p >= 80) return "mid";
  return "bad";
}

// ---------- 历史记录详情 / 常错图 ----------
const activeRecord = ref(null);
const activeWrong = computed(() => activeRecord.value?.wrong ?? []);

function openRecord(r) {
  if (!r.wrong?.length) return; // 无错图记录不可点
  activeRecord.value = r;
  stage.value = "recordDetail";
}

// 跨全部历史记录聚合每张图的答错次数,按次数降序
// 同一张图累计连对 2 次(期间没再答错)即移出常错图;之后再答错则重新计算
const WRONG_CLEAR_STREAK = 2;
const wrongPlateStats = computed(() => {
  const map = new Map(); // image -> { image, count, lastTs, streak }
  // records 按时间正序回放,保证"连对"判断正确
  statsData.value.records.forEach((r) => {
    (r.wrong ?? []).forEach((w) => {
      const cur = map.get(w.image) ?? {
        image: w.image,
        count: 0,
        lastTs: 0,
        streak: 0,
      };
      cur.count++;
      cur.lastTs = r.ts;
      cur.streak = 0;
      map.set(w.image, cur);
    });
    (r.correctPlates ?? []).forEach((img) => {
      const cur = map.get(img);
      if (cur) cur.streak++;
    });
  });
  return [...map.values()]
    .filter((w) => w.streak < WRONG_CLEAR_STREAK)
    .sort((a, b) => b.count - a.count || b.lastTs - a.lastTs);
});

function answerOf(image) {
  return QUESTIONS.find((q) => q.image === image)?.answer ?? "";
}

// ---------- 首次使用协议 ----------
const AGREEMENT_KEY = "cv_agreement_v1";
const showAgreement = ref(!localStorage.getItem(AGREEMENT_KEY));

function acceptAgreement() {
  localStorage.setItem(AGREEMENT_KEY, "1");
  showAgreement.value = false;
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
  font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif;
  color: #1f2d3d;
  -webkit-font-smoothing: antialiased;
  /* 禁用安卓 WebView 字体自动放大,避免小字号文本被撑大导致布局溢出 */
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
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
  /*padding: 36px 16px 56px;*/
  padding: 25px 16px;
}

.card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 22px;
  box-shadow: 0 18px 50px rgba(43, 76, 126, 0.12);
  padding: 30px 25px;
  width: 100%;
  text-align: center;
}

/* ---------- 开始页 ---------- */
.brand {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
}

/* 品牌 logo:项目自带图标(黑色圆角方块) */
.brand-logo {
  width: 64px;
  height: 64px;
  display: block;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.28);
  user-select: none;
}

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
  font-size: 12.501px;
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
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
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
  position: relative; /* 素材加载遮罩的定位基准 */
  align-self: stretch;
  width: 100%;
  max-width: 740px; /* 与学习模式一致的最大宽度 */
  margin: 0 auto;
  padding: 0; /* 机身图左右上下全部贴边 */
  display: flex;
  flex-direction: column;
  flex: none; /* 不随内容撑开,固定一屏高 */
  height: 100vh; /* 旧浏览器回退 */
  height: 100dvh; /* 动态视口高,移动端地址栏收展也精确 */
  min-height: 0;
  overflow: hidden; /* 缩放前的布局溢出不撑开页面 */
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

/* 呼吸光晕 + 旋转环 */
.quiz-boot {
  position: relative;
  width: 46px;
  height: 46px;
}

.quiz-boot-glow {
  position: absolute;
  inset: -16px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(94, 150, 255, 0.28) 0%, transparent 70%);
  animation: quiz-breath 1.6s ease-in-out infinite;
}

.quiz-boot-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(47, 111, 237, 0.16);
  border-top-color: #2f6fed;
  animation: quiz-spin 1s linear infinite;
}

@keyframes quiz-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes quiz-breath {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.92);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
  }
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

/* 安卓 App 内的全局返回胶囊 15px 顶距在此不适用(吸顶已避开状态栏) */
html.android-app .quiz-top .back-link {
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
  height: 47.5%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  column-gap: 6.1%;
  row-gap: 17.9%;
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

.quiz-main {
  width: 100%;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 22px;
  box-shadow: 0 18px 50px rgba(43, 76, 126, 0.12);
  padding: 28px 22px 32px;
  text-align: center;
  animation: slide-in 0.28s ease;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.plate-wrap {
  position: relative;
  display: inline-block;
  max-width: 500px;
  width: 100%;
  min-height: 200px;
  border-radius: 5px;
  /* 图片加载中显示流光占位,加载完成后被图片覆盖 */
  background: linear-gradient(100deg, #edf1f6 40%, #f8fafc 50%, #edf1f6 60%);
  background-size: 200% 100%;
  animation: plate-shimmer 1.2s linear infinite;
  overflow: hidden;
}

@keyframes plate-shimmer {
  to {
    background-position: -200% 0;
  }
}

.plate-img {
  width: 100%;
  /*border-radius: 14px;*/
  border: 1px solid #e6ebf1;
  box-shadow: 0 8px 24px rgba(43, 76, 126, 0.12);
  user-select: none;
  display: block;
}

.plate-img.zoomable {
  cursor: zoom-in;
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
  transition: opacity 0.25s ease;
}

/* 换图加载中:旧图淡出,配合中央转圈给明确反馈 */
.zoom-img.is-loading {
  opacity: 0.15;
}

.zoom-loading {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* 不挡手势 */
}

/* 深色遮罩上用亮一点的蓝 */
.zoom-loading .quiz-boot-glow {
  background: radial-gradient(circle, rgba(94, 150, 255, 0.4) 0%, transparent 70%);
}

.zoom-loading .quiz-boot-ring {
  border-color: rgba(120, 170, 255, 0.25);
  border-top-color: #7db0ff;
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

/* zoom 层顶部学习切换 tab:原图/技巧图/解析图 */
.zoom-tabs {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 999px;
  backdrop-filter: blur(6px);
  max-width: 92%;
}

.zoom-tab {
  border: 0;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  background: transparent;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
}

.zoom-tab.active {
  color: #fff;
  background: #2f6fed;
}

/* zoom 层底部答案/记忆技巧提示(不可交互,点击穿透到遮罩关闭) */
.zoom-tip {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 2;
  max-width: min(86%, 560px);
  padding: 8px 14px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
  color: #fff;
  backdrop-filter: blur(6px);
  pointer-events: none;
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

.zoom-tip .zoom-tip-answer {
  font-weight: 700;
  color: #7dd3fc;
}

.zoom-tip p {
  margin: 2px 0 0;
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

.plate-badge.ok {
  background: #22a15f;
}
.plate-badge.no {
  background: #e0533d;
}

.fade-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

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

em.bad {
  color: #c23b27;
}
em.good {
  color: #177a46;
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
  margin-top: 0px; /* web 顶部 0px，安卓 App 内 15px（见下方覆盖） */
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

html.android-app .back-link {
  margin-top: 30px;
}

.study-header .back-link,
.quiz-header .back-link {
  margin-bottom: 20px;
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
  border: 1.501px solid #e2e8f0;
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

/* ---------- 手机端学习模式适配 ---------- */
@media (max-width: 480px) {
  /* 分类 tab 四个并排一行,小字号收紧 */
  .study-tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .study-tab {
    padding: 9px 2px;
    font-size: 13px;
    letter-spacing: 0;
    text-align: center;
    white-space: nowrap;
  }

  .study-tab em {
    font-size: 10.501px;
    margin-left: 1px;
  }

  .sub-tab {
    padding: 6px 12px;
    font-size: 12.501px;
  }

  .sub-tab em {
    font-size: 10.501px;
  }

  .view-switch {
    padding: 3.04px;
  }

  .vs-btn {
    flex-shrink: 0;
    white-space: nowrap;
    padding: 6px 11.04px;
    font-size: 12.48px;
  }

  .study-info {
    margin-top: 18px;
    gap: 10px;
  }

  .study-answer-row {
    gap: 10px;
  }

  .study-answer {
    font-size: 20px;
    word-break: break-all;
  }

  .study-label {
    font-size: 11px;
  }

  .study-tip {
    padding: 11px 13px;
    gap: 10px;
  }

  .study-tip p {
    font-size: 14px;
    line-height: 1.75;
  }

  .nav-btn {
    padding: 9px 16px;
    font-size: 14px;
  }
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
.quick-entries {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 660px;
  margin-bottom: 18px;
}

.quick-entries .stats-entry {
  flex: 1;
  min-width: 0;
  margin: 0;
}

.stats-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px 20px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.88);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(43, 76, 126, 0.08);
  cursor: pointer;
  text-align: left;
  transition: all 0.18s ease;
}

.stats-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(47, 111, 237, 0.2);
}

.stats-entry.wb:hover {
  box-shadow: 0 10px 28px rgba(224, 83, 61, 0.22);
}

.se-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2f6fed, #4f8cf7);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.se-icon-warn {
  background: linear-gradient(135deg, #e0533d, #ef7a66);
}

.se-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.se-title {
  font-size: 15px;
  font-weight: 700;
  color: #233247;
}

.se-desc {
  font-size: 12px;
  color: #7b8aa0;
}

.se-arrow {
  color: #9aa9bf;
  flex-shrink: 0;
}

@media (max-width: 520px) {
  .quick-entries .stats-entry {
    padding: 11px 12px;
    gap: 8px;
  }

  .quick-entries .se-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
  }

  .quick-entries .se-desc {
    display: none;
  }
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

.history-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 12px;
}

.pager-btn {
  padding: 6px 16px;
  border: 1px solid #dde5f0;
  border-radius: 999px;
  background: #fff;
  color: #45556b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.pager-btn:hover:not(:disabled) {
  color: #2f6fed;
  border-color: #b6ccf5;
  box-shadow: 0 4px 12px rgba(47, 111, 237, 0.12);
}

.pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager-info {
  font-size: 13px;
  font-weight: 700;
  color: #6b7a90;
  min-width: 52px;
  text-align: center;
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

.h-score {
  font-weight: 800;
}

.h-score.good {
  color: #177a46;
}
.h-score.mid {
  color: #b7791f;
}
.h-score.bad {
  color: #c23b27;
}

/* 历史记录:可点击查看答错的图 */
.history-item.clickable {
  cursor: pointer;
  transition: all 0.15s ease;
}

.history-item.clickable:hover {
  border-color: #b6ccf5;
  background: #f2f7ff;
}

.h-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.h-sub {
  font-size: 12px;
  color: #8a99ad;
}

.h-score {
  margin-left: 10px;
  white-space: nowrap;
}

.h-arrow {
  flex-shrink: 0;
  margin-left: 6px;
  color: #b7c2d0;
}

/* ---------- 常错图入口 ---------- */
.wrongbook-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px 16px;
  margin-bottom: 22px;
  border: 1px solid #f3d9d4;
  background: #fdf6f5;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.18s ease;
}

.wrongbook-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(224, 83, 61, 0.14);
}

.we-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e0533d, #ef7a66);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.we-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.we-title {
  font-size: 15px;
  font-weight: 800;
  color: #22314a;
}

.we-desc {
  font-size: 12px;
  color: #8a99ad;
}

.we-count {
  font-size: 18px;
  font-weight: 800;
  color: #e0533d;
}

.we-arrow {
  flex-shrink: 0;
  color: #d9a79e;
}

/* ---------- 历史记录详情 ---------- */
.record-card {
  max-width: 640px;
}

.record-card h2 {
  font-size: 24px;
  margin-bottom: 20px;
  letter-spacing: 2px;
}

.rec-summary {
  display: flex;
  align-items: center;
  gap: 18px;
  background: #f4f7fb;
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 22px;
}

.rec-score {
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
}

.rec-score span {
  font-size: 15px;
  font-weight: 700;
  margin-left: 2px;
}

.rec-score.good {
  color: #177a46;
}
.rec-score.mid {
  color: #b7791f;
}
.rec-score.bad {
  color: #c23b27;
}

.rec-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 13.501px;
  color: #5c6f84;
  text-align: left;
}

.rm-time {
  font-weight: 700;
  color: #34455a;
}

/* ---------- 常错图排行 ---------- */
.wrongbook-card {
  max-width: 720px;
}

.wrongbook-card h2 {
  font-size: 24px;
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.wb-desc {
  font-size: 12.501px;
  color: #8a99ad;
  margin-bottom: 20px;
}

.drill-btn {
  width: 100%;
  justify-content: center;
  gap: 7px;
  padding: 10px 20px;
  margin-bottom: 22px;
  font-size: 14px;
  border-radius: 10px;
  background: #f0f5ff;
  color: #2f6fed;
  border: 1px solid #d9e4fb;
  box-shadow: none;
  transition: all 0.18s ease;
}

.drill-btn:hover {
  background: #e3edff;
  border-color: #b6ccf5;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(47, 111, 237, 0.12);
}

.wb-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

@media (max-width: 560px) {
  .wb-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.wb-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f7f9fc;
  border: 1px solid #e8edf4;
  border-radius: 12px;
  padding: 10px;
}

.wb-imgwrap {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.wb-imgwrap img {
  width: 100%;
  display: block;
  border-radius: 8px;
  border: 1px solid #e6ebf1;
}

.wb-count {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(224, 83, 61, 0.92);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 99px;
}

.wb-answer {
  font-size: 12.501px;
  color: #45556b;
  font-weight: 600;
  text-align: center;
}

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
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
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
  font-size: 13.501px;
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
