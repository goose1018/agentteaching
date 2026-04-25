import { useEffect, useState } from 'react'
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

type AppView = 'welcome' | 'student' | 'teacher'
type StudentView = 'home' | 'capture' | 'confirm' | 'diagnosis' | 'trial' | 'coach' | 'summary' | 'pricing' | 'subjects' | 'teachers' | 'teacherDetail'
type Role = 'student' | 'teacher'

interface Message { id: string; role: Role; content: string; time: string; tags?: string[] }
interface Session { id: string; title: string; messages: Message[] }
interface Subject { name: string; icon: string; status: string }
interface Tutor { id: string; name: string; subject: string; title: string; fit: string; specialties: string[]; style: string; schoolTag: string; years: string; result: string; bio: string; month: number; year: number; rating: number; students: number; purchased: boolean }
interface Diagnosis { text: string; subject: string; type: string; difficulty: string; confidence: number; imageInfo: string; stuck: string[] }

const subjects: Subject[] = [
  ['高中物理','F','已开通'], ['高中数学','∑','内测中'], ['高中化学','H₂','内测中'], ['高中生物','DNA','内测中'], ['高中语文','文','即将开放'], ['高中英语','EN','即将开放'], ['高中政治','政','招募老师中'], ['高中历史','史','招募老师中'], ['高中地理','Geo','招募老师中'],
].map(([name, icon, status]) => ({ name, icon, status }))
const names = ['刘振华','陈书远','郭澈','赵明哲','孙佳怡','林清扬','王思宁','周慎之','黄景行','唐绍棠']
const specs: Record<string,string[]> = {
  高中物理:['解题路径','力学模型','电磁综合','实验探究','压轴题拆解'], 高中数学:['函数导数','圆锥曲线','立体几何','数列递推','压轴题策略'], 高中化学:['反应原理','电化学','实验推断','有机合成','平衡移动'], 高中生物:['遗传推断','代谢过程','实验设计','图表分析','选择题纠错'], 高中语文:['现代文阅读','作文结构','古诗鉴赏','文言断句','材料作文'], 高中英语:['阅读定位','完形逻辑','续写结构','语法填空','作文升级'], 高中政治:['主观题骨架','材料提取','关键词踩点','经济模块','哲学逻辑'], 高中历史:['时空定位','材料题分析','因果链条','大题模板','史观表达'], 高中地理:['区域定位','自然地理','人文地理','综合题路径','图像判读'],
}
const tutors: Tutor[] = subjects.flatMap((s, si) => names.map((n, i) => {
  const sp = specs[s.name][i % 5]
  const month = 99 + ((i + si) % 5) * 10
  return { id:`${s.name}-${i}`, name:n, subject:s.name, title:`${s.name} · ${sp}`, fit:i%2===0?'听课能懂，但一做题就不知道从哪下手的学生':'基础还可以，但综合题经常丢步骤分的学生', specialties:[sp, specs[s.name][(i+1)%5], specs[s.name][(i+2)%5]], style:i%3===0?'先建模，再列式；不背模板，训练解题路径':i%3===1?'先抓关键词，再拆条件；讲题节奏清楚':'用错因反推知识漏洞，适合复盘错题', schoolTag:i%3===0?'省重点高中退役骨干教师':i%3===1?'前五大名校体系教师':'本地名师工作室主讲', years:`教龄 ${9 + ((i*3+si)%17)} 年`, result:s.name==='高中数学'?'多位学生高考数学 145+':s.name==='高中物理'?'多届学生高考物理 90+':`多年${s.name.replace('高中','')}一轮与二轮复习经验`, bio:`我是${n}，主讲${s.name}的${sp}。我的课不追求堆技巧，而是先把题目的底层逻辑讲清楚，再让学生用同一套方法处理同类题。`, month, year:month*8, rating:Number((4.6+((i+si)%4)*0.1).toFixed(1)), students:86+i*18+si*7, purchased:s.name==='高中物理' && i===0 }
}))
const defaultTutor = tutors.find(t => t.purchased) ?? tutors[0]
const defaultDiagnosis: Diagnosis = { text:'光滑水平面上，小车 A 与小车 B 发生碰撞，碰后粘在一起运动。已知两车质量和碰前速度，求碰后共同速度。', subject:'高中物理', type:'动量守恒 · 碰撞后共同速度', difficulty:'中等', confidence:0.92, imageInfo:'两个物体连接，水平面运动，涉及碰撞前后速度。', stuck:['没有先选研究对象','把某个力直接当成合外力','不知道什么时候列动量守恒方程'] }
const firstMessage: Message = { id:'m1', role:'teacher', content:'把题发上来。先别急着找公式，物理题先看对象、过程和条件；这三样看清楚，公式自然会出来。', time:'09:41', tags:['高中物理','解题路径'] }
const fmt = () => new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit'}).format(new Date())

