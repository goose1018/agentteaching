import katex from 'katex'

// 公式渲染：把文本里的 $...$ 片段交给 KaTeX，其余原样保留
function renderFormulaSegments(input: string): string {
  if (!input.includes('$')) return escapeHtml(input)
  const parts = input.split(/(\$[^$]+\$)/g)
  return parts
    .map((part) => {
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const tex = part.slice(1, -1)
        try {
          return katex.renderToString(tex, { throwOnError: false, output: 'html' })
        } catch {
          return escapeHtml(part)
        }
      }
      return escapeHtml(part)
    })
    .join('')
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!))
}

/**
 * Inline LaTeX renderer.
 * Wraps every `$...$` block with KaTeX HTML; falls back to plain text otherwise.
 */
export function Tex({ children }: { children: string }) {
  return <span className="tex-host" dangerouslySetInnerHTML={{ __html: renderFormulaSegments(children) }} />
}
