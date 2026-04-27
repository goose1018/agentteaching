import { CheckCircle2, ShieldCheck } from 'lucide-react'
import type { Tutor } from '../../types'

export interface PricingProps {
  tutor: Tutor
  onSubscribe: (plan: 'month' | 'year') => void
}

export function Pricing({ tutor, onSubscribe }: PricingProps) {
  const monthlyEquiv = Math.round(tutor.year / 12)
  const savings = tutor.month * 12 - tutor.year
  return (
    <section className="flow-page">
      <p className="eyebrow">订阅 {tutor.name} 老师</p>
      <h1>继续陪孩子练物理</h1>
      <p className="page-sub">7 天内不满意全额退款。每条 AI 回答都由老师亲自审核。</p>

      <div className="pricing-grid">
        <div className="price-card">
          <span className="tier">月卡</span>
          <strong>¥{tutor.month}<small>/月</small></strong>
          <ul className="price-features">
            <li><CheckCircle2 size={14} /> 每月 120 次拍题诊断</li>
            <li><CheckCircle2 size={14} /> 30 次深度讲解</li>
            <li><CheckCircle2 size={14} /> 每周学习摘要</li>
            <li><CheckCircle2 size={14} /> 7 天无理由退款</li>
          </ul>
          <button className="ghost" onClick={() => onSubscribe('month')}>开通月卡</button>
        </div>

        <div className="price-card recommended">
          <span className="rec-badge">家长推荐</span>
          <span className="tier">年卡</span>
          <strong>¥{tutor.year}<small>/年</small></strong>
          <p className="price-equiv">折合 ¥{monthlyEquiv}/月 · 省 ¥{savings}</p>
          <ul className="price-features">
            <li><CheckCircle2 size={14} /> 全年 1500 次拍题诊断</li>
            <li><CheckCircle2 size={14} /> 400 次深度讲解</li>
            <li><CheckCircle2 size={14} /> 每周学习摘要 + 月度家长报告</li>
            <li><CheckCircle2 size={14} /> 优先使用新方法库</li>
            <li><CheckCircle2 size={14} /> 7 天无理由退款</li>
          </ul>
          <button onClick={() => onSubscribe('year')}>开通年卡</button>
        </div>
      </div>

      <div className="pricing-trust">
        <ShieldCheck size={16} />
        <span>所有订阅均经家长账户支付，未成年人无法独立完成订阅。</span>
      </div>
    </section>
  )
}
