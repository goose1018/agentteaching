import type { Tutor } from '../../types'

/** 登录 Modal — 演示版：微信 → 新用户 / 手机号 → 老用户 */
export function LoginModal({ close, onLoginNew, onLoginPaid }: {
  close: () => void
  onLoginNew: () => void
  onLoginPaid: () => void
}) {
  return (
    <div className="login-modal" onClick={close}>
      <div className="login-card" onClick={(e) => e.stopPropagation()}>
        <button className="login-close" type="button" onClick={close} aria-label="关闭">×</button>
        <div className="login-brand">
          <div className="logo-mark"><span className="lambda">λ</span></div>
          <div>
            <div className="login-title">登录 PhysicsPath</div>
            <div className="login-tag">登录后开始你的解题陪练</div>
          </div>
        </div>

        <div className="login-options">
          <button className="login-option wechat" type="button" onClick={onLoginNew}>
            <span className="login-icon">💬</span>
            <div>
              <strong>微信登录</strong>
              <span>新用户首次使用 · 演示</span>
            </div>
          </button>
          <button className="login-option phone" type="button" onClick={onLoginPaid}>
            <span className="login-icon">📱</span>
            <div>
              <strong>手机号登录</strong>
              <span>老用户回访 · 演示已购买身份</span>
            </div>
          </button>
        </div>

        <p className="login-disclaimer">
          演示版本：点任意按钮均可登录，无需输入。<br />
          上线后将接入微信开放平台 OAuth 与短信验证码。
        </p>
      </div>
    </div>
  )
}

/** 付费墙 Modal — 新用户用完免费额度时弹出 */
export function PaywallModal({ tutor, onSubscribe, onClose }: {
  tutor: Tutor
  onSubscribe: (plan: 'month' | 'year') => void
  onClose: () => void
}) {
  return (
    <div className="login-modal" onClick={onClose}>
      <div className="login-card paywall" onClick={(e) => e.stopPropagation()}>
        <button className="login-close" type="button" onClick={onClose} aria-label="关闭">×</button>
        <div className="paywall-icon">🎯</div>
        <h2>免费体验已用完</h2>
        <p className="paywall-detail">
          你已经走完一遍 {tutor.name} 的解题陪练。
          <br />
          想继续跟 {tutor.name} 练完整套高考物理？
        </p>
        <div className="paywall-options">
          <button className="paywall-option" type="button" onClick={() => onSubscribe('month')}>
            <strong>月卡 ¥{tutor.month}/月</strong>
            <span>灵活订阅、随时取消 · 7 天无理由退款</span>
          </button>
          <button className="paywall-option recommended" type="button" onClick={() => onSubscribe('year')}>
            <span className="rec-tag">省 ¥{tutor.month * 12 - tutor.year}</span>
            <strong>年卡 ¥{tutor.year}/年</strong>
            <span>折合 ¥{Math.round(tutor.year / 12)}/月 · 一年陪练高考全程</span>
          </button>
        </div>
        <button className="paywall-later" type="button" onClick={onClose}>
          稍后再说
        </button>
      </div>
    </div>
  )
}

/** 假支付成功 Modal — 演示用：点了直接升级身份为 paid */
export function PaymentSuccessModal({ tutor, plan, onDone }: {
  tutor: Tutor
  plan: 'month' | 'year'
  onDone: () => void
}) {
  return (
    <div className="login-modal" onClick={onDone}>
      <div className="login-card pay-success" onClick={(e) => e.stopPropagation()}>
        <div className="pay-icon">✓</div>
        <h2>订阅成功</h2>
        <p className="pay-detail">
          已开通 <strong>{tutor.name} · 分身</strong> {plan === 'month' ? '月卡' : '年卡'}
          <br />
          <span className="pay-amount">¥{plan === 'month' ? tutor.month : tutor.year}</span>
        </p>
        <p className="pay-disclaimer">
          演示模式 — 实际未发生支付。<br />
          上线后将接入微信支付 / 支付宝。
        </p>
        <button className="pay-cta" type="button" onClick={onDone}>
          开始陪练 →
        </button>
      </div>
    </div>
  )
}
