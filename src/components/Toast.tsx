import { useToast } from '../context/ToastContext'
import './Toast.css'

function Toast() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`} role="alert">
          <div className="toast-content">
            <span className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'info' && 'ℹ'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
          <button
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export default Toast
