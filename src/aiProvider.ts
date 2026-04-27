import { buildSystemPrompt, buildContextMessage } from './teacherPersona'
import type { MethodCard } from './domain'

export type Evaluation = 'correct' | 'partial' | 'wrong' | null

export interface GenerateAnswerRequest {
  question: string
  methodCard: MethodCard
  problemText?: string
  history?: Array<{ role: 'student' | 'teacher'; content: string }>
}

export interface GenerateAnswerResult {
  answer: string
  evaluation: Evaluation
  provider: 'mock' | 'deepseek'
}

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'
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
        max_tokens: 600,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`DeepSeek API ${response.status}: ${errText.slice(0, 200)}`)
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const raw = data.choices?.[0]?.message?.content ?? ''
    const parsed = parseTeacherJson(raw)

    return {
      provider: 'deepseek',
      answer: parsed.content || buildMockAnswer(question, methodCard),
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

function parseTeacherJson(raw: string): TeacherJson {
  try {
    const obj = JSON.parse(raw) as { content?: string; evaluation?: string }
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
export interface StudySummaryResult {
  headline: string          // 一句话概括孩子在哪卡住
  stuckStep: string         // 卡在第几步的名字
  stuckHint: string         // 老师对这一步的提示
  completedCount: number    // 完成步骤数
  totalSteps: number
  minutes: number           // 用时
  impactScope: string       // 影响范围
  nextStepAdvice: string    // 下一步建议
  provider: 'mock' | 'deepseek'
}

export interface GenerateSummaryRequest {
  problemText: string
  methodCard: MethodCard
  conversation: Array<{ role: 'student' | 'teacher'; content: string }>
  studentName?: string
}

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
  "headline": "一句话概括孩子今天最卡哪一步（≤30字，给家长看）",
  "stuckStep": "卡住的步骤名（直接抄方法卡里的）",
  "stuckHint": "X 老师对这一步的提示（≤40字）",
  "completedCount": 数字（已走通的步骤数）,
  "totalSteps": 数字（方法卡总步骤数）,
  "minutes": 数字（估计用时分钟，5-15 之间）,
  "impactScope": "这题考察的物理领域（≤20字）",
  "nextStepAdvice": "下一步该练什么（≤30字）"
}
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
