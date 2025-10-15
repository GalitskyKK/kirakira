import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white' | 'gray'
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const colorClasses = {
    primary: 'text-garden-500',
    white: 'text-white',
    gray: 'text-gray-400',
  }

  return (
    <motion.div
      className={clsx(
        'inline-block',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <svg
        className="h-full w-full"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </motion.div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  message?: string
}

export function LoadingOverlay({
  isLoading,
  children,
  message = 'Загрузка...',
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}

      {isLoading && (
        <motion.div
          className={clsx(
            'absolute inset-0 z-10',
            'bg-white/80 backdrop-blur-sm dark:bg-gray-900/80',
            'flex flex-col items-center justify-center',
            'rounded-2xl'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <LoadingSpinner size="lg" />
          {message && (
            <motion.p
              className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {message}
            </motion.p>
          )}
        </motion.div>
      )}
    </div>
  )
}

// Skeleton loading components
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  }

  const style = {
    width: width
      ? typeof width === 'number'
        ? `${width}px`
        : width
      : undefined,
    height: height
      ? typeof height === 'number'
        ? `${height}px`
        : height
      : undefined,
  }

  return (
    <motion.div
      className={clsx(
        'bg-gray-200 dark:bg-gray-700',
        variantClasses[variant],
        className
      )}
      style={style}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// Preset skeleton layouts
export function ElementSkeleton() {
  return (
    <div className="p-4">
      <div className="flex items-center space-x-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
    </div>
  )
}

export function GardenSkeleton() {
  return (
    <div className="grid grid-cols-5 gap-2 p-4">
      {Array.from({ length: 25 }, (_, i) => (
        <Skeleton key={i} variant="rectangular" className="aspect-square" />
      ))}
    </div>
  )
}
