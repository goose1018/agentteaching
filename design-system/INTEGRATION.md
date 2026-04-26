# PhysicsPath 设计系统 — 集成指南

这是 PhysicsPath（名师 AI 解题教练）的完整设计系统。把整个 `design-system/` 文件夹放到你的 repo 里就能用。

## 目录结构

```
design-system/
├── colors_and_type.css      ← 所有 CSS 变量（颜色、字体、圆角、阴影、间距）
├── README.md                ← 设计原则、品牌声音、内容规则
├── MARKET_PILOT.md          ← 市场切入策略（北京 / 上海 / 深圳）
├── assets/                  ← Logo、老师头像 SVG
├── preview/                 ← 22 个组件参考实现（HTML 卡片）
└── ui_kits/student/         ← 完整学生端流程 demo
```

## 在你的项目里使用（3 步）

### 1. 把 design-system/ 放到你 repo 根目录

```
your-app/
├── design-system/      ← 拖进去
├── src/
└── package.json
```

### 2. 在你的入口 CSS 里 import

```css
/* src/index.css 或 src/main.css */
@import "../design-system/colors_and_type.css";
```

### 3. 用变量写组件

```tsx
// 不要写硬编码颜色：
<button style={{ background: '#12352d' }}>...</button>

// 写变量：
<button style={{ background: 'var(--ppath-ink-green-800)' }}>...</button>
```

## 给 Cursor / Claude Code 的开场白

新会话第一句贴这段：

> 这个 repo 里有 `design-system/` 文件夹，是 PhysicsPath 的设计系统。
> 写任何 UI 之前请先：
> 1. 读 `design-system/README.md` 理解品牌原则
> 2. 读 `design-system/colors_and_type.css` 拿所有 CSS 变量
> 3. 看 `design-system/preview/` 里对应的组件参考实现
>
> 规则：
> - 颜色 / 字体 / 间距 / 圆角必须用 CSS 变量，不要硬编码
> - 暖橙 `--ppath-amber-600` 只用于"下一步"和诊断结果，不做装饰
> - 字体用 Inter + Noto Sans SC；公式用 KaTeX；图标用 Lucide 线性款
> - 不要用 emoji、不要用 AI 销售话术、不要 ✨🚀 类装饰

## 永久生效（推荐）

在 repo 根目录建一个 `CLAUDE.md`，把上面那段开场白复制进去。Claude Code 每次会话会自动读。

Cursor 同理：在 `.cursor/rules` 下建一个 `physicspath.md`。

## 关键 CSS 变量速查

```css
/* 主色 */
--ppath-ink-green-900: #0e2a23;  /* 最深，body 文字 */
--ppath-ink-green-800: #12352d;  /* 主按钮 */
--ppath-ink-green-100: #e7f0ea;  /* tag 底色 */

/* 强调色（仅"下一步"/ 诊断结果）*/
--ppath-amber-600: #c2611f;
--ppath-amber-50:  #fdf3e6;

/* 中性 */
--ppath-paper:      #fbfaf7;     /* 页面底 */
--ppath-paper-deep: #f6f2ea;     /* hero 底 */
--ppath-card:       #ffffff;
--ppath-line:       #eadfce;     /* 暖描边 */

/* 字号 */
--ppath-text-base: 15px;
--ppath-text-xl:   24px;
--ppath-text-3xl:  44px;

/* 圆角 */
--ppath-radius-md:  16px;
--ppath-radius-xl:  24px;
--ppath-radius-pill: 999px;

/* 阴影 */
--ppath-shadow-md: 0 8px 28px rgba(48, 38, 22, 0.06);
```

## 字体

需要在你的 HTML `<head>` 里加：

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```

公式渲染（如果用到）：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body)"></script>
```

图标：

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```

## 推到 GitHub 的步骤

```bash
# 在你的 agentteaching repo 里
git checkout -b add-design-system
mkdir -p design-system
# 把解压后的 design-system/ 内容拖进去
git add design-system
git commit -m "Add PhysicsPath design system"
git push origin add-design-system
```

之后在 Cursor 里打开这个 repo / 切到这个 branch，就能用了。
