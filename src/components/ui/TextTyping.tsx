import { useState, useEffect } from 'react'

interface TextTypingProps {
  className?: string
}

const TEXTS = ['KiraKira', 'きらきら']
const DISPLAY_DURATION = 10000 // 4 seconds per text
const TRANSITION_DURATION = 800 // 0.8 second transition

export function TextTyping({ className }: TextTypingProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const cycleInterval = setInterval(() => {
      // Fade out
      setOpacity(0)

      // When fully faded out, change text and fade in
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % TEXTS.length)
        setOpacity(1)
      }, TRANSITION_DURATION)
    }, DISPLAY_DURATION)

    return () => clearInterval(cycleInterval)
  }, [])

  return (
    <span
      className={className}
      style={{
        opacity,
        transition: `opacity ${TRANSITION_DURATION}ms ease-in-out`,
        backgroundSize: '300% auto',
        backgroundImage:
          'linear-gradient(90deg, #d946ef 0%, #a855f7 20%, #e879f9 40%, #a855f7 60%, #d946ef 80%, #a855f7 100%)',
        animation: 'shimmer-smooth 6s ease-in-out infinite',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {TEXTS[currentIndex]}
    </span>
  )
}
