import { memo } from 'react'

interface TextTypingProps {
  className?: string
}

// Оптимизировано: используем только CSS анимацию без JS state
// Это снижает нагрузку на JS thread и улучшает производительность
export const TextTyping = memo(function TextTyping({ className }: TextTypingProps) {
  return (
    <span
      className={`${className} inline-block`}
      style={{
        backgroundSize: '300% auto',
        backgroundImage:
          'linear-gradient(90deg, #d946ef 0%, #a855f7 20%, #e879f9 40%, #a855f7 60%, #d946ef 80%, #a855f7 100%)',
        animation: 'shimmer-smooth 6s ease-in-out infinite',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      KiraKira
    </span>
  )
})
