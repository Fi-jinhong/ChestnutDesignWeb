#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为本地静态站点注入「首屏加载进度页」：
1. 在每个 HTML 的 <head> 末尾插入关键 CSS（内联，保证第一时间可见）
2. 在 <body> 开头插入 loading 遮罩 DOM
3. 写入 /local/preloader.js（带真实文件体积权重表）

幂等：已注入过的页面会跳过。
"""
import json
import os
import re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "outputs", "chestnut-local", "public")

CRITICAL_CSS = """<style id="preloader-critical">html.skip-preloader #site-preloader{display:none!important}html.is-preloading,html.is-preloading body{overflow:hidden}#site-preloader{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#050607;color:#f4f5f7;font-family:'Inter',-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;transition:opacity .6s ease,visibility .6s ease}#site-preloader::after{content:'';position:absolute;left:50%;top:50%;width:64vmax;height:64vmax;transform:translate(-50%,-50%);background:radial-gradient(circle,#a886ff2b 0%,#a886ff12 38%,#0000 68%);pointer-events:none}#site-preloader.is-hidden{opacity:0;visibility:hidden;pointer-events:none}.preloader-inner{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:22px;width:min(76vw,340px)}.preloader-mark{font-size:12px;font-weight:500;letter-spacing:.42em;text-transform:uppercase;color:#a886ff}.preloader-num{display:flex;align-items:flex-start;gap:5px;font-size:clamp(46px,11vw,68px);line-height:1;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums}.preloader-num i{font-style:normal;font-size:.3em;font-weight:500;margin-top:.7em;color:#ffffff80}.preloader-bar{width:100%;height:2px;border-radius:2px;background:#ffffff1f;overflow:hidden}.preloader-bar span{display:block;width:0;height:100%;border-radius:2px;background:linear-gradient(90deg,#cbb0ff,#a886ff);transition:width .2s linear}.preloader-hint{margin:0;font-size:12px;letter-spacing:.14em;color:#ffffff66}@media (prefers-reduced-motion:reduce){#site-preloader{transition:opacity .2s ease}}</style>"""

OVERLAY_HTML = (
    '<div class="site-preloader" id="site-preloader" role="progressbar" aria-label="页面加载进度" '
    'aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">'
    '<div class="preloader-inner">'
    '<p class="preloader-mark">Chestnut</p>'
    '<p class="preloader-num"><span id="preloader-num">0</span><i>%</i></p>'
    '<div class="preloader-bar"><span id="preloader-bar"></span></div>'
    '<p class="preloader-hint" id="preloader-hint">正在准备作品集</p>'
    "</div></div>"
)

GUARD_SCRIPT = (
    '<script>'
    '(function(){var r=document.documentElement;'
    'var skip=false;try{skip=sessionStorage.getItem("chestnut-preloaded")==="1";}catch(e){}'
    'if(skip){r.classList.add("skip-preloader");}else{r.classList.add("is-preloading");}'
    'window.__preloaderTs=Date.now();'
    'window.__killPreloader=function(){r.classList.remove("is-preloading");'
    'var o=document.getElementById("site-preloader");if(o&&o.parentNode){o.parentNode.removeChild(o);}};'
    'setInterval(function(){if(Date.now()-window.__preloaderTs>8000){window.__killPreloader();}},1000);'
    'window.addEventListener("pageshow",function(e){if(e.persisted){window.__killPreloader();}});'
    '})();</script>'
)

LOADER_TAG = '<script defer src="/local/preloader.js"></script>'


def build_weights():
    """扫描站点真实文件大小，作为进度权重（单位：字节）。"""
    weights = {}
    patterns = [
        ("media", r".*\.(png|jpg|jpeg|webp|mp4)$"),
        ("project-details", r".*\.(png|jpg|jpeg|webp)$"),
        ("covers", r".*\.(png|jpg|jpeg|webp)$"),
        ("assets", r".*\.css$"),
    ]
    for folder, pat in patterns:
        base = os.path.join(ROOT, folder)
        if not os.path.isdir(base):
            continue
        for dirpath, _dirnames, filenames in os.walk(base):
            for name in filenames:
                if re.match(pat, name, re.I):
                    full = os.path.join(dirpath, name)
                    url = "/" + os.path.relpath(full, ROOT).replace(os.sep, "/")
                    try:
                        weights[url] = os.path.getsize(full)
                    except OSError:
                        pass
    return weights


