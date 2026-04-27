# PhysicsPath · 项目历史与决策日志

> 本文档记录从初始 MVP 到当前演示版的所有关键决策、设计演化、踩坑教训。
> 给后续接手的人（或下一轮 AI）：读完这个就能 5 分钟上手。

---

## 0. 一句话定位

**PhysicsPath**：高考物理 AI 解题陪练。把名师的「解题路径」做成 AI 分身，学生订阅。

**定价分两档**：
- **目标价**（产品成熟后 / 用做品牌锚定）：¥299/月 · ¥2390/年
- **冷启动价**（首批 30–50 个真实用户）：建议 **¥49–99/月**，或 **首月免费 + 第 2 个月 ¥99**。理由：
  1. 没有口碑积累 + 没人用过 + 老师还没真签约，¥299 转化几乎为 0
  2. 首批用户的真实 token 消耗 + 留存数据 + 反馈，比早期 ARR 重要 100 倍
  3. 之后涨价比降价容易得多——定低再涨叫"老用户福利"，定高再降叫"产品不行"
  4. UI 上的 ¥299/¥2390 演示给老师 / 投资人看保留不动（这是给他们看的天花板）；首批真实付款走单独定价或 promo code 通道

核心差异化：**不是搜题工具，是名师方法的 AI 复刻**。所有 AI 回答按名师亲审过的方法卡引导，不直接给答案。

---

## 1. 项目当前形态

| 项 | 现状 |
|---|---|
| **运行环境** | Vite 8 + React 19 + TypeScript |
| **样式** | CSS 变量 token + KaTeX + ZCOOL/Noto Sans/Noto Serif 字体 |
| **AI** | DeepSeek V4-Flash（chat/JSON）·浏览器调用经 vite proxy 绕 CORS |
| **存储** | 全 localStorage（无后端） |
| **认证** | mock 登录（微信→新用户 / 手机号→老用户） |
| **支付** | 假 modal（演示用） |
| **路由** | useState + hash routing（`#/methods` `#/tutor/chang/story`） |
| **代码量** | App.tsx **597 行**（纯 orchestrator）· App.patch.css 5341 行 ⚠️ CSS 待拆 |
| **组件数** | 全部 page-level 组件已拆出到 `components/{shared,student,teacher,welcome}/`，App.tsx 只剩路由 + 顶层 state + state hash routing + SEO meta |
| **测试** | 无 |

---

## 2. 角色 / 用户身份系统

### UserTier
- `visitor`：未登录（看 Welcome 页）
- `new`：登录但未购买（NewUserHome、有 1 次免费体验）
- `paid`：已购买（StudentHome 仪表盘 + 错题本）

### 路由分流
```
Welcome 立即试用 → LoginModal
  ├─ 微信登录 → setUserTier('new') + freeAttemptsLeft=1 + StudentView=newUserHome
  └─ 手机号登录 → setUserTier('paid') + purchasedIds=[chang] + StudentView=home
```

### Demo 切换身份
Settings 里有「切换为新用户演示 / 切换为老用户演示 / 重置演示数据」，方便给真老师 / 投资人演示时快速切。

---

## 3. 核心实体

### Tutor（老师）
唯一真实 = `liuTutor`（变量名），display 名 = **X 老师**（占位真名，签下真老师后替换）。
- 前 XXX 机构金牌物理教师 · 12 年教龄 · 200+ 学生
- ¥299/月 · ¥2390/年
- 2 个内测中老师：陈书远（物理 21 年）、郭澈（数学 18 年）

### MethodCard（方法卡）
50 张种子卡（`seedMethodCards.json`）：高考物理 8 个领域分类（力学/运动学/能量/电磁学/热学/光学/原子/振动）。
每张卡：`{ id, topic, scenario, keyInsight, steps, exampleProblem, exampleSolution, commonMistakes, tags, difficulty }`。
带 `SEED_VERSION` 升级机制，避免覆盖老师手动创建的卡。

### MistakeRecord（错题本）
错题状态：`open` / `reviewing` / `mastered`。学科分类用 `subjectArea`。
新用户不写错题（避免混淆），paid 用户每完成一题写入。

### Diagnosis（题目诊断）
Coach 进入前的题目元信息：text、subject、type、difficulty、confidence、stuck（卡点列表）。
**目前 vision API 不可用，diagnosis.text 完全靠学生粘贴文字**。

---

## 4. 关键页面 / 流程

### 主链路（学生侧）

