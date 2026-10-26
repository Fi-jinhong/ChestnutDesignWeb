#!/usr/bin/env node
/* 栗子作品集 —— 刷新 preloader.js 里的资源体积表
 *
 * 进度条是按文件真实字节数加权的，图片/视频压缩或换名之后必须重算，
 * 否则进度会跑得不准（缺项回退到 DEFAULT_* 估值）。
 *
 * 用法：node work/refresh-preloader-weights.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'outputs', 'chestnut-local', 'public');
const PRELOADER = path.join(ROOT, 'local', 'preloader.js');

const weightByIdentifiers = (blocks) => blocks;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const source = fs.readFileSync(PRELOADER, 'utf8');
const start = source.indexOf('  var WEIGHTS = {');
const end = source.indexOf('};', start);
if (start < 0 || end < 0) {
  console.error('没有找到 WEIGHTS 块，脚本未改动文件');
  process.exit(1);
}

// 保留体积表里已经登记的路径（相对站点根目录），按新文件大小重写
const urls = [...source.slice(start, end).matchAll(/"([^"]+)":\s*(\d+)/g)].map((m) => m[1]);
const lines = [];
let missing = 0;
for (const url of urls) {
  const file = path.join(ROOT, url.replace(/^\//, ''));
  if (!fs.existsSync(file)) { missing++; continue; }      // 已被优化掉的资源直接丢弃
  lines.push(`  "${url}": ${fs.statSync(file).size}`);
}

const next = source.slice(0, start) + '  var WEIGHTS = {\n' + lines.join(',\n') + '\n' + source.slice(end);
fs.writeFileSync(PRELOADER, next);
console.log(`WEIGHTS 已刷新：${lines.length} 项保留，${missing} 项（旧资源）已移除`);
