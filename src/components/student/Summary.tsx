import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock, Copy, Mail } from 'lucide-react'
import { getAiClient, type StudySummaryResult } from '../../api/aiClient'
import type { MethodCard } from '../../domain'
import type { Diagnosis, StudentView } from '../../types'

export interface SummaryProps {
  diagnosis: Diagnosis
  card: MethodCard
  setView: (v: StudentView) => void
  conversation: Array<{ role: 'student' | 'teacher'; content: string }>
}

export function Summary({ diagnosis, card, setView, conversation }: SummaryProps) {
  const [summary, setSummary] = useState<StudySummaryResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getAiClient().generateSummary({
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