```
Welcome (carousel 4 屏)
   ↓ 立即试用
LoginModal
   ├─ 微信 → NewUserHome
   │           ↓ 立即开始 / 浏览名师
   │       Capture（拍/粘贴题目）
   │           ↓ scan animation 4 步
   │       Coach (AI 自动开场 → 学生对话 → 评价徽章)
   │           ↓ 完成本题
   │       Summary (LLM 生成家长摘要 + 学习路径)
   │           ↓ 开始练习 / 用完免费额度
   │       Pricing 或 PaywallModal
   │           ↓ 月卡 / 年卡
   │       PaymentSuccessModal → 自动 setUserTier('paid')
   │           ↓
   │       StudentHome (仪表盘)
   │
   └─ 手机号 → StudentHome（直接老用户）
                  - dashboard 主副卡
                  - 28 天 streak
                  - 最近练过列表
                  - 切换其他科目 strip
```

### 公开页面（无需登录）

- `#/methods`：方法卡库（50 张分组展示，可被搜索引擎收录）
- `#/methods/:id`：单卡详情页（含 SEO meta description）
- `#/tutor/chang/story`：X 老师虚构故事页（demo 用，签真老师后替换）

### 教师端（演示用）

侧栏 7 项：训练 AI 分身 / **上传课件**（mock 解析 PDF/PPT/图）/ 我的讲题方法 / 审核 AI 回答 / 学生问题记录 / 发布到学生端 / 质量设置。

**老师端目前是纯演示，没接生产逻辑**。

> ⚠️ **演示纪律**：给真老师 / 投资人演示老师端时，必须主动说明"上传课件 / 审核 / 发布 这些页面是交互原型，真实解析待接视觉模型（GLM-4V / Qwen-VL）"。否则老师现场传一份 PPT 看到按文件名 mock 出来的结果，信任会直接掉。`UploadCoursewareView` 顶部已加 🧪 演示原型 banner。

---

## 5. AI 集成

### 模型
- `deepseek-v4-flash`（DeepSeek 2026 新模型）
- ⚠️ **思考模式：未显式开启**。代码（`api/deepseek.ts:64-70`）只传 `model / messages / temperature / response_format / max_tokens`，没有 `enable_thinking` / `reasoning_effort` 等参数；返回也只取 `message.content`，未解析 `reasoning_content`。模型自身行为由 DeepSeek 端默认配置决定，不要在文档/对外材料里宣称"开启了思考模式"。
- JSON 输出模式（`response_format: json_object`）

### Endpoint
- Dev：vite proxy `/api/deepseek/v1/chat/completions` → `https://api.deepseek.com/v1/chat/completions`
- Prod：直连（暂不部署）

### Vision
**❌ V4-Flash 不支持图像输入**（已实测：返回 `unknown variant image_url`）。
当前演示版**强制学生粘贴题目文字**。Banner 提示「图像识别还在接入中」。

### Persona / Prompt（`api/teacherPrompt.ts`）
- 角色：X 老师（北师大物理硕士、前 XXX 机构 9 年金牌、12 年教龄）
- 教学原则 5 条：先看清对象/过程/条件 → 不直接给答案 → 错题比对题宝贵 → ...
- 说话风格 8 条：≤150 字、所有公式 LaTeX `$...$` 包裹、不用「AI/分身」、永远反问引导
- **方法卡库 digest**：从 seedMethodCards.json 取 30 张 topic + keyInsight 注入
- **JSON 输出**：`{ evaluation: 'correct'|'partial'|'wrong'|null, content: string }`
- evaluation 严格规则：多数情况 null，不要默认 partial

### Cleanup（`api/deepseek.ts`）
- 移除 markdown `**xx**` `## xx`
- $ 数量奇数 → 移除孤立 $（避免 raw 显示）
- 检测到孤立 `\text{}` `\frac{}` → 自动包 $...$
- 兜底：content 为空时给安全文案

### Summary 生成
独立 API call，传整段对话 → 输出 8 字段 JSON：
`headline / stuckStep / stuckHint / completedCount / totalSteps / minutes / impactScope / nextStepAdvice`

---

## 6. 设计系统

