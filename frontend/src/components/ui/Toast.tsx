import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useUIStore } from '../../stores/uiStore'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles = {
  success: 'bg-deep-green text-white',
  error: 'bg-error-red text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-action-blue text-white',
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({
  type,
  title,
  message,
  onDismiss,
}: {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const Icon = icons[type]

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-sm shadow-elevated animate-slide-down',
        styles[type]
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-button font-medium">{title}</p>
        {message && <p className="text-caption opacity-90 mt-0.5">{message}</p>}
      </div>
      <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
