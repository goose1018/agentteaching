import { ArrowRight } from 'lucide-react'
import { PortraitAvatar } from '../shared/PortraitAvatar'
import type { Tutor } from '../../types'

export interface NewUserHomeProps {
  tutor: Tutor
  onTryFree: () => void
  onBrowseTutors: () => void
  onViewStory: () => void
  onSubscribe: () => void
}

export function NewUserHome({ tutor, onTryFree, onBrowseTutors, onViewStory, onSubscribe }: NewUserHomeProps) {
  const userName = '小宇'
  const monthlyEquiv = Math.round(tutor.year / 12)
  const savings = tutor.month * 12 - tutor.year

  return (
    <div className="new-user-home">
      <header className="nuh-greet">
        <div>
          <h1>欢迎，<span className="name">{userName}</span></h1>
          <p>从一道你不会的题开始 —— 我们带你看名师怎么想题。</p>
        </div>
        <div className="badge">还没订阅任何老师</div>
      </header>

      {/* 双 CTA */}
      <div className="new-user-cta-grid">
        <button type="button" className="new-user-cta primary" onClick={onTryFree}>
          <div>
            <span className="lead-tag">3 分钟体验</span>
            <h2>拍一道不会的题<br />看看名师独家思路</h2>
            <p>不用注册老师、不用充值。先和 AI 名师走一遍解题思路，看你是不是适合这种节奏。</p>
          </div>
          <div>
            <span className="arrow">立即开始 <ArrowRight size={14} /></span>
          </div>
        </button>

        <button type="button" className="new-user-cta secondary" onClick={onBrowseTutors}>
          <div>
            <h2>先看看有哪些名师分身</h2>
            <p>4 位金牌名师分身正在内测。你可以先看他们的故事和试讲样片，再决定要不要试一道题。</p>
          </div>
          <div>
            <div className="stack">
              <span className="av"><PortraitAvatar variant="a" /></span>
              <span className="av"><PortraitAvatar variant="b" /></span>
              <span className="av"><PortraitAvatar variant="c" /></span>
              <span className="av"><PortraitAvatar variant="d" /></span>
              <span className="num">已上线 4 位 · 持续增加中</span>
            </div>
            <span className="arrow" style={{ marginTop: 14 }}>浏览名师档案 <ArrowRight size={14} /></span>
          </div>
        </button>
      </div>

      {/* 推荐老师 spotlight */}
      <section className="new-user-spotlight">
        <span className="section-eyebrow">本月推荐 · TEACHER OF THE MONTH</span>
        <h2 className="section-title">{tutor.name}分身</h2>
        <p className="section-sub">{tutor.schoolTag} · {tutor.specialties.slice(0, 2).join(' / ')} · 累计带过 200+ 学生</p>

        <div className="spotlight-card">
          <div className="av-large">
            <PortraitAvatar variant="a" className="portrait" />
            <span className="av-tag">在线陪练</span>
          </div>
          <div>
            <div className="meta-line">
              <span>北京 · 重点中学</span><span className="dot" />
              <span>2008–至今</span><span className="dot" />
              <span>专长：力学 · 电磁学</span>
            </div>
            <h3>不是搜答案，是把你脑子里的雾拨开。</h3>
            <blockquote className="quote">
              "我从不直接给你答案。物理题的解法只是一个壳，关键是壳里的那个想法 —— 你只要看见那个想法一次，你就再也不会忘。"
            </blockquote>
            <div className="row">
              <button className="btn primary" type="button" onClick={onViewStory}>
                看老师故事 <ArrowRight size={14} />
              </button>
              <button className="btn ghost" type="button" onClick={onTryFree}>
                ▶ 试讲样片 · 3 分钟
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 信任三要素 */}
      <section className="new-user-trust">
        <div className="trust-item">
          <div className="num">01 · 退款</div>
          <h4>7 天无理由退款</h4>
          <p>第一次订阅后 7 天内不满意，原路退回。不需要解释、不需要客服磨。</p>
        </div>
        <div className="trust-item">
          <div className="num">02 · 名师</div>
          <h4>每位老师都经过审核</h4>
          <p>名师本人参与训练 AI 分身、亲自审稿。不是自动抓取的题库或网课内容。</p>
        </div>
        <div className="trust-item">
          <div className="num">03 · 边界</div>
          <h4>AI 不会直接给答案</h4>
          <p>我们做的是教练，不是搜题工具。AI 引导你想，不替你想。这是产品底线。</p>
        </div>
      </section>

      {/* 透明价格 */}
      <section className="new-user-pricing">
        <header className="pricing-head">
          <div className="left">
            <h3>价格清单</h3>
            <p>不分等级、不限题数、不阶梯涨价。一个价钱，所有名师。</p>
          </div>
          <div className="refund">退款保证 · <b>7 天</b></div>
        </header>
        <div className="pricing-grid">
          <button type="button" className="price-card" onClick={onSubscribe}>
            <div className="label">月付</div>
            <div className="num">
              <span className="y">¥</span>
              <span className="v">{tutor.month}</span>
              <span className="unit">/ 月</span>
            </div>
            <div className="save">灵活订阅、随时取消</div>
            <p className="footnote">第一次订阅享 7 天无理由退款。</p>
          </button>
          <button type="button" className="price-card recommended" onClick={onSubscribe}>
            <div className="label">年付</div>
            <div className="num">
              <span className="y">¥</span>
              <span className="v">{tutor.year}</span>
              <span className="unit">/ 年</span>
            </div>
            <div className="save">折合每月 ¥{monthlyEquiv} · 省 ¥{savings}</div>
            <p className="footnote">第一次订阅享 7 天无理由退款 · 一年陪练高考全程。</p>
          </button>
        </div>
      </section>

      {/* Why us */}
      <section className="new-user-why-us">
        <span className="section-eyebrow">为什么选我们</span>
        <h2 className="section-title">和搜题 App、网课的区别</h2>
        <div className="why-grid">
          <div className="why-item">
            <h4>搜题 App</h4>
            <div className="compare">
              <div className="col them"><span className="tag">Them</span>拍照 → 答案</div>
              <div className="col us"><span className="tag">Us</span>拍照 → 一起想</div>
            </div>
          </div>
          <div className="why-item">
            <h4>录播网课</h4>
            <div className="compare">
              <div className="col them"><span className="tag">Them</span>老师讲、你听</div>
              <div className="col us"><span className="tag">Us</span>老师问、你答</div>
            </div>
          </div>
          <div className="why-item">
            <h4>普通 AI 助手</h4>
            <div className="compare">
              <div className="col them"><span className="tag">Them</span>通用模型 · 给步骤</div>
              <div className="col us"><span className="tag">Us</span>名师方法 · 给思路</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="new-user-footer">
        <div>© 2026 PhysicsPath · 北京</div>
        <div className="links">
          <a href="#">用户协议</a>
          <a href="#">隐私条款</a>
          <a href="#">退款政策</a>
          <a href="#">联系我们</a>
        </div>
      </footer>
    </div>
  )
}
