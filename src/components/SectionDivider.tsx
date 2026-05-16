import './SectionDivider.css'

interface Props {
  label: string
  btnLabel?: string
  onBtn?: () => void
}

export default function SectionDivider({ label, btnLabel, onBtn }: Props) {
  return (
    <div className="section-divider">
      <div className="section-divider-rule" />
      <span className="section-divider-label">{label}</span>
      {onBtn && (
        <button className="section-divider-btn" onClick={onBtn}>
          {btnLabel}
        </button>
      )}
      <div className="section-divider-rule" />
    </div>
  )
}
