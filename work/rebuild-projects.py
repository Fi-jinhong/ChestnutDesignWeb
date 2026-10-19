# -*- coding: utf-8 -*-
"""重构项目区块：精选 2 个（暖暖拾光、么么直播）+ 过往 3 个（来嗨、9周年盛典、其它运营设计）。
1) 重写首页精选项目/过往项目区块与统计数据
2) 基于 ccs 详情页模板生成 5 个新项目详情页
"""
import re

ROOT = '/Users/fi/Library/Mobile Documents/com~apple~CloudDocs/05_UI作品集/栗子作品集网站/outputs/chestnut-local/public'

PROJECTS = [
    dict(slug='nuannuan', kind='精选项目', idx='01', name='暖暖拾光',
         eyebrow='语音社交 App · 0→1 产品设计',
         summary='以语音陪伴和轻社交关系为核心的互动社交 App，从 0 到 1 搭建核心体验框架，并结合 AI Agent 与 AIGC 提升设计与运营效率。',
         role='UI/UX 设计 100% · 语音房 / 亲密关系 / 活动运营',
         tags=['0–1 产品设计', '语音社交', 'AI 工作流'],
         m1=('核心场景', '4'), m2=('设计参与', '100%'),
         hue=306, light=65, hex='#FF7EF5',
         story=[('项目挑战', '语音社交场景涉及语音房、麦位、公屏、礼物、榜单等高密度信息并行，需要让用户在听、聊、上麦、送礼之间保持清晰路径。'),
                ('设计策略', '围绕"陪伴、灵动、轻社交"提取缘分鱼塘、星光与流动曲线等视觉元素，以高饱和渐变与柔和光感统一首页、房间与榜单视觉。'),
                ('交付结果', '完成语音房列表、语音房详情、亲密关系体系、头像框等级与勋章馆等核心模块，并沉淀 AI 辅助设计工作流，提升活动上线效率。')],
         images=13),
    dict(slug='meme-live', kind='精选项目', idx='02', name='么么直播',
         eyebrow='视频娱乐直播平台',
         summary='"有爱有趣有温度"的泛娱乐直播平台，围绕首页分发、直播间互动与多人 PK 持续迭代体验，并建立完整设计规范。',
         role='高级 UI 设计师 · 直播互动 / 运营活动 / 设计规范',
         tags=['直播互动', '运营设计', '视觉改版'],
         m1=('设计规范', '4'), m2=('多人 PK', '2–5人'),
         hue=258, light=73, hex='#9C75FF',
         story=[('项目挑战', '72% 用户倾向免费互动，付费用户送礼流程繁琐、缺乏身份彰显，需要在提升付费与留存的同时保持直播间的沉浸体验。'),
                ('设计策略', '以"简洁易用、温情陪伴、玩法丰富"为设计原则，直播间按 F 型阅读法则组织信息层级，多人 PK 针对 2–5 人动态重构网格系统。'),
                ('交付结果', '完成直播间、个人中心、会员体系等核心页面改版，输出 App 端、活动、开播伴侣、礼物装扮四套设计规范。')],
         images=10),
    dict(slug='laihai', kind='过往项目', idx='03', name='来嗨 3.0',
         eyebrow='亲密社交 App · UX 升级改版',
         summary='打造优质真实、社交玩法丰富多元的视频互动交友平台，负责品牌视觉、组件库和会员体系搭建。',
         role='UI/UX 设计 · 品牌视觉 / 组件库 / 会员体系',
         tags=['亲密社交', '品牌视觉', '会员体系'],
         m1=('核心页面', '5+'), m2=('改版版本', '3.0'),
         hue=350, light=65, hex='#FF5C7A',
         story=[('项目挑战', '亲密社交产品需要在真实感与趣味性之间取得平衡，同时满足下沉市场单身用户迫切的社交需求。'),
                ('设计策略', '建立品牌规范与组件库，围绕首页、聊天、个人资料、关系互动、会员中心等核心页面统一视觉语言。'),
                ('交付结果', '完成 3.0 整体升级改版，通过会员权益与亲密关系视觉资产提升产品一致性与商业化表达。')],
         images=32),
    dict(slug='meme-9th', kind='过往项目', idx='04', name='么么直播 9 周年盛典',
         eyebrow='运营活动 · 周年庆视觉',
         summary='以"九要放肆玩"为主题，打造一场多元化的派对嘉年华活动视觉。',
         role='运营视觉设计 · 活动主 KV / 玩法页面',
         tags=['运营活动', '主视觉', '活动页'],
         m1=('主 KV', '1 套'), m2=('视觉延展', '多场景'),
         hue=280, light=68, hex='#C26AFF',
         story=[('项目挑战', '第九年的周年庆需要在延续品牌认知的同时，传递"快乐出发、放肆玩"的嘉年华氛围。'),
                ('设计策略', '确定"九要放肆玩"主题，以 3D 立体字、城市夜景与派对元素构建高饱和的活动视觉体系。'),
                ('交付结果', '完成活动主 KV 与多场景视觉延展，支撑周年庆活动上线。')],
         images=7),
    dict(slug='operations', kind='过往项目', idx='05', name='其它运营设计',
         eyebrow='运营设计合集',
         summary='涵盖周年盛典、节日活动与 PK 赛事等运营视觉设计，结合 AI 工具提升素材生成效率。',
         role='运营视觉 · 活动页 / 榜单 / PK 赛事',
         tags=['运营活动', '视觉设计', 'AIGC'],
         m1=('活动类型', '3+'), m2=('代表项目', '11周年庆'),
         hue=35, light=60, hex='#F5A623',
         story=[('项目挑战', '运营活动节奏快、需求量大，需要在保证视觉质量的同时快速响应上线需求。'),
                ('设计策略', '沉淀可复用的活动组件与视觉资产，结合 AIGC 完成创意发散与素材生成。'),
                ('交付结果', '完成么么直播 11 周年庆等多个活动视觉，形成支持快速上线的活动工作流。')],
         images=4),
]

