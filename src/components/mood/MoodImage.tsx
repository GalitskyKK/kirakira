import { memo } from 'react'
import { MOOD_CONFIG } from '@/types/mood'
import type { MoodType } from '@/types'

interface MoodImageProps {
  mood: MoodType
  size?: number
  className?: string
  fallbackToEmoji?: boolean
}

export const MoodImage = memo(function MoodImage({
  mood,
  size = 48,
  className = '',
  fallbackToEmoji = true,
}: MoodImageProps) {
  if (!(mood in MOOD_CONFIG)) return null

  const config = MOOD_CONFIG[mood]

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={config.imagePath}
        alt={config.label}
        width={size}
        height={size}
        className="object-contain"
        onError={e => {
          if (fallbackToEmoji) {
            // Если изображение не загрузилось, заменяем на эмоджи
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.innerHTML = `<span style="font-size: ${size * 0.6}px">${config.emoji}</span>`
            }
          }
        }}
      />
    </div>
  )
})
