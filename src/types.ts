// 共享类型 — 所有组件用这里的定义，不要在组件文件里重复声明

export type Role = 'student' | 'teacher'

export type Evaluation = 'correct' | 'partial' | 'wrong' | null

export interface Message {
  id: string
  role: Role
  content: string
  time: string
  tags?: string[]
  evaluation?: Evaluation
}

export interface Session {
  id: string
  title: string
  messages: Message[]
}

export interface Tutor {
  id: string
  name: string
  avatar: string // 头像 SVG 路径
  subject: string
  title: string
  fit: string
  specialties: string[]
  style: string
  schoolTag: string
  years: string
  result: string
  bio: string
  month: number
  year: number
  rating: number
  students: number
  purchased: boolean
  available: boolean // 是否已开放购买
}

export interface Diagnosis {
  text: string
  subject: string
  type: string
  difficulty: string
  confidence: number
  imageInfo: string
  stuck: string[]
}

export type AppView = 'welcome' | 'student' | 'teacher'

export type StudentView =
  | 'home' | 'newUserHome' | 'capture' | 'confirm' | 'coach' | 'summary' | 'pricing'
  | 'subjects' | 'teachers' | 'teacherDetail'
  | 'methodLibrary' | 'methodCardDetail' | 'tutorStory'
  | 'mistakes'

export type TeacherView = 'home' | 'upload' | 'train' | 'methods' | 'review' | 'records' | 'publish' | 'quality'

export type UserTier = 'visitor' | 'new' | 'paid'
