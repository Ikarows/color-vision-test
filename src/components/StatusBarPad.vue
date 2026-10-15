<template>
  <!-- 公用吸顶状态栏垫(不带返回按钮,仅安卓 App 内显示):
       复用 .back-bar 全局样式——默认透明衔接页面,滚动吸顶后由 App.vue 统一加 .scrolled
       显形为实色背景,内容上滑时从其下方穿过被盖住;安卓沉浸式下自动让出 --sbh 状态栏高度。
       web 端没有状态栏,组件自身判断不渲染;需要的页面在 .screen 内作为第一个子元素引入即可 -->
  <div v-if="isAndroidApp" class="back-bar status-bar-pad" aria-hidden="true"></div>
</template>

<script setup>
// 平台判断与 main.js 一致:仅安卓 App(Capacitor 原生环境)渲染,web 端不占布局
const isAndroidApp = !!window.Capacitor?.isNativePlatform?.();
</script>
