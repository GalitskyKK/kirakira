import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'update'

export interface ToastProps {
  readonly message: string
  readonly type?: ToastType
  readonly action?: {
    readonly label: string
    readonly onClick: () => void
  }
  readonly duration?: number
  readonly onClose: () => void
  readonly isVisible: boolean
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  update: RefreshCw,
}

const toastStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  update: 'bg-purple-500 text-white',
}

export function Toast({
  message,
  type = 'info',
  action,
  duration = 0,
  onClose,
  isVisible,
}: ToastProps) {
  const Icon = toastIcons[type]

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [isVisible, duration, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md sm:bottom-6"
        >
          <div
            className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-xl ${toastStyles[type]}`}
          >
            <Icon size={20} className="flex-shrink-0" />

            <p className="flex-1 text-sm font-medium">{message}</p>

            {action && (
              <button
                onClick={action.onClick}
                className="rounded-md bg-white/20 px-3 py-1 text-sm font-semibold transition-colors hover:bg-white/30"
              >
                {action.label}
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-white/20"
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
