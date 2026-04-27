import { useEffect, useMemo, useRef, useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import {
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  Eye,
  Flag,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  ListChecks,
  Mail,
  MessageSquareText,
  Mic,
  Pencil,
  PencilLine,
  Send,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from 'lucide-react'
import { createAnswerReview, findMethodCard } from './aiTasks'
import { generateAnswerWithProvider, generateStudySummary, type StudySummaryResult } from './aiProvider'
import {
  ANSWER_REVIEW_STORAGE_KEY,
  METHOD_CARD_STORAGE_KEY,
  seedHighSchoolCards,
  type AnswerReview,
  type MethodCard,
} from './domain'
import seedMethodCards from './seedMethodCards.json'
import { SealRound, SealSquare } from './icons/StampSeal'
import './App.css'
import './App.patch.css'

type AppView = 'welcome' | 'student' | 'teacher'
type StudentView = 'home' | 'newUserHome' | 'capture' | 'confirm' | 'coach' | 'summary' | 'pricing' | 'subjects' | 'teachers' | 'teacherDetail' | 'methodLibrary' | 'methodCardDetail' | 'tutorStory' | 'mistakes'
type TeacherView = 'home' | 'upload' | 'train' | 'methods' | 'review' | 'records' | 'publish' | 'quality'
type Role = 'student' | 'teacher'

type Evaluation = 'correct' | 'partial' | 'wrong' | null
interface Message { id: string; role: Role; content: string; time: string; tags?: string[]; evaluation?: Evaluation }
interface Session { id: string; title: string; messages: Message[] }
interface Subject { name: string; icon: string; status: string }
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
const subjects: Subject[] = [
  { name: '高中物理', icon: 'F', status: '已开通' },
  { name: '高中数学', icon: '∑', status: '内测中' },
  { name: '高中化学', icon: 'H₂', status: '内测中' },
  { name: '高中生物', icon: 'DNA', status: '即将开放' },
  { name: '高中语文', icon: '文', status: '招募老师中' },
  { name: '高中英语', icon: 'EN', status: '招募老师中' },
]

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
const defaultDiagnosis: Diagnosis = { text:'光滑水平面上，小车 A 与小车 B 发生碰撞，碰后粘在一起运动。已知两车质量和碰前速度，求碰后共同速度。', subject:'高中物理', type:'动量守恒 · 碰撞后共同速度', difficulty:'中等', confidence:0.92, imageInfo:'两个物体连接，水平面运动，涉及碰撞前后速度。', stuck:['没有先选研究对象','把某个力直接当成合外力','不知道什么时候列动量守恒方程'] }
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

// ---- 公式渲染：把文本里的 $...$ 片段交给 KaTeX
function renderFormulaSegments(input: string): string {
  if (!input.includes('$')) return escapeHtml(input)
  const parts = input.split(/(\$[^$]+\$)/g)
  return parts
    .map((part) => {
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const tex = part.slice(1, -1)
        try {
          return katex.renderToString(tex, { throwOnError: false, output: 'html' })
        } catch {
          return escapeHtml(part)
        }
      }
      return escapeHtml(part)
    })
    .join('')
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!))
}

function Tex({ children }: { children: string }) {
  return <span className="tex-host" dangerouslySetInnerHTML={{ __html: renderFormulaSegments(children) }} />
}

// ChatReplay 组件已被 Slide 3 内联 chat-card 取代

// ---- Mock 登录 modal（演示用，一点就进）
function LoginModal({ close, onLoginNew, onLoginPaid }: {
  close: () => void
  onLoginNew: () => void
  onLoginPaid: () => void
}) {
  return (
    <div className="login-modal" onClick={close}>
      <div className="login-card" onClick={(e) => e.stopPropagation()}>
        <button className="login-close" type="button" onClick={close} aria-label="关闭">×</button>
        <div className="login-brand">
          <div className="logo-mark"><span className="lambda">λ</span></div>
          <div>
            <div className="login-title">登录 PhysicsPath</div>
            <div className="login-tag">登录后开始你的解题陪练</div>
          </div>
        </div>

        <div className="login-options">
          <button className="login-option wechat" type="button" onClick={onLoginNew}>
            <span className="login-icon">💬</span>
            <div>
              <strong>微信登录</strong>
              <span>新用户首次使用 · 演示</span>
            </div>
          </button>
          <button className="login-option phone" type="button" onClick={onLoginPaid}>
            <span className="login-icon">📱</span>
            <div>
              <strong>手机号登录</strong>
              <span>老用户回访 · 演示已购买身份</span>
            </div>
          </button>
        </div>

        <p className="login-disclaimer">
          演示版本：点任意按钮均可登录，无需输入。<br />
          上线后将接入微信开放平台 OAuth 与短信验证码。
        </p>
      </div>
    </div>
  )
}

// ---- 付费墙 modal（新用户用完免费额度时弹出）
function PaywallModal({ tutor, onSubscribe, onClose }: {
  tutor: Tutor
  onSubscribe: (plan: 'month' | 'year') => void
  onClose: () => void
}) {
  return (
    <div className="login-modal" onClick={onClose}>
      <div className="login-card paywall" onClick={(e) => e.stopPropagation()}>
        <button className="login-close" type="button" onClick={onClose} aria-label="关闭">×</button>
        <div className="paywall-icon">🎯</div>
        <h2>免费体验已用完</h2>
        <p className="paywall-detail">
          你已经走完一遍 {tutor.name} 的解题陪练。
          <br />
          想继续跟 {tutor.name} 练完整套高考物理？
        </p>
        <div className="paywall-options">
          <button className="paywall-option" type="button" onClick={() => onSubscribe('month')}>
            <strong>月卡 ¥{tutor.month}/月</strong>
            <span>灵活订阅、随时取消 · 7 天无理由退款</span>
          </button>
          <button className="paywall-option recommended" type="button" onClick={() => onSubscribe('year')}>
            <span className="rec-tag">省 ¥{tutor.month * 12 - tutor.year}</span>
            <strong>年卡 ¥{tutor.year}/年</strong>
            <span>折合 ¥{Math.round(tutor.year / 12)}/月 · 一年陪练高考全程</span>
          </button>
        </div>
        <button className="paywall-later" type="button" onClick={onClose}>
          稍后再说
        </button>
      </div>
    </div>
  )
}

// ---- 假支付成功 modal（演示用）
function PaymentSuccessModal({ tutor, plan, onDone }: {
  tutor: Tutor
  plan: 'month' | 'year'
  onDone: () => void
}) {
  return (
    <div className="login-modal" onClick={onDone}>
      <div className="login-card pay-success" onClick={(e) => e.stopPropagation()}>
        <div className="pay-icon">✓</div>
        <h2>订阅成功</h2>
        <p className="pay-detail">
          已开通 <strong>{tutor.name} · 分身</strong> {plan === 'month' ? '月卡' : '年卡'}
          <br />
          <span className="pay-amount">¥{plan === 'month' ? tutor.month : tutor.year}</span>
        </p>
        <p className="pay-disclaimer">
          演示模式 — 实际未发生支付。<br />
          上线后将接入微信支付 / 支付宝。
        </p>
        <button className="pay-cta" type="button" onClick={onDone}>
          开始陪练 →
        </button>
      </div>
    </div>
  )
}

// ---- 新用户首页占位（等 Claude Design 出完整设计后替换内容）
// 简笔画头像 — 用于 NewUserHome 的 4 个老师占位 + spotlight 大头像
type PortraitVariant = 'a' | 'b' | 'c' | 'd'
function PortraitAvatar({ variant = 'a', className }: { variant?: PortraitVariant; className?: string }) {
  const variants: Record<PortraitVariant, React.ReactElement> = {
    a: (
      <>
        <rect width="36" height="36" fill="#EFE6D2" />
        <path d="M8 30 Q 8 22 18 22 Q 28 22 28 30 Z" fill="#1F4034" />
        <circle cx="18" cy="14" r="6.5" fill="#E8C39A" stroke="#1F4034" strokeWidth="1.2" />
        <path d="M11.5 9 Q 18 4 24.5 9 L 24.5 12 Q 18 8 11.5 12 Z" fill="#1F4034" />
        <rect x="13.5" y="13" width="3.5" height="3" rx="0.6" stroke="#1F4034" strokeWidth="1" fill="none" />
        <rect x="19" y="13" width="3.5" height="3" rx="0.6" stroke="#1F4034" strokeWidth="1" fill="none" />
        <line x1="17" y1="14.4" x2="19" y2="14.4" stroke="#1F4034" strokeWidth="1" />
        <path d="M16 18.5 Q 18 19.5 20 18.5" stroke="#1F4034" strokeWidth="1" strokeLinecap="round" fill="none" />
      </>
    ),
    b: (
      <>
        <rect width="36" height="36" fill="#E5DDC9" />
        <path d="M7 30 Q 7 22 18 22 Q 29 22 29 30 Z" fill="#2F5749" />
        <circle cx="18" cy="14" r="6.5" fill="#E8C39A" stroke="#1F4034" strokeWidth="1.2" />
        <path d="M11.5 11 Q 13 6 18 6 Q 23 6 24.5 11 Q 22 7.5 18 8 Q 14 7.5 11.5 11 Z" fill="#1F4034" />
        <circle cx="15.2" cy="14.5" r="1.8" stroke="#1F4034" strokeWidth="1" fill="none" />
        <circle cx="20.8" cy="14.5" r="1.8" stroke="#1F4034" strokeWidth="1" fill="none" />
        <line x1="17" y1="14.5" x2="19" y2="14.5" stroke="#1F4034" strokeWidth="1" />
        <path d="M16.5 18.5 Q 18 19 19.5 18.5" stroke="#1F4034" strokeWidth="1" strokeLinecap="round" fill="none" />
      </>
    ),
    c: (
      <>
        <rect width="36" height="36" fill="#F0E2C2" />
        <path d="M7 30 Q 7 22 18 22 Q 29 22 29 30 Z" fill="#1F4034" />
        <circle cx="18" cy="14" r="6.5" fill="#E8C39A" stroke="#1F4034" strokeWidth="1.2" />
        <path d="M11.5 11 Q 12 5.5 18 5.5 Q 24 5.5 24.5 11 L 24 14 Q 23.5 11.5 23 11 Q 18 9 13 11 Q 12.5 11.5 12 14 Z" fill="#1F4034" />
        <circle cx="15.5" cy="14.4" r="0.9" fill="#1F4034" />
        <circle cx="20.5" cy="14.4" r="0.9" fill="#1F4034" />
        <path d="M15 18.5 Q 18 20 21 18.5" stroke="#1F4034" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M14 19.8 Q 14.5 22 18 21.8 Q 21.5 22 22 19.8" stroke="#1F4034" strokeWidth="0.8" fill="none" opacity=".6" />
      </>
    ),
    d: (
      <>
        <rect width="36" height="36" fill="#E8DECA" />
        <path d="M7 30 Q 7 22 18 22 Q 29 22 29 30 Z" fill="#A86B3D" />
        <circle cx="18" cy="14" r="6.5" fill="#E8C39A" stroke="#1F4034" strokeWidth="1.2" />
        <path d="M11 13 Q 10 6 18 5 Q 26 6 25 13 Q 24 9 22 8.5 Q 23 11 22 12 Q 18 9 14 12 Q 13 11 14 8.5 Q 12 9 11 13 Z" fill="#1F4034" />
        <circle cx="15.2" cy="14.6" r="1" fill="#1F4034" />
        <circle cx="20.8" cy="14.6" r="1" fill="#1F4034" />
        <path d="M16 18.5 Q 18 19.6 20 18.5" stroke="#A1342E" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <circle cx="11" cy="17" r="1.4" fill="#1F4034" opacity=".25" />
        <circle cx="25" cy="17" r="1.4" fill="#1F4034" opacity=".25" />
      </>
    ),
  }
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" preserveAspectRatio="xMidYMid slice">
      {variants[variant]}
    </svg>
  )
}

