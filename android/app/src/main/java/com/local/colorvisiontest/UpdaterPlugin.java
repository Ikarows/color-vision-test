package com.local.colorvisiontest;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * 应用内更新插件:
 * - getVersion          返回本地 versionCode / versionName
 * - downloadAndInstall  下载 APK(进度经 updateProgress 事件推送),完成后拉起系统安装器
 * 网络请求与版本对比逻辑在 JS 侧完成,本插件只负责版本号与下载安装。
 */
@CapacitorPlugin(name = "Updater")
public class UpdaterPlugin extends Plugin {

    private static final int PROGRESS_STEP = 2; // 进度每涨 2% 推送一次,避免事件过频

    @PluginMethod
    public void getVersion(PluginCall call) {
        try {
            PackageInfo pi = getContext().getPackageManager()
                    .getPackageInfo(getContext().getPackageName(), 0);
            JSObject ret = new JSObject();
            ret.put("versionCode", pi.versionCode);
            ret.put("versionName", pi.versionName);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("get version failed", e);
        }
    }

    @PluginMethod
    public void downloadAndInstall(final PluginCall call) {
        final String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url required");
            return;
        }

        // Android 8+ 需要用户授权「允许安装未知应用」,无权限则跳系统设置页,由 JS 提示后重试
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent setting = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName()));
            setting.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(setting);
            JSObject ret = new JSObject();
            ret.put("status", "no_permission");
            call.resolve(ret);
            return;
        }

        new Thread(() -> {
            File apk = null;
            try {
                File dir = getContext().getExternalFilesDir("update");
                if (dir == null) dir = getContext().getCacheDir();
                apk = new File(dir, "update.apk");
                if (apk.exists()) apk.delete();

                HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(30000);
                // 蒲公英下载链接对无 UA 请求可能拒绝,带个常规 UA 保险
                conn.setRequestProperty("User-Agent",
                        "Mozilla/5.0 (Linux; Android) AppleWebKit/537.36");
                conn.connect();

                int total = conn.getContentLength();
                long lastNotify = 0;
                try (InputStream in = conn.getInputStream();
                     FileOutputStream out = new FileOutputStream(apk)) {
                    byte[] buf = new byte[8192];
                    long done = 0;
                    int len;
                    while ((len = in.read(buf)) != -1) {
                        out.write(buf, 0, len);
                        done += len;
                        if (total > 0) {
                            int percent = (int) (done * 100 / total);
                            if (percent - lastNotify >= PROGRESS_STEP) {
                                lastNotify = percent;
                                JSObject data = new JSObject();
                                data.put("progress", Math.min(percent, 99));
                                notifyListeners("updateProgress", data);
                            }
                        }
                    }
                }
                conn.disconnect();

                Uri uri = FileProvider.getUriForFile(getContext(),
                        getContext().getPackageName() + ".fileprovider", apk);
                Intent install = new Intent(Intent.ACTION_VIEW);
                install.setDataAndType(uri, "application/vnd.android.package-archive");
                install.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                        | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                getContext().startActivity(install);

                JSObject ret = new JSObject();
                ret.put("status", "install");
                call.resolve(ret);
            } catch (Exception e) {
                if (apk != null && apk.exists()) apk.delete();
                JSObject ret = new JSObject();
                ret.put("status", "error");
                ret.put("message", e.getMessage() == null ? "download failed" : e.getMessage());
                call.resolve(ret);
            }
        }, "updater-download").start();
    }
}
