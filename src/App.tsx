import { useEffect, useState } from 'react'
import 'katex/dist/katex.min.css'
import { LoginModal, PaywallModal, PaymentSuccessModal } from './components/welcome/AuthModals'
import { Welcome } from './components/welcome/Welcome'
import { MethodLibrary } from './components/welcome/MethodLibrary'
import { MethodCardDetail } from './components/welcome/MethodCardDetail'
import { TutorStory } from './components/welcome/TutorStory'
import { Capture } from './components/student/Capture'
import { Coach } from './components/student/Coach'
import { Summary } from './components/student/Summary'
import { Pricing } from './components/student/Pricing'
import { StudentHome } from './components/student/StudentHome'
import { TeacherList } from './components/student/TeacherList'
import { TutorDetail } from './components/student/TutorDetail'
import { Confirm } from './components/student/Confirm'
import { MistakesPage } from './components/student/MistakesPage'
import { NewUserHome } from './components/student/NewUserHome'
import { Settings } from './components/student/Settings'
import { SubjectSelect } from './components/student/SubjectSelect'
import { TeacherWorkbench } from './components/teacher/TeacherWorkbench'
import { defaultDiagnosis } from './data/defaults'
import {
  ClipboardCheck,
  Layers,
  MessageSquareText,
  Pencil,
  Settings as SettingsIcon,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { createAnswerReview, findMethodCard } from './aiTasks'
import { getAiClient } from './api/aiClient'
import {
  ANSWER_REVIEW_STORAGE_KEY,
  METHOD_CARD_STORAGE_KEY,
  MISTAKES_STORAGE_KEY,
  seedHighSchoolCards,
  seedMistakes,
  type AnswerReview,
  type MethodCard,
  type MistakeRecord,
  type SubjectArea,
} from './domain'
import seedMethodCards from './seedMethodCards.json'
import './App.css'
import './App.patch.css'

type AppView = 'welcome' | 'student' | 'teacher'
type StudentView = 'home' | 'newUserHome' | 'capture' | 'confirm' | 'coach' | 'summary' | 'pricing' | 'subjects' | 'teachers' | 'teacherDetail' | 'methodLibrary' | 'methodCardDetail' | 'tutorStory' | 'mistakes'
type TeacherView = 'home' | 'upload' | 'train' | 'methods' | 'review' | 'records' | 'publish' | 'quality'
type Role = 'student' | 'teacher'

type Evaluation = 'correct' | 'partial' | 'wrong' | null
interface Message { id: string; role: Role; content: string; time: string; tags?: string[]; evaluation?: Evaluation }
interface Session { id: string; title: string; messages: Message[] }
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
interface Tutor {
  id: string
  name: string
  avatar: string // 头像 SVG 路径
  subject: string
  title: string
  fit: string
  specialties: string[]
  style: string
  schoolTag: string
  years: string
  result: string
  bio: string
  month: number
  year: number
  rating: number
  students: number
  purchased: boolean
  available: boolean // 是否已开放购买
}
interface Diagnosis { text: string; subject: string; type: string; difficulty: string; confidence: number; imageInfo: string; stuck: string[] }

// 当前阶段只主推一位真实感强的老师，其他老师以"内测中 / 即将开放"姿态出现
// === 主推老师：X 老师（全平台唯一开放购买的老师 · 演示占位 demo）===
const liuTutor: Tutor = {
  id: 'chang-physics-01',
  name: 'X 老师',
  avatar: '/teachers/avatar-a.svg',
  subject: '高中物理',
  title: '高中物理 · 解题路径教练',
  fit: '听课能懂，但一做题就不知道从哪下手的学生',
  specialties: ['解题路径', '力学建模', '电磁综合', '动量守恒', '压轴题拆解'],
  style: '先建模、再列式；不背模板，训练解题路径',
  schoolTag: '前XXX 机构金牌物理教师 · 教龄 12 年',
  years: '教龄 12 年',
  result: '带过 200+ 学生，多名考入清华、北大、交大等高校',
  bio: '教高中物理 12 年，最反对的是让学生背模板。物理题讲究"看明白"——看明白对象、过程、条件，公式自然就出来了。我希望我的 AI 分身做的不是替你解题，而是带你走一遍我看题的脑路。',
  month: 299,
  year: 2390,
  rating: 4.9,
  students: 286,
  purchased: false,
  available: true,
}

// === 内测中的占位老师，不可购买，制造"即将到来"的预期感 ===
const previewTutors: Tutor[] = [
  {
    id: 'chen-physics-02',
    name: '陈书远',
    avatar: '/teachers/avatar-b.svg',
    subject: '高中物理',
    title: '高中物理 · 力学模型',
    fit: '基础还可以，但综合题经常丢步骤分的学生',
    specialties: ['力学模型', '压轴题', '实验探究'],
    style: '抓关键词、拆条件，讲题节奏清晰',
    schoolTag: '省重点高中骨干教师 · 教龄 21 年',
    years: '教龄 21 年',
    result: '多届学生高考物理 90+',
    bio: '内测中，预计 5 月上线。',
    month: 109,
    year: 872,
    rating: 4.8,
    students: 0,
    purchased: false,
    available: false,
  },
  {
    id: 'guo-math-03',
    name: '郭澈',
    avatar: '/teachers/avatar-b.svg',
    subject: '高中数学',
    title: '高中数学 · 圆锥曲线',
    fit: '函数与解析几何提分慢、压轴题难突破的学生',
    specialties: ['函数导数', '圆锥曲线', '数列递推'],
    style: '从图像出发，建立结构化解题路径',
    schoolTag: '名师工作室主讲 · 教龄 18 年',
    years: '教龄 18 年',
    result: '多位学生高考数学 145+',
    bio: '内测中，预计 6 月上线。',
    month: 119,
    year: 952,
    rating: 4.9,
    students: 0,
    purchased: false,
    available: false,
  },
]

const tutors: Tutor[] = [liuTutor, ...previewTutors]
const defaultTutor = liuTutor
const firstMessage: Message = { id:'m1', role:'teacher', content:'把题发上来。先别急着找公式，物理题先看对象、过程和条件；这三样看清楚，公式自然会出来。', time:'09:41', tags:['高中物理','解题路径'] }
const fmt = () => new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit'}).format(new Date())
const importedSeedMethodCards = seedMethodCards as SeedMethodCard[]

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

const initialMethodCards = [...seedHighSchoolCards, ...importedSeedMethodCards.map(convertSeedMethodCard)]

// 当 seed 内容更新时只需 bump 这个版本号，App 启动会把缺失的种子卡补进 localStorage
// 不会覆盖老师自己已经创建/修改过的卡（按 id 去重）
const SEED_VERSION = 1
const SEED_VERSION_STORAGE_KEY = 'physicspath:seed-version'

function loadInitialMethodCards(): MethodCard[] {
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

// ChatReplay 组件已被 Slide 3 内联 chat-card 取代
// Tex 组件已迁移到 components/shared/Tex.tsx

// ---- Mock 登录 modal（演示用，一点就进）
// LoginModal / PaywallModal / PaymentSuccessModal 已迁移到 components/welcome/AuthModals.tsx

// ---- 新用户首页占位（等 Claude Design 出完整设计后替换内容）
// PortraitAvatar 组件已迁移到 components/shared/PortraitAvatar.tsx



// ---- 方法卡库（公开页，可被搜索引擎收录）

// Mock 学生回答评价（仅 fallback 用；真实评价由 LLM 输出）
// 默认 null —— 学生没真正回答具体问题时不评价
function mockEvaluateAnswer(answer: string, card: MethodCard): Evaluation {
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


// Capture / knowledgeMastery / last7DaysBars 已迁移到 components/student/Capture.tsx + data/defaults.ts

// Capture component moved to components/student/Capture.tsx



function App() {
  const [appView, setAppView] = useState<AppView>('welcome')
  const [studentView, setStudentView] = useState<StudentView>('home')
  const [teacherView, setTeacherView] = useState<TeacherView>('home')
  const [selectedSubject, setSelectedSubject] = useState('高中物理')
  const [selectedTutor, setSelectedTutor] = useState<Tutor>(defaultTutor)
  const [previewTutor, setPreviewTutor] = useState<Tutor>(defaultTutor)
  // 用户身份：visitor=未登录, new=登录但未购买, paid=已购买
  type UserTier = 'visitor' | 'new' | 'paid'
  const [userTier, setUserTier] = useState<UserTier>(() => {
    try {
      const v = localStorage.getItem('physicspath:user-tier')
      return (v === 'new' || v === 'paid' || v === 'visitor') ? v as UserTier : 'visitor'
    } catch { return 'visitor' }
  })
  const [purchasedIds, setPurchasedIds] = useState<string[]>(() => {
    try {
      const v = localStorage.getItem('physicspath:purchased-ids')
      return v ? (JSON.parse(v) as string[]) : []
    } catch { return [] }
  })
  useEffect(() => {
    localStorage.setItem('physicspath:user-tier', userTier)
  }, [userTier])
  useEffect(() => {
    localStorage.setItem('physicspath:purchased-ids', JSON.stringify(purchasedIds))
  }, [purchasedIds])
  const [showLogin, setShowLogin] = useState(false)
  const [showPaySuccess, setShowPaySuccess] = useState<null | 'month' | 'year'>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  // 新用户免费额度（首次试用 1 道题）
  const [freeAttemptsLeft, setFreeAttemptsLeft] = useState<number>(() => {
    try {
      const v = localStorage.getItem('physicspath:free-attempts')
      return v !== null ? Number(v) : 1
    } catch { return 1 }
  })
  useEffect(() => {
    localStorage.setItem('physicspath:free-attempts', String(freeAttemptsLeft))
  }, [freeAttemptsLeft])
  const [showSettings, setShowSettings] = useState(false)
  const [diagnosis, setDiagnosis] = useState<Diagnosis>(defaultDiagnosis)
  const [draft, setDraft] = useState('')
  const [step, setStep] = useState(0)
  const [isThinking, setIsThinking] = useState(false)
  const [cards, setCards] = useState<MethodCard[]>(loadInitialMethodCards)
  const [activeMethodCardId, setActiveMethodCardId] = useState<string>('')
  const [answerReviews, setAnswerReviews] = useState<AnswerReview[]>(() => {
    try {
      const stored = localStorage.getItem(ANSWER_REVIEW_STORAGE_KEY)
      return stored ? (JSON.parse(stored) as AnswerReview[]) : []
    } catch {
      return []
    }
  })
  const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => {
    try {
      const stored = localStorage.getItem(MISTAKES_STORAGE_KEY)
      return stored ? (JSON.parse(stored) as MistakeRecord[]) : seedMistakes
    } catch {
      return seedMistakes
    }
  })
  const [sessions, setSessions] = useState<Session[]>([
    { id: 's1', title: '动量守恒判断', messages: [firstMessage] },
  ])
  const [activeSessionId, setActiveSessionId] = useState('s1')

  useEffect(() => {
    localStorage.setItem(METHOD_CARD_STORAGE_KEY, JSON.stringify(cards))
    localStorage.setItem(SEED_VERSION_STORAGE_KEY, String(SEED_VERSION))
  }, [cards])
  useEffect(() => localStorage.setItem(ANSWER_REVIEW_STORAGE_KEY, JSON.stringify(answerReviews)), [answerReviews])
  useEffect(() => localStorage.setItem(MISTAKES_STORAGE_KEY, JSON.stringify(mistakes)), [mistakes])

  // ---- Hash 路由：#/methods、#/methods/:id、#/tutor/chang/story
  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash.replace(/^#/, '')
      if (hash.startsWith('/methods/')) {
        const id = decodeURIComponent(hash.slice('/methods/'.length))
        if (id) {
          setActiveMethodCardId(id)
          setAppView('student')
          setStudentView('methodCardDetail')
          return
        }
      }
      if (hash === '/methods') {
        setAppView('student')
        setStudentView('methodLibrary')
        return
      }
      if (hash === '/tutor/chang/story') {
        setAppView('student')
        setStudentView('tutorStory')
        return
      }
    }
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  // ---- SEO：根据当前视图更新 document.title 和 meta description
  useEffect(() => {
    const card = cards.find((c) => c.id === activeMethodCardId)
    if (appView === 'welcome') {
      document.title = 'PhysicsPath · 高考物理名师 AI 解题教练'
    } else if (studentView === 'methodLibrary') {
      document.title = '高考物理方法卡库 · X 老师老师 · PhysicsPath'
    } else if (studentView === 'methodCardDetail' && card) {
      document.title = `${card.topic} · 高考物理方法卡 · PhysicsPath`
      const meta = document.querySelector('meta[name="description"]') ?? (() => {
        const m = document.createElement('meta')
        m.setAttribute('name', 'description')
        document.head.appendChild(m)
        return m
      })()
      meta.setAttribute('content', `${card.topic} —— ${card.teacherMove}`)
    } else if (studentView === 'tutorStory') {
      document.title = 'X 老师 · 32 年教龄物理名师 · PhysicsPath'
    } else {
      document.title = 'PhysicsPath'
    }
  }, [appView, studentView, activeMethodCardId, cards])

  const availableTutors = tutors
    .filter((t) => t.subject === selectedSubject)
    .map((t) => ({ ...t, purchased: purchasedIds.includes(t.id) }))
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0]
  const methodCard = findMethodCard(diagnosis.text, cards)

  const setMessages = (updater: (messages: Message[]) => Message[]) => {
    setSessions((current) =>
      current.map((session) =>
        session.id === activeSessionId ? { ...session, messages: updater(session.messages) } : session,
      ),
    )
  }

  const createSession = () => {
    const session: Session = {
      id: crypto.randomUUID(),
      title: '新的提问',
      messages: [{ ...firstMessage, id: crypto.randomUUID(), time: fmt() }],
    }
    setSessions((current) => [session, ...current])
    setActiveSessionId(session.id)
    if (userTier === 'new' && freeAttemptsLeft <= 0) {
      setShowPaywall(true)
      return
    }
    setStudentView('capture')
  }

  const sendQuestion = async (question: string) => {
    const text = question.trim()
    if (!text) return
    const studentMessage: Message = { id: crypto.randomUUID(), role: 'student', content: text, time: fmt() }
    setMessages((current) => [...current, studentMessage])
    setDraft('')
    setIsThinking(true)
    const card = findMethodCard(text, cards)
    // 过滤掉占位 firstMessage（避免连续两条 assistant 让 LLM 困惑）
    const realMessages = (activeSession?.messages ?? []).filter(
      (m) => m.content !== firstMessage.content
    )
    const history = realMessages.slice(-6).map((m) => ({
      role: (m.role === 'teacher' ? 'teacher' : 'student') as 'teacher' | 'student',
      content: m.content,
    }))
    const result = await getAiClient().generateAnswer({
      question: text,
      methodCard: card,
      problemText: diagnosis.text,
      history,
    })
    setAnswerReviews((current) => [createAnswerReview(text, result.answer, card), ...current].slice(0, 50))
    // 优先用真 LLM 输出的 evaluation；mock fallback 时退化到本地关键词匹配
    const evaluation = result.evaluation ?? mockEvaluateAnswer(text, card)
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'teacher', content: result.answer, time: fmt(), tags: [card.topic], evaluation },
    ])
    setIsThinking(false)
  }

  // Coach 开场：第一次进 coach 时让 AI 基于题目主动给出第一句引导
  const kickoffCoach = async () => {
    setIsThinking(true)
    const card = findMethodCard(diagnosis.text, cards)
    const result = await getAiClient().generateAnswer({
      question: `[系统启动] 学生刚拍了这道题：${diagnosis.text}\n请按你的方法卡，主动开场——先点出题型，然后明确告诉学生第一步要做什么、要思考什么具体问题。一定要以反问结尾。`,
      methodCard: card,
      problemText: diagnosis.text,
      history: [],
    })
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'teacher', content: result.answer, time: fmt(), tags: [card.topic], evaluation: null },
    ])
    setIsThinking(false)
  }

  // 进 coach 时如果只有默认开场消息，自动让 AI 基于题目重新开场
  useEffect(() => {
    if (studentView !== 'coach') return
    if (!activeSession) return
    // 只在 session 仅含默认开场（teacher role 单条）时触发
    const hasOnlyOpener = activeSession.messages.length === 1 &&
      activeSession.messages[0].role === 'teacher' &&
      !activeSession.messages[0].evaluation // 排除已 kickoff 过的
    if (hasOnlyOpener && diagnosis.text) {
      void Promise.resolve().then(() => kickoffCoach())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentView, activeSession?.id])

  // 假支付：弹成功 modal，确认后升级为 paid 用户并跳 home
  const handleSubscribe = (plan: 'month' | 'year') => {
    setShowPaySuccess(plan)
  }
  const finishPayment = () => {
    setShowPaySuccess(null)
    setUserTier('paid')
    setPurchasedIds([liuTutor.id])
    setSelectedTutor({ ...liuTutor, purchased: true })
    setFreeAttemptsLeft(0) // 已购买后免费额度归零（已经无限）
    setStudentView('home')
  }

  // 新用户尝试开新一道题：检查免费额度 + 重置 session（一道题一个对话框）
  const tryStartCapture = () => {
    if (userTier === 'new' && freeAttemptsLeft <= 0) {
      setShowPaywall(true)
      return
    }
    // 创建全新 session，避免历史对话污染新题目
    const session: Session = {
      id: crypto.randomUUID(),
      title: '新的提问',
      messages: [{ ...firstMessage, id: crypto.randomUUID(), time: fmt() }],
    }
    setSessions((current) => [session, ...current])
    setActiveSessionId(session.id)
    // 清空之前的题目
    setDiagnosis(defaultDiagnosis)
    setStep(0)
    setStudentView('capture')
  }

  const resetDemo = () => {
    try {
      localStorage.removeItem(METHOD_CARD_STORAGE_KEY)
      localStorage.removeItem(ANSWER_REVIEW_STORAGE_KEY)
      localStorage.removeItem(SEED_VERSION_STORAGE_KEY)
      localStorage.removeItem(MISTAKES_STORAGE_KEY)
    } catch { /* noop */ }
    window.location.hash = ''
    window.location.reload()
  }

  const loginAsNew = () => {
    setUserTier('new')
    setPurchasedIds([])
    setFreeAttemptsLeft(1) // 切换为新用户演示时重置免费额度
    setShowLogin(false)
    setStudentView('newUserHome')
    setAppView('student')
  }
  const loginAsPaid = () => {
    setUserTier('paid')
    setPurchasedIds([liuTutor.id])
    setSelectedTutor({ ...liuTutor, purchased: true })
    setShowLogin(false)
    setStudentView('home')
    setAppView('student')
  }
  const logout = () => {
    setUserTier('visitor')
    setPurchasedIds([])
    setStudentView('home')
    setAppView('welcome')
  }

  if (appView === 'welcome') return (
    <>
      <Welcome
        go={setAppView}
        openStory={() => { window.location.hash = '#/tutor/chang/story' }}
        openLibrary={() => { window.location.hash = '#/methods' }}
        openLogin={() => setShowLogin(true)}
      />
      {showLogin && (
        <LoginModal
          close={() => setShowLogin(false)}
          onLoginNew={loginAsNew}
          onLoginPaid={loginAsPaid}
        />
      )}
      {showPaySuccess && (
        <PaymentSuccessModal
          tutor={liuTutor}
          plan={showPaySuccess}
          onDone={finishPayment}
        />
      )}
      {showPaywall && (
        <PaywallModal
          tutor={liuTutor}
          onSubscribe={(plan) => { setShowPaywall(false); handleSubscribe(plan) }}
          onClose={() => { setShowPaywall(false); setStudentView('newUserHome') }}
        />
      )}
    </>
  )
  if (appView === 'teacher') {
    return (
      <TeacherWorkbench
        view={teacherView}
        setView={setTeacherView}
        setApp={setAppView}
        cards={cards}
        setCards={setCards}
        answerReviews={answerReviews}
        setAnswerReviews={setAnswerReviews}
      />
    )
  }

  return (
    <main className="app-shell student-site">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo-mark"><span className="lambda">λ</span></div>
          <div className="brand-lockup">
            <strong>PhysicsPath</strong>
            <span>跟{selectedTutor.name}练{selectedTutor.subject.replace('高中', '')}</span>
          </div>
        </div>
        <button className="new-chat" type="button" onClick={createSession}>
          <Pencil size={14} /> 新建拍题
        </button>
        <div className="sidebar-section">
          <span className="section-title">学习</span>
          <button
            className={`session-item ${studentView === 'home' || studentView === 'newUserHome' ? 'active' : ''}`}
            type="button"
            onClick={() => setStudentView(userTier === 'paid' ? 'home' : 'newUserHome')}
          >
            <Workflow size={14} /> <span>首页仪表盘</span>
          </button>
          {userTier === 'paid' && (
            <button
              className={`session-item ${studentView === 'mistakes' ? 'active' : ''}`}
              type="button"
              onClick={() => setStudentView('mistakes')}
            >
              <ClipboardCheck size={14} /> <span>错题本</span>
              {mistakes.filter((m) => m.status !== 'mastered').length > 0 && (
                <span className="badge">{mistakes.filter((m) => m.status !== 'mastered').length}</span>
              )}
            </button>
          )}
          <button
            className={`session-item ${studentView === 'methodLibrary' ? 'active' : ''}`}
            type="button"
            onClick={() => { window.location.hash = ''; setStudentView('methodLibrary') }}
          >
            <Layers size={14} /> <span>方法卡库</span>
          </button>
          {userTier === 'new' && (
            <button
              className="session-item upgrade-cta"
              type="button"
              onClick={() => setStudentView('teachers')}
            >
              <Sparkles size={14} /> <span>解锁全部功能</span>
            </button>
          )}
        </div>
        <div className="sidebar-section">
          <span className="section-title">最近会话</span>
          {sessions.map((session) => (
            <button
              className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
              key={session.id}
              type="button"
              onClick={() => { setActiveSessionId(session.id); setStudentView('coach') }}
            >
              <MessageSquareText size={14} /> <span>{session.title}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-foot">
          <div className="user-card">
            <div className="user-avatar">小</div>
            <div>
              <strong>同学好</strong>
              <span>{userTier === 'paid' ? `已订阅${selectedTutor.name}` : '免费体验中'}</span>
            </div>
          </div>
          <button className="gear-button" type="button" onClick={() => setShowSettings(true)}>
            <SettingsIcon size={16} /> 设置
          </button>
        </div>
      </aside>
      {showSettings && (
        <Settings
          close={() => setShowSettings(false)}
          setStudent={setStudentView}
          resetDemo={resetDemo}
          switchToNew={loginAsNew}
          switchToPaid={loginAsPaid}
          logout={logout}
        />
      )}
      <section className="workspace">
        {studentView === 'home' && <StudentHome tutor={selectedTutor} setView={setStudentView} onStartNew={tryStartCapture} />}
        {studentView === 'newUserHome' && (
          <NewUserHome
            tutor={liuTutor}
            onTryFree={tryStartCapture}
            onBrowseTutors={() => setStudentView('teachers')}
            onViewStory={() => { window.location.hash = '#/tutor/chang/story' }}
            onSubscribe={() => { setStudentView('pricing') }}
          />
        )}
        {studentView === 'subjects' && <SubjectSelect selected={selectedSubject} setSelected={setSelectedSubject} setView={setStudentView} />}
        {studentView === 'teachers' && <TeacherList list={availableTutors} setPreview={setPreviewTutor} setView={setStudentView} />}
        {studentView === 'teacherDetail' && <TutorDetail tutor={previewTutor} back={() => setStudentView('teachers')} buy={() => handleSubscribe('month')} enter={() => { setSelectedTutor(previewTutor); setStudentView('coach') }} />}
        {studentView === 'capture' && <Capture setDiagnosis={setDiagnosis} setView={setStudentView} tutor={selectedTutor} userTier={userTier} freeAttemptsLeft={freeAttemptsLeft} />}
        {studentView === 'confirm' && <Confirm diagnosis={diagnosis} setDiagnosis={setDiagnosis} setView={setStudentView} />}
        {studentView === 'coach' && (
          <Coach
            tutor={selectedTutor}
            session={activeSession}
            draft={draft}
            setDraft={setDraft}
            send={sendQuestion}
            step={step}
            setStep={setStep}
            card={methodCard}
            isThinking={isThinking}
            onSwitchProblem={tryStartCapture}
            diagnosis={diagnosis}
            onComplete={() => {
              if (userTier === 'paid') {
                const subjectArea: SubjectArea = (
                  ['力学', '运动学', '能量', '电磁学', '热学', '光学', '原子', '振动'] as const
                ).find((k) => methodCard.topic.includes(k.replace('学', ''))) ?? '力学'
                const newMistake: MistakeRecord = {
                  id: `m-${Date.now()}`,
                  questionText: diagnosis.text,
                  topic: methodCard.topic,
                  cardId: methodCard.id,
                  difficulty: (diagnosis.difficulty.includes('易') ? '易' : diagnosis.difficulty.includes('难') ? '难' : '中'),
                  stuckAtStep: step,
                  totalSteps: methodCard.methodSteps.length,
                  subjectArea,
                  status: step >= methodCard.methodSteps.length - 1 ? 'mastered' : 'open',
                  createdAt: new Date().toISOString(),
                  attemptCount: 1,
                }
                setMistakes((current) => [newMistake, ...current])
              } else if (userTier === 'new') {
                // 新用户：扣减免费额度，不写错题本
                setFreeAttemptsLeft((n) => Math.max(0, n - 1))
              }
              setStudentView('summary')
            }}
          />
        )}
        {studentView === 'summary' && (
          <Summary
            diagnosis={diagnosis}
            card={methodCard}
            setView={setStudentView}
            conversation={(activeSession?.messages ?? []).map((m) => ({
              role: (m.role === 'teacher' ? 'teacher' : 'student') as 'student' | 'teacher',
              content: m.content,
            }))}
          />
        )}
        {studentView === 'pricing' && <Pricing tutor={selectedTutor} onSubscribe={handleSubscribe} />}
        {studentView === 'mistakes' && (
          <MistakesPage
            mistakes={mistakes}
            setMistakes={setMistakes}
            openMistake={(m) => {
              const card = cards.find((c) => c.id === m.cardId) ?? methodCard
              setDiagnosis({
                ...defaultDiagnosis,
                text: m.questionText,
                difficulty: m.difficulty + '等',
                stuck: [card.commonError ?? '看清研究对象'],
              })
              setStep(m.stuckAtStep)
              setStudentView('coach')
            }}
          />
        )}
        {studentView === 'methodLibrary' && (
          <MethodLibrary
            cards={cards}
            openCard={(id) => { window.location.hash = `#/methods/${encodeURIComponent(id)}` }}
            back={() => { window.location.hash = ''; setStudentView('home') }}
          />
        )}
        {studentView === 'methodCardDetail' && (
          <MethodCardDetail
            card={cards.find((c) => c.id === activeMethodCardId) ?? cards[0]}
            back={() => { window.location.hash = '#/methods' }}
            tryIt={() => { window.location.hash = ''; setStudentView('coach') }}
          />
        )}
        {studentView === 'tutorStory' && (
          <TutorStory
            tutor={liuTutor}
            back={() => { window.location.hash = ''; setAppView('welcome') }}
            buy={() => { window.location.hash = ''; setStudentView('teacherDetail'); setPreviewTutor(liuTutor) }}
          />
        )}
      </section>
    </main>
  )
}

export default App
