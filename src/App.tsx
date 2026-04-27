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
import { defaultDiagnosis } from './data/defaults'
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Flag,
  Image as ImageIcon,
  Layers,
  ListChecks,
  MessageSquareText,
  Mic,
  Pencil,
  PencilLine,
  Settings as SettingsIcon,
  ShieldCheck,
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
const statusLabel = (s: MethodCard['status']) => ({ approved: '已发布', needs_review: '待审核', draft: '草稿', disabled: '已禁用' }[s] ?? s)
const reviewStatusLabel = (s: AnswerReview['status']) => ({ pending: '待审核', approved: '已通过', needs_fix: '要求修改', rejected_example: '已加入反例库' }[s] ?? s)
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


interface TeacherProps {
  view: TeacherView
  setView: (view: TeacherView) => void
  setApp: (view: AppView) => void
  cards: MethodCard[]
  setCards: React.Dispatch<React.SetStateAction<MethodCard[]>>
  answerReviews: AnswerReview[]
  setAnswerReviews: React.Dispatch<React.SetStateAction<AnswerReview[]>>
}

const teacherSteps = [
  { id: 'topic', title: '1. 选择题型', desc: '挑一类你最擅长讲的题。' },
  { id: 'speak', title: '2. 像上课一样讲一遍', desc: '可以语音也可以打字，重点说第一眼看什么、第一步问学生什么、学生最容易错哪里、什么时候才能列公式。' },
  { id: 'extract', title: '3. AI 提取我的讲题方法', desc: '系统把你的讲法整理成可审核的卡片，由你决定能不能发布。' },
  { id: 'review', title: '4. 你审核后发布给学生', desc: '只有你确认的方法，AI 才会代表你回答。' },
] as const

const teacherTopics = [
  '受力分析',
  '牛顿第二定律',
  '动量守恒',
  '电磁感应',
  '机械能守恒',
  '带电粒子在磁场中运动',
]

// ---- 课件上传组件（教师端核心新功能：免去手填表单，直接传课件让 AI 提取）
type UploadStatus = 'pending' | 'parsing' | 'done' | 'failed'
interface UploadFile {
  id: string
  name: string
  size: number
  type: string
  status: UploadStatus
  extractedCount?: number  // 解析出的方法卡数量
  error?: string
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.md'
const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const fileIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📕'
  if (['doc', 'docx'].includes(ext ?? '')) return '📄'
  if (['ppt', 'pptx'].includes(ext ?? '')) return '📊'
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext ?? '')) return '🖼️'
  if (['txt', 'md'].includes(ext ?? '')) return '📝'
  return '📎'
}

// Mock 解析：根据文件名/类型生成 1-3 张占位草稿方法卡
// 真接 LLM 后，这个函数应换成调用 DeepSeek-VL / Claude vision 提取
async function mockExtractCards(file: File): Promise<MethodCard[]> {
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 2000))
  const lower = file.name.toLowerCase()
  const isPhysics = /物理|力学|电磁|动量|能量|波动|光学|斜面|碰撞/.test(file.name) || true
  const sampleTopics = isPhysics
    ? ['圆周运动 · 向心力分析', '动量守恒 · 系统判定', '电磁感应 · 楞次定律应用']
    : ['通用题型 · 步骤拆解']

  const cardCount = lower.endsWith('.pdf') || lower.endsWith('.docx') ? 3 : lower.endsWith('.ppt') || lower.endsWith('.pptx') ? 2 : 1
  const topics = sampleTopics.slice(0, cardCount)

  return topics.map((topic, i) => ({
    id: `upload-${Date.now()}-${i}`,
    version: 1 as const,
    subject: '高中物理' as const,
    topic,
    trigger: `从《${file.name}》提取 - 出现 ${topic} 相关关键词`,
    teacherMove: `按你的讲法：先看清研究对象，再判断用哪个守恒。`,
    analogy: `这类题就像账本——先把"账户"圈出来。`,
    commonError: '直接套公式，没先判断条件成立。',
    detail: `从课件 ${file.name} 解析。需要老师补充和审核。`,
    sampleQuestion: `详见原课件第 X 页。`,
    methodSteps: ['圈研究对象', '判断条件', '列方程', '验算'],
    forbiddenPhrases: ['直接给答案', '不解释步骤'],
    trainingEvidence: {
      source: 'manual_seed' as const,
      transcript: `课件文件：${file.name} (${formatBytes(file.size)})`,
      collectedAt: new Date().toISOString(),
      reviewer: '待审核',
    },
    status: 'needs_review' as const,
  }))
}