def cover(p):
    return f'/project-details/{p["slug"]}/01.png'

# ---------- 1. 首页 ----------

def glow_style(p):
    h, l, x = p['hue'], p['light'], p['hex']
    return (f'--card-bg:#08090c;--edge-sensitivity:20;--border-radius:26px;--glow-padding:18px;--cone-spread:28;'
            f'--fill-opacity:0.14;--glow-color:hsl({h}deg 100% {l}% / 65%);--glow-color-60:hsl({h}deg 100% {l}% / 39%);'
            f'--glow-color-50:hsl({h}deg 100% {l}% / 32.5%);--glow-color-40:hsl({h}deg 100% {l}% / 26%);'
            f'--glow-color-30:hsl({h}deg 100% {l}% / 19.5%);--glow-color-20:hsl({h}deg 100% {l}% / 13%);'
            f'--glow-color-10:hsl({h}deg 100% {l}% / 6.5%);'
            f'--gradient-one:radial-gradient(at 80% 55%, {x} 0px, transparent 50%);'
            f'--gradient-two:radial-gradient(at 69% 34%, {x} 0px, transparent 50%);'
            f'--gradient-three:radial-gradient(at 8% 6%, #ffffff 0px, transparent 50%);'
            f'--gradient-four:radial-gradient(at 41% 38%, {x} 0px, transparent 50%);'
            f'--gradient-five:radial-gradient(at 86% 85%, {x} 0px, transparent 50%);'
            f'--gradient-six:radial-gradient(at 82% 18%, #ffffff 0px, transparent 50%);'
            f'--gradient-seven:radial-gradient(at 51% 4%, {x} 0px, transparent 50%);'
            f'--gradient-base:linear-gradient({x} 0 100%)')

def selected_card(p, layout):
    tags = ''.join(f'<li>{t}</li>' for t in p['tags'])
    return (f'<div class="border-glow-card project-card project-card--{p["slug"]} project-card--{layout} reveal" style="{glow_style(p)}">'
            f'<span class="edge-light"></span><div class="border-glow-inner"><div class="project-info">'
            f'<p class="project-type">{p["eyebrow"]}</p><h3>{p["name"]}</h3><p>{p["summary"]}</p>'
            f'<p class="project-role">{p["role"]}</p><ul aria-label="项目标签">{tags}</ul>'
            f'<a class="button button--ghost project-link" href="/projects/{p["slug"]}" aria-label="查看{p["name"]}项目详情">查看案例 <span aria-hidden="true">↗</span></a></div>'
            f'<div class="project-showcase"><div class="project-visual">'
            f'<img class="project-image--landscape" src="{cover(p)}" alt="{p["name"]}项目封面" loading="lazy" decoding="async"/></div>'
            f'<div class="project-metrics" aria-label="项目成果"><div><span>{p["m1"][0]}</span><strong>{p["m1"][1]}</strong></div>'
            f'<div><span>{p["m2"][0]}</span><strong>{p["m2"][1]}</strong></div></div></div></div></div>')

