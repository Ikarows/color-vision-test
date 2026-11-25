// 应用内更新:仅在安卓原生 App 内启用,前端直连蒲公英 API(app/check,只读接口)
// 网络走 CapacitorHttp(原生网络栈),不受 WebView 跨域限制
import { ref, watch } from "vue";
import { Capacitor, CapacitorHttp, registerPlugin } from "@capacitor/core";

// ---------- 蒲公英配置(上传 APK 后在「应用详情 → API 信息」中获取) ----------
// api_key 简单拆分拼接,只增加一点反编译成本,防不住专业逆向;泄露后可在蒲公英后台重置
const API_KEY = "cf976c403e5c22e7" + "ace2496a4a23b96f";
const APP_KEY = "e14f0f27d36f3dcbf" + "5520bc241638722";
const CHECK_URL = "https://www.pgyer.com/apiv2/app/check";
const CHECK_INTERVAL = 30 * 60 * 1000; // 自动检查 30 分钟内不重复
const CACHE_KEY = "cv_update_cache_v1";

const Updater = registerPlugin("Updater");

/** 语义化版本比较("2.2.1" vs "2.2.0"):a>b 返回 1,a<b 返回 -1,相等返回 0 */
function compareVersion(a = "", b = "") {
  const parse = (s) =>
    String(s)
      .replace(/^v/i, "")
      .split(".")
      .map((n) => parseInt(n, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

// ---------- 模块级单例状态 ----------
const showUpdate = ref(false);
const localVersion = ref("");
const remoteVersion = ref("");
const remoteNotes = ref("");
const downloadUrl = ref("");
const downloading = ref(false);
const progress = ref(0);
const hint = ref("");
const checking = ref(false); // 手动检查中(入口按钮防重复点击)
const toastMsg = ref(""); // 手动检查结果的轻提示
let toastTimer = null;

function showToast(msg) {
  toastMsg.value = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastMsg.value = ""), 2200);
}

const isAndroidApp =
  Capacitor.getPlatform() === "android" && Capacitor.isNativePlatform();

// 测试环境(vite dev server)下入口一律显示,方便调试样式与交互;
// 正式环境(production build)下仅安卓原生 App 显示,web 端隐藏
const isDev = import.meta.env.DEV;
const showUpdateEntry = isAndroidApp || isDev;

// 弹窗打开时锁定背景滚动(关闭时恢复)
watch(showUpdate, (v) => {
  document.body.style.overflow = v ? "hidden" : "";
});

/**
 * 检查更新核心流程
 * @param {boolean} force true=手动检查(跳过缓存,结果用 toast 反馈);false=启动自动检查(失败静默)
 */
async function doCheckUpdate(force) {
  if (downloading.value) return;
  // 仅安卓原生环境有 Updater 插件与 CapacitorHttp;web(含测试环境)点击时给出明确反馈
  if (!isAndroidApp) {
    if (force) showToast("当前为测试环境，请使用安卓 App 检查更新");
    return;
  }
  try {
    if (!force) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached && Date.now() - Number(cached) < CHECK_INTERVAL) return;
    }

    const local = await Updater.getVersion();

    const resp = await CapacitorHttp.request({
      url: CHECK_URL,
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: new URLSearchParams({
        _api_key: API_KEY,
        appKey: APP_KEY,
        buildVersion: String(local.versionName),
        buildBuildVersion: String(local.versionCode),
      }).toString(),
    });
    if (resp.status !== 200) {
      console.warn(`[updater] 检查失败 HTTP ${resp.status}`);
      if (force) showToast("检查更新失败，请稍后重试");
      return;
    }
    const data = resp.data && resp.data.data;
    if (!data) {
      console.warn(
        "[updater] 响应无 data:",
        JSON.stringify(resp.data).slice(0, 200)
      );
      if (force) showToast("检查更新失败，请稍后重试");
      return;
    }

    // 蒲公英实测返回布尔 true(兼容字符串);下载地址兜底用 buildKey 拼接
    const haveNew =
      data.buildHaveNewVersion === true || data.buildHaveNewVersion === "true";
    const download =
      data.downloadURL ||
      (data.buildKey
        ? `https://www.pgyer.com/app/download/${data.buildKey}`
        : "");

    console.log(
      `[updater] 本地 v${local.versionName}(${local.versionCode}) / 远端 v${data.buildVersion}(${data.buildVersionNo}) / haveNew=${haveNew}`
    );

    // 双保险:服务端 buildHaveNewVersion 判定 + 本地 versionName 语义比较(如 2.3.1 > 2.3.0)
    if (!haveNew && compareVersion(data.buildVersion, local.versionName) <= 0) {
      // 已是最新:自动检查静默,手动检查给提示
      if (force) showToast(`当前已是最新版本 v${local.versionName}`);
      return;
    }

    if (!download) {
      console.warn("[updater] 无可用下载地址");
      return;
    }

    // 检查成功且确认可用后才记缓存(失败时下次启动重查)
    localStorage.setItem(CACHE_KEY, String(Date.now()));
    localVersion.value = local.versionName || "";
    remoteVersion.value = data.buildVersion || "";
    remoteNotes.value = data.buildUpdateDescription || "暂无更新说明";
    downloadUrl.value = download;
    showUpdate.value = true;
  } catch (e) {
    console.warn("[updater] 检查更新失败(已忽略)", e);
    if (force) showToast("检查更新失败，请检查网络后重试");
  }
}

/** App 启动/同意协议后的自动检查:30 分钟缓存内跳过,全程静默 */
export async function checkUpdate() {
  await doCheckUpdate(false);
}

/** 手动检查更新(首页入口):跳过缓存立即检查,结果用 toast 反馈 */
export async function forceCheckUpdate() {
  if (checking.value || downloading.value) return;
  checking.value = true;
  try {
    await doCheckUpdate(true);
  } finally {
    checking.value = false;
  }
}

/** 立即更新:调原生插件下载 APK 并拉起安装 */
export async function startUpdate() {
  if (downloading.value || !downloadUrl.value) return;
  downloading.value = true;
  progress.value = 0;
  hint.value = "";
  const listener = await Updater.addListener("updateProgress", (d) => {
    progress.value = (d && d.progress) || 0;
  });
  const res = await Updater.downloadAndInstall({ url: downloadUrl.value });
  downloading.value = false;
  if (res && res.status === "install") {
    progress.value = 100;
    showUpdate.value = false;
    localStorage.setItem(CACHE_KEY, String(Date.now())); // 从安装页回来不重复弹窗
  } else if (res && res.status === "no_permission") {
    hint.value = "请在设置中允许安装未知应用，授权后重新点击「立即更新」";
  } else {
    hint.value = `下载失败（${(res && res.message) || "网络异常"}），请稍后重试`;
  }
  listener.remove();
}

/** 关闭更新弹窗(下载中不允许关,避免重复下载) */
export function closeUpdate() {
  if (downloading.value) return;
  showUpdate.value = false;
}

export function useUpdater() {
  return {
    isAndroidApp, // 仅安卓原生 App 走真正的检查更新流程
    showUpdateEntry, // 更新入口可见性:测试环境一律显示,正式环境仅安卓显示
    showUpdate,
    localVersion,
    remoteVersion,
    remoteNotes,
    downloading,
    progress,
    hint,
    checking,
    toastMsg,
    startUpdate,
    closeUpdate,
    forceCheckUpdate,
  };
}
