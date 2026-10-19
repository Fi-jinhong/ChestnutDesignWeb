# 栗子作品集网站

**过佳霖 / CHESTNUT — UI/UX Designer** 个人作品集网站的本地静态版本。项目最初由一个外部作品集静态站结构改写而来，现已全面替换为过佳霖的内容，可脱离网络在本机运行浏览。

> 站点简介：过佳霖的 UI/UX 设计作品集，7.5 年社交直播产品体验设计经验，聚焦语音社交、直播互动与运营视觉设计。

## 快速开始

```bash
cd outputs/haoqing6-local
npm start          # 等价于 node server.mjs
```

然后打开 <http://127.0.0.1:4173/> （可用 `PORT` 环境变量或命令行参数更换端口）。

无需安装任何依赖 —— 服务器只使用 Node.js 内置模块（Node 18+ 即可）。

## 目录结构

```
├── source/                      # 素材源文件（项目图片、人像、微信二维码等）
│   ├── 精选项目/                 # 项目1_暖暖拾光、项目2_么么直播
│   ├── 过往项目/                 # 项目3_来嗨、项目4_么么直播9周年盛典、项目5_其它运营设计
│   ├── 个人形象.png 与 微信二维码.png
│
├── work/                        # 工程脚本
│   ├── rebuild-projects.py      # 根据 source/ 素材重建首页项目区块与 5 个详情页
│   ├── rebrand-to-guojialin.py  # 身份信息批量替换脚本
│   └── local-mirror/            # 本地化补丁（注入到每个页面）
│
└── outputs/haoqing6-local/      # 最终产物：可直接运行的站点
    ├── server.mjs               # 零依赖静态文件服务器（默认端口 4173）
    └── public/
        ├── index.html           # 主页
        ├── projects/            # 5 个项目详情页
        │   ├── nuannuan/        # 暖暖拾光（13 图）
        │   ├── meme-live/       # 么么直播（10 图）
        │   ├── laihai/          # 来嗨 3.0（32 图）
        │   ├── meme-9th/        # 么么直播 9 周年盛典（7 图）
        │   └── operations/      # 其它运营设计（4 图）
        ├── project-details/     # 各项目画廊图片（01.png 起编号）
        ├── media/               # 人像形象照、微信二维码
        ├── downloads/           # 简历 PDF 与作品集 PDF 分片
        └── local/               # 注入的本地化补丁
            ├── local-app.js         # 交互实现：联系方式弹窗、一键复制、项目筛选、PDF 分片下载等
            └── local-overrides.css  # 样式覆盖：主色 #A886FF、布局微调
```

## 页面结构

| 页面 | 内容 |
|---|---|
| `/` | 主页：Hero、关于我、精选项目（2 个）、过往项目（3 个）、联系方式 |
| `/projects/nuannuan` | 暖暖拾光 —— 语音社交 App 0→1 产品设计 |
| `/projects/meme-live` | 么么直播 —— 视频娱乐直播平台体验迭代 |
| `/projects/laihai` | 来嗨 3.0 —— 亲密社交 App UX 升级改版 |
| `/projects/meme-9th` | 么么直播 9 周年盛典 —— 运营活动视觉 |
| `/projects/operations` | 其它运营设计 —— 活动视觉合集 |

## 维护方式

- **更换项目素材**：把新图片放好并更新 `work/rebuild-projects.py` 中的项目配置，重跑 `python work/rebuild-projects.py` 即可重建首页项目区块与详情页
- **调整样式**：统一写在 `outputs/haoqing6-local/public/local/local-overrides.css`（最后加载，优先级最高），避免直接改动压缩后的 CSS 包
- **调整交互**：写在 `outputs/haoqing6-local/public/local/local-app.js`

## 备注

- 全站主色：`#A886FF`
- 所有改动均已纳入 git 版本管理，可随时回退
