// ============================================================
//  AI Client — proxy-ready abstraction layer
// ============================================================
//
//  Why this file exists:
//    The whole app talks to AI through ONE interface (`AiClient`).
//    Currently the impl is `directDeepSeekClient` — calls DeepSeek from
//    the browser with a key in the bundle. That's fine for demo.
//
//    Once we ship to real users we MUST move the key server-side. At that
//    point flip `VITE_AI_PROXY=true` and `proxyAiClient` takes over —
//    same interface, no call-site changes anywhere.
//
//  Contract (stable — back-end MUST honor these shapes):
//    POST /api/chat     body: GenerateAnswerRequest   → GenerateAnswerResult
//    POST /api/summary  body: GenerateSummaryRequest  → StudySummaryResult
// ============================================================

import type { MethodCard } from '../domain'

// ---- Shared types (single source of truth for the AI contract) -----------

export type Evaluation = 'correct' | 'partial' | 'wrong' | null

export interface GenerateAnswerRequest {
  question: string
  methodCard: MethodCard
  problemText?: string
  history?: Array<{ role: 'student' | 'teacher'; content: string }>
}

export interface GenerateAnswerResult {
  answer: string
  evaluation: Evaluation
  provider: 'mock' | 'deepseek' | 'proxy'
}

export interface GenerateSummaryRequest {
  problemText: string
  methodCard: MethodCard
  conversation: Array<{ role: 'student' | 'teacher'; content: string }>
  studentName?: string
}

export interface StudySummaryResult {
  headline: string
  stuckStep: string
  stuckHint: string
  completedCount: number
  totalSteps: number
  minutes: number
  impactScope: string
  nextStepAdvice: string
  provider: 'mock' | 'deepseek' | 'proxy'
}

// ---- The interface every impl must satisfy --------------------------------

export interface AiClient {
  generateAnswer(req: GenerateAnswerRequest): Promise<GenerateAnswerResult>
  generateSummary(req: GenerateSummaryRequest): Promise<StudySummaryResult>
}

// ---- Impl 1: direct DeepSeek (demo / dev) --------------------------------
//   Wraps the existing functions in api/deepseek.ts. Key in browser bundle.

import { generateAnswerWithProvider, generateStudySummary } from './deepseek'

export const directDeepSeekClient: AiClient = {
  generateAnswer: (req) => generateAnswerWithProvider(req),
  generateSummary: (req) => generateStudySummary(req),
}

// ---- Impl 2: backend proxy (production) -----------------------------------
//   Backend reads DeepSeek key from server env and proxies the call.
//   This impl is wired but the backend doesn't exist yet — flipping the
//   flag without standing up the server will throw on first call.

const PROXY_BASE = import.meta.env.VITE_AI_PROXY_BASE ?? '/api'

async function postJson<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const res = await fetch(`${PROXY_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`AI proxy ${path} ${res.status}: ${errText.slice(0, 200)}`)
  }
  return (await res.json()) as TRes
}

export const proxyAiClient: AiClient = {
  generateAnswer: (req) =>
    postJson<GenerateAnswerRequest, GenerateAnswerResult>('/chat', req),
  generateSummary: (req) =>
    postJson<GenerateSummaryRequest, StudySummaryResult>('/summary', req),
}

// ---- Selector ------------------------------------------------------------
//   Set VITE_AI_PROXY=true at build time to switch to proxy mode.
//   Default is direct (current demo behavior).

let cached: AiClient | null = null

export function getAiClient(): AiClient {
  if (cached) return cached
  const useProxy = import.meta.env.VITE_AI_PROXY === 'true'

  // 🚨 Build-time security guard — see HISTORY.md §8 deployment checklist.
  //   Setting VITE_AI_PROXY=true alone is NOT enough. The directDeepSeekClient
  //   code is still in the bundle (no tree-shake — both impls are imported).
  //   If VITE_DEEPSEEK_API_KEY is also set during build, Vite inlines its
  //   literal value into dist/, exposing the key to anyone who opens devtools.
  //   Production build environments MUST set VITE_AI_PROXY=true AND ensure
  //   VITE_DEEPSEEK_API_KEY is unset.
  if (useProxy && import.meta.env.VITE_DEEPSEEK_API_KEY) {
    console.error(
      '[aiClient] 🚨 SECURITY: VITE_AI_PROXY=true but VITE_DEEPSEEK_API_KEY ' +
      'is also set in build env. The DeepSeek key is now inlined in this bundle ' +
      'and visible to any user. Remove VITE_DEEPSEEK_API_KEY from the production ' +
      'build environment, rebuild, and rotate the leaked key in the DeepSeek console.'
    )
  }

  cached = useProxy ? proxyAiClient : directDeepSeekClient
  return cached
}