HEADING = ('<div class="module-heading reveal"><div><h2 style="background:linear-gradient(180deg, #FFF 26.05%, #C2C2C2 79.7%);'
           '-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;font-weight:600">')

index_path = f'{ROOT}/index.html'
html = open(index_path, encoding='utf-8').read()

# 精选项目区块（只保留 2 个）
new_projects = ('<section class="section projects" id="projects" aria-labelledby="projects-title">'
                + HEADING + '精选项目</h2><span>SELECTED WORK</span></div></div><div class="project-list">'
                + selected_card(PROJECTS[0], 'featured')
                + selected_card(PROJECTS[1], 'wide')
                + '</div></section>')
html, n1 = re.subn(r'<section class="section projects"[\s\S]*?</section>', lambda m: new_projects, html, count=1)

# 过往项目区块（3 个）
def past_card(p, i):
    cat = '社交产品' if p['slug'] == 'laihai' else '运营活动'
    return (f'<a class="other-project-card reveal" href="/projects/{p["slug"]}" style="--card-index:{i}" aria-label="查看{p["name"]}项目详情">'
            f'<div class="other-project-media"><img src="{cover(p)}" alt="{p["name"]}项目封面" loading="lazy" decoding="async"/></div>'
            f'<div class="other-project-meta"><div><span>{cat}</span><h3>{p["name"]}</h3></div>'
            f'<span class="other-project-arrow" aria-hidden="true">↗</span></div></a>')

new_others = ('<section class="section other-projects" id="other-projects" aria-labelledby="other-projects-title">'
              '<div class="module-heading other-projects-heading reveal"><div><h2 style="background:linear-gradient(180deg, #FFF 26.05%, #C2C2C2 79.7%);'
              '-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;font-weight:600">过往项目</h2><span>PAST WORKS</span></div></div>'
              '<div class="other-project-filters reveal" role="group" aria-label="过往项目分类筛选">'
              '<button class="is-active" type="button" aria-pressed="true">全部</button>'
              '<button class="" type="button" aria-pressed="false">社交产品</button>'
              '<button class="" type="button" aria-pressed="false">运营活动</button></div>'
              '<div class="other-project-grid" aria-live="polite">'
              + past_card(PROJECTS[2], 0) + past_card(PROJECTS[3], 1) + past_card(PROJECTS[4], 2)
              + '</div></section>')
html, n2 = re.subn(r'<section class="section other-projects"[\s\S]*?</section>', lambda m: new_others, html, count=1)

# 项目实践统计
old_stats = ('<div class="about-result-grid" aria-label="项目实践数据"><div><strong>25+</strong><span>设计项目</span></div>'
             '<div><strong>14+</strong><span>可视化项目</span></div><div><strong>02</strong><span>视觉规范</span></div>'
             '<div><strong>02</strong><span>相关专利</span></div></div>')
new_stats = ('<div class="about-result-grid" aria-label="项目实践数据"><div><strong>04</strong><span>核心产品</span></div>'
             '<div><strong>04</strong><span>设计规范</span></div><div><strong>05</strong><span>精选案例</span></div>'
             '<div><strong>7.5</strong><span>年经验沉淀</span></div></div>')
n3 = html.count(old_stats)
html = html.replace(old_stats, new_stats)

# 能力展示区默认图片指向暖暖拾光封面
n4 = html.count('src="/projects/ccs-monitor.png" alt="产品体验设计"')
html = html.replace('src="/projects/ccs-monitor.png" alt="产品体验设计"',
                    'src="/project-details/nuannuan/01.png" alt="产品体验设计"')

open(index_path, 'w', encoding='utf-8').write(html)
print(f'首页: 精选区块替换 {n1}, 过往区块替换 {n2}, 统计替换 {n3}, 能力区图片替换 {n4}')

# ---------- 2. 详情页 ----------

