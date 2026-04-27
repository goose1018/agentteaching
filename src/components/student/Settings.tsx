import { Eye, Flag, GraduationCap } from 'lucide-react'
import type { StudentView } from '../../types'

export interface SettingsProps {
  close: () => void
  setStudent: (v: StudentView) => void
  resetDemo: () => void
  switchToNew: () => void
  switchToPaid: () => void
  logout: () => void
}

export function Settings({ close, setStudent, resetDemo, switchToNew, switchToPaid, logout }: SettingsProps) {
  return (
    <div className="settings-modal" onClick={close}>
      <div className="settings-card" onClick={(e) => e.stopPropagation()}>
        <header><strong>设置</strong><button className="close" onClick={close}>关闭</button></header>
        <button onClick={() => { close(); setStudent('teachers') }}><GraduationCap size={14} /> 切换老师</button>
        <div className="settings-section-title">演示模式</div>
        <button onClick={() => { close(); switchToNew() }}><Eye size={14} /> 切换为新用户演示</button>
        <button onClick={() => { close(); switchToPaid() }}><Eye size={14} /> 切换为老用户演示</button>
        <button onClick={() => { close(); resetDemo() }}><Flag size={14} /> 重置演示数据</button>
        <button className="danger" onClick={() => { close(); logout() }}><Flag size={14} /> 退出登录</button>
      </div>
    </div>
  )
}
