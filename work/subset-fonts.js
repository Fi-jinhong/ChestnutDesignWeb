#!/usr/bin/env node
/* 栗子作品集 —— 中文字体子集化
 *
 * HarmonyOS Sans SC 全量三个字重共 12.2MB，是首屏最大的开销。
 * 站点文案是静态的，只需要保留页面里真正出现过的字，
 * 子集化后每个字重只剩几十 KB。
 *
 * 用法：node work/subset-fonts.js          # 生成子集字体 + 改写 CSS 引用
 *       node work/subset-fonts.js --dry    # 只看字符集统计，不写文件
 *
 * 依赖：subset-font（npm i subset-font，用 harfbuzz wasm，无需本地编译工具链）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const subsetFont = require('subset-font');

const ROOT = path.join(__dirname, '..', 'outputs', 'chestnut-local', 'public');
const FONT_DIR = path.join(ROOT, 'fonts', 'harmonyos-sans-sc');
const DRY = process.argv.includes('--dry');

const WEIGHTS = [
  { file: 'HarmonyOS_Sans_SC_Regular.woff2', out: 'HarmonyOS_Sans_SC_Regular-subset.woff2' },
  { file: 'HarmonyOS_Sans_SC_Medium.woff2', out: 'HarmonyOS_Sans_SC_Medium-subset.woff2' },
  { file: 'HarmonyOS_Sans_SC_Bold.woff2', out: 'HarmonyOS_Sans_SC_Bold-subset.woff2' },
];

const SCAN_EXT = new Set(['.html', '.js', '.css', '.json', '.svg', '.md', '.txt']);

/* ---------- 1. 收集站点实际用到的字符 ---------- */
function collectText() {
  const chars = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['fonts', 'downloads', 'project-details', 'media'].includes(entry.name)) continue;
        walk(p);
      } else if (SCAN_EXT.has(path.extname(entry.name).toLowerCase())) {
        chars.update ? chars.update : null;
        for (const ch of fs.readFileSync(p, 'utf8')) chars.add(ch);
      }
    }
  };
  walk(ROOT);
  return chars;
}

function filterChars(chars) {
  // 只保留会真正排版的字符：字母/数字/标点/符号，去掉换行等控制字符
  const keep = new Set();
  for (const ch of chars) {
    const cp = ch.codePointAt(0);
    if (cp < 0x20 || cp === 0x7f) continue;
    if (/\p{L}|\p{N}|\p{P}|\p{S}/u.test(ch)) keep.add(ch);
  }
  // 保险起见补上常用全角符号与排版空格
  for (const ch of '　，。、；：？！“”‘’（）【】《》—…·～￥％＆＃＠／＼') keep.add(ch);
  for (const ch of '0123456789') keep.add(ch);
  return [...keep].sort().join('');
}

/* ---------- 2. 生成子集并改写 CSS ---------- */
(async () => {
  const usedChars = filterChars(collectText());
  const cjk = [...usedChars].filter((c) => /[一-鿿]/.test(c)).length;
  console.log(`站点字符集：${[...usedChars].length} 个字符（其中汉字 ${cjk} 个）`);
  if (DRY) return;

  for (const w of WEIGHTS) {
    const src = path.join(FONT_DIR, w.file);
    const dst = path.join(FONT_DIR, w.out);
    const input = fs.readFileSync(src);
    const out = await subsetFont(input, usedChars, {
      targetFormat: 'woff2',
      // 保留 OpenType 特性，避免数字/标点变形
      preserveNameIds: '',
    });
    fs.writeFileSync(dst, out);
    const before = (input.length / 1024).toFixed(0);
    const after = (out.length / 1024).toFixed(0);
    console.log(`${w.file}: ${before}KB → ${after}KB (${w.out})`);
  }

  // 把 CSS 里的字体路径换成子集版
  const css = path.join(ROOT, 'assets', 'index-y2iB4ThX.css');
  let style = fs.readFileSync(css, 'utf8');
  let changed = 0;
  for (const w of WEIGHTS) {
    const from = `harmonyos-sans-sc/${w.file}`;
    const to = `harmonyos-sans-sc/${w.out}`;
    const n = style.split(from).length - 1;
    if (n) { style = style.split(from).join(to); changed += n; }
  }
  fs.writeFileSync(css, style);
  console.log(`CSS 字体引用已更新：${changed} 处`);
})().catch((e) => { console.error('子集化失败：', e); process.exit(1); });
