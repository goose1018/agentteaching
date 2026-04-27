import type { ReactElement } from 'react'

export type PortraitVariant = 'a' | 'b' | 'c' | 'd'

/**
 * 简笔画老师头像 — 4 个 variant 提供视觉差异（眼镜/胡子/卷发等），
 * 用于 NewUserHome 4 个老师占位 + spotlight 大头像。
 */
export function PortraitAvatar({ variant = 'a', className }: { variant?: PortraitVariant; className?: string }) {
  const variants: Record<PortraitVariant, ReactElement> = {
    a: (
      <>
        <rect width="36" height="36" fill="#EFE6D2" />
        <path d="M8 30 Q 8 22 18 22 Q 28 22 28 30 Z" fill="#1F4034" />
        <circle cx="18" cy="14" r="6.5" fill="#E8C39A" stroke="#1F4034" strokeWidth="1.2" />
        <path d="M11.5 9 Q 18 4 24.5 9 L 24.5 12 Q 18 8 11.5 12 Z" fill="#1F4034" />
        <rect x="13.5" y="13" width="3.5" height="3" rx="0.6" stroke="#1F4034" strokeWidth="1" fill="none" />
        <rect x="19" y="13" width="3.5" height="3" rx="0.6" stroke="#1F4034" strokeWidth="1" fill="none" />
        <line x1="17" y1="14.4" x2="19" y2="14.4" stroke="#1F4034" strokeWidth="1" />
        <path d="M16 18.5 Q 18 19.5 20 18.5" stroke="#1F4034" strokeWidth="1" strokeLinecap="round" fill="none" />
      </>
    ),
    b: (
      <>
        <rect width="36" height="36" fill="#E5DDC9" />
        <path d="M7 30 Q 7 22 18 22 Q 29 22 29 30 Z" fill="#2F5749" />
        <circle cx="18" cy="14" r="6.5" fill="#E8C39A" stroke="#1F4034" strokeWidth="1.2" />
        <path d="M11.5 11 Q 13 6 18 6 Q 23 6 24.5 11 Q 22 7.5 18 8 Q 14 7.5 11.5 11 Z" fill="#1F4034" />
        <circle cx="15.2" cy="14.5" r="1.8" stroke="#1F4034" strokeWidth="1" fill="none" />
        <circle cx="20.8" cy="14.5" r="1.8" stroke="#1F4034" strokeWidth="1" fill="none" />
        <line x1="17" y1="14.5" x2="19" y2="14.5" stroke="#1F4034" strokeWidth="1" />
        <path d="M16.5 18.5 Q 18 19 19.5 18.5" stroke="#1F4034" strokeWidth="1" strokeLinecap="round" fill="none" />
      </>
    ),
    c: (
      <>
        <rect width="36" height="36" fill="#F0E2C2" />
        <path d="M7 30 Q 7 22 18 22 Q 29 22 29 30 Z" fill="#1F4034" />
        <circle cx="18" cy="14" r="6.5" fill="#E8C39A" stroke="#1F4034" strokeWidth="1.2" />
        <path d="M11.5 11 Q 12 5.5 18 5.5 Q 24 5.5 24.5 11 L 24 14 Q 23.5 11.5 23 11 Q 18 9 13 11 Q 12.5 11.5 12 14 Z" fill="#1F4034" />
        <circle cx="15.5" cy="14.4" r="0.9" fill="#1F4034" />
        <circle cx="20.5" cy="14.4" r="0.9" fill="#1F4034" />
        <path d="M15 18.5 Q 18 20 21 18.5" stroke="#1F4034" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M14 19.8 Q 14.5 22 18 21.8 Q 21.5 22 22 19.8" stroke="#1F4034" strokeWidth="0.8" fill="none" opacity=".6" />
      </>
    ),
    d: (
      <>
        <rect width="36" height="36" fill="#E8DECA" />
        <path d="M7 30 Q 7 22 18 22 Q 29 22 29 30 Z" fill="#A86B3D" />
        <circle cx="18" cy="14" r="6.5" fill="#E8C39A" stroke="#1F4034" strokeWidth="1.2" />
        <path d="M11 13 Q 10 6 18 5 Q 26 6 25 13 Q 24 9 22 8.5 Q 23 11 22 12 Q 18 9 14 12 Q 13 11 14 8.5 Q 12 9 11 13 Z" fill="#1F4034" />
        <circle cx="15.2" cy="14.6" r="1" fill="#1F4034" />
        <circle cx="20.8" cy="14.6" r="1" fill="#1F4034" />
        <path d="M16 18.5 Q 18 19.6 20 18.5" stroke="#A1342E" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <circle cx="11" cy="17" r="1.4" fill="#1F4034" opacity=".25" />
        <circle cx="25" cy="17" r="1.4" fill="#1F4034" opacity=".25" />
      </>
    ),
  }
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" preserveAspectRatio="xMidYMid slice">
      {variants[variant]}
    </svg>
  )
}
