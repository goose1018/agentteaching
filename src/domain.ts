export type DemoSite = 'home' | 'student' | 'teacher'
export type TeacherTab = 'collect' | 'extract' | 'review' | 'publish' | 'chatlog' | 'models'
export type CardStatus = 'draft' | 'needs_review' | 'approved' | 'disabled'
export type AnswerReviewStatus = 'pending' | 'approved' | 'needs_fix' | 'rejected_example'

export interface TrainingEvidence {
  source: 'teacher_voice' | 'teacher_text' | 'manual_seed'
  transcript: string
  collectedAt: string
  reviewer: string
}

export interface MethodCard {
  id: string
  version: 1
  subject: '高中物理'
  topic: string
  trigger: string
  teacherMove: string
  analogy: string
  commonError: string
  detail: string
  sampleQuestion: string
  methodSteps: string[]
  forbiddenPhrases: string[]
  trainingEvidence: TrainingEvidence
  status: CardStatus
}

export interface ReviewItem {
  id: string
  question: string
  answer: string
  score: number
  issue: string
}

export interface AnswerReview {
  id: string
  question: string
  answer: string
  methodCardId: string
  methodCardTopic: string
  risk: string
  status: AnswerReviewStatus
  createdAt: string
}

export interface RecognitionResult {
  text: string
  confidence: number
  suspiciousFields: string[]
}

export interface WorkflowStep {
  id: string
  title: string
  description: string
}

export const METHOD_CARD_STORAGE_KEY = 'ai-teacher-agent.method-cards.v1'
export const ANSWER_REVIEW_STORAGE_KEY = 'ai-teacher-agent.answer-reviews.v1'

export const trainingWorkflow: WorkflowStep[] = [
  {
    id: 'collect',
    title: '1. 采集',
    description: 'AI 按知识点出题，老师语音讲解或粘贴讲稿。',
  },
  {
    id: 'extract',
    title: '2. 抽取',
    description: '模型从讲稿中抽取触发条件、讲法步骤、例题、误区和禁用话术。',
  },
  {
    id: 'review',
    title: '3. 审核',
    description: '老师确认这张方法卡能否代表自己，必要时加入反例库。',
  },
  {
    id: 'publish',
    title: '4. 发布',
    description: '仅 approved 方法卡进入学生端 RAG 检索。',
  },
]

