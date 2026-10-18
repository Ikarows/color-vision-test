// 色弱题库 TTS 批量生成脚本（edge.text-to-speech.cn）
// 用法: node tts-gen.mjs sample [q_imageN]      -> 生成单条示例（默认 q_image18, v6 套）
//       node tts-gen.mjs full [--force]         -> 生成全部（v6 -> public/study/v6/tip_audios/, v5 -> public/study/v5/tip_audios/）
//                                                  已存在且 >1KB 的文件跳过，--force 强制重生成

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

// 仓库根目录（脚本所在目录），音频直接输出到 public/study/{版本}/tip_audios/
const PROJECT = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://edge.text-to-speech.cn';
const SKIP_PHRASE = '简单一眼出，无需背';

// ---------- 数据 v6（-> public/study/v6/tip_audios/, 与 src/data/editions/v6.js 的 studyItems 同步） ----------
const V6_ITEMS = [
  { image: 'q_image2.png',  answer: '29',   tip: '记左上角：两对称三角形' },
  { image: 'q_image3.png',  answer: '69',   tip: '记左上角：两相互扣的三角形(6 9 嘛,懂得都懂)' },
  { image: 'q_image5.png',  answer: '60',   tip: '记左上角：平行四边形' },
  { image: 'q_image7.png',  answer: '916',  tip: '中间一大竖,或右上角深绿色四边形和三角形往内叩' },
  { image: 'q_image13.png', answer: '6289', tip: '顶部连续三个酒红色三角形' },
  { image: 'q_image15.png', answer: '2901', tip: '蓝色底图,右下角一个圈' },
  { image: 'q_image14.png', answer: '6098', tip: '右下角有一把向右弯刀' },
  { image: 'q_image16.png', answer: '8609', tip: '右下角有一把向左弯刀' },
  { image: 'q_image9.png',  answer: '628',  tip: '记右上像毛毛虫的长条图形是6 2 8' },
  { image: 'q_image29.png', answer: '899/022', tip: '先看出图分六个区域,看左上角:三个三角形就8 9 9、0 2 2' },
  { image: 'q_image30.png', answer: '621/989', tip: '同样分六个区域,左上角多个(四个)三角形或四边形就6 2 1、9 8 9' },
  { image: 'q_image37.png', answer: '522',  tip: '左上角：单个梯形' },
  { image: 'q_image39.png', answer: '5/8',  tip: '左上角：单个梯形 + 大 S 弯' },
  { image: 'q_image40.png', answer: '0/9',  tip: '一个大斜线' },
  { image: 'q_image38.png', answer: '825',  tip: '中间一只黑色眼睛就是8 2 5' },
  { image: 'q_image20.png', answer: '牛',   tip: '色弱看到的是鸡:鸡冠离得远是牛(双脚站立的是牛)' },
  { image: 'q_image25.png', answer: '羊',   tip: '鸡冠离得近是羊(单脚站立的是羊)' },
  { image: 'q_image21.png', answer: '蜻蜓', tip: '看右上角:对称绿色三角形——深绿是蜻蜓' },
  { image: 'q_image23.png', answer: '金鱼', tip: '看右上角:对称绿色三角形——浅绿是金鱼' },
  { image: 'q_image43.png', answer: '茶壶', tip: '看右上角:对称粉色三角形——粉色是茶壶' },
  { image: 'q_image22.png', answer: '鹅',   tip: '中间有个小人脸，其实看到一片的粉色线条基本就是了' },
  { image: 'q_image24.png', answer: '燕子', tip: '尖尖嘴巴是燕子' },
  { image: 'q_image26.png', answer: '兔子', tip: '深蓝色方块多，像个问号的是兔子' },
  { image: 'q_image27.png', answer: '蝴蝶', tip: '记两点眼睛加中间五边形' },
  { image: 'q_image18.png', answer: '△/○', tip: '记中间黑色大四边形' },
  { image: 'q_image19.png', answer: '○',    tip: '左上角大三角形 + 四边形' },
  { image: 'q_image28.png', answer: '○/✂',  tip: '色弱只看到圆圈,别忘了还有剪刀' },
  { image: 'q_image41.png', answer: '△/□',  tip: '左上角单个梯形 + 大 S 弯 + 右边梯形' },
  { image: 'q_image4.png',  answer: '88',   tip: '色弱看到 6 6,直接记 8 8,万事顺 6 才能发发' },
  { image: 'q_image6.png',  answer: '162',  tip: '色弱只看到 6,看底下:三角形少的记 1 6 2' },
  { image: 'q_image11.png', answer: '268',  tip: '色弱只看到 6,看底下:三角形四边形都有的记 2 6 8' },
  { image: 'q_image8.png',  answer: '56',   tip: '色弱看到 2,直接记 5 6,马兰开花二十一,二七、二八、二 5 6' },
  { image: 'q_image10.png', answer: '602',  tip: '色弱看到 9 8,直接记 6 0 2, 9 8 的酒贵,600 块得 2 支' },
  { image: 'q_image12.png', answer: '985',  tip: '色弱看到 8,直接记 9 8 5,梦寐以求的高校' },
  { image: 'q_image42.png', answer: '86',   tip: '色弱看到 9,直接记 8 6,酗酒不可取,迟早要 8 6(拜拜了)' },
];

