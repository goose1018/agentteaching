import { Camera } from 'lucide-react'
import { subjects } from '../../data/defaults'
import type { StudentView, Tutor } from '../../types'

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

export interface StudentHomeProps {
  tutor: Tutor
  setView: (v: StudentView) => void
  onStartNew: () => void
}

export function StudentHome({ tutor, setView, onStartNew }: StudentHomeProps) {
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
