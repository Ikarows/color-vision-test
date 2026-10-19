// 构建后处理：资源保护（由 npm run build 在 vite build 之后自动执行）
// 1) 图片处理：检出答案栏的图 → 在图片底部中央贴渐变印章字（文字取网站标题，
//    首页标题同款蓝青渐变）；答案解析图（*_dN 文件名，黑底大数字/照片型细节图）
//    按文件名识别直接贴章；其余未检出答案栏的图跳过。
//    画质优先：PNG 保持原格式，贴章重存用 palette 量化（观感无损、体积可控）；
//    JPG 仅贴章图重编码且质量 95（视觉无损）。
// 2) 音频改名：dist 内所有 .mp3 重命名为 .aud，避免被浏览器/下载器直接识别保存
// 只处理 dist 产物，public/ 源文件不受影响；开发环境（vite dev）仍用明文原名。

// ===== 可调配置（改完重新 npm run build 即可生效） =====
const JPG_QUALITY = 95;  // JPG 重编码质量（仅贴章的 JPG 需要重编码；95 ≈ 视觉无损）
const PNG_AS_JPG = false; // true = 学习图 PNG 统一转存 JPG（体积约省一半，但有画质损失）；false = 保持 PNG 原格式
const STAMP_TEXT = null; // 印章文字；null = 自动读取 index.html 的 <title> 网站标题

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import sharp from 'sharp';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, 'dist');
const STUDY_DIR = path.join(DIST, 'study');
const PLATES_DIR = path.join(DIST, 'plates');
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg']);
const CONCURRENCY = 8;
// 印章文字：取站点标题（.env 的 VITE_APP_TITLE，与前端组件/index.html 同源配置）
function siteTitle() {
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, 'utf-8').match(/^VITE_APP_TITLE\s*=\s*(.+?)\s*$/m);
    if (m) return m[1].replace(/^["']|["']$/g, '');
  }
  const htmlPath = path.join(DIST, 'index.html');
  if (fs.existsSync(htmlPath)) {
    const m = fs.readFileSync(htmlPath, 'utf-8').match(/<title>([^<]+)<\/title>/);
    if (m) return m[1].trim();
  }
  return '色盲色弱助手';
}
const TEXT = STAMP_TEXT || siteTitle();

// 印章字体：优先用仓库内置的 Noto Sans SC Bold 子集（scripts/fonts/，SIL OFL 1.1 许可，
// 只含印章所需字符），跨平台可用——云构建/Linux 环境没有 Windows 字体也能正常出字；
// 若印章文字含子集未收录的字符则回退本机微软雅黑，避免缺字方块
const STAMP_FONT_FAMILY = 'StampFont';
const BUNDLED_FONT = path.join(ROOT, 'scripts', 'fonts', 'stamp-subset.otf');
const BUNDLED_CHARSET = path.join(ROOT, 'scripts', 'fonts', 'stamp-subset.charset.txt');
const WIN_FONT = 'C:/Windows/Fonts/msyh.ttc';

