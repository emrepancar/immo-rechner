import './CircularProgress.css'

interface CircularProgressProps {
  value: number        // 0–100
  label: string
  sublabel?: string
  color?: 'success' | 'warning' | 'danger' | 'accent'
  size?: 'sm' | 'md' | 'lg'
}

const colorMap = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger:  'var(--danger)',
  accent:  'var(--accent)',
}

export default function CircularProgress({ value, label, sublabel, color = 'accent', size = 'md' }: CircularProgressProps) {
  const sizeMap = { sm: 96, md: 120, lg: 160 }
  const sz = sizeMap[size]
  const r = sz * 0.36
  const circumference = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="circular-progress" style={{ width: sz, height: sz }}>
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--border)" strokeWidth={size === 'sm' ? 5 : 6} />
        <circle
          cx={sz/2} cy={sz/2} r={r}
          fill="none"
          stroke={colorMap[color]}
          strokeWidth={size === 'sm' ? 5 : 6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            filter: `drop-shadow(0 0 6px ${colorMap[color]}40)`,
          }}
        />
      </svg>
      <div className="circular-progress-content">
        <div className="circular-progress-value" style={{ color: colorMap[color] }}>
          {Math.round(clamped)}%
        </div>
        <div className="circular-progress-label">{label}</div>
        {sublabel && <div className="circular-progress-sublabel">{sublabel}</div>}
      </div>
    </div>
  )
}
