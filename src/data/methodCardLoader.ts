import { METHOD_CARD_STORAGE_KEY, seedHighSchoolCards, type MethodCard } from '../domain'
import seedMethodCardsJson from '../seedMethodCards.json'

// SeedMethodCard is the shape of seedMethodCards.json — kept inside this
// loader since nothing else consumes it.
interface SeedMethodCard {
  id: string
  subject: '高中物理'
  topic: string
  title: string
  scenario: string
  keyInsight: string
  steps: string[]
  exampleProblem: string
  exampleSolution: string
  commonMistakes: string[]
  tags: string[]
  difficulty: '易' | '中' | '难'
  estimatedMinutes: number
}

const importedSeedMethodCards = seedMethodCardsJson as SeedMethodCard[]

const convertSeedMethodCard = (card: SeedMethodCard): MethodCard => ({
  id: card.id,
  version: 1,
  subject: card.subject,
  topic: card.title,
  trigger: card.scenario,
  teacherMove: card.keyInsight,
  analogy: `把这类题先归入「${card.topic}」题型库，再按 ${card.steps.length} 步路径推进。`,
  commonError: card.commonMistakes.join('；'),
  detail: [
    card.keyInsight,
    `步骤：${card.steps.join(' ')}`,
    `标签：${card.tags.join('、')}；难度：${card.difficulty}；建议用时：${card.estimatedMinutes} 分钟。`,
  ].join('\n'),
  sampleQuestion: card.exampleProblem,
  methodSteps: card.steps,
  forbiddenPhrases: card.commonMistakes,
  trainingEvidence: {
    source: 'manual_seed',
    transcript: `${card.exampleProblem}\n${card.exampleSolution}`,
    collectedAt: '2026-04-26',
    reviewer: 'PhysicsPath 种子库',
  },
  status: 'approved',
})

export const initialMethodCards: MethodCard[] = [
  ...seedHighSchoolCards,
  ...importedSeedMethodCards.map(convertSeedMethodCard),
]

// 当 seed 内容更新时只需 bump 这个版本号，App 启动会把缺失的种子卡补进 localStorage
// 不会覆盖老师自己已经创建/修改过的卡（按 id 去重）
export const SEED_VERSION = 1
export const SEED_VERSION_STORAGE_KEY = 'physicspath:seed-version'

export function loadInitialMethodCards(): MethodCard[] {
  try {
    const stored = localStorage.getItem(METHOD_CARD_STORAGE_KEY)
    const storedVersion = Number(localStorage.getItem(SEED_VERSION_STORAGE_KEY) ?? '0')
    if (!stored) return initialMethodCards
    const parsed = JSON.parse(stored) as MethodCard[]
    if (storedVersion >= SEED_VERSION) return parsed
    const existingIds = new Set(parsed.map((c) => c.id))
    const merged = [...parsed, ...initialMethodCards.filter((c) => !existingIds.has(c.id))]
    return merged
  } catch {
    return initialMethodCards
  }
}
