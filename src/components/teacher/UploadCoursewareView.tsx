import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { MethodCard } from '../../domain'
import type { TeacherView } from '../../types'

type UploadStatus = 'pending' | 'parsing' | 'done' | 'failed'
interface UploadFile {
  id: string
  name: string
  size: number
  type: string
  status: UploadStatus
  extractedCount?: number  // 解析出的方法卡数量
  error?: string
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.md'
const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const fileIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📕'
  if (['doc', 'docx'].includes(ext ?? '')) return '📄'
  if (['ppt', 'pptx'].includes(ext ?? '')) return '📊'
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext ?? '')) return '🖼️'
  if (['txt', 'md'].includes(ext ?? '')) return '📝'
  return '📎'
}

// Mock 解析：根据文件名/类型生成 1-3 张占位草稿方法卡
// 真接 LLM 后，这个函数应换成调用 DeepSeek-VL / Claude vision 提取
async function mockExtractCards(file: File): Promise<MethodCard[]> {
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 2000))
  const lower = file.name.toLowerCase()
  const isPhysics = /物理|力学|电磁|动量|能量|波动|光学|斜面|碰撞/.test(file.name) || true
  const sampleTopics = isPhysics
    ? ['圆周运动 · 向心力分析', '动量守恒 · 系统判定', '电磁感应 · 楞次定律应用']
    : ['通用题型 · 步骤拆解']

  const cardCount = lower.endsWith('.pdf') || lower.endsWith('.docx') ? 3 : lower.endsWith('.ppt') || lower.endsWith('.pptx') ? 2 : 1
  const topics = sampleTopics.slice(0, cardCount)

  return topics.map((topic, i) => ({
    id: `upload-${Date.now()}-${i}`,
    version: 1 as const,
    subject: '高中物理' as const,
    topic,
    trigger: `从《${file.name}》提取 - 出现 ${topic} 相关关键词`,
    teacherMove: `按你的讲法：先看清研究对象，再判断用哪个守恒。`,
    analogy: `这类题就像账本——先把"账户"圈出来。`,
    commonError: '直接套公式，没先判断条件成立。',
    detail: `从课件 ${file.name} 解析。需要老师补充和审核。`,
    sampleQuestion: `详见原课件第 X 页。`,
    methodSteps: ['圈研究对象', '判断条件', '列方程', '验算'],
    forbiddenPhrases: ['直接给答案', '不解释步骤'],
    trainingEvidence: {
      source: 'manual_seed' as const,
      transcript: `课件文件：${file.name} (${formatBytes(file.size)})`,
      collectedAt: new Date().toISOString(),
      reviewer: '待审核',
    },
    status: 'needs_review' as const,
  }))
}

export interface UploadCoursewareViewProps {
  setCards: Dispatch<SetStateAction<MethodCard[]>>
  setView: (v: TeacherView) => void
}

