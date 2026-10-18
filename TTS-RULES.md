# 色弱题库 TTS 语音生成规则

> 完整可复用文档：把本文整份丢给任何 AI，即可复现整套语音生成流程。

## 一、目标

为色弱测试图题库批量生成「记忆技巧语音」，格式 MP3，微软晓晓音色。

## 二、语音文案拼接规则

每条语音的文本 = `这张图答案是` + **answer 中文读法** + `。记忆技巧：` + **tip 原文**

- tip 原文不做任何转换，原样拼接（数字若已用空格逐位隔开如「6 0 2」，保留空格让 TTS 逐位读）
- answer 字段必须转成中文读法，规则见下节

## 三、answer 字段转中文读法

1. **纯数字**：逐位读，不读数值。如 `602`→六零二、`29`→二九、`6289`→六二八九（数字用汉字：零一二三四五六七八九）
2. **斜杠分隔的数字**（多答案）：中间用「或」连接。如 `899/022`→八九九或零二二、`5/8`→五或八
3. **符号转中文**：`○`=圆圈、`□`=正方形、`△`=三角形、`☆`=星星、`✂`=剪刀、`☂`=雨伞
4. **斜杠分隔的符号**：用「和」连接。如 `△/○`→三角形和圆圈、`□/△`→正方形和三角形、`○/✂`→圆圈和剪刀、`○/☆`→圆圈和星星
5. **相同符号连写或斜杠重复**：叫「两个X」。如 `○○`→两个圆圈、`☆☆`→两个星星、`○/○`→两个圆圈
6. **三个符号斜杠**：依次「和」连接。如 `△/○/△`→三角形和圆圈和三角形
7. **单个符号**：直接叫。如 `☆`→星星、`○`→圆圈
8. **中文词**（熊猫、牛、红色等）原样使用

## 四、跳过规则（不生成语音）

- tip 为空的条目
- tip 为「简单一眼出，无需背」的条目

## 四·补、构建产物中的音频改名（资源保护）

- `npm run build` 会在 vite build 后自动执行 `scripts/protect-assets.mjs`
- dist 内所有 `.mp3` 被重命名为 `.aud`（内容不变，防浏览器/下载器直接识别保存）
- 运行时 [useTipAudio.js](src/composables/useTipAudio.js) 的 `tipAudioSrc()` 在生产环境自动把 `.mp3` 映射为 `.aud`，开发环境（vite dev）仍用原名
- `public/` 源文件始终保持 `.mp3`，不受影响

## 五、生成站点

### 1. 首选：https://edge.text-to-speech.cn

- 免费、无需登录，微软晓晓等 Azure 神经音色
- 页面要素：输入框 `textarea#text`、生成按钮 `#generate-btn`
- 进入页面先关每日弹窗 `#dailyPopClose`
- 生成后音频出现在 `<audio>` 元素，src 形如 `/download/xxx.mp3`
- 抓取方式：页面上下文 `fetch` 音频 URL → 转 base64 → Node 存盘为 mp3

### 2. 备选：https://fuym.cn

- 同样免费 TTS
- 需要用户 Cookie 登录后才有高音质选项
- 音质下拉框 `quality-select` 选最高档：`audio-48khz-192kbitrate-mono-mp3`

## 六、文件存放路径

| 题库 | 数据文件 | 音频目录 | tipAudio 路径写法 |
|------|----------|----------|-------------------|
| v6（第六版） | `src/data/editions/v6.js`（studyItems） | `public/study/v6/tip_audios/` | `tip_audios/q_imageN_tip.mp3` |
| v5（第五版） | `src/data/editions/v5.js`（studyItems） | `public/study/v5/tip_audios/` | `tip_audios/q_imageN_tip.mp3` |

- 文件命名：`q_imageN_tip.mp3`（与数据包 image 字段 `q_imageN.png` 对应）
- tipAudio 写相对 study 目录的路径，运行时经 `src/utils/assets.js` 的 `studyPath()` 解析为 `/study/{版本}/tip_audios/q_imageN_tip.mp3`
- 注意：两套题库 `q_imageN` 编号重叠但内容不同，所以必须分开放 `v6/`、`v5/` 两个目录
- 当前规模：v6 35 条 / v5 40 条，共 75 个 mp3

## 七、批量自动化方案

1. **框架**：Node.js + playwright-core 无头驱动，`channel: "msedge"`（用本机 Edge，无需另装浏览器）
2. **防限流**：每条生成后间隔 1.5 秒；单条失败重试 3 次
3. **断点续跑**：已存在且 >1KB 的文件跳过；强制重生成时不跳
4. **脚本用法**（仓库根目录 `tts-gen.mjs`，音频直接输出到 `public/study/{版本}/tip_audios/`）：
   - `node tts-gen.mjs sample q_imageN` — 单条试听（默认 q_image18，v6 套）
   - `node tts-gen.mjs full` — 全量生成（v6 35 条 / v5 40 条；数据内嵌在脚本数组里，改文案改数组即可）
   - 已存在且 >1KB 的文件自动跳过（断点续跑），`full --force` 强制重生成

## 八、数据文件说明

- `src/data/editions/v6.js`：第六版 `studyItems` 共 48 条（简单易看 13 / 特征认图 28〔数字 15 / 动物 8 / 其它 5〕/ 数字口诀 7），其中 35 条有 tipAudio
- `src/data/editions/v5.js`：第五版 `studyItems` 共 65 条（41 简单一眼出 + 13 特征认图 + 11 数字口诀），其中 40 条有 tipAudio
- tipAudio 字段指向对应语音文件；tip 为空或「简单一眼出，无需背」的条目无 tipAudio 字段
- 播放由 `src/composables/useTipAudio.js` 统一处理：语音 fetch 转 Blob 播放（绕开夸克等浏览器对媒体 URL 的下载劫持），支持手动试听、自动连播（单个/分类/全部循环、切卡间隔可调）与下一条预取
