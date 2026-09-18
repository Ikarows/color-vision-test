<div align="center">
<p><img width="150" src="https://avatars0.githubusercontent.com/u/25151659?s=460&v=4"></p>

<h1>色盲色弱助手</h1>

<p>
   <strong>Vue 3 + Vite 打造的色盲色弱自测与记图助手</strong>
</p>

<p>
  <sub>Made with ❤︎ by
    <a href="https://github.com/Ikarows">Ikarows</a>
  </sub>
</p>

<img src="https://shields.io/badge/node-%3E%3D%2018.0.0-brightgreen">
<img src="https://img.shields.io/badge/vue-3.5.13-brightgreen">
<img src="https://img.shields.io/badge/vite-6.0.7-brightgreen">
<img src="https://img.shields.io/badge/capacitor-5.7.8-brightgreen">
</div>

<br>

一款基于《色盲检查图（第六版）》的单页 Web 应用，同时支持打包为 Android APP（Capacitor）和 Windows 桌面程序（Electron）。提供 **体检模拟** 与 **技巧记图** 两大模块，帮助用户自测色觉、备考体检。

## 功能特性

### 体检模拟

- **出题方式**：固定顺序（完整题组循环）或 随机模式（10 / 20 题）
- **倒计时模式**（可选开关）：每题限时 15 秒，进度条递减，最后 5 秒变红闪烁；超时自动判错并展示正确答案；开关状态本地记忆
- **选项干扰**：每题 6 个选项 = 3 个同类型 + 3 个跨类型干扰（数字题混入动物、图形、颜色等），防止“看类型蒙题”
- **答题反馈**：选择后立即判分，答错高亮正确答案
- **结果报告**：得分、等级评价、错题回顾（含超时未答标注）、历史成绩统计（localStorage 持久化）

### 技巧记图

四个学习分类，卡片式浏览，每次随机排序：

| 分类 | 数量 | 内容 |
| --- | --- | --- |
| 简单易看 | 13 | 无需背诵，看不出来的说明色觉异常（仅题目图） |
| 特征对应 | 26 | 子分类切换：全部 26 / 数字 14 / 动物 8 / 其它 4 |
| 数字对应 | 若干 | 数字型检查图逐图记忆 |
| 总结复习 | 3 | 《第六版背图技巧》PDF 末尾三页总结（已去除水印），含“熟悉各图特性”“特征速查图”“备考建议” |

- **三视图切换**：题目图 / 原图 / 答案解析图（原图与解析图缺失时按钮自动隐藏）
- **图片放大**：点击全屏查看，支持滚轮缩放、拖动平移、双击放大复位、移动端双指捏合，点击空白或 × 关闭

## 技术栈

- **前端**：Vue 3（`<script setup>`）+ Vite 6
- **Android**：Capacitor 5，正式签名 release APK
- **桌面端**：Electron + electron-builder（Windows portable）

## 项目结构

```
color-vision-test/
├── index.html                 # 入口 HTML（引用 /app-icon.svg 图标）
├── vite.config.js             # Vite 配置
├── capacitor.config.json      # Capacitor 配置（appId / 应用名）
├── package.json               # 脚本与依赖（含 electron-builder 配置）
├── 色盲色弱助手.apk            # 已签名的 release APK 产物
│
├── src/
│   ├── main.js                # Vue 应用入口
│   ├── App.vue                # 全部界面与交互逻辑（单组件应用）
│   └── data/
│       ├── questions.js       # 题库：题目、正确答案、答题/干扰选项池构建
│       ├── study.js           # 记图学习数据：学习条目、分类、记忆技巧、解析图映射
│       └── stats.js           # 历史成绩读写（localStorage）
│
├── public/
│   ├── app-icon.svg           # 应用图标（浅色极简色彩圆环设计）
│   ├── plates/                # 48 张检查图原图（测试与速记共用，jpeg）
│   └── study/                 # 88 张学习图：
│       ├── q_image*.png       #   题目图（带题号边框）
│       ├── image*_d*.png      #   答案解析图（标出目标图形）
│       └── review_p*.png      #   总结复习页（无水印，2x 高清）
│
├── android/                   # Capacitor Android 工程
│   └── app/src/main/res/values/strings.xml  # APP 显示名称「色盲色弱助手」
│
├── electron/                  # Electron 主进程（桌面端入口）
└── dist/                      # vite build 输出（构建生成）
```

## 快速开始

```bash
npm install       # 安装依赖
npm run dev       # 开发调试（默认 http://localhost:5173）
npm run build     # 构建生产版本到 dist/
npm run preview   # 本地预览构建产物
npm run app:build # 构建 Windows 桌面程序（输出到 release/）
```

## Android 打包（release APK）

1. 构建并同步 Web 资源：

   ```bash
   npm run build
   npx cap sync android
   ```

2. 编译签名 APK（需 JDK 17，本项目使用 Android Studio 自带 JBR）：

   ```bash
   cd android
   .\gradlew.bat assembleRelease
   ```

3. 产物位于 `android/app/build/outputs/apk/release/`。

> **签名说明**：签名信息配置在 `android/key.properties`（指向 `android/keystore/color-vision.jks`）。密钥库与密码丢失后将无法为同一应用发布更新，请务必备份。两者均已加入 `.gitignore`，不会进入版本库。

## 数据文件说明

### questions.js

每道题包含题图、答案与选项。`buildOptions()` 负责组装 6 个选项：2 个同类型干扰 + 3 个跨类型干扰，并随机排列。

### study.js

学习条目结构：

```js
{
  image: 'q_image11.png',   // 题目图（public/study/ 下）
  answer: '268',            // 正确答案
  category: 'number',       // easy | number | feature | review
  sub: 'num',               // 特征对应子分类: num | animal | other
  tip: '记忆技巧文案',
  details: ['image11_d1.png'] // 答案解析图（可选）
}
```

技巧记图模式的“原图”视图按 `q_imageN.png → plates/imageN.jpeg` 规则自动映射，无需额外配置；`category: 'easy'` 的条目不提供原图视图。

## 免责声明

本项目仅供个人学习与色觉自测参考，不构成医学诊断。色觉检查请以正规医疗机构的专业检查为准。
