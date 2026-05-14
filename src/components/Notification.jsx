import { useEffect } from 'react'
import './Notification.css'

function Notification({ message, type, onClose }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className={`notification notification-${type}`} role="alert">
      <span>{message}</span>
      <button className="notification-close" onClick={onClose} aria-label="Close">✕</button>
    </div>
  )
}

export default Notification