### Token（colors_and_type.css）
- 主色：`--ppath-ink-green-800` (#12352d)
- 强调：`--ppath-amber-600` (#c2611f)
- 米白：`--ppath-paper` (#fbfaf7)
- 字体：Noto Sans SC（正文/标题）+ Noto Serif SC（引文）+ ZCOOL XiaoWei（已弃用）

### 「分身」概念视觉系统（StampSeal.tsx）
- **SealRound**（圆章）：朱红 #9b2222 渐变 + 8 点装饰 + 篆字「分身亲签」+ feTurbulence 粗糙纹理
- **SealSquare**（方章）：32px 篆字「分身」
- **SealRoundMini / SealSquareMini**：16px 单字版
- 用在：Coach AI 气泡右上 / TeacherList 右上角标 `v1.0 已签约` / NewUserHome spotlight

### 字体决策演化
1. 一开始用 **Noto Serif SC 900**（衬线宋体黑体）→ 用户嫌"丑、太黑"
2. 切到 **ZCOOL XiaoWei** → 太瘦不够冲击力
3. 最终：**Noto Sans SC 900**（黑体粗）—— 与 Welcome 新设计一致，所有 H1 / H2 统一

---

## 7. 关键决策时间线

| 阶段 | Commit | 决策 |
|---|---|---|
| **MVP** | a3badf3 | 初版：教师端训练向导 + 学生端拍题流程 |
| **设计系统** | d1477da → 054586f → 8d2be75 → 74c3aa4 | 接入 PhysicsPath token、Lucide 图标、深色家长卡、虚构刘振华老师 |
| **商业落地 v1** | 398c636 | 1 个真实老师 + 头像 + 试看样例 + 信任元素 |
| **方法卡 + 横向 carousel + KaTeX** | 63d22ad | Cursor 生成 50 张方法卡 + Welcome 改横向轮播 + KaTeX 公式渲染 + 刘老师故事页 + 方法卡 SEO 路由 |
| **TeacherList/StudentHome/Coach 视觉** | 56e4889 | Claude Design 完整组件设计系统 |
| **错题本 + 课件上传 + 新 Welcome/Capture** | 61654d3 | 刘振华 → 常老师，学而思爱智康 → XXX 机构。错题本数据结构 + 上传课件 mock 解析 + Capture 新设计带扫描动画 |
| **登录 + 新用户首页 + 印章 + carousel v2** | 0a1954b | mock 登录 / userTier 分流 / NewUserHome / 分身印章视觉系统 / Welcome carousel nudge 动画 |
| **关键演示修复** | 5c2cdf1 | 假支付 modal + 免费 quota + 删 confirm + AI 评价徽章 |
| **DeepSeek V4-Flash 接入** | 565d906 | X 老师 prompt + 30 张方法卡注入 + JSON 输出 + 历史对话上下文 |
| **发送按钮 + AI 主动开场 + LLM Summary** | 72699ee | Coach 加真发送按钮 + 进 coach 自动开场 + Summary 用 LLM 真实生成 |
| **CORS proxy + 拖拽 + Capture 滚动** | 068892e | vite proxy / 真拖拽 / 删冗余 confirm / 修步骤一致性 |
| **常老师 → X 老师** | d9d21b0 | 一道题一对话框（重置 session）+ LaTeX 后处理 + 强制粘贴文字 |
| **Coach 按钮真接 LLM** | 6c147af | 提示一下/下一步/看完整解析 真发请求 + 过滤 firstMessage + max_tokens 1500 |
| **Coach 可信度修复** | 本次提交 | 固定每道题的 methodCard，不再用「提示一下/下一步」短文本重新匹配；删除默认开场和自动 kickoff；方法卡库/详情页恢复滚动；方法卡库接入 KaTeX；DeepSeek 空内容兜底不再暴露 debug raw；补 `{1}{2}`、`cdot` 等常见残缺公式清洗 |

---

## 8. 已知坑 / 当前限制

### 🔴 严重
- ~~**App.tsx 巨石**~~ ✅ 已拆 — App.tsx 现 ~600 行纯 orchestrator，page 组件在 `components/{shared,student,teacher,welcome}/`
- **App.patch.css 5341 行** —— 单文件 CSS 巨石（待按 welcome/student/teacher/summary/capture 至少拆 5 个文件）
- **没有后端** —— userTier / freeAttemptsLeft / mistakes / cards 全在 localStorage，浏览器一改就破
- **没有真支付** —— 任何人通过 devtools 改 localStorage 就能"白嫖"
- **API key 暴露风险** —— `VITE_DEEPSEEK_API_KEY` 会被 Vite 打进 bundle，**部署后任何用户可在 devtools 里看到**
  - **Demo 阶段可接受**：本仓库 `HISTORY §1` 标注"暂不部署"；只要不公开部署到带域名的生产环境就行
  - **公开部署前必做 checklist**：
    1. ✅ 已做 — `aiClient` 接口已抽（`api/aiClient.ts`），`directDeepSeekClient`（dev）和 `proxyAiClient`（prod）已分开，commit `b4d7c2e`
    2. 后端起一个最小 chat-proxy endpoint（Node / Python 都行），key 只在后端读环境变量（如 `DEEPSEEK_API_KEY`，**不带 `VITE_` 前缀**）
    3. 前端 build 环境**必须同时**：
       - 设置 `VITE_AI_PROXY=true`（切到 proxy 实现）
       - **删除 `VITE_DEEPSEEK_API_KEY`**（即使切了 proxy flag，只要这个变量还在构建环境里，Vite 仍会把 key 字面量内联进 bundle —— `directDeepSeekClient` 那段代码还在 bundle 里没被 tree-shake）
       - `aiClient.getAiClient()` 里有运行时 console.error 检测这种危险组合，部署前打开 devtools 确认没报警
       - 上线前必须 grep dist：`grep -r "sk-" dist/ ; grep -r "VITE_DEEPSEEK_API_KEY" dist/`，两个都为空才能发
    4. 旧 key 立即在 DeepSeek 控制台 revoke + 轮换新 key
- **vision API 没有** —— 学生只能粘贴文字

### 🟡 中等
- **教师端 100% mock** —— UploadCoursewareView 假装解析 PDF 实际只看文件名
- **方法卡步骤是关键词匹配，不是 LLM 现场生成的** —— `findMethodCard` 仍是轻量关键词命中；已修复 Coach 内「每轮按钮短文本重新匹配导致电场题 fallback 到牛二」的问题：现在进入一题后，回答/提示/下一步都按 `diagnosis.text` 对应的本题方法卡走。
- **错题本「再做一遍」语义不清** —— 跳到 coach 时 step 直接定位卡点，不是从头开始
- **Welcome carousel nudge 用 sessionStorage** —— 关浏览器就丢，会重复演
- **LaTeX 清洗只能覆盖高频坏格式** —— `Tex` 只渲染 `$...$`；已让方法卡库也走 `Tex`，并补 `{1}{2}` → `\frac{1}{2}`、`cdot` → `\cdot` 等常见兜底。但如果模型吐出完全自然语言公式（如 `1/2 m v ^ 2`），仍需要 prompt/后端清洗继续增强。

### 🟢 低
- 无 mobile 响应式审查（部分组件 < 480px 可能崩）
- 无 loading / error / empty states（很多页面假设数据存在）
- 无 i18n（写死中文）
- 无 a11y 全面审查

---

## 8.1 2026-04-27 Coach/方法卡可信度 bug 修复记录

这次修的是一组真实演示路径里暴露出来的问题，不是单纯 UI 小修：

1. **电场题被讲成牛二/力学题**
   - 根因：`sendQuestion()` 每一轮都用用户本轮输入 `text` 重新 `findMethodCard(text, cards)`。
   - 结果：按钮文案「提示一下」「下一步」匹配不到电场题，fallback 到 `searchableCards[0]`，通常就是旧 seed 的牛顿第二定律卡，导致 Coach 与 Summary 都围绕错卡生成。
   - 修复：Coach 内后续对话统一用 `findMethodCard(diagnosis.text, cards)`，即**方法卡只由本题题干决定**；按钮/学生短回复不再重新决定题型。

2. **默认 placeholder 和自动开场干扰真实对话**
   - 根因：初始 session 永远带 `firstMessage`，进入 Coach 后又有自动 `kickoffCoach()`，导致默认废话和真实开场混杂。
   - 修复：删除 `firstMessage` seed、删除自动 kickoff effect，新 session 初始 `messages: []`。学生进入 Coach 后不再自动塞一条“把题发上来”的旧文案。

3. **方法卡库无法滚动**
   - 根因：页面在 `.workspace { height: 100vh; overflow: hidden; }` 里，但 `.method-library` / `.method-detail-page` 自己没有滚动容器。
   - 修复：给这两个页面加 `flex: 1; min-height: 0; overflow-y: auto;`，避免内容被 workspace 截断。

4. **方法卡库公式不渲染**
   - 根因：`MethodCardDetail` 已用 `<Tex>`，但 `MethodLibrary` 列表里仍直接渲染 `{card.teacherMove}`。
   - 修复：`MethodLibrary` 列表摘要改为 `<Tex>{card.teacherMove}</Tex>`，列表页也走 KaTeX 渲染。

5. **DeepSeek 空 content / 残缺公式暴露给用户**
   - 根因：API 只读 `message.content`，且空 content 兜底文案带 `debug: raw=""`；同时清洗逻辑对 `{1}{2}mv^2`、`cdot`、代码块 JSON 等格式不够稳。
   - 修复：空内容改成用户可读兜底，不再显示 debug；JSON 解析支持 ```json fence；LaTeX cleanup 增强 `{1}{2}`、`frac{1}{2}`、`cdot`、裸 `\frac / \sqrt / \sin` 等常见格式。

6. **二次修正：按钮 prompt 过短导致复读/空答**
   - 现象：即使 methodCard 固定后，按钮仍把「提示一下」「好，下一步我该做什么？」这种短文本直接交给 LLM，模型容易复读、泛答或输出空 content。
   - 修复：Coach 的按钮现在采用“双文本”策略：UI 里仍显示短句，但传给 LLM 的是结构化指令，包含题目、命中方法卡、完整方法路径、当前步骤、常见错误和按钮意图（hint / next / solution）。
   - 额外防护：`sendQuestion()` 增加 `try/finally`，防止 proxy/LLM 异常后 `isThinking` 永远卡住；DeepSeek content 为空时会尝试用 `reasoning_content` 生成可读兜底，不再把内部 debug 暴露给学生。

7. **三次修正：禁止把模型思考过程当老师回答**
   - 现象：DeepSeek 有时 `content` 为空但 `reasoning_content` 有内容；上一版把 reasoning 包装成「我先按思路接住这一步…」展示给学生，导致 AI 自言自语和老师话混在一起。
   - 修复：前端永远不展示 `reasoning_content`；空 content 只给一句老师式兜底追问。`teacherPrompt` 和 Coach 按钮 prompt 也新增“禁止复述内部意图/系统指令/我们需要/学生点了/被要求”等规则。
   - 同时删除 `[deepseek raw response]` 这类浏览器 console 调试日志，避免演示时暴露内部返回结构。

8. **四次修正：聊天回答取消强制 JSON**
   - 现象：DeepSeek V4-Flash 在 `response_format: json_object` 下经常把可见 `message.content` 置空或输出不稳定，导致前端反复走兜底句「我换个问法…」，看起来像 AI 一直复读。
   - 修复：`generateAnswerWithProvider()` 的聊天回答不再传 `response_format: json_object`，`teacherPrompt` 改为直接输出老师要对学生说的话；只在 Summary 这类结构化报告里保留 JSON。聊天 `max_tokens` 保持 `3000`，因为 V4-Flash 的 reasoning 会先消耗一部分输出预算，900/1500 都容易把可见 content 挤没。
   - 取舍：聊天评价 `evaluation` 不再强依赖 LLM JSON，前端继续用本地 `mockEvaluateAnswer()` 兜底。优先保证“老师能正常讲题”，而不是优先拿结构化字段。
   - 同时将 Coach 按钮 prompt 从“内部意图：hint/next”改成学生视角请求，减少模型复述内部控制词。
   - 诊断：保留 `[deepseek diag]`，但只在 dev 环境输出，用来观察 `finish_reason / raw_len / reasoning_len / usage`；演示和未来生产环境不应依赖它。

验证：本次修复后已跑 `npm run lint` 和 `npm run build`，均通过。Build 仍有大 chunk warning，属于后续代码分割/懒加载优化项，不阻塞演示。

---

## 9. 真上线必须先做的（不再"演示"）

1. **后端 API**：Node.js / Python，至少做 user / order / quota / chat-proxy 4 个 endpoint
2. **DeepSeek key 进后端** —— 浏览器只调自己后端
3. **真支付** —— 微信支付接入 ¥300 + ICP 备案
4. **vision 模型** —— GLM-4V 或 Qwen-VL（DeepSeek 暂无 vision）
5. **认证** —— 手机号 + 短信验证码（阿里云短信 ¥0.045/条）
6. **数据库** —— PostgreSQL 存用户、订单、对话记录、方法卡
7. **教师端真实化** —— 课件上传走 OSS，AI 解析走真 vision LLM

成本估算（100 个付费用户 / 月）：
- 服务器 ¥100/月（轻量级 4C8G）
- **DeepSeek API ¥500–1500/月**（按 100 用户 × 100 题/月 × 平均 5 轮对话粗算）
  - 每轮 prompt ≈ system 2k + 30 张方法卡 digest 3k + context 1k + history 2k ≈ **8k input tokens**
  - 单题 input ≈ 40k · output ≈ 4k · Summary 调用再加 ~2k
  - 折合月度 ≈ **4 亿 input + 4 千万 output**
  - 老 HISTORY 写的 ¥30 是凭直觉填的，差 10–50 倍，**不要拿这个数字给投资人 / 老师看**
- 短信 ¥50/月
- ICP 备案 + 微信 ¥600/年
- 域名 ¥55/年

商业期 API 成本控制必做：
1. **每用户每日 token 限额**（防恶意刷 / 长对话失控）
2. **每题 token 统计**（埋点：input/output/cache_hit 三档分别计数，按用户 × 日聚合）
3. **长 prompt 压缩**：方法卡 digest 从 30 张按 topic 命中收敛到 3–5 张；history 超 6 轮做摘要
4. **prompt cache**：system + 方法卡库 digest 这两段固定，命中后 input 价格降一档
5. **热门方法卡 + 常见问法做答案缓存**：同一道题反复有人问，命中直接返回审过的答案
6. **Summary 改异步**：题做完异步生成，不阻塞 UI，可错峰 / 批量调用

---

## 10. 下一阶段方向

### 优先做
1. **代码模块化**
   - ✅ API 层（`api/deepseek.ts` · `api/teacherPrompt.ts` · `api/aiClient.ts`）
   - ✅ 子组件目录（`components/{shared,student,teacher,welcome}/`）
   - ✅ **全部 page-level 组件已拆出**（17 个组件 · Coach / Summary / Pricing / StudentHome / TeacherList / TutorDetail / Confirm / MistakesPage / NewUserHome / Settings / SubjectSelect / Welcome / MethodLibrary / MethodCardDetail / TutorStory / TeacherWorkbench / UploadCoursewareView）
   - ✅ Tutor 数据 → `data/tutors.ts`，方法卡 seed loader → `data/methodCardLoader.ts`，错题 seed → `domain.ts`
   - ✅ Types 去重 — 9 个重复类型从 App.tsx 删除，全部走 `types.ts`
   - ⏳ **CSS 拆分** — App.patch.css 仍 5341 行单文件，是下一步重点
   - ⏳ state hooks（userTier / freeAttempts / mistakes / cards 的 localStorage 同步）可考虑抽 `state/` 自定义 hook（不紧急）
2. **HISTORY.md**（本文档）—— 完成
3. **修真老师录音/视频**作为 demo —— 找你那位前爱智康老师
4. **接 GLM-4V** vision 让拍题流程变真

### 暂缓做
- 全科扩展（先把物理跑通）
- 学校采购 B2B（太重）
- 移动端 app（PWA 或原生都先不做）
- 教师端真实化（demo 阶段够用）

### 永远不做
- 微商裂变 / 倒计时 / 限时折扣（破坏品牌）
- 押题 / 提分承诺（违规）
- 直接给答案（违背产品定位）

---

## 11. 关于「为什么 X 老师不直接叫真名」

整个 demo 用「X 老师」作为占位真名，原因：
1. **没真签约前避免侵权** —— 用真老师名 = 法律风险
2. **找老师谈合作时**这份 demo 直接展示「这就是你签下来的样子」 —— 心理代入感强
3. **签下真老师后**全局批量替换 X → 真名（已做好抽象）

---

## 12. 文档索引

- `HISTORY.md` —— 本文（项目历史）
- `design-system/INTEGRATION.md` —— 设计系统接入说明
- `design-system/MARKET_PILOT.md` —— 市场试点策略（旧）
- `design-system/colors_and_type.css` —— 设计 token 定义
- `package.json` —— 依赖
- `vite.config.ts` —— DeepSeek proxy 配置

---

## 13. 给下一个接手的人

如果你是接手这个项目的人（或 AI），按这个顺序读：

1. 本文（5 分钟）
2. `package.json` + `vite.config.ts`（1 分钟）
3. `src/App.tsx` 找 `function App()`（10 分钟看路由）
4. `src/api/deepseek.ts` + `src/api/teacherPrompt.ts`（5 分钟看 AI 集成）
5. `design-system/colors_and_type.css`（2 分钟看 token）
6. 跑 `npm run dev`，走一遍 demo 流程（10 分钟）

**任何修改前，先 `npm run build && npm run lint` 确认通过。**

---

_最后更新：2026-04-27_
_Maintainer：goose1018_
