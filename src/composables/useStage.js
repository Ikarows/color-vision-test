import { ref } from "vue";

// 全局单例 stage 状态机:轻量替代 vue-router
// go() 记录返回栈,back() 弹栈返回;栈空时回落 menu(返回栈底)
// menu | start | study | quiz | result | stats | recordDetail | wrongBook
const stage = ref("menu");
const stack = [];
const MAX_DEPTH = 20;

export function useStage() {
  // 前进:当前页压栈后切换
  function go(name) {
    if (stage.value === name) return;
    if (stack.length >= MAX_DEPTH) stack.shift();
    stack.push(stage.value);
    stage.value = name;
  }

  // 返回:弹栈;跳过与当前页相同的失效记录(中途被直接赋值打断的导航)
  function back(fallback = "menu") {
    let target = stack.pop();
    while (target === stage.value) target = stack.pop();
    stage.value = target ?? fallback;
  }

  // 直接切换(不入栈):保留给返回栈之外的特殊跳转
  function set(name) {
    stage.value = name;
  }

  return { stage, go, back, set };
}