PRELOADER_JS = """/* CHESTNUT 作品集 — 首屏加载进度页
 * 统计首屏关键资源（背景视频 + 封面图 + 字体）的真实加载情况，0~100 走完后再淡出进入站点。
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var overlay = document.getElementById('site-preloader');
  if (!overlay) { root.classList.remove('is-preloading'); return; }

  // 本会话已完成过一次加载：直接跳过，不再显示进度页
  try {
    if (sessionStorage.getItem('chestnut-preloaded') === '1') {
      root.classList.remove('is-preloading');
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      return;
    }
  } catch (e) {}

  var numEl = document.getElementById('preloader-num');
  var barEl = document.getElementById('preloader-bar');
  var hintEl = document.getElementById('preloader-hint');

  // 权重 = 文件真实体积（字节），让进度条按体积而非数量推进
  var WEIGHTS = __WEIGHTS__;
  var DEFAULT_VIDEO = 8000000;
  var DEFAULT_IMAGE = 700000;

  /* 两种模式：
   * 首页（无 .case-page）→ 全量预加载：所有图片、视频、字体全部就绪才进入，
   *   避免进入后还看到图片一张张冒出来；
   * 详情页（.case-page）→ 只等首屏前几张，画廊图交给 progressive-images.js 逐张加载。
   */
  var isCasePage = !!document.querySelector('.case-page');
  var FULL = !isCasePage;

  var MIN_MS = 700;                        // 最短展示时长，避免一闪而过
  // 首页要等全部内容，超时兜底给到 60s；详情页走短超时
  var MAX_MS = FULL ? 60000 : 20000;
  // 卡死保护：详情页连续 6s 无进展就放行；首页不用（大图下载中也会被判为无进展）
  var STALL_MS = FULL ? 0 : 6000;

  var startedAt = Date.now();
  var tasks = [];

  function addTask(weight, fracFn) {
    tasks.push({ w: weight || 1, frac: fracFn });
  }

  function fracOf(task) {
    var f;
    try { f = task.frac(); } catch (e) { return 1; }
    if (typeof f !== 'number' || !isFinite(f)) return 0;
    return f < 0 ? 0 : f > 1 ? 1 : f;
  }

  function progress() {
    var total = 0, done = 0;
    for (var i = 0; i < tasks.length; i++) {
      total += tasks[i].w;
      done += tasks[i].w * fracOf(tasks[i]);
    }
    return total > 0 ? done / total : 1;
  }

  function weightOf(url, fallback) {
    var w = WEIGHTS[url];
    return typeof w === 'number' && w > 0 ? w : fallback;
  }

  /* ---------- 1. 背景视频：按缓冲进度计，能连续播放即算完成 ---------- */
  var video = document.querySelector('video');
  if (video) {
    var vsrc = video.getAttribute('src') || '';
    var sourceEl = video.querySelector('source');
    if (!vsrc && sourceEl) vsrc = sourceEl.getAttribute('src') || '';
    try {
      video.setAttribute('preload', 'auto');
      video.load();
    } catch (e) {}

    addTask(weightOf(vsrc, DEFAULT_VIDEO), function () {
      if (video.readyState >= 3) return 1;            // HAVE_FUTURE_DATA：可以开始流畅播放
      // 兜底：iOS/省流模式下视频可能根本不预加载，超时后不再卡住进度
      if (Date.now() - startedAt > 25000) return 1;
      if (video.readyState >= 2) return 0.9;          // HAVE_CURRENT_DATA
      try {
        var b = video.buffered, d = video.duration;
        if (b && b.length && d && isFinite(d) && d > 0) {
          return Math.min(0.85, b.end(b.length - 1) / d);
        }
      } catch (e) {}
      return 0;
    });
  }

  /* ---------- 2. 图片：首页全部预加载，详情页只等首屏 ---------- */
  var tracked = [];
  var imgs = document.querySelectorAll('img[src]');
  var limit = FULL ? imgs.length : 6;

  function trackImage(img, idx) {
    if (tracked.indexOf(img) >= 0) return;
    tracked.push(img);
    var src = img.getAttribute('src') || '';
    var w = weightOf(src, DEFAULT_IMAGE);
    try {
      img.setAttribute('loading', 'eager');
      img.setAttribute('decoding', 'async');
      if (idx < 2) img.setAttribute('fetchpriority', 'high');
    } catch (e) {}
    // 直接轮询 img.complete，无需额外事件
    addTask(w, function () { return img.complete ? 1 : 0; });
  }

  for (var i = 0; i < imgs.length && i < limit; i++) trackImage(imgs[i], i);

  // 首页：把 JS 运行时插入的图片（联系弹层二维码等）也一并纳入统计
  var mo = null;
  if (FULL && window.MutationObserver) {
    mo = new MutationObserver(function () {
      var all = document.querySelectorAll('img[src]');
      for (var k = 0; k < all.length; k++) trackImage(all[k], tracked.length);
    });
    try { mo.observe(document.documentElement, { childList: true, subtree: true }); } catch (e) { mo = null; }
  }

  /* ---------- 3. 文档 + 字体就绪 ---------- */
  // 注意：不能等 window.load —— 背景视频是流式下载，load 事件会被一直拖着不触发
  // （实测限速下 readyState 长期停在 interactive）。图片/视频已单独统计，这里只看 DOM 解析完成。
  var docReady = document.readyState !== 'loading';
  if (!docReady) {
    document.addEventListener('DOMContentLoaded', function () { docReady = true; }, { once: true });
  }
  var fontsReady = false;
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { fontsReady = true; }, function () { fontsReady = true; });
    setTimeout(function () { fontsReady = true; }, 8000);  // 字体排在队尾时给个兜底
  } else {
    fontsReady = true;
  }
  // 首页给文档/字体更高权重：window.load 会等到所有 eager 图片完成，是个额外保险
  addTask(FULL ? 2000000 : 500000, function () { return (docReady ? 0.6 : 0) + (fontsReady ? 0.4 : 0); });

  /* ---------- 渲染循环 ---------- */
  var displayed = 0;
  var allDone = false;
  var finishing = false;
  var hidden = false;
  var hinted = false;
  var lastValue = -1;
  var lastGainAt = Date.now();

  function render() {
    var v = Math.floor(displayed);
    if (numEl && numEl.textContent !== String(v)) {
      numEl.textContent = String(v);
      overlay.setAttribute('aria-valuenow', String(v));
    }
    if (barEl) barEl.style.width = displayed.toFixed(2) + '%';
  }

  function hide() {
    if (hidden) return;
    hidden = true;
    if (mo) { try { mo.disconnect(); } catch (e) {} mo = null; }
    try { sessionStorage.setItem('chestnut-preloaded', '1'); } catch (e) {}
    root.classList.remove('is-preloading');
    overlay.classList.add('is-hidden');
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 700);
  }

  function tick() {
    window.__preloaderTs = Date.now();

    var raw = progress();
    if (raw > lastValue + 0.001) { lastValue = raw; lastGainAt = Date.now(); }

    if (!allDone && (raw >= 0.999 || Date.now() - startedAt > MAX_MS)) {
      allDone = true;
    }
    // 卡死保护（仅详情页）：连续一段时间没有任何进展就放行
    if (STALL_MS > 0 && !allDone && Date.now() - lastGainAt > STALL_MS && Date.now() - startedAt > MIN_MS) {
      allDone = true;
    }
    // 首页加载时间较长时给一句提示，避免以为卡住
    if (FULL && !hinted && !finishing && Date.now() - startedAt > 12000) {
      hinted = true;
      if (hintEl) hintEl.textContent = '正在加载作品内容';
    }
    if (allDone && !finishing && Date.now() - startedAt >= MIN_MS) {
      finishing = true;
      if (hintEl) hintEl.textContent = '即将进入';
    }

    // 大文件下载期间 raw 会长时间不变，加一点“呼吸式”微推进（最多 +10%），避免数字僵住
    var stallSec = (Date.now() - lastGainAt - 1500) / 1000;
    var creep = stallSec > 0 ? Math.min(10, stallSec * 0.8) : 0;
    var target = finishing ? 100 : Math.min(99.5, Math.min(96, raw * 100 + creep));
    var diff = target - displayed;
    if (diff > 0) displayed = Math.min(target, displayed + Math.max(diff * 0.16, 0.4));

    render();

    if (finishing && displayed >= 99.6) {
      window.__preloaderTs = Date.now();
      setTimeout(hide, 220);
      return;
    }
    requestAnimationFrame(tick);
  }

  render();
  requestAnimationFrame(tick);
})();
"""


