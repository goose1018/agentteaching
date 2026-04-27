import katex from 'katex'

function normalizeInlineMath(input: string): string {
  let out = input
    .replace(/\\\((.+?)\\\)/gs, (_m, tex) => `$${tex}$`)
    .replace(/\\\[(.+?)\\\]/gs, (_m, tex) => `$${tex}$`)
    .replace(/\{1\}\{2\}/g, '\\frac{1}{2}')
    .replace(/\bfrac\{1\}\{2\}/g, '\\frac{1}{2}')
    .replace(/\bcdot\b/g, '\\cdot')

  if (!out.includes('$')) {
    out = out.replace(
      /(\\frac\{[^}]+\}\{[^}]+\}(?:\s*(?:\\cdot|\*|·)\s*)?(?:[A-Za-z0-9_^{}+\-*/\\]+)?|[A-Za-z](?:_[A-Za-z0-9{}]+)?\s*=\s*[^，。；;\n]+|\\(?:sqrt|sin|cos|tan)\{?[^，。；;\s]*\}?)/g,
      (match) => `$${match.trim()}$`,
    )
  }
  return out
}

// 公式渲染：把文本里的 $...$ / \( ... \) / \[ ... \] 片段交给 KaTeX，其余转义保留
function renderFormulaSegments(input: string): string {
  const normalized = normalizeInlineMath(input)
  if (!normalized.includes('$')) return escapeHtml(normalized)
  const parts = normalized.split(/(\$[^$]+\$)/g)
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
