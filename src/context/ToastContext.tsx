import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Toast } from '../types'

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type'], duration?: number) => number
  removeToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 3000): number => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) setTimeout(() => removeToast(id), duration)
    return id
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