def main():
    weights = build_weights()
    js = PRELOADER_JS.replace("__WEIGHTS__", json.dumps(weights, ensure_ascii=False, sort_keys=True, indent=2))
    local_dir = os.path.join(ROOT, "local")
    os.makedirs(local_dir, exist_ok=True)
    with open(os.path.join(local_dir, "preloader.js"), "w", encoding="utf-8") as f:
        f.write(js)

    pages = []
    for dirpath, _dirnames, filenames in os.walk(ROOT):
        if "node_modules" in dirpath:
            continue
        for name in filenames:
            if name.endswith(".html"):
                pages.append(os.path.join(dirpath, name))
    pages.sort()

    changed = []
    for page in pages:
        with open(page, encoding="utf-8") as f:
            html = f.read()
        if "site-preloader" in html:
            # 已注入过：升级关键 CSS 与兜底脚本为最新版本
            html2 = re.sub(
                r'<style id="preloader-critical">[\s\S]*?</style>',
                lambda m: CRITICAL_CSS, html, count=1)
            html2 = re.sub(
                r'<script>\(function\(\)\{var r=document\.documentElement;[\s\S]*?\}\)\(\);</script>',
                lambda m: GUARD_SCRIPT, html2, count=1)
            if html2 != html:
                with open(page, "w", encoding="utf-8") as f:
                    f.write(html2)
                changed.append(os.path.relpath(page, ROOT) + "（升级）")
            continue

        # 1) head 末尾：关键 CSS + 兜底脚本 + 加载器脚本
        if "</head>" in html:
            inject = CRITICAL_CSS + GUARD_SCRIPT + LOADER_TAG + "</head>"
            html = html.replace("</head>", inject, 1)
        else:
            print("  跳过（无 </head>）：", page)
            continue

        # 2) body 开头：遮罩 DOM
        body_match = re.search(r"<body[^>]*>", html)
        if not body_match:
            print("  跳过（无 <body>）：", page)
            continue
        idx = body_match.end()
        html = html[:idx] + OVERLAY_HTML + html[idx:]

        with open(page, "w", encoding="utf-8") as f:
            f.write(html)
        changed.append(os.path.relpath(page, ROOT))

    print("权重条目：%d 个" % len(weights))
    print("已注入页面：%d 个" % len(changed))
    for c in changed:
        print("  -", c)


if __name__ == "__main__":
    main()