function NewUserHome({ tutor, onTryFree, onBrowseTutors, onViewStory, onSubscribe }: {
  tutor: Tutor
  onTryFree: () => void
  onBrowseTutors: () => void
  onViewStory: () => void
  onSubscribe: () => void
}) {
  const userName = '小宇'
  const monthlyEquiv = Math.round(tutor.year / 12)
  const savings = tutor.month * 12 - tutor.year

  return (
    <div className="new-user-home">
      <header className="nuh-greet">
        <div>
          <h1>欢迎，<span className="name">{userName}</span></h1>
          <p>从一道你不会的题开始 —— 我们带你看名师怎么想题。</p>
        </div>
        <div className="badge">还没订阅任何老师</div>
      </header>

      {/* 双 CTA */}
      <div className="new-user-cta-grid">
        <button type="button" className="new-user-cta primary" onClick={onTryFree}>
          <div>
            <span className="lead-tag">3 分钟体验</span>
            <h2>拍一道不会的题<br />看看名师独家思路</h2>
            <p>不用注册老师、不用充值。先和 AI 名师走一遍解题思路，看你是不是适合这种节奏。</p>
          </div>
          <div>
            <span className="arrow">立即开始 <ArrowRight size={14} /></span>
          </div>
        </button>

        <button type="button" className="new-user-cta secondary" onClick={onBrowseTutors}>
          <div>
            <h2>先看看有哪些名师分身</h2>
            <p>4 位金牌名师分身正在内测。你可以先看他们的故事和试讲样片，再决定要不要试一道题。</p>
          </div>
          <div>
            <div className="stack">
              <span className="av"><PortraitAvatar variant="a" /></span>
              <span className="av"><PortraitAvatar variant="b" /></span>
              <span className="av"><PortraitAvatar variant="c" /></span>
              <span className="av"><PortraitAvatar variant="d" /></span>
              <span className="num">已上线 4 位 · 持续增加中</span>
            </div>
            <span className="arrow" style={{ marginTop: 14 }}>浏览名师档案 <ArrowRight size={14} /></span>
          </div>
        </button>
      </div>

      {/* 推荐老师 spotlight */}
      <section className="new-user-spotlight">
        <span className="section-eyebrow">本月推荐 · TEACHER OF THE MONTH</span>
        <h2 className="section-title">{tutor.name}分身</h2>
        <p className="section-sub">{tutor.schoolTag} · {tutor.specialties.slice(0, 2).join(' / ')} · 累计带过 200+ 学生</p>

        <div className="spotlight-card">
          <div className="av-large">
            <PortraitAvatar variant="a" className="portrait" />
            <span className="av-tag">在线陪练</span>
          </div>
          <div>
            <div className="meta-line">
              <span>北京 · 重点中学</span><span className="dot" />
              <span>2008–至今</span><span className="dot" />
              <span>专长：力学 · 电磁学</span>
            </div>
            <h3>不是搜答案，是把你脑子里的雾拨开。</h3>
            <blockquote className="quote">
              "我从不直接给你答案。物理题的解法只是一个壳，关键是壳里的那个想法 —— 你只要看见那个想法一次，你就再也不会忘。"
            </blockquote>
            <div className="row">
              <button className="btn primary" type="button" onClick={onViewStory}>
                看老师故事 <ArrowRight size={14} />
              </button>
              <button className="btn ghost" type="button" onClick={onTryFree}>
                ▶ 试讲样片 · 3 分钟
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 信任三要素 */}
      <section className="new-user-trust">
        <div className="trust-item">
          <div className="num">01 · 退款</div>
          <h4>7 天无理由退款</h4>
          <p>第一次订阅后 7 天内不满意，原路退回。不需要解释、不需要客服磨。</p>
        </div>
        <div className="trust-item">
          <div className="num">02 · 名师</div>
          <h4>每位老师都经过审核</h4>
          <p>名师本人参与训练 AI 分身、亲自审稿。不是自动抓取的题库或网课内容。</p>
        </div>
        <div className="trust-item">
          <div className="num">03 · 边界</div>
          <h4>AI 不会直接给答案</h4>
          <p>我们做的是教练，不是搜题工具。AI 引导你想，不替你想。这是产品底线。</p>
        </div>
      </section>

      {/* 透明价格 */}
      <section className="new-user-pricing">
        <header className="pricing-head">
          <div className="left">
            <h3>价格清单</h3>
            <p>不分等级、不限题数、不阶梯涨价。一个价钱，所有名师。</p>
          </div>
          <div className="refund">退款保证 · <b>7 天</b></div>
        </header>
        <div className="pricing-grid">
          <button type="button" className="price-card" onClick={onSubscribe}>
            <div className="label">月付</div>
            <div className="num">
              <span className="y">¥</span>
              <span className="v">{tutor.month}</span>
              <span className="unit">/ 月</span>
            </div>
            <div className="save">灵活订阅、随时取消</div>
            <p className="footnote">第一次订阅享 7 天无理由退款。</p>
          </button>
          <button type="button" className="price-card recommended" onClick={onSubscribe}>
            <div className="label">年付</div>
            <div className="num">
              <span className="y">¥</span>
              <span className="v">{tutor.year}</span>
              <span className="unit">/ 年</span>
            </div>
            <div className="save">折合每月 ¥{monthlyEquiv} · 省 ¥{savings}</div>
            <p className="footnote">第一次订阅享 7 天无理由退款 · 一年陪练高考全程。</p>
          </button>
        </div>
      </section>

      {/* Why us */}
      <section className="new-user-why-us">
        <span className="section-eyebrow">为什么选我们</span>
        <h2 className="section-title">和搜题 App、网课的区别</h2>
        <div className="why-grid">
          <div className="why-item">
            <h4>搜题 App</h4>
            <div className="compare">
              <div className="col them"><span className="tag">Them</span>拍照 → 答案</div>
              <div className="col us"><span className="tag">Us</span>拍照 → 一起想</div>
            </div>
          </div>
          <div className="why-item">
            <h4>录播网课</h4>
            <div className="compare">
              <div className="col them"><span className="tag">Them</span>老师讲、你听</div>
              <div className="col us"><span className="tag">Us</span>老师问、你答</div>
            </div>
          </div>
          <div className="why-item">
            <h4>普通 AI 助手</h4>
            <div className="compare">
              <div className="col them"><span className="tag">Them</span>通用模型 · 给步骤</div>
              <div className="col us"><span className="tag">Us</span>名师方法 · 给思路</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="new-user-footer">
        <div>© 2026 PhysicsPath · 北京</div>
        <div className="links">
          <a href="#">用户协议</a>
          <a href="#">隐私条款</a>
          <a href="#">退款政策</a>
          <a href="#">联系我们</a>
        </div>
      </footer>
    </div>
  )
}

const slideLabels = ['Hero · 1/4', '方法卡片 · 2/4', '试讲样片 · 3/4', '价格 · 4/4']

