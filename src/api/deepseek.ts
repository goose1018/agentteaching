import { buildSystemPrompt, buildContextMessage } from './teacherPrompt'
import type { MethodCard } from '../domain'
import type {
  Evaluation,
  GenerateAnswerRequest,
  GenerateAnswerResult,
  GenerateSummaryRequest,
  StudySummaryResult,
} from './aiClient'

// Dev 走 vite proxy 绕 CORS；prod 直连
const DEEPSEEK_URL = import.meta.env.DEV
  ? '/api/deepseek/v1/chat/completions'
  : 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-v4-flash'

export async function generateAnswerWithProvider({
  question,
  methodCard,
  problemText,
  history = [],
}: GenerateAnswerRequest): Promise<GenerateAnswerResult> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined

  if (!apiKey) {
    return {
      provider: 'mock',
      evaluation: null,
      answer: buildMockAnswer(question, methodCard),
    }
  }

  try {
    const systemPrompt = buildSystemPrompt()
    const contextMsg = buildContextMessage(methodCard, problemText ?? null)

    // 构造对话历史：system + context (assistant 第一条) + 历史轮次 + 当前 user
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: contextMsg },
    ]
    history.forEach((h) => {
      messages.push({
        role: h.role === 'teacher' ? 'assistant' : 'user',
        content: h.content,
      })
    })
    messages.push({ role: 'user', content: question })

    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        max_tokens: 1500, // 思考模式可能吃掉 reasoning tokens，留足空间给 content
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`DeepSeek API ${response.status}: ${errText.slice(0, 200)}`)
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>
    }

    const message = data.choices?.[0]?.message
    const raw = message?.content ?? ''
    const reasoningFallback = message?.reasoning_content?.trim() ?? ''
    const parsed = parseTeacherJson(raw)

    // 兜底：LLM 返回 content 真为空时，重新开个新提问
    const content = parsed.content?.trim()
    const safeAnswer = content && content.length > 0
      ? cleanupLatex(content)
      : reasoningFallback
        ? cleanupLatex(`我先按思路接住这一步：${reasoningFallback.slice(0, 220)}。那你能先判断当前步骤应该看哪个物理量吗？`)
        : `我这次没组织好回答。你再发一次，或者换个问法，我会继续按这道题的方法卡带你走。`

    return {
      provider: 'deepseek',
      answer: safeAnswer,
      evaluation: parsed.evaluation,
    }
  } catch (error) {
    console.error('DeepSeek API failed, falling back to mock:', error)
    return {
      provider: 'mock',
      evaluation: null,
      answer: buildMockAnswer(question, methodCard),
    }
  }
}

interface TeacherJson {
  content: string
  evaluation: Evaluation
}

// LaTeX 后处理：修复 LLM 漏 $ 包裹的常见问题
function cleanupLatex(text: string): string {
  // 1. 移除 markdown 加粗 / 斜体 / 标题标记
  let out = text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **xx** -> xx
    .replace(/__(.+?)__/g, '$1')       // __xx__ -> xx
    .replace(/^#+\s*/gm, '')           // # 标题
    .replace(/\{1\}\{2\}/g, '\\frac{1}{2}')
    .replace(/\bfrac\{1\}\{2\}/g, '\\frac{1}{2}')
    .replace(/\bcdot\b/g, '\\cdot')
  // 2. 检查 $ 数量是否成对
  const dollars = (out.match(/\$/g) || []).length
  if (dollars % 2 !== 0) {
    // 奇数个 $ — 配对失败，移除孤立的 $ 避免 raw 显示
    out = out.replace(/\$/g, '')
  }
  // 3. 兜底：如果完全没有 $ 但出现了裸 LaTeX 命令，包住最常见的公式片段。
  if (!out.includes('$') && /\\(text|frac|sqrt|sin|cos|tan)\b/.test(out)) {
    out = out.replace(
      /(\\frac\{[^}]+\}\{[^}]+\}(?:\s*\\cdot\s*)?(?:[A-Za-z0-9_^{}+\-*/\\]+)?|[A-Za-z](?:_[A-Za-z0-9{}]+)?\s*=\s*[^，。；;\n]+|\\(?:sqrt|sin|cos|tan)\{?[^，。；;\s]*\}?)/g,
      (_match) => `$${_match.trim()}$`,
    )
  }
  return out
}

