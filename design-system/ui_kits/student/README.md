# Student UI kit — PhysicsPath

A click-through recreation of the **学生端** (student app), faithful to the demo in `goose1018/agentteaching` (`src/App.tsx`) but rebuilt against this design system.

## Screens covered

1. **首页 / 学习驾驶舱** — main task card, my teacher, weekly summary, subject grid
2. **老师列表** — teacher cards with illustrated portraits + price pill
3. **拍题** — capture entry with photo / album / manual input
4. **题干确认** — recognition result with confidence + editable transcript
5. **诊断预览** — diagnosis card (amber-led) + recommended teacher trial
6. **陪练 / Coach** — step card + path sidebar + guide actions
7. **本题总结** — student summary + parent summary side by side
8. **购买** — month vs year card; recommended uses ink-green border

## Design notes

- Sidebar is the demo's WeChat-feeling rail. We dropped the "新建对话" emoji and switched to a Lucide `plus` icon. Sessions in the rail use the warm paper palette instead of the demo's grey.
- The demo's blue (`#1d4ed8`) eyebrow and CTAs are removed everywhere. Eyebrows now use `--ppath-ink-green-500`; the only orange is on diagnosis result, "下一步" / "该你了" labels, and the diagnostic CTA "免费试看".
- Coach screen uses `Noto Serif SC` for the step title (e.g. **圈定系统**) — borrowing the textbook-chapter feel.
- Teacher avatars are illustrated SVG placeholders (`assets/teacher-avatar-{a,b}.svg`). They replace the demo's letter-circle initials.
- Pricing's recommended tier swaps to ink-green border, NOT amber — orange is reserved for next-step prompts only.

## Components used (from this DS)

`logo-mark.svg`, `teacher-avatar-{a,b}.svg`, Lucide via CDN, all tokens from `colors_and_type.css`.

## What's NOT in this kit

- Per the brief, no real production logic. All buttons advance through the flow; there's no model call, no upload.
- No animations beyond the system's default ease + 220ms entrance.
- No mobile breakpoints — focus is the desktop demo width.
