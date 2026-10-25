/* CHESTNUT 作品集 — 首屏加载进度页
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
  var WEIGHTS = {
  "/assets/index-y2iB4ThX.css": 83296,
  "/assets/page-BJXOsEKc.css": 6972,
  "/covers/meme-live.jpg": 186510,
  "/covers/nuannuan.jpg": 234105,
  "/covers/operations.jpg": 383816,
  "/media/hero-web.mp4": 7898831,
  "/media/portrait.png": 626163,
  "/media/wechat-qr.png": 168703,
  "/project-details/laihai/01.png": 1680393,
  "/project-details/laihai/02.png": 1131676,
  "/project-details/laihai/03.png": 189198,
  "/project-details/laihai/04.png": 474274,
  "/project-details/laihai/05.png": 264362,
  "/project-details/laihai/06.png": 107429,
  "/project-details/laihai/07.png": 445761,
  "/project-details/laihai/08.png": 313286,
  "/project-details/laihai/09.png": 628198,
  "/project-details/laihai/10.png": 111130,
  "/project-details/laihai/11.png": 3167745,
  "/project-details/laihai/12.png": 1766439,
  "/project-details/laihai/13.png": 107855,
  "/project-details/laihai/14.png": 2165061,
  "/project-details/laihai/15.png": 743642,
  "/project-details/laihai/16.png": 983951,
  "/project-details/laihai/17.png": 509085,
  "/project-details/laihai/18.png": 2709936,
  "/project-details/laihai/19.png": 794732,
  "/project-details/laihai/20.png": 111913,
  "/project-details/laihai/21.png": 2169369,
  "/project-details/laihai/22.png": 1224542,
  "/project-details/laihai/23.png": 720886,
  "/project-details/laihai/24.png": 1030897,
  "/project-details/laihai/25.png": 925190,
  "/project-details/laihai/26.png": 282319,
  "/project-details/laihai/27.png": 111350,
  "/project-details/laihai/28.png": 2305785,
  "/project-details/laihai/29.png": 801592,
  "/project-details/laihai/30.png": 783489,
  "/project-details/laihai/31.png": 110066,
  "/project-details/laihai/32.png": 235892,
  "/project-details/meme-9th/01.png": 1782230,
  "/project-details/meme-9th/02.png": 1543667,
  "/project-details/meme-9th/03.png": 366873,
  "/project-details/meme-9th/04.png": 1610758,
  "/project-details/meme-9th/05.png": 627072,
  "/project-details/meme-9th/06.png": 1626015,
  "/project-details/meme-9th/07.png": 1801196,
  "/project-details/meme-live/01.png": 4143580,
  "/project-details/meme-live/02.png": 289386,
  "/project-details/meme-live/03.png": 753380,
  "/project-details/meme-live/04.png": 1110886,
  "/project-details/meme-live/05.png": 2871799,
  "/project-details/meme-live/06.png": 1614710,
  "/project-details/meme-live/07.png": 2785363,
  "/project-details/meme-live/08.png": 1145189,
  "/project-details/meme-live/09.png": 1814748,
  "/project-details/meme-live/10.png": 3278978,
  "/project-details/nuannuan/01.png": 1874411,
  "/project-details/nuannuan/02.png": 514224,
  "/project-details/nuannuan/03.png": 155599,
  "/project-details/nuannuan/04.png": 299703,
  "/project-details/nuannuan/05.png": 3420031,
  "/project-details/nuannuan/06.png": 1586880,
  "/project-details/nuannuan/07.png": 2064566,
  "/project-details/nuannuan/08.png": 1024018,
  "/project-details/nuannuan/09.png": 504614,
  "/project-details/nuannuan/10.png": 2781118,
  "/project-details/nuannuan/11.png": 1176327,
  "/project-details/nuannuan/12.png": 1395830,
  "/project-details/nuannuan/13.png": 5300556,
  "/project-details/operations/01.png": 7309378,
  "/project-details/operations/02.png": 4438344,
  "/project-details/operations/03.png": 4991944,
  "/project-details/operations/04.png": 4657250
};
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