// ---------- 数据 v5（-> public/study/v5/tip_audios/, 与 src/data/editions/v5.js 的 studyItems 同步） ----------
const V5_ITEMS = [
  { image: 'q_image1.png',  answer: '98',  tip: '大号的 9 8 直接看，小号 9 8=6 0 2' },
  { image: 'q_image2.png',  answer: '291', tip: '能看出来 2 9 1 就不用记，只看到个 9 的，9 上面仅有两个三角形直接记 2 9 1' },
  { image: 'q_image4.png',  answer: '88',  tip: '看到 6 6，直接记成 8 8' },
  { image: 'q_image10.png', answer: '286', tip: '能看出来 2 8 6 就不用记，只看到个 8 的，直接记 2 8 6' },
  { image: 'q_image41.png', answer: '908', tip: '看得出来 9 0 8 不用记，只看到个 0 的，直接记 9 0 8 即可' },
  { image: 'q_image44.png', answer: '698', tip: '看得出来 6 9 8 不用记，只看到个蓝色 9 的，9 上面图形多的直接记 6 9 8 即可' },
  { image: 'q_image46.png', answer: '2901', tip: '蓝色底图，斜着看能隐约看到数字 2 9 的，直接记 2 9 0 1' },
  { image: 'q_image48.png', answer: '602', tip: '看到小号 9 8，直接记成 6 0 2，酒吧里的酒太贵，600 块得 2 瓶' },
  { image: 'q_image53.png', answer: '60',  tip: '看得出来是 6 0 的不用记，只看到 0 0 的，直接记成 6 0 即可' },
  { image: 'q_image27.png', answer: '鱼',  tip: '看到这种花花的，要么是鱼，要么是鹅，可以记颜色，也可以记图，图形细碎，小的记鱼，图形大块的记鹅（小鱼，大鹅）' },
  { image: 'q_image28.png', answer: '鹅',  tip: '看到这种花花的，要么是鱼，要么是鹅，可以记颜色，也可以记图，图形细碎，小的记鱼，图形大块的记鹅（小鱼，大鹅）' },
  { image: 'q_image16.png', answer: '☆',   tip: '色弱只看到类似三角形，直接记成五角星即可（表示啥也看不见）' },
  { image: 'q_image20.png', answer: '△/○/△', tip: '能看出来不用记，只看到中间圆圈的，斜着看圆圈两边还有两个三角形' },
  { image: 'q_image21.png', answer: '□/△', tip: '首先一分为二看得出来，三角形比较容易看出来，看到三角形记住对应还有个正方形' },
  { image: 'q_image22.png', answer: '○/☆', tip: '首先斜线一分为二看得出来，五角星比较容易看出来，看到五角星记住对应还有个圆' },
  { image: 'q_image25.png', answer: '○/✂', tip: '看到圆圈，别忘了还有剪刀' },
  { image: 'q_image12.png', answer: '2/9', tip: '一分为二都能看出来，能看到个 9 的，记 2 和 9，看不到 9 的，记左上角四边形五边形=2 和 9' },
  { image: 'q_image13.png', answer: '6/0', tip: '首先一分为二都能看出来，能看到个 0 的，记 6 和 0，看不到 0 的，记左上角小点点和四边形的=6 和 0' },
  { image: 'q_image38.png', answer: '899/022', tip: '一分为 6 块，左上角长四边形的记 8 9 9、0 2 2，正梯形记 6 2 1、9 8 9' },
  { image: 'q_image39.png', answer: '621/989', tip: '一分为 6 块，左上角长四边形的记 8 9 9、0 2 2 ，正梯形记 6 2 1、9 8 9' },
  { image: 'q_image29.png', answer: '燕子', tip: '看得出来就不用记，或记左上正方形和四边形，也可以记它在鹅的下一页，鹅燕不分家' },
  { image: 'q_image30.png', answer: '蝴蝶', tip: '左上两三角形像翅膀，比翼双飞是蝴蝶' },
  { image: 'q_image31.png', answer: '蜻蜓', tip: '左上缺角的正方形，或中间两个正方形相连，正义使者蜻蜓队长' },
  { image: 'q_image32.png', answer: '鸽子', tip: '看得出来就不用记，看不出来看肚子图案显亮、显白，记亮白肚子是鸽子' },
  { image: 'q_image33.png', answer: '牛',   tip: '色弱看到个鸡，可记左上角，正梯形是牛，左上角没图案的是羊，或鸡小的是牛，鸡大的是羊' },
  { image: 'q_image35.png', answer: '羊',   tip: '色弱看到个鸡，可记左上角，正梯形是牛，左上角没图案的是羊，或鸡小的是牛，鸡大的是羊' },
  { image: 'q_image18.png', answer: '○',    tip: '左上角三角形紧跟四边形=大圆圈' },
  { image: 'q_image19.png', answer: '○/△', tip: '大块多边形，圆圈和三角形' },
  { image: 'q_image26.png', answer: '水杯', tip: '上方，三角形扣着菱形，就像倒咖啡，记杯子' },
  { image: 'q_image5.png',  answer: '69',  tip: '看得出来 6 9 就不用记，看中间很多三角形四边形围绕，记 6 9' },
  { image: 'q_image6.png',  answer: '60',  tip: '看得出来 6 0 就不用记，看不出来看中间一横线断开，记 6 0' },
  { image: 'q_image7.png',  answer: '98',  tip: '看到 6 0 且下面记得多边形，直接记 9 8 即可，麻溜麻溜跑去酒吧（9 8）' },
  { image: 'q_image8.png',  answer: '816', tip: '正中间，两个大黑色菱形，记 8 1 6' },
  { image: 'q_image9.png',  answer: '9',   tip: '直接看出来 9 就不用记，看不出来记左上角黑色菱形记成 9 即可' },
  { image: 'q_image11.png', answer: '62',  tip: '记左上角，大个三角形四边形记 6 2' },
  { image: 'q_image40.png', answer: '812', tip: '左上两大黑色四边形，记 8 1 2' },
  { image: 'q_image42.png', answer: '6098', tip: '左上单单一个直角三角形，记 6 0 9 8' },
  { image: 'q_image43.png', answer: '8609', tip: '很多大块头三角形四边形的记 8 6 0 9' },
  { image: 'q_image45.png', answer: '6289', tip: '记左上黑色方块，或在 6 9 8 下一页' },
  { image: 'q_image49.png', answer: '820', tip: '左上黑色方块像开花，记 8 2 0' },
];

