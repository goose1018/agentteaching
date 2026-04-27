import { CheckCircle2, PencilLine } from 'lucide-react'
import type { Diagnosis, StudentView } from '../../types'

export interface ConfirmProps {
  diagnosis: Diagnosis
  setDiagnosis: (d: Diagnosis) => void
  setView: (v: StudentView) => void
}

export function Confirm({ diagnosis, setDiagnosis, setView }: ConfirmProps) {
  const lowConf = diagnosis.confidence < 0.8
  return (
    <section className="flow-page">
      <p className="eyebrow">题干确认</p>
      <h1>我识别到的题目</h1>
      <div className="flow-card">
        {lowConf && (
          <div className="confirm-warning">
            <strong>识别置信度只有 {Math.round(diagnosis.confidence * 100)}%</strong>
            <span>请先核对题干和数字，必要时重新拍一张更清晰的照片再继续。</span>
          </div>
        )}
        <div className="confirm-grid">
          <span>学科：{diagnosis.subject}</span>
          <span>题型：{diagnosis.type}</span>
          <span>难度：{diagnosis.difficulty}</span>
          <span>置信度：{Math.round(diagnosis.confidence * 100)}%</span>
        </div>
        <label>
          题干
          <textarea value={diagnosis.text} onChange={(e) => setDiagnosis({ ...diagnosis, text: e.target.value })} />
        </label>
        <button onClick={() => setView('coach')}>
          <CheckCircle2 size={16} /> 识别正确，开始陪练
        </button>
        <button className="ghost"><PencilLine size={16} /> 有错误，我来修改</button>
      </div>
    </section>
  )
}
