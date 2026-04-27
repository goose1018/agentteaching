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

  const scoreCard = (card: MethodCard) => {
    const haystack = [
      card.topic,
      card.trigger,
      card.teacherMove,
      card.commonError,
      card.sampleQuestion,
      ...card.methodSteps,
      ...card.forbiddenPhrases,
    ].join(' ').toLowerCase()

    const exactTokens = [card.topic, ...card.trigger.split(/[、，,。\s]+/)]
      .map((token) => token.trim().toLowerCase())
      .filter((token) => token.length >= 2)

    let score = 0
    for (const token of exactTokens) {
      if (normalized.includes(token)) score += token.length >= 4 ? 4 : 2
    }

    const domainSignals: Array<[RegExp, string[], number]> = [
      [/电磁|磁场|磁感应|导体棒|切割磁感线|感应电动势|感应电流|安培力|楞次|法拉第|BLv/i, ['电磁', '磁', '感应', '导体棒', '切割磁感线', 'BLv'], 8],
      [/电场|电势|电势差|电荷|带电粒子|电容|电流|电阻|闭合电路/i, ['电场', '电势', '电容', '闭合电路', '电路'], 6],
      [/动量|碰撞|粘在一起|反冲|爆炸/i, ['动量', '碰撞', '反冲'], 7],
      [/斜面|受力|合外力|牛顿|摩擦|连接体|圆周|弹簧/i, ['斜面', '牛顿', '受力', '连接体', '圆周', '弹簧'], 5],
      [/透镜|焦距|像距|折射|全反射|双缝/i, ['透镜', '光学', '折射', '全反射', '双缝'], 7],
      [/热|气体|压强|体积|温度|内能/i, ['热学', '气体', '压强', '内能'], 7],
      [/原子|光电|能级|跃迁|α|粒子散射/i, ['原子', '光电', '能级', '跃迁', '散射'], 7],
      [/振动|机械波|波形|周期|频率/i, ['振动', '机械波', '周期', '频率'], 7],
    ]

    for (const [pattern, cardNeedles, weight] of domainSignals) {
      if (pattern.test(question) && cardNeedles.some((needle) => haystack.includes(needle.toLowerCase()))) {
        score += weight
      }
    }

    return score
  }

  const ranked = searchableCards
    .map((card) => ({ card, score: scoreCard(card) }))
    .sort((a, b) => b.score - a.score)

  return ranked[0]?.score > 0 ? ranked[0].card : searchableCards[0]
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
