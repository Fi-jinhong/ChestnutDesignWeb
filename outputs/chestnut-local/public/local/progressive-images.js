/* CHESTNUT 作品集 — 详情页画廊图片逐张加载
 * 图片进入视野后进入下载队列，队列一次只下载一张，避免一次性并发拉取几十张大图。
 */
(function () {
  'use strict';
  var imgs = document.querySelectorAll('img[data-src]');
  if (!imgs.length) return;

  var queue = [];
  var active = 0;
  var CONCURRENCY = 1;   // 同时下载的张数：1 = 严格一张一张

  function finish(img) {
    img.classList.remove('is-pending');
    img.classList.add('is-loaded');
    var fig = img.closest ? img.closest('figure') : null;
    if (fig) fig.classList.remove('is-loading');
    active--;
    pump();
  }

  function startLoad(img) {
    active++;
    var src = img.getAttribute('data-src');
    var alt = img.getAttribute('data-alt') || '';
    var settled = false;

    function done() {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (alt && !img.getAttribute('alt')) img.setAttribute('alt', alt);
      finish(img);
    }

    // 单张超时兜底：网络异常也不卡住后面的图片
    var timer = setTimeout(done, 30000);
    img.addEventListener('load', done, false);
    img.addEventListener('error', done, false);
    img.removeAttribute('data-src');
    img.removeAttribute('data-alt');
    img.src = src;
    if (img.complete) done();   // 命中缓存时 load 不会再触发
  }

  function pump() {
    while (active < CONCURRENCY && queue.length) {
      startLoad(queue.shift());
    }
  }

  function enqueue(img) {
    if (queue.indexOf(img) === -1) queue.push(img);
    pump();
  }

  function setup() {
    for (var i = 0; i < imgs.length; i++) {
      var fig = imgs[i].closest ? imgs[i].closest('figure') : null;
      if (fig) fig.classList.add('is-loading');
    }

    if (!('IntersectionObserver' in window)) {
      for (var j = 0; j < imgs.length; j++) enqueue(imgs[j]);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry.isIntersecting) {
          io.unobserve(entry.target);
          enqueue(entry.target);
        }
      }
    }, { rootMargin: '300px 0px 300px 0px' });

    for (var k = 0; k < imgs.length; k++) io.observe(imgs[k]);
  }

  // 必须等样式应用完再建立观察：图片此时还没有 src，未布局时高度会被压成 0，
  // 提前观察会让所有图片都误判为"在视口内"从而一次性全部下载
  var started = false;
  function start() {
    if (started) return;
    started = true;
    requestAnimationFrame(setup);
  }

  if (document.readyState === 'complete') {
    requestAnimationFrame(setup);
    started = true;
  } else {
    window.addEventListener('load', start, { once: true });
    setTimeout(start, 8000);   // load 迟迟不来也要兜底启动
  }
})();
