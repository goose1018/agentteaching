import { useMemo } from 'react'
import type { MethodCard } from '../../domain'
import seedMethodCards from '../../seedMethodCards.json'
import { Tex } from '../shared/Tex'

const seedTopicOf = (() => {
  const seedRows = seedMethodCards as Array<{ id: string; topic: string }>
  const byId = new Map(seedRows.map((s) => [s.id, s.topic]))
  return (id: string) => byId.get(id) ?? '其他'
})()

export interface MethodLibraryProps {
  cards: MethodCard[]
  openCard: (id: string) => void
  back: () => void
}

export function MethodLibrary({ cards, openCard, back }: MethodLibraryProps) {
  const grouped = useMemo(() => {
    const buckets = new Map<string, MethodCard[]>()
    cards.filter((c) => c.status === 'approved').forEach((card) => {
      const list = buckets.get(seedTopicOf(card.id)) ?? []
      list.push(card)
      buckets.set(seedTopicOf(card.id), list)
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
                <p><Tex>{card.teacherMove}</Tex></p>
                <span className="library-cta">查看方法 →</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