export const seedHighSchoolCards: MethodCard[] = [
  {
    id: 'hs-1',
    version: 1,
    subject: '高中物理',
    topic: '牛顿第二定律',
    trigger: '加速度、合外力、连接体、斜面、受力分析、F=ma',
    teacherMove: '先选研究对象，再画受力图，定正方向，最后列 F合=ma。',
    analogy: '合力像真正推着车变速的那只手，其他力都要先合到账上。',
    commonError: '把某一个力直接当合外力，或者漏掉摩擦力、支持力、绳子拉力。',
    detail:
      '高中力学题先别急着套公式。第一步永远是选对象：单物体就画完整受力图，连接体先判断整体法还是隔离法。对象选错，后面每一步都可能错。',
    sampleQuestion:
      '质量为 m 的物块在倾角为 θ 的粗糙斜面上受拉力 F 沿斜面向上运动，求加速度。',
    methodSteps: ['选研究对象', '画完整受力图', '定正方向', '列合外力', '代入 F合=ma'],
    forbiddenPhrases: ['直接套 F=ma 就行', '这题背模板即可', '保证考试必考'],
    trainingEvidence: {
      source: 'manual_seed',
      transcript: '种子方法卡，用于演示刘老师高中物理分身的讲题风格。',
      collectedAt: '2026-04-25',
      reviewer: '刘老师',
    },
    status: 'approved',
  },
  {
    id: 'hs-2',
    version: 1,
    subject: '高中物理',
    topic: '动量守恒',
    trigger: '碰撞、爆炸、反冲、系统、短时间、共同速度、粘在一起',
    teacherMove: '先圈系统，再判断外力冲量是否可忽略，规定正方向后列碰前碰后总动量。',
    analogy: '两个人站在光滑冰面上互推，互相怎么推都只是内部折腾，整体账本不变。',
    commonError: '看到碰撞就直接守恒，没有先判断系统和外力条件。',
    detail:
      '动量守恒不是“看到碰撞就能用”。先问：系统选谁？外力在相互作用这段时间能不能忽略？如果能，再写总动量守恒。方向一定先规定。',
    sampleQuestion: '光滑水平面上两小车碰撞后粘在一起，求共同速度。',
    methodSteps: ['圈定系统', '判断外力冲量', '规定正方向', '写碰前总动量', '写碰后总动量'],
    forbiddenPhrases: ['碰撞题都守恒', '不用判断条件', '直接套公式'],
    trainingEvidence: {
      source: 'manual_seed',
      transcript: '种子方法卡，强调系统选择和守恒条件。',
      collectedAt: '2026-04-25',
      reviewer: '刘老师',
    },
    status: 'approved',
  },
  {
    id: 'hs-3',
    version: 1,
    subject: '高中物理',
    topic: '电磁感应',
    trigger: '磁通量、导体棒、切割磁感线、楞次定律、感应电流、E=BLv',
    teacherMove: '先看磁通量怎么变，再用楞次定律判方向，最后算感应电动势和电流。',
    analogy: '楞次定律像物理世界的反抗：你让磁通量增加，它就偏要阻碍增加。',
    commonError: '直接套 E=BLv，没有先判断回路是否闭合和感应电流方向。',
    detail:
      '电磁感应分两件事：方向和大小。方向靠“阻碍变化”的物理图像，大小才轮到公式。题里如果回路不闭合，就不能随便谈电流。',
    sampleQuestion: '导体棒在匀强磁场中匀速切割磁感线，求感应电动势和电流方向。',
    methodSteps: ['判断回路是否闭合', '判断磁通量变化', '用楞次定律判方向', '计算感应电动势', '必要时求电流'],
    forbiddenPhrases: ['先不管方向', '直接算 E=BLv', '有磁场就一定有感应电流'],
    trainingEvidence: {
      source: 'manual_seed',
      transcript: '种子方法卡，强调方向判断和回路条件。',
      collectedAt: '2026-04-25',
      reviewer: '刘老师',
    },
    status: 'approved',
  },
  {
    id: 'hs-4',
    version: 1,
    subject: '高中物理',
    topic: '机械能守恒',
    trigger: '重力势能、动能、光滑、弹簧、只有重力做功、机械能',
    teacherMove: '先判断是否只有重力或弹力做功，再选零势能面，列初末状态能量。',
    analogy: '能量像账户余额，只是在动能和势能两个口袋里来回倒。',
    commonError: '没有判断非保守力做功，就直接写机械能守恒。',
    detail:
      '机械能守恒先看条件，不是看题型。摩擦力、阻力、外力做功一出现，就要小心。列式时只看初末状态，不要被中间过程绕进去。',
    sampleQuestion: '小球从光滑轨道高处滑下，求最低点速度。',
    methodSteps: ['判断做功条件', '选零势能面', '确定初状态', '确定末状态', '列机械能守恒方程'],
    forbiddenPhrases: ['有高度就机械能守恒', '不用看摩擦', '中间过程越详细越好'],
    trainingEvidence: {
      source: 'manual_seed',
      transcript: '种子方法卡，强调守恒条件和初末状态。',
      collectedAt: '2026-04-25',
      reviewer: '刘老师',
    },
    status: 'needs_review',
  },
  {
    id: 'hs-5',
    version: 1,
    subject: '高中物理',
    topic: '带电粒子在磁场中运动',
    trigger: '洛伦兹力、匀强磁场、圆周运动、半径、周期、速度选择器',
    teacherMove: '先判断速度和磁场方向，再确定洛伦兹力提供向心力，最后列 qvB=mv²/r。',
    analogy: '磁场不像发动机给粒子加速，更像方向盘，只改方向不改速率。',
    commonError: '把洛伦兹力当成做功的力，误以为速度大小会变。',
    detail:
      '磁场中粒子运动先看力的方向。洛伦兹力始终垂直速度，所以不做功，只改变方向。半径和周期都从向心力方程出来。',
    sampleQuestion: '带电粒子以速度 v 垂直进入匀强磁场，求轨迹半径和周期。',
    methodSteps: ['判断速度与磁场方向', '确定洛伦兹力方向', '判断运动轨迹', '列向心力方程', '求半径或周期'],
    forbiddenPhrases: ['磁场会让粒子越跑越快', '洛伦兹力做功', '半径公式直接背'],
    trainingEvidence: {
      source: 'manual_seed',
      transcript: '种子方法卡，强调洛伦兹力不做功。',
      collectedAt: '2026-04-25',
      reviewer: '刘老师',
    },
    status: 'approved',
  },
]