function parseTeacherJson(raw: string): TeacherJson {
  if (!raw.trim()) return { content: '', evaluation: null }
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    const jsonText = cleaned.startsWith('{')
      ? cleaned
      : start >= 0 && end > start
        ? cleaned.slice(start, end + 1)
        : ''
    if (!jsonText) return { content: cleaned, evaluation: null }
    const obj = JSON.parse(jsonText) as { content?: string; evaluation?: string }
    const evaluation = (['correct', 'partial', 'wrong'].includes(obj.evaluation ?? '')
      ? obj.evaluation
      : null) as Evaluation
    return {
      content: typeof obj.content === 'string' ? obj.content : '',
      evaluation,
    }
  } catch {
    // JSON 解析失败：直接把 raw 当文本返回
    return { content: raw, evaluation: null }
  }
}

function buildMockAnswer(_question: string, card: MethodCard) {
  return `好了，这道题我看完了。你先直接告诉我：这题你把哪个对象当研究对象？

这道题本质上归到「${card.topic}」。${card.teacherMove}

先别急着代公式。${card.detail}

这类题最容易出问题的地方，是${card.commonError}

按我的习惯，步骤是：${card.methodSteps.join(' → ')}。

你先把第一步写出来，我再带你看下一步。`
}

// ---- 学习总结生成（Summary 页用）
//   Types live in ./aiClient — this is the impl.

export async function generateStudySummary({
  problemText,
  methodCard,
  conversation,
  studentName = '小明',
}: GenerateSummaryRequest): Promise<StudySummaryResult> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined
  const totalSteps = methodCard.methodSteps.length
  const fallback: StudySummaryResult = {
    headline: `${studentName}在「${methodCard.methodSteps[Math.max(0, totalSteps - 1)]}」这一步卡住了`,
    stuckStep: methodCard.methodSteps[Math.max(0, totalSteps - 1)] ?? '最后一步',
    stuckHint: methodCard.commonError || '注意先判断条件再列方程',
    completedCount: Math.max(1, totalSteps - 1),
    totalSteps,
    minutes: 8,
    impactScope: methodCard.topic,
    nextStepAdvice: `再练 2 道「${methodCard.topic}」同类题`,
    provider: 'mock',
  }

  if (!apiKey || conversation.length === 0) return fallback

  try {
    const transcript = conversation
      .map((m) => `${m.role === 'student' ? '学生' : 'X 老师'}：${m.content}`)
      .join('\n')
    const sysPrompt = `你是教学分析师。根据师生对话生成「家长摘要」+「学生学习总结」，必须输出严格 JSON：
{
  "headline": "一句话概括孩子今天最卡哪一步（≤35 字，给家长看，要具体说卡在做什么动作上）",
  "stuckStep": "卡住的步骤名（直接抄方法卡里的）",
  "stuckHint": "X 老师对这一步的具体教法（60-80 字，要能指导学生具体怎么做这一步，不要空话）",
  "completedCount": 数字（已走通的步骤数）,
  "totalSteps": 数字（方法卡总步骤数）,
  "minutes": 数字（估计用时分钟，5-15 之间）,
  "impactScope": "这题考察的物理领域，多个用 / 分隔（≤25 字）",
  "nextStepAdvice": "下一步该练什么具体题型（≤35 字，要具体）"
}

stuckHint 例子：
- ✅ 好："水平面光滑就只有重力和支持力，竖直方向抵消，水平方向无外力——这才能用动量守恒。检查时画一张受力图。"
- ❌ 差："检查系统在水平方向是否受外力" （太短，没指导）

不要直接给答案，不要承诺提分。基于对话真实判断。`
    const userPrompt = `# 题目\n${problemText}\n\n# 命中方法卡\n${methodCard.topic}\n步骤：${methodCard.methodSteps.join(' → ')}\n常见错误：${methodCard.commonError}\n\n# 对话记录\n${transcript}`

    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500,
      }),
    })
    if (!response.ok) throw new Error(`API ${response.status}`)
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const raw = data.choices?.[0]?.message?.content ?? ''
    const parsed = JSON.parse(raw) as Partial<StudySummaryResult>
    return {
      headline: parsed.headline ?? fallback.headline,
      stuckStep: parsed.stuckStep ?? fallback.stuckStep,
      stuckHint: parsed.stuckHint ?? fallback.stuckHint,
      completedCount: parsed.completedCount ?? fallback.completedCount,
      totalSteps: parsed.totalSteps ?? fallback.totalSteps,
      minutes: parsed.minutes ?? fallback.minutes,
      impactScope: parsed.impactScope ?? fallback.impactScope,
      nextStepAdvice: parsed.nextStepAdvice ?? fallback.nextStepAdvice,
      provider: 'deepseek',
    }
  } catch (error) {
    console.error('Summary API failed:', error)
    return fallback
  }
}
