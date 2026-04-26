import { useEffect, useState } from 'react'
import {
  Backpack,
  BookOpen,
  Camera,
  CheckCircle2,
  ClipboardCheck,
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
import { createAnswerReview, findMethodCard, recognizeProblemImage } from './aiTasks'
import { generateAnswerWithProvider } from './aiProvider'
import {
  ANSWER_REVIEW_STORAGE_KEY,
  METHOD_CARD_STORAGE_KEY,
  seedHighSchoolCards,
  type AnswerReview,
  type MethodCard,
} from './domain'
import './App.css'
import './App.patch.css'

type AppView = 'welcome' | 'student' | 'teacher'
type StudentView = 'home' | 'capture' | 'confirm' | 'diagnosis' | 'trial' | 'coach' | 'summary' | 'pricing' | 'subjects' | 'teachers' | 'teacherDetail'
type TeacherView = 'home' | 'train' | 'methods' | 'review' | 'records' | 'publish' | 'quality'
type Role = 'student' | 'teacher'

interface Message { id: string; role: Role; content: string; time: string; tags?: string[] }
interface Session { id: string; title: string; messages: Message[] }
interface Subject { name: string; icon: string; status: string }
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

// === 主推老师：刘振华（全平台唯一开放购买的老师）===
const liuTutor: Tutor = {
  id: 'liu-physics-01',
  name: '刘振华',
  avatar: '/teachers/avatar-a.svg',
  subject: '高中物理',
  title: '高中物理 · 解题路径教练',
  fit: '听课能懂，但一做题就不知道从哪下手的学生',
  specialties: ['解题路径', '力学建模', '电磁综合', '动量守恒', '压轴题拆解'],
  style: '先建模、再列式；不背模板，训练解题路径',
  schoolTag: '西安市重点高中退休物理教师 · 教龄 32 年',
  years: '教龄 32 年',
  result: '所带班级高考物理平均 88.6 分，多名学生 95+',
  bio: '我教高中物理 32 年，最反对的是让学生背模板。物理题讲究"看明白"——看明白对象、过程、条件，公式自然就出来了。我希望我的 AI 分身做的不是替你解题，而是带你走一遍我看题的脑路。',
  month: 99,
  year: 792,
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

function Welcome({go}:{go:(v:AppView)=>void}){return <main className="welcome-page">
  <header className="welcome-nav"><img className="brand-logo-horizontal" src="/logo-horizontal.svg" alt="PhysicsPath · 名师 AI 解题教练" /></header>
  <section className="welcome-hero">
    <div>
      <span className="hero-kicker">名师 AI 解题教练</span>
      <h1>不是搜答案，<br/>而是训练你怎么想题。</h1>
      <p>拍一道题，AI 老师会先识别题型，再按老师的方法一步步带你分析。</p>
      <div className="hero-actions">
        <button onClick={()=>go('student')}><Backpack size={18}/> 我是学生，开始学习</button>
        <button className="secondary" onClick={()=>go('teacher')}><GraduationCap size={18}/> 我是老师，训练我的 AI 分身</button>
      </div>
      <small>演示版可在设置中切换学生端 / 教师端</small>
    </div>
    <div className="welcome-illustration"><img src="/welcome.svg" alt="拍题 → 诊断 → 分步引导" /></div>
  </section>
  <section className="trust-strip">
    <div><ShieldCheck size={22}/><div><strong>不直接给答案</strong><span>AI 按老师方法一步步引导，避免抄袭。</span></div></div>
    <div><ClipboardCheck size={22}/><div><strong>方法卡老师亲审</strong><span>每条讲题方法都要本人确认才会上线。</span></div></div>
    <div><Mail size={22}/><div><strong>每周给家长摘要</strong><span>哪些卡点在退步，哪些在进步，一目了然。</span></div></div>
    <div><UsersRound size={22}/><div><strong>真实老师参与</strong><span>不是凭空捏造的 AI，背后有名师收益分成。</span></div></div>
  </section>
  <footer className="welcome-foot">© PhysicsPath · 演示版本，仅供试用 · 学习辅助工具，不替代学校教学</footer>
</main>}
function Settings({close,setStudent,setApp}:{close:()=>void;setStudent:(v:StudentView)=>void;setApp:(v:AppView)=>void}){return <div className="settings-modal" onClick={close}><div className="settings-card" onClick={e=>e.stopPropagation()}><header><strong>设置</strong><button className="close" onClick={close}>关闭</button></header><button onClick={()=>{close();setStudent('subjects')}}><Layers size={14}/> 切换科目</button><button onClick={()=>{close();setStudent('teachers')}}><GraduationCap size={14}/> 切换老师</button><button><ClipboardCheck size={14}/> 历史订单</button><button><Mail size={14}/> 评价反馈</button><button onClick={()=>{close();setApp('teacher')}}><Workflow size={14}/> 切换到教师端 Demo</button><button className="danger" onClick={()=>{close();setApp('welcome')}}><Flag size={14}/> 退出登录</button></div></div>}
function StudentHome({ tutor, setView }: { tutor: Tutor; setView: (v: StudentView) => void }) {
  return (
    <section className="student-home">
      <header className="page-head">
        <p className="eyebrow">本周学习</p>
        <h1>欢迎回来，继续跟<span className="accent-name">{tutor.name}</span>练物理。</h1>
      </header>

      <div className="dashboard-grid">
        {/* 主任务 — 拍题诊断 */}
        <div className="main-task">
          <span className="eyebrow">今天的主任务</span>
          <h2>拍一道你不会的题</h2>
          <p>AI 老师会先识别题型、找出常见卡点，再带你一步步推到答案。</p>
          <div className="main-task-actions">
            <button onClick={() => setView('capture')}><Camera size={16} /> 拍题诊断</button>
            <button className="ghost" onClick={() => setView('coach')}><Pencil size={16} /> 输入题目</button>
          </div>
        </div>

        {/* 老师卡片 */}
        <div className="dashboard-card">
          <div className="dc-head">
            <img className="dc-avatar" src={tutor.avatar} alt={tutor.name} />
            <div>
              <strong>{tutor.name}</strong>
              <span>{tutor.title}</span>
            </div>
            <span className="status-pill">已购买</span>
          </div>
          <p>本周一起诊断了 <em>12</em> 道题，集中卡点：研究对象选择、合外力判断。</p>
          <button onClick={() => setView('coach')}><MessageSquareText size={16} /> 继续上次对话</button>
        </div>

        {/* 学习摘要 */}
        <div className="dashboard-card">
          <div className="dc-head">
            <div className="dc-icon"><Mail size={20} /></div>
            <div>
              <strong>本周学习摘要</strong>
              <span>4 月 20 日 — 4 月 26 日</span>
            </div>
          </div>
          <ul className="dc-stats">
            <li><em>12</em><span>题已诊断</span></li>
            <li><em>8</em><span>独立解出</span></li>
            <li><em>3</em><span>高频卡点</span></li>
          </ul>
          <button onClick={() => setView('summary')}><Mail size={16} /> 查看本周报告</button>
        </div>
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
            className={`teacher-card ${t.purchased ? 'purchased' : ''} ${!t.available ? 'locked' : ''}`}
            key={t.id}
            onClick={() => { setPreview(t); setView('teacherDetail') }}
            title={`${t.schoolTag} · ${t.years} · ${t.result}`}
          >
            <img className="tutor-portrait" src={t.avatar} alt={`${t.name} 头像`} />
            <div className="tc-head">
              <strong>{t.name}</strong>
              {t.purchased && <span className="status-pill">已购买</span>}
              {!t.available && <span className="status-pill muted">内测中</span>}
            </div>
            <p>{t.title}</p>
            <em>{t.fit}</em>
            <div className="teacher-tags">
              {t.specialties.slice(0, 3).map((x) => <span key={x}>{x}</span>)}
            </div>
            <div className="tc-foot">
              <span className="tutor-price">¥{t.month}/月 · ¥{t.year}/年</span>
              <span className="tutor-rating">★ {t.rating}</span>
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
      <h1>选择你的解题教练</h1>
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
function Capture({setDiagnosis,setView}:{setDiagnosis:(d:Diagnosis)=>void;setView:(v:StudentView)=>void}){return <section className="flow-page"><p className="eyebrow">拍题诊断</p><h1>拍下你不会的题</h1><div className="flow-card"><p>建议只拍一道题，保证题干和图像完整。如果有图，请把图一起拍进去。</p><button onClick={()=>{const r=recognizeProblemImage('physics-demo.png');setDiagnosis({...defaultDiagnosis,text:r.text,confidence:r.confidence});setView('confirm')}}><Camera size={16}/> 拍照</button><button className="ghost" onClick={()=>setView('confirm')}><ImageIcon size={16}/> 从相册选择</button><textarea placeholder="也可以手动输入题目" onChange={e=>setDiagnosis({...defaultDiagnosis,text:e.target.value})}/></div></section>}
function Confirm({diagnosis,setDiagnosis,setView}:{diagnosis:Diagnosis;setDiagnosis:(d:Diagnosis)=>void;setView:(v:StudentView)=>void}){const lowConf=diagnosis.confidence<0.8;return <section className="flow-page"><p className="eyebrow">题干确认</p><h1>我识别到的题目</h1><div className="flow-card">{lowConf&&<div className="confirm-warning"><strong>识别置信度只有 {Math.round(diagnosis.confidence*100)}%</strong><span>请先核对题干和数字，必要时重新拍一张更清晰的照片再继续。</span></div>}<div className="confirm-grid"><span>学科：{diagnosis.subject}</span><span>题型：{diagnosis.type}</span><span>难度：{diagnosis.difficulty}</span><span>置信度：{Math.round(diagnosis.confidence*100)}%</span></div><label>题干<textarea value={diagnosis.text} onChange={e=>setDiagnosis({...diagnosis,text:e.target.value})}/></label><p>图像信息：{diagnosis.imageInfo}</p><button onClick={()=>setView('diagnosis')}><CheckCircle2 size={16}/> 识别正确，继续</button><button className="ghost"><PencilLine size={16}/> 有错误，我来修改</button></div></section>}
function DiagnosisPage({diagnosis,tutor,setView,setPreview}:{diagnosis:Diagnosis;tutor:Tutor;setView:(v:StudentView)=>void;setPreview:(t:Tutor)=>void}){return <section className="flow-page"><p className="eyebrow"><span className="dot-amber"/> 诊断结果</p><h1>这道题的常见卡点</h1><div className="flow-card"><div className="stuck-list">{diagnosis.stuck.map((x,i)=>(<div className="stuck-item" key={x}><span className="stuck-num">{i+1}</span><div>{x}</div></div>))}</div><div className="recommend-card"><strong>推荐老师：{tutor.name}</strong><span>{tutor.title}</span><p>适合：{tutor.fit}</p></div><button onClick={()=>{setPreview(tutor);setView('trial')}}>免费试看{tutor.name}讲这道题</button><button className="ghost" onClick={()=>setView('teachers')}>查看更多老师</button></div></section>}
function Trial({tutor,setTutor,setView}:{tutor:Tutor;setTutor:(t:Tutor)=>void;setView:(v:StudentView)=>void}){return <section className="flow-page"><p className="eyebrow">试看说明</p><h1>{tutor.name}不会直接给答案</h1><div className="flow-card"><p>它会先带你判断题型、选研究对象、画关键关系，再一步步推到答案。</p><button onClick={()=>{setTutor(tutor);setView('coach')}}>开始试看</button></div></section>}
// 根据当前步骤动态生成选项 — 不再硬编码一组按钮
function choicesForStep(card: MethodCard, step: number): string[] {
  const stepText = card.methodSteps[step] ?? ''
  if (/对象|系统|圈/.test(stepText)) return ['物体 A', '物体 B', '整个系统', '我不确定']
  if (/受力|外力|冲量/.test(stepText)) return ['只受重力', '受多个力', '外力可忽略', '我不确定']
  if (/方向|正方向/.test(stepText)) return ['向右为正', '向左为正', '向下为正', '我不确定']
  if (/守恒|动量|方程/.test(stepText)) return ['守恒成立', '不守恒', '需要更多条件', '我不确定']
  return ['继续推进', '我先想想', '需要提示', '看完整解析']
}

function Coach({ tutor, session, draft, setDraft, send, step, setStep, card, isThinking, setView, diagnosis }: { tutor: Tutor; session: Session; draft: string; setDraft: (s: string) => void; send: (s: string) => void; step: number; setStep: (n: number) => void; card: MethodCard; isThinking: boolean; setView: (v: StudentView) => void; diagnosis: Diagnosis }) {
  const safeStep = Math.min(step, card.methodSteps.length - 1)
  const current = card.methodSteps[safeStep]
  const choices = choicesForStep(card, safeStep)
  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <img className="topbar-avatar" src={tutor.avatar} alt={tutor.name} />
          <div>
            <p className="eyebrow">{tutor.subject} · {tutor.name}</p>
            <h1>{tutor.title}</h1>
          </div>
        </div>
        <div className="topbar-right">
          <span className="status-pill"><ShieldCheck size={12} /> 已购买</span>
          <button className="ghost-btn" onClick={() => setView('summary')}>完成本题</button>
        </div>
      </header>
      <section className="coach-layout">
        <main className="step-panel">
          <div className="problem-banner">
            <span>本题</span>
            <p>{diagnosis.text}</p>
          </div>

          {/* 步骤进度条 */}
          <div className="step-progress">
            {card.methodSteps.map((_, i) => (
              <span key={i} className={i === safeStep ? 'active' : i < safeStep ? 'done' : ''} />
            ))}
          </div>

          <span className="step-pill">当前步骤 {safeStep + 1}/{card.methodSteps.length} · 该你了</span>
          <h2>{current}</h2>
          <p>这道题先别急着套公式。你觉得这一步应该怎么判断？</p>

          <div className="choice-grid">
            {choices.map((c) => (
              <button key={c} onClick={() => send(`我选：${c}`)}>{c}</button>
            ))}
          </div>

          <div className="guide-actions">
            <button onClick={() => send(`请提示我${current}`)}><Lightbulb size={14} /> 提示一下</button>
            <button
              onClick={() => setStep(Math.min(safeStep + 1, card.methodSteps.length - 1))}
              disabled={safeStep >= card.methodSteps.length - 1}
            >
              继续下一步
            </button>
            <button onClick={() => send('看完整解析')}><BookOpen size={14} /> 看完整解析</button>
            <button onClick={() => send('我来试试')}><Pencil size={14} /> 我来试试</button>
          </div>

          <div className="chat-mini">
            {session.messages.map((m) => (
              <div className={`chat-row ${m.role}`} key={m.id}>
                {m.role === 'teacher' && <img className="chat-avatar" src={tutor.avatar} alt={tutor.name} />}
                <div className="chat-bubble">{m.content}</div>
              </div>
            ))}
            {isThinking && (
              <div className="chat-row teacher">
                <img className="chat-avatar" src={tutor.avatar} alt={tutor.name} />
                <div className="chat-bubble typing-bubble"><span /><span /><span /></div>
              </div>
            )}
          </div>

          <div className="composer-box">
            <label className="upload-button"><Camera size={16} /> 拍题</label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft) } }}
              placeholder="输入你的想法，按 Enter 发送…"
            />
            <button className="send-button" onClick={() => send(draft)} disabled={!draft.trim()}>
              <Send size={14} /> 发送
            </button>
          </div>
        </main>

        <aside className="path-card">
          <strong>本题路径</strong>
          {card.methodSteps.map((x, i) => (
            <span
              className={i === safeStep ? 'active' : i < safeStep ? 'done' : ''}
              key={x}
              onClick={() => setStep(i)}
            >
              {i + 1}. {x}
              {i < safeStep && <CheckCircle2 size={12} />}
            </span>
          ))}
          <div className="path-error">
            <p className="eyebrow">这一步常见错误</p>
            <p>{card.commonError}</p>
          </div>
          <button onClick={() => setView('summary')}>完成并生成总结</button>
        </aside>
      </section>
    </>
  )
}
function Summary({diagnosis,card,setView}:{diagnosis:Diagnosis;card:MethodCard;setView:(v:StudentView)=>void}){return <section className="flow-page"><p className="eyebrow">学习总结</p><h1>本题你学会了什么</h1><div className="summary-grid"><div className="student-summary"><strong>学生总结</strong><p><b>知识点：</b>{card.topic}</p><p><b>关键路径：</b>{card.methodSteps.join(' → ')}</p><p><b>刚才卡点：</b>{card.commonError}</p><p><b>下一步建议：</b>再练 2 道同类题。</p></div><div className="parent-summary-card"><div className="ps-eyebrow"><span className="dot-amber"/> 本题家长摘要 · 待发送</div><div className="ps-head"><div><strong>小明 · 4 月 26 日 · 高中物理</strong></div><div className="ps-meta">由 <b>{card.topic}方法库</b> 引导<br/>用时 8 分钟 · {card.methodSteps.length} 步走完</div></div><div className="ps-headline">这道题主要卡在 <em>{diagnosis.stuck[0]}</em>。</div><div className="ps-kv"><div className="k">影响范围</div><div className="v">牛顿第二定律 · 动量 · 能量综合题</div></div><div className="ps-kv"><div className="k">下一步建议</div><div className="v">练 <b>3 道「研究对象选择」专项题</b>，重点训练第一步判断。</div></div><div className="ps-foot"><span>识别置信度 92%</span><span>第 12 次诊断</span><span>本周 5 次对话</span></div><div className="ps-cta"><button className="ps-pri"><Mail size={14}/> 发送给家长</button><button className="ps-ghost">复制摘要</button></div></div></div><button className="next" onClick={()=>setView('pricing')}>继续使用</button></section>}
function Pricing({ tutor, setView }: { tutor: Tutor; setView: (v: StudentView) => void }) {
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
          <button className="ghost" onClick={() => setView('home')}>开通月卡</button>
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
          <button onClick={() => setView('home')}>开通年卡</button>
        </div>
      </div>

      <div className="pricing-trust">
        <ShieldCheck size={16} />
        <span>所有订阅均经家长账户支付，未成年人无法独立完成订阅。</span>
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
    { id: 'methods', label: '我的讲题方法', Icon: Layers },
    { id: 'review', label: '审核 AI 回答', Icon: ClipboardCheck },
    { id: 'records', label: '学生问题记录', Icon: ListChecks },
    { id: 'publish', label: '发布到学生端', Icon: Workflow },
    { id: 'quality', label: '质量设置', Icon: ShieldCheck },
  ]

  return (
    <main className="app-shell teacher-site">
      <aside className="sidebar">
        <div className="brand"><img className="brand-mark-img" src="/logo-mark.svg" alt="" /><div><strong>老师工作台</strong><span>训练我的 AI 分身</span></div></div>
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
            </div>
          </section>
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
  const [purchasedIds, setPurchasedIds] = useState<string[]>([liuTutor.id])
  const [showSettings, setShowSettings] = useState(false)
  const [diagnosis, setDiagnosis] = useState<Diagnosis>(defaultDiagnosis)
  const [draft, setDraft] = useState('')
  const [step, setStep] = useState(0)
  const [isThinking, setIsThinking] = useState(false)
  const [cards, setCards] = useState<MethodCard[]>(() => {
    try {
      const stored = localStorage.getItem(METHOD_CARD_STORAGE_KEY)
      return stored ? (JSON.parse(stored) as MethodCard[]) : seedHighSchoolCards
    } catch {
      return seedHighSchoolCards
    }
  })
  const [answerReviews, setAnswerReviews] = useState<AnswerReview[]>(() => {
    try {
      const stored = localStorage.getItem(ANSWER_REVIEW_STORAGE_KEY)
      return stored ? (JSON.parse(stored) as AnswerReview[]) : []
    } catch {
      return []
    }
  })
  const [sessions, setSessions] = useState<Session[]>([
    { id: 's1', title: '动量守恒判断', messages: [firstMessage] },
  ])
  const [activeSessionId, setActiveSessionId] = useState('s1')

  useEffect(() => localStorage.setItem(METHOD_CARD_STORAGE_KEY, JSON.stringify(cards)), [cards])
  useEffect(() => localStorage.setItem(ANSWER_REVIEW_STORAGE_KEY, JSON.stringify(answerReviews)), [answerReviews])

  const availableTutors = tutors
    .filter((t) => t.subject === selectedSubject)
    .map((t) => ({ ...t, purchased: purchasedIds.includes(t.id) }))
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0]
  const methodCard = findMethodCard(diagnosis.text, cards)
  const recommendedTutor = tutors.find((t) => t.id === liuTutor.id) ?? defaultTutor

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
    setStudentView('coach')
  }

  const sendQuestion = async (question: string) => {
    const text = question.trim()
    if (!text) return
    const studentMessage: Message = { id: crypto.randomUUID(), role: 'student', content: text, time: fmt() }
    setMessages((current) => [...current, studentMessage])
    setDraft('')
    setIsThinking(true)
    const card = findMethodCard(text, cards)
    const result = await generateAnswerWithProvider({ question: text, methodCard: card })
    setAnswerReviews((current) => [createAnswerReview(text, result.answer, card), ...current].slice(0, 50))
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'teacher', content: result.answer, time: fmt(), tags: [card.topic] },
    ])
    setIsThinking(false)
  }

  const purchaseTutor = (tutor: Tutor) => {
    setPurchasedIds((current) => [...new Set([...current, tutor.id])])
    setSelectedTutor({ ...tutor, purchased: true })
  }

  if (appView === 'welcome') return <Welcome go={setAppView} />
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
          <img className="brand-mark-img" src="/logo-mark.svg" alt="" />
          <div>
            <strong>PhysicsPath</strong>
            <span>跟刘老师练物理</span>
          </div>
        </div>
        <button className="new-chat" type="button" onClick={createSession}>
          <Pencil size={14} /> 新建拍题
        </button>
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
              <span>已订阅刘老师</span>
            </div>
          </div>
          <button className="gear-button" type="button" onClick={() => setShowSettings(true)}>
            <SettingsIcon size={16} /> 设置
          </button>
        </div>
      </aside>
      {showSettings && <Settings close={() => setShowSettings(false)} setStudent={setStudentView} setApp={setAppView} />}
      <section className="workspace">
        {studentView === 'home' && <StudentHome tutor={selectedTutor} setView={setStudentView} />}
        {studentView === 'subjects' && <SubjectSelect selected={selectedSubject} setSelected={setSelectedSubject} setView={setStudentView} />}
        {studentView === 'teachers' && <TeacherList list={availableTutors} setPreview={setPreviewTutor} setView={setStudentView} />}
        {studentView === 'teacherDetail' && <TutorDetail tutor={previewTutor} back={() => setStudentView('teachers')} buy={() => { purchaseTutor(previewTutor); setStudentView('trial') }} enter={() => { setSelectedTutor(previewTutor); setStudentView('coach') }} />}
        {studentView === 'capture' && <Capture setDiagnosis={setDiagnosis} setView={setStudentView} />}
        {studentView === 'confirm' && <Confirm diagnosis={diagnosis} setDiagnosis={setDiagnosis} setView={setStudentView} />}
        {studentView === 'diagnosis' && <DiagnosisPage diagnosis={diagnosis} tutor={recommendedTutor} setPreview={setPreviewTutor} setView={setStudentView} />}
        {studentView === 'trial' && <Trial tutor={previewTutor} setTutor={setSelectedTutor} setView={setStudentView} />}
        {studentView === 'coach' && <Coach tutor={selectedTutor} session={activeSession} draft={draft} setDraft={setDraft} send={sendQuestion} step={step} setStep={setStep} card={methodCard} isThinking={isThinking} setView={setStudentView} diagnosis={diagnosis} />}
        {studentView === 'summary' && <Summary diagnosis={diagnosis} card={methodCard} setView={setStudentView} />}
        {studentView === 'pricing' && <Pricing tutor={selectedTutor} setView={setStudentView} />}
      </section>
    </main>
  )
}

export default App
