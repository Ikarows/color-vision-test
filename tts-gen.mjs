// 色弱题库 TTS 批量生成脚本（edge.text-to-speech.cn）
// 用法: node tts-gen.mjs sample [q_imageN]      -> 生成单条示例（默认 q_image18, 默认版本优先）
//       node tts-gen.mjs full [--force]         -> 生成全部（遍历 src/data/editions/index.js 注册的所有版本,
//                                                  各版本音频输出到 public/{dirs.study}/tip_audios/）
//                                                  已存在且 >1KB 的文件跳过，--force 强制重生成
// 题目数据实时读取版本数据包（studyItems），数据包改动无需改本脚本

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EDITIONS, DEFAULT_EDITION_ID } from './src/data/editions/index.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

// 仓库根目录（脚本所在目录），音频直接输出到 public/study/{版本}/tip_audios/
const PROJECT = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://edge.text-to-speech.cn';
const SKIP_PHRASE = '简单一眼出，无需背';

// ---------- 数据源:实时读取所有已注册版本(与 studyItems 永远同步,新版本注册即自动纳入) ----------
// 每个 entry: { id, dir(如 'study/v6'), items(studyItems) }
const SOURCES = EDITIONS.map((ed) => ({
  id: ed.id,
  dir: ed.dirs.study,
  items: ed.studyItems,
}));

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
  return `这张图答案是${answerToCN(item.answer)}。技巧：${item.tip}`;
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
    // 默认版本优先,其次其余注册版本,逐版本检索
    const ordered = [...SOURCES].sort(
      (a, b) => (a.id === DEFAULT_EDITION_ID ? -1 : 0) - (b.id === DEFAULT_EDITION_ID ? -1 : 0),
    );
    let hit = null;
    for (const src of ordered) {
      const item = src.items.find((i) => i.image === img);
      if (item) { hit = { src, item }; break; }
    }
    if (!hit) throw new Error(`找不到 ${img}（已检索版本: ${SOURCES.map((s) => s.id).join(', ')}）`);
    jobs.push({
      item: hit.item,
      text: buildText(hit.item),
      out: path.join(PROJECT, 'public', hit.src.dir, 'tip_audios', hit.item.image.replace('.png', '_tip.mp3')),
    });
  } else {
    const force = process.argv.includes('--force');
    let skipped = 0;
    for (const src of SOURCES) {
      for (const item of src.items) {
        if (!item.tip || item.tip === SKIP_PHRASE) continue;
        const out = path.join(PROJECT, 'public', src.dir, 'tip_audios', item.image.replace('.png', '_tip.mp3'));
        if (!force && fs.existsSync(out) && fs.statSync(out).size > 1024) { skipped++; continue; }
        jobs.push({ item, text: buildText(item), out });
      }
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
