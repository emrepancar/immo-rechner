import './SkeletonCard.css'

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-header">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-buttons">
          <div className="skeleton-btn" />
          <div className="skeleton-btn" />
          <div className="skeleton-btn" />
        </div>
      </div>
      <div className="skeleton-badge" />
      <div className="skeleton-info">
        <div className="skeleton-row">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-value" />
        </div>
        <div className="skeleton-row">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-value" />
        </div>
        <div className="skeleton-row">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-value" />
        </div>
        <div className="skeleton-row">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-value" />
        </div>
        <div className="skeleton-row">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-value skeleton-value-accent" />
        </div>
      </div>
      <div className="skeleton-footer">
        <div className="skeleton-line skeleton-date" />
      </div>
    </div>
  )
}

export default SkeletonCard
