package com.local.colorvisiontest;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private WebView webview;
    private int lastTopPx = -1;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 沉浸式状态栏：状态栏透明，WebView 延伸到屏幕顶端，
        // 页面背景透到状态栏底下；网页内容通过原生注入的 --sbh 变量（状态栏高度）自动避让
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);

        webview = bridge.getWebView();
        if (webview != null) {
            // 系统窗口边距变化（旋转/挖孔屏等）时，把状态栏高度推给网页
            webview.setOnApplyWindowInsetsListener((v, insets) -> {
                updateStatusBarHeight(insets.getSystemWindowInsetTop(), false);
                return insets;
            });
            // 网页加载完成（含热更新重载）后主动向原生要一次状态栏高度：
            // 页面刚加载时 insets 通常已派发过，但 evaluateJavascript 会因页面未就绪而丢失，
            // 这里必须强制重新注入（不能用去重拦掉），否则变量永远是空
            webview.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void ready() {
                    webview.post(() -> updateStatusBarHeight(statusBarHeightPx(), true));
                }
            }, "CvNativeInsets");
        }
    }

    private int statusBarHeightPx() {
        if (lastTopPx >= 0) return lastTopPx;
        // 兜底：读系统状态栏高度资源
        int resId = getResources().getIdentifier("status_bar_height", "dimen", "android");
        return resId > 0 ? getResources().getDimensionPixelSize(resId) : 0;
    }

    private void updateStatusBarHeight(int topPx, boolean force) {
        if (topPx <= 0) return;
        if (!force && topPx == lastTopPx) return;
        lastTopPx = topPx;
        if (webview == null) return;
        // px 换算成网页 css px（WebView 按 density 缩放）
        int cssPx = (int) Math.ceil(topPx / getResources().getDisplayMetrics().density);
        webview.evaluateJavascript(
                "document.documentElement.style.setProperty('--sbh','" + cssPx + "px')", null);
    }
}
