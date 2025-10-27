import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface SparkleEffectProps {
  intensity?: 'low' | 'medium' | 'high'
  color?: 'kira' | 'garden' | 'rainbow'
  duration?: number
}

export function SparkleEffect({
  intensity = 'medium',
  color = 'kira',
  duration = 3000,
}: SparkleEffectProps) {
  const [sparkles, setSparkles] = useState<
    Array<{
      id: number
      x: string
      y: string
      delay: number
    }>
  >([])

  useEffect(() => {
    const count = intensity === 'low' ? 3 : intensity === 'medium' ? 6 : 10
    const newSparkles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
    }))
    setSparkles(newSparkles)

    // Regenerate sparkles periodically
    const interval = setInterval(() => {
      const updatedSparkles = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
        delay: Math.random() * 2,
      }))
      setSparkles(updatedSparkles)
    }, duration)

    return () => clearInterval(interval)
  }, [intensity, duration])

  const colorClasses = {
    kira: 'bg-kira-400',
    garden: 'bg-garden-400',
    rainbow: 'bg-gradient-to-br from-kira-400 via-garden-400 to-kira-500',
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparkles.map(sparkle => (
        <motion.div
          key={sparkle.id}
          className={`absolute h-1.5 w-1.5 rounded-full ${colorClasses[color]}`}
          style={{ left: sparkle.x, top: sparkle.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: sparkle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
