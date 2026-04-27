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
import { defaultTutor, liuTutor, tutors } from './data/tutors'
import {
  loadInitialMethodCards,
  SEED_VERSION,
  SEED_VERSION_STORAGE_KEY,
} from './data/methodCardLoader'
import type {
  AppView,
  Diagnosis,
  Message,
  Session,
  StudentView,
  TeacherView,
  Tutor,
} from './types'
import {
  ClipboardCheck,
  Layers,
  MessageSquareText,
  Pencil,
  Settings as SettingsIcon,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { createAnswerReview, findMethodCard, mockEvaluateAnswer } from './aiTasks'
import { getAiClient } from './api/aiClient'
import {
  ANSWER_REVIEW_STORAGE_KEY,
  METHOD_CARD_STORAGE_KEY,
  MISTAKES_STORAGE_KEY,
  seedMistakes,
  type AnswerReview,
  type MethodCard,
  type MistakeRecord,
  type SubjectArea,
} from './domain'
import './App.css'
import './App.patch.css'


const fmt = () => new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date())

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
    { id: 's1', title: '新的提问', messages: [] },
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
      messages: [],
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
    // 本题的方法卡只由题干决定。后续「提示一下 / 下一步」这类短按钮文案不能重新匹配，
    // 否则会 fallback 到第一张卡，造成电场题按牛二讲。
    const card = findMethodCard(diagnosis.text, cards)
    const history = (activeSession?.messages ?? []).slice(-6).map((m) => ({
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
      messages: [],
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