// ---------- answer 转中文读法 ----------
const SYM = { '○': '圆圈', '□': '正方形', '△': '三角形', '☆': '星星', '✂': '剪刀', '☂': '雨伞' };
const DIGITS = '零一二三四五六七八九';
const numCN = (s) => s.split('').map(c => DIGITS[+c]).join('');

function answerToCN(ans) {
  ans = ans.trim();
  if (ans.includes('/')) {
    const parts = ans.split('/').map(s => s.trim()).filter(Boolean);
    if (parts.every(p => /^[0-9]+$/.test(p))) return parts.map(numCN).join('或');
    const names = parts.map(p => SYM[p] || p);
    if (names.length === 2 && names[0] === names[1]) return '两个' + names[0];
    return names.join('和');
  }
  if (SYM[ans]) return SYM[ans];
  // 相同符号连写,如 ○○ / ☆☆
  if (ans.length > 1 && /^([\s\S])\1+$/.test(ans) && SYM[ans[0]]) return '两个' + SYM[ans[0]];
  if (/^[0-9]+$/.test(ans)) return numCN(ans);
  return ans;
}

function buildText(item) {
  return `这张图答案是${answerToCN(item.answer)}。记忆技巧：${item.tip}`;
}

// ---------- 生成 ----------
async function genOne(page, text, outPath) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 30000 });
      try { await page.click('#dailyPopClose', { timeout: 3000 }); } catch {}
      await page.fill('#text', text);
      await page.click('#generate-btn');
      await page.waitForFunction(() => {
        const a = document.querySelector('audio');
        return a && a.src && a.src.includes('/download/');
      }, { timeout: 90000 });
      await page.waitForTimeout(800);
      const src = await page.evaluate(() => document.querySelector('audio').src);
      const b64 = await page.evaluate(async (u) => {
        const r = await fetch(u);
        const buf = await r.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) {
          bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        return btoa(bin);
      }, src);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
      return true;
    } catch (e) {
      console.error(`  [重试 ${attempt}/3] ${path.basename(outPath)} 失败: ${e.message.split('\n')[0]}`);
      await page.waitForTimeout(1500);
    }
  }
  return false;
}