function Welcome({ go, openStory, openLibrary, openLogin }: { go: (v: AppView) => void; openStory: () => void; openLibrary: () => void; openLogin: () => void }) {
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const [firstVisit, setFirstVisit] = useState<boolean>(() => {
    try { return !sessionStorage.getItem('carouselNudged') } catch { return false }
  })
  const totalSlides = 4

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % totalSlides)
    }, 10000)
    return () => window.clearInterval(id)
  }, [paused])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: slide * track.clientWidth, behavior: 'smooth' })
  }, [slide])

  const goPrev = () => setSlide((s) => (s - 1 + totalSlides) % totalSlides)
  const goNext = () => setSlide((s) => (s + 1) % totalSlides)

  const handleNudgeEnd = () => {
    setFirstVisit(false)
    try { sessionStorage.setItem('carouselNudged', '1') } catch { /* noop */ }
  }

  return (
    <main className="welcome-page carousel-mode">
      <header className="welcome-nav">
        <div className="brand">
          <div className="logo-mark"><span className="lambda">λ</span></div>
          <div className="brand-lockup">
            <span className="name">PhysicsPath</span>
            <span className="tag">名师 AI 解题陪练</span>
          </div>
        </div>
        <nav className="welcome-nav-links">
          <button type="button" onClick={openStory}>名师档案</button>
          <button type="button" onClick={openLibrary}>方法卡库</button>
          <button type="button" className="primary" onClick={openLogin}>立即试用</button>
        </nav>
      </header>

      <div
        className="welcome-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button className="carousel-arrow prev" type="button" onClick={goPrev} aria-label="上一屏">‹</button>
        <button className="carousel-arrow next" type="button" onClick={goNext} aria-label="下一屏">›</button>

        <div
          className={`carousel-track ${firstVisit ? 'first-visit' : ''}`}
          ref={trackRef}
          onAnimationEnd={firstVisit ? handleNudgeEnd : undefined}
        >

      <section className="carousel-slide welcome-hero">
        <div className="hero-inner">
          <div className="hero-text">
            <span className="pill">名师 AI · 解题教练</span>
            <h1>金牌名校名师<br /><span className="ai-accent">AI</span> 分身陪练</h1>
            <p className="lead">名师授权独家解题方法，把全国名师轻松请进家。</p>
            <div className="hero-ctas">
              <button className="btn-primary" onClick={openLogin}>
                <CheckCircle2 size={14} /> 立即试一道高考真题
              </button>
              <button className="btn-ghost" onClick={() => go('teacher')}>
                <GraduationCap size={14} /> 我是老师
              </button>
            </div>
            <p className="footnote">无需注册即可试用 · 演示版可在设置中切换学生端 / 教师端</p>
          </div>

          <div className="trace-card">
            <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
              {/* 坐标轴 */}
              <line x1="30" y1="190" x2="300" y2="190" stroke="var(--ppath-fg-3)" strokeWidth="1.4" />
              <line x1="30" y1="190" x2="30" y2="20" stroke="var(--ppath-fg-3)" strokeWidth="1.4" />
              <path d="M300 190 l-6 -3 l0 6 z" fill="var(--ppath-fg-3)" />
              <path d="M30 20 l-3 6 l6 0 z" fill="var(--ppath-fg-3)" />
              <text x="304" y="194" fontSize="10" fill="var(--ppath-fg-3)">x</text>
              <text x="22" y="18" fontSize="10" fill="var(--ppath-fg-3)">y</text>

              {/* 网格 */}
              <g stroke="var(--ppath-line-soft)" strokeWidth="0.6" strokeDasharray="2 3">
                <line x1="80" y1="190" x2="80" y2="20" />
                <line x1="130" y1="190" x2="130" y2="20" />
                <line x1="180" y1="190" x2="180" y2="20" />
                <line x1="230" y1="190" x2="230" y2="20" />
                <line x1="30" y1="140" x2="300" y2="140" />
                <line x1="30" y1="90" x2="300" y2="90" />
                <line x1="30" y1="50" x2="300" y2="50" />
              </g>

              {/* 抛物线轨迹（流动虚线） */}
              <path
                className="traj"
                d="M 30 190 Q 138 -10 280 180"
                fill="none"
                stroke="var(--ppath-ink-green-800)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* 起点 / 终点 */}
              <circle cx="30" cy="190" r="4.5" fill="var(--ppath-ink-green-800)" />
              <circle cx="280" cy="180" r="4.5" fill="none" stroke="var(--ppath-ink-green-800)" strokeWidth="1.6" />

              {/* 沿轨迹运动的小球 */}
              <g className="ball-anim">
                <circle cx="30" cy="190" r="6.5" fill="var(--ppath-ink-green-800)" />
              </g>

              {/* 速度 v 矢量 */}
              <g className="v-vec" transform="translate(138 62)">
                <line x1="8" y1="0" x2="42" y2="0" stroke="var(--ppath-ink-green-800)" strokeWidth="2" strokeLinecap="round" />
                <path d="M42 0 l-5 -3 l0 6 z" fill="var(--ppath-ink-green-800)" />
                <text x="22" y="-5" fontSize="11" fill="var(--ppath-ink-green-800)" fontStyle="italic" fontFamily="Georgia, serif" fontWeight="700">v</text>
              </g>
              {/* 重力 g */}
              <g className="g-vec" transform="translate(138 62)">
                <line x1="0" y1="8" x2="0" y2="38" stroke="var(--ppath-amber-700)" strokeWidth="2" strokeLinecap="round" />
                <path d="M0 38 l-3 -5 l6 0 z" fill="var(--ppath-amber-700)" />
                <text x="4" y="30" fontSize="11" fill="var(--ppath-amber-700)" fontStyle="italic" fontFamily="Georgia, serif" fontWeight="700">g</text>
              </g>

              {/* 公式 */}
              <text x="160" y="32" fontFamily="'Noto Serif SC', serif" fontSize="14" fill="var(--ppath-fg-1)" fontStyle="italic">
                y = v₀t − ½gt²
              </text>
            </svg>
            <div className="meta-row">
              <span><span className="dot"></span>抛体运动 · 实时演示</span>
              <span className="meta-formula">θ = 60° · v₀ = 12 m/s</span>
            </div>
          </div>
        </div>
      </section>

      <section className="carousel-slide slide-2 slide-stack">
        <span className="stack-eyebrow">名师方法</span>
        <h2 className="stack-title">X 老师 32 年教龄沉淀的<br />解题路径，写进 AI</h2>
        <p className="stack-sub">
          每一类高考题型都有一张「方法卡」——AI 不是凭空回答，是按老师亲自审过的路径走。
        </p>
        <div className="method-grid">
          <div className="method-card">
            <span className="tag">力学</span>
            <h4>斜面问题 3 秒识别法</h4>
            <p>看到光滑斜面 + 物块就触发：分解重力 <em>mg sinθ</em> 与 <em>mg cosθ</em>，再列方程。</p>
          </div>
          <div className="method-card">
            <span className="tag">电磁</span>
            <h4>带电粒子磁场圆周·半径速算</h4>
            <p>不背公式。先判定洛伦兹力提供向心力，半径 <em>r = mv/(qB)</em> 自然出来。</p>
          </div>
          <div className="method-card">
            <span className="tag">动量</span>
            <h4>碰撞题先验三件事</h4>
            <p>圈系统 → 看外力冲量是否可忽略 → 规定正方向。条件成立才列守恒方程。</p>
          </div>
        </div>
        <div className="method-foot">
          <button type="button" className="method-foot-link" onClick={openLibrary}>查看完整方法卡库 →</button>
        </div>
      </section>

      <section className="carousel-slide slide-3 slide-stack">
        <span className="stack-eyebrow">真实样片</span>
        <h2 className="stack-title">多年教学<br />独家方法</h2>
        <p className="stack-sub">点开听 30 秒——你会看到 AI 是怎么「按老师方法引导」，而不是直接吐答案的。</p>
        <div className="chat-card">
          <div className="chat-head">
            <span className="lbl">试讲片段 · 30 秒</span>
            <span className="replay">▶ 重播</span>
          </div>
          <div className="chat-row you"><div className="bubble u">老师，光滑斜面上的物块沿斜面下滑，加速度怎么算？</div></div>
          <div className="chat-row"><div className="av">师</div><div className="bubble t">别急。先做一件事：把重力沿斜面方向和垂直方向分解。沿斜面方向你写出来是什么？</div></div>
          <div className="chat-row you"><div className="bubble u"><em>mg sinθ</em>？</div></div>
          <div className="chat-row"><div className="av">师</div><div className="bubble t">对。光滑斜面没有摩擦，沿斜面方向的合力就是 <em>mg sinθ</em>。牛顿第二定律一列就出来：<em>a = g sinθ</em>。</div></div>
          <div className="chat-row"><div className="av">师</div><div className="bubble t">记住这条路径——分解、列方程、解。下次见到斜面题，先想这三步，不要先翻公式。</div></div>
        </div>
      </section>

      <section className="carousel-slide slide-4">
        <div className="feat-row">
          <div className="feat-cell">
            <svg className="ic" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M9 1.5l6 2.5v4.5c0 4-3 6.5-6 7.5-3-1-6-3.5-6-7.5V4l6-2.5z" />
            </svg>
            <h5>不直接给答案</h5>
            <p>AI 按老师方法一步步引导，避免抄袭。</p>
          </div>
          <div className="feat-cell">
            <svg className="ic" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="2" width="12" height="14" rx="1.5" />
              <path d="M6 6h6M6 9h6M6 12h4" />
            </svg>
            <h5>方法卡老师亲审</h5>
            <p>每条讲题方法都要本人确认才会上线。</p>
          </div>
          <div className="feat-cell">
            <svg className="ic" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="2" y="4" width="14" height="10" rx="1.5" />
              <path d="M2 5l7 5 7-5" />
            </svg>
            <h5>每周给家长摘要</h5>
            <p>哪些卡点在退步、哪些在进步，一目了然。</p>
          </div>
          <div className="feat-cell">
            <svg className="ic" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="6" cy="6" r="2.4" />
              <circle cx="13" cy="7" r="1.8" />
              <path d="M2 15c0-2.5 2-4 4-4s4 1.5 4 4M10 15c0-2 1.5-3 3-3s3 1 3 3" />
            </svg>
            <h5>真实老师参与</h5>
            <p>不是凭空捏造的 AI，背后有名师收益分成。</p>
          </div>
        </div>
        <div className="price-pill">
          <div className="num">¥299/月 · ¥2390/年（折合 ¥199/月）</div>
          <div className="sub">7 天无理由退款 · 家长账户支付</div>
          <button className="cta" type="button" onClick={openLogin}>立即试用 →</button>
        </div>
      </section>

        </div>

        <div className="carousel-dots" role="tablist">
          {slideLabels.map((label, i) => (
            <button
              key={i}
              type="button"
              className={i === slide ? 'active' : ''}
              onClick={() => setSlide(i)}
              aria-label={label}
              role="tab"
              aria-selected={i === slide}
            >{label}</button>
          ))}
        </div>
      </div>

      <footer className="welcome-foot">© PhysicsPath · 演示版本，仅供试用 · 学习辅助工具，不替代学校教学</footer>
    </main>
  )
}

