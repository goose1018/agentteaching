import { SealSquare } from '../shared/StampSeal'
import type { StudentView, Tutor } from '../../types'

export interface TeacherListProps {
  list: Tutor[]
  setPreview: (t: Tutor) => void
  setView: (v: StudentView) => void
}

export function TeacherList({ list, setPreview, setView }: TeacherListProps) {
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
