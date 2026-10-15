import { useStage } from "./useStage.js";
import { useRecords } from "./useRecords.js";
import { useQuiz } from "./useQuiz.js";
import { useZoom } from "./useZoom.js";

// 系统/浏览器返回键路由,统一映射为当前页面的返回按钮行为:
// - 安卓 App(Capacitor):@capacitor/app 插件 backButton 事件
// - 手机浏览器:pushState 哨兵 + popstate 拦截(首次进入页面压入哨兵,
//   用户按返回只消费哨兵触发 popstate,处理完再补回;再按一次才真正离开)
// - 首页双击确认:2 秒内按两次才退出 App / 离开页面,防误触

let hintTimer = null;
let lastMenuBack = 0;
let toastEl = null;

function showToast(text) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.style.cssText =
      "position:fixed;left:50%;bottom:15%;transform:translateX(-50%);" +
      "background:rgba(31,45,61,.86);color:#fff;font-size:13px;" +
      "padding:9px 18px;border-radius:999px;pointer-events:none;opacity:0;" +
      "transition:opacity .2s ease;z-index:9999;white-space:nowrap;";
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = text;
  toastEl.style.opacity = "1";
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => (toastEl.style.opacity = "0"), 2000);
}

export function initBackKey() {
  const { stage, back } = useStage();
  const { wrongBookBack } = useRecords();
  const { quitQuiz } = useQuiz();
  const { studyZoomSrc, closeZoom } = useZoom();

  // 应用内返回路由:返回 true 表示已消费(还有上一级可回),false 表示已在首页
  function routeBack() {
    // 图片放大层打开时优先关 zoom,与点遮罩关闭一致
    if (studyZoomSrc.value) {
      closeZoom();
      return true;
    }
    switch (stage.value) {
      case "quiz":
        // 与答题页退出按钮同逻辑:错图针对测试回错题本,普通测试回开始页
        quitQuiz();
        return true;
      case "hospitals":
      case "study":
        stage.value = "menu";
        return true;
      case "stats":
        stage.value = "start";
        return true;
      case "recordDetail":
        stage.value = "stats";
        return true;
      case "wrongBook":
        stage.value = wrongBookBack.value;
        return true;
      case "result":
        stage.value = "start";
        return true;
      case "start":
        back();
        return true;
      default:
        return false; // menu
    }
  }

  if (window.Capacitor?.isNativePlatform?.()) {
    initAppBack(routeBack);
  } else {
    initWebBack(routeBack);
  }
}

// 安卓 App:插件原生层拦截返回键转发给 JS(原生桥必须打进 APK)
async function initAppBack(routeBack) {
  const { App } = await import("@capacitor/app");
  await App.addListener("backButton", () => {
    if (routeBack()) return;
    const now = Date.now();
    if (now - lastMenuBack < 2000) {
      App.exitApp();
    } else {
      lastMenuBack = now;
      showToast("再按一次退出应用");
    }
  });
}

// 手机浏览器:history 哨兵拦截浏览器返回(纯前端,无需打包)
function initWebBack(routeBack) {
  // 页面加载时的历史长度:1 = 本标签第一条记录,按返回无路可退。
  // 注意不能用实时 history.length 判断——它把哨兵条目也算进去,永远 >1
  const initialLength = history.length;

  // 栈顶已是哨兵(reload 后 history state 保留)则不重复压
  function arm() {
    if (!history.state?.cvBack) history.pushState({ cvBack: true }, "");
  }
  window.addEventListener("popstate", () => {
    if (routeBack()) {
      arm(); // 应用内已处理,补回哨兵让下一次返回继续被拦截
      return;
    }
    // menu:双击确认防误触(与 App 端一致),2 秒内再按才真正离开
    const now = Date.now();
    if (now - lastMenuBack < 2000) {
      if (initialLength > 1) {
        history.back(); // 有来路,真正离开
      } else {
        // 无来路(直接输网址/扫码打开),back() 无效,提示后补回哨兵保持拦截
        showToast("请关闭标签页退出");
        arm();
      }
      return;
    }
    lastMenuBack = now;
    showToast("再按一次返回离开");
    arm();
  });
  arm();
}
