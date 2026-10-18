# -*- coding: utf-8 -*-
"""将 haoqing6 本地镜像的身份信息替换为过佳霖（Guo Jialin）。
仅替换文字内容；图片、项目详情等未提供新素材的部分保持原样。
"""
import glob
import os

ROOT = '/Users/fi/Library/Mobile Documents/com~apple~CloudDocs/05_UI作品集/栗子作品集网站/outputs/haoqing6-local/public'

# 顺序敏感：先长后短、先具体后通用
REPLACEMENTS = [
    # ---- 标题 / meta ----
    ('刘浩清 / SOJAY — UI/UX Designer', '过佳霖 / CHESTNUT — UI/UX Designer'),
    ('刘浩清的 UI/UX 设计作品集，拥有 4 年企业级与工业数字产品经验，聚焦智能仓储、车载 HMI 与数字孪生。',
     '过佳霖的 UI/UX 设计作品集，7.5 年社交直播产品体验设计经验，聚焦语音社交、直播互动与运营视觉设计。'),
    ('4 年企业级与工业数字产品体验设计，连接用户、产品与技术。',
     '7.5 年社交直播产品体验设计，连接用户、产品与商业目标。'),
    # ---- 联系方式 ----
    ('+86-133-4011-3839', '+86-159-5157-4645'),
    ('+86 133 4011 3839', '+86 159 5157 4645'),
    ('sojay6@qq.com', '544628847@qq.com'),
    ('haoqingjo666', 'guojialin0210'),
    ('刘浩清的微信二维码', '过佳霖的微信二维码'),
    ('刘浩清UIUX作品集.pdf', '过佳霖UIUX作品集.pdf'),
    # ---- 首页 hero / 关于 ----
    ('4年企业级与工业数字产品体验设计', '7.5年社交直播产品体验设计'),
    ('聚焦智能仓储、车载 HMI 与数字孪生，覆盖 Web、PDA、车载端与数据大屏等多终端场景。',
     '聚焦语音社交、直播互动与运营视觉设计，覆盖 iOS 与 Android 移动端核心场景。'),
    ('你好，我是刘浩清。', '你好，我是过佳霖。'),
    ('一名专注企业级与工业数字产品的 UI/UX 设计师，擅长把复杂业务转译为清晰、自然且可落地的多终端体验。',
     '一名专注社交直播产品的 UI/UX 设计师，擅长把玩法、关系与商业化诉求转译为清晰、有温度的移动端体验。'),
    ('<strong>4年+</strong><span>企业级与工业数字产品 UI/UX 经验</span>',
     '<strong>7.5年+</strong><span>社交直播产品 UI/UX 设计经验</span>'),
    # ---- 工作经历 ----
    ('<time>2024.03 — 至今</time><div><h3>合力工业车辆（上海）有限公司</h3><p>UI/UX 设计师 · WMS、CCS、车载 HMI 与数字孪生全链路设计</p>',
     '<time>2021.08 — 至今</time><div><h3>么么直播</h3><p>高级 UI 设计师 · 直播产品 UI 迭代、互动玩法与运营活动设计</p>'),
    ('<time>2022.07 — 2024.03</time><div><h3>北京国舜科技股份有限公司</h3><p>UI 设计师 · 企业级 Web、移动端与组件规范建设</p>',
     '<time>2018 — 2021</time><div><h3>上海震渊</h3><p>UI 设计师 · K12 AI 教育产品整体与交互设计</p>'),
    # ---- 核心能力标签 ----
    ('<li>复杂业务</li><li>交互设计</li><li>视觉系统</li><li>工业 UX</li><li>多终端</li><li>3D / AI</li>',
     '<li>语音社交</li><li>直播互动</li><li>视觉系统</li><li>运营设计</li><li>会员体系</li><li>AI 工作流</li>'),
    # ---- 能力展示区（先改第 04 行 Visual Design，避免与第 02 行新标签冲突）----
    ('<span class="capability-category">Visual Design</span><span class="capability-row-main"><strong>界面视觉设计</strong><small>Web / PDA / 大屏</small></span>',
     '<span class="capability-category">Operations Design</span><span class="capability-row-main"><strong>运营活动设计</strong><small>活动视觉 / 素材</small></span>'),
    ('<span class="capability-category">UX Strategy</span><span class="capability-row-main"><strong>用户研究与体验策略</strong><small>产品方向定义</small></span>',
     '<span class="capability-category">UI/UX Design</span><span class="capability-row-main"><strong>产品体验设计</strong><small>语音社交 / 直播</small></span>'),
    ('<span class="capability-category">Information Architecture</span><span class="capability-row-main"><strong>复杂信息架构</strong><small>工业系统设计</small></span>',
     '<span class="capability-category">Visual Design</span><span class="capability-row-main"><strong>视觉风格设计</strong><small>品牌与视觉规范</small></span>'),
    ('<span class="capability-category">Interaction Design</span><span class="capability-row-main"><strong>交互流程设计</strong><small>HMI / 软件产品</small></span>',
     '<span class="capability-category">Interaction Design</span><span class="capability-row-main"><strong>互动玩法设计</strong><small>语音房 / 直播互动</small></span>'),
    ('<span class="capability-category">Design System</span><span class="capability-row-main"><strong>组件规范建设</strong><small>产品体验统一</small></span>',
     '<span class="capability-category">Design System</span><span class="capability-row-main"><strong>组件规范建设</strong><small>会员与成长体系</small></span>'),
    ('<span class="capability-category">HMI &amp; Digital Twin</span><span class="capability-row-main"><strong>智能设备与可视化</strong><small>车载 / 数字孪生</small></span>',
     '<span class="capability-category">AI for Design</span><span class="capability-row-main"><strong>AI 辅助设计工作流</strong><small>AIGC / AI Agent</small></span>'),
    # ---- 联系区 / 页脚 ----
    ('专注复杂 B 端业务与工业场景体验，期待共同落地高效产品。',
     '专注社交直播产品体验与运营视觉设计，期待共同落地有温度的产品。'),
    ('BUILT FOR B-END EXPERIENCES', 'BUILT FOR SOCIAL &amp; LIVE EXPERIENCES'),
    # ---- 通用姓名标识（最后兜底）----
    ('LIU HAOQING / SOJAY', 'GUO JIALIN / CHESTNUT'),
    ('过佳霖 / SOJAY', '过佳霖 / CHESTNUT'),
    ('>SOJAY<', '>CHESTNUT<'),
    ('"alternateName":"Sojay"', '"alternateName":"Chestnut"'),
    ('刘浩清', '过佳霖'),
]

files = sorted(glob.glob(os.path.join(ROOT, 'index.html')) +
               glob.glob(os.path.join(ROOT, 'projects', '*', 'index.html')) +
               [os.path.join(ROOT, 'local', 'local-app.js')])

for f in files:
    text = open(f, encoding='utf-8').read()
    total = 0
    for old, new in REPLACEMENTS:
        n = text.count(old)
        if n:
            text = text.replace(old, new)
            total += n
    open(f, 'w', encoding='utf-8').write(text)
    print(f'{os.path.relpath(f, ROOT)}: {total} 处替换')

# 校验残留
print('\n--- 残留检查 ---')
leftover = ['刘浩清', 'SOJAY', 'LIU HAOQING', 'sojay6', '133 4011', '133-4011', 'haoqingjo666']
for f in files:
    text = open(f, encoding='utf-8').read()
    for s in leftover:
        if s in text:
            print(f'残留 {s!r} in {os.path.relpath(f, ROOT)}')
print('done')
