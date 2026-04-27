import { useId } from 'react'

interface SealProps {
  size?: number
  rotate?: number
  rough?: boolean
}

export function SealRound({ size = 32, rotate = -3, rough = true }: SealProps) {
  const id = useId().replace(/:/g, '_')
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{
        transform: `rotate(${rotate}deg)`,
        filter: 'drop-shadow(0 1px 2px rgba(155,34,34,.12))',
      }}
    >
      <defs>
        <radialGradient id={`g-${id}`} cx="50%" cy="42%">
          <stop offset="0%" stopColor="#b73a3a" />
          <stop offset="65%" stopColor="#9b2222" />
          <stop offset="100%" stopColor="#771c1c" />
        </radialGradient>
        {rough && (
          <filter id={`r-${id}`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves={2} seed={3} />
            <feDisplacementMap in="SourceGraphic" scale="1.2" />
          </filter>
        )}
      </defs>
      <g filter={rough ? `url(#r-${id})` : undefined}>
        <circle cx="32" cy="32" r="29" fill={`url(#g-${id})`} />
        <circle cx="32" cy="32" r="25.5" fill="none" stroke="#fbfaf7" strokeWidth="1.4" opacity=".9" />
        <g fill="#fbfaf7" opacity=".55">
          <circle cx="32" cy="6" r=".9" />
          <circle cx="50" cy="14" r=".9" />
          <circle cx="58" cy="32" r=".9" />
          <circle cx="50" cy="50" r=".9" />
          <circle cx="32" cy="58" r=".9" />
          <circle cx="14" cy="50" r=".9" />
          <circle cx="6" cy="32" r=".9" />
          <circle cx="14" cy="14" r=".9" />
        </g>
        <g fill="#fbfaf7" fontFamily="var(--ppath-font-display)" fontWeight="900">
          <text x="32" y="24" textAnchor="middle" fontSize="11" letterSpacing="-.5">分身</text>
          <text x="32" y="42" textAnchor="middle" fontSize="11" letterSpacing="-.5">亲签</text>
        </g>
      </g>
    </svg>
  )
}

export function SealRoundMini({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: 'rotate(-3deg)' }}>
      <circle cx="32" cy="32" r="29" fill="#9b2222" />
      <circle cx="32" cy="32" r="25.5" fill="none" stroke="#fbfaf7" strokeWidth="1.6" />
      <text x="32" y="40" textAnchor="middle" fontSize="22"
        fontFamily="var(--ppath-font-display)" fontWeight="900" fill="#fbfaf7">签</text>
    </svg>
  )
}

export function SealSquare({ size = 32, rotate = 2 }: SealProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: `rotate(${rotate}deg)` }}>
      <rect x="6" y="6" width="52" height="52" rx="3" fill="#9b2222" />
      <rect x="10" y="10" width="44" height="44" rx="2" fill="none" stroke="#fbfaf7" strokeWidth="1.4" opacity=".95" />
      <rect x="13" y="13" width="38" height="38" rx="1.5" fill="none" stroke="#fbfaf7" strokeWidth=".7" opacity=".4" />
      <text x="32" y="40" textAnchor="middle" fontSize="22"
        fontFamily="var(--ppath-font-display)" fontWeight="900" fill="#fbfaf7" letterSpacing="-1">分身</text>
    </svg>
  )
}

export function SealSquareMini({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: 'rotate(2deg)' }}>
      <rect x="6" y="6" width="52" height="52" rx="3" fill="#9b2222" />
      <text x="32" y="44" textAnchor="middle" fontSize="32"
        fontFamily="var(--ppath-font-display)" fontWeight="900" fill="#fbfaf7">分</text>
    </svg>
  )
}
