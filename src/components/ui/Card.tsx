import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { clsx } from 'clsx'

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  clickable?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hover = false,
      clickable = false,
      className,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'rounded-2xl',
      'transition-all duration-200',
      'overflow-hidden',
    ]

    const variantClasses = {
      default: [
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        hover && 'hover:border-garden-300 dark:hover:border-garden-600',
        clickable && 'cursor-pointer',
      ],
      elevated: [
        'bg-white dark:bg-gray-800',
        'shadow-lg dark:shadow-gray-900/25',
        hover && 'hover:shadow-xl dark:hover:shadow-gray-900/50',
        clickable && 'cursor-pointer',
      ],
      outlined: [
        'bg-transparent',
        'border-2 border-garden-300 dark:border-garden-600',
        hover && 'hover:border-garden-400 dark:hover:border-garden-500',
        clickable && 'cursor-pointer',
      ],
      glass: [
        'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm',
        'border border-white/20 dark:border-gray-700/50',
        'shadow-lg dark:shadow-gray-900/25',
        hover && 'hover:bg-white/90 dark:hover:bg-gray-900/90',
        clickable && 'cursor-pointer',
      ],
    }

    const paddingClasses = {
      none: [],
      sm: ['p-3'],
      md: ['p-4'],
      lg: ['p-6'],
    }

    const hoverAnimation = hover
      ? {
          whileHover: { y: -2, scale: 1.02 },
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        }
      : {}

    const clickAnimation = clickable
      ? {
          whileTap: { scale: 0.98 },
          transition: { type: 'spring', stiffness: 400, damping: 17 },
        }
      : {}

    return (
      <motion.div
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...hoverAnimation}
        {...clickAnimation}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

// Card subcomponents
interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div
      className={clsx(
        'border-b border-gray-200 px-4 py-3 dark:border-gray-700',
        'font-semibold text-gray-900 dark:text-gray-100',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={clsx('p-4', className)}>{children}</div>
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={clsx(
        'border-t border-gray-200 px-4 py-3 dark:border-gray-700',
        'bg-gray-50 dark:bg-gray-800',
        className
      )}
    >
      {children}
    </div>
  )
}