export function validateMethodCard(card: MethodCard) {
  const missingFields = [
    ['topic', card.topic],
    ['trigger', card.trigger],
    ['teacherMove', card.teacherMove],
    ['commonError', card.commonError],
    ['sampleQuestion', card.sampleQuestion],
  ].filter(([, value]) => !String(value).trim())

  return {
    isValid: missingFields.length === 0 && card.methodSteps.length >= 3,
    missingFields: missingFields.map(([field]) => field),
  }
}

// ---- 错题本 (P4 + P7) ----------------------------------------------------

export type MistakeStatus = 'open' | 'reviewing' | 'mastered'
export type SubjectArea = '力学' | '运动学' | '能量' | '电磁学' | '热学' | '光学' | '原子' | '振动'

export interface MistakeRecord {
  id: string
  questionText: string
  topic: string
  cardId: string
  difficulty: '易' | '中' | '难'
  stuckAtStep: number
  totalSteps: number
  subjectArea: SubjectArea
  status: MistakeStatus
  createdAt: string
  attemptCount: number
}

export const MISTAKES_STORAGE_KEY = 'physicspath:mistakes'

export const seedMistakes: MistakeRecord[] = [
  {
    id: 'm-001',
    questionText: '光滑水平面上，小车 A 以 4m/s 向右运动碰上静止的小车 B，碰后两车粘在一起。已知 mA=2kg, mB=3kg，求碰后共同速度。',
    topic: '动量守恒 · 完全非弹性碰撞',
    cardId: 'mc-力学-动量守恒-01',
    difficulty: '中',
    stuckAtStep: 0,
    totalSteps: 4,
    subjectArea: '力学',
    status: 'open',
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    attemptCount: 1,
  },
  {
    id: 'm-002',
    questionText: '一段长为 L=0.5m 的导体棒在磁感应强度 B=0.2T 的匀强磁场中以 v=2m/s 切割磁感线，求感应电动势。',
    topic: '电磁感应 · 切割磁感线',
    cardId: 'mc-电磁学-导体棒切割-10',
    difficulty: '易',
    stuckAtStep: 2,
    totalSteps: 4,
    subjectArea: '电磁学',
    status: 'reviewing',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    attemptCount: 2,
  },
  {
    id: 'm-003',
    questionText: '凸透镜焦距 f=10cm，物体距透镜 15cm，求像距和像的性质。',
    topic: '几何光学 · 凸透镜成像',
    cardId: 'mc-光学-透镜成像-03',
    difficulty: '易',
    stuckAtStep: 0,
    totalSteps: 3,
    subjectArea: '光学',
    status: 'mastered',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    attemptCount: 3,
  },
  {
    id: 'm-004',
    questionText: '质量 m=0.5kg 的小球从光滑斜面（θ=30°）顶端静止下滑，斜面长 L=4m，求到达底端时速度。',
    topic: '能量守恒 · 斜面下滑',
    cardId: 'mc-力学-斜面识别-01',
    difficulty: '中',
    stuckAtStep: 1,
    totalSteps: 4,
    subjectArea: '力学',
    status: 'reviewing',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    attemptCount: 2,
  },
  {
    id: 'm-005',
    questionText: '一卢瑟福 α 粒子散射实验，α 粒子能量 5MeV，求最近接近金原子核的距离。',
    topic: '原子物理 · 能量守恒',
    cardId: 'mc-原子-光电效应-01',
    difficulty: '难',
    stuckAtStep: 1,
    totalSteps: 3,
    subjectArea: '原子',
    status: 'open',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    attemptCount: 1,
  },
]
