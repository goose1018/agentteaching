import { Tex } from '../shared/Tex'
import type { MethodCard } from '../../domain'

export interface MethodCardDetailProps {
  card: MethodCard
  back: () => void
  tryIt: () => void
}

export function MethodCardDetail({ card, back, tryIt }: MethodCardDetailProps) {
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
