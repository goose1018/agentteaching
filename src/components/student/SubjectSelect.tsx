import { subjects } from '../../data/defaults'
import type { StudentView } from '../../types'

export interface SubjectSelectProps {
  selected: string
  setSelected: (s: string) => void
  setView: (v: StudentView) => void
}

export function SubjectSelect({ selected, setSelected, setView }: SubjectSelectProps) {
  return (
    <section className="selection-page">
      <p className="eyebrow">选择科目</p>
      <h1>今天想练哪一科？</h1>
      <div className="subject-grid">
        {subjects.map((s) => (
          <button
            className={selected === s.name ? 'active' : ''}
            key={s.name}
            onClick={() => { setSelected(s.name); setView('teachers') }}
          >
            <span className="subject-icon">{s.icon}</span>
            <strong>{s.name}</strong>
            <span>{s.status}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