tpl = open(f'{ROOT}/projects/nuannuan/index.html', encoding='utf-8').read()

for i, p in enumerate(PROJECTS):
    page = tpl
    # preload
    page = page.replace(
        '<link rel="preload" href="/projects/ccs-monitor.png" as="image"/><link rel="preload" href="/project-details/ccs/01.webp" as="image"/>',
        f'<link rel="preload" href="{cover(p)}" as="image"/><link rel="preload" href="/project-details/{p["slug"]}/02.png" as="image"/>')
    # 头部序号
    page = page.replace('<span>精选项目</span><strong>01<!-- --> / <!-- -->10</strong>',
                        f'<span>{p["kind"]}</span><strong>{p["idx"]}<!-- --> / <!-- -->05</strong>')
    # hero 区
    page = re.sub(r'<p class="case-eyebrow">[\s\S]*?</p><h1 id="case-title">[\s\S]*?</h1><p class="case-summary">[\s\S]*?</p><p class="case-role">[\s\S]*?</p><ul class="case-tags" aria-label="项目标签">[\s\S]*?</ul>',
                  f'<p class="case-eyebrow">{p["eyebrow"]}</p><h1 id="case-title">{p["name"]}</h1>'
                  f'<p class="case-summary">{p["summary"]}</p><p class="case-role">{p["role"]}</p>'
                  f'<ul class="case-tags" aria-label="项目标签">' + ''.join(f'<li>{t}</li>' for t in p['tags']) + '</ul>',
                  page, count=1)
    # 封面
    page = re.sub(r'<div class="case-cover"><img src="[^"]*" alt="[^"]*"/></div>',
                  f'<div class="case-cover"><img src="{cover(p)}" alt="{p["name"]}项目封面"/></div>', page, count=1)
    # 指标
    page = re.sub(r'<section class="case-metrics"[\s\S]*?</section>',
                  f'<section class="case-metrics" aria-label="项目交付规模"><div><strong>{p["m1"][1]}</strong><span>{p["m1"][0]}</span></div>'
                  f'<div><strong>{p["m2"][1]}</strong><span>{p["m2"][0]}</span></div></section>', page, count=1)
    # 故事三段
    story_html = '<section class="case-story" aria-label="项目案例说明">' + ''.join(
        f'<article><span>0{k+1}</span><h2>{t}</h2><p>{d}</p></article>' for k, (t, d) in enumerate(p['story'])) + '</section>'
    page = re.sub(r'<section class="case-story"[\s\S]*?</section>', lambda m: story_html, page, count=1)
    # 画廊（含封面 01）
    figs = ''.join(
        f'<figure class=""><img src="/project-details/{p["slug"]}/{k:02d}.png" alt="{p["name"]}详情展示 {k:02d}" loading="lazy" decoding="async"/>'
        f'<figcaption>{k:02d}<!-- --> / <!-- -->{p["name"]}详情展示 {k:02d}</figcaption></figure>'
        for k in range(1, p['images'] + 1))
    page = re.sub(r'<div class="case-gallery-grid">[\s\S]*?</div></section>',
                  lambda m: f'<div class="case-gallery-grid">{figs}</div></section>', page, count=1)
    # 上一个 / 下一个
    prev_p = PROJECTS[(i - 1) % 5]
    next_p = PROJECTS[(i + 1) % 5]
    page = re.sub(r'<a href="[^"]*" class="case-nav-project case-nav-previous"><span>上一个项目</span><strong>[^<]*</strong></a>',
                  f'<a href="/projects/{prev_p["slug"]}" class="case-nav-project case-nav-previous"><span>上一个项目</span><strong>{prev_p["name"]}</strong></a>', page)
    page = re.sub(r'<a href="[^"]*" class="case-nav-project case-nav-next"><span>下一个项目</span><strong>[^<]*</strong></a>',
                  f'<a href="/projects/{next_p["slug"]}" class="case-nav-project case-nav-next"><span>下一个项目</span><strong>{next_p["name"]}</strong></a>', page)
    import os
    outdir = f'{ROOT}/projects/{p["slug"]}'
    os.makedirs(outdir, exist_ok=True)
    open(f'{outdir}/index.html', 'w', encoding='utf-8').write(page)
    print(f'详情页生成: /projects/{p["slug"]} ({p["images"]} 图)')
