<template>
  <div class="screen start-screen">
    <div class="back-bar">
      <button class="back-link" @click="$emit('back')">
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
        :alt="appTitle + ' logo'"
        draggable="false"
      />
    </div>
    <h1 class="title">色盲色弱自测</h1>
    <p class="subtitle">
      基于{{ editionLabel }} · 共 {{ totalCount }} 题
    </p>

    <button class="stats-brief" @click="$emit('stats')">
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
      <button class="stats-entry" @click="$emit('stats')">
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
        @click="$emit('wrongbook')"
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
              ? "每题限时 14 秒,超时视为答错"
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

      <div class="timer-setting driving-setting">
        <div class="ts-text">
          <span class="ts-title">
            驾照自助机模拟
            <button class="ts-help" @click="showDrivingHelp = true">
              规则说明
            </button>
          </span>
          <span class="ts-desc">{{
            drivingMode
              ? "随机 4 题,答对 2 题及以上通过,答完统一判定（各地规则有区别，仅供参考）"
              : "关闭时按上方所选模式正常练习"
          }}</span>
        </div>
        <button
          class="toggle"
          :class="{ on: drivingMode }"
          aria-label="驾照自助机模拟开关"
          @click="toggleDriving"
        >
          <span class="toggle-knob"></span>
        </button>
      </div>

      <DrivingHelpDialog
        :open="showDrivingHelp"
        @close="showDrivingHelp = false"
      />

      <!-- <div class="intro">
        <p>请在自然光线下、距离屏幕约 60–80 厘米处作答。</p>
        <p>每张图下方有 <strong>6 个选项</strong>,凭第一直觉选择你看到的内容。</p>
      </div> -->

      <button class="btn btn-primary btn-lg" @click="$emit('start')">
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
</template>

<script setup>
import { ref } from "vue";
import { useEdition } from "../../composables/useEdition.js";

const appTitle = import.meta.env.VITE_APP_TITLE;
import { useQuizConfig } from "../../composables/useQuizConfig.js";
import { useRecords } from "../../composables/useRecords.js";
import DrivingHelpDialog from "../DrivingHelpDialog.vue";

defineEmits(["back", "stats", "wrongbook", "start"]);

// 品牌 logo:项目自带图标
const BRAND_LOGO_SRC = import.meta.env.BASE_URL + "logo.png";

const { totalCount, editionLabel } = useEdition();
const { MODES, mode, timerEnabled, toggleTimer, drivingMode, toggleDriving } =
  useQuizConfig();
const { statsSummary, wrongPlateStats } = useRecords();

// 自助机规则说明弹层
const showDrivingHelp = ref(false);
</script>

<style>
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

/* 规则说明小按钮 */
.ts-help {
  margin-left: 8px;
  padding: 2px 9px;
  border: none;
  border-radius: 999px;
  background: #e8f0fe;
  color: #2f6fed;
  font-size: 11px;
  font-weight: 700;
  vertical-align: 1px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.ts-help:hover {
  background: #d8e5fd;
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
</style>
