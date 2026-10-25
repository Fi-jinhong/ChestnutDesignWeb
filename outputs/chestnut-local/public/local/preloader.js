/* CHESTNUT 作品集 — 首屏加载进度页
 * 统计首屏关键资源（背景视频 + 封面图 + 字体）的真实加载情况，0~100 走完后再淡出进入站点。
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var overlay = document.getElementById('site-preloader');
  if (!overlay) { root.classList.remove('is-preloading'); return; }

  var numEl = document.getElementById('preloader-num');
  var barEl = document.getElementById('preloader-bar');
  var hintEl = document.getElementById('preloader-hint');

  // 权重 = 文件真实体积（字节），让进度条按体积而非数量推进
  var WEIGHTS = {
  "/assets/index-y2iB4ThX.css": 83296,
  "/assets/page-BJXOsEKc.css": 6972,
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
  var MIN_MS = 700;    // 最短展示时长，避免一闪而过
  var MAX_MS = 20000;  // 超时兜底：网络再差也放行

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

  /* ---------- 2. 首屏图片：提前改成 eager，避免 lazy 拖慢首屏 ---------- */
  var isCasePage = !!document.querySelector('.case-page');
  var maxImages = isCasePage ? 6 : 10;
  var imgs = document.querySelectorAll('img[src]');
  for (var i = 0; i < imgs.length && i < maxImages; i++) {
    (function (img, i) {
      var src = img.getAttribute('src') || '';
      var w = weightOf(src, DEFAULT_IMAGE);
      try {
        img.setAttribute('loading', 'eager');
        img.setAttribute('decoding', 'async');
        if (i < 3) img.setAttribute('fetchpriority', 'high');
      } catch (e) {}
      // 直接轮询 img.complete，无需额外事件
      addTask(w, function () { return img.complete ? 1 : 0; });
    })(imgs[i], i);
  }

  /* ---------- 3. 文档 + 字体就绪 ---------- */
  var docReady = document.readyState === 'complete';
  if (!docReady) {
    window.addEventListener('load', function () { docReady = true; }, { once: true });
  }
  var fontsReady = false;
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { fontsReady = true; }, function () { fontsReady = true; });
  } else {
    fontsReady = true;
  }
  addTask(500000, function () { return (docReady ? 0.6 : 0) + (fontsReady ? 0.4 : 0); });

  /* ---------- 渲染循环 ---------- */
  var displayed = 0;
  var allDone = false;
  var finishing = false;
  var hidden = false;
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
    // 卡死保护：6 秒没有任何进展就放行，不让用户一直等
    if (!allDone && Date.now() - lastGainAt > 6000 && Date.now() - startedAt > MIN_MS) {
      allDone = true;
    }
    if (allDone && !finishing && Date.now() - startedAt >= MIN_MS) {
      finishing = true;
      if (hintEl) hintEl.textContent = '即将进入';
    }

    var target = finishing ? 100 : Math.min(99.5, raw * 100);
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
