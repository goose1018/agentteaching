import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, GraduationCap } from 'lucide-react'
import type { AppView } from '../../types'

const slideLabels = ['Hero · 1/4', '方法卡片 · 2/4', '试讲样片 · 3/4', '价格 · 4/4']

export interface WelcomeProps {
  go: (v: AppView) => void
  openStory: () => void
  openLibrary: () => void
  openLogin: () => void
}

export function Welcome({ go, openStory, openLibrary, openLogin }: WelcomeProps) {
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const [firstVisit, setFirstVisit] = useState<boolean>(() => {
    try { return !sessionStorage.getItem('carouselNudged') } catch { return false }
  })
  const totalSlides = 4

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % totalSlides)
    }, 10000)
    return () => window.clearInterval(id)
  }, [paused])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: slide * track.clientWidth, behavior: 'smooth' })
  }, [slide])

  const goPrev = () => setSlide((s) => (s - 1 + totalSlides) % totalSlides)
  const goNext = () => setSlide((s) => (s + 1) % totalSlides)

  const handleNudgeEnd = () => {
    setFirstVisit(false)
    try { sessionStorage.setItem('carouselNudged', '1') } catch { /* noop */ }
  }

  return (
    <main className="welcome-page carousel-mode">
      <header className="welcome-nav">
        <div className="brand">
          <div className="logo-mark"><span className="lambda">λ</span></div>
          <div className="brand-lockup">
            <span className="name">PhysicsPath</span>
            <span className="tag">名师 AI 解题陪练</span>
          </div>
        </div>
        <nav className="welcome-nav-links">
          <button type="button" onClick={openStory}>名师档案</button>
          <button type="button" onClick={openLibrary}>方法卡库</button>
          <button type="button" className="primary" onClick={openLogin}>立即试用</button>
        </nav>
      </header>

      <div
        className="welcome-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button className="carousel-arrow prev" type="button" onClick={goPrev} aria-label="上一屏">‹</button>
        <button className="carousel-arrow next" type="button" onClick={goNext} aria-label="下一屏">›</button>

        <div
          className={`carousel-track ${firstVisit ? 'first-visit' : ''}`}
          ref={trackRef}
          onAnimationEnd={firstVisit ? handleNudgeEnd : undefined}
        >

      <section className="carousel-slide welcome-hero">
        <div className="hero-inner">
          <div className="hero-text">
            <span className="pill">名师 AI · 解题教练</span>
            <h1>金牌名校名师<br /><span className="ai-accent">AI</span> 分身陪练</h1>
            <p className="lead">名师授权独家解题方法，把全国名师轻松请进家。</p>
            <div className="hero-ctas">
              <button className="btn-primary" onClick={openLogin}>
                <CheckCircle2 size={14} /> 立即试一道高考真题
              </button>
              <button className="btn-ghost" onClick={() => go('teacher')}>
                <GraduationCap size={14} /> 我是老师
              </button>
            </div>
            <p className="footnote">无需注册即可试用 · 演示版可在设置中切换学生端 / 教师端</p>
          </div>

          <div className="trace-card">
            <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
              {/* 坐标轴 */}
              <line x1="30" y1="190" x2="300" y2="190" stroke="var(--ppath-fg-3)" strokeWidth="1.4" />
              <line x1="30" y1="190" x2="30" y2="20" stroke="var(--ppath-fg-3)" strokeWidth="1.4" />
              <path d="M300 190 l-6 -3 l0 6 z" fill="var(--ppath-fg-3)" />
              <path d="M30 20 l-3 6 l6 0 z" fill="var(--ppath-fg-3)" />
              <text x="304" y="194" fontSize="10" fill="var(--ppath-fg-3)">x</text>
              <text x="22" y="18" fontSize="10" fill="var(--ppath-fg-3)">y</text>

              {/* 网格 */}
              <g stroke="var(--ppath-line-soft)" strokeWidth="0.6" strokeDasharray="2 3">
                <line x1="80" y1="190" x2="80" y2="20" />
                <line x1="130" y1="190" x2="130" y2="20" />
                <line x1="180" y1="190" x2="180" y2="20" />
                <line x1="230" y1="190" x2="230" y2="20" />
                <line x1="30" y1="140" x2="300" y2="140" />
                <line x1="30" y1="90" x2="300" y2="90" />
                <line x1="30" y1="50" x2="300" y2="50" />
              </g>

              {/* 抛物线轨迹（流动虚线） */}
              <path
                className="traj"
                d="M 30 190 Q 138 -10 280 180"
                fill="none"
                stroke="var(--ppath-ink-green-800)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* 起点 / 终点 */}
              <circle cx="30" cy="190" r="4.5" fill="var(--ppath-ink-green-800)" />
              <circle cx="280" cy="180" r="4.5" fill="none" stroke="var(--ppath-ink-green-800)" strokeWidth="1.6" />

              {/* 沿轨迹运动的小球 */}
              <g className="ball-anim">
                <circle cx="30" cy="190" r="6.5" fill="var(--ppath-ink-green-800)" />
              </g>

              {/* 速度 v 矢量 */}
              <g className="v-vec" transform="translate(138 62)">
                <line x1="8" y1="0" x2="42" y2="0" stroke="var(--ppath-ink-green-800)" strokeWidth="2" strokeLinecap="round" />
                <path d="M42 0 l-5 -3 l0 6 z" fill="var(--ppath-ink-green-800)" />
                <text x="22" y="-5" fontSize="11" fill="var(--ppath-ink-green-800)" fontStyle="italic" fontFamily="Georgia, serif" fontWeight="700">v</text>
              </g>
              {/* 重力 g */}
              <g className="g-vec" transform="translate(138 62)">
                <line x1="0" y1="8" x2="0" y2="38" stroke="var(--ppath-amber-700)" strokeWidth="2" strokeLinecap="round" />
                <path d="M0 38 l-3 -5 l6 0 z" fill="var(--ppath-amber-700)" />
                <text x="4" y="30" fontSize="11" fill="var(--ppath-amber-700)" fontStyle="italic" fontFamily="Georgia, serif" fontWeight="700">g</text>
              </g>

              {/* 公式 */}
              <text x="160" y="32" fontFamily="'Noto Serif SC', serif" fontSize="14" fill="var(--ppath-fg-1)" fontStyle="italic">
                y = v₀t − ½gt²
              </text>
            </svg>
            <div className="meta-row">
              <span><span className="dot"></span>抛体运动 · 实时演示</span>
              <span className="meta-formula">θ = 60° · v₀ = 12 m/s</span>
            </div>
          </div>
        </div>
      </section>

      <section className="carousel-slide slide-2 slide-stack">
        <span className="stack-eyebrow">名师方法</span>
        <h2 className="stack-title">X 老师 32 年教龄沉淀的<br />解题路径，写进 AI</h2>
        <p className="stack-sub">
          每一类高考题型都有一张「方法卡」——AI 不是凭空回答，是按老师亲自审过的路径走。
        </p>
        <div className="method-grid">
          <div className="method-card">
            <span className="tag">力学</span>
            <h4>斜面问题 3 秒识别法</h4>
            <p>看到光滑斜面 + 物块就触发：分解重力 <em>mg sinθ</em> 与 <em>mg cosθ</em>，再列方程。</p>
          </div>
          <div className="method-card">
            <span className="tag">电磁</span>
            <h4>带电粒子磁场圆周·半径速算</h4>
            <p>不背公式。先判定洛伦兹力提供向心力，半径 <em>r = mv/(qB)</em> 自然出来。</p>
          </div>
          <div className="method-card">
            <span className="tag">动量</span>
            <h4>碰撞题先验三件事</h4>
            <p>圈系统 → 看外力冲量是否可忽略 → 规定正方向。条件成立才列守恒方程。</p>
          </div>
        </div>
        <div className="method-foot">
          <button type="button" className="method-foot-link" onClick={openLibrary}>查看完整方法卡库 →</button>
        </div>
      </section>

      <section className="carousel-slide slide-3 slide-stack">
        <span className="stack-eyebrow">真实样片</span>
        <h2 className="stack-title">多年教学<br />独家方法</h2>
        <p className="stack-sub">点开听 30 秒——你会看到 AI 是怎么「按老师方法引导」，而不是直接吐答案的。</p>
        <div className="chat-card">
          <div className="chat-head">
            <span className="lbl">试讲片段 · 30 秒</span>
            <span className="replay">▶ 重播</span>
          </div>
          <div className="chat-row you"><div className="bubble u">老师，光滑斜面上的物块沿斜面下滑，加速度怎么算？</div></div>
          <div className="chat-row"><div className="av">师</div><div className="bubble t">别急。先做一件事：把重力沿斜面方向和垂直方向分解。沿斜面方向你写出来是什么？</div></div>
          <div className="chat-row you"><div className="bubble u"><em>mg sinθ</em>？</div></div>
          <div className="chat-row"><div className="av">师</div><div className="bubble t">对。光滑斜面没有摩擦，沿斜面方向的合力就是 <em>mg sinθ</em>。牛顿第二定律一列就出来：<em>a = g sinθ</em>。</div></div>
          <div className="chat-row"><div className="av">师</div><div className="bubble t">记住这条路径——分解、列方程、解。下次见到斜面题，先想这三步，不要先翻公式。</div></div>
        </div>
      </section>

      <section className="carousel-slide slide-4">
        <div className="feat-row">
          <div className="feat-cell">
            <svg className="ic" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M9 1.5l6 2.5v4.5c0 4-3 6.5-6 7.5-3-1-6-3.5-6-7.5V4l6-2.5z" />
            </svg>
            <h5>不直接给答案</h5>
            <p>AI 按老师方法一步步引导，避免抄袭。</p>
          </div>
          <div className="feat-cell">
            <svg className="ic" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="2" width="12" height="14" rx="1.5" />
              <path d="M6 6h6M6 9h6M6 12h4" />
            </svg>
            <h5>方法卡老师亲审</h5>
            <p>每条讲题方法都要本人确认才会上线。</p>
          </div>
          <div className="feat-cell">
            <svg className="ic" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="2" y="4" width="14" height="10" rx="1.5" />
              <path d="M2 5l7 5 7-5" />
            </svg>
            <h5>每周给家长摘要</h5>
            <p>哪些卡点在退步、哪些在进步，一目了然。</p>
          </div>
          <div className="feat-cell">
            <svg className="ic" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="6" cy="6" r="2.4" />
              <circle cx="13" cy="7" r="1.8" />
              <path d="M2 15c0-2.5 2-4 4-4s4 1.5 4 4M10 15c0-2 1.5-3 3-3s3 1 3 3" />
            </svg>
            <h5>真实老师参与</h5>
            <p>不是凭空捏造的 AI，背后有名师收益分成。</p>
          </div>
        </div>
        <div className="price-pill">
          <div className="num">¥299/月 · ¥2390/年（折合 ¥199/月）</div>
          <div className="sub">7 天无理由退款 · 家长账户支付</div>
          <button className="cta" type="button" onClick={openLogin}>立即试用 →</button>
        </div>
      </section>

        </div>

        <div className="carousel-dots" role="tablist">
          {slideLabels.map((label, i) => (
            <button
              key={i}
              type="button"
              className={i === slide ? 'active' : ''}
              onClick={() => setSlide(i)}
              aria-label={label}
              role="tab"
              aria-selected={i === slide}
            >{label}</button>
          ))}
        </div>
      </div>

      <footer className="welcome-foot">© PhysicsPath · 演示版本，仅供试用 · 学习辅助工具，不替代学校教学</footer>
    </main>
  )
}
