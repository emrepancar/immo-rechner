import { Check, X, Info, Warning } from '@phosphor-icons/react'
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
              {toast.type === 'success' && <Check size={18} weight="bold" />}
              {toast.type === 'error'   && <X size={18} weight="bold" />}
              {toast.type === 'info'    && <Info size={18} weight="bold" />}
              {toast.type === 'warning' && <Warning size={18} weight="bold" />}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
          <button
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Close"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default Toast
