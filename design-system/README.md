# PhysicsPath Design System

A design system for **PhysicsPath 名师 AI 解题教练** — an AI study companion that walks Chinese high-school students through unfamiliar problems using methods authored, recorded, and reviewed by real local teachers.

> 不是搜答案，而是训练你怎么想题。
> 拍一道题，AI 老师会先识别题型，再按老师的方法一步步带你分析。

---

## What this product is

PhysicsPath is **not a "拍题搜答案" app**. It is a method-card-driven coach that does three things:

1. **学生端 (Student)** — Photo a problem → AI recognizes the topic → student is walked step-by-step through the **teacher's method**, not handed the answer. Every session ends with a parent summary.
2. **老师端 (Teacher)** — Teacher records or types how they teach a topic. AI extracts a *method card* (trigger, first move, common error, forbidden phrases, sample). The teacher reviews and approves. Only approved cards reach students. Student answers flow back into a review queue.
3. **家长端 (Parent)** — Sees where the kid got stuck, why, and what to practice next. No score promises, no test predictions.

**Core users:** Chinese high school students + parents (parents pay).
**MVP subject:** 高中物理 with 刘老师. Other subjects shown as "招募老师中".

## Sources

This design system was built from the project's web MVP demo:

- **GitHub:** `goose1018/agentteaching` — React + Vite + TypeScript MVP. Imported files now live in `src/` for reference (`App.tsx`, `App.css`, `domain.ts`, `teacherPersona.ts`).
- **Brand brief:** copy + visual direction supplied by the project owner. Key constraints captured below.
- **Hero illustration:** `assets/hero.png` (from the demo's `src/assets/`).

The repo's `public/icons.svg` was social-only (X / GitHub / Bluesky) and not relevant — discarded. We use **Lucide** (CDN) for line iconography; see `ICONOGRAPHY` below.

## Index

| File | Purpose |
| --- | --- |
| `README.md` | This file — product context + foundations + iconography |
| `SKILL.md` | Agent SKILLS frontmatter; lets Claude Code use this system |
| `colors_and_type.css` | Color tokens, type scale, radii, shadows, motion |
| `assets/` | Logos, hero image, illustrated teacher avatars |
| `fonts/` | (placeholder — using Google Fonts CDN; see Visual Foundations) |
| `preview/` | Design System cards (typography specimens, swatches, components) |
| `ui_kits/student/` | Student app — Welcome, Cockpit, Photo→Diagnose flow, Coach |
| `ui_kits/teacher/` | Teacher app — Workbench, Method Library, Review |
| `ui_kits/parent/` | Parent weekly summary card |

---

## CONTENT FUNDAMENTALS — Voice & Tone

Voice is the spine of this product. The brief is explicit: **不要可爱、不要儿童化、不要太科技感、不要 AI 味很浓的紫色霓虹风**. Copy must sound like a competent local teacher, not a SaaS landing page and not an AI hype reel.

### Voice rules

- **Talk like a real teacher.** "把题发上来。先别急着找公式。" Direct, calm, slightly bossy in the way good teachers are. Never effusive.
- **Train, don't tell.** Frame everything as a question or a step. "你先看三件事：研究系统是谁？外力冲量能不能忽略？" Never "Here's the answer."
- **No hype words.** Avoid 神器, 超级老师, 一键提分, 必考, 押题, 包过, 革命性, AI 智能体.
- **Light on AI vocabulary.** Say *老师的讲题方法* / *AI 分身* sparingly. The product is the teacher's method; AI is the delivery mechanism.
- **Honest about limits.** "图像识别不确定时，必须让学生确认题干。" Confidence scores and "我不太确定" beat pretending to know.
- **No emoji.** Period. (See Iconography.)

### Brand sentences

| Slot | Copy |
| --- | --- |
| Master line | 不是搜答案，而是训练你怎么想题。 |
| Sub line | 拍一道题，AI 老师先识别题型，再按老师的方法一步步带你分析。 |
| Teacher pitch (to teachers) | 我们不是让 AI 替代你，是把你的讲法整理成方法卡，由你审核后再发给学生。 |
| Parent pitch (to parents) | 我们不承诺提分、不押题。我们让孩子学会怎么想题。 |

### Casing & punctuation

- **Chinese punctuation throughout in zh content** — `。，；：「」（）` not `.,;:""()`. Mixed-language sentences use a half-width space around English/numbers.
- **Headings are sentences, not titles.** "训练我的 AI 分身" not "训练 AI 分身". Capitalization in English copy uses sentence case ("Photo a problem"), never Title Case.
- **Numerals** are always Arabic (`12 道题`, `¥99/月`). Never 一二三 in UI counts.
- **Pronouns:** address the student as **你**. Never **您** (too distant). Address parents as **您** in the parent surface only — it's the one place we shift register.

### Concrete copy examples (lifted from the demo)

| Surface | Line |
| --- | --- |
| Student welcome CTA | 我是学生，开始学习 |
| Photo capture | 拍下你不会的题 / 建议只拍一道题 |
| Coach prompt | 这道题先别急着套公式。你觉得这一步应该怎么判断？ |
| Step pill | 当前步骤 2 / 5 |
| Recognition check | 识别正确，继续 / 有错误，我来修改 |
| Parent summary | 孩子本题主要卡在：没有先选研究对象。 |
| Teacher review action | 像我，发布 / 需要修改 / 不像我，重做 |
| Pricing | ¥99/月 · 每月 120 次拍题诊断 |

The "像我，发布" review button is the soul of this product — it locates control with the teacher in one phrase. Reuse this pattern (humble, first-person, plain) wherever a teacher acts.

---

## VISUAL FOUNDATIONS

The aesthetic target is **a quiet teacher's notebook**: warm paper, ink-green text, occasional warm-orange marginalia where the next thing matters. We are deliberately under-designing.

### Colors

| Role | Token | Hex | Usage |
| --- | --- | --- | --- |
| Primary | `--ppath-ink-green-800` | `#12352d` | Brand mark, primary buttons, hero typography on light |
| Primary hover | `--ppath-ink-green-700` | `#1f4a3f` | Hover/press for primary |
| Eyebrow / soft label | `--ppath-ink-green-500` | `#4f8c65` | Section eyebrows, status dots |
| Accent | `--ppath-amber-600` | `#c2611f` | **Diagnosis result, "下一步", call-to-think moments only** |
| Page bg | `--ppath-paper` | `#fbfaf7` | Default app background |
| Hero bg | `--ppath-paper-deep` | `#f6f2ea` | Welcome screen, marketing hero |
| Card | `--ppath-card` | `#ffffff` | Cards on paper — they read as "paper on top of paper" |
| Hairline | `--ppath-line` | `#eadfce` | Warm border, never grey |
| Body text | `--ppath-fg-1` | `#10201b` | Almost-black with green undertone |
| Secondary text | `--ppath-fg-2` | `#5d6964` | Captions, descriptions |
| Success | `--ppath-success-700` | `#16613f` | Approved, recognition success |
| Warning | `--ppath-warning-700` | `#92400e` | Needs review, low confidence |
| Danger | `--ppath-danger-700` | `#9b2226` | Disabled cards, destructive |

**Discipline rule:** orange appears at most once per screen. If you see two orange chips, kill one. Orange is for the moment the student needs to decide; it loses meaning if it decorates.

The **demo's existing blue** (`#1d4ed8`) is intentionally retired in this system. It read as generic SaaS and clashed with the brief's "不要太科技感". Where the demo used blue accents, this system uses ink-green for structural elements and amber for diagnostic emphasis.

### Backgrounds

- **No full-bleed photography.** No gradients with neon. No grain overlay.
- **Solid paper.** `--ppath-paper` for app, `--ppath-paper-deep` for welcome.
- **Cards on paper** create depth — never gradients, never glassmorphism. A card is `bg: white, border: 1px hairline, soft warm shadow`.
- **No repeating patterns.** Optional: a single subtle textured backdrop on the welcome page, but only as a flat color in this iteration.

### Type

- **Display (rarely used):** Noto Serif SC — only for the hero master line and large numerals. Carries the "教材 / 讲义" feel.
- **Sans (everything else):** Noto Sans SC. Weights 400 / 500 / 700 / 900.
- **Mono:** JetBrains Mono — for formula fragments inline (`F = ma`, `qvB = mv²/r`). Never for chrome.
- Body is **15px**, leading **1.65**. Long-form coach panels go to **17px / 1.7**.
- Hero/display kerning is **-0.06em**. Body is default.

### Spacing

- 4-px grid: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64`.
- Card interior padding: **24px** standard, **20px** dense.
- Section gaps: **48–64px** between major regions, **16px** within a card cluster.

### Borders & corners

- Hairlines are **1px solid `#eadfce`** — warm, never grey.
- Card radius **20–24px**. Tag/pill radius `999px`. Button radius `14px` or `999px`.
- Active step pill / diagnosis card uses a slightly heavier border (`var(--ppath-ink-green-800)`, 1px) — the "this is the focus" signal.

### Shadows

| Token | Use |
| --- | --- |
| `--ppath-shadow-sm` | Default card on paper |
| `--ppath-shadow-md` | Hover lift, popover |
| `--ppath-shadow-lg` | Welcome illustration card, modal |
| `--ppath-shadow-xl` | Hero stack |
| `--ppath-shadow-amber` | Warm glow under primary CTA on dark hero (rare) |

Shadows are **warm-tinted** (`rgba(48, 38, 22, 0.06)`), never cool blue. Inner shadows are not used.

### Hover & press states

- **Buttons (primary):** hover → `--ppath-ink-green-700`, press → translateY(1px) and remove shadow.
- **Buttons (ghost / secondary):** hover → bg `--ppath-ink-green-100`, no scale.
- **Cards (clickable):** hover → translateY(-2px), shadow upgrades sm→md, border tint shifts to `--ppath-ink-green-500` at 30% mix.
- **Tags / pills:** no hover state — they're labels, not actions.
- **Disabled:** opacity 0.55, cursor not-allowed. No grey-out fills.

### Animation

- Default ease: `cubic-bezier(0.2, 0.7, 0.2, 1)` — a calm settle, not a bounce.
- Durations: **140ms** for hover, **220ms** for entrance, **400ms** for layout shifts.
- Message-bubble reveal: 8px translate + fade, 160ms.
- Typing indicator: 3-dot opacity pulse, 900ms loop, no bounce.
- **No bounces, no springy overshoots, no parallax.** The product feels like ink drying, not a marketing site.

### Transparency & blur

- Sticky topbar uses `backdrop-filter: blur(18px)` over `rgba(255, 255, 255, 0.92)` — the only blur in the system.
- Modal scrim: `rgba(15, 23, 42, 0.4)` flat, no blur.
- No frosted glass anywhere else.

### Cards (the workhorse)

Every card in the product follows one rule:

```
background:    var(--ppath-card);
border:        var(--ppath-border);   /* 1px #eadfce */
border-radius: var(--ppath-radius-xl); /* 24px */
box-shadow:    var(--ppath-shadow-md);
padding:       var(--ppath-space-6);   /* 24px */
```

Variants:
- **Diagnosis card** — same shell + a top eyebrow `诊断` in amber.
- **Method card (teacher)** — same shell + status pill (approved/needs_review/disabled) top-right.
- **Parent summary card** — same shell + a secondary fill `--ppath-paper-deep` to differentiate from primary content.
- **Recommended pricing card** — border swaps to `--ppath-ink-green-800` 1px (NOT amber — amber is for next-step CTAs only).

### Layout rules

- Sticky sidebar (student app): 292px. Sticky topbar: 64–82px.
- Coach view max content width: **850px**. Long lines break trust.
- Welcome master line max width: **760px**. Hero stack centered with illustration card at right.

---

## ICONOGRAPHY

PhysicsPath uses **Lucide** line icons (1.5px stroke, rounded caps), CDN-loaded. We deliberately do **not** use:

- **No emoji.** None. The brief is explicit. Where the demo uses emoji (`⚙ 设置`), this system replaces with Lucide `settings`.
- **No filled icons.** Always the line variant.
- **No initials-in-circle avatars** for teachers. Teachers get illustrated portraits (see below). Students keep an avatar slot but it's a generic small mark, never a colored letter circle.
- **No real photographs of teachers.** Brief explicitly excludes them.

### Loading

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<i data-lucide="camera"></i>
<script>lucide.createIcons();</script>
```

The repo's `public/icons.svg` contained only social brand marks (X, GitHub, Discord, Bluesky) — irrelevant here, so it was removed.

### Icon vocabulary

| Action / concept | Lucide name |
| --- | --- |
| 拍题 / 拍照 | `camera` |
| 上传 / 相册 | `image` |
| 提示 | `lightbulb` |
| 完整解析 | `book-open` |
| 我来试试 | `pencil` |
| 设置 | `settings` |
| 历史会话 | `message-square-text` |
| 老师 (teacher) | `graduation-cap` |
| 学生 (student) | `backpack` |
| 家长摘要 | `mail` |
| 录制 | `mic` |
| 审核通过 | `check-circle-2` |
| 需要修改 | `pencil-line` |
| 反例库 | `flag` |
| 步骤 | `list-checks` |

### Teacher avatars

Generic illustrated portraits, single warm-paper background, ink-green linework, no facial detail beyond glasses / hair silhouette. We placeholder these as an SVG illustration in `assets/teacher-avatar.svg` — **flag for the user to commission a unified illustration set** before launch. See README CAVEATS.

### Subject marks

The student-app subject grid uses single-character glyphs (`F` for 物理, `∑` for 数学, `H₂` for 化学, `DNA` for 生物) inside a 44×44 ink-green-tinted square. These are typographic, not icons — keeping with the "讲义封面" feel.

---

## CAVEATS / next steps

- **Fonts:** This system loads Noto Sans SC + Noto Serif SC from Google Fonts. If you have an in-house Chinese display face (e.g. a custom 思源 / FZLT cut), drop `.ttf`s into `fonts/` and update `colors_and_type.css`.
- **Teacher avatars:** placeholder SVG only. Commission a real illustrated set (10–20 portraits, single style, single accent color) before launch.
- **Hero illustration:** `assets/hero.png` was inherited from the demo and is generic. Replace with a brand-owned illustration (pencil + paper + step-by-step path) when ready.
- **Subject icons:** typographic placeholders. A custom 9-glyph set (one per 高中 subject) would be a strong upgrade.
