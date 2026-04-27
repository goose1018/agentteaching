import { useEffect, useState } from 'react'
import { Camera, Image as ImageIcon, ArrowRight } from 'lucide-react'
import type { Diagnosis, Tutor, StudentView, UserTier } from '../../types'
import { defaultDiagnosis, knowledgeMastery, last7DaysBars } from '../../data/defaults'

/**
 * Capture（拍题）页面
 * - 左：greet bubble + 拖拽上传 + 文字粘贴 + 「发给老师」CTA
 * - 右：今日额度 + 知识点雷达 + 7 天趋势
 * - 扫描动画 modal（4 步进度）
 *
 * 注意：DeepSeek V4-Flash 不支持 vision。当前演示版强制要求文字粘贴。
 * 真上线时接 GLM-4V 或 Qwen-VL 处理图片识别。
 */
export function Capture({ setDiagnosis, setView, tutor, userTier, freeAttemptsLeft }: {
  setDiagnosis: (d: Diagnosis) => void
  setView: (v: StudentView) => void
  tutor: Tutor
  userTier: UserTier
  freeAttemptsLeft: number
}) {
  const [pasted, setPasted] = useState('')
  const [scanStep, setScanStep] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string>('')
  const [showImageHint, setShowImageHint] = useState(false)

  const startScan = () => {
    if (!pasted.trim()) {
      setShowImageHint(true)
      return
    }
    setShowImageHint(false)
    setScanStep(1)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) {
      setUploadedFileName(f.name)
      setShowImageHint(true)
    }
  }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setUploadedFileName(f.name)
      setShowImageHint(true)
    }
  }

  // 自动推进扫描进度
  useEffect(() => {
    if (scanStep === 0) return
    if (scanStep === 4) {
      setDiagnosis({ ...defaultDiagnosis, text: pasted, confidence: 0.95 })
      const t = window.setTimeout(() => {
        setScanStep(0)
        setView('coach')
      }, 700)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => {
      setScanStep((s) => (Math.min(s + 1, 4)) as 0 | 1 | 2 | 3 | 4)
    }, 1400)
    return () => window.clearTimeout(t)
  }, [scanStep, pasted, setDiagnosis, setView])

  const showScan = scanStep > 0

  return (
    <section className="capture-page">
      <p className="crumb">拍题诊断</p>

      <div className="capture-grid">
        <div className="capture-left">
          {/* 第一人称引导气泡 */}
          <div className="greet">
            <div className="greet-av">λ</div>
            <div className="greet-bubble">
              <div className="greet-who"><b>{tutor.name}</b> · 名师 AI 分身</div>
              <h1>请上传遇到困难的题目，我来带你理清思路。</h1>
              <p>不用整页拍，只发<b>一道题</b>就行——题干、选项、图都拍清楚一些。如果题目里有图，记得一起拍进去。</p>
            </div>
          </div>

          {/* 上传卡片 */}
          <div className="capture-stage">
            <div
              className={`dropzone-stage ${dragOver ? 'drag-over' : ''}`}
              onClick={() => document.getElementById('capture-file')?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
            >
              <div className="icon-wrap">
                <Camera size={24} />
              </div>
              <div className="copy">
                <h3>{dragOver ? '松开上传' : uploadedFileName ? `已上传：${uploadedFileName}` : '把题目拖到这里'}</h3>
                <p>{uploadedFileName
                  ? '⚠️ 演示版尚未接入图像识别。请在下方文字框补充题目内容，AI 才能讲解。'
                  : '支持拖拽图片 / 点击此区域选择 · 单题识别更准'}
                </p>
              </div>
              <div className="action-row" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="seg-btn ghost"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); document.getElementById('capture-file')?.click() }}
                >
                  <ImageIcon size={14} /> 选择图片
                </button>
              </div>
            </div>
            <input id="capture-file" type="file" accept="image/*" onChange={handleFileSelect} hidden />

            <div className="or-divider"><span>请输入题目文字</span></div>

            {showImageHint && !pasted.trim() && (
              <div className="paste-hint">
                ⚠️ 演示模式：图像识别还在接入中。请把题目文字粘贴或手打到下方框里，{tutor.name} 才能针对真题讲解。
              </div>
            )}

            <textarea
              className="paste-input"
              placeholder="把题目文字粘贴在这里 ——「在光滑水平面上，长 L=0.5m 的导体棒在磁感应强度 B=0.2T 的匀强磁场中以 v=2m/s 切割磁感线…」"
              value={pasted}
              onChange={(e) => { setPasted(e.target.value); if (e.target.value.trim()) setShowImageHint(false) }}
              rows={4}
            />

            <div className="stage-footer">
              <span>仅你和老师能看到 · 不会出现在公共题库</span>
              <button
                type="button"
                className="send-teacher-btn"
                onClick={() => startScan()}
                disabled={!pasted.trim()}
                title={!pasted.trim() ? '先输入题目文字' : '发给老师'}
              >
                发给老师
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* 辅助小贴士 */}
          <div className="helper-tips">
            <div className="tip"><b>📐 单题更准</b>一次只拍一道，AI 才能聚焦到这一道题的方法。</div>
            <div className="tip"><b>📷 题干完整</b>题号、条件、图都拍进来，别裁掉。</div>
            <div className="tip"><b>✏️ 写一半也行</b>已经动笔但卡住了？把过程一起拍来，我从你卡住的地方接。</div>
          </div>
        </div>

        <aside className="capture-right">
          {/* 今日剩余次数 */}
          <div className="rail-card quota-card">
            <div className="rail-head">
              <h4>{userTier === 'paid' ? '今日已用' : '免费体验额度'}</h4>
              <span className="rail-meta">{userTier === 'paid' ? 'MEMBER' : 'FREE'}</span>
            </div>
            <div className="quota-num">
              {userTier === 'paid' ? (
                <>
                  <span className="quota-n">∞</span>
                  <span className="quota-total">无限</span>
                </>
              ) : (
                <>
                  <span className="quota-n">{freeAttemptsLeft}</span>
                  <span className="quota-total">/ 1 次</span>
                </>
              )}
            </div>
            {userTier !== 'paid' && (
              <div className="quota-bar"><div className="quota-fill" style={{ width: `${freeAttemptsLeft * 100}%` }} /></div>
            )}
            <div className="quota-foot">
              {userTier === 'paid' ? `已订阅 ${tutor.name} · 不限次数` : `免费体验后订阅 ¥${tutor.month}/月解锁无限`}
            </div>
          </div>

          {/* 知识点雷达图 */}
          <div className="rail-card">
            <div className="rail-head">
              <h4>知识点掌握</h4>
              <span className="rail-meta">最近 30 题</span>
            </div>
            <div className="radar-wrap">
              <svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
                <g stroke="var(--ppath-line)" strokeWidth="1" fill="none">
                  <polygon points="100,20 162,55 162,125 100,160 38,125 38,55" />
                  <polygon points="100,40 145,65 145,115 100,140 55,115 55,65" />
                  <polygon points="100,60 128,75 128,105 100,120 72,105 72,75" />
                  <polygon points="100,80 111,85 111,95 100,100 89,95 89,85" />
                </g>
                <g stroke="var(--ppath-line-soft)" strokeWidth="1">
                  <line x1="100" y1="90" x2="100" y2="20" />
                  <line x1="100" y1="90" x2="162" y2="55" />
                  <line x1="100" y1="90" x2="162" y2="125" />
                  <line x1="100" y1="90" x2="100" y2="160" />
                  <line x1="100" y1="90" x2="38" y2="125" />
                  <line x1="100" y1="90" x2="38" y2="55" />
                </g>
                <polygon
                  points="100,32 152,58 138,118 100,148 62,118 60,62"
                  fill="var(--ppath-ink-green-700)"
                  fillOpacity=".18"
                  stroke="var(--ppath-ink-green-700)"
                  strokeWidth="1.6"
                />
                <g fill="var(--ppath-ink-green-800)">
                  <circle cx="100" cy="32" r="2.6" />
                  <circle cx="152" cy="58" r="2.6" />
                  <circle cx="138" cy="118" r="2.6" />
                  <circle cx="100" cy="148" r="2.6" />
                  <circle cx="62" cy="118" r="2.6" />
                  <circle cx="60" cy="62" r="2.6" />
                </g>
                <g fontSize="9" fill="var(--ppath-fg-2)">
                  <text x="100" y="13" textAnchor="middle">力学</text>
                  <text x="172" y="55" textAnchor="middle">运动</text>
                  <text x="172" y="130" textAnchor="middle">能量</text>
                  <text x="100" y="174" textAnchor="middle">动量</text>
                  <text x="28" y="130" textAnchor="middle">电磁</text>
                  <text x="28" y="55" textAnchor="middle">光学</text>
                </g>
              </svg>
            </div>
            <div className="radar-legend">
              {knowledgeMastery.map((k) => (
                <div className="radar-row" key={k.name}>
                  <span>{k.name}</span><b>{Math.round(k.value * 100)}%</b>
                </div>
              ))}
            </div>
          </div>

          {/* 7 天趋势 */}
          <div className="rail-card">
            <div className="rail-head">
              <h4>最近 7 天</h4>
              <span className="rail-meta">已练 18 道</span>
            </div>
            <div className="trend-bars">
              {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => (
                <div className="trend-col" key={d}>
                  <div className={`trend-bar ${last7DaysBars[i] < 15 ? 'dim' : ''}`} style={{ height: `${last7DaysBars[i]}%` }} />
                  <span className="trend-label">{d}</span>
                </div>
              ))}
            </div>
            <div className="trend-foot">
              <span>本周连续打卡</span>
              <b>4 天</b>
            </div>
          </div>
        </aside>
      </div>

      {/* 扫描动画 Modal */}
      {showScan && (
        <div className="scan-modal show" role="dialog" aria-label="正在识别题目">
          <div className="scan-card">
            <div className="scan-frame">
              <span className="corner tl"></span>
              <span className="corner tr"></span>
              <span className="corner bl"></span>
              <span className="corner br"></span>
              <div className="scan-doc">
                <div className="scan-q">{uploadedFileName ? `已上传图片：${uploadedFileName}` : '题目内容'}</div>
                <div className="scan-body">
                  {pasted.slice(0, 200) || '...'}
                </div>
              </div>
              <div className="scan-line" />
            </div>
            <h3>{tutor.name}正在读题…</h3>
            <p className="scan-sub">用大模型理解整道题，不只是识别文字</p>

            <div className="scan-steps">
              {[
                ['已收到图片 · 排正题干', 1],
                ['正在理解题意 · 抽取已知量', 2],
                ['判断知识点 · 准备方法卡', 3],
                ['进入对话陪练', 4],
              ].map(([label, i]) => {
                const idx = i as number
                const cls = scanStep > idx ? 'done' : scanStep === idx ? 'active' : ''
                return (
                  <div className={`scan-step ${cls}`} key={idx}>
                    <span className="scan-dot" />
                    {label}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
