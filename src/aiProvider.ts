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