export function UploadCoursewareView({ setCards, setView }: UploadCoursewareViewProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [totalExtracted, setTotalExtracted] = useState(0)

  const processFile = async (rawFile: File, id: string) => {
    setFiles((current) => current.map((f) => (f.id === id ? { ...f, status: 'parsing' } : f)))
    try {
      const cards = await mockExtractCards(rawFile)
      setCards((current) => [...cards, ...current])
      setFiles((current) => current.map((f) =>
        f.id === id ? { ...f, status: 'done', extractedCount: cards.length } : f
      ))
      setTotalExtracted((n) => n + cards.length)
    } catch (e) {
      setFiles((current) => current.map((f) =>
        f.id === id ? { ...f, status: 'failed', error: e instanceof Error ? e.message : '解析失败' } : f
      ))
    }
  }

  const handleFiles = (rawFiles: FileList | File[]) => {
    const newOnes: UploadFile[] = []
    Array.from(rawFiles).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        newOnes.push({
          id: `f-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'failed',
          error: '文件超过 30MB',
        })
        return
      }
      const id = `f-${Date.now()}-${Math.random()}`
      newOnes.push({ id, name: file.name, size: file.size, type: file.type, status: 'pending' })
      processFile(file, id)
    })
    setFiles((current) => [...newOnes, ...current])
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  const removeFile = (id: string) => setFiles((current) => current.filter((f) => f.id !== id))

  const statusLabel = (s: UploadStatus) =>
    ({ pending: '排队中', parsing: 'AI 解析中…', done: '已生成草稿', failed: '失败' }[s])

  return (
    <section className="teacher-grid">
      <div className="panel hero-panel">
        <p className="eyebrow">省时模式 · 推荐</p>
        <h2>把课件丢进来，AI 自动整理你的讲题方法</h2>
        <p>支持 PDF / DOC / PPT / 图片 等格式。AI 会按你的讲法提取「方法卡草稿」，你只需要审核。</p>
        <div className="paste-hint" style={{ marginTop: 16 }}>
          🧪 演示原型：本页是教师训练后台的交互流程演示。当前 AI 解析按文件名生成草稿（mock），真实部署将接入 GLM-4V / Qwen-VL 等视觉模型，对 PPT / PDF / 板书图片做内容级解析。
        </div>
      </div>

      <div className="panel">
        <label
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            hidden
          />
          <div className="upload-icon">📤</div>
          <strong>拖拽文件到这里，或点击选择</strong>
          <span>支持 PDF · DOC/DOCX · PPT/PPTX · PNG/JPG · TXT/MD（单个 ≤ 30MB）</span>
        </label>

        <div className="upload-supported">
          <span className="badge">📕 PDF</span>
          <span className="badge">📄 DOC/DOCX</span>
          <span className="badge">📊 PPT/PPTX</span>
          <span className="badge">🖼️ PNG/JPG</span>
          <span className="badge">📝 TXT/MD</span>
        </div>
      </div>

      {files.length > 0 && (
        <div className="panel full-width">
          <div className="panel-title">
            <h2>上传记录</h2>
            <span>共 {files.length} 份 · 已生成 {totalExtracted} 张方法卡草稿</span>
          </div>
          <div className="upload-list">
            {files.map((f) => (
              <div key={f.id} className={`upload-item status-${f.status}`}>
                <span className="file-icon">{fileIcon(f.name)}</span>
                <div className="file-meta">
                  <strong className="file-name">{f.name}</strong>
                  <span className="file-info">
                    {formatBytes(f.size)} · {statusLabel(f.status)}
                    {f.status === 'done' && f.extractedCount && ` · ${f.extractedCount} 张草稿`}
                    {f.status === 'failed' && f.error && ` · ${f.error}`}
                  </span>
                </div>
                {f.status === 'parsing' && <span className="loader" />}
                {f.status === 'done' && (
                  <button type="button" className="link-button" onClick={() => setView('methods')}>
                    去审核 →
                  </button>
                )}
                {(f.status === 'failed' || f.status === 'done') && (
                  <button type="button" className="ghost-icon" onClick={() => removeFile(f.id)}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <h2>课件上传是怎么工作的</h2>
        <ol className="upload-howto">
          <li><strong>1. 上传</strong>：拖拽你的课件 / 例题 PDF / 课堂讲稿 PPT / 黑板照片</li>
          <li><strong>2. AI 解析</strong>：DeepSeek-VL + GPT-4o vision 读取文档内容，识别题型 / 步骤 / 公式</li>
          <li><strong>3. 草稿生成</strong>：AI 按你的讲法提取「方法卡」草稿（题型 + 关键判断 + 解题步骤 + 常见错误）</li>
          <li><strong>4. 你审核</strong>：在「我的讲题方法」里逐张确认，改 / 删 / 发布</li>
          <li><strong>5. 上线</strong>：审核通过的方法卡才会被 AI 分身用来回答学生</li>
        </ol>
        <p className="panel-tip">所有上传文件经过加密存储，仅用于训练你自己的 AI 分身。</p>
      </div>
    </section>
  )
}
