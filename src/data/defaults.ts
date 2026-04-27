import type { Diagnosis } from '../types'

/** 默认诊断 — Capture 进 Coach 时的兜底（用户输入会覆盖 text） */
export const defaultDiagnosis: Diagnosis = {
  text: '光滑水平面上，小车 A 与小车 B 发生碰撞，碰后粘在一起运动。已知两车质量和碰前速度，求碰后共同速度。',
  subject: '高中物理',
  type: '动量守恒 · 碰撞后共同速度',
  difficulty: '中等',
  confidence: 0.92,
  imageInfo: '两个物体连接，水平面运动，涉及碰撞前后速度。',
  stuck: ['没有先选研究对象', '把某个力直接当成合外力', '不知道什么时候列动量守恒方程'],
}

/** Capture 右侧栏 mock 数据 — 知识点雷达图 */
export const knowledgeMastery = [
  { name: '力学', value: 0.88 }, { name: '运动', value: 0.76 },
  { name: '能量', value: 0.54 }, { name: '动量', value: 0.42 },
  { name: '电磁', value: 0.61 }, { name: '光学', value: 0.83 },
]

/** Capture 右侧栏 mock 数据 — 最近 7 天打卡 */
export const last7DaysBars = [22, 48, 8, 65, 80, 38, 55]