// ---- 方法卡库（公开页，可被搜索引擎收录）
function MethodLibrary({ cards, openCard, back }: { cards: MethodCard[]; openCard: (id: string) => void; back: () => void }) {
  const grouped = useMemo(() => {
    const buckets = new Map<string, MethodCard[]>()
    cards.filter((c) => c.status === 'approved').forEach((card) => {
      const seedTopic = importedSeedMethodCards.find((s) => s.id === card.id)?.topic ?? '其他'
      const list = buckets.get(seedTopic) ?? []
      list.push(card)
      buckets.set(seedTopic, list)
    })
    return Array.from(buckets.entries())
  }, [cards])
  return (
    <main className="method-library">
      <header className="library-nav">
        <button className="back-link" onClick={back}>← 返回</button>
        <img className="brand-logo-horizontal" src="/logo-horizontal.svg" alt="PhysicsPath" />
      </header>
      <section className="library-hero">
        <p className="eyebrow">方法卡库</p>
        <h1>高考物理 · X 老师方法卡</h1>
        <p className="page-sub">每张卡都是一类题型的解题路径——按高考考纲分类，由X 老师老师亲自审核。</p>
      </section>
      {grouped.map(([topic, list]) => (
        <section className="library-group" key={topic}>
          <h2>{topic}<small>（{list.length} 张）</small></h2>
          <div className="library-grid">
            {list.map((card) => (
              <button className="library-item" key={card.id} type="button" onClick={() => openCard(card.id)}>
                <strong>{card.topic}</strong>
                <p>{card.teacherMove}</p>
                <span className="library-cta">查看方法 →</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}

function MethodCardDetail({ card, back, tryIt }: { card: MethodCard; back: () => void; tryIt: () => void }) {
  return (
    <main className="method-detail-page">
      <header className="library-nav">
        <button className="back-link" onClick={back}>← 返回方法卡库</button>
      </header>
      <article className="method-detail-article">
        <p className="eyebrow">{card.subject} · 方法卡</p>
        <h1>{card.topic}</h1>
        <p className="lead"><Tex>{card.teacherMove}</Tex></p>

        <section>
          <h3>什么时候用这张卡</h3>
          <p><Tex>{card.trigger}</Tex></p>
        </section>

        <section>
          <h3>解题路径（{card.methodSteps.length} 步）</h3>
          <ol className="method-step-list">
            {card.methodSteps.map((s, i) => (
              <li key={i}><Tex>{s}</Tex></li>
            ))}
          </ol>
        </section>

        <section>
          <h3>常见错误</h3>
          <p><Tex>{card.commonError}</Tex></p>
        </section>

        <section>
          <h3>例题</h3>
          <p><Tex>{card.sampleQuestion}</Tex></p>
        </section>

        <div className="method-detail-cta">
          <button onClick={tryIt}>用这张卡试一道题 →</button>
        </div>
      </article>
    </main>
  )
}

// ---- X 老师老师真人故事页（虚构 demo 用，可作为后续找真老师谈合作的样板）
function TutorStory({ tutor, back, buy }: { tutor: Tutor; back: () => void; buy: () => void }) {
  return (
    <main className="tutor-story">
      <header className="library-nav">
        <button className="back-link" onClick={back}>← 返回</button>
      </header>
      <article className="tutor-story-article">
        <div className="story-hero">
          <img className="tutor-portrait xlarge" src={tutor.avatar} alt={tutor.name} />
          <div>
            <p className="eyebrow">名师档案</p>
            <h1>{tutor.name}</h1>
            <p className="story-tag">{tutor.schoolTag}</p>
            <div className="story-meta">
              <span><GraduationCap size={14} /> 北京师范大学物理学院硕士</span>
              <span><Clock size={14} /> 教龄 12 年 · 2023 年从机构出来单干</span>
              <span><UsersRound size={14} /> 累计带过 200+ 名高中学生</span>
            </div>
          </div>
        </div>

        <section>
          <h2>从机构金牌到独立教师</h2>
          <p>北京师范大学物理学院硕士毕业后，我加入了XXX 机构，专门带高考物理一对一。在机构的 9 年里，我连续 5 年拿到金牌教师评级，所带学生续费率长期在分校第一梯队。</p>
          <p>2023 年我决定从机构出来单干。原因很简单——机构定价 ¥600-800/小时，但能跟我的学生 90% 是一线城市中产家庭。我想找一个方式，能让更多家庭付得起、又不掉教学质量。</p>
          <p>所以当 PhysicsPath 团队找到我，说要把我的解题方法做成 AI 分身的时候，我同意了。条件只有一个：每一条 AI 给出去的答案，都得是我审过的路径，不能让 AI 替我"自由发挥"。</p>
        </section>

        <section>
          <h2>我的教学方法</h2>
          <p><strong>第一原则：物理题先看明白，再列公式。</strong>我带学生最常说的一句话是"对象、过程、条件"——研究对象是谁？经历了什么过程？哪些条件成立？这三件事看清楚，公式自然就出来了。背模板的学生在简单题上能拿分，但一遇到压轴题就卡住，因为压轴题考的不是公式，是看题的能力。</p>
          <p><strong>第二原则：解题路径比答案重要。</strong>我从不直接讲答案。我会问："这道题第一步该判断什么？""为什么选这个对象？""这个条件能不能用守恒？"——把问题反过来抛给学生，让他自己走完路径。一道题做对了不算会，能讲出"我为什么这样想"才算会。</p>
          <p><strong>第三原则：错题比对题宝贵。</strong>我所有学生都有错题本，但不是抄题——是抄"我当时是怎么想错的"。每周我会挑 3 道全班错得最多的题，让学生轮流上来讲自己当时的思路。讲错的过程比讲对的过程更能暴露问题。</p>
        </section>

        <section>
          <h2>带过的学生</h2>
          <ul className="story-students">
            <li><strong>王同学（2022 届）</strong>：高一物理 62 分，跟我两年后高考 96 分，现就读清华大学工程物理系。她最大的进步不是分数，是从"看到题就翻笔记找公式"变成"看到题先问自己研究对象是谁"。</li>
            <li><strong>李同学（2023 届）</strong>：电磁感应一直是弱项，压轴题全靠蒙。我带他用了一学期"先判磁通量变化、再判方向、最后算电动势"的三步法，高考压轴题拿满分。</li>
            <li><strong>张同学（2024 届）</strong>：基础不差但综合题丢步骤分严重。我让他每道题都先画"研究对象 + 过程图"，再列方程。高考物理 92 分，现就读上海交通大学。</li>
          </ul>
        </section>

        <section>
          <h2>为什么愿意做 AI 分身</h2>
          <p>退休之后，每天能教的学生从 60 个变成 0 个。但中国还有几百万高三学生，他们大多数请不起一对一名师辅导。如果 AI 能把我的方法复制给更多孩子——前提是不走样、不胡说——这件事我愿意做。</p>
          <p>所以 PhysicsPath 上每一条 AI 回答都标注由我审核，可追溯。未审核的答题不会发到学生面前。这是我对家长和学生的承诺。</p>
        </section>

        <div className="story-cta">
          <button onClick={buy}>跟X 老师练物理 →</button>
          <span>¥299/月 · 7 天无理由退款</span>
        </div>
      </article>
    </main>
  )
}
function Settings({ close, setStudent, resetDemo, switchToNew, switchToPaid, logout }: {
  close: () => void
  setStudent: (v: StudentView) => void
  resetDemo: () => void
  switchToNew: () => void
  switchToPaid: () => void
  logout: () => void
}) {
  return (
    <div className="settings-modal" onClick={close}>
      <div className="settings-card" onClick={(e) => e.stopPropagation()}>
        <header><strong>设置</strong><button className="close" onClick={close}>关闭</button></header>
        <button onClick={() => { close(); setStudent('teachers') }}><GraduationCap size={14} /> 切换老师</button>
        <div className="settings-section-title">演示模式</div>
        <button onClick={() => { close(); switchToNew() }}><Eye size={14} /> 切换为新用户演示</button>
        <button onClick={() => { close(); switchToPaid() }}><Eye size={14} /> 切换为老用户演示</button>
        <button onClick={() => { close(); resetDemo() }}><Flag size={14} /> 重置演示数据</button>
        <button className="danger" onClick={() => { close(); logout() }}><Flag size={14} /> 退出登录</button>
      </div>
    </div>
  )
}
// 28 天滚动 streak 数据 — mock：连续 9 天，第 12-22 天断了一段
const streakActivity: boolean[] = (() => {
  const arr: boolean[] = []
  for (let i = 0; i < 28; i++) {
    if (i >= 19) arr.push(true)         // 最近 9 天连续
    else if (i >= 11 && i <= 18) arr.push(false)  // 中间断了 8 天
    else arr.push(Math.random() > 0.3)   // 28 天前那段散落练习
  }
  return arr
})()

interface RecentItem { topic: string; subject: '力学' | '电学' | '光学'; when: string; result: 'done' | 'stuck' }
const recentMock: RecentItem[] = [
  { topic: '动量守恒 · 两小球碰撞', subject: '力学', when: '8 分钟前', result: 'done' },
  { topic: '恒定电流 · 闭合电路欧姆定律', subject: '电学', when: '昨天 21:14', result: 'stuck' },
  { topic: '几何光学 · 凸透镜成像', subject: '光学', when: '前天 19:30', result: 'done' },
]

// ---- 错题本数据结构（P4 + P7）
type MistakeStatus = 'open' | 'reviewing' | 'mastered'
type SubjectArea = '力学' | '运动学' | '能量' | '电磁学' | '热学' | '光学' | '原子' | '振动'

interface MistakeRecord {
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

const MISTAKES_STORAGE_KEY = 'physicspath:mistakes'

const seedMistakes: MistakeRecord[] = [
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
    cardId: 'mc-电磁-感应电动势-01',
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
    cardId: 'mc-光学-凸透镜成像-01',
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
    cardId: 'mc-原子-散射-01',
    difficulty: '难',
    stuckAtStep: 1,
    totalSteps: 3,
    subjectArea: '原子',
    status: 'open',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    attemptCount: 1,
  },
]

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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return new Date(iso).toLocaleDateString('zh-CN')
}

function StudentHome({ tutor, setView, onStartNew }: { tutor: Tutor; setView: (v: StudentView) => void; onStartNew: () => void }) {
  return (
    <section className="student-home">
      <header className="page-head">
        <p className="eyebrow">小明 · 高二物理</p>
        <h1 className="home-h1">当前 AI 教师：<span className="home-subject">高考物理</span> <span className="accent-name">{tutor.name}</span></h1>
      </header>

      <div className="dashboard-grid">
        <div className="dashboard-card" data-tone="primary">
          <p className="label">本周{tutor.name}陪你练了</p>
          <p className="stat">12<small>道题</small></p>
          <p className="desc">其中 3 道你独立想出了思路</p>
          <button className="cta-light" onClick={onStartNew}>
            <Camera size={14} /> 拍下一道题
          </button>
        </div>
        <div className="dashboard-card">
          <p className="label">连续学习</p>
          <p className="stat">9<small>天</small></p>
          <p className="desc">距离上次断了已经 11 天</p>
        </div>
      </div>

      <div className="streak-block">
        <div className="streak-head">
          <h2>最近 28 天</h2>
          <span className="hint">黄色边框为今天</span>
        </div>
        <div className="streak-weekdays" aria-hidden="true">
          {['一','二','三','四','五','六','日'].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="streak-grid">
          {streakActivity.map((active, i) => {
            const today = new Date()
            const cellDate = new Date(today)
            cellDate.setDate(today.getDate() - (streakActivity.length - 1 - i))
            const dayNum = cellDate.getDate()
            const isToday = i === streakActivity.length - 1
            return (
              <span
                key={i}
                className="streak-cell"
                data-active={String(active)}
                data-today={isToday ? 'true' : undefined}
                title={`${cellDate.getMonth() + 1}/${dayNum}${active ? ' · 有练习' : ' · 没练'}`}
              >
                {dayNum}
              </span>
            )
          })}
        </div>
      </div>

      <div className="recent-list">
        <h2>最近练过</h2>
        {recentMock.map((item) => (
          <button
            key={item.topic}
            className="recent-card"
            data-subject={item.subject}
            data-result={item.result === 'stuck' ? 'stuck' : undefined}
            onClick={() => setView('summary')}
            type="button"
          >
            <div>
              <p className="topic">{item.topic}</p>
              <p className="when">{item.when}</p>
            </div>
            <span className="result">{item.result === 'done' ? '独立完成' : '卡了 2 步'}</span>
          </button>
        ))}
      </div>

      <div className="subject-strip">
        <p className="eyebrow">切换其他科目</p>
        <div className="mini-subjects">
          {subjects.map((s) => {
            const open = s.status === '已开通'
            return (
              <button
                key={s.name}
                onClick={() => open && setView('subjects')}
                className={open ? 'active' : 'locked'}
                disabled={!open}
              >
                <span className="mini-icon">{s.icon}</span>
                <strong>{s.name}</strong>
                <small>{s.status}</small>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
function SubjectSelect({selected,setSelected,setView}:{selected:string;setSelected:(s:string)=>void;setView:(v:StudentView)=>void}){return <section className="selection-page"><p className="eyebrow">选择科目</p><h1>今天想练哪一科？</h1><div className="subject-grid">{subjects.map(s=><button className={selected===s.name?'active':''} key={s.name} onClick={()=>{setSelected(s.name);setView('teachers')}}><span className="subject-icon">{s.icon}</span><strong>{s.name}</strong><span>{s.status}</span></button>)}</div></section>}
function TeacherList({ list, setPreview, setView }: { list: Tutor[]; setPreview: (t: Tutor) => void; setView: (v: StudentView) => void }) {
  const rail = (title: string, arr: Tutor[], hint?: string) => (
    <div className="teacher-rail">
      <div className="rail-head">
        <h2>{title}</h2>
        {hint && <span className="rail-hint">{hint}</span>}
      </div>
      <div className="teacher-grid-cards">
        {arr.length === 0 && <div className="empty-tip">暂无 — 看看其他老师</div>}
        {arr.map((t) => (
          <button
            className={`teacher-card ${t.purchased ? 'purchased' : ''}`}
            data-status={!t.available ? 'beta' : undefined}
            key={t.id}
            onClick={() => { if (!t.available) return; setPreview(t); setView('teacherDetail') }}
            disabled={!t.available}
            title={`${t.schoolTag} · ${t.years} · ${t.result}`}
          >
            <span className="clone-badge">
              <span className="seal"><SealSquare size={16} rotate={2} /></span>
              <span className="v">v1.0</span>
              <span className="dot" />
              <span className={`signed ${!t.available ? 'signed--beta' : ''}`}>
                {t.available ? '已签约' : '内测中'}
              </span>
            </span>
            <div className="portrait">
              <img src={t.avatar} alt={`${t.name} 头像`} />
            </div>
            <div className="tc-head">
              <p className="name">{t.name}</p>
              <p className="subline">{t.title}</p>
              {t.purchased && <span className="status-pill">已购买</span>}
            </div>
            <div className="meta">
              <span>★ {t.rating}</span>
              <span>{t.years}</span>
              {t.specialties.slice(0, 2).map((x) => <span key={x}>{x}</span>)}
            </div>
            <div className="tc-foot">
              <strong>¥{t.month}</strong>
              <em>/月 · ¥{t.year}/年</em>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
  const purchased = list.filter((t) => t.purchased)
  const available = list.filter((t) => !t.purchased && t.available)
  const upcoming = list.filter((t) => !t.available)
  return (
    <section className="selection-page">
      <p className="eyebrow">名师档案</p>
      <h1>选择名师分身</h1>
      <p className="page-sub">每位老师都经过签约 + 实名认证，AI 答题逻辑由老师亲自审核发布。</p>
      {rail('已购买', purchased)}
      {rail('可订阅', available, '点开看老师详情和试看样例')}
      {rail('即将开放', upcoming, '老师审核中，5 月起逐步上线')}
    </section>
  )
}
function TutorDetail({ tutor, buy, enter, back }: { tutor: Tutor; buy: () => void; enter: () => void; back: () => void }) {
  const monthlyEquiv = Math.round(tutor.year / 12)
  return (
    <section className="selection-page tutor-detail">
      <button className="back-link" onClick={back}>← 返回老师列表</button>

      <div className="tutor-detail-card">
        <img className="tutor-portrait large" src={tutor.avatar} alt={`${tutor.name} 头像`} />
        <div>
          <p className="eyebrow">{tutor.subject}</p>
          <h1>{tutor.name}</h1>
          <p className="tutor-subline">{tutor.title}</p>
          <div className="tutor-meta">
            <span><ShieldCheck size={12} /> {tutor.schoolTag}</span>
            <span>★ 评分 {tutor.rating}</span>
            <span><GraduationCap size={12} /> {tutor.students} 名学生在用</span>
          </div>
          <p className="tutor-bio">{tutor.bio}</p>

          <div className="tutor-price-row">
            <strong>¥{tutor.month}<small>/月起</small></strong>
            <span>年卡 ¥{tutor.year}（折合 ¥{monthlyEquiv}/月，省 ¥{tutor.month * 12 - tutor.year}）</span>
          </div>
          <div className="tutor-actions">
            {tutor.purchased ? (
              <button onClick={enter}><MessageSquareText size={14} /> 进入对话</button>
            ) : tutor.available ? (
              <>
                <button onClick={buy}><Eye size={14} /> 开始 7 天免费试看</button>
                <button className="ghost">查看完整套餐</button>
              </>
            ) : (
              <button disabled className="ghost">内测中，敬请期待</button>
            )}
          </div>
        </div>
      </div>

      <div className="sample-box">
        <p className="eyebrow">试看样例</p>
        <strong>同样一道题，{tutor.name} 是这么讲的</strong>
        <div className="sample-chat">
          <div className="msg student">学生：动量守恒什么时候能用？</div>
          <div className="msg teacher">
            <img src={tutor.avatar} alt="" />
            <div>
              <em>{tutor.name}</em>
              <p>先别急着背公式。你先看三件事：研究系统是谁？外力冲量能不能忽略？过程是不是短时间相互作用？这三件事都成立，才轮到守恒。</p>
            </div>
          </div>
          <div className="msg teacher">
            <img src={tutor.avatar} alt="" />
            <div>
              <em>{tutor.name}</em>
              <p>记住：动量守恒不是看到碰撞就守恒，是先验条件再列方程。</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fit-block">
        <div className="fit-col">
          <p className="eyebrow tone-success">适合这样的孩子</p>
          <ul>
            <li><CheckCircle2 size={14} /> 听课能听懂，但一做题就不知道从哪下手</li>
            <li><CheckCircle2 size={14} /> 想冲 90+ 但卡在压轴题</li>
            <li><CheckCircle2 size={14} /> 喜欢有方法的讲法，不喜欢死记硬背</li>
          </ul>
        </div>
        <div className="fit-col">
          <p className="eyebrow tone-amber">暂不适合</p>
          <ul>
            <li><Flag size={14} /> 物理基础尚未建立，先去听系统课</li>
            <li><Flag size={14} /> 只想要答案、不想自己思考的学生</li>
            <li><Flag size={14} /> 初中及以下学段</li>
          </ul>
        </div>
      </div>

      <div className="guarantee-block">
        <ShieldCheck size={28} />
        <div>
          <strong>给家长的承诺</strong>
          <p>7 天内不满意全额退款。每条 AI 回答都标注由 {tutor.name} 老师审核，可追溯。未审核的答题不会发到学生面前。</p>
        </div>
      </div>
    </section>
  )
}
// Mock 知识点掌握雷达数据 + 7 天趋势 — 演示用
const knowledgeMastery = [
  { name: '力学', value: 0.88 }, { name: '运动', value: 0.76 },
  { name: '能量', value: 0.54 }, { name: '动量', value: 0.42 },
  { name: '电磁', value: 0.61 }, { name: '光学', value: 0.83 },
]
const last7DaysBars = [22, 48, 8, 65, 80, 38, 55]

function Capture({ setDiagnosis, setView, tutor, userTier, freeAttemptsLeft }: {
  setDiagnosis: (d: Diagnosis) => void
  setView: (v: StudentView) => void
  tutor: Tutor
  userTier: 'visitor' | 'new' | 'paid'
  freeAttemptsLeft: number
}) {
  const [pasted, setPasted] = useState('')
  const [scanStep, setScanStep] = useState<0 | 1 | 2 | 3 | 4>(0) // 0 = closed, 1-4 = step

  const [dragOver, setDragOver] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string>('')
  const [showImageHint, setShowImageHint] = useState(false)

  const startScan = () => {
    if (!pasted.trim()) {
      // 没文字内容不能开始 — 提示用户必须输入题目
      setShowImageHint(true)
      return
    }
    setShowImageHint(false)
    setScanStep(1)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) {
      setUploadedFileName(f.name)
      setShowImageHint(true)
    }
  }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setUploadedFileName(f.name)
      setShowImageHint(true)
    }
  }

  // 自动推进扫描进度
  useEffect(() => {
    if (scanStep === 0) return
    if (scanStep === 4) {
      // 完成 — 写入 diagnosis 直接跳 coach（去掉冗余 confirm 页）
      // 用户必须有 pasted 内容（startScan 已校验），不再 fallback 到固定 mock 文本
      setDiagnosis({ ...defaultDiagnosis, text: pasted, confidence: 0.95 })
      const t = window.setTimeout(() => {
        setScanStep(0)
        setView('coach')
      }, 700)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => {
      setScanStep((s) => (Math.min(s + 1, 4)) as 0 | 1 | 2 | 3 | 4)
    }, 1400)
    return () => window.clearTimeout(t)
  }, [scanStep, pasted, setDiagnosis, setView])

  const showScan = scanStep > 0

  return (
    <section className="capture-page">
      <p className="crumb">拍题诊断</p>

      <div className="capture-grid">
        <div className="capture-left">
          {/* 第一人称引导气泡 */}
          <div className="greet">
            <div className="greet-av">λ</div>
            <div className="greet-bubble">
              <div className="greet-who"><b>{tutor.name}</b> · 名师 AI 分身</div>
              <h1>请上传遇到困难的题目，我来带你理清思路。</h1>
              <p>不用整页拍，只发<b>一道题</b>就行——题干、选项、图都拍清楚一些。如果题目里有图，记得一起拍进去。</p>
            </div>
          </div>

          {/* 上传卡片 */}
          <div className="capture-stage">
            <div
              className={`dropzone-stage ${dragOver ? 'drag-over' : ''}`}
              onClick={() => document.getElementById('capture-file')?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
            >
              <div className="icon-wrap">
                <Camera size={24} />
              </div>
              <div className="copy">
                <h3>{dragOver ? '松开上传' : uploadedFileName ? `已上传：${uploadedFileName}` : '把题目拖到这里'}</h3>
                <p>{uploadedFileName
                  ? '⚠️ 演示版尚未接入图像识别。请在下方文字框补充题目内容，AI 才能讲解。'
                  : '支持拖拽图片 / 点击此区域选择 · 单题识别更准'}
                </p>
              </div>
              <div className="action-row" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="seg-btn ghost"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); document.getElementById('capture-file')?.click() }}
                >
                  <ImageIcon size={14} /> 选择图片
                </button>
              </div>
            </div>
            <input id="capture-file" type="file" accept="image/*" onChange={handleFileSelect} hidden />

            <div className="or-divider"><span>请输入题目文字</span></div>

            {showImageHint && !pasted.trim() && (
              <div className="paste-hint">
                ⚠️ 演示模式：图像识别还在接入中。请把题目文字粘贴或手打到下方框里，X 老师才能针对真题讲解。
              </div>
            )}

            <textarea
              className="paste-input"
              placeholder="把题目文字粘贴在这里 ——「在光滑水平面上，长 L=0.5m 的导体棒在磁感应强度 B=0.2T 的匀强磁场中以 v=2m/s 切割磁感线…」"
              value={pasted}
              onChange={(e) => { setPasted(e.target.value); if (e.target.value.trim()) setShowImageHint(false) }}
              rows={4}
            />

            <div className="stage-footer">
              <span>仅你和老师能看到 · 不会出现在公共题库</span>
              <button
                type="button"
                className="send-teacher-btn"
                onClick={() => startScan()}
                disabled={!pasted.trim()}
                title={!pasted.trim() ? '先输入题目文字' : '发给老师'}
              >
                发给老师
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* 辅助小贴士 */}
          <div className="helper-tips">
            <div className="tip"><b>📐 单题更准</b>一次只拍一道，AI 才能聚焦到这一道题的方法。</div>
            <div className="tip"><b>📷 题干完整</b>题号、条件、图都拍进来，别裁掉。</div>
            <div className="tip"><b>✏️ 写一半也行</b>已经动笔但卡住了？把过程一起拍来，我从你卡住的地方接。</div>
          </div>
        </div>

        <aside className="capture-right">
          {/* 今日剩余次数 — 新用户显示 1 次免费体验，老用户显示无限 */}
          <div className="rail-card quota-card">
            <div className="rail-head">
              <h4>{userTier === 'paid' ? '今日已用' : '免费体验额度'}</h4>
              <span className="rail-meta">{userTier === 'paid' ? 'MEMBER' : 'FREE'}</span>
            </div>
            <div className="quota-num">
              {userTier === 'paid' ? (
                <>
                  <span className="quota-n">∞</span>
                  <span className="quota-total">无限</span>
                </>
              ) : (
                <>
                  <span className="quota-n">{freeAttemptsLeft}</span>
                  <span className="quota-total">/ 1 次</span>
                </>
              )}
            </div>
            {userTier !== 'paid' && (
              <div className="quota-bar"><div className="quota-fill" style={{ width: `${freeAttemptsLeft * 100}%` }} /></div>
            )}
            <div className="quota-foot">
              {userTier === 'paid' ? '已订阅 X 老师 · 不限次数' : '免费体验后订阅 ¥299/月解锁无限'}
            </div>
          </div>

          {/* 知识点雷达图 */}
          <div className="rail-card">
            <div className="rail-head">
              <h4>知识点掌握</h4>
              <span className="rail-meta">最近 30 题</span>
            </div>
            <div className="radar-wrap">
              <svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
                <g stroke="var(--ppath-line)" strokeWidth="1" fill="none">
                  <polygon points="100,20 162,55 162,125 100,160 38,125 38,55" />
                  <polygon points="100,40 145,65 145,115 100,140 55,115 55,65" />
                  <polygon points="100,60 128,75 128,105 100,120 72,105 72,75" />
                  <polygon points="100,80 111,85 111,95 100,100 89,95 89,85" />
                </g>
                <g stroke="var(--ppath-line-soft)" strokeWidth="1">
                  <line x1="100" y1="90" x2="100" y2="20" />
                  <line x1="100" y1="90" x2="162" y2="55" />
                  <line x1="100" y1="90" x2="162" y2="125" />
                  <line x1="100" y1="90" x2="100" y2="160" />
                  <line x1="100" y1="90" x2="38" y2="125" />
                  <line x1="100" y1="90" x2="38" y2="55" />
                </g>
                <polygon
                  points="100,32 152,58 138,118 100,148 62,118 60,62"
                  fill="var(--ppath-ink-green-700)"
                  fillOpacity=".18"
                  stroke="var(--ppath-ink-green-700)"
                  strokeWidth="1.6"
                />
                <g fill="var(--ppath-ink-green-800)">
                  <circle cx="100" cy="32" r="2.6" />
                  <circle cx="152" cy="58" r="2.6" />
                  <circle cx="138" cy="118" r="2.6" />
                  <circle cx="100" cy="148" r="2.6" />
                  <circle cx="62" cy="118" r="2.6" />
                  <circle cx="60" cy="62" r="2.6" />
                </g>
                <g fontSize="9" fill="var(--ppath-fg-2)">
                  <text x="100" y="13" textAnchor="middle">力学</text>
                  <text x="172" y="55" textAnchor="middle">运动</text>
                  <text x="172" y="130" textAnchor="middle">能量</text>
                  <text x="100" y="174" textAnchor="middle">动量</text>
                  <text x="28" y="130" textAnchor="middle">电磁</text>
                  <text x="28" y="55" textAnchor="middle">光学</text>
                </g>
              </svg>
            </div>
            <div className="radar-legend">
              {knowledgeMastery.map((k) => (
                <div className="radar-row" key={k.name}>
                  <span>{k.name}</span><b>{Math.round(k.value * 100)}%</b>
                </div>
              ))}
            </div>
          </div>

          {/* 7 天趋势 */}
          <div className="rail-card">
            <div className="rail-head">
              <h4>最近 7 天</h4>
              <span className="rail-meta">已练 18 道</span>
            </div>
            <div className="trend-bars">
              {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => (
                <div className="trend-col" key={d}>
                  <div className={`trend-bar ${last7DaysBars[i] < 15 ? 'dim' : ''}`} style={{ height: `${last7DaysBars[i]}%` }} />
                  <span className="trend-label">{d}</span>
                </div>
              ))}
            </div>
            <div className="trend-foot">
              <span>本周连续打卡</span>
              <b>4 天</b>
            </div>
          </div>
        </aside>
      </div>

      {/* 扫描动画 Modal */}
      {showScan && (
        <div className="scan-modal show" role="dialog" aria-label="正在识别题目">
          <div className="scan-card">
            <div className="scan-frame">
              <span className="corner tl"></span>
              <span className="corner tr"></span>
              <span className="corner bl"></span>
              <span className="corner br"></span>
              <div className="scan-doc">
                <div className="scan-q">{uploadedFileName ? `已上传图片：${uploadedFileName}` : '题目内容'}</div>
                <div className="scan-body">
                  {pasted.slice(0, 200) || '...'}
                </div>
              </div>
              <div className="scan-line" />
            </div>
            <h3>{tutor.name}正在读题…</h3>
            <p className="scan-sub">用大模型理解整道题，不只是识别文字</p>

            <div className="scan-steps">
              {[
                ['已收到图片 · 排正题干', 1],
                ['正在理解题意 · 抽取已知量', 2],
                ['判断知识点 · 准备方法卡', 3],
                ['进入对话陪练', 4],
              ].map(([label, i]) => {
                const idx = i as number
                const cls = scanStep > idx ? 'done' : scanStep === idx ? 'active' : ''
                return (
                  <div className={`scan-step ${cls}`} key={idx}>
                    <span className="scan-dot" />
                    {label}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
function Confirm({ diagnosis, setDiagnosis, setView }: { diagnosis: Diagnosis; setDiagnosis: (d: Diagnosis) => void; setView: (v: StudentView) => void }) {
  const lowConf = diagnosis.confidence < 0.8
  return (
    <section className="flow-page">
      <p className="eyebrow">题干确认</p>
      <h1>我识别到的题目</h1>
      <div className="flow-card">
        {lowConf && (
          <div className="confirm-warning">
            <strong>识别置信度只有 {Math.round(diagnosis.confidence * 100)}%</strong>
            <span>请先核对题干和数字，必要时重新拍一张更清晰的照片再继续。</span>
          </div>
        )}
        <div className="confirm-grid">
          <span>学科：{diagnosis.subject}</span>
          <span>题型：{diagnosis.type}</span>
          <span>难度：{diagnosis.difficulty}</span>
          <span>置信度：{Math.round(diagnosis.confidence * 100)}%</span>
        </div>
        <label>
          题干
          <textarea value={diagnosis.text} onChange={(e) => setDiagnosis({ ...diagnosis, text: e.target.value })} />
        </label>
        <button onClick={() => setView('coach')}>
          <CheckCircle2 size={16} /> 识别正确，开始陪练
        </button>
        <button className="ghost"><PencilLine size={16} /> 有错误，我来修改</button>
      </div>
    </section>
  )
}

function Coach({ tutor, session, draft, setDraft, send, step, setStep, card, isThinking, diagnosis, onComplete, onSwitchProblem }: { tutor: Tutor; session: Session; draft: string; setDraft: (s: string) => void; send: (s: string) => void; step: number; setStep: (n: number) => void; card: MethodCard; isThinking: boolean; diagnosis: Diagnosis; onComplete: () => void; onSwitchProblem: () => void }) {
  const safeStep = Math.min(step, card.methodSteps.length - 1)
  const current = card.methodSteps[safeStep]
  const isLastStep = safeStep >= card.methodSteps.length - 1
  return (
    <div className="coach-shell">
      {/* 顶部 sticky 题卡 — 题图 + 题型/难度 + 卡点摘要 + 完成本题 */}
      <header className="coach-question">
        <button className="thumb" type="button" aria-label="放大查看题图">
          <ImageIcon size={28} />
        </button>
        <div className="qmeta">
          <span className="qno">第 3 题 · 2024 朝阳一模 · {tutor.name} 陪练</span>
          <div className="qtags">
            <span className="topic">{card.topic}</span>
            <span className="difficulty">{diagnosis.difficulty}</span>
            <span className="stuck-tag">{diagnosis.stuck.length} 个常见卡点</span>
          </div>
        </div>
        <button className="finish-btn" type="button" onClick={onComplete}>
          完成本题
        </button>
      </header>

      {/* 当前步骤 — 进度条 + 步骤名 + 3 个引导按钮 */}
      <div className="coach-current-step">
        <div className="step-progress">
          {card.methodSteps.map((_, i) => (
            <span key={i} className={i === safeStep ? 'active' : i < safeStep ? 'done' : ''} />
          ))}
        </div>
        <h2 className="current-step-name">
          <span className="step-no">第 {safeStep + 1}/{card.methodSteps.length} 步</span>
          {current}
        </h2>
        <div className="coach-actions">
          <button
            className="ghost"
            type="button"
            onClick={() => send('给我一个提示')}
            disabled={isThinking}
          >
            <Lightbulb size={14} /> 提示一下
          </button>
          <button
            className="primary"
            type="button"
            onClick={() => {
              const nextStep = Math.min(safeStep + 1, card.methodSteps.length - 1)
              setStep(nextStep)
              send('好，下一步我该做什么？')
            }}
            disabled={isLastStep || isThinking}
          >
            下一步 →
          </button>
          <button
            className="ghost"
            type="button"
            onClick={() => send('给我看一下完整解题过程')}
            disabled={isThinking}
          >
            <BookOpen size={14} /> 看完整解析
          </button>
        </div>
      </div>

      {/* 对话流 */}
      <div className="coach-thread">
        {session.messages.map((m) => {
          if (m.role === 'student') {
            return (
              <div key={m.id} className="coach-bubble user">
                <Tex>{m.content}</Tex>
              </div>
            )
          }
          const evalLabel: Record<NonNullable<Evaluation>, { text: string; cls: string }> = {
            correct: { text: '✓ 想对了 — 这一步过', cls: 'eval-correct' },
            partial: { text: '⚠ 偏了 — 让我提醒一下', cls: 'eval-partial' },
            wrong: { text: '✗ 跟方法卡不一致 — 我们重来', cls: 'eval-wrong' },
          }
          const ev = m.evaluation ? evalLabel[m.evaluation] : null
          return (
            <div key={m.id} className="coach-bubble ai">
              <span className="stamp-mark"><SealRound size={44} rotate={8} /></span>
              <div className="signoff">
                <span className="sig-name">{tutor.name} · 分身</span>
                <span className="sig-tag">v1.2</span>
                {ev && <span className={`eval-badge ${ev.cls}`}>{ev.text}</span>}
              </div>
              <div className="body"><Tex>{m.content}</Tex></div>
              <div className="review">
                <CheckCircle2 className="ico" size={14} />
                <span><b className="by">{tutor.name}</b>方法卡引导</span>
                <span className="when">{m.time}</span>
              </div>
            </div>
          )
        })}
        {isThinking && (
          <div className="coach-bubble ai thinking">
            <div className="signoff">
              <span className="sig-name">{tutor.name} · 分身</span>
              <span className="sig-tag">正在调取方法卡…</span>
            </div>
            <span className="typing-bubble"><span /><span /><span /></span>
          </div>
        )}
      </div>

      {/* 底部 sticky 输入栏 — 拍新题（左小） + 输入框 + 发送（主 CTA） */}
      <div className="coach-input">
        <button
          className="coach-mini-btn"
          type="button"
          aria-label="拍新题"
          onClick={onSwitchProblem}
          title="换一道新题"
        >
          <Camera size={18} />
        </button>
        <input
          type="text"
          className="coach-text-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { e.preventDefault(); send(draft) } }}
          placeholder="说说你这一步的想法… 按 Enter 或点发送"
          disabled={isThinking}
        />
        <button
          className="coach-send-btn"
          type="button"
          aria-label="发送"
          onClick={() => draft.trim() && send(draft)}
          disabled={!draft.trim() || isThinking}
          title="发送"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
function Summary({ diagnosis, card, setView, conversation }: {
  diagnosis: Diagnosis
  card: MethodCard
  setView: (v: StudentView) => void
  conversation: Array<{ role: 'student' | 'teacher'; content: string }>
}) {
  const [summary, setSummary] = useState<StudySummaryResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    generateStudySummary({
      problemText: diagnosis.text,
      methodCard: card,
      conversation,
    }).then((s) => {
      if (mounted) {
        setSummary(s)
        setLoading(false)
      }
    })
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id])

  if (loading || !summary) {
    return (
      <section className="flow-page summary-v2">
        <header className="summary-topbar">
          <div>
            <p className="eyebrow">学习总结</p>
            <h1>正在生成总结…</h1>
            <p className="page-sub">X 老师在分析这次对话，请稍等几秒。</p>
          </div>
        </header>
        <div className="summary-loading">
          <span className="loader-spinner" />
          <p>基于本次对话生成家长摘要中…</p>
        </div>
      </section>
    )
  }

  const totalSteps = summary.totalSteps
  const stuckIndex = card.methodSteps.findIndex((s) => s === summary.stuckStep)
  const safeStuckIndex = stuckIndex >= 0 ? stuckIndex : Math.max(0, totalSteps - 1)
  // 完成步骤 = 卡住之前的所有步骤数（从 stuckIndex 推断，保持 UI 一致）
  const masteredSteps = safeStuckIndex
  const masteryPct = Math.round((masteredSteps / totalSteps) * 100)

  return <section className="flow-page summary-v2">
    <header className="summary-topbar">
      <div>
        <p className="eyebrow">学习总结</p>
        <h1>本题你学会了什么？</h1>
        <p className="page-sub">{summary.headline}</p>
      </div>
      <div className="summary-meta-strip">
        <span className="pill pill-paper"><Clock size={13}/> 用时 {summary.minutes} 分钟</span>
        <span className="pill pill-paper"><CheckCircle2 size={13}/> {masteredSteps} / {totalSteps} 步</span>
        <span className="pill pill-success">{summary.provider === 'deepseek' ? 'X 老师方法卡引导' : '本地分析'}</span>
      </div>
    </header>

    <div className="summary-layout">
      {/* 学生端 — 路径图 */}
      <div className="path-card">
        <div className="pc-head">
          <div>
            <div className="pc-title">学生总结 · 这条解题路径</div>
            <div className="pc-topic">{card.topic}</div>
            <div className="pc-tags">
              <span className="pill pill-ink">{card.subject}</span>
              <span className="pill pill-ink">{diagnosis.difficulty}</span>
            </div>
          </div>
        </div>

        <div className="pc-track">
          {card.methodSteps.map((stepName, i) => {
            const stuck = i === safeStuckIndex
            const done = i < safeStuckIndex || (i === safeStuckIndex && masteredSteps > i)
            return (
              <div className={`pc-step ${done ? 'done' : ''} ${stuck ? 'stuck' : ''}`} key={stepName}>
                <span className="pc-bullet">{stuck ? '!' : i+1}</span>
                <div className="pc-name">{stepName}</div>
                {stuck ? (
                  <>
                    <div className="pc-note">这一步是你今天卡住的地方。</div>
                    <div className="pc-callout">
                      <b>X 老师提示：</b>{summary.stuckHint}
                    </div>
                  </>
                ) : (
                  <div className="pc-note">{done ? '已走完' : '尚未走到'}</div>
                )}
              </div>
            )
          })}
        </div>

        <div className="pc-foot">
          <div className="pcf-text">下一步：{summary.nextStepAdvice}</div>
          <button className="btn-primary" onClick={()=>setView('pricing')}>开始练习 <ArrowRight size={14}/></button>
        </div>
      </div>

      {/* 家长端 — Scorecard */}
      <div className="parent-score">
        <div className="ps-top">
          <div className="ps-from"><strong>本题家长摘要</strong> · <span>小明 · {new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric'})}</span></div>
          <span className="pill pill-amber"><span className="dot"/>待发送</span>
        </div>

        <p className="ps-headline">{summary.headline}</p>

        <div className="ps-grid2">
          <div className="ps-cell">
            <div className="lab">本题用时</div>
            <div className="val">{summary.minutes}<small>分钟</small></div>
          </div>
          <div className="ps-cell">
            <div className="lab">完成步骤</div>
            <div className="val">{masteredSteps}<small>/ {totalSteps}</small></div>
          </div>
          <div className="ps-cell span2">
            <div className="lab">方法掌握度</div>
            <div className="val">{masteredSteps}<small>/ {totalSteps} 步</small></div>
            <div className="ps-bar"><div className="fill" style={{width:`${masteryPct}%`}}/></div>
          </div>
        </div>

        <div className="ps-block">
          <div className="lab">影响范围</div>
          <div className="val">{summary.impactScope}</div>
        </div>

        <div className="ps-block">
          <div className="lab">下一步建议</div>
          <div className="val">{summary.nextStepAdvice}</div>
        </div>

        <p className="ps-trust">由X 老师审核的「{card.topic}方法卡」引导 · 不承诺提分、不押题。</p>

        <div className="ps-actions">
          <button className="btn-primary"><Mail size={14}/> 发送给家长</button>
          <button className="btn-ghost"><Copy size={14}/> 复制摘要</button>
        </div>
      </div>
    </div>
  </section>
}
function Pricing({ tutor, onSubscribe }: { tutor: Tutor; onSubscribe: (plan: 'month' | 'year') => void }) {
  const monthlyEquiv = Math.round(tutor.year / 12)
  const savings = tutor.month * 12 - tutor.year
  return (
    <section className="flow-page">
      <p className="eyebrow">订阅 {tutor.name} 老师</p>
      <h1>继续陪孩子练物理</h1>
      <p className="page-sub">7 天内不满意全额退款。每条 AI 回答都由老师亲自审核。</p>

      <div className="pricing-grid">
        <div className="price-card">
          <span className="tier">月卡</span>
          <strong>¥{tutor.month}<small>/月</small></strong>
          <ul className="price-features">
            <li><CheckCircle2 size={14} /> 每月 120 次拍题诊断</li>
            <li><CheckCircle2 size={14} /> 30 次深度讲解</li>
            <li><CheckCircle2 size={14} /> 每周学习摘要</li>
            <li><CheckCircle2 size={14} /> 7 天无理由退款</li>
          </ul>
          <button className="ghost" onClick={() => onSubscribe('month')}>开通月卡</button>
        </div>

        <div className="price-card recommended">
          <span className="rec-badge">家长推荐</span>
          <span className="tier">年卡</span>
          <strong>¥{tutor.year}<small>/年</small></strong>
          <p className="price-equiv">折合 ¥{monthlyEquiv}/月 · 省 ¥{savings}</p>
          <ul className="price-features">
            <li><CheckCircle2 size={14} /> 全年 1500 次拍题诊断</li>
            <li><CheckCircle2 size={14} /> 400 次深度讲解</li>
            <li><CheckCircle2 size={14} /> 每周学习摘要 + 月度家长报告</li>
            <li><CheckCircle2 size={14} /> 优先使用新方法库</li>
            <li><CheckCircle2 size={14} /> 7 天无理由退款</li>
          </ul>
          <button onClick={() => onSubscribe('year')}>开通年卡</button>
        </div>
      </div>

      <div className="pricing-trust">
        <ShieldCheck size={16} />
        <span>所有订阅均经家长账户支付，未成年人无法独立完成订阅。</span>
      </div>
    </section>
  )
}

// ---- 错题本页面（P4 + P7）
type MistakeFilter = 'all' | 'open' | 'reviewing' | 'mastered'

function MistakesPage({ mistakes, setMistakes, openMistake }: {
  mistakes: MistakeRecord[]
  setMistakes: React.Dispatch<React.SetStateAction<MistakeRecord[]>>
  openMistake: (m: MistakeRecord) => void
}) {
  const [filter, setFilter] = useState<MistakeFilter>('all')

  const [pageLoadedAt] = useState(() => Date.now())
  const filtered = mistakes.filter((m) => filter === 'all' || m.status === filter)
  const stats = useMemo(() => ({
    total: mistakes.length,
    today: mistakes.filter((m) => pageLoadedAt - new Date(m.createdAt).getTime() < 24 * 60 * 60 * 1000).length,
    open: mistakes.filter((m) => m.status === 'open').length,
    reviewing: mistakes.filter((m) => m.status === 'reviewing').length,
    mastered: mistakes.filter((m) => m.status === 'mastered').length,
  }), [mistakes, pageLoadedAt])

  const markStatus = (id: string, status: MistakeStatus) =>
    setMistakes((current) => current.map((m) => (m.id === id ? { ...m, status } : m)))

  const statusLabel = (s: MistakeStatus) =>
    ({ open: '待复习', reviewing: '复习中', mastered: '已掌握' }[s])

  return (
    <section className="mistakes-page">
      <header className="page-head">
        <p className="eyebrow">错题本</p>
        <h1>把卡过的题，再做一遍</h1>
        <p className="page-sub">每道错题记录你卡在哪一步、做错过几次。复习一遍才算真的会。</p>
      </header>

      <div className="mistakes-stats">
        <div className="stat-cell"><strong>{stats.today}</strong><span>今日新增</span></div>
        <div className="stat-cell"><strong>{stats.total}</strong><span>错题总数</span></div>
        <div className="stat-cell tone-amber"><strong>{stats.open + stats.reviewing}</strong><span>待复习</span></div>
        <div className="stat-cell tone-success"><strong>{stats.mastered}</strong><span>已掌握</span></div>
      </div>

      <div className="mistakes-filters">
        {([
          ['all', `全部 ${stats.total}`],
          ['open', `待复习 ${stats.open}`],
          ['reviewing', `复习中 ${stats.reviewing}`],
          ['mastered', `已掌握 ${stats.mastered}`],
        ] as [MistakeFilter, string][]).map(([key, label]) => (
          <button
            key={key}
            className={`filter-tab ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mistakes-list">
        {filtered.length === 0 && (
          <div className="empty-tip">这一筛选下没有错题。点「全部」看其他。</div>
        )}
        {filtered.map((m) => (
          <article className={`mistake-card status-${m.status}`} key={m.id}>
            <div className="mistake-meta">
              <span className="topic-tag">{m.subjectArea}</span>
              <span className="diff-tag" data-diff={m.difficulty}>{m.difficulty}</span>
              <span className={`status-tag ${m.status}`}>{statusLabel(m.status)}</span>
              <span className="when">{timeAgo(m.createdAt)} · 第 {m.attemptCount} 次</span>
            </div>
            <strong className="mistake-topic">{m.topic}</strong>
            <p className="mistake-question">{m.questionText}</p>
            {m.status !== 'mastered' && (
              <p className="mistake-stuck">
                ⚠ 你卡在第 {m.stuckAtStep + 1}/{m.totalSteps} 步
              </p>
            )}
            <div className="mistake-actions">
              <button className="primary" type="button" onClick={() => openMistake(m)}>
                <Pencil size={13} /> 再做一遍
              </button>
              {m.status !== 'mastered' && (
                <button className="ghost" type="button" onClick={() => markStatus(m.id, 'mastered')}>
                  <CheckCircle2 size={13} /> 标记已掌握
                </button>
              )}
              {m.status === 'mastered' && (
                <button className="ghost" type="button" onClick={() => markStatus(m.id, 'reviewing')}>
                  重新加入复习
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

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
    const result = await generateAnswerWithProvider({
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
    const result = await generateAnswerWithProvider({
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
