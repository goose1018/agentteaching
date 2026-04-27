import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Flag,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Mic,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { UploadCoursewareView } from './UploadCoursewareView'
import type { AnswerReview, MethodCard } from '../../domain'
import type { AppView, TeacherView } from '../../types'

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

const statusLabel = (s: MethodCard['status']) =>
  ({ approved: '已发布', needs_review: '待审核', draft: '草稿', disabled: '已禁用' }[s] ?? s)

const reviewStatusLabel = (s: AnswerReview['status']) =>
  ({ pending: '待审核', approved: '已通过', needs_fix: '要求修改', rejected_example: '已加入反例库' }[s] ?? s)

export interface TeacherWorkbenchProps {
  view: TeacherView
  setView: (view: TeacherView) => void
  setApp: (view: AppView) => void
  cards: MethodCard[]
  setCards: Dispatch<SetStateAction<MethodCard[]>>
  answerReviews: AnswerReview[]
  setAnswerReviews: Dispatch<SetStateAction<AnswerReview[]>>
}

export function TeacherWorkbench(props: TeacherWorkbenchProps) {
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