function Welcome({go}:{go:(v:AppView)=>void}){return <main className="welcome-page"><header className="welcome-nav"><div className="nav-brand"><div className="brand-mark">P</div><strong>PhysicsPath</strong></div></header><section className="welcome-hero"><div><span className="hero-kicker">名师 AI 解题教练</span><h1>不是搜答案，而是训练你怎么想题。</h1><p>拍一道题，AI 老师会先识别题型，再按老师的方法一步步带你分析。</p><div className="hero-actions"><button onClick={()=>go('student')}>我是学生，开始学习</button><button className="secondary" onClick={()=>go('teacher')}>我是老师，训练我的 AI 分身</button></div><small>演示版可在设置中切换学生端 / 教师端</small></div><div className="welcome-illustration"><div>拍题</div><span/><div>诊断</div><span/><div>分步引导</div></div></section></main>}
function Settings({close,setStudent,setApp}:{close:()=>void;setStudent:(v:StudentView)=>void;setApp:(v:AppView)=>void}){return <div className="settings-modal" onClick={close}><div className="settings-card" onClick={e=>e.stopPropagation()}><header><strong>设置</strong><button onClick={close}>关闭</button></header><button onClick={()=>{close();setStudent('subjects')}}>切换科目</button><button onClick={()=>{close();setStudent('teachers')}}>切换老师</button><button>历史订单</button><button>评价反馈</button><button onClick={()=>{close();setApp('teacher')}}>切换到教师端 Demo</button><button className="danger" onClick={()=>{close();setApp('welcome')}}>退出登录</button></div></div>}
function StudentHome({tutor,setView}:{tutor:Tutor;setView:(v:StudentView)=>void}){return <section className="student-home"><p className="eyebrow">学习驾驶舱</p><h1>欢迎回来，继续跟{tutor.name}练物理</h1><div className="dashboard-grid"><div className="main-task"><span>主任务</span><h2>拍一道不会的题</h2><p>AI 老师会先识别学科和题型，再匹配合适的老师方法。</p><button onClick={()=>setView('capture')}>拍题诊断</button><button className="ghost" onClick={()=>setView('coach')}>输入题目</button></div><div className="dashboard-card"><span>我的老师</span><h3>{tutor.name} · {tutor.title}</h3><p>本周诊断 12 道题，常见卡点：研究对象选择、合外力判断。</p><button onClick={()=>setView('coach')}>继续上次对话</button></div><div className="dashboard-card"><span>最近学习摘要</span><h3>本周学习报告</h3><p>已诊断 12 道题，高频卡点：牛顿第二定律、动量守恒。建议练连接体问题 3 道。</p><button onClick={()=>setView('summary')}>查看本周报告</button></div></div><div className="mini-subjects">{subjects.map(s=><button key={s.name} onClick={()=>setView('subjects')}><strong>{s.name}</strong><span>{s.status}</span></button>)}</div></section>}
function SubjectSelect({selected,setSelected,setView}:{selected:string;setSelected:(s:string)=>void;setView:(v:StudentView)=>void}){return <section className="selection-page"><p className="eyebrow">选择科目</p><h1>今天想练哪一科？</h1><div className="subject-grid">{subjects.map(s=><button className={selected===s.name?'active':''} key={s.name} onClick={()=>{setSelected(s.name);setView('teachers')}}><span className="subject-icon">{s.icon}</span><strong>{s.name}</strong><span>{s.status}</span></button>)}</div></section>}
function TeacherList({list,setPreview,setView}:{list:Tutor[];setPreview:(t:Tutor)=>void;setView:(v:StudentView)=>void}){const rail=(title:string,arr:Tutor[]) => <div className="teacher-rail"><h2>{title}</h2><div className="teacher-grid-cards">{arr.length===0&&<div className="empty-tip">暂无已购买老师，可以先看下方老师介绍。</div>}{arr.map(t=><button className={`teacher-card ${t.purchased?'purchased':'locked'}`} key={t.id} onClick={()=>{setPreview(t);setView('teacherDetail')}} title={`${t.schoolTag} · ${t.years} · ${t.result}`}><div className="tutor-avatar">{t.name[0]}</div><strong>{t.name}</strong><p>{t.title}</p><em>{t.fit}</em><div className="teacher-tags">{t.specialties.map(x=><span key={x}>{x}</span>)}</div><span className="tutor-price">¥{t.month}/月 · ¥{t.year}/年</span></button>)}</div></div>;return <section className="selection-page"><p className="eyebrow">选择老师</p><h1>选择你的解题教练</h1>{rail('已购买',list.filter(t=>t.purchased))}{rail('更多老师',list.filter(t=>!t.purchased))}</section>}
function TutorDetail({tutor,buy,enter,back}:{tutor:Tutor;buy:()=>void;enter:()=>void;back:()=>void}){return <section className="selection-page tutor-detail"><button className="back-link" onClick={back}>← 返回老师列表</button><div className="tutor-detail-card"><div className="tutor-avatar large">{tutor.name[0]}</div><div><p className="eyebrow">{tutor.subject}</p><h1>{tutor.name}</h1><p className="tutor-subline">{tutor.title} · {tutor.schoolTag}</p><p className="tutor-bio">{tutor.bio}</p><div className="tutor-meta"><span>{tutor.fit}</span><span>{tutor.years}</span><span>{tutor.result}</span><span>家长评分 {tutor.rating}</span><span>{tutor.students} 名学生使用</span></div><div className="sample-box"><strong>试看样例</strong><p>学生：动量守恒什么时候能用？</p><p>{tutor.name}：先别急着背公式。你先看三件事：研究系统是谁？外力冲量能不能忽略？过程是不是短时间相互作用？</p></div><div className="tutor-price-row"><strong>¥{tutor.month}/月</strong><span>¥{tutor.year}/年</span></div><div className="tutor-actions">{tutor.purchased?<button onClick={enter}>进入对话</button>:<><button onClick={buy}>免费试看</button><button className="ghost">查看套餐</button></>}</div></div></div></section>}
function Capture({setDiagnosis,setView}:{setDiagnosis:(d:Diagnosis)=>void;setView:(v:StudentView)=>void}){return <section className="flow-page"><p className="eyebrow">拍题诊断</p><h1>拍下你不会的题</h1><div className="flow-card"><p>建议只拍一道题，保证题干和图像完整。如果有图，请把图一起拍进去。</p><button onClick={()=>{const r=recognizeProblemImage('physics-demo.png');setDiagnosis({...defaultDiagnosis,text:r.text,confidence:r.confidence});setView('confirm')}}>拍照</button><button onClick={()=>setView('confirm')}>从相册选择</button><textarea placeholder="也可以手动输入题目" onChange={e=>setDiagnosis({...defaultDiagnosis,text:e.target.value})}/></div></section>}
function Confirm({diagnosis,setDiagnosis,setView}:{diagnosis:Diagnosis;setDiagnosis:(d:Diagnosis)=>void;setView:(v:StudentView)=>void}){return <section className="flow-page"><p className="eyebrow">题干确认</p><h1>我识别到的题目</h1><div className="flow-card"><div className="confirm-grid"><span>学科：{diagnosis.subject}</span><span>题型：{diagnosis.type}</span><span>难度：{diagnosis.difficulty}</span><span>置信度：{Math.round(diagnosis.confidence*100)}%</span></div><label>题干<textarea value={diagnosis.text} onChange={e=>setDiagnosis({...diagnosis,text:e.target.value})}/></label><p>图像信息：{diagnosis.imageInfo}</p><button onClick={()=>setView('diagnosis')}>识别正确，继续</button><button className="ghost">有错误，我来修改</button></div></section>}
function DiagnosisPage({diagnosis,tutor,setView,setPreview}:{diagnosis:Diagnosis;tutor:Tutor;setView:(v:StudentView)=>void;setPreview:(t:Tutor)=>void}){return <section className="flow-page"><p className="eyebrow">诊断预览</p><h1>这道题的常见卡点</h1><div className="flow-card"><ol>{diagnosis.stuck.map(x=><li key={x}>{x}</li>)}</ol><div className="recommend-card"><strong>推荐老师：{tutor.name}</strong><span>{tutor.title}</span><p>适合：{tutor.fit}</p></div><button onClick={()=>{setPreview(tutor);setView('trial')}}>免费试看{tutor.name}讲这道题</button><button className="ghost" onClick={()=>setView('teachers')}>查看更多老师</button></div></section>}
function Trial({tutor,setTutor,setView}:{tutor:Tutor;setTutor:(t:Tutor)=>void;setView:(v:StudentView)=>void}){return <section className="flow-page"><p className="eyebrow">试看说明</p><h1>{tutor.name}不会直接给答案</h1><div className="flow-card"><p>它会先带你判断题型、选研究对象、画关键关系，再一步步推到答案。</p><button onClick={()=>{setTutor(tutor);setView('coach')}}>开始试看</button></div></section>}
function Coach({tutor,session,draft,setDraft,send,step,setStep,card,isThinking,setView}:{tutor:Tutor;session:Session;draft:string;setDraft:(s:string)=>void;send:(s:string)=>void;step:number;setStep:(n:number)=>void;card:MethodCard;isThinking:boolean;setView:(v:StudentView)=>void}){const current=card.methodSteps[Math.min(step,card.methodSteps.length-1)];return <><header className="topbar"><div><p className="eyebrow">{tutor.subject} · {tutor.name}</p><h1>{tutor.title}训练中</h1></div><span className="status-pill">已购买</span></header><section className="coach-layout"><main className="step-panel"><span>当前步骤 {step+1}/{card.methodSteps.length}</span><h2>{current}</h2><p>这道题先别急着套公式。你觉得这一步应该怎么判断？</p><div className="choice-grid"><button>物体 A</button><button>物体 B</button><button>整体系统</button><button>我不确定</button></div><div className="guide-actions"><button onClick={()=>send(`请提示我${current}`)}>提示一下</button><button onClick={()=>setStep(Math.min(step+1,card.methodSteps.length-1))}>继续下一步</button><button onClick={()=>send('看完整解析')}>看完整解析</button><button onClick={()=>send('我来试试')}>我来试试</button></div><div className="chat-mini">{session.messages.map(m=><div className={m.role} key={m.id}>{m.content}</div>)}{isThinking&&<div className="teacher">正在思考...</div>}</div><div className="composer-box"><label className="upload-button">拍题</label><textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="输入你的想法..."/><button className="send-button" onClick={()=>send(draft)}>发送</button></div></main><aside className="path-card"><strong>本题路径</strong>{card.methodSteps.map((x,i)=><span className={i===step?'active':''} key={x}>{i+1}. {x}</span>)}<button onClick={()=>setView('summary')}>完成并生成总结</button></aside></section></>}
function Summary({diagnosis,card,setView}:{diagnosis:Diagnosis;card:MethodCard;setView:(v:StudentView)=>void}){return <section className="flow-page"><p className="eyebrow">学习总结</p><h1>本题你学会了什么</h1><div className="summary-grid"><div><strong>学生总结</strong><p>知识点：{card.topic}</p><p>关键路径：{card.methodSteps.join(' → ')}</p><p>刚才卡点：{card.commonError}</p><p>下一步建议：再练 2 道同类题。</p></div><div><strong>给家长看的本题摘要</strong><p>孩子本题主要卡在：{diagnosis.stuck[0]}。</p><p>这类问题会影响：牛顿第二定律、动量、能量综合题。</p><p>建议：接下来练 3 道“研究对象选择”专项题。</p></div></div><button onClick={()=>setView('pricing')}>继续使用</button></section>}
function Pricing({tutor,setView}:{tutor:Tutor;setView:(v:StudentView)=>void}){return <section className="flow-page"><p className="eyebrow">开通老师陪练</p><h1>继续使用{tutor.name}老师</h1><div className="pricing-grid"><div><span>月卡</span><strong>¥{tutor.month}/月</strong><p>每月 120 次拍题诊断，30 次深度讲解，每周学习报告。</p><button onClick={()=>setView('home')}>开通月卡</button></div><div className="recommended"><span>推荐 年卡</span><strong>¥{tutor.year}/年</strong><p>全年 1500 次拍题诊断，400 次深度讲解，每周学习报告，优先使用新方法库。</p><button onClick={()=>setView('home')}>开通年卡</button></div></div></section>}

