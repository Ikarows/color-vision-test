package com.local.colorvisiontest;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.android.R;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 沉浸式状态栏：状态栏透明 + 深色图标，WebView 延伸到屏幕顶端
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);

        // WebView 顶部避让状态栏：状态栏区域显示 WebView 底色（白色），
        // 网页内容从状态栏下方开始，不会被遮挡
        View webview = findViewById(R.id.webview);
        if (webview != null) {
            webview.setBackgroundColor(Color.WHITE);
            webview.setOnApplyWindowInsetsListener((v, insets) -> {
                v.setPadding(0, insets.getSystemWindowInsetTop(), 0, 0);
                return insets;
            });
        }
    }
}