function pickStampFont() {
  const winOk = fs.existsSync(WIN_FONT);
  if (fs.existsSync(BUNDLED_FONT)) {
    let covered = true;
    try {
      const chars = fs.readFileSync(BUNDLED_CHARSET, 'utf-8');
      covered = [...TEXT].every(ch => chars.includes(ch));
    } catch { /* 字符集文件缺失按未覆盖处理 */ }
    if (covered) return BUNDLED_FONT;
    if (winOk) {
      console.warn(`protect-assets: 印章文字「${TEXT}」含子集未收录字符，回退微软雅黑`);
      return WIN_FONT;
    }
    console.warn('protect-assets: 印章文字含未收录字符且无系统字体，可能出现缺字方块');
    return BUNDLED_FONT;
  }
  return WIN_FONT;
}
if (!GlobalFonts.registerFromPath(pickStampFont(), STAMP_FONT_FAMILY)) {
  console.warn('protect-assets: 印章字体注册失败，印章文字将无法显示');
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// 覆盖左下角答案栏：同一套扫描图的答案栏几何位置固定（上缘 ≈90%H），
// 以白条盖住原题号/答案并写上 APP 名；图片主体不做任何处理，未检出答案栏的图跳过
function coverAnswerBar(canvas) {
  const ctx = canvas.getContext('2d');
  const { width: W, height: H } = canvas;
  const img = ctx.getImageData(0, 0, W, H).data;
  const at = (x, y) => {
    const i = (y * W + x) * 4;
    return [img[i], img[i + 1], img[i + 2]];
  };
  // 条内像素：低饱和亮/灰色且偏蓝或中性（v5 条底浅蓝 sat≈54，v6 浅蓝白 sat≈22）；
  // 米色/绿色/橙色斑块（r > b）与高饱和彩色 = 色盲图主体
  const isBarPx = (r, g, b) => {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    return max - min < 70 && min > 40 && b >= r - 8;
  };

  // 特写/局部小图没有答案栏，直接跳过（完整色板都是大图）
  if (W < 600) return false;

  // 答案栏主体行区间（上缘基准 90.5%H，下缘 98.5%H，避开底部白边框）
  const zoneTop = Math.round(H * 0.905);
  const zoneBot = Math.round(H * 0.985);

  // 右缘：从左向右按"列占比"（≥40% 行为条内像素）推进，允许 ≤3%W 的文字密列间隙
  const colGap = Math.round(W * 0.03);
  const zoneH = zoneBot - zoneTop + 1;
  let barRight = -1;
  for (let x = Math.round(W * 0.04); x < W * 0.55; x++) {
    let cnt = 0;
    for (let y = zoneTop; y <= zoneBot; y++) { const [r, g, b] = at(x, y); if (isBarPx(r, g, b)) cnt++; }
    if (cnt / zoneH >= 0.4) barRight = x;
    else if (barRight >= 0 && x - barRight > colGap) break;
  }
  if (barRight >= W * 0.18) {
    // 上缘：从 88%H 向下找到第一行"行占比 ≥60%"的行（即条的上边界），无效则跳过
    let barTop = -1;
    for (let y = Math.round(H * 0.88); y <= Math.round(H * 0.93); y++) {
      let cnt = 0;
      for (let x = 1; x <= barRight; x++) { const [r, g, b] = at(x, y); if (isBarPx(r, g, b)) cnt++; }
      if (cnt / barRight >= 0.6) { barTop = y; break; }
    }
    if (barTop >= 0 && H - barTop >= H * 0.04 && H - barTop <= H * 0.14) {
      // 含字校验：真答案栏内有深色数字（题号/答案）；照片灰边假栏没有 → 落到答案解析图分支
      let darkCnt = 0, sampled = 0;
      for (let y = barTop; y < H; y += 2) {
        for (let x = 1; x < barRight; x += 2) {
          sampled++;
          const [r, g, b] = at(x, y);
          if (Math.max(r, g, b) < 100 && Math.max(r, g, b) - Math.min(r, g, b) < 50) darkCnt++;
        }
      }
      if (darkCnt / sampled >= 0.004) {
        drawStamp(ctx, W, H);
        return true;
      }
    }
  }
  // 答案解析图（照片型 *_d2 等）已改由 watermarkImage 按文件名识别贴章，此处不再做像素判定
  return false;
}

// 渐变印章字：首页标题同款渐变（#1d4ed8 → #0d9488）+ 白描边，贴底部右下角
function drawStamp(ctx, W, H) {
  const fontSize = Math.max(12, Math.round(W * 0.037));
  const cy = Math.round(H * 0.945);
  ctx.save();
  ctx.font = `bold ${fontSize}px ${STAMP_FONT_FAMILY}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  const tw = ctx.measureText(TEXT).width;
  // 右下角：文字右缘距图右 2.5%W（让开照片白边框），避开学习图底部中央的红圈技巧标注
  const cx = Math.round(W * 0.975 - tw / 2);
  ctx.globalAlpha = 0.75; // 整体淡一些(描边+文字同步)
  const grad = ctx.createLinearGradient(cx - tw / 2, 0, cx + tw / 2, 0);
  grad.addColorStop(0, '#1d4ed8');
  grad.addColorStop(1, '#0d9488');
  ctx.lineWidth = Math.max(1.2, fontSize * 0.13);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.strokeText(TEXT, cx, cy);
  ctx.fillStyle = grad;
  ctx.fillText(TEXT, cx, cy);
  ctx.restore();
}

const RENAMED = []; // PNG→JPG 文件名映射（basename），用于更新 dist 内数据引用

async function watermarkImage(file) {
  const img = await loadImage(file);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  // 答案解析图（*_dN：黑底大数字/照片型细节图）按文件名识别直接贴章，
  // 不依赖像素检测（黑底图过不了浅色剖面判定）；其余图靠答案栏像素检出
  const isDetail = /_d\d+\.(png|jpe?g)$/i.test(path.basename(file));
  const hasBar = coverAnswerBar(canvas);
  if (!hasBar && isDetail) drawStamp(ctx, img.width, img.height);
  const covered = hasBar || isDetail;
  const ext = path.extname(file).toLowerCase();
  const opt = { raw: { width: img.width, height: img.height, channels: 4 } };
  // 可选：学习图 PNG 统一转存 JPG（贴章与否都转，保证引用替换一致），删除旧 PNG
  if (ext === '.png' && PNG_AS_JPG) {
    const raw = Buffer.from(ctx.getImageData(0, 0, img.width, img.height).data.buffer);
    const buf = await sharp(raw, opt).jpeg({ quality: JPG_QUALITY, mozjpeg: true }).toBuffer();
    fs.writeFileSync(file.slice(0, -4) + '.jpg', buf);
    fs.unlinkSync(file);
    RENAMED.push([path.basename(file), path.basename(file.slice(0, -4) + '.jpg')]);
    return covered ? 'covered' : 'renamed';
  }
  if (!covered) return 'skipped';
  const raw = Buffer.from(ctx.getImageData(0, 0, img.width, img.height).data.buffer);
  // PNG 贴章重存：palette 量化（quality 90 + 抖动）为项目沿用方案，观感无损且体积可控；
  // 全彩无损重存体积膨胀 3 倍+（实测 dist 247MB），不可用；黑底解析图仅黑/红/渐变数色，量化完全无损
  const buf = ext === '.png'
    ? await sharp(raw, opt).png({ palette: true, quality: 90, compressionLevel: 9, dither: 0.5 }).toBuffer()
    : await sharp(raw, opt).jpeg({ quality: JPG_QUALITY, mozjpeg: true }).toBuffer();
  fs.writeFileSync(file, buf);
  return 'covered';
}

async function runPool(items, worker) {
  let i = 0;
  const lanes = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      await worker(item);
    }
  });
  await Promise.all(lanes);
}

async function main() {
  if (!fs.existsSync(DIST)) {
    console.error('protect-assets: dist/ 不存在，请先执行 vite build');
    process.exit(1);
  }

  // 1) 题库/学习资源图片：覆盖左下角答案栏
  //    study/ = 学习页图，plates/ = 测试页检查原图（同样带答案标注，必须一并处理）
  //    UI 图标等不在这些目录，不受影响
  const images = [...walk(STUDY_DIR), ...walk(PLATES_DIR)]
    .filter(f => IMAGE_EXT.has(path.extname(f).toLowerCase()));
  let covered = 0, renamed = 0, skipped = 0;
  await runPool(images, async f => {
    const r = await watermarkImage(f);
    if (r === 'skipped') skipped++;
    else if (r === 'renamed') renamed++;
    else covered++;
  });
  console.log(`protect-assets: 贴章 ${covered} 张，PNG 转 JPG ${renamed} 张，跳过 ${skipped} 张（dist/study/ + dist/plates/）`);

  // PNG→JPG 后同步更新 dist 内 js/css/html 里的文件名引用（数据包 image 字段为 basename）
  if (RENAMED.length) {
    let hitFiles = 0;
    for (const f of walk(DIST)) {
      if (!/\.(js|mjs|css|html)$/i.test(path.extname(f))) continue;
      let s = fs.readFileSync(f, 'utf-8'), hit = false;
      for (const [from, to] of RENAMED) {
        if (s.includes(from)) { s = s.split(from).join(to); hit = true; }
      }
      if (hit) { fs.writeFileSync(f, s); hitFiles++; }
    }
    console.log(`protect-assets: 更新图片引用 ${RENAMED.length} 项，改写文件 ${hitFiles} 个`);
  }

  // 2) mp3 -> .aud
  const audios = walk(DIST).filter(f => path.extname(f).toLowerCase() === '.mp3');
  for (const f of audios) {
    const renamed = f.slice(0, -4) + '.aud';
    fs.renameSync(f, renamed);
  }
  console.log(`protect-assets: 音频改名 ${audios.length} 个（.mp3 -> .aud）`);
}

main().catch(err => {
  console.error('protect-assets 失败:', err);
  process.exit(1);
});