async function main() {
  const mode = process.argv[2] || 'sample';
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  const jobs = [];
  if (mode === 'sample') {
    const img = `${process.argv[3] || 'q_image18'}.png`;
    const item = V6_ITEMS.find(i => i.image === img) || V5_ITEMS.find(i => i.image === img);
    if (!item) throw new Error(`找不到 ${img}`);
    const isV5 = V5_ITEMS.includes(item);
    jobs.push({
      item,
      text: buildText(item),
      out: path.join(PROJECT, 'public', 'study', isV5 ? 'v5' : 'v6', 'tip_audios', item.image.replace('.png', '_tip.mp3')),
    });
  } else {
    const force = process.argv.includes('--force');
    let skipped = 0;
    const outOf = (dir, item) => path.join(PROJECT, 'public', 'study', dir, 'tip_audios', item.image.replace('.png', '_tip.mp3'));
    for (const item of V6_ITEMS) {
      if (!item.tip || item.tip === SKIP_PHRASE) continue;
      const out = outOf('v6', item);
      if (!force && fs.existsSync(out) && fs.statSync(out).size > 1024) { skipped++; continue; }
      jobs.push({ item, text: buildText(item), out });
    }
    for (const item of V5_ITEMS) {
      if (!item.tip || item.tip === SKIP_PHRASE) continue;
      const out = outOf('v5', item);
      if (!force && fs.existsSync(out) && fs.statSync(out).size > 1024) { skipped++; continue; }
      jobs.push({ item, text: buildText(item), out });
    }
    if (skipped) console.log(`断点续跑: 跳过已存在 ${skipped} 条（--force 强制重生成）`);
  }

  console.log(`模式: ${mode}, 待生成: ${jobs.length} 条`);
  const results = [];
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    console.log(`[${i + 1}/${jobs.length}] ${path.basename(j.out)} <- ${j.text}`);
    const ok = await genOne(page, j.text, j.out);
    results.push({ out: j.out, ok, size: ok ? fs.statSync(j.out).size : 0 });
    if (i < jobs.length - 1) await page.waitForTimeout(1500);
  }

  await browser.close();
  const fail = results.filter(r => !r.ok || r.size < 1024);
  console.log(`\n完成: 成功 ${results.length - fail.length}/${results.length}`);
  if (fail.length) console.log('失败列表:', JSON.stringify(fail.map(f => f.out), null, 2));
}

main().catch(e => { console.error(' fatal:', e); process.exit(1); });
