import { BookOpen, Camera, CheckCircle2, Image as ImageIcon, Lightbulb, Send } from 'lucide-react'
import { Tex } from '../shared/Tex'
import { SealRound } from '../shared/StampSeal'
import type { MethodCard } from '../../domain'
import type { Diagnosis, Evaluation, Session, Tutor } from '../../types'

export interface CoachProps {
  tutor: Tutor
  session: Session
  draft: string
  setDraft: (s: string) => void
  send: (displayText: string, llmText?: string) => void
  step: number
  setStep: (n: number) => void
  card: MethodCard
  isThinking: boolean
  diagnosis: Diagnosis
  onComplete: () => void
  onSwitchProblem: () => void
}

export function Coach({
  tutor,
  session,
  draft,
  setDraft,
  send,
  step,
  setStep,
  card,
  isThinking,
  diagnosis,
  onComplete,
  onSwitchProblem,
}: CoachProps) {
  const safeStep = Math.min(step, card.methodSteps.length - 1)
  const current = card.methodSteps[safeStep]
  const isLastStep = safeStep >= card.methodSteps.length - 1
  const buildActionPrompt = (intent: 'hint' | 'next' | 'solution', targetStep = current) => {
    const instruction = {
      hint: `我需要一个启发式提示。请只围绕第 ${safeStep + 1} 步「${targetStep}」提醒我该先判断什么，不要给完整答案，最后问我一个具体问题。`,
      next: `我准备进入下一步。请围绕第 ${safeStep + 2} 步「${targetStep}」告诉我这一小步要看什么，不要重复上一轮，也不要直接给完整答案。`,
      solution: `我想看完整解析。请先列解题路径，再给关键方程；公式必须用 $...$ 包裹。`,
    }[intent]
    return [
      instruction,
      `题目：${diagnosis.text}`,
      `命中方法卡：${card.topic}`,
      `方法路径：${card.methodSteps.join(' → ')}`,
      `当前步骤：${targetStep}`,
      `常见错误：${card.commonError}`,
      '请直接用老师口吻回答我，不要说“内部意图”“根据方法卡”“你被要求”。',
    ].join('\n')
  }

  return (
    <div className="coach-shell">
      {/* 顶部 sticky 题卡 — 题图 + 题型/难度 + 卡点摘要 + 完成本题 */}
      <header className="coach-question">
        <button className="thumb" type="button" aria-label="放大查看题图">
          <ImageIcon size={28} />
        </button>
        <div className="qmeta">
          <span className="qno">第 3 题 · 2024 朝阳一模 · {tutor.name} 陪练</span>
          <div className="qtags">
            <span className="topic">{card.topic}</span>
            <span className="difficulty">{diagnosis.difficulty}</span>
            <span className="stuck-tag">{diagnosis.stuck.length} 个常见卡点</span>
          </div>
        </div>
        <button className="finish-btn" type="button" onClick={onComplete}>
          完成本题
        </button>
      </header>

      {/* 当前步骤 — 进度条 + 步骤名 + 3 个引导按钮 */}
      <div className="coach-current-step">
        <div className="step-progress">
          {card.methodSteps.map((_, i) => (
            <span key={i} className={i === safeStep ? 'active' : i < safeStep ? 'done' : ''} />
          ))}
        </div>
        <h2 className="current-step-name">
          <span className="step-no">第 {safeStep + 1}/{card.methodSteps.length} 步</span>
          {current}
        </h2>
        <div className="coach-actions">
          <button
            className="ghost"
            type="button"
            onClick={() => send('提示一下', buildActionPrompt('hint'))}
            disabled={isThinking}
          >
            <Lightbulb size={14} /> 提示一下
          </button>
          <button
            className="primary"
            type="button"
            onClick={() => {
              const nextStep = Math.min(safeStep + 1, card.methodSteps.length - 1)
              setStep(nextStep)
              send('好，下一步我该做什么？', buildActionPrompt('next', card.methodSteps[nextStep]))
            }}
            disabled={isLastStep || isThinking}
          >
            下一步 →
          </button>
          <button
            className="ghost"
            type="button"
            onClick={() => send('看完整解析', buildActionPrompt('solution'))}
            disabled={isThinking}
          >
            <BookOpen size={14} /> 看完整解析
          </button>
        </div>
      </div>

      {/* 对话流 */}
      <div className="coach-thread">
        {session.messages.map((m) => {
          if (m.role === 'student') {
            return (
              <div key={m.id} className="coach-bubble user">
                <Tex>{m.content}</Tex>
              </div>
            )
          }
          const evalLabel: Record<NonNullable<Evaluation>, { text: string; cls: string }> = {
            correct: { text: '✓ 想对了 — 这一步过', cls: 'eval-correct' },
            partial: { text: '⚠ 偏了 — 让我提醒一下', cls: 'eval-partial' },
            wrong: { text: '✗ 跟方法卡不一致 — 我们重来', cls: 'eval-wrong' },
          }
          const ev = m.evaluation ? evalLabel[m.evaluation] : null
          return (
            <div key={m.id} className="coach-bubble ai">
              <span className="stamp-mark"><SealRound size={44} rotate={8} /></span>
              <div className="signoff">
                <span className="sig-name">{tutor.name} · 分身</span>
                <span className="sig-tag">v1.2</span>
                {ev && <span className={`eval-badge ${ev.cls}`}>{ev.text}</span>}
              </div>
              <div className="body"><Tex>{m.content}</Tex></div>
              <div className="review">
                <CheckCircle2 className="ico" size={14} />
                <span><b className="by">{tutor.name}</b>方法卡引导</span>
                <span className="when">{m.time}</span>
              </div>
            </div>
          )
        })}
        {isThinking && (
          <div className="coach-bubble ai thinking">
            <div className="signoff">
              <span className="sig-name">{tutor.name} · 分身</span>
              <span className="sig-tag">正在调取方法卡…</span>
            </div>
            <span className="typing-bubble"><span /><span /><span /></span>
          </div>
        )}
      </div>

      {/* 底部 sticky 输入栏 — 拍新题（左小） + 输入框 + 发送（主 CTA） */}
      <div className="coach-input">
        <button
          className="coach-mini-btn"
          type="button"
          aria-label="拍新题"
          onClick={onSwitchProblem}
          title="换一道新题"
        >
          <Camera size={18} />
        </button>
        <input
          type="text"
          className="coach-text-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { e.preventDefault(); send(draft) } }}
          placeholder="说说你这一步的想法… 按 Enter 或点发送"
          disabled={isThinking}
        />
        <button
          className="coach-send-btn"
          type="button"
          aria-label="发送"
          onClick={() => draft.trim() && send(draft)}
          disabled={!draft.trim() || isThinking}
          title="发送"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
