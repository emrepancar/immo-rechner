import { useState, useRef, useEffect } from 'react'
import './CustomSelect.css'

export interface SelectOption {
  value: string
  label: string
  sub?: string   // second line (e.g. address)
  meta?: string  // right-aligned (e.g. price)
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

export default function CustomSelect({ value, onChange, options, placeholder = '— Auswählen —', className }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [])

  return (
    <div ref={ref} className={`custom-select ${className || ''} ${open ? 'open' : ''}`}>
      <button type="button" className="custom-select-trigger" onClick={() => setOpen(o => !o)}>
        <span className="custom-select-value">
          {selected ? (
            <span className="custom-select-selected">
              <span className="custom-select-label">{selected.label}</span>
              {selected.sub && <span className="custom-select-sub">{selected.sub}</span>}
            </span>
          ) : (
            <span className="custom-select-placeholder">{placeholder}</span>
          )}
        </span>
        <svg className={`custom-select-chevron ${open ? 'flipped' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4.5l4 3.5 4-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="custom-select-dropdown">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`custom-select-option ${opt.value === value ? 'selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              <div className="custom-select-option-row">
                <span className="custom-select-option-label">{opt.label}</span>
                {opt.meta && <span className="custom-select-option-meta">{opt.meta}</span>}
              </div>
              {opt.sub && <div className="custom-select-option-sub">{opt.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
