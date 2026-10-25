#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
详情页画廊图片改为「逐张加载」：
1) 画廊 img 的 src 换成 data-src（首屏不发起请求），alt 换 data-alt
2) 注入 /local/progressive-images.js：图片进入视野后进入队列，队列里一次只下载 1 张
3) 写入加载中的占位微光 + 加载完淡入样式
"""
import os
import re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "outputs", "chestnut-local", "public")

PROGRESSIVE_JS = """/* CHESTNUT 作品集 — 详情页画廊图片逐张加载
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
"""

PROGRESSIVE_CSS = """
/* 详情页画廊：逐张加载（占位微光 + 加载完淡入） */
.local-mirror .case-gallery-grid img[data-src] {
  opacity: 0;
}

.local-mirror .case-gallery-grid img.is-loaded {
  opacity: 1;
  transition: opacity .55s ease;
}

/* 未加载时预留占位高度，避免容器塌陷导致所有图片都被判定为"在视口内" */
.local-mirror .case-gallery-grid figure.is-loading {
  min-height: clamp(300px, 34vw, 520px) !important;
}

.local-mirror .case-gallery-grid figure.is-loading::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, #0a0c11 18%, #171b24 38%, #0a0c11 58%);
  background-size: 220% 100%;
  animation: chestnut-shimmer 1.6s linear infinite;
}

@keyframes chestnut-shimmer {
  from { background-position: 130% 0; }
  to { background-position: -130% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .local-mirror .case-gallery-grid figure.is-loading::before {
    animation: none;
  }
}
"""

SCRIPT_TAG = '<script defer src="/local/progressive-images.js"></script>'


def main():
    # 1) 写入 progressive-images.js
    local_dir = os.path.join(ROOT, "local")
    os.makedirs(local_dir, exist_ok=True)
    with open(os.path.join(local_dir, "progressive-images.js"), "w", encoding="utf-8") as f:
        f.write(PROGRESSIVE_JS)

    # 2) 写入样式（避免重复追加）
    css_path = os.path.join(local_dir, "local-overrides.css")
    css = open(css_path, encoding="utf-8").read()
    if "逐张加载（占位微光" not in css:
        with open(css_path, "a", encoding="utf-8") as f:
            f.write(PROGRESSIVE_CSS)

    # 3) 改造 5 个详情页
    pages = []
    for slug in sorted(os.listdir(os.path.join(ROOT, "projects"))):
        p = os.path.join(ROOT, "projects", slug, "index.html")
        if os.path.isfile(p):
            pages.append(p)

    for page in pages:
        html = open(page, encoding="utf-8").read()
        original = html

        # 画廊图片：src -> data-src
        html, n1 = re.subn(
            r'<img src="(/project-details/[^"]+)" alt="([^"]*)" loading="lazy" decoding="async"/>',
            lambda m: '<img data-src="%s" data-alt="%s" class="is-pending" decoding="async"/>' % (m.group(1), m.group(2)),
            html)

        # 注入脚本（放在 local-app.js 之前）
        if SCRIPT_TAG not in html:
            html = html.replace('<script defer src="/local/local-app.js"></script>',
                                SCRIPT_TAG + '<script defer src="/local/local-app.js"></script>', 1)
            n2 = 1
        else:
            n2 = 0

        if html != original:
            with open(page, "w", encoding="utf-8") as f:
                f.write(html)
        print("%s: 图片改造 %d 张, 脚本注入 %d" % (os.path.relpath(page, ROOT), n1, n2))


if __name__ == "__main__":
    main()
