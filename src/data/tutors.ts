import type { Tutor } from '../types'

// === 主推老师：X 老师（全平台唯一开放购买的老师 · 演示占位 demo）===
export const liuTutor: Tutor = {
  id: 'chang-physics-01',
  name: 'X 老师',
  avatar: '/teachers/avatar-a.svg',
  subject: '高中物理',
  title: '高中物理 · 解题路径教练',
  fit: '听课能懂，但一做题就不知道从哪下手的学生',
  specialties: ['解题路径', '力学建模', '电磁综合', '动量守恒', '压轴题拆解'],
  style: '先建模、再列式；不背模板，训练解题路径',
  schoolTag: '前XXX 机构金牌物理教师 · 教龄 12 年',
  years: '教龄 12 年',
  result: '带过 200+ 学生，多名考入清华、北大、交大等高校',
  bio: '教高中物理 12 年，最反对的是让学生背模板。物理题讲究"看明白"——看明白对象、过程、条件，公式自然就出来了。我希望我的 AI 分身做的不是替你解题，而是带你走一遍我看题的脑路。',
  month: 299,
  year: 2390,
  rating: 4.9,
  students: 286,
  purchased: false,
  available: true,
}

// === 内测中的占位老师，不可购买，制造"即将到来"的预期感 ===
export const previewTutors: Tutor[] = [
  {
    id: 'chen-physics-02',
    name: '陈书远',
    avatar: '/teachers/avatar-b.svg',
    subject: '高中物理',
    title: '高中物理 · 力学模型',
    fit: '基础还可以，但综合题经常丢步骤分的学生',
    specialties: ['力学模型', '压轴题', '实验探究'],
    style: '抓关键词、拆条件，讲题节奏清晰',
    schoolTag: '省重点高中骨干教师 · 教龄 21 年',
    years: '教龄 21 年',
    result: '多届学生高考物理 90+',
    bio: '内测中，预计 5 月上线。',
    month: 109,
    year: 872,
    rating: 4.8,
    students: 0,
    purchased: false,
    available: false,
  },
  {
    id: 'guo-math-03',
    name: '郭澈',
    avatar: '/teachers/avatar-b.svg',
    subject: '高中数学',
    title: '高中数学 · 圆锥曲线',
    fit: '函数与解析几何提分慢、压轴题难突破的学生',
    specialties: ['函数导数', '圆锥曲线', '数列递推'],
    style: '从图像出发，建立结构化解题路径',
    schoolTag: '名师工作室主讲 · 教龄 18 年',
    years: '教龄 18 年',
    result: '多位学生高考数学 145+',
    bio: '内测中，预计 6 月上线。',
    month: 119,
    year: 952,
    rating: 4.9,
    students: 0,
    purchased: false,
    available: false,
  },
]

export const tutors: Tutor[] = [liuTutor, ...previewTutors]
export const defaultTutor = liuTutor
