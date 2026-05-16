import { useState, useRef, useEffect } from 'react'
import { CaretDown } from '@phosphor-icons/react'
import './ExpandableCard.css'

interface ExpandableCardProps {
  title: string
  summary?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  icon?: React.ReactNode
  className?: string
}

export default function ExpandableCard({ title, summary, children, defaultOpen = false, icon, className = '' }: ExpandableCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(defaultOpen ? 'auto' : '0px')

  useEffect(() => {
    if (!contentRef.current) return
    if (isOpen) {
      const h = contentRef.current.scrollHeight
      setHeight(h + 'px')
      const t = setTimeout(() => setHeight('auto'), 360)
      return () => clearTimeout(t)
    } else {
      setHeight(contentRef.current.scrollHeight + 'px')
      requestAnimationFrame(() => setHeight('0px'))
    }
  }, [isOpen])

  return (
    <div className={`expandable-card ${className}`}>
      <button className="expandable-card-header" onClick={() => setIsOpen(o => !o)}>
        <div className="expandable-card-title-group">
          {icon && <span className="expandable-card-icon">{icon}</span>}
          <span className="expandable-card-title">{title}</span>
        </div>
        <span className={`expandable-card-caret ${isOpen ? 'open' : ''}`}>
          <CaretDown size={16} weight="bold" />
        </span>
      </button>
      {summary && !isOpen && (
        <div className="expandable-card-summary">{summary}</div>
      )}
      <div ref={contentRef} className="expandable-card-content" style={{ height, overflow: isOpen && height === 'auto' ? 'visible' : 'hidden' }}>
        <div className="expandable-card-body">{children}</div>
      </div>
    </div>
  )
}
