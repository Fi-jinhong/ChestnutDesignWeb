(function () {
  'use strict';

  var portfolioParts = [
    '/downloads/portfolio-4801e138ef68-1.bin',
    '/downloads/portfolio-4801e138ef68-2.bin',
    '/downloads/portfolio-4801e138ef68-3.bin',
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

  var contactTrigger = document.querySelector('.header-contact-trigger');
  var contactButton = document.querySelector('.header-contact');
  if (contactTrigger && contactButton) {
    var popover = document.createElement('aside');
    popover.className = 'header-contact-popover';
    popover.id = 'header-contact-popover';
    popover.setAttribute('aria-label', '个人联系信息');
    popover.innerHTML = [
      '<button class="header-contact-popover-close" type="button" aria-label="关闭个人联系信息">×</button>',
      '<div class="header-contact-status"><i aria-hidden="true"></i><span>STATUS: READY TO TALK</span></div>',
      '<button class="header-contact-detail" type="button"><span>PHONE</span><strong>+86 133 4011 3839</strong><i class="copy-icon" aria-hidden="true"></i></button>',
      '<button class="header-contact-detail" type="button"><span>WECHAT</span><strong>haoqingjo666</strong><i class="copy-icon" aria-hidden="true"></i></button>',
      '<figure class="header-contact-qr"><img src="/media/wechat-qr.png" alt="刘浩清的微信二维码"><figcaption><strong>微信扫码联系</strong><span>SCAN TO CONNECT</span></figcaption></figure>',
    ].join('');
    contactTrigger.appendChild(popover);

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
    popover.querySelectorAll('.header-contact-detail').forEach(function (button) {
      button.addEventListener('click', function () {
        var value = button.querySelector('strong').textContent.trim();
        copyText(value, value === 'haoqingjo666' ? '微信' : '电话');
      });
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
    ['/projects/ccs-monitor.png', 'UX STRATEGY', '产品方向与体验策略'],
    ['/projects/wms-warehouse-dark.png', 'SYSTEM DESIGN', '复杂系统信息架构'],
    ['/projects/vehicle-hmi-cockpit.png', 'FIELD SCENE', '工业车载交互体验'],
    ['/projects/wms-laptop-dashboard.png', 'VISUAL DESIGN', '多终端界面视觉设计'],
    ['/projects/digital-twin-dashboard.png', 'DESIGN SYSTEM', '可扩展的体验系统'],
    ['/media/hero-web.mp4', '3D MOTION', '数字孪生与工业可视化'],
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
      link.download = '刘浩清UIUX作品集.pdf';
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
})();
