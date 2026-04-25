export type ModelTask =
  | 'vision'
  | 'reasoning'
  | 'teacherStyle'
  | 'longTranscript'
  | 'safety'

export interface ModelRoute {
  task: ModelTask
  label: string
  demoModel: string
  productionModel: string
  fallbackModel: string
  maxCostLevel: 'low' | 'medium' | 'high'
}

export const modelRoutes: ModelRoute[] = [
  {
    task: 'vision',
    label: '图片读题',
    demoModel: 'GPT-5.2 Vision',
    productionModel: 'Qwen VL / Kimi Vision',
    fallbackModel: '人工确认题干',
    maxCostLevel: 'high',
  },
  {
    task: 'reasoning',
    label: '解题推理',
    demoModel: 'GPT-5.2',
    productionModel: 'DeepSeek V4 Pro',
    fallbackModel: 'DeepSeek V4 Flash',
    maxCostLevel: 'high',
  },
  {
    task: 'teacherStyle',
    label: '老师风格表达',
    demoModel: 'GPT-5.2',
    productionModel: 'DeepSeek V4 Flash / Kimi K2',
    fallbackModel: '模板化提示',
    maxCostLevel: 'medium',
  },
  {
    task: 'longTranscript',
    label: '长讲稿抽取',
    demoModel: 'Kimi / GPT-5.2',
    productionModel: 'Kimi K2 Thinking',
    fallbackModel: 'DeepSeek V4',
    maxCostLevel: 'medium',
  },
  {
    task: 'safety',
    label: '安全审核',
    demoModel: '规则引擎 + LLM',
    productionModel: '便宜模型 + 关键词库',
    fallbackModel: '人工审核队列',
    maxCostLevel: 'low',
  },
]

export interface TeacherContext {
  topic: string
  methodSteps: string[]
  analogies: string[]
  commonErrors: string[]
  approvedExamples: string[]
  rejectedExamples: string[]
}

export function buildTutorSystemPrompt(context: TeacherContext) {
  return [
    '你是老师授权的 AI 分身，以第一人称讲解，但必须明确不是老师本人实时在线。',
    `当前知识点：${context.topic}`,
    '回答必须遵循：先判断现象/状态，再分步提示，最后才给公式或完整解析。',
    `老师方法步骤：${context.methodSteps.join(' -> ')}`,
    `可用类比：${context.analogies.join('；')}`,
    `常见误区：${context.commonErrors.join('；')}`,
    '不要承诺提分，不要押题，不要编造老师本人观点。',
    '如果题干或图片识别不确定，先请学生确认。',
  ].join('\n')
}
