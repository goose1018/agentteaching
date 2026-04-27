import type { AnswerReview, MethodCard, RecognitionResult } from './domain'
import type { Evaluation } from './types'

export function recognizeProblemImage(fileName: string): RecognitionResult {
  const isLowConfidence = /blur|模糊|draft|草稿/i.test(fileName)

  return {
    text: `识别结果示例（${fileName}）：光滑水平面上小车 A 与小车 B 发生碰撞，碰后粘在一起运动。已知两车质量和碰前速度，求碰后共同速度。`,
    confidence: isLowConfidence ? 0.62 : 0.89,
    suspiciousFields: isLowConfidence ? ['碰前速度数值', '小车质量标注'] : [],
  }
}

export function findMethodCard(question: string, cards: MethodCard[]) {
  const normalized = question.toLowerCase()
  const publishedCards = cards.filter((card) => card.status === 'approved')
  const searchableCards = publishedCards.length > 0 ? publishedCards : cards

  return (
    searchableCards.find((card) => {
      const keywords = [card.topic, ...card.trigger.split('、'), ...card.trigger.split('，')]
      return keywords.some((keyword) => normalized.includes(keyword.toLowerCase().trim()))
    }) ?? searchableCards[0]
  )
}

export function generateTeacherAnswer(question: string, cards: MethodCard[]) {
  const card = findMethodCard(question, cards)
  const answer = `这题先看「${card.topic}」。

${card.teacherMove}

别急着算数字，先把题里的对象和过程圈出来。${card.detail}

这类题最容易错在：${card.commonError}

可以这么想：${card.analogy}

按步骤来：${card.methodSteps.join(' → ')}。`

  return {
    card,
    answer,
    tags: [card.topic, '命中方法卡', card.status === 'approved' ? '已审核' : '待审核'],
  }
}

// Mock 学生回答评价（仅 fallback 用；真实评价由 LLM 输出）
// 默认 null —— 学生没真正回答具体问题时不评价
export function mockEvaluateAnswer(answer: string, card: MethodCard): Evaluation {
  const text = answer.toLowerCase()
  if (!text.trim() || text.length < 2) return null
  // 学生求助 / 没思路 → 不算"答错"，不评价
  if (/不会|不知道|不确定|想想|提示|帮我|看不懂|怎么办|啥|什么意思/.test(text)) return null
  // 短消息（< 6 字）通常是问候/确认/打字 → 不评价
  if (text.length < 6) return null
  // 命中禁用方法 → wrong
  if (card.forbiddenPhrases?.some((p) => text.includes(p.toLowerCase()))) return 'wrong'
  // 命中方法步骤关键词 → correct
  const stepKeywords = card.methodSteps.flatMap((s) => s.split(/[、，。\s]+/)).filter((k) => k.length >= 2)
  if (stepKeywords.some((k) => text.includes(k.toLowerCase()))) return 'correct'
  // 都不命中 → 不评价（不能默认 partial，会让学生觉得永远在错）
  return null
}

export function createAnswerReview(question: string, answer: string, card: MethodCard): AnswerReview {
  return {
    id: crypto.randomUUID(),
    question,
    answer,
    methodCardId: card.id,
    methodCardTopic: card.topic,
    risk: card.status === 'approved' ? '低风险：命中已审核方法卡' : '需复核：方法卡尚未批准发布',
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}