function UploadCoursewareView({ setCards, setView }: {
  setCards: React.Dispatch<React.SetStateAction<MethodCard[]>>
  setView: (v: TeacherView) => void
}) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [totalExtracted, setTotalExtracted] = useState(0)

  const processFile = async (rawFile: File, id: string) => {
    setFiles((current) => current.map((f) => (f.id === id ? { ...f, status: 'parsing' } : f)))
    try {
      const cards = await mockExtractCards(rawFile)
      setCards((current) => [...cards, ...current])
      setFiles((current) => current.map((f) =>
        f.id === id ? { ...f, status: 'done', extractedCount: cards.length } : f
      ))
      setTotalExtracted((n) => n + cards.length)
    } catch (e) {
      setFiles((current) => current.map((f) =>
        f.id === id ? { ...f, status: 'failed', error: e instanceof Error ? e.message : '解析失败' } : f
      ))
    }
  }

  const handleFiles = (rawFiles: FileList | File[]) => {
    const newOnes: UploadFile[] = []
    Array.from(rawFiles).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        newOnes.push({
          id: `f-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'failed',
          error: '文件超过 30MB',
        })
        return
      }
      const id = `f-${Date.now()}-${Math.random()}`
      newOnes.push({ id, name: file.name, size: file.size, type: file.type, status: 'pending' })
      processFile(file, id)
    })
    setFiles((current) => [...newOnes, ...current])
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  const removeFile = (id: string) => setFiles((current) => current.filter((f) => f.id !== id))

  const statusLabel = (s: UploadStatus) =>
    ({ pending: '排队中', parsing: 'AI 解析中…', done: '已生成草稿', failed: '失败' }[s])

  return (
    <section className="teacher-grid">
      <div className="panel hero-panel">
        <p className="eyebrow">省时模式 · 推荐</p>
        <h2>把课件丢进来，AI 自动整理你的讲题方法</h2>
        <p>支持 PDF / DOC / PPT / 图片 等格式。AI 会按你的讲法提取「方法卡草稿」，你只需要审核。</p>
        <div className="paste-hint" style={{ marginTop: 16 }}>
          🧪 演示原型：本页是教师训练后台的交互流程演示。当前 AI 解析按文件名生成草稿（mock），真实部署将接入 GLM-4V / Qwen-VL 等视觉模型，对 PPT / PDF / 板书图片做内容级解析。
        </div>
      </div>

      <div className="panel">
        <label
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            hidden
          />
          <div className="upload-icon">📤</div>
          <strong>拖拽文件到这里，或点击选择</strong>
          <span>支持 PDF · DOC/DOCX · PPT/PPTX · PNG/JPG · TXT/MD（单个 ≤ 30MB）</span>
        </label>

        <div className="upload-supported">
          <span className="badge">📕 PDF</span>
          <span className="badge">📄 DOC/DOCX</span>
          <span className="badge">📊 PPT/PPTX</span>
          <span className="badge">🖼️ PNG/JPG</span>
          <span className="badge">📝 TXT/MD</span>
        </div>
      </div>

      {files.length > 0 && (
        <div className="panel full-width">
          <div className="panel-title">
            <h2>上传记录</h2>
            <span>共 {files.length} 份 · 已生成 {totalExtracted} 张方法卡草稿</span>
          </div>
          <div className="upload-list">
            {files.map((f) => (
              <div key={f.id} className={`upload-item status-${f.status}`}>
                <span className="file-icon">{fileIcon(f.name)}</span>
                <div className="file-meta">
                  <strong className="file-name">{f.name}</strong>
                  <span className="file-info">
                    {formatBytes(f.size)} · {statusLabel(f.status)}
                    {f.status === 'done' && f.extractedCount && ` · ${f.extractedCount} 张草稿`}
                    {f.status === 'failed' && f.error && ` · ${f.error}`}
                  </span>
                </div>
                {f.status === 'parsing' && <span className="loader" />}
                {f.status === 'done' && (
                  <button type="button" className="link-button" onClick={() => setView('methods')}>
                    去审核 →
                  </button>
                )}
                {(f.status === 'failed' || f.status === 'done') && (
                  <button type="button" className="ghost-icon" onClick={() => removeFile(f.id)}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <h2>课件上传是怎么工作的</h2>
        <ol className="upload-howto">
          <li><strong>1. 上传</strong>：拖拽你的课件 / 例题 PDF / 课堂讲稿 PPT / 黑板照片</li>
          <li><strong>2. AI 解析</strong>：DeepSeek-VL + GPT-4o vision 读取文档内容，识别题型 / 步骤 / 公式</li>
          <li><strong>3. 草稿生成</strong>：AI 按你的讲法提取「方法卡」草稿（题型 + 关键判断 + 解题步骤 + 常见错误）</li>
          <li><strong>4. 你审核</strong>：在「我的讲题方法」里逐张确认，改 / 删 / 发布</li>
          <li><strong>5. 上线</strong>：审核通过的方法卡才会被 AI 分身用来回答学生</li>
        </ol>
        <p className="panel-tip">所有上传文件经过加密存储，仅用于训练你自己的 AI 分身。</p>
      </div>
    </section>
  )
}

function TeacherApp(props: TeacherProps) {
  const { view, setView, setApp, cards, setCards, answerReviews, setAnswerReviews } = props
  const [topic, setTopic] = useState(teacherTopics[2])
  const [transcript, setTranscript] = useState('动量守恒这类题，先别急着写公式。第一件事是圈系统，第二件事是看外力冲量能不能忽略。学生最容易错在看到碰撞就直接守恒。')
  const [activeCardId, setActiveCardId] = useState<string>(cards[0]?.id ?? '')
  const activeCard = cards.find((c) => c.id === activeCardId) ?? cards[0]

  const updateActiveCard = (updates: Partial<MethodCard>) => {
    if (!activeCard) return
    setCards((current) => current.map((card) => (card.id === activeCard.id ? { ...card, ...updates } : card)))
  }

  const extractCard = () => {
    const isMagnetic = /磁|感应|楞次|导体棒|电动势/.test(transcript)
    const inferredTopic = isMagnetic ? '电磁感应' : topic
    const card: MethodCard = {
      id: `teacher-${Date.now()}`,
      version: 1,
      subject: '高中物理',
      topic: inferredTopic,
      trigger: isMagnetic ? '磁通量、导体棒、楞次定律、感应电流' : '碰撞、爆炸、反冲、系统、共同速度',
      teacherMove: isMagnetic ? '先判断磁通量怎么变，再判方向，最后算感应电动势。' : '先圈系统，再判断外力冲量是否可忽略，规定正方向后列总动量。',
      analogy: isMagnetic ? '楞次定律像物理世界的反抗。' : '系统像一本账，内部相互作用不改变总账。',
      commonError: isMagnetic ? '只算大小，不判方向。' : '看到碰撞就直接守恒，没有判断系统和外力条件。',
      detail: transcript,
      sampleQuestion: isMagnetic ? '导体棒切割磁感线，求感应电动势和方向。' : '两车碰撞后粘在一起，求共同速度。',
      methodSteps: isMagnetic ? ['看回路', '看磁通量变化', '判方向', '算电动势'] : ['圈系统', '判断外力冲量', '规定正方向', '列碰前后动量'],
      forbiddenPhrases: isMagnetic ? ['直接套公式', '先不管方向'] : ['碰撞题都守恒', '不用判断条件'],
      trainingEvidence: { source: 'teacher_text', transcript, collectedAt: new Date().toISOString(), reviewer: '本人' },
      status: 'needs_review',
    }
    setCards((current) => [card, ...current])
    setActiveCardId(card.id)
    setView('methods')
  }

  const approveCard = () => activeCard && updateActiveCard({ status: 'approved' })
  const sendBack = () => activeCard && updateActiveCard({ status: 'needs_review' })
  const disableCard = () => activeCard && updateActiveCard({ status: 'disabled' })

  const updateReviewStatus = (id: string, status: AnswerReview['status']) =>
    setAnswerReviews((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))

  const coverage = {
    total: cards.length,
    approved: cards.filter((c) => c.status === 'approved').length,
    pending: cards.filter((c) => c.status === 'needs_review' || c.status === 'draft').length,
    disabled: cards.filter((c) => c.status === 'disabled').length,
  }

  const navItems: { id: TeacherView; label: string; Icon: typeof Sparkles }[] = [
    { id: 'home', label: '训练 AI 分身', Icon: Sparkles },
    { id: 'upload', label: '上传课件 / 题目', Icon: ImageIcon },
    { id: 'methods', label: '我的讲题方法', Icon: Layers },
    { id: 'review', label: '审核 AI 回答', Icon: ClipboardCheck },
    { id: 'records', label: '学生问题记录', Icon: ListChecks },
    { id: 'publish', label: '发布到学生端', Icon: Workflow },
    { id: 'quality', label: '质量设置', Icon: ShieldCheck },
  ]

  return (
    <main className="app-shell teacher-site">
      <aside className="sidebar">
        <div className="brand"><div className="logo-mark"><span className="lambda">λ</span></div><div className="brand-lockup"><strong>老师工作台</strong><span>训练我的 AI 分身</span></div></div>
        <nav className="mode-nav" aria-label="教师端">
          {navItems.map(({ id, label, Icon }) => (
            <button className={view === id ? 'active' : ''} key={id} type="button" onClick={() => setView(id)}>
              <Icon size={16}/> {label}
            </button>
          ))}
        </nav>
        <button className="teacher-link" type="button" onClick={() => setApp('student')}><Eye size={14}/> 查看学生端效果</button>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">老师工作台</p>
            <h1>
              {view === 'home' && '训练我的 AI 分身'}
              {view === 'upload' && '上传课件 / 题目'}
              {view === 'methods' && '我的讲题方法'}
              {view === 'review' && '审核 AI 回答'}
              {view === 'records' && '学生问题记录'}
              {view === 'publish' && '发布到学生端'}
              {view === 'quality' && '质量设置'}
            </h1>
          </div>
          <span className="status-pill">演示数据</span>
        </header>

        {view === 'home' && (
          <section className="teacher-grid">
            <div className="panel hero-panel">
              <p className="eyebrow">三步完成</p>
              <h2>讲一道典型题，AI 帮你整理成可发布的讲题方法</h2>
              <div className="workflow-strip">
                {teacherSteps.map((step) => (
                  <div className="workflow-step" key={step.id}>
                    <strong>{step.title}</strong>
                    <span>{step.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>选择题型</h2>
              <div className="script-buttons">
                {teacherTopics.map((item) => (
                  <button className={topic === item ? 'active' : ''} key={item} type="button" onClick={() => setTopic(item)}>{item}</button>
                ))}
              </div>
              <div className="challenge-card">
                <span>题目卡</span>
                <strong>请像平时上课一样讲：{topic}</strong>
                <p>重点说：第一眼看什么、第一步问学生什么、学生最容易错哪里、什么时候才能列公式。</p>
              </div>
            </div>

            <div className="panel">
              <h2>录音或输入讲稿</h2>
              <textarea className="transcript-editor" value={transcript} onChange={(event) => setTranscript(event.target.value)} />
              <button className="record-button" type="button" onClick={extractCard}><Mic size={16}/> AI 提取我的讲题方法</button>
              <p className="panel-tip">
                <span style={{ color: 'var(--ppath-amber-700)' }}>⚡ 更快的方式：</span>
                <button type="button" className="link-button" onClick={() => setView('upload')}>
                  上传你的课件 / 题目集 →
                </button>
              </p>
            </div>
          </section>
        )}

        {view === 'upload' && (
          <UploadCoursewareView setCards={setCards} setView={setView} />
        )}

        {view === 'methods' && activeCard && (
          <section className="teacher-grid">
            <div className="panel">
              <div className="panel-title">
                <h2>讲题方法列表</h2>
                <span>{cards.length} 条</span>
              </div>
              <div className="method-list">
                {cards.map((card) => (
                  <button className={`method-card ${activeCardId === card.id ? 'active' : ''}`} key={card.id} type="button" onClick={() => setActiveCardId(card.id)}>
                    <div>
                      <strong>{card.topic}</strong>
                      <span className={card.status}>{statusLabel(card.status)}</span>
                    </div>
                    <p>{card.teacherMove}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="panel">
              <div className="panel-title">
                <h2>编辑这条讲题方法</h2>
                <span className={`status-tag ${activeCard.status}`}>{statusLabel(activeCard.status)}</span>
              </div>
              <aside className="method-detail static">
                <label className="edit-field"><span>知识点</span><input value={activeCard.topic} onChange={(e) => updateActiveCard({ topic: e.target.value })} /></label>
                <label className="edit-field"><span>这类题第一眼看</span><textarea value={activeCard.trigger} onChange={(e) => updateActiveCard({ trigger: e.target.value })} /></label>
                <label className="edit-field"><span>我通常先问学生</span><textarea value={activeCard.teacherMove} onChange={(e) => updateActiveCard({ teacherMove: e.target.value })} /></label>
                <label className="edit-field"><span>讲题步骤（用顿号分隔）</span><input value={activeCard.methodSteps.join('、')} onChange={(e) => updateActiveCard({ methodSteps: e.target.value.split('、').map((s) => s.trim()).filter(Boolean) })} /></label>
                <label className="edit-field"><span>学生常见错误</span><textarea value={activeCard.commonError} onChange={(e) => updateActiveCard({ commonError: e.target.value })} /></label>
                <label className="edit-field"><span>我常用的比喻</span><textarea value={activeCard.analogy} onChange={(e) => updateActiveCard({ analogy: e.target.value })} /></label>
                <label className="edit-field"><span>禁止 AI 这样说（用顿号分隔）</span><input value={activeCard.forbiddenPhrases.join('、')} onChange={(e) => updateActiveCard({ forbiddenPhrases: e.target.value.split('、').map((s) => s.trim()).filter(Boolean) })} /></label>
                <div className="review-actions">
                  <button type="button" onClick={approveCard}><CheckCircle2 size={14}/> 像我，发布</button>
                  <button type="button" onClick={sendBack}><PencilLine size={14}/> 需要修改</button>
                  <button type="button" onClick={disableCard}><Flag size={14}/> 不像我，重做</button>
                </div>
              </aside>
            </div>
          </section>
        )}

        {(view === 'review' || view === 'records') && (
          <section className="teacher-grid">
            <div className="panel hero-panel">
              <p className="eyebrow">{view === 'review' ? '需要你的判断' : '最近回答'}</p>
              <h2>{view === 'review' ? '看 AI 最近代表你回答了什么' : '看学生最近问了什么'}</h2>
              <p>每条都能直接处理。通过的会作为正例，要求修改的会回到训练流程，加入反例库的会作为禁止讲法。</p>
            </div>
            <div className="panel full-width">
              <div className="chatlog-list">
                {answerReviews.length === 0 && <div className="empty-tip">还没有学生提问。可以打开学生端发一条试试。</div>}
                {answerReviews.map((item) => (
                  <article className="chatlog-item" key={item.id}>
                    <header>
                      <strong>命中：{item.methodCardTopic}</strong>
                      <span className={`status-tag ${item.status}`}>{reviewStatusLabel(item.status)}</span>
                    </header>
                    <p className="chatlog-question">学生：{item.question}</p>
                    <p className="chatlog-answer">AI 分身：{item.answer}</p>
                    <footer>
                      <em>{item.risk}</em>
                      <div>
                        <button type="button" onClick={() => updateReviewStatus(item.id, 'approved')}><CheckCircle2 size={14}/> 通过</button>
                        <button type="button" onClick={() => updateReviewStatus(item.id, 'needs_fix')}><PencilLine size={14}/> 要求修改</button>
                        <button type="button" onClick={() => updateReviewStatus(item.id, 'rejected_example')}><Flag size={14}/> 加入反例库</button>
                      </div>
                    </footer>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {view === 'publish' && (
          <section className="teacher-grid">
            <div className="panel hero-panel">
              <p className="eyebrow">发布管理</p>
              <h2>已发布的讲题方法才会出现在学生端</h2>
              <div className="coverage-grid">
                <div><strong>{coverage.total}</strong><span>全部讲题方法</span></div>
                <div><strong>{coverage.approved}</strong><span>已发布</span></div>
                <div><strong>{coverage.pending}</strong><span>待审核</span></div>
                <div><strong>{coverage.disabled}</strong><span>已禁用</span></div>
              </div>
            </div>
            <div className="panel full-width">
              <h2>当前已发布</h2>
              <div className="method-list">
                {cards.filter((c) => c.status === 'approved').map((card) => (
                  <article className="method-card" key={card.id}>
                    <div><strong>{card.topic}</strong><span className="status-tag approved">已发布</span></div>
                    <p>{card.teacherMove}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {view === 'quality' && (
          <section className="teacher-grid">
            <div className="panel hero-panel">
              <p className="eyebrow">质量设置</p>
              <h2>这些规则保证 AI 不会替你乱说话</h2>
            </div>
            <div className="trust-grid full-width">
              <div><div className="quality-head"><Eye size={16}/><strong>低置信度题目</strong></div><p>不直接回答，提示学生重新拍题或修改题干。</p></div>
              <div><div className="quality-head"><Sparkles size={16}/><strong>难题模式</strong></div><p>遇到压轴题自动启用深度讲解和分步提示。</p></div>
              <div><div className="quality-head"><Workflow size={16}/><strong>跨学科题目</strong></div><p>提示学生切换老师，不在你的范围内随意作答。</p></div>
              <div><div className="quality-head"><ShieldCheck size={16}/><strong>高风险回答</strong></div><p>命中风险词或低置信路径时，进入老师审核队列。</p></div>
            </div>
          </section>
        )}
      </section>
    </main>
  )
}

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
      <TeacherApp
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