function TeacherApp(){return <main className="app-shell teacher-site"><section className="workspace"><div className="flow-page"><h1>训练你的 AI 分身</h1><p>讲一道典型题 → AI 提取你的讲题方法 → 你审核后发布给学生。</p></div></section></main>}

function App() {
  const [appView, setAppView] = useState<AppView>('welcome')
  const [studentView, setStudentView] = useState<StudentView>('home')
  const [selectedSubject, setSelectedSubject] = useState('高中物理')
  const [selectedTutor, setSelectedTutor] = useState<Tutor>(defaultTutor)
  const [previewTutor, setPreviewTutor] = useState<Tutor>(defaultTutor)
  const [purchasedIds, setPurchasedIds] = useState<string[]>(['高中物理-0'])
  const [showSettings, setShowSettings] = useState(false)
  const [diagnosis, setDiagnosis] = useState<Diagnosis>(defaultDiagnosis)
  const [draft, setDraft] = useState('')
  const [step, setStep] = useState(0)
  const [isThinking, setIsThinking] = useState(false)
  const [cards] = useState<MethodCard[]>(seedHighSchoolCards)
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
  const recommendedTutor = tutors.find((t) => t.id === '高中物理-0') ?? defaultTutor

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
    return <TeacherApp />
  }

  return (
    <main className="app-shell student-site">
      <aside className="sidebar">
        <div className="brand"><div className="user-avatar">小</div><strong>同学好</strong></div>
        <button className="new-chat" type="button" onClick={createSession}>+ 新建对话</button>
        <div className="sidebar-section">
          <span className="section-title">历史会话</span>
          {sessions.map((session) => (
            <button className={`session-item ${session.id === activeSessionId ? 'active' : ''}`} key={session.id} type="button" onClick={() => { setActiveSessionId(session.id); setStudentView('coach') }}>
              <span>{session.title}</span>
            </button>
          ))}
        </div>
        <button className="gear-button" type="button" onClick={() => setShowSettings(true)}>⚙ 设置</button>
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
        {studentView === 'coach' && <Coach tutor={selectedTutor} session={activeSession} draft={draft} setDraft={setDraft} send={sendQuestion} step={step} setStep={setStep} card={methodCard} isThinking={isThinking} setView={setStudentView} />}
        {studentView === 'summary' && <Summary diagnosis={diagnosis} card={methodCard} setView={setStudentView} />}
        {studentView === 'pricing' && <Pricing tutor={selectedTutor} setView={setStudentView} />}
      </section>
    </main>
  )
}

export default App
