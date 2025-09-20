import { useEffect, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      children,
      title,
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      className,
    },
    ref
  ) => {
    // Handle escape key
    useEffect(() => {
      if (!closeOnEscape || !isOpen) return

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [closeOnEscape, isOpen, onClose])

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        const originalStyle = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = 'hidden'
        return () => {
          document.body.style.overflow = originalStyle
        }
      }
      return undefined
    }, [isOpen])

    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full mx-4',
    }

    const overlayVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    }

    const modalVariants = {
      hidden: {
        opacity: 0,
        scale: 0.95,
        y: 20,
      },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        },
      },
      exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: {
          duration: 0.2,
        },
      },
    }

    if (typeof window === 'undefined') return null

    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={closeOnOverlayClick ? onClose : undefined}
            />

            {/* Modal */}
            <motion.div
              ref={ref}
              className={clsx(
                'relative z-10 w-full',
                sizeClasses[size],
                'rounded-2xl bg-white shadow-2xl',
                'max-h-[90vh] overflow-hidden',
                'mx-4',
                className
              )}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              {(title ?? showCloseButton) && (
                <div className="flex items-center justify-between border-b border-gray-200 p-4">
                  {title && (
                    <h2 className="text-lg font-semibold text-gray-900">
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className={clsx(
                        'rounded-lg p-1 text-gray-400',
                        'hover:bg-gray-100 hover:text-gray-600',
                        'focus:outline-none focus:ring-2 focus:ring-garden-500',
                        'transition-colors duration-200',
                        !title && 'ml-auto'
                      )}
                      aria-label="Закрыть модальное окно"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )
  }
)

Modal.displayName = 'Modal'

// Modal subcomponents
interface ModalHeaderProps {
  children: React.ReactNode
  className?: string
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div
      className={clsx(
        'border-b border-gray-200 px-4 py-3',
        'font-semibold text-gray-900',
        className
      )}
    >
      {children}
    </div>
  )
}

interface ModalBodyProps {
  children: React.ReactNode
  className?: string
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={clsx('p-4', className)}>{children}</div>
}

interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={clsx(
        'border-t border-gray-200 px-4 py-3',
        'flex justify-end space-x-2 bg-gray-50',
        className
      )}
    >
      {children}
    </div>
  )
}
