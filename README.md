# 学术Title合成游戏 - 项目说明

## 游戏主题
把"合成大西瓜"改成学术Title升级主题，两个相同Title碰撞合成更高一级的Title，最终目标是合成"诺贝尔奖获得者"。

## Title等级表
| 等级 | 学术Title |
|:---:|:---|
| 1 | 本科生 |
| 2 | 硕士生 |
| 3 | 博士生 |
| 4 | 博士后 |
| 5 | 讲师 |
| 6 | 副教授 |
| 7 | 教授/博导 |
| 8 | 长江学者 |
| 9 | 杰青 |
| 10 | 院士 |
| 11 | 诺贝尔奖获得者 |

## 技术栈
- HTML5 + CSS3
- JavaScript (原生)
- Matter.js 物理引擎

## 运行方式
1. 本地运行：用浏览器打开 index.html
2. 或使用 serve 工具：`npx serve .`

## 部署方式

### 方式一：Vercel 部署（推荐）
1. 安装 Vercel CLI：`npm i -g vercel`
2. 进入项目目录：`cd D:\ezgame`
3. 登录 Vercel：`vercel login`
4. 部署：`vercel --prod`
5. 绑定自定义域名：在 Vercel Dashboard 中 Settings → Domains 添加 `oliveira-game.com`

### 方式二：GitHub + Vercel
1. 将项目推送到 GitHub
2. 在 Vercel Dashboard 导入 GitHub 仓库
3. 部署完成后在 Settings → Domains 绑定自定义域名

### 方式三：Cloudflare Pages
1. 登录 Cloudflare Dashboard
2. 进入 Pages → Create Pages
3. 连接 GitHub 仓库或直接上传文件
4. 绑定自定义域名

## 待实现功能列表
见 TODO.md
