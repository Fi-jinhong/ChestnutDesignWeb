# 栗子作品集网站（haoqing6.xyz 本地镜像）

这是 **刘浩清 / SOJAY — UI/UX Designer** 个人作品集网站（<https://haoqing6.xyz/>）的**本地离线镜像工程**。项目通过抓取脚本将线上站点完整本地化，可脱离网络在本机运行浏览。

> 站点简介：刘浩清的 UI/UX 设计作品集，4 年企业级与工业数字产品经验，聚焦智能仓储、车载 HMI 与数字孪生。

## 快速开始

```bash
cd outputs/haoqing6-local
npm start          # 等价于 node server.mjs
```

然后打开 <http://127.0.0.1:4173/> （可用 `PORT` 环境变量或命令行参数更换端口）。

无需安装任何依赖 —— 服务器只使用 Node.js 内置模块（Node 18+ 即可）。

## 目录结构

```
├── work/                        # 工程脚本与抓取中间产物
│   ├── build-local-project.mjs  # ★ 抓取/构建脚本：从线上站点生成本地镜像
│   ├── local-mirror/            # 本地化补丁（注入到每个页面）
│   │   ├── local-app.js         #   交互修复：悬停辉光、联系弹窗、项目筛选、
│   │   │                        #   能力展示切换、PDF 分片合并下载等
│   │   └── local-overrides.css  #   样式覆盖：跳过加载屏、直接显示内容
│   ├── source.html / route_*.html  # 抓取到的原始页面快照
│   └── sitemap.xml / robots.txt    # 站点元数据
│
├── outputs/
│   └── haoqing6-local/          # ★ 最终产物：可运行的本地镜像
│       ├── server.mjs           # 零依赖静态文件服务器（默认端口 4173）
│       ├── public/              # 镜像站点全部文件（约 182MB，207 个文件）
│       │   ├── index.html       # 主页
│       │   ├── projects/        # 10 个项目详情页
│       │   ├── assets|fonts|media|downloads/  # 图片/字体/视频/简历等静态资源
│       │   └── local/           # 注入的本地化补丁
│       ├── crawl-report.txt     # 抓取报告（路由、资源清单、文件统计）
│       └── package.json
│
└── source/                      # （预留，当前为空）
```

## 包含页面（11 个路由）

| 路由 | 内容 |
|---|---|
| `/` | 主页（能力展示、项目列表、联系方式） |
| `/projects/ccs` | CCS 监控系统 |
| `/projects/vehicle-hmi` | 车载 HMI 座舱 |
| `/projects/wms` | 智能仓储管理系统 |
| `/projects/digital-twin` | 数字孪生 |
| `/projects/mes-execution-system` | MES 生产执行系统 |
| `/projects/industrial-simulation` | 工业仿真 |
| `/projects/beidou-security-analysis` | 北斗安全分析 |
| `/projects/beidou-security-operations` | 北斗安全运维 |
| `/projects/warehouse-visualization` | 仓储可视化 |
| `/projects/software-training` | 软件培训 |

## 工作原理

1. **抓取**（`work/build-local-project.mjs`）：从种子路由出发，递归解析 HTML/CSS/JS 中的站内 URL，下载所有页面与静态资源；HTML 会经过清洗（移除 RSC 运行时脚本、跳过加载屏），并注入本地补丁 CSS/JS。
2. **服务**（`outputs/haoqing6-local/server.mjs`）：一个简单的静态服务器，按 `path → path/index.html → path.html` 顺序解析请求，自带常见 MIME 类型表。
3. **本地化补丁**（`local-app.js`）：原站部分交互依赖 React  hydration，静态镜像中由该脚本用原生 JS 重新实现，包括卡片辉光/聚光灯效果、联系方式弹窗（一键复制）、项目分类筛选、能力展示区切换，以及将 3 个 `.bin` 分片合并还原为完整作品集 PDF 下载。

## 重新抓取 / 更新镜像

```bash
node work/build-local-project.mjs
```

会清空并重新生成 `outputs/haoqing6-local/public/`，同时更新 `crawl-report.txt`。

## 备注

- 镜像生成时间：2026-10-03（见 `crawl-report.txt`）
- 资源统计：146 张 webp、20 张 png、5 个 mp4、10 个 woff2 字体、1 份简历 PDF、3 个作品集 PDF 分片
- 本项目仅用于个人作品的本地存档与离线演示
