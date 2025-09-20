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
        'bg-garden-500 text-white',
        'hover:bg-garden-600 focus:ring-garden-500',
        'disabled:bg-gray-300 disabled:text-gray-500',
        'shadow-sm hover:shadow-md',
      ],
      secondary: [
        'bg-gray-100 text-gray-900',
        'hover:bg-gray-200 focus:ring-gray-500',
        'disabled:bg-gray-50 disabled:text-gray-400',
      ],
      outline: [
        'border-garden-300 text-garden-700 bg-transparent',
        'hover:bg-garden-50 focus:ring-garden-500',
        'disabled:border-gray-200 disabled:text-gray-400',
      ],
      ghost: [
        'text-garden-700 bg-transparent',
        'hover:bg-garden-50 focus:ring-garden-500',
        'disabled:text-gray-400',
      ],
      danger: [
        'bg-red-500 text-white',
        'hover:bg-red-600 focus:ring-red-500',
        'disabled:bg-gray-300 disabled:text-gray-500',
        'shadow-sm hover:shadow-md',
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
        whileTap={disabledState ? undefined : { scale: 0.98 }}
        whileHover={disabledState ? undefined : { scale: 1.02 }}
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
              className="w-4 h-4"
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

        <span className="truncate">{children}</span>

        {rightIcon && (
          <span className="ml-2 flex-shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
