import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { CheckCircle2, Pencil } from 'lucide-react'
import type { MistakeRecord, MistakeStatus } from '../../domain'

type MistakeFilter = 'all' | 'open' | 'reviewing' | 'mastered'

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

export interface MistakesPageProps {
  mistakes: MistakeRecord[]
  setMistakes: Dispatch<SetStateAction<MistakeRecord[]>>
  openMistake: (m: MistakeRecord) => void
}

export function MistakesPage({ mistakes, setMistakes, openMistake }: MistakesPageProps) {
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
