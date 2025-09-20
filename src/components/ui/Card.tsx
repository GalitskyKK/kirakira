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
        'bg-white',
        'border border-gray-200',
        hover && 'hover:border-garden-300',
        clickable && 'cursor-pointer',
      ],
      elevated: [
        'bg-white',
        'shadow-lg',
        hover && 'hover:shadow-xl',
        clickable && 'cursor-pointer',
      ],
      outlined: [
        'bg-transparent',
        'border-2 border-garden-300',
        hover && 'hover:border-garden-400',
        clickable && 'cursor-pointer',
      ],
      glass: [
        'bg-white/80 backdrop-blur-sm',
        'border border-white/20',
        'shadow-lg',
        hover && 'hover:bg-white/90',
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
        'px-4 py-3 border-b border-gray-200',
        'font-semibold text-gray-900',
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
        'px-4 py-3 border-t border-gray-200',
        'bg-gray-50',
        className
      )}
    >
      {children}
    </div>
  )
}
