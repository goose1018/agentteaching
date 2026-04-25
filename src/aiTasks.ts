import type { AnswerReview, MethodCard, RecognitionResult } from './domain'

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
