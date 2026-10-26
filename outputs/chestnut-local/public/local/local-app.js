(function () {
  'use strict';

  var portfolioParts = [
    '/downloads/portfolio.pdf',
  ];

  document.documentElement.classList.add('local-mirror');

  var loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    loadingScreen.remove();
  }

  document.querySelectorAll('.site-shell--loading').forEach(function (shell) {
    shell.classList.remove('site-shell--loading');
    shell.setAttribute('aria-busy', 'false');
  });

  document.querySelectorAll('.contact-watermark').forEach(function (watermark) {
    watermark.remove();
  });

  document.querySelectorAll('.case-hero, .case-metrics, .case-story, .case-gallery-heading, .case-gallery-grid figcaption').forEach(function (element) {
    element.remove();
  });

  initGalaxyBackground();

  document.querySelectorAll('.border-glow-card').forEach(function (card) {
    card.addEventListener('pointermove', function (event) {
      var rect = card.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      var edgeX = Math.min(x, rect.width - x);
      var edgeY = Math.min(y, rect.height - y);
      var proximity = Math.max(0, 100 - (Math.min(edgeX, edgeY) / Math.max(1, Math.min(rect.width, rect.height))) * 220);
      var angle = Math.atan2(y - rect.height / 2, x - rect.width / 2) * 180 / Math.PI + 90;
      card.style.setProperty('--edge-proximity', String(Math.min(100, proximity)));
      card.style.setProperty('--cursor-angle', angle + 'deg');
    });
    card.addEventListener('pointerleave', function () {
      card.style.setProperty('--edge-proximity', '0');
    });
  });

  document.querySelectorAll('.card-spotlight').forEach(function (card) {
    card.addEventListener('pointermove', function (event) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', (event.clientX - rect.left) + 'px');
      card.style.setProperty('--mouse-y', (event.clientY - rect.top) + 'px');
    });
  });

  function buildContactPopover() {
    var popover = document.createElement('aside');
    popover.className = 'header-contact-popover';
    popover.setAttribute('aria-label', '个人联系信息');
    popover.innerHTML = [
      '<button class="header-contact-popover-close" type="button" aria-label="关闭个人联系信息">×</button>',
      '<button class="header-contact-detail" type="button"><span>PHONE</span><strong>+86 159 5157 4645</strong><i class="copy-icon" aria-hidden="true"></i></button>',
      '<button class="header-contact-detail" type="button"><span>WECHAT</span><strong>guojialin0210</strong><i class="copy-icon" aria-hidden="true"></i></button>',
      '<figure class="header-contact-qr"><img src="/media/wechat-qr.webp" alt="过佳霖的微信二维码"><figcaption><strong>微信扫码联系</strong><span>SCAN TO CONNECT</span></figcaption></figure>',
    ].join('');
    return popover;
  }

  function bindPopoverDetails(popover) {
    popover.querySelectorAll('.header-contact-detail').forEach(function (button) {
      button.addEventListener('click', function () {
        var value = button.querySelector('strong').textContent.trim();
        copyText(value, value === 'guojialin0210' ? '微信' : '电话');
      });
    });
  }

  var contactTrigger = document.querySelector('.header-contact-trigger');
  var contactButton = document.querySelector('.header-contact');
  if (contactTrigger && contactButton) {
    var popover = buildContactPopover();
    popover.id = 'header-contact-popover';
    contactTrigger.appendChild(popover);
    bindPopoverDetails(popover);

    var setPopover = function (open) {
      popover.hidden = !open;
      contactButton.setAttribute('aria-expanded', String(open));
    };
    setPopover(false);
    contactButton.addEventListener('click', function () {
      setPopover(popover.hidden);
    });
    popover.querySelector('.header-contact-popover-close').addEventListener('click', function () {
      setPopover(false);
    });
    document.addEventListener('click', function (event) {
      if (!contactTrigger.contains(event.target)) setPopover(false);
    });
  }

  // 项目详情页底部「联系我」按钮：弹出与顶部栏一致的联系方式弹窗
  var caseContactButton = document.querySelector('.case-footer a.button');
  if (caseContactButton) {
    var casePopover = buildContactPopover();
    casePopover.classList.add('is-floating');
    document.body.appendChild(casePopover);
    bindPopoverDetails(casePopover);
    casePopover.hidden = true;

    var setCasePopover = function (open) {
      casePopover.hidden = !open;
      caseContactButton.setAttribute('aria-expanded', String(open));
      if (!open) return;
      var rect = caseContactButton.getBoundingClientRect();
      var width = 352;
      var left = Math.min(Math.max(12, rect.right - width), Math.max(12, window.innerWidth - width - 12));
      var top = rect.top - casePopover.offsetHeight - 12;
      if (top < 12) top = Math.min(window.innerHeight - casePopover.offsetHeight - 12, rect.bottom + 12);
      casePopover.style.left = left + 'px';
      casePopover.style.top = Math.max(12, top) + 'px';
    };

    caseContactButton.addEventListener('click', function (event) {
      event.preventDefault();
      setCasePopover(casePopover.hidden);
    });
    casePopover.querySelector('.header-contact-popover-close').addEventListener('click', function () {
      setCasePopover(false);
    });
    document.addEventListener('click', function (event) {
      if (casePopover.hidden) return;
      if (!casePopover.contains(event.target) && !caseContactButton.contains(event.target)) {
        setCasePopover(false);
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setCasePopover(false);
    });
  }

  var dialog = document.querySelector('.download-dialog');
  var dialogButtons = document.querySelectorAll('[aria-haspopup="dialog"]');
  if (dialog) {
    dialogButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      });
    });
    var closeButton = dialog.querySelector('.download-dialog-close');
    if (closeButton) closeButton.addEventListener('click', function () {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    });
    var portfolioButton = dialog.querySelector('.download-option button, .download-options > button');
    if (portfolioButton) {
      portfolioButton.addEventListener('click', downloadPortfolio);
    }
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
      }
    });
  }

  var filters = document.querySelectorAll('.other-project-filters button');
  var otherProjects = document.querySelectorAll('.other-project-card');
  if (filters.length && otherProjects.length) {
    filters.forEach(function (filter) {
      filter.addEventListener('click', function () {
        var category = filter.textContent.trim();
        filters.forEach(function (item) {
          var active = item === filter;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        otherProjects.forEach(function (card) {
          var label = card.querySelector('.other-project-meta span');
          var matches = category === '全部' || (label && label.textContent.trim() === category);
          card.hidden = !matches;
        });
      });
    });
  }

  var capabilityRows = document.querySelectorAll('.capability-row');
  var capabilityMedia = document.querySelector('.capability-media-layer');
  var capabilityImage = capabilityMedia && capabilityMedia.querySelector('img');
  var capabilityMeta = document.querySelector('.capability-media-meta');
  var capabilityCount = document.querySelector('.capability-media-count');
  var capabilityData = [
    ['/project-details/nuannuan/01.webp', 'UI/UX', '产品体验设计'],
    ['/project-details/meme-live/01.webp', 'VISUAL DESIGN', '视觉风格设计'],
    ['/project-details/laihai/01.webp', 'INTERACTION', '互动玩法设计'],
    ['/project-details/meme-9th/01.webp', 'OPERATIONS', '运营活动设计'],
    ['/project-details/operations/01.webp', 'DESIGN SYSTEM', '组件与会员体系'],
    ['/media/hero-web.mp4', 'AI WORKFLOW', 'AI 辅助设计工作流'],
  ];
  capabilityRows.forEach(function (row, index) {
    var activate = function () {
      capabilityRows.forEach(function (item, itemIndex) {
        item.classList.toggle('is-active', itemIndex === index);
      });
      if (!capabilityMedia || !capabilityData[index]) return;
      var data = capabilityData[index];
      if (data[0].endsWith('.mp4')) {
        capabilityMedia.innerHTML = '<video autoplay muted loop playsinline preload="metadata"><source src="' + data[0] + '" type="video/mp4"></video>';
      } else {
        capabilityMedia.innerHTML = '<img src="' + data[0] + '" alt="' + data[2] + '" loading="eager" decoding="async">';
      }
      if (capabilityMeta) {
        capabilityMeta.innerHTML = '<span>' + data[1] + '</span><strong>' + data[2] + '</strong>';
      }
      if (capabilityCount) capabilityCount.textContent = String(index + 1).padStart(2, '0') + ' / 06';
    };
    row.addEventListener('mouseenter', activate);
    row.addEventListener('focus', activate);
    row.addEventListener('click', activate);
  });

  document.querySelectorAll('.contact-detail').forEach(function (button) {
    button.addEventListener('click', function () {
      var value = button.querySelector('strong');
      if (value) copyText(value.textContent.trim(), button.querySelector('span').textContent.trim());
    });
  });

  function copyText(value, label) {
    var done = function () {
      var toast = document.querySelector('.copy-toast');
      if (!toast) return;
      toast.textContent = label + '已复制';
      toast.classList.add('is-visible');
      window.setTimeout(function () { toast.classList.remove('is-visible'); }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done).catch(done);
    } else {
      done();
    }
  }

  async function downloadPortfolio() {
    var status = dialog && dialog.querySelector('.download-status');
    var button = dialog && dialog.querySelector('.download-options > button');
    if (!status || !button || button.disabled) return;
    button.disabled = true;
    status.textContent = '正在整理作品集文件…';
    try {
      var chunks = [];
      for (var index = 0; index < portfolioParts.length; index += 1) {
        var response = await fetch(portfolioParts[index]);
        if (!response.ok) throw new Error('download failed');
        chunks.push(await response.arrayBuffer());
        status.textContent = '正在整理作品集文件 ' + (index + 1) + ' / ' + portfolioParts.length;
      }
      var blob = new Blob(chunks, { type: 'application/pdf' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = '过佳霖UIUX作品集.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(link.href); }, 60000);
      status.textContent = '作品集下载已开始';
    } catch (error) {
      status.textContent = '下载未完成，请检查本地服务是否正常运行。';
    } finally {
      button.disabled = false;
    }
  }

  function initGalaxyBackground() {
    var container = document.querySelector('.galaxy-container');
    if (!container || container.querySelector('canvas')) return;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    if (!context) return;

    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var width = 0;
    var height = 0;
    var dpr = 1;
    var particles = [];
    var pointer = { x: -9999, y: -9999 };
    var animationFrame = 0;

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function makeParticle(index, count) {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: randomBetween(0.7, 1.9),
        vx: randomBetween(-0.09, 0.12),
        vy: randomBetween(-0.05, 0.1),
        alpha: randomBetween(0.25, 0.82),
        phase: (index / Math.max(1, count)) * Math.PI * 2,
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth || window.innerWidth || 1200;
      height = container.clientHeight || window.innerHeight || 800;
      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.min(170, Math.max(86, Math.round((width * height) / 12500)));
      particles = Array.from({ length: count }, function (_, index) {
        return makeParticle(index, count);
      });
      draw(performance.now());
    }

    function drawGrid(time, scrollRatio) {
      var horizon = height * (0.34 + scrollRatio * 0.08);
      context.save();
      context.globalAlpha = 0.15;
      context.strokeStyle = 'rgba(72, 128, 255, 0.42)';
      context.lineWidth = 1;

      for (var i = -4; i <= 12; i += 1) {
        var x = i * width / 8 + Math.sin(time * 0.00018 + i) * 18;
        context.beginPath();
        context.moveTo(width * 0.5, horizon);
        context.lineTo(x, height + 40);
        context.stroke();
      }

      for (var row = 0; row < 12; row += 1) {
        var progress = row / 11;
        var y = horizon + Math.pow(progress, 1.82) * (height - horizon + 60);
        context.globalAlpha = 0.05 + progress * 0.12;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y + Math.sin(time * 0.00025 + row) * 8);
        context.stroke();
      }

      context.restore();
    }

    function draw(time) {
      var scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var scrollRatio = Math.min(1, Math.max(0, window.scrollY / scrollMax));
      context.clearRect(0, 0, width, height);

      var gradient = context.createRadialGradient(width * 0.5, height * 0.4, 0, width * 0.5, height * 0.42, Math.max(width, height) * 0.72);
      gradient.addColorStop(0, 'rgba(168, 134, 255, 0.17)');
      gradient.addColorStop(0.42, 'rgba(168, 134, 255, 0.045)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      drawGrid(time, scrollRatio);

      for (var i = 0; i < particles.length; i += 1) {
        var particle = particles[i];
        if (!prefersReducedMotion) {
          particle.x += particle.vx + Math.sin(time * 0.00023 + particle.phase) * 0.025;
          particle.y += particle.vy + Math.cos(time * 0.0002 + particle.phase) * 0.018;
          if (particle.x < -20) particle.x = width + 20;
          if (particle.x > width + 20) particle.x = -20;
          if (particle.y < -20) particle.y = height + 20;
          if (particle.y > height + 20) particle.y = -20;
        }

        var dx = particle.x - pointer.x;
        var dy = particle.y - pointer.y;
        var pointerBoost = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 210);
        var twinkle = 0.55 + Math.sin(time * 0.0011 + particle.phase) * 0.22;
        context.fillStyle = 'rgba(214, 230, 255, ' + Math.min(0.95, particle.alpha * twinkle + pointerBoost * 0.3) + ')';
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size + pointerBoost * 1.25, 0, Math.PI * 2);
        context.fill();
      }

      context.lineWidth = 1;
      for (var a = 0; a < particles.length; a += 1) {
        for (var b = a + 1; b < particles.length; b += 1) {
          var pa = particles[a];
          var pb = particles[b];
          var lineDx = pa.x - pb.x;
          var lineDy = pa.y - pb.y;
          var distance = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
          if (distance > 118) continue;
          var alpha = (1 - distance / 118) * 0.18;
          context.strokeStyle = 'rgba(80, 143, 255, ' + alpha + ')';
          context.beginPath();
          context.moveTo(pa.x, pa.y);
          context.lineTo(pb.x, pb.y);
          context.stroke();
        }
      }

      if (!prefersReducedMotion) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', function (event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
      } else if (!prefersReducedMotion) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    });

    resize();
    if (!prefersReducedMotion) {
      animationFrame = window.requestAnimationFrame(draw);
    }
  }
})();
