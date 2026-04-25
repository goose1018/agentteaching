import { buildPersonaPrompt } from './teacherPersona'
import type { MethodCard } from './domain'

export interface GenerateAnswerRequest {
  question: string
  methodCard: MethodCard
}

export interface GenerateAnswerResult {
  answer: string
  provider: 'mock' | 'deepseek'
}

export async function generateAnswerWithProvider({
  question,
  methodCard,
}: GenerateAnswerRequest): Promise<GenerateAnswerResult> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined

  if (!apiKey) {
    return {
      provider: 'mock',
      answer: buildMockAnswer(question, methodCard),
    }
  }

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: buildPersonaPrompt(methodCard),
          },
          {
            role: 'user',
            content: question,
          },
        ],
        temperature: 0.4,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API failed: ${response.status}`)
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    return {
      provider: 'deepseek',
      answer: data.choices?.[0]?.message?.content ?? buildMockAnswer(question, methodCard),
    }
  } catch {
    return {
      provider: 'mock',
      answer: buildMockAnswer(question, methodCard),
    }
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
