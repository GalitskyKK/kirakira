import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { clsx } from 'clsx'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-medium rounded-2xl',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'transition-all duration-200',
      'select-none cursor-pointer',
      'border border-transparent',
    ]

    const variantClasses = {
      primary: [
        'bg-kira-500 text-white',
        'hover:bg-kira-600 focus:ring-kira-500',
        'disabled:bg-neutral-300 dark:disabled:bg-neutral-600 disabled:text-neutral-500 dark:disabled:text-neutral-400',
        'shadow-lg hover:shadow-xl dark:shadow-neutral-900/25',
        'relative overflow-hidden',
      ],
      secondary: [
        'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
        'hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:ring-neutral-500',
        'disabled:bg-neutral-50 dark:disabled:bg-neutral-900 disabled:text-neutral-400',
      ],
      outline: [
        'border-kira-300 dark:border-kira-600 text-kira-700 dark:text-kira-300 bg-transparent',
        'hover:bg-kira-50 dark:hover:bg-kira-900/30 focus:ring-kira-500',
        'disabled:border-neutral-200 dark:disabled:border-neutral-700 disabled:text-neutral-400',
      ],
      ghost: [
        'text-kira-700 dark:text-kira-300 bg-transparent',
        'hover:bg-kira-50 dark:hover:bg-kira-900/30 focus:ring-kira-500',
        'disabled:text-neutral-400',
      ],
      danger: [
        'bg-red-500 text-white',
        'hover:bg-red-600 focus:ring-red-500',
        'disabled:bg-neutral-300 dark:disabled:bg-neutral-600 disabled:text-neutral-500 dark:disabled:text-neutral-400',
        'shadow-lg hover:shadow-xl dark:shadow-neutral-900/25',
      ],
    }

    const sizeClasses = {
      sm: ['text-sm px-3 py-2 min-h-[36px]'],
      md: ['text-sm px-4 py-2.5 min-h-[44px]'],
      lg: ['text-base px-6 py-3 min-h-[52px]'],
    }

    const widthClasses = fullWidth ? ['w-full'] : []

    const disabledState = disabled || isLoading

    return (
      <motion.button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          widthClasses,
          disabledState && 'cursor-not-allowed opacity-50',
          className
        )}
        disabled={disabledState}
        {...(!disabledState && { whileTap: { scale: 0.95 } })}
        {...(!disabledState && { whileHover: { scale: 1.03 } })}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
        {...props}
      >
        {isLoading && (
          <motion.div
            className="mr-2"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <svg
              className="h-4 w-4"
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
        )}

        {leftIcon && !isLoading && (
          <span className="mr-2 flex-shrink-0">{leftIcon}</span>
        )}

        <span className="truncate">{children as React.ReactNode}</span>

        {rightIcon && <span className="ml-2 flex-shrink-0">{rightIcon}</span>}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
